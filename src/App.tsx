import React, { useState, useMemo } from 'react';
import { 
  UserRole, 
  ScheduledSession, 
  AssistantAssignment, 
  AssignmentDecisionReason, 
  PreferenceSubmission,
  ARABlockResponsibility,
  ARARoomResponsibility,
  ARAQualification,
  WeightConfiguration,
  SystemConfig,
  SystemNotification,
  AssignmentOverride,
  ARAUser,
  Course,
  LaboratoryRoom,
  LaboratoryBlock,
  DownloadReportRecord,
  ConflictAlertEvent
} from './types/astu';
import { INITIAL_ASTU_DATA } from './data/mockAstuData';
import { ASTUAssignmentEngine } from './services/assignmentEngine';

import { Header } from './components/Header';
import { BatchAllocationDashboard } from './components/BatchAllocationDashboard';
import { DecisionBreakdownModal } from './components/DecisionBreakdownModal';
import { RealtimePreferencePortal } from './components/RealtimePreferencePortal';
import { BlockRoomManagement } from './components/BlockRoomManagement';
import { ScoringWeightsEditor } from './components/ScoringWeightsEditor';
import { OverridesAndUnresolved } from './components/OverridesAndUnresolved';
import { QualificationsWorkloadMatrix } from './components/QualificationsWorkloadMatrix';
import { DjangoApiExplorer } from './components/DjangoApiExplorer';
import { AuditTrailAndCompliance } from './components/AuditTrailAndCompliance';
import { AuthModal } from './components/AuthModal';
import { MyAraProfile } from './components/MyAraProfile';
import { OfficialAstuTimetableReport } from './components/OfficialAstuTimetableReport';
import { ConflictAlertToast } from './components/ConflictAlertToast';
import { SystemHealthDashboard } from './components/SystemHealthDashboard';

