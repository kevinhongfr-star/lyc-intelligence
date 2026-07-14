import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  action?: ToastAction;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
}

let counter = 0;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++counter}-${Date.now()}`;
    const fullToast: Toast = { id, duration: 4000, ...toast };
    set({ toasts: [...get().toasts, fullToast] });
    if (fullToast.duration && fullToast.duration > 0) {
      setTimeout(() => get().removeToast(id), fullToast.duration);
    }
    return id;
  },

  removeToast: (id: string) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) });
  },

  updateToast: (id: string, updates: Partial<Toast>) => {
    set({
      toasts: get().toasts.map(t => (t.id === id ? { ...t, ...updates } : t)),
    });
  },
}));

export const toast = {
  success: (message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) =>
    useToastStore.getState().addToast({ type: 'success', message, ...options }),

  error: (message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) =>
    useToastStore.getState().addToast({
      type: 'error',
      message,
      duration: 6000,
      ...options,
    }),

  info: (message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) =>
    useToastStore.getState().addToast({ type: 'info', message, ...options }),

  warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) =>
    useToastStore.getState().addToast({ type: 'warning', message, ...options }),

  dismiss: (id: string) => useToastStore.getState().removeToast(id),

  update: (id: string, updates: Partial<Toast>) =>
    useToastStore.getState().updateToast(id, updates),
};

export default useToastStore;
