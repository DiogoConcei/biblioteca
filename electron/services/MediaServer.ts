import { protocol, net } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';

import LibrarySystem from './abstract/LibrarySystem';

export default class MediaServer extends LibrarySystem {
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
    const normalizedPath = path.normalize(filePath).toLowerCase();
    const storagePath = this.baseStorageFolder.toLowerCase();
    const libraryPath = this.userLibrary.toLowerCase();

    // Permite se estiver dentro do storage ou da biblioteca do usuário
    return (
      normalizedPath.startsWith(storagePath) ||
      normalizedPath.startsWith(libraryPath)
    );
  }

  // Método auxiliar para o frontend gerar a URL
  public static getFileURL(absolutePath: string): string {
    const encoded = Buffer.from(absolutePath).toString('base64');
    return `lib-media://local/${encoded}`;
  }
}
