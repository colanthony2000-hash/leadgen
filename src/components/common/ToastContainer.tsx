import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Sparkles } from 'lucide-react';
import { ToastMessage } from '../../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
              isSuccess
                ? 'bg-slate-900/95 border-emerald-500/30 text-slate-100 shadow-emerald-500/5'
                : isError
                ? 'bg-slate-900/95 border-rose-500/30 text-slate-100 shadow-rose-500/5'
                : isWarning
                ? 'bg-slate-900/95 border-amber-500/30 text-slate-100 shadow-amber-500/5'
                : 'bg-slate-900/95 border-blue-500/30 text-slate-100 shadow-blue-500/5'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Sparkles className="w-4 h-4 text-amber-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-semibold text-white tracking-tight leading-snug">
                {toast.title}
              </h5>
              {toast.message && (
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {toast.message}
                </p>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-1 text-slate-500 hover:text-slate-300 rounded-md transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
