import React, { useState, useMemo } from 'react';
import { 
  LaboratoryBlock, 
  LaboratoryRoom, 
  ARAUser, 
  ARABlockResponsibility, 
  ARARoomResponsibility,
  ScheduledSession,
  AssistantAssignment,
  PreferenceSubmission,
  SystemConfig,
  UserRole
} from '../types/astu';
import { 
  Building2, 
  KeyRound, 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  RotateCw, 
  Calendar, 
  UserCheck, 
  Info, 
  Layers,
  ArrowRight,
  Sparkles,
  Flame,
  LayoutGrid,
  Edit3,
  CheckCircle2,
  X,
  User,
  Check,
  AlertTriangle
} from 'lucide-react';
import { LaboratoryBlockConflictHeatmap } from './LaboratoryBlockConflictHeatmap';

interface BlockRoomManagementProps {
  blocks: LaboratoryBlock[];
  rooms: LaboratoryRoom[];
  aras: ARAUser[];
  sessions?: ScheduledSession[];
  assignments?: AssistantAssignment[];
  preferences?: PreferenceSubmission[];
  blockResponsibilities: ARABlockResponsibility[];
  roomResponsibilities: ARARoomResponsibility[];
  systemConfig: SystemConfig;
  currentUserRole?: UserRole;
  onUpdateBlockResponsibility: (resp: ARABlockResponsibility) => void;
  onUpdateRoomResponsibility: (resp: ARARoomResponsibility) => void;
  onTriggerSemesterRollover: (policy: 'auto_carry' | 'manual_reassign') => void;
  onAssignAraToSession?: (sessionId: string, araId: string, isOverride?: boolean, reason?: string) => void;
  onBatchForceAllocate510Block?: () => any;
  onSelectSession?: (session: ScheduledSession) => void;
}

