import React, { useState, useEffect } from 'react';
import {
  Users,
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserPlus,
  Send,
  Sparkles,
  ShieldCheck,
  Compass,
  FileSpreadsheet,
  StopCircle,
  Check,
  ChevronLeft,
  Navigation,
  Eye,
  X,
  Search,
  Coffee,
  Play,
  FileText,
} from 'lucide-react';
import { User, ClassRoom, AttendanceRecord, AnomalyReport, EmailNotification, LeaveRequest } from '../../types';
import { StorageService, calculateDistanceMeters, generateStudentPassword } from '../../services/storage';
import { CameraModal } from '../common/CameraModal';
import { ExcelHelper } from '../../services/excelHelper';
import { CenterNotification, CenterNotificationState } from '../common/CenterNotification';

interface ClassLiveSessionProps {
  currentClass: ClassRoom;
  lecturerUser: User;
  allStudents: User[];
  attendanceRecords: AttendanceRecord[];
  onBack: () => void;
  onRefreshData: () => void;
}

export const ClassLiveSession: React.FC<ClassLiveSessionProps> = ({
  currentClass,
  lecturerUser,
  allStudents,
  attendanceRecords,
  onBack,
  onRefreshData,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Selected student to add & suggestions state
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<User | null>(null);
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  // Điểm danh giúp state: 'on_time' | 'late' | 'none'
  const [assistAttendanceType, setAssistAttendanceType] = useState<'on_time' | 'late' | 'none'>('on_time');
  const [customOnTime, setCustomOnTime] = useState('');
  const [customLateTime, setCustomLateTime] = useState('');
  const [isAssistingExistingStudent, setIsAssistingExistingStudent] = useState(false);

  // Anomaly report form state
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string>('');
  const [reportIssueType, setReportIssueType] = useState<AnomalyReport['issueType']>('gps_fraud');
  const [reportDescription, setReportDescription] = useState('');
  const [reportPhotoUrl, setReportPhotoUrl] = useState<string | undefined>(currentClass.currentRoomPhotoUrl);

  const todayStr = new Date().toISOString().split('T')[0];

  // Center notification state
  const [centerNotification, setCenterNotification] = useState<CenterNotificationState | null>(null);

  // End Class Early Modal state
  const [isEndEarlyModalOpen, setIsEndEarlyModalOpen] = useState(false);

  // Schedule Adjustment Modal state (khi điểm danh ngoài thời gian quy định)
  const [isAdjustScheduleModalOpen, setIsAdjustScheduleModalOpen] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [newStartTime, setNewStartTime] = useState(currentClass.startTime);
  const [newEndTime, setNewEndTime] = useState(currentClass.endTime);

  // Live timer tick for real-time check-in window countdown
  const [, setLiveTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Students in this class
  const classStudents = allStudents.filter((s) => currentClass.studentIds.includes(s.id));

  // Students available to be added from Admin directory
  const availableStudents = allStudents.filter((s) => !currentClass.studentIds.includes(s.id));
  const matchingStudents = availableStudents.filter((s) => {
    if (!studentSearchInput.trim()) return false;
    const q = studentSearchInput.trim().toLowerCase();
    const code = (s.studentCode || s.username || '').toLowerCase();
    const name = (s.fullName || '').toLowerCase();
    const cls = (s.className || '').toLowerCase();
    const course = (s.courseYear || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    return (
      code.includes(q) ||
      name.includes(q) ||
      cls.includes(q) ||
      course.includes(q) ||
      email.includes(q)
    );
  });

  // Today attendance for this class
  const classAttendanceToday = attendanceRecords.filter(
    (r) => r.classId === currentClass.id && r.date === todayStr
  );

  // Stats calculation
  const totalStudents = classStudents.length;
  const checkedInCount = classAttendanceToday.filter((r) => !!r.checkInTime).length;
  const earlyLeaveRequests = classAttendanceToday.filter(
    (r) => r.checkOutStatus === 'pending_approval' && !r.earlyLeaveApproved
  );
  const anomalyCount = classAttendanceToday.filter(
    (r) => r.checkInWithinRadius === false || r.finalStatus === 'violation'
  ).length;

  // Check if current time is outside the scheduled class time window
  // Quy định: Chỉ xuất hiện chức năng/modal điểm danh ngoài giờ khi giảng viên điểm danh KHÁC NGÀY DẠY hoặc NGOÀI KHUNG GIỜ DẠY
  // Còn trong khung giờ dạy chỉ định (VD: Thứ 3 từ 08:00 - 11:30), GV muốn điểm danh lúc nào cũng được (kể cả 10:00) vẫn tính là thành công ngay!
  const checkIfOutsideSchedule = () => {
    const now = new Date();
    // Monday: 1 (Thứ 2), Tuesday: 2 (Thứ 3), ..., Saturday: 6 (Thứ 7), Sunday: 7 (Chủ nhật)
    const currentDay = now.getDay() === 0 ? 7 : now.getDay();
    const classDay = Number(currentClass.dayOfWeek);

    const [startH, startM] = (currentClass.startTime || '08:00').split(':').map(Number);
    const [endH, endM] = (currentClass.endTime || '11:30').split(':').map(Number);
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const beforeMinutes = currentClass.checkInBeforeMinutes !== undefined ? Number(currentClass.checkInBeforeMinutes) : 15;
    const checkInAllowedStart = startMinutes - beforeMinutes;

    const isDifferentDay = Number(currentDay) !== classDay;
    const isOutsideHours = currentTotalMinutes < checkInAllowedStart || currentTotalMinutes > endMinutes;

    return isDifferentDay || isOutsideHours;
  };

  // Handle lecturer self check-in trigger
  const handleLecturerSelfCheckIn = () => {
    const isOutside = checkIfOutsideSchedule();
    if (isOutside) {
      // Must show modal to enter reason and new times
      const now = new Date();
      const currentH = now.getHours().toString().padStart(2, '0');
      const currentM = now.getMinutes().toString().padStart(2, '0');
      const currentHM = `${currentH}:${currentM}`;

      const [startH, startM] = currentClass.startTime.split(':').map(Number);
      const [endH, endM] = currentClass.endTime.split(':').map(Number);
      const durationMinutes = Math.max(60, (endH * 60 + endM) - (startH * 60 + startM));
      const endTotal = now.getHours() * 60 + now.getMinutes() + durationMinutes;
      const endHH = Math.floor((endTotal % (24 * 60)) / 60).toString().padStart(2, '0');
      const endMM = (endTotal % 60).toString().padStart(2, '0');

      setNewStartTime(currentHM);
      setNewEndTime(`${endHH}:${endMM}`);
      setAdjustmentReason('');
      setIsAdjustScheduleModalOpen(true);
      return;
    }

    performCheckIn(currentClass.startTime, currentClass.endTime);
  };

  const performCheckIn = (effectiveStartTime: string, effectiveEndTime: string, reason?: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const isoStr = now.toISOString();

    const updates: Partial<ClassRoom> = {
      lecturerSelfCheckedIn: true,
      lecturerCheckInTime: timeStr,
      lecturerCheckInTimestamp: isoStr,
      isLiveSessionActive: true,
    };

    if (reason) {
      updates.startTime = effectiveStartTime;
      updates.endTime = effectiveEndTime;
      updates.originalStartTime = currentClass.originalStartTime || currentClass.startTime;
      updates.originalEndTime = currentClass.originalEndTime || currentClass.endTime;
      updates.scheduleAdjustmentReason = reason;
      updates.scheduleAdjustedAt = isoStr;

      // Send notification alert to Admin
      const adminEmail: EmailNotification = {
        id: `email_admin_schedule_${currentClass.id}_${Date.now()}`,
        toEmail: 'admin@school.edu.vn',
        recipientName: 'Quản trị viên Hệ thống',
        classId: currentClass.id,
        className: currentClass.name,
        subject: `[ĐIỀU CHỈNH THỜI GIAN HỌC] Giảng viên ${lecturerUser.fullName} - Lớp ${currentClass.name}`,
        content: `Kính gửi Ban Quản Lý Đào Tạo / Admin,\n\nGiảng viên ${lecturerUser.fullName} (${lecturerUser.lecturerCode}) đã xác nhận điểm danh ngoài thời gian quy định cho ca học:\n- Môn học: ${currentClass.name} (Mã: ${currentClass.code})\n- Địa điểm: ${currentClass.locationName}\n- Thời gian học điều chỉnh mới: ${effectiveStartTime} - ${effectiveEndTime} (Thời gian cũ: ${currentClass.startTime} - ${currentClass.endTime})\n- Lý do điều chỉnh: ${reason}\n- Thời điểm xác nhận: ${now.toLocaleTimeString('vi-VN')} ngày ${now.toLocaleDateString('vi-VN')}\n\nHệ thống đã tự động cập nhật thời khóa biểu này trên giao diện Admin và Sinh viên.`,
        sentAt: `${now.toLocaleTimeString('vi-VN')} ${now.toLocaleDateString('vi-VN')}`,
        type: 'class_cancelled',
        status: 'delivered',
      };
      StorageService.addEmail(adminEmail);
    }

    StorageService.updateClass(currentClass.id, updates);

    const updatedState: ClassRoom = {
      ...currentClass,
      ...updates,
    };

    const notifiedCount = StorageService.notifyOutsideStudentsOnLecturerCheckIn(updatedState);
    onRefreshData();

    setCenterNotification({
      id: `checkin_${Date.now()}`,
      message: `Giảng viên đã điểm danh thành công lúc ${timeStr}! Đã nhắc nhở ${notifiedCount} sinh viên chưa vào lớp.${reason ? ' Đã cập nhật giờ học mới trên Admin và Sinh viên.' : ''}`,
      type: 'normal',
      durationMs: 5000,
    });
  };

  const handleConfirmScheduleAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentReason.trim()) {
      alert('Vui lòng ghi rõ lý do điểm danh ngoài thời gian quy định');
      return;
    }
    if (!newStartTime || !newEndTime) {
      alert('Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc mới');
      return;
    }

    setIsAdjustScheduleModalOpen(false);
    performCheckIn(newStartTime, newEndTime, adjustmentReason.trim());
  };

  // Handle sync anchor to lecturer's live GPS
  const handleSyncLecturerGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          StorageService.updateClass(currentClass.id, {
            activeAnchorLat: pos.coords.latitude,
            activeAnchorLng: pos.coords.longitude,
            useLecturerLocation: true,
          });
          onRefreshData();
          setCenterNotification({
            id: `gps_succ_${Date.now()}`,
            message: 'lấy vị trí thành công',
            type: 'normal',
            durationMs: 4000,
          });
        },
        (err) => {
          StorageService.updateClass(currentClass.id, {
            activeAnchorLat: currentClass.latitude,
            activeAnchorLng: currentClass.longitude,
            useLecturerLocation: true,
          });
          onRefreshData();
          setCenterNotification({
            id: `gps_succ_fb_${Date.now()}`,
            message: 'lấy vị trí thành công',
            type: 'normal',
            durationMs: 4000,
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      StorageService.updateClass(currentClass.id, {
        useLecturerLocation: true,
      });
      onRefreshData();
      setCenterNotification({
        id: `gps_succ_no_${Date.now()}`,
        message: 'lấy vị trí thành công',
        type: 'normal',
        durationMs: 4000,
      });
    }
  };

  // Leave requests for this class
  const classLeaveRequests = StorageService.getLeaveRequests().filter(
    (l) => l.classId === currentClass.id
  );

  // Handle lecturer toggle class break (Tạm dừng lớp học / Tiếp tục lớp học)
  const handleToggleBreak = () => {
    if (!currentClass.isBreakActive) {
      // Pause class: GPS stops scanning completely
      StorageService.updateClass(currentClass.id, {
        isBreakActive: true,
        breakStartedAt: new Date().toISOString(),
        resumedAt: undefined,
      });
      onRefreshData();
      setCenterNotification({
        id: `break_${Date.now()}`,
        message: 'Đã tạm dừng lớp học cho sinh viên nghỉ giải lao (ăn sáng, lấy nước). GPS đã ngừng quét hoàn toàn!',
        type: 'normal',
        durationMs: 5000,
      });
    } else {
      // Resume class: GPS immediately starts scanning
      const nowIso = new Date().toISOString();
      StorageService.updateClass(currentClass.id, {
        isBreakActive: false,
        resumedAt: nowIso,
        resumeGraceSeconds: 300, // 5 minutes grace countdown
      });
      StorageService.notifyClassResumed(currentClass);
      onRefreshData();
      setCenterNotification({
        id: `resume_${Date.now()}`,
        message: 'Lớp học đã tiếp tục! GPS quét lập tức. Sinh viên ngoài phạm vi nhận thông báo quay lại trong 5 phút.',
        type: 'normal',
        durationMs: 5000,
      });
    }
  };

  // Handle review student leave request (Chấp thuận vắng 1/2 tiết / Từ chối tính vắng 100% nếu không đến)
  const handleReviewLeaveRequest = (requestId: string, status: 'approved' | 'rejected') => {
    StorageService.updateLeaveRequest(requestId, { status }, lecturerUser);
    onRefreshData();
    setCenterNotification({
      id: `leave_rev_${Date.now()}`,
      message:
        status === 'approved'
          ? 'Đã duyệt đơn xin phép vắng học (Hệ thống tính vắng 1/2 số tiết)!'
          : 'Đã từ chối đơn xin phép vắng học (Nếu sinh viên đến lớp tính chậm, không đến tính vắng 100% tiết)!',
      type: 'normal',
      durationMs: 5000,
    });
  };

  // Handle end class early: opens confirm modal
  const handleEndClassEarly = () => {
    setIsEndEarlyModalOpen(true);
  };

  // Confirm early end class
  const handleConfirmEndEarly = () => {
    StorageService.endClassEarlyWithDroppedStatus(currentClass.id);
    setIsEndEarlyModalOpen(false);
    onRefreshData();
    setCenterNotification({
      id: `end_early_${Date.now()}`,
      message: 'Đã kết thúc lớp học sớm thành công! Những người không đến điểm danh và không có phép đã được ghi nhận "Bỏ học".',
      type: 'normal',
      durationMs: 5000,
    });
  };

  // Manually trigger absence report to Admin for students who haven't arrived
  const handleReportAllAbsences = () => {
    const reported = StorageService.checkAndReportExpiredCheckIns(currentClass);
    onRefreshData();
    alert(
      `Đã rà soát và tự động gửi thông báo [KHÔNG TỚI LỚP] về tài khoản Admin cho ${reported} sinh viên vắng mặt!`
    );
  };

  // Handle approve / reject early leave
  const handleApproveEarlyLeave = (record: AttendanceRecord, approved: boolean) => {
    StorageService.recordAttendance({
      ...record,
      earlyLeaveApproved: approved,
      earlyLeaveApprovedBy: lecturerUser.id,
      earlyLeaveApprovedAt: new Date().toLocaleTimeString('vi-VN'),
      checkOutStatus: approved ? 'excused' : 'rejected',
      finalStatus: approved ? record.finalStatus : 'early_exit',
    });
    onRefreshData();
  };

  // Helper functions for time calculation
  const addMinutesToTime = (timeStr: string, minutes: number): string => {
    if (!timeStr) return '08:00';
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const totalM = h * 60 + m + minutes;
    const resH = Math.floor(totalM / 60) % 24;
    const resM = totalM % 60;
    return `${String(resH).padStart(2, '0')}:${String(resM).padStart(2, '0')}`;
  };

  const timeStringToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  // Giờ giảng viên bắt đầu điểm danh: currentClass.lecturerCheckInTime (nếu đã điểm danh) hoặc currentClass.startTime
  const sessionStartTime = currentClass.lecturerCheckInTime
    ? currentClass.lecturerCheckInTime.substring(0, 5)
    : currentClass.startTime;

  const deadlineMinutes = currentClass.checkInDeadlineMinutes || 15;
  // Thời điểm muộn nhất cho phép đúng giờ:
  const maxOnTime = addMinutesToTime(sessionStartTime, deadlineMinutes);

  // Kiểm tra thời điểm hiện tại so với thời gian kết thúc tiết học
  const isClassFinishedNow = () => {
    const now = new Date();
    const nowM = now.getHours() * 60 + now.getMinutes();
    const endM = timeStringToMinutes(currentClass.endTime);
    return nowM > endM;
  };

  // Open modal to add a student from admin directory
  const handleOpenAddStudentModal = () => {
    setSelectedStudentToAdd(null);
    setStudentSearchInput('');
    setIsSuggestionsOpen(false);
    setIsAssistingExistingStudent(false);
    setAssistAttendanceType('on_time');
    setCustomOnTime(sessionStartTime);
    setCustomLateTime(maxOnTime);
    setIsAddStudentOpen(true);
  };

  // Open modal to assist attendance for a student already enrolled in class
  const handleOpenAssistForExistingStudent = (student: User) => {
    setSelectedStudentToAdd(student);
    setStudentSearchInput(`${student.fullName} (${student.studentCode || student.username})`);
    setIsSuggestionsOpen(false);
    setIsAssistingExistingStudent(true);
    setAssistAttendanceType('on_time');
    setCustomOnTime(sessionStartTime);
    setCustomLateTime(maxOnTime);
    setIsAddStudentOpen(true);
  };

  // Select suggestion from list
  const handleSelectStudentSuggestion = (student: User) => {
    setSelectedStudentToAdd(student);
    setStudentSearchInput(`${student.fullName} (${student.studentCode || student.username})`);
    setIsSuggestionsOpen(false);
    setCustomOnTime(sessionStartTime);
    setCustomLateTime(maxOnTime);
  };

  // Handle confirm adding student and/or assisting attendance
  const handleConfirmAddStudentAndAssist = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentToAdd) {
      alert(
        '⚠️ LƯU Ý QUY CHẾ QUAN TRỌNG:\n\nChỉ Admin mới có quyền thêm mới hoàn toàn thông tin của giảng viên và sinh viên!\nGiảng viên chỉ được thêm sinh viên trong danh sách có sẵn do Admin đã tạo.\n\nVui lòng gõ tìm và nhấn chọn một sinh viên từ danh sách gợi ý của hệ thống!'
      );
      return;
    }

    const targetUser = selectedStudentToAdd;
    const cleanCode = (targetUser.studentCode || targetUser.username).toUpperCase();

    // Check if adding a student who is already in this class (unless assisting an existing student)
    if (!isAssistingExistingStudent && currentClass.studentIds.includes(targetUser.id)) {
      alert(`Sinh viên "${targetUser.fullName}" (${cleanCode}) đã có trong danh sách lớp này rồi!`);
      return;
    }

    // Check schedule conflicts
    if (!isAssistingExistingStudent) {
      const studentConflict = StorageService.checkStudentConflicts(
        [targetUser.id],
        currentClass.dayOfWeek,
        currentClass.startTime,
        currentClass.endTime,
        currentClass.id
      );
      if (studentConflict.hasConflict) {
        alert(
          `⚠️ XUNG ĐỘT THỜI GIAN HỌC CỦA SINH VIÊN:\n\nSinh viên "${studentConflict.studentName}" (${studentConflict.studentCode}) đã có lịch học lớp "${studentConflict.conflictingClass?.name}" (${studentConflict.conflictingClass?.code}) trùng ca ${studentConflict.conflictingClass?.startTime} - ${studentConflict.conflictingClass?.endTime}.\n\nTheo quy chế, mỗi sinh viên không được trùng lịch học. Vui lòng không thêm sinh viên này vào lớp!`
        );
        return;
      }
    }

    // Validate attendance assist time
    const isFinished = isClassFinishedNow();
    let recordTime = '';
    let checkInStatus: AttendanceRecord['checkInStatus'] = 'on_time';
    let finalStatus: AttendanceRecord['finalStatus'] = 'present';
    let noteText = '';

    if (assistAttendanceType === 'on_time') {
      const chosenTime = customOnTime || sessionStartTime;
      const chosenM = timeStringToMinutes(chosenTime);
      const startM = timeStringToMinutes(sessionStartTime);
      const maxM = timeStringToMinutes(maxOnTime);

      if (chosenM < startM || chosenM > maxM) {
        alert(
          `⚠️ THỜI GIAN ĐIỂM DANH ĐÚNG GIỜ KHÔNG HỢP LỆ:\n\nTheo quy định, thời gian đúng giờ phải nằm trong khoảng từ lúc bắt đầu điểm danh (${sessionStartTime}) đến lúc muộn nhất (${maxOnTime}).\nThời gian bạn chọn: ${chosenTime}`
        );
        return;
      }
      recordTime = chosenTime;
      checkInStatus = 'on_time';
      finalStatus = 'present';
      noteText = `Giảng viên điểm danh giúp (Đúng giờ: ${recordTime})`;
    } else if (assistAttendanceType === 'late') {
      if (!isFinished) {
        // Chưa hết thời gian học: lấy luôn thời gian lúc giảng viên nhập xong thông tin nhấn xác nhận
        recordTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        checkInStatus = 'late';
        finalStatus = 'late';
        noteText = `Giảng viên điểm danh giúp khi chưa hết tiết (Đi muộn: ${recordTime})`;
      } else {
        // Đã hết thời gian quy định tiết học: phải chọn trong khoảng thời gian từ lúc muộn đến lúc hết tiết
        const chosenTime = customLateTime || maxOnTime;
        const chosenM = timeStringToMinutes(chosenTime);
        const minM = timeStringToMinutes(maxOnTime);
        const endM = timeStringToMinutes(currentClass.endTime);

        if (chosenM < minM || chosenM > endM) {
          alert(
            `⚠️ THỜI GIAN ĐIỂM DANH ĐI MUỘN KHÔNG HỢP LỆ:\n\nDo tiết học đã kết thúc (${currentClass.endTime}), quy định bắt buộc giảng viên phải chọn trong khoảng thời gian từ lúc muộn (${maxOnTime}) đến lúc hết tiết (${currentClass.endTime}).\nThời gian bạn chọn: ${chosenTime}`
          );
          return;
        }
        recordTime = chosenTime;
        checkInStatus = 'late';
        finalStatus = 'late';
        noteText = `Giảng viên điểm danh giúp sau khi hết tiết (Đi muộn: ${recordTime})`;
      }
    }

    // Add to class studentIds if not already in
    if (!currentClass.studentIds.includes(targetUser.id)) {
      const updatedIds = [...currentClass.studentIds, targetUser.id];
      StorageService.updateClass(currentClass.id, { studentIds: updatedIds });
    }

    // Record attendance if assist was selected
    if (assistAttendanceType !== 'none') {
      const newRecord: AttendanceRecord = {
        id: `att_${currentClass.id}_${targetUser.id}_${todayStr}`,
        classId: currentClass.id,
        className: currentClass.name,
        classCode: currentClass.code,
        studentId: targetUser.id,
        studentCode: cleanCode,
        studentName: targetUser.fullName,
        date: todayStr,
        checkInTime: recordTime,
        checkInStatus,
        checkInLatitude: currentClass.latitude,
        checkInLongitude: currentClass.longitude,
        checkInDistanceMeters: 0,
        checkInWithinRadius: true,
        finalStatus,
        notes: noteText,
      };
      StorageService.recordAttendance(newRecord);
    }

    onRefreshData();
    setIsAddStudentOpen(false);
    setSelectedStudentToAdd(null);
    setStudentSearchInput('');
    setIsSuggestionsOpen(false);

    setCenterNotification({
      id: `assist_add_${Date.now()}`,
      message: isAssistingExistingStudent
        ? `Đã điểm danh giúp cho sinh viên ${targetUser.fullName} (${cleanCode}) thành công!`
        : `Đã thêm sinh viên ${targetUser.fullName} (${cleanCode}) vào lớp và ${
            assistAttendanceType === 'none'
              ? 'lưu danh sách'
              : `điểm danh giúp (${assistAttendanceType === 'on_time' ? 'Đúng giờ' : 'Đi muộn'})`
          } thành công!`,
      type: 'normal',
      durationMs: 4000,
    });
  };

  // Handle submit anomaly report to Admin
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) {
      alert('Vui lòng nhập nội dung mô tả sự việc');
      return;
    }

    const st = allStudents.find((s) => s.id === selectedStudentForReport);

    // Rule: Giảng viên chỉ được báo cáo một lần duy nhất, không được sửa hay xóa
    const existingReports = StorageService.getReports();
    const alreadyReported = existingReports.some(
      (r) =>
        r.classId === currentClass.id &&
        (st ? r.studentId === st.id : true) &&
        r.issueType === reportIssueType
    );
    if (alreadyReported) {
      alert('Quy định: Giảng viên chỉ được báo cáo một lần duy nhất cho mỗi sinh viên / sự việc trong ca học này và không được phép chỉnh sửa hay xóa!');
      return;
    }

    const report: AnomalyReport = {
      id: `rep_${Date.now()}`,
      classId: currentClass.id,
      className: currentClass.name,
      lecturerId: lecturerUser.id,
      lecturerName: lecturerUser.fullName,
      createdAt: new Date().toLocaleString('vi-VN'),
      studentId: st?.id,
      studentName: st?.fullName,
      studentCode: st?.studentCode,
      issueType: reportIssueType,
      description: reportDescription.trim(),
      livePhotoUrl: reportPhotoUrl,
      photoCapturedAt: reportPhotoUrl ? new Date().toLocaleTimeString('vi-VN') : undefined,
      status: 'pending',
    };

    StorageService.addReport(report);
    setIsReportOpen(false);
    setReportDescription('');
    setSelectedStudentForReport('');
    alert('Đã gửi báo cáo bất thường đến Quản trị viên (Admin) thành công!');
  };

  // Camera capture callback
  const handlePhotoCaptured = (imageDataUrl: string) => {
    StorageService.updateClass(currentClass.id, {
      currentRoomPhotoUrl: imageDataUrl,
      currentRoomPhotoTimestamp: new Date().toLocaleString('vi-VN'),
    });
    setReportPhotoUrl(imageDataUrl);
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-xs"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                {currentClass.code}
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">{currentClass.name}</h2>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-sky-600" />
              <span>{currentClass.locationName}</span>
              <span>•</span>
              <Clock className="h-3.5 w-3.5 text-sky-600" />
              <span>{currentClass.startTime} - {currentClass.endTime}</span>
              <span>•</span>
              <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                Ca học: {currentClass.periodsPerSession || 4} tiết (Tổng: {currentClass.totalPeriods || ((currentClass.credits || 3) * 15)} tiết)
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Strict Live Camera Capture Button */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 rounded-xl shadow-xs transition flex items-center gap-1.5"
            title="Mở camera thiết bị để chụp ảnh thực tế lớp học (chống gian lận)"
          >
            <Camera className="h-4 w-4" /> Chụp ảnh thực tế lớp
          </button>

          {/* Report to Admin Button */}
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5"
          >
            <AlertTriangle className="h-4 w-4 text-rose-600" /> Báo cáo bất thường
          </button>

          {/* End Class Early Button */}
          <button
            type="button"
            onClick={handleEndClassEarly}
            disabled={currentClass.liveSessionEndedEarly}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-xl transition flex items-center gap-1.5"
          >
            <StopCircle className="h-4 w-4 text-slate-500" />
            {currentClass.liveSessionEndedEarly ? 'Đã kết thúc sớm' : 'Kết thúc lớp sớm'}
          </button>
        </div>
      </div>

      {/* Control Strip & Live Room Photo Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Lecturer Self-Checkin & Geofence Anchor Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-sky-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  currentClass.isBreakActive ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'
                }`}
              ></span>
              <h3 className="font-bold text-slate-800 text-sm">Bảng Điều Khiển Ca Giảng Dạy</h3>
              {currentClass.isBreakActive && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  ☕ Đang nghỉ giải lao (GPS dừng quét)
                </span>
              )}
            </div>

            {/* Nút Tạm dừng lớp học / Tiếp tục lớp học ngay góc trên bên phải */}
            <div>
              {!currentClass.isBreakActive ? (
                <button
                  type="button"
                  onClick={handleToggleBreak}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  title="Cho phép lớp nghỉ giải lao đi ăn sáng, lấy nước (GPS sẽ ngừng quét hoàn toàn)"
                >
                  <Coffee className="h-3.5 w-3.5" /> Tạm dừng lớp học
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleBreak}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                  title="Tiếp tục lớp học, GPS sẽ lập tức quét lại và thông báo cho sinh viên ngoài phạm vi trong 5 phút"
                >
                  <Play className="h-3.5 w-3.5" /> Tiếp tục lớp học
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Lecturer Self Check-in box */}
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 flex flex-col justify-between">
              <div>
                <div className="text-slate-500 text-[11px] mb-1">Xác nhận điểm danh của giảng viên:</div>
                <div className="font-bold text-slate-800 text-sm">
                  {currentClass.lecturerSelfCheckedIn ? (
                    <div>
                      <span className="text-emerald-700 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Đã điểm danh ({currentClass.lecturerCheckInTime})
                      </span>
                      {currentClass.lecturerCheckInTimestamp && (() => {
                        const deadlineMinutes = currentClass.checkInDeadlineMinutes || 15;
                        const lecturerTime = new Date(currentClass.lecturerCheckInTimestamp).getTime();
                        const deadlineMs = lecturerTime + deadlineMinutes * 60 * 1000;
                        const deadlineDate = new Date(deadlineMs);
                        const deadlineTimeStr = `${deadlineDate.getHours().toString().padStart(2, '0')}:${deadlineDate
                          .getMinutes()
                          .toString()
                          .padStart(2, '0')}`;
                        const diffMs = Date.now() - lecturerTime;
                        const remainingMs = deadlineMs - Date.now();
                        const isExpired = remainingMs <= 0;
                        const remainingMin = Math.floor(remainingMs / 60000);
                        const remainingSec = Math.floor((remainingMs % 60000) / 1000);

                        return (
                          <div
                            className={`mt-2 p-2.5 rounded-xl border text-xs ${
                              isExpired
                                ? 'bg-rose-50 border-rose-200 text-rose-800'
                                : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}
                          >
                            <div className="font-semibold flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              <span>
                                Hạn chót sinh viên điểm danh: <strong>{deadlineTimeStr}</strong> (+{deadlineMinutes} phút)
                              </span>
                            </div>
                            <div className="text-[11px] mt-0.5">
                              {isExpired ? (
                                <span className="font-bold text-rose-700">ĐÃ HẾT HẠN ({deadlineMinutes} phút): Cổng điểm danh vào đã khóa</span>
                              ) : (
                                <span>
                                  Thời gian SV còn lại: <strong>{remainingMin > 0 ? `${remainingMin} phút ` : ''}{remainingSec}s</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div>
                      <span className="text-amber-700 flex items-center gap-1 font-bold">
                        <Clock className="h-4 w-4 text-amber-600 shrink-0" /> Chưa xác nhận
                      </span>
                      <p className="text-[11px] text-slate-500 font-normal mt-1">
                        Hạn chót điểm danh của sinh viên ({currentClass.checkInDeadlineMinutes || 15} phút) sẽ bắt đầu tính từ thời điểm giảng viên xác nhận điểm danh.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {!currentClass.lecturerSelfCheckedIn && (
                <button
                  type="button"
                  onClick={handleLecturerSelfCheckIn}
                  className="mt-3 w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Xác nhận điểm danh của tôi
                </button>
              )}
            </div>

            {/* Anchor GPS Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-slate-500 text-[11px] mb-1">Tâm điểm danh GPS lớp học:</div>
                <div className="font-bold text-slate-800 text-xs">
                  {currentClass.useLecturerLocation ? 'Vị trí quanh máy tính GV' : currentClass.locationName}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  ({(currentClass.activeAnchorLat || currentClass.latitude).toFixed(5)},{' '}
                  {(currentClass.activeAnchorLng || currentClass.longitude).toFixed(5)})
                </div>
              </div>

              <button
                type="button"
                onClick={handleSyncLecturerGps}
                className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Compass className="h-3.5 w-3.5" /> Lấy vị trí GV làm tâm điểm danh
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-slate-400 text-[10px]">Sĩ số lớp</div>
              <div className="font-bold text-slate-800 text-base">{totalStudents}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="text-emerald-700 text-[10px]">Đã vào lớp</div>
              <div className="font-bold text-emerald-800 text-base">{checkedInCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <div className="text-amber-700 text-[10px]">Xin về sớm</div>
              <div className="font-bold text-amber-800 text-base">{earlyLeaveRequests.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
              <div className="text-rose-700 text-[10px]">Bất thường GPS</div>
              <div className="font-bold text-rose-800 text-base">{anomalyCount}</div>
            </div>
          </div>
        </div>

        {/* Live Classroom Photo Snapshot Card */}
        <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-sky-600" /> Ảnh Thực Tế Lớp Học
              </h3>
              <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                Camera Live
              </span>
            </div>

            {currentClass.currentRoomPhotoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
                <img
                  src={currentClass.currentRoomPhotoUrl}
                  alt="Ảnh thực tế lớp học"
                  className="w-full h-36 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-lg shadow-md"
                  >
                    Chụp lại ảnh mới
                  </button>
                </div>
                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                  {currentClass.currentRoomPhotoTimestamp}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-sky-200 rounded-2xl p-6 text-center text-slate-400 bg-sky-50/20">
                <Camera className="h-8 w-8 mx-auto mb-2 text-sky-400 opacity-60" />
                <p className="text-xs font-medium text-slate-600">Chưa có ảnh chụp thực tế</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Chỉ cho phép mở camera chụp trực tiếp, không cho tải ảnh lên
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="mt-3 w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl border border-sky-200 transition flex items-center justify-center gap-1.5"
          >
            <Camera className="h-3.5 w-3.5" />
            {currentClass.currentRoomPhotoUrl ? 'Chụp cập nhật ảnh mới' : 'Chụp ảnh xác thực lớp ngay'}
          </button>
        </div>
      </div>

      {/* Early Leave Approval Section (if any requests) */}
      {earlyLeaveRequests.length > 0 && (
        <div className="bg-amber-50/80 rounded-3xl p-6 border border-amber-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-amber-900 text-sm">
                Yêu Cầu Xin Về Sớm Cần Duyệt ({earlyLeaveRequests.length})
              </h3>
            </div>
            <span className="text-xs text-amber-700 font-medium">Giảng viên phê duyệt hoặc từ chối</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {earlyLeaveRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        {req.studentName} ({req.studentCode})
                      </div>
                      <div className="text-[11px] text-slate-500">Giờ xin ra: {req.checkOutTime}</div>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Chờ duyệt
                    </span>
                  </div>

                  <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700">
                    <strong>Lý do:</strong> {req.earlyLeaveReason}
                  </div>
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleApproveEarlyLeave(req, false)}
                    className="flex-1 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveEarlyLeave(req, true)}
                    className="flex-1 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
                  >
                    Chấp thuận
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave Requests Review Section (Đơn xin phép vắng học của sinh viên) */}
      {classLeaveRequests.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-sky-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Đơn Xin Phép Vắng Học Của Sinh Viên ({classLeaveRequests.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Chấp thuận (tính vắng 1/2 số tiết) • Từ chối (đến lớp tính Chậm, không đến tính vắng 100% tiết)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {classLeaveRequests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        {req.studentName} ({req.studentCode})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Ngày xin nghỉ: <strong className="text-slate-800">{req.leaveDate}</strong> ({req.periodsPerSession || 4} tiết)
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status === 'approved'
                        ? 'Đã duyệt (Vắng 1/2 tiết)'
                        : req.status === 'rejected'
                        ? 'Từ chối (Vắng 100% nếu không đến)'
                        : 'Chờ duyệt'}
                    </span>
                  </div>

                  <div className="text-xs bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700">
                    <strong>Lý do xin nghỉ:</strong> {req.reason}
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>Nộp lúc: {req.submittedAt}</span>
                    {req.lecturerReviewedAt && <span>Đã duyệt lúc: {req.lecturerReviewedAt}</span>}
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleReviewLeaveRequest(req.id, 'rejected')}
                      className="flex-1 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                    >
                      Không đồng ý
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewLeaveRequest(req.id, 'approved')}
                      className="flex-1 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition cursor-pointer"
                    >
                      Đồng ý (Vắng 1/2 tiết)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Student Attendance List Table */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-sky-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-600" /> Danh Sách Sinh Viên Lớp Học ({classStudents.length})
            </h3>
            <p className="text-xs text-slate-500">
              Theo dõi chi tiết thời gian vào, vị trí khoảng cách GPS, và lý do xin về
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => ExcelHelper.exportAttendanceReport(classAttendanceToday, currentClass.name)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Xuất file Excel
            </button>
            <button
              type="button"
              onClick={handleOpenAddStudentModal}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" /> Thêm SV vào lớp & Điểm danh giúp
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">STT</th>
                <th className="py-3 px-4">Mã SV</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Giờ vào</th>
                <th className="py-3 px-4">Khoảng cách GPS</th>
                <th className="py-3 px-4">Vị trí hợp lệ?</th>
                <th className="py-3 px-4">Giờ ra</th>
                <th className="py-3 px-4">Lý do xin về</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classStudents.map((student, idx) => {
                const att = classAttendanceToday.find((r) => r.studentId === student.id);
                return (
                  <tr key={student.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-800">{student.studentCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{student.fullName}</td>
                    <td className="py-3 px-4 font-mono">
                      {att?.checkInTime ? (
                        <span className="font-bold text-slate-800">{att.checkInTime}</span>
                      ) : (
                        <span className="text-slate-400">Chưa vào</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {att?.checkInDistanceMeters !== undefined ? (
                        <span>{att.checkInDistanceMeters}m</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {att?.checkInTime ? (
                        att.checkInWithinRadius ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Hợp lệ (&le;{currentClass.radiusMeters}m)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            <XCircle className="h-3 w-3" /> Ngoài bán kính
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-[11px]">Chưa kiểm tra</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">{att?.checkOutTime || '-'}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {att?.earlyLeaveReason || '-'}
                    </td>
                    <td className="py-3 px-4">
                      {att?.checkInTime ? (
                        att.finalStatus === 'present' ? (
                          <span className="font-bold text-[11px] text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            Có mặt
                          </span>
                        ) : att.finalStatus === 'late' ? (
                          <span className="font-bold text-[11px] text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                            Đi muộn
                          </span>
                        ) : att.finalStatus === 'early_exit' ? (
                          <span
                            className={`font-bold text-[11px] px-2.5 py-0.5 rounded-full ${
                              att.notes?.includes('Bỏ về sớm') || att.isLeftDuringClass
                                ? 'text-rose-800 bg-rose-100 border border-rose-200'
                                : 'text-indigo-800 bg-indigo-100'
                            }`}
                          >
                            {att.notes?.includes('Bỏ về sớm') || att.isLeftDuringClass ? 'Bỏ về sớm' : 'Về sớm'}
                          </span>
                        ) : (
                          <span className="font-bold text-[11px] text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">
                            Gian lận
                          </span>
                        )
                      ) : att?.finalStatus === 'dropped' ? (
                        <span className="font-bold text-[11px] text-red-900 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full">
                          Bỏ học
                        </span>
                      ) : (
                        <span className="font-semibold text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Vắng
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {att?.checkInTime ? (
                        <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Đã điểm danh
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenAssistForExistingStudent(student)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-[11px] transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          title="Điểm danh giúp cho sinh viên này"
                        >
                          <Clock className="h-3 w-3 text-amber-600" /> Điểm danh giúp
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strict Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCaptured}
        title="Chụp ảnh thực tế lớp học (Bắt buộc Camera)"
        classNameInfo={`${currentClass.name} - ${currentClass.code}`}
      />

      {/* Modal: Add student from Admin list & Attendance Assist */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-sky-100 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-sky-50 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-100 text-sky-600 rounded-xl">
                  {isAssistingExistingStudent ? <Clock className="h-5 w-5 text-amber-600" /> : <UserPlus className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {isAssistingExistingStudent
                      ? 'Điểm Danh Giúp Cho Sinh Viên'
                      : 'Thêm Sinh Viên & Điểm Danh Giúp'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isAssistingExistingStudent
                      ? `Hỗ trợ điểm danh cho: ${selectedStudentToAdd?.fullName} (${selectedStudentToAdd?.studentCode || selectedStudentToAdd?.username})`
                      : 'Chọn sinh viên có sẵn trong hệ thống do Admin tạo • Cấu hình điểm danh giúp'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAddStudentAndAssist} className="space-y-4 text-xs">
              {/* Important Admin Rule Banner */}
              {!isAssistingExistingStudent && (
                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-amber-800">Quy chế hệ thống:</strong> Chỉ <strong>Admin</strong> mới có quyền thêm mới hoàn toàn thông tin của giảng viên và sinh viên. Giảng viên chỉ được thêm sinh viên trong danh sách có sẵn do Admin đã tạo.
                  </div>
                </div>
              )}

              {/* Student Search & Auto-Suggest (If adding a student) */}
              {!isAssistingExistingStudent && (
                <div className="relative">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tìm kiếm sinh viên có sẵn do Admin tạo *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={studentSearchInput}
                      onChange={(e) => {
                        setStudentSearchInput(e.target.value);
                        setIsSuggestionsOpen(true);
                        if (selectedStudentToAdd) {
                          setSelectedStudentToAdd(null);
                        }
                      }}
                      onFocus={() => setIsSuggestionsOpen(true)}
                      placeholder="Gõ tìm Mã SV, Họ tên, Khóa, Lớp (A1, A2, A3...)..."
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium text-xs"
                      required={!selectedStudentToAdd}
                    />
                    {studentSearchInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setStudentSearchInput('');
                          setSelectedStudentToAdd(null);
                          setIsSuggestionsOpen(false);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Suggestions Dropdown */}
                  {isSuggestionsOpen && studentSearchInput.trim() && !selectedStudentToAdd && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-sky-200 shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {matchingStudents.length > 0 ? (
                        matchingStudents.map((st) => (
                            <div
                              key={st.id}
                              onClick={() => handleSelectStudentSuggestion(st)}
                              className="p-3 hover:bg-sky-50 transition cursor-pointer flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  {st.fullName.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-800 text-xs truncate">
                                    {st.fullName}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                                      {st.studentCode || st.username}
                                    </span>
                                    {st.className && (
                                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                                        Lớp {st.className}
                                      </span>
                                    )}
                                    {st.courseYear && (
                                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                                        Khóa {st.courseYear}
                                      </span>
                                    )}
                                    {st.email && (
                                      <span className="text-slate-400 truncate max-w-[120px]">
                                        {st.email}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[11px] text-sky-700 font-bold shrink-0 bg-sky-100 hover:bg-sky-200 px-2.5 py-1 rounded-lg transition">
                                Chọn ↵
                              </span>
                            </div>
                          ))
                      ) : (
                        <div className="p-3 text-center text-xs text-rose-600 bg-rose-50/60 font-medium">
                          Không tìm thấy sinh viên nào khớp trong danh sách do Admin tạo. Giảng viên chỉ được thêm sinh viên đã có sẵn!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Display full student details populated from admin */}
              {selectedStudentToAdd && (
                <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Thông tin sinh viên (từ danh sách Admin):
                    </span>
                    {!isAssistingExistingStudent && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentToAdd(null);
                          setStudentSearchInput('');
                          setIsSuggestionsOpen(true);
                        }}
                        className="text-[10px] text-sky-700 hover:underline font-bold cursor-pointer"
                      >
                        Đổi sinh viên khác
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-xl border border-sky-100">
                      <span className="text-slate-400 block text-[10px]">Mã sinh viên</span>
                      <strong className="text-sky-900 font-mono">{selectedStudentToAdd.studentCode || selectedStudentToAdd.username}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-sky-100">
                      <span className="text-slate-400 block text-[10px]">Họ và tên</span>
                      <strong className="text-slate-800">{selectedStudentToAdd.fullName}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-sky-100">
                      <span className="text-slate-400 block text-[10px]">Khóa học</span>
                      <span className="text-slate-700 font-semibold">{selectedStudentToAdd.courseYear ? `Khóa ${selectedStudentToAdd.courseYear}` : 'Chưa có'}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-sky-100">
                      <span className="text-slate-400 block text-[10px]">Lớp sinh hoạt</span>
                      <span className="text-slate-700 font-semibold">{selectedStudentToAdd.className ? `Lớp ${selectedStudentToAdd.className}` : 'Chưa có'}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-sky-100 col-span-2">
                      <span className="text-slate-400 block text-[10px]">Email & Số điện thoại</span>
                      <span className="text-slate-700">{selectedStudentToAdd.email} {selectedStudentToAdd.phoneNumber ? `• ${selectedStudentToAdd.phoneNumber}` : ''}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance Assist Section */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-sky-600" /> LỰA CHỌN ĐIỂM DANH GIÚP *
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Hỗ trợ điểm danh ca hôm nay</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssistAttendanceType('on_time')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      assistAttendanceType === 'on_time'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Đúng giờ</span>
                      <CheckCircle2 className={`h-4 w-4 ${assistAttendanceType === 'on_time' ? 'text-emerald-600' : 'text-slate-300'}`} />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">Trong hạn quy định</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssistAttendanceType('late')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      assistAttendanceType === 'late'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Đi muộn</span>
                      <Clock className={`h-4 w-4 ${assistAttendanceType === 'late' ? 'text-amber-600' : 'text-slate-300'}`} />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">Quá hạn đúng giờ</span>
                  </button>

                  {!isAssistingExistingStudent && (
                    <button
                      type="button"
                      onClick={() => setAssistAttendanceType('none')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        assistAttendanceType === 'none'
                          ? 'bg-slate-200/80 border-slate-400 text-slate-900 ring-2 ring-slate-400/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">Không điểm danh</span>
                        <XCircle className={`h-4 w-4 ${assistAttendanceType === 'none' ? 'text-slate-600' : 'text-slate-300'}`} />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">Chỉ thêm vào lớp</span>
                    </button>
                  )}
                </div>

                {/* Sub-config for Đúng giờ */}
                {assistAttendanceType === 'on_time' && (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                    <div className="text-[11px] text-emerald-900">
                      <strong>Quy định Đúng giờ:</strong> Giảng viên phải ghi rõ thời gian từ lúc giảng viên bắt đầu điểm danh (<strong>{sessionStartTime}</strong>) tới lúc muộn nhất (<strong>{maxOnTime}</strong>).
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-emerald-800 mb-0.5">
                          Thời gian điểm danh đúng giờ (HH:mm)
                        </label>
                        <input
                          type="time"
                          min={sessionStartTime}
                          max={maxOnTime}
                          value={customOnTime}
                          onChange={(e) => setCustomOnTime(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white font-mono font-bold text-xs text-emerald-950"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1 pt-3.5">
                        <div className="flex gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setCustomOnTime(sessionStartTime)}
                            className="px-2 py-1 bg-white border border-emerald-300 rounded-md text-emerald-800 font-semibold hover:bg-emerald-100 cursor-pointer"
                          >
                            Bắt đầu ({sessionStartTime})
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomOnTime(maxOnTime)}
                            className="px-2 py-1 bg-white border border-emerald-300 rounded-md text-emerald-800 font-semibold hover:bg-emerald-100 cursor-pointer"
                          >
                            Hạn chót ({maxOnTime})
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-config for Đi muộn */}
                {assistAttendanceType === 'late' && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                    {!isClassFinishedNow() ? (
                      <div className="space-y-1.5">
                        <div className="text-[11px] text-amber-900 font-medium">
                          ⚡ <strong>Chưa hết thời gian học:</strong> Tiết học kết thúc lúc <strong>{currentClass.endTime}</strong>. Hệ thống sẽ <strong>lấy luôn thời gian lúc giảng viên nhập xong thông tin nhấn xác nhận</strong> làm giờ vào của sinh viên.
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-amber-900 font-mono text-xs flex items-center justify-between">
                          <span>Thời gian ghi nhận ước tính:</span>
                          <strong className="text-amber-800 text-sm">~{new Date().toLocaleTimeString('vi-VN')}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-[11px] text-rose-800">
                          ⚠️ <strong>Đã hết thời gian quy định tiết học</strong> (kết thúc lúc <strong>{currentClass.endTime}</strong>): Bạn phải chọn trong khoảng thời gian từ lúc muộn (<strong>{maxOnTime}</strong>) đến lúc hết tiết (<strong>{currentClass.endTime}</strong>).
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] font-semibold text-amber-800 mb-0.5">
                              Thời gian đi muộn (HH:mm)
                            </label>
                            <input
                              type="time"
                              min={maxOnTime}
                              max={currentClass.endTime}
                              value={customLateTime}
                              onChange={(e) => setCustomLateTime(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white font-mono font-bold text-xs text-amber-950"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1 pt-3.5">
                            <div className="flex gap-1 text-[10px]">
                              <button
                                type="button"
                                onClick={() => setCustomLateTime(maxOnTime)}
                                className="px-2 py-1 bg-white border border-amber-300 rounded-md text-amber-800 font-semibold hover:bg-amber-100 cursor-pointer"
                              >
                                Bắt đầu muộn ({maxOnTime})
                              </button>
                              <button
                                type="button"
                                onClick={() => setCustomLateTime(currentClass.endTime)}
                                className="px-2 py-1 bg-white border border-amber-300 rounded-md text-amber-800 font-semibold hover:bg-amber-100 cursor-pointer"
                              >
                                Hết tiết ({currentClass.endTime})
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedStudentToAdd}
                  className={`px-5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                    selectedStudentToAdd
                      ? 'bg-sky-600 hover:bg-sky-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="h-4 w-4" />
                  {isAssistingExistingStudent
                    ? 'Xác nhận điểm danh giúp'
                    : 'Xác nhận thêm vào lớp & Điểm danh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Report Anomaly to Admin */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-50 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Báo Cáo Bất Thường Cho Admin</h3>
                  <p className="text-xs text-slate-500">Xử lý gian lận GPS, vắng mặt không lý do hoặc bỏ về sớm</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Loại sự cố / hành vi vi phạm *</label>
                <select
                  value={reportIssueType}
                  onChange={(e) => setReportIssueType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="gps_fraud">Hành vi gian lận định vị GPS (Điểm danh hộ ngoài phạm vi)</option>
                  <option value="unexcused_absence">Vắng mặt không lý do / Trốn tiết</option>
                  <option value="early_walkout">Tự ý bỏ về sớm không có lý do</option>
                  <option value="classroom_issue">Sự cố kỹ thuật tại phòng học</option>
                  <option value="other">Vấn đề khác</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sinh viên vi phạm (nếu có)</label>
                <select
                  value={selectedStudentForReport}
                  onChange={(e) => setSelectedStudentForReport(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- Toàn bộ lớp / Không chỉ định cụ thể --</option>
                  {classStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.studentCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nội dung mô tả sự việc chi tiết *</label>
                <textarea
                  rows={3}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Mô tả cụ thể hành vi hoặc tình hình lớp học thực tế để Admin có biện pháp kỷ luật..."
                  className="w-full p-3 rounded-xl border border-slate-300"
                  required
                />
              </div>

              {/* Live Photo Attachment Preview */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hình ảnh thực tế đính kèm (từ Camera)
                </label>
                {reportPhotoUrl ? (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <img src={reportPhotoUrl} alt="Ảnh thực tế" className="w-16 h-12 object-cover rounded-lg" />
                    <div className="text-[11px] text-slate-600">
                      <div className="font-semibold text-emerald-700">✓ Đã đính kèm ảnh camera lớp học</div>
                      <div>Thời gian: {currentClass.currentRoomPhotoTimestamp || 'Vừa chụp'}</div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="w-full py-2 bg-sky-50 text-sky-700 rounded-xl border border-dashed border-sky-300 font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Camera className="h-4 w-4" /> Bật camera chụp ảnh hiện trường đính kèm
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" /> Gửi báo cáo cho Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Adjustment Modal (khi Giảng viên điểm danh ngoài thời gian quy định) */}
      {isAdjustScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-amber-200">
            <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Điểm Danh Ngoài Giờ Quy Định</h3>
                  <p className="text-xs text-amber-700">Yêu cầu ghi lý do và điều chỉnh thời gian ca học mới</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmScheduleAdjustment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 leading-relaxed font-sans">
                📢 <strong>Quy định giảng dạy:</strong> Hiện tại bạn đang điểm danh ngoài khung giờ quy định của môn học (Khung giờ gốc: <strong>{currentClass.startTime} - {currentClass.endTime}</strong>).
                Sau khi nhập lý do và thời gian mới, môn học này sẽ được <strong>tự động cập nhật đồng bộ trên cả giao diện Admin và Sinh viên</strong>, đồng thời gửi thông báo thay đổi thời gian học về cho Admin.
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lý do điểm danh ngoài giờ / thay đổi thời gian học *
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Ví dụ: Học bù do nghỉ lễ, chuyển phòng máy, giảng viên kẹt xe xin dời ca..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Thời gian bắt đầu mới *
                  </label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Thời gian kết thúc mới *
                  </label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustScheduleModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  Xác nhận & Cập nhật lịch học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm End Class Early */}
      {isEndEarlyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-sky-100 space-y-4 my-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-2xl">
                <StopCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  Xác nhận kết thúc lớp học sớm
                </h3>
                <p className="text-xs text-slate-500">
                  Lớp: {currentClass.name} ({currentClass.code})
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-bold text-slate-800 text-sm">
                Bạn có muốn kết thúc lớp học sớm?
              </p>
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-rose-900 leading-relaxed">
                ⚠️ <strong>Lưu ý quan trọng:</strong> Khi xác nhận kết thúc lớp sớm, mặc định những người không đến điểm danh và không có lý do xin nghỉ gửi về hệ thống sẽ được tính là <strong>"Bỏ học"</strong>.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEndEarlyModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs cursor-pointer transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmEndEarly}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Center Notification (nền trắng chữ đen / đỏ theo quy chuẩn) */}
      <CenterNotification
        notification={centerNotification}
        onClose={() => setCenterNotification(null)}
      />
    </div>
  );
};
