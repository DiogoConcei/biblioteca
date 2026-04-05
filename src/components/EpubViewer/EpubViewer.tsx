import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { EpubView } from 'react-reader';

import { EpubSettings } from '../../types/settings.interfaces';

// Interfaces para tipagem forte do motor epub.js
interface EpubLocation {
  start: {
    location: number;
    cfi: string;
    href: string;
  };
  end: {
    location: number;
    cfi: string;
    href: string;
  };
}

interface EpubRendition {
  next: () => Promise<void>;
  prev: () => Promise<void>;
  display: (target?: string) => Promise<void>;
  spread: (mode: 'none' | 'auto') => void;
  flow: (mode: 'paginated' | 'scrolled') => void;
  currentLocation: () => EpubLocation | null;
  location?: {
    start: { cfi: string; href: string };
  };
  themes: {
    fontSize: (size: string) => void;
    font: (family: string) => void;
    register: (name: string, rules: Record<string, unknown>) => void;
    select: (name: string) => void;
  };
  book: {
    ready: Promise<void>;
    locations: {
      length: number;
      total: number;
      generate: (chars: number) => Promise<string[]>;
      locationFromCfi: (cfi: string) => number;
      cfiFromLocation: (loc: number) => string;
      percentageFromCfi: (cfi: string) => number;
    };
    spine: {
      get: (target: string) => { title: string } | null;
    };
  };
  manager?: {
    container: HTMLElement;
  };
}

interface EpubViewerProps {
  url: string;
  lastCfi?: string;
  settings: EpubSettings;
  readingMode: 'single' | 'double' | 'webtoon';
  onLocationChange: (
    cfi: string,
    page: number,
    total: number,
    percent: number,
    chapterLabel: string,
  ) => void;
  onTocLoaded: (toc: any[]) => void;
}

