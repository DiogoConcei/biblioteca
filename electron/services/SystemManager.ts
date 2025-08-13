import FileSystem from './abstract/FileSystem.ts';
import StorageManager from './StorageManager.ts';
import FileManager from './FileManager.ts';
import fse from 'fs-extra';
import path from 'path';
import { AppConfig } from '../../src/types/auxiliar.interfaces.ts';

export default class SystemManager extends FileSystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly storageManager: StorageManager = new StorageManager();

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

  public async getMangaId(): Promise<number> {
    try {
      const data: AppConfig = JSON.parse(
        await fse.readFile(this.configFilePath, 'utf-8'),
      );

      return data.metadata.global_id;
    } catch (e) {
      console.error(`Erro ao obter o ID atual: ${e}`);
      throw e;
    }
  }

  public async setMangaId(newId: number): Promise<void> {
    try {
      let data: Partial<AppConfig>;
      try {
        const raw = await fse.readFile(this.configFilePath, 'utf-8');
        data = JSON.parse(raw);
      } catch (err) {
        throw new Error(`Erro ao ler ou interpretar o JSON: ${err}`);
      }

      if (!data.metadata || typeof data.metadata !== 'object') {
        data.metadata = { global_id: newId };
      } else {
        data.metadata.global_id = newId;
      }

      await fse.writeFile(
        this.configFilePath,
        JSON.stringify(data, null, 2),
        'utf-8',
      );

      console.log(`✅ global_id atualizado para ${newId}`);
    } catch (err) {
      console.error(`❌ Erro ao atualizar global_id:`, err);
      throw err;
    }
  }

  public async fixId(): Promise<void> {
    const dataPaths = await this.fileManager.getDataPaths();

    const rawSeries = await Promise.all(
      dataPaths.map((rawData) => this.storageManager.readSerieData(rawData)),
    );

    // Ordena para facilitar atribuição sequencial
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
        // mantém ID, mas atualiza controle
        usedIds.add(item.id);
        lastId = Math.max(lastId, item.id);
      } else {
        // atribui próximo ID sequencial
        lastId += 1;
        item.id = lastId;
        usedIds.add(item.id);

        await this.storageManager.updateSerieData(item);
      }
    }

    await this.setMangaId(lastId);
  }
}

// (async () => {
//   const systemManager = new SystemManager();
//   await systemManager.fixId();
// })();
