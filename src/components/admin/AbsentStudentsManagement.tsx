import React, { useState } from 'react';
import {
  UserX,
  Search,
  Filter,
  AlertTriangle,
  Send,
  Calendar,
  BookOpen,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Mail,
  ShieldAlert,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { User, ClassRoom, AttendanceRecord, LeaveRequest } from '../../types';
import { StorageService } from '../../services/storage';
import { CenterNotification, CenterNotificationState } from '../common/CenterNotification';

interface AbsentStudentsManagementProps {
  currentUser: User;
  allUsers: User[];
  classes: ClassRoom[];
  attendanceRecords: AttendanceRecord[];
  onRefreshData: () => void;
}

export const AbsentStudentsManagement: React.FC<AbsentStudentsManagementProps> = ({
  currentUser,
  allUsers,
  classes,
  attendanceRecords,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [minAbsencesFilter, setMinAbsencesFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedDetailStudent, setSelectedDetailStudent] = useState<any | null>(null);

  // Center notification state
  const [centerNotification, setCenterNotification] = useState<CenterNotificationState | null>(null);

  // Load active Admin system settings for exam eligibility
  const settings = StorageService.getSystemSettings();
  const minExam1 = settings.minAttendancePercentage || 80;
  const minReExam = settings.minReExamPercentage ?? 50;

  // Compute all absence summaries
  const allSummaries = StorageService.getStudentAbsenceSummaries();

  // Apply filters
  const filteredSummaries = allSummaries.filter((item) => {
    // 1. Class filter
    if (selectedClassId !== 'all' && item.cls.id !== selectedClassId) {
      return false;
    }

    // 2. Search term
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const code = (item.student.studentCode || item.student.username || '').toLowerCase();
      const name = (item.student.fullName || '').toLowerCase();
      const clsName = (item.student.className || '').toLowerCase();
      const courseName = (item.cls.name || '').toLowerCase();
      const match = code.includes(q) || name.includes(q) || clsName.includes(q) || courseName.includes(q);
      if (!match) return false;
    }

    // 3. Min absences filter
    if (minAbsencesFilter === 'gte1' && item.totalAbsences < 1) return false;
    if (minAbsencesFilter === 'gte2' && item.totalAbsences < 2) return false;
    if (minAbsencesFilter === 'gte3' && item.totalAbsences < 3) return false;

    // 4. Risk filter strictly following Admin's dual thresholds:
    // danger: attendance < minReExam
    // warning: minReExam <= attendance < minExam1
    // safe: attendance >= minExam1
    if (riskFilter === 'danger' && !item.isDanger) return false;
    if (riskFilter === 'warning' && !item.isWarning) return false;
    if (riskFilter === 'safe' && (item.isDanger || item.isWarning)) return false;

    return true;
  });

  // Calculate high-level stats according to Admin configuration
  const totalStudentsWithAbsence = allSummaries.length;
  const dangerStudentsCount = allSummaries.filter((s) => s.isDanger).length;
  const warningStudentsCount = allSummaries.filter((s) => s.isWarning).length;
  const safeStudentsCount = allSummaries.filter((s) => !s.isDanger && !s.isWarning).length;
  const totalAbsentPeriodsSum = allSummaries.reduce((acc, curr) => acc + curr.totalAbsentPeriods, 0);

  // Handle send reminder button click
  const handleSendReminder = (item: (typeof allSummaries)[0]) => {
    StorageService.sendAbsenceReminder(
      item.student,
      item.cls,
      item.totalAbsences,
      item.totalAbsentPeriods
    );

    onRefreshData();

    setCenterNotification({
      id: `remind_${item.student.id}_${item.cls.id}_${Date.now()}`,
      message: `Đã gửi thông báo nhắc nhở vắng học đến sinh viên ${item.student.fullName} (${item.student.studentCode})!`,
      type: 'normal',
      durationMs: 4000,
    });
  };

  // Export Absent Students to Excel (.xlsx) file to send to class teachers
  const handleExportExcel = () => {
    if (filteredSummaries.length === 0) {
      alert('Không có dữ liệu sinh viên vắng học để xuất file!');
      return;
    }

    const rows = filteredSummaries.map((item, index) => {
      const lecturer = allUsers.find((u) => u.id === item.cls.lecturerId);
      const riskStatus = item.isDanger
        ? `CẤM THI HOÀN TOÀN (Chuyên cần <${minReExam}%)`
        : item.isWarning
        ? `KHÔNG ĐƯỢC THI LẦN 1 - THI LẠI (${minReExam}% - <${minExam1}%)`
        : `ĐỦ ĐIỀU KIỆN DỰ THI LẦN 1 (≥${minExam1}%)`;

      const approvedLeaves = item.leaveRequests.filter((l) => l.status === 'approved').length;
      const unexcusedAbsences = item.records.filter((r) => r.finalStatus === 'absent' || r.finalStatus === 'dropped').length;

      return {
        'STT': index + 1,
        'Mã Sinh Viên': item.student.studentCode || item.student.username,
        'Họ và Tên Sinh Viên': item.student.fullName,
        'Lớp Sinh Hoạt': item.student.className || '',
        'Khóa': item.student.courseYear || '',
        'Email': item.student.email || '',
        'Số Điện Thoại': item.student.phoneNumber || '',
        'Môn Học': item.cls.name,
        'Mã Học Phần': item.cls.code,
        'Giảng Viên Phụ Trách': lecturer ? `${lecturer.fullName} (${lecturer.lecturerCode || 'GV'})` : 'Chưa gán',
        'Tổng Số Tiết Môn Học': item.totalClassPeriods,
        'Số Buổi Vắng': item.totalAbsences,
        'Số Tiết Vắng': item.totalAbsentPeriods,
        'Tỷ Lệ Chuyên Cần (%)': `${item.attendanceRatePercent}%`,
        'Tỷ Lệ Vắng (%)': `${item.absenceRatePercent}%`,
        'Kết Luận Tư Cách Thi': riskStatus,
        'Cài Đặt Xét Thi Của Admin': `Mức 1 (Không thi lần 1): <${minExam1}% | Mức 2 (Thi lại): ≥${minReExam}%`,
        'Số Buổi Có Phép (1/2 tiết)': approvedLeaves,
        'Số Buổi Không Phép': unexcusedAbsences,
        'Đề Xuất Cho Giảng Viên': item.isDanger
          ? 'Đề nghị GV cấm thi hoàn toàn / Học lại'
          : item.isWarning
          ? 'Không cho thi lần 1, chuyển thi lại đợt 2'
          : 'Đủ điều kiện dự thi lần 1 bình thường',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 25 },
      { wch: 14 },
      { wch: 8 },
      { wch: 26 },
      { wch: 14 },
      { wch: 28 },
      { wch: 14 },
      { wch: 25 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 34 },
      { wch: 38 },
      { wch: 18 },
      { wch: 18 },
      { wch: 32 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DS_SinhVien_VangHoc');

    const todayStr = new Date().toISOString().split('T')[0];
    const selectedCls = classes.find((c) => c.id === selectedClassId);
    const classTag = selectedCls ? `_${selectedCls.code}` : '_TatCaMon';
    const filename = `Danh_Sach_SV_Vang_Hoc${classTag}_${todayStr}.xlsx`;

    XLSX.writeFile(workbook, filename);

    setCenterNotification({
      id: `export_excel_${Date.now()}`,
      message: `Đã xuất thành công file Excel "${filename}"! File đã sẵn sàng để gửi cho Giảng viên quản lý lớp.`,
      type: 'normal',
      durationMs: 5000,
    });
  };

  return (
    <div className="space-y-6">
      {/* Center 5-Second Notification */}
      {centerNotification && (
        <CenterNotification
          notification={centerNotification}
          onClose={() => setCenterNotification(null)}
        />
      )}

      {/* Top Banner & Stat Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
            <UserX className="h-5 w-5 text-amber-600" /> Quản Lý & Giám Sát Sinh Viên Vắng Học ({allSummaries.length})
          </h3>
          <p className="text-xs text-slate-500">
            Theo dõi tổng số buổi và số tiết vắng, trạng thái đơn xin nghỉ học, tự động cảnh báo nguy cơ cấm thi
          </p>
        </div>

        {/* Nút Xuất File Excel theo yêu cầu */}
        <button
          type="button"
          onClick={handleExportExcel}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          title="Xuất file Excel danh sách sinh viên vắng học để gửi trực tiếp cho Giảng viên quản lý lớp"
        >
          <FileSpreadsheet className="h-4 w-4" /> Xuất File Excel (Gửi GV)
        </button>
      </div>

      {/* Metric Summary Cards according to Admin's configured criteria */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-sky-100 shadow-xs flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-semibold">SV Có Lượt Vắng Học</div>
          <div className="text-2xl font-black text-slate-800 mt-2">{totalStudentsWithAbsence}</div>
          <div className="text-[11px] text-sky-600 font-medium mt-1">Ghi nhận trên toàn hệ thống</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /> Cấm Thi Hoàn Toàn (&lt;{minReExam}%)
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{dangerStudentsCount}</div>
          <div className="text-[11px] text-rose-700 font-medium mt-1">Chuyên cần dưới {minReExam}% (Học lại)</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-xs flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-semibold">Không Thi Lần 1 ({minReExam}% - &lt;{minExam1}%)</div>
          <div className="text-2xl font-black text-amber-600 mt-2">{warningStudentsCount}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Được xét thi lại đợt 2</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-xs flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Đủ ĐK Thi Lần 1 (&ge;{minExam1}%)
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{safeStudentsCount}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Chuyên cần đạt chuẩn quy chế</div>
        </div>
      </div>

      {/* Active Exam Policy Indicator */}
      <div className="px-4 py-2.5 bg-sky-50/80 rounded-2xl border border-sky-100 flex items-center justify-between text-xs text-sky-900 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sky-800 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-sky-600" /> Tiêu chuẩn xét tư cách thi đang cài đặt:
          </span>
          <span>
            Thanh 1 (Không thi lần 1): <strong className="text-rose-700">&lt;{minExam1}%</strong> chuyên cần • Thanh 2 (Xét thi lại): <strong className="text-amber-700">{minReExam}% - &lt;{minExam1}%</strong> • Cấm thi tuyệt đối: <strong className="text-rose-800">&lt;{minReExam}%</strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-500 italic">
          (Admin có thể điều chỉnh 2 thanh % này bất kỳ lúc nào tại nút "Xét tư cách thi (%)" trên thanh menu)
        </span>
      </div>

      {/* Filter Row: Search | Lọc môn học | Lọc số lần vắng | Lọc mức độ cảnh báo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên SV, mã SV, lớp..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Filter by Course / Class */}
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="px-3.5 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 cursor-pointer"
        >
          <option value="all">Tất cả môn học ({classes.length})</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>

        {/* Filter by Number of Absences */}
        <select
          value={minAbsencesFilter}
          onChange={(e) => setMinAbsencesFilter(e.target.value)}
          className="px-3.5 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 cursor-pointer"
        >
          <option value="all">Tất cả số lần vắng</option>
          <option value="gte1">Vắng từ 1 buổi trở lên</option>
          <option value="gte2">Vắng từ 2 buổi trở lên</option>
          <option value="gte3">Vắng từ 3 buổi trở lên (Báo động)</option>
        </select>

        {/* Filter by Risk Level */}
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="px-3.5 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 cursor-pointer font-medium"
        >
          <option value="all">Tất cả mức độ chuyên cần</option>
          <option value="danger">🚨 Cấm thi hoàn toàn (&lt;{minReExam}% chuyên cần)</option>
          <option value="warning">⚠️ Không thi lần 1 / Thi lại ({minReExam}% - &lt;{minExam1}%)</option>
          <option value="safe">✓ Đủ ĐK dự thi lần 1 (&ge;{minExam1}%)</option>
        </select>
      </div>

      {/* Main Absent Students Table */}
      <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
          <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
            <span>Danh Sách Chi Tiết Sinh Viên Vắng</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {filteredSummaries.length} sinh viên
            </span>
          </div>
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Xuất file Excel danh sách đang lọc để gửi cho giảng viên"
          >
            <Download className="h-3.5 w-3.5" /> Xuất Excel (.xlsx)
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">STT</th>
                <th className="py-3 px-4">Mã SV</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Lớp sinh hoạt</th>
                <th className="py-3 px-4">Môn học</th>
                <th className="py-3 px-4 text-center">Số lần vắng</th>
                <th className="py-3 px-4 text-center">Số tiết vắng / Tổng</th>
                <th className="py-3 px-4 text-center">Tỷ lệ chuyên cần</th>
                <th className="py-3 px-4 text-center">Tỷ lệ vắng</th>
                <th className="py-3 px-4">Trạng thái xét thi (theo cài đặt)</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    <UserX className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    Không tìm thấy sinh viên nào vắng học theo tiêu chí lọc
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((item, idx) => {
                  return (
                    <tr key={`${item.student.id}_${item.cls.id}`} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-800">
                        {item.student.studentCode || item.student.username}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{item.student.fullName}</div>
                        <div className="text-[10px] text-slate-400">{item.student.email}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {item.student.className || '-'} (Khóa {item.student.courseYear || '-'})
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{item.cls.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.cls.code}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-800 text-xs px-2 py-0.5 bg-slate-100 rounded-lg">
                          {item.totalAbsences} buổi
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="font-bold text-rose-700">{item.totalAbsentPeriods}</span> / {item.totalClassPeriods} tiết
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-md ${
                            item.isDanger
                              ? 'bg-rose-100 text-rose-800'
                              : item.isWarning
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.attendanceRatePercent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {item.absenceRatePercent}%
                      </td>
                      <td className="py-3 px-4">
                        {item.isDanger ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="h-3 w-3 shrink-0" /> CẤM THI HOÀN TOÀN (&lt;{minReExam}%)
                            </span>
                            <div className="text-[10px] text-rose-600 font-medium">Bắt buộc học lại môn</div>
                          </div>
                        ) : item.isWarning ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="h-3 w-3 shrink-0" /> KHÔNG ĐƯỢC THI LẦN 1
                            </span>
                            <div className="text-[10px] text-amber-700 font-medium">
                              Được xét thi lại ({minReExam}% - &lt;{minExam1}%)
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 shrink-0" /> ĐỦ ĐK THI LẦN 1 (&ge;{minExam1}%)
                            </span>
                            <div className="text-[10px] text-emerald-700 font-medium">Chuyên cần đạt chuẩn</div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Details Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailStudent(item)}
                            className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                            title="Xem chi tiết các buổi vắng & đơn xin nghỉ"
                          >
                            <FileText className="h-4 w-4" />
                          </button>

                          {/* Nhắc nhở Button at end of row */}
                          <button
                            type="button"
                            onClick={() => handleSendReminder(item)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-[11px] transition cursor-pointer inline-flex items-center gap-1 shadow-2xs active:scale-95"
                            title="Gửi thông báo nhắc nhở sinh viên này không vắng học quá nhiều"
                          >
                            <Send className="h-3 w-3 text-amber-600" /> Nhắc nhở
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

      {/* Student Absence Detail Modal */}
      {selectedDetailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-sky-100 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-sky-50 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Chi Tiết Vắng Học: {selectedDetailStudent.student.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mã SV: {selectedDetailStudent.student.studentCode || selectedDetailStudent.student.username} • Môn: {selectedDetailStudent.cls.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailStudent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Stat Bar (4 stats including attendance rate vs absence rate) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-slate-400 font-medium">Số buổi vắng</div>
                <div className="font-bold text-slate-800 text-base mt-0.5">
                  {selectedDetailStudent.totalAbsences} buổi
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-slate-400 font-medium">Số tiết vắng</div>
                <div className="font-bold text-rose-600 text-base mt-0.5">
                  {selectedDetailStudent.totalAbsentPeriods} / {selectedDetailStudent.totalClassPeriods}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-slate-400 font-medium">Tỷ lệ chuyên cần</div>
                <div
                  className={`font-black text-base mt-0.5 ${
                    selectedDetailStudent.isDanger
                      ? 'text-rose-600'
                      : selectedDetailStudent.isWarning
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {selectedDetailStudent.attendanceRatePercent}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-slate-400 font-medium">Tỷ lệ vắng</div>
                <div className="font-bold text-slate-700 text-base mt-0.5 font-mono">
                  {selectedDetailStudent.absenceRatePercent}%
                </div>
              </div>
            </div>

            {/* Evaluation Conclusion Box strictly based on Admin's dual % configuration */}
            <div className="p-4 rounded-2xl border space-y-2 text-xs bg-slate-50/70 border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-sky-600" /> Kết Luận Xét Tư Cách Thi Theo Cấu Hình Admin
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Mức 1: ≥{minExam1}% | Mức 2: ≥{minReExam}%
                </span>
              </div>

              {/* Progress bar comparison */}
              <div className="space-y-1">
                <div className="flex h-3.5 w-full rounded-full overflow-hidden text-[9px] font-bold text-white text-center leading-3.5 shadow-inner">
                  <div
                    style={{ width: `${minReExam}%` }}
                    className="bg-rose-500 flex items-center justify-center truncate px-0.5"
                    title={`<${minReExam}%: Cấm thi`}
                  >
                    Cấm thi (&lt;{minReExam}%)
                  </div>
                  <div
                    style={{ width: `${minExam1 - minReExam}%` }}
                    className="bg-amber-500 flex items-center justify-center truncate px-0.5"
                    title={`${minReExam}% - <${minExam1}%: Thi lại`}
                  >
                    Thi lại
                  </div>
                  <div
                    style={{ width: `${100 - minExam1}%` }}
                    className="bg-emerald-500 flex items-center justify-center truncate px-0.5"
                    title={`≥${minExam1}%: Đủ ĐK lần 1`}
                  >
                    Đủ ĐK lần 1 (≥{minExam1}%)
                  </div>
                </div>
              </div>

              {/* Exact status message */}
              {selectedDetailStudent.isDanger ? (
                <div className="p-3 bg-rose-100/70 border border-rose-300 rounded-xl text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-rose-800">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    KẾT LUẬN: BỊ CẤM THI HOÀN TOÀN (HỌC LẠI MÔN)
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Tỷ lệ chuyên cần của sinh viên đạt <strong>{selectedDetailStudent.attendanceRatePercent}%</strong>, thấp hơn mức sàn tối thiểu <strong>{minReExam}%</strong> do Admin thiết lập. Sinh viên bị cấm thi cả 2 đợt và bắt buộc phải học lại học phần này.
                  </p>
                </div>
              ) : selectedDetailStudent.isWarning ? (
                <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-amber-800">
                    <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                    KẾT LUẬN: KHÔNG ĐƯỢC THI LẦN 1 - ĐƯỢC XÉT THI LẠI ĐỢT 2
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Tỷ lệ chuyên cần của sinh viên đạt <strong>{selectedDetailStudent.attendanceRatePercent}%</strong> (nằm trong khoảng từ <strong>{minReExam}% đến dưới {minExam1}%</strong>). Sinh viên bị cấm thi lần 1 nhưng đủ điều kiện được chuyển sang thi lại đợt 2.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    KẾT LUẬN: ĐỦ ĐIỀU KIỆN DỰ THI LẦN 1
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Tỷ lệ chuyên cần của sinh viên đạt <strong>{selectedDetailStudent.attendanceRatePercent}%</strong> (≥ mức quy định <strong>{minExam1}%</strong>). Sinh viên đủ điều kiện dự thi lần 1 theo đúng quy chế đào tạo.
                  </p>
                </div>
              )}
            </div>

            {/* List of Leave Requests */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-sky-600" /> Đơn Xin Phép Vắng Học ({selectedDetailStudent.leaveRequests.length})
              </h4>
              {selectedDetailStudent.leaveRequests.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  Sinh viên chưa nộp đơn xin phép vắng học nào cho môn này.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDetailStudent.leaveRequests.map((lr: LeaveRequest) => (
                    <div key={lr.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-sky-600" /> Ngày xin nghỉ: {lr.leaveDate}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            lr.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : lr.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {lr.status === 'approved'
                            ? 'GV đã xác nhận (Vắng 1/2 số tiết)'
                            : lr.status === 'rejected'
                            ? 'GV không đồng ý (Vắng 100% tiết nếu không đi học)'
                            : 'GV chưa xác nhận'}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        <strong>Lý do:</strong> {lr.reason}
                      </div>
                      <div className="text-[11px] text-slate-400 flex justify-between">
                        <span>Nộp lúc: {lr.submittedAt}</span>
                        {lr.lecturerName && <span>Người duyệt: {lr.lecturerName}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List of Attendance Absence Records */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-600" /> Nhật Ký Vắng Mặt / Bỏ Học Trong Ca
              </h4>
              {selectedDetailStudent.records.filter(
                (r: AttendanceRecord) => r.finalStatus === 'absent' || r.finalStatus === 'dropped' || r.finalStatus === 'early_exit'
              ).length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  Không có nhật ký vắng mặt không lý do nào được ghi nhận trực tiếp.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDetailStudent.records
                    .filter(
                      (r: AttendanceRecord) =>
                        r.finalStatus === 'absent' || r.finalStatus === 'dropped' || r.finalStatus === 'early_exit'
                    )
                    .map((r: AttendanceRecord) => (
                      <div key={r.id} className="p-3 bg-rose-50/60 rounded-2xl border border-rose-200 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">Ngày: {r.date}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              r.finalStatus === 'dropped'
                                ? 'bg-red-200 text-red-900'
                                : r.finalStatus === 'early_exit'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {r.finalStatus === 'dropped'
                              ? 'Bỏ học (Lớp kết thúc sớm không đến)'
                              : r.finalStatus === 'early_exit'
                              ? 'Bỏ về sớm'
                              : 'Vắng mặt'}
                          </span>
                        </div>
                        {r.notes && (
                          <div className="text-slate-600 text-[11px]">
                            <strong>Ghi chú:</strong> {r.notes}
                          </div>
                        )}
                        {r.earlyLeaveReason && (
                          <div className="text-amber-800 text-[11px]">
                            <strong>Lý do về sớm:</strong> {r.earlyLeaveReason}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDetailStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSendReminder(selectedDetailStudent);
                  setSelectedDetailStudent(null);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" /> Gửi thông báo nhắc nhở ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
