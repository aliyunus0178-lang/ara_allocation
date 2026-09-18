import React, { useState, useMemo } from 'react';
import { 
  AssistantAssignment, 
  ScheduledSession, 
  Course, 
  LaboratoryRoom, 
  ARAUser, 
  SystemNotification, 
  AssignmentOverride,
  AssignmentDecisionReason 
} from '../types/astu';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  UserCheck, 
  Clock, 
  Filter, 
  Search, 
  Building2, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Bell,
  AlertOctagon
} from 'lucide-react';

export interface ActivityEvent {
  id: string;
  type: 'auto_assignment' | 'admin_override' | 'system_alert' | 'critical_warning';
  title: string;
  description: string;
  timestamp: string;
  araName?: string;
  araCode?: string;
  courseCode?: string;
  roomCode?: string;
  score?: number;
  badgeText: string;
  severity: 'critical' | 'danger' | 'warning' | 'success' | 'info';
  sessionId?: string;
  isConcurrentViolation?: boolean;
}

interface RecentActivityWidgetProps {
  assignments: AssistantAssignment[];
  sessions: ScheduledSession[];
  courses: Course[];
  rooms: LaboratoryRoom[];
  aras: ARAUser[];
  notifications: SystemNotification[];
  overrides: AssignmentOverride[];
  decisionReasons: AssignmentDecisionReason[];
  onSelectSession?: (session: ScheduledSession) => void;
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  assignments,
  sessions,
  courses,
  rooms,
  aras,
  notifications,
  overrides,
  decisionReasons,
  onSelectSession,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'critical_warning' | 'auto_assignment' | 'admin_override' | 'system_alert'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Helper to parse HH:MM to minutes
  const timeToMinutes = (t: string) => {
    const [h, m] = (t || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Combine and synthesize activities into unified chronological feed with Critical Warning detection
  const activityFeed: ActivityEvent[] = useMemo(() => {
    const events: ActivityEvent[] = [];

    // 1. Critical Concurrency & Overlap Scanner (Scans active assignments for any simultaneous double-booking)
    aras.forEach((ara) => {
      const activeAraAssignments = assignments.filter(
        (a) => a.ara_id === ara.id && a.status !== 'Declined'
      );
      const assignedSessions = activeAraAssignments
        .map((a) => sessions.find((s) => s.id === a.session_id))
        .filter(Boolean) as ScheduledSession[];

      for (let i = 0; i < assignedSessions.length; i++) {
        for (let j = i + 1; j < assignedSessions.length; j++) {
          const s1 = assignedSessions[i];
          const s2 = assignedSessions[j];
          if (s1.day_of_week === s2.day_of_week) {
            const start1 = timeToMinutes(s1.start_time);
            const end1 = timeToMinutes(s1.end_time);
            const start2 = timeToMinutes(s2.start_time);
            const end2 = timeToMinutes(s2.end_time);

            // Overlap condition
            if (Math.max(start1, start2) < Math.min(end1, end2)) {
              const c1 = courses.find((c) => c.id === s1.course_id);
              const c2 = courses.find((c) => c.id === s2.course_id);
              const r1 = rooms.find((r) => r.id === s1.room_id);
              const r2 = rooms.find((r) => r.id === s2.room_id);

              const hasOverride = overrides.some(
                (ovr) => ovr.assigned_ara_id === ara.id && (ovr.session_id === s1.id || ovr.session_id === s2.id)
              );

              events.push({
                id: `act-crit-${ara.id}-${s1.id}-${s2.id}`,
                type: 'critical_warning',
                title: `CRITICAL CONCURRENCY VIOLATION: ${ara.full_name} (${ara.ara_code})`,
                description: `Assistant has been allocated to 2 simultaneous laboratory sessions on ${s1.day_of_week} (${c1?.course_code || 'Course 1'} in ${r1?.room_code || 'Lab 1'} @ ${s1.start_time}–${s1.end_time} AND ${c2?.course_code || 'Course 2'} in ${r2?.room_code || 'Lab 2'} @ ${s2.start_time}–${s2.end_time})${hasOverride ? ' despite manual override authorization.' : '.'} Immediate resolution required.`,
                timestamp: new Date().toISOString(),
                araName: ara.full_name,
                araCode: ara.ara_code,
                courseCode: `${c1?.course_code || ''} & ${c2?.course_code || ''}`,
                roomCode: `${r1?.room_code || ''} / ${r2?.room_code || ''}`,
                badgeText: 'CRITICAL WARNING',
                severity: 'critical',
                sessionId: s1.id,
                isConcurrentViolation: true,
              });
            }
          }
        }
      }
    });

    // 2. Auto-Assignments from assignments state
    assignments.forEach((asgn) => {
      const sess = sessions.find((s) => s.id === asgn.session_id);
      const ara = aras.find((a) => a.id === asgn.ara_id);
      const course = sess ? courses.find((c) => c.id === sess.course_id) : undefined;
      const room = sess ? rooms.find((r) => r.id === sess.room_id) : undefined;
      const decision = decisionReasons.find((d) => d.session_id === asgn.session_id);

      if (asgn.source === 'authorized_override' || asgn.source === 'manual_admin') {
        // Handled in overrides or manual below
        return;
      }

      events.push({
        id: `act-asgn-${asgn.id}`,
        type: 'auto_assignment',
        title: `Auto-Assigned: ${ara?.full_name || 'Assistant'}`,
        description: `Successfully allocated to ${course?.course_code || 'Course'} (${sess?.section || 'Sec 1'}) in ${room?.room_code || 'Laboratory'} on ${sess?.day_of_week || 'Schedule'} (${sess?.start_time} - ${sess?.end_time}).`,
        timestamp: asgn.assigned_at || new Date().toISOString(),
        araName: ara?.full_name,
        araCode: ara?.ara_code,
        courseCode: course?.course_code,
        roomCode: room?.room_code,
        score: decision?.total_score ? Math.round(decision.total_score * 10) / 10 : 185.0,
        badgeText: 'Auto-Assigned',
        severity: 'success',
        sessionId: sess?.id,
      });
    });

    // 3. Administrative Overrides
    overrides.forEach((ovr) => {
      const sess = sessions.find((s) => s.id === ovr.session_id);
      const ara = aras.find((a) => a.id === ovr.assigned_ara_id);
      const course = sess ? courses.find((c) => c.id === sess.course_id) : undefined;
      const room = sess ? rooms.find((r) => r.id === sess.room_id) : undefined;

      events.push({
        id: `act-ovr-${ovr.id}`,
        type: 'admin_override',
        title: `Administrative Override by ${ovr.overriding_user_name}`,
        description: `Manually assigned ${ara?.full_name || 'ARA'} to ${course?.course_code || 'Course'} in ${room?.room_code || 'Room'}. Justification: "${ovr.reason}" (SRS §14).`,
        timestamp: ovr.created_at,
        araName: ara?.full_name,
        araCode: ara?.ara_code,
        courseCode: course?.course_code,
        roomCode: room?.room_code,
        badgeText: 'Admin Override',
        severity: 'warning',
        sessionId: sess?.id,
      });
    });

    // 4. System Alerts and Unresolved Sessions
    sessions
      .filter((s) => s.status === 'ARA Assignment Required')
      .forEach((sess, idx) => {
        const course = courses.find((c) => c.id === sess.course_id);
        const room = rooms.find((r) => r.id === sess.room_id);

        events.push({
          id: `act-unres-${sess.id}-${idx}`,
          type: 'system_alert',
          title: `ARA Assignment Required: ${course?.course_code || 'Course'} (${sess.section})`,
          description: `No qualified ARA available at ${sess.day_of_week} ${sess.start_time}-${sess.end_time} in ${room?.room_code || 'Lab'} without capacity breach. Requires optimization or Bulk Resolve (SRS §16).`,
          timestamp: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
          courseCode: course?.course_code,
          roomCode: room?.room_code,
          badgeText: 'Assignment Required',
          severity: 'danger',
          sessionId: sess.id,
        });
      });

    // 5. Important System Notifications
    notifications.forEach((notif) => {
      if (notif.type === 'override' || notif.type === 'confirmation_request' || notif.type === 'rollover') {
        const isCritical = notif.message.toLowerCase().includes('collision') || notif.message.toLowerCase().includes('concurren');
        events.push({
          id: `act-notif-${notif.id}`,
          type: isCritical ? 'critical_warning' : notif.type === 'override' ? 'admin_override' : 'system_alert',
          title: notif.title,
          description: notif.message,
          timestamp: notif.timestamp,
          badgeText: isCritical ? 'CRITICAL WARNING' : notif.type === 'override' ? 'Policy Override' : 'System Alert',
          severity: isCritical ? 'critical' : notif.type === 'override' ? 'warning' : 'info',
        });
      }
    });

    // Sort by timestamp descending, prioritizing critical warnings
    return events.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (b.severity === 'critical' && a.severity !== 'critical') return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [assignments, sessions, courses, rooms, aras, notifications, overrides, decisionReasons]);

  // Filtered by Category and Search
  const filteredEvents = useMemo(() => {
    return activityFeed.filter((evt) => {
      if (filterType === 'critical_warning') {
        if (evt.severity !== 'critical' && evt.type !== 'critical_warning') return false;
      } else if (filterType !== 'all' && evt.type !== filterType) {
        return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = evt.title.toLowerCase().includes(q);
        const matchDesc = evt.description.toLowerCase().includes(q);
        const matchAra = evt.araName?.toLowerCase().includes(q) || evt.araCode?.toLowerCase().includes(q);
        const matchCourse = evt.courseCode?.toLowerCase().includes(q);
        const matchRoom = evt.roomCode?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAra && !matchCourse && !matchRoom) return false;
      }
      return true;
    });
  }, [activityFeed, filterType, searchQuery]);

  const criticalCount = activityFeed.filter((e) => e.severity === 'critical').length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors" id="recent-activity-widget">
      {/* Header with Title & Live Pulse */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#002147] text-amber-400 flex items-center justify-center shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif">
                Recent Allocation Activity & Live Audit Feed
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-2 py-0.2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                LIVE AUDIT
              </span>
              {criticalCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 px-2 py-0.2 rounded-full animate-pulse">
                  <AlertOctagon className="w-3 h-3 text-rose-600" />
                  {criticalCount} Critical
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Real-time audit feed tracking auto-allocations, administrative overrides, and critical system constraint violations (SRS §18)
            </p>
          </div>
        </div>

        {/* Filter Pills with Critical Warning Option */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filterType === 'all'
                ? 'bg-[#002147] text-amber-300 font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Activity ({activityFeed.length})
          </button>

          {criticalCount > 0 && (
            <button
              onClick={() => setFilterType('critical_warning')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                filterType === 'critical_warning'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              Critical Warnings ({criticalCount})
            </button>
          )}

          <button
            onClick={() => setFilterType('auto_assignment')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filterType === 'auto_assignment'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50'
            }`}
          >
            Auto-Assignments
          </button>
          <button
            onClick={() => setFilterType('admin_override')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filterType === 'admin_override'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-amber-800 dark:text-amber-400 hover:bg-amber-50'
            }`}
          >
            Overrides
          </button>
          <button
            onClick={() => setFilterType('system_alert')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filterType === 'system_alert'
                ? 'bg-indigo-700 text-white font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Required Slots
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="px-4 sm:px-5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter feed by ARA name, room, course code, conflict reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          Showing <strong>{filteredEvents.length}</strong> events
        </span>
      </div>

      {/* Feed List Body */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No recent activity matches the selected filter.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isCritical = evt.severity === 'critical' || evt.type === 'critical_warning';
            const isAuto = evt.type === 'auto_assignment';
            const isOverride = evt.type === 'admin_override';
            const isAlert = evt.type === 'system_alert';

            return (
              <div
                key={evt.id}
                onClick={() => {
                  if (evt.sessionId && onSelectSession) {
                    const sess = sessions.find((s) => s.id === evt.sessionId);
                    if (sess) onSelectSession(sess);
                  }
                }}
                className={`p-3.5 sm:p-4 transition-all flex items-start justify-between gap-3 ${
                  isCritical
                    ? 'bg-rose-50/90 dark:bg-rose-950/40 border-l-4 border-l-rose-600 hover:bg-rose-100/80 dark:hover:bg-rose-950/60'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                } ${evt.sessionId && onSelectSession ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Event Icon */}
                  <div className="mt-0.5 shrink-0">
                    {isCritical ? (
                      <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center border border-rose-700 shadow-sm animate-pulse">
                        <AlertOctagon className="w-4 h-4 text-white" />
                      </div>
                    ) : isAuto ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : isOverride ? (
                      <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-300 dark:border-amber-800 shadow-2xs">
                        <UserCheck className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 flex items-center justify-center border border-rose-300 dark:border-rose-800 shadow-2xs">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-bold text-xs ${
                        isCritical 
                          ? 'text-rose-900 dark:text-rose-200' 
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {evt.title}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          isCritical
                            ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                            : evt.severity === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : evt.severity === 'warning'
                            ? 'bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : evt.severity === 'danger'
                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {evt.badgeText}
                      </span>

                      {evt.score !== undefined && (
                        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                          Score: {evt.score} pts
                        </span>
                      )}
                    </div>

                    <p className={`text-xs leading-relaxed ${
                      isCritical 
                        ? 'text-rose-950 dark:text-rose-200 font-medium' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {evt.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-mono pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(evt.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                      {evt.roomCode && (
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {evt.roomCode}
                        </span>
                      )}
                      {evt.courseCode && (
                        <span className="text-[#002147] dark:text-amber-400 font-bold font-mono">
                          {evt.courseCode}
                        </span>
                      )}
                      {evt.araName && (
                        <span className="text-slate-500">
                          ARA: {evt.araName} ({evt.araCode})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optional Click Action to Inspect */}
                {evt.sessionId && onSelectSession && (
                  <button
                    onClick={() => {
                      const sess = sessions.find((s) => s.id === evt.sessionId);
                      if (sess) onSelectSession(sess);
                    }}
                    className={`shrink-0 text-xs font-bold flex items-center gap-0.5 px-2.5 py-1 rounded transition-colors ${
                      isCritical
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'text-[#002147] dark:text-amber-400 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700'
                    }`}
                    title="View Decision Breakdown & Conflict Diagnostics"
                  >
                    {isCritical ? 'Resolve Conflict' : 'Inspect'} <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
