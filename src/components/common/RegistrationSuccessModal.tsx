import React from 'react';
import { CheckCircle2, Check } from 'lucide-react';

interface RegistrationSuccessModalProps {
  isOpen: boolean;
  message?: string;
  subMessage?: string;
  onClose: () => void;
}

export const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
  isOpen,
  message = 'Đăng ký thành công!',
  subMessage,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-emerald-100 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-full shadow-inner ring-8 ring-emerald-50">
          <CheckCircle2 className="h-10 w-10 animate-bounce" />
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
            {message}
          </h3>
          {subMessage && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {subMessage}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition cursor-pointer min-h-[40px] flex items-center justify-center gap-2"
        >
          <Check className="h-4 w-4" /> Đã hiểu
        </button>
      </div>
    </div>
  );
};
