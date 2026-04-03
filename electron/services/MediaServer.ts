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
        // O host será o tipo de acesso (ex: local)
        // O pathname será o caminho codificado em base64 ou URI component

        let filePath = '';

        if (url.host === 'local') {
          // Decodifica o caminho absoluto (passado via base64 para evitar problemas de caractere na URL)
          const encodedPath = url.pathname.replace(/^\//, '');
          filePath = Buffer.from(encodedPath, 'base64').toString('utf-8');

          if (!this.isPathSafe(filePath)) {
            return new Response('Access Denied', { status: 403 });
          }
        } else if (url.host === 'storage') {
          // Acesso relativo ao storage folder
          filePath = path.join(
            this.baseStorageFolder,
            decodeURIComponent(url.pathname),
          );
        } else if (url.host === 'archive') {
          // lib-media://archive/[base64_zip]/caminho/interno/real.html
          const pathParts = url.pathname.split('/').filter(Boolean);
          if (pathParts.length < 2) {
            return new Response('Invalid Archive URL', { status: 400 });
          }

          const encodedZip = pathParts[0];
          const internalPath = pathParts.slice(1).join('/'); // Tudo após o primeiro / é o path interno

          const zipPath = Buffer.from(encodedZip, 'base64').toString('utf-8');

          // Segurança: valida o zipPath
          if (!this.isPathSafe(zipPath)) {
            return new Response('Access Denied', { status: 403 });
          }

          // Para servir o arquivo do archive, precisamos extraí-lo para um local temporário
          const tempDest = path.join(
            this.baseStorageFolder,
            'archive_cache',
            encodedZip.substring(0, 16), // Pasta única por arquivo ZIP (abreviada)
          );

          filePath = path.join(tempDest, internalPath);

          if (!(await fse.pathExists(filePath))) {
            console.log(
              `📦 MediaServer: Extraindo ${internalPath} de ${zipPath}`,
            );
            const ArchiveManager = (await import('./ArchiveManager')).default;
            const archiveManager = new ArchiveManager();
            // Extrai o arquivo preservando a estrutura
            await archiveManager.extractWith7zip(zipPath, tempDest);
          }

          if (!(await fse.pathExists(filePath))) {
            console.error(
              `❌ MediaServer: Arquivo não encontrado após extração: ${filePath}`,
            );
            return new Response('Not Found in Archive', { status: 404 });
          }
        }

        // --- Detecção de MIME-Type e Filtros ---
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

        // Parâmetros de Filtro (apenas para imagens)
        const isImage = mimeType.startsWith('image/');
        const brightness = parseFloat(
          url.searchParams.get('brightness') || '1',
        );
        const contrast = parseFloat(url.searchParams.get('contrast') || '1');
        const grayscale = url.searchParams.get('grayscale') === 'true';
        const sharpness = parseFloat(url.searchParams.get('sharpness') || '0');

        const hasFilters =
          isImage &&
          (brightness !== 1 || contrast !== 1 || grayscale || sharpness !== 0);

        if (hasFilters) {
          const buffer = await this.imageManager.applyFilters(filePath, {
            brightness,
            contrast,
            grayscale,
            sharpness,
          });

          return new Response(buffer, {
            status: 200,
            headers: {
              'Content-Type': 'image/webp',
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }

        // Retorna o arquivo usando o net.fetch nativo (muito eficiente)
        const response = await net.fetch(pathToFileURL(filePath).toString());

        // Clonamos a resposta para adicionar headers de cache e MIME correto
        const headers = new Headers(response.headers);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        if (mimeType !== 'application/octet-stream') {
          headers.set('Content-Type', mimeType);
        }

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch (error) {
        console.error('Erro no protocolo lib-media:', error);
        return new Response('Internal Error', { status: 500 });
      }
    });
  }

  private isPathSafe(filePath: string): boolean {
    const normalizedPath = path.resolve(filePath);

    // Lista de diretórios permitidos
    const allowedRoots = [
      this.baseStorageFolder,
      this.userLibrary,
      // Se houver pastas de biblioteca customizadas no futuro, elas devem ser adicionadas aqui
    ];

    const isInsideAllowed = allowedRoots.some((root) =>
      normalizedPath.startsWith(path.resolve(root)),
    );

    // Se não estiver nas pastas do app, verifica se é uma extensão de mídia segura
    // Isso permite abrir arquivos fora da biblioteca (importação direta),
    // mas apenas se forem formatos suportados.
    const safeExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.pdf',
      '.epub',
      '.cbz',
      '.cbr',
    ];
    const hasSafeExtension = safeExtensions.includes(
      path.extname(normalizedPath).toLowerCase(),
    );

    return isInsideAllowed || hasSafeExtension;
  }

  // Método auxiliar para o frontend gerar a URL
  public static getFileURL(absolutePath: string): string {
    const encoded = Buffer.from(absolutePath).toString('base64');
    return `lib-media://local/${encoded}`;
  }
}
