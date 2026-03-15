import { create } from 'zustand';
import { DownloadTask } from '../../electron/types/download.interfaces';

interface DownloadState {
  tasks: DownloadTask[];
  isInitialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  addTask: (taskData: Partial<DownloadTask>) => Promise<void>;
  pauseTask: (taskId: string) => Promise<void>;
  resumeTask: (taskId: string) => Promise<void>;
  cancelTask: (taskId: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  
  // Internal
  setTasks: (tasks: DownloadTask[]) => void;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  tasks: [],
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;

    // Buscar tarefas iniciais
    const initialTasks = await window.electronAPI.download.getTasks();
    set({ tasks: initialTasks, isInitialized: true });

    // Ouvir atualizações de progresso
    window.electronAPI.on('download:progress-update', (_event, tasks: DownloadTask[]) => {
      set({ tasks });
    });
  },

  setTasks: (tasks) => set({ tasks }),

  addTask: async (taskData) => {
    await window.electronAPI.download.addTask(taskData);
  },

  pauseTask: async (taskId) => {
    await window.electronAPI.download.pauseTask(taskId);
  },

  resumeTask: async (taskId) => {
    await window.electronAPI.download.resumeTask(taskId);
  },

  cancelTask: async (taskId) => {
    await window.electronAPI.download.cancelTask(taskId);
  },

  clearCompleted: async () => {
    await window.electronAPI.download.clearCompleted();
  }
}));
