import {
  ArrowDownUp,
  Upload,
  EyeOff,
  CircleCheck,
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Bookmark,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import DownloadButton from '@/shared/components/DonwloadButton/DownloadButton';
import ContinueButton from '../ContinueButton/ContinueButton';
import { Chapter, Filter } from '../../types/chapter.interfaces';
import { isRecent, subtitleOf, formatChapterNumber } from '../../utils/chapterUtils';
import { MAX_NEW_BADGES, PAGE_SIZE, FILTERS } from '../../constants/chapterConstants';

export default function ListView({ literatureForm }: { literatureForm: LiteratureForm }) {
  const { downloadIndividual, ensureDownloaded } = useDownload();
  const { openChapter, markAsRead, OpenLastChapter, markReadUntil, markUnreadFrom } =
    useAction();

  const chapters = useSerieStore((s) => s.chapters);
  const { deleteChapter } = useChapterActions();
  const fetchSerie = useSerieStore((s) => s.fetchSerie);

  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [ascending, setAscending] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [filter, setFilter] = useState<Filter>('all');
  const [jumpValue, setJumpValue] = useState('');
  const [jumpError, setJumpError] = useState(false);
  const [pendingJump, setPendingJump] = useState<number | null>(null);

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

  const readCount = useMemo(() => chapters.filter((c) => c.isRead).length, [chapters]);
  const percent =
    chapters.length > 0 ? Math.round((readCount / chapters.length) * 100) : 0;

  const newIds = useMemo(() => {
    const recent = chapters.filter(isRecent);
    return recent.length <= MAX_NEW_BADGES
      ? new Set(recent.map((c) => c.id))
      : new Set<number>();
  }, [chapters]);

  const visible = useMemo(() => {
    const test = FILTERS.find((f) => f.id === filter)?.test ?? (() => true);
    return sorted.filter(test);
  }, [sorted, filter]);

  const { handlePage, pageNumbers, totalPages, currentItems, currentPage } =
    usePagination(visible, PAGE_SIZE);

  const jumpedToNext = useRef(false);
  useEffect(() => {
    if (jumpedToNext.current || visible.length === 0) return;
    jumpedToNext.current = true;

    const index = visible.findIndex((c) => c.id === nextId);
    if (index >= 0) handlePage(Math.floor(index / PAGE_SIZE) + 1);
  }, [visible, nextId, handlePage]);

  useEffect(() => {
    if (pendingJump === null || filter !== 'all') return;

    const index = visible.findIndex((c) => c.chapterNumber?.value === pendingJump);
    if (index >= 0) handlePage(Math.floor(index / PAGE_SIZE) + 1);
    else setJumpError(true);

    setPendingJump(null);
  }, [pendingJump, filter, visible, handlePage]);

  const toggleOrder = () => {
    setAscending((prev) => !prev);
    handlePage(1);
  };

  const changeFilter = (next: Filter) => {
    setFilter(next);
    handlePage(1);
  };

  const submitJump = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(jumpValue.trim().replace(',', '.'));

    if (jumpValue.trim() === '' || Number.isNaN(value)) {
      setJumpError(true);
      return;
    }

    setJumpError(false);
    setFilter('all');
    setPendingJump(value);
  };

  return (
    <section
      className={styles.control}
      style={{ '--page-size': PAGE_SIZE } as React.CSSProperties}
    >
      <div className={styles.header}>
        <h2>Capítulos</h2>

        <div className={styles.headerRight}>
          <DownloadButton />
          <ContinueButton onOpen={(e) => OpenLastChapter(e)} />
        </div>
      </div>
      {chapters.length > 0 && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.filters} role="group" aria-label="Filtrar capítulos">
              {FILTERS.map((f) => (
                <button
                  type="button"
                  key={f.id}
                  className={styles.filterChip}
                  aria-pressed={filter === f.id}
                  onClick={() => changeFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className={styles.toolbarRight}>
              <form className={styles.jump} onSubmit={submitJump}>
                <input
                  className={styles.jumpInput}
                  type="text"
                  inputMode="decimal"
                  placeholder="Ir para o capítulo…"
                  aria-label="Ir para o capítulo"
                  aria-invalid={jumpError}
                  value={jumpValue}
                  onChange={(e) => {
                    setJumpValue(e.target.value);
                    setJumpError(false);
                  }}
                />
              </form>

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
                <ArrowDownUp size={18} strokeWidth={1.75} />
              </button>

              <button
                type="button"
                className={styles.toolButton}
                onClick={() => setIsUploadOpen(true)}
                aria-label="Enviar capítulos"
                title="Enviar capítulos"
              >
                <Upload size={18} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>
              {readCount} de {chapters.length} lidos
            </span>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${percent}% lido`}
            >
              <div className={styles.progressFill} style={{ width: `${percent}%` }} />
            </div>
          </div>
        </>
      )}
      {chapters.length === 0 ? (
        <p className={styles.empty}>
          Nenhum capítulo ainda. Use o botão de envio para adicionar.
        </p>
      ) : visible.length === 0 ? (
        <p className={styles.empty}>Nenhum capítulo neste filtro.</p>
      ) : (
        <ul className={styles.chaptersList}>
          {currentItems.map((chapter) => {
            const isNext = chapter.id === nextId;
            const isNew = newIds.has(chapter.id) && !chapter.isRead;
            const subtitle = subtitleOf(chapter, isNew);
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
                  onClick={async (e) => {
                    if (await ensureDownloaded(chapter)) openChapter(e, chapter);
                  }}
                >
                  <span className={styles.number}>{formatChapterNumber(chapter)}</span>
                  <span className={styles.text}>
                    <span className={styles.title} title={chapter.name}>
                      {chapter.name}
                    </span>
                    {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
                  </span>

                  <span className={styles.badges}>
                    {isNext && <span className={styles.chip}>Continuar</span>}
                    {isNew && <span className={styles.chip}>Novo</span>}
                    {favoritePage > 0 && (
                      <span className={styles.chip}>
                        <Bookmark size={12} aria-hidden="true" /> pág. {favoritePage}
                      </span>
                    )}
                  </span>
                </button>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={(e) => markAsRead(e, chapter)}
                    aria-label={
                      chapter.isRead ? 'Marcar como não lido' : 'Marcar como lido'
                    }
                    aria-pressed={chapter.isRead}
                    title={chapter.isRead ? 'Marcar como não lido' : 'Marcar como lido'}
                  >
                    {chapter.isRead ? (
                      <CircleCheck
                        size={20}
                        strokeWidth={1.75}
                        className={styles.readIcon}
                      />
                    ) : (
                      <EyeOff size={20} strokeWidth={1.75} />
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
                    {chapter.isDownloaded == 'downloading' ? (
                      <LoaderCircle
                        size={20}
                        strokeWidth={1.75}
                        className={styles.spin}
                      />
                    ) : chapter.isDownloaded == 'downloaded' ? (
                      <CircleCheck
                        size={20}
                        strokeWidth={1.75}
                        className={styles.downloadedIcon}
                      />
                    ) : (
                      <ArrowDownToLine size={20} strokeWidth={1.75} />
                    )}
                  </button>

                  <ChapterMenu
                    label={`Mais ações do ${chapter.name}`}
                    items={[
                      {
                        label: 'Marcar como lido até aqui',
                        icon: <CheckCheck size={18} strokeWidth={1.5} />,
                        onSelect: () => markReadUntil(chapter),
                      },
                      {
                        label: 'Marcar como não lido daqui em diante',
                        icon: <EyeOff size={18} strokeWidth={1.5} />,
                        onSelect: () => markUnreadFrom(chapter),
                      },
                      {
                        label:
                          chapter.isDownloaded === 'downloaded'
                            ? 'Remover download'
                            : 'Baixar',
                        icon: <ArrowDownToLine size={18} strokeWidth={1.5} />,
                        onSelect: () =>
                          downloadIndividual(
                            new MouseEvent('click') as unknown as React.MouseEvent,
                            chapter,
                          ),
                      },
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
      {totalPages > 1 ? (
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
      ) : (
        <div className={styles.paginationSpacer} aria-hidden="true" />
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
