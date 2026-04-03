import { useParams, Link } from 'react-router-dom';
import { Tag, BookOpen, User, Globe, LibraryBig } from 'lucide-react';

import { Book } from 'electron/types/book.interfaces';
import useAction from '@/hooks/useAction';

import Loading from '../../components/Loading/Loading';
import DownloadButton from '../../components/DonwloadButton/DownloadButton';
import Rating from '../../components/Rating/Rating';
import CollectionButton from '../../components/CollectionButton/CollectionButton';
import Favorite from '../../components/FavoriteButton/Favorite';
import useSerieStore from '../../store/useSerieStore';
import { useUIStore } from '../../store/useUIStore';
import useSerie from '../../hooks/useSerie';
import styles from './BookPage.module.scss';

export default function BookPage() {
  const { book_name: rawSerieName } = useParams<{ book_name: string }>();
  const serie_name = decodeURIComponent(rawSerieName ?? '');

  // Hook customizado busca a série na base de Livros
  useSerie(serie_name, 'Books');

  const serie = useSerieStore((state) => state.serie) as Book;
  const loading = useUIStore((state) => state.loading);
  const { lastChapter } = useAction();

  if (loading || !serie || !serie.chapters) {
    return <Loading />;
  }

  const tags = [...serie.tags].sort((a, b) => a.localeCompare(b));

  // Utilitário para converter path local em URL do protocolo
  const getImageUrl = (path: string) => {
    if (!path || path.startsWith('lib-media://') || path.startsWith('data:'))
      return path;
    // Codifica para Base64 seguro para URL
    const encoded = btoa(unescape(encodeURIComponent(path)));
    return `lib-media://local/${encoded}`;
  };

  // Cálculo de progresso de leitura
  // Livros geralmente têm 1 "capítulo" (o arquivo PDF/EPUB em si).
  // A leitura é baseada na página salva daquele arquivo.
  const mainFile = serie.chapters[0];
  const currentPage = mainFile?.page?.lastPageRead || 0;

  return (
    <main className={styles.bookPage}>
      {/* Background desfocado para imersão */}
      <div
        className={styles.heroBackground}
        style={{
          backgroundImage: `url('${getImageUrl(serie.coverImage)}')`,
        }}
      />
      <div className={styles.overlay} />

      <div className={styles.contentWrapper}>
        <section className={styles.bookHeader}>
          <figure className={styles.coverContainer}>
            <img
              src={getImageUrl(serie.coverImage)}
              alt={`Capa do livro ${serie.name}`}
              className={styles.coverImage}
            />
          </figure>

          <div className={styles.bookMetadata}>
            <div className={styles.titleSection}>
              <h1>{serie.name}</h1>
              <h2 className={styles.author}>
                <User size={18} /> {serie.author || 'Autor Desconhecido'}
              </h2>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span>Status</span>
                <p>{serie.metadata.status || 'Não iniciado'}</p>
              </div>
              <div className={styles.infoItem}>
                <span>Idioma</span>
                <p>
                  <Globe size={14} /> {serie.language || 'Desconhecido'}
                </p>
              </div>
              <div className={styles.infoItem}>
                <span>Gênero</span>
                <p>{serie.genre || 'Literatura'}</p>
              </div>
            </div>

            <div className={styles.tagsContainer}>
              {tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  <Tag size={12} /> {tag}
                </span>
              ))}
            </div>

            <div className={styles.actionsContainer}>
              <button
                className={styles.readButton}
                onClick={(e) => lastChapter(e, serie.id)}
              >
                <BookOpen size={20} />
                {currentPage > 0 ? 'Continuar Leitura' : 'Começar a Ler'}
              </button>

              <div className={styles.secondaryActions}>
                <Favorite serie={serie} />
                <CollectionButton dataPath={serie.dataPath} serieData={serie} />
                <DownloadButton serie={serie} />
                <Rating serie={serie} />
              </div>
            </div>
          </div>
        </section>

        {/* Lista de Arquivos (Útil se o livro tiver múltiplos volumes) */}
        <section className={styles.filesSection}>
          <div className={styles.sectionHeader}>
            <LibraryBig size={24} />
            <h3>Arquivos do Livro</h3>
          </div>

          <div className={styles.filesList}>
            {serie.chapters.map((chapter) => (
              <div key={chapter.id} className={styles.fileItem}>
                <div className={styles.fileInfo}>
                  <h4>{chapter.name}</h4>
                  <span className={styles.fileDate}>
                    Adicionado em{' '}
                    {new Date(chapter.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Link
                  to={`/book/${encodeURIComponent(serie.name)}/${serie.id}/${encodeURIComponent(chapter.name)}/${chapter.id}/${chapter.page?.lastPageRead || 0}/${chapter.isRead}`}
                  className={styles.openFileBtn}
                >
                  Abrir
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
