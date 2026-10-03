import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import fse from 'fs-extra';
import { randomBytes } from 'crypto';
import path from 'path';

import FileManager from './FileManager';
import LibrarySystem from './abstract/LibrarySystem';
export default class PdfManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();

  public async convertPdf_overdrive(
    inputFile: string,
    outputDir: string,
  ): Promise<void> {
    await fse.ensureDir(outputDir);

    const data = await fse.readFile(inputFile);
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(data),
      // @ts-expect-error -> Os tipos estão desatualizados mas funciona em tempo de execução
      disableWorker: true,
    }).promise;

    const scale = 1;
    const totalPages = pdf.numPages;

    const tasks = Array.from({ length: totalPages }, (_, i) =>
      this.processPdfPage(pdf, i + 1, outputDir, scale),
    );

    await Promise.all(tasks);
  }

  public async extractCoverFromPdf(
    inputFile: string,
    outputDir: string,
  ): Promise<string> {
    try {
      await fse.ensureDir(outputDir);

      const data = await fse.readFile(inputFile);

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(data),
        // @ts-expect-error -> Os tipos estão desatualizados mas funciona em tempo de execução
        disableWorker: true,
      });

      const pdf = await loadingTask.promise;

      const page = await pdf.getPage(1);

      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      await page.render({
        canvas: canvas as unknown as HTMLCanvasElement,
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise;

      const suffix = randomBytes(3).toString('hex');
      const finalPath = this.fileManager.buildImagePath(
        outputDir,
        `cover_${suffix}`,
        '.jpg',
      );

      const buffer = canvas.toBuffer('image/jpeg', 0.85);
      await fse.writeFile(finalPath, buffer);

      return finalPath;
    } catch (e) {
      console.error('Falha na conversão de PDF -> Imagem', e);
      throw e;
    }
  }

  private async processPdfPage(
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
    outputDir: string,
    scale: number,
  ): Promise<void> {
    const buffer = await this.renderPdfPageToBuffer(pdf, pageNum, scale);
    const fileName = this.buildPageFileName(pageNum);

    await fse.writeFile(path.join(outputDir, fileName), buffer);
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

  private buildPageFileName(pageNum: number): string {
    return `${String(pageNum).padStart(4, '0')}.jpeg`;
  }
}
