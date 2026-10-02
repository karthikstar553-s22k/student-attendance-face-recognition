import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  FileText,
  BarChart3
} from 'lucide-react';
import { Student, AttendanceRecord, CourseSession, AttendanceAuditReport } from '../types/attendance';

interface AttendanceAnalyticsProps {
  students: Student[];
  records: AttendanceRecord[];
  activeCourse: CourseSession;
}

export const AttendanceAnalytics: React.FC<AttendanceAnalyticsProps> = ({
  students,
  records,
  activeCourse,
}) => {
  const [isGeneratingAudit, setIsGeneratingAudit] = useState(false);
  const [auditReport, setAuditReport] = useState<AttendanceAuditReport | null>(null);

  // Compute key metrics
  const totalClasses = students.reduce((acc, s) => acc + s.totalClasses, 0);
  const totalAttended = students.reduce((acc, s) => acc + s.attendedClasses, 0);
  const overallRate = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

  const defaulters = students.filter(
    (s) => Math.round((s.attendedClasses / s.totalClasses) * 100) < 75
  );

  const presentToday = records.filter((r) => r.status === 'present').length;
  const lateToday = records.filter((r) => r.status === 'late').length;

  // Department breakdown
  const departmentStats = Array.from(new Set(students.map((s) => s.department))).map((dept) => {
    const deptStudents = students.filter((s) => s.department === dept);
    const deptTotal = deptStudents.reduce((acc, s) => acc + s.totalClasses, 0);
    const deptAttended = deptStudents.reduce((acc, s) => acc + s.attendedClasses, 0);
    const rate = deptTotal > 0 ? Math.round((deptAttended / deptTotal) * 100) : 0;
    return {
      name: dept,
      studentCount: deptStudents.length,
      rate,
    };
  });

  // Call AI Registrar analysis endpoint
  const handleGenerateAudit = async () => {
    setIsGeneratingAudit(true);
    try {
      const response = await fetch('/api/analyze-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceRecords: records,
          enrolledStudents: students,
          activeCourse,
        }),
      });

      if (response.ok) {
        const report = await response.json();
        setAuditReport(report);
      }
    } catch (e) {
      console.error('Audit generation error:', e);
    } finally {
      setIsGeneratingAudit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Attendance Analytics & AI Audit</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quantitative attendance metrics, student shortage warnings, and AI-generated registrar insights.
          </p>
        </div>

        <button
          onClick={handleGenerateAudit}
          disabled={isGeneratingAudit}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg hover:shadow-indigo-600/20 disabled:opacity-50"
        >
          {isGeneratingAudit ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-indigo-200" />
          )}
          {isGeneratingAudit ? 'Analyzing Patterns...' : 'Run Gemini Registrar Audit'}
        </button>
      </div>

      {/* KPI Stat Cards (Single-elevation depth, no nested cards, tabular numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Institutional Attendance</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">{overallRate}%</div>
          <p className="text-[11px] text-slate-500">Across all semester lecture sessions</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Present Today</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {presentToday} / {students.length}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium">
            {Math.round((presentToday / students.length) * 100)}% verified on-time check-ins
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Late Arrivals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">{lateToday}</div>
          <p className="text-[11px] text-slate-500">Arrived during 15-min grace window</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Debarment Risk (&lt; 75%)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums">
            {defaulters.length} Students
          </div>
          <p className="text-[11px] text-slate-500">Subject to university exam restriction</p>
        </div>
      </div>

      {/* Charts & Department Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Trend Visualizer (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Daily Attendance Trajectory</h3>
              <p className="text-xs text-slate-400">Recorded check-in percentage across recent calendar days</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold tabular-nums">
              Avg: 93.6%
            </span>
          </div>

          {/* SVG Trend Chart */}
          <div className="h-56 w-full flex items-end justify-between gap-3 pt-4 px-2">
            {[
              { day: 'Mon', date: 'Sep 25', rate: 94 },
              { day: 'Tue', date: 'Sep 26', rate: 91 },
              { day: 'Wed', date: 'Sep 27', rate: 96 },
              { day: 'Thu', date: 'Sep 28', rate: 92 },
              { day: 'Fri', date: 'Sep 29', rate: 89 },
              { day: 'Mon', date: 'Oct 01', rate: 95 },
              { day: 'Today', date: 'Oct 02', rate: 96 },
            ].map((col, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-mono text-slate-400 font-semibold tabular-nums">
                  {col.rate}%
                </span>
                <div className="w-full max-w-[38px] bg-slate-800 rounded-t-lg overflow-hidden flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-emerald-400 rounded-t-lg transition-all duration-500"
                    style={{ height: `${col.rate}%` }}
                  />
                </div>
                <div className="text-center font-mono">
                  <div className="text-[11px] font-semibold text-slate-200">{col.day}</div>
                  <div className="text-[9px] text-slate-500">{col.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Comparison (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Departmental Discipline Index</h3>
            <p className="text-xs text-slate-400">Class compliance broken down by faculty</p>
          </div>

          <div className="space-y-4 pt-1">
            {departmentStats.map((dept, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{dept.name}</span>
                  <span className="font-mono text-emerald-400 font-bold tabular-nums">
                    {dept.rate}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${dept.rate}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {dept.studentCount} enrolled candidates in roster
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gemini AI Attendance Audit Report */}
      {auditReport && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Gemini AI Academic Registrar Audit</h3>
                <p className="text-xs text-slate-400">Automated institutional attendance integrity report</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-md">
              Audit Complete
            </span>
          </div>

          {/* Executive Summary */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-white uppercase tracking-wider text-[10px] block text-indigo-400 mb-1">
              Executive Summary
            </span>
            {auditReport.executiveSummary}
          </div>

          {/* Key Findings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Peak Arrival Influx Window</span>
              <span className="text-slate-200 font-sans font-semibold text-sm block">
                {auditReport.peakArrivalTime}
              </span>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Overall Punctuality Index</span>
              <span className="text-emerald-400 font-sans font-semibold text-sm block">
                {auditReport.punctualityIndex}
              </span>
            </div>
          </div>

          {/* Debarment Risk Students List */}
          {auditReport.defaultersRisk.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Students Flagged for Immediate Attendance Shortage Debarment
              </h4>
              <div className="space-y-2">
                {auditReport.defaultersRisk.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="text-slate-400 text-[11px] ml-2 font-mono">({item.studentId})</span>
                      <p className="text-[11px] text-slate-300 mt-0.5">{item.recommendation}</p>
                    </div>
                    <span className="text-rose-400 font-mono font-bold text-xs tabular-nums shrink-0">
                      {item.currentRate}% Attendance
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Advice for Faculty */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Registrar Recommendations for Faculty
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
              {auditReport.actionableAdvice.map((advice, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{advice}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
