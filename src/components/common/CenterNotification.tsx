import React, { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw, X, Sparkles, AlertTriangle, AlertCircle, Info, Bell } from 'lucide-react';

export interface CenterNotificationState {
  id: string;
  message: string;
  type?: 'normal' | 'error' | 'success' | 'warning' | 'info';
  onUndo?: () => void;
  durationMs?: number;
}

interface CenterNotificationProps {
  notification: CenterNotificationState | null;
  onClose: () => void;
}

export const CenterNotification: React.FC<CenterNotificationProps> = ({
  notification,
  onClose,
}) => {
  const [progress, setProgress] = useState(100);
  const [isUndone, setIsUndone] = useState(false);

  useEffect(() => {
    if (!notification) {
      setProgress(100);
      setIsUndone(false);
      return;
    }

    setIsUndone(false);
    setProgress(100);
    const duration = notification.durationMs || 5000;
    const intervalTime = 50;
    const totalSteps = duration / intervalTime;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const remaining = Math.max(0, 100 - (step / totalSteps) * 100);
      setProgress(remaining);

      if (step >= totalSteps) {
        clearInterval(timer);
        onClose();
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const isError = notification.type === 'error';

  const handleUndoClick = () => {
    if (notification.onUndo) {
      notification.onUndo();
      setIsUndone(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div
        className={`pointer-events-auto bg-white rounded-3xl p-5 sm:p-6 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 overflow-hidden relative border ${
          isError ? 'border-red-300 text-red-600' : 'border-slate-200 text-slate-900'
        }`}
      >
        {/* Progress Bar (5 seconds countdown) */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isError ? 'bg-red-100' : 'bg-slate-100'}`}>
          <div
            className={`h-full transition-all ease-linear ${
              isError
                ? 'bg-linear-to-r from-red-500 to-rose-600'
                : 'bg-linear-to-r from-sky-500 to-emerald-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-4 mt-1">
          <div className="flex items-center gap-3">
            <div
              className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                isError
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              {isUndone ? (
                <RotateCcw className="h-6 w-6 animate-spin text-sky-600" />
              ) : isError ? (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              )}
            </div>
            <div>
              <div
                className={`text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 ${
                  isError ? 'text-red-500' : 'text-slate-500'
                }`}
              >
                {isError ? (
                  <>
                    <AlertCircle className="h-3 w-3 text-red-500" /> Cảnh Báo / Lỗi Hệ Thống
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 text-sky-600" /> Thông Báo Hệ Thống (5s)
                  </>
                )}
              </div>
              <div
                className={`text-sm sm:text-base font-extrabold mt-0.5 leading-snug ${
                  isError ? 'text-red-600' : 'text-slate-900'
                }`}
              >
                {isUndone ? 'Đã hoàn tác thao tác thành công!' : notification.message}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Button: Hoàn tác */}
        {!isUndone && notification.onUndo && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              Thao tác nhầm? Bạn có thể khôi phục ngay:
            </span>
            <button
              type="button"
              onClick={handleUndoClick}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Hoàn tác
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

