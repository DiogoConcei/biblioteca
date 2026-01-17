import path from 'path';

import LibrarySystem from './abstract/LibrarySystem';
import FileManager from './FileManager';
import ImageManager from './ImageManager';

export default class TieInManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly imageManager: ImageManager = new ImageManager();

  public async crateChildCover(
    serieName: string,
    basePath: string,
  ): Promise<string> {
    try {
      const firstChapter = await this.fileManager.findFirstChapter(basePath);
      const outputPath = path.join(this.dinamicImages, serieName);
      return await this.imageManager.generateCover(firstChapter, outputPath);
    } catch (e) {
      throw new Error('Falha em gerar capa da TieIn');
    }
  }
}
