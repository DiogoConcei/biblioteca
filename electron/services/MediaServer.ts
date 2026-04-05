import { protocol, net } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import fse from 'fs-extra';

import LibrarySystem from './abstract/LibrarySystem';
import ImageManager from './ImageManager';

export default class MediaServer extends LibrarySystem {
  private readonly imageManager: ImageManager = new ImageManager();

  constructor() {
    super();
  }

  public register() {
    protocol.handle('lib-media', async (request) => {
      try {
        const url = new URL(request.url);
        let filePath = '';

        if (url.host === 'local') {
          const encodedPath = url.pathname.replace(/^\//, '');
          filePath = Buffer.from(encodedPath, 'base64').toString('utf-8');
          if (!this.isPathSafe(filePath)) return new Response('Access Denied', { status: 403 });
        } else if (url.host === 'storage') {
          filePath = path.join(this.baseStorageFolder, decodeURIComponent(url.pathname));
        } else if (url.host === 'archive') {
          const normalizedPath = url.pathname.replace(/^\//, '');
          const pathParts = normalizedPath.split('/').filter(Boolean);
          if (pathParts.length < 1) return new Response('Invalid Archive URL', { status: 400 });

          const encodedZip = pathParts[0];
          const internalPath = pathParts.slice(1).join('/') || 'index.html';
          let zipPath = Buffer.from(encodedZip, 'base64').toString('utf-8');

          if (zipPath.startsWith('lib-media://local/')) {
            const innerEncoded = zipPath.replace('lib-media://local/', '');
            zipPath = Buffer.from(innerEncoded, 'base64').toString('utf-8');
          }

          if (!this.isPathSafe(zipPath)) return new Response('Access Denied', { status: 403 });
          if (!(await fse.pathExists(zipPath))) return new Response('Archive Not Found', { status: 404 });

          const zipHash = Buffer.from(zipPath).toString('hex').substring(0, 12);
          const tempDest = path.join(this.baseStorageFolder, 'archive_cache', zipHash);
          filePath = path.join(tempDest, internalPath);

          if (!(await fse.pathExists(filePath))) {
            try {
              const ArchiveManager = (await import('./ArchiveManager')).default;
              const archiveManager = new ArchiveManager();
              await archiveManager.extractWith7zip(zipPath, tempDest);
            } catch (extractErr) {
              console.error(`❌ MediaServer: Falha na extração de "${zipPath}":`, extractErr);
              throw extractErr;
            }
          }

          if (!(await fse.pathExists(filePath))) return new Response('Not Found in Archive', { status: 404 });
        }

        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === '.html' || ext === '.xhtml') mimeType = 'text/html';
        else if (ext === '.css') mimeType = 'text/css';
        else if (ext === '.js') mimeType = 'application/javascript';
        else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        else if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.webp') mimeType = 'image/webp';
        else if (ext === '.svg') mimeType = 'image/svg+xml';
        else if (ext === '.pdf') mimeType = 'application/pdf';

        const response = await net.fetch(pathToFileURL(filePath).toString());

        if (mimeType === 'text/html' && url.searchParams.has('epub-theme')) {
          let html = await response.text();
          const theme = url.searchParams.get('epub-theme') || 'dark';
          const fontSize = url.searchParams.get('epub-font-size') || '18';
          const fontFamily = url.searchParams.get('epub-font-family') || 'serif';
          const lineHeight = url.searchParams.get('epub-line-height') || '1.5';
          const margin = url.searchParams.get('epub-margin') || '10';

          const themeColors = {
            light: { bg: '#ffffff', text: '#333333', link: '#6a4a93' },
            sepia: { bg: '#f4ecd8', text: '#5b4636', link: '#6a4a93' },
            dark: { bg: '#1a1a1a', text: '#d1d1d1', link: '#8963ba' },
          };

          const colors = themeColors[theme as keyof typeof themeColors] || themeColors.dark;

          const injectScript = `
            <script id="epub-communication-script">
              (function() {
                const getRail = () => document.getElementById('epub-reader-rail');
                
                const calculatePages = () => {
                  const rail = getRail();
                  if (!rail) return;
                  const totalWidth = rail.scrollWidth;
                  const viewportWidth = 1100; // Largura fixa da folha
                  const count = Math.max(1, Math.round(totalWidth / viewportWidth));
                  window.parent.postMessage({ type: 'EPUB_PAGES_COUNT', count: count }, '*');
                };

                window.addEventListener('load', calculatePages);
                window.addEventListener('resize', calculatePages);
                window.addEventListener('message', (event) => {
                  if (event.data.type === 'EPUB_GO_TO_PAGE') {
                    const rail = getRail();
                    if (!rail) return;
                    rail.style.transform = "translateX(-" + (event.data.index * 1100) + "px)";
                  }
                });

                let lastWidth = 0;
                setInterval(() => {
                  const rail = getRail();
                  if (rail && rail.scrollWidth !== lastWidth) {
                    lastWidth = rail.scrollWidth;
                    calculatePages();
                  }
                }, 1000);
              })();
            </script>
          `;

          const injectStyle = `
            <style id="epub-injected-styles">
              html, body {
                height: 100vh !important;
                width: 100vw !important;
                overflow: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
                background-color: transparent !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
              }
              
              /* Moldura Centralizada (Viewport) */
              #epub-viewport {
                width: 1100px !important;
                height: 96vh !important;
                overflow: hidden !important;
                position: relative !important;
                background-color: ${colors.bg} !important;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
                border-radius: 4px !important;
              }

              /* Moldura Centralizada (Viewport) */
              #epub-viewport {
                width: 1100px !important;
                height: 96vh !important;
                overflow: hidden !important;
                position: relative !important;
                background-color: ${colors.bg} !important;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
                border-radius: 4px !important;
                /* Adicionamos padding vertical na moldura, não no rail */
                padding: 3rem 0 !important;
                box-sizing: border-box !important;
              }

              /* Trilho de Colunas (Rail) */
              #epub-reader-rail {
                display: block !important;
                height: 100% !important; /* Preenche o viewport descontando o padding vertical */
                width: max-content !important; 
                
                /* Matemática perfeita de margens usando column-gap */
                /* margin: 0 a 25. Em 1100px, 1% = 11px */
                padding-left: calc(11px * ${margin}) !important;
                padding-right: calc(11px * ${margin}) !important;
                
                column-width: calc(1100px - (22px * ${margin})) !important;
                column-gap: calc(22px * ${margin}) !important;
                column-fill: auto !important;
                
                overflow: visible !important;
                will-change: transform !important;
                transition: transform 0.3s ease !important;
                transform-origin: top left !important;
              }

              #epub-reader-rail > * {
                /* Removemos os paddings laterais assassinos dos filhos */
                padding: 0 !important;
                box-sizing: border-box !important;
                color: ${colors.text} !important;
                font-family: ${fontFamily}, serif !important;
                font-size: ${fontSize}px !important;
                line-height: ${lineHeight} !important;
                text-align: justify !important;
                hyphens: auto !important;
                margin-bottom: 0.8em !important;
              }

              #epub-reader-rail p {
                margin: 0 0 0.6em 0 !important;
                text-indent: 1.5em !important;
              }

              #epub-reader-rail p:first-child,
              #epub-reader-rail h1 + p,
              #epub-reader-rail h2 + p,
              #epub-reader-rail h3 + p {
                text-indent: 0 !important;
              }

              img, figure, table { 
                max-width: 100% !important; 
                max-height: 60vh !important; 
                height: auto !important; 
                display: block !important; 
                margin: 1rem auto !important; 
                break-inside: avoid !important; 
              }
              a { color: ${colors.link} !important; }
              h1, h2, h3 { break-inside: avoid !important; }
            </style>
          `;

          if (html.includes('<body')) {
             html = html.replace(/(<body[^>]*>)/i, `$1<div id="epub-viewport"><div id="epub-reader-rail">`);
             html = html.replace(/<\/body>/i, `</div></div></body>`);
          } else {
             html = `<div id="epub-viewport"><div id="epub-reader-rail">${html}</div></div>`;
          }

          const combinedInjections = injectStyle + injectScript;
          html = html.includes('head') ? html.replace('</head>', `${combinedInjections}</head>`) : combinedInjections + html;

          return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' } });
        }

        const headers = new Headers(response.headers);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        if (mimeType !== 'application/octet-stream') headers.set('Content-Type', mimeType);

        return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
      } catch (error) {
        console.error('Erro no protocolo lib-media:', error);
        return new Response('Internal Error', { status: 500 });
      }
    });
  }

  private isPathSafe(filePath: string): boolean {
    const normalizedPath = path.resolve(filePath);
    const allowedRoots = [this.baseStorageFolder, this.userLibrary];
    const isInsideAllowed = allowedRoots.some((root) => normalizedPath.startsWith(path.resolve(root)));
    const safeExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.epub', '.cbz', '.cbr'];
    return isInsideAllowed || safeExtensions.includes(path.extname(normalizedPath).toLowerCase());
  }

  public static getFileURL(absolutePath: string): string {
    return `lib-media://local/${Buffer.from(absolutePath).toString('base64')}`;
  }
}
