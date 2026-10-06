import { ChapterData } from '../types/upload.interfaces';

function guessChapterNumber(filename: string): string {
  const match = filename.match(/(\d+(?:\.\d+)?)/);
  return match ? match[1] : '';
}

export function toChapterForm(data: ChapterData) {
  return {
    ...data,
    cover_path: '',
    chapterNumber: guessChapterNumber(data.name),
    label: '',
  };
}
