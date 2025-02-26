import jsonfile from "jsonfile";
import FileSystem from "./abstract/FileSystem";
import { NormalizedSerieData } from "../types/series.interfaces";
import { Collection, SerieCollectionInfo } from "../types/collections.interfaces";
import ValidationManager from "./ValidationManager";

export default class CollectionsManager extends FileSystem {
    private readonly validationManager: ValidationManager = new ValidationManager();

    constructor() {
        super();
    }

    public async getCollections(): Promise<Collection[]> {
        try {
            const data: Collection[] = await jsonfile.readFile(this.appCollections, "utf-8");
            return data;
        } catch (e) {
            console.error(`Falha em obter todas as coleções: ${e}`);
            throw e;
        }
    }

    public async createCollection(collectionName: string): Promise<void> {
        try {
            const date = new Date();


            let collections: Collection[] = [];
            try {
                const data = await jsonfile.readFile(this.appCollections, "utf-8");
                collections = Array.isArray(data) ? data : [];
            } catch (readError) {
                collections = [];
            }

            const canCreate = await this.validationManager.collectionExist(collectionName);
            if (!canCreate) {
                return;
            }

            const newCollection: Collection = {
                name: collectionName,
                description: "",
                series: [],
                comments: [],
                updatedAt: date.toISOString()
            };

            collections.push(newCollection);
            await jsonfile.writeFile(this.appCollections, collections, { spaces: 2 });
        } catch (e) {
            console.error(`Falha em criar nova coleção: ${e}`);
            throw e;
        }
    }

    public async serieToCollection(serieData: NormalizedSerieData): Promise<void> {
        try {
            for (const collectionName of serieData.collections) {
                await this.createCollection(collectionName);
            }

            if (serieData.collections.includes("Favoritas")) {
                serieData.isFavorite = true
            }

            const fileData: Collection[] = await jsonfile.readFile(this.appCollections, "utf-8");

            const updatedCollections = fileData.map((collection) => {
                if (serieData.collections.includes(collection.name)) {
                    const seriesExists = collection.series.some(
                        (serie) => serie.id === serieData.id
                    );

                    if (collection.name === "Favoritas") {
                        serieData.isFavorite = true
                    }

                    if (!seriesExists) {
                        const newSerie: SerieCollectionInfo = {
                            id: serieData.id,
                            name: serieData.name,
                            coverImage: serieData.coverImage,
                            comic_path: serieData.chaptersPath,
                            archivesPath: serieData.archivesPath,
                            totalChapters: serieData.totalChapters,
                            status: serieData.status,
                            recommendedBy: serieData.recommendedBy || "",
                            originalOwner: serieData.originalOwner || "",
                            rating: serieData.rating
                        };

                        const date = new Date();
                        return {
                            ...collection,
                            series: [...collection.series, newSerie],
                            updatedAt: date.toISOString()
                        };
                    }
                }
                return collection;
            });

            await jsonfile.writeFile(this.appCollections, updatedCollections, { spaces: 2 });
        } catch (e) {
            console.error(`Falha em adicionar a série na coleção: ${e}`);
            throw e;
        }
    }

    public async getFavorites(collections: Collection[]): Promise<Collection> {
        try {
            const favCollection = collections.find((collection) => collection.name === "Favoritas");
            if (!favCollection) {
                throw new Error("Coleção de favoritos não encontrada.");
            }
            return favCollection;
        } catch (e) {
            console.error(`Erro ao recuperar a coleção de favoritos: ${e}`);
            throw e;
        }
    }

    public async updateFavCollection(collectionData: Collection[], collectionPath: string): Promise<void> {
        try {
            await jsonfile.writeFile(collectionPath, collectionData, { spaces: 2 });
        } catch (error) {
            console.error("Erro ao atualizar coleção de favoritos:", error);
            throw error;
        }
    }
}

// Exemplo de execução:
// (async () => {
//     try {
//         const collectionsManager = new CollectionsManager();
//         const serieData: NormalizedSerieData = {
//             id: 1,
//             name: "My Test Serie",
//             coverImage: "https://example.com/cover.jpg",
//             archivesPath: "/path/to/series/raw/files",
//             chaptersPath: "/path/to/series/processed/files",
//             totalChapters: 10,
//             status: "Em andamento",
//             isFavorite: false,
//             collections: ["Teste 10", "Teste 11", "Teste 12"],
//             recommendedBy: "John Doe",
//             originalOwner: "Jane Doe",
//             rating: 4.5
//         };

//         await collectionsManager.serieToCollection(serieData);
//         console.log("Série adicionada nas coleções com sucesso.");
//     } catch (error) {
//         console.error("Erro ao executar a função:", error);
//     }
// })();
