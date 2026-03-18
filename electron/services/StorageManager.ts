import fse from 'fs-extra';
import path from 'path';
import { randomBytes } from 'crypto';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { promisify } from 'util';
import { exec } from 'child_process';

import { SerieData, SerieEditForm } from '../../src/types/series.interfaces';
import { Manga } from '../types/manga.interfaces';
import { Comic, TieIn } from '../types/comic.interfaces';
import {
  LiteratureChapter,
  Literatures,
  viewData,
} from '../types/electron-auxiliar.interfaces';
import FileManager from './FileManager';
import LibrarySystem from './abstract/LibrarySystem';

export default class StorageManager extends LibrarySystem {
  private readonly SEVEN_ZIP_PATH = 'C:\\Program Files\\7-Zip\\7z';
  private readonly execAsync = promisify(exec);
  private readonly fileManager: FileManager = new FileManager();
  private _viewDataCache: viewData[] | null = null;

  public invalidateCache(): void {
    this._viewDataCache = null;
  }

  constructor() {
    super();
  }

  public async writeData(serie: Literatures | TieIn): Promise<boolean> {
    try {
      this.invalidateCache();
      await fse.writeJSON(serie.dataPath, serie, { spaces: 2 });
      return true;
    } catch (e) {
      console.error(`Erro em escrever dados da serie: ${e}`);
      return false;
    }
  }

  public async searchSerieById(
    serieId: number,
  ): Promise<Literatures | TieIn | null> {
    // Usamos o cache do getViewData para encontrar o caminho do arquivo rapidamente.
    // Como getViewData tem a propriedade id e dataPath, a busca é instantânea.
    const viewData = await this.getViewData();
    
    if (viewData) {
      const targetSerie = viewData.find((serie) => serie.id === serieId);
      if (targetSerie) {
        return await this.readData(targetSerie.dataPath);
      }
    }

    // Fallback caso o getViewData falhe por algum motivo
    const dataPaths = await this.fileManager.getDataPaths();

    for (const dataPath of dataPaths) {
      const serieData = await this.readData(dataPath);

      if (!serieData || serieData.id !== serieId) {
        continue;
      }

      return serieData;
    }

    return null;
  }

  // Gambiarra genérica para ler todos os dados (temporária)
  public async readData(dataPath: string): Promise<Literatures | TieIn | null> {
    try {
      const serieData = (await fse.readJson(dataPath, {
        encoding: 'utf-8',
      })) as Literatures;

      if (!serieData) {
        throw new Error('Arquivo lido, mas vazio ou inválido.');
      }

      return serieData;
    } catch (e) {
      console.error(`Erro ao ler dados da série: ${e}`);
      return null;
    }
  }

  public async readSerieData(dataPath: string): Promise<Literatures | null> {
    try {
      const serieData = (await fse.readJson(dataPath, {
        encoding: 'utf-8',
      })) as Literatures;

      if (!serieData) {
        throw new Error('Arquivo lido, mas vazio ou inválido.');
      }

      return serieData;
    } catch (e) {
      console.error(`Erro ao ler dados da série: ${e}`);
      return null;
    }
  }

  public async readTieInData(dataPath: string): Promise<TieIn | null> {
    try {
      const serieData = (await fse.readJson(dataPath, {
        encoding: 'utf-8',
      })) as TieIn;

      if (!serieData) {
        throw new Error('Arquivo lido, mas vazio ou inválido.');
      }

      return serieData;
    } catch (e) {
      console.error(`Erro ao ler dados da série: ${e}`);
      return null;
    }
  }

  public async deleteChapter(chapter: LiteratureChapter): Promise<boolean> {
    try {
      this.invalidateCache();
      if (await fse.pathExists(chapter.chapterPath)) {
        await fse.remove(chapter.chapterPath);
        chapter.isDownloaded = 'not_downloaded';
        chapter.chapterPath = '';

        return true;
      }

      return false;
    } catch (e) {
      console.error('Falha e deletar capitulos: ', e);
      return false;
    }
  }

