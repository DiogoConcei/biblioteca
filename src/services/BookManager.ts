import { SerieForm } from "../../src/types/series.interfaces";
import FileSystem from "./abstract/FileSystem";

export default class BookManager extends FileSystem {
    constructor() {
        super()
    }

    public async createBook(serie: SerieForm) { }
}