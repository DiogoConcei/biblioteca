import { useEffect, useRef, useState, memo, forwardRef, useImperativeHandle } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

import Loading from '../Loading/Loading';
import { PdfViewerRef } from '../../types/components.interfaces';
import styles from './PdfViewer.module.scss';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

interface PdfPageProps {
  pdfDocument: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  scale: number;
}

// Sub-componente memoizado para renderizar uma única página
const PdfPage = memo(({ pdfDocument, pageNumber, scale }: PdfPageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    let isMounted = true;

    async function renderPage() {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;

        if (!canvas || !isMounted) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderTask = page.render({
          canvasContext: context,
          viewport,
          canvas: canvas,
        });
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err) {
        if (err instanceof Error && err.name !== 'RenderingCancelledException') {
          console.error(`[PdfPage] Erro na página ${pageNumber}:`, err);
        }
      }
    }

    void renderPage();
    return () => {
      isMounted = false;
      if (renderTaskRef.current) renderTaskRef.current.cancel();
    };
  }, [pdfDocument, pageNumber, scale]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
});

interface PdfViewerProps {
  path: string;
  currentPage: number;
  scale: number;
  readingMode: 'single' | 'double' | 'vertical';
  onPdfLoaded: (pdf: pdfjsLib.PDFDocumentProxy, totalPages: number, outline: { href?: string; label?: string; title?: string; dest?: unknown }[]) => void;
  onPageChange: (page: number) => void;
}

const PdfViewer = forwardRef<PdfViewerRef, PdfViewerProps>(({ path, currentPage, scale, readingMode, onPdfLoaded, onPageChange }, ref) => {
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useImperativeHandle(ref, () => ({
    goToDestination: async (dest: unknown) => {
      if (!pdfDocument || !dest) return;
      try {
        // dest pode ser um nome (string) ou um array [ref, {name: 'XYZ'}, ...]
        const explicitDest = typeof dest === 'string' 
          ? await pdfDocument.getDestination(dest) 
          : (dest as unknown[]);

        if (explicitDest && Array.isArray(explicitDest)) {
          const ref = explicitDest[0];
          if (ref && typeof ref === 'object' && 'num' in ref) {
            const pageIndex = await pdfDocument.getPageIndex(ref as unknown as { num: number; gen: number });
            onPageChange(pageIndex);
          }
        }
      } catch (err) {
        console.error('[PdfViewer] Erro ao navegar para destino:', err);
      }
    }
  }));

  useEffect(() => {
    if (!path) return;
    let isMounted = true;
    setIsLoading(true);

    const loadingTask = pdfjsLib.getDocument(path);
    loadingTask.promise.then(async (pdf) => {
      if (!isMounted) {
        void pdf.destroy();
        return;
      }
      setPdfDocument(pdf);
      try {
        const outline = await pdf.getOutline();
        onPdfLoaded(pdf, pdf.numPages, (outline || []) as { href?: string; label?: string; title?: string; dest?: unknown }[]);
      } catch {
        onPdfLoaded(pdf, pdf.numPages, []);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }).catch(err => {
      console.error('[PdfViewer] Erro ao carregar:', err);
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
      // GEMINI NOTE: O documento é destruído no unmount do componente pai
    };
  }, [path, onPdfLoaded]);

  // Destruição do documento ao fechar o visualizador
  useEffect(() => {
    return () => {
      if (pdfDocument) {
        void pdfDocument.destroy();
      }
    };
  }, [pdfDocument]);

  if (isLoading || !pdfDocument) {
    return (
      <div className={styles.container}>
        <Loading />
      </div>
    );
  }

  const renderContent = () => {
    switch (readingMode) {
      case 'double':
        return (
          <div className={styles.doubleLayout}>
            <div className={styles.pageWrapper}>
               <PdfPage pdfDocument={pdfDocument} pageNumber={currentPage + 1} scale={scale} />
            </div>
            {currentPage + 1 < pdfDocument.numPages && (
              <div className={styles.pageWrapper}>
                <PdfPage pdfDocument={pdfDocument} pageNumber={currentPage + 2} scale={scale} />
              </div>
            )}
          </div>
        );

      case 'vertical':
        return (
          <div className={styles.verticalLayout}>
            {Array.from({ length: pdfDocument.numPages }, (_, i) => (
              <div key={i} className={styles.verticalPage}>
                <PdfPage pdfDocument={pdfDocument} pageNumber={i + 1} scale={scale} />
              </div>
            ))}
          </div>
        );

      case 'single':
      default:
        return (
          <div className={styles.singleLayout}>
            <PdfPage pdfDocument={pdfDocument} pageNumber={currentPage + 1} scale={scale} />
          </div>
        );
    }
  };

  return <div className={styles.pdfWrapper}>{renderContent()}</div>;
});

PdfViewer.displayName = 'PdfViewer';
export default PdfViewer;
