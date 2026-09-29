export type Role = 'admin' | 'lecturer' | 'student';

export interface User {
  id: string;
  username: string; // admin, or lecturer code, or student code (e.g. 22ATT000)
  password: string; // Plain/hashed for client demo
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: Role;
  avatar?: string;
  createdAt: string;

  // Student specific fields
  studentCode?: string; // Mã sinh viên
  courseYear?: string;  // Khóa (e.g. 10, 11, 2022)
  className?: string;   // Lớp (e.g. A1, CNTT1, 22ATT01)
  hasChangedPassword?: boolean;

  // Lecturer specific fields
  lecturerCode?: string; // Mã giảng viên (e.g. GV001)
  department?: string;   // Khoa / Bộ môn (e.g. Công nghệ thông tin)
  title?: string;        // Học vị (e.g. ThS, TS, PGS)
}

export interface ClassRoom {
  id: string;
  code: string;           // Mã học phần / lớp học (e.g. CS101-A1)
  name: string;           // Tên môn học / lớp học (e.g. Lập trình Web Nâng cao)
  courseYear: string;     // Khóa học (e.g. Khóa 10)
  className: string;      // Tên lớp sinh hoạt (e.g. A1)
  lecturerId: string;     // Giảng viên phụ trách
  studentIds: string[];   // Danh sách sinh viên thuộc lớp
  credits?: number;       // Số tín chỉ của môn học (do Admin quản lý: 1, 2, 3, 4, 5...)
  totalPeriods?: number;  // Tổng số tiết của môn học (do Admin quản lý: 30, 45, 60, 75, 90...)
  periodsPerSession?: number; // Số tiết mỗi buổi / ca học (e.g. 2, 3, 4, 5 tiết)
  
  // Geofence & Location configuration
  locationName: string;   // Ví dụ: Phòng A204 - Giảng đường B1
  roomId?: string;        // ID phòng học cụ thể trong danh sách CampusRoom
  latitude: number;       // Vĩ độ
  longitude: number;      // Kinh độ
  radiusMeters: number;   // Bán kính cho phép điểm danh (10m, 20m, 50m, 100m,...)
  useLecturerLocation?: boolean; // Cho phép dùng vị trí của giảng viên làm tâm

  // Schedule & Time configuration
  dayOfWeek: number;      // 1: Thứ 2, ... 7: Chủ nhật
  startTime: string;      // Giờ bắt đầu (e.g. "08:00")
  endTime: string;        // Giờ kết thúc (e.g. "11:30")
  checkInBeforeMinutes: number; // Điểm danh vào trước giờ bắt đầu (e.g. 15 phút)
  checkInDeadlineMinutes: number; // Hạn chót điểm danh vào (tính từ lúc giảng viên điểm danh: 5, 15, 30 phút...)
  checkOutAllowedAfterMinutes: number; // Điểm danh ra sau thời gian chỉ định (hoặc sau giờ kết thúc)

  // Live session state
  isLiveSessionActive?: boolean;
  liveSessionStartedAt?: string;
  liveSessionEndedEarly?: boolean;
  lecturerSelfCheckedIn?: boolean;
  lecturerCheckInTime?: string;
  lecturerCheckInTimestamp?: string; // ISO string when lecturer checked in
  activeAnchorLat?: number;
  activeAnchorLng?: number;
  currentRoomPhotoUrl?: string; // Ảnh chụp trực tiếp camera lớp học của giảng viên
  currentRoomPhotoTimestamp?: string;

  // Break state (Tạm dừng lớp học / Nghỉ giải lao)
  isBreakActive?: boolean;
  breakStartedAt?: string;
  resumedAt?: string;
  resumeGraceSeconds?: number;

  // Schedule adjustment (khi giảng viên điểm danh ngoài thời gian quy định)
  originalStartTime?: string;
  originalEndTime?: string;
  scheduleAdjustmentReason?: string;
  scheduleAdjustedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  className?: string; // Tên môn học / lớp học
  classCode?: string; // Mã môn học
  studentId: string;
  studentCode: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  
  // Check-in
  checkInTime?: string; // HH:mm:ss
  checkInStatus: 'on_time' | 'late' | 'not_yet' | 'absent' | 'expired_late';
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkInDistanceMeters?: number;
  checkInWithinRadius?: boolean;

