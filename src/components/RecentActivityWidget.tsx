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
  Bell
} from 'lucide-react';

export interface ActivityEvent {
  id: string;
  type: 'auto_assignment' | 'admin_override' | 'system_alert';
  title: string;
  description: string;
  timestamp: string;
  araName?: string;
  araCode?: string;
  courseCode?: string;
  roomCode?: string;
  score?: number;
  badgeText: string;
  severity: 'success' | 'warning' | 'danger' | 'info';
  sessionId?: string;
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
  const [filterType, setFilterType] = useState<'all' | 'auto_assignment' | 'admin_override' | 'system_alert'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Combine and synthesize activities into unified chronological feed
  const activityFeed: ActivityEvent[] = useMemo(() => {
    const events: ActivityEvent[] = [];

    // 1. Auto-Assignments from assignments state
    assignments.forEach((asgn) => {
      const sess = sessions.find((s) => s.id === asgn.session_id);
      const ara = aras.find((a) => a.id === asgn.ara_id);
      const course = sess ? courses.find((c) => c.id === sess.course_id) : undefined;
      const room = sess ? rooms.find((r) => r.id === sess.room_id) : undefined;
      const decision = decisionReasons.find((d) => d.session_id === asgn.session_id);

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
        score: decision?.total_score || 185.0,
        badgeText: 'Auto-Assigned',
        severity: 'success',
        sessionId: sess?.id,
      });
    });

    // 2. Administrative Overrides
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

    // 3. System Alerts and Unresolved Sessions
    sessions
      .filter((s) => s.status === 'ARA Assignment Required')
      .forEach((sess, idx) => {
        const course = courses.find((c) => c.id === sess.course_id);
        const room = rooms.find((r) => r.id === sess.room_id);

        events.push({
          id: `act-unres-${sess.id}-${idx}`,
          type: 'system_alert',
          title: `Unresolved Laboratory Slot: ${course?.course_code || 'Course'}`,
          description: `No qualified ARA with matching availability could be assigned without exceeding weekly cap. Requires SOEEC Chair intervention (SRS §16).`,
          timestamp: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
          courseCode: course?.course_code,
          roomCode: room?.room_code,
          badgeText: 'Unresolved Slot',
          severity: 'danger',
          sessionId: sess.id,
        });
      });

    // 4. Important System Notifications
    notifications.forEach((notif) => {
      if (notif.type === 'override' || notif.type === 'confirmation_request' || notif.type === 'rollover') {
        events.push({
          id: `act-notif-${notif.id}`,
          type: notif.type === 'override' ? 'admin_override' : 'system_alert',
          title: notif.title,
          description: notif.message,
          timestamp: notif.timestamp,
          badgeText: notif.type === 'override' ? 'Policy Override' : 'System Alert',
          severity: notif.type === 'override' ? 'warning' : 'info',
        });
      }
    });

    // Sort by timestamp descending
    return events.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [assignments, sessions, courses, rooms, aras, notifications, overrides, decisionReasons]);

  // Filtered by Category and Search
  const filteredEvents = useMemo(() => {
    return activityFeed.filter((evt) => {
      if (filterType !== 'all' && evt.type !== filterType) return false;
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

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header with Title & Live Pulse */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#002147] text-amber-400 flex items-center justify-center shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                Recent Allocation Activity & Live Audit Feed
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                LIVE AUDIT
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Live feed of auto-assignments, administrator overrides, and system constraint alerts (SRS §18)
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filterType === 'all'
                ? 'bg-[#002147] text-amber-300 font-bold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Activity ({activityFeed.length})
          </button>
          <button
            onClick={() => setFilterType('auto_assignment')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filterType === 'auto_assignment'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Auto-Assignments
          </button>
          <button
            onClick={() => setFilterType('admin_override')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filterType === 'admin_override'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-amber-800 hover:bg-amber-50'
            }`}
          >
            Overrides
          </button>
          <button
            onClick={() => setFilterType('system_alert')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filterType === 'system_alert'
                ? 'bg-rose-700 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-rose-800 hover:bg-rose-50'
            }`}
          >
            Alerts
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="px-4 sm:px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter feed by ARA name, room, course code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <span className="text-[11px] text-slate-500 font-mono">
          Showing <strong>{filteredEvents.length}</strong> events
        </span>
      </div>

      {/* Feed List Body */}
      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No recent activity matches the selected filter.
          </div>
        ) : (
          filteredEvents.map((evt) => {
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
                className={`p-3.5 sm:p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 ${
                  evt.sessionId && onSelectSession ? 'cursor-pointer hover:bg-amber-50/40' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Event Icon */}
                  <div className="mt-0.5 shrink-0">
                    {isAuto && (
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    {isOverride && (
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-300 shadow-2xs">
                        <UserCheck className="w-4 h-4" />
                      </div>
                    )}
                    {isAlert && (
                      <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-300 shadow-2xs">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{evt.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded border ${
                          evt.severity === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : evt.severity === 'warning'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : evt.severity === 'danger'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {evt.badgeText}
                      </span>
                      {evt.score !== undefined && (
                        <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                          Score: {evt.score} pts
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(evt.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                      {evt.roomCode && (
                        <span className="flex items-center gap-1 text-slate-600 font-semibold">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {evt.roomCode}
                        </span>
                      )}
                      {evt.courseCode && (
                        <span className="text-[#002147] font-bold font-mono">
                          {evt.courseCode}
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
                    className="shrink-0 text-xs text-[#002147] font-bold hover:text-amber-700 flex items-center gap-0.5 bg-slate-100 hover:bg-amber-50 px-2 py-1 rounded transition-colors"
                    title="View Decision Breakdown Modal"
                  >
                    Inspect <ArrowRight className="w-3 h-3" />
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
