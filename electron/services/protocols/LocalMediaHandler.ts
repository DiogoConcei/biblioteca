import { BaseMediaHandler } from './BaseMediaHandler';

export class LocalMediaHandler extends BaseMediaHandler {
  async handle(url: URL): Promise<Response> {
    let encodedPath = url.pathname.replace(/^\//, '');
    
    // Remove extensões de compatibilidade (ex: .epub, .pdf) se presentes após a base64
    encodedPath = encodedPath.split('.')[0];
    
    const filePath = Buffer.from(encodedPath, 'base64').toString('utf-8');
    
    if (!this.isPathSafe(filePath)) {
      return new Response('Access Denied', { status: 403 });
    }
    
    return this.serveFile(filePath);
  }
}
