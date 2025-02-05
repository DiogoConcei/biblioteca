import jsonfile from "jsonfile"
import { FileSystem } from "./abstract/FileSystem";
import { NormalizedSerieData } from "../types/series.interfaces";
import { UserCollections, Collection, SerieCollectionInfo } from "../types/collections.interfaces";

export default class CollectionsManager extends FileSystem {
    constructor() {
        super()
    }

    public async getCollections(): Promise<Collection[]> {
        try {
            const data: Collection[] = await jsonfile.readFile(this.appCollections, "utf-8");
            return data
        } catch (e) {
            console.error(`Falha em combater todas as colecoes: ${e}`)
            throw e
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

            if (collections.some((collection) => collection.name === collectionName)) {
                console.log("Coleção já existente. Abandonando criação.");
                return;
            }

            console.log("passou")

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
            await Promise.all(
                serieData.collections.map((collectionName) =>
                    this.createCollection(collectionName)
                )
            );

            const fileData: Collection[] = await jsonfile.readFile(this.appCollections, "utf-8");

            const updatedCollections = fileData.map((collection) => {
                if (serieData.collections.includes(collection.name)) {
                    const seriesExists = collection.series.some(
                        (serie) => serie.id === serieData.id
                    );
                    if (!seriesExists) {
                        const newSerie: SerieCollectionInfo = {
                            id: serieData.id,
                            name: serieData.name,
                            cover_image: serieData.cover_image,
                            archive_path: serieData.archive_path,
                            total_chapters: serieData.total_chapters,
                            recommended_by: serieData.recommended_by,
                            original_owner: serieData.original_owner,
                            rating: serieData.rating,
                        };

                        return {
                            ...collection,
                            series: [...collection.series, newSerie],
                        };
                    }
                }
                return collection;
            });


            await jsonfile.writeFile(this.appCollections, updatedCollections, { spaces: 2 });
        } catch (e) {
            console.error(`Falha em adicionar na coleção: ${e}`);
            throw e;
        }
    }


    public async getFavorites(collections: Collection[]): Promise<Collection> {
        try {
            const findCollection = collections.find((collections) => collections.name === "Favoritas")
            return findCollection
        } catch (e) {
            console.error(`erro em recuperar todas favoritas`)
            throw e
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

// const normalizedSerieDataTest: NormalizedSerieData = {
//     id: 1,
//     name: "My Test Serie",
//     cover_image: "https://example.com/cover.jpg",
//     archive_path: "/path/to/series/raw/files",
//     chapters_path: "/path/to/series/processed/files",
//     total_chapters: 10,
//     status: "Em andamento",
//     is_favorite: false,
//     collections: ["Collection 1", "Collection 2"],
//     recommended_by: "John Doe",
//     original_owner: "Jane Doe",
//     rating: 4.5
// };

// const collectionsTest: Collection = {
//     name: "Collection 1",
//     description: "A collection of test series",
//     series: [],
//     comments: ["Great collection!", "Excited for more!"],
//     updatedAt: new Date().toISOString()
// };


(async () => {
    try {
        const collectionsManager = new CollectionsManager();
        // const serieData: NormalizedSerieData = {
        //     id: 1,
        //     name: "My Test Serie",
        //     cover_image: "https://example.com/cover.jpg",
        //     archive_path: "/path/to/series/raw/files",
        //     chapters_path: "/path/to/series/processed/files",
        //     total_chapters: 10,
        //     // status: "Em andamento",
        //     collections: ["Collection 1", "Collection 2"],
        //     recommended_by: "John Doe",
        //     original_owner: "Jane Doe",
        //     rating: 4.5
        // };
        console.log(await collectionsManager.getCollections())
    } catch (error) {
        console.error('Erro ao executar a função:', error);
    }
})();
