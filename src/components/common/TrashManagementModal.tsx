import React, { useState, useEffect } from 'react';
import {
  Trash2,
  X,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  BookOpen,
  Shield,
  GraduationCap,
  DoorClosed,
} from 'lucide-react';
import { TrashItem, TrashItemType, Role } from '../../types';
import { StorageService } from '../../services/storage';
import { ConfirmModal } from './ConfirmModal';

interface TrashManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: 'all' | 'class' | 'campus_room' | 'lecturer' | 'student' | 'student_enrollment';
  title?: string;
  role?: Role;
  currentUserId?: string;
  onRefreshData?: () => void;
}

export const TrashManagementModal: React.FC<TrashManagementModalProps> = ({
  isOpen,
  onClose,
  initialFilter = 'all',
  title = 'Quản Lý Thùng Rác (Lưu Trữ 6 Tháng)',
  role = 'admin',
  currentUserId,
  onRefreshData,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'class' | 'campus_room' | 'lecturer' | 'student' | 'student_enrollment'>(initialFilter);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // Confirm delete modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subMessage?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const loadTrash = () => {
    const all = StorageService.getTrash();
    setTrashItems(all);
  };

  useEffect(() => {
    if (isOpen) {
      loadTrash();
      setActiveFilter(initialFilter);
      setMessage(null);
    }
  }, [isOpen, initialFilter]);

  if (!isOpen) return null;

  // Filter based on role and tab
  const roleTrash = trashItems.filter((t) => {
    if (role === 'lecturer') {
      return t.type === 'class' || t.type === 'student';
    }
    if (role === 'student') {
      return t.type === 'student_enrollment' && (!currentUserId || !t.deletedByUserId || t.deletedByUserId === currentUserId);
    }
    return true;
  });

  const filteredItems = roleTrash.filter((t) => {
    if (activeFilter === 'all') return true;
    return t.type === activeFilter;
  });

  const handleRestore = (item: TrashItem) => {
    const res = StorageService.restoreTrashItem(item.id);
    if (res.success) {
      setMessage(`Đã khôi phục thành công "${item.title}"!`);
      loadTrash();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setMessage(null), 3500);
    } else {
      alert(`⚠️ Không thể khôi phục:\n\n${res.message}`);
    }
  };

  const handlePermanentDelete = (item: TrashItem) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa Vĩnh Viễn Mục Này?',
      message: `Bạn có chắc muốn xóa vĩnh viễn "${item.title}" khỏi hệ thống?`,
      subMessage: 'Hành động này không thể hoàn tác. Dữ liệu sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu hệ thống!',
      onConfirm: () => {
        StorageService.deletePermanentlyFromTrash(item.id);
        setMessage(`Đã xóa vĩnh viễn "${item.title}".`);
        loadTrash();
        if (onRefreshData) onRefreshData();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        setTimeout(() => setMessage(null), 3000);
      },
    });
  };

  const handleClearAll = () => {
    if (filteredItems.length === 0) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Dọn Sạch Thùng Rác?',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn tất cả ${filteredItems.length} mục trong danh sách này?`,
      subMessage: 'Mọi dữ liệu trong danh sách đang lọc sẽ bị xóa triệt để và không thể khôi phục!',
      onConfirm: () => {
        filteredItems.forEach((it) => StorageService.deletePermanentlyFromTrash(it.id));
        setMessage('Đã dọn sạch các mục trong thùng rác thành công.');
        loadTrash();
        if (onRefreshData) onRefreshData();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        setTimeout(() => setMessage(null), 3000);
      },
    });
  };

  const getItemIcon = (type: TrashItemType) => {
    switch (type) {
      case 'campus_room':
        return <Building className="h-5 w-5 text-indigo-600" />;
      case 'class':
      case 'student_enrollment':
        return <BookOpen className="h-5 w-5 text-rose-600" />;
      case 'lecturer':
        return <Shield className="h-5 w-5 text-amber-600" />;
      case 'student':
        return <GraduationCap className="h-5 w-5 text-sky-600" />;
      default:
        return <Trash2 className="h-5 w-5 text-rose-600" />;
    }
  };

  const getTypeName = (type: TrashItemType) => {
    switch (type) {
      case 'campus_room':
        return 'Phòng học';
      case 'class':
        return 'Lịch học';
      case 'lecturer':
        return 'Giảng viên';
      case 'student':
        return 'Sinh viên';
      case 'student_enrollment':
        return 'Hủy đăng ký lớp';
      default:
        return 'Mục đã xóa';
    }
  };

  const countForType = (type: TrashItemType) => {
    return roleTrash.filter((t) => t.type === type).length;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-rose-50/70 via-white to-rose-50/40 px-6 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-200 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                  {title}
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    {roleTrash.length} mục
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Khôi phục hoặc xóa vĩnh viễn các mục đã xóa • Tự động lưu trữ an toàn trong 180 ngày (6 tháng)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Policy Banner */}
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-900 leading-relaxed shadow-2xs">
              <Trash2 className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-extrabold text-rose-950">
                  Quy Định Lưu Trữ Thùng Rác (6 Tháng):
                </div>
                <div className="text-[11px] text-rose-800 mt-0.5">
                  Thùng rác này chứa dữ liệu được xóa cách thời điểm hệ thống tự động xóa vĩnh viễn là <strong>6 tháng (180 ngày)</strong>.
                  Trong thời gian này, bạn có thể dễ dàng nhấn <strong>"Khôi phục"</strong> để lấy lại dữ liệu nguyên vẹn, tránh rủi ro lỡ tay xóa nhầm.
                </div>
              </div>
            </div>

            {/* Success alert */}
            {message && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{message}</span>
              </div>
            )}

            {/* Filter buttons & Clear all button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer min-h-[32px] ${
                    activeFilter === 'all'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({roleTrash.length})
                </button>

                {role === 'admin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('campus_room')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer min-h-[32px] ${
                        activeFilter === 'campus_room'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Phòng học ({countForType('campus_room')})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('class')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer min-h-[32px] ${
                        activeFilter === 'class'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Lịch học ({countForType('class')})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('lecturer')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer min-h-[32px] ${
                        activeFilter === 'lecturer'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Giảng viên ({countForType('lecturer')})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('student')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer min-h-[32px] ${
                        activeFilter === 'student'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Sinh viên ({countForType('student')})
                    </button>
                  </>
                )}

                {role === 'lecturer' && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('class')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer min-h-[32px] ${
                      activeFilter === 'class'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Lớp học đã giải tán ({countForType('class')})
                  </button>
                )}

                {role === 'student' && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('student_enrollment')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer min-h-[32px] ${
                      activeFilter === 'student_enrollment'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Lịch học đã hủy ({countForType('student_enrollment')})
                  </button>
                )}
              </div>

              {filteredItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold self-end sm:self-auto cursor-pointer hover:underline transition flex items-center gap-1 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Dọn sạch thùng rác
                </button>
              )}
            </div>

            {/* List */}
            <div className="space-y-2.5">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-3xl border border-slate-200">
                  <Trash2 className="h-10 w-10 mx-auto mb-2 opacity-30 text-rose-400" />
                  <p className="font-semibold text-slate-700 text-xs">Thùng rác trống</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Không có mục nào bị xóa trong danh mục này.</p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const daysLeft = StorageService.getDaysUntilExpiry(item.expiresAt);
                  const deletedDateStr = new Date(item.deletedAt).toLocaleString('vi-VN');

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-sky-200 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 bg-slate-50 rounded-xl shrink-0 border border-slate-100">
                          {getItemIcon(item.type)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 text-sm">{item.title}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              {getTypeName(item.type)}
                            </span>
                            {item.code && (
                              <span className="font-mono text-[11px] bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-md font-bold">
                                {item.code}
                              </span>
                            )}
                          </div>
                          {item.subtitle && <p className="text-slate-500 text-xs mt-0.5">{item.subtitle}</p>}
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
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
                          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                        >
                          <RotateCcw className="h-3.5 w-3.5 text-emerald-600" /> Khôi phục
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePermanentDelete(item)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
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

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 bg-slate-50 shrink-0 text-xs text-slate-500">
            <span>Dữ liệu khôi phục sẽ xuất hiện ngay lập tức trong hệ thống.</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        subMessage={confirmConfig.subMessage}
        iconType="trash"
        confirmText="Xác nhận xóa vĩnh viễn"
        cancelText="Hủy bỏ"
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
