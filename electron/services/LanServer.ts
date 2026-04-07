import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import os from 'os';
import path from 'path';
import { randomBytes } from 'crypto';
import { Bonjour } from 'bonjour-service';
import * as QRCode from 'qrcode';

import storageManager from './StorageManager';
import { LocalMediaHandler } from './protocols/LocalMediaHandler';
import { ArchiveMediaHandler } from './protocols/ArchiveMediaHandler';
import MediaFactory from './MediaFactory';

export class LanServer {
  private app: Express;
  private server: http.Server | null = null;
  private token: string | null = null;
  private qrCode: string | null = null;
  private bonjour: Bonjour | null = null;
  private localMediaHandler = new LocalMediaHandler();
  private archiveMediaHandler = new ArchiveMediaHandler();
  
  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
  }

  private setupMiddlewares() {
    this.app.use(cors());
    this.app.use(express.json());

    // Middleware de Auth
    this.app.use('/api', (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      const clientToken = authHeader ? authHeader.split(' ')[1] : req.query.token;
      
      if (!this.token || clientToken !== this.token) {
        // TS precisa do retorno void para middlewares com next
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      next();
    });
  }

  private setupRoutes() {
    this.app.get('/api/verify', (req: Request, res: Response) => {
      res.json({ valid: true });
    });

    this.app.get('/api/library', async (req: Request, res: Response) => {
      try {
        const viewData = await storageManager.getViewData();
        res.json(viewData || []);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // Rota para ler os dados de uma série
    this.app.get('/api/series/:id', async (req: Request, res: Response) => {
      try {
        const serieId = parseInt(req.params.id, 10);
        if (isNaN(serieId)) {
          res.status(400).json({ error: 'Invalid ID' });
          return;
        }

        const serie = await storageManager.searchSerieById(serieId);
        if (!serie) {
          res.status(404).json({ error: 'Series not found' });
          return;
        }

        res.json(serie);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // Rota para listar capítulos de uma série
    this.app.get('/api/series/:id/chapters', async (req: Request, res: Response) => {
      try {
        const serieId = parseInt(req.params.id, 10);
        const serie = await storageManager.searchSerieById(serieId);
        if (!serie) {
          res.status(404).json({ error: 'Series not found' });
          return;
        }

        res.json(serie.chapters || []);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // Rota para obter conteúdo de um capítulo (páginas/livro)
    this.app.get('/api/series/:id/chapters/:chapterId', async (req: Request, res: Response) => {
      try {
        const serieId = parseInt(req.params.id, 10);
        const chapterId = parseInt(req.params.chapterId, 10);

        const serie = await storageManager.searchSerieById(serieId);
        if (!serie) {
          res.status(404).json({ error: 'Series not found' });
          return;
        }

        const chapter = serie.chapters?.find(c => c.id === chapterId);
        if (!chapter) {
          res.status(404).json({ error: 'Chapter not found' });
          return;
        }

        if (!chapter.chapterPath) {
          res.status(400).json({ error: 'O caminho do capítulo está vazio. Verifique se o download foi concluído no Desktop.' });
          return;
        }

        try {
          const adapter = MediaFactory.getAdapter(chapter.chapterPath);
          content = await adapter.getPages(chapter.chapterPath);
        } catch (innerError: unknown) {
          const errorAsAny = innerError as { code?: string };
          if (errorAsAny && errorAsAny.code === 'ENOENT') {
            res.status(404).json({ 
              error: 'Arquivo não encontrado',
              message: `O arquivo físico do capítulo não existe mais no disco do servidor: ${chapter.chapterPath}`
            });
            return;
          }
          throw innerError;
        }

        // Transformar URLs lib-media:// para URLs HTTP do LanServer
        const transformedResources = content.resources.map(resource => {
          if (resource.startsWith('lib-media://local/')) {
            const encodedPath = resource.replace('lib-media://local/', '');
            return `/api/media/local?path=${encodeURIComponent(encodedPath)}&token=${this.token}`;
          }
          if (resource.startsWith('lib-media://archive/')) {
            const normalizedPath = resource.replace('lib-media://archive/', '');
            const parts = normalizedPath.split('/').filter(Boolean);
            const encodedZip = parts[0];
            const internalPath = parts.slice(1).join('/');
            return `/api/media/archive?zipPath=${encodedZip}&internalPath=${encodeURIComponent(internalPath)}&token=${this.token}`;
          }
          return resource;
        });

        res.json({
          ...content,
          resources: transformedResources
        });
      } catch (error) {
        console.error(`[LanServer] Erro ao obter conteúdo do capítulo:`, error);
        res.status(500).json({ 
          error: String(error),
          message: error instanceof Error ? error.message : 'Erro interno desconhecido',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    });

    this.app.get('/api/media/local', async (req: Request, res: Response) => {
      try {
        const pathParam = req.query.path as string;
        if (!pathParam) {
          res.status(400).json({ error: 'Missing path' });
          return;
        }

        const url = new URL(`lib-media://local/${pathParam}`);
        const response = await this.localMediaHandler.handle(url);
        
        if (!response.ok) {
          console.error(`[LanServer] Erro ao servir mídia local: ${response.status} ${response.statusText} para o caminho decodificado.`);
          res.status(response.status).send(response.statusText);
          return;
        }

        const buffer = await response.arrayBuffer();
        res.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        res.send(Buffer.from(buffer));
      } catch (error) {
        console.error(`[LanServer] Exceção na rota /api/media/local: ${error}`);
        res.status(500).json({ error: String(error) });
      }
    });

    this.app.get('/api/media/archive', async (req: Request, res: Response) => {
      try {
        const zipPath = req.query.zipPath as string;
        const internalPath = req.query.internalPath as string;

        if (!zipPath || !internalPath) {
          res.status(400).json({ error: 'Missing parameters' });
          return;
        }

        const url = new URL(`lib-media://archive/${zipPath}/${internalPath}`);
        const response = await this.archiveMediaHandler.handle(url);
        
        if (!response.ok) {
          console.error(`[LanServer] Erro ao servir mídia de arquivo: ${response.status} ${response.statusText}`);
          res.status(response.status).send(response.statusText);
          return;
        }

        const buffer = await response.arrayBuffer();
        res.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        res.send(Buffer.from(buffer));
      } catch (error) {
        console.error(`[LanServer] Exceção na rota /api/media/archive: ${error}`);
        res.status(500).json({ error: String(error) });
      }
    });

    // Servir SPA estática
    const spaPath = path.join(process.env.APP_ROOT || process.cwd(), 'dist-mobile');
    this.app.use(express.static(spaPath));
    
    // Fallback para React Router
    this.app.use((req: Request, res: Response) => {
      res.sendFile(path.join(spaPath, 'index.html'));
    });
  }

  public start(port = 3030): Promise<{ active: boolean, url: string, token: string, qrCode?: string }> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        return resolve({ 
          active: true, 
          url: `http://${this.getLocalIp()}:${port}`, 
          token: this.token!,
          qrCode: this.qrCode || undefined
        });
      }

      this.token = randomBytes(4).toString('hex').toUpperCase();

      this.server = this.app.listen(port, '0.0.0.0', async () => {
        const localIp = this.getLocalIp();
        const url = `http://${localIp}:${port}`;

        try {
          // Gerar QR Code com URL de conexão automática
          // A URL no QR Code inclui o token e aponta para a raiz da SPA mobile
          this.qrCode = await QRCode.toDataURL(`${url}/?token=${this.token}&host=${localIp}:${port}`);
          
          // Iniciar mDNS (Bonjour)
          this.bonjour = new Bonjour();
          this.bonjour.publish({
            name: 'Biblioteca - LegacyReader',
            type: 'http',
            port: port,
            txt: { token: this.token }
          });

          console.log(`[LanServer] Servidor rodando em ${url} (mDNS: biblioteca.local)`);
        } catch (err) {
          console.error('[LanServer] Erro ao iniciar serviços auxiliares:', err);
        }

        resolve({
          active: true,
          url: url,
          token: this.token!,
          qrCode: this.qrCode || undefined
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.bonjour) {
        this.bonjour.destroy();
        this.bonjour = null;
      }

      if (this.server) {
        this.server.close(() => {
          this.server = null;
          this.token = null;
          this.qrCode = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public getStatus() {
    const port = this.server ? (this.server.address() as import('net').AddressInfo).port : 0;
    return {
      active: !!this.server,
      url: this.server ? `http://${this.getLocalIp()}:${port}` : '',
      token: this.token || '',
      qrCode: this.qrCode || ''
    };
  }

  private getLocalIp(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]!) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return 'localhost';
  }
}

export const lanServer = new LanServer();
