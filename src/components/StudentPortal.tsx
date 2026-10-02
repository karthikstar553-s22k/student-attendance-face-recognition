import React, { useState } from 'react';
import {
  User,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Send,
  FileCheck,
  ShieldCheck,
  Award,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Student, AttendanceRecord, CourseSession, LeaveRequest } from '../types/attendance';

interface StudentPortalProps {
  students: Student[];
  records: AttendanceRecord[];
  courses: CourseSession[];
  leaveRequests: LeaveRequest[];
  onSubmitLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt'>) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  students,
  records,
  courses,
  leaveRequests,
  onSubmitLeaveRequest,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    courseId: courses[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    type: 'medical' as const,
    reason: '',
  });
  const [requestSubmittedMessage, setRequestSubmittedMessage] = useState(false);

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const studentRecords = records.filter((r) => r.studentId === currentStudent?.id);
  const studentLeaveRequests = leaveRequests.filter((l) => l.studentId === currentStudent?.id);

  const attendanceRate = currentStudent
    ? Math.round((currentStudent.attendedClasses / currentStudent.totalClasses) * 100)
    : 0;

  const isEligibleForExams = attendanceRate >= 75;

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || !leaveForm.reason) return;

    const course = courses.find((c) => c.id === leaveForm.courseId) || courses[0];

    onSubmitLeaveRequest({
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      rollNumber: currentStudent.rollNumber,
      courseId: course.id,
      courseName: course.name,
      date: leaveForm.date,
      type: leaveForm.type,
      reason: leaveForm.reason,
    });

    setLeaveModalOpen(false);
    setRequestSubmittedMessage(true);
    setTimeout(() => setRequestSubmittedMessage(false), 4000);
    setLeaveForm({
      courseId: courses[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      type: 'medical',
      reason: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Student Selector & Greeting */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentStudent?.avatarColor || 'from-indigo-600 to-blue-800'} flex items-center justify-center text-lg font-bold text-white shadow-lg shrink-0`}>
            {currentStudent?.name.split(' ').map((n) => n[0]).join('')}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{currentStudent?.name}</h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {currentStudent?.rollNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentStudent?.department} · Semester {currentStudent?.semester} (Sec {currentStudent?.section})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Viewing Student:</span>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-slate-950 border border-slate-750 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.rollNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Success Notification */}
      {requestSubmittedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Leave request submitted successfully. It has been routed to faculty for verification.</span>
        </div>
      )}

      {/* KPI Cards for Student */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Attendance Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Attendance</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono tabular-nums">{attendanceRate}%</div>
          <div className="flex items-center gap-1.5 text-xs">
            {isEligibleForExams ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Exam Debarment Safe (&gt; 75%)
              </span>
            ) : (
              <span className="text-rose-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Debarment Warning (&lt; 75%)
              </span>
            )}
          </div>
        </div>

        {/* Classes Attended */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Lectures Attended</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono tabular-nums">
            {currentStudent?.attendedClasses} / {currentStudent?.totalClasses}
          </div>
          <p className="text-[11px] text-slate-500">
            Missed {currentStudent?.totalClasses - currentStudent?.attendedClasses} lecture hours
          </p>
        </div>

        {/* Biometric Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Biometric Identification</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-4 h-4" /> Enrolled & Verified
          </div>
          <p className="text-[11px] font-mono text-slate-400 truncate">
            Template: {currentStudent?.facialFeatureHash}
          </p>
        </div>
      </div>

      {/* Main Grid: Subject Breakdown & Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Subject-Wise Attendance Breakdown (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Course-Wise Attendance Compliance</h3>
              <p className="text-xs text-slate-400">Attendance percentages for enrolled course modules</p>
            </div>
            <span className="text-xs font-mono text-indigo-400 font-semibold">
              Min Threshold: 75%
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {courses.map((course) => {
              // Simulated course-specific variation
              const base = attendanceRate;
              const courseRate = Math.min(100, Math.max(55, base + ((course.name.length % 7) - 3) * 3));
              const isWarning = courseRate < 75;

              return (
                <div key={course.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white">{course.name}</span>
                      <span className="text-slate-500 font-mono ml-2">({course.courseCode})</span>
                    </div>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        isWarning ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {courseRate}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isWarning ? 'bg-rose-500' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${courseRate}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{course.instructor}</span>
                    <span>{course.room.split('·')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave Requests & Absence Applications (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Absence & Leave Applications</h3>
              <p className="text-xs text-slate-400">Request formal medical or academic duty leave</p>
            </div>

            <button
              onClick={() => setLeaveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Apply Leave
            </button>
          </div>

          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {studentLeaveRequests.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No leave requests filed yet. You can apply for medical or sanctioned duty leave above.
              </div>
            ) : (
              studentLeaveRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{req.courseName}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : req.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-slate-400 text-[11px]">{req.reason}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                    <span className="capitalize">Type: {req.type}</span>
                    <span>Date: {req.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Submit Leave Request</h3>
                <p className="text-xs text-slate-400 mt-0.5">Absence will be marked Excused once verified by faculty</p>
              </div>
              <button
                onClick={() => setLeaveModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Course Session</label>
                <select
                  value={leaveForm.courseId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, courseId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} · {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Leave Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Leave Type</label>
                  <select
                    value={leaveForm.type}
                    onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="medical">Medical / Health</option>
                    <option value="sports">University Sports</option>
                    <option value="academic">Academic Symposium</option>
                    <option value="emergency">Family Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Reason & Explanation</label>
                <textarea
                  required
                  rows={3}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Provide context or doctor prescription reference..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setLeaveModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
