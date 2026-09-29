import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Play,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Filter,
  GraduationCap,
  CheckSquare,
} from 'lucide-react';
import { User, ClassRoom, AttendanceRecord } from '../../types';
import { ClassLiveSession } from './ClassLiveSession';
import { StorageService } from '../../services/storage';
import { ConfirmModal } from '../common/ConfirmModal';
import { CenterNotification, CenterNotificationState } from '../common/CenterNotification';
import { RoomCapacityWarningModal } from '../common/RoomCapacityWarningModal';
import { RegistrationSuccessModal } from '../common/RegistrationSuccessModal';
import { TrashManagementModal } from '../common/TrashManagementModal';

interface LecturerDashboardProps {
  currentUser: User;
  classes: ClassRoom[];
  allStudents: User[];
  attendanceRecords: AttendanceRecord[];
  onRefreshData: () => void;
}

export const LecturerDashboard: React.FC<LecturerDashboardProps> = ({
  currentUser,
  classes,
  allStudents,
  attendanceRecords,
  onRefreshData,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Class Form Modal (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [periodsPerSession, setPeriodsPerSession] = useState<number>(4);
  const [credits, setCredits] = useState<number>(3);
  const [courseYear, setCourseYear] = useState('10');
  const [className, setClassName] = useState('A1');
  const [locationName, setLocationName] = useState('Phòng Lab 302 - Giảng đường A2');
  const [latitude, setLatitude] = useState(21.038234);
  const [longitude, setLongitude] = useState(105.782812);
  const [radiusMeters, setRadiusMeters] = useState(50);
  const [dayOfWeek, setDayOfWeek] = useState(2);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('11:30');
  const [checkInDeadlineMinutes, setCheckInDeadlineMinutes] = useState<number>(15);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('all');
  const [studentCourseFilter, setStudentCourseFilter] = useState('all');

  // Center notification state
  const [centerNotification, setCenterNotification] = useState<CenterNotificationState | null>(null);

  // Trash modal state
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);

  // Room capacity warning modal state
  const [capacityConfirmModal, setCapacityConfirmModal] = useState<{
    isOpen: boolean;
    roomName: string;
    roomCapacity: number;
    studentCount: number;
    onConfirm: () => void;
  }>({
    isOpen: false,
    roomName: '',
    roomCapacity: 0,
    studentCount: 0,
    onConfirm: () => {},
  });

  // Success modal state
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Count dissolved classes in trash
  const dissolvedCount = React.useMemo(() => {
    return StorageService.getTrash().filter((t) => t.type === 'class').length;
  }, [classes, isTrashModalOpen]);

  // Confirm modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subMessage?: string;
    confirmAction: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmAction: () => {},
  });

  // Filter classes taught by this lecturer
  const myClasses = classes.filter((c) => c.lecturerId === currentUser.id);

  // All campus rooms
  const campusRooms = React.useMemo(() => StorageService.getCampusRooms(), [classes]);

  // Available rooms dynamically calculated for the selected dayOfWeek & startTime - endTime
  // Conflicting rooms already booked will NOT be shown in the dropdown
  const availableRooms = React.useMemo(() => {
    return StorageService.getAvailableRoomsForSchedule(dayOfWeek, startTime, endTime, editingClass?.id);
  }, [dayOfWeek, startTime, endTime, editingClass, classes]);

  // If a class is selected, show the ClassLiveSession view
  const activeClass = myClasses.find((c) => c.id === selectedClassId);
  if (activeClass) {
    return (
      <ClassLiveSession
        currentClass={activeClass}
        lecturerUser={currentUser}
        allStudents={allStudents}
        attendanceRecords={attendanceRecords}
        onBack={() => setSelectedClassId(null)}
        onRefreshData={onRefreshData}
      />
    );
  }

  const handleStartClass = (cls: ClassRoom) => {
    StorageService.updateClass(cls.id, {
      isLiveSessionActive: true,
      liveSessionStartedAt: new Date().toISOString(),
    });
    onRefreshData();
    setSelectedClassId(cls.id);
  };

  const handleOpenAddClass = () => {
    setEditingClass(null);
    setCode(`CS${Math.floor(100 + Math.random() * 900)}-${currentUser.lecturerCode || 'GV'}`);
    setName('');
    setPeriodsPerSession(4);
    setCredits(3);
    setCourseYear('10');
    setClassName('A1');
    const initRooms = StorageService.getAvailableRoomsForSchedule(2, '08:00', '11:30');
    const firstRoom = initRooms[0] || campusRooms[0];
    setLocationName(firstRoom ? firstRoom.name : 'Phòng Lab 302 - Giảng đường A2 (Cơ sở 1)');
    setLatitude(firstRoom ? firstRoom.latitude : 21.038234);
    setLongitude(firstRoom ? firstRoom.longitude : 105.782812);
    setRadiusMeters(firstRoom ? firstRoom.radiusMeters : 50);
    setDayOfWeek(2);
    setStartTime('08:00');
    setEndTime('11:30');
    setCheckInDeadlineMinutes(15);
    setSelectedStudentIds([]); // Empty by default: lecturer explicitly selects students
    setStudentSearchTerm('');
    setStudentClassFilter('all');
    setStudentCourseFilter('all');
    setIsModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassRoom) => {
    setEditingClass(cls);
    setCode(cls.code);
    setName(cls.name);
    setPeriodsPerSession(cls.periodsPerSession || 4);
    setCredits(cls.credits || 3);
    setCourseYear(cls.courseYear);
    setClassName(cls.className);
    setLocationName(cls.locationName);
    setLatitude(cls.latitude);
    setLongitude(cls.longitude);
    setRadiusMeters(cls.radiusMeters);
    setDayOfWeek(cls.dayOfWeek);
    setStartTime(cls.startTime);
    setEndTime(cls.endTime);
    setCheckInDeadlineMinutes(cls.checkInDeadlineMinutes || 15);
    setSelectedStudentIds(cls.studentIds || []);
    setStudentSearchTerm('');
    setStudentClassFilter('all');
    setStudentCourseFilter('all');
    setIsModalOpen(true);
  };

  const handleOpenDissolveConfirm = (cls: ClassRoom) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận giải tán lớp học?',
      message: `Bạn có chắc muốn giải tán lớp học "${cls.name}" (Mã: ${cls.code})?`,
      subMessage: `Thao tác này sẽ gửi thông báo giải tán đến ${cls.studentIds.length} sinh viên tham gia, gỡ lớp học và ca điểm danh hôm nay khỏi giao diện của các sinh viên này, đồng thời đồng bộ xóa trên hệ thống Admin. Lớp sẽ được lưu trong Thùng rác 6 tháng.`,
      confirmAction: () => {
        const res = StorageService.dissolveClass(cls.id, 'lecturer');
        onRefreshData();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

        if (res.success) {
          setCenterNotification({
            id: `undo_dissolve_${cls.id}_${Date.now()}`,
            message: `Đã giải tán lớp "${cls.name}" thành công! Đã gửi thông báo đến ${res.notifiedStudentCount} sinh viên.`,
            type: 'normal',
            durationMs: 5000,
            onUndo: () => {
              if (res.trashItem) {
                StorageService.restoreTrashItem(res.trashItem.id);
              } else if (res.previousClass) {
                StorageService.addClass(res.previousClass);
              }
              onRefreshData();
            },
          });
        }
      },
    });
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!name.trim() || !cleanCode) {
      alert('Vui lòng nhập Tên môn học và Mã lớp');
      return;
    }

    if (StorageService.isClassCodeTaken(cleanCode, editingClass?.id)) {
      alert('Mã đã được sử dụng!');
      return;
    }

    // 1. Conflict check for lecturer
    const lecturerConflict = StorageService.checkLecturerConflict(
      currentUser.id,
      Number(dayOfWeek),
      startTime,
      endTime,
      editingClass?.id,
      locationName,
      name
    );
    if (lecturerConflict.hasConflict) {
      alert(`⚠️ XUNG ĐỘT LỊCH DẠY CỦA GIẢNG VIÊN:\n\n${lecturerConflict.reason}`);
      return;
    }

    // 2. Conflict check for selected students
    const studentConflict = StorageService.checkStudentConflicts(
      selectedStudentIds,
      Number(dayOfWeek),
      startTime,
      endTime,
      editingClass?.id
    );
    if (studentConflict.hasConflict) {
      alert(
        `⚠️ XUNG ĐỘT LỊCH HỌC CỦA SINH VIÊN:\n\nSinh viên "${studentConflict.studentName}" (${studentConflict.studentCode}) đã có lịch học lớp "${studentConflict.conflictingClass?.name}" (${studentConflict.conflictingClass?.code}) trùng ca ${studentConflict.conflictingClass?.startTime} - ${studentConflict.conflictingClass?.endTime}.\n\nQuy chế: Mỗi sinh viên không được trùng lịch học. Vui lòng bỏ chọn sinh viên này hoặc đổi giờ học!`
      );
      return;
    }

    // 3. Conflict check for Room (Không cho phép xếp trùng phòng)
    const roomConflict = StorageService.checkRoomConflict(
      locationName,
      Number(dayOfWeek),
      startTime,
      endTime,
      editingClass?.id
    );
    if (roomConflict.hasConflict) {
      alert(`⚠️ XUNG ĐỘT PHÒNG HỌC:\n\n${roomConflict.reason || `Phòng học "${locationName}" đã có lớp đăng ký trong khung giờ này!`}`);
      return;
    }

    const executeSaveClass = (showSuccessModal = false) => {
      if (editingClass) {
        StorageService.updateClass(editingClass.id, {
          code: cleanCode,
          name: name.trim(),
          credits: editingClass.credits || 3,
          totalPeriods: editingClass.totalPeriods || ((editingClass.credits || 3) * 15),
          periodsPerSession: Number(periodsPerSession) || 4,
          courseYear,
          className,
          locationName,
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radiusMeters),
          dayOfWeek: Number(dayOfWeek),
          startTime,
          endTime,
          checkInDeadlineMinutes: Number(checkInDeadlineMinutes) || 15,
          studentIds: selectedStudentIds,
        });
        setCenterNotification({
          id: `update_cls_${Date.now()}`,
          message: `Đã cập nhật lớp học "${name.trim()}" thành công.`,
          type: 'normal',
          durationMs: 4000,
        });
      } else {
        const newClass: ClassRoom = {
          id: `cls_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          code: cleanCode,
          name: name.trim(),
          credits: 3,
          totalPeriods: 45,
          periodsPerSession: Number(periodsPerSession) || 4,
          courseYear,
          className,
          lecturerId: currentUser.id,
          locationName,
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radiusMeters),
          useLecturerLocation: true,
          dayOfWeek: Number(dayOfWeek),
          startTime,
          endTime,
          checkInBeforeMinutes: 15,
          checkInDeadlineMinutes: Number(checkInDeadlineMinutes) || 15,
          checkOutAllowedAfterMinutes: 0,
          studentIds: selectedStudentIds,
          isLiveSessionActive: false,
        };
        StorageService.addClass(newClass);
        setCenterNotification({
          id: `add_cls_${Date.now()}`,
          message: `Đã tạo lớp "${name.trim()}" (${cleanCode}) thành công!`,
          type: 'normal',
          durationMs: 4000,
        });
      }

      setIsModalOpen(false);
      onRefreshData();
      if (showSuccessModal) {
        setIsSuccessModalOpen(true);
      }
    };

    // Kiểm tra sức chứa phòng học: không thể bổ sung quá số lượng sinh viên trong phòng có thể chứa
    const matchedRoom = campusRooms.find((r) => r.name === locationName || r.id === locationName);
    const roomCapacity = matchedRoom?.capacity || 60;
    if (selectedStudentIds.length > roomCapacity) {
      setCapacityConfirmModal({
        isOpen: true,
        roomName: locationName,
        roomCapacity,
        studentCount: selectedStudentIds.length,
        onConfirm: () => {
          setCapacityConfirmModal((prev) => ({ ...prev, isOpen: false }));
          executeSaveClass(true);
        },
      });
      return;
    }

    executeSaveClass(false);
  };

  // Extract unique classes and courses from allStudents
  const studentClassList = Array.from(new Set(allStudents.map((s) => s.className).filter(Boolean))).sort();
  const studentCourseList = Array.from(
    new Set(allStudents.map((s) => s.courseYear).filter((c): c is string => Boolean(c && c.trim())))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const filteredStudents = allStudents.filter((s) => {
    const matchSearch =
      !studentSearchTerm.trim() ||
      s.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(studentSearchTerm.toLowerCase())) ||
      (s.className && s.className.toLowerCase().includes(studentSearchTerm.toLowerCase())) ||
      (s.courseYear && s.courseYear.toLowerCase().includes(studentSearchTerm.toLowerCase()));

    const matchClass = studentClassFilter === 'all' || s.className === studentClassFilter;
    const matchCourse = studentCourseFilter === 'all' || s.courseYear === studentCourseFilter;

    return matchSearch && matchClass && matchCourse;
  });

  const isAllFilteredStudentsSelected =
    filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudentIds.includes(s.id));
  const isSomeFilteredStudentsSelected =
    filteredStudents.some((s) => selectedStudentIds.includes(s.id)) && !isAllFilteredStudentsSelected;

  // Select ONLY the filtered students (strict adherence: "lọc A1 rồi nhấn chọn tất cả thì chỉ chọn toàn bộ sinh viên lớp A1, sinh viên các lớp khác không chọn")
  const handleSelectAllFilteredStudents = () => {
    setSelectedStudentIds(filteredStudents.map((s) => s.id));
  };

  // Add all filtered students to current selection without overwriting others
  const handleAddAllFilteredStudents = () => {
    const combined = new Set([...selectedStudentIds, ...filteredStudents.map((s) => s.id)]);
    setSelectedStudentIds(Array.from(combined));
  };

  // Deselect only the filtered students
  const handleDeselectFilteredStudents = () => {
    const filteredIdSet = new Set(filteredStudents.map((s) => s.id));
    setSelectedStudentIds(selectedStudentIds.filter((id) => !filteredIdSet.has(id)));
  };

  // Toggle all filtered students
  const handleToggleAllFilteredStudents = () => {
    if (isAllFilteredStudentsSelected) {
      handleDeselectFilteredStudents();
    } else {
      handleSelectAllFilteredStudents();
    }
  };

  const toggleStudentSelection = (stId: string) => {
    if (selectedStudentIds.includes(stId)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== stId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, stId]);
    }
  };

  const getDayName = (d: number) => {
    return d === 7 ? 'Chủ nhật' : `Thứ ${d + 1}`;
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-3xl bg-linear-to-r from-sky-600 via-sky-500 to-sky-600 p-6 md:p-8 text-white shadow-xl shadow-sky-600/15 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Không Gian Giảng Viên
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {currentUser.title || 'Thầy/Cô'} {currentUser.fullName}
            </h2>
            <p className="text-sky-100 text-xs md:text-sm mt-1">
              Mã GV: <strong>{currentUser.lecturerCode}</strong> • {currentUser.department}
            </p>
          </div>

          <div className="flex gap-2">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center min-w-[110px]">
              <div className="text-sky-100 text-xs">Lớp phụ trách</div>
              <div className="text-2xl font-black mt-0.5">{myClasses.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center min-w-[110px]">
              <div className="text-sky-100 text-xs">Tổng sinh viên</div>
              <div className="text-2xl font-black mt-0.5">
                {myClasses.reduce((sum, c) => sum + c.studentIds.length, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Class Schedule Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-sky-600" /> Danh Sách Lớp Học & Lịch Dạy ({myClasses.length})
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Thêm, sửa và giải tán lớp học; đồng bộ chính xác với Admin và Sinh viên được chọn
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsTrashModalOpen(true)}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-2xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 self-start sm:self-auto"
              title="Xem và quản lý các lớp học đã giải tán (Khôi phục hoặc xóa vĩnh viễn)"
            >
              <Trash2 className="h-4 w-4 text-rose-600" />
              <span>Thùng rác lớp đã giải tán ({dissolvedCount})</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddClass}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold rounded-2xl text-xs transition flex items-center gap-1.5 shadow-md shadow-sky-600/20 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" /> Thêm Lớp Học / Lịch Dạy Mới
            </button>
          </div>
        </div>

        {myClasses.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40 text-sky-400" />
            <p className="font-semibold text-slate-700">Chưa có lớp học nào trong danh sách</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Bạn có thể tự tạo lớp học mới hoặc Admin phân công lịch dạy cho bạn.
            </p>
            <button
              type="button"
              onClick={handleOpenAddClass}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="h-4 w-4" /> Tạo Lớp Học Đầu Tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myClasses.map((cls) => {
              const heldDates = new Set(
                attendanceRecords
                  .filter((r) => r.classId === cls.id && (r.checkInTime || r.finalStatus === 'present' || r.finalStatus === 'late'))
                  .map((r) => r.date)
              );
              const heldSessions = heldDates.size;
              const periodsPerSession = cls.periodsPerSession || 4;
              const totalPeriods = cls.totalPeriods || ((cls.credits || 3) * 15);
              const taughtPeriods = heldSessions * periodsPerSession;
              const isCompleted = taughtPeriods >= totalPeriods;
              const progressPercent = Math.min(100, Math.round((taughtPeriods / totalPeriods) * 100));

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-3xl border border-sky-100 shadow-lg shadow-sky-900/5 hover:border-sky-300 transition duration-150 flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-100 text-sky-800 font-mono">
                          {cls.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                          {periodsPerSession} tiết/buổi
                        </span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Đã đủ {totalPeriods} tiết
                          </span>
                        )}
                      </div>

                      {cls.isLiveSessionActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đang dạy
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                          Chưa vào ca
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-800 line-clamp-2 mb-3 leading-snug">
                      {cls.name}
                    </h4>

                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                        <span className="font-semibold text-slate-800">{getDayName(cls.dayOfWeek)}</span>
                        <span>•</span>
                        <Clock className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                        <span>{cls.startTime} - {cls.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">{cls.locationName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                        <span>Bán kính GPS: <strong>{cls.radiusMeters} mét</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                        <span>
                          Sĩ số: <strong className="text-sky-700">{cls.studentIds.length}</strong> sinh viên
                        </span>
                      </div>

                      {/* Teaching Periods Progress */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex justify-between text-[11px] mb-1 font-medium">
                          <span className="text-slate-600">Tiến độ giảng dạy:</span>
                          <span className="font-bold text-sky-900">{taughtPeriods}/{totalPeriods} tiết ({progressPercent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-sky-600'}`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartClass(cls)}
                    className="flex-1 py-2.5 px-3 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" /> Điểm danh
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditClass(cls)}
                    className="p-2.5 bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 rounded-xl transition cursor-pointer"
                    title="Chỉnh sửa thông tin lớp học & danh sách sinh viên"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDissolveConfirm(cls)}
                    className="p-2.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-xl transition cursor-pointer"
                    title="Giải tán lớp học này (Đồng bộ xóa Admin & gỡ khỏi giao diện SV)"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Add / Edit Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-sky-100 my-6 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-600 text-white">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                    {editingClass ? 'Chỉnh Sửa Lớp Học / Lịch Dạy' : 'Tạo Lớp Học / Lịch Dạy Mới'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tên môn học / học phần *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Lập trình Web Nâng Cao"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-medium text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã lớp / học phần *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VD: IT301-A1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono font-bold text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-sky-600" />
                    <span>Số tiết mỗi buổi *</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={periodsPerSession}
                    onChange={(e) => setPeriodsPerSession(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono font-bold text-sky-900"
                    placeholder="VD: 4 tiết"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khóa học</label>
                  <input
                    type="text"
                    value={courseYear}
                    onChange={(e) => setCourseYear(e.target.value)}
                    placeholder="VD: 10, 11, 2022"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên lớp sinh hoạt</label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="VD: A1, CNTT1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Schedule time & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thứ trong tuần *</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-medium"
                  >
                    <option value={1}>Thứ 2</option>
                    <option value={2}>Thứ 3</option>
                    <option value={3}>Thứ 4</option>
                    <option value={4}>Thứ 5</option>
                    <option value={5}>Thứ 6</option>
                    <option value={6}>Thứ 7</option>
                    <option value={7}>Chủ nhật</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giờ bắt đầu *</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giờ kết thúc *</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hạn chót điểm danh *</label>
                  <select
                    value={checkInDeadlineMinutes}
                    onChange={(e) => setCheckInDeadlineMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-medium"
                  >
                    <option value={5}>Sau 5 phút</option>
                    <option value={15}>Sau 15 phút</option>
                    <option value={30}>Sau 30 phút</option>
                    <option value={45}>Sau 45 phút</option>
                    <option value={60}>Sau 60 phút</option>
                  </select>
                </div>
              </div>

              {/* Location & GPS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Địa điểm / Phòng học *</label>
                    <span className={`text-[10px] font-bold ${availableRooms.length > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {availableRooms.length > 0 ? `✓ Còn ${availableRooms.length} phòng trống` : '⚠️ Hết phòng'}
                    </span>
                  </div>

                  <select
                    value={locationName}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setLocationName(selected);
                      const roomObj = campusRooms.find((r) => r.name === selected);
                      if (roomObj) {
                        setLatitude(roomObj.latitude);
                        setLongitude(roomObj.longitude);
                        setRadiusMeters(roomObj.radiusMeters);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-medium"
                    required
                  >
                    {availableRooms.length === 0 ? (
                      <option value="">-- Không còn phòng trống trong khung giờ này (Đã ẩn phòng trùng) --</option>
                    ) : (
                      <>
                        {!availableRooms.some((r) => r.name === locationName) && locationName && (
                          <option value={locationName}>{locationName} (Phòng hiện tại)</option>
                        )}
                        {availableRooms.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name} • Sức chứa: {r.capacity} SV ({r.building})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Chỉ hiển thị các phòng còn trống. Phòng đã được Admin xếp lịch hoặc GV khác đăng ký sẽ bị ẩn.
                  </p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bán kính GPS cho phép (mét) *</label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={radiusMeters}
                    onChange={(e) => setRadiusMeters(Math.max(10, parseInt(e.target.value) || 50))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>
              </div>

              {/* Student Picker */}
              <div className="pt-2 border-t border-slate-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-sky-600" />
                    <span>Chọn Sinh Viên Tham Gia Lớp ({selectedStudentIds.length}/{allStudents.length} đã chọn)</span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectAllFilteredStudents}
                      className="px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition cursor-pointer shadow-2xs"
                    >
                      Chọn tất cả ({filteredStudents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                    >
                      Bỏ chọn hết
                    </button>
                  </div>
                </div>

                {/* Filters for Students: Search, Class, Course */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative sm:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      placeholder="Tìm Mã SV, Tên..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden text-xs"
                    />
                  </div>

                  <div>
                    <select
                      value={studentClassFilter}
                      onChange={(e) => setStudentClassFilter(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden text-xs font-medium"
                    >
                      <option value="all">Tất cả các lớp ({studentClassList.length})</option>
                      {studentClassList.map((cls) => (
                        <option key={cls} value={cls}>
                          Lớp {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={studentCourseFilter}
                      onChange={(e) => setStudentCourseFilter(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden text-xs font-medium"
                    >
                      <option value="all">Tất cả các khóa ({studentCourseList.length})</option>
                      {studentCourseList.map((crs) => (
                        <option key={crs} value={crs}>
                          Khóa {crs}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Class Shortcut if className in form matches any class */}
                {className && className.trim() && studentClassList.includes(className.trim()) && studentClassFilter !== className.trim() && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <span>Gợi ý:</span>
                    <button
                      type="button"
                      onClick={() => setStudentClassFilter(className.trim())}
                      className="text-sky-700 bg-sky-100 hover:bg-sky-200 px-2 py-0.5 rounded-md font-bold transition cursor-pointer"
                    >
                      ⚡ Lọc nhanh sinh viên lớp "{className.trim()}"
                    </button>
                  </div>
                )}

                {/* Master checkbox for filtered list */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/90 rounded-xl text-[11px] text-slate-700 font-semibold border border-slate-200/60">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAllFilteredStudentsSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeFilteredStudentsSelected;
                      }}
                      onChange={handleToggleAllFilteredStudents}
                      className="h-3.5 w-3.5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                    <span>
                      {isAllFilteredStudentsSelected
                        ? `Đã chọn tất cả (${filteredStudents.length})`
                        : `Chọn tất cả (${filteredStudents.length})`}
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {filteredStudents.length}/{allStudents.length} sinh viên
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-2 space-y-1 bg-slate-50/50">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Không tìm thấy sinh viên nào phù hợp bộ lọc
                    </div>
                  ) : (
                    filteredStudents.map((st) => {
                      const isSelected = selectedStudentIds.includes(st.id);
                      return (
                        <div
                          key={st.id}
                          onClick={() => toggleStudentSelection(st.id)}
                          className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer border ${
                            isSelected
                              ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-2xs'
                              : 'bg-white border-transparent hover:border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Handled by parent div
                              className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                            <div>
                              <div className="font-bold text-xs">{st.fullName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Mã SV: {st.studentCode} • Khóa: {st.courseYear || '10'} • Lớp: {st.className || ''}
                              </div>
                            </div>
                          </div>

                          {isSelected ? (
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                              Đã chọn
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Chưa chọn</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  {editingClass ? 'Lưu Thay Đổi' : 'Tạo Lớp Học Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        subMessage={confirmConfig.subMessage}
        iconType="trash"
        confirmText="Xác nhận giải tán"
        cancelText="Hủy"
        onConfirm={confirmConfig.confirmAction}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Center 5s Notification with Undo */}
      <CenterNotification
        notification={centerNotification}
        onClose={() => setCenterNotification(null)}
      />

      {/* Room Capacity Warning Modal */}
      <RoomCapacityWarningModal
        isOpen={capacityConfirmModal.isOpen}
        roomName={capacityConfirmModal.roomName}
        roomCapacity={capacityConfirmModal.roomCapacity}
        studentCount={capacityConfirmModal.studentCount}
        onConfirm={capacityConfirmModal.onConfirm}
        onCancel={() => setCapacityConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Registration Success Modal */}
      <RegistrationSuccessModal
        isOpen={isSuccessModalOpen}
        message="Đăng ký thành công!"
        subMessage="Lớp học đã được hệ thống lưu trữ thành công."
        onClose={() => setIsSuccessModalOpen(false)}
      />

      {/* Dedicated Trash Management Modal for Dissolved Classes */}
      <TrashManagementModal
        isOpen={isTrashModalOpen}
        onClose={() => {
          setIsTrashModalOpen(false);
          onRefreshData();
        }}
        initialFilter="class"
        title="Quản Lý Thùng Rác Lớp Đã Giải Tán (Lưu Trữ 6 Tháng)"
        role="lecturer"
        onRefreshData={onRefreshData}
      />
    </div>
  );
};
