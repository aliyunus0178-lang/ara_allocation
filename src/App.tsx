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
  LaboratoryBlock
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

  // Section 19: Batch Allocation Action
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
        assignments
      );

      setSessions(result.updatedSessions);
      setAssignments(result.newAssignments);
      setDecisionReasons(result.decisionReasons);

      // Re-calculate ARA workload hours dynamically
      setAras((prevAras: ARAUser[]) =>
        prevAras.map((ara: ARAUser) => {
          const araAsgns = result.newAssignments.filter(
            (a: AssistantAssignment) => a.ara_id === ara.id && a.status !== 'Declined'
          );
          const hours = araAsgns.reduce((sum: number, asgn: AssistantAssignment) => {
            const s = result.updatedSessions.find((sess: ScheduledSession) => sess.id === asgn.session_id);
            return sum + (s?.duration_hours || 0);
          }, 0);
          return { ...ara, current_weekly_hours: hours };
        })
      );

      setIsProcessingBatch(false);

      addNotification(
        'Batch Allocation Engine Complete',
        `Evaluated ${sessions.length} sessions. ${result.assignedCount} allocated, ${result.unresolvedCount} unresolved (SRS §16).`,
        'assignment'
      );
    }, 600);
  };

  // Reset all assignments
  const handleResetAllocations = () => {
    setSessions((prev: ScheduledSession[]) =>
      prev.map((s: ScheduledSession) => ({
        ...s,
        status: 'Unassigned',
      }))
    );
    setAssignments([]);
    setDecisionReasons([]);
    setAras((prev: ARAUser[]) => prev.map((a: ARAUser) => ({ ...a, current_weekly_hours: 0 })));
    addNotification('Allocation Board Reset', 'All scheduled laboratory session assignments have been cleared.', 'assignment');
  };

  // Section 9: Real-time preference submission
  const handleSubmitRealtimePreference = (courseId: string, rank: 1 | 2 | 3) => {
    const currentAra = aras.find((a: ARAUser) => a.id === currentAraId) || aras[0];

    const result = ASTUAssignmentEngine.processRealtimePreferenceSubmission(
      currentAra,
      courseId,
      rank,
      sessions,
      assignments,
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
      systemConfig
    );

    // Add submission to list
    setPreferences((prev: PreferenceSubmission[]) => [result.submission, ...prev]);

    if (result.success && result.assignment && result.assignedSession && result.decisionReason) {
      // Update assignments
      setAssignments((prev: AssistantAssignment[]) => [result.assignment!, ...prev]);
      setDecisionReasons((prev: AssignmentDecisionReason[]) => [result.decisionReason!, ...prev]);

      // Update session status
      setSessions((prev: ScheduledSession[]) =>
        prev.map((s: ScheduledSession) =>
          s.id === result.assignedSession!.id
            ? {
                ...s,
                status:
                  systemConfig.realtime_assignment_mode === 'tentative'
                    ? 'Tentatively Assigned'
                    : 'Confirmed',
              }
            : s
        )
      );

      // Update ARA workload hours
      setAras((prev: ARAUser[]) =>
        prev.map((a: ARAUser) =>
          a.id === currentAra.id
            ? { ...a, current_weekly_hours: a.current_weekly_hours + result.assignedSession!.duration_hours }
            : a
        )
      );

      addNotification(
        'Real-Time Auto-Assignment Confirmed',
        `${currentAra.ara_code} (${currentAra.full_name}) auto-assigned to ${result.assignedSession.section} per SRS §9.`,
        'assignment'
      );
    } else {
      addNotification(
        'Preference Placed in Pending Queue',
        `Preference for course ${courseId} recorded for ${currentAra.ara_code}. Placed in pending queue per SRS §9.3.`,
        'pending_queue'
      );
    }
  };

  const handleWithdrawPreference = (prefId: string) => {
    setPreferences((prev: PreferenceSubmission[]) =>
      prev.map((p) => (p.id === prefId ? { ...p, status: 'Withdrawn' } : p))
    );
    addNotification('Preference Withdrawn', 'Submitted preference withdrawn prior to finalization (SRS §10).', 'pending_queue');
  };

  // Section 11: Confirmation / Decline
  const handleAcceptAssignment = (assignmentId: string) => {
    setAssignments((prev: AssistantAssignment[]) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, status: 'Confirmed' } : a))
    );
    const asgn = assignments.find((a: AssistantAssignment) => a.id === assignmentId);
    if (asgn) {
      setSessions((prev: ScheduledSession[]) =>
        prev.map((s: ScheduledSession) => (s.id === asgn.session_id ? { ...s, status: 'Confirmed' } : s))
      );
      addNotification('Assignment Confirmed', `ARA confirmed assignment for session ${asgn.session_id} (SRS §11).`, 'assignment');
    }
  };

  const handleDeclineAssignment = (assignmentId: string) => {
    const asgn = assignments.find((a: AssistantAssignment) => a.id === assignmentId);
    setAssignments((prev: AssistantAssignment[]) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, status: 'Declined' } : a))
    );
    if (asgn) {
      setSessions((prev: ScheduledSession[]) =>
        prev.map((s: ScheduledSession) => (s.id === asgn.session_id ? { ...s, status: 'ARA Assignment Required' } : s))
      );
      addNotification('Assignment Declined by ARA', `Slot declined for session ${asgn.session_id}. Returned to queue for candidate re-evaluation (SRS §11).`, 'confirmation_request');
    }
  };

  // SARA Registration Action (SRS Section 5, 8, 9)
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
    const newId = `ara-sara-${Date.now()}`;
    const initials = newAraData.full_name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'SA';

    const assignedRooms = rooms.filter((r) => newAraData.selected_room_ids.includes(r.id));
    const roomsSummary = assignedRooms.map((r) => r.room_code).join(', ');

    const newAra: ARAUser = {
      id: newId,
      full_name: newAraData.full_name,
      email: newAraData.email,
      phone: newAraData.phone,
      department: newAraData.department,
      program: newAraData.program,
      year_level: newAraData.year_level,
      is_sara: true,
      gpa_or_standing: newAraData.gpa_or_standing,
      role: newAraData.selected_room_ids.length > 0
        ? 'ROOM_KEY_HOLDER'
        : (newAraData.block_responsibility ? 'BLOCK_RESPONSIBLE' : 'GENERAL_ARA'),
      ara_code: newAraData.ara_code || `SARA/2026/${aras.length + 1}`,
      avatar_initials: initials,
      max_weekly_hours: newAraData.max_weekly_hours || 12,
      current_weekly_hours: 0,
      status: 'Active',
      created_at: new Date().toISOString(),
      assigned_rooms_summary: roomsSummary || undefined,
    };

    setAras((prev: ARAUser[]) => [newAra, ...prev]);

    // Create room responsibilities if rooms were selected
    if (newAraData.selected_room_ids.length > 0) {
      const newRoomResps: ARARoomResponsibility[] = newAraData.selected_room_ids.map((rId, idx) => ({
        id: `room-resp-${Date.now()}-${idx}`,
        room_id: rId,
        ara_id: newId,
        responsibility_type: 'ROOM_KEY_HOLDER',
        is_primary: true,
        is_mandatory: false,
        start_date: '2026-09-01',
        end_date: '2027-02-15',
        academic_year: systemConfig.academic_year,
        semester: systemConfig.semester,
        status: 'Active',
      }));
      setRoomResponsibilities((prev: ARARoomResponsibility[]) => [...newRoomResps, ...prev]);
    }

    // Create block responsibility if specified
    if (newAraData.block_responsibility) {
      const newBlockResp: ARABlockResponsibility = {
        id: `block-resp-${Date.now()}`,
        block_id: newAraData.block_responsibility,
        ara_id: newId,
        responsibility_type: 'BLOCK_RESPONSIBLE',
        is_primary: true,
        is_mandatory: false,
        start_date: '2026-09-01',
        end_date: '2027-02-15',
        academic_year: systemConfig.academic_year,
        semester: systemConfig.semester,
        status: 'Active',
      };
      setBlockResponsibilities((prev: ARABlockResponsibility[]) => [newBlockResp, ...prev]);
    }

    // Create qualifications for certified courses
    if (newAraData.selected_course_ids.length > 0) {
      const newQuals: ARAQualification[] = newAraData.selected_course_ids.map((cId, idx) => ({
        id: `qual-${Date.now()}-${idx}`,
        ara_id: newId,
        course_id: cId,
        qualified_date: new Date().toISOString().split('T')[0],
        expiry_date: null,
        status: 'Valid',
        certified_by: 'SOEEC Academic Commission',
      }));
      setQualifications((prev: ARAQualification[]) => [...newQuals, ...prev]);
    }

    // Auto-create default full availability for this new assistant
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
    const newAvails = days.map((day, idx) => ({
      id: `avail-${newId}-${idx}`,
      ara_id: newId,
      day_of_week: day,
      start_time: '08:00',
      end_time: '18:00',
      is_available: true,
    }));
    setAvailabilities((prev) => [...prev, ...newAvails]);

    // Set as active user and transition straight to preference portal
    setCurrentAraId(newId);
    setCurrentRole('ARA_ASSISTANT');
    setActiveTab('realtime_portal');

    addNotification(
      'SARA Registration Successful',
      `${newAra.full_name} (${newAra.ara_code}) registered as SARA for AY ${systemConfig.academic_year}. Please submit your top 3 course preferences.`,
      'assignment'
    );
  };

  // Section 14.3: Authorized Override
  const handleExecuteOverride = (sessionId: string, newAraId: string, reason: string) => {
    const assignedAra = aras.find((a: ARAUser) => a.id === newAraId);

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

  // Block & Room responsibilities update
  const handleUpdateBlockResponsibility = (resp: ARABlockResponsibility) => {
    setBlockResponsibilities((prev: ARABlockResponsibility[]) =>
      prev.map((b) => (b.id === resp.id ? resp : b))
    );
    addNotification('Block Responsibility Updated', `Updated responsibility for block ${resp.block_id}. Mandatory: ${resp.is_mandatory ? 'YES' : 'NO'}.`, 'assignment');
  };

  const handleUpdateRoomResponsibility = (resp: ARARoomResponsibility) => {
    setRoomResponsibilities((prev: ARARoomResponsibility[]) => {
      const exists = prev.some((r) => r.id === resp.id);
      if (exists) {
        return prev.map((r) => (r.id === resp.id ? resp : r));
      }
      return [...prev, resp];
    });
    addNotification('Room Key-Holder Updated', `Updated key-holder record for room ${resp.room_id}.`, 'assignment');
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
            notifications={notifications}
            overrides={overrides}
            onRunBatchAllocation={handleRunBatchAllocation}
            onResetAllocations={handleResetAllocations}
            onSelectSession={(session) => setSelectedSessionForModal(session)}
            onOpenOfficialReport={() => setIsOfficialReportOpen(true)}
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
            onUpdateBlockResponsibility={handleUpdateBlockResponsibility}
            onUpdateRoomResponsibility={handleUpdateRoomResponsibility}
            onTriggerSemesterRollover={handleTriggerSemesterRollover}
          />
        )}

        {activeTab === 'scoring_weights' && (
          <ScoringWeightsEditor
            weights={weights}
            systemConfig={systemConfig}
            onUpdateWeight={handleUpdateWeight}
            onUpdateSystemConfig={handleUpdateSystemConfig}
            onResetWeightsToDefault={handleResetWeightsToDefault}
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
