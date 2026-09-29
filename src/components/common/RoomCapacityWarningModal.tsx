import React from 'react';
import { AlertTriangle, Users, Building, Check, ArrowLeft } from 'lucide-react';

interface RoomCapacityWarningModalProps {
  isOpen: boolean;
  roomName: string;
  roomCapacity: number;
  studentCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RoomCapacityWarningModal: React.FC<RoomCapacityWarningModalProps> = ({
  isOpen,
  roomName,
  roomCapacity,
  studentCount,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const excessCount = Math.max(0, studentCount - roomCapacity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-amber-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header with warning styling */}
        <div className="p-6 pb-4 text-center bg-linear-to-b from-amber-50 to-white border-b border-amber-100">
          <div className="inline-flex p-3 bg-amber-100 text-amber-700 rounded-2xl mb-3 shadow-inner ring-4 ring-amber-50">
            <AlertTriangle className="h-7 w-7 animate-pulse" />
          </div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">
            Cảnh Báo Sức Chứa Phòng Học
          </h3>
          <p className="text-xs text-amber-800 font-semibold mt-1">
            Số lượng sinh viên vượt quá số chỗ ngồi cho phép
          </p>
        </div>

        {/* Message body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Main required question */}
          <div className="p-4 bg-amber-50/90 rounded-2xl border-2 border-amber-300 text-amber-950 font-bold text-sm leading-relaxed text-center shadow-xs">
            "Số lượng sinh viên nhiều hơn số lượng phòng ({roomCapacity} người). Bạn có chắc chắn muốn chọn phòng này chứ?"
          </div>

          {/* Details breakdown */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Building className="h-4 w-4 text-indigo-600" /> Tên phòng học:
              </span>
              <span className="font-bold text-slate-800 text-right truncate max-w-[200px]" title={roomName}>
                {roomName}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Users className="h-4 w-4 text-emerald-600" /> Sức chứa của phòng:
              </span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {roomCapacity} người
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Users className="h-4 w-4 text-rose-600" /> Số sinh viên đã chọn:
              </span>
              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {studentCount} người ({excessCount > 0 ? `vượt +${excessCount}` : ''})
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 text-center leading-normal">
            Nếu bạn <strong>xác nhận</strong>, hệ thống sẽ tiến hành lưu lớp và phòng học theo yêu cầu. Nếu bạn chọn <strong>chọn phòng khác</strong>, bạn sẽ quay lại giao diện để chọn phòng học có sức chứa lớn hơn.
          </p>
        </div>

        {/* Action buttons */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[42px] touch-manipulation active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" /> Trở lại chọn phòng khác
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[42px] touch-manipulation"
          >
            <Check className="h-4 w-4" /> Xác nhận chọn phòng
          </button>
        </div>
      </div>
    </div>
  );
};
