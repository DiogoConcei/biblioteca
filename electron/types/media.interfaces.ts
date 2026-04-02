export type MediaType = 'comic' | 'book' | 'pdf';

export interface ChapterResource {
  id: string;
  label: string;
  path: string; // URL do protocolo lib-media://
}

export interface MediaContent {
  type: MediaType;
  resources: string[] | ChapterResource[]; 
  originalPath?: string; // URL para o arquivo original (PDF ou EPUB)
  totalResources: number;
}

export interface MediaAdapter {
  /**
   * Extrai ou aponta para as páginas/capítulos do arquivo.
   */
  getPages(chapterPath: string): Promise<MediaContent>;

  /**
   * Obtém a capa do arquivo.
   */
  getCover(seriesPath: string): Promise<string>;
}
