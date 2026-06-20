import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

let counter = 0;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (type: ToastType, message: string, duration = 4000) => {
    const id = `toast-${++counter}-${Date.now()}`;
    set({ toasts: [...get().toasts, { id, type, message, duration }] });
    if (duration > 0) {
      setTimeout(() => get().removeToast(id), duration);
    }
  },

  removeToast: (id: string) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) });
  },
}));

/** Convenience helpers — importable anywhere */
export const toast = {
  success: (msg: string, dur?: number) => useToastStore.getState().addToast('success', msg, dur),
  error: (msg: string, dur?: number) => useToastStore.getState().addToast('error', msg, dur ?? 6000),
  info: (msg: string, dur?: number) => useToastStore.getState().addToast('info', msg, dur),
  warning: (msg: string, dur?: number) => useToastStore.getState().addToast('warning', msg, dur),
};
