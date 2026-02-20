import LibrarySystem from './abstract/LibrarySystem.ts';
import StorageManager from './StorageManager.ts';
import FileManager from './FileManager.ts';
import ImageManager from './ImageManager.ts';
import fse from 'fs-extra';
import path from 'path';
import {
  AppConfig,
  Literatures,
} from '../types/electron-auxiliar.interfaces.ts';
import { Comic, TieIn } from '../types/comic.interfaces.ts';

interface LocalSettings {
  backupAuto: boolean;
  backupSchedule: { frequency: 'daily' | 'weekly' | 'monthly'; time: string };
  backupRetention: number;
  uploadBackupsToDrive: boolean;
  themeMode: 'light' | 'dark' | 'system';
  accentColor: string;
  compactMode: boolean;
  sendLogsWithBugReport: boolean;
  driveConnected: boolean;
}

interface BackupMeta {
  id: string;
  path: string;
  createdAt: string;
  description?: string;
  encrypted?: boolean;
}

interface ComicCoverRegenerationProgress {
  total: number;
  processed: number;
  currentComic?: string;
  regenerated: number;
  skipped: number;
  failed: number;
}

interface ComicCoverRegenerationResult {
  total: number;
  processed: number;
  regenerated: number;
  skipped: number;
  failed: number;
  failures: Array<{ comic: string; reason: string }>;
}

