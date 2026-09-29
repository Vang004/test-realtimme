import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  KeyRound,
  Trash2,
  Search,
  Download,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Check,
  Pencil,
  X,
  AlertCircle,
  CheckSquare,
  GraduationCap,
} from 'lucide-react';
import { User } from '../../types';
import { StorageService, generateStudentPassword } from '../../services/storage';
import { ImportAccountModal } from '../common/ImportAccountModal';
import { ExcelHelper } from '../../services/excelHelper';
import { ConfirmModal } from '../common/ConfirmModal';
import { CenterNotification, CenterNotificationState } from '../common/CenterNotification';
import { TrashManagementModal } from '../common/TrashManagementModal';

interface StudentManagementProps {
  students: User[];
  onRefreshData: () => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Count deleted students currently in trash
  const deletedStudentsCount = React.useMemo(() => {
    return StorageService.getTrash().filter((t) => t.type === 'student').length;
  }, [students, isTrashModalOpen]);

  // Edit Student State
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    studentCode: '',
    email: '',
    phoneNumber: '',
    courseYear: '10',
    className: 'A1',
  });
  const [editError, setEditError] = useState<string | null>(null);

  // Confirm Modal state
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

  // Extract unique classes & courses (khóa)
  const classList = Array.from(new Set(students.map((s) => s.className).filter(Boolean))).sort();
  const courseList = Array.from(
    new Set(students.map((s) => s.courseYear).filter((c): c is string => Boolean(c && c.trim())))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const filtered = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.className && s.className.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.courseYear && s.courseYear.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchClass = selectedClass === 'all' || s.className === selectedClass;
    const matchCourse = selectedCourse === 'all' || s.courseYear === selectedCourse;
    return matchSearch && matchClass && matchCourse;
  });

  // Bulk Selection Helpers
  const isAllFilteredSelected = filtered.length > 0 && filtered.every((s) => selectedStudentIds.includes(s.id));
  const isSomeFilteredSelected = filtered.some((s) => selectedStudentIds.includes(s.id)) && !isAllFilteredSelected;

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIdSet = new Set(filtered.map((s) => s.id));
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const newIds = new Set([...selectedStudentIds, ...filtered.map((s) => s.id)]);
      setSelectedStudentIds(Array.from(newIds));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenBulkDeleteConfirm = () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    setConfirmConfig({
      isOpen: true,
      title: `Xác nhận xóa tập thể ${count} sinh viên?`,
      message: `Bạn có chắc chắn muốn xóa ${count} tài khoản sinh viên đã chọn khỏi hệ thống?`,
      subMessage: 'Dữ liệu các sinh viên này sẽ được lưu trong Thùng rác trong 6 tháng trước khi tự động xóa vĩnh viễn. Bạn có thể khôi phục lại bất kỳ lúc nào.',
      iconType: 'trash',
      confirmAction: () => {
        const idsToDelete = [...selectedStudentIds];
        const res = StorageService.deleteUsers(idsToDelete, 'admin');
        setSelectedStudentIds([]);
        onRefreshData();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

        setCenterNotification({
          id: `undo_bulk_delete_st_${Date.now()}`,
          message: `Đã xóa tập thể ${res.successCount} sinh viên thành công`,
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

  // 1. Reset Password (Chìa khóa) -> Confirm Modal -> Center Notification
  const handleOpenEdit = (student: User) => {
    setEditingStudent(student);
    setEditForm({
      fullName: student.fullName,
      studentCode: student.studentCode || student.username,
      email: student.email,
      phoneNumber: student.phoneNumber || '',
      courseYear: student.courseYear || '10',
      className: student.className || 'A1',
    });
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditError(null);

    const cleanName = editForm.fullName.trim();
    const cleanCode = editForm.studentCode.trim().toUpperCase();
    let cleanEmail = editForm.email.trim();
    if (cleanEmail && !cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail.toLowerCase()}@school.edu.vn`;
    }
    const cleanPhone = editForm.phoneNumber.trim();

    if (!cleanName || !cleanCode || !cleanEmail) {
      setEditError('Vui lòng nhập đầy đủ Mã sinh viên, Họ và tên và Email!');
      return;
    }

    if (
      StorageService.isStudentCodeTaken(cleanCode, editingStudent.id) ||
      StorageService.isLecturerCodeTaken(cleanCode, editingStudent.id)
    ) {
      setEditError(`Mã sinh viên "${cleanCode}" đã được sử dụng! Mã sinh viên phải là duy nhất.`);
      return;
    }

    if (StorageService.isEmailTaken(cleanEmail, editingStudent.id)) {
      setEditError(`Email "${cleanEmail}" đã được sử dụng bởi tài khoản khác trong hệ thống! (Cho phép các tài khoản có cùng đuôi @... nhưng địa chỉ đầy đủ phải khác nhau).`);
      return;
    }

    if (cleanPhone && StorageService.isPhoneNumberTaken(cleanPhone, editingStudent.id)) {
      setEditError(`Số điện thoại "${cleanPhone}" đã được sử dụng bởi tài khoản khác trong hệ thống! Số điện thoại phải là duy nhất.`);
      return;
    }

    try {
      StorageService.updateUser(editingStudent.id, {
        fullName: cleanName,
        studentCode: cleanCode,
        username: cleanCode,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        courseYear: editForm.courseYear.trim(),
        className: editForm.className.trim(),
      });
      setEditingStudent(null);
      onRefreshData();
    } catch (err: any) {
      setEditError(err.message || 'Lỗi khi cập nhật tài khoản sinh viên!');
    }
  };

  const handleOpenResetConfirm = (student: User) => {
    const defaultFormula = generateStudentPassword(
      student.studentCode || '',
      student.courseYear || '10',
      student.className || 'A1'
    );

    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận reset mật khẩu?',
      message: `Bạn có chắc chắn muốn RESET mật khẩu cho sinh viên "${student.fullName}" (${student.studentCode})?\nMật khẩu sẽ được khôi phục về mặc định: ${defaultFormula}`,
      subMessage: 'Sau khi reset thành công, bạn có 5 giây để Hoàn tác nếu thao tác nhầm.',
      iconType: 'key',
      confirmAction: () => {
        const resetResult = StorageService.resetUserPassword(student.id);
        onRefreshData();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

        // Show centered 5s notification with Hoàn tác
        setCenterNotification({
          id: `undo_reset_st_${student.id}_${Date.now()}`,
          message: 'reset mật khẩu thành công',
          durationMs: 5000,
          onUndo: () => {
            StorageService.updateUser(student.id, {
              password: resetResult.previousPassword,
              hasChangedPassword: student.hasChangedPassword,
            });
            onRefreshData();
          },
        });
      },
    });
  };

  // 2. Delete Student (Thùng rác) -> Confirm Modal -> Center Notification
  const handleOpenDeleteConfirm = (student: User) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận xóa tài khoản sinh viên?',
      message: `Bạn có chắc chắn muốn xóa tài khoản sinh viên "${student.fullName}" (${student.studentCode})?`,
      subMessage: 'Dữ liệu sinh viên sẽ được lưu trong Thùng rác trong 6 tháng trước khi tự động xóa vĩnh viễn. Bạn có thể khôi phục lại bất kỳ lúc nào.',
      iconType: 'trash',
      confirmAction: () => {
        const deleteResult = StorageService.deleteUser(student.id, 'admin');
        onRefreshData();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

        // Show centered 5s notification with Hoàn tác
        setCenterNotification({
          id: `undo_delete_st_${student.id}_${Date.now()}`,
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-600" /> Quản Lý Học Sinh / Sinh Viên ({students.length})
          </h3>
          <p className="text-xs text-slate-500">
            Mật khẩu sinh viên tự sinh theo mã khóa lớp, xóa chuyển vào thùng rác 6 tháng
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTrashModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Mở thùng rác sinh viên để khôi phục hoặc xóa vĩnh viễn"
          >
            <Trash2 className="h-4 w-4 text-rose-600" />
            <span>Thùng rác sinh viên ({deletedStudentsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => ExcelHelper.downloadStudentTemplate()}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-sky-600" /> Tải mẫu Excel
          </button>
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" /> Thêm tài khoản Sinh viên
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo Tên, Mã SV, Khóa, Lớp, Email..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
          />
        </div>

        {/* Filter by Course (Khóa) */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <GraduationCap className="h-4 w-4 text-sky-600 shrink-0" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 w-full md:w-auto font-medium"
          >
            <option value="all">Tất cả các khóa ({courseList.length})</option>
            {courseList.map((crs) => (
              <option key={crs} value={crs}>
                Khóa {crs}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Class (Lớp) */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 w-full md:w-auto font-medium"
          >
            <option value="all">Tất cả các lớp ({classList.length})</option>
            {classList.map((cls) => (
              <option key={cls} value={cls}>
                Lớp {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Action Banner */}
      {selectedStudentIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 bg-rose-50/90 border border-rose-200 rounded-2xl text-xs animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2 text-rose-950 font-semibold">
            <CheckSquare className="h-4 w-4 text-rose-600 shrink-0" />
            <span>
              Đang chọn <strong className="text-rose-700 font-extrabold">{selectedStudentIds.length}</strong> sinh viên
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedStudentIds([])}
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
              Xóa tập thể ({selectedStudentIds.length} sinh viên)
            </button>
          </div>
        </div>
      )}

      {/* Students Table */}
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
                    title={isAllFilteredSelected ? 'Bỏ chọn tất cả sinh viên đang lọc' : 'Chọn tất cả sinh viên đang lọc'}
                  />
                </th>
                <th className="py-3 px-4">Mã SV (Tên đăng nhập)</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Khóa & Lớp</th>
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
                    Chưa có sinh viên nào phù hợp bộ lọc. Nhấn "Thêm tài khoản Sinh viên" để nạp danh sách.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isChecked = selectedStudentIds.includes(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/80 transition ${isChecked ? 'bg-sky-50/40' : ''}`}
                    >
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectStudent(s.id)}
                          className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-800">{s.studentCode || s.username}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                          {s.fullName.slice(0, 1)}
                        </div>
                        <div>{s.fullName}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        Khóa {s.courseYear || '10'} • Lớp {s.className || 'A1'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{s.email}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{s.phoneNumber || '-'}</td>
                      
                      {/* Cột Mật khẩu hiện hành */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 bg-emerald-50/60 px-2 py-0.5 rounded-md border border-emerald-100 text-[11px]">
                            {revealedPasswords[s.id] ? s.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleReveal(s.id)}
                            className="p-1 text-slate-400 hover:text-sky-600 rounded transition cursor-pointer"
                            title={revealedPasswords[s.id] ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          >
                            {revealedPasswords[s.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyPassword(s.password, s.id)}
                            className="p-1 text-slate-400 hover:text-sky-600 rounded transition cursor-pointer"
                            title="Sao chép mật khẩu"
                          >
                            {copiedId === s.id ? (
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
                            onClick={() => handleOpenEdit(s)}
                            className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition cursor-pointer"
                            title="Chỉnh sửa thông tin sinh viên"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {/* Reset MK */}
                          <button
                            type="button"
                            onClick={() => handleOpenResetConfirm(s)}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                            title="Reset mật khẩu về mặc định [mã sv][khóa][lớp]"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>

                          {/* Thùng rác xóa tài khoản */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteConfirm(s)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Xóa sinh viên (Lưu trữ 6 tháng trong Thùng rác)"
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

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-sky-100 my-8">
            <div className="flex items-center justify-between border-b border-sky-100 bg-linear-to-r from-sky-50 to-white px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-100 text-sky-600 rounded-xl">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Chỉnh Sửa Thông Tin Sinh Viên</h3>
                  <p className="text-xs text-slate-500">Mã sinh viên là duy nhất. Cho phép email có cùng phần đuôi @ (như @school.edu.vn, @gmail.com).</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
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
                    Mã sinh viên * <span className="text-[10px] text-amber-600 font-normal">(Duy nhất)</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.studentCode}
                    onChange={(e) => setEditForm({ ...editForm, studentCode: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      editForm.studentCode.trim() &&
                      (StorageService.isStudentCodeTaken(editForm.studentCode.trim(), editingStudent.id) ||
                        StorageService.isLecturerCodeTaken(editForm.studentCode.trim(), editingStudent.id))
                        ? 'border-rose-400 bg-rose-50/30'
                        : 'border-slate-300'
                    }`}
                    required
                  />
                  {editForm.studentCode.trim() &&
                    (StorageService.isStudentCodeTaken(editForm.studentCode.trim(), editingStudent.id) ||
                      StorageService.isLecturerCodeTaken(editForm.studentCode.trim(), editingStudent.id)) && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" /> Mã sinh viên này đã có người sử dụng!
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
                      editForm.email.trim() && StorageService.isEmailTaken(editForm.email.trim(), editingStudent.id)
                        ? 'border-rose-400 bg-rose-50/30'
                        : 'border-slate-300'
                    }`}
                    required
                  />
                  {editForm.email.trim() && StorageService.isEmailTaken(editForm.email.trim(), editingStudent.id) && (
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
                      StorageService.isPhoneNumberTaken(editForm.phoneNumber.trim(), editingStudent.id)
                        ? 'border-rose-400 bg-rose-50/30'
                        : 'border-slate-300'
                    }`}
                    placeholder="0912..."
                  />
                  {editForm.phoneNumber.trim() &&
                    StorageService.isPhoneNumberTaken(editForm.phoneNumber.trim(), editingStudent.id) && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" /> Số điện thoại này đã có người sử dụng!
                      </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Khóa học</label>
                    <input
                      type="text"
                      value={editForm.courseYear}
                      onChange={(e) => setEditForm({ ...editForm, courseYear: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lớp sinh hoạt</label>
                    <input
                      type="text"
                      value={editForm.className}
                      onChange={(e) => setEditForm({ ...editForm, className: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
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
        targetRole="student"
        onSuccess={(count) => {
          onRefreshData();
          alert(`Đã thêm thành công ${count} tài khoản sinh viên!`);
        }}
      />

      {/* Dedicated Trash Management Modal for Students */}
      <TrashManagementModal
        isOpen={isTrashModalOpen}
        onClose={() => {
          setIsTrashModalOpen(false);
          onRefreshData();
        }}
        initialFilter="student"
        title="Quản Lý Thùng Rác Sinh Viên (Lưu Trữ 6 Tháng)"
        role="admin"
        onRefreshData={onRefreshData}
      />
    </div>
  );
};
