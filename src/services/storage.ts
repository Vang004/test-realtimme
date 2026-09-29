import { User, ClassRoom, AttendanceRecord, AnomalyReport, EmailNotification, TrashItem, TrashItemType, Role, SystemSettings, LeaveRequest, CampusRoom } from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'smart_attendance_current_user',
  USERS: 'smart_attendance_users',
  CLASSES: 'smart_attendance_classes',
  ATTENDANCE: 'smart_attendance_attendance',
  REPORTS: 'smart_attendance_reports',
  EMAILS: 'smart_attendance_emails',
  TRASH: 'smart_attendance_trash',
  LEAVE_REQUESTS: 'smart_attendance_leave_requests',
  SYSTEM_SETTINGS: 'smart_attendance_system_settings',
  CAMPUS_ROOMS: 'smart_attendance_campus_rooms_v1',
  DATA_CLEANSED_MOCK: 'smart_attendance_cleansed_mock_v3',
};

// Default standard list of campus rooms
export const DEFAULT_CAMPUS_ROOMS: CampusRoom[] = [
  {
    id: 'room_lab_302',
    name: 'Phòng Lab 302 - Giảng đường A2 (Cơ sở 1)',
    building: 'Giảng đường A2',
    campus: 'Cơ sở 1',
    capacity: 60,
    type: 'Thực hành / Lab máy tính',
    latitude: 21.038234,
    longitude: 105.782812,
    radiusMeters: 50,
  },
  {
    id: 'room_lab_301',
    name: 'Phòng Lab 301 - Giảng đường A2 (Cơ sở 1)',
    building: 'Giảng đường A2',
    campus: 'Cơ sở 1',
    capacity: 60,
    type: 'Thực hành / Lab máy tính',
    latitude: 21.038250,
    longitude: 105.782830,
    radiusMeters: 50,
  },
  {
    id: 'room_lab_303',
    name: 'Phòng Lab 303 - Giảng đường A2 (Cơ sở 1)',
    building: 'Giảng đường A2',
    campus: 'Cơ sở 1',
    capacity: 50,
    type: 'Thực hành / Lab máy tính',
    latitude: 21.038220,
    longitude: 105.782800,
    radiusMeters: 50,
  },
  {
    id: 'room_a101',
    name: 'Phòng A101 - Giảng đường A1 (Cơ sở 1)',
    building: 'Giảng đường A1',
    campus: 'Cơ sở 1',
    capacity: 80,
    type: 'Lý thuyết',
    latitude: 21.038100,
    longitude: 105.782700,
    radiusMeters: 45,
  },
  {
    id: 'room_a102',
    name: 'Phòng A102 - Giảng đường A1 (Cơ sở 1)',
    building: 'Giảng đường A1',
    campus: 'Cơ sở 1',
    capacity: 80,
    type: 'Lý thuyết',
    latitude: 21.038120,
    longitude: 105.782720,
    radiusMeters: 45,
  },
  {
    id: 'room_a201',
    name: 'Phòng A201 - Giảng đường A1 (Cơ sở 1)',
    building: 'Giảng đường A1',
    campus: 'Cơ sở 1',
    capacity: 90,
    type: 'Lý thuyết',
    latitude: 21.038150,
    longitude: 105.782750,
    radiusMeters: 45,
  },
  {
    id: 'room_a202',
    name: 'Phòng A202 - Giảng đường A1 (Cơ sở 1)',
    building: 'Giảng đường A1',
    campus: 'Cơ sở 1',
    capacity: 90,
    type: 'Lý thuyết',
    latitude: 21.038170,
    longitude: 105.782770,
    radiusMeters: 45,
  },
  {
    id: 'room_b101',
    name: 'Phòng B101 - Tòa nhà B (Khu thực hành)',
    building: 'Tòa nhà B',
    campus: 'Cơ sở 1',
    capacity: 70,
    type: 'Thực hành / Lab máy tính',
    latitude: 21.038500,
    longitude: 105.783100,
    radiusMeters: 50,
  },
  {
    id: 'room_b102',
    name: 'Phòng B102 - Tòa nhà B (Khu thực hành)',
    building: 'Tòa nhà B',
    campus: 'Cơ sở 1',
    capacity: 70,
    type: 'Thực hành / Lab máy tính',
    latitude: 21.038520,
    longitude: 105.783120,
    radiusMeters: 50,
  },
  {
    id: 'room_b201',
    name: 'Phòng B201 - Tòa nhà B (Khu thực hành)',
    building: 'Tòa nhà B',
    campus: 'Cơ sở 1',
    capacity: 75,
    type: 'Lý thuyết',
    latitude: 21.038550,
    longitude: 105.783150,
    radiusMeters: 50,
  },
  {
    id: 'room_b202',
    name: 'Phòng B202 - Tòa nhà B (Khu thực hành)',
    building: 'Tòa nhà B',
    campus: 'Cơ sở 1',
    capacity: 75,
    type: 'Lý thuyết',
    latitude: 21.038570,
    longitude: 105.783170,
    radiusMeters: 50,
  },
  {
    id: 'room_c301',
    name: 'Phòng C301 - Giảng đường C (Cơ sở 2)',
    building: 'Giảng đường C',
    campus: 'Cơ sở 2',
    capacity: 85,
    type: 'Lý thuyết',
    latitude: 21.037800,
    longitude: 105.781900,
    radiusMeters: 50,
  },
  {
    id: 'room_c302',
    name: 'Phòng C302 - Giảng đường C (Cơ sở 2)',
    building: 'Giảng đường C',
    campus: 'Cơ sở 2',
    capacity: 85,
    type: 'Lý thuyết',
    latitude: 21.037820,
    longitude: 105.781920,
    radiusMeters: 50,
  },
  {
    id: 'room_hall_h1',
    name: 'Hội trường lớn H1 - Khu trung tâm',
    building: 'Khu trung tâm',
    campus: 'Trụ sở chính',
    capacity: 350,
    type: 'Hội trường lớn',
    latitude: 21.038300,
    longitude: 105.782500,
    radiusMeters: 100,
  },
];

// Calculate Haversine distance in meters
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Generate default student password: [mã sv][khóa][lớp] in lowercase
// Example: 22ATT000, khóa 10, lớp A1 -> 22att000k10a1
export function generateStudentPassword(studentCode: string, courseYear: string, className: string): string {
  const cleanCode = (studentCode || '').toLowerCase().replace(/\s+/g, '');
  const cleanCourse = (courseYear || '').toLowerCase().replace(/khóa|khoa|\s+/gi, '');
  const cleanClass = (className || '').toLowerCase().replace(/lớp|lop|\s+/gi, '');
  
  const courseTag = cleanCourse ? (cleanCourse.startsWith('k') ? cleanCourse : `k${cleanCourse}`) : 'k10';
  return `${cleanCode}${courseTag}${cleanClass}`;
}

// Normalize phone number for comparison (removes spaces, hyphens, periods, handles +84/84 prefix)
export function normalizePhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  let clean = String(phone).replace(/[\s\-\.\(\)\/]/g, '').trim();
  if (clean.startsWith('+84')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('84') && clean.length > 9) {
    clean = '0' + clean.slice(2);
  }
  return clean;
}

// Normalize email for comparison
export function normalizeEmail(email?: string | null): string {
  if (!email) return '';
  return String(email).trim().toLowerCase();
}

// Initial Admin User (Sole account at initial startup as requested)
export const DEFAULT_ADMIN: User = {
  id: 'usr_admin_001',
  username: 'admin',
  password: 'admin123',
  fullName: 'Quản trị viên Hệ thống',
  email: 'admin@school.edu.vn',
  phoneNumber: '0901234567',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  createdAt: new Date().toISOString(),
};

// Undo action payload
export interface UndoAction {
  id: string;
  type: 'delete_user' | 'reset_password' | 'delete_class' | 'unenroll_class';
  message: string;
  performUndo: () => void;
}

let activeUndoAction: UndoAction | null = null;

