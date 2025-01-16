import { IpcMain } from "electron";
import StorageManager from "../services/StorageManager";
import CollectionsOperations from "../services/CollectionsOperations";
import MangaManager from "../services/MangaManager";

export default function userHandlers(ipcMain: IpcMain) {
    const StorageOperations = new StorageManager()
    const MangaOperations = new MangaManager()
    const CollectionsManager = new CollectionsOperations()

    ipcMain.handle("rating-serie", async (_event, serieName: string, userRating: string) => {
        const serie = await StorageOperations.selectSerieData(serieName)

        if (!serie) {
            throw new Error(`Série com o nome "${serieName}" não encontrada.`);
        }

        const starsRating = [
            "1 - Péssimo",
            "2 - Horrível",
            "3 - Regular",
            "4 - Bom",
            "5 - Excelente",
        ];

        let caseIndex = starsRating.indexOf(userRating)

        switch (caseIndex) {
            case 0:
                serie.metadata.rating = 1
                break
            case 1:
                serie.metadata.rating = 2
                break
            case 2:
                serie.metadata.rating = 3
                break
            case 3:
                serie.metadata.rating = 4
                break
            case 4:
                serie.metadata.rating = 5
                break
        }

        await StorageOperations.updateserieData(JSON.stringify(serie), serieName);
    })

    ipcMain.handle("favorite-serie", async (_event, serieName: string) => {
        try {
            const serie = await StorageOperations.selectSerieData(serieName);

            if (!serie) {
                throw new Error(`Série com o nome "${serieName}" não encontrada.`);
            }

            const collections = await CollectionsManager.getCollections();
            const favCollection = collections.collections.find((collection) => collection.name === "Favorites");

            if (!favCollection) {
                throw new Error('Coleção de favoritos não encontrada.');
            }

            const favSerieJson = {
                id: serie.id,
                name: serie.name,
                cover_image: serie.cover_image,
                comic_path: serie.chapters_path,
                total_chapters: serie.total_chapters,
                status: serie.metadata.status,
                recommended_by: serie.metadata.recommended_by || "",
                original_owner: serie.metadata.original_owner || "",
                rating: serie.metadata.rating || 0
            };

            const newFavoriteStatus = !serie.metadata.is_favorite;

            const serieExists = favCollection.comics.some((series) => series.name === serieName);

            if (newFavoriteStatus && !serieExists) {
                favCollection.comics.push(favSerieJson);
            } else if (!newFavoriteStatus) {
                favCollection.comics = favCollection.comics.filter((series) => series.name !== serieName);
            }


            serie.metadata.is_favorite = newFavoriteStatus;

            await StorageOperations.updateserieData(JSON.stringify(serie), serieName);
            await StorageOperations.updateFavCollection(JSON.stringify(collections));

            return { success: true };
        } catch (error) {
            console.error(`Erro ao atualizar coleção de favoritos: ${error}`);
            return { success: false };
        }
    });



}

