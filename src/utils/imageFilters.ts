import { ViewerSettings } from '@/types/settings.interfaces';

/**
 * Aplica filtros de imagem à URL via query parameters.
 * 
 * @param url URL original da imagem
 * @param settings Configurações do visualizador
 * @returns URL com parâmetros de filtro aplicados
 */
export const getFilteredUrl = (url: string, settings: ViewerSettings): string => {
  if (!url) return '';

  const params = [];
  if (settings.brightness !== 1)
    params.push(`brightness=${settings.brightness}`);
  if (settings.contrast !== 1)
    params.push(`contrast=${settings.contrast}`);
  if (settings.grayscale) params.push(`grayscale=true`);
  if (settings.sharpness > 0) params.push(`sharpness=${settings.sharpness}`);

  if (params.length === 0) return url;

  const connector = url.includes('?') ? '&' : '?';
  return `${url}${connector}${params.join('&')}`;
};
