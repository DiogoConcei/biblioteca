export type BackupFrequency = 'daily' | 'weekly' | 'monthly';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ComicCoverRegenerationProgress {
  total: number;
  processed: number;
  currentComic?: string;
  regenerated: number;
  skipped: number;
  failed: number;
}

export interface ComicCoverRegenerationResult {
  total: number;
  processed: number;
  regenerated: number;
  skipped: number;
  failed: number;
  failures: Array<{ comic: string; reason: string }>;
}

export interface BackupMeta {
  id: string;
  path: string;
  createdAt: string;
  description?: string;
  encrypted?: boolean;
}

export interface AppSettings {
  backupAuto: boolean;
  backupSchedule: {
    frequency: BackupFrequency;
    time: string;
  };
  backupRetention: number;
  uploadBackupsToDrive: boolean;
  themeMode: ThemeMode;
  accentColor: string;
  compactMode: boolean;
  sendLogsWithBugReport: boolean;
  driveConnected: boolean;
}

export interface SystemResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
  path?: string;
}

export interface CreateBackupOptions {
  encrypt?: boolean;
  password?: string;
  description?: string;
  includeLargeFiles?: boolean;
}

export interface ResetApplicationOptions {
  level: 'soft' | 'full';
  backupBefore?: boolean;
  preserve?: string[];
}

export interface CustomTimePickerProps {
  value: string; // formato "HH:mm"
  onChange: (time: string) => void;
  minuteStep?: number; // permite customizar intervalo
}
