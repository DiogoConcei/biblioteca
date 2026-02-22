export type BackupFormat = 'zip' | 'tar' | '7z';
export type BackupDestination = 'local' | 'google_drive';

export interface AppConfig {
  settings: {
    reading_mode: 'single_page' | 'double_page' | 'vertical_scroll';
    zoom: 'fit_width' | 'fit_height' | 'original_size';
    light_mode: boolean;
    full_screen: boolean;
    backup: BackupConfig;
  };

  integrations?: {
    google_drive?: {
      connected: boolean;
      folder_id?: string;
      last_sync_status?: 'success' | 'error' | 'pending';
    };
  };

  metadata: {
    global_id: number;
    last_backup_at?: string; // ISO date
  };
}

export interface BackupConfig {
  enabled: boolean;
  interval_days: number;
  format: BackupFormat;
  destination: BackupDestination;
  max_backups?: number;
}
