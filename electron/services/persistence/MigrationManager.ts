import fse from 'fs-extra';
import path from 'path';

import LibrarySystem from '../abstract/LibrarySystem.ts';
import storageManager from '../StorageManager.ts';
import FileManager from '../FileManager.ts';
import { Literatures } from '../../types/electron-auxiliar.interfaces.ts';
import { Comic } from '../../types/comic.interfaces.ts';

export default class MigrationManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly storageManager = storageManager;

  constructor() {
    super();
  }

  public async clearBookForm(): Promise<void> {
    try {
      const booksPath = this.booksData;
      if (!(await fse.pathExists(booksPath))) return;

      const files = await fse.readdir(booksPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(booksPath, file);
          const data = await fse.readJson(filePath);
          if (data.literatureForm !== 'Books') {
            data.literatureForm = 'Books';
            await fse.writeJson(filePath, data, { spaces: 2 });
            console.log(
              `[MigrationManager] Padronizado literatureForm para 'Books' em: ${file}`,
            );
          }
        }
      }
    } catch (e) {
      console.error('Erro ao limpar literatureForm dos livros:', e);
    }
  }

  public async fixId(): Promise<boolean> {
    try {
      const dataPaths = await this.fileManager.getDataPaths();

      const rawSeries = await Promise.all(
        dataPaths.map(async (rawData) => {
          const response = await this.storageManager.readSerieData(rawData);

          if (!response) return { id: -1 } as Literatures;

          return response;
        }),
      );

      rawSeries.sort((a, b) => {
        if (a.id == null) return 1;
        if (b.id == null) return -1;
        return a.id - b.id;
      });

      let lastId = -1;
      const usedIds = new Set<number>();

      for (let i = 0; i < rawSeries.length; i++) {
        const item = rawSeries[i];

        const isValidNumber =
          typeof item.id === 'number' &&
          Number.isFinite(item.id) &&
          !usedIds.has(item.id);

        if (isValidNumber) {
          usedIds.add(item.id);
          lastId = Math.max(lastId, item.id);
        } else {
          lastId += 1;
          item.id = lastId;
          usedIds.add(item.id);

          await this.storageManager.writeData(item);
        }
      }

      await this.setGlobalSerieId(lastId);
      return true;
    } catch (e) {
      console.error('Falha em organizar os identificadores');
      return false;
    }
  }

  // Fix Chapter ORDER
  public async fixChapterIds(dataPath: string): Promise<boolean> {
    const serie = await this.storageManager.readSerieData(dataPath);
    let order = 1.0;

    if (!serie?.chapters) return false;

    const chapters = await Promise.all(
      serie.chapters.map((ch) => {
        let parsed = this.fileManager.extractSerieInfo(ch.name);

        return {
          ...ch,
          order: order++,
          chapterNumber: {
            label: ch.name,
            value: parsed.chapter,
          },
        };
      }),
    );

    serie.chapters = chapters;
    await this.storageManager.writeData(serie);
    return true;
  }

  public async fixChildSeriePaths(dataPath: string): Promise<void> {
    const serieData = (await this.storageManager.readSerieData(dataPath)) as Comic;
    const childSeries = serieData.childSeries;

    if (!serieData.metadata.compiledComic || !childSeries) {
      return;
    }

    const archivesPath = serieData.archivesPath;

    for (const child of childSeries) {
      const result = await this.fileManager.findPath(archivesPath, child.serieName);

      if (result) {
        child.archivesPath = result;
      }
    }

    await this.storageManager.writeData(serieData);
  }

  public async migrateNewFields(): Promise<boolean> {
    try {
      const dataPaths = await this.fileManager.getDataPaths();
      let updatedCount = 0;

      for (const dataPath of dataPaths) {
        const serie = await this.storageManager.readSerieData(dataPath);
        if (!serie) continue;

        let needsUpdate = false;

        // 1. Garante a inicialização da descrição
        if (typeof serie.description !== 'string') {
          serie.description = '';
          needsUpdate = true;
        }

        // 2. Define os caminhos esperados para a galeria
        const expectedSerieGallery = path.join(this.gallery, serie.name);
        const expectedCoverGallery = path.join(expectedSerieGallery, 'covers');
        const expectedPagesGallery = path.join(expectedSerieGallery, 'pages');

        if (serie.serieGallery !== expectedSerieGallery) {
          serie.serieGallery = expectedSerieGallery;
          needsUpdate = true;
        }
        if (serie.coverGallery !== expectedCoverGallery) {
          serie.coverGallery = expectedCoverGallery;
          needsUpdate = true;
        }
        if (serie.pagesGallery !== expectedPagesGallery) {
          serie.pagesGallery = expectedPagesGallery;
          needsUpdate = true;
        }

        // Salva no disco apenas se a estrutura JSON sofreu alteração
        if (needsUpdate) {
          await this.storageManager.writeData(serie);
          updatedCount++;
        }
      }

      console.log(
        `[MigrationManager] Migração de estrutura concluída. ${updatedCount} séries foram atualizadas com os novos campos.`,
      );
      return true;
    } catch (e) {
      console.error('Falha ao adicionar novos campos no JSON:', e);
      return false;
    }
  }

  public async migrateCoversToGallery(): Promise<boolean> {
    try {
      const dataPaths = await this.fileManager.getDataPaths();
      let updatedCount = 0;

      for (const dataPath of dataPaths) {
        const serie = await this.storageManager.readSerieData(dataPath);
        if (!serie) continue;

        let needsUpdate = false;

        const expectedSerieGallery =
          serie.serieGallery || path.join(this.gallery, serie.name);
        const expectedCoverGallery =
          serie.coverGallery || path.join(expectedSerieGallery, 'covers');
        const expectedPagesGallery =
          serie.pagesGallery || path.join(expectedSerieGallery, 'pages');

        await fse.ensureDir(expectedCoverGallery);
        await fse.ensureDir(expectedPagesGallery);

        if (serie.coverImage && typeof serie.coverImage === 'string') {
          if (
            !serie.coverImage.startsWith('data:') &&
            !serie.coverImage.startsWith('http')
          ) {
            if (await fse.pathExists(serie.coverImage)) {
              const isAlreadyInGallery = serie.coverImage.includes(expectedCoverGallery);

              if (!isAlreadyInGallery) {
                const fileName = path.basename(serie.coverImage);
                const newCoverPath = path.join(expectedCoverGallery, fileName);

                try {
                  await fse.move(serie.coverImage, newCoverPath, { overwrite: true });

                  serie.coverImage = newCoverPath;
                  needsUpdate = true;

                  console.log(
                    `[Migration] Capa movida fisicamente para galeria: ${serie.name}`,
                  );
                } catch (moveErr) {
                  console.error(`Erro ao mover capa da série ${serie.name}:`, moveErr);
                }
              }
            }
          }
        }

        if (needsUpdate) {
          await this.storageManager.writeData(serie);
          updatedCount++;
        }
      }

      console.log(
        `[MigrationManager] Organização física concluída. ${updatedCount} capas foram movidas.`,
      );
      return true;
    } catch (e) {
      console.error('Falha ao criar pastas ou mover capas para a galeria:', e);
      return false;
    }
  }

  public async migrateCoverPathsFromSeriesSource(): Promise<boolean> {
    try {
      const dataPaths = await this.fileManager.getDataPaths();
      // Mapeia o nome da série (ou ID) para o caminho oficial da capa que está no JSON
      // Ex: "Naruto" -> "C:\...\gallery\Naruto\covers\capa.webp"
      const officialCoverMap = new Map<string, string>();
      const pathAliasMap = new Map<string, string>(); // De caminho antigo para o caminho novo oficial

      // ==========================================
      // PASSO 1: Ler a fonte de verdade (JSONs das Séries)
      // ==========================================
      for (const dataPath of dataPaths) {
        const serie = await this.storageManager.readSerieData(dataPath);
        if (!serie || !serie.name || !serie.coverImage) continue;

        // Ignora se for base64 ou URL web
        if (serie.coverImage.startsWith('data:') || serie.coverImage.startsWith('http')) {
          continue;
        }

        const officialCover = serie.coverImage;
        officialCoverMap.set(serie.name.toLowerCase(), officialCover);

        // Se você tiver uma forma de identificar caminhos antigos que ainda aparecem soltos,
        // podemos mapear aqui, mas o foco principal é garantir que os registros usem o officialCover.
      }

      console.log(
        `[MigrationSource] ${officialCoverMap.size} séries carregadas como fonte de verdade.`,
      );

      // ==========================================
      // PASSO 2: Atualizar o Histórico (history.json)
      // ==========================================
      if (await fse.pathExists(this.historyFile)) {
        try {
          const historyData = await fse.readJson(this.historyFile);
          let historyUpdated = false;

          if (historyData && Array.isArray(historyData.summaries)) {
            for (const summary of historyData.summaries) {
              // Se o histórico tem o nome da série ou algum identificador que bate com a fonte de verdade
              if (summary.name && typeof summary.name === 'string') {
                const serieNameLower = summary.name.toLowerCase();
                if (officialCoverMap.has(serieNameLower)) {
                  const correctCover = officialCoverMap.get(serieNameLower)!;
                  if (summary.coverImage !== correctCover) {
                    summary.coverImage = correctCover;
                    historyUpdated = true;
                  }
                }
              }
            }
          }

          if (historyUpdated) {
            await fse.writeJson(this.historyFile, historyData, { spaces: 2 });
            console.log(
              '[MigrationSource] history.json atualizado com as capas oficiais das séries.',
            );
          }
        } catch (histErr) {
          console.error('Erro ao atualizar o histórico:', histErr);
        }
      }

      // ==========================================
      // PASSO 3: Atualizar Coleções (appCollections.json)
      // ==========================================
      if (await fse.pathExists(this.appCollections)) {
        try {
          const collectionsData = await fse.readJson(this.appCollections);
          let collectionsUpdated = false;

          // Função recursiva para varrer o JSON de coleções e atualizar capas baseadas no nome da série ou correspondência
          const updateCollectionsRecursive = (obj: any): boolean => {
            let changed = false;
            if (!obj || typeof obj !== 'object') return false;

            for (const key of Object.keys(obj)) {
              const val = obj[key];

              // Se o objeto atual representa um item que tem 'name' e 'coverImage'
              if (
                val &&
                typeof val === 'object' &&
                'name' in val &&
                'coverImage' in val
              ) {
                const nameKey = String(val.name).toLowerCase();
                if (officialCoverMap.has(nameKey)) {
                  const correctCover = officialCoverMap.get(nameKey)!;
                  if (val.coverImage !== correctCover) {
                    val.coverImage = correctCover;
                    changed = true;
                  }
                }
              } else if (typeof val === 'object') {
                if (updateCollectionsRecursive(val)) changed = true;
              }
            }
            return changed;
          };

          if (updateCollectionsRecursive(collectionsData)) {
            await fse.writeJson(this.appCollections, collectionsData, { spaces: 2 });
            collectionsUpdated = true;
            console.log(
              '[MigrationSource] appCollections.json atualizado com as capas oficiais das séries.',
            );
          }
        } catch (colErr) {
          console.error('Erro ao atualizar as coleções:', colErr);
        }
      }

      console.log('[MigrationSource] Sincronização de capas concluída com sucesso!');
      return true;
    } catch (e) {
      console.error('Falha crítica ao sincronizar capas usando a fonte de verdade:', e);
      return false;
    }
  }
}

// (async () => {
//   console.log('Iniciando migração global de caminhos de capa...');
//   const migrationManager = new MigrationManager();
//   await migrationManager.migrateCoverPathsFromSeriesSource();
//   console.log('Migração global finalizada!');
// })();
