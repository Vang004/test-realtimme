import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  Building,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  MousePointerClick,
  CheckCircle2,
  ChevronRight,
  School,
  Lock,
} from 'lucide-react';

interface WelcomeLockscreenProps {
  onEnter: () => void;
}

export const WelcomeLockscreen: React.FC<WelcomeLockscreenProps> = ({ onEnter }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
      const dayName = days[now.getDay()];
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      setCurrentDate(`${dayName}, ${day}/${month}/${year}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard press triggers enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      onEnter();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter]);

  return (
    <div
      onClick={onEnter}
      className="fixed inset-0 z-50 select-none cursor-pointer flex flex-col justify-between p-3 sm:p-5 md:p-8 bg-gradient-to-b from-slate-50 via-sky-50/50 to-slate-100 overflow-y-auto transition-all duration-300"
      title="Nhấp vào bất kỳ đâu trên màn hình để mở giao diện đăng nhập"
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none translate-y-1/3" />

      {/* Top Header / Branding Bar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Left: Branding */}
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-200 ring-2 sm:ring-4 ring-white shrink-0">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-7" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-800">
                REAL TIME
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                Hệ Thống Trực Tuyến
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-medium text-sky-700">
              Cổng Quản Trị Đào Tạo, Điểm Danh & Phòng Học Đa Cơ Sở
            </p>
          </div>
        </div>

        {/* Right: Live Clock & System Status */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-center gap-2 sm:gap-1 w-full sm:w-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] sm:text-xs font-bold shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Hệ Thống Hoạt Động 24/7</span>
          </div>
          <div className="font-mono text-[11px] sm:text-xs font-semibold text-slate-600 flex items-center gap-1.5 sm:gap-2">
            <span className="hidden md:inline text-slate-400">{currentDate}</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-800 text-[11px] sm:text-xs shadow-xs">
              {currentTime || '--:--:--'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Center Hero Section */}
      <main className="relative z-10 max-w-4xl mx-auto w-full my-auto py-4 sm:py-6 md:py-8 text-center flex flex-col items-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/90 border border-sky-200 text-sky-800 text-[10px] sm:text-xs font-bold shadow-xs mb-4 sm:mb-5 backdrop-blur-sm max-w-full text-center">
          <Sparkles className="h-3.5 w-3.5 text-sky-500 animate-pulse shrink-0" />
          <span className="truncate">HỆ THỐNG QUẢN LÝ ĐÀO TẠO & ĐIỂM DANH THÔNG MINH</span>
        </div>

        {/* Large Central App Icon */}
        <div className="relative mb-4 sm:mb-6 group">
          <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full blur-xl opacity-25 group-hover:opacity-40 transition duration-500 animate-pulse" />
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-2xl md:rounded-3xl bg-gradient-to-b from-sky-500 to-indigo-700 text-white flex items-center justify-center shadow-2xl shadow-sky-300 ring-4 sm:ring-8 ring-white/80">
            <School className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 drop-shadow-md" />
          </div>
        </div>

        {/* Hero Title */}
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight px-2">
          CỔNG ĐIỂM DANH & QUẢN LÝ SINH VIÊN
        </h2>

        {/* Hero Subtitle */}
        <p className="mt-2 sm:mt-3 md:mt-4 text-xs sm:text-sm md:text-base text-slate-600 max-w-xl md:max-w-2xl font-medium leading-relaxed px-2">
          Nền tảng kiểm soát chuyên cần thời gian thực • Quản lý phòng học đa cơ sở • Xếp thời khóa biểu & Tự động phát hiện xung đột lịch dạy
        </p>

        {/* 3 Key Feature Chips / Cards (Responsive 1-col on mobile 9:16, 3-cols on tablet/PC 16:9) */}
        <div className="mt-5 sm:mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-2xl px-2">
          <div className="bg-white/85 backdrop-blur-sm p-2.5 sm:p-3 md:p-3.5 rounded-2xl border border-sky-100 shadow-xs flex items-center gap-2.5 sm:gap-3 text-left transition hover:shadow-md">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700 shrink-0">
              <Building className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">Quản Lý Phòng Đa Cơ Sở</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-1 sm:line-clamp-none">Giám sát phòng trống & đăng ký ca</div>
            </div>
          </div>

          <div className="bg-white/85 backdrop-blur-sm p-2.5 sm:p-3 md:p-3.5 rounded-2xl border border-sky-100 shadow-xs flex items-center gap-2.5 sm:gap-3 text-left transition hover:shadow-md">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">Điểm Danh GPS Realtime</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-1 sm:line-clamp-none">Chính xác theo bán kính lớp học</div>
            </div>
          </div>

          <div className="bg-white/85 backdrop-blur-sm p-2.5 sm:p-3 md:p-3.5 rounded-2xl border border-sky-100 shadow-xs flex items-center gap-2.5 sm:gap-3 text-left transition hover:shadow-md">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">Xét Tư Cách Thi & Cảnh Báo</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-1 sm:line-clamp-none">Chuẩn theo tỷ lệ % Admin cài đặt</div>
            </div>
          </div>
        </div>

        {/* Pulsing Central CTA Hint (Vùng nhấp chuột / Chạm màn hình) */}
        <div className="mt-6 sm:mt-8 md:mt-10 inline-flex flex-col items-center w-full px-2">
          <div className="relative w-full max-w-sm sm:w-auto flex items-center justify-center gap-2 sm:gap-2.5 px-5 sm:px-7 py-3 sm:py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-sky-600/30 transition-all transform hover:scale-105 active:scale-95 touch-manipulation">
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-white" />
            </span>
            <MousePointerClick className="h-4 w-4 sm:h-5 sm:w-5 animate-bounce shrink-0" />
            <span className="truncate">Nhấp vào bất kỳ vùng trống nào để đăng nhập</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </div>

          <p className="text-[10px] sm:text-xs text-slate-400 mt-2 sm:mt-3 font-medium text-center px-2">
            <span>(Nhấp chuột hoặc chạm vào bất cứ đâu trên màn hình, hoặc nhấn phím bất kỳ để tiếp tục)</span>
          </p>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-[11px] text-slate-500 border-t border-slate-200/80 pt-3 sm:pt-4 gap-2 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-sky-600 shrink-0" />
          <span>Hệ Thống Quản Lý Giáo Dục Đại Học & Cao Đẳng • Bản quyền © 2026</span>
        </div>
        <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 text-slate-400 font-medium flex-wrap">
          <span className="hidden sm:inline">Hỗ trợ đa cơ sở (Cơ sở 1, Cơ sở 2, Hòa Lạc...)</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-sky-600 font-semibold flex items-center gap-1">
            <Lock className="h-3 w-3 shrink-0" /> Cổng bảo mật chính thức
          </span>
        </div>
      </footer>
    </div>
  );
};
