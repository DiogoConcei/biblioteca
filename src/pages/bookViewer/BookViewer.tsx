import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, List, X, BookOpen, Hash } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configuração obrigatória do worker do PDF.js para ambiente Vite/Web
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

import useChapter from '../../hooks/useChapter';
import { useUIStore } from '../../store/useUIStore';
import useSettingsStore from '../../store/useSettingsStore';
import useClickOutside from '../../hooks/useClickOutside';
import Loading from '../../components/Loading/Loading';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen';
import ViewerMenu from '../../components/ViewerMenu/ViewerMenu';
import PageControl from '../../components/PageControl/PageControl';
import styles from './BookViewer.module.scss';
import { ChapterResource } from '../../../electron/types/media.interfaces';

interface PdfOutlineItem {
  title: string;
  dest?: unknown;
  items?: PdfOutlineItem[];
}

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

  // Estados de Paginação e UI
  const [internalPageIndex, setInternalPageIndex] = useState(0);
  const [totalInternalPages, setTotalInternalPages] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [indexTab, setIndexTab] = useState<'summary' | 'pages'>('summary');
  const [pdfOutline, setPdfOutline] = useState<PdfOutlineItem[] | null>(null);

  // Referências
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const indexRef = useClickOutside<HTMLDivElement>(() => setIsIndexOpen(false));
  const error = useUIStore((state) => state.error);

  // 1. Ouvinte de mensagens do EPUB
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'EPUB_PAGES_COUNT') {
        setTotalInternalPages(event.data.count as number);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 2. Resetar estados quando o capítulo muda
  useEffect(() => {
    setPdfDocument(null);
    setPdfTotalPages(0);
    setPdfOutline(null);
    setInternalPageIndex(0);
    setTotalInternalPages(1);
    setIsIndexOpen(false);
  }, [chapter.originalPath, chapter.id]);

  // 3. Carregamento do Documento PDF
  useEffect(() => {
    if (chapter.type !== 'pdf' || !chapter.originalPath) return;

    let isMounted = true;
    const loadingTask = pdfjsLib.getDocument(chapter.originalPath);
    
    loadingTask.promise.then(async (pdf) => {
      if (!isMounted) {
        pdf.destroy();
        return;
      }
      setPdfDocument(pdf);
      setPdfTotalPages(pdf.numPages);
      
      // Tenta carregar o sumário nativo do PDF
      try {
        const outline = await pdf.getOutline();
        setPdfOutline(outline as PdfOutlineItem[]);
      } catch (e) {
        console.warn('[BookViewer] Sumário do PDF não disponível.', e);
      }
    }).catch((err) => {
      console.error('[BookViewer] Erro ao carregar PDF:', err);
    });

    return () => { isMounted = false; };
  }, [chapter.originalPath, chapter.type]);

  // 4. Renderização da Página PDF
  useEffect(() => {
    if (chapter.type !== 'pdf' || !pdfDocument || !canvasRef.current) return;

    let isMounted = true;
    const pageNumber = chapter.currentPage + 1;

    if (pageNumber < 1 || pageNumber > pdfDocument.numPages) return;

    async function renderPage() {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        if (!pdfDocument) return;

        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale });

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.height = viewport.height;
        offscreenCanvas.width = viewport.width;
        const offscreenContext = offscreenCanvas.getContext('2d');

        if (!offscreenContext || !isMounted) return;

        const renderTask = page.render({
          canvasContext: offscreenContext,
          viewport,
          canvas: offscreenCanvas,
        });
        renderTaskRef.current = renderTask;

        await renderTask.promise;

        if (!isMounted) return;

        const mainCanvas = canvasRef.current;
        if (mainCanvas) {
          mainCanvas.height = viewport.height;
          mainCanvas.width = viewport.width;
          mainCanvas.getContext('2d')?.drawImage(offscreenCanvas, 0, 0);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'RenderingCancelledException') {
          return;
        }
        console.error('[BookViewer] Erro na renderização:', err);
      }
    }

    renderPage();
    return () => { 
      isMounted = false;
      if (renderTaskRef.current) renderTaskRef.current.cancel();
    };
  }, [pdfDocument, chapter.currentPage, scale, chapter.type]); 

  // 5. Lógica de URL para EPUB
  const currentEpubChapterUrl = useMemo(() => {
    if (chapter.type !== 'book' || !chapter.pages[chapter.currentPage]) return null;
    
    const resource = chapter.pages[chapter.currentPage] as unknown as ChapterResource;
    const url = new URL(resource.path);
    url.searchParams.set('epub-theme', epubSettings.theme);
    url.searchParams.set('epub-font-size', epubSettings.fontSize.toString());
    url.searchParams.set('epub-font-family', epubSettings.fontFamily);
    url.searchParams.set('epub-line-height', epubSettings.lineHeight.toString());
    url.searchParams.set('epub-margin', epubSettings.margin.toString());

    return url.toString();
  }, [chapter.type, chapter.pages, chapter.currentPage, epubSettings]);

  const goToInternalPage = useCallback((index: number) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage({ type: 'EPUB_GO_TO_PAGE', index }, '*');
    setInternalPageIndex(index);
  }, []);

  useEffect(() => {
    return () => { if (pdfDocument) pdfDocument.destroy(); };
  }, [pdfDocument]);

  const handleEpubLoad = useCallback(() => {
    // Carregamento silencioso
  }, []);

  // Handlers de Navegação Unificados
  const handleNextPage = useCallback(() => {
    if (chapter.type === 'book') {
      if (internalPageIndex < totalInternalPages - 1) {
        goToInternalPage(internalPageIndex + 1);
      } else if (chapter.currentPage < chapter.quantityPages - 1) {
        setInternalPageIndex(0);
        chapter.setCurrentPage(p => p + 1);
      }
    } else {
      const total = pdfTotalPages || chapter.quantityPages;
      chapter.setCurrentPage((p) => Math.min(p + 1, total - 1));
    }
  }, [chapter, internalPageIndex, totalInternalPages, goToInternalPage, pdfTotalPages]);

  const handlePrevPage = useCallback(() => {
    if (chapter.type === 'book') {
      if (internalPageIndex > 0) {
        goToInternalPage(internalPageIndex - 1);
      } else if (chapter.currentPage > 0) {
        chapter.setCurrentPage(p => p - 1);
      }
    } else {
      chapter.setCurrentPage((p) => Math.max(0, p - 1));
    }
  }, [chapter, internalPageIndex, goToInternalPage]);

  if (chapter.isLoading) return <Loading />;
  if (error) return <ErrorScreen error={error} serieName={chapter.serieName} />;

  const handleBack = () => navigate(-1);
  const chapterLabel = chapter.type === 'book' ? `Cap. ${chapter.currentPage + 1}` : '';

  return (
    <article className={styles.bookViewer}>
      <ViewerMenu chapter={chapter} setScale={setScale} />

      <section className={sectionContainerClass}>
        <div
          className={`${styles.renderContainer} ${chapter.type === 'book' ? styles[`theme-${epubSettings.theme}`] : ''}`}
        >
          {chapter.type === 'pdf' ? (
            <div className={styles.pdfContainer}>
              <canvas ref={canvasRef} className={styles.pdfCanvas} />
            </div>
          ) : chapter.type === 'book' && currentEpubChapterUrl ? (
            <iframe
              ref={iframeRef}
              key={currentEpubChapterUrl}
              src={currentEpubChapterUrl}
              className={styles.epubFrame}
              onLoad={handleEpubLoad}
              sandbox="allow-same-origin allow-scripts"
              title="E-Reader"
            />
          ) : (
            <div className={styles.unsupported}>
              <p>Formato não suportado ou arquivo não encontrado.</p>
              <button onClick={handleBack}>
                <ChevronLeft size={18} /> Voltar
              </button>
            </div>
          )}
        </div>
      </section>

      <div className={styles.controls}>
        <div className={styles.leftGroup}>
          <button 
            className={`${styles.indexToggle} ${isIndexOpen ? styles.active : ''}`}
            onClick={() => setIsIndexOpen(!isIndexOpen)}
            title="Índice / Sumário"
          >
            <List size={20} />
          </button>
          <div className={styles.chapterInfo}>{chapterLabel}</div>
        </div>

        <PageControl
          currentPage={chapter.type === 'book' ? internalPageIndex : chapter.currentPage}
          TamPages={chapter.type === 'book' ? totalInternalPages : (pdfTotalPages || chapter.quantityPages)}
          nextPage={handleNextPage}
          prevPage={handlePrevPage}
        />

        {/* Modal de Índice/Sumário Unificado */}
        {isIndexOpen && (
          <div className={styles.indexOverlay}>
            <aside className={styles.indexMenu} ref={indexRef}>
              <header className={styles.indexHeader}>
                <div className={styles.tabs}>
                  <button 
                    className={indexTab === 'summary' ? styles.active : ''} 
                    onClick={() => setIndexTab('summary')}
                  >
                    <BookOpen size={16} /> Sumário
                  </button>
                  <button 
                    className={indexTab === 'pages' ? styles.active : ''} 
                    onClick={() => setIndexTab('pages')}
                  >
                    <Hash size={16} /> Páginas
                  </button>
                </div>
                <button className={styles.closeBtn} onClick={() => setIsIndexOpen(false)}><X size={20} /></button>
              </header>
              
              <div className={styles.indexContent}>
                {indexTab === 'summary' ? (
                  /* ABA SUMÁRIO */
                  <div className={styles.summaryView}>
                    {chapter.type === 'book' ? (
                      <ul className={styles.indexList}>
                        {(chapter.pages as unknown as ChapterResource[]).map((res, index) => (
                          <li key={res.id}>
                            <button 
                              className={`${styles.indexItem} ${chapter.currentPage === index ? styles.current : ''}`}
                              onClick={() => {
                                chapter.setCurrentPage(index);
                                setIsIndexOpen(false);
                              }}
                            >
                              <span className={styles.num}>{index + 1}</span>
                              <span className={styles.label}>{res.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      /* Sumário PDF (Nativo) */
                      <div className={styles.pdfOutline}>
                        {pdfOutline ? (
                          <ul className={styles.outlineList}>
                            {pdfOutline.map((item, i) => (
                              <li key={i}>
                                <button className={styles.outlineItem}>
                                  {item.title}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className={styles.emptyMsg}>Estrutura de capítulos não disponível neste PDF.</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* ABA PÁGINAS */
                  <div className={styles.pagesView}>
                    {chapter.type === 'book' ? (
                      /* Páginas virtuais do EPUB */
                      <div className={styles.pdfGrid}>
                        {Array.from({ length: totalInternalPages }, (_, i) => (
                          <button 
                            key={i} 
                            className={`${styles.pdfPageBtn} ${internalPageIndex === i ? styles.current : ''}`}
                            onClick={() => {
                              goToInternalPage(i);
                              setIsIndexOpen(false);
                            }}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    ) : (
                      /* Páginas reais do PDF */
                      <div className={styles.pdfGrid}>
                        {Array.from({ length: pdfTotalPages || chapter.quantityPages }, (_, i) => (
                          <button 
                            key={i} 
                            className={`${styles.pdfPageBtn} ${chapter.currentPage === i ? styles.current : ''}`}
                            onClick={() => {
                              chapter.setCurrentPage(i);
                              setIsIndexOpen(false);
                            }}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
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

const sectionContainerClass = styles.viewport;
