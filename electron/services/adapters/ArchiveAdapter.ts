import path from 'path';
import fse from 'fs-extra';

import { MediaAdapter, MediaContent } from '../../types/media.interfaces';
import LibrarySystem from '../abstract/LibrarySystem';
import ArchiveManager from '../ArchiveManager';
import ImageManager from '../ImageManager';

export default class ArchiveAdapter extends LibrarySystem implements MediaAdapter {
  private readonly archiveManager = new ArchiveManager();
  private readonly imageManager = new ImageManager();

  public async getPages(chapterPath: string): Promise<MediaContent> {
    const isDirectory = (await fse.stat(chapterPath)).isDirectory();

    if (isDirectory) {
      const files = await fse.readdir(chapterPath);
      const images = files
        .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map(f => this.imageManager.getMediaUrl(path.join(chapterPath, f)));

      return {
        type: 'comic',
        resources: images,
        totalResources: images.length
      };
    }

    // Para CBZ/CBR (Simulação de extração para o disco por enquanto, mantendo o padrão do ArchiveManager)
    const outputDir = path.join(this.baseStorageFolder, 'temp_extracted', path.basename(chapterPath));
    if (!(await fse.pathExists(outputDir))) {
      await this.archiveManager.extractWith7zip(chapterPath, outputDir);
    }

    const files = await fse.readdir(outputDir);
    const images = files
      .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map(f => this.imageManager.getMediaUrl(path.join(outputDir, f)));

    return {
      type: 'comic',
      resources: images,
      totalResources: images.length
    };
  }

  public async getCover(seriesPath: string): Promise<string> {
    const outputDir = path.join(this.showcaseImages, 'archive_covers');
    return await this.archiveManager.extractCoverWith7zip(seriesPath, outputDir);
  }
}
