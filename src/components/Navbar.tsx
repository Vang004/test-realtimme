import React, { useState } from 'react';
import {
  GraduationCap,
  LogOut,
  Bell,
  Trash2,
  KeyRound,
  Award,
  Lock,
} from 'lucide-react';
import { User as UserType } from '../types';
import { StorageService } from '../services/storage';
import { UserProfileModal } from './common/UserProfileModal';

interface NavbarProps {
  currentUser: UserType;
  onLogout: () => void;
  onLock?: () => void;
  onOpenEmails: () => void;
  onRefreshData: () => void;
  onUserUpdated: (user: UserType) => void;
  unreadEmailCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onLock,
  onOpenEmails,
  onRefreshData,
  onUserUpdated,
  unreadEmailCount,
}) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'password' | 'avatar' | 'trash' | 'qualification'>('profile');

  // Count items in trash for this user's role
  const trashItems = StorageService.getTrash();
  let roleTrashCount = 0;
  if (currentUser.role === 'admin') {
    roleTrashCount = trashItems.filter((t) => t.type === 'lecturer' || t.type === 'class').length;
  } else if (currentUser.role === 'lecturer') {
    roleTrashCount = trashItems.filter((t) => t.type === 'student' || t.type === 'class').length;
  } else if (currentUser.role === 'student') {
    roleTrashCount = trashItems.filter(
      (t) => t.type === 'student_enrollment' && t.deletedByUserId === currentUser.id
    ).length;
  }

  const handleOpenProfileTab = (tab: 'profile' | 'password' | 'avatar' | 'trash' | 'qualification') => {
    setProfileModalTab(tab);
    setIsProfileModalOpen(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            👑 Admin Quản Trị
          </span>
        );
      case 'lecturer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
            👨‍🏫 Giảng Viên
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            👨‍🎓 Sinh Viên
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-linear-to-tr from-sky-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-200">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-800 text-base tracking-tight">Real Time</span>
                  {getRoleBadge(currentUser.role)}
                </div>
                <p className="text-[11px] text-sky-700 font-medium hidden sm:block">
                  Hệ Thống Điểm Danh & Chấm Công Lớp Học
                </p>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Nút cài đặt điều kiện qua môn / xét tư cách thi (%) ở bên trái thùng rác chỗ admin */}
              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleOpenProfileTab('qualification')}
                  className="relative p-2 rounded-xl text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition cursor-pointer flex items-center gap-1.5"
                  title="Cài đặt tỷ lệ chuyên cần & Điều kiện qua môn / Xét tư cách thi (%)"
                >
                  <Award className="h-5 w-5 text-amber-600" />
                  <span className="hidden xl:inline text-xs font-bold text-slate-700">Xét tư cách thi (%)</span>
                </button>
              )}

              {/* Direct Recycle Bin (Thùng rác) Button */}
              <button
                type="button"
                onClick={() => handleOpenProfileTab('trash')}
                className="relative p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Thùng rác khôi phục dữ liệu (Lưu trữ 6 tháng)"
              >
                <Trash2 className="h-5 w-5" />
                {roleTrashCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                    {roleTrashCount}
                  </span>
                )}
              </button>

              {/* Email Notification Bell */}
              <button
                type="button"
                onClick={onOpenEmails}
                className="relative p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition cursor-pointer"
                title="Xem thông báo email điểm danh"
              >
                <Bell className="h-5 w-5" />
                {unreadEmailCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                )}
              </button>

              {/* User Profile Trigger Button */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => handleOpenProfileTab('profile')}
                  className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-sky-50 transition cursor-pointer text-left group"
                  title="Nhấn để xem thông tin chi tiết, đổi mật khẩu, đổi hình đại diện, thùng rác"
                >
                  <img
                    src={
                      currentUser.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.fullName)}`
                    }
                    alt={currentUser.fullName}
                    className="h-9 w-9 rounded-xl object-cover border-2 border-sky-200 shadow-xs group-hover:border-sky-400 transition"
                  />
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-bold text-slate-800 leading-tight group-hover:text-sky-700 transition">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {currentUser.role === 'student'
                        ? `${currentUser.studentCode} • Lớp ${currentUser.className || ''}`
                        : currentUser.role === 'lecturer'
                        ? currentUser.department || 'Giảng viên'
                        : 'Toàn quyền quản trị'}
                    </div>
                  </div>
                </button>

                {/* Quick Password Change Button */}
                <button
                  type="button"
                  onClick={() => handleOpenProfileTab('password')}
                  className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition cursor-pointer"
                  title="Đổi mật khẩu"
                >
                  <KeyRound className="h-4 w-4" />
                </button>

                {/* Lock Screen */}
                {onLock && (
                  <button
                    type="button"
                    onClick={onLock}
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                    title="Khóa màn hình chờ (Welcome Lockscreen)"
                  >
                    <Lock className="h-4 w-4" />
                  </button>
                )}

                {/* Logout */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* User Profile & Trash Modal */}
      {isProfileModalOpen && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          initialTab={profileModalTab}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onUserUpdated={onUserUpdated}
          onRefreshData={onRefreshData}
        />
      )}
    </>
  );
};
