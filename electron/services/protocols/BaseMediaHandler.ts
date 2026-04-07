import { net } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';

import LibrarySystem from '../abstract/LibrarySystem';

export abstract class BaseMediaHandler extends LibrarySystem {
  protected isPathSafe(filePath: string): boolean {
    if (!filePath) return false;
    const normalizedPath = path.normalize(path.resolve(filePath)).toLowerCase();
    
    const allowedRoots = [
      path.normalize(path.resolve(this.baseStorageFolder)).toLowerCase(),
      path.normalize(path.resolve(this.userLibrary)).toLowerCase()
    ];

    const isInsideAllowed = allowedRoots.some((root) => normalizedPath.startsWith(root));
    
    const safeExtensions = [
      '.jpg', '.jpeg', '.png', '.webp', '.pdf', '.epub', '.cbz', '.cbr',
      '.html', '.xhtml', '.css', '.js', '.xml', '.opf', '.ncx', '.txt',
      '.otf', '.ttf', '.woff', '.woff2'
    ];
    
    const hasSafeExtension = safeExtensions.includes(path.extname(normalizedPath).toLowerCase());

    return isInsideAllowed || hasSafeExtension;
  }

  protected async serveFile(filePath: string): Promise<Response> {
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'application/octet-stream';
    
    if (ext === '.html' || ext === '.xhtml') mimeType = 'text/html';
    else if (ext === '.css') mimeType = 'text/css';
    else if (ext === '.js') mimeType = 'application/javascript';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.svg') mimeType = 'image/svg+xml';
    else if (ext === '.pdf') mimeType = 'application/pdf';

    const response = await net.fetch(pathToFileURL(filePath).toString());
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    if (mimeType !== 'application/octet-stream') {
      headers.set('Content-Type', mimeType);
    }

    return new Response(response.body, { 
      status: response.status, 
      statusText: response.statusText, 
      headers 
    });
  }

  abstract handle(url: URL): Promise<Response>;
}
