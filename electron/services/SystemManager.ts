import fse from 'fs-extra';
import path from 'path';

import LibrarySystem from './abstract/LibrarySystem.ts';
import storageManager from './StorageManager.ts';
import FileManager from './FileManager.ts';
import ImageManager from './ImageManager.ts';
import ConfigManager from './ConfigManager.ts';

export default class SystemManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly storageManager = storageManager;
  private readonly imageManager: ImageManager = new ImageManager();
  private readonly configManager: ConfigManager = new ConfigManager();

  constructor() {
    super();
  }

  public async createDebugBundle() {
    const outputPath = path.join(
      this.baseStorageFolder,
      `debug-bundle-${Date.now()}.json`,
    );
    const settings = await this.configManager.getSettings();
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

  public async exportLogs() {
    await fse.mkdirp(this.logsFolder);
    const outputPath = path.join(this.logsFolder, `logs-${Date.now()}.json`);
    const report = {
      generatedAt: new Date().toISOString(),
      note: 'Export de logs simplificado',
    };
    await fse.writeJson(outputPath, report, { spaces: 2 });
    return { success: true, path: outputPath };
  }

  public async clearLogs() {
    await fse.remove(this.logsFolder);
    await fse.mkdirp(this.logsFolder);
    return { success: true };
  }
}
