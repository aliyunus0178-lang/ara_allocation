import React, { useState, useEffect } from 'react';
import {
  LaboratoryRoom,
  LaboratoryBlock,
  ARAUser,
  ScheduledSession,
  AssistantAssignment,
  ARARoomResponsibility,
  UserRole,
} from '../types/astu';
import {
  Wrench,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2,
  AlertTriangle,
  X,
  Save,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { RoomContentionData } from './LaboratoryBlockConflictHeatmap';

interface RoomAllocationFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: LaboratoryRoom;
  block?: LaboratoryBlock;
  contentionData?: RoomContentionData;
  aras: ARAUser[];
  sessions: ScheduledSession[];
  assignments: AssistantAssignment[];
  roomResponsibilities: ARARoomResponsibility[];
  currentRole?: UserRole;
  onUpdateRoomResponsibility?: (resp: ARARoomResponsibility) => void;
  onAssignAraToSession?: (sessionId: string, araId: string, isOverride?: boolean, reason?: string) => void;
}

export const RoomAllocationFixModal: React.FC<RoomAllocationFixModalProps> = ({
  isOpen,
  onClose,
  room,
  block,
  contentionData,
  aras,
  sessions,
  assignments,
  roomResponsibilities,
  currentRole = 'ARA_ADMINISTRATOR',
  onUpdateRoomResponsibility,
  onAssignAraToSession,
}) => {
  const roomSessions = sessions.filter((s) => s.room_id === room.id);

  // Current Key Holder State
  const currentResp = roomResponsibilities.find(
    (r) => r.room_id === room.id && r.status === 'Active'
  );

  const [selectedKeyHolderAraId, setSelectedKeyHolderAraId] = useState<string>(
    currentResp?.ara_id || ''
  );
  const [isMandatory, setIsMandatory] = useState<boolean>(
    currentResp?.is_mandatory ?? true
  );

  // Session Assignments Map: sessionId -> araId
  const [sessionAssignments, setSessionAssignments] = useState<Record<string, string>>({});
  const [overrideReasons, setOverrideReasons] = useState<Record<string, string>>({});
  const [isOverrideEnabled, setIsOverrideEnabled] = useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync state on open or room change
  useEffect(() => {
    if (isOpen) {
      setSelectedKeyHolderAraId(currentResp?.ara_id || '');
      setIsMandatory(currentResp?.is_mandatory ?? true);
      setSaveSuccess(false);

      const initialMap: Record<string, string> = {};
      const overrideMap: Record<string, boolean> = {};
      const reasonMap: Record<string, string> = {};

      roomSessions.forEach((s) => {
        const asgn = assignments.find(
          (a) => a.session_id === s.id && a.status !== 'Declined'
        );
        if (asgn) {
          initialMap[s.id] = asgn.ara_id;
        } else {
          initialMap[s.id] = '';
        }
        overrideMap[s.id] = false;
        reasonMap[s.id] = `Administrative reallocation by ${
          currentRole === 'DEPARTMENT_HEAD' ? 'Department Head' : 'Administrator'
        } to resolve room contention.`;
      });

      setSessionAssignments(initialMap);
      setIsOverrideEnabled(overrideMap);
      setOverrideReasons(reasonMap);
    }
  }, [isOpen, room.id, currentResp?.ara_id, currentResp?.is_mandatory]);

  if (!isOpen) return null;

  const handleQuickAutoAssign = () => {
    // If key holder selected, prioritize them for uncovered sessions or distribute to available ARAs
    const updatedMap = { ...sessionAssignments };
    const availableAras = aras.filter((a) => a.status === 'Active');

    roomSessions.forEach((s, idx) => {
      if (!updatedMap[s.id]) {
        if (selectedKeyHolderAraId && idx % 2 === 0) {
          updatedMap[s.id] = selectedKeyHolderAraId;
        } else {
          const matchedAra = availableAras[idx % availableAras.length];
          if (matchedAra) {
            updatedMap[s.id] = matchedAra.id;
          }
        }
      }
    });

    setSessionAssignments(updatedMap);
  };

  const handleSaveAll = () => {
    // 1. Update Key Holder / Room Custody
    if (onUpdateRoomResponsibility && selectedKeyHolderAraId) {
      const respId = currentResp?.id || `rr-${room.id}-${Date.now()}`;
      const newResp: ARARoomResponsibility = {
        id: respId,
        room_id: room.id,
        ara_id: selectedKeyHolderAraId,
        responsibility_type: 'ROOM_KEY_HOLDER',
        is_primary: true,
        is_mandatory: isMandatory,
        start_date: currentResp?.start_date || '2026-09-01',
        end_date: currentResp?.end_date || '2027-02-15',
        academic_year: currentResp?.academic_year || '2026/2027',
        semester: currentResp?.semester || 'Semester I',
        status: 'Active',
      };
      onUpdateRoomResponsibility(newResp);
    }

    // 2. Update Session Assignments
    if (onAssignAraToSession) {
      Object.entries(sessionAssignments).forEach(([sessionId, araId]) => {
        if (araId) {
          const override = isOverrideEnabled[sessionId] || false;
          const reason = overrideReasons[sessionId] || 'Administrative assignment resolution';
          onAssignAraToSession(sessionId, araId, override, reason);
        }
      });
    }

    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const selectedKeyHolderUser = aras.find((a) => a.id === selectedKeyHolderAraId);

  return (
    <div
      id="room-allocation-fix-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="room-allocation-fix-modal-container"
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 transition-all"
      >
        {/* Modal Header */}
        <div className="bg-[#002147] text-white p-5 flex items-start justify-between gap-4 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-mono font-bold shadow-md">
              <Wrench className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                  Administrative Conflict Resolution
                </span>
                <span className="text-[10px] bg-amber-400/20 text-amber-200 border border-amber-400/40 px-2 py-0.5 rounded font-mono font-bold">
                  {currentRole === 'DEPARTMENT_HEAD' ? 'Department Head Authorized' : 'Admin Mode'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-white mt-0.5">
                Fix Allocation & Key Custody — {room.room_code}
              </h2>
              <p className="text-xs text-slate-300 font-sans">
                {room.room_name} • {block?.block_code || 'SOEEC Block'} (Capacity: {room.capacity} seats)
              </p>
            </div>
          </div>

          <button
            id="close-room-allocation-fix-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Contention Summary Callout */}
          {contentionData && (
            <div
              className={`p-3.5 rounded-xl border flex items-start justify-between gap-4 ${
                contentionData.contentionLevel === 'Critical'
                  ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                  : contentionData.contentionLevel === 'Moderate'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : contentionData.contentionLevel === 'Uncovered'
                  ? 'bg-purple-50/70 border-purple-200 text-purple-950'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs">
                    Current Contention Level: {contentionData.contentionLevel} ({contentionData.contentionScore}/100)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 border border-current font-bold">
                    Ratio {contentionData.sessionToAraRatio}:1
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {contentionData.recommendation}
                </p>
              </div>

              <button
                type="button"
                onClick={handleQuickAutoAssign}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-[#002147] dark:text-amber-300 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs hover:bg-amber-50 font-bold text-xs active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Auto-Fill Gaps</span>
              </button>
            </div>
          )}

          {/* Section 1: Room Key Custodian & Custody Administration */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                  1. Laboratory Key Custodian (Responsible ARA)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                SRS §3 & §14 Weight: +60 pts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Designated Room Key Holder / Custodian:
                </label>
                <select
                  value={selectedKeyHolderAraId}
                  onChange={(e) => setSelectedKeyHolderAraId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-medium focus:ring-2 focus:ring-amber-500 text-xs"
                >
                  <option value="">-- No Key Custodian Appointed (Vacant) --</option>
                  {aras.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name} ({a.ara_code}) • Load: {a.current_weekly_hours}h / {a.max_weekly_hours}h
                      {a.is_sara ? ' [SARA]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2 sm:pt-4">
                <label className="relative flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#002147] focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                      Enforce Mandatory Rule (+60 pts)
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Strict Section 14 physical lock-holder priority
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {selectedKeyHolderUser && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#002147] text-amber-400 font-bold flex items-center justify-center font-mono text-[10px]">
                    {selectedKeyHolderUser.avatar_initials}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {selectedKeyHolderUser.full_name} ({selectedKeyHolderUser.ara_code})
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {selectedKeyHolderUser.email} • {selectedKeyHolderUser.phone}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span
                    className={`font-bold ${
                      selectedKeyHolderUser.current_weekly_hours >= selectedKeyHolderUser.max_weekly_hours
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {selectedKeyHolderUser.current_weekly_hours}h / {selectedKeyHolderUser.max_weekly_hours}h cap
                  </span>
                  <div className="text-[9px] text-slate-400">Current Load</div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Scheduled Laboratory Sessions Reallocation */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                  2. Scheduled Laboratory Sessions & Assistant Coverage ({roomSessions.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Direct Admin Assignment & Overrides
              </span>
            </div>

            {roomSessions.length === 0 ? (
              <p className="text-slate-400 text-center py-4 italic">
                No laboratory sessions currently scheduled in this room.
              </p>
            ) : (
              <div className="space-y-3">
                {roomSessions.map((session) => {
                  const assignedAraId = sessionAssignments[session.id] || '';
                  const assignedUser = aras.find((a) => a.id === assignedAraId);
                  const isOverride = isOverrideEnabled[session.id] || false;

                  return (
                    <div
                      key={session.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#002147] dark:text-amber-400 font-mono">
                            {session.day_of_week}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {session.start_time} - {session.end_time} ({session.duration_hours || 2}h)
                          </span>
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                            {session.course_id.replace('course-', '').toUpperCase()} ({session.section})
                          </span>
                        </div>

                        {assignedUser ? (
                          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Assigned: {assignedUser.full_name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-bold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Unallocated / ARA Required
                          </span>
                        )}
                      </div>

                      {/* Dropdown Selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-8">
                          <select
                            value={assignedAraId}
                            onChange={(e) =>
                              setSessionAssignments((prev) => ({
                                ...prev,
                                [session.id]: e.target.value,
                              }))
                            }
                            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-md p-1.5 text-xs font-medium focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="">-- Select ARA to Assign --</option>
                            {aras.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.full_name} ({a.ara_code}) • {a.current_weekly_hours}h load
                                {a.id === selectedKeyHolderAraId ? ' [Room Key Custodian]' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-4 flex items-center justify-end gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-600 dark:text-slate-400">
                            <input
                              type="checkbox"
                              checked={isOverride}
                              onChange={(e) =>
                                setIsOverrideEnabled((prev) => ({
                                  ...prev,
                                  [session.id]: e.target.checked,
                                }))
                              }
                              className="w-3.5 h-3.5 rounded text-amber-600"
                            />
                            <span>Admin Override</span>
                          </label>
                        </div>
                      </div>

                      {/* Override Justification Input if enabled */}
                      {isOverride && (
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                          <input
                            type="text"
                            placeholder="Mandatory justification note for administrative override..."
                            value={overrideReasons[session.id] || ''}
                            onChange={(e) =>
                              setOverrideReasons((prev) => ({
                                ...prev,
                                [session.id]: e.target.value,
                              }))
                            }
                            className="w-full bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded p-1.5 text-[11px]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Updates are audited under ASTU Academic Compliance standards (SRS §18).</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="cancel-room-fix-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              id="save-room-fix-btn"
              type="button"
              onClick={handleSaveAll}
              disabled={saveSuccess}
              className="flex items-center gap-2 px-5 py-2 bg-[#002147] hover:bg-[#001733] text-amber-400 font-bold text-xs rounded-lg border border-amber-500/50 shadow-md active:scale-95 transition-all"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                  <span>Changes Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Apply & Resolve Contention</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
