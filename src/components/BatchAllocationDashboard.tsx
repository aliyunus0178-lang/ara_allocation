import React, { useState } from 'react';
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
  AssignmentOverride
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
  Activity
} from 'lucide-react';
import { RecentActivityWidget } from './RecentActivityWidget';

interface BatchAllocationDashboardProps {
  sessions: ScheduledSession[];
  courses: Course[];
  rooms: LaboratoryRoom[];
  blocks: LaboratoryBlock[];
  aras: ARAUser[];
  assignments: AssistantAssignment[];
  decisionReasons: AssignmentDecisionReason[];
  systemConfig: SystemConfig;
  notifications?: SystemNotification[];
  overrides?: AssignmentOverride[];
  onRunBatchAllocation: () => void;
  onResetAllocations: () => void;
  onSelectSession: (session: ScheduledSession) => void;
  onOpenOfficialReport?: () => void;
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
  notifications = [],
  overrides = [],
  onRunBatchAllocation,
  onResetAllocations,
  onSelectSession,
  onOpenOfficialReport,
  isProcessingBatch,
}) => {
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showLiveActivity, setShowLiveActivity] = useState<boolean>(true);

  const filteredSessions = sessions.filter((session) => {
    const course = courses.find((c) => c.id === session.course_id);
    const room = rooms.find((r) => r.id === session.room_id);

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
      const q = searchQuery.toLowerCase();
      const matchCourse = course?.course_code.toLowerCase().includes(q) || course?.course_name.toLowerCase().includes(q);
      const matchRoom = room?.room_code.toLowerCase().includes(q);
      const matchSection = session.section.toLowerCase().includes(q);
      if (!matchCourse && !matchRoom && !matchSection) return false;
    }
    return true;
  });

  const assignedCount = sessions.filter(
    (s) => s.status === 'Confirmed' || s.status === 'Tentatively Assigned'
  ).length;
  const unresolvedCount = sessions.filter((s) => s.status === 'ARA Assignment Required').length;
  const unassignedCount = sessions.filter((s) => s.status === 'Unassigned').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                Engine Control Panel • SRS §19
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Authoritative Scoring Model v2.0
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1 font-serif">
              ASTU Laboratory Session Schedule & Batch Allocation Board
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Processes hard constraints (eligibility, availability, timetable conflicts, workload caps) and authoritative weighted scores.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
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
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
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

        {/* Metric KPI Counter Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Lab Sessions</span>
            <div className="text-xl font-bold text-slate-800 font-mono mt-0.5">{sessions.length}</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">Assigned / Filled</span>
            <div className="text-xl font-bold text-emerald-900 font-mono mt-0.5">
              {assignedCount} <span className="text-xs text-emerald-700 font-normal">({Math.round((assignedCount / sessions.length) * 100 || 0)}%)</span>
            </div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">Unassigned Slots</span>
            <div className="text-xl font-bold text-amber-900 font-mono mt-0.5">{unassignedCount}</div>
          </div>
          <div className="bg-rose-50 rounded-lg p-3 border border-rose-200">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wide">ARA Assignment Required (§16)</span>
            <div className="text-xl font-bold text-rose-900 font-mono mt-0.5">{unresolvedCount}</div>
          </div>
        </div>
      </div>

      {/* Section: Live Activity Feed (SRS §18) */}
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

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search course code, title, room (e.g. CSEg 1104, B-510-R05)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
            />
          </div>

          {/* Block Filter */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedBlockFilter}
              onChange={(e) => setSelectedBlockFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none"
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
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none"
          >
            <option value="all">All Teaching Days</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Tentatively Assigned">Tentatively Assigned</option>
            <option value="Unassigned">Unassigned</option>
            <option value="ARA Assignment Required">ARA Assignment Required</option>
          </select>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'}`}
            title="Table View"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'}`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sessions Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#001733] text-white uppercase text-[11px] font-mono tracking-wider">
                <tr>
                  <th className="py-3 px-4">Course / Lab</th>
                  <th className="py-3 px-4">Room & Block</th>
                  <th className="py-3 px-4">Day & Time</th>
                  <th className="py-3 px-4">Section / Group</th>
                  <th className="py-3 px-4">Required ARAs</th>
                  <th className="py-3 px-4">Assigned Assistant(s)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Decision & Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      No scheduled sessions match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => {
                    const course = courses.find((c) => c.id === session.course_id);
                    const room = rooms.find((r) => r.id === session.room_id);
                    const block = blocks.find((b) => b.id === room?.block_id);
                    const sessionAssignments = assignments.filter((a) => a.session_id === session.id && a.status !== 'Declined');
                    const isSRSBenchmark = session.id === 'session-cseg1104-sec1-grp1';

                    return (
                      <tr 
                        key={session.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSRSBenchmark ? 'bg-amber-50/40 border-l-4 border-amber-500' : ''
                        }`}
                      >
                        {/* Course code & name */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 font-mono">
                            <span>{course?.course_code || session.course_id}</span>
                            {isSRSBenchmark && (
                              <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded font-sans">
                                SRS Benchmark
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {course?.course_name}
                          </div>
                        </td>

                        {/* Room & Block */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-semibold text-sky-800">{room?.room_code}</div>
                          <div className="text-[11px] text-amber-700">{block?.block_code}</div>
                        </td>

                        {/* Schedule Time */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">{session.day_of_week}</div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {session.start_time}–{session.end_time} ({session.duration_hours}h)
                          </div>
                        </td>

                        {/* Section / Group */}
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          <div>{session.section}</div>
                          <div className="text-[11px] text-slate-400">{session.group}</div>
                        </td>

                        {/* Required ARAs (Section 12) */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <Users className="w-3 h-3 text-slate-500" />
                            {session.required_ara_count || 1} {session.required_ara_count > 1 ? 'ARAs' : 'ARA'}
                          </span>
                        </td>

                        {/* Assigned Assistant(s) */}
                        <td className="py-3.5 px-4">
                          {sessionAssignments.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                          ) : (
                            <div className="space-y-1">
                              {sessionAssignments.map((asgn) => {
                                const ara = aras.find((a) => a.id === asgn.ara_id);
                                return (
                                  <div key={asgn.id} className="flex items-center gap-1.5 font-mono text-xs">
                                    <span className="w-5 h-5 rounded bg-[#002147] text-amber-400 text-[10px] font-bold flex items-center justify-center">
                                      {asgn.slot_number}
                                    </span>
                                    <span className="font-bold text-slate-800">
                                      {ara?.ara_code || asgn.ara_id}
                                    </span>
                                    <span className="text-slate-500 truncate max-w-[120px]">
                                      ({ara?.full_name})
                                    </span>
                                    <span className="text-[10px] bg-slate-100 px-1 py-0.2 rounded text-slate-600">
                                      {asgn.source.replace('_', ' ')}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            session.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : session.status === 'Tentatively Assigned'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : session.status === 'ARA Assignment Required'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}>
                            {session.status === 'Confirmed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {session.status === 'ARA Assignment Required' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                            {session.status}
                          </span>
                        </td>

                        {/* Action View Decision */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onSelectSession(session)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-md border border-slate-300 shadow-2xs transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-600" />
                            <span>Explain (§7)</span>
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
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => {
            const course = courses.find((c) => c.id === session.course_id);
            const room = rooms.find((r) => r.id === session.room_id);
            const block = blocks.find((b) => b.id === room?.block_id);
            const sessionAssignments = assignments.filter((a) => a.session_id === session.id && a.status !== 'Declined');
            const isSRSBenchmark = session.id === 'session-cseg1104-sec1-grp1';

            return (
              <div
                key={session.id}
                className={`bg-white rounded-xl shadow-xs border p-4 space-y-3 transition-all hover:shadow-md ${
                  isSRSBenchmark ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {course?.course_code}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1">{course?.course_name}</h3>
                    <span className="text-xs text-slate-500 font-mono">{session.section} • {session.group}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    session.status === 'Confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : session.status === 'Tentatively Assigned'
                      ? 'bg-amber-100 text-amber-800'
                      : session.status === 'ARA Assignment Required'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {session.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg text-xs font-mono space-y-1 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Time:</span>
                    <span className="font-semibold text-slate-800">{session.day_of_week} {session.start_time}–{session.end_time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-semibold text-slate-800">{room?.room_code} ({block?.block_code})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Required:</span>
                    <span className="font-semibold text-slate-800">{session.required_ara_count} ARA slot(s)</span>
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
                        <div key={asgn.id} className="flex items-center justify-between p-1.5 bg-slate-100/80 rounded mb-1 font-mono text-xs">
                          <span className="font-bold text-slate-800">{ara?.ara_code} ({ara?.full_name})</span>
                          <span className="text-[10px] text-slate-500">{asgn.source.replace('_', ' ')}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  onClick={() => onSelectSession(session)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  <span>Explain Decision Breakdown (§7)</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
