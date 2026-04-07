import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import os from 'os';
import path from 'path';
import { randomBytes } from 'crypto';

import storageManager from './StorageManager';
import { LocalMediaHandler } from './protocols/LocalMediaHandler';
import { ArchiveMediaHandler } from './protocols/ArchiveMediaHandler';

export class LanServer {
  private app: Express;
  private server: http.Server | null = null;
  private token: string | null = null;
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
          res.status(response.status).send(response.statusText);
          return;
        }

        const buffer = await response.arrayBuffer();
        res.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        res.send(Buffer.from(buffer));
      } catch (error) {
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
          res.status(response.status).send(response.statusText);
          return;
        }

        const buffer = await response.arrayBuffer();
        res.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        res.send(Buffer.from(buffer));
      } catch (error) {
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

  public start(port = 3030): Promise<{ active: boolean, url: string, token: string }> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        return resolve({ 
          active: true, 
          url: `http://${this.getLocalIp()}:${port}`, 
          token: this.token! 
        });
      }

      this.token = randomBytes(4).toString('hex').toUpperCase();

      this.server = this.app.listen(port, '0.0.0.0', () => {
        resolve({
          active: true,
          url: `http://${this.getLocalIp()}:${port}`,
          token: this.token!
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          this.token = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public getStatus() {
    return {
      active: !!this.server,
      url: this.server ? `http://${this.getLocalIp()}:${(this.server.address() as import('net').AddressInfo).port}` : '',
      token: this.token || ''
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
