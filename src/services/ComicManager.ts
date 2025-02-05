import { SerieForm } from "../../src/types/series.interfaces";
import { FileSystem } from "./abstract/FileSystem";

// Método de criação dos quadrinhos e suas edições

export default class ComicManager extends FileSystem {
    constructor() {
        super()
    }

    public async createComic(serie: SerieForm) { }
}