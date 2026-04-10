import path from 'path';
import fse from 'fs-extra';

import FileManager from './FileManager';
import StorageManagerInstance from './StorageManager';
import CollectionManager from './CollectionManager';
import { Book, BookChapter } from '../types/book.interfaces';
import { LiteratureForm, SerieForm } from '../../src/types/series.interfaces';
import GraphSerie from './abstract/GraphSerie';
import ImageManager from './ImageManager';
import PdfManager from './PdfManager';
import ArchiveManager from './ArchiveManager';

/**
 * BookManager - Gerencia literaturas (Livros) de forma desacoplada.
 */
export default class BookManager extends GraphSerie<Book, BookChapter> {
  protected readonly fileManager: FileManager = new FileManager();
  protected readonly storageManager = StorageManagerInstance;
  protected readonly collectionManager: CollectionManager =
    new CollectionManager();
  protected readonly imageManager: ImageManager = new ImageManager();
  protected readonly pdfManager: PdfManager = new PdfManager();
  protected readonly archiveManager: ArchiveManager = new ArchiveManager();

  constructor() {
    super();
  }

  /**
   * Implementação dos métodos abstratos de GraphSerie
   */

  async orderChapters(filesPath: string[]): Promise<string[]> {
    // Ordena os arquivos alfabeticamente/numéricamente
    return filesPath.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  }

  mountEmptyChapter(serieName: string, fileName: string): BookChapter {
    const nameWithoutExt = path.basename(fileName, path.extname(fileName));
    const createdAt = new Date().toISOString();

    return {
      id: 0,
      serieName: serieName,
      name: nameWithoutExt,
      sanitizedName: this.fileManager.sanitizeFilename(nameWithoutExt),
      archivesPath: fileName,
      chapterPath: fileName,
      createdAt,
      isRead: false,
      isDownloaded: 'downloaded',
      page: {
        lastPageRead: 0,
        favoritePage: 0,
      },
    };
  }

  async postProcessChapters(chapter: BookChapter): Promise<BookChapter> {
    return chapter;
  }

  /**
   * Processa os dados da série para livros.
   * Diferente de mangás, livros podem ser um arquivo único ou uma pasta de arquivos (PDF/EPUB).
   */
  async processSerieData(serie: SerieForm): Promise<Book> {
    const nextId = await this.consumeNextSerieId();

    let bookFiles: string[] = [];
    const stats = await fse.stat(serie.oldPath);

    if (stats.isFile()) {
      // Se for um arquivo direto, verifica a extensão
      if (/\.(pdf|epub)$/i.test(serie.oldPath)) {
        bookFiles = [serie.oldPath];
      }
    } else {
      // Se for um diretório, busca arquivos PDF/EPUB dentro
      const files = await this.fileManager.foundFiles(serie.oldPath);
      bookFiles = files.filter((f) => /\.(pdf|epub)$/i.test(f));
    }

    if (bookFiles.length === 0) {
      throw new Error(
        'Nenhum arquivo PDF ou EPUB encontrado no caminho selecionado.',
      );
    }

    const orderedFiles = await this.orderChapters(bookFiles);

    // Monta os capítulos (cada arquivo é um capítulo)
    const chapters: BookChapter[] = orderedFiles.map((filePath, idx) => {
      const ch = this.mountEmptyChapter(serie.name, filePath);
      ch.id = idx + 1;
      return ch;
    });

    // Monta o objeto final da série utilizando a interface Book
    const bookData: Book = {
      id: nextId,
      name: serie.name,
      sanitizedName: serie.sanitizedName,
      archivesPath: path.join(this.userLibrary, serie.name),
      chaptersPath: serie.oldPath,
      dataPath: path.join(this.booksData, `${serie.name}.json`),
      coverImage: serie.cover_path,
      totalChapters: chapters.length,
      genre: serie.genre,
      author: serie.author,
      language: serie.language,
      literatureForm: LiteratureForm.BOOK,
      chaptersRead: 0,
      readingData: {
        lastChapterId: 1,
        lastReadAt: new Date().toISOString(),
      },
      chapters,
      metadata: {
        status: serie.readingStatus,
        collections: serie.collections,
        recommendedBy: '',
        originalOwner: '',
        lastDownload: Date.now(),
        rating: 0,
        isFavorite: serie.collections.includes('Favoritos'),
        privacy: serie.privacy,
        autoBackup: serie.autoBackup,
      },
      createdAt: new Date().toISOString(),
      deletedAt: '',
      tags: serie.tags,
      comments: [],
    };

    return bookData;
  }

  /**
   * Sobrescrevemos generateChapter para evitar a extração de imagens em livros.
   * Livros literários (PDF/EPUB) são lidos diretamente pelos visualizadores específicos.
   */
  protected async generateChapter(chapter: BookChapter) {
    // Para livros, o capítulo É o arquivo original (PDF/EPUB).
    // Garantimos que o chapterPath aponte para o arquivo físico.
    chapter.chapterPath = chapter.archivesPath;
    chapter.isDownloaded = 'downloaded';
  }
}
