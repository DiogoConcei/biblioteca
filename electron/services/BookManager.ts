import path from 'path';
import fse from 'fs-extra';

import LibrarySystem from './abstract/LibrarySystem';
import FileManager from './FileManager';
import storageManager from './StorageManager';
import CollectionManager from './CollectionManager';
import { Manga, MangaChapter } from '../types/manga.interfaces';
import { SerieForm } from '../../src/types/series.interfaces';

/**
 * BookManager - Gerencia literaturas (Livros) de forma desacoplada.
 * Utiliza composição em vez de herança para manter a lógica de livros isolada de quadrinhos.
 */
export default class BookManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly storageManager = storageManager;
  private readonly collectionManager: CollectionManager = new CollectionManager();

  constructor() {
    super();
  }

  /**
   * Cria uma nova série de livro a partir do formulário de upload.
   */
  public async createSerie(serie: SerieForm): Promise<void> {
    try {
      const nextId = await this.consumeNextSerieId();
      
      let bookFiles: string[] = [];
      const stats = await fse.stat(serie.oldPath);

      if (stats.isFile()) {
        // Se for um arquivo direto, verifica a extensão
        if (/\.(pdf|epub)$/i.test(serie.oldPath)) {
          bookFiles = [serie.oldPath];
        }
      } else {
        // Se for um diretório, busca arquivos dentro
        const files = await this.fileManager.foundFiles(serie.oldPath);
        bookFiles = files.filter(f => /\.(pdf|epub)$/i.test(f));
      }

      if (bookFiles.length === 0) {
        throw new Error('Nenhum arquivo PDF ou EPUB encontrado no caminho selecionado.');
      }

      // Ordena os arquivos alfabeticamente/numéricamente
      bookFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      // Monta os capítulos (cada arquivo é um capítulo)
      const chapters: MangaChapter[] = bookFiles.map((filePath, idx) => {
        const fileName = path.basename(filePath);
        const nameWithoutExt = path.basename(filePath, path.extname(filePath));
        
        return {
          id: idx + 1,
          serieName: serie.name,
          name: nameWithoutExt,
          sanitizedName: this.fileManager.sanitizeFilename(nameWithoutExt),
          archivesPath: filePath, // No caso de livros, o "archive" é o próprio arquivo
          chapterPath: filePath,  // Caminho direto para o arquivo original
          createdAt: new Date().toISOString(),
          isRead: false,
          isDownloaded: 'downloaded', // Arquivos locais são considerados "baixados"
          page: {
            lastPageRead: 0,
            favoritePage: 0,
          }
        };
      });

      // Monta o objeto final da série (usamos a interface Manga por compatibilidade com a UI atual)
      const bookData: Manga = {
        id: nextId,
        name: serie.name,
        sanitizedName: serie.sanitizedName,
        archivesPath: path.join(this.userLibrary, serie.name),
        chaptersPath: serie.oldPath, // Livros usam o caminho original
        dataPath: path.join(this.booksData, `${serie.name}.json`),
        coverImage: serie.cover_path,
        totalChapters: chapters.length,
        genre: serie.genre,
        author: serie.author,
        language: serie.language,
        literatureForm: serie.literatureForm,
        chaptersRead: 0,
        readingData: { 
          lastChapterId: 1, 
          lastReadAt: new Date().toISOString() 
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

      // Persiste os dados via StorageManager (Singleton)
      await this.storageManager.writeData(bookData);
      this.storageManager.invalidateCache();

      // Adiciona às coleções selecionadas
      if (serie.collections && serie.collections.length > 0) {
        for (const collectionName of serie.collections) {
          await this.collectionManager.addInCollection(bookData.dataPath, collectionName);
        }
      }

      console.log(`📚 Livro criado com sucesso: ${serie.name} (ID: ${nextId})`);
    } catch (error) {
      console.error('Erro ao criar série de livro:', error);
      throw error;
    }
  }
}
