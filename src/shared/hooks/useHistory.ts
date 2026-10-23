import { useEffect } from 'react';
import { useHistoryStore } from '../store/useHistoryStore';

export default function useHistory() {
  const recentSeries = useHistoryStore((s) => s.recentSeries) ?? [];
  const fetchHistory = useHistoryStore((s) => s.fetchHistory);
  const refreshHistory = useHistoryStore((s) => s.refreshHistory);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { recentSeries, refreshHistory };
}
