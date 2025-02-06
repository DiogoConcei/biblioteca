import { FileSystem } from "./abstract/FileSystem";
import CollectionsManager from "./CollectionsManager";
import StorageManager from "./StorageManager";
import { SerieCollectionInfo } from "../types/collections.interfaces"
import { Manga } from "../types/manga.interfaces";
import { Collection } from "../types/collections.interfaces";
import { Comic } from "../types/comic.interfaces";
import { Book } from "../types/book.interfaces";
import { Literatures } from "../types/series.interfaces";

export default class UserManager extends FileSystem {
    private readonly CollectionsOperations: CollectionsManager = new CollectionsManager()
    private readonly storageOperations: StorageManager = new StorageManager()

    constructor() {
        super()
    }

    public ratingSerie(serieData: Literatures, userRating: number): Literatures {
        const starsRating = [
            "1 - Péssimo",
            "2 - Horrível",
            "3 - Regular",
            "4 - Bom",
            "5 - Excelente",
        ];

        let caseIndex = userRating

        switch (caseIndex) {
            case 0:
                serieData.metadata.rating = 1
                break
            case 1:
                serieData.metadata.rating = 2
                break
            case 2:
                serieData.metadata.rating = 3
                break
            case 3:
                serieData.metadata.rating = 4
                break
            case 4:
                serieData.metadata.rating = 5
                break
        }

        return serieData
    }

    public async favoriteSerie(serieData: Literatures): Promise<Literatures> {
        try {
            const collections: Collection[] = await this.CollectionsOperations.getCollections();
            const favCollection = await this.CollectionsOperations.getFavorites(collections);

            if (!favCollection) {
                throw new Error('Coleção de favoritos não encontrada.');
            }

            const favSerieJson: SerieCollectionInfo = {
                id: serieData.id,
                name: serieData.name,
                cover_image: serieData.cover_image,
                comic_path: serieData.chapters_path,
                archives_path: serieData.archives_path,
                total_chapters: serieData.total_chapters,
                status: serieData.metadata.status,
                recommended_by: serieData.metadata.recommended_by || "",
                original_owner: serieData.metadata.original_owner || "",
                rating: serieData.metadata.rating || 0
            };

            const newFavoriteStatus = !serieData.metadata.is_favorite;

            const serieExists = favCollection.series.some(
                (series) => series.name === serieData.name
            );

            if (newFavoriteStatus && !serieExists) {
                favCollection.series.push(favSerieJson);
            } else if (!newFavoriteStatus) {
                favCollection.series = favCollection.series.filter(
                    (series) => series.name !== serieData.name
                );
            }

            serieData.metadata.is_favorite = newFavoriteStatus;

            favCollection.updatedAt = new Date().toISOString();

            await this.CollectionsOperations.updateFavCollection(collections, this.appCollections);
            await this.storageOperations.updateSerieData(serieData, serieData.data_path);

            return serieData;
        } catch (e) {
            console.error(`Erro ao atualizar coleção de favoritos: ${e}`);
            throw e;
        }
    }

    public async markChapterRead(dataPath: string, chapter_id: number): Promise<void> {
        try {
            const serieData = await this.storageOperations.readSerieData(dataPath)
            const chapter = serieData.chapters.find((c) => c.id === chapter_id);

            if (chapter) chapter.is_read = true;

            await this.storageOperations.updateSerieData(serieData, serieData.data_path);
        } catch (error) {
            console.error(`Erro ao marcar capítulo como lido: ${error}`);
            throw error;
        }
    }

}