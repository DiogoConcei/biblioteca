import "./Home.css";
import ComicCards from "../../components/comicCards/comicCards";

export default function Home() {
  const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();

    const files = event.dataTransfer.files;
    const filePaths = Array.from(files).map((file) => {
      return window.electron.webUtils.getPathForFile(file);
    });

    try {
      const newPaths = await Promise.all(
        await window.electron.handleDrop(filePaths)
      );
      await window.electron.createSerie(newPaths);
    } catch (error) {
      console.error("Erro ao carregar arquivos", error);
    }
  };

  return (
    <section className="series" onDragOver={handleDrag} onDrop={handleDrop}>
      <ComicCards />
    </section>
  );
}
