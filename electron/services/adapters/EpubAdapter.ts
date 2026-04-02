import path from 'path';
import {
  MediaAdapter,
  MediaContent,
  ChapterResource,
} from '../../types/media.interfaces';
import LibrarySystem from '../abstract/LibrarySystem';
import ArchiveManager from '../ArchiveManager';
import ImageManager from '../ImageManager';

export default class EpubAdapter extends LibrarySystem implements MediaAdapter {
  private readonly archiveManager = new ArchiveManager();
  private readonly imageManager = new ImageManager();

  public async getPages(chapterPath: string): Promise<MediaContent> {
    try {
      // 1. Encontrar o arquivo .opf (índice do EPUB)
      const containerXml = await this.archiveManager.readInternalFile(
        chapterPath,
        'META-INF/container.xml',
      );
      const opfPath = this.parseOpfPath(containerXml);

      if (!opfPath) {
        throw new Error('Não foi possível localizar o arquivo .opf no EPUB.');
      }

      // 2. Ler o conteúdo do .opf
      const opfContent = await this.archiveManager.readInternalFile(
        chapterPath,
        opfPath,
      );
      const opfDir = path.dirname(opfPath);

      // 3. Extrair a ordem dos capítulos (Spine) e seus arquivos (Manifest)
      const chapters = this.parseChapters(opfContent, opfDir, chapterPath);

      return {
        type: 'book',
        resources: chapters,
        totalResources: chapters.length,
        originalPath: this.imageManager.getMediaUrl(chapterPath),
      };
    } catch (error) {
      console.error('Erro ao processar capítulos do EPUB:', error);
      // Retorna fallback básico se falhar o parsing real
      return {
        type: 'book',
        resources: [],
        totalResources: 0,
        originalPath: this.imageManager.getMediaUrl(chapterPath),
      };
    }
  }

  public async getCover(seriesPath: string): Promise<string> {
    const outputDir = path.join(this.showcaseImages, 'epub_covers');
    return await this.archiveManager.extractCoverWith7zip(seriesPath, outputDir);
  }

  /**
   * Extrai o caminho do arquivo .opf do container.xml
   */
  private parseOpfPath(xml: string): string | null {
    const match = xml.match(/full-path="([^"]+)"/);
    return match ? match[1] : null;
  }

  /**
   * Mapeia a Spine e o Manifest para gerar os ChapterResources
   */
  private parseChapters(
    opfContent: string,
    opfDir: string,
    epubPath: string,
  ): ChapterResource[] {
    // Busca todos os itens do manifest
    const manifestItems: Record<string, string> = {};
    const itemRegex = /<item[^>]+id="([^"]+)"[^>]+href="([^"]+)"/g;
    let match;

    while ((match = itemRegex.exec(opfContent)) !== null) {
      manifestItems[match[1]] = match[2];
    }

    // Busca a ordem na spine
    const chapters: ChapterResource[] = [];
    const spineRegex = /<itemref[^>]+idref="([^"]+)"/g;
    let count = 1;

    while ((match = spineRegex.exec(opfContent)) !== null) {
      const idref = match[1];
      const href = manifestItems[idref];

      if (href && href.match(/\.(xhtml|html|xml)$/i)) {
        // Resolve o caminho relativo ao diretório do OPF
        const fullInternalPath = path.posix.join(opfDir, href);
        
        chapters.push({
          id: String(count++),
          label: `Capítulo ${chapters.length + 1}`, // No futuro podemos buscar o título real no TOC
          path: this.getInternalUrl(epubPath, fullInternalPath),
        });
      }
    }

    return chapters;
  }

  private getInternalUrl(epubPath: string, internalPath: string): string {
    const encodedEpub = Buffer.from(epubPath).toString('base64');
    const encodedInternal = Buffer.from(internalPath).toString('base64');
    return `lib-media://archive/${encodedEpub}/${encodedInternal}`;
  }
}
