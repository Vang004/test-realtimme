import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Calendar,
  X,
} from 'lucide-react';
import { AttendanceRecord, ClassRoom } from '../../types';
import { ExcelHelper } from '../../services/excelHelper';
import { StorageService } from '../../services/storage';

interface AttendanceLogsProps {
  attendanceRecords: AttendanceRecord[];
  classes: ClassRoom[];
}

export const AttendanceLogs: React.FC<AttendanceLogsProps> = ({
  attendanceRecords,
  classes,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filtered = attendanceRecords.filter((r) => {
    const matchClass = selectedClassId === 'all' || r.classId === selectedClassId;
    const matchSearch =
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = !selectedDate || r.date === selectedDate;

    let matchStatus = true;
    if (selectedStatus === 'on_time') matchStatus = r.finalStatus === 'present';
    else if (selectedStatus === 'late') matchStatus = r.finalStatus === 'late' || r.checkInStatus === 'late';
    else if (selectedStatus === 'early') matchStatus = r.finalStatus === 'early_exit' || r.checkOutStatus === 'early' || !!r.earlyLeaveReason;
    else if (selectedStatus === 'absent') matchStatus = r.finalStatus === 'absent' || r.checkInStatus === 'absent';
    else if (selectedStatus === 'dropped') matchStatus = r.finalStatus === 'dropped';
    else if (selectedStatus === 'anomaly') matchStatus = r.checkInWithinRadius === false || r.finalStatus === 'violation';

    return matchClass && matchSearch && matchDate && matchStatus;
  });

  const handleExport = () => {
    const clsName = selectedClassId === 'all' ? 'Toan_Truong' : classes.find((c) => c.id === selectedClassId)?.name || 'Lop';
    ExcelHelper.exportAttendanceReport(filtered, clsName);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-sky-600" /> Nhật Ký & Lịch Sử Điểm Danh Toàn Trường ({attendanceRecords.length})
          </h3>
          <p className="text-xs text-slate-500">
            Giám sát thời gian vào ra, độ lệch khoảng cách GPS, lý do về sớm và xuất báo cáo Excel
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Download className="h-4 w-4" /> Xuất Báo Cáo Excel (.xlsx)
        </button>
      </div>

      {/* Filter Row: Search | Lọc theo ngày | Tất cả lớp học | Tất cả trạng thái */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* 1. Tìm theo Mã SV, Họ tên... */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã SV, Họ tên..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* 2. Lọc theo ngày (nằm ở giữa ô Tìm kiếm và Tất cả lớp học) */}
        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 font-medium text-slate-700 cursor-pointer"
            title="Lọc theo ngày điểm danh (VD: xem ai đi muộn, xin về sớm hôm đó)"
          />
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer transition"
              title="Xóa lọc ngày (Xem tất cả các ngày)"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 3. Tất cả lớp học */}
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="px-3.5 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">Tất cả lớp học ({classes.length})</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>

        {/* 4. Tất cả trạng thái */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3.5 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="on_time">Đúng giờ</option>
          <option value="late">Đi muộn</option>
          <option value="early">Về sớm / Bỏ về sớm</option>
          <option value="absent">Vắng mặt</option>
          <option value="dropped">Bỏ học (Kết thúc sớm)</option>
          <option value="anomaly">Bất thường GPS (Ngoài bán kính)</option>
        </select>
      </div>

      {/* Active filter summary pill if filtering by date */}
      {selectedDate && (
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-full font-semibold">
            <Calendar className="h-3.5 w-3.5 text-sky-600" />
            Đang lọc ngày: <strong>{selectedDate}</strong> ({filtered.length} lượt điểm danh)
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className="text-sky-600 hover:text-sky-900 ml-1 p-0.5 cursor-pointer"
              title="Bỏ lọc ngày"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ngày</th>
                <th className="py-3 px-4">Mã SV</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Lớp học</th>
                <th className="py-3 px-4">Giờ vào</th>
                <th className="py-3 px-4">Khoảng cách GPS</th>
                <th className="py-3 px-4">Vị trí hợp lệ?</th>
                <th className="py-3 px-4">Giờ ra</th>
                <th className="py-3 px-4">Lý do xin về</th>
                <th className="py-3 px-4">Kết luận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Không có lượt điểm danh nào thỏa mãn điều kiện lọc
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const cls = classes.find((c) => c.id === r.classId);
                  const trashCls = !cls ? StorageService.getTrash().find((t) => t.id === r.classId && t.type === 'class') : null;
                  const displayClassName = cls ? `${cls.name} (${cls.code})` : trashCls ? `${trashCls.title} (${trashCls.code || ''})` : r.classId;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-medium text-slate-600">{r.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-800">{r.studentCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{r.studentName}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {displayClassName}
                      </td>
                      <td className="py-3 px-4 font-mono">{r.checkInTime || '-'}</td>
                      <td className="py-3 px-4 font-mono">
                        {r.checkInDistanceMeters !== undefined ? `${r.checkInDistanceMeters}m` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {r.checkInTime ? (
                          r.checkInWithinRadius ? (
                            <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3" /> Hợp lệ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-[11px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              <XCircle className="h-3 w-3" /> Ngoài bán kính
                            </span>
                          )
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono">{r.checkOutTime || '-'}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{r.earlyLeaveReason || '-'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            r.finalStatus === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.finalStatus === 'late'
                              ? 'bg-amber-100 text-amber-800'
                              : r.finalStatus === 'early_exit'
                              ? r.notes?.includes('Bỏ về sớm') || r.isLeftDuringClass
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-indigo-100 text-indigo-800'
                              : r.finalStatus === 'dropped'
                              ? 'bg-red-100 text-red-900 border border-red-300'
                              : r.finalStatus === 'absent'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.finalStatus === 'present'
                            ? 'Có mặt'
                            : r.finalStatus === 'late'
                            ? 'Đi muộn'
                            : r.finalStatus === 'early_exit'
                            ? r.notes?.includes('Bỏ về sớm') || r.isLeftDuringClass
                              ? 'Bỏ về sớm'
                              : 'Về sớm'
                            : r.finalStatus === 'dropped'
                            ? 'Bỏ học'
                            : r.finalStatus === 'absent'
                            ? 'Vắng mặt'
                            : 'Bất thường'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
