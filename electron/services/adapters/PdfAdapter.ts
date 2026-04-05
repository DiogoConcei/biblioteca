import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import fse from 'fs-extra';
import { randomBytes } from 'crypto';
import path from 'path';

import { MediaAdapter, MediaContent } from '../../types/media.interfaces';
import LibrarySystem from '../abstract/LibrarySystem';
import FileManager from '../FileManager';
import ImageManager from '../ImageManager';

export default class PdfAdapter extends LibrarySystem implements MediaAdapter {
  private readonly fileManager: FileManager = new FileManager();
  private readonly imageManager: ImageManager = new ImageManager();

  public async getPages(chapterPath: string): Promise<MediaContent> {
    // Processamento PDF -> Apenas para obter contagem de páginas
    const data = await fse.readFile(chapterPath);
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(data),
      // @ts-expect-error -> Incompatibilidade de tipos do pdfjs no node
      disableWorker: true,
    }).promise;

    const totalPages = pdf.numPages;
    
    // Retornamos o PDF original como recurso principal
    // O visualizador (BookViewer) usará o pdf.js para renderizar via Canvas
    const pdfUrl = this.imageManager.getMediaUrl(chapterPath);

    return {
      type: 'pdf',
      resources: [pdfUrl],
      originalPath: pdfUrl,
      totalResources: totalPages,
    };
  }

  public async getCover(seriesPath: string): Promise<string> {
    const outputDir = path.join(this.showcaseImages, 'pdf_covers');
    await fse.ensureDir(outputDir);

    const data = await fse.readFile(seriesPath);
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(data),
      // @ts-expect-error disableWorker is not in the type definition but works in this version
      disableWorker: true,
    });

    const pdf = await loadingTask.promise;
    const buffer = await this.renderPdfPageToBuffer(pdf, 1, 1.5);
    
    const suffix = randomBytes(3).toString('hex');
    const finalPath = this.fileManager.buildImagePath(
      outputDir,
      `cover_${suffix}`,
      '.jpg',
    );

    await fse.writeFile(finalPath, buffer);
    return finalPath;
  }

  private async renderPdfPageToBuffer(
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
    scale: number,
  ): Promise<Buffer> {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;

    return canvas.toBuffer('image/jpeg', 0.85);
  }
}
