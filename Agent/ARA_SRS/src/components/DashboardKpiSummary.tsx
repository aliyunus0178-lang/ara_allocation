import React from 'react';
import { 
  ScheduledSession, 
  AssistantAssignment, 
  ARAUser, 
  LaboratoryRoom,
  AssignmentDecisionReason,
  AssignmentOverride
} from '../types/astu';
import { 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  KeyRound,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';

interface DashboardKpiSummaryProps {
  sessions: ScheduledSession[];
  assignments: AssistantAssignment[];
  aras: ARAUser[];
  rooms: LaboratoryRoom[];
  decisionReasons?: AssignmentDecisionReason[];
  overrides?: AssignmentOverride[];
  onFilterByStatus?: (status: string) => void;
}

export const DashboardKpiSummary: React.FC<DashboardKpiSummaryProps> = ({
  sessions,
  assignments,
  aras,
  rooms,
  overrides = [],
  onFilterByStatus
}) => {
  // 1. Total Scheduled Laboratory Hours
  const totalScheduledHours = sessions.reduce((acc, s) => acc + (s.duration_hours || 2), 0);

  // 2. Active non-declined assignments
  const activeAssignments = assignments.filter((a) => a.status !== 'Declined');

  // 3. Total Assigned Hours
  const totalAssignedHours = sessions
    .filter((s) => s.status === 'Confirmed' || s.status === 'Tentatively Assigned')
    .reduce((acc, s) => acc + (s.duration_hours || 2), 0);

  // 4. Utilization Rate %
  const utilizationRate = totalScheduledHours > 0 
    ? Math.round((totalAssignedHours / totalScheduledHours) * 100) 
    : 0;

  // 5. Pending Approvals / Unassigned / Required
  const pendingApprovalsCount = sessions.filter(
    (s) => s.status === 'ARA Assignment Required' || s.status === 'Tentatively Assigned'
  ).length;

  const confirmedSessionsCount = sessions.filter((s) => s.status === 'Confirmed').length;
  const unassignedCount = sessions.filter((s) => s.status === 'Unassigned').length;

  // 6. Total ARA Pool Capacity
  const totalAraPoolCapacityHours = aras
    .filter((a) => a.status === 'Active')
    .reduce((acc, a) => acc + (a.max_weekly_hours || 12), 0);

  const araCapacityUsagePercent = totalAraPoolCapacityHours > 0
    ? Math.round((totalAssignedHours / totalAraPoolCapacityHours) * 100)
    : 0;

  // 7. Designated Key-Holder Coverage
  const roomsWithSessions = Array.from(new Set(sessions.map((s) => s.room_id)));
  const roomsWithAssignedKeyHolder = roomsWithSessions.filter((roomId) => {
    const room = rooms.find((r) => r.id === roomId);
    return aras.some((a) => a.assigned_rooms_summary && room && a.assigned_rooms_summary.includes(room.room_code));
  }).length;

  const keyHolderCoveragePercent = roomsWithSessions.length > 0
    ? Math.round((roomsWithAssignedKeyHolder / roomsWithSessions.length) * 100)
    : 100;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-5 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            Allocation Intelligence & Top-Level Operational KPIs
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time aggregate performance metrics evaluated against ASTU academic constraints (SRS §6, §12, §16)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
            Active ARAs: <strong>{aras.filter((a) => a.status === 'Active').length}</strong>
          </span>
          <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-md border border-amber-300 dark:border-amber-700/50">
            Overrides: <strong>{overrides.length}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {/* KPI 1: Total Assigned Hours */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/70 relative overflow-hidden group hover:border-amber-400/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Total Assigned Hours
            </span>
            <span className="text-[10px] font-mono font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              Weekly
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {totalAssignedHours}h
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              / {totalScheduledHours}h total
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, utilizationRate)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
            <span>Pool Cap: {totalAraPoolCapacityHours}h</span>
            <span>{araCapacityUsagePercent}% Pool Load</span>
          </div>
        </div>

        {/* KPI 2: Utilization Rate % */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/70 relative overflow-hidden group hover:border-emerald-400/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Utilization Rate %
            </span>
            <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
              {utilizationRate >= 80 ? 'Optimal' : 'In Progress'}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${
              utilizationRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {utilizationRate}%
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              fulfillment
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, utilizationRate)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
            <span>{confirmedSessionsCount} Confirmed Sessions</span>
            <span>{unassignedCount} Open</span>
          </div>
        </div>

        {/* KPI 3: Pending Approvals & Unresolved */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/70 relative overflow-hidden group hover:border-rose-400/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              Pending Approvals (§16)
            </span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              pendingApprovalsCount > 0 
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700 animate-pulse'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
            }`}>
              {pendingApprovalsCount > 0 ? 'Action Req.' : 'Clear'}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${
              pendingApprovalsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}>
              {pendingApprovalsCount}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              sessions flagged
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (pendingApprovalsCount / (sessions.length || 1)) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
            <span>Requires Dept Head / Override</span>
            {onFilterByStatus && (
              <button 
                onClick={() => onFilterByStatus('ARA Assignment Required')}
                className="text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
              >
                View Slots →
              </button>
            )}
          </div>
        </div>

        {/* KPI 4: Key-Holder & Facility Coverage */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/70 relative overflow-hidden group hover:border-purple-400/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Key-Holder Custody (§3)
            </span>
            <span className="text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-300 dark:border-purple-700">
              {keyHolderCoveragePercent}%
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-400 font-mono">
              {roomsWithAssignedKeyHolder} / {roomsWithSessions.length}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              active rooms
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${keyHolderCoveragePercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
            <span>Custody Assigned</span>
            <span className="text-slate-600 dark:text-slate-300">Blocks B-510, B-509, B-517</span>
          </div>
        </div>
      </div>
    </div>
  );
};
