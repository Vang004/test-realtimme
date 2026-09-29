import React, { useState, useRef, useEffect } from 'react';
import {
  User as UserIcon,
  KeyRound,
  Image as ImageIcon,
  Trash2,
  X,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Sparkles,
  Shield,
  GraduationCap,
  BookOpen,
  Eye,
  EyeOff,
  Copy,
  Check,
  Award,
  Sliders,
} from 'lucide-react';
import { User, Role, TrashItem } from '../../types';
import { StorageService } from '../../services/storage';
import { ConfirmModal } from './ConfirmModal';

interface UserProfileModalProps {
  isOpen: boolean;
  initialTab?: 'profile' | 'password' | 'avatar' | 'trash' | 'qualification';
  onClose: () => void;
  currentUser: User;
  onUserUpdated: (user: User) => void;
  onRefreshData: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  initialTab = 'profile',
  onClose,
  currentUser,
  onUserUpdated,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'avatar' | 'trash' | 'qualification'>(initialTab);

  // Profile edit state
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email);
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPwd, setCopiedPwd] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Change Password state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdFeedback, setPwdFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Avatar state
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(currentUser.avatar || '');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trash state
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [trashFilter, setTrashFilter] = useState<'all' | 'lecturer' | 'student' | 'class' | 'student_enrollment'>('all');
  const [trashMessage, setTrashMessage] = useState<string | null>(null);

  // Confirm Modal state for trash operations
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subMessage?: string;
    confirmText?: string;
    cancelText?: string;
    iconType?: 'trash' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    iconType: 'trash',
    onConfirm: () => {},
  });

  // General qualification settings state (Admin only)
  const [minAttendancePercent, setMinAttendancePercent] = useState<number>(80);
  const [minReExamPercent, setMinReExamPercent] = useState<number>(50);
  const [qualificationSavedMsg, setQualificationSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      loadTrashData();
      setFullName(currentUser.fullName);
      setEmail(currentUser.email);
      setPhoneNumber(currentUser.phoneNumber || '');
      setSelectedAvatarUrl(currentUser.avatar || '');
      const settings = StorageService.getSystemSettings();
      setMinAttendancePercent(settings.minAttendancePercentage || 80);
      setMinReExamPercent(settings.minReExamPercentage ?? 50);
    } else {
      stopCamera();
    }
  }, [isOpen, currentUser]);

  const loadTrashData = () => {
    StorageService.purgeExpiredTrash();
    const all = StorageService.getTrash();
    setTrashItems(all);
  };

  if (!isOpen) return null;

  // Filter trash based on role
  let roleTrash = trashItems;
  if (currentUser.role === 'admin') {
    // Admin gets deleted Lecturers, Students, and Classes
    roleTrash = trashItems.filter((t) => t.type === 'lecturer' || t.type === 'student' || t.type === 'class');
  } else if (currentUser.role === 'lecturer') {
    // Lecturer gets deleted Students and Classes
    roleTrash = trashItems.filter((t) => t.type === 'student' || t.type === 'class');
  } else if (currentUser.role === 'student') {
    // Student gets un-enrolled classes
    roleTrash = trashItems.filter(
      (t) => t.type === 'student_enrollment' && t.deletedByUserId === currentUser.id
    );
  }

  const filteredTrash = trashFilter === 'all' ? roleTrash : roleTrash.filter((t) => t.type === trashFilter);

  // ==========================
  // PROFILE UPDATE
  // ==========================
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);

    const cleanName = fullName.trim();
    let cleanEmail = email.trim();
    if (cleanEmail && !cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail.toLowerCase()}@school.edu.vn`;
    }
    const cleanPhone = phoneNumber.trim();

    if (!cleanName || !cleanEmail) {
      setProfileFeedback({ type: 'error', message: 'Vui lòng nhập đầy đủ Họ tên và Email liên hệ!' });
      return;
    }

    // Check duplicate email
    if (StorageService.isEmailTaken(cleanEmail, currentUser.id)) {
      setProfileFeedback({
        type: 'error',
        message: `Email "${cleanEmail}" đã được sử dụng bởi một tài khoản khác trong hệ thống! (Cho phép các tài khoản có cùng đuôi @... nhưng địa chỉ đầy đủ phải khác nhau).`,
      });
      return;
    }

    // Check duplicate phone number
    if (cleanPhone && StorageService.isPhoneNumberTaken(cleanPhone, currentUser.id)) {
      setProfileFeedback({
        type: 'error',
        message: `Số điện thoại "${cleanPhone}" đã được sử dụng bởi một tài khoản khác trong hệ thống! Số điện thoại phải là duy nhất.`,
      });
      return;
    }

    try {
      const updated = StorageService.updateUser(currentUser.id, {
        fullName: cleanName,
        email: cleanEmail,
        phoneNumber: cleanPhone,
      });
      if (updated) {
        onUserUpdated(updated);
        onRefreshData();
        setProfileFeedback({ type: 'success', message: 'Đã cập nhật thông tin tài khoản thành công!' });
      }
    } catch (err: any) {
      setProfileFeedback({ type: 'error', message: err.message || 'Lỗi khi cập nhật thông tin!' });
    }
  };

  // ==========================
  // PASSWORD UPDATE
  // ==========================
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);

    if (currentPwd !== currentUser.password) {
      setPwdFeedback({ type: 'error', message: 'Mật khẩu hiện tại không chính xác!' });
      return;
    }
    if (newPwd.length < 6) {
      setPwdFeedback({ type: 'error', message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdFeedback({ type: 'error', message: 'Xác nhận mật khẩu mới không trùng khớp!' });
      return;
    }

    const updated = StorageService.updateUser(currentUser.id, {
      password: newPwd,
      hasChangedPassword: true,
    });
    if (updated) {
      onUserUpdated(updated);
      onRefreshData();
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setPwdFeedback({ type: 'success', message: 'Đổi mật khẩu thành công!' });
    }
  };

  // ==========================
  // AVATAR UPDATE
  // ==========================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một file hình ảnh hợp lệ (PNG, JPG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedAvatarUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      alert('Không thể mở camera thiết bị: ' + err.message);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 400, 400);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedAvatarUrl(dataUrl);
      stopCamera();
    }
  };

  const saveAvatar = () => {
    const updated = StorageService.updateUser(currentUser.id, { avatar: selectedAvatarUrl });
    if (updated) {
      onUserUpdated(updated);
      onRefreshData();
      alert('Đã cập nhật hình đại diện thành công!');
    }
  };

  // ==========================
  // TRASH RESTORE / DELETE
  // ==========================
  const handleRestore = (item: TrashItem) => {
    const res = StorageService.restoreTrashItem(item.id);
    if (res.success) {
      setTrashMessage(`Khôi phục "${item.title}" thành công!`);
      loadTrashData();
      onRefreshData();
      setTimeout(() => setTrashMessage(null), 4000);
    } else {
      alert(res.message);
    }
  };

  const handlePermanentDelete = (item: TrashItem) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận xóa vĩnh viễn?',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn "${item.title}" ${item.code ? `(${item.code})` : ''} khỏi hệ thống không?`,
      subMessage: 'Dữ liệu này sẽ bị xóa hoàn toàn khỏi thùng rác và không thể khôi phục lại được nữa.',
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Hủy bỏ',
      iconType: 'trash',
      onConfirm: () => {
        StorageService.deletePermanentlyFromTrash(item.id);
        loadTrashData();
        onRefreshData();
        setTrashMessage(`Đã xóa vĩnh viễn "${item.title}" khỏi hệ thống.`);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        setTimeout(() => setTrashMessage(null), 4000);
      },
    });
  };

  const handleClearAllTrash = () => {
    const isFiltered = trashFilter !== 'all';
    const itemsToDelete = filteredTrash;
    if (itemsToDelete.length === 0) return;

    const filterName =
      trashFilter === 'lecturer'
        ? 'giảng viên'
        : trashFilter === 'student'
        ? 'sinh viên'
        : trashFilter === 'class'
        ? 'lịch học'
        : trashFilter === 'student_enrollment'
        ? 'lịch học đã hủy'
        : 'mục';

    const title = isFiltered
      ? `Dọn sạch danh mục ${filterName}?`
      : 'Dọn sạch toàn bộ thùng rác?';

    const message = isFiltered
      ? `Bạn có chắc chắn muốn xóa vĩnh viễn tất cả ${itemsToDelete.length} ${filterName} đang lọc trong Thùng rác không?`
      : `Bạn có chắc chắn muốn dọn sạch tất cả ${roleTrash.length} mục dữ liệu trong Thùng rác không?`;

    setConfirmConfig({
      isOpen: true,
      title,
      message,
      subMessage: 'Tất cả các mục được chọn sẽ bị xóa vĩnh viễn khỏi hệ thống và không thể khôi phục lại.',
      confirmText: 'Dọn sạch ngay',
      cancelText: 'Hủy bỏ',
      iconType: 'trash',
      onConfirm: () => {
        if (isFiltered) {
          itemsToDelete.forEach((item) => {
            StorageService.deletePermanentlyFromTrash(item.id);
          });
        } else {
          StorageService.clearAllTrash(undefined, currentUser.id, currentUser.role);
        }
        loadTrashData();
        onRefreshData();
        setTrashMessage(
          isFiltered
            ? `Đã dọn sạch ${itemsToDelete.length} mục ${filterName} khỏi thùng rác!`
            : 'Đã dọn sạch toàn bộ dữ liệu trong thùng rác thành công!'
        );
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        setTimeout(() => setTrashMessage(null), 4000);
      },
    });
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(currentUser.password);
    setCopiedPwd(true);
    setTimeout(() => setCopiedPwd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-sky-100 my-4 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-sky-100 bg-linear-to-r from-sky-50 via-sky-50/40 to-white px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={
                  currentUser.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.fullName)}`
                }
                alt={currentUser.fullName}
                className="h-11 w-11 rounded-2xl object-cover border-2 border-sky-200 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setActiveTab('avatar')}
                className="absolute -bottom-1 -right-1 p-1 bg-sky-600 text-white rounded-full hover:bg-sky-700 shadow-xs"
                title="Đổi ảnh đại diện"
              >
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">{currentUser.fullName}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : currentUser.role === 'lecturer'
                      ? 'bg-sky-100 text-sky-800 border border-sky-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {currentUser.role === 'admin' ? 'Admin Quản Trị' : currentUser.role === 'lecturer' ? 'Giảng Viên' : 'Sinh Viên'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {currentUser.role === 'student'
                  ? `Mã SV: ${currentUser.studentCode} • Lớp: ${currentUser.className || ''}`
                  : currentUser.role === 'lecturer'
                  ? `Mã GV: ${currentUser.lecturerCode} • ${currentUser.department || ''}`
                  : 'Toàn quyền cấu hình hệ thống'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-4 pt-2 gap-1 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('profile');
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'profile'
                ? 'bg-white text-sky-700 border-sky-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-white/50'
            }`}
          >
            <UserIcon className="h-4 w-4" /> Thông Tin Chi Tiết
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('password');
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'password'
                ? 'bg-white text-sky-700 border-sky-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-white/50'
            }`}
          >
            <KeyRound className="h-4 w-4" /> Đổi Mật Khẩu
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('avatar')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'avatar'
                ? 'bg-white text-sky-700 border-sky-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-white/50'
            }`}
          >
            <ImageIcon className="h-4 w-4" /> Đổi Hình Đại Diện
          </button>

          {/* Nút cài đặt điều kiện qua môn & xét tư cách thi ở bên trái thùng rác chỗ admin */}
          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveTab('qualification');
              }}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl transition flex items-center gap-2 border-b-2 ${
                activeTab === 'qualification'
                  ? 'bg-white text-amber-700 border-amber-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-white/50'
              }`}
            >
              <Award className="h-4 w-4 text-amber-600" /> Điều Kiện Qua Môn & Thi (%)
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('trash');
              loadTrashData();
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'trash'
                ? 'bg-white text-rose-700 border-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-white/50'
            }`}
          >
            <Trash2 className="h-4 w-4" /> Thùng Rác (6 Tháng)
            {roleTrash.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {roleTrash.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: THÔNG TIN CHI TIẾT */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl mx-auto">
              {profileFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    profileFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {profileFeedback.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{profileFeedback.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên đăng nhập</label>
                  <input
                    type="text"
                    value={currentUser.username}
                    disabled
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email liên hệ * <span className="text-[10px] text-sky-600 font-normal">(Cho phép cùng đuôi @...)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (profileFeedback) setProfileFeedback(null);
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:outline-hidden font-mono ${
                      email.trim() && StorageService.isEmailTaken(email.trim(), currentUser.id)
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                        : 'border-slate-300 focus:ring-sky-500'
                    }`}
                    required
                  />
                  {email.trim() && StorageService.isEmailTaken(email.trim(), currentUser.id) && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-sans">
                      <AlertCircle className="h-3 w-3 shrink-0" /> Địa chỉ email này đã có người sử dụng!
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1 font-sans">Cho phép dùng chung phần đuôi tên miền @... (ví dụ: @school.edu.vn, @gmail.com), chỉ cần khác tên hộp thư.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại <span className="text-[10px] text-amber-600 font-normal">(Duy nhất)</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (profileFeedback) setProfileFeedback(null);
                    }}
                    placeholder="0912..."
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:outline-hidden font-mono ${
                      phoneNumber.trim() && StorageService.isPhoneNumberTaken(phoneNumber.trim(), currentUser.id)
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                        : 'border-slate-300 focus:ring-sky-500'
                    }`}
                  />
                  {phoneNumber.trim() && StorageService.isPhoneNumberTaken(phoneNumber.trim(), currentUser.id) && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-sans">
                      <AlertCircle className="h-3 w-3 shrink-0" /> Số điện thoại này đã có người sử dụng!
                    </p>
                  )}
                </div>

                {currentUser.role === 'student' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mã sinh viên</label>
                      <input
                        type="text"
                        value={currentUser.studentCode || ''}
                        disabled
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Khóa & Lớp sinh hoạt</label>
                      <input
                        type="text"
                        value={`Khóa ${currentUser.courseYear || ''} • Lớp ${currentUser.className || ''}`}
                        disabled
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-mono"
                      />
                    </div>
                  </>
                )}

                {currentUser.role === 'lecturer' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mã giảng viên</label>
                      <input
                        type="text"
                        value={currentUser.lecturerCode || ''}
                        disabled
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Khoa / Bộ môn</label>
                      <input
                        type="text"
                        value={currentUser.department || ''}
                        disabled
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-700"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Current Password Field with Reveal & Copy */}
              <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-900">Mật khẩu tài khoản hiện hành:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-sky-200">
                      {showPassword ? currentUser.password : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-500 hover:text-sky-700 rounded-lg hover:bg-white"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={copyPassword}
                      className="p-1.5 text-slate-500 hover:text-sky-700 rounded-lg hover:bg-white"
                      title="Sao chép mật khẩu"
                    >
                      {copiedPwd ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition cursor-pointer"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ĐỔI MẬT KHẨU */}
          {activeTab === 'password' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md mx-auto">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 leading-relaxed">
                Đổi mật khẩu mới định kỳ để bảo vệ tài khoản cá nhân. Mật khẩu phải có tối thiểu 6 ký tự.
              </div>

              {pwdFeedback && (
                <div
                  className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                    pwdFeedback.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {pwdFeedback.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{pwdFeedback.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu hiện tại *</label>
                <input
                  type="password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="Nhập mật khẩu đang dùng..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới *</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mật khẩu mới *</label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition cursor-pointer"
                >
                  Xác Nhận Đổi Mật Khẩu
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ĐỔI HÌNH ĐẠI DIỆN */}
          {activeTab === 'avatar' && (
            <div className="space-y-6 max-w-lg mx-auto">
              <div className="flex flex-col items-center justify-center gap-3">
                <img
                  src={selectedAvatarUrl}
                  alt="Avatar Preview"
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-sky-100 shadow-md"
                />
                <span className="text-xs text-slate-500 font-medium">Hình đại diện hiện tại / xem trước</span>
              </div>

              {/* Camera Live Stream */}
              {isCameraActive ? (
                <div className="p-4 bg-slate-900 rounded-3xl space-y-3">
                  <div className="relative aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden border-2 border-sky-500 shadow-md">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                    >
                      <Camera className="h-4 w-4" /> Chụp Ngay
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
                    >
                      Đóng Camera
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 border-2 border-dashed border-sky-200 hover:border-sky-400 bg-sky-50/50 hover:bg-sky-50 rounded-2xl flex flex-col items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Upload className="h-6 w-6 text-sky-600" />
                    <span className="text-xs font-bold text-slate-700">Tải ảnh từ máy tính</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG, WEBP</span>
                  </button>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="p-4 border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl flex flex-col items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Camera className="h-6 w-6 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-700">Chụp ảnh Camera</span>
                    <span className="text-[10px] text-slate-400">Dùng camera thiết bị</span>
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Avatar Presets Library */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Hoặc chọn từ bộ sưu tập mẫu:</label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
                  ].map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatarUrl(url)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition ${
                        selectedAvatarUrl === url ? 'border-sky-600 ring-2 ring-sky-300' : 'border-slate-200 hover:border-sky-300'
                      }`}
                    >
                      <img src={url} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={saveAvatar}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" /> Lưu Hình Đại Diện
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: THÙNG RÁC (6 THÁNG RETENTION) */}
          {activeTab === 'trash' && (
            <div className="space-y-4">
              {/* Notice Banner */}
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-900 leading-relaxed">
                <Trash2 className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-rose-950">
                    Quy Định Lưu Trữ Thùng Rác (6 Tháng):
                  </div>
                  <div className="text-[11px] text-rose-800 mt-0.5">
                    Thùng rác này chứa dữ liệu được xóa cách thời điểm hệ thống tự động xóa vĩnh viễn là <strong>6 tháng (180 ngày)</strong>.
                    Trong thời gian này, bạn có thể dễ dàng nhấn <strong>"Khôi phục"</strong> để lấy lại dữ liệu nguyên vẹn.
                  </div>
                </div>
              </div>

              {trashMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{trashMessage}</span>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  <button
                    type="button"
                    onClick={() => setTrashFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      trashFilter === 'all'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tất cả ({roleTrash.length})
                  </button>

                  {currentUser.role === 'admin' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setTrashFilter('lecturer')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                          trashFilter === 'lecturer'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Giảng viên ({roleTrash.filter((t) => t.type === 'lecturer').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrashFilter('student')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                          trashFilter === 'student'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Sinh viên ({roleTrash.filter((t) => t.type === 'student').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrashFilter('class')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                          trashFilter === 'class'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Lịch học ({roleTrash.filter((t) => t.type === 'class').length})
                      </button>
                    </>
                  )}

                  {currentUser.role === 'lecturer' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setTrashFilter('student')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                          trashFilter === 'student'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Sinh viên ({roleTrash.filter((t) => t.type === 'student').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrashFilter('class')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                          trashFilter === 'class'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Lịch học ({roleTrash.filter((t) => t.type === 'class').length})
                      </button>
                    </>
                  )}

                  {currentUser.role === 'student' && (
                    <button
                      type="button"
                      onClick={() => setTrashFilter('student_enrollment')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                        trashFilter === 'student_enrollment'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Lịch học đã hủy ({roleTrash.length})
                    </button>
                  )}
                </div>

                {filteredTrash.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllTrash}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold self-end sm:self-auto cursor-pointer hover:underline transition flex items-center gap-1 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Dọn sạch thùng rác
                  </button>
                )}
              </div>

              {/* Trash Items List */}
              <div className="space-y-2.5">
                {filteredTrash.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-3xl border border-slate-200">
                    <Trash2 className="h-10 w-10 mx-auto mb-2 opacity-30 text-rose-400" />
                    <p className="font-semibold text-slate-700 text-xs">Thùng rác trống</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Không có mục nào bị xóa trong thời gian này.</p>
                  </div>
                ) : (
                  filteredTrash.map((item) => {
                    const daysLeft = StorageService.getDaysUntilExpiry(item.expiresAt);
                    const deletedDateStr = new Date(item.deletedAt).toLocaleString('vi-VN');

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-sky-200 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                            {item.type === 'class' || item.type === 'student_enrollment' ? (
                              <BookOpen className="h-5 w-5" />
                            ) : item.type === 'lecturer' ? (
                              <Shield className="h-5 w-5" />
                            ) : (
                              <GraduationCap className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm">{item.title}</span>
                              {item.code && (
                                <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                                  {item.code}
                                </span>
                              )}
                            </div>
                            {item.subtitle && <p className="text-slate-500 text-xs mt-0.5">{item.subtitle}</p>}
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                              <span>Đã xóa: {deletedDateStr}</span>
                              <span>•</span>
                              <span className="font-semibold text-rose-600 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Tự động xóa vĩnh viễn sau: {daysLeft} ngày
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRestore(item)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Khôi phục
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermanentDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Xóa vĩnh viễn ngay lập tức"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CÀI ĐẶT ĐIỀU KIỆN QUA MÔN & XÉT TƯ CÁCH THI (ADMIN) */}
          {activeTab === 'qualification' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div>
                <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-600" /> Cài Đặt Chung: Tỷ Lệ Chuyên Cần & Điều Kiện Qua Môn
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thiết lập tỷ lệ % có mặt đúng GPS và đủ thời gian để sinh viên đủ điều kiện dự thi lần 1 hoặc phải học lại
                </p>
              </div>

              {qualificationSavedMsg && (
                <div className="p-3.5 bg-white border border-slate-200 shadow-md rounded-2xl text-xs text-slate-900 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{qualificationSavedMsg}</span>
                </div>
              )}

              {/* Dual Sliders Card */}
              <div className="space-y-4">
                {/* THANH 1: MỨC KHÔNG ĐƯỢC THI LẦN 1 (50% - 100%) */}
                <div className="p-5 bg-linear-to-br from-rose-50/70 via-white to-amber-50/40 rounded-3xl border border-rose-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                        Thanh 1: Mức Không Được Thi Lần 1 (50% - 100%)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Sinh viên có tỷ lệ chuyên cần <strong className="text-rose-700">dưới {minAttendancePercent}%</strong> sẽ không được dự thi lần 1.
                      </p>
                    </div>
                    <span className="text-2xl font-black text-rose-600 font-mono px-3 py-1 bg-white rounded-2xl border border-rose-200 shadow-xs">
                      {minAttendancePercent}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="1"
                    value={minAttendancePercent}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMinAttendancePercent(val);
                      // Thanh 2 luôn phải dưới mức 1 đã chọn
                      if (minReExamPercent >= val) {
                        setMinReExamPercent(Math.max(0, val - 1));
                      }
                    }}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>50%</span>
                    <span>60%</span>
                    <span>70%</span>
                    <span>80% (Chuẩn bộ GD)</span>
                    <span>90%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* THANH 2: MỨC THI LẠI (0% - % DƯỚI MỨC 1 ĐÃ CHỌN) */}
                <div className="p-5 bg-linear-to-br from-amber-50/70 via-white to-sky-50/40 rounded-3xl border border-amber-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                        Thanh 2: Mức Được Xét Thi Lại (0% - dưới {minAttendancePercent}%)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Từ <strong className="text-amber-700">{minReExamPercent}%</strong> đến <strong className="text-amber-700">&lt;{minAttendancePercent}%</strong>: Được xét thi lại đợt 2. Dưới <strong className="text-rose-700">{minReExamPercent}%</strong>: Cấm thi hoàn toàn.
                      </p>
                    </div>
                    <span className="text-2xl font-black text-amber-600 font-mono px-3 py-1 bg-white rounded-2xl border border-amber-200 shadow-xs">
                      {minReExamPercent}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, minAttendancePercent - 1)}
                    step="1"
                    value={minReExamPercent}
                    onChange={(e) => setMinReExamPercent(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>0% (Cấm tuyệt đối)</span>
                    <span>25%</span>
                    <span>50% (Mặc định)</span>
                    <span>{Math.max(0, minAttendancePercent - 1)}% (Dưới mức 1)</span>
                  </div>
                </div>

                {/* VISUAL 3-TIER BREAKDOWN BAR */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Sơ đồ phân loại tư cách thi chuyên cần:</span>
                    <span className="text-[11px] text-slate-500">0% ────────────────────────── 100%</span>
                  </div>
                  
                  <div className="flex h-4 w-full rounded-full overflow-hidden text-[9px] font-black text-white text-center leading-4 shadow-inner">
                    <div
                      style={{ width: `${minReExamPercent}%` }}
                      className="bg-rose-500 flex items-center justify-center truncate px-1"
                      title={`0% - ${minReExamPercent}%: Cấm thi hoàn toàn`}
                    >
                      {minReExamPercent > 12 ? `Cấm thi (<${minReExamPercent}%)` : ''}
                    </div>
                    <div
                      style={{ width: `${minAttendancePercent - minReExamPercent}%` }}
                      className="bg-amber-500 flex items-center justify-center truncate px-1"
                      title={`${minReExamPercent}% - ${minAttendancePercent}%: Được xét thi lại`}
                    >
                      {minAttendancePercent - minReExamPercent > 12 ? `Thi lại (${minReExamPercent}% - ${minAttendancePercent}%)` : ''}
                    </div>
                    <div
                      style={{ width: `${100 - minAttendancePercent}%` }}
                      className="bg-emerald-500 flex items-center justify-center truncate px-1"
                      title={`${minAttendancePercent}% - 100%: Đủ điều kiện thi lần 1`}
                    >
                      {100 - minAttendancePercent > 12 ? `Đủ ĐK thi lần 1 (≥${minAttendancePercent}%)` : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Policy explanation */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed font-sans">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-sky-600" />
                  <span>Quy chế xét tư cách thi & Công nhận qua môn:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600">
                  <li>
                    <strong>Mỗi môn học có số tín chỉ khác nhau</strong> (được khai báo khi tạo lớp).
                  </li>
                  <li>
                    Sinh viên phải có mặt trong <strong>phạm vi bán kính GPS hợp lệ</strong> và đủ thời gian quy định theo từng ca học.
                  </li>
                  <li>
                    Chuyên cần từ <strong>{minAttendancePercent}%</strong> trở lên: <span className="text-emerald-700 font-bold">Đủ điều kiện dự thi lần 1 (Đạt chuyên cần môn học)</span>.
                  </li>
                  <li>
                    Chuyên cần từ <strong>{minReExamPercent}%</strong> đến <strong>dưới {minAttendancePercent}%</strong>: <span className="text-amber-700 font-bold">Không được thi lần 1 / Được xét dự thi lại đợt 2</span>.
                  </li>
                  <li>
                    Chuyên cần dưới <strong>{minReExamPercent}%</strong>: <span className="text-rose-700 font-bold">Cấm thi hoàn toàn / Bắt buộc học lại môn học</span>.
                  </li>
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    StorageService.saveSystemSettings({
                      minAttendancePercentage: minAttendancePercent,
                      minReExamPercentage: minReExamPercent,
                    });
                    onRefreshData();
                    setQualificationSavedMsg(`Đã lưu quy định: Mức cấm thi lần 1 = ${minAttendancePercent}%, Mức thi lại = ${minReExamPercent}% thành công!`);
                    setTimeout(() => setQualificationSavedMsg(null), 3500);
                  }}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Award className="h-4 w-4" /> Lưu Cài Đặt Quy Định
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Action Modal for Trash Operations */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        subMessage={confirmConfig.subMessage}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        iconType={confirmConfig.iconType}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
