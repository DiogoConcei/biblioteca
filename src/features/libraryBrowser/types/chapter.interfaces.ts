import useSerieStore from '@/shared/store/useSerieStore';
import { type ReactNode } from 'react';

export type Chapter = ReturnType<typeof useSerieStore.getState>['chapters'][number];
export type Filter = 'all' | 'unread' | 'read' | 'downloaded';

export interface ChapterMenuItem {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onSelect: () => void;
}