  public async selectSerieData<T extends Literatures | TieIn>(
    serieName: string,
    type?: 'Manga' | 'Quadrinho' | 'childSeries',
  ): Promise<T> {
    try {
      let targetFolder: string;

      if (type) {
        switch (type) {
          case 'Manga': targetFolder = this.mangasData; break;
          case 'Quadrinho': targetFolder = this.comicsData; break;
          case 'childSeries': targetFolder = this.childSeriesData; break;
          default: targetFolder = this.mangasData;
        }
      } else {
        // Se o tipo não for passado, tenta encontrar em todas as pastas
        const allFolders = [this.mangasData, this.comicsData, this.childSeriesData];
        for (const folder of allFolders) {
          const files = await this.fileManager.foundFiles(folder);
          const found = files.find(f => path.parse(f).name === serieName);
          if (found) {
            return await fse.readJson(found, { encoding: 'utf-8' });
          }
        }
        throw new Error(`Série não encontrada: ${serieName}`);
      }

      const seriesData = await this.fileManager.foundFiles(targetFolder);
      const serieDataPath = seriesData.find(
        (filePath) => path.parse(filePath).name === serieName,
      );

      if (!serieDataPath) {
        throw new Error(`Nenhuma série encontrada com o nome: ${serieName} em ${type}`);
      }

      return await fse.readJson(serieDataPath, { encoding: 'utf-8' });
    } catch (e) {
      console.error(`Erro ao selecionar dados da série (${serieName}):`, e);
      throw e;
    }
  }