export interface EpubViewerRef {
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

const EpubViewer = forwardRef<EpubViewerRef, EpubViewerProps>(
  (
    { url, lastCfi, settings, readingMode, onLocationChange, onTocLoaded },
    ref,
  ) => {
    const renditionRef = useRef<EpubRendition | null>(null);
    const tocRef = useRef<any[]>([]);
    const [isReady, setIsReady] = useState(false);
    const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);

    // Expõe métodos para o componente pai (BookViewer)
    useImperativeHandle(ref, () => ({
      nextPage: () => {
        if (renditionRef.current) renditionRef.current.next();
      },
      prevPage: () => {
        if (renditionRef.current) renditionRef.current.prev();
      },
      goToPage: (page: number) => {
        if (
          renditionRef.current &&
          renditionRef.current.book.locations.length > 0
        ) {
          const cfi = renditionRef.current.book.locations.cfiFromLocation(page);
          renditionRef.current.display(cfi);
        }
      },
    }));

    // Busca o EPUB e converte para ArrayBuffer
    useEffect(() => {
      if (!url) return;

      let isMounted = true;
      fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error('Falha ao carregar EPUB');
          return response.arrayBuffer();
        })
        .then((data) => {
          if (isMounted) setBuffer(data);
        })
        .catch((err) => {
          console.error('Erro ao converter EPUB para buffer:', err);
        });

      return () => {
        isMounted = false;
      };
    }, [url]);

    // Aplica estilos quando as configurações mudam
    useEffect(() => {
      if (renditionRef.current && isReady) {
        const rendition = renditionRef.current;
        const epubSettings = settings;

        rendition.themes.fontSize(`${epubSettings.fontSize}px`);
        rendition.themes.font(epubSettings.fontFamily);

        if (typeof rendition.spread === 'function') {
          rendition.spread(readingMode === 'single' ? 'none' : 'auto');
        }

        const themeColors = {
          light: { bg: '#ffffff', text: '#333333', link: '#6a4a93' },
          sepia: { bg: '#f4ecd8', text: '#5b4636', link: '#6a4a93' },
          dark: { bg: '#1a1a1a', text: '#d1d1d1', link: '#8963ba' },
        };
        const colors =
          themeColors[epubSettings.theme as keyof typeof themeColors] ||
          themeColors.dark;

        rendition.themes.register('custom', {
          body: {
            background: 'transparent !important',
            color: `${colors.text} !important`,
            padding: '40px 60px !important', // Padding mais generoso para estilo livro
            'line-height': `${epubSettings.lineHeight} !important`,
          },
          a: { color: `${colors.link} !important` },
          'img, figure': {
            'max-width': '100% !important',
            height: 'auto !important',
          },
        });
        rendition.themes.select('custom');
      }
    }, [settings, isReady, readingMode]);

    if (!buffer) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: '#888',
          }}
        >
          Carregando Leitor...
        </div>
      );
    }

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <EpubView
          url={buffer}
          location={lastCfi || null}
          locationChanged={(epubcfi: string) => {
            console.log('[EPUB] locationChanged:', {
              locationsLength: renditionRef.current?.book?.locations?.length,
              locationsTotal: renditionRef.current?.book?.locations?.total,
              isReady,
              epubcfi,
            });
            if (
              renditionRef.current &&
              renditionRef.current.book.locations.total > 0
            ) {
              const location = renditionRef.current.currentLocation();
              if (location && location.start) {
                const page = location.start.location;
                const total = renditionRef.current.book.locations.total;

                if (page !== undefined && total !== undefined) {
                  const percent =
                    renditionRef.current?.book?.locations?.percentageFromCfi(
                      epubcfi,
                    ) ?? 0;

                  // Busca o título no TOC pelo href
                  const currentHref =
                    location.start.href ||
                    renditionRef.current?.location?.start?.href ||
                    '';
                  const tocItem = tocRef.current.find(
                    (item) =>
                      item.href?.includes(currentHref) ||
                      currentHref?.includes(item.href),
                  );
                  const chapterLabel = tocItem?.label || tocItem?.title || '';

                  // As locations são 1-indexed. Usamos page - 1 para a UI (index 0).
                  onLocationChange(
                    epubcfi,
                    page > 0 ? page - 1 : 0,
                    total,
                    Math.round(percent * 100),
                    chapterLabel,
                  );
                  return;
                }
              }
            }
            // Fallback se locations não estiverem geradas ainda
            onLocationChange(epubcfi, 0, 1, -1, '');
          }}
          getRendition={(rendition) => {
            const epubRendition = rendition as unknown as EpubRendition;
            renditionRef.current = epubRendition;

            // Força o layout desde o início
            if (typeof epubRendition.spread === 'function') {
              epubRendition.spread(readingMode === 'single' ? 'none' : 'auto');
            }
            if (typeof epubRendition.flow === 'function') {
              epubRendition.flow('paginated');
            }

            if (epubRendition.manager && epubRendition.manager.container) {
              const iframe =
                epubRendition.manager.container.querySelector('iframe');
              if (iframe) {
                iframe.setAttribute(
                  'sandbox',
                  'allow-scripts allow-forms allow-popups',
                );
              }
            }

            epubRendition.book.ready
              .then(() => {
                setIsReady(true);
                return epubRendition.book.locations.generate(1600);
              })
              .then(() => {
                const location = epubRendition.currentLocation();
                if (location && location.start) {
                  const page = location.start.location;
                  const total = epubRendition.book.locations.total;
                  const currentCfi = location.start.cfi;

                  if (currentCfi && page !== undefined && total !== undefined) {
                    const percent = Math.round(
                      epubRendition.book.locations.percentageFromCfi(
                        currentCfi,
                      ) * 100,
                    );

                    const currentHref =
                      location.start.href ||
                      epubRendition.location?.start?.href ||
                      '';
                    const tocItem = tocRef.current.find(
                      (item) =>
                        item.href?.includes(currentHref) ||
                        currentHref?.includes(item.href),
                    );
                    const chapterLabel = tocItem?.label || tocItem?.title || '';

                    onLocationChange(
                      currentCfi,
                      page > 0 ? page - 1 : 0,
                      total,
                      percent,
                      chapterLabel,
                    );
                  }
                }
              });
          }}
          tocChanged={(toc) => {
            tocRef.current = toc;
            onTocLoaded(toc);
          }}
          epubOptions={{
            allowScriptedContent: false,
            spread: readingMode === 'single' ? 'none' : 'auto',
            flow: 'paginated',
          }}
        />
      </div>
    );
  },
);
EpubViewer.displayName = 'EpubViewer';
export default EpubViewer;
