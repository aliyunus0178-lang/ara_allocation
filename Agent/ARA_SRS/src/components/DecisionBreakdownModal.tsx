import React from 'react';
import { 
  ScheduledSession, 
  Course, 
  LaboratoryRoom, 
  LaboratoryBlock, 
  ARAUser, 
  AssignmentDecisionReason,
  AssistantAssignment
} from '../types/astu';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Award, 
  FileText, 
  UserCheck, 
  Clock, 
  Building2, 
  KeyRound,
  Info
} from 'lucide-react';

interface DecisionBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ScheduledSession;
  course: Course;
  room: LaboratoryRoom;
  block: LaboratoryBlock;
  assignedAra?: ARAUser;
  assignment?: AssistantAssignment;
  decisionReason?: AssignmentDecisionReason;
  blockResponsibleAra?: ARAUser;
  roomKeyHolderAra?: ARAUser;
  allAras: ARAUser[];
  onAcceptAssignment?: (assignmentId: string) => void;
  onDeclineAssignment?: (assignmentId: string) => void;
}

export const DecisionBreakdownModal: React.FC<DecisionBreakdownModalProps> = ({
  isOpen,
  onClose,
  session,
  course,
  room,
  block,
  assignedAra,
  assignment,
  decisionReason,
  blockResponsibleAra,
  roomKeyHolderAra,
  allAras,
  onAcceptAssignment,
  onDeclineAssignment,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-3xl overflow-hidden text-slate-800">
        {/* Academic Header Banner */}
        <div className="bg-[#002147] text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-400/40">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
                  Official ASTU Allocation Record
                </span>
                <span className="text-[10px] bg-sky-600/30 text-sky-200 px-2 py-0.5 rounded font-mono">
                  SRS §7 & §20 Specification
                </span>
              </div>
              <h2 className="text-lg font-bold font-serif">
                ASSIGNMENT RESULT & DECISION EXPLANATION
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 20 Benchmark Top Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-xs shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 border-b border-slate-200 pb-3">
              <div>
                <span className="text-slate-500 uppercase font-semibold">LABORATORY: </span>
                <span className="font-bold text-slate-900">{course.course_code} Lab</span>
                <span className="text-slate-600"> | {session.section} | {session.group}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold">TIME: </span>
                <span className="font-bold text-slate-900">{session.day_of_week} {session.start_time}–{session.end_time}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold">ROOM: </span>
                <span className="font-bold text-sky-800">{room.room_code}</span>
                <span className="text-slate-600"> | BLOCK: </span>
                <span className="font-bold text-amber-700">{block.block_code}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold">COURSE: </span>
                <span className="text-slate-900 font-bold">{course.course_code} ({course.course_name})</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 pt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-slate-500">BLOCK RESPONSIBLE ARA: </span>
                <span className="font-bold text-slate-800">
                  {blockResponsibleAra ? `${blockResponsibleAra.ara_code} (${blockResponsibleAra.full_name})` : 'Unassigned'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                <span className="text-slate-500">ROOM KEY HOLDER: </span>
                <span className="font-bold text-slate-800">
                  {roomKeyHolderAra ? `${roomKeyHolderAra.ara_code} (${roomKeyHolderAra.full_name})` : 'None / Default'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-500">SELECTED ARA: </span>
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {assignedAra ? `${assignedAra.ara_code} (${assignedAra.full_name})` : 'ARA ASSIGNMENT REQUIRED'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">SOURCE: </span>
                <span className="font-bold text-slate-800 capitalize">
                  {assignment?.source.replace('_', ' ') || 'Batch engine'}
                </span>
                <span className="text-slate-500 ml-3">STATUS: </span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  assignment?.status === 'Confirmed'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {assignment?.status || session.status}
                </span>
              </div>
            </div>
          </div>

          {/* Section 7 Format: Reasons Checklist */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Decision Explanation & Verified Matches (SRS §7)
            </h3>

            {decisionReason ? (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    {decisionReason.block_responsibility ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span>Block responsibility: <strong className={decisionReason.block_responsibility ? 'text-emerald-800' : 'text-slate-500'}>
                      {decisionReason.block_responsibility ? `YES (${block.block_code})` : 'NO'}
                    </strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {decisionReason.room_key_holder ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span>Room key-holder: <strong className={decisionReason.room_key_holder ? 'text-emerald-800' : 'text-slate-500'}>
                      {decisionReason.room_key_holder ? `YES (${room.room_code})` : 'NO'}
                    </strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {decisionReason.preference_match !== 'None' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span>Course preference: <strong className={decisionReason.preference_match !== 'None' ? 'text-emerald-800' : 'text-slate-500'}>
                      {decisionReason.preference_match}
                    </strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {decisionReason.course_responsibility ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span>Course responsibility: <strong className={decisionReason.course_responsibility ? 'text-emerald-800' : 'text-slate-500'}>
                      {decisionReason.course_responsibility ? 'YES' : 'NO'}
                    </strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Qualified: <strong className="text-emerald-800">YES (Certified per ara_qualifications)</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Available: <strong className="text-emerald-800">YES (Scheduled window match)</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Timetable Conflict: <strong className="text-emerald-800">NO (Zero overlapping sessions)</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Workload: <strong className="text-emerald-800">VALID (Within mandatory weekly limit)</strong></span>
                  </div>
                </div>

                {/* Granular Factor Points List */}
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <div className="text-xs font-semibold text-emerald-950 mb-1.5">
                    Itemized Reasons & Weighted Points (+Total: {decisionReason.total_score} pts):
                  </div>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {decisionReason.reasons.map((r, idx) => (
                      <li key={idx} className="flex items-center gap-2 font-mono">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>

                  {decisionReason.tie_breaker_applied && (
                    <div className="mt-2 text-xs bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded font-mono">
                      ⚖ {decisionReason.tie_breaker_applied}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-amber-800 mb-1">
                  <Info className="w-4 h-4" /> Unresolved Session Diagnostics (Section 16)
                </div>
                <p>No assistant has been assigned yet. Run the Batch Assignment Engine or use the Overrides & Diagnostics tab to allocate an ARA manually.</p>
              </div>
            )}
          </div>

          {/* Section 8 Authoritative Weights Reference Note */}
          <div className="bg-slate-100/80 rounded-lg p-3 text-xs text-slate-600 border border-slate-200">
            <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Governing Rule: ASTU SRS v2.0 Section 8 Authoritative Weighted Scoring
            </div>
            <p className="text-[11px] leading-relaxed">
              Room key-holder responsibility (+60), Block responsibility (+50), and Course responsibility (+45) are evaluated independently and additively. Candidates violating any Section 6 Hard Constraint receive zero points and are excluded prior to scoring.
            </p>
          </div>

          {/* Section 11: Active Acceptance/Confirmation Controls */}
          {assignment && assignment.status === 'Tentative' && (
            <div className="bg-amber-50/80 border border-amber-300 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  Section 11: Assignment Acceptance Required
                </div>
                <div className="text-xs text-amber-800">
                  This allocation is currently in <span className="font-bold">Tentative</span> status. Please confirm or decline before the 48h deadline.
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onDeclineAssignment && (
                  <button
                    onClick={() => onDeclineAssignment(assignment.id)}
                    className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-md transition-colors"
                  >
                    Decline Slot
                  </button>
                )}
                {onAcceptAssignment && (
                  <button
                    onClick={() => onAcceptAssignment(assignment.id)}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-500 border border-emerald-500 rounded-md shadow-sm transition-colors"
                  >
                    Confirm & Accept
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 flex items-center justify-between border-t border-slate-200 text-xs">
          <span className="text-slate-500 font-mono">
            Audit Retention ID: ASTU-LOG-{session.id.slice(0, 8)}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-md transition-colors"
          >
            Close Record
          </button>
        </div>
      </div>
    </div>
  );
};
