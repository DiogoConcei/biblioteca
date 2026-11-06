import fse from 'fs-extra';
import path from 'path';

import LibrarySystem from '../abstract/LibrarySystem.ts';
import storageManager from '../StorageManager.ts';
import FileManager from '../FileManager.ts';
import {
  Literatures,
  LiteratureForm,
  graphChapter,
} from '../../types/electron-auxiliar.interfaces.ts';
import { Comic } from '../../types/comic.interfaces.ts';
import readline from 'node:readline/promises';

export default class MigrationManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly storageManager = storageManager;

  constructor() {
    super();
  }

  public async clearBookForm(): Promise<void> {
    try {
      const booksPath = this.booksData;
      if (!(await fse.pathExists(booksPath))) return;

      const files = await fse.readdir(booksPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(booksPath, file);
          const data = await fse.readJson(filePath);
          if (data.literatureForm !== 'Books') {
            data.literatureForm = 'Books';
            await fse.writeJson(filePath, data, { spaces: 2 });
            console.log(
              `[MigrationManager] Padronizado literatureForm para 'Books' em: ${file}`,
            );
          }
        }
      }
    } catch (e) {
      console.error('Erro ao limpar literatureForm dos livros:', e);
    }
  }

  public async fixId(): Promise<boolean> {
    try {
      const dataPaths = await this.fileManager.getDataPaths();

      const rawSeries = await Promise.all(
        dataPaths.map(async (rawData) => {
          const response = await this.storageManager.readSerieData(rawData);

          if (!response) return { id: -1 } as Literatures;

          return response;
        }),
      );

      rawSeries.sort((a, b) => {
        if (a.id == null) return 1;
        if (b.id == null) return -1;
        return a.id - b.id;
      });

      let lastId = -1;
      const usedIds = new Set<number>();

      for (let i = 0; i < rawSeries.length; i++) {
        const item = rawSeries[i];

        const isValidNumber =
          typeof item.id === 'number' &&
          Number.isFinite(item.id) &&
          !usedIds.has(item.id);

        if (isValidNumber) {
          usedIds.add(item.id);
          lastId = Math.max(lastId, item.id);
        } else {
          lastId += 1;
          item.id = lastId;
          usedIds.add(item.id);

          await this.storageManager.writeData(item);
        }
      }

      await this.setGlobalSerieId(lastId);
      return true;
    } catch (e) {
      console.error('Falha em organizar os identificadores');
      return false;
    }
  }

  // Fix Chapter ORDER
  public async fixChapterIds(dataPath: string): Promise<boolean> {
    const serie = await this.storageManager.readSerieData(dataPath);
    let order = 1.0;

    if (!serie?.chapters) return false;

    const chapters = await Promise.all(
      serie.chapters.map((ch) => {
        let parsed = this.fileManager.extractSerieInfo(ch.name);

        return {
          ...ch,
          order: order++,
          chapterNumber: {
            label: ch.name,
            value: parsed.chapter,
          },
        };
      }),
    );

    serie.chapters = chapters;
    await this.storageManager.writeData(serie);
    return true;
  }

  public async fixChildSeriePaths(dataPath: string): Promise<void> {
    const serieData = (await this.storageManager.readSerieData(dataPath)) as Comic;
    const childSeries = serieData.childSeries;

    if (!serieData.metadata.compiledComic || !childSeries) {
      return;
    }

    const archivesPath = serieData.archivesPath;

    for (const child of childSeries) {
      const result = await this.fileManager.findPath(archivesPath, child.serieName);

      if (result) {
        child.archivesPath = result;
      }
    }

    await this.storageManager.writeData(serieData);
  }

  public async migrateNewFields(): Promise<boolean> {
    try {
      const dataPaths = await this.fileManager.getDataPaths();
      let updatedCount = 0;

      for (const dataPath of dataPaths) {
        const serie = await this.storageManager.readSerieData(dataPath);
        if (!serie) continue;

        let needsUpdate = false;

        // 1. Garante a inicialização da descrição
        if (typeof serie.description !== 'string') {
          serie.description = '';
          needsUpdate = true;
        }

        // 2. Define os caminhos esperados para a galeria
        const expectedSerieGallery = path.join(this.gallery, serie.name);
        const expectedCoverGallery = path.join(expectedSerieGallery, 'covers');
        const expectedPagesGallery = path.join(expectedSerieGallery, 'pages');

        if (serie.serieGallery !== expectedSerieGallery) {
          serie.serieGallery = expectedSerieGallery;
          needsUpdate = true;
        }
        if (serie.coverGallery !== expectedCoverGallery) {
          serie.coverGallery = expectedCoverGallery;
          needsUpdate = true;
        }
        if (serie.pagesGallery !== expectedPagesGallery) {
          serie.pagesGallery = expectedPagesGallery;
          needsUpdate = true;
        }

        // Salva no disco apenas se a estrutura JSON sofreu alteração
        if (needsUpdate) {
          await this.storageManager.writeData(serie);
          updatedCount++;
        }
      }

      console.log(
        `[MigrationManager] Migração de estrutura concluída. ${updatedCount} séries foram atualizadas com os novos campos.`,
      );
      return true;
    } catch (e) {
      console.error('Falha ao adicionar novos campos no JSON:', e);
      return false;
    }
  }

  public async migrateCoversToGallery(): Promise<boolean> {
    try {
      const dataPaths = await this.fileManager.getDataPaths();
      let updatedCount = 0;

      for (const dataPath of dataPaths) {
        const serie = await this.storageManager.readSerieData(dataPath);
        if (!serie) continue;

        let needsUpdate = false;

        const expectedSerieGallery =
          serie.serieGallery || path.join(this.gallery, serie.name);
        const expectedCoverGallery =
          serie.coverGallery || path.join(expectedSerieGallery, 'covers');
        const expectedPagesGallery =
          serie.pagesGallery || path.join(expectedSerieGallery, 'pages');

        await fse.ensureDir(expectedCoverGallery);
        await fse.ensureDir(expectedPagesGallery);

        if (serie.coverImage && typeof serie.coverImage === 'string') {
          if (
            !serie.coverImage.startsWith('data:') &&
            !serie.coverImage.startsWith('http')
          ) {
            if (await fse.pathExists(serie.coverImage)) {
              const isAlreadyInGallery = serie.coverImage.includes(expectedCoverGallery);

              if (!isAlreadyInGallery) {
                const fileName = path.basename(serie.coverImage);
                const newCoverPath = path.join(expectedCoverGallery, fileName);

                try {
                  await fse.move(serie.coverImage, newCoverPath, { overwrite: true });

                  serie.coverImage = newCoverPath;
                  needsUpdate = true;

                  console.log(
                    `[Migration] Capa movida fisicamente para galeria: ${serie.name}`,
                  );
                } catch (moveErr) {
                  console.error(`Erro ao mover capa da série ${serie.name}:`, moveErr);
                }
              }
            }
          }
        }

        if (needsUpdate) {
          await this.storageManager.writeData(serie);
          updatedCount++;
        }
      }

      console.log(
        `[MigrationManager] Organização física concluída. ${updatedCount} capas foram movidas.`,
      );
      return true;
    } catch (e) {
      console.error('Falha ao criar pastas ou mover capas para a galeria:', e);
      return false;
    }
  }

  public async migrateCoverPathsFromSeriesSource(): Promise<boolean> {
    try {
      const dataPaths = await this.fileManager.getDataPaths();
      // Mapeia o nome da série (ou ID) para o caminho oficial da capa que está no JSON
      // Ex: "Naruto" -> "C:\...\gallery\Naruto\covers\capa.webp"
      const officialCoverMap = new Map<string, string>();
      const pathAliasMap = new Map<string, string>(); // De caminho antigo para o caminho novo oficial

      // ==========================================
      // PASSO 1: Ler a fonte de verdade (JSONs das Séries)
      // ==========================================
      for (const dataPath of dataPaths) {
        const serie = await this.storageManager.readSerieData(dataPath);
        if (!serie || !serie.name || !serie.coverImage) continue;

        // Ignora se for base64 ou URL web
        if (serie.coverImage.startsWith('data:') || serie.coverImage.startsWith('http')) {
          continue;
        }

        const officialCover = serie.coverImage;
        officialCoverMap.set(serie.name.toLowerCase(), officialCover);

        // Se você tiver uma forma de identificar caminhos antigos que ainda aparecem soltos,
        // podemos mapear aqui, mas o foco principal é garantir que os registros usem o officialCover.
      }

      console.log(
        `[MigrationSource] ${officialCoverMap.size} séries carregadas como fonte de verdade.`,
      );

      // ==========================================
      // PASSO 2: Atualizar o Histórico (history.json)
      // ==========================================
      if (await fse.pathExists(this.historyFile)) {
        try {
          const historyData = await fse.readJson(this.historyFile);
          let historyUpdated = false;

          if (historyData && Array.isArray(historyData.summaries)) {
            for (const summary of historyData.summaries) {
              // Se o histórico tem o nome da série ou algum identificador que bate com a fonte de verdade
              if (summary.name && typeof summary.name === 'string') {
                const serieNameLower = summary.name.toLowerCase();
                if (officialCoverMap.has(serieNameLower)) {
                  const correctCover = officialCoverMap.get(serieNameLower)!;
                  if (summary.coverImage !== correctCover) {
                    summary.coverImage = correctCover;
                    historyUpdated = true;
                  }
                }
              }
            }
          }

          if (historyUpdated) {
            await fse.writeJson(this.historyFile, historyData, { spaces: 2 });
            console.log(
              '[MigrationSource] history.json atualizado com as capas oficiais das séries.',
            );
          }
        } catch (histErr) {
          console.error('Erro ao atualizar o histórico:', histErr);
        }
      }

      // ==========================================
      // PASSO 3: Atualizar Coleções (appCollections.json)
      // ==========================================
      if (await fse.pathExists(this.appCollections)) {
        try {
          const collectionsData = await fse.readJson(this.appCollections);
          let collectionsUpdated = false;

          // Função recursiva para varrer o JSON de coleções e atualizar capas baseadas no nome da série ou correspondência
          const updateCollectionsRecursive = (obj: any): boolean => {
            let changed = false;
            if (!obj || typeof obj !== 'object') return false;

            for (const key of Object.keys(obj)) {
              const val = obj[key];

              // Se o objeto atual representa um item que tem 'name' e 'coverImage'
              if (
                val &&
                typeof val === 'object' &&
                'name' in val &&
                'coverImage' in val
              ) {
                const nameKey = String(val.name).toLowerCase();
                if (officialCoverMap.has(nameKey)) {
                  const correctCover = officialCoverMap.get(nameKey)!;
                  if (val.coverImage !== correctCover) {
                    val.coverImage = correctCover;
                    changed = true;
                  }
                }
              } else if (typeof val === 'object') {
                if (updateCollectionsRecursive(val)) changed = true;
              }
            }
            return changed;
          };

          if (updateCollectionsRecursive(collectionsData)) {
            await fse.writeJson(this.appCollections, collectionsData, { spaces: 2 });
            collectionsUpdated = true;
            console.log(
              '[MigrationSource] appCollections.json atualizado com as capas oficiais das séries.',
            );
          }
        } catch (colErr) {
          console.error('Erro ao atualizar as coleções:', colErr);
        }
      }

      console.log('[MigrationSource] Sincronização de capas concluída com sucesso!');
      return true;
    } catch (e) {
      console.error('Falha crítica ao sincronizar capas usando a fonte de verdade:', e);
      return false;
    }
  }

  public async fixMisplacedChapters(apply = false): Promise<void> {
    const rl = apply
      ? readline.createInterface({ input: process.stdin, output: process.stdout })
      : null;

    try {
      const dataPaths = await this.fileManager.getDataPaths();

      for (const dataPath of dataPaths) {
        const serie = await this.storageManager.readSerieData(dataPath);
        if (!serie?.chapters) continue;

        const form = this.fileManager.foundLiteratureForm(dataPath);
        if (form === LiteratureForm.COMIC) continue; // comic em comicsImages está certo

        const rightRoot = this.expectedRoot(form);
        let changed = false;

        for (const ch of serie.chapters) {
          if (!ch.chapterPath || !this.isInside(ch.chapterPath, this.comicsImages))
            continue;

          const rel = path.relative(this.comicsImages, ch.chapterPath);
          const target = path.join(rightRoot, rel);
          const onDisk = await fse.pathExists(ch.chapterPath);

          console.log(
            `\n[${serie.name}] cap ${ch.id} (${ch.isDownloaded})\n` +
              `  atual:    ${ch.chapterPath}${onDisk ? '' : '  (não existe no disco)'}\n` +
              `  deveria:  ${target}`,
          );

          if (!rl) continue;
          const answer = (await rl.question('  Corrigir? [s/N] ')).trim().toLowerCase();
          if (answer !== 's') continue;

          try {
            if (onDisk) await fse.move(ch.chapterPath, target); // não sobrescreve
            ch.chapterPath = target;
            changed = true;
          } catch (e) {
            console.error(`  Falha ao mover: ${(e as Error).message}`);
          }
        }

        if (changed) await this.storageManager.writeData(serie);
      }
    } finally {
      rl?.close();
    }
  }

  public async auditChapterPaths(apply = false): Promise<void> {
    const rl = apply
      ? readline.createInterface({ input: process.stdin, output: process.stdout })
      : null;
    let total = 0,
      bad = 0;

    try {
      for (const dataPath of await this.fileManager.getDataPaths()) {
        const serie = await this.storageManager.readSerieData(dataPath);
        if (!serie?.chapters) continue;

        const rightRoot = this.expectedRoot(
          this.fileManager.foundLiteratureForm(dataPath),
        );
        let changed = false;

        for (const ch of serie.chapters) {
          total++;
          const { expected, problems, onDisk, hasFiles } = await this.diagnoseChapter(
            ch,
            rightRoot,
          );
          if (problems.length === 0) continue;
          bad++;

          console.log(
            `\n[${serie.name}] cap ${ch.id} "${ch.name}" (${ch.isDownloaded})\n` +
              `  problemas: ${problems.join('; ')}\n` +
              `  atual:     ${ch.chapterPath || '(vazio)'}\n` +
              `  esperado:  ${expected}`,
          );
          if (!rl) continue;

          const answer = (await rl.question('  Corrigir caminho? [s/N] '))
            .trim()
            .toLowerCase();
          if (answer !== 's') continue;

          try {
            const canMove =
              onDisk &&
              hasFiles &&
              ch.isDownloaded === 'downloaded' &&
              path.resolve(ch.chapterPath) !== path.resolve(expected);

            if (canMove) {
              if (await fse.pathExists(expected)) {
                console.log('  Destino já existe, pulando para não sobrescrever.');
                continue;
              }
              await fse.move(ch.chapterPath, expected);
            }
            ch.chapterPath = expected;
            changed = true;
          } catch (e) {
            console.error(`  Falha: ${(e as Error).message}`);
          }
        }

        if (changed) await this.storageManager.writeData(serie);
      }
      console.log(`\nAuditoria: ${bad} de ${total} capítulos com problema.`);
    } finally {
      rl?.close();
    }
  }

  public async migrateMangaChapters(apply = false): Promise<void> {
    type Move = { from: string; to: string; onDisk: boolean };
    const plan: { dataPath: string; moves: Move[] }[] = [];

    // 1. Planejamento (não altera nada)
    for (const dataPath of await this.fileManager.getDataPaths()) {
      if (this.fileManager.foundLiteratureForm(dataPath) !== LiteratureForm.MANGA)
        continue;

      const serie = await this.storageManager.readSerieData(dataPath);
      if (!serie?.chapters) continue;

      const moves: Move[] = [];
      for (const ch of serie.chapters) {
        if (!ch.chapterPath || !this.isInside(ch.chapterPath, this.comicsImages))
          continue;

        const rel = path.relative(this.comicsImages, ch.chapterPath);
        moves.push({
          from: ch.chapterPath,
          to: path.join(this.mangasImages, rel),
          onDisk: await fse.pathExists(ch.chapterPath),
        });
      }
      if (moves.length) plan.push({ dataPath, moves });
    }

    const total = plan.reduce((n, p) => n + p.moves.length, 0);
    const toMove = plan.reduce((n, p) => n + p.moves.filter((m) => m.onDisk).length, 0);
    for (const p of plan) {
      console.log(`\n${path.basename(p.dataPath)}: ${p.moves.length} capítulo(s)`);
      p.moves.slice(0, 2).forEach((m) => console.log(`  ${m.from}\n  -> ${m.to}`));
    }
    console.log(
      `\n${plan.length} séries, ${total} capítulos no JSON, ${toMove} pastas a mover.`,
    );

    if (!apply || total === 0) return;

    // 2. Confirmação única
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = (await rl.question('Aplicar? [s/N] ')).trim().toLowerCase();
    rl.close();
    if (answer !== 's') return;

    // 3. Execução: move o disco primeiro, grava o JSON da série só depois
    for (const { dataPath, moves } of plan) {
      const serie = await this.storageManager.readSerieData(dataPath);
      if (!serie) continue;

      let changed = false;
      for (const m of moves) {
        const ch = serie.chapters.find((c) => c.chapterPath === m.from);
        if (!ch) continue;

        try {
          if (m.onDisk) {
            if (await fse.pathExists(m.to)) {
              console.warn(`Destino já existe, pulando: ${m.to}`);
              continue;
            }
            await fse.move(m.from, m.to);
          }
          ch.chapterPath = m.to;
          changed = true;
        } catch (e) {
          console.error(`Falha em ${m.from}: ${(e as Error).message}`);
        }
      }

      if (changed) await this.storageManager.writeData(serie);

      // limpa a pasta da série em comic se ficou vazia (rmdir não apaga se tiver conteúdo)
      const oldSerieDir = path.dirname(moves[0].from);
      if (this.isInside(oldSerieDir, this.comicsImages)) {
        await fse.rmdir(oldSerieDir).catch(() => {});
      }
    }
    console.log('Migração concluída.');
  }

  private isInside(target: string, root: string): boolean {
    const rel = path.relative(path.resolve(root), path.resolve(target));
    return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
  }

  private expectedRoot(form: LiteratureForm): string {
    switch (form) {
      case LiteratureForm.MANGA:
        return this.mangasImages;
      case LiteratureForm.COMIC:
        return this.comicsImages;
      case LiteratureForm.BOOK:
        return this.booksImages; // confirme o nome no LibrarySystem
      default:
        throw new Error(`Tipo sem raiz definida: ${form}`);
    }
  }

  private async diagnoseChapter(
    ch: graphChapter,
    rightRoot: string,
  ): Promise<{
    expected: string;
    problems: string[];
    onDisk: boolean;
    hasFiles: boolean;
  }> {
    // mesma fórmula do generateChapter
    const expected = await this.fileManager.buildChapterPath(
      rightRoot,
      ch.serieName,
      this.fileManager.sanitizeDirName(ch.name),
    );

    const problems: string[] = [];
    const onDisk = !!ch.chapterPath && (await fse.pathExists(ch.chapterPath));
    const hasFiles = onDisk && (await fse.readdir(ch.chapterPath)).length > 0;

    if (!ch.chapterPath) problems.push('chapterPath vazio');
    else {
      if (!this.isInside(ch.chapterPath, rightRoot))
        problems.push('fora da raiz do tipo');
      if (path.resolve(ch.chapterPath) !== path.resolve(expected))
        problems.push('diferente do caminho esperado');
    }
    if (ch.isDownloaded === 'downloaded' && !hasFiles)
      problems.push('marcado como downloaded, mas pasta ausente/vazia');
    if (ch.isDownloaded === 'not_downloaded' && hasFiles)
      problems.push('not_downloaded, mas há arquivos no disco');

    return { expected, problems, onDisk, hasFiles };
  }

  private sameFsPath(a: string, b: string): boolean {
    const na = path.resolve(a);
    const nb = path.resolve(b);
    return process.platform === 'win32'
      ? na.toLowerCase() === nb.toLowerCase()
      : na === nb;
  }

  public async fixChapterPaths(apply = false): Promise<void> {
    type Item = {
      id: number;
      name: string;
      from: string;
      to: string;
      action: 'move' | 'rewrite' | 'skip';
      note?: string;
    };
    const plan: {
      dataPath: string;
      serieName: string;
      chaptersPath: string;
      items: Item[];
    }[] = [];

    // 1. Planejamento (não altera nada)
    for (const dataPath of await this.fileManager.getDataPaths()) {
      if (this.fileManager.foundLiteratureForm(dataPath) === LiteratureForm.BOOK)
        continue;

      const serie = await this.storageManager.readSerieData(dataPath);
      if (!serie?.chapters?.length || !serie.chaptersPath) continue;

      const items: Item[] = [];
      const seen = new Set<string>();

      for (const ch of serie.chapters) {
        if (!ch.archivesPath) continue;

        const fileName = path
          .basename(ch.archivesPath, path.extname(ch.archivesPath))
          .replaceAll('#', '');
        const to = this.fileManager.buildChapterDir(serie.chaptersPath, fileName);
        const from = ch.chapterPath ?? '';

        if (from && this.sameFsPath(from, to)) continue; // já está certo

        const base = { id: ch.id, name: ch.name, from, to };
        const key = to.toLowerCase();

        if (seen.has(key)) {
          items.push({
            ...base,
            action: 'skip',
            note: 'destino duplicado (mesmo nome de arquivo)',
          });
          continue;
        }
        seen.add(key);

        const onDisk = !!from && (await fse.pathExists(from));

        if (!onDisk) {
          items.push({
            ...base,
            action: 'rewrite',
            note:
              ch.isDownloaded === 'downloaded'
                ? 'downloaded, mas sem pasta no disco'
                : undefined,
          });
        } else if (!this.isInside(from, this.imagesFolder)) {
          items.push({ ...base, action: 'skip', note: 'origem fora de images files' });
        } else if (await fse.pathExists(to)) {
          items.push({ ...base, action: 'skip', note: 'destino já existe' });
        } else {
          items.push({ ...base, action: 'move' });
        }
      }

      if (items.length) {
        plan.push({
          dataPath,
          serieName: serie.name,
          chaptersPath: serie.chaptersPath,
          items,
        });
      }
    }

    // 2. Relatório
    let moves = 0,
      rewrites = 0,
      skips = 0;
    for (const p of plan) {
      console.log(`\n[${p.serieName}] ${p.items.length} capítulo(s)`);
      for (const it of p.items) {
        if (it.action === 'move') moves++;
        else if (it.action === 'rewrite') rewrites++;
        else skips++;
        console.log(
          `  ${it.action.toUpperCase()} cap ${it.id} "${it.name}"${it.note ? ` (${it.note})` : ''}\n` +
            `    ${it.from || '(vazio)'}\n    -> ${it.to}`,
        );
      }
    }
    console.log(
      `\n${plan.length} séries: ${moves} pastas a mover, ${rewrites} só no JSON, ${skips} puladas.`,
    );
    if (!apply || moves + rewrites === 0) return;

    // 3. Confirmação única
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ok = (await rl.question('Aplicar? [s/N] ')).trim().toLowerCase() === 's';
    rl.close();
    if (!ok) return;

    // 4. Execução: disco primeiro, JSON da série depois
    for (const p of plan) {
      const serie = await this.storageManager.readSerieData(p.dataPath);
      if (!serie) continue;

      const oldDirs = new Set<string>();
      let changed = false;

      for (const it of p.items) {
        if (it.action === 'skip') continue;
        const ch = serie.chapters.find((c) => c.id === it.id);
        if (!ch) continue;

        try {
          if (it.action === 'move') {
            if (await fse.pathExists(it.to)) continue; // reconfere, sem sobrescrever
            await fse.move(it.from, it.to);
            oldDirs.add(path.dirname(it.from));
          }
          ch.chapterPath = it.to;
          changed = true;
        } catch (e) {
          console.error(`Falha em "${it.name}" (${it.from}): ${(e as Error).message}`);
        }
      }

      if (changed) await this.storageManager.writeData(serie);

      // remove pastas antigas de série que ficaram vazias (rmdir não apaga se tiver conteúdo)
      for (const d of oldDirs) {
        if (this.isInside(d, this.imagesFolder) && !this.sameFsPath(d, p.chaptersPath)) {
          await fse.rmdir(d).catch(() => {});
        }
      }
    }
    console.log('Migração concluída.');
  }
}

// (async () => {
//   console.log('Iniciando migração global de caminhos de capa...');
// const migrationManager = new MigrationManager();
// await migrationManager.fixChapterPaths(true);
//   await migrationManager.migrateCoverPathsFromSeriesSource();
//   console.log('Migração global finalizada!');
// })();
