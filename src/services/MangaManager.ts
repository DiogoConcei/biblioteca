import { Manga, MangaChapter } from "../types/manga.interfaces";
import { SerieForm } from "../types/series.interfaces";
import { FileSystem } from "./abstract/FileSystem";
import fs from "fs/promises"
import path from "path";
import FileOperations from "./FileManager";
import StorageManager from "./StorageManager";
import ImageOperations from "./ImageManager";
import SystemConfig from "./SystemManager";
import CollectionsManager from "./CollectionsManager";


export default class MangaManager extends FileSystem {
    private global_id: number
    private readonly imageManager: ImageOperations = new ImageOperations()
    private readonly fileManager: FileOperations = new FileOperations()
    private readonly storageManager: StorageManager = new StorageManager()
    private readonly collectionsOperations: CollectionsManager = new CollectionsManager()
    private readonly systemManager: SystemConfig = new SystemConfig()

    constructor() {
        super()
    }

    public async getChapter(dataPath: string, chapter_id: number): Promise<string[] | string> {
        try {
            const serieData = await this.storageManager.readSerieData(dataPath);
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

    public async createMangaChapters(serie: Manga): Promise<MangaChapter[]> {
        try {
            const unPaths = (await fs.readdir(serie.archives_path, { withFileTypes: true })).map((direntPath) => path.join(direntPath.parentPath, direntPath.name))
            const chaptersPath = await this.fileManager.orderByChapters(unPaths)

            const chapters = await Promise.all(chaptersPath.map(async (chapterPath, index) => {
                const name = path.basename(chapterPath, path.extname(chapterPath));
                const sanitized_name = this.fileManager.sanitizeFilename(name);

                return {
                    id: index + 1,
                    name: name,
                    sanitized_name: sanitized_name,
                    archive_path: path.resolve(chapterPath),
                    chapter_path: "",
                    created_at: serie.created_at,
                    is_read: false,
                    is_dowload: false,
                    page: {
                        last_page_read: 0,
                        favorite_page: 0
                    }
                }
            }))

            return chapters
        } catch (e) {
            console.error(`erro em criar capitulos do Manga: ${e}`)
            throw e
        }
    }

    public async createMangaData(serie: SerieForm): Promise<Manga> {
        try {
            this.global_id = await this.systemManager.getMangaId() + 1
            const total_chapters = (await fs.readdir(serie.archives_path, { withFileTypes: true })).length

            return {
                id: this.global_id,
                name: serie.name,
                sanitized_name: serie.sanitized_name,
                archives_path: serie.archives_path,
                chapters_path: serie.chapters_path,
                data_path: path.join(this.mangasData, `${serie.name}.json`),
                cover_image: serie.cover_path,
                total_chapters: total_chapters,
                genre: serie.genre,
                author: serie.author,
                language: serie.language,
                literatureForm: serie.literatureForm,
                chapters_read: 0,
                reading_data: {
                    last_chapter_id: 1,
                    last_read_at: ""
                },
                chapters: [],
                metadata: {
                    status: serie.readingStatus,
                    collections: serie.collections,
                    recommended_by: "",
                    original_owner: "",
                    last_download: 0,
                    rating: 0,
                    is_favorite: false,
                    privacy: serie.privacy,
                    autoBackup: serie.autoBackup
                },

                deleted_at: serie.deleted_at,
                created_at: serie.created_at,
                comments: [],
            }
        } catch (e) {
            console.error(`erro ao criar dados para o manga: ${e}`)
            throw e
        }
    }

    public async createManga(serie: SerieForm): Promise<void> {
        try {
            const MangaData = await this.createMangaData(serie)
            const MangaChapters = await this.createMangaChapters(MangaData)
            MangaData.chapters = MangaChapters
            const MangaCoverPath = await this.fileManager.uploadCover(MangaData.cover_image)
            MangaData.cover_image = MangaCoverPath
            const NormalizedMangaData = this.storageManager.createNormalizedData(MangaData)
            this.collectionsOperations.serieToCollection(NormalizedMangaData)

            if (MangaData.metadata.collections.includes("Favoritas")) {
                MangaData.metadata.is_favorite = true
            }

            await this.storageManager.writeSerieData(MangaData)

            this.systemManager.setMangaId(this.global_id)
        } catch (error) {
            console.error(`Erro ao gerar conteúdo para o manga: ${error}`)
            throw error
        }
    }

}

// (async () => {
//     try {
//         const MangaOperations = new MangaManager();
//         const dataPath = "C:\\Users\\Diogo\\Downloads\\Code\\gerenciador-de-arquivos\\storage\\data store\\json files\\Mangas\\Dr. Stone.json"
//         console.log(await MangaOperations.getChapter(dataPath, 1))
//     } catch (error) {
//         console.error('Erro ao executar a função:', error);
//     }
// })();
