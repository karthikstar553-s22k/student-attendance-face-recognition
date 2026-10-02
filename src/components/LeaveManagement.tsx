import React from 'react';
import {
  FileCheck2,
  Check,
  X,
  Clock,
  Calendar,
  User,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { LeaveRequest } from '../types/attendance';

interface LeaveManagementProps {
  leaveRequests: LeaveRequest[];
  onApproveLeave: (requestId: string) => void;
  onRejectLeave: (requestId: string) => void;
}

export const LeaveManagement: React.FC<LeaveManagementProps> = ({
  leaveRequests,
  onApproveLeave,
  onRejectLeave,
}) => {
  const pendingRequests = leaveRequests.filter((r) => r.status === 'pending');
  const pastRequests = leaveRequests.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Leave & Medical Absence Approvals</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Review and sanction student medical certificates, university duty leaves, and emergency absence requests.
        </p>
      </div>

      {/* Pending Requests Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Pending Faculty Review ({pendingRequests.length})
          </h3>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
            No pending leave requests awaiting approval. All applications are up to date.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{req.studentName}</h4>
                      <div className="text-xs font-mono text-indigo-400">{req.rollNumber}</div>
                    </div>
                    <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {req.type}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-2">
                    <p className="italic font-serif">"{req.reason}"</p>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                    <div>Course: <span className="text-slate-200">{req.courseName}</span></div>
                    <div>Requested Date: <span className="text-slate-200">{req.date}</span></div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onApproveLeave(req.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    Approve (Sanctioned)
                  </button>

                  <button
                    onClick={() => onRejectLeave(req.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900 border border-rose-800/50 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Previous Decision History */}
      {pastRequests.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800/80">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Past Approved & Rejected Applications
          </h3>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Date & Type</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {pastRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-850/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{req.studentName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{req.rollNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{req.courseName}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      <div>{req.date}</div>
                      <div className="text-[10px] uppercase text-slate-500">{req.type}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded border ${
                          req.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
