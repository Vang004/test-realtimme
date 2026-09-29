import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  Calendar,
  FileSpreadsheet,
  AlertTriangle,
  UserPlus,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  TrendingUp,
  ShieldAlert,
  UserX,
  DoorClosed,
} from 'lucide-react';
import { User, ClassRoom, AttendanceRecord, AnomalyReport } from '../../types';
import { LecturerManagement } from './LecturerManagement';
import { StudentManagement } from './StudentManagement';
import { ScheduleManagement } from './ScheduleManagement';
import { RoomScheduleManagement } from './RoomScheduleManagement';
import { AttendanceLogs } from './AttendanceLogs';
import { ReportsInbox } from './ReportsInbox';
import { AbsentStudentsManagement } from './AbsentStudentsManagement';
import { ImportAccountModal } from '../common/ImportAccountModal';
import { StorageService } from '../../services/storage';

interface AdminDashboardProps {
  currentUser: User;
  allUsers: User[];
  classes: ClassRoom[];
  attendanceRecords: AttendanceRecord[];
  reports: AnomalyReport[];
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  allUsers,
  classes,
  attendanceRecords,
  reports,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'lecturers' | 'students' | 'schedule' | 'rooms' | 'logs' | 'absent_students' | 'reports'>('overview');
  const [importRoleModal, setImportRoleModal] = useState<'lecturer' | 'student' | null>(null);
  const [prefillRoomForSchedule, setPrefillRoomForSchedule] = useState<string | undefined>(undefined);

