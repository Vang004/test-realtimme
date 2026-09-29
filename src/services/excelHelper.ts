import * as XLSX from 'xlsx';
import { User } from '../types';
import { generateStudentPassword } from './storage';

export interface ParsedStudentRow {
  studentCode: string;
  fullName: string;
  email: string;
  courseYear: string;
  className: string;
  phoneNumber?: string;
}

export interface ParsedLecturerRow {
  lecturerCode: string;
  fullName: string;
  email: string;
  department?: string;
  title?: string;
  phoneNumber?: string;
}

// Helper to normalize header keys
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export const ExcelHelper = {
  // Parse file buffer (.xlsx, .xls, .csv)
  async parseStudentFile(file: File): Promise<ParsedStudentRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

          const parsed: ParsedStudentRow[] = [];

          for (const row of rawRows) {
            let studentCode = '';
            let fullName = '';
            let email = '';
            let courseYear = '10';
            let className = 'A1';
            let phoneNumber = '';

            for (const [key, value] of Object.entries(row)) {
              const valStr = String(value || '').trim();
              const normKey = normalizeKey(key);

              if (normKey.includes('masv') || normKey.includes('mssv') || normKey.includes('code') || normKey === 'ma') {
                studentCode = valStr;
              } else if (normKey.includes('hoten') || normKey.includes('ten') || normKey.includes('name')) {
                fullName = valStr;
              } else if (normKey.includes('email') || normKey.includes('thu')) {
                email = valStr;
              } else if (normKey.includes('khoa') || normKey.includes('nienkhoa') || normKey.includes('course')) {
                courseYear = valStr.replace(/khóa|k/gi, '').trim() || '10';
              } else if (normKey.includes('lop') || normKey.includes('class')) {
                className = valStr;
              } else if (normKey.includes('sdt') || normKey.includes('dienthoai') || normKey.includes('phone')) {
                phoneNumber = valStr;
              }
            }

            if (studentCode || fullName) {
              const finalCode = studentCode || `SV${Math.floor(100000 + Math.random() * 900000)}`;
              parsed.push({
                studentCode: finalCode,
                fullName: fullName || 'Sinh viên chưa đặt tên',
                email: email || `${finalCode.toLowerCase()}@school.edu.vn`,
                courseYear: courseYear || '10',
                className: className || 'A1',
                phoneNumber,
              });
            }
          }

          resolve(parsed);
        } catch (err) {
          reject(new Error('Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng file.'));
        }
      };
      reader.onerror = () => reject(new Error('Lỗi khi đọc file'));
      reader.readAsBinaryString(file);
    });
  },

  async parseLecturerFile(file: File): Promise<ParsedLecturerRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

          const parsed: ParsedLecturerRow[] = [];

          for (const row of rawRows) {
            let lecturerCode = '';
            let fullName = '';
            let email = '';
            let department = 'Khoa CNTT';
            let title = 'Giảng viên';
            let phoneNumber = '';

            for (const [key, value] of Object.entries(row)) {
              const valStr = String(value || '').trim();
              const normKey = normalizeKey(key);

              if (normKey.includes('magv') || normKey.includes('code') || normKey === 'ma') {
                lecturerCode = valStr;
              } else if (normKey.includes('hoten') || normKey.includes('ten') || normKey.includes('name')) {
                fullName = valStr;
              } else if (normKey.includes('email')) {
                email = valStr;
              } else if (normKey.includes('khoa') || normKey.includes('bomon') || normKey.includes('dept')) {
                department = valStr;
              } else if (normKey.includes('hocvi') || normKey.includes('chucdanh') || normKey.includes('title')) {
                title = valStr;
              } else if (normKey.includes('sdt') || normKey.includes('phone')) {
                phoneNumber = valStr;
              }
            }

            if (fullName || lecturerCode) {
              const finalCode = lecturerCode || `GV${Math.floor(100 + Math.random() * 900)}`;
              parsed.push({
                lecturerCode: finalCode,
                fullName: fullName || 'Giảng viên',
                email: email || `${finalCode.toLowerCase()}@school.edu.vn`,
                department,
                title,
                phoneNumber,
              });
            }
          }

          resolve(parsed);
        } catch (err) {
          reject(new Error('Không thể đọc file Excel giảng viên.'));
        }
      };
      reader.onerror = () => reject(new Error('Lỗi khi đọc file'));
      reader.readAsBinaryString(file);
    });
  },

  // Parse Google Sheets Link
  async parseGoogleSheetUrl(url: string, type: 'student' | 'lecturer'): Promise<any[]> {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      throw new Error('Link Google Sheets không hợp lệ. Vui lòng copy đúng đường dẫn trang tính (chia sẻ công khai).');
    }
    const spreadsheetId = match[1];
    const csvExportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;

    try {
      const response = await fetch(csvExportUrl);
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu từ Google Sheets. Hãy đảm bảo trang tính đã được bật quyền "Bất kỳ ai có liên kết đều có thể xem".');
      }
      const csvText = await response.text();
      const workbook = XLSX.read(csvText, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (type === 'student') {
        const dummyFile = new File([csvText], 'sheet.csv', { type: 'text/csv' });
        return this.parseStudentFile(dummyFile);
      } else {
        const dummyFile = new File([csvText], 'sheet.csv', { type: 'text/csv' });
        return this.parseLecturerFile(dummyFile);
      }
    } catch (e: any) {
      throw new Error(e.message || 'Lỗi khi kết nối Google Sheets');
    }
  },

  // Convert parsed students to full Users with auto credentials
  convertStudentsToUsers(parsed: ParsedStudentRow[]): User[] {
    return parsed.map((p) => {
      const code = p.studentCode.trim().toUpperCase();
      const course = p.courseYear.trim();
      const cls = p.className.trim();
      // Formula: [mã sv][khóa][lớp] in lowercase
      const defaultPassword = generateStudentPassword(code, course, cls);

      return {
        id: `usr_sv_${code}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        username: code, // Username is Student ID as specified!
        password: defaultPassword,
        fullName: p.fullName,
        email: p.email,
        phoneNumber: p.phoneNumber,
        role: 'student',
        studentCode: code,
        courseYear: course,
        className: cls,
        hasChangedPassword: false,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.fullName)}`,
        createdAt: new Date().toISOString(),
      };
    });
  },

  // Convert parsed lecturers to full Users
  convertLecturersToUsers(parsed: ParsedLecturerRow[]): User[] {
    return parsed.map((p) => {
      const code = p.lecturerCode.trim().toUpperCase();
      // Username của tài khoản giảng viên chính là mã giảng viên
      const cleanUsername = code;
      return {
        id: `usr_gv_${code}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        username: cleanUsername,
        password: 'gv123456',
        fullName: p.fullName,
        email: p.email,
        phoneNumber: p.phoneNumber,
        role: 'lecturer',
        lecturerCode: code,
        department: p.department || 'Khoa Công nghệ Thông tin',
        title: p.title || 'Giảng viên',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.fullName)}`,
        createdAt: new Date().toISOString(),
      };
    });
  },

  // Download template Excel
  downloadStudentTemplate() {
    const data = [
      {
        'Mã sinh viên': '22ATT000',
        'Họ và tên': 'Trần Minh Đức',
        'Email': 'duc.tm22@school.edu.vn',
        'Khóa': '10',
        'Lớp': 'A1',
        'Số điện thoại': '0971112233',
      },
      {
        'Mã sinh viên': '22ATT001',
        'Họ và tên': 'Phạm Thu Trang',
        'Email': 'trang.pt22@school.edu.vn',
        'Khóa': '10',
        'Lớp': 'A1',
        'Số điện thoại': '0972223344',
      },
      {
        'Mã sinh viên': '22ATT002',
        'Họ và tên': 'Hoàng Quốc Bảo',
        'Email': 'bao.hq22@school.edu.vn',
        'Khóa': '10',
        'Lớp': 'A1',
        'Số điện thoại': '0973334455',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachSinhVien');
    XLSX.writeFile(wb, 'Mau_Danh_Sach_Sinh_Vien.xlsx');
  },

  downloadLecturerTemplate() {
    const data = [
      {
        'Mã giảng viên': 'GV001',
        'Họ và tên': 'ThS. Nguyễn Văn An',
        'Email': 'an.nguyen@school.edu.vn',
        'Khoa/Bộ môn': 'Công nghệ Thông tin',
        'Học vị': 'Thạc sĩ',
        'Số điện thoại': '0912345678',
      },
      {
        'Mã giảng viên': 'GV002',
        'Họ và tên': 'TS. Lê Thị Mai',
        'Email': 'mai.le@school.edu.vn',
        'Khoa/Bộ môn': 'Hệ thống Thông tin',
        'Học vị': 'Tiến sĩ',
        'Số điện thoại': '0987654321',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachGiangVien');
    XLSX.writeFile(wb, 'Mau_Danh_Sach_Giang_Vien.xlsx');
  },

  // Export attendance log to Excel
  exportAttendanceReport(records: any[], className: string) {
    const data = records.map((r, i) => ({
      'STT': i + 1,
      'Mã SV': r.studentCode,
      'Họ và tên': r.studentName,
      'Ngày': r.date,
      'Giờ vào': r.checkInTime || 'Chưa vào',
      'Khoảng cách GPS (m)': r.checkInDistanceMeters !== undefined ? `${r.checkInDistanceMeters}m` : 'N/A',
      'Vị trí hợp lệ': r.checkInWithinRadius ? 'Hợp lệ (Trong khuôn viên)' : (r.checkInTime ? 'Ngoài bán kính quy định' : 'Vắng'),
      'Giờ ra': r.checkOutTime || 'Chưa ra',
      'Trạng thái ra': r.checkOutStatus === 'early' ? 'Về sớm' : (r.checkOutStatus === 'pending_approval' ? 'Chờ duyệt về sớm' : (r.checkOutStatus === 'excused' ? 'Đã duyệt về sớm' : 'Bình thường')),
      'Lý do về sớm': r.earlyLeaveReason || '',
      'Kết quả tổng kết': r.finalStatus === 'present' ? 'Có mặt đúng giờ' : (r.finalStatus === 'late' ? 'Đi muộn' : (r.finalStatus === 'early_exit' ? 'Về sớm' : (r.finalStatus === 'violation' ? 'Gian lận vị trí' : 'Vắng mặt'))),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BaoCaoDiemDanh');
    XLSX.writeFile(wb, `Bao_Cao_Diem_Danh_${className.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
};
