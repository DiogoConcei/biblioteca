import { useEffect } from 'react';
import useSerieStore from '../store/useSerieStore';

export default function useSerie(serieName: string, literatureForm: string) {
  const fetchSerie = useSerieStore((state) => state.fetchSerie);

  useEffect(() => {
    async function getData() {
      try {
        await fetchSerie(serieName, literatureForm);
      } catch (e) {
        console.error(e);
      }
    }

    if (serieName && literatureForm) {
      getData();
    }
  }, [serieName, literatureForm]);
}
