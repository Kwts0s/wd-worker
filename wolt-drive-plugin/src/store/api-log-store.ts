import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ApiLogEntry } from '@/types/api-log';

interface ApiLogState {
  logs: ApiLogEntry[];
  maxLogs: number;
  
  // Actions
  addLog: (log: ApiLogEntry) => void;
  clearLogs: () => void;
  removeLog: (id: string) => void;
}

export const useApiLogStore = create<ApiLogState>()(
  devtools(
    persist(
      (set) => ({
        logs: [],
        maxLogs: 100, // Keep last 100 logs
        
        addLog: (log) => {
          set((state) => ({
            logs: [log, ...state.logs].slice(0, state.maxLogs),
          }));
        },
        
        clearLogs: () => {
          set({ logs: [] });
        },
        
        removeLog: (id) => {
          set((state) => ({
            logs: state.logs.filter((log) => log.id !== id),
          }));
        },
      }),
      {
        name: 'api-log-storage',
        partialize: (state) => ({
          logs: state.logs.slice(0, 50), // Only persist last 50 logs
        }),
      }
    )
  )
);
