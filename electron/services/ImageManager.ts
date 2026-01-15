// public async processCover(
//   child: ComicTieIn,
//   basePath: string,
// ): Promise<string> {
//   const entries = await fse.readdir(basePath, {
//     withFileTypes: true,
//   });

//   const firstChapterEntry = entries.find(
//     (e) => e.isFile() && /\.(cbz|cbr|zip|rar|PDF)$/i.test(e.name),
//   );

//   if (!firstChapterEntry) return '';

//   const firstChapter = path.join(basePath, firstChapterEntry.name);
//   const ext = path.extname(firstChapter);

//   const resultCover = await this.createChildCover(
//     child.serieName,
//     ext,
//     firstChapter,
//   );

//   return resultCover;
// }

// private async createChildCover(
//   childName: string,
//   ext: string,
//   firstChapter: string,
// ): Promise<string> {
//   let coverPath = '';

//   const outputPath = path.join(this.dinamicImages, childName);

//   if (ext === '.pdf') {
//     coverPath = await this.storageManager.extractCoverFromPdf(
//       firstChapter,
//       outputPath,
//     );
//   } else {
//     coverPath = await this.storageManager.extractCoverWith7zip(
//       firstChapter,
//       outputPath,
//     );
//   }

//   return coverPath;
// }
