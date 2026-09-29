/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import { User, ClassRoom, AttendanceRecord, AnomalyReport, EmailNotification } from './types';
import { WelcomeLockscreen } from './components/auth/WelcomeLockscreen';
import { LoginView } from './components/auth/LoginView';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LecturerDashboard } from './components/lecturer/LecturerDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import { PasswordModal } from './components/student/PasswordModal';
import { EmailNotificationDrawer } from './components/common/EmailNotificationDrawer';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [reports, setReports] = useState<AnomalyReport[]>([]);
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [isEmailDrawerOpen, setIsEmailDrawerOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  // Show welcome/lockscreen on initial open per user requirement
  const [isLocked, setIsLocked] = useState<boolean>(true);

  // Initialize storage & sync state
  const loadData = () => {
    StorageService.init();
    setCurrentUser(StorageService.getCurrentUser());
    setAllUsers(StorageService.getUsers());
    setClasses(StorageService.getClasses());
    setAttendanceRecords(StorageService.getAttendance());
    setReports(StorageService.getReports());
    setEmails(StorageService.getEmails());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    loadData();
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    setIsLocked(true);
  };

  // If system is in locked state (initial open, refresh, or lock), show Welcome lockscreen first
  if (isLocked) {
    return <WelcomeLockscreen onEnter={() => setIsLocked(false)} />;
  }

  // If not logged in, show Login view
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onBackToWelcome={() => setIsLocked(true)}
      />
    );
  }

  // Count relevant notifications according to strict role permissions
  const relevantEmails = StorageService.filterEmailsForUser(currentUser, emails);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col justify-between">
      <div>
        {/* Main Navbar */}
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          onLock={() => setIsLocked(true)}
          onOpenEmails={() => setIsEmailDrawerOpen(true)}
          onRefreshData={loadData}
          onUserUpdated={(updated) => {
            setCurrentUser(updated);
            loadData();
          }}
          unreadEmailCount={relevantEmails.length}
        />

        {/* Main Role Content View */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {currentUser.role === 'admin' && (
            <AdminDashboard
              currentUser={currentUser}
              allUsers={allUsers}
              classes={classes}
              attendanceRecords={attendanceRecords}
              reports={reports}
              onRefreshData={loadData}
            />
          )}

          {currentUser.role === 'lecturer' && (
            <LecturerDashboard
              currentUser={currentUser}
              classes={classes}
              allStudents={allUsers.filter((u) => u.role === 'student')}
              attendanceRecords={attendanceRecords}
              onRefreshData={loadData}
            />
          )}

          {currentUser.role === 'student' && (
            <StudentDashboard
              currentUser={currentUser}
              classes={classes}
              attendanceRecords={attendanceRecords}
              onRefreshData={loadData}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-sky-100 bg-white/60 py-4 text-center text-xs text-slate-400">
        Hệ thống Điểm danh Thông minh Real Time • Công nghệ Geofencing GPS & Chụp ảnh Camera thời gian thực
      </footer>

      {/* Email Notification Drawer */}
      <EmailNotificationDrawer
        isOpen={isEmailDrawerOpen}
        onClose={() => {
          setIsEmailDrawerOpen(false);
          loadData();
        }}
        classes={classes}
        currentUser={currentUser}
        reports={reports}
        onRefreshData={loadData}
      />

      {/* Student Password Modal */}
      {isPasswordModalOpen && (
        <PasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          currentUser={currentUser}
          onSuccess={(updated) => {
            setCurrentUser(updated);
            loadData();
          }}
        />
      )}
    </div>
  );
}
