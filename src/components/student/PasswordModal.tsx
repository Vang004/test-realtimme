import React, { useState } from 'react';
import { KeyRound, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { StorageService } from '../../services/storage';
import { User } from '../../types';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess: (updatedUser: User) => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (oldPassword !== currentUser.password) {
      setError('Mật khẩu hiện tại không đúng');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    const updated = StorageService.updateUser(currentUser.id, {
      password: newPassword,
      hasChangedPassword: true,
    });

    if (updated) {
      setSuccess('Đã đổi mật khẩu thành công!');
      setTimeout(() => {
        onSuccess(updated);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-sky-100 space-y-4">
        <div className="flex items-center justify-between border-b border-sky-50 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 text-sky-600 rounded-xl">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Đổi Mật Khẩu Điểm Danh</h3>
              <p className="text-xs text-slate-500">Mã SV: {currentUser.studentCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition"
            >
              Cập nhật mật khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
