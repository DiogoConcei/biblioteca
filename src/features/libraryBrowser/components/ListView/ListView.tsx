import {
  ArrowDownUp,
  Upload,
  Eye,
  EyeOff,
  ArrowDownToLine,
  ArrowDownFromLine,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Bookmark,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react'; // junto dos outros ícones do lucide-react
import ChapterMenu from '../ChapterMenu/ChapterMenu';
import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog';
import useChapterActions from '@/shared/hooks/useChapterActions';
import useDownload from '@/shared/hooks/useDownload';
import useAction from '@/shared/hooks/useAction';
import useSerieStore from '@/shared/store/useSerieStore';
import usePagination from '@/shared/hooks/usePagination';
import { LiteratureForm } from '@/shared/types/series.interfaces';
import UploadPopUp from '../UploadPopUp/UploadPopUp';
import styles from './ListView.module.scss';
import { LiteratureChapter } from '../../../../../electron/types/electron-auxiliar.interfaces';

// Ou importe LiteratureChapter do seu arquivo de tipos.
type Chapter = ReturnType<typeof useSerieStore.getState>['chapters'][number];

const PAGE_SIZE = 12;
const NEW_CHAPTER_DAYS = 7;
const MAX_NEW_BADGES = 10; // acima disso foi um envio em lote: não marca ninguém
const DAY_MS = 24 * 60 * 60 * 1000;

const isRecent = (chapter: Chapter) =>
  Date.now() - new Date(chapter.createdAt).getTime() < NEW_CHAPTER_DAYS * DAY_MS;

const subtitleOf = (chapter: Chapter): string => {
  if (chapter.isDownloaded === 'downloading') return 'Baixando…';
  if (chapter.isRead) return 'Lido';
  const lastPage = chapter.page?.lastPageRead ?? 0;
  if (lastPage > 0) return `Parou na pág. ${lastPage}`;
  if (chapter.isDownloaded === 'downloaded') return 'Baixado';
  return '';
};

function DownloadIcon({ state }: { state: Chapter['isDownloaded'] }) {
  if (state === 'downloading') {
    return <LoaderCircle size={22} strokeWidth={1.5} className={styles.spin} />;
  }
  if (state === 'downloaded') return <ArrowDownFromLine size={22} strokeWidth={1.5} />;
  return <ArrowDownToLine size={22} strokeWidth={1.5} />;
}

export default function ListView({ literatureForm }: { literatureForm: LiteratureForm }) {
  const { downloadIndividual } = useDownload();
  const { openChapter, markAsRead } = useAction();
  const chapters = useSerieStore((s) => s.chapters);
  const { deleteChapter } = useChapterActions();
  const fetchSerie = useSerieStore((s) => s.fetchSerie);

  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [ascending, setAscending] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const askDelete = (chapter: Chapter) => {
    setDeleteError(null);
    setChapterToDelete(chapter);
  };

  const closeDelete = () => {
    if (!isDeleting) setChapterToDelete(null);
  };

  const confirmDelete = async () => {
    if (!chapterToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteChapter(chapterToDelete);

    if (result.success) {
      // o backend é a fonte da verdade: recarrega a série (contadores, status, histórico)
      await fetchSerie(chapterToDelete.serieName, literatureForm);
      setChapterToDelete(null);
    } else {
      setDeleteError(
        result.error ?? 'Não foi possível excluir o capítulo. Tente novamente.',
      );
    }

    setIsDeleting(false);
  };

  const sorted = useMemo(
    () =>
      [...chapters].sort((a, b) => (ascending ? a.order - b.order : b.order - a.order)),
    [chapters, ascending],
  );

  const nextId = useMemo(
    () => [...chapters].sort((a, b) => a.order - b.order).find((c) => !c.isRead)?.id,
    [chapters],
  );

  const newIds = useMemo(() => {
    const recent = chapters.filter(isRecent);
    return recent.length <= MAX_NEW_BADGES
      ? new Set(recent.map((c) => c.id))
      : new Set<number>();
  }, [chapters]);

  const { handlePage, pageNumbers, totalPages, currentItems, currentPage } =
    usePagination(sorted, PAGE_SIZE);

  const jumpedToNext = useRef(false);
  useEffect(() => {
    if (jumpedToNext.current || sorted.length === 0) return;
    jumpedToNext.current = true;

    const index = sorted.findIndex((c) => c.id === nextId);
    if (index >= 0) handlePage(Math.floor(index / PAGE_SIZE) + 1);
  }, [sorted, nextId, handlePage]);

  const toggleOrder = () => {
    setAscending((prev) => !prev);
    handlePage(1);
  };

  return (
    <section className={styles.control}>
      <div className={styles.header}>
        <h2>Capítulos</h2>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.toolButton}
            onClick={toggleOrder}
            aria-label="Inverter a ordem dos capítulos"
            title={
              ascending
                ? 'Mostrar os mais recentes primeiro'
                : 'Mostrar os mais antigos primeiro'
            }
          >
            <ArrowDownUp size={26} strokeWidth={1} />
          </button>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => setIsUploadOpen(true)}
            aria-label="Enviar capítulos"
            title="Enviar capítulos"
          >
            <Upload size={26} strokeWidth={1} />
          </button>
        </div>
      </div>

      {chapters.length === 0 ? (
        <p className={styles.empty}>
          Nenhum capítulo ainda. Use o botão de envio para adicionar.
        </p>
      ) : (
        <ul className={styles.chaptersList}>
          {currentItems.map((chapter) => {
            const isNext = chapter.id === nextId;
            const subtitle = subtitleOf(chapter);
            const favoritePage = chapter.page?.favoritePage ?? 0;

            return (
              <li
                key={chapter.id}
                className={styles.row}
                data-read={chapter.isRead}
                data-next={isNext}
              >
                <button
                  type="button"
                  className={styles.main}
                  onClick={(e) => openChapter(e, chapter)}
                >
                  <span className={styles.number}>{chapter.chapterNumber?.label}</span>
                  <span className={styles.text}>
                    <span className={styles.title}>{chapter.name}</span>
                    {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
                  </span>

                  {isNext && <span className={styles.chip}>Continuar</span>}
                  {newIds.has(chapter.id) && !chapter.isRead && (
                    <span className={styles.chip}>Novo</span>
                  )}
                  {favoritePage > 0 && (
                    <span className={styles.chip}>
                      <Bookmark size={12} aria-hidden="true" /> pág. {favoritePage}
                    </span>
                  )}
                </button>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={(e) => markAsRead(e, chapter)}
                    aria-label="Lido"
                    aria-pressed={chapter.isRead}
                    title={chapter.isRead ? 'Marcar como não lido' : 'Marcar como lido'}
                  >
                    {chapter.isRead ? (
                      <Eye size={22} strokeWidth={1.5} />
                    ) : (
                      <EyeOff size={22} strokeWidth={1.5} />
                    )}
                  </button>

                  <button
                    type="button"
                    className={styles.iconButton}
                    data-downloaded={chapter.isDownloaded}
                    onClick={(e) => downloadIndividual(e, chapter)}
                    aria-label="Baixar capítulo"
                    title={chapter.isDownloaded === 'downloaded' ? 'Baixado' : 'Baixar'}
                  >
                    <DownloadIcon state={chapter.isDownloaded} />
                  </button>

                  <ChapterMenu
                    label={`Mais ações do ${chapter.name}`}
                    items={[
                      {
                        label: 'Excluir capítulo',
                        icon: <Trash2 size={18} strokeWidth={1.5} />,
                        danger: true,
                        onSelect: () => askDelete(chapter),
                      },
                    ]}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Paginação">
          <button
            type="button"
            className={styles.arrow}
            onClick={() => handlePage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft />
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              type="button"
              key={pageNumber}
              className={`${styles.page} ${pageNumber === currentPage ? styles.pageActive : ''}`}
              onClick={() => handlePage(pageNumber)}
              aria-current={pageNumber === currentPage ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            className={styles.arrow}
            onClick={() => handlePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Próxima página"
          >
            <ChevronRight />
          </button>
        </nav>
      )}

      {isUploadOpen && (
        <UploadPopUp
          isOpen={isUploadOpen}
          setIsOpen={setIsUploadOpen}
          literatureForm={literatureForm}
        />
      )}

      <ConfirmDialog
        open={chapterToDelete !== null}
        title={`Excluir ${chapterToDelete?.name ?? 'capítulo'}?`}
        description="O capítulo será removido da biblioteca. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        busy={isDeleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={closeDelete}
      />
    </section>
  );
}
