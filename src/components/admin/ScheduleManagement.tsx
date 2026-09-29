import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Plus,
  MapPin,
  Clock,
  ShieldCheck,
  Users,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Navigation,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { ClassRoom, User } from '../../types';
import { StorageService } from '../../services/storage';
import { ConfirmModal } from '../common/ConfirmModal';
import { CenterNotification, CenterNotificationState } from '../common/CenterNotification';
import { RoomCapacityWarningModal } from '../common/RoomCapacityWarningModal';
import { RegistrationSuccessModal } from '../common/RegistrationSuccessModal';
import { TrashManagementModal } from '../common/TrashManagementModal';

interface ScheduleManagementProps {
  classes: ClassRoom[];
  lecturers: User[];
  students: User[];
  onRefreshData: () => void;
  prefillLocationName?: string;
  onClearPrefillLocation?: () => void;
}

export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({
  classes,
  lecturers,
  students,
  onRefreshData,
  prefillLocationName,
  onClearPrefillLocation,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  // Filter states for class list
  const [filterDay, setFilterDay] = useState<'all' | number>('all');
  const [filterLecturer, setFilterLecturer] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterSession, setFilterSession] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(true);

  // All campus rooms
  const campusRooms = useMemo(() => StorageService.getCampusRooms(), [classes]);

  // Confirm Modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subMessage?: string;
    iconType: 'trash' | 'warning';
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

  // Capacity Warning Modal state
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

  // Registration Success Modal state
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Trash Management Modal state
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);

  // Count deleted classes in trash
  const deletedClassesCount = useMemo(() => {
    return StorageService.getTrash().filter((t) => t.type === 'class').length;
  }, [classes, isTrashModalOpen]);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState<number>(3);
  const [totalPeriods, setTotalPeriods] = useState<number>(45);
  const [periodsPerSession, setPeriodsPerSession] = useState<number>(4);
  const [courseYear, setCourseYear] = useState('10');
  const [className, setClassName] = useState('A1');
  const [lecturerId, setLecturerId] = useState('');
  const [locationName, setLocationName] = useState('Phòng Lab 302 - Giảng đường A2');
  const [latitude, setLatitude] = useState(21.038234);
  const [longitude, setLongitude] = useState(105.782812);
  const [radiusMeters, setRadiusMeters] = useState(50);
  const [useLecturerLocation, setUseLecturerLocation] = useState(true);
  const [dayOfWeek, setDayOfWeek] = useState(2);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('11:30');
  const [checkInBeforeMinutes, setCheckInBeforeMinutes] = useState(15);
  const [checkInDeadlineMinutes, setCheckInDeadlineMinutes] = useState(15);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('all');
  const [studentCourseFilter, setStudentCourseFilter] = useState('all');

  const studentClassList = Array.from(new Set(students.map((s) => s.className).filter(Boolean))).sort();
  const studentCourseList = Array.from(
    new Set(students.map((s) => s.courseYear).filter((c): c is string => Boolean(c && c.trim())))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const filteredStudents = students.filter((s) => {
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

  const handleSelectAllFilteredStudents = () => {
    setSelectedStudentIds(filteredStudents.map((s) => s.id));
  };

  const handleDeselectFilteredStudents = () => {
    const filteredIdSet = new Set(filteredStudents.map((s) => s.id));
    setSelectedStudentIds(selectedStudentIds.filter((id) => !filteredIdSet.has(id)));
  };

  const handleToggleAllFilteredStudents = () => {
    if (isAllFilteredStudentsSelected) {
      handleDeselectFilteredStudents();
    } else {
      handleSelectAllFilteredStudents();
    }
  };

  // Dynamic available rooms for currently selected slot (dayOfWeek & startTime - endTime)
  // Rooms already booked during this time are automatically omitted
  const availableRooms = useMemo(() => {
    return StorageService.getAvailableRoomsForSchedule(dayOfWeek, startTime, endTime, editingClass?.id);
  }, [dayOfWeek, startTime, endTime, editingClass, classes]);

  // Filtered classes according to user filter criteria:
  // "Thứ", "Tên giảng viên", "Môn học", "Buổi sáng (00:00 SA - 12:00 SA)", "Buổi chiều (12:01 CH - 23:59 CH)"
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      // 1. Lọc theo Thứ
      if (filterDay !== 'all' && cls.dayOfWeek !== Number(filterDay)) {
        return false;
      }
      // 2. Lọc theo Tên giảng viên
      if (filterLecturer !== 'all' && cls.lecturerId !== filterLecturer) {
        return false;
      }
      // 3. Lọc theo Môn học
      if (filterSubject.trim()) {
        const q = filterSubject.trim().toLowerCase();
        const matchName = cls.name.toLowerCase().includes(q);
        const matchCode = cls.code.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      // 4. Lọc theo Buổi học: Buổi sáng (00:00 SA - 12:00 SA) / Buổi chiều (12:01 CH - 23:59 CH)
      if (filterSession !== 'all') {
        const [h, m] = cls.startTime.split(':').map(Number);
        const startMinutes = (h || 0) * 60 + (m || 0);
        const noonMinutes = 12 * 60; // 12:00 = 720 phút
        if (filterSession === 'morning' && startMinutes > noonMinutes) {
          return false;
        }
        if (filterSession === 'afternoon' && startMinutes <= noonMinutes) {
          return false;
        }
      }
      return true;
    });
  }, [classes, filterDay, filterLecturer, filterSubject, filterSession]);

  const handleOpenAdd = () => {
    setEditingClass(null);
    setCode(`IT${Math.floor(100 + Math.random() * 900)}-A1`);
    setName('');
    setCredits(3);
    setTotalPeriods(45);
    setPeriodsPerSession(4);
    setCourseYear('10');
    setClassName('A1');
    setLecturerId(lecturers[0]?.id || '');
    
    // Choose first available room if present
    const initAvailRooms = StorageService.getAvailableRoomsForSchedule(2, '08:00', '11:30');
    const defaultRoom = initAvailRooms[0] || campusRooms[0];
    setLocationName(defaultRoom ? defaultRoom.name : 'Phòng Lab 302 - Giảng đường A2 (Cơ sở 1)');
    setLatitude(defaultRoom ? defaultRoom.latitude : 21.038234);
    setLongitude(defaultRoom ? defaultRoom.longitude : 105.782812);
    setRadiusMeters(defaultRoom ? defaultRoom.radiusMeters : 50);

    setUseLecturerLocation(true);
    setDayOfWeek(2);
    setStartTime('08:00');
    setEndTime('11:30');
    setCheckInBeforeMinutes(15);
    setCheckInDeadlineMinutes(15);
    setSelectedStudentIds([]);
    setStudentSearchTerm('');
    setStudentClassFilter('all');
    setStudentCourseFilter('all');
    setIsModalOpen(true);
  };

  // Handle prefill room navigation from room tab
  useEffect(() => {
    if (prefillLocationName) {
      handleOpenAdd();
      setLocationName(prefillLocationName);
      const rObj = campusRooms.find((r) => r.name === prefillLocationName);
      if (rObj) {
        setLatitude(rObj.latitude);
        setLongitude(rObj.longitude);
        setRadiusMeters(rObj.radiusMeters);
      }
      onClearPrefillLocation?.();
    }
  }, [prefillLocationName]);

  const handleOpenEdit = (cls: ClassRoom) => {
    setEditingClass(cls);
    setCode(cls.code);
    setName(cls.name);
    setCredits(cls.credits || 3);
    setTotalPeriods(cls.totalPeriods || ((cls.credits || 3) * 15));
    setPeriodsPerSession(cls.periodsPerSession || 4);
    setCourseYear(cls.courseYear);
    setClassName(cls.className);
    setLecturerId(cls.lecturerId);
    setLocationName(cls.locationName);
    setLatitude(cls.latitude);
    setLongitude(cls.longitude);
    setRadiusMeters(cls.radiusMeters);
    setUseLecturerLocation(!!cls.useLecturerLocation);
    setDayOfWeek(cls.dayOfWeek);
    setStartTime(cls.startTime);
    setEndTime(cls.endTime);
    setCheckInBeforeMinutes(cls.checkInBeforeMinutes);
    setCheckInDeadlineMinutes(cls.checkInDeadlineMinutes);
    setSelectedStudentIds(cls.studentIds || []);
    setStudentSearchTerm('');
    setStudentClassFilter('all');
    setStudentCourseFilter('all');
    setIsModalOpen(true);
  };

  const handleOpenDeleteConfirm = (cls: ClassRoom) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận xóa lịch học / môn học?',
      message: `Bạn có chắc chắn muốn xóa lớp học "${cls.name}" (Mã: ${cls.code})?`,
      subMessage: 'Dữ liệu lịch học sẽ được chuyển vào Thùng rác trong 6 tháng. Bạn có thể khôi phục lại bất kỳ lúc nào.',
      iconType: 'trash',
      confirmAction: () => {
        const deleteResult = StorageService.deleteClass(cls.id, 'admin');
        onRefreshData();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

        // Show centered 5-second notification with Hoàn tác
        setCenterNotification({
          id: `undo_delete_cls_${cls.id}_${Date.now()}`,
          message: 'xóa lịch học thành công',
          durationMs: 5000,
          onUndo: () => {
            if (deleteResult.trashItem) {
              StorageService.restoreTrashItem(deleteResult.trashItem.id);
            } else if (deleteResult.previousClass) {
              StorageService.addClass(deleteResult.previousClass);
            }
            onRefreshData();
          },
        });
      },
    });
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!name.trim() || !cleanCode) {
      alert('Vui lòng nhập Tên môn học và Mã lớp');
      return;
    }

    // Check unique class code
    if (StorageService.isClassCodeTaken(cleanCode, editingClass?.id)) {
      alert('Mã đã được sử dụng!');
      return;
    }

    if (!lecturerId) {
      alert('Vui lòng gán một giảng viên phụ trách');
      return;
    }

    if (radiusMeters <= 0) {
      alert('Bán kính điểm danh phải là số dương lớn hơn 0 mét');
      return;
    }

    // 1. Check lecturer schedule conflict
    const lecturerConflict = StorageService.checkLecturerConflict(
      lecturerId,
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

    // 2. Check student schedule conflict
    const studentConflict = StorageService.checkStudentConflicts(
      selectedStudentIds,
      Number(dayOfWeek),
      startTime,
      endTime,
      editingClass?.id
    );
    if (studentConflict.hasConflict) {
      alert(
        `⚠️ XUNG ĐỘT LỊCH HỌC CỦA SINH VIÊN:\n\nSinh viên "${studentConflict.studentName}" (${studentConflict.studentCode}) đã có lịch học lớp "${studentConflict.conflictingClass?.name}" (${studentConflict.conflictingClass?.code}) trong khung giờ ${studentConflict.conflictingClass?.startTime} - ${studentConflict.conflictingClass?.endTime} (Thứ ${studentConflict.conflictingClass?.dayOfWeek === 7 ? 'Chủ nhật' : studentConflict.conflictingClass!.dayOfWeek + 1}).\n\nQuy định: Các lớp học của MỖI sinh viên KHÔNG ĐƯỢC trùng thời gian với lớp đã đăng ký trước đó. Vui lòng bỏ chọn sinh viên bị trùng hoặc đổi khung giờ!`
      );
      return;
    }

    // 3. Check Room schedule conflict
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

    const executeSave = (showSuccessModal = false) => {
      if (editingClass) {
        StorageService.updateClass(editingClass.id, {
          code,
          name,
          credits: Number(credits) || 3,
          totalPeriods: Number(totalPeriods) || ((Number(credits) || 3) * 15),
          periodsPerSession: Number(periodsPerSession) || 4,
          courseYear,
          className,
          lecturerId,
          locationName,
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radiusMeters),
          useLecturerLocation,
          dayOfWeek: Number(dayOfWeek),
          startTime,
          endTime,
          checkInBeforeMinutes: Number(checkInBeforeMinutes),
          checkInDeadlineMinutes: Number(checkInDeadlineMinutes),
          studentIds: selectedStudentIds,
        });
      } else {
        const newClass: ClassRoom = {
          id: `cls_${Date.now()}`,
          code,
          name,
          credits: Number(credits) || 3,
          totalPeriods: Number(totalPeriods) || ((Number(credits) || 3) * 15),
          periodsPerSession: Number(periodsPerSession) || 4,
          courseYear,
          className,
          lecturerId,
          locationName,
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radiusMeters),
          useLecturerLocation,
          dayOfWeek: Number(dayOfWeek),
          startTime,
          endTime,
          checkInBeforeMinutes: Number(checkInBeforeMinutes),
          checkInDeadlineMinutes: Number(checkInDeadlineMinutes),
          checkOutAllowedAfterMinutes: 0,
          studentIds: selectedStudentIds,
          isLiveSessionActive: false,
        };
        StorageService.addClass(newClass);
      }

      setIsModalOpen(false);
      onRefreshData();
      if (showSuccessModal) {
        setIsSuccessModalOpen(true);
      }
    };

    // Kiểm tra sức chứa phòng: không được thêm quá số lượng sinh viên phòng có thể chứa
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
          executeSave(true);
        },
      });
      return;
    }

    executeSave(false);
  };

  const toggleSelectAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  const getDayName = (d: number) => {
    return d === 7 ? 'Chủ nhật' : `Thứ ${d + 1}`;
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-sky-600" /> Xếp Lịch Giảng Dạy & Quản Lý Lớp Học ({classes.length})
          </h3>
          <p className="text-xs text-slate-500">
            Tạo lớp, gán giảng viên, chỉ định danh sách sinh viên, cấu hình bán kính GPS (m) và thời gian điểm danh
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTrashModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Xem và quản lý lịch học đã xóa (Khôi phục hoặc xóa vĩnh viễn)"
          >
            <Trash2 className="h-4 w-4 text-rose-600" />
            <span>Thùng rác lịch học ({deletedClassesCount})</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Tạo Lớp Học Mới
          </button>
        </div>
      </div>

      {/* Filter Bar for Class List */}
      <div className="bg-white p-4 rounded-3xl border border-sky-100 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <Filter className="h-4 w-4 text-sky-600" />
            <span>Bộ Lọc Lịch Học & Lớp Học</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
              {filteredClasses.length}/{classes.length} lớp
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(filterDay !== 'all' || filterLecturer !== 'all' || filterSubject.trim() !== '' || filterSession !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setFilterDay('all');
                  setFilterLecturer('all');
                  setFilterSubject('');
                  setFilterSession('all');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              {isFilterPanelOpen ? 'Thu gọn' : 'Mở rộng'}
            </button>
          </div>
        </div>

        {isFilterPanelOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Lọc theo Thứ */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Lọc theo Thứ:</label>
              <select
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 font-medium"
              >
                <option value="all">Tất cả các thứ trong tuần</option>
                <option value={1}>Thứ 2</option>
                <option value={2}>Thứ 3</option>
                <option value={3}>Thứ 4</option>
                <option value={4}>Thứ 5</option>
                <option value={5}>Thứ 6</option>
                <option value={6}>Thứ 7</option>
                <option value={7}>Chủ nhật</option>
              </select>
            </div>

            {/* Lọc theo Tên giảng viên */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Lọc theo Tên giảng viên:</label>
              <select
                value={filterLecturer}
                onChange={(e) => setFilterLecturer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 font-medium"
              >
                <option value="all">Tất cả giảng viên ({lecturers.length})</option>
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.fullName} ({l.lecturerCode || 'GV'})
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo Môn học */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Lọc theo Môn học:</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  placeholder="Nhập tên hoặc mã môn..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Lọc theo Buổi sáng (00:00 SA - 12:00 SA) / Buổi chiều (12:01 CH - 23:59 CH) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Lọc theo Buổi học:</label>
              <select
                value={filterSession}
                onChange={(e) => setFilterSession(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 font-medium"
              >
                <option value="all">Tất cả các buổi</option>
                <option value="morning">🌅 Buổi sáng (00:00 SA - 12:00 SA)</option>
                <option value="afternoon">🌇 Buổi chiều (12:01 CH - 23:59 CH)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Class List Cards */}
      {classes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40 text-sky-400" />
          <p className="font-semibold text-slate-700">Chưa có lớp học nào</p>
          <p className="text-xs text-slate-500 mt-1">
            Nhấn nút "Tạo Lớp Học Mới" để thiết lập lịch giảng dạy và địa điểm điểm danh.
          </p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center text-slate-400">
          <Filter className="h-10 w-10 mx-auto mb-2 opacity-40 text-slate-400" />
          <p className="font-semibold text-slate-700">Không có lớp học nào thỏa mãn tiêu chí lọc</p>
          <p className="text-xs text-slate-500 mt-1">
            Thử điều chỉnh Thứ, Giảng viên, Môn học hoặc Buổi học để tìm kiếm lớp.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterDay('all');
              setFilterLecturer('all');
              setFilterSubject('');
              setFilterSession('all');
            }}
            className="mt-3 px-4 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl transition cursor-pointer"
          >
            Đặt lại tất cả bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => {
            const lecturer = lecturers.find((l) => l.id === cls.lecturerId);
            return (
              <div
                key={cls.id}
                className="bg-white rounded-3xl border border-sky-100 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-sky-100 text-sky-800 font-mono">
                        {cls.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {cls.credits || 3} Tín chỉ • Tổng {cls.totalPeriods || ((cls.credits || 3) * 15)} tiết
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {getDayName(cls.dayOfWeek)}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-800 mb-2 leading-snug line-clamp-2">
                    {cls.name}
                  </h4>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      <span>
                        Giảng viên: <strong>{lecturer?.fullName || 'Chưa gán'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      <span>
                        Ca học: {cls.startTime} - {cls.endTime} ({cls.periodsPerSession || 4} tiết/buổi)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      <span className="truncate">{cls.locationName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Bán kính GPS: <strong className="text-emerald-700 font-bold">{cls.radiusMeters} mét</strong>
                      </span>
                    </div>

                    <div className="text-[11px] text-sky-700 bg-sky-50 p-2 rounded-xl border border-sky-100">
                      {cls.studentIds.length} sinh viên • Lớp {cls.className} (K{cls.courseYear})
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cls)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition flex items-center gap-1"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Sửa cấu hình
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDeleteConfirm(cls)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Xóa lớp (Chuyển vào Thùng rác 6 tháng)"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Class */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-sky-100 my-8 overflow-hidden">
            <div className="flex items-center justify-between border-b border-sky-100 bg-linear-to-r from-sky-50 to-white px-6 py-4">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingClass ? 'Chỉnh Sửa Lớp Học & Cấu Hình GPS' : 'Tạo Lớp Học & Xếp Lịch Giảng Dạy Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* General Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã lớp học / Học phần *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VD: IT3020-A1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên môn học / Lớp học *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Lập trình Ứng dụng Di động"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
              </div>

              {/* Credits & Periods Configuration (Admin managed) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số tín chỉ (Credits) *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={credits}
                    onChange={(e) => {
                      const c = Math.max(1, parseInt(e.target.value) || 1);
                      setCredits(c);
                      setTotalPeriods(c * 15);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                    placeholder="VD: 3"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tổng số tiết môn học *</label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={totalPeriods}
                    onChange={(e) => setTotalPeriods(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                    placeholder="VD: 45"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số tiết mỗi buổi / ca học *</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={periodsPerSession}
                    onChange={(e) => setPeriodsPerSession(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                    placeholder="VD: 4"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giảng viên phụ trách *</label>
                  <select
                    value={lecturerId}
                    onChange={(e) => setLecturerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    required
                  >
                    <option value="">-- Chọn giảng viên --</option>
                    {lecturers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.fullName} ({l.lecturerCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khóa học</label>
                  <input
                    type="text"
                    value={courseYear}
                    onChange={(e) => setCourseYear(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên lớp sinh hoạt</label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="A1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Time Configuration */}
              <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-3">
                <div className="font-bold text-sky-900 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-sky-600" /> Cấu hình thời gian & ca học
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Thứ trong tuần</label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
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
                    <label className="block font-semibold text-slate-700 mb-1">Giờ bắt đầu</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Giờ kết thúc</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Hạn chót điểm danh vào
                    </label>
                    <select
                      value={checkInDeadlineMinutes}
                      onChange={(e) => setCheckInDeadlineMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value={5}>Sau 5 phút</option>
                      <option value={15}>Sau 15 phút</option>
                      <option value={30}>Sau 30 phút</option>
                      <option value={45}>Sau 45 phút</option>
                      <option value={60}>Sau 60 phút</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Geofence & Location Configuration */}
              <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-3">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Cấu hình định vị GPS & Bán kính điểm danh
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Tên địa điểm / Phòng học chỉ định *</label>
                    <span className={`text-[11px] font-bold ${availableRooms.length > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {availableRooms.length > 0
                        ? `✓ Còn ${availableRooms.length} phòng trống vào ${getDayName(dayOfWeek)} (${startTime} - ${endTime})`
                        : `⚠️ Hết phòng trống trong khung giờ này`}
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-sky-500"
                    required
                  >
                    {availableRooms.length === 0 ? (
                      <option value="">-- Không còn phòng nào trống (Phòng trùng lịch đã bị ẩn) --</option>
                    ) : (
                      <>
                        {!availableRooms.some((r) => r.name === locationName) && locationName && (
                          <option value={locationName}>{locationName} (Phòng hiện tại)</option>
                        )}
                        {availableRooms.map((r) => (
                          <option key={r.id} value={r.name}>
                            [{r.campus || 'Cơ sở 1'}] {r.name} • Sức chứa: {r.capacity} SV ({r.building} - {r.type || 'Lý thuyết'})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Hệ thống tự động lọc theo ngày giờ: Phòng nào đã có lớp học hoặc GV đăng ký sẽ không hiển thị ở đây.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Bán kính cho phép (mét) *
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={5000}
                      value={radiusMeters}
                      onChange={(e) => setRadiusMeters(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-400 font-bold text-emerald-900 text-sm"
                      placeholder="VD: 10, 20, 50, 100, 1000..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Vĩ độ (Latitude)</label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kinh độ (Longitude)</label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useLecturerLocation}
                      onChange={(e) => setUseLecturerLocation(e.target.checked)}
                      className="h-4 w-4 rounded text-sky-600"
                    />
                    <span className="font-semibold text-slate-800">
                      Cho phép lấy vị trí quanh máy tính/thiết bị của Giảng viên làm tâm điểm danh động
                    </span>
                  </label>
                </div>
              </div>

              {/* Student Assignment */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-sky-600" />
                    <span>Gán Danh Sách Sinh Viên Vào Lớp ({selectedStudentIds.length}/{students.length} đã chọn)</span>
                  </label>

                  <div className="flex items-center gap-1.5 flex-wrap">
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
                      className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                    >
                      Bỏ chọn hết
                    </button>
                  </div>
                </div>

                {/* Filter Controls: Search, Class, Course */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      placeholder="Tìm Mã SV, Tên..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                    />
                  </div>

                  <div>
                    <select
                      value={studentClassFilter}
                      onChange={(e) => setStudentClassFilter(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
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
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
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
                    Hiển thị {filteredStudents.length}/{students.length} sinh viên
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Không tìm thấy sinh viên nào phù hợp bộ lọc
                    </div>
                  ) : (
                    filteredStudents.map((st) => (
                      <label
                        key={st.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white cursor-pointer transition border border-transparent hover:border-slate-200"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(st.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds([...selectedStudentIds, st.id]);
                              } else {
                                setSelectedStudentIds(selectedStudentIds.filter((id) => id !== st.id));
                              }
                            }}
                            className="h-3.5 w-3.5 rounded text-sky-600"
                          />
                          <span className="font-medium text-slate-800 text-xs">{st.fullName}</span>
                          <span className="font-mono text-slate-500 text-[11px]">({st.studentCode})</span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Khóa {st.courseYear || '10'} • Lớp {st.className}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs transition"
                >
                  {editingClass ? 'Lưu thay đổi' : 'Tạo lớp học ngay'}
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
        subMessage="Lớp học và danh sách sinh viên đã được hệ thống lưu trữ thành công."
        onClose={() => setIsSuccessModalOpen(false)}
      />

      {/* Dedicated Trash Management Modal for Classes */}
      <TrashManagementModal
        isOpen={isTrashModalOpen}
        onClose={() => {
          setIsTrashModalOpen(false);
          onRefreshData();
        }}
        initialFilter="class"
        title="Quản Lý Thùng Rác Lịch Học (Lưu Trữ 6 Tháng)"
        role="admin"
        onRefreshData={onRefreshData}
      />
    </div>
  );
};
