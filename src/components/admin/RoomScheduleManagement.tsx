import React, { useState, useMemo } from 'react';
import {
  DoorClosed,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Plus,
  Building,
  Info,
  Trash2,
  X,
  Layers,
  CheckSquare,
} from 'lucide-react';
import { ClassRoom, User, CampusRoom } from '../../types';
import { StorageService } from '../../services/storage';
import { ConfirmModal } from '../common/ConfirmModal';
import { CenterNotification, CenterNotificationState } from '../common/CenterNotification';
import { TrashManagementModal } from '../common/TrashManagementModal';

interface RoomScheduleManagementProps {
  classes: ClassRoom[];
  lecturers: User[];
  students: User[];
  onRefreshData: () => void;
  onNavigateToSchedule?: (prefillRoom?: string) => void;
}

export const RoomScheduleManagement: React.FC<RoomScheduleManagementProps> = ({
  classes,
  lecturers,
  students,
  onRefreshData,
  onNavigateToSchedule,
}) => {
  // Today's date string YYYY-MM-DD
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  // JavaScript getDay(): 0 is Sunday, 1 is Monday... Map to 1 (Thứ 2) -> 7 (Chủ nhật)
  const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dayOfWeek, setDayOfWeek] = useState<number>(currentDayOfWeek);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('11:30');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied'>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modals state
  const [detailRoom, setDetailRoom] = useState<CampusRoom | null>(null);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState<boolean>(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState<boolean>(false);

  // Multi-selection state for rooms
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  // Confirm Modal state for deleting single or list of rooms
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

  // Count deleted campus rooms currently stored in Trash
  const allRooms = useMemo(() => {
  return StorageService.getCampusRooms();
}, [classes, isAddRoomModalOpen, isTrashModalOpen]);
  
  // Form state for adding new room
  const [newRoomCampus, setNewRoomCampus] = useState<string>('Cơ sở 1');
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [newRoomBuilding, setNewRoomBuilding] = useState<string>('Giảng đường A');
  const [newRoomCapacity, setNewRoomCapacity] = useState<number>(60);
  const [newRoomType, setNewRoomType] = useState<string>('Lý thuyết');
  const [newRoomRadius, setNewRoomRadius] = useState<number>(50);
  const [newRoomLatitude, setNewRoomLatitude] = useState<number>(21.038234);
  const [newRoomLongitude, setNewRoomLongitude] = useState<number>(105.782812);
  const [addFeedback, setAddFeedback] = useState<string | null>(null);

  // Get campus rooms list from storage
  const deletedRoomsCount = useMemo(() => {
  return StorageService.getTrash().filter((t) => t.type === 'campus_room').length;
}, [classes, isTrashModalOpen]);

  // When date changes, automatically calculate dayOfWeek
  const handleDateChange = (dateVal: string) => {
    setSelectedDate(dateVal);
    if (dateVal) {
      const d = new Date(dateVal);
      const jsDay = d.getDay();
      setDayOfWeek(jsDay === 0 ? 7 : jsDay);
    }
  };

  const getDayName = (d: number) => {
    return d === 7 ? 'Chủ nhật' : `Thứ ${d + 1}`;
  };

  // Open Add Room Modal
  const handleOpenAddRoom = () => {
    setNewRoomCampus('Cơ sở 1');
    setNewRoomName('');
    setNewRoomBuilding('Giảng đường A');
    setNewRoomCapacity(60);
    setNewRoomType('Lý thuyết');
    setNewRoomRadius(50);
    setNewRoomLatitude(21.038234);
    setNewRoomLongitude(105.782812);
    setAddFeedback(null);
    setIsAddRoomModalOpen(true);
  };

  // Save new empty room
  const handleSaveNewRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newRoomName.trim();
    if (!cleanName) {
      alert('Vui lòng nhập tên phòng học!');
      return;
    }

    const cleanCampus = newRoomCampus.trim() || 'Cơ sở 1';
    const cleanBuilding = newRoomBuilding.trim() || 'Khuôn viên trường';

    const duplicateRoom = allRooms.some((r) =>
      r.name.trim().toLowerCase() === cleanName.toLowerCase() &&
      (r.campus || 'Cơ sở 1').trim().toLowerCase() === cleanCampus.toLowerCase() &&
      (r.building || 'Khuôn viên trường').trim().toLowerCase() === cleanBuilding.toLowerCase()
    );

    if (duplicateRoom) {
      alert('Phòng "' + cleanName + '" đã tồn tại tại ' + cleanCampus + ' - ' + cleanBuilding + '! Vui lòng chọn tên phòng khác.');
      return;
    }

    StorageService.addCampusRoom({
      name: cleanName,
      campus: cleanCampus,
      building: cleanBuilding,
      capacity: Number(newRoomCapacity) || 60,
      type: newRoomType.trim() || 'Lý thuyết',
      radiusMeters: Number(newRoomRadius) || 50,
      latitude: Number(newRoomLatitude) || 21.038234,
      longitude: Number(newRoomLongitude) || 105.782812,
    });

    onRefreshData();
    setIsAddRoomModalOpen(false);
  };

  // Delete a single room with move to Trash (6 months) and 5s Undo
  const handleDeleteRoom = (room: CampusRoom) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận xóa phòng học?',
      message: `Bạn có chắc chắn muốn xóa phòng học "${room.name}" (${room.campus || 'Cơ sở 1'} - ${room.building})?`,
      subMessage: 'Phòng học sẽ được chuyển an toàn vào Thùng rác trong 6 tháng. Bạn có thể khôi phục lại bất kỳ lúc nào!',
      iconType: 'trash',
      confirmAction: () => {
        const deleteResult = StorageService.deleteCampusRoom(room.id, 'admin');
        setSelectedRoomIds((prev) => prev.filter((id) => id !== room.id));
        onRefreshData();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

        setCenterNotification({
          id: `undo_delete_room_${room.id}_${Date.now()}`,
          message: `Đã chuyển phòng "${room.name}" vào thùng rác thành công`,
          durationMs: 5000,
          onUndo: () => {
            if (deleteResult.trashItem) {
              StorageService.restoreTrashItem(deleteResult.trashItem.id);
            } else if (deleteResult.previousRoom) {
              StorageService.addCampusRoom(deleteResult.previousRoom);
            }
            onRefreshData();
          },
        });
      },
    });
  };

  // Bulk Delete Rooms: "nút xóa danh sách phòng phải thực sự hoạt động, khi nhấn xóa phải được chuyển vào thùng rác"
  const handleOpenBulkDeleteConfirm = () => {
    if (selectedRoomIds.length === 0) return;
    const count = selectedRoomIds.length;
    setConfirmConfig({
      isOpen: true,
      title: `Xác nhận xóa danh sách ${count} phòng học?`,
      message: `Bạn có chắc chắn muốn xóa danh sách ${count} phòng học đã chọn khỏi danh sách phòng hoạt động?`,
      subMessage: 'Toàn bộ các phòng học này sẽ được chuyển ngay vào Thùng rác (lưu trữ an toàn 6 tháng). Bạn có thể khôi phục hoặc xóa vĩnh viễn trong mục Thùng rác phòng học.',
      iconType: 'trash',
      confirmAction: () => {
        const idsToDelete = [...selectedRoomIds];
        const res = StorageService.deleteCampusRooms(idsToDelete, 'admin');
        setSelectedRoomIds([]);
        onRefreshData();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

        setCenterNotification({
          id: `undo_bulk_delete_rooms_${Date.now()}`,
          message: `Đã xóa danh sách ${res.successCount} phòng học và chuyển vào thùng rác thành công`,
          durationMs: 5000,
          onUndo: () => {
            res.trashItems.forEach((item) => {
              StorageService.restoreTrashItem(item.id);
            });
            onRefreshData();
          },
        });
      },
    });
  };

  const toggleSelectRoom = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  // Calculate status for each room based on current filters
  const roomsWithStatus = useMemo(() => {
    return allRooms.map((room) => {
      const conflictResult = StorageService.checkRoomConflict(
        room.name,
        dayOfWeek,
        startTime,
        endTime
      );
      const dailySchedule = StorageService.getRoomDailySchedule(room.name, dayOfWeek);

      let lecturer: User | undefined;
      if (conflictResult.conflictingClass) {
        lecturer = lecturers.find((l) => l.id === conflictResult.conflictingClass?.lecturerId);
      }

      return {
        room,
        isOccupied: conflictResult.hasConflict,
        conflictingClass: conflictResult.conflictingClass,
        lecturer,
        dailySchedule,
      };
    });
  }, [allRooms, dayOfWeek, startTime, endTime, classes, lecturers]);

  // Apply visual filters (campus, building, status, search)
  const filteredRooms = useMemo(() => {
    return roomsWithStatus.filter((item) => {
      // 1. Status filter
      if (statusFilter === 'available' && item.isOccupied) return false;
      if (statusFilter === 'occupied' && !item.isOccupied) return false;

      // 2. Campus filter
      if (campusFilter !== 'all') {
        const c = item.room.campus || 'Cơ sở 1';
        if (c.toLowerCase() !== campusFilter.toLowerCase()) return false;
      }

      // 3. Building filter
      if (buildingFilter !== 'all') {
        const b = (item.room.building || '').toLowerCase();
        if (!b.includes(buildingFilter.toLowerCase())) return false;
      }

      // 4. Search term
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const roomName = item.room.name.toLowerCase();
        const building = item.room.building.toLowerCase();
        const campus = (item.room.campus || '').toLowerCase();
        const className = item.conflictingClass?.name.toLowerCase() || '';
        const classCode = item.conflictingClass?.code.toLowerCase() || '';
        const lecturerName = item.lecturer?.fullName.toLowerCase() || '';
        const match =
          roomName.includes(q) ||
          building.includes(q) ||
          campus.includes(q) ||
          className.includes(q) ||
          classCode.includes(q) ||
          lecturerName.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [roomsWithStatus, statusFilter, campusFilter, buildingFilter, searchTerm]);

  // High-level statistics
  const totalRoomsCount = allRooms.length;
  const availableRoomsCount = roomsWithStatus.filter((r) => !r.isOccupied).length;
  const occupiedRoomsCount = roomsWithStatus.filter((r) => r.isOccupied).length;
  const occupancyRate = totalRoomsCount > 0 ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0;

  const buildings = Array.from(new Set(allRooms.map((r) => r.building).filter(Boolean)));
  const campuses = Array.from(new Set(allRooms.map((r) => r.campus || 'Cơ sở 1').filter(Boolean)));

  // Room Multi-Selection Helpers
  const filteredRoomIds = useMemo(() => filteredRooms.map((item) => item.room.id), [filteredRooms]);
  const isAllFilteredSelected = filteredRoomIds.length > 0 && filteredRoomIds.every((id) => selectedRoomIds.includes(id));
  const isSomeFilteredSelected = filteredRoomIds.some((id) => selectedRoomIds.includes(id)) && !isAllFilteredSelected;

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIdSet = new Set(filteredRoomIds);
      setSelectedRoomIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const newIds = new Set([...selectedRoomIds, ...filteredRoomIds]);
      setSelectedRoomIds(Array.from(newIds));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
            <DoorClosed className="h-5 w-5 text-sky-600" /> Danh Sách Lớp Học & Quản Lý Phòng Học Toàn Trường ({totalRoomsCount})
          </h3>
          <p className="text-xs text-slate-500">
            Giám sát phòng trống & phòng đã đăng ký theo ngày giờ, thêm phòng trống mới để giảng viên đăng ký dạy
          </p>
        </div>

        {/* Action Buttons: Thùng rác phòng học (Khôi phục / Xóa vĩnh viễn) & Thêm phòng trống */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTrashModalOpen(true)}
            className="px-3.5 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Mở thùng rác để khôi phục hoặc xóa vĩnh viễn các phòng học đã xóa"
          >
            <Trash2 className="h-4 w-4 text-rose-600" />
            <span>Thùng rác phòng học ({deletedRoomsCount})</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddRoom}
            className="px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 rounded-xl shadow-xs transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            title="Thêm các phòng học mới còn trống vào hệ thống để giảng viên đăng ký dạy"
          >
            <Plus className="h-4 w-4" /> Thêm phòng trống
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-sky-100 shadow-xs flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-semibold">Tổng Số Phòng Học</div>
          <div className="text-2xl md:text-3xl font-black text-slate-800 mt-2">{totalRoomsCount}</div>
          <div className="text-[11px] text-sky-600 font-medium mt-1">Toàn bộ giảng đường & lab</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-xs flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Phòng Còn Trống
          </div>
          <div className="text-2xl md:text-3xl font-black text-emerald-600 mt-2">{availableRoomsCount}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Sẵn sàng để giảng viên đăng ký
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5 text-rose-600" /> Phòng Đã Đăng Ký
          </div>
          <div className="text-2xl md:text-3xl font-black text-rose-600 mt-2">{occupiedRoomsCount}</div>
          <div className="text-[11px] text-rose-700 font-medium mt-1">
            Đang có ca học diễn ra
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-xs flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-semibold">Tỷ Lệ Lấp Đầy Phòng</div>
          <div className="text-2xl md:text-3xl font-black text-amber-600 mt-2">{occupancyRate}%</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Khung giờ: {startTime} - {endTime} ({getDayName(dayOfWeek)})
          </div>
        </div>
      </div>

      {/* Date & Time Filtering Control Panel (ĐÃ BỎ CA HỌC NHANH THEO YÊU CẦU) */}
      <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Filter className="h-4 w-4 text-sky-600" />
            <span>Bộ Lọc Xem Tình Trạng Phòng Theo Ngày & Khung Giờ</span>
          </div>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-sky-600" /> Chọn Ngày Cụ Thể
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <span>Thứ trong tuần</span>
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 font-bold text-sky-800"
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
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-sky-600" /> Giờ Bắt Đầu Ca
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-sky-600" /> Giờ Kết Thúc Ca
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 font-mono font-bold"
            />
          </div>
        </div>

        {/* Secondary filters row: Trạng thái | Cơ sở | Tòa nhà | Tìm kiếm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Lọc theo trạng thái phòng:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 font-medium"
            >
              <option value="all">Tất cả phòng ({allRooms.length})</option>
              <option value="available">✓ Chỉ phòng còn trống ({availableRoomsCount})</option>
              <option value="occupied">🔒 Chỉ phòng đã đăng ký ({occupiedRoomsCount})</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Lọc theo Cơ sở đào tạo:</label>
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 font-medium"
            >
              <option value="all">Tất cả cơ sở ({campuses.length} cơ sở)</option>
              {campuses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Lọc theo dãy / tòa nhà:</label>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 font-medium"
            >
              <option value="all">Tất cả khu vực ({buildings.length} tòa nhà)</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Tìm kiếm phòng hoặc môn học:</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nhập tên phòng, cơ sở, môn..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Helper Banner */}
      <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 flex items-center justify-between text-xs text-sky-800">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-sky-600 shrink-0" />
          <span>
            Đang lọc: <strong>{getDayName(dayOfWeek)}</strong> ({startTime} - {endTime}).
            Các phòng <strong>"Đã đăng ký"</strong> sẽ tự động <strong>bị ẩn khỏi giao diện chọn phòng của Admin và Giảng viên</strong> để tránh xung đột lịch dạy!
          </span>
        </div>
        <span className="font-bold text-sky-900 shrink-0 ml-2">
          Hiển thị: {filteredRooms.length}/{allRooms.length} phòng
        </span>
      </div>

      {/* Nút xóa danh sách phòng đã chọn & thông tin số lượng phòng đã chọn */}
      {selectedRoomIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-rose-50/95 border-2 border-rose-300 rounded-2xl text-xs animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5 text-rose-950 font-semibold">
            <CheckSquare className="h-4 w-4 text-rose-600 shrink-0" />
            <span>
              Đang chọn <strong className="text-rose-700 font-extrabold">{selectedRoomIds.length}</strong> phòng học
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedRoomIds([])}
              className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 font-medium transition cursor-pointer"
            >
              Bỏ chọn
            </button>
            <button
              type="button"
              onClick={handleOpenBulkDeleteConfirm}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Xóa danh sách phòng đã chọn ({selectedRoomIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Thanh chọn tất cả danh sách phòng */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs shadow-2xs">
        <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-700 select-none">
          <input
            type="checkbox"
            checked={isAllFilteredSelected}
            ref={(el) => {
              if (el) el.indeterminate = isSomeFilteredSelected;
            }}
            onChange={toggleSelectAllFiltered}
            className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
          />
          <span>
            {isAllFilteredSelected
              ? `Đã chọn tất cả (${filteredRooms.length} phòng)`
              : `Chọn tất cả danh sách (${filteredRooms.length} phòng)`}
          </span>
        </label>
        <span className="text-[11px] text-slate-500 font-medium">
          Hiển thị {filteredRooms.length}/{allRooms.length} phòng
        </span>
      </div>

      {/* DANH SÁCH NGANG (HORIZONTAL LIST ROWS) THEO YÊU CẦU - KHÔNG HIỆN TỪNG Ô */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400">
          <DoorClosed className="h-12 w-12 mx-auto mb-3 opacity-40 text-slate-400" />
          <p className="font-semibold text-slate-700">Không tìm thấy phòng học nào phù hợp</p>
          <p className="text-xs text-slate-500 mt-1">
            Vui lòng thử điều chỉnh lại bộ lọc trạng thái, tòa nhà hoặc từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRooms.map((item) => {
            const { room, isOccupied, conflictingClass, lecturer, dailySchedule } = item;

            return (
              <div
                key={room.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs hover:shadow-md ${
                  isOccupied
                    ? 'bg-rose-50/20 border-rose-200 hover:border-rose-300'
                    : 'bg-white border-slate-200 hover:border-emerald-300'
                }`}
              >
                {/* Cột 1: Checkbox & Thông tin phòng học */}
                <div className="flex items-start gap-3.5 lg:w-1/3 shrink-0">
                  <label className="shrink-0 flex items-center justify-center p-1 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRoomIds.includes(room.id)}
                      onChange={() => toggleSelectRoom(room.id)}
                      className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                  </label>

                  <div
                    className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                      isOccupied ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <DoorClosed className="h-6 w-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {room.name}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {room.campus || 'Cơ sở 1'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {room.building}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                      <span>Sức chứa: <strong className="text-slate-700">{room.capacity} SV</strong></span>
                      <span>•</span>
                      <span>Bán kính GPS: <strong className="text-slate-700">{room.radiusMeters}m</strong></span>
                      <span>•</span>
                      <span className="font-medium text-slate-700 bg-sky-50 text-sky-800 px-2 py-0.5 rounded border border-sky-100 text-[11px]">
                        {room.type || 'Lý thuyết'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cột 2: Trạng thái & Chi tiết lớp học nếu đã đăng ký */}
                <div className="lg:w-5/12 flex-1">
                  {isOccupied && conflictingClass ? (
                    <div className="p-3 bg-white rounded-xl border border-rose-200/90 shadow-2xs space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="h-3 w-3 text-rose-600" /> Đã đăng ký ca này
                        </span>
                        <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                          {conflictingClass.startTime} - {conflictingClass.endTime} ({getDayName(conflictingClass.dayOfWeek)})
                        </span>
                      </div>

                      <div className="font-bold text-slate-800 text-xs truncate">
                        {conflictingClass.name} <span className="font-mono text-slate-400 font-normal">({conflictingClass.code})</span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-sky-600" /> GV: <strong>{lecturer?.fullName || 'Chưa gán'}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3 text-emerald-600" /> Lớp: <strong>{conflictingClass.className}</strong> ({conflictingClass.studentIds.length} SV)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Còn trống
                        </span>
                        <p className="text-[11px] text-emerald-700 mt-1">
                          Phòng hoàn toàn trống trong ca {startTime} - {endTime} ({getDayName(dayOfWeek)}).
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                        Sẵn sàng đăng ký dạy
                      </span>
                    </div>
                  )}
                </div>

                {/* Cột 3: Nút Thao Tác Nằm Ngang */}
                <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDetailRoom(room)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-sky-700 bg-slate-50 hover:bg-sky-50 rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-1.5 min-h-[38px] touch-manipulation active:scale-95"
                    title="Xem toàn bộ các ca học trong ngày của phòng này"
                  >
                    <Clock className="h-3.5 w-3.5 text-sky-600" />
                    <span>Xem lịch ngày ({dailySchedule.length})</span>
                  </button>

                  {!isOccupied && onNavigateToSchedule && (
                    <button
                      type="button"
                      onClick={() => onNavigateToSchedule(room.name)}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer min-h-[38px] touch-manipulation"
                      title="Xếp lịch lớp học ngay vào phòng này"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Xếp lớp phòng này</span>
                    </button>
                  )}

                  {/* Nút xóa phòng tự thêm nếu cần */}
                  <button
                    type="button"
                    onClick={() => handleDeleteRoom(room)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                    title="Xóa phòng học này"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Thêm Phòng Trống Mới */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-sky-100 overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50 px-5 sm:px-6 py-3.5 sm:py-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-600 text-white">
                  <DoorClosed className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Thêm Phòng Học Mới (Phòng Trống)</h3>
                  <p className="text-xs text-slate-500">
                    Khai báo phòng trống vào hệ thống để giảng viên đăng ký dạy
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRoomModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRoom} className="p-6 space-y-4 text-xs">
              {/* Mục Cơ sở với các nút ghi nhanh theo yêu cầu */}
              <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-indigo-600" />
                    <span>Cơ sở đào tạo / Phân hiệu trường *</span>
                  </label>
                  <span className="text-[11px] text-indigo-700 font-semibold">
                    Tránh trùng lặp khi trường có &gt; 1 cơ sở
                  </span>
                </div>

                {/* Các nút bấm ghi nhanh tên Cơ sở */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-500 font-medium">Nút ghi nhanh cơ sở:</span>
                  {[
                    'Cơ sở 1 - Trụ sở chính',
                    'Cơ sở 2',
                    'Cơ sở 3',
                    'Cơ sở Hòa Lạc',
                    'Cơ sở Thủ Đức',
                    'Phân hiệu Nam Sài Gòn',
                  ].map((cName) => (
                    <button
                      key={cName}
                      type="button"
                      onClick={() => setNewRoomCampus(cName)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer border ${
                        newRoomCampus === cName
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                      }`}
                      title={`Bấm để chọn nhanh ${cName}`}
                    >
                      + {cName}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={newRoomCampus}
                  onChange={(e) => setNewRoomCampus(e.target.value)}
                  placeholder="Nhập hoặc ghi tên cơ sở đào tạo (VD: Cơ sở 1, Cơ sở Hòa Lạc, Cơ sở 2...)"
                  className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-xs"
                  required
                />
              </div>

              {/* Tên phòng học */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên phòng học chỉ định *
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="VD: Phòng B304 - Giảng đường B2"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 font-bold text-slate-800 text-xs"
                    required
                  />
                  {newRoomName.trim() && !newRoomName.includes(newRoomCampus) && (
                    <button
                      type="button"
                      onClick={() => setNewRoomName(`${newRoomName.trim()} (${newRoomCampus})`)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <span>+ Gắn kèm nhãn "{newRoomCampus}" vào tên phòng</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dãy / Tòa nhà *</label>
                  <input
                    type="text"
                    value={newRoomBuilding}
                    onChange={(e) => setNewRoomBuilding(e.target.value)}
                    placeholder="VD: Giảng đường B2"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sức chứa sinh viên *</label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(Math.max(1, parseInt(e.target.value) || 60))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Loại phòng ghi trực tiếp thay vì chọn dropdown theo yêu cầu */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    Loại phòng học (Nhập trực tiếp) *
                  </label>
                  <span className="text-[11px] text-slate-400">Ghi chữ tự do thay vì chọn dropdown</span>
                </div>

                {/* Các nút gợi ý nhanh để ghi loại phòng */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    'Lý thuyết',
                    'Thực hành / Lab máy tính',
                    'Hội trường lớn',
                    'Phòng đa năng',
                    'Xưởng thực hành',
                    'Phòng hội thảo',
                  ].map((tName) => (
                    <button
                      key={tName}
                      type="button"
                      onClick={() => setNewRoomType(tName)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition cursor-pointer border ${
                        newRoomType === tName
                          ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {tName}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value)}
                  placeholder="Ghi trực tiếp loại phòng: VD: Lý thuyết, Lab thực hành máy tính, Xưởng cơ khí, Hội trường..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 font-bold text-slate-800 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bán kính GPS (mét) *</label>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={newRoomRadius}
                  onChange={(e) => setNewRoomRadius(Math.max(10, parseInt(e.target.value) || 50))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 font-bold"
                  required
                />
              </div>

              {/* Tọa độ GPS */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-slate-700 font-bold">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-sky-600" /> Tọa độ tâm điểm danh
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRoomLatitude(21.038234);
                      setNewRoomLongitude(105.782812);
                    }}
                    className="text-[10px] text-sky-600 hover:underline font-normal cursor-pointer"
                  >
                    Lấy tọa độ chuẩn của trường
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Vĩ độ (Lat)</label>
                    <input
                      type="number"
                      step="any"
                      value={newRoomLatitude}
                      onChange={(e) => setNewRoomLatitude(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Kinh độ (Lng)</label>
                    <input
                      type="number"
                      step="any"
                      value={newRoomLongitude}
                      onChange={(e) => setNewRoomLongitude(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsAddRoomModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer min-h-[40px] touch-manipulation"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] touch-manipulation"
                >
                  <Plus className="h-4 w-4" /> Lưu Phòng Trống
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Full Daily Schedule of Room */}
      {detailRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-sky-100 overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50 px-6 py-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <DoorClosed className="h-5 w-5 text-sky-600" />
                  <span>Thời Khóa Biểu: {detailRoom.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-semibold text-indigo-700">{detailRoom.campus || 'Cơ sở 1'}</span> • Ngày {selectedDate} ({getDayName(dayOfWeek)}) • Sức chứa {detailRoom.capacity} SV • {detailRoom.type || 'Lý thuyết'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailRoom(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {(() => {
                const daySchedule = StorageService.getRoomDailySchedule(detailRoom.name, dayOfWeek);
                if (daySchedule.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-60" />
                      <div className="font-bold text-slate-700">Phòng hoàn toàn trống cả ngày!</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Chưa có bất kỳ lớp học hay ca dạy nào được xếp vào phòng này trong {getDayName(dayOfWeek)}.
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="font-bold text-slate-700">
                      Danh sách các ca học đã xếp lịch trong {getDayName(dayOfWeek)}:
                    </div>
                    {daySchedule.map((cls) => {
                      const lecturer = lecturers.find((l) => l.id === cls.lecturerId);
                      return (
                        <div
                          key={cls.id}
                          className="p-4 rounded-2xl border border-sky-100 bg-sky-50/40 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm">{cls.name}</span>
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
                                {cls.code}
                              </span>
                            </div>
                            <div className="text-slate-600 text-xs">
                              Giảng viên: <strong>{lecturer?.fullName || 'Chưa gán'}</strong> ({lecturer?.lecturerCode || ''})
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              Lớp sinh hoạt: {cls.className} • Sĩ số: {cls.studentIds.length} sinh viên
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="px-2.5 py-1 rounded-xl bg-sky-600 text-white font-mono font-bold text-xs">
                              {cls.startTime} - {cls.endTime}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {cls.periodsPerSession || 4} tiết
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailRoom(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Đóng
              </button>
              {onNavigateToSchedule && (
                <button
                  type="button"
                  onClick={() => {
                    const roomName = detailRoom.name;
                    setDetailRoom(null);
                    onNavigateToSchedule(roomName);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Xếp Lớp Phòng Này
                </button>
              )}
            </div>
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
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        onConfirm={confirmConfig.confirmAction}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Center 5-Second Notification with Hoàn Tác */}
      <CenterNotification
        notification={centerNotification}
        onClose={() => setCenterNotification(null)}
      />

      {/* Dedicated Trash Management Modal for Campus Rooms */}
      <TrashManagementModal
        isOpen={isTrashModalOpen}
        onClose={() => {
          setIsTrashModalOpen(false);
          onRefreshData();
        }}
        initialFilter="campus_room"
        title="Quản Lý Thùng Rác Phòng Học (Lưu Trữ 6 Tháng)"
        role="admin"
        onRefreshData={onRefreshData}
      />
    </div>
  );
};
