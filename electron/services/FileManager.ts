import FileSystem from './abstract/FileSystem.ts';
import path from 'path';
import fse from 'fs-extra';
import { LiteratureChapter } from '../../src/types/series.interfaces.ts';

export default class FileManager extends FileSystem {
  constructor() {
    super();
  }

  public sanitizeFilename(fileName: string): string {
    return fileName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^-+|-+$/g, '')
      .replace(/\.{2,}/g, '.');
  }

  public async sanitizeDirFiles(
    dirPath: string,
    chapters: LiteratureChapter[],
  ): Promise<void> {
    try {
      const files = await fse.readdir(dirPath);

      if (files.length !== chapters.length) {
        console.warn(
          'Número de arquivos não corresponde ao número de capítulos!',
        );
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const chap = chapters[i];
        const oldFilePath = path.join(dirPath, file);
        const sanitized = this.sanitizeFilename(chap.name).slice(0, 32);
        const extension = path.extname(file);
        const newFilename = `${sanitized}_${extension}`;
        const newFilePath = path.join(dirPath, newFilename);
        await fse.rename(oldFilePath, newFilePath);
      }
    } catch (err) {
      console.error('Erro ao renomear arquivos:', err);
    }
  }

  public async orderByChapters(filesPath: string[]): Promise<string[]> {
    const fileDetails = await Promise.all(
      filesPath.map(async (file) => {
        const fileName = path.basename(file);
        const { volume, chapter } = this.extractSerieInfo(fileName);

        return {
          filePath: file,
          volume: volume ? Number(volume) : 0,
          chapter: chapter ? Number(chapter) : 0,
        };
      }),
    );

    fileDetails.sort((a, b) => a.chapter - b.chapter);

    const orderedPaths = fileDetails.map((fileDetail) => fileDetail.filePath);
    return orderedPaths;
  }

  private extractSerieInfo(fileName: string): {
    volume: number;
    chapter: number;
  } {
    let volume = 0;
    let chapter = 0;

    const normalized = fileName.replace(/[_\-]/g, ' ');

    const volumeMatch = normalized.match(/\b(?:v|vol\.?)\s*(\d+)/i);
    if (volumeMatch) {
      volume = parseInt(volumeMatch[1], 10);
    }

    const chapterMatch =
      normalized.match(/#\s*(\d+(\.\d+)?)/) ||
      normalized.match(/\bch(?:apter)?\.?\s*(\d+(\.\d+)?)/i) ||
      normalized.match(/\bcap(?:ítulo)?\.?\s*(\d+(\.\d+)?)/i) ||
      normalized.match(/\b(\d{1,4})(?!\.\d)/);
    if (chapterMatch) {
      chapter = parseFloat(chapterMatch[1]);
    }

    return { volume, chapter };
  }

  public async localUpload(oldPath: string, newPath: string): Promise<void> {
    try {
      await fse.move(oldPath, newPath);
    } catch (error) {
      console.error(`Erro ao fazer upload do arquivo: ${error}`);
      throw error;
    }
  }

  public async uploadCover(oldPath: string, newPath: string): Promise<void> {
    try {
      await fse.move(oldPath, newPath);
    } catch (e) {
      console.error(`Erro ao fazer upload de imagem: ${e}`);
      throw e;
    }
  }

  public async uploadImage(file: string): Promise<string> {
    try {
      const destPath = path.join(
        this.imagesFolder,
        'dinamicImages',
        path.basename(file),
      );
      await fse.move(file, destPath);
      return destPath;
    } catch (e) {
      console.error(`Erro ao fazer upload de imagem: ${e}`);
      throw e;
    }
  }

  public async getDataPaths(): Promise<string[]> {
    try {
      const directories = [this.booksData, this.comicsData, this.mangasData];

      const contentArrays = await Promise.all(
        directories.map(async (dir) =>
          (
            await fse.readdir(dir, { withFileTypes: true })
          ).map((item) => path.join(dir, item.name)),
        ),
      );

      return contentArrays.flat();
    } catch (e) {
      console.error(`Erro ao obter séries: ${e}`);
      throw e;
    }
  }

  public async getDataPath(serieName: string): Promise<string> {
    try {
      const directories = [this.booksData, this.comicsData, this.mangasData];

      for (const dir of directories) {
        const items = await fse.readdir(dir, { withFileTypes: true });
        const foundPath = items
          .map((item) => path.join(dir, item.name))
          .find(
            (contentPath) =>
              path.basename(contentPath, path.extname(contentPath)) ===
              serieName,
          );

        if (foundPath) return foundPath;
      }

      return '';
    } catch (e) {
      console.error(`Erro ao obter série: ${e}`);
      throw e;
    }
  }

  public purifyOutput(rawOutput: string): string {
    const lines = rawOutput.split('\n');

    const headerIndex = lines.findIndex(
      (line) =>
        line.includes('Date') && line.includes('Time') && line.includes('Attr'),
    );
    if (headerIndex === -1) {
      throw new Error('Cabeçalho da tabela não encontrado na saída.');
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    const lineRegex =
      /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+\S+\s+\d+\s+\d+\s+(.*)$/;
    const imageExtensionRegex = /\.(jpg|jpeg|png|gif)$/i;
    const lastDigitsRegex = /^(?:0{0,}0|0{0,}1)$/;

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!dateRegex.test(line) || line.includes('files,')) continue;

      const match = line.match(lineRegex);
      if (!match?.[1]) continue;

      const filePath = match[1].trim();
      const lastSlashIndex = Math.max(
        filePath.lastIndexOf('/'),
        filePath.lastIndexOf('\\'),
      );
      const fileName = filePath.substring(lastSlashIndex + 1);

      if (!imageExtensionRegex.test(fileName)) continue;

      const baseName = fileName.replace(imageExtensionRegex, '');
      const lastDigitsMatch = baseName.match(/(\d+)(?!.*\d)/);

      if (!lastDigitsMatch || !lastDigitsRegex.test(lastDigitsMatch[1]))
        continue;

      const specialDir =
        lastSlashIndex > -1 ? filePath.substring(0, lastSlashIndex + 1) : '';
      return specialDir ? `${specialDir}${fileName}` : fileName;
    }

    throw new Error('Nenhum arquivo válido encontrado.');
  }

  public foundLiteratureForm(dataPath: string): string {
    try {
      const LiteratureForm = path.basename(path.dirname(dataPath));
      return LiteratureForm;
    } catch (e) {
      console.error(
        `Falha em descobrir o tipo da serie: ${path.basename(dataPath)}`,
      );
      throw e;
    }
  }
}
