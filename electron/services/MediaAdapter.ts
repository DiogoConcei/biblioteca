import path from 'path';
import os from 'os';
import { randomBytes } from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fse from 'fs-extra';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';

import FileManager from './FileManager';

export interface ExtractCoverInput {
  inputPath: string;
  outputDir: string;
  preferredWidth?: number;
}

export interface ExtractCoverMetadata {
  sourceType: 'pdf' | 'archive';
  selectedCandidate?: string;
  candidateCount: number;
  partialExtraction: boolean;
  usedArchiveFallbackMode?: boolean;
  elapsedMs: number;
}

export interface ExtractCoverResult {
  success: boolean;
  coverPath?: string;
  error?: string;
  metadata?: ExtractCoverMetadata;
}

interface MediaArchiveAdapterConfig {
  sevenZipPath?: string;
  tempRootDir?: string;
  maxCommandBufferBytes?: number;
}

interface SevenZipCommandError extends Error {
  code?: number;
  stdout?: Buffer | string;
  stderr?: Buffer | string;
}

interface SevenZipRunResult {
  stdoutText: string;
  stderrText: string;
  partialCrcFailure: boolean;
}

interface ArchiveExtractionResult {
  partialCrcFailure: boolean;
  usedFallbackMode: boolean;
}

export default class MediaArchiveAdapter {
  private readonly sevenZipPath: string;
  private readonly tempRootDir: string;
  private readonly maxCommandBufferBytes: number;
  private readonly execFileAsync = promisify(execFile);
  private readonly fileManager = new FileManager();

  constructor(config?: MediaArchiveAdapterConfig) {
    this.sevenZipPath = config?.sevenZipPath ?? 'C:\\Program Files\\7-Zip\\7z';
    this.tempRootDir =
      config?.tempRootDir ?? path.join(os.tmpdir(), 'biblioteca');
    this.maxCommandBufferBytes =
      config?.maxCommandBufferBytes ?? 1024 * 1024 * 20;
  }

  public async extractCover(
    input: ExtractCoverInput,
  ): Promise<ExtractCoverResult> {
    const startedAt = Date.now();
    let tempDir = '';

    try {
      await fse.ensureDir(input.outputDir);
      await fse.ensureDir(this.tempRootDir);

      const sourceType = await this.detectSourceType(input.inputPath);

      tempDir = path.join(
        this.tempRootDir,
        `cover_${Date.now()}_${randomBytes(4).toString('hex')}`,
      );
      await fse.ensureDir(tempDir);

      let partialExtraction = false;
      let usedArchiveFallbackMode = false;

      if (sourceType === 'pdf') {
        await this.extractPdfPageAsImage(input.inputPath, tempDir);
      } else {
        const runResult = await this.extractArchiveImages(
          input.inputPath,
          tempDir,
        );
        partialExtraction = runResult.partialCrcFailure;
        usedArchiveFallbackMode = runResult.usedFallbackMode;
      }

      const candidates = await this.collectValidatedCandidates(tempDir);

      if (candidates.length === 0) {
        return {
          success: false,
          error: 'Nenhuma imagem válida encontrada para gerar capa.',
          metadata: {
            sourceType,
            candidateCount: 0,
            partialExtraction,
            usedArchiveFallbackMode,
            elapsedMs: Date.now() - startedAt,
          },
        };
      }

      const selectedCandidate = this.selectCoverCandidate(candidates);
      const finalCoverPath = await this.writeNormalizedCover({
        sourceImagePath: selectedCandidate,
        outputDir: input.outputDir,
        preferredWidth: input.preferredWidth,
      });

      return {
        success: true,
        coverPath: finalCoverPath,
        metadata: {
          sourceType,
          selectedCandidate: path.basename(selectedCandidate),
          candidateCount: candidates.length,
          partialExtraction,
          usedArchiveFallbackMode,
          elapsedMs: Date.now() - startedAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Falha desconhecida ao extrair capa.',
        metadata: {
          sourceType: 'archive',
          candidateCount: 0,
          partialExtraction: false,
          elapsedMs: Date.now() - startedAt,
        },
      };
    } finally {
      if (tempDir) {
        await fse.remove(tempDir);
      }
    }
  }

  private async detectSourceType(
    inputPath: string,
  ): Promise<'pdf' | 'archive'> {
    const fd = await fse.open(inputPath, 'r');
    const sample = Buffer.alloc(8192);

    try {
      const { bytesRead } = await fse.read(fd, sample, 0, sample.length, 0);
      const chunk = sample.subarray(0, bytesRead);
      const type = await fileTypeFromBuffer(chunk);

      if (type?.mime === 'application/pdf') return 'pdf';
      if (path.extname(inputPath).toLowerCase() === '.pdf') return 'pdf';

      return 'archive';
    } finally {
      await fse.close(fd);
    }
  }

  private async extractArchiveImages(
    inputPath: string,
    tempDir: string,
  ): Promise<ArchiveExtractionResult> {
    const filteredResult = await this.run7zipCommand([
      'e',
      inputPath,
      '-y',
      '-aoa',
      '-bd',
      '-bb0',
      '-r',
      `-o${tempDir}`,
      '*.jpg',
      '*.jpeg',
      '*.png',
      '*.webp',
      '*.gif',
      '*.bmp',
      '*.tif',
      '*.tiff',
    ]);

    const filteredFilesCount = await this.countFilesInDirectory(tempDir);

    if (filteredFilesCount > 0) {
      return {
        partialCrcFailure: filteredResult.partialCrcFailure,
        usedFallbackMode: false,
      };
    }

    const fallbackResult = await this.run7zipCommand([
      'e',
      inputPath,
      '-y',
      '-aoa',
      '-bd',
      '-bb0',
      '-r',
      `-o${tempDir}`,
    ]);

    return {
      partialCrcFailure:
        filteredResult.partialCrcFailure || fallbackResult.partialCrcFailure,
      usedFallbackMode: true,
    };
  }

  private async extractPdfPageAsImage(
    inputPath: string,
    tempDir: string,
  ): Promise<void> {
    const data = await fse.readFile(inputPath);
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(data),
      // @ts-expect-error pdfjs worker not used on electron main process
      disableWorker: true,
    });

    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;