  // Mid-class out-of-bounds tracking
  isLeftDuringClass?: boolean;
  leftDuringClassAt?: string;

  // Absence explanation (khi điểm danh ngoài giờ quy định mà GV đã điểm danh)
  absenceReason?: string;
  absenceReasonSubmittedAt?: string;

  // Check-out
  checkOutTime?: string; // HH:mm:ss
  checkOutStatus?: 'normal' | 'early' | 'pending_approval' | 'rejected' | 'excused';
  earlyLeaveReason?: string; // Lý do xin về sớm
  earlyLeaveApproved?: boolean;
  earlyLeaveApprovedBy?: string; // ID giảng viên duyệt
  earlyLeaveApprovedAt?: string;
  
  // Overall status
  finalStatus: 'present' | 'late' | 'early_exit' | 'absent' | 'violation' | 'dropped';
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  classId: string;
  className: string;
  classCode?: string;
  periodsPerSession: number; // e.g. 4
  leaveDate: string; // YYYY-MM-DD
  reason: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  lecturerId?: string;
  lecturerName?: string;
  lecturerReviewedAt?: string;
  lecturerNotes?: string;
  absentPeriodsCount?: number;
}

export interface AnomalyReport {
  id: string;
  classId: string;
  className: string;
  lecturerId: string;
  lecturerName: string;
  createdAt: string;
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  issueType: 'gps_fraud' | 'unexcused_absence' | 'early_walkout' | 'classroom_issue' | 'other';
  description: string;
  livePhotoUrl?: string; // Ảnh camera trực tiếp giảng viên chụp
  photoCapturedAt?: string;
  status: 'pending' | 'resolved' | 'acknowledged';
  adminNotes?: string;

  // Student response/explanation
  studentResponse?: string;
  studentRespondedAt?: string;
}

export interface EmailNotification {
  id: string;
  toEmail: string;
  recipientName: string;
  studentCode?: string;
  classId: string;
  className: string;
  subject: string;
  content: string;
  sentAt: string;
  type:
    | 'attendance_reminder'
    | 'early_leave_result'
    | 'class_cancelled'
    | 'lecturer_arrived_alert'
    | 'violation_report'
    | 'late_attendance'
    | 'absence_alert'
    | 'schedule_adjustment'
    | 'walkout_alert'
    | 'class_resumed'
    | 'absence_reminder'
    | 'leave_request_submitted'
    | 'leave_request_result'
    | 'class_ended_early';
  status: 'sent' | 'delivered';
}

export type TrashItemType = 'lecturer' | 'student' | 'class' | 'student_enrollment' | 'campus_room';

export interface TrashItem {
  id: string;
  type: TrashItemType;
  title: string;
  code?: string;
  subtitle?: string;
  deletedAt: string; // ISO date string
  expiresAt: string; // ISO date string (+180 days = 6 months)
  data: any; // Original object (User, ClassRoom, or Enrollment record)
  deletedByUserId?: string;
  deletedByRole?: Role;
}

export interface CampusRoom {
  id: string;
  name: string; // Tên phòng học, ví dụ: "Phòng Lab 302 - Giảng đường A2 (Cơ sở 1)"
  building: string; // Tòa nhà, ví dụ: "Giảng đường A", "Tòa nhà B", "Giảng đường C", "Khu Lab Thực Hành"
  campus?: string; // Cơ sở đào tạo (Ví dụ: "Cơ sở 1", "Cơ sở 2", "Cơ sở Hòa Lạc"...)
  capacity: number; // Sức chứa sinh viên
  type: string; // Loại phòng ghi trực tiếp: "Lý thuyết", "Thực hành / Lab máy tính", "Hội trường", "Xưởng chuyên ngành"...
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface SystemSettings {
  minAttendancePercentage: number; // Mức không được thi lần 1 (50% - 100%, mặc định 80%)
  minReExamPercentage?: number;    // Mức thi lại (0% - dưới mức 1 đã chọn, mặc định 50%)
  latePenaltyPercent?: number;     // Tỷ lệ quy đổi điểm danh muộn
  updatedAt?: string;
}