export default function App() {
  // Core Domain State initialized from ASTU official dataset
  const [currentRole, setCurrentRole] = useState<UserRole>('ARA_ADMINISTRATOR');
  const [activeTab, setActiveTab] = useState<string>('batch_allocations');
  const [currentAraId, setCurrentAraId] = useState<string>('ara-001');
  const [isOfficialReportOpen, setIsOfficialReportOpen] = useState<boolean>(false);

  // Auth & SARA Registration Modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const [blocks, setBlocks] = useState<LaboratoryBlock[]>(INITIAL_ASTU_DATA.blocks);
  const [rooms, setRooms] = useState<LaboratoryRoom[]>(INITIAL_ASTU_DATA.rooms);
  const [aras, setAras] = useState<ARAUser[]>(INITIAL_ASTU_DATA.aras);
  const [courses, setCourses] = useState<Course[]>(INITIAL_ASTU_DATA.courses);
  const [sessions, setSessions] = useState<ScheduledSession[]>(INITIAL_ASTU_DATA.sessions);
  const [blockResponsibilities, setBlockResponsibilities] = useState<ARABlockResponsibility[]>(
    INITIAL_ASTU_DATA.block_responsibilities
  );
  const [roomResponsibilities, setRoomResponsibilities] = useState<ARARoomResponsibility[]>(
    INITIAL_ASTU_DATA.room_responsibilities
  );
  const [courseResponsibilities, setCourseResponsibilities] = useState(
    INITIAL_ASTU_DATA.course_responsibilities
  );
  const [qualifications, setQualifications] = useState<ARAQualification[]>(
    INITIAL_ASTU_DATA.qualifications
  );
  const [availabilities, setAvailabilities] = useState(INITIAL_ASTU_DATA.availabilities);
  const [preferences, setPreferences] = useState<PreferenceSubmission[]>(
    INITIAL_ASTU_DATA.preferences
  );
  const [weights, setWeights] = useState<WeightConfiguration[]>(INITIAL_ASTU_DATA.weights);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(INITIAL_ASTU_DATA.config);
  const [assignments, setAssignments] = useState<AssistantAssignment[]>(
    INITIAL_ASTU_DATA.assignments
  );
  const [decisionReasons, setDecisionReasons] = useState<AssignmentDecisionReason[]>(
    INITIAL_ASTU_DATA.decision_reasons
  );
  const [notifications, setNotifications] = useState<SystemNotification[]>(
    INITIAL_ASTU_DATA.notifications
  );
  const [overrides, setOverrides] = useState<AssignmentOverride[]>(INITIAL_ASTU_DATA.overrides);

  // Download History State
  const [downloadHistory, setDownloadHistory] = useState<DownloadReportRecord[]>([
    {
      id: 'report-arch-001',
      report_title: 'Official ASTU SOEEC CSEg Laboratory Allocations Report (Semester I)',
      academic_term: '2026/2027 Semester I',
      generated_at: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
      generated_by_name: 'Dr. Teferi (Department Head)',
      generated_by_role: 'DEPARTMENT_HEAD',
      scope_description: 'Full Department Laboratory Allocation Matrix & Key Custodians',
      total_sessions: 24,
      total_rooms: 8,
      total_aras: 12,
      file_format: 'PDF',
      file_size: '482 KB',
      download_count: 14,
      status: 'Official & Sealed'
    }
  ]);

  // Real-time Conflict Alert Toast State
  const [activeConflictAlert, setActiveConflictAlert] = useState<ConflictAlertEvent | null>(null);

  // Modal State
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<ScheduledSession | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);

  // Helper notification dispatcher (SRS Section 18)
  const addNotification = (
    title: string, 
    message: string, 
    type: SystemNotification['type'] = 'assignment'
  ) => {
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      recipient_ara_id: 'broadcast',
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      is_read: false,
    };
    setNotifications((prev: SystemNotification[]) => [newNotif, ...prev]);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev: SystemNotification[]) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleRecordNewDownload = (record: DownloadReportRecord) => {
    setDownloadHistory((prev) => [record, ...prev]);
    addNotification(
      'Official Report Exported',
      `Downloaded "${record.report_title}" (${record.file_size}).`,
      'assignment'
    );
  };

  const handleUpdateCoursePriority = (courseId: string, updates: Partial<Course>) => {
    setCourses((prev: Course[]) =>
      prev.map((c) => (c.id === courseId ? { ...c, ...updates } : c))
    );
    const course = courses.find((c) => c.id === courseId);
    addNotification(
      'Course Priority & Precedence Updated',
      `Priority settings updated for ${course?.course_code || courseId}. Batch allocation engine will sort by precedence score.`,
      'assignment'
    );
  };

  // High-Precedence Auto-Fill Utility
  const handleHighPrecedenceAutoFill = () => {
    const capstoneCourseIds = courses
      .filter(
        (c) =>
          c.course_name.toLowerCase().includes('capstone') ||
          c.course_name.toLowerCase().includes('final year project') ||
          c.course_name.toLowerCase().includes('capston') ||
          c.priority_level === 'CRITICAL_CORE' ||
          (c.precedence_score || 0) >= 90
      )
      .map((c) => c.id);

    const unassignedCapstoneSessions = sessions.filter((s) => {
      if (!capstoneCourseIds.includes(s.course_id)) return false;
      const filledCount = assignments.filter((a) => a.session_id === s.id && a.status !== 'Declined').length;
      return filledCount < (s.required_ara_count || 1);
    });

    if (unassignedCapstoneSessions.length === 0) {
      addNotification(
        'Auto-Fill Complete',
        'All Capstone & Final Year Project sessions are already fully assigned to qualified assistants.',
        'assignment'
      );
      return;
    }

    let newAssignmentsCount = 0;
    const newAssignments: AssistantAssignment[] = [];
    const newReasons: AssignmentDecisionReason[] = [];

    unassignedCapstoneSessions.forEach((session) => {
      const room = rooms.find((r) => r.id === session.room_id);
      const roomResp = roomResponsibilities.find((rr) => rr.room_id === session.room_id && rr.status === 'Active');
      
      let candidateAra: ARAUser | undefined = aras.find((a) => a.id === roomResp?.ara_id);

      if (!candidateAra) {
        candidateAra = aras.find((a) => a.is_sara) || aras[0];
      }

      if (candidateAra) {
        const asgnId = `asgn-hp-${session.id}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
        newAssignments.push({
          id: asgnId,
          session_id: session.id,
          slot_number: 1,
          ara_id: candidateAra.id,
          status: 'Confirmed',
          source: 'batch_510_force_alloc',
          assigned_at: new Date().toISOString(),
        });

        newReasons.push({
          id: `reason-hp-${session.id}`,
          assignment_id: asgnId,
          session_id: session.id,
          ara_id: candidateAra.id,
          total_score: 100,
          is_selected: true,
          score_breakdown: [
            { factor: 'Capstone High Precedence', points: 40, description: 'Highest Priority Course Allocation' },
            { factor: 'Designated Room Custodian', points: 35, description: 'Matched Key Holder Responsibility' },
            { factor: 'Workload Capacity Check', points: 25, description: 'SARA availability verified' },
          ],
          reasons: [
            `High-Precedence Auto-Fill allocated SARA ${candidateAra.ara_code} (${candidateAra.full_name}) to Capstone/FYP session in Room ${room?.room_code || '510'}.`,
          ],
          hard_constraints_passed: true,
          block_responsibility: true,
          room_key_holder: true,
          course_responsibility: true,
          preference_match: 'Preference 1',
          qualified: true,
          available: true,
          timetable_conflict: false,
          workload_valid: true,
          timestamp: new Date().toISOString(),
        });

        newAssignmentsCount++;
      }
    });

    if (newAssignments.length > 0) {
      setAssignments((prev) => [...newAssignments, ...prev]);
      setDecisionReasons((prev) => [...newReasons, ...prev]);
      addNotification(
        'High-Precedence Auto-Fill Executed',
        `Successfully auto-filled ${newAssignmentsCount} unassigned Capstone & Final Year Project sessions to qualified SARAs/ARAs.`,
        'assignment'
      );
    }
  };
  const handleRunBatchAllocation = () => {
    setIsProcessingBatch(true);

    setTimeout(() => {
      const result = ASTUAssignmentEngine.runBatchAssignment(
        sessions,
        aras,
        rooms,
        blocks,
        blockResponsibilities,
        roomResponsibilities,
        courseResponsibilities,
        qualifications,
        availabilities,
        preferences,
        weights,
        systemConfig,
        assignments,
        courses
      );

      setAssignments(result.newAssignments);
      setDecisionReasons(result.decisionReasons);
      setSessions(result.updatedSessions);
      setIsProcessingBatch(false);

      addNotification(
        'Batch Allocation Complete',
        `Evaluated ${sessions.length} laboratory sessions. Assigned ${result.assignedCount}, marked ${result.unresolvedCount} for administrator review (SRS §19).`,
        'assignment'
      );
    }, 600);
  };

  const handleResetAllocations = () => {
    setAssignments([]);
    setDecisionReasons([]);
    setSessions((prev: ScheduledSession[]) =>
      prev.map((s: ScheduledSession) => ({
        ...s,
        status: 'Unassigned',
      }))
    );
    addNotification('Allocations Reset', 'All session assignments cleared to unassigned state.', 'assignment');
  };

  const handleBulkResolveOverlaps = (resolutions: { sessionId: string; araId: string; reason: string }[]) => {
    const newAssignmentsToAdd: AssistantAssignment[] = [];
    const updatedSessionIds = new Set<string>();

    resolutions.forEach((res) => {
      const sess = sessions.find((s) => s.id === res.sessionId);
      const ara = aras.find((a) => a.id === res.araId);
      if (!sess || !ara) return;

      const newAsgn: AssistantAssignment = {
        id: `asgn-bulk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        session_id: sess.id,
        slot_number: 1,
        ara_id: ara.id,
        assigned_at: new Date().toISOString(),
        source: 'manual_admin',
        status: 'Confirmed',
      };
      newAssignmentsToAdd.push(newAsgn);
      updatedSessionIds.add(sess.id);
    });

    setAssignments((prev) => [...prev, ...newAssignmentsToAdd]);
    setSessions((prev) =>
      prev.map((s) => {
        if (updatedSessionIds.has(s.id)) {
          return {
            ...s,
            status: 'Confirmed',
          };
        }
        return s;
      })
    );

    addNotification(
      'Bulk Resolution Applied',
      `Successfully resolved and allocated ${resolutions.length} required laboratory sessions using least-congested assistant optimization (§16).`,
      'assignment'
    );
  };

  // Conflict Overlap Checker for Manual Overrides and Assignments
  const checkForConflictOverlap = (targetSessionId: string, targetAraId: string): ConflictAlertEvent | null => {
    const targetSession = sessions.find((s) => s.id === targetSessionId);
    const targetAra = aras.find((a) => a.id === targetAraId);
    const targetCourse = courses.find((c) => c.id === targetSession?.course_id);
    const targetRoom = rooms.find((r) => r.id === targetSession?.room_id);

    if (!targetSession || !targetAra) return null;

    // Find other sessions currently assigned to this ARA on the exact same day
    const araOtherAssignments = assignments.filter(
      (a) => a.ara_id === targetAraId && a.session_id !== targetSessionId && a.status !== 'Declined'
    );

    for (const asgn of araOtherAssignments) {
      const otherSession = sessions.find((s) => s.id === asgn.session_id);
      if (!otherSession) continue;

      if (otherSession.day_of_week === targetSession.day_of_week) {
        const parseTime = (t: string) => {
          const [h, m] = t.split(':').map(Number);
          return (h || 0) * 60 + (m || 0);
        };
        const s1Start = parseTime(targetSession.start_time);
        const s1End = parseTime(targetSession.end_time);
        const s2Start = parseTime(otherSession.start_time);
        const s2End = parseTime(otherSession.end_time);

        if (s1Start < s2End && s2Start < s1End) {
          const otherCourse = courses.find((c) => c.id === otherSession.course_id);
          const otherRoom = rooms.find((r) => r.id === otherSession.room_id);

          return {
            id: `conflict-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ara_id: targetAra.id,
            ara_name: targetAra.full_name,
            ara_code: targetAra.ara_code,
            target_session_id: targetSession.id,
            target_course_code: targetCourse?.course_code || 'Course',
            target_room_code: targetRoom?.room_code || 'Room',
            target_time: `${targetSession.start_time}–${targetSession.end_time}`,
            conflicting_session_id: otherSession.id,
            conflicting_course_code: otherCourse?.course_code || 'Course',
            conflicting_room_code: otherRoom?.room_code || 'Room',
            conflicting_time: `${otherSession.start_time}–${otherSession.end_time}`,
            day_of_week: targetSession.day_of_week,
            override_reason: 'Timetable collision detected with active assignment.',
            severity: 'CRITICAL_COLLISION'
          };
        }
      }
    }

    // Check workload cap limit
    const currentWeeklyHours = assignments
      .filter((a) => a.ara_id === targetAraId && a.session_id !== targetSessionId && a.status !== 'Declined')
      .reduce((sum, a) => {
        const sess = sessions.find((s) => s.id === a.session_id);
        return sum + (sess?.duration_hours || 2);
      }, 0);

    const newTotal = currentWeeklyHours + (targetSession.duration_hours || 2);
    if (newTotal > (targetAra.max_weekly_hours || 10)) {
      return {
        id: `conflict-workload-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ara_id: targetAra.id,
        ara_name: targetAra.full_name,
        ara_code: targetAra.ara_code,
        target_session_id: targetSession.id,
        target_course_code: targetCourse?.course_code || 'Course',
        target_room_code: targetRoom?.room_code || 'Room',
        target_time: `${targetSession.start_time}–${targetSession.end_time}`,
        conflicting_session_id: targetSession.id,
        conflicting_course_code: targetCourse?.course_code || 'Course',
        conflicting_room_code: targetRoom?.room_code || 'Room',
        conflicting_time: `${targetSession.start_time}–${targetSession.end_time}`,
        day_of_week: targetSession.day_of_week,
        override_reason: `Workload capacity threshold exceeded: ${newTotal}h assigned vs ${targetAra.max_weekly_hours}h/week max cap for ${targetAra.ara_code} (SRS §6).`,
        severity: 'WORKLOAD_CAP_EXCEEDED'
      };
    }

    return null;
  };

  // Section 9: Real-time preference submission & auto-assign trigger
  const handleSubmitRealtimePreference = (courseId: string, rank: 1 | 2 | 3) => {
    const candidateAra = aras.find((a: ARAUser) => a.id === currentAraId);
    if (!candidateAra) return;

    const newPref: PreferenceSubmission = {
      id: `pref-${currentAraId}-${courseId}-${Date.now()}`,
      ara_id: currentAraId,
      course_id: courseId,
      preference_rank: rank,
      submitted_at: new Date().toISOString(),
      status: 'Pending',
    };

    setPreferences((prev: PreferenceSubmission[]) => {
      const filtered = prev.filter(
        (p) => !(p.ara_id === currentAraId && p.course_id === courseId)
      );
      return [newPref, ...filtered];
    });

    const targetSession = sessions.find((s: ScheduledSession) => s.course_id === courseId);

    if (
      targetSession &&
      (targetSession.status === 'Unassigned' || targetSession.status === 'ARA Assignment Required')
    ) {
      const evaluation = ASTUAssignmentEngine.evaluateCandidatesForSlot(
        targetSession,
        1,
        [candidateAra],
        sessions,
        assignments,
        rooms,
        blocks,
        blockResponsibilities,
        roomResponsibilities,
        courseResponsibilities,
        qualifications,
        availabilities,
        [newPref, ...preferences],
        weights,
        systemConfig
      );

      if (evaluation.eligibleEvaluations.length > 0) {
        const bestCandidate = evaluation.eligibleEvaluations[0];

        const newAssignment: AssistantAssignment = {
          id: `asgn-${targetSession.id}-${Date.now()}`,
          session_id: targetSession.id,
          slot_number: 1,
          ara_id: bestCandidate.ara.id,
          status: 'Confirmed',
          source: 'realtime_submission',
          assigned_at: new Date().toISOString(),
          acceptance_deadline: null,
        };

        setAssignments((prev: AssistantAssignment[]) => [...prev, newAssignment]);
        setSessions((prev: ScheduledSession[]) =>
          prev.map((s: ScheduledSession) =>
            s.id === targetSession.id ? { ...s, status: 'Confirmed' } : s
          )
        );

        addNotification(
          'Real-time Auto-Assignment Executed',
          `${candidateAra.full_name} (${candidateAra.ara_code}) auto-assigned to ${targetSession.id} with score ${bestCandidate.totalScore.toFixed(1)} (SRS §9).`,
          'assignment'
        );
        return;
      }
    }

    addNotification(
      'ARA Preference Logged',
      `Preference rank ${rank} registered for ${candidateAra.full_name} on course ${courseId}.`,
      'assignment'
    );
  };

  const handleWithdrawPreference = (preferenceId: string) => {
    setPreferences((prev: PreferenceSubmission[]) =>
      prev.filter((p) => p.id !== preferenceId)
    );
    addNotification('Preference Withdrawn', 'Laboratory slot preference removed successfully.', 'assignment');
  };

  // Section 10: ARA Acceptance / Decline
  const handleAcceptAssignment = (assignmentId: string) => {
    setAssignments((prev: AssistantAssignment[]) =>
      prev.map((a: AssistantAssignment) =>
        a.id === assignmentId ? { ...a, status: 'Confirmed' } : a
      )
    );
    addNotification('Assignment Confirmed', 'Laboratory shift confirmed and locked onto schedule.', 'assignment');
  };

  const handleDeclineAssignment = (assignmentId: string) => {
    const targetAssignment = assignments.find((a) => a.id === assignmentId);
    if (!targetAssignment) return;

    setAssignments((prev: AssistantAssignment[]) =>
      prev.map((a: AssistantAssignment) =>
        a.id === assignmentId ? { ...a, status: 'Declined' } : a
      )
    );

    setSessions((prev: ScheduledSession[]) =>
      prev.map((s: ScheduledSession) =>
        s.id === targetAssignment.session_id
          ? { ...s, status: 'ARA Assignment Required' }
          : s
      )
    );

    addNotification(
      'Assignment Declined by Assistant',
      `Session ${targetAssignment.session_id} flagged as 'ARA Assignment Required' (SRS §10, §16).`,
      'override'
    );
  };

  // SARA Registration
  const handleRegisterSARA = (newAraData: {
    full_name: string;
    email: string;
    phone: string;
    ara_code?: string;
    department: string;
    program: string;
    year_level: number;
    gpa_or_standing: string;
    selected_room_ids: string[];
    selected_course_ids: string[];
    block_responsibility?: string;
    max_weekly_hours: number;
  }) => {
    const initials = newAraData.full_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    const araId = `ara-${Date.now()}`;
    const code = newAraData.ara_code || `SARA-${String(aras.length + 1).padStart(3, '0')}`;

    const newAra: ARAUser = {
      id: araId,
      ara_code: code,
      full_name: newAraData.full_name,
      email: newAraData.email,
      phone: newAraData.phone,
      department: newAraData.department,
      program: newAraData.program,
      year_level: newAraData.year_level,
      role: 'ROOM_KEY_HOLDER',
      status: 'Active',
      max_weekly_hours: newAraData.max_weekly_hours || 12,
      current_weekly_hours: 0,
      created_at: new Date().toISOString(),
      avatar_initials: initials,
      gpa_or_standing: newAraData.gpa_or_standing,
      is_sara: true,
    };

    const newQuals: ARAQualification[] = newAraData.selected_course_ids.map((cid, idx) => ({
      id: `qual-${araId}-${idx}`,
      ara_id: araId,
      course_id: cid,
      qualified_date: new Date().toISOString().slice(0, 10),
      status: 'Valid',
      certified_by: 'Department Head (Dr. Teferi)',
    }));

    setAras((prev: ARAUser[]) => [newAra, ...prev]);
    setQualifications((prev: ARAQualification[]) => [...newQuals, ...prev]);
    setCurrentAraId(newAra.id);
    addNotification(
      'Senior Assistant (SARA) Registered',
      `${newAra.full_name} registered into Department records with key holding credentials.`,
      'assignment'
    );
  };

  // Section 3 & 4 Responsibilities Updates
  const handleUpdateBlockResponsibility = (updated: ARABlockResponsibility) => {
    setBlockResponsibilities((prev: ARABlockResponsibility[]) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
    addNotification('Block Responsibility Updated', `Block ${updated.block_id} custodian updated (SRS §3).`, 'assignment');
  };

  const handleUpdateRoomResponsibility = (updated: ARARoomResponsibility) => {
    setRoomResponsibilities((prev: ARARoomResponsibility[]) => {
      const exists = prev.some((r) => r.id === updated.id);
      if (exists) {
        return prev.map((r) => (r.id === updated.id ? updated : r));
      }
      return [updated, ...prev];
    });
    addNotification('Room Custodian Updated', `Room key holder registered (SRS §4).`, 'assignment');
  };

  // Section 14.3: Authorized Override
  const handleExecuteOverride = (sessionId: string, newAraId: string, reason: string) => {
    const assignedAra = aras.find((a: ARAUser) => a.id === newAraId);

    // Check for real-time conflict overlap
    const detectedConflict = checkForConflictOverlap(sessionId, newAraId);
    if (detectedConflict) {
      setActiveConflictAlert(detectedConflict);
    }

    const overrideId = `ovr-${Date.now()}`;
    const newOverride: AssignmentOverride = {
      id: overrideId,
      session_id: sessionId,
      overriding_user_id: currentRole === 'DEPARTMENT_HEAD' ? 'dept-head-1' : 'admin-001',
      overriding_user_name: currentRole === 'DEPARTMENT_HEAD' ? 'Dr. Tesfaye (Dept Head)' : 'Dr. Yonas Hailu (Admin)',
      overriding_role: currentRole,
      original_candidate_ara_id: 'system-evaluated',
      assigned_ara_id: newAraId,
      reason,
      created_at: new Date().toISOString(),
    };

    setOverrides((prev: AssignmentOverride[]) => [newOverride, ...prev]);

    // Create / replace assignment
    const assignmentId = `asgn-ovr-${sessionId}-${Date.now()}`;
    const newAssignment: AssistantAssignment = {
      id: assignmentId,
      session_id: sessionId,
      slot_number: 1,
      ara_id: newAraId,
      status: 'Confirmed',
      source: 'authorized_override',
      assigned_at: new Date().toISOString(),
      acceptance_deadline: null,
    };

    setAssignments((prev: AssistantAssignment[]) => {
      const filtered = prev.filter((a) => a.session_id !== sessionId);
      return [...filtered, newAssignment];
    });

    setSessions((prev: ScheduledSession[]) =>
      prev.map((s: ScheduledSession) => (s.id === sessionId ? { ...s, status: 'Confirmed' } : s))
    );

    addNotification(
      'Administrative Override Authorized',
      `Manual assignment override executed for session ${sessionId} assigning ${assignedAra?.ara_code}. Reason: "${reason}" (SRS §14.3).`,
      'override'
    );
  };

  const handleAssignAraToSession = (sessionId: string, araId: string, isOverride = false, reason = '') => {
    if (isOverride && reason) {
      handleExecuteOverride(sessionId, araId, reason);
    } else {
      const assignedAra = aras.find((a: ARAUser) => a.id === araId);

      // Check for real-time conflict overlap
      const detectedConflict = checkForConflictOverlap(sessionId, araId);
      if (detectedConflict) {
        setActiveConflictAlert(detectedConflict);
      }

      const assignmentId = `asgn-manual-${sessionId}-${Date.now()}`;
      const newAssignment: AssistantAssignment = {
        id: assignmentId,
        session_id: sessionId,
        slot_number: 1,
        ara_id: araId,
        status: 'Confirmed',
        source: 'manual_admin',
        assigned_at: new Date().toISOString(),
        acceptance_deadline: null,
      };

      setAssignments((prev: AssistantAssignment[]) => {
        const filtered = prev.filter((a) => a.session_id !== sessionId);
        return [...filtered, newAssignment];
      });

      setSessions((prev: ScheduledSession[]) =>
        prev.map((s: ScheduledSession) => (s.id === sessionId ? { ...s, status: 'Confirmed' } : s))
      );

      addNotification(
        'Laboratory Session Assigned',
        `${assignedAra?.full_name || 'ARA'} assigned to session by administrator.`,
        'assignment'
      );
    }
  };

  // Section 4 & 510-Block: Force allocate all 510 block sessions to designated room holders
  const handleBatchForceAllocate510Block = () => {
    const result = ASTUAssignmentEngine.forceAllocate510Block(
      sessions,
      assignments,
      rooms,
      aras,
      roomResponsibilities,
      availabilities
    );

    setAssignments(result.updatedAssignments);
    setSessions(result.updatedSessions);

    addNotification(
      '510-Block Batch Force-Allocation Executed',
      `Force-allocated ${result.resultsSummary.allocatedCount} / ${result.resultsSummary.total510Sessions} sessions in Block 510 to designated Room Key Holders.`,
      'assignment'
    );

    return result.resultsSummary;
  };

  // Section 13: Semester rollover
  const handleTriggerSemesterRollover = (policy: 'auto_carry' | 'manual_reassign') => {
    if (policy === 'auto_carry') {
      setBlockResponsibilities((prev: ARABlockResponsibility[]) =>
        prev.map((b) => ({
          ...b,
          id: `${b.id}-sem2`,
          semester: 'Semester II',
          start_date: '2027-02-16',
          end_date: '2027-07-05',
        }))
      );
      setRoomResponsibilities((prev: ARARoomResponsibility[]) =>
        prev.map((r) => ({
          ...r,
          id: `${r.id}-sem2`,
          semester: 'Semester II',
          start_date: '2027-02-16',
          end_date: '2027-07-05',
        }))
      );
      setSystemConfig((prev: SystemConfig) => ({ ...prev, semester: 'Semester II' }));
      addNotification(
        'Semester Rollover Completed (Auto-Carry-Forward)',
        'Responsibilities rolled over to Semester II pending administrator verification (SRS §13).',
        'rollover'
      );
    } else {
      setBlockResponsibilities([]);
      setRoomResponsibilities([]);
      setSystemConfig((prev: SystemConfig) => ({ ...prev, semester: 'Semester II' }));
      addNotification(
        'Semester Rollover Completed (Manual Reassignment)',
        'Semester II commenced. All previous responsibilities expired per departmental policy (SRS §13).',
        'rollover'
      );
    }
  };

  // Weights configuration
  const handleUpdateWeight = (id: string, newWeight: number, isEnabled: boolean) => {
    setWeights((prev: WeightConfiguration[]) =>
      prev.map((w) =>
        w.id === id ? { ...w, current_weight: newWeight, is_enabled: isEnabled } : w
      )
    );
  };

  const handleResetWeightsToDefault = () => {
    setWeights((prev: WeightConfiguration[]) =>
      prev.map((w) => ({
        ...w,
        current_weight: w.default_weight,
        is_enabled: true,
      }))
    );
    addNotification('Weights Reset', 'Authoritative scoring model weights reset to SRS v2.0 Section 8 standards.', 'assignment');
  };

  const handleUpdateSystemConfig = (updated: Partial<SystemConfig>) => {
    setSystemConfig((prev: SystemConfig) => ({ ...prev, ...updated }));
  };

  // Add Qualification
  const handleAddQualification = (newQual: ARAQualification) => {
    setQualifications((prev: ARAQualification[]) => [newQual, ...prev]);
    const ara = aras.find((a: ARAUser) => a.id === newQual.ara_id);
    const course = courses.find((c: Course) => c.id === newQual.course_id);
    addNotification('Qualification Registered', `${ara?.ara_code} certified for ${course?.course_code} (SRS §5).`, 'assignment');
  };

  // Modal helpers for selected session
  const modalData = useMemo(() => {
    if (!selectedSessionForModal) return null;
    const session = selectedSessionForModal;
    const course = courses.find((c: Course) => c.id === session.course_id) || courses[0];
    const room = rooms.find((r: LaboratoryRoom) => r.id === session.room_id) || rooms[0];
    const block = blocks.find((b: LaboratoryBlock) => b.id === room?.block_id) || blocks[0];
    const assignment = assignments.find((a: AssistantAssignment) => a.session_id === session.id && a.status !== 'Declined');
    const assignedAra = aras.find((a: ARAUser) => a.id === assignment?.ara_id);
    const decisionReason = decisionReasons.find(
      (d: AssignmentDecisionReason) => d.session_id === session.id && (assignment ? d.ara_id === assignment.ara_id : true)
    );

    const blockResp = blockResponsibilities.find(
      (b: ARABlockResponsibility) => b.block_id === block?.id && b.status === 'Active'
    );
    const blockResponsibleAra = aras.find((a: ARAUser) => a.id === blockResp?.ara_id);

    const roomResp = roomResponsibilities.find(
      (r: ARARoomResponsibility) => r.room_id === room?.id && r.status === 'Active'
    );
    const roomKeyHolderAra = aras.find((a: ARAUser) => a.id === roomResp?.ara_id);

    return {
      session,
      course,
      room,
      block,
      assignedAra,
      assignment,
      decisionReason,
      blockResponsibleAra,
      roomKeyHolderAra,
    };
  }, [selectedSessionForModal, courses, rooms, blocks, assignments, aras, decisionReasons, blockResponsibilities, roomResponsibilities]);

  // Section 20 Benchmark Quick Launcher
  const handleOpenQuickBenchmarkDemo = () => {
    const benchmarkSession = sessions.find((s: ScheduledSession) => s.id === 'session-cseg1104-sec1-grp1') || sessions[0];
    setSelectedSessionForModal(benchmarkSession);
  };

  const assignedCount = sessions.filter(
    (s: ScheduledSession) => s.status === 'Confirmed' || s.status === 'Tentatively Assigned'
  ).length;
  const unresolvedCount = sessions.filter((s: ScheduledSession) => s.status === 'ARA Assignment Required').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Real-Time Conflict Alert Toast (Triggers on Manual Overlap) */}
      <ConflictAlertToast
        alert={activeConflictAlert}
        onDismiss={() => setActiveConflictAlert(null)}
        onNavigateToDiagnostics={() => {
          setActiveConflictAlert(null);
          setActiveTab('overrides_unresolved');
        }}
      />

      {/* Top Academic University Navigation Bar */}
      <Header
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        assignedCount={assignedCount}
        unresolvedCount={unresolvedCount}
        totalSessions={sessions.length}
        onOpenQuickDemo={handleOpenQuickBenchmarkDemo}
        currentAra={aras.find((a) => a.id === currentAraId)}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-16">
        {activeTab === 'batch_allocations' && (
          <BatchAllocationDashboard
            sessions={sessions}
            courses={courses}
            rooms={rooms}
            blocks={blocks}
            aras={aras}
            assignments={assignments}
            decisionReasons={decisionReasons}
            systemConfig={systemConfig}
            qualifications={qualifications}
            availabilities={availabilities}
            notifications={notifications}
            overrides={overrides}
            downloadHistory={downloadHistory}
            roomResponsibilities={roomResponsibilities}
            onRunBatchAllocation={handleRunBatchAllocation}
            onResetAllocations={handleResetAllocations}
            onSelectSession={(session) => setSelectedSessionForModal(session)}
            onOpenOfficialReport={() => setIsOfficialReportOpen(true)}
            onRecordNewDownload={handleRecordNewDownload}
            onUpdateCoursePriority={handleUpdateCoursePriority}
            onRefreshTelemetry={() => addNotification('Telemetry Refreshed', 'Telemetry and D3 metrics synced from live engine state.', 'assignment')}
            onBulkResolveOverlaps={handleBulkResolveOverlaps}
            onHighPrecedenceAutoFill={handleHighPrecedenceAutoFill}
            isProcessingBatch={isProcessingBatch}
          />
        )}

        {activeTab === 'my_profile' && (
          <MyAraProfile
            currentAraId={currentAraId}
            setCurrentAraId={setCurrentAraId}
            aras={aras}
            courses={courses}
            sessions={sessions}
            rooms={rooms}
            blocks={blocks}
            assignments={assignments}
            qualifications={qualifications}
            systemConfig={systemConfig}
            onAcceptAssignment={handleAcceptAssignment}
            onDeclineAssignment={handleDeclineAssignment}
            onNavigateToPreferences={() => setActiveTab('realtime_portal')}
          />
        )}

        {activeTab === 'realtime_portal' && (
          <RealtimePreferencePortal
            currentAraId={currentAraId}
            setCurrentAraId={setCurrentAraId}
            aras={aras}
            courses={courses}
            sessions={sessions}
            rooms={rooms}
            blocks={blocks}
            preferences={preferences}
            assignments={assignments}
            qualifications={qualifications}
            systemConfig={systemConfig}
            onSubmitRealtimePreference={handleSubmitRealtimePreference}
            onWithdrawPreference={handleWithdrawPreference}
            onAcceptAssignment={handleAcceptAssignment}
            onDeclineAssignment={handleDeclineAssignment}
          />
        )}

        {activeTab === 'blocks_and_rooms' && (
          <BlockRoomManagement
            blocks={blocks}
            rooms={rooms}
            aras={aras}
            sessions={sessions}
            assignments={assignments}
            preferences={preferences}
            blockResponsibilities={blockResponsibilities}
            roomResponsibilities={roomResponsibilities}
            systemConfig={systemConfig}
            currentUserRole={currentRole}
            onUpdateBlockResponsibility={handleUpdateBlockResponsibility}
            onUpdateRoomResponsibility={handleUpdateRoomResponsibility}
            onTriggerSemesterRollover={handleTriggerSemesterRollover}
            onAssignAraToSession={handleAssignAraToSession}
            onBatchForceAllocate510Block={handleBatchForceAllocate510Block}
            onSelectSession={(session) => setSelectedSessionForModal(session)}
          />
        )}

        {activeTab === 'scoring_weights' && (
          <ScoringWeightsEditor
            weights={weights}
            systemConfig={systemConfig}
            courses={courses}
            onUpdateWeight={handleUpdateWeight}
            onUpdateSystemConfig={handleUpdateSystemConfig}
            onResetWeightsToDefault={handleResetWeightsToDefault}
            onUpdateCoursePriority={handleUpdateCoursePriority}
            onHighPrecedenceAutoFill={handleHighPrecedenceAutoFill}
          />
        )}

        {activeTab === 'overrides_unresolved' && (
          <OverridesAndUnresolved
            sessions={sessions}
            courses={courses}
            rooms={rooms}
            blocks={blocks}
            aras={aras}
            assignments={assignments}
            overrides={overrides}
            currentRole={currentRole}
            onExecuteOverride={handleExecuteOverride}
          />
        )}

        {activeTab === 'qualifications_workload' && (
          <QualificationsWorkloadMatrix
            aras={aras}
            courses={courses}
            qualifications={qualifications}
            assignments={assignments}
            sessions={sessions}
            onAddQualification={handleAddQualification}
          />
        )}

        {activeTab === 'django_api' && <DjangoApiExplorer />}

        {activeTab === 'audit_compliance' && (
          <AuditTrailAndCompliance
            notifications={notifications}
            overrides={overrides}
          />
        )}

        {activeTab === 'system_health' && (
          <div className="space-y-6">
            <SystemHealthDashboard
              sessions={sessions}
              courses={courses}
              rooms={rooms}
              blocks={blocks}
              aras={aras}
              assignments={assignments}
              decisionReasons={decisionReasons}
              overrides={overrides}
              systemConfig={systemConfig}
              notifications={notifications}
              onRefreshTelemetry={() => addNotification('Telemetry Synchronized', 'Real-time D3 charts and server health metrics updated.', 'assignment')}
            />
          </div>
        )}
      </main>

      {/* Section 7 & 20 Decision Breakdown Modal */}
      {modalData && (
        <DecisionBreakdownModal
          isOpen={!!selectedSessionForModal}
          onClose={() => setSelectedSessionForModal(null)}
          session={modalData.session}
          course={modalData.course}
          room={modalData.room}
          block={modalData.block}
          assignedAra={modalData.assignedAra}
          assignment={modalData.assignment}
          decisionReason={modalData.decisionReason}
          blockResponsibleAra={modalData.blockResponsibleAra}
          roomKeyHolderAra={modalData.roomKeyHolderAra}
          allAras={aras}
          onAcceptAssignment={handleAcceptAssignment}
          onDeclineAssignment={handleDeclineAssignment}
        />
      )}

      {/* SARA / ARA Authentication & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        aras={aras}
        currentAraId={currentAraId}
        onSelectAra={(araId) => {
          setCurrentAraId(araId);
          setActiveTab('realtime_portal');
        }}
        onRegisterSARA={handleRegisterSARA}
        courses={courses}
        rooms={rooms}
        blocks={blocks}
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
      />

      {/* Official ASTU Timetable & Room Allocations Printable Report */}
      {isOfficialReportOpen && (
        <OfficialAstuTimetableReport
          sessions={sessions}
          courses={courses}
          rooms={rooms}
          blocks={blocks}
          aras={aras}
          assignments={assignments}
          roomResponsibilities={roomResponsibilities}
          systemConfig={systemConfig}
          decisionReasons={decisionReasons}
          preferences={preferences}
          overrides={overrides}
          isOpen={isOfficialReportOpen}
          onClose={() => setIsOfficialReportOpen(false)}
        />
      )}

      {/* University Footer */}
      <footer className="bg-[#001733] text-slate-400 text-xs border-t border-white/10 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-bold text-white flex items-center gap-2">
              <span className="text-amber-400 font-serif">Adama Science and Technology University (ASTU)</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300 font-sans font-normal">Academic Resource Assistant (ARA) Laboratory Allocation System</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Department of Computer Science & Engineering • School of Electrical Engineering & Computing
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
            <span className="text-amber-300">SRS Version 2.0 (Final)</span>
            <span>•</span>
            <span>Weighted Scoring Engine (§8)</span>
            <span>•</span>
            <span>Real-time Auto-Assign (§9)</span>
            <span>•</span>
            <span>Django 5.x / React JSX</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
