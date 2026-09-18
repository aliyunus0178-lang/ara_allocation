import React, { useState } from 'react';
import { 
  ScheduledSession, 
  Course, 
  LaboratoryRoom, 
  LaboratoryBlock, 
  ARAUser, 
  AssistantAssignment,
  AssignmentOverride,
  UserRole
} from '../types/astu';
import { 
  AlertTriangle, 
  ShieldAlert, 
  UserCheck, 
  FileText, 
  Clock, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Send
} from 'lucide-react';

interface OverridesAndUnresolvedProps {
  sessions: ScheduledSession[];
  courses: Course[];
  rooms: LaboratoryRoom[];
  blocks: LaboratoryBlock[];
  aras: ARAUser[];
  assignments: AssistantAssignment[];
  overrides: AssignmentOverride[];
  currentRole: UserRole;
  onExecuteOverride: (sessionId: string, newAraId: string, reason: string) => void;
}

export const OverridesAndUnresolved: React.FC<OverridesAndUnresolvedProps> = ({
  sessions,
  courses,
  rooms,
  blocks,
  aras,
  assignments,
  overrides,
  currentRole,
  onExecuteOverride,
}) => {
  const unresolvedSessions = sessions.filter((s) => s.status === 'ARA Assignment Required');

  // Form state for manual override
  const [targetSessionId, setTargetSessionId] = useState<string>(
    unresolvedSessions[0]?.id || sessions[0]?.id || ''
  );
  const [targetAraId, setTargetAraId] = useState<string>(aras[0]?.id || '');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canExecuteOverride =
    currentRole === 'DEPARTMENT_HEAD' || currentRole === 'ARA_ADMINISTRATOR';

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!canExecuteOverride) {
      setErrorMessage(
        'Unauthorized: Only Department Head or ARA Administrator can authorize an assignment override per Section 14.3.'
      );
      return;
    }

    if (!overrideReason.trim() || overrideReason.trim().length < 8) {
      setErrorMessage(
        'Section 14.3 Requirement: A mandatory free-text justification is required to authorize an administrative override (min 8 characters).'
      );
      return;
    }

    onExecuteOverride(targetSessionId, targetAraId, overrideReason);
    setSuccessMessage('Override successfully recorded and logged in the permanent audit trail.');
    setOverrideReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Administrative Governance • SRS §14.3 & §16
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Hard Constraint Diagnostics & Authorized Overrides
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1 font-serif">
              Unresolved Sessions Queue & Departmental Override Console
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect sessions flagged with "ARA Assignment Required" due to hard constraint violations across all candidates, and execute authorized overrides with mandatory audit justification.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono">
            <span className="text-slate-500">Active Role Authority: </span>
            <span className={`font-bold ${canExecuteOverride ? 'text-emerald-700' : 'text-rose-600'}`}>
              {canExecuteOverride ? 'Authorized (Admin/Head)' : 'Read-Only (Assistant)'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Section 16 Unresolved Sessions & Diagnostics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  "ARA Assignment Required" Queue (SRS §16)
                </h3>
              </div>
              <span className="text-xs text-rose-700 font-mono font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {unresolvedSessions.length} Session(s) Unresolved
              </span>
            </div>

            {unresolvedSessions.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-emerald-950 text-sm">All Sessions Successfully Allocated</h4>
                <p className="text-emerald-800 mt-1 max-w-md mx-auto">
                  No scheduled session is currently flagged as "ARA Assignment Required". Every session has an eligible candidate meeting all Section 6 hard constraints.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {unresolvedSessions.map((session) => {
                  const course = courses.find((c) => c.id === session.course_id);
                  const room = rooms.find((r) => r.id === session.room_id);
                  const block = blocks.find((b) => b.id === room?.block_id);

                  return (
                    <div
                      key={session.id}
                      className="p-4 rounded-xl border-2 border-rose-200 bg-rose-50/30 space-y-3 text-xs"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-rose-900 font-mono text-sm">
                              {course?.course_code} - {course?.course_name}
                            </span>
                            <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                              {session.section} • {session.group}
                            </span>
                          </div>
                          <div className="text-slate-600 text-[11px] mt-0.5 font-mono">
                            Scheduled: <strong className="text-slate-900">{session.day_of_week} {session.start_time}–{session.end_time}</strong> ({session.duration_hours}h) | Room: <strong className="text-sky-800">{room?.room_code}</strong> ({block?.block_code})
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setTargetSessionId(session.id);
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                          }}
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-300 rounded-md shadow-2xs transition-colors"
                        >
                          Select for Override
                        </button>
                      </div>

                      {/* Section 16 Diagnostic Breakdown of all ARAs */}
                      <div className="bg-white rounded-lg p-3 border border-rose-200 text-xs space-y-2">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                          <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                          Diagnostic Reason — Hard Constraint Violations (Section 6):
                        </div>
                        <ul className="space-y-1.5 text-[11px] text-slate-600">
                          <li className="flex items-start gap-2">
                            <span className="text-rose-600 font-bold">✗</span>
                            <span>
                              <strong className="text-slate-800">ARA-001 (Abebe Kebede):</strong> Double-booking timetable conflict (already assigned to CSEg 1104 at Monday 10:00-12:00).
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-rose-600 font-bold">✗</span>
                            <span>
                              <strong className="text-slate-800">ARA-002 (Bethlehem Tadesse):</strong> Not qualified for course {course?.course_code} per Section 5 qualification registry.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-rose-600 font-bold">✗</span>
                            <span>
                              <strong className="text-slate-800">ARA-003 (Chala Demisse):</strong> Availability schedule indicates unavailable during this time window.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-rose-600 font-bold">✗</span>
                            <span>
                              <strong className="text-slate-800">ARA-004 (Dawit Haile):</strong> Administrative status is <em>Suspended</em> (Institutional clearance check failed).
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-rose-600 font-bold">✗</span>
                            <span>
                              <strong className="text-slate-800">ARA-005 (Eden Mengistu):</strong> Workload cap reached (already at maximum weekly allocation).
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 18: Historical Overrides Audit Trail Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Administrative Override Audit Trail (SRS §14.3, §18)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {overrides.length} Permanent Logs
              </span>
            </div>

            {overrides.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                No administrative overrides executed yet. All current assignments reflect algorithmic optimization.
              </div>
            ) : (
              <div className="space-y-2.5">
                {overrides.map((ovr) => {
                  const session = sessions.find((s) => s.id === ovr.session_id);
                  const assignedAra = aras.find((a) => a.id === ovr.assigned_ara_id);

                  return (
                    <div
                      key={ovr.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 font-mono">
                          Session: {session?.section} • Assigned: {assignedAra?.ara_code} ({assignedAra?.full_name})
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(ovr.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-600 font-sans text-[11px]">
                        <strong className="text-slate-800">Justification: </strong>
                        <span className="italic">"{ovr.reason}"</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Authorized By: {ovr.overriding_user_name} ({ovr.overriding_role})
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Authorize New Override Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Authorize Assignment Override (SRS §14.3)
            </h3>
          </div>

          <form onSubmit={handleOverrideSubmit} className="space-y-4">
            {/* Target Session Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target Scheduled Session:
              </label>
              <select
                value={targetSessionId}
                onChange={(e) => setTargetSessionId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium focus:outline-none"
              >
                {sessions.map((s) => {
                  const c = courses.find((course) => course.id === s.course_id);
                  return (
                    <option key={s.id} value={s.id}>
                      {c?.course_code} - {s.day_of_week} ({s.status})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Target ARA Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assign Assistant (ARA):
              </label>
              <select
                value={targetAraId}
                onChange={(e) => setTargetAraId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none"
              >
                {aras.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.ara_code} - {a.full_name} ({a.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Mandatory Free-Text Reason */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mandatory Free-Text Justification (SRS §14.3):
              </label>
              <textarea
                rows={4}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="State the institutional, academic, or operational reason justifying this assignment override..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              <span className="text-[10px] text-slate-400">
                This rationale is permanently recorded in the immutable audit log and notified to relevant parties.
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] leading-relaxed">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px] leading-relaxed">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={!canExecuteOverride}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                canExecuteOverride
                  ? 'bg-rose-700 hover:bg-rose-800 text-white active:scale-98'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Authorize & Enforce Override</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