// Storage helpers
export const StorageService = {
  // Initialize storage & wipe all mock/dummy data
  init() {
    const isCleansed = localStorage.getItem(STORAGE_KEYS.DATA_CLEANSED_MOCK);
    const existingUsersStr = localStorage.getItem(STORAGE_KEYS.USERS);
    let existingUsers: User[] = existingUsersStr ? JSON.parse(existingUsersStr) : [];

    // Check if storage contains old mock IDs
    const hasMockData = existingUsers.some(
      (u) =>
        u.id.startsWith('usr_gv_00') ||
        u.id.startsWith('usr_sv_00') ||
        u.username === '22ATT000' ||
        u.username === 'gv.nguyenvanan'
    );

    if (!isCleansed || hasMockData || existingUsers.length === 0) {
      // Purge all mock/dummy data. Only keep admin account!
      const realAdmin = existingUsers.find((u) => u.role === 'admin') || DEFAULT_ADMIN;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([realAdmin]));
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.EMAILS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.DATA_CLEANSED_MOCK, 'true');

      // If current user was a mock user, logout or set to admin
      const current = this.getCurrentUser();
      if (current && current.role !== 'admin') {
        this.setCurrentUser(null);
      }
    }

    // Auto purge expired items in trash (> 6 months / 180 days)
    this.purgeExpiredTrash();
  },

  // Reset to initial clean state (Admin only)
  resetToAdminOnly() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([DEFAULT_ADMIN]));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EMAILS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // Current logged in user
  getCurrentUser(): User | null {
    const str = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return str ? JSON.parse(str) : null;
  },

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  // Users
  getUsers(): User[] {
    const str = localStorage.getItem(STORAGE_KEYS.USERS);
    return str ? JSON.parse(str) : [DEFAULT_ADMIN];
  },

  saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  addUser(user: User) {
    const users = this.getUsers();
    // Validate uniqueness against other users
    const validation = this.validateUserUniqueness(user, user.id);
    if (!validation.valid) {
      throw new Error(validation.message || 'Thông tin tài khoản bị trùng lặp trong hệ thống!');
    }

    const existingIndex = users.findIndex(
      (u) => (user.id && u.id === user.id) || u.username.toLowerCase() === user.username.toLowerCase()
    );
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }
    this.saveUsers(users);
    return user;
  },

  updateUser(id: string, updates: Partial<User>) {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index >= 0) {
      const mergedUser = { ...users[index], ...updates };
      const validation = this.validateUserUniqueness(mergedUser, id);
      if (!validation.valid) {
        throw new Error(validation.message || 'Thông tin cập nhật bị trùng lặp!');
      }

      users[index] = mergedUser;
      this.saveUsers(users);
      const current = this.getCurrentUser();
      if (current && current.id === id) {
        this.setCurrentUser(users[index]);
      }
      return users[index];
    }
    return null;
  },

  // Delete User with soft-delete into Trash (stored for 6 months)
  deleteUser(id: string, deletedByRole?: Role): { success: boolean; trashItem?: TrashItem; previousUser?: User } {
    let users = this.getUsers();
    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) return { success: false };

    // Remove from active users
    users = users.filter((u) => u.id !== id);
    this.saveUsers(users);

    // Also remove from any classes if student
    let enrolledClassIds: string[] = [];
    if (targetUser.role === 'student') {
      const classes = this.getClasses();
      let updatedClasses = false;
      classes.forEach((c) => {
        if (c.studentIds.includes(id)) {
          enrolledClassIds.push(c.id);
          c.studentIds = c.studentIds.filter((sid) => sid !== id);
          updatedClasses = true;
        }
      });
      if (updatedClasses) {
        this.saveClasses(classes);
      }
    }

    // Move to Trash
    const trashItem = this.moveToTrash({
      id: `trash_${targetUser.id}_${Date.now()}`,
      type: targetUser.role === 'lecturer' ? 'lecturer' : 'student',
      title: targetUser.fullName,
      code: targetUser.role === 'lecturer' ? targetUser.lecturerCode : targetUser.studentCode,
      subtitle: targetUser.role === 'lecturer' ? targetUser.department : `Lớp ${targetUser.className || ''}`,
      deletedAt: new Date().toISOString(),
      data: { ...targetUser, enrolledClassIds },
      deletedByRole: deletedByRole || 'admin',
    });

    return { success: true, trashItem, previousUser: targetUser };
  },

  // Bulk Delete Users with soft-delete into Trash (stored for 6 months)
  deleteUsers(ids: string[], deletedByRole?: Role): { successCount: number; trashItems: TrashItem[]; previousUsers: User[] } {
    let users = this.getUsers();
    const idSet = new Set(ids);
    const targets = users.filter((u) => idSet.has(u.id));
    if (targets.length === 0) return { successCount: 0, trashItems: [], previousUsers: [] };

    // Remove from active users
    users = users.filter((u) => !idSet.has(u.id));
    this.saveUsers(users);

    // Record enrolled classes for students before removal
    const enrolledClassIdsMap: Record<string, string[]> = {};
    const classes = this.getClasses();
    targets.forEach((targetUser) => {
      if (targetUser.role === 'student') {
        enrolledClassIdsMap[targetUser.id] = classes
          .filter((c) => c.studentIds.includes(targetUser.id))
          .map((c) => c.id);
      }
    });

    // Remove students from classes
    const studentIdsToRemove = new Set(targets.filter((u) => u.role === 'student').map((u) => u.id));
    if (studentIdsToRemove.size > 0) {
      let updatedClasses = false;
      classes.forEach((c) => {
        const prevLen = c.studentIds.length;
        c.studentIds = c.studentIds.filter((sid) => !studentIdsToRemove.has(sid));
        if (c.studentIds.length !== prevLen) updatedClasses = true;
      });
      if (updatedClasses) {
        this.saveClasses(classes);
      }
    }

    // Move to Trash
    const trashItems: TrashItem[] = [];
    const now = new Date().toISOString();
    targets.forEach((targetUser, index) => {
      const trashItem = this.moveToTrash({
        id: `trash_${targetUser.id}_${Date.now()}_${index}`,
        type: targetUser.role === 'lecturer' ? 'lecturer' : 'student',
        title: targetUser.fullName,
        code: targetUser.role === 'lecturer' ? targetUser.lecturerCode : targetUser.studentCode,
        subtitle: targetUser.role === 'lecturer' ? targetUser.department : `Lớp ${targetUser.className || ''}`,
        deletedAt: now,
        data: { ...targetUser, enrolledClassIds: enrolledClassIdsMap[targetUser.id] || [] },
        deletedByRole: deletedByRole || 'admin',
      });
      trashItems.push(trashItem);
    });

    return { successCount: targets.length, trashItems, previousUsers: targets };
  },

  resetUserPassword(userId: string, newPassword?: string): { newPassword: string; previousPassword: string; user: User } {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('Không tìm thấy người dùng');

    const previousPassword = user.password;

    let defaultPwd = newPassword;
    if (!defaultPwd) {
      if (user.role === 'student' && user.studentCode) {
        defaultPwd = generateStudentPassword(user.studentCode, user.courseYear || '10', user.className || 'A1');
      } else if (user.role === 'lecturer') {
        defaultPwd = 'gv123456';
      } else {
        defaultPwd = 'admin123';
      }
    }

    user.password = defaultPwd;
    user.hasChangedPassword = false;
    this.saveUsers(users);

    // If current logged-in user is updated
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(user);
    }

    return { newPassword: defaultPwd, previousPassword, user };
  },

  // Classes
  getClasses(): ClassRoom[] {
    const str = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (!str) return [];
    try {
      const classes: ClassRoom[] = JSON.parse(str);
      return classes.map((c) => ({
        ...c,
        dayOfWeek: c.dayOfWeek !== undefined ? Number(c.dayOfWeek) : 1,
        checkInDeadlineMinutes: c.checkInDeadlineMinutes !== undefined ? Number(c.checkInDeadlineMinutes) : 15,
      }));
    } catch {
      return [];
    }
  },

  saveClasses(classes: ClassRoom[]) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  },

  addClass(cls: ClassRoom) {
    // Làm mới hoàn toàn: nếu tạo lại lớp có tên hoặc mã trùng với lớp đã xóa trước đó, xóa bỏ toàn bộ nhật ký điểm danh cũ
    const allAttendance = this.getAttendance();
    const cleanAttendance = allAttendance.filter(
      (r) => r.classId !== cls.id && (!cls.name || r.className !== cls.name)
    );
    this.saveAttendance(cleanAttendance);

    const classes = this.getClasses();
    classes.push(cls);
    this.saveClasses(classes);
    return cls;
  },

  updateClass(id: string, updates: Partial<ClassRoom>) {
    const classes = this.getClasses();
    const index = classes.findIndex((c) => c.id === id);
    if (index >= 0) {
      classes[index] = { ...classes[index], ...updates };
      this.saveClasses(classes);
      return classes[index];
    }
    return null;
  },

  // Delete Class with soft-delete into Trash (stored for 6 months)
  // Quy định: Xóa lớp học thì toàn bộ nhật ký điểm danh và tương tác liên quan đến lớp đó cũng bị xóa theo, không xóa giảng viên hay sinh viên
  deleteClass(id: string, deletedByRole?: Role): { success: boolean; trashItem?: TrashItem; previousClass?: ClassRoom } {
    const classes = this.getClasses();
    const targetClass = classes.find((c) => c.id === id);
    if (!targetClass) return { success: false };

    const remainingClasses = classes.filter((c) => c.id !== id);
    this.saveClasses(remainingClasses);

    // 1. Xóa toàn bộ nhật ký điểm danh liên quan đến lớp học này (chỉ xóa tương tác của lớp đó, giữ nguyên tài khoản GV và SV)
    const allAttendance = this.getAttendance();
    const cleanAttendance = allAttendance.filter(
      (r) => r.classId !== id && r.classId !== targetClass.id && (!targetClass.name || r.className !== targetClass.name)
    );
    this.saveAttendance(cleanAttendance);

    // 2. Xóa các báo cáo bất thường/kỷ luật liên quan đến lớp học này
    const allReports = this.getReports();
    const cleanReports = allReports.filter((rep) => rep.classId !== id && rep.classId !== targetClass.id);
    this.saveReports(cleanReports);

    // 3. Move to Trash
    const trashItem = this.moveToTrash({
      id: `trash_${targetClass.id}_${Date.now()}`,
      type: 'class',
      title: targetClass.name,
      code: targetClass.code,
      subtitle: `${targetClass.startTime} - ${targetClass.endTime} • ${targetClass.locationName}`,
      deletedAt: new Date().toISOString(),
      data: targetClass,
      deletedByRole: deletedByRole || 'admin',
    });

    return { success: true, trashItem, previousClass: targetClass };
  },

  // Dissolve class by Lecturer / Admin (Sends notifications to all enrolled students and wipes today's attendance session from their interface)
  dissolveClass(id: string, deletedByRole: Role = 'lecturer'): {
    success: boolean;
    trashItem?: TrashItem;
    previousClass?: ClassRoom;
    notifiedStudentCount: number;
  } {
    const classes = this.getClasses();
    const targetClass = classes.find((c) => c.id === id);
    if (!targetClass) return { success: false, notifiedStudentCount: 0 };

    const todayStr = new Date().toISOString().split('T')[0];
    const allUsers = this.getUsers();
    const enrolledStudents = allUsers.filter(
      (u) => u.role === 'student' && targetClass.studentIds.includes(u.id)
    );

    // 1. Send dissolve notification to all participating students
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    enrolledStudents.forEach((st) => {
      const emailNotif: EmailNotification = {
        id: `email_dissolve_${targetClass.id}_${st.id}_${Date.now()}`,
        toEmail: st.email,
        recipientName: st.fullName,
        studentCode: st.studentCode,
        classId: targetClass.id,
        className: targetClass.name,
        subject: `[THÔNG BÁO GIẢI TÁN LỚP] Lớp học ${targetClass.name} (${targetClass.code}) đã được giải tán`,
        content: `Chào ${st.fullName} (${st.studentCode}),\n\nGiảng viên/Nhà trường thông báo: Lớp học "${targetClass.name}" (Mã: ${targetClass.code}) tại ${targetClass.locationName} đã được giải tán lúc ${timeStr}.\n\nLớp học và ca điểm danh hôm nay của môn này đã được gỡ bỏ khỏi giao diện điểm danh của bạn.\n\nTrân trọng thông báo.`,
        sentAt: `${timeStr} ${now.toLocaleDateString('vi-VN')}`,
        type: 'class_cancelled',
        status: 'delivered',
      };
      this.addEmail(emailNotif);
    });

    // 2. Remove today's attendance records for this class so student interface is completely cleared
    const attendance = this.getAttendance();
    const remainingAttendance = attendance.filter(
      (r) => !(r.classId === id && r.date === todayStr)
    );
    this.saveAttendance(remainingAttendance);

    // 3. Move class to Trash and remove from classes
    const deleteResult = this.deleteClass(id, deletedByRole);

    return {
      success: deleteResult.success,
      trashItem: deleteResult.trashItem,
      previousClass: targetClass,
      notifiedStudentCount: enrolledStudents.length,
    };
  },

  // Student un-enroll from a class (stored in Trash for 6 months)
  unenrollStudentFromClass(studentId: string, classId: string): { success: boolean; trashItem?: TrashItem } {
    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === classId);
    if (!cls || !cls.studentIds.includes(studentId)) return { success: false };

    cls.studentIds = cls.studentIds.filter((sid) => sid !== studentId);
    this.saveClasses(classes);

    const users = this.getUsers();
    const student = users.find((u) => u.id === studentId);

    const trashItem = this.moveToTrash({
      id: `trash_unenroll_${classId}_${studentId}_${Date.now()}`,
      type: 'student_enrollment',
      title: cls.name,
      code: cls.code,
      subtitle: `Lớp ${cls.className} • ${cls.startTime} - ${cls.endTime} (Đã hủy đăng ký)`,
      deletedAt: new Date().toISOString(),
      data: {
        studentId,
        studentName: student?.fullName || '',
        studentCode: student?.studentCode || '',
        classId: cls.id,
        className: cls.name,
        classCode: cls.code,
      },
      deletedByUserId: studentId,
      deletedByRole: 'student',
    });

    return { success: true, trashItem };
  },

  // Attendance
  getAttendance(): AttendanceRecord[] {
    const str = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!str) return [];
    try {
      const records: AttendanceRecord[] = JSON.parse(str);
      const classes = this.getClasses();
      const existingClassIds = new Set(classes.map((c) => c.id));
      const existingClassNames = new Set(classes.map((c) => c.name));

      // Lọc bỏ triệt để nhật ký điểm danh của các lớp đã bị xóa
      const validRecords = records.filter((r) => {
        if (existingClassIds.has(r.classId)) return true;
        if (r.className && existingClassNames.has(r.className)) return true;
        return false;
      });

      if (validRecords.length !== records.length) {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(validRecords));
      }

      const classMap = new Map(classes.map((c) => [c.id, c]));
      return validRecords.map((r) => {
        const cls = classMap.get(r.classId);
        return {
          ...r,
          className: r.className || cls?.name,
          classCode: r.classCode || cls?.code,
        };
      });
    } catch {
      return [];
    }
  },

  saveAttendance(records: AttendanceRecord[]) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  },

  recordAttendance(record: AttendanceRecord) {
    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === record.classId);
    if (!record.className && cls) {
      record.className = cls.name;
    }
    if (!record.classCode && cls) {
      record.classCode = cls.code;
    }

    const records = this.getAttendance();
    const index = records.findIndex(
      (r) => r.classId === record.classId && r.studentId === record.studentId && r.date === record.date
    );
    if (index >= 0) {
      records[index] = { ...records[index], ...record };
    } else {
      records.push(record);
    }
    this.saveAttendance(records);
    return record;
  },

  // Reports
  getReports(): AnomalyReport[] {
    const str = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return str ? JSON.parse(str) : [];
  },

  saveReports(reports: AnomalyReport[]) {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  },

  addReport(report: AnomalyReport) {
    const reports = this.getReports();
    reports.unshift(report);
    this.saveReports(reports);
    return report;
  },

  updateReport(id: string, updates: Partial<AnomalyReport>) {
    const reports = this.getReports();
    const index = reports.findIndex((r) => r.id === id);
    if (index >= 0) {
      reports[index] = { ...reports[index], ...updates };
      this.saveReports(reports);
      return reports[index];
    }
    return null;
  },

  // Delete Report & Discipline History (Admin ONLY per requirement)
  deleteReport(id: string): { success: boolean; deletedReport?: AnomalyReport } {
    const reports = this.getReports();
    const target = reports.find((r) => r.id === id);
    if (!target) return { success: false };

    const remaining = reports.filter((r) => r.id !== id);
    this.saveReports(remaining);

    // If report was linked to an attendance record with violation note, clean up notes
    if (target.classId && target.studentId) {
      const attendance = this.getAttendance();
      let updated = false;
      attendance.forEach((r) => {
        if (r.classId === target.classId && r.studentId === target.studentId && r.finalStatus === 'violation') {
          r.finalStatus = r.checkInStatus === 'late' ? 'late' : 'present';
          r.notes = undefined;
          updated = true;
        }
      });
      if (updated) {
        this.saveAttendance(attendance);
      }
    }

    return { success: true, deletedReport: target };
  },

  // ==========================================
  // SYSTEM GENERAL SETTINGS (Admin % qua môn / xét tư cách thi)
  // ==========================================
  getSystemSettings(): SystemSettings {
    const str = localStorage.getItem(STORAGE_KEYS.SYSTEM_SETTINGS);
    if (str) {
      try {
        return JSON.parse(str);
      } catch (e) {
        // fallback
      }
    }
    return {
      minAttendancePercentage: 80, // Mặc định 80% (không được thi lần 1 nếu dưới mức này)
      minReExamPercentage: 50,    // Mặc định 50% (được thi lại nếu từ mức này đến dưới mức 1)
      latePenaltyPercent: 50,
      updatedAt: new Date().toISOString(),
    };
  },

  saveSystemSettings(settings: Partial<SystemSettings>): SystemSettings {
    const current = this.getSystemSettings();
    const updated: SystemSettings = {
      ...current,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(updated));
    return updated;
  },

  // Calculate Student Attendance Stats & Eligibility for Exam 1 / Pass
  calculateStudentAttendanceStats(studentId: string, classId: string): {
    totalSessions: number;
    validSessions: number;
    lateSessions: number;
    absentSessions: number;
    attendanceRate: number;
    isQualified: boolean;
    qualificationStatus: 'qualified' | 're_exam' | 'disqualified';
    qualificationLabel: string;
    minRequiredRate: number;
    minReExamRate: number;
    credits: number;
  } {
    const settings = this.getSystemSettings();
    const minRequiredRate = settings.minAttendancePercentage || 80;
    const minReExamRate = settings.minReExamPercentage ?? 50;
    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === classId);
    const credits = cls?.credits || 3;

    const allRecords = this.getAttendance().filter(
      (r) => r.classId === classId && r.studentId === studentId
    );

    const totalSessions = allRecords.length;
    if (totalSessions === 0) {
      return {
        totalSessions: 0,
        validSessions: 0,
        lateSessions: 0,
        absentSessions: 0,
        attendanceRate: 100, // No sessions held yet -> considered qualified initially
        isQualified: true,
        qualificationStatus: 'qualified',
        qualificationLabel: 'Đủ điều kiện thi lần 1',
        minRequiredRate,
        minReExamRate,
        credits,
      };
    }

    let validSessions = 0;
    let lateSessions = 0;
    let absentSessions = 0;

    allRecords.forEach((r) => {
      // Must have checked in within valid GPS radius
      const isValidGps = !!r.checkInTime && (r.checkInWithinRadius !== false);
      if (isValidGps && r.finalStatus !== 'absent' && r.finalStatus !== 'violation') {
        validSessions++;
        if (r.finalStatus === 'late') {
          lateSessions++;
        }
      } else {
        absentSessions++;
      }
    });

    const attendanceRate = Math.round((validSessions / totalSessions) * 100);
    const isQualified = attendanceRate >= minRequiredRate;
    const qualificationStatus: 'qualified' | 're_exam' | 'disqualified' =
      attendanceRate >= minRequiredRate
        ? 'qualified'
        : attendanceRate >= minReExamRate
        ? 're_exam'
        : 'disqualified';

    const qualificationLabel =
      qualificationStatus === 'qualified'
        ? `Đủ điều kiện thi lần 1 (≥${minRequiredRate}%)`
        : qualificationStatus === 're_exam'
        ? `Không được thi lần 1 - Thi lại (${minReExamRate}% - <${minRequiredRate}%)`
        : `Cấm thi hoàn toàn (<${minReExamRate}%)`;

    return {
      totalSessions,
      validSessions,
      lateSessions,
      absentSessions,
      attendanceRate,
      isQualified,
      qualificationStatus,
      qualificationLabel,
      minRequiredRate,
      minReExamRate,
      credits,
    };
  },

  // Emails
  getEmails(): EmailNotification[] {
    const str = localStorage.getItem(STORAGE_KEYS.EMAILS);
    return str ? JSON.parse(str) : [];
  },

  saveEmails(emails: EmailNotification[]) {
    localStorage.setItem(STORAGE_KEYS.EMAILS, JSON.stringify(emails));
  },

  addEmail(email: EmailNotification): EmailNotification | null {
    // Strict business rule:
    // "thông báo giảng viên đã điểm danh chỉ gửi về cho tài khoản sinh viên chứ không gửi về tài khoản admin, thông báo nhắc nhở điểm danh cũng vậy"
    if (email.type === 'lecturer_arrived_alert' || email.type === 'attendance_reminder') {
      const to = (email.toEmail || '').toLowerCase();
      const rec = (email.recipientName || '').toLowerCase();
      if (to.includes('admin') || rec.includes('quản trị')) {
        // Prevent sending to admin
        return null;
      }
    }
    const emails = this.getEmails();
    emails.unshift(email);
    this.saveEmails(emails);
    return email;
  },

  clearEmails() {
    this.saveEmails([]);
  },

  deleteEmail(emailId: string): EmailNotification[] {
    const emails = this.getEmails();
    const updated = emails.filter((e) => e.id !== emailId);
    this.saveEmails(updated);
    return updated;
  },

  deleteEmails(emailIds: string[]): EmailNotification[] {
    const set = new Set(emailIds);
    const emails = this.getEmails();
    const updated = emails.filter((e) => !set.has(e.id));
    this.saveEmails(updated);
    return updated;
  },

  clearEmailsForUser(user: User): EmailNotification[] {
    const userEmails = this.filterEmailsForUser(user);
    const userEmailIds = new Set(userEmails.map((e) => e.id));
    const allEmails = this.getEmails();
    const updated = allEmails.filter((e) => !userEmailIds.has(e.id));
    this.saveEmails(updated);
    return updated;
  },

  getAdminUser(): User {
    const users = this.getUsers();
    return users.find((u) => u.role === 'admin') || DEFAULT_ADMIN;
  },

  // Record late check-in and automatically send alert to Admin & notification to Student
  recordLateAttendance(student: User, cls: ClassRoom, checkInTime: string, reason?: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    const emails = this.getEmails();
    const alertId = `email_late_${cls.id}_${student.id}_${todayStr}`;

    const alreadySent = emails.some((e) => e.id.startsWith(alertId));
    if (alreadySent) return;

    const admin = this.getAdminUser();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 1. Tự động gửi thông báo ĐI CHẬM về tài khoản Admin
    const adminNotif: EmailNotification = {
      id: `${alertId}_admin_${Date.now()}`,
      toEmail: admin.email,
      recipientName: 'Quản trị viên Hệ thống',
      studentCode: student.studentCode,
      classId: cls.id,
      className: cls.name,
      subject: `[ĐI CHẬM] Sinh viên ${student.fullName} (${student.studentCode || student.username}) vào lớp muộn - Môn ${cls.name}`,
      content: `Kính gửi Quản trị viên Hệ thống,\n\nHệ thống tự động ghi nhận thông tin sinh viên ĐI CHẬM / VÀO LỚP MUỘN:\n- Sinh viên: ${student.fullName} (Mã SV: ${student.studentCode || student.username})\n- Lớp học: ${cls.name} (Mã học phần: ${cls.code})\n- Địa điểm: ${cls.locationName}\n- Thời gian sinh viên điểm danh: ${checkInTime} (Ngày ${now.toLocaleDateString('vi-VN')})\n- Khung giờ ca học: ${cls.startTime} - ${cls.endTime}\n- Chi tiết: ${reason || 'Sinh viên điểm danh sau khi giảng viên đã có mặt hoặc quá giờ bắt đầu quy định'}.\n\nThông báo này được hệ thống tự động gửi về tài khoản Admin để theo dõi chuyên cần và xử lý kỷ luật nếu cần.`,
      sentAt: `${timeStr} ${now.toLocaleDateString('vi-VN')}`,
      type: 'late_attendance',
      status: 'delivered',
    };
    this.addEmail(adminNotif);

    // 2. Gửi thông báo đến tài khoản Sinh viên để sinh viên nắm tình trạng đi muộn của mình
    if (student.email) {
      const studentNotif: EmailNotification = {
        id: `${alertId}_student_${Date.now()}`,
        toEmail: student.email,
        recipientName: student.fullName,
        studentCode: student.studentCode,
        classId: cls.id,
        className: cls.name,
        subject: `[THÔNG BÁO ĐI CHẬM] Bạn đã điểm danh vào lớp muộn - Môn ${cls.name}`,
        content: `Chào ${student.fullName} (${student.studentCode || student.username}),\n\nHệ thống ghi nhận bạn đã ĐIỂM DANH MUỘN ca học môn "${cls.name}":\n- Thời gian điểm danh: ${checkInTime} (Ngày ${now.toLocaleDateString('vi-VN')})\n- Khung giờ ca học: ${cls.startTime} - ${cls.endTime}\n- Lý do ghi nhận: ${reason || 'Điểm danh sau khi giảng viên đã có mặt hoặc quá giờ bắt đầu quy định'}.\n\nThông tin đi chậm này đã được hệ thống tự động báo cáo về tài khoản Quản trị viên để theo dõi chuyên cần.`,
        sentAt: `${timeStr} ${now.toLocaleDateString('vi-VN')}`,
        type: 'late_attendance',
        status: 'delivered',
      };
      this.addEmail(studentNotif);
    }
  },

  // Record absence and automatically send alert to Admin & warning to Student
  recordAbsence(student: User, cls: ClassRoom, reason: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    const records = this.getAttendance();
    const existingIndex = records.findIndex(
      (r) => r.classId === cls.id && r.studentId === student.id && r.date === todayStr
    );
    if (existingIndex >= 0) {
      records[existingIndex].finalStatus = 'absent';
      records[existingIndex].checkInStatus = 'absent';
    } else {
      records.push({
        id: `att_${cls.id}_${student.id}_${todayStr}`,
        classId: cls.id,
        studentId: student.id,
        studentCode: student.studentCode || '',
        studentName: student.fullName,
        date: todayStr,
        checkInStatus: 'absent',
        finalStatus: 'absent',
        checkInWithinRadius: false,
      });
    }
    this.saveAttendance(records);

    // Send automatic notification to Admin
    const emails = this.getEmails();
    const alertId = `email_absence_${cls.id}_${student.id}_${todayStr}`;
    const alreadySent = emails.some((e) => e.id.startsWith(alertId));
    if (!alreadySent) {
      const admin = this.getAdminUser();
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // 1. Tự động gửi cảnh báo KHÔNG TỚI LỚP về tài khoản Admin
      const adminNotif: EmailNotification = {
        id: `${alertId}_admin_${Date.now()}`,
        toEmail: admin.email,
        recipientName: 'Quản trị viên Hệ thống',
        studentCode: student.studentCode,
        classId: cls.id,
        className: cls.name,
        subject: `[KHÔNG TỚI LỚP] Sinh viên ${student.fullName} (${student.studentCode || student.username}) vắng mặt - Môn ${cls.name}`,
        content: `Kính gửi Quản trị viên Hệ thống,\n\nHệ thống tự động ghi nhận sinh viên KHÔNG TỚI LỚP HỌC (Vắng mặt):\n- Sinh viên: ${student.fullName} (Mã SV: ${student.studentCode || student.username})\n- Lớp học: ${cls.name} (Mã: ${cls.code})\n- Địa điểm: ${cls.locationName}\n- Thời gian ca học: ${cls.startTime} - ${cls.endTime} (Ngày ${now.toLocaleDateString('vi-VN')})\n- Lý do ghi nhận vắng: ${reason}\n\nThông báo này được hệ thống tự động gửi về tài khoản Admin để theo dõi số buổi vắng và xét tư cách thi / qua môn.`,
        sentAt: `${timeStr} ${now.toLocaleDateString('vi-VN')}`,
        type: 'absence_alert',
        status: 'delivered',
      };
      this.addEmail(adminNotif);

      // 2. Gửi cảnh báo vắng mặt đến tài khoản Sinh viên
      if (student.email) {
        const studentAbsenceNotif: EmailNotification = {
          id: `${alertId}_student_${Date.now()}`,
          toEmail: student.email,
          recipientName: student.fullName,
          studentCode: student.studentCode,
          classId: cls.id,
          className: cls.name,
          subject: `[CẢNH BÁO VẮNG HỌC] Bạn được ghi nhận KHÔNG TỚI LỚP - Môn ${cls.name}`,
          content: `Chào ${student.fullName} (${student.studentCode || student.username}),\n\nHệ thống tự động ghi nhận bạn VẮNG MẶT (KHÔNG TỚI LỚP) ca học môn "${cls.name}":\n- Thời gian ca học: ${cls.startTime} - ${cls.endTime} (Ngày ${now.toLocaleDateString('vi-VN')})\n- Phòng học: ${cls.locationName}\n- Lý do ghi nhận vắng: ${reason}\n\nThông báo vắng mặt này đã được tự động chuyển về Quản trị viên Hệ thống để kiểm tra chuyên cần và điều kiện dự thi.`,
          sentAt: `${timeStr} ${now.toLocaleDateString('vi-VN')}`,
          type: 'absence_alert',
          status: 'delivered',
        };
        this.addEmail(studentAbsenceNotif);
      }
    }
  },

  // Check and report all students absent who missed the check-in deadline
  checkAndReportExpiredCheckIns(cls: ClassRoom): number {
    const todayStr = new Date().toISOString().split('T')[0];
    const records = this.getAttendance();
    const allUsers = this.getUsers();
    const classStudents = allUsers.filter((u) => u.role === 'student' && cls.studentIds.includes(u.id));

    const deadlineMinutes = cls.checkInDeadlineMinutes || 15;
    let reportedCount = 0;
    classStudents.forEach((st) => {
      const rec = records.find(
        (r) => r.classId === cls.id && r.studentId === st.id && r.date === todayStr
      );
      if (!rec || !rec.checkInTime || !rec.checkInWithinRadius) {
        this.recordAbsence(
          st,
          cls,
          cls.lecturerCheckInTime
            ? `Quá hạn ${deadlineMinutes} phút kể từ khi giảng viên điểm danh (${cls.lecturerCheckInTime}) mà sinh viên chưa có mặt tại lớp`
            : `Hết thời hạn điểm danh ca học (${cls.startTime} - ${cls.endTime}) mà sinh viên không tới lớp học`
        );
        reportedCount++;
      }
    });

    return reportedCount;
  },

  // Filter emails for a specific user according to strict role rules:
  // - Students only see notifications addressed to them (reminders, lecturer arrived alert, late/absence warnings, early leave result)
  // - Admin NEVER sees "lecturer arrived" or "attendance reminder" blasts!
  // - Admin ONLY receives "late_attendance" (đi chậm), "absence_alert" (không tới lớp), "violation_report", "schedule_adjustment", "class_cancelled".
  filterEmailsForUser(user: User | null, allEmails?: EmailNotification[]): EmailNotification[] {
    if (!user) return [];
    const emails = allEmails || this.getEmails();

    if (user.role === 'student') {
      const myCode = user.studentCode ? user.studentCode.trim().toLowerCase() : '';
      const myEmail = user.email ? user.email.trim().toLowerCase() : '';
      return emails.filter((e) => {
        // Exclude notifications addressed specifically to Admin
        if (
          e.recipientName &&
          e.recipientName.toLowerCase().includes('quản trị') &&
          e.toEmail &&
          (e.toEmail.toLowerCase().includes('admin') || e.toEmail.toLowerCase() === 'admin@school.edu.vn')
        ) {
          return false;
        }

        const matchesCode = !!myCode && !!e.studentCode && e.studentCode.trim().toLowerCase() === myCode;
        const matchesEmail = !!myEmail && !!e.toEmail && e.toEmail.trim().toLowerCase() === myEmail;
        return matchesCode || matchesEmail;
      });
    }

    if (user.role === 'admin') {
      return emails.filter((e) => {
        // 1. RULE: "thông báo giảng viên đã điểm danh chỉ gửi về cho tài khoản sinh viên chứ không gửi về tài khoản admin"
        if (
          e.type === 'lecturer_arrived_alert' ||
          e.subject.toLowerCase().includes('giảng viên đã điểm danh') ||
          e.content.toLowerCase().includes('giảng viên phụ trách đã có mặt và xác nhận điểm danh')
        ) {
          return false;
        }

        // 2. RULE: "thông báo nhắc nhở điểm danh cũng vậy" (không gửi về admin)
        if (
          e.type === 'attendance_reminder' ||
          e.subject.toLowerCase().includes('nhắc nhở điểm danh') ||
          e.subject.toLowerCase().includes('nhắc điểm danh') ||
          e.subject.toLowerCase().includes('nhắc nhở ca học')
        ) {
          return false;
        }

        // 3. RULE: "chỉ những thông báo đi chậm, không tới lớp học,... mới tự động gửi về tài khoản admin"
        const isAllowedAdminType =
          e.type === 'late_attendance' ||
          e.type === 'absence_alert' ||
          e.type === 'violation_report' ||
          e.type === 'schedule_adjustment' ||
          e.type === 'class_cancelled' ||
          e.type === 'walkout_alert' ||
          e.type === 'leave_request_submitted' ||
          e.type === 'class_ended_early';

        if (!isAllowedAdminType) {
          return false;
        }

        // Must be addressed to Admin
        const isDirectlyToAdmin =
          (e.toEmail &&
            (e.toEmail.toLowerCase() === user.email.toLowerCase() ||
              e.toEmail.toLowerCase().includes('admin'))) ||
          (e.recipientName && e.recipientName.toLowerCase().includes('quản trị'));

        return isDirectlyToAdmin;
      });
    }

    if (user.role === 'lecturer') {
      return emails.filter((e) => {
        if (e.type === 'attendance_reminder' || e.type === 'lecturer_arrived_alert') {
          return false;
        }
        const classes = this.getClasses();
        const isMyClass = classes.some((c) => c.lecturerId === user.id && c.id === e.classId);
        const isToMe = e.toEmail && user.email && e.toEmail.toLowerCase() === user.email.toLowerCase();
        return isMyClass || isToMe;
      });
    }

    return emails;
  },

  // ==========================================
  // TRASH / RECYCLE BIN MANAGEMENT (6 MONTHS RETENTION)
  // ==========================================
  getTrash(): TrashItem[] {
    const str = localStorage.getItem(STORAGE_KEYS.TRASH);
    return str ? JSON.parse(str) : [];
  },

  saveTrash(items: TrashItem[]) {
    localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(items));
  },

  moveToTrash(item: Omit<TrashItem, 'expiresAt'>): TrashItem {
    const trash = this.getTrash();
    // 6 months = 180 days retention
    const deletedTime = new Date(item.deletedAt).getTime();
    const expiresAt = new Date(deletedTime + 180 * 24 * 60 * 60 * 1000).toISOString();

    const completeItem: TrashItem = {
      ...item,
      expiresAt,
    };

    trash.unshift(completeItem);
    this.saveTrash(trash);
    return completeItem;
  },

  purgeExpiredTrash() {
    const trash = this.getTrash();
    const now = Date.now();
    const validTrash = trash.filter((t) => new Date(t.expiresAt).getTime() > now);
    if (validTrash.length !== trash.length) {
      this.saveTrash(validTrash);
    }
  },

  restoreTrashItem(trashId: string): { success: boolean; message: string } {
    const trash = this.getTrash();
    const item = trash.find((t) => t.id === trashId);
    if (!item) return { success: false, message: 'Mục không tồn tại trong thùng rác' };

    if (item.type === 'lecturer' || item.type === 'student') {
      const user = item.data as User;
      const users = this.getUsers();
      // Check if username/code currently conflicts
      const codeConflict = users.some(
        (u) =>
          u.username.toLowerCase() === user.username.toLowerCase() ||
          (user.lecturerCode && u.lecturerCode?.toLowerCase() === user.lecturerCode.toLowerCase()) ||
          (user.studentCode && u.studentCode?.toLowerCase() === user.studentCode.toLowerCase())
      );
      if (codeConflict) {
        return {
          success: false,
          message: 'Không thể khôi phục: Mã hoặc tên đăng nhập của tài khoản này hiện đã được sử dụng bởi người dùng khác!',
        };
      }
      this.addUser(user);

      // If student, restore back to classes
      if (item.type === 'student') {
        const enrolledClassIds = (item.data as any)?.enrolledClassIds as string[] | undefined;
        const currentClasses = this.getClasses();
        let updated = false;
        currentClasses.forEach((c) => {
          if (
            (enrolledClassIds && enrolledClassIds.includes(c.id)) ||
            (user.className && c.className && c.className.trim().toLowerCase() === user.className.trim().toLowerCase())
          ) {
            if (!c.studentIds.includes(user.id)) {
              c.studentIds.push(user.id);
              updated = true;
            }
          }
        });
        if (updated) {
          this.saveClasses(currentClasses);
        }
      }
    } else if (item.type === 'class') {
      const cls = item.data as ClassRoom;
      const classes = this.getClasses();
      if (classes.some((c) => c.code.toLowerCase() === cls.code.toLowerCase())) {
        return {
          success: false,
          message: 'Không thể khôi phục: Mã lịch học/môn học này hiện đã tồn tại trên hệ thống!',
        };
      }
      this.addClass(cls);
    } else if (item.type === 'student_enrollment') {
      const { studentId, classId } = item.data as { studentId: string; classId: string };
      const classes = this.getClasses();
      const cls = classes.find((c) => c.id === classId);
      if (!cls) {
        return { success: false, message: 'Lớp học tương ứng không còn tồn tại trên hệ thống.' };
      }
      if (!cls.studentIds.includes(studentId)) {
        cls.studentIds.push(studentId);
        this.saveClasses(classes);
      }
    } else if (item.type === 'campus_room') {
      const room = item.data as CampusRoom;
      const rooms = this.getCampusRooms();
      if (rooms.some((r) => r.id === room.id || r.name.toLowerCase() === room.name.toLowerCase())) {
        return {
          success: false,
          message: 'Không thể khôi phục: Phòng học này hiện đã tồn tại trên hệ thống!',
        };
      }
      this.addCampusRoom(room);
    }

    // Remove from trash
    const newTrash = trash.filter((t) => t.id !== trashId);
    this.saveTrash(newTrash);
    return { success: true, message: 'Đã khôi phục thành công dữ liệu từ thùng rác!' };
  },

  deletePermanentlyFromTrash(trashId: string) {
    const trash = this.getTrash();
    const item = trash.find((t) => t.id === trashId);
    if (item && item.type === 'class') {
      const clsId = (item.data as any)?.id;
      const clsName = item.title;
      const allAttendance = this.getAttendance();
      const clean = allAttendance.filter(
        (r) => (!clsId || r.classId !== clsId) && (!clsName || r.className !== clsName)
      );
      this.saveAttendance(clean);
    }
    const newTrash = trash.filter((t) => t.id !== trashId);
    this.saveTrash(newTrash);
  },

  clearAllTrash(filterType?: TrashItemType, currentUserId?: string, userRole?: Role) {
    let trash = this.getTrash();
    if (filterType) {
      trash = trash.filter((t) => t.type !== filterType);
    } else if (userRole === 'student' && currentUserId) {
      trash = trash.filter((t) => !(t.type === 'student_enrollment' && t.deletedByUserId === currentUserId));
    } else if (userRole === 'lecturer') {
      trash = trash.filter((t) => t.type !== 'student' && t.type !== 'class');
    } else if (userRole === 'admin') {
      trash = [];
    } else {
      trash = [];
    }
    this.saveTrash(trash);
  },

  getDaysUntilExpiry(expiresAt: string): number {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  },

  // ==========================================
  // UNIQUE IDENTIFIER CHECKS (MÃ, EMAIL, SỐ ĐIỆN THOẠI DUY NHẤT)
  // ==========================================
  normalizePhoneNumber(phone?: string | null): string {
    return normalizePhoneNumber(phone);
  },

  normalizeEmail(email?: string | null): string {
    return normalizeEmail(email);
  },

  isLecturerCodeTaken(code: string, excludeUserId?: string): boolean {
    if (!code) return false;
    const clean = code.trim().toLowerCase();
    const users = this.getUsers();
    return users.some(
      (u) =>
        u.id !== excludeUserId &&
        ((u.lecturerCode && u.lecturerCode.trim().toLowerCase() === clean) ||
          (u.studentCode && u.studentCode.trim().toLowerCase() === clean) ||
          (u.username && u.username.trim().toLowerCase() === clean))
    );
  },

  isStudentCodeTaken(code: string, excludeUserId?: string): boolean {
    if (!code) return false;
    const clean = code.trim().toLowerCase();
    const users = this.getUsers();
    return users.some(
      (u) =>
        u.id !== excludeUserId &&
        ((u.studentCode && u.studentCode.trim().toLowerCase() === clean) ||
          (u.lecturerCode && u.lecturerCode.trim().toLowerCase() === clean) ||
          (u.username && u.username.trim().toLowerCase() === clean))
    );
  },

  isEmailTaken(email: string, excludeUserId?: string): boolean {
    if (!email) return false;
    const clean = normalizeEmail(email);
    if (!clean) return false;
    const users = this.getUsers();
    return users.some((u) => u.id !== excludeUserId && normalizeEmail(u.email) === clean);
  },

  isPhoneNumberTaken(phoneNumber: string, excludeUserId?: string): boolean {
    if (!phoneNumber) return false;
    const clean = normalizePhoneNumber(phoneNumber);
    if (!clean || clean.length < 8) return false;
    const users = this.getUsers();
    return users.some(
      (u) => u.id !== excludeUserId && u.phoneNumber && normalizePhoneNumber(u.phoneNumber) === clean
    );
  },

  findConflictingUser(params: {
    code?: string;
    email?: string;
    phoneNumber?: string;
    username?: string;
    excludeUserId?: string;
  }): { conflictingUser: User; field: 'code' | 'email' | 'phone'; value: string } | null {
    const users = this.getUsers();
    const cleanCode = params.code ? params.code.trim().toLowerCase() : '';
    const cleanEmail = normalizeEmail(params.email);
    const cleanPhone = normalizePhoneNumber(params.phoneNumber);
    const cleanUsername = params.username ? params.username.trim().toLowerCase() : '';

    for (const u of users) {
      if (params.excludeUserId && u.id === params.excludeUserId) continue;

      // Check code
      if (cleanCode) {
        if (
          (u.studentCode && u.studentCode.trim().toLowerCase() === cleanCode) ||
          (u.lecturerCode && u.lecturerCode.trim().toLowerCase() === cleanCode) ||
          (u.username && u.username.trim().toLowerCase() === cleanCode)
        ) {
          return { conflictingUser: u, field: 'code', value: params.code! };
        }
      }

      // Check username
      if (cleanUsername) {
        if (
          (u.username && u.username.trim().toLowerCase() === cleanUsername) ||
          (u.studentCode && u.studentCode.trim().toLowerCase() === cleanUsername) ||
          (u.lecturerCode && u.lecturerCode.trim().toLowerCase() === cleanUsername)
        ) {
          return { conflictingUser: u, field: 'code', value: params.username! };
        }
      }

      // Check email
      if (cleanEmail && normalizeEmail(u.email) === cleanEmail) {
        return { conflictingUser: u, field: 'email', value: params.email! };
      }

      // Check phone number
      if (cleanPhone && cleanPhone.length >= 8 && u.phoneNumber && normalizePhoneNumber(u.phoneNumber) === cleanPhone) {
        return { conflictingUser: u, field: 'phone', value: params.phoneNumber! };
      }
    }

    return null;
  },

  validateUserUniqueness(
    data: {
      id?: string;
      code?: string;
      studentCode?: string;
      lecturerCode?: string;
      email?: string;
      phoneNumber?: string;
      username?: string;
    },
    excludeUserId?: string
  ): { valid: boolean; field?: 'code' | 'email' | 'phone'; message?: string; conflictingUser?: User } {
    const targetCode = data.studentCode || data.lecturerCode || data.code || data.username;
    const conflict = this.findConflictingUser({
      code: targetCode,
      email: data.email,
      phoneNumber: data.phoneNumber,
      username: data.username,
      excludeUserId: excludeUserId || data.id,
    });

    if (conflict) {
      if (conflict.field === 'code') {
        return {
          valid: false,
          field: 'code',
          conflictingUser: conflict.conflictingUser,
          message: `Mã "${conflict.value}" đã được sử dụng bởi người dùng "${conflict.conflictingUser.fullName}"! Mã sinh viên / giảng viên phải là duy nhất.`,
        };
      }
      if (conflict.field === 'email') {
        return {
          valid: false,
          field: 'email',
          conflictingUser: conflict.conflictingUser,
          message: `Email "${conflict.value}" đã được sử dụng bởi tài khoản "${conflict.conflictingUser.fullName}" (${conflict.conflictingUser.studentCode || conflict.conflictingUser.lecturerCode || conflict.conflictingUser.username})! (Cho phép các tài khoản có cùng đuôi @... nhưng địa chỉ đầy đủ phải khác nhau).`,
        };
      }
      if (conflict.field === 'phone') {
        return {
          valid: false,
          field: 'phone',
          conflictingUser: conflict.conflictingUser,
          message: `Số điện thoại "${conflict.value}" đã được sử dụng bởi tài khoản "${conflict.conflictingUser.fullName}" (${conflict.conflictingUser.studentCode || conflict.conflictingUser.lecturerCode || conflict.conflictingUser.username})! Số điện thoại phải là duy nhất.`,
        };
      }
    }

    return { valid: true };
  },

  isClassCodeTaken(code: string, excludeClassId?: string): boolean {
    if (!code) return false;
    const clean = code.trim().toLowerCase();
    const classes = this.getClasses();
    return classes.some((c) => c.id !== excludeClassId && c.code.trim().toLowerCase() === clean);
  },

  // ==========================================
  // UNDO GLOBAL HANDLER
  // ==========================================
  setActiveUndo(undo: UndoAction | null) {
    activeUndoAction = undo;
  },

  getActiveUndo(): UndoAction | null {
    return activeUndoAction;
  },

  executeUndo(): boolean {
    if (activeUndoAction && activeUndoAction.performUndo) {
      activeUndoAction.performUndo();
      activeUndoAction = null;
      return true;
    }
    return false;
  },

  // Notify outside students when lecturer checks in
  notifyOutsideStudentsOnLecturerCheckIn(cls: ClassRoom): number {
    const users = this.getUsers();
    const todayStr = new Date().toISOString().split('T')[0];
    const attendanceRecords = this.getAttendance();

    const classStudents = users.filter((u) => u.role === 'student' && cls.studentIds.includes(u.id));

    const outsideStudents = classStudents.filter((st) => {
      const record = attendanceRecords.find(
        (r) => r.classId === cls.id && r.studentId === st.id && r.date === todayStr
      );
      return !record || !record.checkInTime || !record.checkInWithinRadius;
    });

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const deadlineMinutes = cls.checkInDeadlineMinutes || 15;
    const deadlineTime = new Date(now.getTime() + deadlineMinutes * 60 * 1000);
    const deadlineTimeStr = `${deadlineTime.getHours().toString().padStart(2, '0')}:${deadlineTime
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    outsideStudents.forEach((st) => {
      const emailNotif: EmailNotification = {
        id: `email_urgent_${cls.id}_${st.id}_${Date.now()}`,
        toEmail: st.email,
        recipientName: st.fullName,
        studentCode: st.studentCode,
        classId: cls.id,
        className: cls.name,
        subject: `[KHẨN CẤP] Giảng viên đã điểm danh lớp ${cls.name} lúc ${timeStr}`,
        content: `Chào ${st.fullName} (${st.studentCode}),\n\nGiảng viên phụ trách đã có mặt và xác nhận điểm danh lớp "${cls.name}" lúc ${timeStr} tại ${cls.locationName}.\n\n⚠️ QUY ĐỊNH BẮT BUỘC: Bạn chỉ được phép điểm danh muộn tối đa ${deadlineMinutes} PHÚT kể từ khi giảng viên điểm danh.\n- Hạn chót điểm danh vào lớp: ${deadlineTimeStr} (Sau ${deadlineMinutes} phút nữa).\n- Quá thời gian này, hệ thống sẽ KHÓA ĐIỂM DANH VÀO và ghi nhận vắng mặt.\n\nVui lòng nhanh chóng có mặt trong bán kính quy định (${cls.radiusMeters}m) để hoàn tất điểm danh!`,
        sentAt: now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN'),
        type: 'lecturer_arrived_alert',
        status: 'delivered',
      };
      this.addEmail(emailNotif);
    });

    return outsideStudents.length;
  },

  // Schedule Conflict Check Utilities
  timeToMinutes(timeStr: string): number {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  },

  isTimeOverlapping(
    day1: number,
    start1: string,
    end1: string,
    day2: number,
    start2: string,
    end2: string
  ): boolean {
    if (day1 !== day2) return false;
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);
    return Math.max(s1, s2) < Math.min(e1, e2);
  },

  // Check if lecturer is already teaching another conflicting class
  checkLecturerConflict(
    lecturerId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    currentClassId?: string,
    locationName?: string,
    courseName?: string
  ): { hasConflict: boolean; conflictingClass?: ClassRoom; reason?: string } {
    const classes = this.getClasses();
    const otherClasses = classes.filter(
      (c) => c.lecturerId === lecturerId && (!currentClassId || c.id !== currentClassId)
    );

    for (const cls of otherClasses) {
      if (this.isTimeOverlapping(dayOfWeek, startTime, endTime, cls.dayOfWeek, cls.startTime, cls.endTime)) {
        const sameCourse = (courseName || '').trim().toLowerCase() === cls.name.trim().toLowerCase();
        const sameLoc = (locationName || '').trim().toLowerCase() === cls.locationName.trim().toLowerCase();

        if (sameCourse && sameLoc) {
          return {
            hasConflict: true,
            conflictingClass: cls,
            reason: `Giảng viên đã có lớp "${cls.name}" (${cls.code}) tại cùng địa điểm "${cls.locationName}" trong khung giờ ${cls.startTime} - ${cls.endTime} (Thứ ${cls.dayOfWeek === 7 ? 'Chủ nhật' : cls.dayOfWeek + 1}). Không thể tạo 2 lớp trùng lặp cùng ngày giờ, hãy gán thêm sinh viên vào lớp hiện có.`,
          };
        }

        return {
          hasConflict: true,
          conflictingClass: cls,
          reason: `Giảng viên đang dạy lớp "${cls.name}" (${cls.code}) tại "${cls.locationName}" trong khung giờ ${cls.startTime} - ${cls.endTime} (Thứ ${cls.dayOfWeek === 7 ? 'Chủ nhật' : cls.dayOfWeek + 1}). Giảng viên không thể cùng lúc dạy nhiều môn ở các vị trí khác nhau!`,
        };
      }
    }

    return { hasConflict: false };
  },

  // Check if any student in studentIds has a schedule conflict with an existing enrolled class
  checkStudentConflicts(
    studentIds: string[],
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    currentClassId?: string
  ): { hasConflict: boolean; studentName?: string; studentCode?: string; conflictingClass?: ClassRoom } {
    const classes = this.getClasses();
    const allUsers = this.getUsers();

    for (const studentId of studentIds) {
      const student = allUsers.find((u) => u.id === studentId);
      const enrolledClasses = classes.filter(
        (c) => c.studentIds.includes(studentId) && (!currentClassId || c.id !== currentClassId)
      );

      for (const cls of enrolledClasses) {
        if (this.isTimeOverlapping(dayOfWeek, startTime, endTime, cls.dayOfWeek, cls.startTime, cls.endTime)) {
          return {
            hasConflict: true,
            studentName: student?.fullName || studentId,
            studentCode: student?.studentCode || '',
            conflictingClass: cls,
          };
        }
      }
    }

    return { hasConflict: false };
  },

  // ==========================================
  // CAMPUS ROOMS & AVAILABILITY
  // ==========================================
  getCampusRooms(): CampusRoom[] {
    const str = localStorage.getItem(STORAGE_KEYS.CAMPUS_ROOMS);
    let rooms: CampusRoom[] = str ? JSON.parse(str) : [];
    
    // Ensure all default rooms exist
    if (!rooms || rooms.length === 0) {
      rooms = [...DEFAULT_CAMPUS_ROOMS];
      this.saveCampusRooms(rooms);
    } else {
      // Check if any default rooms are missing
      let modified = false;
      DEFAULT_CAMPUS_ROOMS.forEach((dRoom) => {
        const found = rooms.find((r) => r.name.trim().toLowerCase() === dRoom.name.trim().toLowerCase());
        if (!found) {
          rooms.push(dRoom);
          modified = true;
        } else if (!found.campus && dRoom.campus) {
          found.campus = dRoom.campus;
          modified = true;
        }
      });
      // Ensure all rooms have campus field
      rooms.forEach((r) => {
        if (!r.campus) {
          if (r.name.includes('Cơ sở 2') || r.building.includes('Cơ sở 2')) {
            r.campus = 'Cơ sở 2';
          } else if (r.name.includes('Hội trường') || r.building.includes('trung tâm')) {
            r.campus = 'Trụ sở chính';
          } else {
            r.campus = 'Cơ sở 1';
          }
          modified = true;
        }
      });
      if (modified) {
        this.saveCampusRooms(rooms);
      }
    }

    // Also include any custom room from existing classes if not in the list
    const classes = this.getClasses();
    let hasNewFromClasses = false;
    classes.forEach((cls) => {
      if (cls.locationName && !rooms.some((r) => r.name.trim().toLowerCase() === cls.locationName.trim().toLowerCase())) {
        rooms.push({
          id: `room_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: cls.locationName,
          campus: cls.locationName.includes('Cơ sở 2') ? 'Cơ sở 2' : 'Cơ sở 1',
          building: cls.locationName.includes('Giảng đường A') ? 'Giảng đường A' : cls.locationName.includes('Tòa nhà B') ? 'Tòa nhà B' : 'Khuôn viên trường',
          capacity: 60,
          type: cls.locationName.toLowerCase().includes('lab') ? 'Thực hành / Lab máy tính' : 'Lý thuyết',
          latitude: cls.latitude || 21.038234,
          longitude: cls.longitude || 105.782812,
          radiusMeters: cls.radiusMeters || 50,
        });
        hasNewFromClasses = true;
      }
    });

    if (hasNewFromClasses) {
      this.saveCampusRooms(rooms);
    }

    return rooms;
  },

  saveCampusRooms(rooms: CampusRoom[]) {
    localStorage.setItem(STORAGE_KEYS.CAMPUS_ROOMS, JSON.stringify(rooms));
  },

  // Check if a room is occupied in dayOfWeek during startTime - endTime
  checkRoomConflict(
    locationName: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    currentClassId?: string
  ): { hasConflict: boolean; conflictingClass?: ClassRoom; reason?: string } {
    const classes = this.getClasses();
    const cleanTargetName = (locationName || '').trim().toLowerCase();

    for (const cls of classes) {
      if (currentClassId && cls.id === currentClassId) continue;
      
      const cleanClsLoc = (cls.locationName || '').trim().toLowerCase();
      if (cleanClsLoc === cleanTargetName) {
        if (this.isTimeOverlapping(dayOfWeek, startTime, endTime, cls.dayOfWeek, cls.startTime, cls.endTime)) {
          const dayName = cls.dayOfWeek === 7 ? 'Chủ nhật' : `Thứ ${cls.dayOfWeek + 1}`;
          return {
            hasConflict: true,
            conflictingClass: cls,
            reason: `Phòng học "${cls.locationName}" đã có lớp "${cls.name}" (${cls.code}) đăng ký vào ${dayName} (${cls.startTime} - ${cls.endTime}). Không thể xếp trùng phòng học!`,
          };
        }
      }
    }

    return { hasConflict: false };
  },

  // Get only available (unoccupied) rooms for a given schedule slot
  getAvailableRoomsForSchedule(
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    currentClassId?: string
  ): CampusRoom[] {
    const allRooms = this.getCampusRooms();
    return allRooms.filter((room) => {
      const conflict = this.checkRoomConflict(room.name, dayOfWeek, startTime, endTime, currentClassId);
      return !conflict.hasConflict;
    });
  },

  // Get daily schedule for a room on a given dayOfWeek
  getRoomDailySchedule(locationName: string, dayOfWeek: number): ClassRoom[] {
    const classes = this.getClasses();
    const cleanTarget = (locationName || '').trim().toLowerCase();
    return classes
      .filter((c) => c.locationName.trim().toLowerCase() === cleanTarget && c.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  },

  // Add a new empty campus room for lecturers/admin to book
  addCampusRoom(room: Omit<CampusRoom, 'id'> & { id?: string }): CampusRoom {
    const rooms = this.getCampusRooms();
    const newRoom: CampusRoom = {
      id: room.id || `room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: room.name.trim(),
      campus: room.campus?.trim() || 'Cơ sở 1',
      building: room.building ? room.building.trim() : 'Khuôn viên trường',
      capacity: Number(room.capacity) || 60,
      type: room.type?.trim() || 'Lý thuyết',
      latitude: Number(room.latitude) || 21.038234,
      longitude: Number(room.longitude) || 105.782812,
      radiusMeters: Number(room.radiusMeters) || 50,
    };
    rooms.push(newRoom);
    this.saveCampusRooms(rooms);
    return newRoom;
  },

  // Delete a campus room with soft-delete into Trash (stored for 6 months)
  deleteCampusRoom(id: string, deletedByRole: Role = 'admin'): { success: boolean; trashItem?: TrashItem; previousRoom?: CampusRoom } {
    let rooms = this.getCampusRooms();
    const targetRoom = rooms.find((r) => r.id === id);
    if (!targetRoom) return { success: false };

    rooms = rooms.filter((r) => r.id !== id);
    this.saveCampusRooms(rooms);

    const trashItem = this.moveToTrash({
      id: `trash_room_${targetRoom.id}_${Date.now()}`,
      type: 'campus_room',
      title: targetRoom.name,
      code: targetRoom.campus,
      subtitle: `${targetRoom.building} • Sức chứa: ${targetRoom.capacity} SV (${targetRoom.type})`,
      deletedAt: new Date().toISOString(),
      data: targetRoom,
      deletedByRole: deletedByRole || 'admin',
    });

    return { success: true, trashItem, previousRoom: targetRoom };
  },

  // Delete multiple campus rooms with soft-delete into Trash (stored for 6 months)
  deleteCampusRooms(ids: string[], deletedByRole: Role = 'admin'): { successCount: number; trashItems: TrashItem[]; previousRooms: CampusRoom[] } {
    let rooms = this.getCampusRooms();
    const idSet = new Set(ids);
    const targets = rooms.filter((r) => idSet.has(r.id));
    if (targets.length === 0) return { successCount: 0, trashItems: [], previousRooms: [] };

    rooms = rooms.filter((r) => !idSet.has(r.id));
    this.saveCampusRooms(rooms);

    const trashItems: TrashItem[] = [];
    const now = new Date().toISOString();
    targets.forEach((targetRoom, index) => {
      const trashItem = this.moveToTrash({
        id: `trash_room_${targetRoom.id}_${Date.now()}_${index}`,
        type: 'campus_room',
        title: targetRoom.name,
        code: targetRoom.campus,
        subtitle: `${targetRoom.building} • Sức chứa: ${targetRoom.capacity} SV (${targetRoom.type})`,
        deletedAt: now,
        data: targetRoom,
        deletedByRole: deletedByRole || 'admin',
      });
      trashItems.push(trashItem);
    });

    return { successCount: targets.length, trashItems, previousRooms: targets };
  },

  getLeaveRequests(): LeaveRequest[] {
    const str = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
    return str ? JSON.parse(str) : [];
  },

  saveLeaveRequests(requests: LeaveRequest[]) {
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(requests));
  },

  // Kiểm tra sinh viên đã nộp đơn xin nghỉ cho môn học này vào ngày này chưa
  hasSubmittedLeaveRequest(studentId: string, classId: string, leaveDate: string): boolean {
    const requests = this.getLeaveRequests();
    return requests.some(
      (r) => r.studentId === studentId && r.classId === classId && r.leaveDate === leaveDate
    );
  },

  addLeaveRequest(req: LeaveRequest): { success: boolean; message?: string } {
    const requests = this.getLeaveRequests();

    // RULE: Sinh viên chỉ có thể gửi giấy xin phép vắng học một lần (cùng môn học, cùng ca học, cùng ngày)
    const existing = requests.find(
      (r) => r.studentId === req.studentId && r.classId === req.classId && r.leaveDate === req.leaveDate
    );
    if (existing) {
      return {
        success: false,
        message: `Bạn đã gửi đơn xin phép vắng học môn "${req.className}" vào ngày ${req.leaveDate} rồi! Theo quy định, sinh viên chỉ có thể gửi giấy xin phép vắng học một lần cho cùng môn học và cùng ngày.`,
      };
    }

    requests.unshift(req);
    this.saveLeaveRequests(requests);

    const admin = this.getAdminUser();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Thông báo gửi tới Admin
    const adminNotif: EmailNotification = {
      id: `email_leave_${req.id}_admin_${Date.now()}`,
      toEmail: admin.email,
      recipientName: 'Quản trị viên Hệ thống',
      studentCode: req.studentCode,
      classId: req.classId,
      className: req.className,
      subject: `[ĐƠN XIN VẮNG HỌC] Sinh viên ${req.studentName} (${req.studentCode}) xin nghỉ môn ${req.className}`,
      content: `Kính gửi Quản trị viên,\n\nSinh viên ${req.studentName} (${req.studentCode}) đã nộp đơn xin phép vắng học:\n- Lớp môn học: ${req.className}\n- Ngày xin nghỉ: ${req.leaveDate}\n- Số tiết ca học: ${req.periodsPerSession} tiết\n- Lý do xin nghỉ: ${req.reason}\n- Thời gian nộp đơn: ${req.submittedAt}\n- Trạng thái: Chờ giảng viên xác nhận.`,
      sentAt: `${timeStr} ${now.toLocaleDateString('vi-VN')}`,
      type: 'leave_request_submitted',
      status: 'delivered',
    };
    this.addEmail(adminNotif);

    // Thông báo gửi tới Giảng viên phụ trách
    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === req.classId);
    if (cls) {
      const users = this.getUsers();
      const lecturer = users.find((u) => u.id === cls.lecturerId);
      if (lecturer && lecturer.email) {
        const lecNotif: EmailNotification = {
          id: `email_leave_${req.id}_lec_${Date.now()}`,
          toEmail: lecturer.email,
          recipientName: lecturer.fullName,
          studentCode: req.studentCode,
          classId: req.classId,
          className: req.className,
          subject: `[ĐƠN XIN VẮNG HỌC] Sinh viên ${req.studentName} (${req.studentCode}) xin nghỉ môn ${req.className} ngày ${req.leaveDate}`,
          content: `Kính gửi Thầy/Cô ${lecturer.fullName},\n\nSinh viên ${req.studentName} (${req.studentCode}) thuộc lớp "${req.className}" đã nộp đơn xin phép vắng học:\n- Ngày xin nghỉ: ${req.leaveDate}\n- Lý do: ${req.reason}\n- Thời gian nộp: ${req.submittedAt}\n\nVui lòng xem xét phê duyệt hoặc từ chối đơn trong hệ thống ca giảng dạy.`,
          sentAt: `${timeStr} ${now.toLocaleDateString('vi-VN')}`,
          type: 'leave_request_submitted',
          status: 'delivered',
        };
        this.addEmail(lecNotif);
      }
    }

    return { success: true };
  },

  updateLeaveRequest(id: string, updates: Partial<LeaveRequest>, reviewer?: User) {
    const requests = this.getLeaveRequests();
    const idx = requests.findIndex((r) => r.id === id);
    if (idx === -1) return;

    const oldReq = requests[idx];
    const updatedReq: LeaveRequest = {
      ...oldReq,
      ...updates,
      lecturerId: reviewer?.id || oldReq.lecturerId,
      lecturerName: reviewer?.fullName || oldReq.lecturerName,
      lecturerReviewedAt: new Date().toLocaleString('vi-VN'),
    };

    // Calculate absent periods count according to user rule:
    // - approved: vắng 1/2 số tiết (ví dụ ca 4 tiết -> 2 tiết)
    // - rejected: nếu không đến tính vắng 100% (4 tiết)
    // - pending: 0
    if (updatedReq.status === 'approved') {
      updatedReq.absentPeriodsCount = Math.round((updatedReq.periodsPerSession || 4) / 2);
    } else if (updatedReq.status === 'rejected') {
      updatedReq.absentPeriodsCount = updatedReq.periodsPerSession || 4;
    } else {
      updatedReq.absentPeriodsCount = 0;
    }

    requests[idx] = updatedReq;
    this.saveLeaveRequests(requests);

    // If leave request is approved for today, automatically mark today's attendance as excused
    const todayStr = new Date().toISOString().split('T')[0];
    if (updatedReq.leaveDate === todayStr) {
      const records = this.getAttendance();
      const existingRec = records.find(
        (r) => r.classId === updatedReq.classId && r.studentId === updatedReq.studentId && r.date === todayStr
      );
      if (updatedReq.status === 'approved') {
        const excuseRecord: AttendanceRecord = {
          id: existingRec ? existingRec.id : `att_${updatedReq.classId}_${updatedReq.studentId}_${todayStr}`,
          classId: updatedReq.classId,
          className: updatedReq.className,
          classCode: updatedReq.classCode,
          studentId: updatedReq.studentId,
          studentCode: updatedReq.studentCode,
          studentName: updatedReq.studentName,
          date: todayStr,
          checkInStatus: 'absent',
          finalStatus: 'absent',
          earlyLeaveApproved: true,
          earlyLeaveApprovedBy: reviewer?.id,
          earlyLeaveApprovedAt: new Date().toLocaleTimeString('vi-VN'),
          notes: `Vắng có phép (Được duyệt - tính vắng ${updatedReq.absentPeriodsCount} tiết): ${updatedReq.reason}`,
        };
        this.recordAttendance(excuseRecord);
      }
    }

    // Send notification to Student
    const users = this.getUsers();
    const student = users.find((u) => u.id === updatedReq.studentId);
    if (student && student.email) {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const statusText =
        updatedReq.status === 'approved'
          ? 'ĐÃ ĐƯỢC CHẤP THUẬN (Hệ thống tính vắng 1/2 số tiết)'
          : 'BỊ TỪ CHỐI (Nếu không đến lớp sẽ tính vắng 100% số tiết, nếu đến điểm danh trong bán kính sẽ tính Đi muộn)';

      const notif: EmailNotification = {
        id: `email_leave_res_${updatedReq.id}_${Date.now()}`,
        toEmail: student.email,
        recipientName: student.fullName,
        studentCode: student.studentCode,
        classId: updatedReq.classId,
        className: updatedReq.className,
        subject: `[KẾT QUẢ ĐƠN XIN NGHỈ] Đơn xin nghỉ ngày ${updatedReq.leaveDate} môn ${updatedReq.className}: ${updatedReq.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}`,
        content: `Chào ${student.fullName},\n\nĐơn xin phép vắng học của bạn đã được giảng viên ${reviewer?.fullName || 'phụ trách'} xử lý:\n- Môn học: ${updatedReq.className}\n- Ngày xin nghỉ: ${updatedReq.leaveDate}\n- Kết quả: ${statusText}\n${updatedReq.lecturerNotes ? `- Ghi chú của giảng viên: ${updatedReq.lecturerNotes}\n` : ''}\nVui lòng lưu ý theo dõi chuyên cần học tập theo đúng quy chế đào tạo.`,
        sentAt: `${timeStr} ${now.toLocaleDateString('vi-VN')}`,
        type: 'leave_request_result',
        status: 'delivered',
      };
      this.addEmail(notif);
    }
  },

  // Report student who left geofence during class without approval
  reportStudentLeftClass(student: User, cls: ClassRoom, distanceMeters: number) {
    const todayStr = new Date().toISOString().split('T')[0];
    const alertId = `walkout_${cls.id}_${student.id}_${todayStr}`;
    const emails = this.getEmails();
    if (emails.some((e) => e.id.startsWith(alertId))) {
      return; // Already notified today
    }

    const admin = this.getAdminUser();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Admin notification
    const adminNotif: EmailNotification = {
      id: `${alertId}_admin_${Date.now()}`,
      toEmail: admin.email,
      recipientName: 'Quản trị viên Hệ thống',
      studentCode: student.studentCode,
      classId: cls.id,
      className: cls.name,
      subject: `[CẢNH BÁO RỜI LỚP] Sinh viên ${student.fullName} (${student.studentCode || student.username}) rời khỏi lớp học ${cls.name}`,
      content: `Kính gửi Quản trị viên,\n\nHệ thống GPS phát hiện sinh viên ĐÃ RỜI KHỎI PHẠM VI LỚP HỌC khi chưa hết thời gian học quy định:\n- Sinh viên: ${student.fullName} (Mã SV: ${student.studentCode || student.username})\n- Lớp học: ${cls.name} (${cls.code})\n- Khoảng cách hiện tại: ${distanceMeters}m (Vượt quá bán kính cho phép ${cls.radiusMeters}m)\n- Thời gian phát hiện: ${timeStr} ngày ${now.toLocaleDateString('vi-VN')}\n- Trạng thái xin phép: Chưa nộp đơn xin phép hoặc chưa được phê duyệt.\n\nThông báo gửi về Admin và Giảng viên để theo dõi và xử lý kỷ luật.`,
      sentAt: `${timeStr} ${now.toLocaleDateString('vi-VN')}`,
      type: 'walkout_alert',
      status: 'delivered',
    };
    this.addEmail(adminNotif);

    // Lecturer notification
    const users = this.getUsers();
    const lecturer = users.find((u) => u.id === cls.lecturerId);
    if (lecturer && lecturer.email) {
      const lecNotif: EmailNotification = {
        id: `${alertId}_lec_${Date.now()}`,
        toEmail: lecturer.email,
        recipientName: lecturer.fullName,
        studentCode: student.studentCode,
        classId: cls.id,
        className: cls.name,
        subject: `[CẢNH BÁO RỜI LỚP] Sinh viên ${student.fullName} (${student.studentCode || student.username}) tự ý rời khỏi lớp học ${cls.name}`,
        content: `Kính gửi Thầy/Cô ${lecturer.fullName},\n\nSinh viên ${student.fullName} (${student.studentCode || student.username}) đã rời khỏi phạm vi lớp học "${cls.name}" (cách vị trí lớp ${distanceMeters}m) khi chưa hết giờ học quy định (${cls.startTime} - ${cls.endTime}) và chưa có xác nhận duyệt xin phép.\nThời gian phát hiện: ${timeStr}.`,
        sentAt: `${timeStr} ${now.toLocaleDateString('vi-VN')}`,
        type: 'walkout_alert',
        status: 'delivered',
      };
      this.addEmail(lecNotif);
    }

    // Update attendance record with walkout flag
    const records = this.getAttendance();
    const recIdx = records.findIndex((r) => r.classId === cls.id && r.studentId === student.id && r.date === todayStr);
    if (recIdx !== -1) {
      records[recIdx] = {
        ...records[recIdx],
        isLeftDuringClass: true,
        leftDuringClassAt: timeStr,
        checkInWithinRadius: false,
        checkInDistanceMeters: distanceMeters,
      };
      this.saveAttendance(records);
    }
  },

  // Send reminder from Admin to a student about absences
  sendAbsenceReminder(student: User, cls: ClassRoom, absentCount: number, absentPeriods: number) {
    const admin = this.getAdminUser();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const settings = this.getSystemSettings();
    const minExam1 = settings.minAttendancePercentage || 80;
    const minReExam = settings.minReExamPercentage ?? 50;

    if (student.email) {
      const notif: EmailNotification = {
        id: `email_remind_${cls.id}_${student.id}_${Date.now()}`,
        toEmail: student.email,
        recipientName: student.fullName,
        studentCode: student.studentCode,
        classId: cls.id,
        className: cls.name,
        subject: `[CẢNH BÁO CHUYÊN CẦN] Nhắc nhở vắng học môn ${cls.name}`,
        content: `Chào sinh viên ${student.fullName} (${student.studentCode || student.username}),\n\nPhòng Đào tạo / Ban Quản trị thông báo nhắc nhở về tình hình chuyên cần của bạn tại học phần "${cls.name}":\n- Số lần vắng học ghi nhận: ${absentCount} buổi (Tổng ${absentPeriods} tiết vắng)\n- Quy định xét tư cách thi hiện hành của Nhà trường:\n  + Chuyên cần dưới ${minExam1}%: KHÔNG ĐƯỢC THI LẦN 1 (phải thi lại đợt 2 nếu đạt từ ${minReExam}%).\n  + Chuyên cần dưới ${minReExam}%: BỊ CẤM THI HOÀN TOÀN (bắt buộc học lại môn).\n\nVui lòng nghiêm túc tham gia đầy đủ các buổi học tiếp theo và tuân thủ quy định điểm danh!`,
        sentAt: `${timeStr} ${now.toLocaleDateString('vi-VN')}`,
        type: 'absence_reminder',
        status: 'delivered',
      };
      this.addEmail(notif);
    }
  },

  // End class early: mark unexcused non-attenders as "Bỏ học" (dropped)
  endClassEarlyWithDroppedStatus(clsId: string) {
    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === clsId);
    if (!cls) return;

    this.updateClass(clsId, {
      liveSessionEndedEarly: true,
      isLiveSessionActive: false,
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const records = this.getAttendance();
    const leaveRequests = this.getLeaveRequests();
    const allUsers = this.getUsers();

    // Check each student in class
    cls.studentIds.forEach((stId) => {
      const student = allUsers.find((u) => u.id === stId);
      if (!student) return;

      const rec = records.find((r) => r.classId === cls.id && r.studentId === stId && r.date === todayStr);
      const hasApprovedLeave = leaveRequests.some(
        (lr) => lr.classId === cls.id && lr.studentId === stId && lr.leaveDate === todayStr && lr.status === 'approved'
      );

      // If student did not check in and has no approved leave -> "Bỏ học"
      if ((!rec || !rec.checkInTime) && !hasApprovedLeave) {
        const droppedRecord: AttendanceRecord = {
          id: rec ? rec.id : `att_${cls.id}_${stId}_${todayStr}`,
          classId: cls.id,
          className: cls.name,
          classCode: cls.code,
          studentId: stId,
          studentCode: student.studentCode || student.username,
          studentName: student.fullName,
          date: todayStr,
          checkInStatus: 'absent',
          finalStatus: 'dropped',
          notes: 'Bỏ học (Lớp kết thúc sớm nhưng sinh viên không đến điểm danh và không có lý do xin nghỉ)',
        };
        this.recordAttendance(droppedRecord);

        // Also report absence to Admin
        this.recordAbsence(
          student,
          cls,
          'Bỏ học: Lớp học kết thúc sớm nhưng sinh viên không đến điểm danh và không nộp đơn xin phép vắng học'
        );
      } else if (rec && (rec.checkOutStatus === 'pending_approval' || rec.checkOutStatus === 'early')) {
        this.recordAttendance({
          ...rec,
          earlyLeaveApproved: true,
          checkOutStatus: 'excused',
        });
      }
    });

    // Notify students that class ended early
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const classStudents = allUsers.filter((u) => u.role === 'student' && cls.studentIds.includes(u.id));
    classStudents.forEach((st) => {
      if (st.email) {
        this.addEmail({
          id: `email_early_end_${cls.id}_${st.id}_${Date.now()}`,
          toEmail: st.email,
          recipientName: st.fullName,
          studentCode: st.studentCode,
          classId: cls.id,
          className: cls.name,
          subject: `[KẾT THÚC LỚP SỚM] Giảng viên đã kết thúc lớp học ${cls.name}`,
          content: `Chào ${st.fullName} (${st.studentCode}),\n\nGiảng viên phụ trách đã xác nhận KẾT THÚC LỚP HỌC SỚM lớp "${cls.name}" lúc ${timeStr}.\nNhững sinh viên không có mặt và không nộp đơn xin nghỉ đã được hệ thống ghi nhận là "Bỏ học".`,
          sentAt: `${timeStr} ${now.toLocaleDateString('vi-VN')}`,
          type: 'class_ended_early',
          status: 'delivered',
        });
      }
    });
  },

  // Notify students when class resumed from break
  notifyClassResumed(cls: ClassRoom) {
    const allUsers = this.getUsers();
    const classStudents = allUsers.filter((u) => u.role === 'student' && cls.studentIds.includes(u.id));
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    classStudents.forEach((st) => {
      if (st.email) {
        this.addEmail({
          id: `email_resumed_${cls.id}_${st.id}_${Date.now()}`,
          toEmail: st.email,
          recipientName: st.fullName,
          studentCode: st.studentCode,
          classId: cls.id,
          className: cls.name,
          subject: `[LỚP HỌC ĐÃ TIẾP TỤC] Lớp ${cls.name} đã hết giờ nghỉ giải lao`,
          content: `Chào ${st.fullName} (${st.studentCode}),\n\nLớp học đã tiếp tục, vui lòng quay trở lại lớp học trong thời gian quy định! (Thời gian quy định: 5 phút).\nThời điểm tiếp tục: ${timeStr} tại ${cls.locationName}.\n\nSau 5 phút, hệ thống GPS sẽ quét xung quanh; sinh viên ở ngoài phạm vi sẽ bị cảnh báo và ghi nhận vi phạm!`,
          sentAt: `${timeStr} ${now.toLocaleDateString('vi-VN')}`,
          type: 'class_resumed',
          status: 'delivered',
        });
      }
    });
  },

  // Auto finish class when scheduled end time arrives
  handleClassEndTimeAutoFinish(cls: ClassRoom, todayStr: string, currentLat?: number | null, currentLng?: number | null) {
    const records = this.getAttendance();
    const leaveRequests = this.getLeaveRequests();

    records.forEach((rec) => {
      if (rec.classId === cls.id && rec.date === todayStr && rec.checkInTime) {
        // If already completed checkout, don't overwrite
        if (rec.checkOutTime && rec.checkOutStatus === 'normal') {
          return;
        }

        // If student was recorded leaving during class or outside radius and has no approved early leave:
        const hasApprovedLeave =
          rec.earlyLeaveApproved ||
          leaveRequests.some(
            (lr) =>
              lr.classId === cls.id &&
              lr.studentId === rec.studentId &&
              lr.leaveDate === todayStr &&
              lr.status === 'approved'
          );

        const isOutsideNow =
          rec.isLeftDuringClass ||
          rec.checkInWithinRadius === false ||
          (currentLat !== undefined &&
            currentLat !== null &&
            currentLng !== undefined &&
            currentLng !== null &&
            calculateDistanceMeters(currentLat, currentLng, cls.latitude, cls.longitude) > cls.radiusMeters);

        if (isOutsideNow && !hasApprovedLeave) {
          rec.checkOutTime = rec.checkOutTime || cls.endTime;
          rec.checkOutStatus = 'early';
          rec.finalStatus = 'early_exit';
          rec.notes = (rec.notes ? `${rec.notes} • ` : '') + 'Bỏ về sớm (Ở ngoài phạm vi khi kết thúc lớp học không có lý do xin về sớm hay xin nghỉ)';
          this.recordAttendance(rec);
        } else if (!rec.checkOutTime) {
          // Normal auto check out for students who stayed inside
          rec.checkOutTime = cls.endTime;
          rec.checkOutStatus = 'normal';
          if (rec.checkInStatus === 'on_time' && rec.finalStatus !== 'late') {
            rec.finalStatus = 'present';
          }
          this.recordAttendance(rec);
        }
      }
    });
  },

  // Calculate student absence summaries across all classes and enrolled students
  getStudentAbsenceSummaries(): {
    student: User;
    cls: ClassRoom;
    totalAbsences: number;
    totalAbsentPeriods: number;
    totalClassPeriods: number;
    absenceRatePercent: number;
    attendanceRatePercent: number;
    qualificationStatus: 'qualified' | 're_exam' | 'disqualified';
    minExam1Percent: number;
    minReExamPercent: number;
    isDanger: boolean;
    isWarning: boolean;
    records: AttendanceRecord[];
    leaveRequests: LeaveRequest[];
  }[] {
    const users = this.getUsers();
    const students = users.filter((u) => u.role === 'student');
    const classes = this.getClasses();
    const attendance = this.getAttendance();
    const leaveRequests = this.getLeaveRequests();

    const summaries: {
      student: User;
      cls: ClassRoom;
      totalAbsences: number;
      totalAbsentPeriods: number;
      totalClassPeriods: number;
      absenceRatePercent: number;
      attendanceRatePercent: number;
      qualificationStatus: 'qualified' | 're_exam' | 'disqualified';
      minExam1Percent: number;
      minReExamPercent: number;
      isDanger: boolean;
      isWarning: boolean;
      records: AttendanceRecord[];
      leaveRequests: LeaveRequest[];
    }[] = [];

    classes.forEach((cls) => {
      const periodsPerSession = cls.periodsPerSession || 4;
      const totalClassPeriods = cls.totalPeriods || ((cls.credits || 3) * 15);

      cls.studentIds.forEach((stId) => {
        const student = students.find((s) => s.id === stId);
        if (!student) return;

        const studentRecords = attendance.filter((r) => r.classId === cls.id && r.studentId === stId);
        const studentLeaves = leaveRequests.filter((l) => l.classId === cls.id && l.studentId === stId);

        // Count absences from attendance records
        // finalStatus: 'absent' or 'dropped' or 'early_exit' without approved excuse
        let absentPeriods = 0;
        let absentSessionsCount = 0;

        // Process leave requests for this class
        studentLeaves.forEach((lr) => {
          if (lr.status === 'approved') {
            // Giảng viên đã xác nhận: tính vắng 1/2 số tiết
            absentPeriods += Math.round(periodsPerSession / 2);
            absentSessionsCount += 1;
          } else if (lr.status === 'rejected') {
            // Giảng viên không đồng ý: kiểm tra nếu sinh viên không điểm danh trong ngày đó -> vắng 100% tiết
            const dayAtt = studentRecords.find((r) => r.date === lr.leaveDate);
            if (!dayAtt || !dayAtt.checkInTime) {
              absentPeriods += periodsPerSession;
              absentSessionsCount += 1;
            }
          }
        });

        // Process attendance records that don't overlap with leave requests
        const leaveDates = new Set(studentLeaves.map((l) => l.leaveDate));
        studentRecords.forEach((r) => {
          if (!leaveDates.has(r.date)) {
            if (r.finalStatus === 'absent' || r.finalStatus === 'dropped') {
              absentPeriods += periodsPerSession;
              absentSessionsCount += 1;
            } else if (r.finalStatus === 'early_exit' && !r.earlyLeaveApproved) {
              absentPeriods += Math.round(periodsPerSession / 2);
              absentSessionsCount += 1;
            }
          }
        });

        if (absentSessionsCount > 0 || studentLeaves.length > 0) {
          const settings = this.getSystemSettings();
          const minExam1 = settings.minAttendancePercentage || 80;
          const minReExam = settings.minReExamPercentage ?? 50;

          const absenceRatePercent = totalClassPeriods > 0 ? Math.round((absentPeriods / totalClassPeriods) * 100) : 0;
          const attendanceRatePercent = Math.max(0, 100 - absenceRatePercent);

          // Evaluation according to Admin's exact dual threshold settings:
          // 1. Cấm thi hoàn toàn / Học lại: Chuyên cần < minReExam
          // 2. Không được thi lần 1 / Xét thi lại: minReExam <= Chuyên cần < minExam1
          // 3. Đủ điều kiện thi lần 1: Chuyên cần >= minExam1
          const isDanger = attendanceRatePercent < minReExam;
          const isWarning = attendanceRatePercent >= minReExam && attendanceRatePercent < minExam1;
          const qualificationStatus: 'disqualified' | 're_exam' | 'qualified' = isDanger
            ? 'disqualified'
            : isWarning
            ? 're_exam'
            : 'qualified';

          summaries.push({
            student,
            cls,
            totalAbsences: absentSessionsCount,
            totalAbsentPeriods: absentPeriods,
            totalClassPeriods,
            absenceRatePercent,
            attendanceRatePercent,
            qualificationStatus,
            minExam1Percent: minExam1,
            minReExamPercent: minReExam,
            isDanger,
            isWarning,
            records: studentRecords,
            leaveRequests: studentLeaves,
          });
        }
      });
    });

    return summaries;
  },
};
