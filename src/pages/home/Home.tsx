import './Home.scss';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import SearchBar from '../../components/SearchBar/SearchBar';
// import SeriesCards from "../../components/SeriesCards/SeriesCards";

export default function Home() {
  const [searchInput, setSearchInput] = useState<string>('');
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

    const filePaths = Array.from(files).map(file => {
      return window.electronAPI.webUtilities.getPathForFile(file);
    });

    try {
      const newSeries = await Promise.all(await window.electronAPI.upload.processSerie(filePaths));
      navigate('/local-upload/serie', { state: { newSeries } });
    } catch (error) {
      console.error('Erro ao carregar arquivos', error);
      throw error;
    }
  };

  return (
    <section className="home" onDragOver={handleDrag} onDrop={handleDrop}>
      <SearchBar searchInput={searchInput} onSearchChange={searchChange} />
      {/* <SeriesCards searchInput={searchInput} /> */}
    </section>
  );
}