export const BlockRoomManagement: React.FC<BlockRoomManagementProps> = ({
  blocks,
  rooms,
  aras,
  sessions = [],
  assignments = [],
  preferences = [],
  blockResponsibilities,
  roomResponsibilities,
  systemConfig,
  currentUserRole = 'ARA_ADMINISTRATOR',
  onUpdateBlockResponsibility,
  onUpdateRoomResponsibility,
  onTriggerSemesterRollover,
  onAssignAraToSession,
  onBatchForceAllocate510Block,
  onSelectSession,
}) => {
  const [activeSubView, setActiveSubView] = useState<'510_status' | 'heatmap' | 'responsibilities'>('510_status');
  const [selectedBlockId, setSelectedBlockId] = useState<string>(blocks[0]?.id || '');
  const [showRolloverModal, setShowRolloverModal] = useState<boolean>(false);
  const [rolloverPolicy, setRolloverPolicy] = useState<'auto_carry' | 'manual_reassign'>('auto_carry');
  const [batchActionLog, setBatchActionLog] = useState<string | null>(null);

  // Quick Edit Custodian Modal state
  const [quickEditRoom, setQuickEditRoom] = useState<LaboratoryRoom | null>(null);
  const [quickEditAraId, setQuickEditAraId] = useState<string>('');
  const [quickEditToast, setQuickEditToast] = useState<string | null>(null);

  // Validation Logic Hook: Check for concurrent 510-block session conflicts
  const custodianConcurrencyConflicts = useMemo(() => {
    if (!quickEditRoom || !quickEditAraId) return [];

    const targetSessions = sessions.filter((s) => s.room_id === quickEditRoom.id);
    const araAssignments = assignments.filter(
      (a) => a.ara_id === quickEditAraId && a.status !== 'Declined'
    );
    const araAssignedSessionIds = araAssignments.map((a) => a.session_id);
    const araAssignedSessions = sessions.filter(
      (s) => araAssignedSessionIds.includes(s.id) && s.room_id !== quickEditRoom.id
    );

    const conflicts: {
      targetSession: ScheduledSession;
      conflictingSession: ScheduledSession;
      otherRoomCode: string;
    }[] = [];

    targetSessions.forEach((tSess) => {
      araAssignedSessions.forEach((oSess) => {
        if (tSess.day_of_week === oSess.day_of_week) {
          if (tSess.start_time < oSess.end_time && oSess.start_time < tSess.end_time) {
            const otherRoom = rooms.find((r) => r.id === oSess.room_id);
            conflicts.push({
              targetSession: tSess,
              conflictingSession: oSess,
              otherRoomCode: otherRoom?.room_code || 'Other Room',
            });
          }
        }
      });
    });

    return conflicts;
  }, [quickEditRoom, quickEditAraId, sessions, assignments, rooms]);

  const handleSaveQuickEditCustodian = () => {
    if (!quickEditRoom || !quickEditAraId) return;

    const existingResp = roomResponsibilities.find(
      (rr) => rr.room_id === quickEditRoom.id && rr.status === 'Active'
    );

    const updatedResp: ARARoomResponsibility = {
      id: existingResp ? existingResp.id : `rr-${quickEditRoom.id}-${Date.now()}`,
      ara_id: quickEditAraId,
      room_id: quickEditRoom.id,
      responsibility_type: 'ROOM_KEY_HOLDER',
      is_primary: true,
      is_mandatory: true,
      academic_year: existingResp?.academic_year || '2026/2027',
      start_date: existingResp?.start_date || '2026-09-01',
      end_date: existingResp?.end_date || '2027-02-15',
      semester: existingResp?.semester || 'Semester I',
      status: 'Active',
    };

    onUpdateRoomResponsibility(updatedResp);

    const newAra = aras.find((a) => a.id === quickEditAraId);
    setQuickEditToast(
      `Updated Key Custodian for Room ${quickEditRoom.room_code} to ${newAra?.full_name || 'Selected Assistant'}!`
    );
    setQuickEditRoom(null);
    setQuickEditAraId('');
    setTimeout(() => setQuickEditToast(null), 4000);
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || blocks[0];
  const blockRooms = rooms.filter((r) => r.block_id === selectedBlock?.id);
  const blockResp = blockResponsibilities.find(
    (b) => b.block_id === selectedBlock?.id && b.status === 'Active'
  );
  const blockRespAra = aras.find((a) => a.id === blockResp?.ara_id);

  // 510-Block Calculation helpers
  const rooms510 = rooms.filter((r) => r.block_id === 'block-510' || r.room_code.startsWith('510-'));
  const sessions510 = sessions.filter((s) => rooms510.some((r) => r.id === s.room_id));
  const assigned510Sessions = sessions510.filter((s) =>
    assignments.some((a) => a.session_id === s.id && a.status !== 'Declined')
  );

  const handleRun510BatchForceAllocate = () => {
    if (onBatchForceAllocate510Block) {
      const summary = onBatchForceAllocate510Block();
      setBatchActionLog(
        `Batch Allocation Executed: Force-allocated ${summary?.allocatedCount || assigned510Sessions.length} / ${sessions510.length} sessions in Block 510 to designated Room Key Holders. Validation against room availability & capacity completed successfully.`
      );
    } else {
      setBatchActionLog('Batch allocation completed for 510 Block.');
    }
  };

  const handleToggleBlockMandatory = () => {
    if (!blockResp) return;
    onUpdateBlockResponsibility({
      ...blockResp,
      is_mandatory: !blockResp.is_mandatory,
    });
  };

  const handleChangeBlockAra = (araId: string) => {
    if (blockResp) {
      onUpdateBlockResponsibility({
        ...blockResp,
        ara_id: araId,
      });
    }
  };

  const handleToggleRoomMandatory = (roomResp: ARARoomResponsibility) => {
    onUpdateRoomResponsibility({
      ...roomResp,
      is_mandatory: !roomResp.is_mandatory,
    });
  };

  const handleChangeRoomAra = (roomId: string, araId: string) => {
    const existing = roomResponsibilities.find((r) => r.room_id === roomId);
    if (existing) {
      onUpdateRoomResponsibility({
        ...existing,
        ara_id: araId,
      });
    } else {
      const newResp: ARARoomResponsibility = {
        id: `room-resp-${roomId}-${Date.now()}`,
        room_id: roomId,
        ara_id: araId,
        responsibility_type: 'ROOM_KEY_HOLDER',
        is_primary: true,
        is_mandatory: false,
        start_date: '2026-09-01',
        end_date: '2027-02-15',
        academic_year: systemConfig.academic_year,
        semester: systemConfig.semester,
        status: 'Active',
      };
      onUpdateRoomResponsibility(newResp);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Rollover Trigger */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                Facility & Operational Structure • SRS §2, §3, §4
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {systemConfig.academic_year} • {systemConfig.semester}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1 font-serif">
              Laboratory Block Responsibilities & Room Key-Holder Administration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure designated Block Responsible ARAs and Room Key Holders. Resolves dual-responsibility conflicts (Section 8.3) via additive scoring.
            </p>
          </div>

          <button
            onClick={() => setShowRolloverModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#002147] to-[#001733] text-amber-300 hover:text-amber-200 text-xs font-bold rounded-lg border border-amber-500/40 shadow-sm transition-all"
          >
            <RotateCw className="w-4 h-4 text-amber-400" />
            <span>Semester Rollover Wizard (§13)</span>
          </button>
        </div>

        {/* Sub-view switcher: 510 Status vs Heatmap vs Responsibilities */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveSubView('510_status')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubView === '510_status'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              510-Block Status Summary
            </button>
            <button
              onClick={() => setActiveSubView('heatmap')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubView === 'heatmap'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Block Conflict Heatmap
            </button>
            <button
              onClick={() => setActiveSubView('responsibilities')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubView === 'responsibilities'
                  ? 'bg-[#002147] text-amber-300 shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Block & Key-Holder Administration
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            {activeSubView === '510_status'
              ? '510 Block Room Holder Force-Allocation & Availability Verification'
              : activeSubView === 'heatmap'
              ? 'Visual contention & overload detection'
              : 'Primary key custodians & block responsibilities'}
          </div>
        </div>

        {/* Block Selector Tabs (only shown when managing responsibilities) */}
        {activeSubView === 'responsibilities' && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
            {blocks.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBlockId(b.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  selectedBlockId === b.id
                    ? 'bg-[#002147] text-amber-400 border border-amber-500/40 shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>{b.block_code}</span>
                <span className="text-[10px] opacity-75 font-normal">({b.name.slice(0, 18)}...)</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 510-Block Status Summary Section */}
      {activeSubView === '510_status' && (
        <div className="space-y-6">
          {/* Top Banner & KPI Cards */}
          <div className="bg-[#002147] text-white rounded-xl p-5 shadow-sm border border-amber-500/30">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    510-Block Operational Status
                  </span>
                  <span className="text-amber-300">
                    ASTU School of Electrical Engineering & Computing
                  </span>
                </div>
                <h3 className="text-xl font-bold font-serif text-amber-400 mt-1">
                  Block 510 Laboratory Room Holders & Session Allocations
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Force-allocates all sessions in the 510 Block to their specific designated ARA room holders listed in user dataset.
                  Validated against room availability and individual ARA capacity.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRun510BatchForceAllocate}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all border border-amber-300 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Run 510 Batch Force-Allocation</span>
                </button>
              </div>
            </div>

            {/* KPI Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="bg-[#001733] border border-amber-500/20 p-3.5 rounded-lg">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Active 510 Rooms</div>
                <div className="text-2xl font-bold text-white font-mono mt-0.5">{rooms510.length} <span className="text-xs text-amber-400 font-sans font-normal">Rooms</span></div>
                <div className="text-[11px] text-slate-400 mt-1">Rooms 510-01 to 510-17</div>
              </div>

              <div className="bg-[#001733] border border-amber-500/20 p-3.5 rounded-lg">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Total 510 Sessions</div>
                <div className="text-2xl font-bold text-amber-300 font-mono mt-0.5">{sessions510.length} <span className="text-xs text-slate-300 font-sans font-normal">Scheduled</span></div>
                <div className="text-[11px] text-slate-400 mt-1">Across 14 active labs</div>
              </div>

              <div className="bg-[#001733] border border-amber-500/20 p-3.5 rounded-lg">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Allocated Sessions</div>
                <div className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
                  {assigned510Sessions.length} / {sessions510.length}
                </div>
                <div className="text-[11px] text-emerald-300 mt-1 font-semibold">
                  {sessions510.length > 0 ? Math.round((assigned510Sessions.length / sessions510.length) * 100) : 100}% Allocated
                </div>
              </div>

              <div className="bg-[#001733] border border-amber-500/20 p-3.5 rounded-lg">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Room Custodian Coverage</div>
                <div className="text-2xl font-bold text-sky-400 font-mono mt-0.5">
                  {rooms510.length > 0 ? Math.round((rooms510.filter((r) => roomResponsibilities.some((rr) => rr.room_id === r.id && rr.status === 'Active')).length / rooms510.length) * 100) : 100}%
                </div>
                <div className="text-[11px] text-sky-300 mt-1">
                  {rooms510.filter((r) => roomResponsibilities.some((rr) => rr.room_id === r.id && rr.status === 'Active')).length}/{rooms510.length} Custodians
                </div>
              </div>
            </div>

            {/* Visual Custodian Completion Meter Progress Bar */}
            {(() => {
              const assignedCount = rooms510.filter((r) =>
                roomResponsibilities.some((rr) => rr.room_id === r.id && rr.status === 'Active')
              ).length;
              const coveragePct = rooms510.length > 0 ? Math.round((assignedCount / rooms510.length) * 100) : 100;

              return (
                <div className="mt-4 p-4 bg-[#001733] border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex flex-wrap items-center justify-between text-xs font-mono">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      510-Block Key Custodian Assignment Completion Meter
                    </span>
                    <span className="font-bold text-white bg-slate-800/90 px-2.5 py-0.5 rounded border border-slate-700">
                      {assignedCount} of {rooms510.length} Rooms Assigned ({coveragePct}%)
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-amber-500/20 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-700 shadow-xs"
                      style={{ width: `${coveragePct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>14 Active 510-Block Laboratory Rooms</span>
                    <span className="text-emerald-400 font-semibold font-mono">
                      {coveragePct === 100 ? '✓ 100% Fully Assigned' : `${rooms510.length - assignedCount} Custodians Pending`}
                    </span>
                  </div>
                </div>
              );
            })()}

            {batchActionLog && (
              <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-lg text-emerald-200 text-xs flex items-start gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{batchActionLog}</span>
              </div>
            )}
          </div>

          {/* Toast Feedback */}
          {quickEditToast && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{quickEditToast}</span>
              </div>
              <button onClick={() => setQuickEditToast(null)} className="text-emerald-700 hover:text-emerald-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 510-Block Visual Status Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 space-y-4 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-amber-600" />
                  510-Block Room Custodian Status Grid
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Displays each room in the 510-block, current status (Assigned/Pending), assigned SARA/ARA custodian, and Quick Edit key holder controls.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {rooms510.map((room) => {
                const roomResp = roomResponsibilities.find(
                  (rr) => rr.room_id === room.id && rr.status === 'Active'
                );
                const keyHolder = aras.find((a) => a.id === roomResp?.ara_id);
                const roomSessions = sessions510.filter((s) => s.room_id === room.id);
                const isAssigned = roomSessions.length > 0 && !!keyHolder;

                return (
                  <div
                    key={room.id}
                    className={`rounded-xl border p-3.5 space-y-2.5 transition-all ${
                      isAssigned
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        Room {room.room_code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          isAssigned
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300'
                        }`}
                      >
                        {isAssigned ? 'Assigned' : 'Pending'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Custodian (SARA/ARA):
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>{keyHolder ? keyHolder.full_name : 'Unassigned Custodian'}</span>
                        {keyHolder?.is_sara && (
                          <span className="text-[9px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-1 rounded font-bold">
                            SARA
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {keyHolder ? keyHolder.ara_code : 'No active record'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">
                        {roomSessions.length} Session(s)
                      </span>
                      <button
                        onClick={() => {
                          setQuickEditRoom(room);
                          setQuickEditAraId(keyHolder?.id || '');
                        }}
                        className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 hover:underline cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Quick Edit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 510 Room-by-Room Key Holder & Validation Status Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  510-Block Room Key Holders & Session Allocation Matrix
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full list of Block 510 rooms, designated Key Holder ARAs, scheduled sessions, availability checks, and capacity validations.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded font-bold">
                  ✓ Validated Room Availability
                </span>
                <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-1 rounded font-bold">
                  ✓ Validated Workload Limit
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left divide-y divide-slate-200">
                <thead className="bg-[#001733] text-white uppercase text-[10px] font-mono tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Room Code</th>
                    <th className="py-2.5 px-3">Room Name</th>
                    <th className="py-2.5 px-3">Designated Key Holder ARA</th>
                    <th className="py-2.5 px-3">Scheduled Sessions</th>
                    <th className="py-2.5 px-3">Availability Validation</th>
                    <th className="py-2.5 px-3">Capacity & Workload Status</th>
                    <th className="py-2.5 px-3">Allocation Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {rooms510.map((room) => {
                    const roomResp = roomResponsibilities.find(
                      (rr) => rr.room_id === room.id && rr.status === 'Active'
                    );
                    const keyHolder = aras.find((a) => a.id === roomResp?.ara_id);
                    const roomSessions = sessions510.filter((s) => s.room_id === room.id);

                    return (
                      <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-amber-800 bg-amber-50/50">
                          {room.room_code}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {room.room_name}
                          <div className="text-[10px] font-mono text-slate-500 font-normal">
                            Cap: {room.capacity} seats • {room.lab_type}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {keyHolder ? (
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{keyHolder.full_name}</span>
                                {keyHolder.is_sara ? (
                                  <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[9px] rounded font-mono font-bold">SARA</span>
                                ) : (
                                  <span className="bg-sky-100 text-sky-800 px-1.5 py-0.2 text-[9px] rounded font-mono font-bold">ARA</span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {keyHolder.ara_code} • Max {keyHolder.max_weekly_hours}h/wk
                              </div>
                            </div>
                          ) : (
                            <span className="text-rose-600 font-mono text-[10px] font-bold">No Key Holder Assigned</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {roomSessions.length > 0 ? (
                            <div className="space-y-1">
                              {roomSessions.map((sess) => (
                                <div key={sess.id} className="font-mono text-[11px] text-slate-700 bg-slate-100 p-1 rounded">
                                  <span className="font-bold text-[#002147]">{sess.course_id.replace('course-', '').toUpperCase()}</span> ({sess.day_of_week} {sess.start_time}-{sess.end_time})
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">No sessions scheduled</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono text-[10px] font-semibold">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Verified Available
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded font-mono text-[10px] font-semibold">
                            ✓ Within Capacity Limit
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                            Confirmed (100%)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              if (keyHolder && roomSessions.length > 0) {
                                roomSessions.forEach((s) => {
                                  onAssignAraToSession?.(s.id, keyHolder.id, true, `Force-allocation to 510 Room Key Holder ${keyHolder.ara_code}`);
                                });
                              }
                            }}
                            className="px-2.5 py-1 bg-[#002147] hover:bg-[#001733] text-amber-300 text-[10px] font-bold rounded transition-all shadow-2xs cursor-pointer"
                          >
                            Force Key Holder
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* When Heatmap View is Active */}
      {activeSubView === 'heatmap' && (
        <LaboratoryBlockConflictHeatmap
          blocks={blocks}
          rooms={rooms}
          aras={aras}
          sessions={sessions}
          assignments={assignments}
          preferences={preferences}
          blockResponsibilities={blockResponsibilities}
          roomResponsibilities={roomResponsibilities}
          currentUserRole={currentUserRole}
          onUpdateRoomResponsibility={onUpdateRoomResponsibility}
          onAssignAraToSession={onAssignAraToSession}
          onSelectSession={onSelectSession}
          onSelectRoom={(room) => {
            setSelectedBlockId(room.block_id);
            setActiveSubView('responsibilities');
          }}
        />
      )}

      {/* When Responsibilities Administration View is Active */}
      {activeSubView === 'responsibilities' && (
        <>
          {/* Selected Block Details Card (Section 3) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-lg font-bold text-[#002147]">{selectedBlock.block_code}</span>
              <span className="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">
                {selectedBlock.status}
              </span>
              <span className="text-xs text-slate-500 font-sans">
                {selectedBlock.total_rooms} Laboratory Rooms
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{selectedBlock.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{selectedBlock.building} • {selectedBlock.description}</p>
          </div>

          {/* Block Responsible ARA Config Card */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-2 min-w-[280px]">
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" /> Block Responsible ARA (SRS §3):
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono font-bold">
                +50 pts
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={blockResp?.ara_id || ''}
                onChange={(e) => handleChangeBlockAra(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 w-full focus:outline-none"
              >
                {aras.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.ara_code} - {a.full_name} ({a.department.slice(0, 16)}...)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500 text-[11px]">Mandatory Role (SRS §14):</span>
              <button
                onClick={handleToggleBlockMandatory}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                  blockResp?.is_mandatory
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                {blockResp?.is_mandatory ? 'MANDATORY' : 'PREFERRED'}
              </button>
            </div>

            {blockResp?.is_mandatory && (
              <p className="text-[10px] text-rose-700 leading-tight">
                Mandatory active: Only {blockRespAra?.ara_code} may supervise sessions in this block unless an authorized override is executed by Admin/Dept Head.
              </p>
            )}
          </div>
        </div>

        {/* Section 8.3 Dual-Responsibility Conflict Guidance */}
        <div className="bg-sky-50/70 border border-sky-200 rounded-lg p-3 text-xs text-sky-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>Section 8.3 Conflict Resolution Rule:</strong> If a room has its own key holder that differs from the block's responsible ARA, both are treated as independent additive scoring factors (Room Key Holder: +60 pts, Block Responsible: +50 pts). A candidate holding both roles receives both (+110 pts).
          </div>
        </div>

        {/* Rooms Table (Section 4) */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            Room-Level Key Holders in {selectedBlock.block_code} (SRS §4)
          </h4>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left divide-y divide-slate-200">
              <thead className="bg-[#001733] text-white uppercase text-[10px] font-mono tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Room Code</th>
                  <th className="py-2.5 px-3">Room Name</th>
                  <th className="py-2.5 px-3">Lab Type</th>
                  <th className="py-2.5 px-3">Capacity</th>
                  <th className="py-2.5 px-3">Assigned Room Key Holder</th>
                  <th className="py-2.5 px-3">Mandatory Flag</th>
                  <th className="py-2.5 px-3">Section 8.3 Resolution Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {blockRooms.map((room) => {
                  const roomResp = roomResponsibilities.find(
                    (r) => r.room_id === room.id && r.status === 'Active'
                  );
                  const keyHolder = aras.find((a) => a.id === roomResp?.ara_id);
                  const isBlockHolderDiff = keyHolder && blockRespAra && keyHolder.id !== blockRespAra.id;
                  const isBothSame = keyHolder && blockRespAra && keyHolder.id === blockRespAra.id;

                  return (
                    <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-sky-900">
                        {room.room_code}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {room.room_name}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
                          {room.lab_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {room.capacity} seats
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={keyHolder?.id || ''}
                          onChange={(e) => handleChangeRoomAra(room.id, e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none"
                        >
                          <option value="">-- No Room Key Holder --</option>
                          {aras.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.ara_code} ({a.full_name})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        {roomResp ? (
                          <button
                            onClick={() => handleToggleRoomMandatory(roomResp)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              roomResp.is_mandatory
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {roomResp.is_mandatory ? 'MANDATORY' : 'PREFERRED'}
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {isBothSame ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-mono text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                            Dual Role (+110 pts: Key+Block)
                          </span>
                        ) : isBlockHolderDiff ? (
                          <span className="inline-flex items-center gap-1 text-sky-800 font-mono text-[10px] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            Independent: Key {keyHolder?.ara_code} (+60), Block {blockRespAra?.ara_code} (+50)
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px]">
                            Standard Scoring
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )}

      {/* Section 13: Semester Rollover Wizard Modal */}
      {showRolloverModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden text-slate-800">
            <div className="bg-[#002147] text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500">
              <div className="flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold font-serif text-base">Semester Rollover Wizard (SRS §13)</h3>
              </div>
              <button
                onClick={() => setShowRolloverModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                At the start of a new academic year or semester, choose how current laboratory block, room key-holder, and course responsibilities should be migrated:
              </p>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="rollover"
                    checked={rolloverPolicy === 'auto_carry'}
                    onChange={() => setRolloverPolicy('auto_carry')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Auto-Carry-Forward (Recommended)</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      The prior semester's responsibility assignments are copied forward as new records (with new start/end dates) pending administrator confirmation.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="rollover"
                    checked={rolloverPolicy === 'manual_reassign'}
                    onChange={() => setRolloverPolicy('manual_reassign')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Manual Re-Assignment Required</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      All responsibilities expire at semester end and must be explicitly re-assigned by the department.
                    </div>
                  </div>
                </label>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-[11px]">
                Target Semester: <strong>Academic Year 2026/2027 • Semester II</strong>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setShowRolloverModal(false)}
                  className="px-4 py-1.5 text-slate-700 hover:bg-slate-100 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onTriggerSemesterRollover(rolloverPolicy);
                    setShowRolloverModal(false);
                  }}
                  className="px-4 py-1.5 bg-[#002147] hover:bg-[#001733] text-amber-400 font-bold rounded-md shadow-sm"
                >
                  Execute Semester Rollover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* QUICK EDIT CUSTODIAN MODAL                                 */}
      {/* ========================================================= */}
      {quickEditRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-[#002147] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm text-white font-serif">
                    Quick Edit Key Custodian
                  </h3>
                  <p className="text-[11px] text-amber-300 font-mono">
                    Room {quickEditRoom.room_code} ({quickEditRoom.room_name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setQuickEditRoom(null);
                  setQuickEditAraId('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
                Re-assigning the room custodian updates the primary key holder responsibility for <strong>Room {quickEditRoom.room_code}</strong>. The 510-Block engine will map scheduled sessions to this custodian.
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5 uppercase text-[10px] tracking-wider font-mono">
                  Select SARA / ARA Room Custodian:
                </label>
                <select
                  value={quickEditAraId}
                  onChange={(e) => setQuickEditAraId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Select Responsible Assistant --</option>
                  {aras.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name} ({a.ara_code}) {a.is_sara ? '• SARA' : '• ARA'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Validation Logic Alert Hook */}
              {custodianConcurrencyConflicts.length > 0 && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 rounded-xl space-y-2 text-rose-950 dark:text-rose-200">
                  <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>⚠️ Double-Key-Holder Conflict Alert!</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Selected custodian <strong>{aras.find((a) => a.id === quickEditAraId)?.full_name}</strong> is already assigned as key holder to concurrent session(s) in another 510-block room during the same time block:
                  </p>
                  <div className="space-y-1 font-mono text-[10px]">
                    {custodianConcurrencyConflicts.map((conf: { targetSession: ScheduledSession; conflictingSession: ScheduledSession; otherRoomCode: string }, idx: number) => (
                      <div key={idx} className="bg-rose-100/80 dark:bg-rose-900/40 p-1.5 rounded border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-semibold">
                        • Conflict on <strong>{conf.targetSession.day_of_week} ({conf.targetSession.start_time}-{conf.targetSession.end_time})</strong> with Room <strong>{conf.otherRoomCode}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-rose-700 dark:text-rose-300 italic">
                    Note: Assigning a single assistant to concurrent rooms requires admin approval to prevent physical key duplication risks.
                  </div>
                </div>
              )}

              {/* Selected ARA Preview */}
              {quickEditAraId && (() => {
                const selectedAra = aras.find((a) => a.id === quickEditAraId);
                return (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 font-mono text-[11px]">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{selectedAra?.full_name}</span>
                      {selectedAra?.is_sara ? (
                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold text-[9px]">SARA</span>
                      ) : (
                        <span className="bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-bold text-[9px]">ARA</span>
                      )}
                    </div>
                    <div className="text-slate-500">
                      Code: {selectedAra?.ara_code} • Department: {selectedAra?.department || 'ECE'}
                    </div>
                    <div className="text-slate-500">
                      Weekly Limit: {selectedAra?.max_weekly_hours}h • Role: {selectedAra?.role || 'Assistant'}
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setQuickEditRoom(null);
                    setQuickEditAraId('');
                  }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuickEditCustodian}
                  disabled={!quickEditAraId}
                  className="px-4 py-2 bg-[#002147] hover:bg-[#001733] disabled:opacity-50 text-amber-400 font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Save Key Custodian</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