  // Refeito durante a reformulação de ComicManager
  public async fixComicDir(
    brokenPath: string,
    correctPath: string,
  ): Promise<string[]> {
    const moved: string[] = [];

    async function walk(dir: string) {
      const entries = await fse.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const src = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walk(src);
          continue;
        }

        const dest = path.join(correctPath, entry.name);

        if (await fse.pathExists(dest)) {
          await fse.remove(dest);
        }

        await fse.move(src, dest, { overwrite: true });

        if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
          moved.push(dest);
        }
      }
    }

    await walk(brokenPath);
    await fse.remove(brokenPath);

    return moved;
  }

  public async cleanupExtractedCover(outputDir: string): Promise<void> {
    try {
      const resolved = path.resolve(outputDir);

      // Guardrail simples: não permita remoção acidental de raiz/level alto.
      const root = path.parse(resolved).root;
      if (!resolved || resolved === root) {
        console.error(
          '❌ cleanupExtractedCover: Recusei remover caminho potencialmente perigoso:',
          resolved,
        );
        throw new Error('cleanupExtractedCover: caminho inválido');
      }

      const exists = await fse.pathExists(resolved);
      if (!exists) {
        console.log(
          '🧹 cleanupExtractedCover: nada a remover (não existe):',
          resolved,
        );
        return;
      }

      // Log antes de apagar, listando conteúdo resumido
      const entries = await fse.readdir(resolved);
      console.log(
        `🧹 cleanupExtractedCover: removendo diretório (${entries.length} itens):`,
        resolved,
      );

      await fse.remove(resolved);

      console.log(
        '✅ cleanupExtractedCover: diretório removido com sucesso:',
        resolved,
      );
    } catch (err) {
      console.error(
        '❌ cleanupExtractedCover: erro ao limpar diretório:',
        outputDir,
        err,
      );
      throw err;
    }
  }
  public async safeExtract(
    inputFile: string,
    outputPath: string,
  ): Promise<string> {
    const tempSuffix = `${Date.now()}-${randomBytes(2).toString('hex')}`;
    const tempDir = path.join(outputPath, `__7z_extract_tmp_${tempSuffix}`);

    try {
      console.log(
        `🔍 safeExtract: iniciando extração segura para arquivo: ${inputFile}`,
      );
      console.log(`📂 safeExtract: diretório temporário: ${tempDir}`);

      // garante temp
      await fse.mkdirp(tempDir);

      // extração para tempDir (assumo que extractWith7zip extrai um CBZ/CBR inteiro em uma pasta)
      console.log(
        '🧰 safeExtract: executando extractWith7zip para pasta temporária...',
      );
      await this.extractWith7zip(inputFile, tempDir);
      console.log('✅ safeExtract: extração inicial concluída em:', tempDir);

      // Leia conteúdo do temp
      const entries = await fse.readdir(tempDir, { withFileTypes: true });
      const dirs = entries.filter((e) => e.isDirectory());
      const imageFiles = entries.filter(
        (e) => e.isFile() && /\.(jpe?g|jpeg|png|webp|gif)$/i.test(e.name),
      );

      // Caso: pasta aninhada (um diretório único com imagens dentro)
      if (dirs.length === 1 && imageFiles.length === 0) {
        const brokenPath = path.join(tempDir, dirs[0].name);
        console.log(
          '🛠 safeExtract: estrutura aninhada detectada. Corrigindo:',
          brokenPath,
        );
        await this.fixComicDir(brokenPath, tempDir);
        console.log(
          '✅ safeExtract: correção de estrutura aninhada concluída.',
        );
      } else {
        console.log(
          `🔎 safeExtract: estrutura verificada. dirs=${dirs.length} imageFilesAtRoot=${imageFiles.length}`,
        );
      }

      // Releia e transforme em paths absolutos para o fileManager
      const finalEntries = (
        await fse.readdir(tempDir, { withFileTypes: true })
      ).map((file) => path.join(tempDir, file.name));

      console.log(
        `🔎 safeExtract: total de entradas no temp: ${finalEntries.length}`,
      );

      // encontra capa
      const cover = this.fileManager.findFirstCoverFile(finalEntries);

      if (!cover) {
        console.warn(
          '⚠️ safeExtract: nenhuma capa encontrada nos conteúdos extraídos:',
          tempDir,
        );
        // limpa temp e retorna vazio
        await this.cleanupExtractedCover(tempDir);
        return '';
      }

      console.log('🎯 safeExtract: candidato a capa encontrado:', cover);

      // sanitize e move para outputPath (cria outputPath se necessário)
      const parsed = path.parse(cover);
      const newName = this.fileManager
        .sanitizeImageName(parsed.name)
        .concat(parsed.ext);
      const destDir = path.resolve(outputPath);
      const destPath = path.join(destDir, newName);

      await fse.mkdirp(destDir);

      // se existir, remover antes para evitar erro ou duplicação
      if (await fse.pathExists(destPath)) {
        console.log(
          '⚠️ safeExtract: arquivo destino já existe e será sobrescrito:',
          destPath,
        );
        await fse.remove(destPath);
      }

      console.log(
        `➡️ safeExtract: movendo capa de "${cover}" -> "${destPath}"`,
      );
      await fse.move(cover, destPath, { overwrite: true });
      console.log('✅ safeExtract: capa movida com sucesso:', destPath);

      // limpeza do tempDir restante
      try {
        const remaining = await fse.readdir(tempDir);
        if (remaining.length > 0) {
          console.log(
            `🧹 safeExtract: removendo conteúdo temporário restante (${remaining.length} itens) em:`,
            tempDir,
          );
        } else {
          console.log(
            '🧹 safeExtract: diretório temporário está vazio, removendo:',
            tempDir,
          );
        }
        await fse.remove(tempDir);
        console.log('✅ safeExtract: diretório temporário removido:', tempDir);
      } catch (cleanupErr) {
        // não falhar a operação principal se limpeza falhar — apenas logar
        console.warn(
          '⚠️ safeExtract: falha ao limpar tempDir, pode permanecer lixo temporário:',
          tempDir,
          cleanupErr,
        );
      }

      return destPath;
    } catch (err) {
      console.error(
        '❌ safeExtract: erro durante extração segura para arquivo:',
        inputFile,
        err,
      );
      // tentativa defensiva de limpar temp (não lançar se cleanup falhar)
      try {
        if (await fse.pathExists(tempDir)) {
          await fse.remove(tempDir);
          console.log('🧹 safeExtract: tempDir removido após erro:', tempDir);
        }
      } catch (cleanupErr) {
        console.warn(
          '⚠️ safeExtract: falha ao limpar tempDir após erro:',
          tempDir,
          cleanupErr,
        );
      }
      throw err;
    }
  }

  public async extractCoverWith7zip(
    inputFile: string,
    outputDir: string,
  ): Promise<string> {
    const ctx = { inputFile, outputDir };
    try {
      console.log('🔎 extractCoverWith7zip: iniciando para', inputFile);
      await fse.mkdirp(outputDir);
      console.log('📂 extractCoverWith7zip: garantido outputDir:', outputDir);

      // Lista o conteúdo do arquivo (7z l)
      console.log(
        '📄 extractCoverWith7zip: listando conteúdo do arquivo (7z l)...',
      );
      const { stdout } = await this.execAsync(
        `"${this.SEVEN_ZIP_PATH}" l "${inputFile}"`,
      );
      const filesInArchive = this.parse7zList(stdout);
      console.log(
        `📄 extractCoverWith7zip: encontrados ${filesInArchive.length} items no archive.`,
      );

      if (filesInArchive.length === 0) {
        console.error(
          '❌ extractCoverWith7zip: arquivo compactado está vazio:',
          inputFile,
        );
        throw new Error('Arquivo compactado está vazio.');
      }

      // procura candidato pelo nome base (apenas nomes)
      const candidateName = this.fileManager.findFirstCoverFile(
        filesInArchive.map((f) => path.basename(f)),
      );

      if (!candidateName) {
        console.log(
          '⚠️ extractCoverWith7zip: nenhum candidato por nome detectado no arquivo. Saindo sem extrair.',
        );
        return '';
      }

      console.log(
        '🎯 extractCoverWith7zip: candidateName selecionado:',
        candidateName,
      );

      const candidatePath = filesInArchive.find(
        (f) => path.basename(f) === candidateName,
      );

      if (!candidatePath) {
        console.error(
          '❌ extractCoverWith7zip: candidato encontrado, mas path interno não foi localizado no listing:',
          candidateName,
        );
        throw new Error(
          'Candidato encontrado, mas path interno não localizado.',
        );
      }

      const normalizedCandidate = path.normalize(candidatePath);
      console.log(
        '🔁 extractCoverWith7zip: normalized candidate:',
        normalizedCandidate,
      );

      if (normalizedCandidate.startsWith('..')) {
        console.error(
          '❌ extractCoverWith7zip: path interno inválido (path traversal):',
          normalizedCandidate,
        );
        throw new Error('Path interno inválido no arquivo compactado.');
      }

      const ext = path.extname(normalizedCandidate);
      const baseName = path.basename(normalizedCandidate, ext);
      const safeBase = baseName.replace(/[. ]+$/, '');
      const suffix = randomBytes(3).toString('hex');
      const finalPath = this.fileManager.buildImagePath(
        outputDir,
        `${safeBase}_${suffix}`,
        ext,
      );

      console.log(
        `🧩 extractCoverWith7zip: preparando extração do item "${normalizedCandidate}" para "${outputDir}". FinalPath será "${finalPath}"`,
      );

      try {
        console.log(
          '📥 extractCoverWith7zip: executando 7z x para extrair o arquivo específico...',
        );
        await this.execAsync(
          `"${this.SEVEN_ZIP_PATH}" x "${inputFile}" "${normalizedCandidate}" -o"${outputDir}" -y`,
        );
        console.log('✅ extractCoverWith7zip: extração concluída (7z).');
      } catch (err: any) {
        // permite erro CRC específico sem falhar totalmente
        if (
          err?.code === 2 &&
          typeof err.stderr === 'string' &&
          err.stderr.includes('CRC Failed')
        ) {
          console.warn(
            '⚠️ extractCoverWith7zip: CRC Failed detectado durante extração, continuando (não-fatal).',
            { inputFile, candidate: normalizedCandidate },
          );
        } else {
          console.error('❌ extractCoverWith7zip: erro ao extrair com 7zip:', {
            inputFile,
            normalizedCandidate,
            err,
          });
          throw err;
        }
      }

      const extractedPath = path.join(outputDir, normalizedCandidate);
      console.log(
        '📍 extractCoverWith7zip: caminho esperado do arquivo extraído:',
        extractedPath,
      );

      // move o arquivo do caminho extraído (pode estar dentro de subpastas criadas pelo 7z)
      if (!(await fse.pathExists(extractedPath))) {
        console.error(
          '❌ extractCoverWith7zip: arquivo extraído não encontrado no caminho esperado:',
          extractedPath,
        );
        throw new Error(`Arquivo extraído não encontrado: ${extractedPath}`);
      }

      await fse.move(extractedPath, finalPath, { overwrite: true });
      console.log(
        '✅ extractCoverWith7zip: arquivo movido para finalPath:',
        finalPath,
      );

      // limpa diretório extraído se vazio
      const extractedDir = path.dirname(extractedPath);
      if (extractedDir !== outputDir) {
        const remaining = await fse.readdir(extractedDir);
        if (remaining.length === 0) {
          console.log(
            '🧹 extractCoverWith7zip: extraído em subdiretório vazio. Removendo:',
            extractedDir,
          );
          await fse.remove(extractedDir);
          console.log(
            '✅ extractCoverWith7zip: subdiretório removido:',
            extractedDir,
          );
        } else {
          console.log(
            'ℹ️ extractCoverWith7zip: subdiretório contém outros arquivos, não remover:',
            extractedDir,
            'itens:',
            remaining.length,
          );
        }
      }

      console.log(
        '🎉 extractCoverWith7zip: concluído com sucesso, retornando:',
        finalPath,
      );
      return finalPath;
    } catch (err) {
      console.error(
        '❌ extractCoverWith7zip: falha geral para arquivo:',
        ctx.inputFile,
        'outputDir:',
        ctx.outputDir,
        err,
      );
      throw err;
    }
  }

  public async getViewData(): Promise<viewData[] | null> {
    try {
      if (this._viewDataCache) {
        return this._viewDataCache;
      }

      const dataPaths = await this.fileManager.getDataPaths();

      const viewData: viewData[] = await Promise.all(
        dataPaths.map(async (dataPath) => {
          const serie = await this.readSerieData(dataPath);
          if (!serie) {
            throw new Error(
              `Erro ao trazer dados de visualização: serie invalida`,
            );
          }

          return await this.mountViewData(serie);
        }),
      );

      this._viewDataCache = viewData;
      return viewData;
    } catch (e) {
      console.error(`Erro ao trazer dados de visualização:${e}`);
      return null;
    }
  }

  public async processData(seriePath: string): Promise<SerieData> {
    const serieName = path.basename(seriePath);
    const newPath = path.join(this.userLibrary, serieName);

    if (!(await fse.pathExists(seriePath))) {
      throw new Error(`Caminho invalido: ${seriePath} não existe.`);
    }

    return {
      name: serieName,
      sanitizedName: this.fileManager.sanitizeFilename(serieName),
      newPath: newPath,
      oldPath: seriePath,
      createdAt: new Date().toISOString(),
    };
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

  public async extractWith7zip(
    inputFile: string,
    outputDir: string,
  ): Promise<void> {
    try {
      await fse.mkdir(outputDir, { recursive: true });
      const extractCmd = `"${this.SEVEN_ZIP_PATH}" x "${inputFile}" -o"${outputDir}" -y`;

      try {
        await this.execAsync(extractCmd);
      } catch (err: any) {
        if (
          err?.code === 2 &&
          typeof err.stderr === 'string' &&
          err.stderr.includes('CRC Failed')
        ) {
          console.warn(
            '⚠️ Extração concluída com erros de CRC. Alguns arquivos podem estar corrompidos.',
          );
        } else {
          throw err;
        }
      }
    } catch (e) {
      console.error(`Falha em descompactar arquivos: ${e}`);
      throw e;
    }
  }

  public async patchSerie(data: SerieEditForm): Promise<Literatures | null> {
    const oldData = await this.readSerieData(data.dataPath);

    if (!oldData) return null;

    const changedFields = Object.fromEntries(
      (Object.keys(data) as (keyof SerieEditForm)[])
        .filter((k) => data[k] !== oldData[k])
        .map((k) => [k, data[k]]),
    ) as Partial<SerieEditForm>;

    const updated: Literatures = {
      ...oldData,
      ...changedFields,
    } as Literatures;

    if (updated.name !== oldData.name) {
      await this.fileManager.moveFiles(oldData, updated);
    }

    return updated;
  }

  public async patchHelper(
    oldData: Literatures,
    updatedData: Literatures,
  ): Promise<void> {
    try {
      const dir = path.dirname(oldData.dataPath);
      const newPath = path.join(dir, `${updatedData.name}.json`);

      const nameChanged = oldData.name !== updatedData.name;

      if (nameChanged) {
        await fse.ensureDir(dir);

        if (await fse.pathExists(oldData.dataPath)) {
          await fse.remove(oldData.dataPath);
        }

        updatedData.dataPath = newPath;

        await fse.writeJson(newPath, updatedData, { spaces: 2 });
      } else {
        await fse.writeJson(oldData.dataPath, updatedData, { spaces: 2 });
      }
    } catch (e) {
      console.error(
        `Falha ao finalizar update da série: ${updatedData.name}`,
        e,
      );
      throw e; // importante propagar
    }
  }

  public async convertPdf_overdrive(
    inputFile: string,
    outputDir: string,
  ): Promise<void> {
    await fse.ensureDir(outputDir);

    const data = await fse.readFile(inputFile);
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(data),
      // @ts-ignore
      disableWorker: true,
    }).promise;

    const scale = 1;
    const totalPages = pdf.numPages;

    const tasks = Array.from({ length: totalPages }, (_, i) =>
      this.processPdfPage(pdf, i + 1, outputDir, scale),
    );

    await Promise.all(tasks);
  }

  public buildUpdatedSerie(
    oldData: Literatures,
    newData: SerieEditForm,
  ): { hasChanges: boolean; data: Literatures } {
    const updated: any = { ...oldData };
    let hasChanges = false;

    for (const key of Object.keys(newData)) {
      const newValue = (newData as any)[key];
      const oldValue = (oldData as any)[key];

      if (!this.deepEqual(oldValue, newValue)) {
        updated[key] = newValue;
        hasChanges = true;
      }
    }

    return { hasChanges, data: updated };
  }

  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (a === null || b === null) return a === b;
    if (typeof a !== typeof b) return false;

    if (typeof a !== 'object') return a === b;

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;

      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false;
      }

      return true;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!this.deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  public async persistSerie(
    oldData: Literatures,
    updated: Literatures,
  ): Promise<string> {
    this.invalidateCache();
    const oldPath = oldData.dataPath;
    const dir = path.dirname(oldPath);

    const nameChanged = oldData.name !== updated.name;
    const newPath = nameChanged
      ? path.join(dir, `${updated.name}.json`)
      : oldPath;

    // Se mudou nome, remove antigo antes de escrever
    if (nameChanged && oldPath !== newPath) {
      if (await fse.pathExists(oldPath)) {
        await fse.remove(oldPath);
      }
    }

    updated.dataPath = newPath;

    await fse.ensureDir(dir);
    await fse.writeJson(newPath, updated, { spaces: 2 });

    return newPath;
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

  private parse7zList(output: string): string[] {
    const lines = output.split('\n');
    const files: string[] = [];
    let parsing = false;

    for (const line of lines) {
      if (line.startsWith('----')) {
        parsing = !parsing;
        continue;
      }

      if (!parsing) continue;

      const parts = line.trim().split(/\s+/);
      const filePath = parts.slice(5).join(' ');

      if (filePath && !filePath.endsWith('/')) {
        files.push(filePath);
      }
    }

    return files;
  }

  private mountViewData(serie: Literatures): viewData {
    return {
      id: serie.id,
      name: serie.name,
      coverImage: serie.coverImage,
      chaptersRead: serie.chaptersRead,
      dataPath: serie.dataPath,
      totalChapters: serie.totalChapters,
      literatureForm: serie.literatureForm,
    };
  }
}
