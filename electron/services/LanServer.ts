import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import os from 'os';
import path from 'path';
import { randomBytes } from 'crypto';
import { Bonjour } from 'bonjour-service';
import * as QRCode from 'qrcode';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import fse from 'fs-extra';

// Configuração do worker para o ambiente Node.js do LanServer
if (typeof window === 'undefined') {
  // @ts-expect-error - Propriedade interna do pdfjs para Node
  pdfjsLib.GlobalWorkerOptions.workerSrc = ''; 
}

import storageManager from './StorageManager';
import { LocalMediaHandler } from './protocols/LocalMediaHandler';
import { ArchiveMediaHandler } from './protocols/ArchiveMediaHandler';
import MediaFactory from './MediaFactory';
import { MediaContent } from '../../electron/types/media.interfaces';
import FileManager from './FileManager';
import MangaManager from './MangaManager';
import ComicManager from './ComicManager';
import TieInManager from './TieInManager';
import BookManager from './BookManager';
import PdfAdapter from './adapters/PdfAdapter';

export class LanServer {
  private fileManager = new FileManager();
  private pdfAdapter = new PdfAdapter();
  private mangaManager = new MangaManager();
  private comicManager = new ComicManager();
  private tieManager = new TieInManager();
  private bookManager = new BookManager();
  private app: Express;
  private server: http.Server | null = null;
  private token: string | null = null;
  private qrCode: string | null = null;
  private bonjour: Bonjour | null = null;
  private localMediaHandler = new LocalMediaHandler();
  private archiveMediaHandler = new ArchiveMediaHandler();
  private activeDownloads: Set<string> = new Set(); // Rastreia "serieId-chapterId"
  
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

    this.app.get('/api/download-status', (req: Request, res: Response) => {
      res.json({ activeDownloads: Array.from(this.activeDownloads) });
    });

