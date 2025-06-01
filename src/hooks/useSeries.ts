import { useEffect } from 'react';

import { useSeriesStore } from '../store/seriesStore';

export function useSeries() {
  const series = useSeriesStore(state => state.series);
  const fetchSeries = useSeriesStore(state => state.fetchSeries);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  return series;
}
