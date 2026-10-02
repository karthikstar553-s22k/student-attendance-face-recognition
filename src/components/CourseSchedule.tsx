import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle2,
  PlayCircle,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { CourseSession, AttendanceRecord, Student } from '../types/attendance';

interface CourseScheduleProps {
  courses: CourseSession[];
  activeCourse: CourseSession;
  onSelectActiveCourse: (course: CourseSession) => void;
  records: AttendanceRecord[];
  students: Student[];
}

export const CourseSchedule: React.FC<CourseScheduleProps> = ({
  courses,
  activeCourse,
  onSelectActiveCourse,
  records,
  students,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Course Timetable & Active Sessions</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Select which academic lecture session the biometric attendance terminal is currently recording.
        </p>
      </div>

      {/* Course Session Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => {
          const isActive = course.id === activeCourse.id;
          const courseRecords = records.filter((r) => r.courseId === course.id);
          const attendancePct = Math.round((courseRecords.length / students.length) * 100);

          return (
            <div
              key={course.id}
              className={`p-5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-slate-900 border-indigo-500 shadow-xl ring-1 ring-indigo-500/50'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      {course.courseCode}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs text-slate-400">{course.days}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{course.name}</h3>
                </div>

                {isActive ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Terminal Active
                  </span>
                ) : (
                  <button
                    onClick={() => onSelectActiveCourse(course)}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all border border-slate-700 hover:border-indigo-500 shrink-0"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Set Active
                  </button>
                )}
              </div>

              {/* Course Meta Info */}
              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{course.instructor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{course.room}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="tabular-nums">{course.startTime} – {course.endTime}</span>
                  <span className="text-slate-500">({course.gracePeriodMins}m Grace Buffer)</span>
                </div>
              </div>

              {/* Attendance Statistics for this Course */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Today's Check-ins:</span>
                <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                  {courseRecords.length} / {students.length} Students ({attendancePct}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
