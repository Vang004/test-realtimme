import React, { useState } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  KeyRound,
  UserCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { User } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onBackToWelcome?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onBackToWelcome }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    if (!cleanUsername || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    const users = StorageService.getUsers();
    const cleanPhone = StorageService.normalizePhoneNumber(cleanUsername);
    const user = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername.toLowerCase() ||
        (u.studentCode && u.studentCode.toLowerCase() === cleanUsername.toLowerCase()) ||
        (u.lecturerCode && u.lecturerCode.toLowerCase() === cleanUsername.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === cleanUsername.toLowerCase()) ||
        (cleanPhone && cleanPhone.length >= 8 && u.phoneNumber && StorageService.normalizePhoneNumber(u.phoneNumber) === cleanPhone)
    );

    if (!user) {
      setError('Tài khoản không tồn tại trên hệ thống. Vui lòng liên hệ Quản trị viên (Admin) để được cấp tài khoản.');
      return;
    }

    if (user.password !== password) {
      setError('Mật khẩu không chính xác. Nếu quên mật khẩu, sinh viên vui lòng liên hệ Giảng viên để được Admin reset.');
      return;
    }

    StorageService.setCurrentUser(user);
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50/40 flex flex-col justify-between p-3 sm:p-6 md:p-8 overflow-y-auto">
      {/* Top branding */}
      <header className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-200 shrink-0">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-800">Real Time</h1>
            <p className="text-[11px] sm:text-xs text-sky-600 font-medium">Hệ Thống Điểm Danh & Chấm Công Thông Minh</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToWelcome && (
            <button
              type="button"
              onClick={onBackToWelcome}
              className="px-3.5 py-2 rounded-xl border border-sky-200 text-sky-700 bg-sky-50/80 hover:bg-sky-100 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer min-h-[40px] touch-manipulation active:scale-95"
              title="Quay lại giao diện màn hình chờ ban đầu"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Màn hình chờ</span>
            </button>
          )}
          <div className="text-xs text-slate-500 font-medium hidden md:block">
            Cổng Đăng Nhập Chính Thức
          </div>
        </div>
      </header>

      {/* Main card */}
      <main className="max-w-md mx-auto w-full my-auto py-3 sm:py-6">
        <div className="bg-white rounded-3xl shadow-xl shadow-sky-900/5 border border-sky-100 overflow-hidden">
          {/* Card Header */}
          <div className="p-6 sm:p-8 pb-5 sm:pb-6 text-center border-b border-sky-50 bg-gradient-to-b from-sky-50/60 to-transparent">
            <div className="inline-flex p-3 bg-sky-100 text-sky-600 rounded-2xl mb-3 shadow-inner">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Đăng Nhập Hệ Thống</h2>
            <p className="text-xs text-slate-500 mt-1">
              Bắt buộc đăng nhập trước khi truy cập điểm danh & quản trị
            </p>
          </div>

          {/* Status Alert (Nền trắng, chữ đen với thông báo bình thường) */}
          {statusMessage && (
            <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-white border border-slate-200 shadow-md rounded-2xl text-xs text-slate-900 font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Error Alert (Nền trắng, chữ đỏ với thông báo lỗi) */}
          {error && (
            <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-white border border-red-200 shadow-md rounded-2xl text-xs text-red-600 font-bold flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="p-5 sm:p-8 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tên đăng nhập [Mã GV]/[Mã SV]
                </label>
                <span className="text-[10px] text-sky-600 font-medium">Đăng nhập linh hoạt</span>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="VD: 22ATT000, GV000"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50 transition font-medium min-h-[44px]"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50 transition font-mono min-h-[44px]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-sky-600/20 transition duration-150 flex items-center justify-center gap-2 text-sm mt-2 min-h-[44px] touch-manipulation cursor-pointer"
            >
              <UserCheck className="h-4 w-4" /> Đăng Nhập Vào Hệ Thống
            </button>
          </form>

          <div className="p-3.5 sm:p-4 bg-slate-50/80 border-t border-slate-100 text-center text-xs text-slate-500">
            Hệ thống quản lý điểm danh lớp học bằng GPS định vị chuẩn xác & Camera thời gian thực
          </div>
        </div>
      </main>

      {/* Forgot password modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-sky-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-100 text-sky-600 rounded-2xl">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Hướng Dẫn Lấy Lại Mật Khẩu</h3>
                <p className="text-xs text-slate-500">Quy trình bảo mật trường học</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p>
                <strong>1. Đối với Sinh viên:</strong> Nếu bạn quên mật khẩu điểm danh, vui lòng thông báo trực tiếp cho
                Giảng viên phụ trách lớp học của bạn.
              </p>
              <p>
                <strong>2. Đối với Giảng viên:</strong> Tên đăng nhập chính là <strong>Mã giảng viên</strong> (Ví dụ: <code>GV001</code>). Mật khẩu mặc định là <code>gv123456</code>. Giảng viên liên hệ trực tiếp Quản trị viên (Admin) nếu cần Reset mật khẩu.
              </p>
              <p>
                <strong>3. Mật khẩu mặc định sau khi Reset:</strong> Hệ thống sẽ khôi phục về định dạng:{' '}
                <code className="bg-sky-50 text-sky-800 font-bold px-1.5 py-0.5 rounded border border-sky-200">
                  [mã sv][khóa][lớp]
                </code>{' '}
                viết thường (Ví dụ: 22att000k10a1).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition"
            >
              Đã hiểu, quay lại đăng nhập
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-3">
        © Real Time System • Tích hợp GPS Geofencing, Live Camera Chống Gian Lận & Quản Lý Ca Học
      </footer>
    </div>
  );
};
