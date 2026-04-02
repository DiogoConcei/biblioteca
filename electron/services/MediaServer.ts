import { protocol, net } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';

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
        } else if (url.host === 'storage') {
          // Acesso relativo ao storage folder
          filePath = path.join(
            this.baseStorageFolder,
            decodeURIComponent(url.pathname),
          );
        } else if (url.host === 'archive') {
          // lib-media://archive/[base64_zip]/[base64_interno]
          const pathParts = url.pathname.split('/').filter(Boolean);
          if (pathParts.length < 2) {
            return new Response('Invalid Archive URL', { status: 400 });
          }

          const zipPath = Buffer.from(pathParts[0], 'base64').toString('utf-8');
          const internalPath = Buffer.from(pathParts[1], 'base64').toString(
            'utf-8',
          );

          // Segurança: valida o zipPath
          if (!this.isPathSafe(zipPath)) {
            return new Response('Access Denied', { status: 403 });
          }

          // Para servir o arquivo do archive, precisamos extraí-lo para um local temporário
          // No futuro, isso deve ser substituído por um stream direto do ZIP em memória
          const tempDest = path.join(
            this.baseStorageFolder,
            'archive_cache',
            pathParts[0], // ID baseado no hash/path do ZIP
          );

          filePath = path.join(tempDest, internalPath);

          if (!(await fse.pathExists(filePath))) {
            const ArchiveManager = (await import('./ArchiveManager')).default;
            const archiveManager = new ArchiveManager();
            // Extrai apenas o arquivo solicitado
            await archiveManager.extractWith7zip(zipPath, tempDest);
          }
        }

        // Validação de Segurança Básica
        // Garante que não estamos acessando arquivos fora das pastas do app ou do sistema de mídia
        const isSafe = this.isPathSafe(filePath);

        if (!isSafe) {
          console.error(
            `Tentativa de acesso a caminho não seguro: ${filePath}`,
          );
          return new Response('Access Denied', { status: 403 });
        }

        // Parâmetros de Filtro
        const brightness = parseFloat(url.searchParams.get('brightness') || '1');
        const contrast = parseFloat(url.searchParams.get('contrast') || '1');
        const grayscale = url.searchParams.get('grayscale') === 'true';
        const sharpness = parseFloat(url.searchParams.get('sharpness') || '0');

        const hasFilters =
          brightness !== 1 || contrast !== 1 || grayscale || sharpness !== 0;

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

        // Clonamos a resposta para adicionar headers de cache
        const headers = new Headers(response.headers);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

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
    // Por enquanto, vamos permitir o acesso a arquivos locais se eles existirem
    // O Electron já impõe restrições de sandbox se configurado.
    // Futuramente podemos restringir a extensões específicas (.jpg, .pdf, etc)
    return true; 
  }

  // Método auxiliar para o frontend gerar a URL
  public static getFileURL(absolutePath: string): string {
    const encoded = Buffer.from(absolutePath).toString('base64');
    return `lib-media://local/${encoded}`;
  }
}
