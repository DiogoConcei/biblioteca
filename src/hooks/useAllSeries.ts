import { useEffect, useState } from 'react';

import { viewData } from '../../electron/types/electron-auxiliar.interfaces';
import { useUIStore } from '../store/useUIStore';

export default function useAllSeries() {
  const [series, setSeries] = useState<viewData[] | null>(null);
  const controlFetching = useUIStore((state) => state.controlFetching);

  useEffect(() => {
    async function getAllSeries() {
      try {
        controlFetching(true, null);

        const response = await window.electronAPI.series.getSeries();

        if (!response.success) {
          controlFetching(false);
          setSeries(null);
        }

        if (response.success && response.data) {
          controlFetching(false, null);
          setSeries(response.data);
        }
      } catch (e) {
        controlFetching(
          false,
          'Aconteceu um erro desconhecido ao buscar séries',
        );
      } finally {
        controlFetching(false);
      }
    }

    getAllSeries();
  }, [controlFetching]);

  return series;
}
