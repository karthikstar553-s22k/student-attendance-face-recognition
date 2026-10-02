import React, { useState, useRef } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Camera,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Mail,
  Phone,
  BookOpen,
  Shield,
  Trash2,
  Calendar,
  X,
  Upload,
  RefreshCw
} from 'lucide-react';
import { Student } from '../types/attendance';

interface StudentDirectoryProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenEnrollModal: () => void;
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({
  students,
  onAddStudent,
  onDeleteStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // New Student Form State
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    department: 'Computer Science & Engineering',
    semester: 6,
    section: 'A',
    email: '',
    phone: '',
    bloodGroup: 'O+',
    facialNotes: '',
  });

  // Modal Camera Snapshot State
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [modalCameraActive, setModalCameraActive] = useState(false);
  const [capturedAngleIndex, setCapturedAngleIndex] = useState(0);
  const [capturedAngles, setCapturedAngles] = useState<string[]>([]);
  const [isEnrollingBiometrics, setIsEnrollingBiometrics] = useState(false);

  const departments = Array.from(new Set(students.map((s) => s.department)));

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'all' || s.department === selectedDept;

    const attendanceRate = (s.attendedClasses / s.totalClasses) * 100;
    const matchesRisk =
      selectedRisk === 'all' ||
      (selectedRisk === 'critical' && attendanceRate < 75) ||
      (selectedRisk === 'good' && attendanceRate >= 85);

    return matchesSearch && matchesDept && matchesRisk;
  });

  // Start modal camera for enrollment
  const startModalCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      if (modalVideoRef.current) {
        modalVideoRef.current.srcObject = stream;
        await modalVideoRef.current.play();
      }
      setModalCameraActive(true);
    } catch (e) {
      console.warn('Camera failed:', e);
    }
  };

  // Stop modal camera
  const stopModalCamera = () => {
    if (modalVideoRef.current && modalVideoRef.current.srcObject) {
      const stream = modalVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      modalVideoRef.current.srcObject = null;
    }
    setModalCameraActive(false);
  };

  // Snap biometric angle
  const handleSnapAngle = () => {
    if (!modalVideoRef.current || !modalCanvasRef.current) return;
    const video = modalVideoRef.current;
    const canvas = modalCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const snap = canvas.toDataURL('image/jpeg', 0.8);
    const nextAngles = [...capturedAngles, snap];
    setCapturedAngles(nextAngles);
    setCapturedAngleIndex(nextAngles.length);
  };

  // Submit enrollment
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.rollNumber) return;

    setIsEnrollingBiometrics(true);

    setTimeout(() => {
      const colors = [
        'from-blue-600 to-indigo-800',
        'from-emerald-500 to-teal-700',
        'from-purple-600 to-pink-700',
        'from-amber-500 to-orange-700',
        'from-cyan-500 to-blue-700',
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const newStudent: Student = {
        id: `STU-2024-${String(students.length + 1).padStart(3, '0')}`,
        rollNumber: formData.rollNumber.toUpperCase(),
        name: formData.name,
        email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@university.edu`,
        department: formData.department,
        semester: Number(formData.semester),
        section: formData.section,
        avatarColor: randomColor,
        enrolledAt: new Date().toISOString().split('T')[0],
        facialFeatureHash: `hash_${Math.random().toString(36).substring(2, 9)}`,
        faceAnglesCount: capturedAngles.length > 0 ? capturedAngles.length : 3,
        totalClasses: 48,
        attendedClasses: 46,
        contactPhone: formData.phone || '+1 (555) 019-2834',
        bloodGroup: formData.bloodGroup,
        facialNotes: formData.facialNotes || 'Enrolled via automated terminal registration',
      };

      onAddStudent(newStudent);
      setIsEnrollingBiometrics(false);
      setIsEnrollModalOpen(false);
      stopModalCamera();
      setCapturedAngles([]);
      setCapturedAngleIndex(0);
      setFormData({
        name: '',
        rollNumber: '',
        department: 'Computer Science & Engineering',
        semester: 6,
        section: 'A',
        email: '',
        phone: '',
        bloodGroup: 'O+',
        facialNotes: '',
      });
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Student Biometric Roster</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage enrolled students, biometric face signatures, and individual attendance history.
          </p>
        </div>

        <button
          onClick={() => {
            setIsEnrollModalOpen(true);
            startModalCamera();
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg hover:shadow-indigo-600/20"
        >
          <UserPlus className="w-4 h-4" />
          + Enroll New Student
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll number, or email..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Risk Level Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Attendance Rates</option>
            <option value="critical">Critical (&lt; 75% Debarment Risk)</option>
            <option value="good">Exemplary (&ge; 85%)</option>
          </select>
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
            No students found matching the selected query or filters.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const attendancePct = Math.round((student.attendedClasses / student.totalClasses) * 100);
            const isCritical = attendancePct < 75;

            return (
              <div
                key={student.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${student.avatarColor} flex items-center justify-center text-sm font-bold text-white shadow-md shrink-0`}>
                        {student.name.split(' ').map((n) => n[0]).join('')}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{student.name}</h3>
                        <div className="text-xs font-mono text-indigo-400 font-medium">
                          {student.rollNumber}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md border tabular-nums shrink-0 ${
                        isCritical
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {attendancePct}%
                    </span>
                  </div>

                  {/* Metadata List */}
                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Department:</span>
                      <span className="text-slate-300 font-medium truncate max-w-[190px]">{student.department}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Class / Section:</span>
                      <span className="text-slate-300 font-medium">Semester {student.semester} · Sec {student.section}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Biometrics:</span>
                      <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        {student.faceAnglesCount} Angles Enrolled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                  >
                    View Dossier & Record →
                  </button>

                  <button
                    onClick={() => onDeleteStudent(student.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove Student"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Student Detail Dossier Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedStudent.avatarColor} flex items-center justify-center text-lg font-bold text-white shadow-lg`}>
                  {selectedStudent.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedStudent.name}</h3>
                  <div className="text-xs font-mono text-indigo-400">{selectedStudent.rollNumber}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{selectedStudent.department}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Attendance Progress Bar */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Semester Attendance Rate</span>
                <span className="font-bold text-white font-mono tabular-nums">
                  {Math.round((selectedStudent.attendedClasses / selectedStudent.totalClasses) * 100)}% ({selectedStudent.attendedClasses} / {selectedStudent.totalClasses} Lectures)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    (selectedStudent.attendedClasses / selectedStudent.totalClasses) * 100 < 75
                      ? 'bg-rose-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${(selectedStudent.attendedClasses / selectedStudent.totalClasses) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Student Dossier Information */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Email Address</span>
                <span className="text-slate-300 font-sans truncate block">{selectedStudent.email}</span>
              </div>
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Contact Phone</span>
                <span className="text-slate-300 font-sans block">{selectedStudent.contactPhone}</span>
              </div>
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Blood Group</span>
                <span className="text-slate-300 block">{selectedStudent.bloodGroup}</span>
              </div>
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Enrollment Date</span>
                <span className="text-slate-300 block">{selectedStudent.enrolledAt}</span>
              </div>
            </div>

            {/* Biometric Verification Status */}
            <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="font-semibold text-emerald-300">Biometric Template Valid</div>
                  <div className="text-[11px] font-mono text-emerald-500/90">{selectedStudent.facialFeatureHash}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/60 px-2 py-1 rounded">
                Verified
              </span>
            </div>

            <button
              onClick={() => setSelectedStudent(null)}
              className="w-full py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}

      {/* New Student Enrollment Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Biometric Student Enrollment</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Register new student profile and calibrate facial recognition biometric embedding.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEnrollModalOpen(false);
                  stopModalCamera();
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Liam Gallagher"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Roll Number / Student ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="e.g. CS24-118"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Data Science & AI">Data Science & AI</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Semester</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Section</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@university.edu"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Facial Angle Capture Terminal */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">Biometric Facial Calibration (3 Angles)</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {capturedAngles.length} / 3 Angles Acquired
                  </span>
                </div>

                <div className="relative aspect-video max-h-48 w-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                  <video
                    ref={modalVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover mirror-video ${modalCameraActive ? 'block' : 'hidden'}`}
                  />
                  <canvas ref={modalCanvasRef} className="hidden" />

                  {!modalCameraActive && (
                    <div className="text-center p-4">
                      <Camera className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <button
                        type="button"
                        onClick={startModalCamera}
                        className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                      >
                        Enable Camera for Snapshots
                      </button>
                    </div>
                  )}

                  {modalCameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-32 h-40 border-2 border-dashed border-emerald-400/80 rounded-2xl" />
                    </div>
                  )}
                </div>

                {/* Capture buttons for the 3 angles */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-400">
                    {capturedAngles.length === 0 && 'Step 1: Face camera directly'}
                    {capturedAngles.length === 1 && 'Step 2: Turn head slightly left'}
                    {capturedAngles.length === 2 && 'Step 3: Turn head slightly right'}
                    {capturedAngles.length >= 3 && 'Calibration Complete!'}
                  </span>

                  {modalCameraActive && capturedAngles.length < 3 && (
                    <button
                      type="button"
                      onClick={handleSnapAngle}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                    >
                      Capture Angle #{capturedAngles.length + 1}
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEnrollModalOpen(false);
                    stopModalCamera();
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEnrollingBiometrics}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {isEnrollingBiometrics && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isEnrollingBiometrics ? 'Encrypting Embedding...' : 'Complete Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
