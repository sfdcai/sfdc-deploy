import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export const Toaster: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-80 p-4 rounded-lg shadow-lg border ${
            toast.variant === 'destructive'
              ? 'bg-red-50 border-red-200'
              : 'bg-white border-slate-200'
          } animate-in slide-in-from-right duration-300`}
        >
          <div className="flex items-start gap-3">
            {toast.variant === 'destructive' ? (
              <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-medium ${
                toast.variant === 'destructive' ? 'text-red-900' : 'text-slate-900'
              }`}>
                {toast.title}
              </h4>
              {toast.description && (
                <p className={`text-sm mt-1 ${
                  toast.variant === 'destructive' ? 'text-red-700' : 'text-slate-600'
                }`}>
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className={`p-1 rounded-lg transition-colors duration-200 ${
                toast.variant === 'destructive'
                  ? 'hover:bg-red-100 text-red-400'
                  : 'hover:bg-slate-100 text-slate-400'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};