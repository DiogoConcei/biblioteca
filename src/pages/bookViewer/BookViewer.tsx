import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  List,
} from 'lucide-react';

import useChapter from '../../hooks/useChapter';
import Loading from '../../components/Loading/Loading';
import { ChapterResource } from '../../../electron/types/media.interfaces';
import styles from './BookViewer.module.scss';

// Configuração do Worker do PDF.js
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function BookViewer() {
  const { serie_name: rawSerieName, chapter_id } = useParams<{
    serie_name: string;
    chapter_id: string;
  }>();

  const decode_serie_name = decodeURIComponent(rawSerieName ?? '');
  const chapter = useChapter(decode_serie_name, Number(chapter_id));

  // Estados Comuns
  const [showTOC, setShowTOC] = useState(false);

  // Estados PDF
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isRendering, setIsRendering] = useState(false);

  // Estados EPUB (Book)
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // --- Lógica PDF ---
  useEffect(() => {
    if (chapter.type === 'pdf' && chapter.originalPath) {
      const loadingTask = pdfjsLib.getDocument(chapter.originalPath);
      loadingTask.promise
        .then((pdf) => {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setPageNum(chapter.currentPage + 1 || 1);
        })
        .catch((err) => console.error('Erro ao carregar PDF:', err));
    }
  }, [chapter.originalPath, chapter.type, chapter.currentPage]);

  useEffect(() => {
    if (!pdfDoc || chapter.type !== 'pdf') return;

    const renderPage = async () => {
      setIsRendering(true);
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
        chapter.setCurrentPage(pageNum - 1);
      } catch (err) {
        console.error('Erro ao renderizar página:', err);
      } finally {
        setIsRendering(false);
      }
    };

    renderPage();
  }, [pdfDoc, pageNum, scale, chapter.type]);

  // --- Lógica EPUB (Book) ---
  const bookResources = (chapter.pages as unknown as ChapterResource[]) || [];
  const currentResource = bookResources[currentChapterIdx];

  const handleIframeLoad = () => {
    if (iframeRef.current) {
      // Injeção de CSS básico para o E-Reader (futuramente será dinâmico por temas)
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

  if (chapter.isLoading) return <Loading />;

  return (
    <main className={`${styles.bookViewer} ${styles[chapter.type]}`}>
      <header className={styles.viewerHeader}>
        <div className={styles.info}>
          <button className={styles.tocBtn} onClick={() => setShowTOC(!showTOC)}>
            <List size={20} />
          </button>
          <div className={styles.titleText}>
            <h2>{decode_serie_name}</h2>
            <span>{chapter.type === 'book' ? currentResource?.label : chapter.chapterName}</span>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.pagination}>
            <button onClick={() => changePage(-1)} disabled={chapter.type === 'pdf' ? pageNum <= 1 : currentChapterIdx === 0}>
              <ChevronLeft size={20} />
            </button>
            <span>
              {chapter.type === 'pdf'
                ? `${pageNum} / ${numPages}`
                : `${currentChapterIdx + 1} / ${bookResources.length}`}
            </span>
            <button onClick={() => changePage(1)} disabled={chapter.type === 'pdf' ? pageNum >= numPages : currentChapterIdx === bookResources.length - 1}>
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
                  onClick={() => { setCurrentChapterIdx(idx); setShowTOC(false); }}
                >
                  {res.label}
                </li>
              ))
            ) : (
              <li className={styles.active}>Documento PDF</li>
            )}
          </ul>
        </aside>
      )}

      <section className={styles.contentContainer}>
        {chapter.type === 'pdf' ? (
          <div className={styles.canvasWrapper}>
            {isRendering && <div className={styles.renderingOverlay}>Renderizando...</div>}
            <canvas ref={canvasRef} className={styles.pdfCanvas} />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={currentResource?.path}
            className={styles.bookFrame}
            onLoad={handleIframeLoad}
            title="Leitor de Livro"
          />
        )}
      </section>

      <footer className={styles.viewerFooter}>
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
