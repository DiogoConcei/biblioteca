import useSerieStore from '@/shared/store/useSerieStore';

export type Chapter = ReturnType<typeof useSerieStore.getState>['chapters'][number];
export type Filter = 'all' | 'unread' | 'read' | 'downloaded';
