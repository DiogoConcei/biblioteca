import { Comic, ComicCollection, ComicConfig, ComicEdition } from "../types/comic.interfaces";
import { FileSystem } from "./abstract/FileSystem";
import fs from "fs/promises"
import path from "path";
import FileOperations from "./FileOperations";
import StorageManager from "./StorageManager";
import ImageOperations from "./ImageOperations";


export default class MangaManager extends FileSystem {
    private globalMangaId: number
    private readonly fileManager: FileOperations = new FileOperations()
    private readonly storageManager: StorageManager = new StorageManager()
    private readonly imageManager: ImageOperations = new ImageOperations()

    constructor() {
        super()
    }

    public async getChapter(serieName: string, chapter_id: number): Promise<string[] | string> {
        try {
            const serieData = await this.storageManager.selectSerieData(serieName);
            const chaptersData = serieData.chapters;
            const chapter = chaptersData.find((chap) => chap.id === chapter_id);
            const chapterDirents = await fs.readdir(chapter.chapter_path, { withFileTypes: true });

            const imageFiles = chapterDirents
                .filter(
                    (dirent) =>
                        dirent.isFile() &&
                        /\.(jpe?g|png|webp|tiff)$/i.test(dirent.name)
                )
                .map((dirent) => path.join(chapter.chapter_path, dirent.name));

            const processedImages = await this.imageManager.encodeImageToBase64(imageFiles)

            return processedImages
        } catch (error) {
            console.error(`Erro ao obter conteúdo do capítulo: ${error.message}`);
            throw error;
        }
    }

    public async createMangaData(series: string[]): Promise<Comic[]> {
        try {
            this.globalMangaId = await this.fileManager.getMangaId()
            const currentDate = new Date().toLocaleDateString();

            return await Promise.all(
                series.map(async (serie) => {
                    const id = ++this.globalMangaId;
                    const name = path.basename(serie);
                    const sanitizedName = this.fileManager.sanitizeFilename(name);

                    let chaptersPath = await this.foundFiles(serie);
                    chaptersPath = await this.fileManager.orderByChapters(chaptersPath)
                    const chaptersData = await this.createEditionData(chaptersPath, currentDate);
                    chaptersData[0].is_dowload = true

                    const comments: string[] = [];

                    return {
                        id,
                        name,
                        sanitized_name: sanitizedName,
                        archives_path: serie,
                        chapters_path: "",
                        cover_image: "",
                        total_chapters: chaptersData.length,
                        created_at: currentDate,
                        chapters_read: 0,
                        reading_data: {
                            last_chapter_id: 1,
                            last_read_at: "",
                        },
                        chapters: chaptersData,
                        metadata: {
                            status: "em andamento",
                            is_favorite: false,
                            recommended_by: "",
                            original_owner: "",
                            last_download: 0,
                            rating: 0,
                        },
                        comments: comments,
                    };
                })
            );
        } catch (error) {
            console.error(`erro ao criar dados principais: ${error}`);
            throw error;
        }
    }

    public async createEditionData(chaptersPath: string[], currentDate: string): Promise<ComicEdition[]> {
        return chaptersPath.map((chapter, index) => {
            const name = path.basename(chapter, path.extname(chapter));
            const sanitized_name = this.fileManager.sanitizeFilename(name);


            return {
                id: index + 1,
                name,
                sanitized_name,
                archive_path: path.resolve(chapter),
                chapter_path: "",
                create_date: currentDate,
                is_dowload: false,
                is_read: false,
                last_page_read: 0,
            };
        });
    }

    public async createManga(series: string[]): Promise<void> {
        try {
            const seriesData = await this.createMangaData(series);
            await Promise.all(seriesData.map((serieData) => this.storageManager.writeSerieData(serieData)));
            this.fileManager.setMangaId(this.globalMangaId)
        } catch (e) {
            console.error(`Erro ao armazenar o conteúdo: ${e}`);
            throw e;
        }
    }
}

// (async () => {
//     try {
//         const MangaOperations = new MangaManager();
//         await MangaOperations.createManga(["C:\\Users\\Diogo\\Downloads\\Code\\gerenciador-de-arquivos\\storage\\user library\\Books\\Dr. Stone"])
//     } catch (error) {
//         console.error('Erro ao executar a função:', error);
//     }
// })();
