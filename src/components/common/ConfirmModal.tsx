import React from 'react';
import { AlertTriangle, Trash2, KeyRound, CheckCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  subMessage?: string;
  confirmText?: string;
  cancelText?: string;
  iconType?: 'trash' | 'key' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  subMessage,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  iconType = 'warning',
  onConfirm,
  onCancel,
  onClose,
}) => {
  if (!isOpen) return null;
  const handleDismiss = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                iconType === 'trash'
                  ? 'bg-rose-100 text-rose-600'
                  : iconType === 'key'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-sky-100 text-sky-600'
              }`}
            >
              {iconType === 'trash' ? (
                <Trash2 className="h-6 w-6" />
              ) : iconType === 'key' ? (
                <KeyRound className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-base font-extrabold text-slate-800 leading-snug">{title}</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">{message}</p>
              {subMessage && (
                <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
                  {subMessage}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action buttons: Hủy and Xác nhận */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer shadow-xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 ${
              iconType === 'trash'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : iconType === 'key'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
