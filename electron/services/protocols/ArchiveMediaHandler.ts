import path from 'path';
import fse from 'fs-extra';
import { BaseMediaHandler } from './BaseMediaHandler';

export class ArchiveMediaHandler extends BaseMediaHandler {
  async handle(url: URL): Promise<Response> {
    const normalizedPath = url.pathname.replace(/^\//, '');
    const pathParts = normalizedPath.split('/').filter(Boolean);
    
    if (pathParts.length < 1) {
      return new Response('Invalid Archive URL', { status: 400 });
    }

    const encodedZip = pathParts[0];
    const internalPath = pathParts.slice(1).join('/') || 'index.html';
    let zipPath = Buffer.from(encodedZip, 'base64').toString('utf-8');

    // Desempacota links aninhados de lib-media://local/
    if (zipPath.startsWith('lib-media://local/')) {
      const innerEncoded = zipPath.replace('lib-media://local/', '');
      zipPath = Buffer.from(innerEncoded, 'base64').toString('utf-8');
    }

    if (!this.isPathSafe(zipPath)) {
      return new Response('Access Denied', { status: 403 });
    }

    if (!(await fse.pathExists(zipPath))) {
      return new Response('Archive Not Found', { status: 404 });
    }

    const zipHash = Buffer.from(zipPath).toString('hex').substring(0, 12);
    const tempDest = path.join(this.baseStorageFolder, 'archive_cache', zipHash);
    const filePath = path.join(tempDest, internalPath);

    if (!(await fse.pathExists(filePath))) {
      try {
        const ArchiveManager = (await import('../ArchiveManager')).default;
        const archiveManager = new ArchiveManager();
        await archiveManager.extractWith7zip(zipPath, tempDest);
      } catch (extractErr) {
        console.error(`❌ MediaServer: Falha na extração de "${zipPath}":`, extractErr);
        throw extractErr;
      }
    }

    if (!(await fse.pathExists(filePath))) {
      return new Response('Not Found in Archive', { status: 404 });
    }

    return this.serveFile(filePath);
  }
}
