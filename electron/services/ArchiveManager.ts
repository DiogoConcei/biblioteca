import fse from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { randomBytes } from 'crypto';

import LibrarySystem from './abstract/LibrarySystem';
import FileManager from './FileManager';

interface ExecError extends Error {
  code: number;
  stderr: string;
  stdout: string;
}

export default class ArchiveManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly SEVEN_ZIP_PATH = 'C:\\Program Files\\7-Zip\\7z';
  private readonly execAsync = promisify(exec);

  public async extractWith7zip(
    inputFile: string,
    outputDir: string,
  ): Promise<void> {
    try {
      await fse.mkdir(outputDir, { recursive: true });
      const extractCmd = `"${this.SEVEN_ZIP_PATH}" x "${inputFile}" -o"${outputDir}" -y`;

      try {
        await this.execAsync(extractCmd);
      } catch (err) {
        if (err instanceof Error && 'code' in err) {
          const execErr = err as ExecError;
          if (
            execErr.code === 2 &&
            typeof execErr.stderr === 'string' &&
            execErr.stderr.includes('CRC Failed')
          ) {
            console.warn(
              '⚠️ Extração concluída com erros de CRC. Alguns arquivos podem estar corrompidos.',
            );
          } else {
            throw err;
          }
        }
      }
    } catch (e) {
      console.error(`Falha em descompactar arquivos: ${e}`);
      throw e;
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
      } catch (err) {
        if (err instanceof Error && 'code' in err) {
          const execErr = err as ExecError;

          if (
            execErr?.code === 2 &&
            typeof execErr.stderr === 'string' &&
            execErr.stderr.includes('CRC Failed')
          ) {
            console.warn(
              '⚠️ extractCoverWith7zip: CRC Failed detectado durante extração, continuando (não-fatal).',
              { inputFile, candidate: normalizedCandidate },
            );
          }
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

      await fse.mkdirp(tempDir);

      console.log(
        '🧰 safeExtract: executando extractWith7zip para pasta temporária...',
      );
      await this.extractWith7zip(inputFile, tempDir);
      console.log('✅ safeExtract: extração inicial concluída em:', tempDir);

      const entries = await fse.readdir(tempDir, { withFileTypes: true });
      const dirs = entries.filter((e) => e.isDirectory());
      const imageFiles = entries.filter(
        (e) => e.isFile() && /\.(jpe?g|jpeg|png|webp|gif)$/i.test(e.name),
      );

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

      const finalEntries = (
        await fse.readdir(tempDir, { withFileTypes: true })
      ).map((file) => path.join(tempDir, file.name));

      console.log(
        `🔎 safeExtract: total de entradas no temp: ${finalEntries.length}`,
      );

      const cover = this.fileManager.findFirstCoverFile(finalEntries);

      if (!cover) {
        console.warn(
          '⚠️ safeExtract: nenhuma capa encontrada nos conteúdos extraídos:',
          tempDir,
        );
        await this.cleanupExtractedCover(tempDir);
        return '';
      }

      console.log('🎯 safeExtract: candidato a capa encontrado:', cover);

      const parsed = path.parse(cover);
      const newName = this.fileManager
        .sanitizeImageName(parsed.name)
        .concat(parsed.ext);
      const destDir = path.resolve(outputPath);
      const destPath = path.join(destDir, newName);

      await fse.mkdirp(destDir);

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
}
