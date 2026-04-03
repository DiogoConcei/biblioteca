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
      console.log(`📖 EpubAdapter: Processando ${chapterPath}`);

      // 1. Encontrar o arquivo .opf (índice do EPUB)
      const containerXml = await this.archiveManager.readInternalFile(
        chapterPath,
        'META-INF/container.xml',
      );
      const opfPath = this.parseOpfPath(containerXml);

      if (!opfPath) {
        console.error('❌ EpubAdapter: container.xml não contém full-path para OPF');
        throw new Error('Não foi possível localizar o arquivo .opf no EPUB.');
      }

      console.log(`📖 EpubAdapter: OPF localizado em ${opfPath}`);

      // 2. Ler o conteúdo do .opf
      const opfContent = await this.archiveManager.readInternalFile(
        chapterPath,
        opfPath,
      );
      
      // O diretório do OPF é a base para os caminhos relativos internos
      const opfDir = path.dirname(opfPath);

      // 3. Extrair a ordem dos capítulos (Spine) e seus arquivos (Manifest)
      const chapters = this.parseChapters(opfContent, opfDir, chapterPath);

      console.log(`✅ EpubAdapter: ${chapters.length} capítulos mapeados.`);

      return {
        type: 'book',
        resources: chapters,
        totalResources: chapters.length,
        originalPath: this.imageManager.getMediaUrl(chapterPath),
      };
    } catch (error) {
      console.error('❌ EpubAdapter Error:', error);
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

  private parseOpfPath(xml: string): string | null {
    // Regex mais flexível para capturar o full-path
    const match = xml.match(/full-path\s*=\s*["']([^"']+)["']/i);
    return match ? match[1] : null;
  }

  private parseChapters(
    opfContent: string,
    opfDir: string,
    epubPath: string,
  ): ChapterResource[] {
    const manifestItems: Record<string, string> = {};
    
    // 1. Mapear Manifest (id -> href)
    // Buscamos <item ... id="ID" ... href="HREF" ... />
    // Usamos uma abordagem linha a linha ou um regex global que ignore a ordem dos atributos
    const itemMatches = opfContent.matchAll(/<item\s+([^>]+)>/gi);
    for (const match of itemMatches) {
      const attrs = match[1];
      const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/i);
      const hrefMatch = attrs.match(/href\s*=\s*["']([^"']+)["']/i);
      
      if (idMatch && hrefMatch) {
        manifestItems[idMatch[1]] = hrefMatch[1];
      }
    }

    // 2. Mapear Spine (ordem de leitura)
    const chapters: ChapterResource[] = [];
    const itemrefMatches = opfContent.matchAll(/<itemref\s+([^>]+)>/gi);
    let count = 1;

    for (const match of itemrefMatches) {
      const attrs = match[1];
      const idrefMatch = attrs.match(/idref\s*=\s*["']([^"']+)["']/i);
      
      if (idrefMatch) {
        const idref = idrefMatch[1];
        let href = manifestItems[idref];

        if (href) {
          // Remove âncoras (ex: ch1.html#section1) para o path do arquivo
          href = href.split('#')[0];

          if (href.match(/\.(xhtml|html|xml)$/i)) {
            // Resolve o caminho interno usando separadores normais de ZIP (/)
            // Se o opfDir for '.', evitamos colocar './' no início
            let fullInternalPath = opfDir === '.' ? href : `${opfDir}/${href}`;
            fullInternalPath = path.normalize(fullInternalPath).replace(/\\/g, '/');
            
            // Evita duplicatas (alguns EPUBs repetem itemrefs)
            if (!chapters.find(c => c.path.includes(Buffer.from(fullInternalPath).toString('base64')))) {
              chapters.push({
                id: String(count++),
                label: `Página ${chapters.length + 1}`,
                path: this.getInternalUrl(epubPath, fullInternalPath),
              });
            }
          }
        }
      }
    }

    return chapters;
  }

  private getInternalUrl(epubPath: string, internalPath: string): string {
    const encodedEpub = Buffer.from(epubPath).toString('base64');
    // Não codificamos o internalPath em base64 para permitir que links relativos no HTML funcionem
    return `lib-media://archive/${encodedEpub}/${internalPath}`;
  }
}
