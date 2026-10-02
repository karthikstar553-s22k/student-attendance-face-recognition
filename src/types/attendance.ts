export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  section: string;
  avatarUrl?: string;
  avatarColor: string;
  enrolledAt: string;
  facialFeatureHash: string;
  faceAnglesCount: number;
  totalClasses: number;
  attendedClasses: number;
  contactPhone: string;
  bloodGroup: string;
  facialNotes?: string;
}

export interface CourseSession {
  id: string;
  courseCode: string;
  name: string;
  instructor: string;
  room: string;
  startTime: string;
  endTime: string;
  gracePeriodMins: number;
  days: string;
  totalEnrolled: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  courseId: string;
  courseName: string;
  timestamp: string;
  formattedTime: string;
  date: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  confidenceScore: number;
  livenessScore: number;
  antiSpoofPassed: boolean;
  snapshotImage?: string;
  verificationMethod: 'ai_face_biometric' | 'manual_override';
  sessionRoom: string;
}

export interface BiometricScanResult {
  faceDetected: boolean;
  matchedStudentId: string | null;
  studentName: string | null;
  confidence: number;
  livenessScore: number;
  spoofDetected: boolean;
  facialExpression?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  verificationNote?: string;
}

export interface AttendanceAuditReport {
  executiveSummary: string;
  defaultersRisk: {
    studentId: string;
    name: string;
    currentRate: number;
    recommendation: string;
  }[];
  peakArrivalTime: string;
  punctualityIndex: string;
  actionableAdvice: string[];
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  courseId: string;
  courseName: string;
  date: string;
  type: 'medical' | 'sports' | 'academic' | 'emergency';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export type ViewRole = 'faculty' | 'student' | 'kiosk';
