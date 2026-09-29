import React, { useState } from 'react';
import {
  Mail,
  Send,
  X,
  Clock,
  CheckCircle2,
  User as UserIcon,
  Bell,
  AlertTriangle,
  MessageSquare,
  Camera,
  ShieldAlert,
  Check,
  Trash2,
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { EmailNotification, ClassRoom, User, AnomalyReport } from '../../types';

interface EmailNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  currentUser: User;
  reports?: AnomalyReport[];
  onRefreshData?: () => void;
}

export const EmailNotificationDrawer: React.FC<EmailNotificationDrawerProps> = ({
  isOpen,
  onClose,
  classes,
  currentUser,
  reports = [],
  onRefreshData,
}) => {
  const isStudent = currentUser.role === 'student';
  const isAdmin = currentUser.role === 'admin';
  const [emails, setEmails] = useState<EmailNotification[]>(() => StorageService.getEmails());
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'violations' | 'send'>('inbox');
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Student explanation state
  const [explainingReportId, setExplainingReportId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  if (!isOpen) return null;

  // Strict role-based notification filtering:
  // - Students: ONLY receive notifications addressed to them (reminders, lecturer arrived alert, late/absent notices)
  // - Admin: NEVER receives lecturer arrived or reminder alerts! ONLY receives "late_attendance" (đi chậm), "absence_alert" (không tới lớp), and administrative reports.
  const displayEmails = StorageService.filterEmailsForUser(currentUser, emails);

  // Sub-filter by category
  const filteredEmails = displayEmails.filter((em) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'late') return em.type === 'late_attendance';
    if (categoryFilter === 'absence') return em.type === 'absence_alert';
    if (categoryFilter === 'violation') return em.type === 'violation_report';
    if (categoryFilter === 'schedule') return em.type === 'schedule_adjustment' || em.type === 'class_cancelled';
    if (categoryFilter === 'arrived') return em.type === 'lecturer_arrived_alert';
    if (categoryFilter === 'reminder') return em.type === 'attendance_reminder';
    return true;
  });

  // Category counts
  const lateCount = displayEmails.filter((e) => e.type === 'late_attendance').length;
  const absenceCount = displayEmails.filter((e) => e.type === 'absence_alert').length;
  const violationCount = displayEmails.filter((e) => e.type === 'violation_report').length;
  const scheduleCount = displayEmails.filter((e) => e.type === 'schedule_adjustment' || e.type === 'class_cancelled').length;
  const arrivedCount = displayEmails.filter((e) => e.type === 'lecturer_arrived_alert').length;
  const reminderCount = displayEmails.filter((e) => e.type === 'attendance_reminder').length;

  // Filter violation reports for this student if student role
  const studentReports = isStudent
    ? reports.filter(
        (r) =>
          r.studentId === currentUser.id ||
          (r.studentCode && currentUser.studentCode && r.studentCode.toLowerCase() === currentUser.studentCode.toLowerCase())
      )
    : reports;

  const handleSendReminderBlast = () => {
    if (isStudent) return; // Strict: student cannot send blast

    const cls = classes.find((c) => c.id === selectedClassId);
    if (!cls) return;

    setIsSending(true);
    setSentMessage(null);

    const allUsers = StorageService.getUsers();
    const studentsInClass = allUsers.filter((u) => cls.studentIds.includes(u.id));

    if (studentsInClass.length === 0) {
      alert('Lớp học này hiện chưa có sinh viên nào trong danh sách!');
      setIsSending(false);
      return;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    studentsInClass.forEach((st) => {
      const emailNotif: EmailNotification = {
        id: `email_${Date.now()}_${st.id}`,
        toEmail: st.email,
        recipientName: st.fullName,
        studentCode: st.studentCode,
        classId: cls.id,
        className: cls.name,
        subject: `[Nhắc nhở điểm danh] Lớp ${cls.name} (${cls.code}) bắt đầu lúc ${cls.startTime}`,
        content: `Chào ${st.fullName} (${st.studentCode}),\n\nCa học môn "${cls.name}" diễn ra lúc ${cls.startTime} tại ${cls.locationName}.\n\nVui lòng có mặt đúng giờ và hoàn tất điểm danh trước khi hết thời hạn quy định (trong vòng ${cls.checkInDeadlineMinutes || 15} phút sau khi giảng viên điểm danh).\n\nTrân trọng,\nBan Quản Lý Đào Tạo & Giảng Viên Phụ Trách`,
        sentAt: now.toLocaleString('vi-VN'),
        type: 'attendance_reminder',
        status: 'delivered',
      };
      StorageService.addEmail(emailNotif);
    });

    setTimeout(() => {
      setEmails(StorageService.getEmails());
      setIsSending(false);
      setSentMessage(`Đã gửi email thông báo thành công đến ${studentsInClass.length} sinh viên của lớp "${cls.name}"!`);
      setActiveTab('inbox');
    }, 400);
  };

  const handleStudentSubmitExplanation = (report: AnomalyReport) => {
    if (!responseText.trim()) {
      alert('Vui lòng nhập nội dung giải trình');
      return;
    }

    StorageService.updateReport(report.id, {
      studentResponse: responseText.trim(),
      studentRespondedAt: new Date().toLocaleString('vi-VN'),
    });

    setExplainingReportId(null);
    setResponseText('');
    onRefreshData?.();
    alert('Đã gửi phản hồi giải trình vi phạm đến Giảng viên và Quản trị viên!');
  };

  // Delete individual notification
  const handleDeleteEmail = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = StorageService.deleteEmail(id);
    setEmails(updated);
    onRefreshData?.();
  };

  // Clear all notifications for current user
  const handleClearAllEmails = () => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn XÓA TẤT CẢ THÔNG BÁO trong hộp thư để giải phóng bộ nhớ và tránh nghẽn hệ thống?'
      )
    ) {
      return;
    }
    const updated = StorageService.clearEmailsForUser(currentUser);
    setEmails(updated);
    onRefreshData?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-sky-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-100 bg-linear-to-r from-sky-50 to-white px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {isStudent
                  ? 'Hộp Thư Sinh Viên & Nhắc Điểm Danh'
                  : isAdmin
                  ? 'Giám Sát Chuyên Cần & Vi Phạm (Admin)'
                  : 'Trung Tâm Thông Báo Lớp Học'}
              </h3>
              <p className="text-xs text-slate-500">
                {isStudent
                  ? 'Theo dõi thông báo Giảng viên đã điểm danh, Nhắc nhở ca học và phản hồi vi phạm'
                  : isAdmin
                  ? 'Tự động tiếp nhận thông báo sinh viên Đi chậm, Không tới lớp học, Báo cáo vi phạm và Điều chỉnh lịch'
                  : 'Hệ thống thông báo và cảnh báo chuyên cần lớp học'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'inbox'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Mail className="h-3.5 w-3.5" /> Thông báo hộp thư ({displayEmails.length})
          </button>

          <button
            onClick={() => setActiveTab('violations')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'violations'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            {isStudent ? 'Báo cáo vi phạm & Giải trình' : 'Báo cáo vi phạm'} ({studentReports.length})
          </button>

          {!isStudent && (
            <button
              onClick={() => setActiveTab('send')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
                activeTab === 'send'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Send className="h-3.5 w-3.5" /> Phát thông báo lớp học
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {sentMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{sentMessage}</span>
            </div>
          )}

          {/* TAB 1: INBOX NOTIFICATIONS */}
          {activeTab === 'inbox' && (
            <div className="space-y-3">
              {/* Guidance Info Banner */}
              {isAdmin ? (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">Quy tắc tiếp nhận thông báo tự động cho Quản trị viên (Admin):</p>
                    <p className="text-[11px] text-amber-800">
                      Hộp thư Admin tự động nhận các báo cáo: <strong>Đi chậm / Vào muộn</strong>, <strong>Không tới lớp học (Vắng mặt)</strong>, <strong>Báo cáo vi phạm</strong> và <strong>Điều chỉnh lịch dạy</strong>.
                      <br />
                      <em>(Thông báo "Giảng viên đã điểm danh" và "Nhắc nhở điểm danh" được chuyển thẳng đến tài khoản Sinh viên, không gửi về tài khoản Admin).</em>
                    </p>
                  </div>
                </div>
              ) : isStudent ? (
                <div className="p-3 bg-sky-50/80 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start gap-2">
                  <Bell className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">Hộp thư cá nhân Sinh viên:</p>
                    <p className="text-[11px] text-sky-800">
                      Tiếp nhận thông báo khẩn cấp khi <strong>Giảng viên đã điểm danh</strong> (hạn chót điểm danh 5 - 30 phút sau khi GV điểm danh), <strong>Nhắc nhở điểm danh ca học</strong>, cùng các cảnh báo khi đi muộn hoặc không tới lớp.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Category Filter Chips & Clear Storage Button */}
              {displayEmails.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCategoryFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                        categoryFilter === 'all'
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Tất cả ({displayEmails.length})
                    </button>

                    {isAdmin && (
                      <>
                        {lateCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setCategoryFilter('late')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              categoryFilter === 'late'
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-100/70 text-amber-800 hover:bg-amber-100'
                            }`}
                          >
                            🚨 Đi chậm ({lateCount})
                          </button>
                        )}
                        {absenceCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setCategoryFilter('absence')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              categoryFilter === 'absence'
                                ? 'bg-rose-700 text-white'
                                : 'bg-rose-100/70 text-rose-800 hover:bg-rose-100'
                            }`}
                          >
                            ❌ Không tới lớp ({absenceCount})
                          </button>
                        )}
                        {violationCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setCategoryFilter('violation')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              categoryFilter === 'violation'
                                ? 'bg-purple-700 text-white'
                                : 'bg-purple-100/70 text-purple-800 hover:bg-purple-100'
                            }`}
                          >
                            ⚠️ Vi phạm ({violationCount})
                          </button>
                        )}
                        {scheduleCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setCategoryFilter('schedule')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              categoryFilter === 'schedule'
                                ? 'bg-sky-700 text-white'
                                : 'bg-sky-100/70 text-sky-800 hover:bg-sky-100'
                            }`}
                          >
                            📅 Lịch học ({scheduleCount})
                          </button>
                        )}
                      </>
                    )}

                    {isStudent && (
                      <>
                        {arrivedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setCategoryFilter('arrived')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              categoryFilter === 'arrived'
                                ? 'bg-rose-600 text-white'
                                : 'bg-rose-100/70 text-rose-800 hover:bg-rose-100'
                            }`}
                          >
                            🔔 Giảng viên đã điểm danh ({arrivedCount})
                          </button>
                        )}
                        {reminderCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setCategoryFilter('reminder')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              categoryFilter === 'reminder'
                                ? 'bg-sky-600 text-white'
                                : 'bg-sky-100/70 text-sky-800 hover:bg-sky-100'
                            }`}
                          >
                            ⏰ Nhắc nhở ca học ({reminderCount})
                          </button>
                        )}
                        {lateCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setCategoryFilter('late')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              categoryFilter === 'late'
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-100/70 text-amber-800 hover:bg-amber-100'
                            }`}
                          >
                            🚨 Đi chậm ({lateCount})
                          </button>
                        )}
                        {absenceCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setCategoryFilter('absence')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              categoryFilter === 'absence'
                                ? 'bg-rose-700 text-white'
                                : 'bg-rose-100/70 text-rose-800 hover:bg-rose-100'
                            }`}
                          >
                            ❌ Vắng học ({absenceCount})
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleClearAllEmails}
                    title="Xóa toàn bộ thông báo hộp thư để chống đầy dữ liệu làm nghẽn hệ thống"
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer flex items-center gap-1 shrink-0 ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Dọn sạch hộp thư</span>
                  </button>
                </div>
              )}

              {filteredEmails.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Mail className="h-10 w-10 mx-auto mb-2 opacity-50 text-sky-400" />
                  <p className="text-sm font-medium">
                    {categoryFilter === 'all'
                      ? 'Bạn chưa có thông báo nào'
                      : 'Không có thông báo nào trong danh mục này'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isAdmin
                      ? 'Khi sinh viên đi chậm, không tới lớp học hoặc giảng viên gửi giải trình, hệ thống sẽ tự động cập nhật tại đây.'
                      : 'Khi giảng viên điểm danh hoặc có nhắc nhở lịch học, thông tin sẽ xuất hiện tại đây.'}
                  </p>
                </div>
              ) : (
                filteredEmails.map((em) => {
                  const isUrgent = em.type === 'lecturer_arrived_alert';
                  const isLate = em.type === 'late_attendance';
                  const isAbsent = em.type === 'absence_alert';
                  const isViolation = em.type === 'violation_report';
                  const isReminder = em.type === 'attendance_reminder';

                  return (
                    <div
                      key={em.id}
                      className={`p-4 rounded-2xl border transition space-y-2 text-xs ${
                        isUrgent
                          ? 'border-rose-300 bg-rose-50/50 shadow-xs ring-1 ring-rose-200'
                          : isAbsent
                          ? 'border-rose-400 bg-rose-50/70 shadow-xs ring-1 ring-rose-300'
                          : isLate
                          ? 'border-amber-300 bg-amber-50/60 shadow-xs ring-1 ring-amber-200'
                          : isViolation
                          ? 'border-purple-300 bg-purple-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-sky-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isUrgent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                              GIẢNG VIÊN ĐÃ ĐIỂM DANH
                            </span>
                          )}
                          {isAbsent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-700 text-white">
                              KHÔNG TỚI LỚP (VẮNG MẶT)
                            </span>
                          )}
                          {isLate && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white">
                              ĐI CHẬM / VÀO MUỘN
                            </span>
                          )}
                          {isReminder && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-600 text-white">
                              NHẮC ĐIỂM DANH
                            </span>
                          )}
                          {isViolation && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-700 text-white">
                              BÁO CÁO VI PHẠM
                            </span>
                          )}

                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <UserIcon className="h-3 w-3 text-sky-600" /> {em.recipientName}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">&lt;{em.toEmail}&gt;</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Clock className="h-3 w-3" /> {em.sentAt}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteEmail(em.id, e)}
                            title="Xóa thông báo này"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div
                        className={`font-bold p-2.5 rounded-xl border ${
                          isUrgent || isAbsent
                            ? 'text-rose-900 bg-rose-100/70 border-rose-200'
                            : isLate
                            ? 'text-amber-900 bg-amber-100/80 border-amber-200'
                            : isViolation
                            ? 'text-purple-900 bg-purple-100/70 border-purple-200'
                            : 'text-sky-900 bg-sky-50/70 border-sky-100'
                        }`}
                      >
                        {em.subject}
                      </div>

                      <div className="text-slate-700 whitespace-pre-line bg-white/90 p-3 rounded-xl border border-slate-100 text-[11px] font-sans leading-relaxed">
                        {em.content}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                          isAbsent
                            ? 'text-rose-700 bg-rose-100'
                            : isLate
                            ? 'text-amber-700 bg-amber-100'
                            : 'text-emerald-700 bg-emerald-50'
                        }`}>
                          <CheckCircle2 className="h-3 w-3" />
                          {isAbsent ? 'Tự động báo cáo vắng về Admin' : isLate ? 'Tự động báo cáo đi muộn về Admin' : 'Thông báo chính thức'}
                        </span>
                        <span>Lớp: {em.className}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: VIOLATIONS & REBUTTALS */}
          {activeTab === 'violations' && (
            <div className="space-y-4">
              {studentReports.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500 opacity-60" />
                  <p className="text-sm font-semibold text-slate-700">Không có vi phạm hay sự cố nào ghi nhận</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isStudent
                      ? 'Bạn chưa bị giảng viên báo cáo trường hợp bất thường nào.'
                      : 'Chưa có báo cáo vi phạm nào trong hệ thống.'}
                  </p>
                </div>
              ) : (
                studentReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          {rep.issueType === 'gps_fraud'
                            ? 'Gian lận vị trí GPS'
                            : rep.issueType === 'unexcused_absence'
                            ? 'Vắng không phép'
                            : rep.issueType === 'early_walkout'
                            ? 'Tự ý bỏ về sớm'
                            : 'Vi phạm lớp học'}
                        </span>
                        <span className="font-bold text-slate-800">Lớp: {rep.className}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {rep.createdAt}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-slate-700">
                      <div>
                        <strong>Giảng viên lập biên bản:</strong> {rep.lecturerName}
                      </div>
                      {rep.studentName && (
                        <div>
                          <strong>Sinh viên bị phản ánh:</strong> {rep.studentName} ({rep.studentCode})
                        </div>
                      )}
                      <div className="p-3 bg-white rounded-xl border border-rose-100 text-slate-800">
                        <strong>Nội dung báo cáo:</strong> {rep.description}
                      </div>
                    </div>

                    {/* Camera Photo attached by lecturer */}
                    {rep.livePhotoUrl && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                        <img
                          src={rep.livePhotoUrl}
                          alt="Ảnh hiện trường"
                          className="w-16 h-12 object-cover rounded-lg border border-slate-300"
                        />
                        <div className="text-[11px] text-slate-600">
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <Camera className="h-3 w-3 text-sky-600" /> Ảnh chụp thực tế từ camera giảng viên
                          </div>
                          <div>Thời gian chụp: {rep.photoCapturedAt || rep.createdAt}</div>
                        </div>
                      </div>
                    )}

                    {/* Existing Student Response */}
                    {rep.studentResponse ? (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-800 text-[11px]">
                          <Check className="h-3.5 w-3.5" /> Bản giải trình của sinh viên (Gửi lúc {rep.studentRespondedAt}):
                        </div>
                        <p className="text-[11px] leading-relaxed whitespace-pre-line">{rep.studentResponse}</p>
                      </div>
                    ) : (
                      isStudent && (
                        <div className="pt-1">
                          {explainingReportId === rep.id ? (
                            <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-300">
                              <label className="block font-semibold text-slate-800 text-xs">
                                Nhập bản giải trình / ý kiến phản hồi của bạn *:
                              </label>
                              <textarea
                                rows={3}
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Trình bày rõ lý do tại sao xảy ra sự việc (VD: lỗi kết nối thiết bị, thiết bị định vị GPS đang hiệu chỉnh, có mặt tại lớp nhưng chưa kịp quét...)"
                                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                                required
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExplainingReportId(null);
                                    setResponseText('');
                                  }}
                                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStudentSubmitExplanation(rep)}
                                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                                >
                                  <Send className="h-3 w-3" /> Gửi bản giải trình ngay
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setExplainingReportId(rep.id);
                                setResponseText('');
                              }}
                              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> Viết phản hồi / Giải trình vi phạm
                            </button>
                          )}
                        </div>
                      )
                    )}

                    {/* Admin Resolution note if present */}
                    {rep.adminNotes && (
                      <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-100 text-sky-900 text-[11px]">
                        <strong>Ý kiến xử lý của Quản trị viên:</strong> {rep.adminNotes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: ADMIN/LECTURER ONLY SEND BLAST */}
          {!isStudent && activeTab === 'send' && (
            <div className="bg-sky-50/50 p-5 rounded-2xl border border-sky-100 space-y-4">
              <div className="flex items-center gap-2 text-sky-900 font-semibold text-sm">
                <Bell className="h-4 w-4 text-sky-600" />
                <span>Gửi thông báo nhắc nhở điểm danh ca học (Chỉ gửi Sinh viên)</span>
              </div>
              <p className="text-xs text-slate-600">
                Gửi thông báo trực tiếp đến hộp thư của toàn bộ sinh viên trong danh sách lớp. (Thông báo nhắc nhở ca học chỉ gửi về tài khoản Sinh viên, hoàn toàn không gửi về tài khoản Admin).
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn lớp học cần gửi:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) - {c.locationName} - {c.studentIds.length} sinh viên
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSendReminderBlast}
                  disabled={isSending || classes.length === 0}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSending ? 'Đang phát thông báo...' : 'Gửi thông báo ngay'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-between items-center text-xs text-slate-500">
          <span>Hệ thống thông báo và phản hồi thời gian thực Real Time</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
