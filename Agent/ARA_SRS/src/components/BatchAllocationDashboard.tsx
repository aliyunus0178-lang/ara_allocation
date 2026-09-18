import React, { useState, useMemo } from 'react';
import { 
  ScheduledSession, 
  Course, 
  LaboratoryRoom, 
  LaboratoryBlock, 
  ARAUser, 
  AssistantAssignment,
  AssignmentDecisionReason,
  SystemConfig,
  SystemNotification,
  AssignmentOverride,
  DownloadReportRecord,
  ARARoomResponsibility,
  ARAQualification,
  ARAAvailability
} from '../types/astu';
import { 
  Play, 
  RotateCcw, 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  ShieldCheck, 
  KeyRound,
  FileSpreadsheet,
  Grid,
  Download,
  Activity,
  History,
  Award,
  Layers,
  BarChart3,
  Zap,
  Sparkles,
  ArrowRight,
  Check,
  X,
  AlertOctagon,
  HelpCircle
} from 'lucide-react';
import { RecentActivityWidget } from './RecentActivityWidget';
import { DashboardKpiSummary } from './DashboardKpiSummary';
import { DownloadHistoryTab } from './DownloadHistoryTab';
import { CoursePriorityPrecedencePanel } from './CoursePriorityPrecedencePanel';
import { SystemHealthDashboard } from './SystemHealthDashboard';
import { BatchAllocationAnalytics } from './BatchAllocationAnalytics';

interface BulkResolutionCandidate {
  sessionId: string;
  selectedAraId: string;
  recommendedAra: ARAUser;
  course: Course;
  room: LaboratoryRoom;
  session: ScheduledSession;
  congestionPercent: number;
  currentHours: number;
  maxHours: number;
  isKeyHolder: boolean;
  alternativeAras: { ara: ARAUser; congestionPercent: number; currentHours: number }[];
}

interface BatchAllocationDashboardProps {
  sessions: ScheduledSession[];
  courses: Course[];
  rooms: LaboratoryRoom[];
  blocks: LaboratoryBlock[];
  aras: ARAUser[];
  assignments: AssistantAssignment[];
  decisionReasons: AssignmentDecisionReason[];
  systemConfig: SystemConfig;
  qualifications?: ARAQualification[];
  availabilities?: ARAAvailability[];
  notifications?: SystemNotification[];
  overrides?: AssignmentOverride[];
  downloadHistory?: DownloadReportRecord[];
  roomResponsibilities?: ARARoomResponsibility[];
  onRunBatchAllocation: () => void;
  onResetAllocations: () => void;
  onSelectSession: (session: ScheduledSession) => void;
  onOpenOfficialReport?: () => void;
  onRecordNewDownload?: (record: DownloadReportRecord) => void;
  onUpdateCoursePriority?: (courseId: string, updates: Partial<Course>) => void;
  onRefreshTelemetry?: () => void;
  onBulkResolveOverlaps?: (resolutions: { sessionId: string; araId: string; reason: string }[]) => void;
  isProcessingBatch: boolean;
}

