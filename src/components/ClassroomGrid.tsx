import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Shield,
  CheckCheck,
  RotateCcw
} from 'lucide-react';
import { Student, AttendanceRecord, CourseSession } from '../types/attendance';

interface ClassroomGridProps {
  students: Student[];
  records: AttendanceRecord[];
  activeCourse: CourseSession;
  onRecordAttendance: (record: AttendanceRecord) => void;
  onUpdateRecordStatus: (recordId: string, status: 'present' | 'late' | 'absent' | 'excused') => void;
}

export const ClassroomGrid: React.FC<ClassroomGridProps> = ({
  students,
  records,
  activeCourse,
  onRecordAttendance,
  onUpdateRecordStatus,
}) => {
  // Find current attendance status for each student in activeCourse
  const studentStatusMap = new Map<string, AttendanceRecord | null>();
  students.forEach((s) => {
    const rec = records.find((r) => r.studentId === s.id && r.courseId === activeCourse.id);
    studentStatusMap.set(s.id, rec || null);
  });

  const presentCount = students.filter((s) => {
    const rec = studentStatusMap.get(s.id);
    return rec?.status === 'present';
  }).length;

  const lateCount = students.filter((s) => {
    const rec = studentStatusMap.get(s.id);
    return rec?.status === 'late';
  }).length;

  const unmarkedCount = students.length - (presentCount + lateCount);

  // Quick 1-click toggle for professor
  const handleQuickToggle = (student: Student) => {
    const existing = studentStatusMap.get(student.id);
    if (!existing) {
      // Mark as present
      const now = new Date();
      const newRec: AttendanceRecord = {
        id: `ATT-MANUAL-${Date.now()}-${student.rollNumber}`,
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        department: student.department,
        courseId: activeCourse.id,
        courseName: activeCourse.name,
        timestamp: now.toISOString(),
        formattedTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: now.toISOString().split('T')[0],
        status: 'present',
        confidenceScore: 99.0,
        livenessScore: 99.0,
        antiSpoofPassed: true,
        verificationMethod: 'manual_override',
        sessionRoom: activeCourse.room,
      };
      onRecordAttendance(newRec);
    } else if (existing.status === 'present') {
      onUpdateRecordStatus(existing.id, 'late');
    } else if (existing.status === 'late') {
      onUpdateRecordStatus(existing.id, 'excused');
    } else {
      onUpdateRecordStatus(existing.id, 'present');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Live Session Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Visual Classroom Attendance Grid</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active Lecture: <span className="text-indigo-400 font-semibold">{activeCourse.name}</span> ({activeCourse.room.split('·')[0]})
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="tabular-nums font-bold">{presentCount}</span> Present
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="tabular-nums font-bold">{lateCount}</span> Late
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            <span className="tabular-nums font-bold">{unmarkedCount}</span> Unmarked
          </div>
        </div>
      </div>

      {/* Seating / Roster Tile Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {students.map((student) => {
          const record = studentStatusMap.get(student.id);
          const isPresent = record?.status === 'present';
          const isLate = record?.status === 'late';
          const isExcused = record?.status === 'excused';

          return (
            <button
              key={student.id}
              onClick={() => handleQuickToggle(student)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-36 ${
                isPresent
                  ? 'bg-emerald-950/20 border-emerald-500/60 hover:border-emerald-400 shadow-sm'
                  : isLate
                  ? 'bg-amber-950/20 border-amber-500/60 hover:border-amber-400 shadow-sm'
                  : isExcused
                  ? 'bg-indigo-950/20 border-indigo-500/60 hover:border-indigo-400'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Top row: Avatar & Status Badge */}
              <div className="flex items-start justify-between w-full">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${student.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow`}>
                  {student.name.split(' ').map((n) => n[0]).join('')}
                </div>

                {isPresent && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                )}
                {isLate && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow">
                    <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                )}
                {isExcused && (
                  <span className="text-[9px] font-mono font-bold bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded">
                    EXC
                  </span>
                )}
                {!record && (
                  <span className="text-[10px] text-slate-600 font-mono">
                    Absent
                  </span>
                )}
              </div>

              {/* Bottom row: Student Name & Roll No */}
              <div className="w-full">
                <div className="text-xs font-bold text-white truncate">{student.name}</div>
                <div className="text-[10px] font-mono text-indigo-400 truncate mt-0.5">
                  {student.rollNumber}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-1 flex items-center justify-between">
                  <span>{record?.formattedTime ? record.formattedTime.slice(0, 5) : '---'}</span>
                  <span className="capitalize">{record?.status || 'Tap to mark'}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Tap any tile to cycle status: <strong className="text-white">Unmarked → Present → Late → Excused</strong></span>
        </div>
        <span className="text-slate-500 font-mono text-[11px]">
          Hall Capacity: {students.length} Allocated Desks
        </span>
      </div>
    </div>
  );
};
