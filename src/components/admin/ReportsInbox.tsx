import React, { useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Check,
  Eye,
  X,
  MessageSquare,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { AnomalyReport } from '../../types';
import { StorageService } from '../../services/storage';
import { ConfirmModal } from '../common/ConfirmModal';
import { CenterNotification, CenterNotificationState } from '../common/CenterNotification';

interface ReportsInboxProps {
  reports: AnomalyReport[];
  onRefreshData: () => void;
}

export const ReportsInbox: React.FC<ReportsInboxProps> = ({
  reports,
  onRefreshData,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');

  // Center notification state
  const [centerNotification, setCenterNotification] = useState<CenterNotificationState | null>(null);

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

  const handleResolve = (report: AnomalyReport) => {
    StorageService.updateReport(report.id, {
      status: 'resolved',
      adminNotes: adminNote.trim() || 'Admin đã ghi nhận và xử lý kỷ luật theo quy chế đào tạo.',
    });
    setResolvingId(null);
    setAdminNote('');
    onRefreshData();
  };

  const handleDeleteReport = (report: AnomalyReport) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa báo cáo vi phạm & lịch sử kỷ luật?',
      message: `Bạn có chắc muốn xóa báo cáo vi phạm của sinh viên "${report.studentName || 'Sinh viên'}" (${report.studentCode || ''}) lớp "${report.className}"?`,
      subMessage: 'Sau khi xóa, bản ghi vi phạm này sẽ tự động biến mất hoàn toàn trên cả giao diện Giảng viên và Sinh viên. (Chỉ Admin mới có quyền xóa).',
      confirmAction: () => {
        const res = StorageService.deleteReport(report.id);
        onRefreshData();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

        if (res.success && res.deletedReport) {
          const backup = res.deletedReport;
          setCenterNotification({
            id: `undo_del_rep_${report.id}_${Date.now()}`,
            message: 'Đã xóa báo cáo vi phạm & lịch sử kỷ luật thành công',
            type: 'normal',
            durationMs: 5000,
            onUndo: () => {
              StorageService.addReport(backup);
              onRefreshData();
            },
          });
        }
      },
    });
  };

  const getIssueBadge = (type: AnomalyReport['issueType']) => {
    switch (type) {
      case 'gps_fraud':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            Gian lận GPS
          </span>
        );
      case 'unexcused_absence':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Vắng không lý do
          </span>
        );
      case 'early_walkout':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            Tự ý bỏ về sớm
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
            Sự việc khác
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-600" /> Hộp Thư Báo Cáo Bất Thường Từ Giảng Viên ({reports.length})
        </h3>
        <p className="text-xs text-slate-500">
          Xem phản ánh gian lận vị trí GPS, vắng mặt không lý do kèm ảnh chụp trực tiếp từ camera lớp học
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-40 text-emerald-400" />
          <p className="font-semibold text-slate-700">Chưa có báo cáo bất thường nào từ giảng viên</p>
          <p className="text-xs text-slate-500 mt-1">
            Mọi sự cố hoặc vi phạm điểm danh do giảng viên gửi về sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm space-y-4 hover:border-sky-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  {getIssueBadge(rep.issueType)}
                  <span className="font-bold text-slate-800 text-sm">
                    Lớp: {rep.className}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {rep.createdAt}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      rep.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800 animate-pulse'
                    }`}
                  >
                    {rep.status === 'resolved' ? 'Đã xử lý' : 'Đang chờ xử lý'}
                  </span>
                  {/* Delete button (Admin Only) */}
                  <button
                    type="button"
                    onClick={() => handleDeleteReport(rep)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                    title="Xóa báo cáo vi phạm & kỷ luật (Chỉ Admin có quyền xóa, sẽ tự động biến mất bên SV và GV)"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                    <span className="text-rose-600">Xóa</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Details */}
                <div className="md:col-span-2 space-y-2 text-xs">
                  <div className="text-slate-600">
                    <strong>Giảng viên báo cáo:</strong> {rep.lecturerName}
                  </div>
                  {rep.studentName && (
                    <div className="text-slate-600">
                      <strong>Sinh viên liên quan:</strong> {rep.studentName} ({rep.studentCode})
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 leading-relaxed font-sans">
                    <strong>Nội dung phản ánh:</strong> {rep.description}
                  </div>

                  {rep.studentResponse && (
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-[11px] space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Ý kiến giải trình của sinh viên ({rep.studentRespondedAt || 'Đã gửi'}):</span>
                      </div>
                      <p className="leading-relaxed">{rep.studentResponse}</p>
                    </div>
                  )}

                  {rep.adminNotes && (
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-900 text-[11px]">
                      <strong>Ý kiến chỉ đạo của Admin:</strong> {rep.adminNotes}
                    </div>
                  )}
                </div>

                {/* Live Camera Photo Attachment */}
                <div className="flex flex-col justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <div className="font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-sky-600" />
                      <span>Ảnh Camera Lớp Học</span>
                    </div>

                    {rep.livePhotoUrl ? (
                      <div
                        onClick={() => setSelectedPhoto(rep.livePhotoUrl || null)}
                        className="relative rounded-xl overflow-hidden border border-slate-300 cursor-pointer group"
                      >
                        <img
                          src={rep.livePhotoUrl}
                          alt="Ảnh chụp camera thực tế"
                          className="w-full h-28 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-semibold gap-1">
                          <Eye className="h-3.5 w-3.5" /> Xem phóng to
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-center py-6 bg-white rounded-xl border border-dashed border-slate-200">
                        Không có ảnh đính kèm
                      </div>
                    )}
                  </div>

                  {rep.status !== 'resolved' && (
                    <div className="pt-3">
                      {resolvingId === rep.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="Ghi chú xử lý của Admin..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                          />
                          <div className="flex gap-1 justify-end">
                            <button
                              type="button"
                              onClick={() => setResolvingId(null)}
                              className="px-2 py-1 text-slate-500 text-[11px]"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolve(rep)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                            >
                              Lưu xử lý
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setResolvingId(rep.id)}
                          className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                        >
                          <Check className="h-3.5 w-3.5" /> Tiếp nhận & Đánh dấu xử lý
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo lightbox modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
        >
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 text-white rounded-full hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={selectedPhoto} alt="Ảnh phóng to" className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
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
        confirmText="Xóa vi phạm"
        cancelText="Hủy"
        onConfirm={confirmConfig.confirmAction}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Center 5s Notification with Undo */}
      <CenterNotification
        notification={centerNotification}
        onClose={() => setCenterNotification(null)}
      />
    </div>
  );
};
