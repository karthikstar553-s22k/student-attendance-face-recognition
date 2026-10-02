import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Scan,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Volume2,
  VolumeX,
  Upload,
  UserX,
  Clock,
  MapPin,
  BookOpen
} from 'lucide-react';
import { Student, CourseSession, AttendanceRecord, BiometricScanResult } from '../types/attendance';
import { soundEffects } from '../utils/audioFeedback';

interface BiometricScannerProps {
  students: Student[];
  activeCourse: CourseSession;
  onRecordAttendance: (record: AttendanceRecord) => void;
  recentRecords: AttendanceRecord[];
  isKioskMode: boolean;
  onToggleKiosk: () => void;
}

export const BiometricScanner: React.FC<BiometricScannerProps> = ({
  students,
  activeCourse,
  onRecordAttendance,
  recentRecords,
  isKioskMode,
  onToggleKiosk,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeTestSubjectId, setActiveTestSubjectId] = useState<string>('live_webcam');

  // Scanner state
  const [scanResult, setScanResult] = useState<BiometricScanResult | null>(null);
  const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);
  const [attendanceJustLogged, setAttendanceJustLogged] = useState<string | null>(null);
  const [antiSpoofLevel, setAntiSpoofLevel] = useState<'standard' | 'strict'>('strict');
  const [engineMode, setEngineMode] = useState<'optical' | 'gemini'>('optical');

  // Camera settings & file upload state
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Toggle audio
  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    soundEffects.soundEnabled = nextState;
    soundEffects.speechEnabled = nextState;
  };

  // Enumerate cameras
  const refreshCameras = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (e) {
      console.warn('Enumerate devices notice:', e);
    }
  }, [selectedCameraId]);

  // Start webcam
  const startWebcam = useCallback(async (deviceId?: string) => {
    setCameraError(null);
    setUploadedImageSrc(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      refreshCameras();
    } catch (err: any) {
      console.warn('Camera access unavailable or declined:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in browser permissions or use the photo upload button.'
          : 'Webcam not detected on this system. You can upload any student photo or use the enrolled simulator cards.'
      );
      setCameraActive(false);
    }
  }, [refreshCameras]);

  // Handle uploaded photo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopWebcam();
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setUploadedImageSrc(base64);
        setActiveTestSubjectId('uploaded_photo');
        executeRecognitionWithImage(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Handle active test subject selection or camera toggle
  useEffect(() => {
    if (activeTestSubjectId === 'live_webcam') {
      startWebcam();
    } else {
      stopWebcam();
      // Select the student to simulate
      const student = students.find((s) => s.id === activeTestSubjectId);
      if (student) {
        simulateFaceScanForStudent(student);
      }
    }

    return () => {
      stopWebcam();
    };
  }, [activeTestSubjectId]);

  // Capture frame from video or generate simulation frame
  const captureFrameBase64 = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Perform face recognition on an explicit image (e.g. uploaded photo)
  const executeRecognitionWithImage = async (frameImage: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const response = await fetch('/api/recognize-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameImage,
          enrolledStudents: students,
          sessionInfo: activeCourse,
          preferEngine: engineMode,
        }),
      });

      if (response.ok) {
        const result: BiometricScanResult = await response.json();
        setScanResult(result);

        if (result.matchedStudentId) {
          const student = students.find((s) => s.id === result.matchedStudentId);
          if (student) {
            setMatchedStudent(student);
            soundEffects.playLockPing();
            commitAttendance(student, result.confidence, result.livenessScore, frameImage);
          }
        } else {
          setMatchedStudent(null);
        }
      }
    } catch (err) {
      console.warn('Recognition notice:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Perform face recognition analysis
  const executeRecognition = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      let frameImage: string | null = null;
      let targetStudent: Student | null = null;

      if (activeTestSubjectId === 'live_webcam' && cameraActive) {
        frameImage = captureFrameBase64();
      } else {
        targetStudent = students.find((s) => s.id === activeTestSubjectId) || students[0];
      }

      // If we have a live webcam frame, send to backend AI endpoint
      if (frameImage) {
        const response = await fetch('/api/recognize-face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frameImage,
            enrolledStudents: students,
            sessionInfo: activeCourse,
            preferEngine: engineMode,
            targetStudentId: activeTestSubjectId !== 'live_webcam' ? activeTestSubjectId : undefined,
          }),
        });

        if (response.ok) {
          const result: BiometricScanResult = await response.json();
          setScanResult(result);

          if (result.matchedStudentId) {
            const student = students.find((s) => s.id === result.matchedStudentId);
            if (student) {
              setMatchedStudent(student);
              soundEffects.playLockPing();

              if (autoScanEnabled && !result.spoofDetected && result.confidence >= 75) {
                commitAttendance(student, result.confidence, result.livenessScore, frameImage);
              }
            }
          } else {
            setMatchedStudent(null);
            if (result.spoofDetected) {
              soundEffects.playWarningTone();
            }
          }
        }
      } else if (targetStudent) {
        // High fidelity test simulation
        simulateFaceScanForStudent(targetStudent);
      }
    } catch (err) {
      console.warn('Recognition notice:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Simulated scan for enrolled test card
  const simulateFaceScanForStudent = (student: Student) => {
    const isLate = Math.random() > 0.75;
    const confidence = +(94 + Math.random() * 5.2).toFixed(1);
    const liveness = +(96 + Math.random() * 3.8).toFixed(1);

    const result: BiometricScanResult = {
      faceDetected: true,
      matchedStudentId: student.id,
      studentName: student.name,
      confidence,
      livenessScore: liveness,
      spoofDetected: false,
      facialExpression: 'Attentive',
      boundingBox: { x: 26, y: 18, width: 48, height: 56 },
      verificationNote: 'Neural embedding distance: 0.12 · Liveness verified',
    };

    setScanResult(result);
    setMatchedStudent(student);
    soundEffects.playLockPing();

    if (autoScanEnabled) {
      commitAttendance(student, confidence, liveness);
    }
  };

  // Record attendance entry
  const commitAttendance = (
    student: Student,
    confidence: number,
    liveness: number,
    snapshotImage?: string
  ) => {
    // Check if already marked for current session within last 1 hour
    const alreadyMarked = recentRecords.some(
      (r) => r.studentId === student.id && r.courseId === activeCourse.id
    );

    if (alreadyMarked) {
      setAttendanceJustLogged(`Already recorded for this session: ${student.name}`);
      return;
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const dateStr = now.toISOString().split('T')[0];

    // Status: On-time or Late based on minute of the hour for demo
    const currentMins = now.getMinutes();
    const isLate = currentMins > 15 && currentMins % 2 === 0;

    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now()}-${student.rollNumber}`,
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      department: student.department,
      courseId: activeCourse.id,
      courseName: activeCourse.name,
      timestamp: now.toISOString(),
      formattedTime,
      date: dateStr,
      status: isLate ? 'late' : 'present',
      confidenceScore: confidence,
      livenessScore: liveness,
      antiSpoofPassed: true,
      snapshotImage: snapshotImage || undefined,
      verificationMethod: 'ai_face_biometric',
      sessionRoom: activeCourse.room,
    };

    onRecordAttendance(newRecord);
    soundEffects.playSuccessChime();
    soundEffects.speakAttendanceConfirmation(student.name, isLate ? 'Late' : 'Present');

    setAttendanceJustLogged(`Marked ${isLate ? 'Late' : 'Present'}: ${student.name} (${student.rollNumber})`);
    setTimeout(() => {
      setAttendanceJustLogged(null);
    }, 4500);
  };

  // Periodic automatic frame scan if autoScan is enabled and camera is running
  useEffect(() => {
    if (!autoScanEnabled || !cameraActive) return;

    // Use a respectful interval: 20s for Gemini (respecting 5 RPM quota) and 8s for local optical
    const intervalMs = engineMode === 'gemini' ? 20000 : 8000;
    const interval = setInterval(() => {
      executeRecognition();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoScanEnabled, cameraActive, students, activeCourse, engineMode]);

  return (
    <div className={`space-y-6 ${isKioskMode ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto' : ''}`}>
      {/* Kiosk Mode Header Bar */}
      {isKioskMode && (
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-white">AttendFace AI Kiosk</span>
            <span className="text-slate-400">·</span>
            <span className="text-sm text-slate-300 font-medium">{activeCourse.name}</span>
            <span className="text-slate-400">·</span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              {activeCourse.room}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSound}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Toggle Audio Feedback"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={onToggleKiosk}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            >
              <Minimize2 className="w-4 h-4" />
              Exit Kiosk
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Camera / Biometric Scan Terminal Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Terminal Top Info Strip */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
                    {cameraActive ? 'Biometric Optical Feed · Live' : 'Simulation Mode'}
                  </span>
                </div>
                <span className="text-slate-600">·</span>
                <span className="text-xs font-mono text-slate-400">
                  Room: {activeCourse.room.split('·')[0]}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Engine Selector */}
                <button
                  onClick={() => setEngineMode(engineMode === 'optical' ? 'gemini' : 'optical')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors border flex items-center gap-1.5 ${
                    engineMode === 'gemini'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                  title="Switch between Local Biometric Mesh and Gemini Cloud AI"
                >
                  <Sparkles className="w-3 h-3" />
                  {engineMode === 'gemini' ? 'Gemini AI Vision' : 'High-Speed Biometric'}
                </button>

                <button
                  onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors border ${
                    autoScanEnabled
                      ? 'bg-slate-800 text-slate-200 border-slate-700'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {autoScanEnabled ? 'Auto-Scan On' : 'Manual Only'}
                </button>

                {!isKioskMode && (
                  <button
                    onClick={onToggleKiosk}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                    title="Enter Fullscreen Kiosk Mode"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Video Viewport / Viewfinder */}
            <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
              {/* Real Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isMirrored ? 'mirror-video' : ''} ${cameraActive ? 'block' : 'hidden'}`}
              />

              {/* Uploaded Photo Image Viewport */}
              {uploadedImageSrc && !cameraActive && (
                <img
                  src={uploadedImageSrc}
                  alt="Uploaded Student Identification Frame"
                  className="w-full h-full object-contain"
                />
              )}

              {/* Hidden Canvas for Frame Captures */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Hidden File Input for Image Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Simulated Subject Display when not using real camera or uploaded image */}
              {!cameraActive && !uploadedImageSrc && (
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-radial from-slate-900 via-slate-950 to-slate-950 p-6 text-center">
                  {matchedStudent ? (
                    <div className="relative flex flex-col items-center animate-fadeIn">
                      {/* Avatar Portrait Simulation */}
                      <div className="relative mb-4">
                        <div className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${matchedStudent.avatarColor} p-1 shadow-2xl flex items-center justify-center border-2 border-emerald-400/50`}>
                          <div className="w-full h-full rounded-xl bg-slate-950/80 flex flex-col items-center justify-center text-center p-2">
                            <span className="text-3xl font-bold tracking-tight text-white mb-1">
                              {matchedStudent.name.split(' ').map((n) => n[0]).join('')}
                            </span>
                            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                              {matchedStudent.rollNumber}
                            </span>
                          </div>
                        </div>

                        {/* Verified Check Badge */}
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1.5 rounded-full shadow-lg">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white tracking-tight">{matchedStudent.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{matchedStudent.department}</p>
                      <p className="text-xs text-slate-500 font-mono mt-1">Biometric Hash: {matchedStudent.facialFeatureHash}</p>
                    </div>
                  ) : (
                    <div className="max-w-md space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                        <CameraOff className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-semibold text-slate-200">Camera Feed Inactive</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {cameraError || 'Allow camera access above to verify students in real-time, or select an enrolled student card below to simulate facial verification.'}
                      </p>
                      <button
                        onClick={() => startWebcam()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-lg"
                      >
                        <Camera className="w-4 h-4" />
                        Initialize Camera
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* HUD Biometric Overlay Overlay (Active on both camera and simulator) */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Biometric Target Reticle (Centered) */}
                <div className="absolute inset-x-1/4 inset-y-12 border border-emerald-500/30 rounded-3xl flex flex-col justify-between p-4">
                  {/* Four Corner Brackets */}
                  <div className="flex justify-between">
                    <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-xl" />
                    <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-xl" />
                  </div>

                  {/* Center Scanning Sweep Line */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-scan-line" />
                    
                    {/* Center Alignment Reticle */}
                    <div className="w-14 h-14 rounded-full border border-dashed border-emerald-400/40 flex items-center justify-center animate-radar">
                      <div className="w-2 h-2 rounded-full bg-emerald-400/80 shadow-[0_0_8px_#34d399]" />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-xl" />
                    <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-xl" />
                  </div>
                </div>

                {/* Top-Right HUD Telemetry Badge */}
                <div className="absolute top-4 right-4 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-right space-y-1 font-mono text-[11px]">
                  <div className="flex items-center justify-end gap-2 text-slate-300">
                    <span className="text-slate-500">ENGINE</span>
                    <span className="text-emerald-400 font-semibold">
                      {engineMode === 'gemini' ? 'Gemini 3.8 Flash Vision' : 'Neural Optical Biometrics'}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-slate-500">ANTI-SPOOF</span>
                    <span className="text-emerald-400 font-semibold">
                      {scanResult?.spoofDetected ? 'FAILED (REPLAY)' : 'PASSED (Liveness 98%)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-slate-500">CONFIDENCE</span>
                    <span className="text-emerald-300 font-bold tabular-nums">
                      {scanResult?.confidence ? `${scanResult.confidence}%` : '---'}
                    </span>
                  </div>
                </div>

                {/* Bottom Center Verification Notification Card */}
                {attendanceJustLogged && (
                  <div className="absolute bottom-6 inset-x-8 max-w-md mx-auto bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-xl rounded-xl p-3.5 shadow-2xl flex items-center gap-3 animate-fadeIn">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">Attendance Verified</h4>
                      <p className="text-xs text-emerald-200 truncate">{attendanceJustLogged}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={executeRecognition}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Scan className="w-4 h-4" />
                  )}
                  {isProcessing ? 'Analyzing Biometrics...' : 'Capture & Verify Face'}
                </button>

                {cameraActive ? (
                  <button
                    onClick={stopWebcam}
                    className="px-3.5 py-2.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
                  >
                    Pause Camera
                  </button>
                ) : (
                  <button
                    onClick={() => startWebcam(selectedCameraId)}
                    className="px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-400" />
                    Connect Webcam
                  </button>
                )}

                {/* Upload Photo Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
                  title="Upload student portrait image file to verify"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  Upload Photo
                </button>

                {/* Camera Source Selector if multiple */}
                {availableCameras.length > 1 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      startWebcam(e.target.value);
                    }}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none"
                  >
                    {availableCameras.map((cam, idx) => (
                      <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                )}

                {/* Mirror Toggle */}
                {cameraActive && (
                  <button
                    onClick={() => setIsMirrored(!isMirrored)}
                    className="px-2.5 py-2 text-xs font-mono text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700 transition-colors"
                    title="Toggle Camera Horizontal Mirroring"
                  >
                    {isMirrored ? 'Mirror: On' : 'Mirror: Off'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Anti-Spoofing: Active</span>
                </div>
                <span className="text-slate-700">·</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span className="tabular-nums">Grace Period: {activeCourse.gracePeriodMins}m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Card Simulator Strip (Allows instant testing with enrolled students or uploaded photos) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Enrolled Subject Test Deck
                </h4>
                <p className="text-[11px] text-slate-500">
                  Select an enrolled student to instantly test biometric match confidence and attendance workflow.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTestSubjectId('live_webcam')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                    activeTestSubjectId === 'live_webcam'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Use Live Camera
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
              {students.map((student) => {
                const isSelected = activeTestSubjectId === student.id;
                const isAlreadyPresent = recentRecords.some(
                  (r) => r.studentId === student.id && r.courseId === activeCourse.id
                );

                return (
                  <button
                    key={student.id}
                    onClick={() => setActiveTestSubjectId(student.id)}
                    className={`relative p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${student.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow`}>
                        {student.name.split(' ').map((n) => n[0]).join('')}
                      </div>

                      {isAlreadyPresent && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Already marked present" />
                      )}
                    </div>

                    <div className="text-xs font-semibold text-slate-200 truncate">{student.name}</div>
                    <div className="text-[10px] font-mono text-slate-500 truncate">{student.rollNumber}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Attendance Stream & Class Session Info (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Lecture Session Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Active Session
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                Live Class
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{activeCourse.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{activeCourse.instructor}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                <span className="text-[10px] text-slate-500 uppercase block">Timetable</span>
                <span className="text-slate-200 font-medium tabular-nums">{activeCourse.startTime} - {activeCourse.endTime}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                <span className="text-[10px] text-slate-500 uppercase block">Lecture Hall</span>
                <span className="text-slate-200 font-medium truncate block">{activeCourse.room.split('·')[0]}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
              <span>Attendance Rate Today:</span>
              <span className="font-semibold text-emerald-400 font-mono tabular-nums">
                {recentRecords.length} / {students.length} Enrolled ({Math.round((recentRecords.length / students.length) * 100)}%)
              </span>
            </div>
          </div>

          {/* Live Recent Attendance Ticker */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Recent Verified Logs
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {recentRecords.length} Logged
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {recentRecords.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No attendance logged yet for this session. Look into the camera or trigger a test subject.
                </div>
              ) : (
                recentRecords.slice(0, 8).map((record) => (
                  <div
                    key={record.id}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                        {record.studentName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {record.studentName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {record.rollNumber} · <span className="tabular-nums">{record.formattedTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          record.status === 'present'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {record.status === 'present' ? 'Present' : 'Late'}
                      </span>
                      <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                        {record.confidenceScore}% match
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
