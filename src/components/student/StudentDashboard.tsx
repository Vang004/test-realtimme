import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  LogOut,
  LogIn,
  Send,
  Calendar,
  Sparkles,
  ShieldCheck,
  FileText,
  Navigation,
  RefreshCw,
  LocateFixed,
  AlertTriangle,
  Trash2,
  ChevronDown,
  X,
  Coffee,
  BookOpen,
  Plus,
  Building,
  Search,
  Users,
} from 'lucide-react';
import { User as UserType, ClassRoom, AttendanceRecord, LeaveRequest } from '../../types';
import { StorageService, calculateDistanceMeters } from '../../services/storage';
import { ConfirmModal } from '../common/ConfirmModal';
import { CenterNotification, CenterNotificationState } from '../common/CenterNotification';
import { RoomCapacityWarningModal } from '../common/RoomCapacityWarningModal';
import { RegistrationSuccessModal } from '../common/RegistrationSuccessModal';
import { TrashManagementModal } from '../common/TrashManagementModal';

interface StudentDashboardProps {
  currentUser: UserType;
  classes: ClassRoom[];
  attendanceRecords: AttendanceRecord[];
  onRefreshData: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  classes,
  attendanceRecords,
  onRefreshData,
}) => {
  // Confirm modal state
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
  // Real device hardware GPS states
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastGpsUpdate, setLastGpsUpdate] = useState<string>('');

  const [earlyLeaveReason, setEarlyLeaveReason] = useState('');
  const [showEarlyLeaveModal, setShowEarlyLeaveModal] = useState(false);
  const [selectedClassForLeave, setSelectedClassForLeave] = useState<ClassRoom | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [selectedAttendanceDetail, setSelectedAttendanceDetail] = useState<AttendanceRecord | null>(null);

  // Leave Request Modal state (Xin phép vắng học)
  const [showLeaveRequestModal, setShowLeaveRequestModal] = useState(false);
  const [selectedClassForLeaveRequest, setSelectedClassForLeaveRequest] = useState<ClassRoom | null>(null);
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');

  // Course registration modal state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollSearchTerm, setEnrollSearchTerm] = useState('');

  // Trash modal state for un-enrolled classes
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

  // Registration success modal state
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Count un-enrolled classes currently stored in Trash for this student
  const unrolledCount = React.useMemo(() => {
    return StorageService.getTrash().filter(
      (t) => t.type === 'student_enrollment' && (!t.deletedByUserId || t.deletedByUserId === currentUser.id)
    ).length;
  }, [classes, isTrashModalOpen, currentUser.id]);

  // Handle student enrolling in an available class
  const handleEnrollInClass = (targetClass: ClassRoom) => {
    const campusRooms = StorageService.getCampusRooms();
    const matchedRoom = campusRooms.find(
      (r) => r.name.toLowerCase() === targetClass.locationName.toLowerCase() || r.id === targetClass.locationName
    );
    const roomCapacity = matchedRoom?.capacity || 60;
    const newStudentCount = targetClass.studentIds.length + 1;

    const performEnroll = () => {
      const updatedStudentIds = Array.from(new Set([...targetClass.studentIds, currentUser.id]));
      StorageService.updateClass(targetClass.id, { studentIds: updatedStudentIds });
      onRefreshData();
      setIsEnrollModalOpen(false);
      setIsSuccessModalOpen(true);
    };

    // Kiểm tra sức chứa phòng: "phòng có sức chứa 90 sinh viên mà học viên/quản trị viên chọn danh sách 91 người thì phải hiện..."
    if (newStudentCount > roomCapacity) {
      setCapacityConfirmModal({
        isOpen: true,
        roomName: targetClass.locationName,
        roomCapacity,
        studentCount: newStudentCount,
        onConfirm: () => {
          setCapacityConfirmModal((prev) => ({ ...prev, isOpen: false }));
          performEnroll();
        },
      });
      return;
    }

    performEnroll();
  };

  // Live timer tick to update remaining deadline minutes in real-time
  const [, setTimeTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter classes student belongs to
  const myClasses = classes.filter((c) => c.studentIds.includes(currentUser.id));

  // Today attendance for this student
  const myAttendanceToday = attendanceRecords.filter(
    (r) => r.studentId === currentUser.id && r.date === todayStr
  );

  // Initialize and watch real hardware GPS
  const requestRealGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsError('Thiết bị hoặc trình duyệt không hỗ trợ Geolocation GPS phần cứng.');
      setGpsLoading(false);
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLat(pos.coords.latitude);
        setCurrentLng(pos.coords.longitude);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setLastGpsUpdate(new Date().toLocaleTimeString('vi-VN'));
        setGpsLoading(false);
        setGpsError(null);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsError('Bạn chưa cấp quyền vị trí GPS. Vui lòng cho phép quyền định vị trong cài đặt trình duyệt để điểm danh!');
        } else {
          setGpsError(`Không thể bắt sóng GPS thực tế: ${err.message}. Hãy di chuyển ra khu vực thông thoáng và thử lại.`);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    requestRealGps();

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCurrentLat(pos.coords.latitude);
          setCurrentLng(pos.coords.longitude);
          setGpsAccuracy(Math.round(pos.coords.accuracy));
          setLastGpsUpdate(new Date().toLocaleTimeString('vi-VN'));
          setGpsError(null);
        },
        (err) => {
          console.warn('GPS Watch warning:', err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // 1-minute GPS continuous scan & Out-of-bounds tracking & Auto end-of-class finish
  useEffect(() => {
    const scanInterval = setInterval(() => {
      // 1. Request fresh GPS coordinates
      requestRealGps();

      const now = new Date();
      const currentTotalMin = now.getHours() * 60 + now.getMinutes();

      myClasses.forEach((cls) => {
        // RULE: Trong lúc nghỉ giải lao "Tạm dừng lớp học", GPS sẽ NGỪNG QUÉT HOÀN TOÀN!
        if (cls.isBreakActive) {
          return;
        }

        const [startH, startM] = (cls.startTime || '08:00').split(':').map(Number);
        const [endH, endM] = (cls.endTime || '11:30').split(':').map(Number);
        const startMin = startH * 60 + startM;
        const endMin = endH * 60 + endM;

        const att = myAttendanceToday.find((r) => r.classId === cls.id);

        // Auto Finish: Khi kết thúc thời gian học toàn bộ hệ thống của sinh viên tự động xác nhận kết thúc lớp học
        if (currentTotalMin >= endMin || cls.liveSessionEndedEarly) {
          if (att && att.checkInTime && (!att.checkOutTime || att.checkOutStatus === 'pending_approval')) {
            StorageService.handleClassEndTimeAutoFinish(cls, todayStr, currentLat, currentLng);
            onRefreshData();
          }
          return;
        }

        // During class hours:
        if (currentTotalMin >= startMin && currentTotalMin < endMin) {
          if (att && att.checkInTime) {
            const leaveRequests = StorageService.getLeaveRequests();
            const hasApprovedLeave =
              att.earlyLeaveApproved ||
              leaveRequests.some(
                (lr) =>
                  lr.classId === cls.id &&
                  lr.studentId === currentUser.id &&
                  lr.leaveDate === todayStr &&
                  lr.status === 'approved'
              );

            if (currentLat !== null && currentLng !== null) {
              const targetLat = cls.useLecturerLocation && cls.activeAnchorLat ? cls.activeAnchorLat : cls.latitude;
              const targetLng = cls.useLecturerLocation && cls.activeAnchorLng ? cls.activeAnchorLng : cls.longitude;
              const distance = calculateDistanceMeters(currentLat, currentLng, targetLat, targetLng);

              // Check if class recently resumed from break
              if (cls.resumedAt) {
                const resumeTime = new Date(cls.resumedAt).getTime();
                const diffSeconds = Math.floor((Date.now() - resumeTime) / 1000);
                if (diffSeconds <= 300 && distance > cls.radiusMeters) {
                  // Student outside radius: alert them to return
                  const remSec = Math.max(0, 300 - diffSeconds);
                  const remMin = Math.floor(remSec / 60);
                  const remS = remSec % 60;
                  setCenterNotification({
                    id: `resume_warn_${cls.id}_${Math.floor(diffSeconds / 20)}`,
                    message: `Lớp học đã tiếp tục, vui lòng quay trở lại lớp học trong thời gian quy định! (Còn lại: ${remMin}:${remS.toString().padStart(2, '0')})`,
                    type: 'error',
                    durationMs: 6000,
                  });
                } else if (diffSeconds > 300 && distance > cls.radiusMeters && !hasApprovedLeave) {
                  // After 5 minutes grace period expired and student still outside:
                  StorageService.reportStudentLeftClass(currentUser, cls, distance);
                }
              } else if (distance > cls.radiusMeters && !hasApprovedLeave) {
                // Left bounds during normal class without approved leave:
                StorageService.reportStudentLeftClass(currentUser, cls, distance);
              }
            }
          }
        }
      });
    }, 60000); // Quét liên tục 1 phút 1 lần

    return () => clearInterval(scanInterval);
  }, [currentLat, currentLng, myClasses, myAttendanceToday, todayStr]);

  // Open Leave Request Modal (có thể nộp bất cứ lúc nào, trong bất kỳ thời điểm nào)
  const handleOpenLeaveRequestModal = (cls: ClassRoom) => {
    setSelectedClassForLeaveRequest(cls);
    setLeaveDate(new Date().toISOString().split('T')[0]);
    setLeaveReason('');
    setShowLeaveRequestModal(true);
  };

  // Submit Leave Request
  const handleSubmitLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForLeaveRequest) return;
    if (!leaveReason.trim()) {
      alert('Vui lòng ghi rõ lý do xin nghỉ');
      return;
    }
    if (!leaveDate) {
      alert('Vui lòng chọn ngày xin nghỉ');
      return;
    }

    const newLeave: LeaveRequest = {
      id: `leave_${selectedClassForLeaveRequest.id}_${currentUser.id}_${Date.now()}`,
      studentId: currentUser.id,
      studentCode: currentUser.studentCode || currentUser.username,
      studentName: currentUser.fullName,
      classId: selectedClassForLeaveRequest.id,
      className: selectedClassForLeaveRequest.name,
      classCode: selectedClassForLeaveRequest.code,
      periodsPerSession: selectedClassForLeaveRequest.periodsPerSession || 4,
      leaveDate,
      reason: leaveReason.trim(),
      submittedAt: new Date().toLocaleString('vi-VN'),
      status: 'pending',
      absentPeriodsCount: 0,
    };

    const result = StorageService.addLeaveRequest(newLeave);
    if (!result.success) {
      alert(result.message || 'Mỗi sinh viên chỉ có thể gửi giấy xin phép vắng học một lần cho cùng môn học và cùng ngày!');
      return;
    }

    onRefreshData();
    setShowLeaveRequestModal(false);
    setCenterNotification({
      id: `leave_sub_${Date.now()}`,
      message: `Đã nộp đơn xin phép vắng học ngày ${leaveDate} môn "${selectedClassForLeaveRequest.name}" đến Giảng viên và Admin thành công!`,
      type: 'normal',
      durationMs: 5000,
    });
  };

  // Handle student check-in
  const handleCheckIn = (cls: ClassRoom) => {
    setStatusFeedback(null);

    // Require real GPS
    if (currentLat === null || currentLng === null) {
      setStatusFeedback({
        type: 'error',
        message: 'LỖI GPS: Chưa xác định được tọa độ vị trí thực tế của thiết bị. Vui lòng bật định vị GPS và nhấn "Cập nhật GPS thiết bị"!',
      });
      return;
    }

    // Determine target location: use live lecturer location if active, otherwise class fixed coords
    const targetLat = cls.useLecturerLocation && cls.activeAnchorLat ? cls.activeAnchorLat : cls.latitude;
    const targetLng = cls.useLecturerLocation && cls.activeAnchorLng ? cls.activeAnchorLng : cls.longitude;

    const distance = calculateDistanceMeters(currentLat, currentLng, targetLat, targetLng);
    const isWithinRadius = distance <= cls.radiusMeters;

    if (!isWithinRadius) {
      setStatusFeedback({
        type: 'error',
        message: `ĐIỂM DANH THẤT BẠI: Bạn đang cách vị trí lớp học ${distance}m (Vượt quá bán kính cho phép ${cls.radiusMeters}m). Theo quy định, sinh viên bắt buộc phải có mặt tại khuôn viên lớp học mới được điểm danh!`,
      });
      return;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    // Check if class has already ended for today
    const [endH, endM] = cls.endTime.split(':').map(Number);
    const endMinutes = endH * 60 + endM;
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    if (currentTotalMinutes > endMinutes) {
      setStatusFeedback({
        type: 'error',
        message: `KHÓA ĐIỂM DANH: Ca học đã kết thúc vào lúc ${cls.endTime}. Cổng điểm danh vào đã đóng!`,
      });
      return;
    }

    // RULE: Sinh viên điểm danh trong khung giờ ca học.
    // Nếu điểm danh chậm hơn giảng viên trong thời gian cài đặt sẵn trước đó (diffMinutes <= deadlineMinutes) => VẪN TÍNH LÀ ĐI ĐÚNG GIỜ!
    // Nếu chậm hơn giảng viên quá thời gian cài đặt sẵn (> deadlineMinutes) => TÍNH LÀ ĐI MUỘN.
    const deadlineMinutes = cls.checkInDeadlineMinutes || 15;
    let isLate = false;

    if (cls.lecturerSelfCheckedIn && cls.lecturerCheckInTimestamp) {
      const lecturerTime = new Date(cls.lecturerCheckInTimestamp).getTime();
      const diffMs = now.getTime() - lecturerTime;
      const diffMinutes = diffMs / (60 * 1000);

      if (diffMinutes > deadlineMinutes) {
        isLate = true;
      } else {
        isLate = false; // Đúng giờ!
      }
    }

    const newRecord: AttendanceRecord = {
      id: `att_${cls.id}_${currentUser.id}_${todayStr}`,
      classId: cls.id,
      studentId: currentUser.id,
      studentCode: currentUser.studentCode || '',
      studentName: currentUser.fullName,
      date: todayStr,
      checkInTime: timeStr,
      checkInStatus: isLate ? 'late' : 'on_time',
      checkInLatitude: currentLat,
      checkInLongitude: currentLng,
      checkInDistanceMeters: distance,
      checkInWithinRadius: true,
      finalStatus: isLate ? 'late' : 'present',
    };

    StorageService.recordAttendance(newRecord);

    // If student checked in late, automatically dispatch [ĐI CHẬM] notification to Admin
    if (isLate) {
      StorageService.recordLateAttendance(
        currentUser,
        cls,
        timeStr,
        `Điểm danh muộn quá ${deadlineMinutes} phút sau khi giảng viên đã có mặt tại lớp (${cls.lecturerCheckInTime})`
      );
    }

    onRefreshData();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    setStatusFeedback({
      type: 'success',
      message: isLate
        ? `ĐIỂM DANH VÀO THÀNH CÔNG! Khoảng cách GPS thực: ${distance}m (Hợp lệ). Giờ vào: ${timeStr} (Ghi nhận: Đi muộn - quá ${deadlineMinutes} phút quy định).`
        : `ĐIỂM DANH VÀO ĐÚNG GIỜ THÀNH CÔNG! Khoảng cách GPS thực: ${distance}m (Hợp lệ). Giờ vào: ${timeStr} (Đúng giờ).`,
    });
  };

  const handleOpenEarlyLeave = (cls: ClassRoom) => {
    setSelectedClassForLeave(cls);
    setEarlyLeaveReason('');
    setShowEarlyLeaveModal(true);
  };

  // Handle student check-out
  const handleCheckOut = (cls: ClassRoom, isForcedEarly: boolean = false) => {
    setStatusFeedback(null);
    const existing = myAttendanceToday.find((r) => r.classId === cls.id);

    if (!existing || !existing.checkInTime) {
      setStatusFeedback({
        type: 'error',
        message: 'Bạn chưa điểm danh vào lớp học này nên không thể điểm danh ra.',
      });
      return;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    // Check if checking out before scheduled end time
    const [endH, endM] = cls.endTime.split(':').map(Number);
    const endMinutes = endH * 60 + endM;
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    const isEarly = currentTotalMinutes < endMinutes;

    // If early and teacher DID NOT end class early, require reason
    if (isEarly && !cls.liveSessionEndedEarly && !isForcedEarly) {
      handleOpenEarlyLeave(cls);
      return;
    }

    const updatedRecord: AttendanceRecord = {
      ...existing,
      checkOutTime: timeStr,
      checkOutStatus: isEarly ? (cls.liveSessionEndedEarly ? 'excused' : 'pending_approval') : 'normal',
      earlyLeaveReason: isForcedEarly ? earlyLeaveReason : cls.liveSessionEndedEarly ? 'Giảng viên kết thúc lớp sớm' : undefined,
      earlyLeaveApproved: cls.liveSessionEndedEarly ? true : false,
      finalStatus: isEarly ? (cls.liveSessionEndedEarly ? existing.finalStatus : 'early_exit') : existing.finalStatus,
    };

    StorageService.recordAttendance(updatedRecord);
    onRefreshData();

    setShowEarlyLeaveModal(false);
    setStatusFeedback({
      type: 'success',
      message: isEarly
        ? cls.liveSessionEndedEarly
          ? `Đã điểm danh ra sớm theo hiệu lệnh kết thúc lớp của Giảng viên lúc ${timeStr}.`
          : `Đã gửi yêu cầu xin về sớm đến Giảng viên kèm lý do! Giờ ra: ${timeStr}. Vui lòng đợi Giảng viên phê duyệt.`
        : `ĐIỂM DANH RA THÀNH CÔNG! Giờ ra: ${timeStr}. Bạn đã hoàn thành buổi học.`,
    });
  };

  const submitEarlyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!earlyLeaveReason.trim()) {
      alert('Vui lòng nhập rõ lý do xin về sớm');
      return;
    }
    if (selectedClassForLeave) {
      handleCheckOut(selectedClassForLeave, true);
    }
  };

  const handleOpenUnenrollConfirm = (cls: ClassRoom) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận hủy đăng ký lớp học?',
      message: `Bạn có chắc chắn muốn hủy đăng ký lớp học "${cls.name}" (Mã: ${cls.code})?\nLịch học đã hủy sẽ được lưu trữ trong Thùng rác trong 6 tháng. Bạn có thể bấm vào hình đại diện -> Thùng rác để khôi phục lại bất kỳ lúc nào.`,
      iconType: 'trash',
      confirmAction: () => {
        const result = StorageService.unenrollStudentFromClass(currentUser.id, cls.id);
        onRefreshData();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

        setCenterNotification({
          id: `undo_unenroll_${cls.id}_${Date.now()}`,
          message: 'hủy đăng ký lớp học thành công',
          durationMs: 5000,
          onUndo: () => {
            if (result.trashItem) {
              StorageService.restoreTrashItem(result.trashItem.id);
            }
            onRefreshData();
          },
        });
      },
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Real Hardware GPS Status Card */}
      <div className="bg-white rounded-3xl border border-sky-100 p-4 md:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3">
          <div
            className={`p-3 rounded-2xl ${
              gpsError
                ? 'bg-rose-100 text-rose-700'
                : currentLat !== null
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-sky-100 text-sky-700'
            }`}
          >
            <LocateFixed className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">Định Vị GPS Phần Cứng Thiết Bị</span>
              {currentLat !== null && !gpsError && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  GPS Thực Tế
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {gpsLoading ? (
                <span className="text-sky-600 font-medium">Đang dò tìm tọa độ vệ tinh GPS thiết bị...</span>
              ) : gpsError ? (
                <span className="text-rose-600 font-medium">{gpsError}</span>
              ) : currentLat !== null && currentLng !== null ? (
                <span className="font-mono text-slate-700">
                  Vĩ độ: <strong>{currentLat.toFixed(6)}</strong> | Kinh độ: <strong>{currentLng.toFixed(6)}</strong> (Sai số: ±{gpsAccuracy}m) • Cập nhật: {lastGpsUpdate}
                </span>
              ) : (
                'Chưa có dữ liệu vị trí GPS'
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={requestRealGps}
          disabled={gpsLoading}
          className="px-4 py-2 bg-sky-50 hover:bg-sky-100 active:scale-[0.99] text-sky-700 font-bold text-xs rounded-xl border border-sky-200 transition flex items-center justify-center gap-2 self-start md:self-auto shrink-0 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
          {gpsLoading ? 'Đang lấy GPS...' : 'Cập nhật lại GPS thiết bị'}
        </button>
      </div>

      {/* Welcome Banner */}
      <div className="rounded-3xl bg-linear-to-r from-sky-600 via-sky-500 to-sky-600 p-6 md:p-8 text-white shadow-xl shadow-sky-600/15 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Không Gian Sinh Viên
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Xin chào, {currentUser.fullName}
            </h2>
            <p className="text-sky-100 text-xs md:text-sm mt-1 flex items-center gap-2">
              <span>Mã SV: <strong>{currentUser.studentCode}</strong></span>
              <span>•</span>
              <span>Lớp: <strong>{currentUser.className}</strong> (Khóa {currentUser.courseYear})</span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-xs space-y-1.5 min-w-[240px]">
            <div className="flex justify-between text-sky-100">
              <span>Trạng thái định vị:</span>
              <span className="font-bold text-white flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5" /> {currentLat !== null ? 'Đã kết nối GPS thật' : 'Chưa có GPS'}
              </span>
            </div>
            <div className="flex justify-between text-sky-100">
              <span>Hôm nay:</span>
              <span className="font-semibold text-white">{new Date().toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex justify-between text-sky-100">
              <span>Lớp học đã đăng ký:</span>
              <span className="font-bold text-white">{myClasses.length} môn</span>
            </div>
          </div>
        </div>

        {/* Decorative backdrop glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Feedback banner */}
      {statusFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs md:text-sm flex items-start gap-3 shadow-xs animate-in fade-in duration-200 ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusFeedback.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusFeedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : statusFeedback.type === 'warning' ? (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="font-medium">{statusFeedback.message}</div>
        </div>
      )}

      {/* Today Classes & Attendance Action Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-sky-600" /> Lớp Học & Ca Điểm Danh Hôm Nay ({myClasses.length})
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Điểm danh GPS thực trong bán kính quy định quanh giảng viên / phòng học
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsTrashModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Xem danh sách các môn học bạn đã hủy đăng ký (Khôi phục lại vào danh sách lớp hoặc xóa vĩnh viễn)"
            >
              <Trash2 className="h-4 w-4 text-rose-600" />
              <span>Lịch học đã hủy ({unrolledCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEnrollModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Đăng ký môn học mới
            </button>
          </div>
        </div>

        {myClasses.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center text-slate-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40 text-sky-400" />
            <p className="font-semibold text-slate-700">Chưa được xếp vào lớp học nào</p>
            <p className="text-xs text-slate-500 mt-1">
              Vui lòng báo cho Quản trị viên (Admin) hoặc Giảng viên để được thêm vào danh sách lớp.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {myClasses.map((cls) => {
              const att = myAttendanceToday.find((r) => r.classId === cls.id);
              const targetLat = cls.useLecturerLocation && cls.activeAnchorLat ? cls.activeAnchorLat : cls.latitude;
              const targetLng = cls.useLecturerLocation && cls.activeAnchorLng ? cls.activeAnchorLng : cls.longitude;

              const distance =
                currentLat !== null && currentLng !== null
                  ? calculateDistanceMeters(currentLat, currentLng, targetLat, targetLng)
                  : null;
              const isWithin = distance !== null && distance <= cls.radiusMeters;

              // Check late cutoff status: counted from lecturer check-in time for checkInDeadlineMinutes
              const deadlineMinutes = cls.checkInDeadlineMinutes || 15;
              let isPastDeadlineCutoff = false;
              let deadlineTimeStr = '';
              let remainingMinutes = 0;
              let remainingSeconds = 0;

              if (cls.lecturerSelfCheckedIn && cls.lecturerCheckInTimestamp) {
                const lecturerTime = new Date(cls.lecturerCheckInTimestamp).getTime();
                const deadlineMs = lecturerTime + deadlineMinutes * 60 * 1000;
                const deadlineDate = new Date(deadlineMs);
                deadlineTimeStr = `${deadlineDate.getHours().toString().padStart(2, '0')}:${deadlineDate
                  .getMinutes()
                  .toString()
                  .padStart(2, '0')}`;

                const diffMs = Date.now() - lecturerTime;
                const remainingMs = deadlineMs - Date.now();

                if (remainingMs <= 0) {
                  isPastDeadlineCutoff = true;
                } else {
                  remainingMinutes = Math.floor(remainingMs / 60000);
                  remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
                }
              }

              const attendedCount = attendanceRecords.filter(
                (r) =>
                  r.classId === cls.id &&
                  r.studentId === currentUser.id &&
                  (r.finalStatus === 'present' || r.finalStatus === 'late' || r.finalStatus === 'early_exit')
              ).length;
              const periodsPerSession = cls.periodsPerSession || 4;
              const totalPeriods = cls.totalPeriods || ((cls.credits || 3) * 15);
              const learnedPeriods = attendedCount * periodsPerSession;
              const isStudentFinished = learnedPeriods >= totalPeriods;
              const studentProgressPercent = Math.min(100, Math.round((learnedPeriods / totalPeriods) * 100));

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-3xl border border-sky-100 shadow-lg shadow-sky-900/5 overflow-hidden flex flex-col justify-between transition hover:border-sky-200"
                >
                  {/* Class Header */}
                  <div className="p-6 border-b border-slate-100 bg-linear-to-b from-sky-50/40 to-transparent">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-100 text-sky-800 font-mono">
                            Mã lớp: {cls.code}
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                            {periodsPerSession} tiết/buổi
                          </span>
                          {isStudentFinished && (
                            <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✓ Đã học đủ {totalPeriods} tiết
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenUnenrollConfirm(cls)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hủy đăng ký lớp học này (Chuyển vào Thùng rác 6 tháng)"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <h4 className="text-lg font-bold text-slate-800 leading-snug">{cls.name}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-sky-600" />
                          <span>{cls.locationName}</span>
                        </p>
                      </div>

                      {/* Live session active pulse */}
                      {cls.isLiveSessionActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 animate-pulse border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Đang diễn ra
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          Chưa mở ca
                        </span>
                      )}
                    </div>

                    {/* Teacher Checked In & Deadline cutoff alert */}
                    {cls.lecturerSelfCheckedIn && (
                      <div
                        className={`mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                          isPastDeadlineCutoff
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                      >
                        <Clock className="h-4 w-4 shrink-0" />
                        <div>
                          <span>
                            Giảng viên đã điểm danh lúc <strong>{cls.lecturerCheckInTime}</strong>.{' '}
                            {isPastDeadlineCutoff ? (
                              <strong className="text-rose-700">
                                ĐÃ HẾT {deadlineMinutes} PHÚT (Hạn chót: {deadlineTimeStr}): Cổng điểm danh vào đã khóa!
                              </strong>
                            ) : (
                              <span>
                                Hạn chót điểm danh: <strong>{deadlineTimeStr}</strong> (Còn{' '}
                                <strong>
                                  {remainingMinutes > 0 ? `${remainingMinutes} phút ` : ''}
                                  {remainingSeconds}s
                                </strong>{' '}
                                - Tối đa {deadlineMinutes} phút sau khi GV điểm danh).
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Teacher Ended Early Alert */}
                    {cls.liveSessionEndedEarly && (
                      <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Giảng viên đã kết thúc lớp học sớm! Sinh viên được phép điểm danh ra về.</span>
                      </div>
                    )}

                    {/* Teacher Break Alert (Tạm dừng lớp học / Nghỉ giải lao) */}
                    {cls.isBreakActive && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2.5">
                        <Coffee className="h-5 w-5 text-amber-600 shrink-0" />
                        <div>
                          <div className="font-bold">☕ Lớp học đang tạm dừng nghỉ giải lao</div>
                          <div className="text-[11px] text-amber-700">
                            Giảng viên đã cho phép lớp tạm dừng (đi ăn sáng, lấy nước). GPS hiện đang ngừng quét hoàn toàn!
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Class Resumed Alert (5-minute grace period alert) */}
                    {(() => {
                      if (!cls.resumedAt || cls.isBreakActive) return null;
                      const resumeTime = new Date(cls.resumedAt).getTime();
                      const elapsedSec = Math.floor((Date.now() - resumeTime) / 1000);
                      const remainingSec = Math.max(0, 300 - elapsedSec);
                      if (remainingSec <= 0) return null;
                      const isOutside = distance !== null && distance > cls.radiusMeters;
                      return (
                        <div
                          className={`mt-3 p-3 rounded-2xl border text-xs flex items-center gap-2.5 ${
                            isOutside
                              ? 'bg-rose-50 border-rose-200 text-rose-900 animate-pulse'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          }`}
                        >
                          {isOutside ? (
                            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                          )}
                          <div>
                            <div className="font-bold">
                              {isOutside
                                ? 'Lớp học đã tiếp tục, vui lòng quay trở lại lớp học trong thời gian quy định!'
                                : '✓ Lớp học đã tiếp tục: Bạn đang trong phạm vi lớp học.'}
                            </div>
                            <div className="text-[11px] mt-0.5">
                              Thời gian quy định còn lại: <strong>{Math.floor(remainingSec / 60)}:{(remainingSec % 60).toString().padStart(2, '0')}</strong> (Mặc định 5 phút).
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Geofence & Timing Info */}
                  <div className="p-6 space-y-4">
                    {/* Accumulated Periods Progress */}
                    <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center font-medium">
                        <span className="text-slate-700">Tiến độ tích lũy số tiết:</span>
                        <span className="font-bold text-sky-900">{learnedPeriods}/{totalPeriods} tiết ({studentProgressPercent}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${isStudentFinished ? 'bg-emerald-500' : 'bg-sky-600'}`}
                          style={{ width: `${studentProgressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>{periodsPerSession} tiết mỗi buổi</span>
                        {isStudentFinished ? (
                          <span className="text-emerald-700 font-bold">✓ Đã hoàn thành đủ số tiết môn học</span>
                        ) : (
                          <span>Còn {Math.max(0, totalPeriods - learnedPeriods)} tiết cần học</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-slate-400 font-medium mb-0.5">Thời gian học</div>
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-sky-600" />
                          <span>
                            {cls.startTime} - {cls.endTime}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-slate-400 font-medium mb-0.5">Bán kính quy định</div>
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                          <span>{cls.radiusMeters} mét</span>
                        </div>
                      </div>
                    </div>

                    {/* Live GPS Distance Indicator */}
                    <div
                      className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                        distance === null
                          ? 'bg-slate-50 border-slate-200 text-slate-600'
                          : isWithin
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50/70 border-rose-200 text-rose-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Navigation
                          className={`h-4 w-4 ${
                            distance === null
                              ? 'text-slate-400'
                              : isWithin
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        />
                        <div>
                          <div className="font-bold">
                            {distance !== null ? `Khoảng cách thiết bị: ${distance}m` : 'Đang lấy vị trí GPS...'}
                          </div>
                          <div className="text-[11px] opacity-80">
                            {distance === null
                              ? 'Vui lòng cho phép quyền vị trí GPS'
                              : isWithin
                              ? 'ĐỦ ĐIỀU KIỆN (Trong bán kính quy định)'
                              : 'CHƯA ĐẠT (Ngoài bán kính chỉ định)'}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          distance === null
                            ? 'bg-slate-200 text-slate-700'
                            : isWithin
                            ? 'bg-emerald-200 text-emerald-900'
                            : 'bg-rose-200 text-rose-900'
                        }`}
                      >
                        {distance === null ? 'CHỜ GPS' : isWithin ? 'HỢP LỆ' : 'NGOÀI VÙNG'}
                      </span>
                    </div>

                    {/* Attendance status display */}
                    <div className="bg-sky-50/40 p-4 rounded-2xl border border-sky-100 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Trạng thái điểm danh:</span>
                        {att?.checkInTime ? (
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full ${
                              att.checkInStatus === 'on_time'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {att.checkInStatus === 'on_time' ? '✓ Đã vào đúng giờ' : '⚠ Đi muộn'} ({att.checkInTime})
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                            Chưa điểm danh vào
                          </span>
                        )}
                      </div>

                      {att?.checkOutTime && (
                        <div className="flex justify-between items-center pt-1 border-t border-sky-100/60">
                          <span className="text-slate-600">Giờ điểm danh ra:</span>
                          <span className="font-bold text-slate-800">
                            {att.checkOutTime}{' '}
                            {att.checkOutStatus === 'early' || att.checkOutStatus === 'pending_approval' ? (
                              <span className="text-amber-600 font-normal">
                                ({att.earlyLeaveApproved ? 'Đã duyệt về sớm' : 'Chờ GV duyệt về sớm'})
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-normal">(Hoàn tất ca)</span>
                            )}
                          </span>
                        </div>
                      )}

                      {att?.earlyLeaveReason && (
                        <div className="p-2 bg-amber-50/80 rounded-xl text-[11px] text-amber-900 border border-amber-200">
                          <strong>Lý do về sớm:</strong> {att.earlyLeaveReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-6 pt-0 space-y-2">
                    {/* Nút Xin phép vắng học nằm phía trên nút Điểm danh vào */}
                    <button
                      type="button"
                      onClick={() => handleOpenLeaveRequestModal(cls)}
                      className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 active:scale-[0.99] text-amber-800 border border-amber-200 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      title="Nộp đơn xin phép vắng học (Có thể nộp bất cứ lúc nào, trong bất kỳ thời điểm nào)"
                    >
                      <FileText className="h-4 w-4 text-amber-600" />
                      Xin phép vắng học
                    </button>

                    {!att?.checkInTime ? (
                      <button
                        type="button"
                        onClick={() => handleCheckIn(cls)}
                        className={`w-full py-3 px-4 font-bold rounded-xl shadow-md text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                          isPastDeadlineCutoff
                            ? 'bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white shadow-amber-600/20'
                            : 'bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white shadow-sky-600/20'
                        }`}
                      >
                        <LogIn className="h-4 w-4" />
                        {isPastDeadlineCutoff
                          ? `ĐIỂM DANH VÀO (GHI NHẬN: ĐI MUỘN - QUÁ ${deadlineMinutes}P)`
                          : 'ĐIỂM DANH VÀO LỚP'}
                      </button>
                    ) : !att?.checkOutTime ? (
                      <button
                        type="button"
                        onClick={() => handleCheckOut(cls)}
                        className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 active:scale-[0.99] text-white font-bold rounded-xl shadow-md text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" /> ĐIỂM DANH RA VỀ
                      </button>
                    ) : (
                      <div className="w-full py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Bạn đã hoàn thành điểm danh ca học này
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attendance History Table for this Student */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-sky-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-600" /> Lịch Sử Điểm Danh Cá Nhân
          </h3>
          <span className="text-xs text-slate-500">Mã SV: {currentUser.studentCode}</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ngày</th>
                <th className="py-3 px-4">Lớp học</th>
                <th className="py-3 px-4">Giờ vào</th>
                <th className="py-3 px-4">Khoảng cách GPS</th>
                <th className="py-3 px-4">Giờ ra</th>
                <th className="py-3 px-4">Lý do xin về (nếu có)</th>
                <th className="py-3 px-4">Kết quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceRecords.filter((r) => r.studentId === currentUser.id).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Chưa có dữ liệu điểm danh nào được ghi nhận
                  </td>
                </tr>
              ) : (
                attendanceRecords
                  .filter((r) => r.studentId === currentUser.id)
                  .map((rec) => {
                    const cls = classes.find((c) => c.id === rec.classId);
                    const trashCls = !cls ? StorageService.getTrash().find((t) => t.id === rec.classId && t.type === 'class') : null;
                    const displaySubjectName = rec.className || cls?.name || trashCls?.title || 'Môn học';

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-medium text-slate-700">{rec.date}</td>
                        <td className="py-3 px-4 font-semibold text-sky-900">{displaySubjectName}</td>
                        <td className="py-3 px-4 font-mono">{rec.checkInTime || '-'}</td>
                        <td className="py-3 px-4">
                          {rec.checkInDistanceMeters !== undefined ? (
                            <span
                              className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full ${
                                rec.checkInWithinRadius
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {rec.checkInDistanceMeters}m
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono">{rec.checkOutTime || '-'}</td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {rec.earlyLeaveReason || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setSelectedAttendanceDetail(rec)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer hover:opacity-90 active:scale-95 shadow-2xs ${
                              rec.finalStatus === 'present'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : rec.finalStatus === 'late'
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : rec.finalStatus === 'early_exit'
                                ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                            title="Bấm để xem chi tiết / lỗi điểm danh"
                          >
                            <span>
                              {rec.finalStatus === 'present'
                                ? 'Có mặt đúng giờ'
                                : rec.finalStatus === 'late'
                                ? 'Đi muộn'
                                : rec.finalStatus === 'early_exit'
                                ? 'Về sớm'
                                : 'Vắng'}
                            </span>
                            <ChevronDown className="h-3 w-3 shrink-0" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student's Leave Requests History */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-sky-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" /> Đơn Xin Phép Vắng Học Của Bạn
          </h3>
          <span className="text-xs text-slate-500">Mã SV: {currentUser.studentCode}</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ngày xin nghỉ</th>
                <th className="py-3 px-4">Môn học</th>
                <th className="py-3 px-4">Số tiết ca</th>
                <th className="py-3 px-4">Thời gian nộp</th>
                <th className="py-3 px-4">Lý do xin nghỉ</th>
                <th className="py-3 px-4">Trạng thái phê duyệt</th>
                <th className="py-3 px-4">Số tiết vắng tính</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {StorageService.getLeaveRequests().filter((lr) => lr.studentId === currentUser.id).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Bạn chưa gửi đơn xin phép vắng học nào
                  </td>
                </tr>
              ) : (
                StorageService.getLeaveRequests()
                  .filter((lr) => lr.studentId === currentUser.id)
                  .map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-800">{req.leaveDate}</td>
                      <td className="py-3 px-4 font-semibold text-sky-900">{req.className}</td>
                      <td className="py-3 px-4">{req.periodsPerSession || 4} tiết</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{req.submittedAt}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">{req.reason}</td>
                      <td className="py-3 px-4">
                        {req.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> GV đã xác nhận
                          </span>
                        ) : req.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">
                            <X className="h-3 w-3" /> GV không đồng ý
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                            <Clock className="h-3 w-3" /> GV chưa xác nhận
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {req.status === 'approved' ? (
                          <span className="text-amber-700">{Math.round((req.periodsPerSession || 4) / 2)} tiết (1/2 số tiết)</span>
                        ) : req.status === 'rejected' ? (
                          <span className="text-rose-700">{req.periodsPerSession || 4} tiết (100% nếu không đến)</span>
                        ) : (
                          <span className="text-slate-400">0 tiết (Chưa tính)</span>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Input Early Leave Reason */}
      {showEarlyLeaveModal && selectedClassForLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-amber-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Yêu Cầu Lý Do Xin Về Sớm</h3>
                <p className="text-xs text-slate-500">
                  Lớp kết thúc lúc {selectedClassForLeave.endTime}. Bạn đang ra trước thời gian quy định.
                </p>
              </div>
            </div>

            <form onSubmit={submitEarlyLeave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhập lý do xin phép giảng viên *
                </label>
                <textarea
                  rows={3}
                  value={earlyLeaveReason}
                  onChange={(e) => setEarlyLeaveReason(e.target.value)}
                  placeholder="Ví dụ: Em bị đau bụng / sốt đột xuất, xin phép thầy/cô cho em về sớm để đến trạm y tế..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="text-[11px] text-slate-500 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                Lý do này sẽ hiển thị trực tiếp trên màn hình quản lý ca học của Giảng viên để duyệt hoặc từ chối.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEarlyLeaveModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" /> Gửi xin phép & Điểm danh ra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chi tiết kết quả điểm danh & Lỗi vi phạm của sinh viên */}
      {selectedAttendanceDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-sky-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    selectedAttendanceDetail.finalStatus === 'present'
                      ? 'bg-emerald-100 text-emerald-700'
                      : selectedAttendanceDetail.finalStatus === 'late'
                      ? 'bg-amber-100 text-amber-700'
                      : selectedAttendanceDetail.finalStatus === 'early_exit'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {selectedAttendanceDetail.finalStatus === 'present' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Chi Tiết Kết Quả Điểm Danh
                  </h3>
                  <p className="text-xs text-slate-500">
                    Môn: <strong>{selectedAttendanceDetail.className || classes.find((c) => c.id === selectedAttendanceDetail.classId)?.name || 'Môn học'}</strong> • Ngày {selectedAttendanceDetail.date}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAttendanceDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Summary Banner */}
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 ${
                selectedAttendanceDetail.finalStatus === 'present'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : selectedAttendanceDetail.finalStatus === 'late'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : selectedAttendanceDetail.finalStatus === 'early_exit'
                  ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                  : 'bg-rose-50/80 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>Kết luận điểm danh:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-current font-extrabold">
                  {selectedAttendanceDetail.finalStatus === 'present'
                    ? '✓ Có mặt đúng giờ'
                    : selectedAttendanceDetail.finalStatus === 'late'
                    ? '⚠ Đi muộn'
                    : selectedAttendanceDetail.finalStatus === 'early_exit'
                    ? '⚠ Về sớm'
                    : '❌ Vắng mặt'}
                </span>
              </div>

              {/* Chi tiết nguyên nhân / Lỗi vi phạm */}
              <div className="text-[12px] leading-relaxed pt-1 border-t border-current/20">
                {selectedAttendanceDetail.finalStatus === 'present' && (
                  <p>
                    ✓ Bạn đã điểm danh vào lúc <strong>{selectedAttendanceDetail.checkInTime}</strong> đúng khung giờ quy định, khoảng cách GPS hợp lệ ({selectedAttendanceDetail.checkInDistanceMeters !== undefined ? `${selectedAttendanceDetail.checkInDistanceMeters}m` : 'Hợp lệ'}). Không có lỗi vi phạm.
                  </p>
                )}
                {selectedAttendanceDetail.finalStatus === 'late' && (
                  <p>
                    <strong>Lỗi vi phạm: ĐIỂM DANH MUỘN</strong>. Bạn đã điểm danh vào lúc <strong>{selectedAttendanceDetail.checkInTime}</strong> (quá thời hạn cho phép sau khi giảng viên xác nhận ca học).
                  </p>
                )}
                {selectedAttendanceDetail.finalStatus === 'early_exit' && (
                  <p>
                    <strong>Ghi nhận: VỀ SỚM</strong>. Bạn đã điểm danh ra lúc <strong>{selectedAttendanceDetail.checkOutTime}</strong> trước khi ca học kết thúc.{' '}
                    {selectedAttendanceDetail.earlyLeaveReason ? `Lý do xin về: "${selectedAttendanceDetail.earlyLeaveReason}".` : ''}{' '}
                    {selectedAttendanceDetail.earlyLeaveApproved ? '(Đã được giảng viên phê duyệt).' : '(Chưa được giảng viên phê duyệt).'}
                  </p>
                )}
                {selectedAttendanceDetail.finalStatus === 'absent' && (
                  <p>
                    <strong>Lỗi vi phạm: VẮNG MẶT</strong>. Hệ thống không ghi nhận lượt điểm danh vào hợp lệ trong thời gian quy định của ca học.
                  </p>
                )}
                {selectedAttendanceDetail.checkInWithinRadius === false && (
                  <p className="mt-1 text-rose-700 font-bold">
                    ⚠ Cảnh báo vị trí GPS: Khoảng cách thiết bị ({selectedAttendanceDetail.checkInDistanceMeters}m) nằm ngoài bán kính quy định của phòng học!
                  </p>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-slate-500 text-[11px]">Giờ vào lớp:</div>
                <div className="font-mono font-bold text-slate-800 text-sm">
                  {selectedAttendanceDetail.checkInTime || '-'}
                </div>
                <div className="text-[11px] text-slate-600">
                  {selectedAttendanceDetail.checkInStatus === 'on_time'
                    ? 'Đúng giờ'
                    : selectedAttendanceDetail.checkInStatus === 'late'
                    ? 'Vào muộn'
                    : 'Chưa điểm danh'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-slate-500 text-[11px]">Định vị GPS thực tế:</div>
                <div className="font-mono font-bold text-slate-800 text-sm">
                  {selectedAttendanceDetail.checkInDistanceMeters !== undefined ? `${selectedAttendanceDetail.checkInDistanceMeters}m` : '-'}
                </div>
                <div className={`text-[11px] font-semibold ${selectedAttendanceDetail.checkInWithinRadius ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {selectedAttendanceDetail.checkInWithinRadius ? 'Trong bán kính' : 'Ngoài bán kính'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-slate-500 text-[11px]">Giờ ra về:</div>
                <div className="font-mono font-bold text-slate-800 text-sm">
                  {selectedAttendanceDetail.checkOutTime || '-'}
                </div>
                <div className="text-[11px] text-slate-600">
                  {selectedAttendanceDetail.checkOutStatus === 'normal'
                    ? 'Đủ thời gian ca học'
                    : selectedAttendanceDetail.checkOutStatus === 'early' || selectedAttendanceDetail.checkOutStatus === 'pending_approval'
                    ? 'Xin về sớm'
                    : selectedAttendanceDetail.checkOutTime ? 'Hoàn tất' : 'Chưa điểm danh ra'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-slate-500 text-[11px]">Lý do về sớm (nếu có):</div>
                <div className="font-semibold text-slate-800 text-xs truncate">
                  {selectedAttendanceDetail.earlyLeaveReason || 'Không có'}
                </div>
                <div className="text-[11px] text-slate-600">
                  {selectedAttendanceDetail.earlyLeaveApproved ? '✓ Đã duyệt' : selectedAttendanceDetail.earlyLeaveReason ? 'Chờ duyệt' : '-'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAttendanceDetail(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Đơn Xin Phép Vắng Học */}
      {showLeaveRequestModal && selectedClassForLeaveRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-sky-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Đơn Xin Phép Vắng Học
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nộp đơn bất cứ lúc nào • Giảng viên phụ trách xem xét duyệt
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLeaveRequestModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeaveRequest} className="space-y-4 text-xs">
              {/* Pre-filled Readonly Info */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Họ và tên SV:</span>
                  <span className="font-bold text-slate-800">{currentUser.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mã sinh viên:</span>
                  <span className="font-bold font-mono text-sky-800">
                    {currentUser.studentCode || currentUser.username}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Môn học / Lớp:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedClassForLeaveRequest.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Số tiết ca học:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedClassForLeaveRequest.periodsPerSession || 4} tiết/buổi
                  </span>
                </div>
                <div className="col-span-2 text-[11px] text-slate-400 border-t border-slate-200 pt-1.5">
                  Thời gian gửi đơn: <strong>{new Date().toLocaleString('vi-VN')}</strong>
                </div>
              </div>

              {/* Date of Absence (Sinh viên tự chọn) */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ngày xin nghỉ học *
                </label>
                <input
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium text-slate-800 cursor-pointer"
                  required
                />
              </div>

              {/* Duplicate check warning */}
              {(() => {
                const isAlreadySubmitted = StorageService.hasSubmittedLeaveRequest(
                  currentUser.id,
                  selectedClassForLeaveRequest.id,
                  leaveDate
                );
                if (!isAlreadySubmitted) return null;

                const existingReq = StorageService.getLeaveRequests().find(
                  (r) =>
                    r.studentId === currentUser.id &&
                    r.classId === selectedClassForLeaveRequest.id &&
                    r.leaveDate === leaveDate
                );

                return (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1.5 animate-in fade-in">
                    <div className="font-bold flex items-center gap-1.5 text-rose-800">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                      ĐÃ NỘP ĐƠN XIN NGHỈ CHO NGÀY NÀY RỒI
                    </div>
                    <p className="text-[11px] text-rose-700">
                      Bạn đã nộp đơn xin phép vắng học môn <strong>{selectedClassForLeaveRequest.name}</strong> vào ngày <strong>{leaveDate}</strong> rồi.
                    </p>
                    <p className="text-[11px] font-semibold text-rose-800">
                      ⚠️ Theo quy định: Sinh viên chỉ có thể gửi giấy xin phép vắng học <strong>một lần</strong> (trong trường hợp cùng môn học, cùng ca học, cùng ngày). Bạn không thể gửi thêm đơn xin nghỉ khác cho ngày này!
                    </p>
                    {existingReq && (
                      <div className="text-[11px] text-slate-700 bg-white/80 p-2.5 rounded-xl border border-rose-100 space-y-0.5">
                        <div>
                          Nộp lúc: <strong>{existingReq.submittedAt}</strong> • Trạng thái:{' '}
                          <span
                            className={`font-bold ${
                              existingReq.status === 'approved'
                                ? 'text-emerald-700'
                                : existingReq.status === 'rejected'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {existingReq.status === 'approved'
                              ? 'GV đã xác nhận (Đã duyệt)'
                              : existingReq.status === 'rejected'
                              ? 'GV không đồng ý (Từ chối)'
                              : 'GV chưa xác nhận (Chờ duyệt)'}
                          </span>
                        </div>
                        <div>
                          Lý do đã gửi: <em>"{existingReq.reason}"</em>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Reason for Absence (Sinh viên phải tự ghi rõ lý do) */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lý do xin nghỉ học (Sinh viên phải tự ghi rõ lý do) *
                </label>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Ghi rõ lý do xin vắng (Ví dụ: Em bị ốm sốt có giấy khám bệnh / gia đình có việc hiếu hỉ đột xuất...)"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-slate-800"
                  required
                />
              </div>

              {/* Regulations explanation card */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1 text-[11px] leading-relaxed">
                <div className="font-bold flex items-center gap-1 text-amber-950">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-700" /> Quy định tính số tiết vắng theo phê duyệt:
                </div>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>
                    <strong>GV đã xác nhận:</strong> Hệ thống tính vắng <strong>1/2 số tiết</strong> ngày hôm đó ({Math.round((selectedClassForLeaveRequest.periodsPerSession || 4) / 2)} tiết).
                  </li>
                  <li>
                    <strong>GV chưa xác nhận:</strong> Chưa tính số tiết vắng (đang chờ xét duyệt).
                  </li>
                  <li>
                    <strong>GV không đồng ý:</strong> Sinh viên đến lớp điểm danh trong phạm vi thì tính <strong>Chậm</strong>; không đến lớp điểm danh thì tính vắng <strong>100% số tiết</strong> ngày hôm đó ({selectedClassForLeaveRequest.periodsPerSession || 4} tiết).
                  </li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLeaveRequestModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Hủy
                </button>
                {(() => {
                  const isAlreadySubmitted = StorageService.hasSubmittedLeaveRequest(
                    currentUser.id,
                    selectedClassForLeaveRequest.id,
                    leaveDate
                  );
                  return (
                    <button
                      type="submit"
                      disabled={isAlreadySubmitted}
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" /> Gửi đơn xin phép
                    </button>
                  );
                })()}
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

      {/* Modal: Đăng Ký Môn Học Mới & Chọn Phòng Học */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-sky-100 space-y-4 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-100 text-sky-700 rounded-2xl">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Đăng Ký Môn Học & Chọn Phòng Học
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bổ sung môn học và phòng học vào danh sách thời khóa biểu của bạn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={enrollSearchTerm}
                onChange={(e) => setEnrollSearchTerm(e.target.value)}
                placeholder="Tìm kiếm môn học theo tên, mã môn, phòng học..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>

            {/* List of available classes */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(() => {
                const available = classes.filter((c) => !c.studentIds.includes(currentUser.id));
                const filtered = available.filter((c) => {
                  if (!enrollSearchTerm.trim()) return true;
                  const q = enrollSearchTerm.toLowerCase();
                  return (
                    c.name.toLowerCase().includes(q) ||
                    c.code.toLowerCase().includes(q) ||
                    c.locationName.toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <BookOpen className="h-10 w-10 mx-auto text-slate-300" />
                      <p className="text-xs font-semibold text-slate-600">
                        {available.length === 0
                          ? 'Bạn đã đăng ký toàn bộ các môn học hiện có trong hệ thống!'
                          : 'Không tìm thấy môn học nào phù hợp với từ khóa tìm kiếm.'}
                      </p>
                    </div>
                  );
                }

                const campusRooms = StorageService.getCampusRooms();

                return filtered.map((c) => {
                  const matchedRoom = campusRooms.find(
                    (r) => r.name.toLowerCase() === c.locationName.toLowerCase() || r.id === c.locationName
                  );
                  const roomCapacity = matchedRoom?.capacity || 60;
                  const currentEnrolled = c.studentIds.length;
                  const isOverCapacity = currentEnrolled >= roomCapacity;

                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-sky-300 bg-white transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                            {c.code}
                          </span>
                          <span className="text-sm font-bold text-slate-800">
                            {c.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="h-3.5 w-3.5 text-sky-600" />
                            {c.dayOfWeek === 7 ? 'Chủ nhật' : `Thứ ${c.dayOfWeek + 1}`} ({c.startTime} - {c.endTime})
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <Building className="h-3.5 w-3.5 text-indigo-600" />
                            Phòng: <strong className="text-slate-700">{c.locationName}</strong>
                          </span>
                        </div>

                        {/* Capacity badge */}
                        <div className="pt-1 flex items-center gap-2 flex-wrap text-[11px]">
                          <span
                            className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md border ${
                              isOverCapacity
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            <Users className="h-3 w-3" />
                            Sức chứa phòng: {roomCapacity} người • Hiện có: {currentEnrolled} SV
                            {isOverCapacity && (
                              <span className="text-amber-900 font-extrabold ml-1">
                                (Đầy / Quá sức chứa)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleEnrollInClass(c)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95 ${
                          isOverCapacity
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-sky-600 hover:bg-sky-700 text-white'
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Đăng ký chọn phòng</span>
                      </button>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
        subMessage="Bạn đã đăng ký vào lớp học và phòng học thành công."
        onClose={() => setIsSuccessModalOpen(false)}
      />

      {/* Dedicated Trash Management Modal for Student's Un-enrolled Classes */}
      <TrashManagementModal
        isOpen={isTrashModalOpen}
        onClose={() => {
          setIsTrashModalOpen(false);
          onRefreshData();
        }}
        initialFilter="student_enrollment"
        title="Quản Lý Lịch Học Đã Hủy Của Bạn (Lưu Trữ 6 Tháng)"
        role="student"
        currentUserId={currentUser.id}
        onRefreshData={onRefreshData}
      />
    </div>
  );
};
