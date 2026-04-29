import fse from 'fs-extra';
import LibrarySystem from './abstract/LibrarySystem.ts';
import {
  LocalSettings,
  AppConfig,
} from '../types/electron-auxiliar.interfaces.ts';

export default class ConfigManager extends LibrarySystem {
  constructor() {
    super();
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

  public async setDriveConnection(isConnected: boolean) {
    await this.setSettings({ driveConnected: isConnected });
    return { success: true };
  }

  public async getFullScreenConfig(): Promise<boolean> {
    try {
      const data: AppConfig = await fse.readJson(this.configFilePath);
      return data.settings.full_screen;
    } catch (error) {
      console.error(`Erro em recuperar configurações: ${error}`);
      throw error;
    }
  }

  public async getThemeConfig(): Promise<boolean> {
    try {
      const data: AppConfig = await fse.readJson(this.configFilePath);
      return data.settings.ligth_mode;
    } catch (error) {
      console.error(`Erro em recuperar configurações: ${error}`);
      throw error;
    }
  }

  public async switchTheme(colorTheme: boolean): Promise<void> {
    try {
      const data: AppConfig = await fse.readJson(this.configFilePath);
      data.settings.ligth_mode = !colorTheme;
      await fse.writeJson(this.configFilePath, data, { spaces: 2 });
    } catch (error) {
      console.error(`Erro em atualizar modelo de tela: ${error}`);
      throw error;
    }
  }

  public async setFullScreenConfig(isFullScreen: boolean): Promise<void> {
    try {
      const data: AppConfig = await fse.readJson(this.configFilePath);
      data.settings.full_screen = isFullScreen;
      await fse.writeJson(this.configFilePath, data, { spaces: 2 });
    } catch (error) {
      console.error(`Erro em atualizar modelo de tela: ${error}`);
      throw error;
    }
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
}
