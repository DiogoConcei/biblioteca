import "./Home.css";
import ComicCards from "../../components/ComicCards/ComicCards";
import SearchBar from "../../components/SearchBar/SearchBar";
import { useState } from "react";

export default function Home() {
  const [searchInput, setSearchInput] = useState<string>("");

  const searchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setSearchInput(event.target.value);
  };

  const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();

    const files = event.dataTransfer.files;

    const filePaths = Array.from(files).map((file) => {
      if (!window.electron?.webUtilities?.getPathForFile) {
        throw new Error("A função getPathForFile não está definida.");
      }
      return window.electron.webUtilities.getPathForFile(file);
    });

    try {
      const newPaths = await Promise.all(
        await window.electron.upload.localUpload(filePaths)
      );
      await window.electron.series.createSerie(newPaths);
    } catch (error) {
      console.error("Erro ao carregar arquivos", error);
      throw error;
    }
  };

  const contextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    window.electron.contextMenu.show();
  };

  return (
    <section
      className="home"
      onContextMenu={contextMenu}
      onDragOver={handleDrag}
      onDrop={handleDrop}>
      <SearchBar searchInput={searchInput} onSearchChange={searchChange} />
      <ComicCards searchInput={searchInput} />
    </section>
  );
}