export default class SystemManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly storageManager: StorageManager = new StorageManager();
  private readonly imageManager: ImageManager = new ImageManager();

  constructor() {
    super();
  }

  public async getFullScreenConfig(): Promise<boolean> {
    try {
      const data: AppConfig = JSON.parse(
        await fse.readFile(this.configFilePath, 'utf-8'),
      );
      return data.settings.full_screen;
    } catch (error) {
      console.error(`Erro em recuperar configurações: ${error}`);
      throw error;
    }
  }

  public async getThemeConfig(): Promise<boolean> {
    try {
      const data: AppConfig = JSON.parse(
        await fse.readFile(this.configFilePath, 'utf-8'),
      );
      return data.settings.ligth_mode;
    } catch (error) {
      console.error(`Erro em recuperar configurações: ${error}`);
      throw error;
    }
  }

  public async switchTheme(colorTheme: boolean): Promise<void> {
    try {
      const data: AppConfig = JSON.parse(
        await fse.readFile(this.configFilePath, 'utf-8'),
      );
      data.settings.ligth_mode = !colorTheme;
      await fse.writeFile(this.configFilePath, JSON.stringify(data), 'utf-8');
    } catch (error) {
      console.error(`Erro em atualizar modelo de tela: ${error}`);
      throw error;
    }
  }

  public async setFullScreenConfig(isFullScreen: boolean): Promise<void> {
    try {
      const data: AppConfig = JSON.parse(
        await fse.readFile(this.configFilePath, 'utf-8'),
      );
      data.settings.full_screen = isFullScreen;
      await fse.writeFile(this.configFilePath, JSON.stringify(data), 'utf-8');
    } catch (error) {
      console.error(`Erro em atualizar modelo de tela: ${error}`);
      throw error;
    }
  }

  public async fixId(): Promise<void> {
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

    await this.setSerieId(lastId);
  }

  private async resolveCoverSourceArchive(
    candidatePath: string,
  ): Promise<string> {
    if (!candidatePath) return '';

    const normalizedPath = path.resolve(candidatePath);

    if (!(await fse.pathExists(normalizedPath))) {
      return '';
    }

    const stats = await fse.stat(normalizedPath);

    if (stats.isFile()) {
      return normalizedPath;
    }

    if (!stats.isDirectory()) {
      return '';
    }

    return this.fileManager.findFirstChapter(normalizedPath);
  }

  private async regenerateSingleCover(
    input: {
      owner: string;
      label: string;
      currentCover: string;
      sourceArchive: string;
      outputDir: string;
    },
    progress: ComicCoverRegenerationProgress,
    failures: Array<{ comic: string; reason: string }>,
  ): Promise<string> {
    const isInvalid = await this.isCoverInvalid(input.currentCover);

    if (!isInvalid) {
      progress.skipped += 1;
      return input.currentCover;
    }

    if (!input.sourceArchive) {
      progress.failed += 1;
      failures.push({
        comic: input.owner,
        reason: `${input.label}: sem arquivo de origem para regenerar capa`,
      });
      return input.currentCover;
    }

    try {
      const generatedCover = await this.withRetry(
        () =>
          this.imageManager.generateCover(input.sourceArchive, input.outputDir),
        3,
        300,
      );

      if (!generatedCover || (await this.isCoverInvalid(generatedCover))) {
        throw new Error('capa gerada inválida');
      }

      progress.regenerated += 1;
      return generatedCover;
    } catch (error) {
      progress.failed += 1;
      failures.push({
        comic: input.owner,
        reason: `${input.label}: ${error instanceof Error ? error.message : String(error)}`,
      });
      return input.currentCover;
    }
  }

  private async isCoverInvalid(coverPath: string): Promise<boolean> {
    if (!coverPath || typeof coverPath !== 'string') {
      return true;
    }

    const normalizedPath = path.resolve(coverPath);

    if (!(await fse.pathExists(normalizedPath))) {
      return true;
    }

    const stats = await fse.stat(normalizedPath);
    if (!stats.isFile() || stats.size === 0) {
      return true;
    }

    return !(await this.imageManager.isImageHealthy(normalizedPath));
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    attempts = 3,
    delayMs = 250,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === attempts) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Falha desconhecida ao executar operação com retry');
  }

  public async regenerateComicCovers(
    onProgress?: (progress: ComicCoverRegenerationProgress) => void,
  ): Promise<ComicCoverRegenerationResult> {
    const jsonFiles = (await this.foundFiles(this.comicsData)).filter((file) =>
      file.toLowerCase().endsWith('.json'),
    );

    const progress: ComicCoverRegenerationProgress = {
      total: jsonFiles.length,
      processed: 0,
      regenerated: 0,
      skipped: 0,
      failed: 0,
    };

    const failures: Array<{ comic: string; reason: string }> = [];

    const emitProgress = (comicName?: string) => {
      onProgress?.({
        ...progress,
        currentComic: comicName,
      });
    };

    emitProgress();

    for (const dataPath of jsonFiles) {
      let comicName = path.basename(dataPath, path.extname(dataPath));

      try {
        const serieData = (await this.storageManager.readSerieData(
          dataPath,
        )) as Comic | null;

        if (!serieData) {
          throw new Error('JSON inválido ou inacessível');
        }

        comicName = serieData.name;

        let hasSerieChanges = false;

        const archiveFromChapters = serieData.chapters?.find(
          (chapter) => chapter.archivesPath && chapter.archivesPath.length > 0,
        )?.archivesPath;

        const mainSourceArchive = await this.resolveCoverSourceArchive(
          archiveFromChapters || serieData.archivesPath,
        );

        const updatedMainCover = await this.regenerateSingleCover(
          {
            owner: comicName,
            label: 'capa principal',
            currentCover: serieData.coverImage,
            sourceArchive: mainSourceArchive,
            outputDir: path.join(this.showcaseImages, serieData.name),
          },
          progress,
          failures,
        );

        if (updatedMainCover !== serieData.coverImage) {
          serieData.coverImage = updatedMainCover;
          hasSerieChanges = true;
        }

        if (serieData.chapters?.length) {
          for (const chapter of serieData.chapters) {
            const chapterSourceArchive = await this.resolveCoverSourceArchive(
              chapter.archivesPath,
            );

            const updatedChapterCover = await this.regenerateSingleCover(
              {
                owner: comicName,
                label: `edição ${chapter.name}`,
                currentCover: chapter.coverImage ?? '',
                sourceArchive: chapterSourceArchive,
                outputDir: path.join(
                  this.showcaseImages,
                  chapter.serieName,
                  chapter.name,
                ),
              },
              progress,
              failures,
            );

            if (updatedChapterCover !== (chapter.coverImage ?? '')) {
              chapter.coverImage = updatedChapterCover;
              hasSerieChanges = true;
            }
          }
        }

        if (serieData.childSeries?.length) {
          for (const child of serieData.childSeries) {
            const tieInSourceArchive = await this.resolveCoverSourceArchive(
              child.archivesPath,
            );

            const updatedTieInCover = await this.regenerateSingleCover(
              {
                owner: comicName,
                label: `tie-in ${child.serieName}`,
                currentCover: child.coverImage,
                sourceArchive: tieInSourceArchive,
                outputDir: path.join(this.showcaseImages, child.serieName),
              },
              progress,
              failures,
            );

            if (updatedTieInCover !== child.coverImage) {
              child.coverImage = updatedTieInCover;
              hasSerieChanges = true;
            }

            if (child.dataPath) {
              const tieInData = await this.storageManager.readTieInData(
                child.dataPath,
              );

              if (tieInData) {
                let hasTieInChanges = false;

                const tieInDataSource = await this.resolveCoverSourceArchive(
                  tieInData.archivesPath,
                );

                const updatedTieInMainCover = await this.regenerateSingleCover(
                  {
                    owner: comicName,
                    label: `tie-in ${tieInData.name} (principal)`,
                    currentCover: tieInData.coverImage,
                    sourceArchive: tieInDataSource,
                    outputDir: path.join(this.showcaseImages, tieInData.name),
                  },
                  progress,
                  failures,
                );

                if (updatedTieInMainCover !== tieInData.coverImage) {
                  tieInData.coverImage = updatedTieInMainCover;
                  hasTieInChanges = true;
                }

                if (tieInData.chapters?.length) {
                  for (const tieChapter of tieInData.chapters) {
                    const tieChapterSource =
                      await this.resolveCoverSourceArchive(
                        tieChapter.archivesPath,
                      );

                    const updatedTieChapterCover =
                      await this.regenerateSingleCover(
                        {
                          owner: comicName,
                          label: `tie-in ${tieInData.name} / edição ${tieChapter.name}`,
                          currentCover: tieChapter.coverImage ?? '',
                          sourceArchive: tieChapterSource,
                          outputDir: path.join(
                            this.showcaseImages,
                            tieChapter.serieName,
                            tieChapter.name,
                          ),
                        },
                        progress,
                        failures,
                      );

                    if (
                      updatedTieChapterCover !== (tieChapter.coverImage ?? '')
                    ) {
                      tieChapter.coverImage = updatedTieChapterCover;
                      hasTieInChanges = true;
                    }
                  }
                }

                if (hasTieInChanges) {
                  const tiePersisted =
                    await this.storageManager.writeData(tieInData);

                  if (!tiePersisted) {
                    throw new Error(
                      `Falha ao persistir alterações do tie-in ${tieInData.name}`,
                    );
                  }
                }
              }
            }
          }
        }

        if (hasSerieChanges) {
          const persisted = await this.storageManager.writeData(serieData);

          if (!persisted) {
            throw new Error('Falha ao persistir JSON atualizado da série');
          }
        }
      } catch (error) {
        failures.push({
          comic: comicName,
          reason: error instanceof Error ? error.message : String(error),
        });
      } finally {
        progress.processed += 1;
        emitProgress(comicName);
      }
    }

    return {
      total: progress.total,
      processed: progress.processed,
      regenerated: progress.regenerated,
      skipped: progress.skipped,
      failed: progress.failed,
      failures,
    };
  }

  public async fixChildSeriePaths(dataPath: string): Promise<void> {
    const serieData = (await this.storageManager.readSerieData(
      dataPath,
    )) as Comic;
    const childSeries = serieData.childSeries;

    if (!serieData.metadata.compiledComic || !childSeries) {
      console.log('Não é uma série compilada. (não possui Tie-Ins)');
      return;
    }

    const archivesPath = serieData.archivesPath;

    for (const child of childSeries) {
      const result = await this.fileManager.findPath(
        archivesPath,
        child.serieName,
      );

      if (result) {
        child.archivesPath = result;
      }
    }

    await this.storageManager.writeData(serieData);
  }

  public async fixMangaOrder(serieData: Literatures | TieIn) {
    const entries = await fse.readdir(serieData.archivesPath, {
      withFileTypes: true,
    });

    const comicFiles = entries
      .filter((e) => e.isFile() && /\.(cbz|cbr|zip|rar|pdf)$/i.test(e.name))
      .map((e) => path.join(serieData.archivesPath, e.name));

    if (!serieData.chapters) {
      throw new Error(
        'Número de arquivos de quadrinhos é menor que o número de capítulos',
      );
    }

    const orderComics = await this.fileManager.orderManga(comicFiles);

    serieData.chapters = serieData.chapters.map((chap, idx) => {
      const baseName = path.basename(
        orderComics[idx],
        path.extname(orderComics[idx]),
      );
      const archivesPath = orderComics[idx];

      return {
        ...chap,
        name: baseName,
        sanitizedName: this.fileManager.sanitizeFilename(baseName),
        archivesPath,
        chapterPath: path.join(
          this.comicsImages,
          serieData.name,
          this.fileManager.sanitizeFilename(baseName),
        ),
        isDownloaded: 'not_downloaded',
      };
    });

    await this.storageManager.writeData(serieData);
  }

  public async fixComicOrder(serieData: Literatures | TieIn) {
    const entries = await fse.readdir(serieData.archivesPath, {
      withFileTypes: true,
    });

    const comicFiles = entries
      .filter((e) => e.isFile() && /\.(cbz|cbr|zip|rar|pdf)$/i.test(e.name))
      .map((e) => path.join(serieData.archivesPath, e.name));

    if (!serieData.chapters) {
      throw new Error(
        'Número de arquivos de quadrinhos é menor que o número de capítulos',
      );
    }

    const orderComics = await this.fileManager.orderComic(comicFiles);

    serieData.chapters = serieData.chapters.map((chap, idx) => {
      const baseName = path.basename(
        orderComics[idx],
        path.extname(orderComics[idx]),
      );
      const archivesPath = orderComics[idx];

      return {
        ...chap,
        name: baseName,
        sanitizedName: this.fileManager.sanitizeFilename(baseName),
        archivesPath,
        chapterPath: path.join(
          this.comicsImages,
          serieData.name,
          this.fileManager.sanitizeFilename(baseName),
        ),
        isDownloaded: 'not_downloaded',
      };
    });

    await this.storageManager.writeData(serieData);
  }

  private get backupRoot(): string {
    return path.join(this.baseStorageFolder, 'backups');
  }

  private get logsRoot(): string {
    return path.join(this.baseStorageFolder, 'logs');
  }

  private getSettingsDefaults(): LocalSettings {
    return {
      backupAuto: false,
      backupSchedule: { frequency: 'weekly', time: '03:00' },
      backupRetention: 10,
      uploadBackupsToDrive: false,
      themeMode: 'system',
      accentColor: '#8963ba',
      compactMode: false,
      sendLogsWithBugReport: false,
      driveConnected: false,
    };
  }

  public async getSettings(): Promise<LocalSettings> {
    const config = await fse.readJson(this.configFilePath);
    return { ...this.getSettingsDefaults(), ...(config.settings ?? {}) };
  }

  public async setSettings(settings: Partial<LocalSettings>): Promise<void> {
    const config = await fse.readJson(this.configFilePath);
    const merged = {
      ...this.getSettingsDefaults(),
      ...(config.settings ?? {}),
      ...settings,
    };
    config.settings = merged;
    await fse.writeJson(this.configFilePath, config, { spaces: 2 });
  }

  public async createBackup(options?: {
    encrypt?: boolean;
    description?: string;
  }): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      await fse.mkdirp(this.backupRoot);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFolder = path.join(this.backupRoot, `backup-${timestamp}`);
      await fse.mkdirp(backupFolder);

      const targetStorage = path.join(backupFolder, 'storage');
      await fse.copy(this.baseStorageFolder, targetStorage, {
        filter: (src) =>
          !src.includes(path.join(this.baseStorageFolder, 'backups')),
      });

      const metadata: BackupMeta = {
        id: `backup-${timestamp}`,
        path: backupFolder,
        createdAt: new Date().toISOString(),
        description: options?.description,
        encrypted: Boolean(options?.encrypt),
      };

      await fse.writeJson(path.join(backupFolder, 'meta.json'), metadata, {
        spaces: 2,
      });
      await this.applyRetentionPolicy();

      return { success: true, path: backupFolder };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private async applyRetentionPolicy(): Promise<void> {
    const settings = await this.getSettings();
    const backups = await this.getBackupList();
    if (backups.length <= settings.backupRetention) return;

    const removeCount = backups.length - settings.backupRetention;
    const sorted = backups.sort(
      (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
    );

    await Promise.all(
      sorted.slice(0, removeCount).map((item) => fse.remove(item.path)),
    );
  }

  public async getBackupList(): Promise<BackupMeta[]> {
    if (!(await fse.pathExists(this.backupRoot))) return [];

    const entries = await fse.readdir(this.backupRoot);
    const backups = await Promise.all(
      entries.map(async (entry) => {
        const backupPath = path.join(this.backupRoot, entry);
        const metaPath = path.join(backupPath, 'meta.json');
        if (!(await fse.pathExists(metaPath))) return null;
        return (await fse.readJson(metaPath)) as BackupMeta;
      }),
    );

    return backups.filter((item): item is BackupMeta => Boolean(item));
  }

  public async restoreBackup(backupPath: string): Promise<void> {
    const sourcePath = path.join(backupPath, 'storage');
    if (!(await fse.pathExists(sourcePath))) {
      throw new Error('Backup inválido ou sem pasta de storage');
    }

    await fse.copy(sourcePath, this.baseStorageFolder, { overwrite: true });
  }

  public async removeBackup(backupPath: string): Promise<void> {
    await fse.remove(backupPath);
  }

  public async resetApplication(options: {
    level: 'soft' | 'full';
    preserve?: string[];
  }): Promise<void> {
    const preserve = options.preserve ?? [];

    if (options.level === 'soft') {
      await fse.remove(this.logsRoot);
      await fse.mkdirp(this.logsRoot);
      return;
    }

    const collectionsBackup =
      preserve.includes('collections') &&
      (await fse.pathExists(this.appCollections))
        ? await fse.readJson(this.appCollections)
        : null;

    await Promise.all([
      fse.remove(this.dataStorage),
      fse.remove(this.userLibrary),
    ]);
    await fse.mkdirp(this.dataStorage);
    await fse.mkdirp(this.userLibrary);

    if (collectionsBackup) {
      await fse.writeJson(this.appCollections, collectionsBackup, {
        spaces: 2,
      });
    }
  }

  public async setDriveConnection(isConnected: boolean) {
    await this.setSettings({ driveConnected: isConnected });
    return { success: true };
  }

  public async exportLogs() {
    await fse.mkdirp(this.logsRoot);
    const outputPath = path.join(this.logsRoot, `logs-${Date.now()}.json`);
    const report = {
      generatedAt: new Date().toISOString(),
      note: 'Export de logs simplificado',
    };
    await fse.writeJson(outputPath, report, { spaces: 2 });
    return { success: true, path: outputPath };
  }

  public async clearLogs() {
    await fse.remove(this.logsRoot);
    await fse.mkdirp(this.logsRoot);
    return { success: true };
  }

  public async createDebugBundle() {
    const outputPath = path.join(
      this.baseStorageFolder,
      `debug-bundle-${Date.now()}.json`,
    );
    const settings = await this.getSettings();
    await fse.writeJson(
      outputPath,
      {
        generatedAt: new Date().toISOString(),
        settings,
      },
      { spaces: 2 },
    );

    return { success: true, path: outputPath };
  }
}
