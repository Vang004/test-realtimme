import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Link2,
  UserPlus,
  X,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import { ExcelHelper, ParsedStudentRow, ParsedLecturerRow } from '../../services/excelHelper';
import { StorageService, generateStudentPassword } from '../../services/storage';
import { User } from '../../types';

interface ImportAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: 'lecturer' | 'student';
  onSuccess: (count: number) => void;
}

export const ImportAccountModal: React.FC<ImportAccountModalProps> = ({
  isOpen,
  onClose,
  targetRole,
  onSuccess,
}) => {
  const [tab, setTab] = useState<'excel' | 'sheet' | 'manual'>('excel');
  const [file, setFile] = useState<File | null>(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parsed results before final save
  const [previewStudents, setPreviewStudents] = useState<ParsedStudentRow[]>([]);
  const [previewLecturers, setPreviewLecturers] = useState<ParsedLecturerRow[]>([]);

  // Manual form state
  const [manualCode, setManualCode] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualCourse, setManualCourse] = useState('10');
  const [manualClass, setManualClass] = useState('A1');
  const [manualDept, setManualDept] = useState('Khoa Công Nghệ Thông Tin');
  const [manualTitle, setManualTitle] = useState('Thạc sĩ');
  const [manualPhone, setManualPhone] = useState('');

  if (!isOpen) return null;

  const isStudent = targetRole === 'student';

  const resetForm = () => {
    setFile(null);
    setSheetUrl('');
    setError(null);
    setPreviewStudents([]);
    setPreviewLecturers([]);
    setManualCode('');
    setManualName('');
    setManualEmail('');
    setManualPhone('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);
    setError(null);

    try {
      if (isStudent) {
        const rows = await ExcelHelper.parseStudentFile(uploadedFile);
        if (rows.length === 0) {
          throw new Error('Không tìm thấy dòng dữ liệu sinh viên hợp lệ trong file');
        }
        setPreviewStudents(rows);
      } else {
        const rows = await ExcelHelper.parseLecturerFile(uploadedFile);
        if (rows.length === 0) {
          throw new Error('Không tìm thấy dòng dữ liệu giảng viên hợp lệ trong file');
        }
        setPreviewLecturers(rows);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi đọc file Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchSheet = async () => {
    if (!sheetUrl.trim()) {
      setError('Vui lòng nhập đường link Google Sheets');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isStudent) {
        const rows = await ExcelHelper.parseGoogleSheetUrl(sheetUrl, 'student');
        if (rows.length === 0) throw new Error('Không có dòng sinh viên nào trong trang tính');
        setPreviewStudents(rows);
      } else {
        const rows = await ExcelHelper.parseGoogleSheetUrl(sheetUrl, 'lecturer');
        if (rows.length === 0) throw new Error('Không có dòng giảng viên nào trong trang tính');
        setPreviewLecturers(rows);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể đồng bộ dữ liệu từ Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  const checkStudentConflicts = (row: ParsedStudentRow, index: number, all: ParsedStudentRow[]): string[] => {
    const conflicts: string[] = [];
    const code = row.studentCode.trim().toUpperCase();
    const email = row.email.trim().toLowerCase();
    const phone = StorageService.normalizePhoneNumber(row.phoneNumber);

    if (StorageService.isStudentCodeTaken(code) || StorageService.isLecturerCodeTaken(code)) {
      conflicts.push(`Mã "${code}" đã có trong hệ thống`);
    } else if (all.some((other, idx) => idx !== index && other.studentCode.trim().toUpperCase() === code)) {
      conflicts.push(`Mã "${code}" bị trùng trong danh sách`);
    }

    if (StorageService.isEmailTaken(email)) {
      conflicts.push(`Email "${email}" đã có trong hệ thống`);
    } else if (all.some((other, idx) => idx !== index && other.email.trim().toLowerCase() === email)) {
      conflicts.push(`Email "${email}" bị trùng trong danh sách`);
    }

    if (phone && phone.length >= 8) {
      if (StorageService.isPhoneNumberTaken(phone)) {
        conflicts.push(`SĐT "${row.phoneNumber}" đã có trong hệ thống`);
      } else if (
        all.some(
          (other, idx) =>
            idx !== index &&
            other.phoneNumber &&
            StorageService.normalizePhoneNumber(other.phoneNumber) === phone
        )
      ) {
        conflicts.push(`SĐT "${row.phoneNumber}" bị trùng trong danh sách`);
      }
    }

    return conflicts;
  };

  const checkLecturerConflicts = (row: ParsedLecturerRow, index: number, all: ParsedLecturerRow[]): string[] => {
    const conflicts: string[] = [];
    const code = row.lecturerCode.trim().toUpperCase();
    const email = row.email.trim().toLowerCase();
    const phone = StorageService.normalizePhoneNumber(row.phoneNumber);

    if (StorageService.isLecturerCodeTaken(code) || StorageService.isStudentCodeTaken(code)) {
      conflicts.push(`Mã "${code}" đã có trong hệ thống`);
    } else if (all.some((other, idx) => idx !== index && other.lecturerCode.trim().toUpperCase() === code)) {
      conflicts.push(`Mã "${code}" bị trùng trong danh sách`);
    }

    if (StorageService.isEmailTaken(email)) {
      conflicts.push(`Email "${email}" đã có trong hệ thống`);
    } else if (all.some((other, idx) => idx !== index && other.email.trim().toLowerCase() === email)) {
      conflicts.push(`Email "${email}" bị trùng trong danh sách`);
    }

    if (phone && phone.length >= 8) {
      if (StorageService.isPhoneNumberTaken(phone)) {
        conflicts.push(`SĐT "${row.phoneNumber}" đã có trong hệ thống`);
      } else if (
        all.some(
          (other, idx) =>
            idx !== index &&
            other.phoneNumber &&
            StorageService.normalizePhoneNumber(other.phoneNumber) === phone
        )
      ) {
        conflicts.push(`SĐT "${row.phoneNumber}" bị trùng trong danh sách`);
      }
    }

    return conflicts;
  };

  const handleAddManual = () => {
    if (!manualName.trim()) {
      setError('Vui lòng nhập Họ và tên');
      return;
    }

    if (isStudent) {
      const code = manualCode.trim().toUpperCase() || `SV${Math.floor(100000 + Math.random() * 900000)}`;
      let email = manualEmail.trim();
      if (!email) {
        email = `${code.toLowerCase()}@school.edu.vn`;
      } else if (!email.includes('@')) {
        email = `${email.toLowerCase()}@school.edu.vn`;
      }
      const phone = manualPhone.trim();

      // Check if studentCode already taken
      if (
        StorageService.isStudentCodeTaken(code) ||
        StorageService.isLecturerCodeTaken(code) ||
        previewStudents.some((p) => p.studentCode.trim().toUpperCase() === code)
      ) {
        setError(`Mã sinh viên "${code}" đã được sử dụng! Mã sinh viên phải là duy nhất.`);
        return;
      }

      // Check if email already taken
      if (
        StorageService.isEmailTaken(email) ||
        previewStudents.some((p) => p.email.trim().toLowerCase() === email.toLowerCase())
      ) {
        setError(`Email "${email}" đã được sử dụng bởi một tài khoản khác! (Cho phép các tài khoản có cùng đuôi @... nhưng địa chỉ đầy đủ phải khác nhau).`);
        return;
      }

      // Check if phone number already taken
      if (phone) {
        const cleanP = StorageService.normalizePhoneNumber(phone);
        if (
          StorageService.isPhoneNumberTaken(phone) ||
          previewStudents.some(
            (p) => p.phoneNumber && StorageService.normalizePhoneNumber(p.phoneNumber) === cleanP
          )
        ) {
          setError(`Số điện thoại "${phone}" đã được sử dụng bởi một tài khoản khác! Số điện thoại phải là duy nhất.`);
          return;
        }
      }

      const newRow: ParsedStudentRow = {
        studentCode: code,
        fullName: manualName.trim(),
        email: email,
        courseYear: manualCourse.trim() || '10',
        className: manualClass.trim() || 'A1',
        phoneNumber: phone,
      };
      setPreviewStudents([newRow, ...previewStudents]);
    } else {
      const code = manualCode.trim().toUpperCase() || `GV${Math.floor(100 + Math.random() * 900)}`;
      let email = manualEmail.trim();
      if (!email) {
        email = `${code.toLowerCase()}@school.edu.vn`;
      } else if (!email.includes('@')) {
        email = `${email.toLowerCase()}@school.edu.vn`;
      }
      const phone = manualPhone.trim();

      // Check if lecturerCode already taken
      if (
        StorageService.isLecturerCodeTaken(code) ||
        StorageService.isStudentCodeTaken(code) ||
        previewLecturers.some((p) => p.lecturerCode.trim().toUpperCase() === code)
      ) {
        setError(`Mã giảng viên "${code}" đã được sử dụng! Mã giảng viên phải là duy nhất.`);
        return;
      }

      // Check if email already taken
      if (
        StorageService.isEmailTaken(email) ||
        previewLecturers.some((p) => p.email.trim().toLowerCase() === email.toLowerCase())
      ) {
        setError(`Email "${email}" đã được sử dụng bởi một tài khoản khác! (Cho phép các tài khoản có cùng đuôi @... nhưng địa chỉ đầy đủ phải khác nhau).`);
        return;
      }

      // Check if phone number already taken
      if (phone) {
        const cleanP = StorageService.normalizePhoneNumber(phone);
        if (
          StorageService.isPhoneNumberTaken(phone) ||
          previewLecturers.some(
            (p) => p.phoneNumber && StorageService.normalizePhoneNumber(p.phoneNumber) === cleanP
          )
        ) {
          setError(`Số điện thoại "${phone}" đã được sử dụng bởi một tài khoản khác! Số điện thoại phải là duy nhất.`);
          return;
        }
      }

      const newRow: ParsedLecturerRow = {
        lecturerCode: code,
        fullName: manualName.trim(),
        email: email,
        department: manualDept.trim(),
        title: manualTitle.trim(),
        phoneNumber: phone,
      };
      setPreviewLecturers([newRow, ...previewLecturers]);
    }

    // Reset manual form fields
    setManualCode('');
    setManualName('');
    setManualEmail('');
    setManualPhone('');
    setError(null);
  };

  const handleRemoveDuplicateRows = () => {
    if (isStudent) {
      const cleanList = previewStudents.filter((s, idx) => checkStudentConflicts(s, idx, previewStudents).length === 0);
      setPreviewStudents(cleanList);
    } else {
      const cleanList = previewLecturers.filter((l, idx) => checkLecturerConflicts(l, idx, previewLecturers).length === 0);
      setPreviewLecturers(cleanList);
    }
    setError(null);
  };

  const handleSaveAll = () => {
    let count = 0;
    setError(null);

    if (isStudent) {
      if (previewStudents.length === 0) {
        setError('Chưa có dữ liệu sinh viên nào để lưu');
        return;
      }

      // Check if ANY row has conflicts
      const conflictRows = previewStudents.filter(
        (s, idx) => checkStudentConflicts(s, idx, previewStudents).length > 0
      );
      if (conflictRows.length > 0) {
        const firstConflict = conflictRows[0];
        const reasons = checkStudentConflicts(firstConflict, 0, previewStudents);
        setError(
          `Không thể lưu! Phát hiện ${conflictRows.length} dòng bị trùng lặp thông tin (Mã, Email hoặc Số điện thoại đã tồn tại). Ví dụ: Sinh viên "${firstConflict.fullName}" - ${reasons.join(', ')}. Email, số điện thoại và mã sinh viên phải là duy nhất!`
        );
        return;
      }

      try {
        const newUsers = ExcelHelper.convertStudentsToUsers(previewStudents);
        newUsers.forEach((u) => StorageService.addUser(u));
        count = newUsers.length;
      } catch (err: any) {
        setError(err.message || 'Lỗi khi lưu danh sách sinh viên!');
        return;
      }
    } else {
      if (previewLecturers.length === 0) {
        setError('Chưa có dữ liệu giảng viên nào để lưu');
        return;
      }

      // Check if ANY row has conflicts
      const conflictRows = previewLecturers.filter(
        (l, idx) => checkLecturerConflicts(l, idx, previewLecturers).length > 0
      );
      if (conflictRows.length > 0) {
        const firstConflict = conflictRows[0];
        const reasons = checkLecturerConflicts(firstConflict, 0, previewLecturers);
        setError(
          `Không thể lưu! Phát hiện ${conflictRows.length} dòng bị trùng lặp thông tin (Mã, Email hoặc Số điện thoại đã tồn tại). Ví dụ: Giảng viên "${firstConflict.fullName}" - ${reasons.join(', ')}. Email, số điện thoại và mã giảng viên phải là duy nhất!`
        );
        return;
      }

      try {
        const newUsers = ExcelHelper.convertLecturersToUsers(previewLecturers);
        newUsers.forEach((u) => StorageService.addUser(u));
        count = newUsers.length;
      } catch (err: any) {
        setError(err.message || 'Lỗi khi lưu danh sách giảng viên!');
        return;
      }
    }

    onSuccess(count);
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-sky-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-100 bg-linear-to-r from-sky-50 via-sky-50/50 to-white px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
              {isStudent ? <UserPlus className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                Thêm Tài Khoản {isStudent ? 'Học Sinh / Sinh Viên' : 'Giáo Viên / Giảng Viên'}
              </h3>
              <p className="text-xs text-slate-500">
                Hỗ trợ nhập qua File Excel, Liên kết Google Sheets, hoặc thêm từng người thủ công
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Password Rule Banner */}
        <div className="bg-sky-50/70 border-b border-sky-100 px-6 py-2.5 text-xs flex items-center justify-between text-sky-800">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-sky-600 shrink-0" />
            <span>
              {isStudent ? (
                <span>
                  Quy tắc mật khẩu mặc định SV: <strong>[mã sv][khóa][lớp]</strong> viết thường (VD: mã{' '}
                  <code className="bg-white px-1 py-0.5 rounded border border-sky-200">22ATT000</code> khóa 10 lớp A1
                  ➜ <code className="bg-sky-100 font-bold px-1.5 py-0.5 rounded text-sky-900">22att000k10a1</code>). Tên
                  đăng nhập chính là Mã SV.
                </span>
              ) : (
                <span>
                  Mật khẩu mặc định Giảng viên: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">gv123456</code>.
                  Tên đăng nhập chính là <strong>Mã giảng viên</strong> (Ví dụ: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">GV001</code>).
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setTab('excel')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              tab === 'excel'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" /> 1. Nhập từ File Excel
          </button>
          <button
            type="button"
            onClick={() => setTab('sheet')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              tab === 'sheet'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Link2 className="h-4 w-4" /> 2. Link Google Sheets
          </button>
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              tab === 'manual'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserPlus className="h-4 w-4" /> 3. Nhập thủ công từng người
          </button>
        </div>

        {/* Tab contents */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: EXCEL */}
          {tab === 'excel' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Hỗ trợ file .xlsx, .xls, .csv</span>
                <button
                  type="button"
                  onClick={() =>
                    isStudent ? ExcelHelper.downloadStudentTemplate() : ExcelHelper.downloadLecturerTemplate()
                  }
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" /> Tải file Excel mẫu (.xlsx)
                </button>
              </div>

              <div className="border-2 border-dashed border-sky-200 hover:border-sky-400 bg-sky-50/30 rounded-2xl p-6 text-center transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="h-10 w-10 text-sky-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800 mb-1">
                  {file ? file.name : 'Kéo thả hoặc nhấn để chọn file Excel'}
                </p>
                <p className="text-xs text-slate-400">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Dung lượng tối đa 15MB'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE SHEETS */}
          {tab === 'sheet' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đường dẫn Google Sheets (Chế độ xem công khai)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={handleFetchSheet}
                    disabled={loading}
                    className="px-4 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl transition flex items-center gap-1.5"
                  >
                    {loading ? 'Đang tải...' : 'Đọc trang tính'}
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Hướng dẫn:</strong> Trong Google Sheets, chọn <em>Chia sẻ</em> ➜ Đổi quyền thành{' '}
                  <em>Bất kỳ ai có liên kết đều có thể xem</em>, sau đó dán link vào ô trên.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL SINGLE ENTRY */}
          {tab === 'manual' && (
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isStudent ? 'Mã sinh viên *' : 'Mã giảng viên *'}{' '}
                    <span className="text-[10px] text-amber-600 font-normal">(Duy nhất)</span>
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder={isStudent ? 'Ví dụ: 22ATT000' : 'Ví dụ: GV001'}
                    className={`w-full px-3 py-2 rounded-lg border bg-white ${
                      manualCode.trim() &&
                      (StorageService.isStudentCodeTaken(manualCode.trim()) ||
                        StorageService.isLecturerCodeTaken(manualCode.trim()))
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                        : 'border-slate-300'
                    }`}
                  />
                  {manualCode.trim() &&
                    (StorageService.isStudentCodeTaken(manualCode.trim()) ||
                      StorageService.isLecturerCodeTaken(manualCode.trim())) && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-sans">
                        <AlertCircle className="h-3 w-3 shrink-0" /> Mã này đã có người sử dụng!
                      </p>
                    )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email liên hệ * <span className="text-[10px] text-sky-600 font-normal">(Cho phép cùng đuôi @...)</span>
                  </label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="nguyenvana@school.edu.vn"
                    className={`w-full px-3 py-2 rounded-lg border bg-white ${
                      manualEmail.trim() && StorageService.isEmailTaken(manualEmail.trim())
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                        : 'border-slate-300'
                    }`}
                  />
                  {manualEmail.trim() && StorageService.isEmailTaken(manualEmail.trim()) && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-sans">
                      <AlertCircle className="h-3 w-3 shrink-0" /> Địa chỉ email này đã có người sử dụng!
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">Được phép dùng chung phần đuôi tên miền @... (ví dụ: @school.edu.vn, @gmail.com), chỉ cần khác tên hộp thư.</p>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại <span className="text-[10px] text-amber-600 font-normal">(Duy nhất)</span>
                  </label>
                  <input
                    type="tel"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="0912345678"
                    className={`w-full px-3 py-2 rounded-lg border bg-white ${
                      manualPhone.trim() && StorageService.isPhoneNumberTaken(manualPhone.trim())
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                        : 'border-slate-300'
                    }`}
                  />
                  {manualPhone.trim() && StorageService.isPhoneNumberTaken(manualPhone.trim()) && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-sans">
                      <AlertCircle className="h-3 w-3 shrink-0" /> Số điện thoại này đã có người sử dụng!
                    </p>
                  )}
                </div>

                {isStudent ? (
                  <>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Khóa học</label>
                      <input
                        type="text"
                        value={manualCourse}
                        onChange={(e) => setManualCourse(e.target.value)}
                        placeholder="10"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Lớp sinh hoạt</label>
                      <input
                        type="text"
                        value={manualClass}
                        onChange={(e) => setManualClass(e.target.value)}
                        placeholder="A1"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Khoa / Bộ môn</label>
                      <input
                        type="text"
                        value={manualDept}
                        onChange={(e) => setManualDept(e.target.value)}
                        placeholder="Công Nghệ Thông Tin"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Học vị</label>
                      <input
                        type="text"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        placeholder="Thạc sĩ / Tiến sĩ"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddManual}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Thêm vào danh sách chờ
                </button>
              </div>
            </div>
          )}

          {/* PREVIEW TABLE */}
          {((isStudent && previewStudents.length > 0) || (!isStudent && previewLecturers.length > 0)) && (
            <div className="space-y-2 pt-2">
              {/* Conflict warning summary banner */}
              {(() => {
                const totalConflicts = isStudent
                  ? previewStudents.filter((s, idx) => checkStudentConflicts(s, idx, previewStudents).length > 0).length
                  : previewLecturers.filter((l, idx) => checkLecturerConflicts(l, idx, previewLecturers).length > 0).length;

                if (totalConflicts > 0) {
                  return (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>
                          Phát hiện <strong>{totalConflicts} dòng</strong> bị trùng lặp thông tin (Mã, Email hoặc Số điện thoại). Bạn phải xóa các dòng bị trùng trước khi lưu.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveDuplicateRows}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shrink-0 cursor-pointer"
                      >
                        Xóa dòng trùng
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>
                  Danh sách chờ nạp ({isStudent ? previewStudents.length : previewLecturers.length} tài khoản):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewStudents([]);
                    setPreviewLecturers([]);
                  }}
                  className="text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xóa toàn bộ danh sách chờ
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Mã</th>
                      <th className="py-2 px-3">Họ và tên</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Số ĐT</th>
                      {isStudent ? (
                        <>
                          <th className="py-2 px-3">Lớp</th>
                          <th className="py-2 px-3">Mật khẩu tự sinh</th>
                        </>
                      ) : (
                        <>
                          <th className="py-2 px-3">Khoa</th>
                          <th className="py-2 px-3">Học vị</th>
                        </>
                      )}
                      <th className="py-2 px-3">Kiểm tra trùng</th>
                      <th className="py-2 px-3 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {isStudent
                      ? previewStudents.map((s, idx) => {
                          const conflicts = checkStudentConflicts(s, idx, previewStudents);
                          const hasConflict = conflicts.length > 0;
                          return (
                            <tr key={idx} className={`font-sans ${hasConflict ? 'bg-rose-50/80 hover:bg-rose-100/60' : 'hover:bg-slate-50'}`}>
                              <td className="py-2 px-3 font-mono font-bold text-sky-700">{s.studentCode}</td>
                              <td className="py-2 px-3 font-medium text-slate-800">{s.fullName}</td>
                              <td className="py-2 px-3 text-slate-600 font-mono">{s.email}</td>
                              <td className="py-2 px-3 text-slate-600 font-mono">{s.phoneNumber || '-'}</td>
                              <td className="py-2 px-3 text-slate-600">{s.className} (K{s.courseYear})</td>
                              <td className="py-2 px-3">
                                <span className="font-mono bg-sky-50 text-sky-800 px-1.5 py-0.5 rounded border border-sky-200">
                                  {generateStudentPassword(s.studentCode, s.courseYear, s.className)}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                {hasConflict ? (
                                  <div className="space-y-1">
                                    {conflicts.map((c, i) => (
                                      <span key={i} className="inline-block text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded mr-1">
                                        ⚠️ {c}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <CheckCircle className="h-3 w-3" /> Hợp lệ
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setPreviewStudents((prev) => prev.filter((_, i) => i !== idx))}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="Xóa dòng này"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      : previewLecturers.map((l, idx) => {
                          const conflicts = checkLecturerConflicts(l, idx, previewLecturers);
                          const hasConflict = conflicts.length > 0;
                          return (
                            <tr key={idx} className={`font-sans ${hasConflict ? 'bg-rose-50/80 hover:bg-rose-100/60' : 'hover:bg-slate-50'}`}>
                              <td className="py-2 px-3 font-mono font-bold text-sky-700">{l.lecturerCode}</td>
                              <td className="py-2 px-3 font-medium text-slate-800">{l.fullName}</td>
                              <td className="py-2 px-3 text-slate-600 font-mono">{l.email}</td>
                              <td className="py-2 px-3 text-slate-600 font-mono">{l.phoneNumber || '-'}</td>
                              <td className="py-2 px-3 text-slate-600">{l.department}</td>
                              <td className="py-2 px-3 text-slate-600">{l.title}</td>
                              <td className="py-2 px-3">
                                {hasConflict ? (
                                  <div className="space-y-1">
                                    {conflicts.map((c, i) => (
                                      <span key={i} className="inline-block text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded mr-1">
                                        ⚠️ {c}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <CheckCircle className="h-3 w-3" /> Hợp lệ
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setPreviewLecturers((prev) => prev.filter((_, i) => i !== idx))}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="Xóa dòng này"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isStudent
              ? `Đang có ${previewStudents.length} sinh viên sẵn sàng nạp`
              : `Đang có ${previewLecturers.length} giảng viên sẵn sàng nạp`}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isStudent ? previewStudents.length === 0 : previewLecturers.length === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-40 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <CheckCircle className="h-4 w-4" /> Hoàn tất lưu tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
