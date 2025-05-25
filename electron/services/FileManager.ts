import FileSystem from './abstract/FileSystem.ts';
import path from 'path';
import fse from 'fs-extra';

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

  public async orderByChapters(filesPath: string[]): Promise<string[]> {
    const fileDetails = await Promise.all(
      filesPath.map(async file => {
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

    const orderedPaths = fileDetails.map(fileDetail => fileDetail.filePath);
    return orderedPaths;
  }

  private extractSerieInfo(fileName: string): {
    volume: number;
    chapter: number;
  } {
    const regex =
      /Vol\.\s*(\d+)|Ch\.\s*(\d+(\.\d+)?)|Chapter\s*(\d+(\.\d+)?)|Capítulo\s*(\d+(\.\d+)?)/gi;
    const matches = [...fileName.matchAll(regex)];

    let volume = 0;
    let chapter = 0;

    matches.forEach(match => {
      if (match[1]) {
        volume = parseInt(match[1], 10);
      }
      if (match[2] || match[4] || match[6]) {
        const chapterValue = match[2] || match[4] || match[6];
        const chapterNumber = parseFloat(chapterValue);
        chapter = chapterNumber;
      }
    });

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
      const destPath = path.join(this.imagesFolder, 'dinamicImages', path.basename(file));
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
        directories.map(async dir =>
          (await fse.readdir(dir, { withFileTypes: true })).map(item => path.join(dir, item.name)),
        ),
      );

      return contentArrays.flat();
    } catch (e) {
      console.error(`Erro ao obter séries: ${e}`);
      throw e;
    }
  }

  public async getDataPath(serieName: string): Promise<string | undefined> {
    try {
      const directories = [this.booksData, this.comicsData, this.mangasData];

      for (const dir of directories) {
        const items = await fse.readdir(dir, { withFileTypes: true });
        const foundPath = items
          .map(item => path.join(dir, item.name))
          .find(contentPath => path.basename(contentPath, path.extname(contentPath)) === serieName);

        if (foundPath) return foundPath;
      }

      return undefined;
    } catch (e) {
      console.error(`Erro ao obter série: ${e}`);
      throw e;
    }
  }

  public purifyOutput(rawOutput: string): string {
    const lines = rawOutput.split('\n');

    const headerIndex = lines.findIndex(
      line => line.includes('Date') && line.includes('Time') && line.includes('Attr'),
    );
    if (headerIndex === -1) {
      throw new Error('Cabeçalho da tabela não encontrado na saída.');
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    const lineRegex = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+\S+\s+\d+\s+\d+\s+(.*)$/;
    const imageExtensionRegex = /\.(jpg|jpeg|png|gif)$/i;
    const lastDigitsRegex = /^(?:0+|0*[12])$/;

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!dateRegex.test(line) || line.includes('files,')) continue;

      const match = line.match(lineRegex);
      if (!match?.[1]) continue;

      const filePath = match[1].trim();
      const lastSlashIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
      const fileName = filePath.substring(lastSlashIndex + 1);

      if (!imageExtensionRegex.test(fileName)) continue;

      const baseName = fileName.replace(imageExtensionRegex, '');
      const lastDigitsMatch = baseName.match(/(\d+)(?!.*\d)/);

      if (!lastDigitsMatch || !lastDigitsRegex.test(lastDigitsMatch[1])) continue;

      const specialDir = lastSlashIndex > -1 ? filePath.substring(0, lastSlashIndex + 1) : '';
      return specialDir ? `${specialDir}${fileName}` : fileName;
    }

    throw new Error('Nenhum arquivo válido encontrado.');
  }

  public foundLiteratureForm(dataPath: string): string {
    try {
      const LiteratureForm = path.basename(path.dirname(dataPath));
      return LiteratureForm;
    } catch (e) {
      console.error(`Falha em descobrir o tipo da serie: ${path.basename(dataPath)}`);
      throw e;
    }
  }
}
