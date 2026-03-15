import { useEffect } from 'react';
import {
  Download,
  Pause,
  Play,
  X,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';

import { useDownloadStore } from '../../store/useDownloadStore';
import styles from './Downloads.module.scss';

export default function Downloads() {
  const {
    tasks,
    initialize,
    pauseTask,
    resumeTask,
    cancelTask,
    clearCompleted,
  } = useDownloadStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className={styles.iconSuccess} />;
      case 'error':
        return <AlertCircle className={styles.iconError} />;
      case 'downloading':
        return <Download className={styles.iconDownloading} />;
      case 'paused':
        return <Pause className={styles.iconPaused} />;
      case 'queued':
        return <Clock className={styles.iconQueued} />;
      default:
        return <Clock />;
    }
  };

  return (
    <div className={styles.downloadsPage}>
      <header className={styles.header}>
        <h1>Gerenciador de Downloads</h1>
        <button onClick={clearCompleted} className={styles.clearButton}>
          <Trash2 size={20} />
          Limpar Concluídos
        </button>
      </header>

      <div className={styles.taskList}>
        {tasks.length === 0 ? (
          <div className={styles.emptyState}>
            <Download size={64} />
            <p>Nenhum download em andamento</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className={styles.taskItem}>
              <div className={styles.taskInfo}>
                <div className={styles.titleRow}>
                  <span className={styles.statusIcon}>
                    {getStatusIcon(task.status)}
                  </span>
                  <div className={styles.nameContainer}>
                    <h3>{task.serieName}</h3>
                    <p>{task.chapterName}</p>
                  </div>
                </div>

                <div className={styles.progressRow}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>
                    {Math.round(task.progress)}%
                  </span>
                </div>

                <div className={styles.metaRow}>
                  <span>
                    {formatBytes(task.downloadedBytes)} /{' '}
                    {task.size ? formatBytes(task.size) : '--'}
                  </span>
                  {task.status === 'downloading' && (
                    <span className={styles.speed}>
                      {formatSpeed(task.speed)}
                    </span>
                  )}
                  <span className={styles.statusText}>{task.status}</span>
                </div>
              </div>

              <div className={styles.actions}>
                {task.status === 'downloading' && (
                  <button onClick={() => pauseTask(task.id)} title="Pausar">
                    <Pause size={20} />
                  </button>
                )}
                {task.status === 'paused' && (
                  <button onClick={() => resumeTask(task.id)} title="Continuar">
                    <Play size={20} />
                  </button>
                )}
                {(task.status === 'downloading' ||
                  task.status === 'paused' ||
                  task.status === 'queued') && (
                  <button
                    onClick={() => cancelTask(task.id)}
                    title="Cancelar"
                    className={styles.cancelBtn}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
