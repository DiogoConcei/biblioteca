import './Home.scss';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import SearchBar from '../../components/SearchBar/SearchBar.tsx';
import { useSeries } from '../../hooks/useSerieHook.ts';

export default function Home() {
  const [searchInput, setSearchInput] = useState<string>('');
  const navigate = useNavigate();

  const series = useSeries();

  const searchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setSearchInput(event.target.value);
  };

  const filteredSeries = series.filter(serie => {
    const nomeMinusculo = serie.name.toLowerCase();
    const termoMinusculo = searchInput.toLowerCase();

    const normalizedSerieName = nomeMinusculo.replace(/\s+/g, '');
    const normalizedSearchTerm = termoMinusculo.replace(/\s+/g, '');

    return termoMinusculo === '' || normalizedSerieName.includes(normalizedSearchTerm);
  });

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
      const response = await window.electronAPI.upload.processSerie(filePaths);
      const serieData = response.data;
      navigate('/local-upload/serie', { state: { serieData } });
    } catch (error) {
      console.error('Erro ao carregar arquivos', error);
      throw error;
    }
  };

  return (
    <section className="home" onDragOver={handleDrag} onDrop={handleDrop}>
      <SearchBar searchInput={searchInput} onSearchChange={searchChange} />

      <div className="content">
        <div className="seriesContent">
          {filteredSeries.map(serie => (
            <Link
              to={`${serie.literatureForm}/${serie.name}/${serie.id}`}
              key={serie.id}
              className="serieLink"
            >
              <figure className="coverCard">
                <img src={`data:image;base64,${serie.coverImage}`} alt={`Série: ${serie.name}`} />
                <figcaption>
                  {/* Se quiser reativar ícone de play:
                  <FaPlay
                    className="playChapter"
                    onClick={(e) => lastChapter(e, serie.dataPath)}
                  /> */}
                </figcaption>
              </figure>
              <div className="serie-info">
                <p className="serie-name">{serie.name}</p>
                <div className="progress-bar">
                  <div
                    className="progress-bar-completed"
                    style={{
                      width: `${(serie.chaptersRead / serie.totalChapters) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="readsInfo">
                  <p>{serie.chaptersRead}</p>
                  <p>{serie.totalChapters}</p>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
