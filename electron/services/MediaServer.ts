import { protocol } from 'electron';
import LibrarySystem from './abstract/LibrarySystem';
import ImageManager from './ImageManager';
import { LocalMediaHandler } from './protocols/LocalMediaHandler';
import { StorageMediaHandler } from './protocols/StorageMediaHandler';
import { ArchiveMediaHandler } from './protocols/ArchiveMediaHandler';

export default class MediaServer extends LibrarySystem {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private readonly imageManager: ImageManager = new ImageManager();
  
  private localHandler = new LocalMediaHandler();
  private storageHandler = new StorageMediaHandler();
  private archiveHandler = new ArchiveMediaHandler();

  constructor() {
    super();
  }

  public register() {
    protocol.handle('lib-media', async (request) => {
      try {
        const url = new URL(request.url);
        
        if (url.host === 'local') {
          return await this.localHandler.handle(url);
        }
        
        if (url.host === 'storage') {
          return await this.storageHandler.handle(url);
        }
        
        if (url.host === 'archive') {
          return await this.archiveHandler.handle(url);
        }
        
        return new Response('Not Found', { status: 404 });
      } catch (error) {
        console.error('Erro no protocolo lib-media:', error);
        return new Response('Internal Error', { status: 500 });
      }
    });
  }

  public static getFileURL(absolutePath: string): string {
    return `lib-media://local/${Buffer.from(absolutePath).toString('base64')}`;
  }
}