    const outputPath = path.join(tempDir, 'pdf-cover.jpg');
    await fse.writeFile(outputPath, canvas.toBuffer('image/jpeg', 0.85));
  }

  private async countFilesInDirectory(dirPath: string): Promise<number> {
    const entries = await fse.readdir(dirPath, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).length;
  }

  private async collectValidatedCandidates(tempDir: string): Promise<string[]> {
    const entries = await fse.readdir(tempDir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => path.join(tempDir, e.name));

    const validFiles: string[] = [];

    for (const filePath of files) {
      if (!this.isPathInside(tempDir, filePath)) continue;

      const fileBuffer = await fse.readFile(filePath);
      const type = await fileTypeFromBuffer(fileBuffer);

      if (!type?.mime.startsWith('image/')) continue;

      validFiles.push(filePath);
    }

    return validFiles;
  }

  private selectCoverCandidate(candidates: string[]): string {
    const fileNames = candidates.map((candidate) => path.basename(candidate));
    const preferredName = this.fileManager.findFirstCoverFile(fileNames);

    if (preferredName) {
      const preferredPath = candidates.find(
        (candidate) => path.basename(candidate) === preferredName,
      );
      if (preferredPath) return preferredPath;
    }

    return candidates[0];
  }

  private async writeNormalizedCover(params: {
    sourceImagePath: string;
    outputDir: string;
    preferredWidth?: number;
  }): Promise<string> {
    const sourceName = path.parse(params.sourceImagePath).name;
    const suffix = randomBytes(3).toString('hex');
    const finalPath = this.fileManager.buildImagePath(
      params.outputDir,
      `cover_${sourceName}_${suffix}`,
      '.webp',
    );

    let image = sharp(params.sourceImagePath, { failOn: 'none' });

    if (params.preferredWidth && params.preferredWidth > 0) {
      image = image.resize({
        width: params.preferredWidth,
        withoutEnlargement: true,
      });
    }

    await image.webp({ quality: 85 }).toFile(finalPath);

    return finalPath;
  }

  private isPathInside(parentDir: string, childPath: string): boolean {
    const relativePath = path.relative(
      path.resolve(parentDir),
      path.resolve(childPath),
    );
    return (
      !!relativePath &&
      !relativePath.startsWith('..') &&
      !path.isAbsolute(relativePath)
    );
  }

  private async run7zipCommand(args: string[]): Promise<SevenZipRunResult> {
    try {
      const { stdout, stderr } = await this.execFileAsync(
        this.sevenZipPath,
        args,
        {
          windowsHide: true,
          maxBuffer: this.maxCommandBufferBytes,
          encoding: 'buffer',
        },
      );

      return {
        stdoutText: this.decodeCommandOutput(stdout),
        stderrText: this.decodeCommandOutput(stderr),
        partialCrcFailure: false,
      };
    } catch (err: unknown) {
      const commandError = err as SevenZipCommandError;
      const stdoutText = this.decodeCommandOutput(commandError.stdout);
      const stderrText = this.decodeCommandOutput(commandError.stderr);
      const output = `${stdoutText}\n${stderrText}`;

      const partialCrcFailure =
        Number(commandError.code) === 2 &&
        /CRC Failed|Data Error/i.test(output);

      if (partialCrcFailure) {
        return {
          stdoutText,
          stderrText,
          partialCrcFailure: true,
        };
      }

      throw commandError;
    }
  }

  private decodeCommandOutput(data: unknown): string {
    if (Buffer.isBuffer(data)) {
      const utf8Text = data.toString('utf8').split('\0').join('').trim();
      const latin1Text = data.toString('latin1').split('\0').join('').trim();

      if (!utf8Text) return latin1Text;
      if (!latin1Text) return utf8Text;

      const utf8HasReplacement = utf8Text.includes('\uFFFD');
      const latinHasReplacement = latin1Text.includes('\uFFFD');

      if (utf8HasReplacement && !latinHasReplacement) {
        return latin1Text;
      }

      return utf8Text;
    }

    if (typeof data === 'string') {
      return data.trim();
    }

    return '';
  }
}