  const lecturers = allUsers.filter((u) => u.role === 'lecturer');
  const students = allUsers.filter((u) => u.role === 'student');
  const campusRooms = StorageService.getCampusRooms();

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceRecords.filter((r) => r.date === todayStr);

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Add Action Buttons */}
      <div className="rounded-3xl bg-linear-to-r from-sky-600 via-sky-500 to-sky-600 p-6 md:p-8 text-white shadow-xl shadow-sky-600/15 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Bảng Điều Khiển Quản Trị Hệ Thống
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Toàn Quyền Quản Trị Viên (Admin)
            </h2>
            <p className="text-sky-100 text-xs md:text-sm mt-1">
              Quản lý tài khoản giảng viên & sinh viên, thiết lập bán kính GPS phòng học, giám sát ca dạy
            </p>
          </div>

          {/* The 2 Primary Buttons required by the brief */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setImportRoleModal('lecturer')}
              className="px-4 py-2.5 bg-white text-sky-800 hover:bg-sky-50 font-bold text-xs rounded-xl shadow-md shadow-black/5 active:scale-95 transition flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4 text-sky-600" /> Thêm tài khoản Giảng viên
            </button>
            <button
              type="button"
              onClick={() => setImportRoleModal('student')}
              className="px-4 py-2.5 bg-sky-900/60 hover:bg-sky-900/80 text-white font-bold text-xs rounded-xl border border-white/20 backdrop-blur-xs active:scale-95 transition flex items-center gap-2"
            >
              <GraduationCap className="h-4 w-4 text-sky-300" /> Thêm tài khoản Sinh viên
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="h-4 w-4" /> Tổng Quan
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lecturers')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-2 ${
            activeTab === 'lecturers'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4" /> Giảng Viên ({lecturers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-2 ${
            activeTab === 'students'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="h-4 w-4" /> Sinh Viên ({students.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-2 ${
            activeTab === 'schedule'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="h-4 w-4" /> Xếp Lịch & Lớp Học ({classes.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-2 ${
            activeTab === 'rooms'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DoorClosed className="h-4 w-4" /> Danh Sách Phòng Học ({campusRooms.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" /> Nhật Ký Điểm Danh ({attendanceRecords.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('absent_students')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-2 ${
            activeTab === 'absent_students'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserX className="h-4 w-4" /> SV vắng học
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="h-4 w-4" /> Báo Cáo GV
          {pendingReportsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {pendingReportsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-xs flex flex-col justify-between">
              <div className="text-slate-400 text-xs font-semibold">Giảng Viên Hệ Thống</div>
              <div className="text-2xl md:text-3xl font-black text-slate-800 mt-2">{lecturers.length}</div>
              <div className="text-[11px] text-sky-600 font-medium mt-1">Đã phân quyền giảng dạy</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-xs flex flex-col justify-between">
              <div className="text-slate-400 text-xs font-semibold">Sinh Viên Toàn Trường</div>
              <div className="text-2xl md:text-3xl font-black text-slate-800 mt-2">{students.length}</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">Tự sinh pass theo công thức</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-xs flex flex-col justify-between">
              <div className="text-slate-400 text-xs font-semibold">Lớp Học Đang Phụ Trách</div>
              <div className="text-2xl md:text-3xl font-black text-slate-800 mt-2">{classes.length}</div>
              <div className="text-[11px] text-sky-600 font-medium mt-1">Gắn bán kính định vị GPS</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs flex flex-col justify-between">
              <div className="text-rose-500 text-xs font-semibold">Báo Cáo Bất Thường</div>
              <div className="text-2xl md:text-3xl font-black text-rose-600 mt-2">{reports.length}</div>
              <div className="text-[11px] text-rose-500 font-medium mt-1">
                {pendingReportsCount} vụ việc cần xử lý
              </div>
            </div>
          </div>

          {/* Active Classes overview */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-sky-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-sky-600" /> Tình Trạng Các Lớp Học Hiện Tại
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className="text-xs font-bold text-sky-600 hover:underline"
              >
                Xem tất cả lịch học ➜
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.slice(0, 3).map((cls) => {
                const lecturer = lecturers.find((l) => l.id === cls.lecturerId);
                return (
                  <div
                    key={cls.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-sky-300 transition space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-sky-800">{cls.code}</span>
                      {cls.isLiveSessionActive ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Đang diễn ra
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                          Chưa mở ca
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-slate-800 text-sm line-clamp-1">{cls.name}</div>
                    <div className="text-slate-500">GV: {lecturer?.fullName || 'Chưa gán'}</div>
                    <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60 text-[11px]">
                      <span>Bán kính: {cls.radiusMeters}m</span>
                      <span>Sĩ số: {cls.studentIds.length} SV</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today Attendance Activity */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-sky-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-sky-600" /> Hoạt Động Điểm Danh Gần Đây Hôm Nay ({todayAttendance.length})
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className="text-xs font-bold text-sky-600 hover:underline"
              >
                Mở nhật ký đầy đủ ➜
              </button>
            </div>

            {todayAttendance.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Chưa có sinh viên nào điểm danh trong ngày hôm nay.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {todayAttendance.slice(0, 5).map((att) => (
                  <div key={att.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{att.studentName}</span>{' '}
                      <span className="font-mono text-slate-500">({att.studentCode})</span>
                      <div className="text-[11px] text-slate-400">
                        Vào lúc: {att.checkInTime} • Cách tâm: {att.checkInDistanceMeters}m
                      </div>
                    </div>
                    <div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          att.checkInWithinRadius
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {att.checkInWithinRadius ? 'Trong khuôn viên' : 'Ngoài bán kính'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Lecturers */}
      {activeTab === 'lecturers' && (
        <LecturerManagement lecturers={lecturers} onRefreshData={onRefreshData} />
      )}

      {/* Tab 3: Students */}
      {activeTab === 'students' && (
        <StudentManagement students={students} onRefreshData={onRefreshData} />
      )}

      {/* Tab 4: Schedule */}
      {activeTab === 'schedule' && (
        <ScheduleManagement
          classes={classes}
          lecturers={lecturers}
          students={students}
          onRefreshData={onRefreshData}
          prefillLocationName={prefillRoomForSchedule}
          onClearPrefillLocation={() => setPrefillRoomForSchedule(undefined)}
        />
      )}

      {/* Tab: Rooms & Schedule Status */}
      {activeTab === 'rooms' && (
        <RoomScheduleManagement
          classes={classes}
          lecturers={lecturers}
          students={students}
          onRefreshData={onRefreshData}
          onNavigateToSchedule={(prefill) => {
            setPrefillRoomForSchedule(prefill);
            setActiveTab('schedule');
          }}
        />
      )}

      {/* Tab 5: Logs */}
      {activeTab === 'logs' && (
        <AttendanceLogs attendanceRecords={attendanceRecords} classes={classes} />
      )}

      {/* Tab 6: Absent Students */}
      {activeTab === 'absent_students' && (
        <AbsentStudentsManagement
          currentUser={currentUser}
          allUsers={allUsers}
          classes={classes}
          attendanceRecords={attendanceRecords}
          onRefreshData={onRefreshData}
        />
      )}

      {/* Tab 7: Reports */}
      {activeTab === 'reports' && (
        <ReportsInbox reports={reports} onRefreshData={onRefreshData} />
      )}

      {/* Top Level Import Modal Triggered by Banner Buttons */}
      {importRoleModal && (
        <ImportAccountModal
          isOpen={true}
          onClose={() => setImportRoleModal(null)}
          targetRole={importRoleModal}
          onSuccess={(count) => {
            onRefreshData();
            alert(`Đã thêm thành công ${count} tài khoản ${importRoleModal === 'student' ? 'sinh viên' : 'giảng viên'}!`);
          }}
        />
      )}
    </div>
  );
};
