import fse from 'fs-extra';
import path from 'path';

import LibrarySystem from './abstract/LibrarySystem.ts';
import ConfigManager from './ConfigManager.ts';
import { BackupMeta } from '../types/electron-auxiliar.interfaces.ts';

export default class BackupManager extends LibrarySystem {
  private readonly configManager: ConfigManager;

  constructor() {
    super();
    this.configManager = new ConfigManager();
  }

  public async createBackup(options?: {
    encrypt?: boolean;
    description?: string;
  }): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      await fse.mkdirp(this.backupFolder);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFolder = path.join(this.backupFolder, `backup-${timestamp}`);
      await fse.mkdirp(backupFolder);

      const targetStorage = path.join(backupFolder, 'storage');

      await fse.copy(this.dataStorage, path.join(targetStorage, 'data store'));
      await fse.copy(this.configFolder, path.join(targetStorage, 'config'));
      await fse.copy(
        this.userLibrary,
        path.join(targetStorage, 'user library'),
      );

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

  public async removeBackup(backupPath: string): Promise<void> {
    await fse.remove(backupPath);
  }

  public async restoreBackup(backupPath: string): Promise<void> {
    const sourcePath = path.join(backupPath, 'storage');
    if (!(await fse.pathExists(sourcePath))) {
      throw new Error('Backup inválido ou sem pasta de storage');
    }

    await fse.copy(sourcePath, this.baseStorageFolder, { overwrite: true });
  }

  public async getBackupList(): Promise<BackupMeta[]> {
    if (!(await fse.pathExists(this.backupFolder))) return [];

    const entries = await fse.readdir(this.backupFolder);
    const backups = await Promise.all(
      entries.map(async (entry) => {
        const backupPath = path.join(this.backupFolder, entry);
        const metaPath = path.join(backupPath, 'meta.json');
        if (!(await fse.pathExists(metaPath))) return null;
        return (await fse.readJson(metaPath)) as BackupMeta;
      }),
    );

    return backups.filter((item): item is BackupMeta => Boolean(item));
  }

  private async applyRetentionPolicy(): Promise<void> {
    const settings = await this.configManager.getSettings();
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
}