    // Rota para atualizar status de leitura
    this.app.post('/api/series/:id/chapters/:chapterId/read', async (req: Request, res: Response) => {
      try {
        const serieId = parseInt(req.params.id, 10);
        const chapterId = parseInt(req.params.chapterId, 10);
        const { isRead } = req.body;

        const serie = await storageManager.searchSerieById(serieId);
        if (!serie) return res.status(404).json({ error: 'Series not found' });

        const chapter = serie.chapters?.find(c => c.id === chapterId);
        if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

        chapter.isRead = !!isRead;
        await storageManager.writeData(serie);

        console.log(`[LanServer] Progresso sincronizado: ${serie.name} - ${chapter.name} (${isRead ? 'Lido' : 'Não lido'})`);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // Rota para deletar um capítulo baixado
    this.app.delete('/api/series/:id/chapters/:chapterId', async (req: Request, res: Response) => {
      try {
        const serieId = parseInt(req.params.id, 10);
        const chapterId = parseInt(req.params.chapterId, 10);

        const serie = await storageManager.searchSerieById(serieId);
        if (!serie) return res.status(404).json({ error: 'Series not found' });

        const chapter = serie.chapters?.find(c => c.id === chapterId);
        if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

        const response = await storageManager.deleteChapter(chapter);
        
        if (response) {
          await storageManager.writeData(serie);
          console.log(`[LanServer] Capítulo deletado: ${serie.name} - ${chapter.name}`);
          res.json({ success: true });
        } else {
          res.status(400).json({ error: 'O arquivo não existia no disco ou já foi deletado.' });
        }
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
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

        let chapter = serie.chapters?.find(c => c.id === chapterId);
        if (!chapter) {
          res.status(404).json({ error: 'Chapter not found' });
          return;
        }

        // Se o capítulo não estiver baixado, tentar baixar na hora (On-the-Fly)
        if (!chapter.chapterPath || chapter.isDownloaded !== 'downloaded') {
          const downloadKey = `${serieId}-${chapterId}`;
          try {
            this.activeDownloads.add(downloadKey);
            console.log(`[LanServer] Capítulo não baixado. Tentando baixar na hora: ${chapter.name}`);
            const literatureForm = this.fileManager.foundLiteratureForm(serie.dataPath);
            
            switch (literatureForm) {
              case 'Mangas':
                await this.mangaManager.createChapterById(serie.dataPath, chapter.id);
                break;
              case 'Comics':
                await this.comicManager.createChapterById(serie.dataPath, chapter.id);
                break;
              case 'childSeries':
                await this.tieManager.createChapterById(serie.dataPath, chapter.id);
                break;
              case 'books':
              case 'Books':
                await this.bookManager.createChapterById(serie.dataPath, chapter.id);
                break;
              default:
                throw new Error(`Formato de literatura desconhecido: ${literatureForm}`);
            }

            // Reler a série para pegar o chapterPath atualizado
            const updatedSerie = await storageManager.readSerieData(serie.dataPath);
            if (updatedSerie) {
               chapter = updatedSerie.chapters?.find(c => c.id === chapterId);
            }
          } catch (dlError) {
             console.error(`[LanServer] Falha ao baixar capítulo sob demanda:`, dlError);
             res.status(500).json({ error: 'Falha ao tentar baixar o capítulo do servidor remoto.' });
             return;
          } finally {
            this.activeDownloads.delete(downloadKey);
          }
        }

        if (!chapter || !chapter.chapterPath) {
          res.status(400).json({ error: 'O caminho do capítulo continua vazio após tentativa de download.' });
          return;
        }

        let content: MediaContent;
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

        // Se for PDF, transformamos em uma lista de imagens virtuais para o mobile
        if (content.type === 'pdf' && content.totalResources > 0) {
          const pdfPathEncoded = Buffer.from(chapter.chapterPath).toString('base64');
          const pdfImages = [];
          for (let i = 1; i <= content.totalResources; i++) {
            // Rota interna que renderiza a página sob demanda
            pdfImages.push(`/api/media/pdf/page?path=${pdfPathEncoded}&page=${i}&token=${this.token}`);
          }
          return res.json({
            ...content,
            type: 'comic', // Tratamos como comic no mobile para usar o visualizador de imagens
            resources: pdfImages
          });
        }

        // Transformar URLs lib-media:// para URLs HTTP do LanServer
        const transformedResources = content.resources.map((resource: Record<string, unknown> | string) => {
          if (typeof resource === 'string') {
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
          } else if (resource && resource.path && typeof resource.path === 'string') {
            let newPath = resource.path;
            if (newPath.startsWith('lib-media://local/')) {
              const encodedPath = newPath.replace('lib-media://local/', '');
              newPath = `/api/media/local?path=${encodeURIComponent(encodedPath)}&token=${this.token}`;
            } else if (newPath.startsWith('lib-media://archive/')) {
              const normalizedPath = newPath.replace('lib-media://archive/', '');
              const parts = normalizedPath.split('/').filter(Boolean);
              const encodedZip = parts[0];
              const internalPath = parts.slice(1).join('/');
              newPath = `/api/media/archive?zipPath=${encodedZip}&internalPath=${encodeURIComponent(internalPath)}&token=${this.token}`;
            }
            return { ...resource, path: newPath };
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

    this.app.get('/api/media/pdf/page', async (req: Request, res: Response) => {
      let pdf: pdfjsLib.PDFDocumentProxy | null = null;
      try {
        const encodedPath = req.query.path as string;
        const pageNum = parseInt(req.query.page as string, 10);
        
        if (!encodedPath || isNaN(pageNum)) {
          return res.status(400).send('Missing parameters');
        }

        const filePath = Buffer.from(encodedPath, 'base64').toString('utf-8');
        
        const pdfData = await fse.readFile(filePath);
        pdf = await pdfjsLib.getDocument({
          data: new Uint8Array(pdfData),
          disableWorker: true,
          verbosity: 0
        }).promise;

        const { createCanvas } = await import('@napi-rs/canvas');
        const page = await pdf.getPage(pageNum);
        // Escala 3.0 gera imagens nítidas para telas mobile de alta densidade (retina/OLED)
        const viewport = page.getViewport({ scale: 3.0 }); 

        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        // Configurações de suavização para maximizar a nitidez de textos e linhas finas
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        await page.render({
          canvas: canvas as unknown as HTMLCanvasElement,
          canvasContext: context as unknown as CanvasRenderingContext2D,
          viewport,
        }).promise;

        // O formato PNG é lossless (sem perdas), eliminando artefatos de compressão JPEG em textos.
        // Em redes locais (LAN), o aumento no tamanho do arquivo é compensado pela nitidez extrema.
        const buffer = canvas.toBuffer('image/png');
        res.set('Content-Type', 'image/png');
        // Cache imutável por 1 ano: como cada página de PDF é fixa, o mobile lê do disco/RAM instantaneamente após a primeira vez
        res.set('Cache-Control', 'public, max-age=31536000, immutable'); 
        res.send(buffer);
      } catch (error) {
        console.error('[LanServer] Erro ao renderizar página PDF:', error);
        if (!res.headersSent) {
          res.status(500).send(String(error));
        }
      } finally {
        if (pdf) {
          try {
            await pdf.destroy();
          } catch (e) {
            // Silencioso
          }
        }
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
        // Aumentar o timeout para 2 minutos para suportar downloads longos sob demanda
        if (this.server) {
          this.server.timeout = 120000; 
          this.server.keepAliveTimeout = 60000;
        }

        const localIp = this.getLocalIp();
        const url = `http://${localIp}:${port}`;

        try {
          // Gerar QR Code com URL de conexão automática
          // A URL no QR Code inclui o token e aponta para a raiz da SPA mobile
          this.qrCode = await QRCode.toDataURL(`${url}/?token=${this.token}&host=${localIp}:${port}`);
          
          // Iniciar mDNS (Bonjour)
          this.bonjour = new Bonjour();
          this.bonjour.publish({
            name: `Biblioteca - ${os.hostname()}`,
            type: 'http',
            port: port,
            txt: { token: this.token }
          });

          console.log(`[LanServer] Servidor rodando em ${url} (mDNS: ${os.hostname().toLowerCase()}.local)`);
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
      hostname: os.hostname().toLowerCase(),
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
