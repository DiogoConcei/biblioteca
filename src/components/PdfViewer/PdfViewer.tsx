import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configuração obrigatória do worker do PDF.js para ambiente Vite/Web
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  path: string;
  currentPage: number;
  scale: number;
  onPdfLoaded: (pdf: pdfjsLib.PDFDocumentProxy, totalPages: number, outline: any[]) => void;
}

export default function PdfViewer({ path, currentPage, scale, onPdfLoaded }: PdfViewerProps) {
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Carregamento do Documento PDF
  useEffect(() => {
    if (!path) return;

    let isMounted = true;
    const loadingTask = pdfjsLib.getDocument(path);
    
    loadingTask.promise.then(async (pdf) => {
      if (!isMounted) {
        pdf.destroy();
        return;
      }
      setPdfDocument(pdf);
      
      try {
        const outline = await pdf.getOutline();
        onPdfLoaded(pdf, pdf.numPages, outline);
      } catch (e) {
        onPdfLoaded(pdf, pdf.numPages, []);
      }
    }).catch((err) => {
      console.error('[PdfViewer] Erro ao carregar PDF:', err);
    });

    return () => { isMounted = false; };
  }, [path]);

  // 2. Renderização da Página
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    let isMounted = true;
    const pageNumber = currentPage + 1;

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
        console.error('[PdfViewer] Erro na renderização:', err);
      }
    }

    renderPage();
    return () => { 
      isMounted = false;
      if (renderTaskRef.current) renderTaskRef.current.cancel();
    };
  }, [pdfDocument, currentPage, scale]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'min-content', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)' }}>
      <canvas ref={canvasRef} style={{ backgroundColor: 'white', maxWidth: '100%' }} />
    </div>
  );
}
