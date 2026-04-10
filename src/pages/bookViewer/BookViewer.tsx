import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, List, X, BookOpen, Hash } from 'lucide-react';

import useChapter from '../../hooks/useChapter';
import { useUIStore } from '../../store/useUIStore';
import useSettingsStore from '../../store/useSettingsStore';
import useClickOutside from '../../hooks/useClickOutside';
import Loading from '../../components/Loading/Loading';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen';
import ViewerMenu from '../../components/ViewerMenu/ViewerMenu';
import PageControl from '../../components/PageControl/PageControl';
import styles from './BookViewer.module.scss';
import EpubViewer, { EpubViewerRef } from '../../components/EpubViewer/EpubViewer';
import PdfViewer from '../../components/PdfViewer/PdfViewer';

export default function BookViewer() {
  const { serie_name: rawSerieName, chapter_id } = useParams<{
    serie_name: string;
    chapter_id: string;
  }>();
  const navigate = useNavigate();
  const decode_serie_name = decodeURIComponent(rawSerieName ?? '');

  const chapter = useChapter(decode_serie_name, Number(chapter_id));
  const { settings } = useSettingsStore();
  const epubSettings = settings.viewer.epub;

  const [scale, setScale] = useState<number>(1.2);

  // Estados de Paginação Unificados
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentCfi, setCurrentCfi] = useState<string | null>(null);
  const [readingPercent, setReadingPercent] = useState(0);
  const [currentChapterLabel, setCurrentChapterLabel] = useState('');
  
  // Estados de UI
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [indexTab, setIndexTab] = useState<'summary' | 'pages'>('summary');
  const [toc, setToc] = useState<{ href?: string; label?: string; title?: string }[]>([]);
  
  // Referências
  const epubRef = useRef<EpubViewerRef>(null);
  const indexRef = useClickOutside<HTMLDivElement>(() => setIsIndexOpen(false));
  const error = useUIStore((state) => state.error);

  // Utilitário para converter path local em URL do protocolo
  const getLocalUrl = useCallback((pathStr: string) => {
    if (!pathStr || pathStr.startsWith('lib-media://') || pathStr.startsWith('data:'))
      return pathStr;
    const encoded = btoa(unescape(encodeURIComponent(pathStr)));
    // Adicionamos a extensão original ao final da URL para ajudar a engine (epub.js)
    const ext = pathStr.split('.').pop()?.toLowerCase();
    return `lib-media://local/${encoded}.${ext}`;
  }, []);

  const epubUrl = useMemo(() => {
    return chapter.originalPath && chapter.type === 'book' ? getLocalUrl(chapter.originalPath) : null;
  }, [chapter.originalPath, chapter.type, getLocalUrl]);

  // Resetar estados quando o capítulo muda
  useEffect(() => {
    setCurrentPage(0);
    setTotalPages(1);
    setCurrentCfi(null);
    setToc([]);
    setIsIndexOpen(false);
  }, [chapter.originalPath, chapter.id]);

  // Salvamento de Progresso Automático
  const saveReadingProgress = useCallback(async () => {
    if (!chapter.id || !chapter.serieName) return;

    await window.electronAPI.chapters.saveLastRead(
      chapter.serieName,
      chapter.id,
      currentPage,
      totalPages,
      currentCfi || undefined
    );
  }, [chapter, currentPage, totalPages, currentCfi]);

  // Salva ao mudar de página ou CFI (com debounce)
  useEffect(() => {
    const timer = setTimeout(saveReadingProgress, 2000);
    return () => clearTimeout(timer);
  }, [currentPage, currentCfi, saveReadingProgress]);

  // Handlers de Navegação Unificados
  const handleNextPage = useCallback(() => {
    if (chapter.type === 'book') {
      if (epubRef.current) epubRef.current.nextPage();
    } else {
      if (currentPage < totalPages - 1) {
        setCurrentPage(p => p + 1);
      }
    }
  }, [chapter.type, currentPage, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (chapter.type === 'book') {
      if (epubRef.current) epubRef.current.prevPage();
    } else {
      if (currentPage > 0) {
        setCurrentPage(p => p - 1);
      }
    }
  }, [chapter.type, currentPage]);

  const handleGoToPage = useCallback((page: number) => {
    if (chapter.type === 'book') {
      if (epubRef.current) epubRef.current.goToPage(page);
    } else {
      setCurrentPage(page);
    }
  }, [chapter.type]);

  // Handlers estabilizados para evitar loops de re-renderização
  const handlePdfLoaded = useCallback((_pdf: unknown, total: number, outline: { href?: string; label?: string; title?: string }[]) => {
    setTotalPages(total);
    setToc(outline);
  }, []);

  const handleLocationChange = useCallback((cfi: string, page: number, total: number, percent: number, chapterLabel: string) => {
    setCurrentCfi(cfi);
    setCurrentPage(page);
    setTotalPages(total);
    setReadingPercent(percent);
    setCurrentChapterLabel(chapterLabel);
  }, []);

  const handleTocLoaded = useCallback((tocData: { href?: string; label?: string; title?: string }[]) => {
    setToc(tocData);
  }, []);

  if (chapter.isLoading) return <Loading />;
  if (error) return <ErrorScreen error={error} serieName={chapter.serieName} />;

  const handleBack = () => navigate(-1);
  const chapterLabel =
    chapter.type === 'book'
      ? currentChapterLabel || `Cap. ${chapter.currentPage + 1}`
      : '';

  return (
    <article className={styles.bookViewer}>
      <ViewerMenu chapter={chapter} setScale={setScale} />

      <section className={styles.viewport}>
        <div className={styles.renderContainer}>
          {chapter.type === 'pdf' && chapter.originalPath ? (
            <PdfViewer 
              path={chapter.originalPath}
              currentPage={currentPage}
              scale={scale}
              onPdfLoaded={handlePdfLoaded}
            />
          ) : chapter.type === 'book' && epubUrl ? (
            <div className={`${styles.epubPaper} ${styles[`theme-${epubSettings.theme}`]}`}>
              <EpubViewer 
                ref={epubRef}
                url={epubUrl}
                lastCfi={chapter.lastCfi}
                settings={epubSettings}
                readingMode={settings.viewer.readingMode}
                onTocLoaded={handleTocLoaded}
                onLocationChange={handleLocationChange}
              />
            </div>
          ) : (
            <div className={styles.unsupported}>
              <p>Formato não suportado ou arquivo não encontrado.</p>
              <button onClick={handleBack}><ChevronLeft size={18} /> Voltar</button>
            </div>
          )}
        </div>
      </section>

      <div className={styles.controls}>
        <div className={styles.leftGroup}>
          <button 
            className={`${styles.indexToggle} ${isIndexOpen ? styles.active : ''}`}
            onClick={() => setIsIndexOpen(!isIndexOpen)}
          >
            <List size={20} />
          </button>
          <div className={styles.chapterInfo}>{chapterLabel}</div>
        </div>

        <PageControl
          currentPage={currentPage}
          TamPages={totalPages}
          nextPage={handleNextPage}
          prevPage={handlePrevPage}
          goToPage={handleGoToPage}
          percent={chapter.type === 'book' ? readingPercent : undefined}
          chapterLabel={chapter.type === 'book' ? currentChapterLabel : undefined}
        />

        {isIndexOpen && (
          <div className={styles.indexOverlay}>
            <aside className={styles.indexMenu} ref={indexRef}>
              <header className={styles.indexHeader}>
                <div className={styles.tabs}>
                  <button className={indexTab === 'summary' ? styles.active : ''} onClick={() => setIndexTab('summary')}>
                    <BookOpen size={16} /> Sumário
                  </button>
                  {chapter.type === 'pdf' && (
                    <button className={indexTab === 'pages' ? styles.active : ''} onClick={() => setIndexTab('pages')}>
                      <Hash size={16} /> Páginas
                    </button>
                  )}
                </div>
                <button className={styles.closeBtn} onClick={() => setIsIndexOpen(false)}><X size={20} /></button>
              </header>
              
              <div className={styles.indexContent}>
                {indexTab === 'summary' ? (
                  <ul className={styles.indexList}>
                    {toc.map((item, index) => (
                      <li key={index}>
                        <button 
                          className={styles.indexItem} 
                          onClick={() => {
                            if (chapter.type === 'book' && epubRef.current && item.href) {
                              epubRef.current.goToLocation(item.href);
                            }
                            setIsIndexOpen(false);
                          }}
                        >
                          <span className={styles.label}>{item.label || item.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.pdfGrid}>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button 
                        key={i} 
                        className={`${styles.pdfPageBtn} ${currentPage === i ? styles.current : ''}`}
                        onClick={() => {
                          setCurrentPage(i);
                          setIsIndexOpen(false);
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </article>
  );
}
