import path from 'path';

import { BaseMediaHandler } from './BaseMediaHandler';

export class StorageMediaHandler extends BaseMediaHandler {
  async handle(url: URL): Promise<Response> {
    const filePath = path.join(
      this.baseStorageFolder, 
      decodeURIComponent(url.pathname)
    );
    
    // A pasta storage é intrinsecamente segura, mas validar nunca é demais
    if (!this.isPathSafe(filePath)) {
      return new Response('Access Denied', { status: 403 });
    }

    return this.serveFile(filePath);
  }
}
