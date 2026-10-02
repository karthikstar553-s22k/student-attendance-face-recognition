/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Scan,
  Users,
  FileSpreadsheet,
  Calendar,
  BarChart3,
  Maximize2,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Menu,
  X,
  LayoutGrid,
  GraduationCap,
  FileCheck2,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Student, CourseSession, AttendanceRecord, LeaveRequest } from './types/attendance';
import { INITIAL_STUDENTS, INITIAL_COURSES, INITIAL_ATTENDANCE, INITIAL_LEAVE_REQUESTS } from './data/mockData';
import { BiometricScanner } from './components/BiometricScanner';
import { StudentDirectory } from './components/StudentDirectory';
import { AttendanceRegistry } from './components/AttendanceRegistry';
import { CourseSchedule } from './components/CourseSchedule';
import { AttendanceAnalytics } from './components/AttendanceAnalytics';
import { StudentPortal } from './components/StudentPortal';
import { ClassroomGrid } from './components/ClassroomGrid';
import { LeaveManagement } from './components/LeaveManagement';

export default function App() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<
    'scanner' | 'grid' | 'portal' | 'leaves' | 'registry' | 'students' | 'schedule' | 'analytics'
  >('scanner');
  const [isKioskMode, setIsKioskMode] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // Persistent student state
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const stored = localStorage.getItem('attendface_students_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.some((s) => s.name === 'Karthik')) {
          return parsed;
        }
      }
      return INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  // Persistent course state
  const [courses, setCourses] = useState<CourseSession[]>(() => {
    try {
      const stored = localStorage.getItem('attendface_courses_v3');
      return stored ? JSON.parse(stored) : INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  });

  const [activeCourseId, setActiveCourseId] = useState<string>(INITIAL_COURSES[0].id);

  // Persistent attendance records state
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const stored = localStorage.getItem('attendface_records_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.some((r) => r.studentName === 'Karthik')) {
          return parsed;
        }
      }
      return INITIAL_ATTENDANCE;
    } catch {
      return INITIAL_ATTENDANCE;
    }
  });

  // Persistent leave requests state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    try {
      const stored = localStorage.getItem('attendface_leaves_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.some((l) => l.studentName === 'Sumith' || l.studentName === 'Dashi')) {
          return parsed;
        }
      }
      return INITIAL_LEAVE_REQUESTS;
    } catch {
      return INITIAL_LEAVE_REQUESTS;
    }
  });

  // Save to local storage on changes
  useEffect(() => {
    try {
      localStorage.setItem('attendface_students_v3', JSON.stringify(students));
    } catch (e) {}
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem('attendface_records_v3', JSON.stringify(records));
    } catch (e) {}
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem('attendface_leaves_v3', JSON.stringify(leaveRequests));
    } catch (e) {}
  }, [leaveRequests]);

  // Current active lecture session
  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];

  // Attendance logged handler
  const handleRecordAttendance = (newRecord: AttendanceRecord) => {
    setRecords((prev) => [newRecord, ...prev]);

    // Update student's attended count if present or late
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === newRecord.studentId) {
          const isAttended = newRecord.status === 'present' || newRecord.status === 'late' || newRecord.status === 'excused';
          return {
            ...s,
            attendedClasses: isAttended ? s.attendedClasses + 1 : s.attendedClasses,
            totalClasses: s.totalClasses + 1,
          };
        }
        return s;
      })
    );
  };

  // Student roster operations
  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const handleUpdateRecordStatus = (
    recordId: string,
    newStatus: 'present' | 'late' | 'absent' | 'excused'
  ) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, status: newStatus } : r))
    );
  };

  // Leave operations
  const handleSubmitLeaveRequest = (req: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt'>) => {
    const newLeave: LeaveRequest = {
      ...req,
      id: `LEV-${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    setLeaveRequests((prev) => [newLeave, ...prev]);
  };

  const handleApproveLeave = (requestId: string) => {
    const target = leaveRequests.find((l) => l.id === requestId);
    if (!target) return;

    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === requestId ? { ...l, status: 'approved' } : l))
    );

    // Auto-create an excused attendance entry
    const excusedRecord: AttendanceRecord = {
      id: `ATT-EXCUSED-${Date.now()}`,
      studentId: target.studentId,
      studentName: target.studentName,
      rollNumber: target.rollNumber,
      department: 'Approved Duty Leave',
      courseId: target.courseId,
      courseName: target.courseName,
      timestamp: new Date().toISOString(),
      formattedTime: 'Excused Leave',
      date: target.date,
      status: 'excused',
      confidenceScore: 100,
      livenessScore: 100,
      antiSpoofPassed: true,
      verificationMethod: 'manual_override',
      sessionRoom: 'Sanctioned Absence',
    };

    handleRecordAttendance(excusedRecord);
    setNotificationMessage(`Leave approved for ${target.studentName}. Attendance marked Excused.`);
    setTimeout(() => setNotificationMessage(null), 3500);
  };

  const handleRejectLeave = (requestId: string) => {
    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === requestId ? { ...l, status: 'rejected' } : l))
    );
    setNotificationMessage('Leave application declined.');
    setTimeout(() => setNotificationMessage(null), 3500);
  };

  // Reset to initial demo database
  const handleResetData = () => {
    if (window.confirm('Reset all attendance data, student roster, and leave requests to default?')) {
      localStorage.removeItem('attendface_students_v3');
      localStorage.removeItem('attendface_records_v3');
      localStorage.removeItem('attendface_leaves_v3');
      localStorage.removeItem('attendface_courses_v3');
      localStorage.removeItem('attendface_students');
      localStorage.removeItem('attendface_records');
      localStorage.removeItem('attendface_leaves');
      localStorage.removeItem('attendface_courses');
      setStudents(INITIAL_STUDENTS);
      setRecords(INITIAL_ATTENDANCE);
      setCourses(INITIAL_COURSES);
      setLeaveRequests(INITIAL_LEAVE_REQUESTS);
      setActiveCourseId(INITIAL_COURSES[0].id);
      setNotificationMessage('Database restored to initial university seed state.');
      setTimeout(() => setNotificationMessage(null), 3500);
    }
  };

  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract: 1 Row, 3 Zones */}
      {!isKioskMode && (
        <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Zone 1: Single text element wordmark */}
            <div className="flex items-center gap-3">
              <a
                href="#scanner"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('scanner');
                }}
                className="text-base font-extrabold tracking-tight text-white hover:text-indigo-400 transition-colors flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                  <Scan className="w-4 h-4" />
                </div>
                <span>AttendFace AI</span>
              </a>
            </div>

            {/* Zone 2: Clean text navigation links */}
            <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('scanner')}
                className={`py-1.5 transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'scanner'
                    ? 'text-white border-indigo-500 font-bold'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                Biometric Scanner
              </button>

              <button
                onClick={() => setActiveTab('grid')}
                className={`py-1.5 transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'grid'
                    ? 'text-white border-indigo-500 font-bold'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                Classroom Grid
              </button>

              <button
                onClick={() => setActiveTab('portal')}
                className={`py-1.5 transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'portal'
                    ? 'text-white border-indigo-500 font-bold'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                Student Portal
              </button>

              <button
                onClick={() => setActiveTab('leaves')}
                className={`py-1.5 transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'leaves'
                    ? 'text-white border-indigo-500 font-bold'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <span>Leave Approvals</span>
                {pendingLeavesCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                    {pendingLeavesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('registry')}
                className={`py-1.5 transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'registry'
                    ? 'text-white border-indigo-500 font-bold'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                Audit Registry
              </button>

              <button
                onClick={() => setActiveTab('students')}
                className={`py-1.5 transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'students'
                    ? 'text-white border-indigo-500 font-bold'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                Student Roster
              </button>

              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-1.5 transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'schedule'
                    ? 'text-white border-indigo-500 font-bold'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                Timetable
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-1.5 transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'analytics'
                    ? 'text-white border-indigo-500 font-bold'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                AI Analytics
              </button>
            </nav>

            {/* Zone 3: Primary Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleResetData}
                className="hidden sm:inline-flex p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                title="Reset Database to Default Seed Data"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsKioskMode(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-750 transition-colors whitespace-nowrap"
                title="Launch Hallway Attendance Kiosk Mode"
              >
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Kiosk Mode</span>
              </button>

              <button
                onClick={() => setActiveTab('students')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md hover:shadow-indigo-600/20 whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Enroll Student</span>
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-1">
              {[
                { id: 'scanner', label: 'Biometric Scanner' },
                { id: 'grid', label: 'Classroom Grid' },
                { id: 'portal', label: 'Student Portal' },
                { id: 'leaves', label: `Leave Approvals (${pendingLeavesCount} Pending)` },
                { id: 'registry', label: 'Audit Registry' },
                { id: 'students', label: 'Student Roster' },
                { id: 'schedule', label: 'Timetable' },
                { id: 'analytics', label: 'AI Analytics' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                    activeTab === tab.id ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setIsKioskMode(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-emerald-400 flex items-center gap-1.5"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Open Fullscreen Kiosk Mode
              </button>
            </div>
          )}
        </header>
      )}

      {/* Global Notification Banner */}
      {notificationMessage && (
        <div className="bg-indigo-600 text-white text-xs py-2 px-4 text-center font-medium shadow-md">
          {notificationMessage}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'scanner' && (
          <BiometricScanner
            students={students}
            activeCourse={activeCourse}
            onRecordAttendance={handleRecordAttendance}
            recentRecords={records}
            isKioskMode={isKioskMode}
            onToggleKiosk={() => setIsKioskMode(!isKioskMode)}
          />
        )}

        {activeTab === 'grid' && (
          <ClassroomGrid
            students={students}
            records={records}
            activeCourse={activeCourse}
            onRecordAttendance={handleRecordAttendance}
            onUpdateRecordStatus={handleUpdateRecordStatus}
          />
        )}

        {activeTab === 'portal' && (
          <StudentPortal
            students={students}
            records={records}
            courses={courses}
            leaveRequests={leaveRequests}
            onSubmitLeaveRequest={handleSubmitLeaveRequest}
          />
        )}

        {activeTab === 'leaves' && (
          <LeaveManagement
            leaveRequests={leaveRequests}
            onApproveLeave={handleApproveLeave}
            onRejectLeave={handleRejectLeave}
          />
        )}

        {activeTab === 'registry' && (
          <AttendanceRegistry
            records={records}
            courses={courses}
            onUpdateRecordStatus={handleUpdateRecordStatus}
          />
        )}

        {activeTab === 'students' && (
          <StudentDirectory
            students={students}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
            onOpenEnrollModal={() => {}}
          />
        )}

        {activeTab === 'schedule' && (
          <CourseSchedule
            courses={courses}
            activeCourse={activeCourse}
            onSelectActiveCourse={(c) => {
              setActiveCourseId(c.id);
              setActiveTab('scanner');
            }}
            records={records}
            students={students}
          />
        )}

        {activeTab === 'analytics' && (
          <AttendanceAnalytics
            students={students}
            records={records}
            activeCourse={activeCourse}
          />
        )}
      </main>

      {/* Institutional Privacy & Compliance Footer */}
      {!isKioskMode && (
        <footer className="mt-auto border-t border-slate-900 bg-slate-950/70 py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Institutional Biometric Access Control · Encrypted Feature Embeddings</span>
            </div>
            <div className="text-slate-500">
              FERPA & Campus Biometric Privacy Compliant · Google Gemini Multimodal Engine
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
