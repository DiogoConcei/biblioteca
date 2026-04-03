import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  List,
  X,
} from 'lucide-react';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

import useChapter from '../../hooks/useChapter';
import useSerie from '../../hooks/useSerie';
import useNavigation from '../../hooks/useNavigation';
import Loading from '../../components/Loading/Loading';
import useSerieStore from '../../store/useSerieStore';
import { ChapterResource } from '../../../electron/types/media.interfaces';
import styles from './BookViewer.module.scss';

// Configuração do Worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function BookViewer() {
  const { serie_name: rawSerieName, chapter_id } = useParams<{
    serie_name: string;
    chapter_id: string;
  }>();

  const decode_serie_name = decodeURIComponent(rawSerieName ?? '');
  const chapter = useChapter(decode_serie_name, Number(chapter_id));
  const serieFromStore = useSerieStore((state) => state.serie);

  // Carrega os dados da série no Store para permitir o salvamento de progresso
  useSerie(decode_serie_name, 'Books');

  const { goToSeriePage } = useNavigation(chapter);

  // Estados de UI e Controle
  const [showTOC, setShowTOC] = useState(false);
  const [showUI, setShowUI] = useState(true);

  // Estados PDF
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [pdfOutline, setPdfOutline] = useState<
    { title: string; pageNumber: number }[]
  >([]);
  const [isRendering, setIsRendering] = useState(false);

  // --- Lógica de Escala Dinâmica (Fit to Width) ---
  useEffect(() => {
    if (!pdfDoc || chapter.type !== 'pdf' || !canvasRef.current) return;

    const container = canvasRef.current.parentElement;
    if (!container) return;

    const updateScale = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });

        // Padding horizontal é 3rem de cada lado = 6rem total (96px)
        const horizontalPadding = 96;
        const availableWidth = container.clientWidth - horizontalPadding;
        const newScale = availableWidth / viewport.width;

        // Só atualiza se a mudança for significativa para evitar jittering
        setScale((prev) =>
          Math.abs(prev - newScale) > 0.01 ? newScale : prev,
        );
      } catch (err) {
        console.error('[BookViewer] Erro ao calcular escala:', err);
      }
    };

    const observer = new ResizeObserver(() => {
      updateScale();
    });

    observer.observe(container);
    updateScale(); // Cálculo inicial

    return () => observer.disconnect();
  }, [pdfDoc, pageNum, chapter.type]);

  // Estados EPUB (Book)
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // --- Lógica de Imersão (Auto-hide UI) ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleActivity = () => {
      setShowUI(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!showTOC) setShowUI(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    // Inicia o timer
    timer = setTimeout(() => setShowUI(false), 3000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearTimeout(timer);
    };
  }, [showTOC, chapter]); // Adicionado chapter como dependência

  const handleExit = async () => {
    try {
      await goToSeriePage();
    } catch (err) {
      console.error('[BookViewer] Erro ao sair:', err);
      window.history.back();
    }
  };

  useEffect(() => {
    if (chapter.type === 'book' && chapter.pages.length > 0) {
      setCurrentChapterIdx(chapter.currentPage || 0);
    }
  }, [chapter.type, chapter.pages, chapter.currentPage]);

  // --- Lógica PDF ---
  useEffect(() => {
    let currentPdf: pdfjsLib.PDFDocumentProxy | null = null;

    if (chapter.type === 'pdf' && chapter.originalPath) {
      const loadingTask = pdfjsLib.getDocument(chapter.originalPath);
      loadingTask.promise
        .then((pdf) => {
          currentPdf = pdf;
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setPageNum(chapter.currentPage + 1 || 1);
        })
        .catch((err) => console.error('Erro ao carregar PDF:', err));
    }

    return () => {
      if (currentPdf) {
        currentPdf.destroy();
      }
    };
  }, [chapter.originalPath, chapter.type, chapter.currentPage]);

  // Extrair Sumário (Outline) do PDF
  useEffect(() => {
    if (!pdfDoc) return;

    const loadOutline = async () => {
      try {
        const outline = await pdfDoc.getOutline();
        if (outline) {
          const flatOutline: { title: string; pageNumber: number }[] = [];
          for (const item of outline) {
            try {
              if (item.dest) {
                const dest =
                  typeof item.dest === 'string'
                    ? await pdfDoc.getDestination(item.dest)
                    : (item.dest as unknown[]);

                if (dest) {
                  const pageIdx = await pdfDoc.getPageIndex(dest[0]);
                  flatOutline.push({
                    title: item.title,
                    pageNumber: pageIdx + 1,
                  });
                }
              }
            } catch (destErr) {
              console.warn('Erro ao processar item do sumário:', destErr);
            }
          }
          setPdfOutline(flatOutline);
        }
      } catch (err) {
        console.warn('Falha ao carregar sumário do PDF:', err);
      }
    };

    loadOutline();
  }, [pdfDoc]);

  useEffect(() => {
    if (!pdfDoc || chapter.type !== 'pdf') return;

    let cancelled = false;
    const { setCurrentPage } = chapter;

    const renderPage = async () => {
      setIsRendering(true);
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (cancelled) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const context = canvas.getContext('2d');
        if (!context || cancelled) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderTask = page.render({
          canvasContext: context,
          viewport,
          // @ts-expect-error: A propriedade 'canvas' pode ser necessária em algumas versões de tipagem do PDF.js
          canvas: canvas,
        });
        renderTaskRef.current = renderTask;

        await renderTask.promise;

        if (!cancelled) {
          setCurrentPage(pageNum - 1);
        }
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name !== 'RenderingCancelledException' && !cancelled) {
          console.error('Erro ao renderizar página:', err);
        }
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, pageNum, scale]); // Removido 'chapter' para evitar loops de renderização

  // --- Lógica EPUB (Book) ---
  const bookResources = (chapter.pages as unknown as ChapterResource[]) || [];
  const currentResource = bookResources[currentChapterIdx];

  const handleIframeLoad = () => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        const style = doc.createElement('style');
        style.textContent = `
          body { 
            color: #333; 
            background-color: transparent !important;
            font-family: 'Georgia', serif;
            line-height: 1.6;
            padding: 2rem 10% !important;
            max-width: 900px;
            margin: 0 auto;
          }
          img { max-width: 100%; height: auto; }
        `;
        doc.head.appendChild(style);
      }
    }
  };

  const changePage = (offset: number) => {
    if (chapter.type === 'pdf') {
      setPageNum((prev) => Math.min(Math.max(1, prev + offset), numPages));
    } else {
      setCurrentChapterIdx((prev) =>
        Math.min(Math.max(0, prev + offset), bookResources.length - 1),
      );
    }
  };

  // Navegação por Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        if (chapter.type === 'pdf') {
          setPageNum((prev) => Math.max(1, prev - 1));
        } else {
          setCurrentChapterIdx((prev) => Math.max(0, prev - 1));
        }
      }
      if (e.key === 'ArrowRight') {
        if (chapter.type === 'pdf') {
          setPageNum((prev) => Math.min(numPages, prev + 1));
        } else {
          setCurrentChapterIdx((prev) =>
            Math.min(bookResources.length - 1, prev + 1),
          );
        }
      }
      if (e.key === 'Escape' && showTOC) setShowTOC(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTOC, chapter.type, numPages, bookResources.length]);

  if (chapter.isLoading) return <Loading />;

  return (
    <main
      className={`${styles.bookViewer} ${styles[chapter.type]} ${!showUI ? styles.uiHidden : ''}`}
    >
      <header
        className={`${styles.viewerHeader} ${!showUI ? styles.hidden : ''}`}
      >
        <div className={styles.leftSection}>
          <button
            className={styles.exitBtn}
            onClick={handleExit}
            title="Sair do Leitor"
          >
            <X size={20} />
          </button>
          <div className={styles.info}>
            <button
              className={styles.tocBtn}
              onClick={() => setShowTOC(!showTOC)}
              title="Sumário"
            >
              <List size={20} />
            </button>
            <div className={styles.titleText}>
              <h2>{decode_serie_name}</h2>
              <span>
                {chapter.type === 'book'
                  ? currentResource?.label
                  : chapter.chapterName}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.pagination}>
            <button
              onClick={() => changePage(-1)}
              disabled={
                chapter.type === 'pdf' ? pageNum <= 1 : currentChapterIdx === 0
              }
            >
              <ChevronLeft size={20} />
            </button>
            <span>
              {chapter.type === 'pdf'
                ? `${pageNum} / ${numPages}`
                : `${currentChapterIdx + 1} / ${bookResources.length}`}
            </span>
            <button
              onClick={() => changePage(1)}
              disabled={
                chapter.type === 'pdf'
                  ? pageNum >= numPages
                  : currentChapterIdx === bookResources.length - 1
              }
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {chapter.type === 'pdf' && (
            <div className={styles.zoom}>
              <button onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}>
                <ZoomOut size={18} />
              </button>
              <span>{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale((s) => Math.min(3, s + 0.2))}>
                <ZoomIn size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      {showTOC && (
        <aside className={styles.tocMenu}>
          <h3>Índice</h3>
          <ul>
            {chapter.type === 'book' ? (
              bookResources.map((res, idx) => (
                <li
                  key={res.id}
                  className={currentChapterIdx === idx ? styles.active : ''}
                  onClick={() => {
                    setCurrentChapterIdx(idx);
                    setShowTOC(false);
                  }}
                >
                  {res.label}
                </li>
              ))
            ) : pdfOutline.length > 0 ? (
              pdfOutline.map((item, idx) => (
                <li
                  key={idx}
                  className={
                    pageNum >= item.pageNumber &&
                    (!pdfOutline[idx + 1] ||
                      pageNum < pdfOutline[idx + 1].pageNumber)
                      ? styles.active
                      : ''
                  }
                  onClick={() => {
                    setPageNum(item.pageNumber);
                    setShowTOC(false);
                  }}
                >
                  <small>pág. {item.pageNumber}</small>
                  <span>{item.title}</span>
                </li>
              ))
            ) : (
              <li className={styles.active}>Nenhum índice encontrado</li>
            )}
          </ul>
        </aside>
      )}

      <section className={styles.contentContainer}>
        {chapter.type === 'pdf' ? (
          <div className={styles.canvasWrapper}>
            {isRendering && (
              <div className={styles.renderingOverlay}>Renderizando...</div>
            )}
            <canvas ref={canvasRef} className={styles.pdfCanvas} />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={currentResource?.path}
            className={styles.bookFrame}
            onLoad={handleIframeLoad}
            title="Leitor de Livro"
            sandbox="allow-same-origin"
          />
        )}
      </section>

      <footer
        className={`${styles.viewerFooter} ${!showUI ? styles.hidden : ''}`}
      >
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${
                chapter.type === 'pdf'
                  ? (pageNum / numPages) * 100
                  : ((currentChapterIdx + 1) / bookResources.length) * 100
              }%`,
            }}
          />
        </div>
      </footer>
    </main>
  );
}
