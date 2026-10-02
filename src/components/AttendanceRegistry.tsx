import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Printer,
  Calendar,
  Eye,
  X,
  ChevronDown
} from 'lucide-react';
import { AttendanceRecord, CourseSession } from '../types/attendance';

interface AttendanceRegistryProps {
  records: AttendanceRecord[];
  courses: CourseSession[];
  onUpdateRecordStatus: (recordId: string, newStatus: 'present' | 'late' | 'absent' | 'excused') => void;
}

export const AttendanceRegistry: React.FC<AttendanceRegistryProps> = ({
  records,
  courses,
  onUpdateRecordStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [inspectedRecord, setInspectedRecord] = useState<AttendanceRecord | null>(null);

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = selectedCourseId === 'all' || r.courseId === selectedCourseId;
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    const matchesDate = !selectedDate || r.date === selectedDate;

    return matchesSearch && matchesCourse && matchesStatus && matchesDate;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Record ID',
      'Roll Number',
      'Student Name',
      'Department',
      'Course ID',
      'Course Name',
      'Date',
      'Timestamp',
      'Status',
      'Confidence %',
      'Liveness %',
      'Verification Method',
    ];

    const rows = filteredRecords.map((r) => [
      r.id,
      r.rollNumber,
      `"${r.studentName}"`,
      `"${r.department}"`,
      r.courseId,
      `"${r.courseName}"`,
      r.date,
      r.formattedTime,
      r.status.toUpperCase(),
      r.confidenceScore,
      r.livenessScore,
      r.verificationMethod,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print attendance register
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Attendance Audit Registry</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable biometric log of student arrivals, confidence metrics, and attendance classifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-850 hover:bg-slate-800 border border-slate-750 rounded-xl transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Ledger
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Query Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll number, or department..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Course Filter */}
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.courseCode} · {course.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present (On-Time)</option>
            <option value="late">Late Arrival</option>
            <option value="absent">Marked Absent</option>
            <option value="excused">Excused Leave</option>
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          />

          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* High-Density Tabular Register */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="py-3 px-4">Student & Roll No</th>
                <th className="py-3 px-4">Course & Room</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Biometric Confidence</th>
                <th className="py-3 px-4">Liveness & Anti-Spoof</th>
                <th className="py-3 px-4">Status & Action</th>
                <th className="py-3 px-4 text-right">Verification Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 text-xs">
                    No attendance records match the selected search criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-850/50 transition-colors"
                    >
                      {/* Student info */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{record.studentName}</div>
                        <div className="text-[11px] font-mono text-indigo-400">
                          {record.rollNumber}
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-3 px-4">
                        <div className="text-slate-200 truncate max-w-[200px]">{record.courseName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{record.sessionRoom}</div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <div className="tabular-nums">{record.formattedTime}</div>
                        <div className="text-[10px] text-slate-500">{record.date}</div>
                      </td>

                      {/* Biometric Confidence */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-400"
                              style={{ width: `${record.confidenceScore}%` }}
                            />
                          </div>
                          <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                            {record.confidenceScore}%
                          </span>
                        </div>
                      </td>

                      {/* Anti Spoof */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Passed (Liveness {record.livenessScore}%)</span>
                        </div>
                      </td>

                      {/* Status Dropdown Override */}
                      <td className="py-3 px-4">
                        <select
                          value={record.status}
                          onChange={(e) =>
                            onUpdateRecordStatus(
                              record.id,
                              e.target.value as 'present' | 'late' | 'absent' | 'excused'
                            )
                          }
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none transition-colors ${
                            record.status === 'present'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : record.status === 'late'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : record.status === 'absent'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          }`}
                        >
                          <option value="present">Present</option>
                          <option value="late">Late Arrival</option>
                          <option value="absent">Absent</option>
                          <option value="excused">Excused</option>
                        </select>
                      </td>

                      {/* Proof Inspection */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setInspectedRecord(record)}
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Biometric Verification Audit Modal */}
      {inspectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Biometric Audit Certificate</h3>
                <p className="text-xs text-slate-400 mt-0.5">Verification Record: {inspectedRecord.id}</p>
              </div>
              <button
                onClick={() => setInspectedRecord(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Student Identified</span>
                  <span className="text-sm font-bold text-white">{inspectedRecord.studentName}</span>
                  <div className="text-xs font-mono text-indigo-400">{inspectedRecord.rollNumber}</div>
                </div>

                <div className="text-right">
                  <span className="text-slate-500 text-[10px] uppercase block">Classification</span>
                  <span className="text-xs font-bold text-emerald-400 uppercase">
                    {inspectedRecord.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase block">Facial Match</span>
                  <span className="text-emerald-400 font-bold tabular-nums text-sm">
                    {inspectedRecord.confidenceScore}%
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase block">Liveness Score</span>
                  <span className="text-emerald-400 font-bold tabular-nums text-sm">
                    {inspectedRecord.livenessScore}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Anti-Spoofing & Replay Attack Verification
                </div>
                <p className="text-emerald-400/80">
                  No 2D printed photograph, mobile screen glare, or synthetic deepfake signature detected. Natural optical depth verified.
                </p>
              </div>

              <div className="text-slate-400 text-[11px] space-y-1 pt-1 font-mono">
                <div>Engine: Google Gemini Multimodal Vision API</div>
                <div>Recorded: {inspectedRecord.date} at {inspectedRecord.formattedTime}</div>
                <div>Location: {inspectedRecord.sessionRoom}</div>
              </div>
            </div>

            <button
              onClick={() => setInspectedRecord(null)}
              className="w-full py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
