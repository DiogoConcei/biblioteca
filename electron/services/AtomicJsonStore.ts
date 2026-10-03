import path from 'path';
import fse from 'fs-extra';

export default class AtomicJsonStore {
  private _writeQueue: Promise<void> = Promise.resolve();

  private async enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = this._writeQueue.then(task);
    this._writeQueue = result.then(() => {}).catch(() => {});
    return result;
  }

  private async atomicWrite(filePath: string, data: unknown): Promise<void> {
    const tmpPath = `${filePath}.tmp`;
    try {
      await fse.ensureDir(path.dirname(filePath));
      await fse.writeJSON(tmpPath, data, { spaces: 2 });
      await fse.move(tmpPath, filePath, { overwrite: true });
    } catch (error) {
      if (await fse.pathExists(tmpPath)) {
        await fse.remove(tmpPath);
      }
      throw error;
    }
  }

  public async write(filePath: string, data: unknown): Promise<void> {
    return this.enqueue(() => this.atomicWrite(filePath, data));
  }
}
