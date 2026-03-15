import { BrowserWindow, ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fse from 'fs-extra';

import LibrarySystem from './abstract/LibrarySystem';
import { DownloadTask, DownloadTaskStatus } from '../types/download.interfaces';

export default class DownloadManager extends LibrarySystem {
  private tasks: Map<string, DownloadTask> = new Map();
  private activeDownloads: number = 0;
  private readonly MAX_CONCURRENT_DOWNLOADS = 3;
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow | null) {
    super();
    this.mainWindow = mainWindow;
    this.setupIpc();
  }

  private setupIpc() {
    ipcMain.handle('download:get-tasks', () => Array.from(this.tasks.values()));

    ipcMain.handle(
      'download:add-task',
      async (_event, taskData: Partial<DownloadTask>) => {
        return this.addTask(taskData);
      },
    );

    ipcMain.handle('download:pause-task', (_event, taskId: string) => {
      this.updateTaskStatus(taskId, 'paused');
      return true;
    });

    ipcMain.handle('download:resume-task', (_event, taskId: string) => {
      const task = this.tasks.get(taskId);
      if (task && task.status === 'paused') {
        this.updateTaskStatus(taskId, 'queued');
        this.processQueue();
      }
      return true;
    });

    ipcMain.handle('download:cancel-task', (_event, taskId: string) => {
      this.cancelTask(taskId);
      return true;
    });

    ipcMain.handle('download:clear-completed', () => {
      for (const [id, task] of this.tasks.entries()) {
        if (task.status === 'completed' || task.status === 'cancelled') {
          this.tasks.delete(id);
        }
      }
      this.notifyFrontend();
      return true;
    });
  }

  public addTask(taskData: Partial<DownloadTask>): DownloadTask {
    const id = uuidv4();
    const task: DownloadTask = {
      id,
      serieId: taskData.serieId || 0,
      serieName: taskData.serieName || 'Desconhecido',
      chapterId: taskData.chapterId || 0,
      chapterName: taskData.chapterName || 'Capítulo',
      status: 'queued',
      progress: 0,
      downloadedBytes: 0,
      speed: 0,
      outputPath: taskData.outputPath || '',
      url: taskData.url,
      createdAt: new Date().toISOString(),
    };

    this.tasks.set(id, task);
    this.notifyFrontend();
    this.processQueue();
    return task;
  }

  private async processQueue() {
    if (this.activeDownloads >= this.MAX_CONCURRENT_DOWNLOADS) return;

    const nextTask = Array.from(this.tasks.values()).find(
      (t) => t.status === 'queued',
    );
    if (!nextTask) return;

    this.startDownload(nextTask);
  }

  private async startDownload(task: DownloadTask) {
    this.activeDownloads++;
    this.updateTaskStatus(task.id, 'downloading');

    try {
      // Simulação de download para testes iniciais
      // Futuramente aqui entrará a lógica de HTTP Stream ou P2P
      await this.simulateDownload(task);

      this.updateTaskStatus(task.id, 'completed');
    } catch (error: any) {
      console.error(`Erro no download ${task.id}:`, error);
      task.error = error.message;
      this.updateTaskStatus(task.id, 'error');
    } finally {
      this.activeDownloads--;
      this.processQueue();
    }
  }

  private async simulateDownload(task: DownloadTask) {
    const totalSize = 100 * 1024 * 1024; // 100MB simulados
    task.size = totalSize;

    for (let i = 0; i <= 100; i += 5) {
      if (this.tasks.get(task.id)?.status !== 'downloading') {
        throw new Error('Download interrompido');
      }

      task.progress = i;
      task.downloadedBytes = (totalSize * i) / 100;
      task.speed = 2 * 1024 * 1024; // 2MB/s constante na simulação

      this.notifyFrontend();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  private cancelTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      if (task.status === 'downloading') {
        // Lógica para abortar o request HTTP virá aqui
      }
      this.updateTaskStatus(taskId, 'cancelled');
    }
  }

  private updateTaskStatus(taskId: string, status: DownloadTaskStatus) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      if (status === 'completed') task.completedAt = new Date().toISOString();
      this.notifyFrontend();
    }
  }

  private notifyFrontend() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(
        'download:progress-update',
        Array.from(this.tasks.values()),
      );
    }
  }
}
