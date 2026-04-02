import path from 'path';
import { MediaAdapter } from '../types/media.interfaces';
import PdfAdapter from './adapters/PdfAdapter';
import ArchiveAdapter from './adapters/ArchiveAdapter';
import EpubAdapter from './adapters/EpubAdapter';

export default class MediaFactory {
  /**
   * Retorna o adapter correto para a extensão do arquivo.
   */
  public static getAdapter(filePath: string): MediaAdapter {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.pdf':
        return new PdfAdapter();
      case '.epub':
        return new EpubAdapter();
      case '.cbz':
      case '.cbr':
      case '.zip':
      case '.rar':
        return new ArchiveAdapter();
      default:
        // Se for uma pasta, assume que é um conjunto de imagens (comum em mangás)
        return new ArchiveAdapter(); 
    }
  }
}