export const BatchAllocationDashboard: React.FC<BatchAllocationDashboardProps> = ({
  sessions,
  courses,
  rooms,
  blocks,
  aras,
  assignments,
  decisionReasons,
  systemConfig,
  qualifications = [],
  availabilities = [],
  notifications = [],
  overrides = [],
  downloadHistory = [],
  roomResponsibilities = [],
  onRunBatchAllocation,
  onResetAllocations,
  onSelectSession,
  onOpenOfficialReport,
  onRecordNewDownload,
  onUpdateCoursePriority,
  onRefreshTelemetry,
  onBulkResolveOverlaps,
  isProcessingBatch,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'board' | 'analytics' | 'history' | 'precedence' | 'health'>('board');
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Bulk Resolve Modal State
  const [isBulkResolveModalOpen, setIsBulkResolveModalOpen] = useState<boolean>(false);
  const [customBulkSelections, setCustomBulkSelections] = useState<Record<string, string>>({});
  const [bulkSuccessMessage, setBulkSuccessMessage] = useState<string | null>(null);

  // Helper time parser
  const timeToMinutes = (t: string) => {
    const [h, m] = (t || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const filteredSessions = sessions.filter((session) => {
    const course = courses.find((c) => c.id === session.course_id);
    const room = rooms.find((r) => r.id === session.room_id);
    const block = blocks.find((b) => b.id === room?.block_id);

    if (selectedBlockFilter !== 'all' && room?.block_id !== selectedBlockFilter) {
      return false;
    }
    if (selectedDayFilter !== 'all' && session.day_of_week !== selectedDayFilter) {
      return false;
    }
    if (statusFilter !== 'all' && session.status !== statusFilter) {
      return false;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const cleanQ = q.replace(/[\s-_]/g, '');

      // 1. Course Code & Name
      const courseCode = (course?.course_code || '').toLowerCase();
      const cleanCourseCode = courseCode.replace(/[\s-_]/g, '');
      const courseName = (course?.course_name || '').toLowerCase();
      const matchCourse = courseCode.includes(q) || cleanCourseCode.includes(cleanQ) || courseName.includes(q);

      // 2. Room Code & Block
      const roomCode = (room?.room_code || '').toLowerCase();
      const cleanRoomCode = roomCode.replace(/[\s-_]/g, '');
      const blockCode = (block?.block_code || '').toLowerCase();
      const blockName = (block?.name || '').toLowerCase();
      const matchRoom = roomCode.includes(q) || cleanRoomCode.includes(cleanQ) || blockCode.includes(q) || blockName.includes(q);

      // 3. Section & Group
      const matchSection = session.section.toLowerCase().includes(q) || session.group.toLowerCase().includes(q);

      // 4. Assigned ARA Name, Code, and Email
      const sessionAssignments = assignments.filter((a) => a.session_id === session.id);
      const matchAra = sessionAssignments.some((asgn) => {
        const ara = aras.find((a) => a.id === asgn.ara_id);
        if (!ara) return false;
        const araName = (ara.full_name || '').toLowerCase();
        const araCode = (ara.ara_code || '').toLowerCase();
        const cleanAraCode = araCode.replace(/[\s-_]/g, '');
        const araEmail = (ara.email || '').toLowerCase();
        return (
          araName.includes(q) ||
          araCode.includes(q) ||
          cleanAraCode.includes(cleanQ) ||
          araEmail.includes(q)
        );
      });

      if (!matchCourse && !matchRoom && !matchSection && !matchAra) return false;
    }
    return true;
  });

  const assignedCount = sessions.filter(
    (s) => s.status === 'Confirmed' || s.status === 'Tentatively Assigned'
  ).length;
  const unresolvedCount = sessions.filter((s) => s.status === 'ARA Assignment Required').length;
  const unassignedCount = sessions.filter((s) => s.status === 'Unassigned').length;

  // Calculate Bulk Resolve candidates for all sessions requiring assignment
  const bulkResolutionCandidates: BulkResolutionCandidate[] = useMemo(() => {
    const targetSessions = sessions.filter(
      (s) => s.status === 'ARA Assignment Required' || s.status === 'Unassigned'
    );

    // Calculate current assigned hours per ARA
    const araCurrentHoursMap = new Map<string, number>();
    aras.forEach((ara) => araCurrentHoursMap.set(ara.id, 0));

    assignments.forEach((asgn) => {
      if (asgn.status !== 'Declined') {
        const sess = sessions.find((s) => s.id === asgn.session_id);
        const duration = sess?.duration_hours || 2;
        const current = araCurrentHoursMap.get(asgn.ara_id) || 0;
        araCurrentHoursMap.set(asgn.ara_id, current + duration);
      }
    });

    const results: BulkResolutionCandidate[] = [];

    targetSessions.forEach((sess) => {
      const course = courses.find((c) => c.id === sess.course_id);
      const room = rooms.find((r) => r.id === sess.room_id);
      if (!course || !room) return;

      const sessStart = timeToMinutes(sess.start_time);
      const sessEnd = timeToMinutes(sess.end_time);

      // Evaluate each active ARA
      const eligibleCandidates: {
        ara: ARAUser;
        congestionPercent: number;
        currentHours: number;
        maxHours: number;
        isKeyHolder: boolean;
      }[] = [];

      aras.forEach((ara) => {
        if (ara.status !== 'Active') return;

        // 1. Qualification check (if qualifications provided, otherwise default true)
        const isQualified = qualifications.length === 0 || qualifications.some(
          (q) => q.ara_id === ara.id && q.course_id === course.id && q.status === 'Valid'
        );
        if (!isQualified) return;

        // 2. Availability check (if availabilities provided)
        const isAvailable = availabilities.length === 0 || availabilities.some(
          (av) => av.ara_id === ara.id && av.day_of_week === sess.day_of_week && av.is_available
        );
        if (!isAvailable) return;

        // 3. Concurrency check (no simultaneous active session at this time)
        const hasTimeConflict = assignments.some((a) => {
          if (a.ara_id !== ara.id || a.status === 'Declined') return false;
          const otherSess = sessions.find((s) => s.id === a.session_id);
          if (!otherSess || otherSess.day_of_week !== sess.day_of_week) return false;
          const oStart = timeToMinutes(otherSess.start_time);
          const oEnd = timeToMinutes(otherSess.end_time);
          return Math.max(sessStart, oStart) < Math.min(sessEnd, oEnd);
        });
        if (hasTimeConflict) return;

        const currentHours = araCurrentHoursMap.get(ara.id) || 0;
        const maxHours = ara.max_weekly_hours || 12;

        // Check if adding this session exceeds hard limit
        if (currentHours + sess.duration_hours > maxHours + 2) return;

        const congestionPercent = Math.round((currentHours / maxHours) * 100);
        const isKeyHolder = roomResponsibilities.some(
          (rr) => rr.room_id === room.id && rr.ara_id === ara.id && rr.status === 'Active'
        );

        eligibleCandidates.push({
          ara,
          congestionPercent,
          currentHours,
          maxHours,
          isKeyHolder,
        });
      });

      // Sort candidates by:
      // 1. Least congested (lowest congestion percentage)
      // 2. Key holder priority
      // 3. Lowest absolute hours
      eligibleCandidates.sort((a, b) => {
        if (a.isKeyHolder && !b.isKeyHolder) return -1;
        if (!a.isKeyHolder && b.isKeyHolder) return 1;
        if (a.congestionPercent !== b.congestionPercent) {
          return a.congestionPercent - b.congestionPercent;
        }
        return a.currentHours - b.currentHours;
      });

      if (eligibleCandidates.length > 0) {
        const best = eligibleCandidates[0];
        const selectedId = customBulkSelections[sess.id] || best.ara.id;
        const selectedAra = aras.find((a) => a.id === selectedId) || best.ara;

        results.push({
          sessionId: sess.id,
          selectedAraId: selectedId,
          recommendedAra: selectedAra,
          course,
          room,
          session: sess,
          congestionPercent: best.congestionPercent,
          currentHours: best.currentHours,
          maxHours: best.maxHours,
          isKeyHolder: best.isKeyHolder,
          alternativeAras: eligibleCandidates.map((c) => ({
            ara: c.ara,
            congestionPercent: c.congestionPercent,
            currentHours: c.currentHours,
          })),
        });
      }
    });

    return results;
  }, [sessions, courses, rooms, aras, assignments, qualifications, availabilities, roomResponsibilities, customBulkSelections]);

  // Execute Bulk Resolution
  const handleExecuteBulkResolution = () => {
    if (bulkResolutionCandidates.length === 0) return;

    const resolutions = bulkResolutionCandidates.map((cand) => {
      const chosenAraId = customBulkSelections[cand.sessionId] || cand.recommendedAra.id;
      return {
        sessionId: cand.sessionId,
        araId: chosenAraId,
        reason: `Bulk Resolved via Least-Congested Assistant Optimization Engine (${cand.congestionPercent}% load factor, SRS §16)`,
      };
    });

    if (onBulkResolveOverlaps) {
      onBulkResolveOverlaps(resolutions);
    }

    setIsBulkResolveModalOpen(false);
    setBulkSuccessMessage(`Successfully resolved and assigned ${resolutions.length} laboratory sessions with zero concurrency collisions!`);
    setTimeout(() => setBulkSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6" id="batch-allocation-dashboard">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                Engine Control Panel • SRS §19
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Authoritative Scoring Model v2.0
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-serif">
              ASTU Laboratory Session Schedule & Batch Allocation Board
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Processes hard constraints (eligibility, availability, timetable conflicts, workload caps) and authoritative weighted scores.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Bulk Resolve Action Button */}
            {unresolvedCount > 0 && (
              <button
                onClick={() => setIsBulkResolveModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 rounded-lg shadow-sm border border-rose-500/40 transition-all active:scale-95 animate-pulse"
                title="Identify all unresolved sessions and auto-assign least-congested assistants (§16)"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Bulk Resolve Slots ({unresolvedCount})</span>
              </button>
            )}

            {onOpenOfficialReport && (
              <button
                onClick={onOpenOfficialReport}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg border border-amber-500 shadow-sm transition-all active:scale-95"
                title="Download official laboratory room allocations report in ASTU institutional format (PDF / CSV for Department Head Review)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
                <span className="text-[10px] bg-amber-500/80 px-1 py-0.2 rounded font-mono text-slate-950 font-bold ml-0.5">
                  PDF/CSV
                </span>
              </button>
            )}

            <button
              onClick={onResetAllocations}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
              title="Reset all session assignments to Unassigned"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Board</span>
            </button>

            <button
              onClick={onRunBatchAllocation}
              disabled={isProcessingBatch}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold shadow-md transition-all ${
                isProcessingBatch
                  ? 'bg-amber-400 text-slate-900 cursor-wait'
                  : 'bg-[#002147] hover:bg-[#001733] text-amber-400 border border-amber-500/40 active:scale-95'
              }`}
            >
              <Play className={`w-4 h-4 text-amber-400 ${isProcessingBatch ? 'animate-spin' : ''}`} />
              <span>{isProcessingBatch ? 'Running Batch Engine...' : 'Run Authoritative Batch Allocation'}</span>
            </button>
          </div>
        </div>

        {/* Live Notification Success Banner */}
        {bulkSuccessMessage && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{bulkSuccessMessage}</span>
            </div>
            <button
              onClick={() => setBulkSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metric KPI Counter Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Lab Sessions</span>
            <div className="text-xl font-bold text-slate-800 dark:text-white font-mono mt-0.5">{sessions.length}</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Assigned / Filled</span>
            <div className="text-xl font-bold text-emerald-900 dark:text-emerald-300 font-mono mt-0.5">
              {assignedCount} <span className="text-xs text-emerald-700 dark:text-emerald-400 font-normal">({Math.round((assignedCount / sessions.length) * 100 || 0)}%)</span>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/40 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Unassigned Slots</span>
            <div className="text-xl font-bold text-amber-900 dark:text-amber-300 font-mono mt-0.5">{unassignedCount}</div>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/40 rounded-lg p-3 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wide">ARA Required (§16)</span>
              <div className="text-xl font-bold text-rose-900 dark:text-rose-300 font-mono mt-0.5">{unresolvedCount}</div>
            </div>
            {unresolvedCount > 0 && (
              <button
                onClick={() => setIsBulkResolveModalOpen(true)}
                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-2xs flex items-center gap-1"
                title="Bulk Resolve Now"
              >
                <Zap className="w-3 h-3" /> Resolve
              </button>
            )}
          </div>
        </div>

        {/* Segmented Sub-Tabs Bar with Analytics Tab */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveSubTab('board')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'board'
                ? 'bg-[#002147] text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Allocation Board & Matrix</span>
            <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
              {assignedCount}/{sessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'analytics'
                ? 'bg-[#002147] text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Workload & Capacity Analytics (Recharts)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('precedence')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'precedence'
                ? 'bg-[#002147] text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Course Precedence Editor (Drag & Drop)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'history'
                ? 'bg-[#002147] text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Download History ({downloadHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('health')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'health'
                ? 'bg-[#002147] text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>System Health & Telemetry</span>
          </button>
        </div>
      </div>

      {/* Render Active Sub-View */}
      {activeSubTab === 'analytics' && (
        <BatchAllocationAnalytics
          aras={aras}
          sessions={sessions}
          assignments={assignments}
          courses={courses}
          rooms={rooms}
          systemConfig={systemConfig}
        />
      )}

      {activeSubTab === 'precedence' && (
        <CoursePriorityPrecedencePanel
          courses={courses}
          onUpdateCoursePriority={onUpdateCoursePriority}
        />
      )}

      {activeSubTab === 'history' && (
        <DownloadHistoryTab
          downloadHistory={downloadHistory}
          sessions={sessions}
          courses={courses}
          rooms={rooms}
          blocks={blocks}
          aras={aras}
          roomResponsibilities={roomResponsibilities}
          onTriggerNewReport={onOpenOfficialReport}
          onRecordNewDownload={onRecordNewDownload}
        />
      )}

      {activeSubTab === 'health' && (
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
          onRefreshTelemetry={onRefreshTelemetry}
        />
      )}

      {activeSubTab === 'board' && (
        <>
          {/* Section: Live Activity Feed with Critical Warnings (SRS §18) */}
          <RecentActivityWidget
            assignments={assignments}
            sessions={sessions}
            courses={courses}
            rooms={rooms}
            aras={aras}
            notifications={notifications}
            overrides={overrides}
            decisionReasons={decisionReasons}
            onSelectSession={onSelectSession}
          />

          {/* Top-level Executive KPI Summary Component */}
          <DashboardKpiSummary
            sessions={sessions}
            assignments={assignments}
            aras={aras}
            rooms={rooms}
            decisionReasons={decisionReasons}
            overrides={overrides}
            onFilterByStatus={(status) => setStatusFilter(status)}
          />

          {/* Filter and Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-3 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
                {/* Search Box */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by course code, room number, or assigned ARA name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-xs font-medium transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Block Filter */}
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <select
                    value={selectedBlockFilter}
                    onChange={(e) => setSelectedBlockFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 font-medium focus:outline-none"
                  >
                    <option value="all">All Laboratory Blocks</option>
                    {blocks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.block_code} ({b.name.slice(0, 24)}...)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day Filter */}
                <select
                  value={selectedDayFilter}
                  onChange={(e) => setSelectedDayFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 font-medium focus:outline-none"
                >
                  <option value="all">All Teaching Days (Mon–Sat)</option>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 font-medium focus:outline-none"
                >
                  <option value="all">All Session Statuses</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Tentatively Assigned">Tentatively Assigned</option>
                  <option value="ARA Assignment Required">ARA Assignment Required (§16)</option>
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>

              {/* View Mode Toggle & Results Count */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Showing <strong className="text-slate-800 dark:text-slate-200">{filteredSessions.length}</strong> of {sessions.length}
                </span>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded ${
                      viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white font-bold' : 'text-slate-500'
                    }`}
                    title="Table View"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${
                      viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white font-bold' : 'text-slate-500'
                    }`}
                    title="Card Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Search Tag Indicator */}
            {searchQuery && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                <span className="text-slate-400">Active Search Filter:</span>
                <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 font-medium">
                  &ldquo;{searchQuery}&rdquo;
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:text-amber-950 dark:hover:text-amber-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-amber-700 dark:text-amber-400 hover:underline text-[11px] ml-1"
                >
                  Reset search
                </button>
              </div>
            )}
          </div>

          {/* Session Schedule Table / Grid */}
          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-[#001733] text-white uppercase text-[11px] font-mono tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Course & Section</th>
                      <th className="py-3 px-3">Day & Timeslot</th>
                      <th className="py-3 px-3">Laboratory Room</th>
                      <th className="py-3 px-3">Required Slots</th>
                      <th className="py-3 px-3">Assigned ARA(s) & Source</th>
                      <th className="py-3 px-3">Allocation Status</th>
                      <th className="py-3 px-4 text-right">Scoring Breakdown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                    {filteredSessions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          <div className="max-w-sm mx-auto flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1" />
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                              No matching laboratory sessions found
                            </p>
                            <p className="text-xs text-slate-500">
                              {searchQuery
                                ? `No results matched "${searchQuery}". Try searching with a different course code, room number, or assistant name.`
                                : 'No sessions match the current block, day, or status filters.'}
                            </p>
                            {(searchQuery || selectedBlockFilter !== 'all' || selectedDayFilter !== 'all' || statusFilter !== 'all') && (
                              <button
                                onClick={() => {
                                  setSearchQuery('');
                                  setSelectedBlockFilter('all');
                                  setSelectedDayFilter('all');
                                  setStatusFilter('all');
                                }}
                                className="mt-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors text-xs"
                              >
                                Reset All Filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSessions.map((session) => {
                        const course = courses.find((c) => c.id === session.course_id);
                        const room = rooms.find((r) => r.id === session.room_id);
                        const block = blocks.find((b) => b.id === room?.block_id);
                        const sessionAssignments = assignments.filter((a) => a.session_id === session.id);

                        return (
                          <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                            {/* Course */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 dark:text-white font-mono text-xs flex items-center gap-1.5">
                                <span>{course?.course_code}</span>
                                <span className="text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 rounded font-mono">
                                  Sec {session.section}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                {course?.course_name}
                              </div>
                            </td>

                            {/* Timeslot */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{session.day_of_week}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                {session.start_time} – {session.end_time} ({session.duration_hours}h)
                              </div>
                            </td>

                            {/* Room */}
                            <td className="py-3 px-3">
                              <div className="font-mono font-bold text-slate-900 dark:text-white">{room?.room_code}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {block?.block_code} • Cap: {room?.capacity}
                              </div>
                            </td>

                            {/* Slots */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="font-mono text-slate-700 dark:text-slate-300">
                                {sessionAssignments.length}/{session.required_ara_count} Filled
                              </span>
                            </td>

                            {/* Assigned ARAs */}
                            <td className="py-3 px-3">
                              {sessionAssignments.length === 0 ? (
                                <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                              ) : (
                                <div className="space-y-1">
                                  {sessionAssignments.map((asgn) => {
                                    const ara = aras.find((a) => a.id === asgn.ara_id);
                                    return (
                                      <div key={asgn.id} className="flex items-center gap-1.5 text-xs">
                                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                                          {ara?.ara_code}
                                        </span>
                                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                          ({ara?.full_name.split(' ')[0]})
                                        </span>
                                        <span className="text-[9px] px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase font-mono">
                                          {asgn.source.replace('_', ' ')}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                session.status === 'Confirmed'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  : session.status === 'Tentatively Assigned'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                  : session.status === 'ARA Assignment Required'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              }`}>
                                {session.status === 'Confirmed' && <CheckCircle2 className="w-3 h-3" />}
                                {session.status === 'ARA Assignment Required' && <AlertTriangle className="w-3 h-3" />}
                                {session.status}
                              </span>
                            </td>

                            {/* Action / Explanation */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => onSelectSession(session)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-900 dark:hover:text-amber-300 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors"
                                title="Inspect deterministic score formula, constraints, and audit trail (§7)"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-600" />
                                <span>Decision Breakdown</span>
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
          ) : filteredSessions.length === 0 ? (
            /* Empty Grid View */
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
              <div className="max-w-sm mx-auto flex flex-col items-center gap-2">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1" />
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  No matching laboratory sessions found
                </p>
                <p className="text-xs text-slate-500">
                  {searchQuery
                    ? `No results matched "${searchQuery}". Try searching with a different course code, room number, or assistant name.`
                    : 'No sessions match the current block, day, or status filters.'}
                </p>
                {(searchQuery || selectedBlockFilter !== 'all' || selectedDayFilter !== 'all' || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedBlockFilter('all');
                      setSelectedDayFilter('all');
                      setStatusFilter('all');
                    }}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors text-xs"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Card Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map((session) => {
                const course = courses.find((c) => c.id === session.course_id);
                const room = rooms.find((r) => r.id === session.room_id);
                const block = blocks.find((b) => b.id === room?.block_id);
                const sessionAssignments = assignments.filter((a) => a.session_id === session.id);

                return (
                  <div
                    key={session.id}
                    className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-3 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                            {course?.course_code}
                          </span>
                          <span className="text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-bold">
                            Sec {session.section}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {course?.course_name}
                        </h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        session.status === 'Confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : session.status === 'Tentatively Assigned'
                          ? 'bg-blue-100 text-blue-800'
                          : session.status === 'ARA Assignment Required'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Time:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{session.day_of_week} {session.start_time}–{session.end_time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Location:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{room?.room_code} ({block?.block_code})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Required:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{session.required_ara_count} ARA slot(s)</span>
                      </div>
                    </div>

                    <div className="text-xs">
                      <div className="text-slate-500 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                        Assigned Assistant(s):
                      </div>
                      {sessionAssignments.length === 0 ? (
                        <div className="text-slate-400 italic text-[11px]">No assistant assigned</div>
                      ) : (
                        sessionAssignments.map((asgn) => {
                          const ara = aras.find((a) => a.id === asgn.ara_id);
                          return (
                            <div key={asgn.id} className="flex items-center justify-between p-1.5 bg-slate-100/80 dark:bg-slate-800 rounded mb-1 font-mono text-xs">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{ara?.ara_code} ({ara?.full_name})</span>
                              <span className="text-[10px] text-slate-500">{asgn.source.replace('_', ' ')}</span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <button
                      onClick={() => onSelectSession(session)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-600" />
                      <span>Explain Decision Breakdown (§7)</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* BULK RESOLVE MODAL (Identifies Required Slots & Optimizes) */}
      {/* ========================================================= */}
      {isBulkResolveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-[#002147] to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-serif">
                      Bulk Resolve Required Laboratory Slots
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500 text-white">
                      {bulkResolutionCandidates.length} Identified
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/80">
                    Auto-matches least-congested assistants with verified course qualifications and timetable availability (SRS §16)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBulkResolveModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: List of Candidates */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {bulkResolutionCandidates.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                    No Unresolved Slots Detected
                  </h4>
                  <p className="text-xs max-w-md mx-auto">
                    All scheduled laboratory sessions currently have allocated assistants or there are no unassigned slots requiring optimization.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold">Least-Congested Optimization Rule Active:</span>
                      <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed">
                        The engine computed real-time weekly hour workloads and timetable non-concurrency constraints. Assistants with the lowest current workload ratios (least congested) are pre-selected to balance departmental teaching load.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {bulkResolutionCandidates.map((cand, idx) => {
                      const selectedId = customBulkSelections[cand.sessionId] || cand.recommendedAra.id;
                      const activeAra = aras.find((a) => a.id === selectedId) || cand.recommendedAra;

                      return (
                        <div
                          key={cand.sessionId}
                          className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          {/* Session Info */}
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-indigo-950 dark:text-indigo-300">
                                {cand.course.course_code}
                              </span>
                              <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold">
                                Sec {cand.session.section}
                              </span>
                              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                                {cand.course.course_name}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {cand.session.day_of_week} {cand.session.start_time}–{cand.session.end_time} ({cand.session.duration_hours}h)
                              </span>
                              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {cand.room.room_code}
                              </span>
                            </div>
                          </div>

                          {/* Arrow Divider */}
                          <div className="hidden md:flex items-center text-slate-300 dark:text-slate-600">
                            <ArrowRight className="w-5 h-5" />
                          </div>

                          {/* Suggested Candidate Match & Override Dropdown */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 min-w-[300px] space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                Optimal Candidate ({idx + 1}):
                              </span>
                              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                                {cand.congestionPercent}% Congested
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={selectedId}
                                onChange={(e) => {
                                  setCustomBulkSelections((prev) => ({
                                    ...prev,
                                    [cand.sessionId]: e.target.value,
                                  }));
                                }}
                                className="w-full text-xs font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md p-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              >
                                {cand.alternativeAras.map((alt) => (
                                  <option key={alt.ara.id} value={alt.ara.id}>
                                    {alt.ara.ara_code} - {alt.ara.full_name} ({alt.currentHours}h / {alt.ara.max_weekly_hours}h — {alt.congestionPercent}% load)
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                              <span>Workload: {cand.currentHours}h + {cand.session.duration_hours}h = {cand.currentHours + cand.session.duration_hours}h</span>
                              {cand.isKeyHolder && (
                                <span className="text-amber-600 font-bold flex items-center gap-0.5">
                                  <KeyRound className="w-2.5 h-2.5" /> Key Custodian
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-4">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Total to resolve: <strong>{bulkResolutionCandidates.length}</strong> sessions
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsBulkResolveModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteBulkResolution}
                  disabled={bulkResolutionCandidates.length === 0}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2 transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Bulk Resolution ({bulkResolutionCandidates.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
