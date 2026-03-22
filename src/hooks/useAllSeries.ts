import { useEffect } from 'react';

import { useAllSeriesStore } from '../store/useAllSeriesStore';

export default function useAllSeries() {
  const { series, fetchAllSeries } = useAllSeriesStore();

  useEffect(() => {
    fetchAllSeries();
  }, [fetchAllSeries]);

  return series && series.length > 0 ? series : null;
}
