import jsonfile from "jsonfile";
import { FileSystem } from "./abstract/FileSystem";
import { NormalizedSerieData } from "../types/series.interfaces";
import { Collection, SerieCollectionInfo } from "../types/collections.interfaces";
import ValidationOperations from "./ValidationManager";

export default class CollectionsManager extends FileSystem {
    private readonly validationManager: ValidationOperations = new ValidationOperations();

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
            console.log("Tentando criar coleção:", collectionName);
            const date = new Date();

            let collections: Collection[] = [];
            try {
                const data = await jsonfile.readFile(this.appCollections, "utf-8");
                collections = Array.isArray(data) ? data : [];
            } catch (readError) {
                // Se ocorrer erro na leitura, assume que ainda não há coleções
                collections = [];
            }

            // Verifica se a coleção já existe
            const canCreate = await this.validationManager.collectionExist(collectionName);
            if (!canCreate) {
                console.log(`Coleção "${collectionName}" já existe. Não será criada.`);
                return;
            }

            console.log("Criando nova coleção:", collectionName);
            const newCollection: Collection = {
                name: collectionName,
                description: "",
                series: [],
                comments: [],
                updatedAt: date.toISOString()
            };

            // Adiciona a nova coleção e grava o arquivo
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

            const fileData: Collection[] = await jsonfile.readFile(this.appCollections, "utf-8");

            const updatedCollections = fileData.map((collection) => {
                if (serieData.collections.includes(collection.name)) {
                    const seriesExists = collection.series.some(
                        (serie) => serie.id === serieData.id
                    );

                    if (collection.name === "Favoritas") {
                        serieData.is_favorite = true
                    }

                    if (!seriesExists) {
                        const newSerie: SerieCollectionInfo = {
                            id: serieData.id,
                            name: serieData.name,
                            cover_image: serieData.cover_image,
                            comic_path: serieData.chapters_path,
                            archives_path: serieData.archive_path,
                            total_chapters: serieData.total_chapters,
                            status: serieData.status,
                            recommended_by: serieData.recommended_by || "",
                            original_owner: serieData.original_owner || "",
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
//             cover_image: "https://example.com/cover.jpg",
//             archive_path: "/path/to/series/raw/files",
//             chapters_path: "/path/to/series/processed/files",
//             total_chapters: 10,
//             status: "Em andamento",
//             is_favorite: false,
//             collections: ["Teste 10", "Teste 11", "Teste 12"],
//             recommended_by: "John Doe",
//             original_owner: "Jane Doe",
//             rating: 4.5
//         };

//         await collectionsManager.serieToCollection(serieData);
//         console.log("Série adicionada nas coleções com sucesso.");
//     } catch (error) {
//         console.error("Erro ao executar a função:", error);
//     }
// })();
