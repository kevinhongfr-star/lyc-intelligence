import React from 'react';
import { useToastStore, type Toast } from '@/stores/toastStore';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons: Record<Toast['type'], React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />,
  error: <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
};

const bgColors: Record<Toast['type'], string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-amber-50 border-amber-200',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            flex items-start gap-3 p-4 border rounded-none
            shadow-[0_4px_12px_rgba(0,0,0,0.08)]
            pointer-events-auto
            ${bgColors[t.type]}
          `}
          style={{
            animation: 'toast-slide-in 0.25s ease-out',
          }}
        >
          {icons[t.type]}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{t.message}</p>
            {t.description && (
              <p className="text-xs text-gray-600 mt-1">{t.description}</p>
            )}
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick();
                  removeToast(t.id);
                }}
                className="text-xs font-medium text-gray-900 underline underline-offset-2 hover:no-underline mt-2"
              >
                {t.action.label}
              </button>
            )}
          </div>

          <button
            onClick={() => removeToast(t.id)}
            className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 transition-colors -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes toast-slide-in {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export default ToastContainer;
