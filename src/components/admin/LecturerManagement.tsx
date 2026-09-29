import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  KeyRound,
  Trash2,
  Search,
  Download,
  Eye,
  EyeOff,
  Copy,
  Check,
  Pencil,
  X,
  AlertCircle,
  Building2,
  CheckSquare,
} from 'lucide-react';
import { User } from '../../types';
import { StorageService } from '../../services/storage';
import { ImportAccountModal } from '../common/ImportAccountModal';
import { ExcelHelper } from '../../services/excelHelper';
import { ConfirmModal } from '../common/ConfirmModal';
import { CenterNotification, CenterNotificationState } from '../common/CenterNotification';
import { TrashManagementModal } from '../common/TrashManagementModal';

interface LecturerManagementProps {
  lecturers: User[];
  onRefreshData: () => void;
}

export const LecturerManagement: React.FC<LecturerManagementProps> = ({
  lecturers,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedLecturerIds, setSelectedLecturerIds] = useState<string[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Count deleted lecturers in trash
  const deletedLecturersCount = React.useMemo(() => {
    return StorageService.getTrash().filter((t) => t.type === 'lecturer').length;
  }, [lecturers, isTrashModalOpen]);

  // Edit Lecturer State
  const [editingLecturer, setEditingLecturer] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    lecturerCode: '',
    email: '',
    phoneNumber: '',
    department: 'Khoa Công Nghệ Thông Tin',
    title: 'Thạc sĩ',
  });
  const [editError, setEditError] = useState<string | null>(null);

  // Modal confirm state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subMessage?: string;
    iconType: 'trash' | 'key';
    confirmAction: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    iconType: 'trash',
    confirmAction: () => {},
  });

  // Center 5-second notification with undo
  const [centerNotification, setCenterNotification] = useState<CenterNotificationState | null>(null);

  // Extract unique departments
  const departmentList = Array.from(
    new Set(lecturers.map((l) => l.department).filter((d): d is string => Boolean(d && d.trim())))
  ).sort();

  const filtered = lecturers.filter((l) => {
    const matchSearch =
      l.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.lecturerCode && l.lecturerCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.email && l.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.department && l.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.title && l.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchDept = selectedDepartment === 'all' || l.department === selectedDepartment;
    return matchSearch && matchDept;
  });

  // Bulk Selection Helpers
  const isAllFilteredSelected = filtered.length > 0 && filtered.every((l) => selectedLecturerIds.includes(l.id));
  const isSomeFilteredSelected = filtered.some((l) => selectedLecturerIds.includes(l.id)) && !isAllFilteredSelected;

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIdSet = new Set(filtered.map((l) => l.id));
      setSelectedLecturerIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const newIds = new Set([...selectedLecturerIds, ...filtered.map((l) => l.id)]);
      setSelectedLecturerIds(Array.from(newIds));
    }
  };

  const toggleSelectLecturer = (id: string) => {
    setSelectedLecturerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenBulkDeleteConfirm = () => {
    if (selectedLecturerIds.length === 0) return;
    const count = selectedLecturerIds.length;
    setConfirmConfig({
      isOpen: true,
      title: `Xác nhận xóa tập thể ${count} giảng viên?`,
      message: `Bạn có chắc chắn muốn xóa ${count} tài khoản giảng viên đã chọn khỏi hệ thống?`,
      subMessage: 'Dữ liệu các giảng viên này sẽ được lưu trong Thùng rác trong 6 tháng trước khi tự động xóa vĩnh viễn. Bạn có thể hoàn tác trong 5 giây hoặc khôi phục từ Thùng rác bất cứ lúc nào.',
      iconType: 'trash',
      confirmAction: () => {
        const idsToDelete = [...selectedLecturerIds];
        const res = StorageService.deleteUsers(idsToDelete, 'admin');
        setSelectedLecturerIds([]);
        onRefreshData();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

        setCenterNotification({
          id: `undo_bulk_delete_gv_${Date.now()}`,
          message: `Đã xóa tập thể ${res.successCount} giảng viên thành công`,
          durationMs: 5000,
          onUndo: () => {
            res.trashItems.forEach((item) => {
              StorageService.restoreTrashItem(item.id);
            });
            onRefreshData();
          },
        });
      },
    });
  };

  const toggleReveal = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPassword = (pwd: string, id: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Edit Lecturer
  const handleOpenEdit = (lecturer: User) => {
    setEditingLecturer(lecturer);
    setEditForm({
      fullName: lecturer.fullName,
      lecturerCode: lecturer.lecturerCode || lecturer.username,
      email: lecturer.email,
      phoneNumber: lecturer.phoneNumber || '',
      department: lecturer.department || 'Khoa Công Nghệ Thông Tin',
      title: lecturer.title || 'Thạc sĩ',
    });
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLecturer) return;
    setEditError(null);

    const cleanName = editForm.fullName.trim();
    const cleanCode = editForm.lecturerCode.trim().toUpperCase();
    let cleanEmail = editForm.email.trim();
    if (cleanEmail && !cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail.toLowerCase()}@school.edu.vn`;
    }
    const cleanPhone = editForm.phoneNumber.trim();

    if (!cleanName || !cleanCode || !cleanEmail) {
      setEditError('Vui lòng nhập đầy đủ Mã giảng viên, Họ và tên và Email!');
      return;
    }

    if (
      StorageService.isLecturerCodeTaken(cleanCode, editingLecturer.id) ||
      StorageService.isStudentCodeTaken(cleanCode, editingLecturer.id)
    ) {
      setEditError(`Mã giảng viên "${cleanCode}" đã được sử dụng! Mã giảng viên phải là duy nhất.`);
      return;
    }

    if (StorageService.isEmailTaken(cleanEmail, editingLecturer.id)) {
      setEditError(`Email "${cleanEmail}" đã được sử dụng bởi tài khoản khác trong hệ thống! (Cho phép các tài khoản có cùng đuôi @... nhưng địa chỉ đầy đủ phải khác nhau).`);
      return;
    }

    if (cleanPhone && StorageService.isPhoneNumberTaken(cleanPhone, editingLecturer.id)) {
      setEditError(`Số điện thoại "${cleanPhone}" đã được sử dụng bởi tài khoản khác trong hệ thống! Số điện thoại phải là duy nhất.`);
      return;
    }

    try {
      StorageService.updateUser(editingLecturer.id, {
        fullName: cleanName,
        lecturerCode: cleanCode,
        username: cleanCode,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        department: editForm.department.trim(),
        title: editForm.title.trim(),
      });
      setEditingLecturer(null);
      onRefreshData();
    } catch (err: any) {
      setEditError(err.message || 'Lỗi khi cập nhật tài khoản giảng viên!');
    }
  };

  // 2. Key (Reset MK) button clicked -> confirm modal
  const handleOpenResetConfirm = (lecturer: User) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận reset mật khẩu?',
      message: `Bạn có chắc chắn muốn reset mật khẩu cho giảng viên "${lecturer.fullName}" (${lecturer.lecturerCode || lecturer.username}) về mặc định (gv123456)?`,
      subMessage: 'Sau khi reset thành công, bạn có 5 giây để Hoàn tác nếu thao tác nhầm.',
      iconType: 'key',
      confirmAction: () => {
        const resetResult = StorageService.resetUserPassword(lecturer.id, 'gv123456');
        onRefreshData();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

        // Show centered 5s notification with Hoàn tác
        setCenterNotification({
          id: `undo_reset_${lecturer.id}_${Date.now()}`,
          message: 'reset mật khẩu thành công',
          durationMs: 5000,
          onUndo: () => {
            StorageService.updateUser(lecturer.id, {
              password: resetResult.previousPassword,
              hasChangedPassword: lecturer.hasChangedPassword,
            });
            onRefreshData();
          },
        });
      },
    });
  };

  // 2. Trash (Delete) button clicked -> confirm modal
  const handleOpenDeleteConfirm = (lecturer: User) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận xóa tài khoản giảng viên?',
      message: `Bạn có chắc chắn muốn xóa tài khoản giảng viên "${lecturer.fullName}" (${lecturer.lecturerCode || lecturer.username})?`,
      subMessage: 'Dữ liệu sẽ được lưu trong Thùng rác trong 6 tháng trước khi tự động xóa vĩnh viễn. Bạn có thể khôi phục lại bất kỳ lúc nào.',
      iconType: 'trash',
      confirmAction: () => {
        const deleteResult = StorageService.deleteUser(lecturer.id, 'admin');
        onRefreshData();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

        // Show centered 5s notification with Hoàn tác
        setCenterNotification({
          id: `undo_delete_${lecturer.id}_${Date.now()}`,
          message: 'xóa tài khoản thành công',
          durationMs: 5000,
          onUndo: () => {
            if (deleteResult.trashItem) {
              StorageService.restoreTrashItem(deleteResult.trashItem.id);
            } else if (deleteResult.previousUser) {
              StorageService.addUser(deleteResult.previousUser);
            }
            onRefreshData();
          },
        });
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-600" /> Quản Lý Giáo Viên / Giảng Viên ({lecturers.length})
          </h3>
          <p className="text-xs text-slate-500">
            Theo dõi mật khẩu hiện hành để cấp lại cho giảng viên, xóa chuyển vào thùng rác 6 tháng
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTrashModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Mở thùng rác giảng viên để khôi phục hoặc xóa vĩnh viễn"
          >
            <Trash2 className="h-4 w-4 text-rose-600" />
            <span>Thùng rác giảng viên ({deletedLecturersCount})</span>
          </button>
          <button
            type="button"
            onClick={() => ExcelHelper.downloadLecturerTemplate()}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-sky-600" /> Tải mẫu Excel
          </button>
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" /> Thêm tài khoản Giảng viên
          </button>
        </div>
      </div>

      {/* Search and Department Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo Tên, Mã giảng viên, Khoa / Bộ môn, Học vị, Email..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
          />
        </div>

        {/* Filter by Department / Faculty */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <Building2 className="h-4 w-4 text-sky-600 shrink-0" />
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 w-full md:w-auto font-medium"
          >
            <option value="all">Tất cả khoa / bộ môn ({departmentList.length})</option>
            {departmentList.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Action Banner */}
      {selectedLecturerIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 bg-rose-50/90 border border-rose-200 rounded-2xl text-xs animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2 text-rose-950 font-semibold">
            <CheckSquare className="h-4 w-4 text-rose-600 shrink-0" />
            <span>
              Đang chọn <strong className="text-rose-700 font-extrabold">{selectedLecturerIds.length}</strong> giảng viên
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedLecturerIds([])}
              className="px-3 py-1.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition font-medium cursor-pointer"
            >
              Bỏ chọn
            </button>
            <button
              type="button"
              onClick={handleOpenBulkDeleteConfirm}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl shadow-xs transition font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa tập thể ({selectedLecturerIds.length} giảng viên)
            </button>
          </div>
        </div>
      )}

      {/* Lecturers Table */}
      <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeFilteredSelected;
                    }}
                    onChange={toggleSelectAllFiltered}
                    className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                    title={isAllFilteredSelected ? 'Bỏ chọn tất cả giảng viên đang lọc' : 'Chọn tất cả giảng viên đang lọc'}
                  />
                </th>
                <th className="py-3 px-4">Mã GV</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Khoa / Bộ môn</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Mật khẩu hiện hành</th>
                <th className="py-3 px-4 text-right">Reset MK / Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Chưa có giảng viên nào phù hợp bộ lọc. Nhấn "Thêm tài khoản Giảng viên" để thêm mới.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => {
                  const isChecked = selectedLecturerIds.includes(l.id);
                  return (
                    <tr
                      key={l.id}
                      className={`hover:bg-slate-50/80 transition ${isChecked ? 'bg-sky-50/40' : ''}`}
                    >
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectLecturer(l.id)}
                          className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-800">{l.lecturerCode || l.username}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[11px]">
                          {l.fullName.slice(0, 1)}
                        </div>
                        <div>
                          <div>{l.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{l.title || 'Giảng viên'}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{l.department || '-'}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{l.email}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{l.phoneNumber || '-'}</td>
                      
                      {/* Cột Mật khẩu hiện hành - Admin dễ dàng theo dõi & gửi lại */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 text-[11px]">
                            {revealedPasswords[l.id] ? l.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleReveal(l.id)}
                            className="p-1 text-slate-400 hover:text-sky-600 rounded transition cursor-pointer"
                            title={revealedPasswords[l.id] ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          >
                            {revealedPasswords[l.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyPassword(l.password, l.id)}
                            className="p-1 text-slate-400 hover:text-sky-600 rounded transition cursor-pointer"
                            title="Sao chép mật khẩu gửi cho giảng viên"
                          >
                            {copiedId === l.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Chỉnh sửa thông tin */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(l)}
                            className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition cursor-pointer"
                            title="Chỉnh sửa thông tin giảng viên"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {/* Chìa khóa (Reset MK) */}
                          <button
                            type="button"
                            onClick={() => handleOpenResetConfirm(l)}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                            title="Reset mật khẩu về mặc định (gv123456)"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>

                          {/* Thùng rác (Xóa vào thùng rác 6 tháng) */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteConfirm(l)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Xóa giảng viên (Lưu trữ 6 tháng trong Thùng rác)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Lecturer Modal */}
      {editingLecturer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-sky-100 my-8">
            <div className="flex items-center justify-between border-b border-sky-100 bg-linear-to-r from-sky-50 to-white px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-100 text-sky-600 rounded-xl">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Chỉnh Sửa Thông Tin Giảng Viên</h3>
                  <p className="text-xs text-slate-500">Mã giảng viên là duy nhất. Cho phép email có cùng phần đuôi @ (như @school.edu.vn, @gmail.com).</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingLecturer(null)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {editError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã giảng viên * <span className="text-[10px] text-amber-600 font-normal">(Duy nhất)</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.lecturerCode}
                    onChange={(e) => setEditForm({ ...editForm, lecturerCode: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      editForm.lecturerCode.trim() &&
                      (StorageService.isLecturerCodeTaken(editForm.lecturerCode.trim(), editingLecturer.id) ||
                        StorageService.isStudentCodeTaken(editForm.lecturerCode.trim(), editingLecturer.id))
                        ? 'border-rose-400 bg-rose-50/30'
                        : 'border-slate-300'
                    }`}
                    required
                  />
                  {editForm.lecturerCode.trim() &&
                    (StorageService.isLecturerCodeTaken(editForm.lecturerCode.trim(), editingLecturer.id) ||
                      StorageService.isStudentCodeTaken(editForm.lecturerCode.trim(), editingLecturer.id)) && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" /> Mã giảng viên này đã có người sử dụng!
                      </p>
                    )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email liên hệ * <span className="text-[10px] text-sky-600 font-normal">(Cho phép cùng đuôi @...)</span>
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      editForm.email.trim() && StorageService.isEmailTaken(editForm.email.trim(), editingLecturer.id)
                        ? 'border-rose-400 bg-rose-50/30'
                        : 'border-slate-300'
                    }`}
                    required
                  />
                  {editForm.email.trim() && StorageService.isEmailTaken(editForm.email.trim(), editingLecturer.id) && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" /> Địa chỉ email này đã có người sử dụng!
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">Được phép trùng phần đuôi tên miền @... (ví dụ: @school.edu.vn), chỉ cần khác tên người dùng.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại <span className="text-[10px] text-amber-600 font-normal">(Duy nhất)</span>
                  </label>
                  <input
                    type="tel"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      editForm.phoneNumber.trim() &&
                      StorageService.isPhoneNumberTaken(editForm.phoneNumber.trim(), editingLecturer.id)
                        ? 'border-rose-400 bg-rose-50/30'
                        : 'border-slate-300'
                    }`}
                    placeholder="0912..."
                  />
                  {editForm.phoneNumber.trim() &&
                    StorageService.isPhoneNumberTaken(editForm.phoneNumber.trim(), editingLecturer.id) && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" /> Số điện thoại này đã có người sử dụng!
                      </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Khoa / Bộ môn</label>
                    <input
                      type="text"
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Học vị / Chức danh</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLecturer(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        subMessage={confirmConfig.subMessage}
        iconType={confirmConfig.iconType}
        confirmText="Xác nhận"
        cancelText="Hủy"
        onConfirm={confirmConfig.confirmAction}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Center 5-Second Notification with Hoàn Tác */}
      <CenterNotification
        notification={centerNotification}
        onClose={() => setCenterNotification(null)}
      />

      {/* Import Modal */}
      <ImportAccountModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        targetRole="lecturer"
        onSuccess={(count) => {
          onRefreshData();
          alert(`Đã thêm thành công ${count} tài khoản giảng viên!`);
        }}
      />

      {/* Dedicated Trash Management Modal for Lecturers */}
      <TrashManagementModal
        isOpen={isTrashModalOpen}
        onClose={() => {
          setIsTrashModalOpen(false);
          onRefreshData();
        }}
        initialFilter="lecturer"
        title="Quản Lý Thùng Rác Giảng Viên (Lưu Trữ 6 Tháng)"
        role="admin"
        onRefreshData={onRefreshData}
      />
    </div>
  );
};
