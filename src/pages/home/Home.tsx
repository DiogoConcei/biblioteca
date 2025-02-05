import "./Home.css";
import SearchBar from "../../components/SearchBar/SearchBar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import SeriesCards from "../../components/SeriesCards/SeriesCards";

export default function Home() {
  const [searchInput, setSearchInput] = useState<string>("");
  const navigate = useNavigate();

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
      const newSeries = await Promise.all(
        await window.electron.upload.localUpload(filePaths)
      );
      navigate("/local-upload/serie", { state: { newSeries } });
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
      <SeriesCards searchInput={searchInput} />
    </section>
  );
}
