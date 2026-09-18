import React, { useState } from 'react';
import { 
  LaboratoryBlock, 
  LaboratoryRoom, 
  ARAUser, 
  ARABlockResponsibility, 
  ARARoomResponsibility,
  ScheduledSession,
  AssistantAssignment,
  PreferenceSubmission,
  SystemConfig
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
  LayoutGrid
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
  onUpdateBlockResponsibility: (resp: ARABlockResponsibility) => void;
  onUpdateRoomResponsibility: (resp: ARARoomResponsibility) => void;
  onTriggerSemesterRollover: (policy: 'auto_carry' | 'manual_reassign') => void;
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
  onUpdateBlockResponsibility,
  onUpdateRoomResponsibility,
  onTriggerSemesterRollover,
}) => {
  const [activeSubView, setActiveSubView] = useState<'heatmap' | 'responsibilities'>('heatmap');
  const [selectedBlockId, setSelectedBlockId] = useState<string>(blocks[0]?.id || '');
  const [showRolloverModal, setShowRolloverModal] = useState<boolean>(false);
  const [rolloverPolicy, setRolloverPolicy] = useState<'auto_carry' | 'manual_reassign'>('auto_carry');

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || blocks[0];
  const blockRooms = rooms.filter((r) => r.block_id === selectedBlock?.id);
  const blockResp = blockResponsibilities.find(
    (b) => b.block_id === selectedBlock?.id && b.status === 'Active'
  );
  const blockRespAra = aras.find((a) => a.id === blockResp?.ara_id);

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

        {/* Sub-view switcher: Heatmap vs Responsibilities */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveSubView('heatmap')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubView === 'heatmap'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Laboratory Block Conflict Heatmap
            </button>
            <button
              onClick={() => setActiveSubView('responsibilities')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubView === 'responsibilities'
                  ? 'bg-[#002147] text-amber-300 shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Block & Room Key-Holder Administration
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            {activeSubView === 'heatmap' ? 'Visual contention & overload detection' : 'Primary key custodians & block responsibilities'}
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
    </div>
  );
};
