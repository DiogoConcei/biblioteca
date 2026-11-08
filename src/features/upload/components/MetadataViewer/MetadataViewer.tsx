import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';
import styles from './MetadataViewer.module.scss';
import { ScrapedMetadata } from '@/shared/types/collections.interfaces';

interface MetadataProps {
  onClose: (value: boolean) => void;
  onSelect?: (metadata: ScrapedMetadata) => void;
}

export default function MetadataViewer({ onClose, onSelect }: MetadataProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'manga' | 'comic'>('manga');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');

  const [results, setResults] = useState<ScrapedMetadata[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await window.electronAPI.metadata.fetchMetadata(
        title,
        type,
        year ? parseInt(year) : undefined,
        author || undefined,
      );

      if (response.success && response.data) {
        setResults(response.data);
        setCurrentIndex(0);
      } else {
        setError('Nenhum resultado encontrado.');
        setResults([]);
      }
    } catch (err) {
      setError('Erro ao buscar metadados.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
  }, [results.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Navegação pelo teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (results.length === 0) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results.length, handleNext, handlePrev]);

  const currentItem = results[currentIndex];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Busca de Metadados</h2>
          <button
            type="button"
            className={styles.closeIcon}
            onClick={() => onClose(false)}
          >
            ✕
          </button>
        </div>

        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Título da obra..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'manga' | 'comic')}
          >
            <option value="manga">Manga</option>
            <option value="comic">Comic</option>
          </select>
          <input
            type="text"
            placeholder="Autor (Opcional)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <input
            type="number"
            placeholder="Ano (Opcional)"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
          <button type="submit" disabled={isLoading} className={styles.btnSearch}>
            {isLoading ? (
              <Loader2 className={styles.spinner} size={20} />
            ) : (
              <Search size={20} />
            )}
          </button>
        </form>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {/* Carrossel de Resultados */}
        <div className={styles.carouselContainer}>
          {!isLoading && results.length === 0 && !error && (
            <div className={styles.emptyState}>
              <p>Insira as informações acima e faça a busca.</p>
            </div>
          )}

          {!isLoading && results.length > 0 && currentItem && (
            <div className={styles.carouselView}>
              {/* Background desfocado com a capa da série */}
              <div
                className={styles.carouselBg}
                style={{ backgroundImage: `url(${currentItem.coverUrl || ''})` }}
              />

              <div className={styles.carouselContent}>
                {/* Seta Esquerda */}
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft size={32} />
                </button>

                {/* Conteúdo Central */}
                <div className={styles.itemDetails}>
                  <div className={styles.coverWrapper}>
                    {currentItem.coverUrl ? (
                      <img src={currentItem.coverUrl} alt="Capa" />
                    ) : (
                      <div className={styles.noCover}>Sem capa</div>
                    )}
                  </div>
                  <div className={styles.info}>
                    <h3>{currentItem.title}</h3>
                    <strong>Autor:</strong> {currentItem.authors?.join(', ')}
                    {currentItem.publishedAt?.slice(0, 4) && (
                      <p>
                        <strong>Ano:</strong> {currentItem.publishedAt?.slice(0, 4)}
                      </p>
                    )}
                    {currentItem.genres && (
                      <p>
                        <strong>Gêneros:</strong> {currentItem.genres.join(', ')}
                      </p>
                    )}
                    {currentItem.description && (
                      <p className={styles.synopsis}>{currentItem.description}</p>
                    )}
                  </div>
                </div>

                {/* Seta Direita */}
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={handleNext}
                  disabled={currentIndex === results.length - 1}
                >
                  <ChevronRight size={32} />
                </button>
              </div>

              {/* Indicadores (Pontos) */}
              <div className={styles.indicators}>
                {results.map((_, idx) => (
                  <span
                    key={idx}
                    className={`${styles.dot} ${idx === currentIndex ? styles.active : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={() => onClose(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.btnApply}
            disabled={results.length === 0}
            onClick={() => {
              if (onSelect) onSelect(currentItem);
              onClose(false);
            }}
          >
            Aplicar Metadados
          </button>
        </div>
      </div>
    </div>
  );
}
