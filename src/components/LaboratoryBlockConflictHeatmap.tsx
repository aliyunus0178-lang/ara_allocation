import React, { useState, useMemo } from 'react';
import { 
  LaboratoryBlock, 
  LaboratoryRoom, 
  ARAUser, 
  ScheduledSession, 
  AssistantAssignment,
  PreferenceSubmission,
  ARABlockResponsibility, 
  ARARoomResponsibility,
  UserRole
} from '../types/astu';
import { 
  Flame, 
  ShieldAlert, 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Users, 
  Clock, 
  Filter, 
  Info,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowUpDown,
  LayoutGrid,
  Grid3X3,
  HelpCircle,
  Wrench,
  Edit3
} from 'lucide-react';
import { RoomAllocationFixModal } from './RoomAllocationFixModal';

interface LaboratoryBlockConflictHeatmapProps {
  blocks: LaboratoryBlock[];
  rooms: LaboratoryRoom[];
  aras: ARAUser[];
  sessions: ScheduledSession[];
  assignments: AssistantAssignment[];
  preferences: PreferenceSubmission[];
  blockResponsibilities: ARABlockResponsibility[];
  roomResponsibilities: ARARoomResponsibility[];
  currentUserRole?: UserRole;
  onSelectRoom?: (room: LaboratoryRoom) => void;
  onUpdateRoomResponsibility?: (resp: ARARoomResponsibility) => void;
  onAssignAraToSession?: (sessionId: string, araId: string, isOverride?: boolean, reason?: string) => void;
  onSelectSession?: (session: ScheduledSession) => void;
}

export interface RoomContentionData {
  room: LaboratoryRoom;
  block?: LaboratoryBlock;
  sessions: ScheduledSession[];
  totalWeeklyHours: number;
  keyHolder?: ARAUser;
  isKeyHolderMandatory: boolean;
  competingPreferenceCount: number;
  assignedAraCount: number;
  sessionToAraRatio: number; // e.g. 5 sessions / 1 ARA = 5.0
  contentionScore: number; // 0 to 100
  contentionLevel: 'Critical' | 'Moderate' | 'Balanced' | 'Uncovered';
  contentionFactors: string[];
  recommendation: string;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const LaboratoryBlockConflictHeatmap: React.FC<LaboratoryBlockConflictHeatmapProps> = ({
  blocks,
  rooms,
  aras,
  sessions,
  assignments,
  preferences,
  blockResponsibilities,
  roomResponsibilities,
  currentUserRole = 'ARA_ADMINISTRATOR',
  onSelectRoom,
  onUpdateRoomResponsibility,
  onAssignAraToSession,
  onSelectSession,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string>('all');
  const [contentionFilter, setContentionFilter] = useState<'all' | 'critical' | 'moderate' | 'balanced' | 'uncovered'>('all');
  const [viewMode, setViewMode] = useState<'grid_2d' | 'cards'>('grid_2d');
  const [activeInspectorRoomId, setActiveInspectorRoomId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'contention' | 'hours' | 'preferences' | 'ratio'>('contention');
  const [editingRoom, setEditingRoom] = useState<LaboratoryRoom | null>(null);

  const canEdit = currentUserRole === 'ARA_ADMINISTRATOR' || currentUserRole === 'DEPARTMENT_HEAD';

  // Compute contention and 2D density metrics for every laboratory room
  const roomContentionList: RoomContentionData[] = useMemo(() => {
    return rooms.map((room) => {
      const block = blocks.find((b) => b.id === room.block_id);
      const roomSessions = sessions.filter((s) => s.room_id === room.id);
      const totalWeeklyHours = roomSessions.reduce((sum, s) => sum + (s.duration_hours || 2), 0);

      // Key-holder responsibility
      const roomResp = roomResponsibilities.find(
        (r) => r.room_id === room.id && r.status === 'Active'
      );
      const keyHolder = roomResp ? aras.find((a) => a.id === roomResp.ara_id) : undefined;
      const isKeyHolderMandatory = roomResp?.is_mandatory || false;

      // Competing preferences targeting courses held in this room
      const courseIdsInRoom = Array.from(new Set(roomSessions.map((s) => s.course_id)));
      const competingPreferences = preferences.filter((p) => courseIdsInRoom.includes(p.course_id));
      const competingPreferenceCount = competingPreferences.length;

      // Unique ARAs currently assigned to this room
      const roomSessionIds = roomSessions.map((s) => s.id);
      const roomAssignments = assignments.filter(
        (a) => roomSessionIds.includes(a.session_id) && a.status !== 'Declined'
      );
      const assignedAraIds = Array.from(new Set(roomAssignments.map((a) => a.ara_id)));
      const assignedAraCount = assignedAraIds.length;

      // Session-to-ARA Ratio calculation
      const sessionToAraRatio = assignedAraCount > 0 
        ? Number((roomSessions.length / assignedAraCount).toFixed(1))
        : (roomSessions.length > 0 ? roomSessions.length : 0);

      // Calculate Contention Score (0 to 100)
      let score = 0;
      const factors: string[] = [];

      // 1. Session Load Factor (Max 40 pts) - 16+ hours/week is high density
      const hoursScore = Math.min(40, (totalWeeklyHours / 16) * 40);
      score += hoursScore;
      if (totalWeeklyHours >= 14) {
        factors.push(`High lab density (${totalWeeklyHours}h / week)`);
      }

      // 2. Key Holder Coverage Factor (Max 30 pts)
      if (roomSessions.length > 0 && !keyHolder) {
        score += 30;
        factors.push('Missing designated Room Key-Holder (High Operational Risk)');
      } else if (keyHolder) {
        const workloadRatio = (keyHolder.current_weekly_hours || 0) / (keyHolder.max_weekly_hours || 12);
        if (workloadRatio >= 1.0) {
          score += 25;
          factors.push(`Key-holder ${keyHolder.full_name} is at/exceeding weekly cap (${keyHolder.current_weekly_hours}h)`);
        } else if (workloadRatio >= 0.75) {
          score += 15;
          factors.push(`Key-holder workload high (${keyHolder.current_weekly_hours}h / ${keyHolder.max_weekly_hours}h)`);
        }
      }

      // 3. ARA Preference Contention (Max 30 pts)
      if (competingPreferenceCount > 0) {
        const prefScore = Math.min(30, competingPreferenceCount * 6);
        score += prefScore;
        if (competingPreferenceCount >= 4) {
          factors.push(`High ARA preference contention (${competingPreferenceCount} applicant requests)`);
        }
      }

      // Determine level
      let contentionLevel: 'Critical' | 'Moderate' | 'Balanced' | 'Uncovered' = 'Balanced';
      if (roomSessions.length > 0 && !keyHolder) {
        contentionLevel = 'Uncovered';
      } else if (score >= 68) {
        contentionLevel = 'Critical';
      } else if (score >= 38) {
        contentionLevel = 'Moderate';
      } else {
        contentionLevel = 'Balanced';
      }

      // Generate actionable recommendation
      let recommendation = 'Room load is balanced. Current key custody and session allocations are optimal.';
      if (contentionLevel === 'Uncovered') {
        recommendation = 'IMMEDIATE ACTION: Appoint a primary Room Key-Holder (SRS §3) to safeguard lab equipment and open laboratory sessions.';
      } else if (contentionLevel === 'Critical') {
        if (sessionToAraRatio >= 3.0) {
          recommendation = `High session-to-ARA ratio (${sessionToAraRatio}:1). Assign additional laboratory assistants to prevent single-ARA burnout.`;
        } else if (totalWeeklyHours >= 16) {
          recommendation = 'Contention bottleneck: Shift 1-2 afternoon lab sections to under-utilized lab rooms in B-508 or B-509.';
        } else {
          recommendation = 'Appoint a secondary assistant or re-distribute preferred courses to balance ARA workload.';
        }
      } else if (contentionLevel === 'Moderate') {
        recommendation = 'Monitor key-holder availability during peak afternoon sessions; confirm ARA attendance.';
      }

      return {
        room,
        block,
        sessions: roomSessions,
        totalWeeklyHours,
        keyHolder,
        isKeyHolderMandatory,
        competingPreferenceCount,
        assignedAraCount,
        sessionToAraRatio,
        contentionScore: Math.round(score),
        contentionLevel,
        contentionFactors: factors,
        recommendation,
      };
    });
  }, [rooms, blocks, sessions, assignments, preferences, roomResponsibilities, aras]);

  // Filter and sort
  const filteredRooms = useMemo(() => {
    let list = roomContentionList.filter((item) => {
      if (selectedBlockId !== 'all' && item.room.block_id !== selectedBlockId) return false;
      if (contentionFilter === 'critical' && item.contentionLevel !== 'Critical') return false;
      if (contentionFilter === 'moderate' && item.contentionLevel !== 'Moderate') return false;
      if (contentionFilter === 'balanced' && item.contentionLevel !== 'Balanced') return false;
      if (contentionFilter === 'uncovered' && item.contentionLevel !== 'Uncovered') return false;
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'contention') return b.contentionScore - a.contentionScore;
      if (sortBy === 'hours') return b.totalWeeklyHours - a.totalWeeklyHours;
      if (sortBy === 'preferences') return b.competingPreferenceCount - a.competingPreferenceCount;
      if (sortBy === 'ratio') return b.sessionToAraRatio - a.sessionToAraRatio;
      return 0;
    });
  }, [roomContentionList, selectedBlockId, contentionFilter, sortBy]);

  // Aggregated Stats
  const totalRooms = roomContentionList.length;
  const criticalCount = roomContentionList.filter((r) => r.contentionLevel === 'Critical').length;
  const uncoveredCount = roomContentionList.filter((r) => r.contentionLevel === 'Uncovered').length;
  const moderateCount = roomContentionList.filter((r) => r.contentionLevel === 'Moderate').length;
  const balancedCount = roomContentionList.filter((r) => r.contentionLevel === 'Balanced').length;

  const inspectorData = roomContentionList.find((r) => r.room.id === activeInspectorRoomId);

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary Cards */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                Laboratory Block Conflict Heatmap
              </span>
              <span className="text-xs text-slate-500 font-mono">
                SRS §2, §3 & §14 Bottleneck Analytics
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1 font-serif">
              Facility Contention & Session-to-ARA Intensity Grid
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
              Calculates a 2D intensity grid representing laboratory room usage density and ARA assignment contention, allowing administrators to identify potential bottlenecks where session-to-ARA ratios are excessively high.
            </p>
          </div>

          {/* Controls: View Switcher, Block, Sort */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* View Switcher: 2D Grid vs Cards */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300">
              <button
                onClick={() => setViewMode('grid_2d')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all ${
                  viewMode === 'grid_2d'
                    ? 'bg-[#002147] text-amber-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="2D Intensity Grid Matrix (Rooms × Days)"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                2D Intensity Matrix
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-[#002147] text-amber-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Detailed Room Profile Cards"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Room Cards
              </button>
            </div>

            {/* Block Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600 font-medium">Block:</span>
              <select
                value={selectedBlockId}
                onChange={(e) => setSelectedBlockId(e.target.value)}
                className="bg-transparent font-bold text-[#002147] focus:outline-none"
              >
                <option value="all">All ASTU Blocks ({blocks.length})</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.block_code} - {b.name.split('&')[0]}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none"
              >
                <option value="contention">Contention Score</option>
                <option value="ratio">Session : ARA Ratio</option>
                <option value="hours">Weekly Hours Load</option>
                <option value="preferences">ARA Preferences</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4 Quick Heatmap Stat Widgets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <button
            onClick={() => setContentionFilter('critical')}
            className={`p-3 rounded-lg border text-left transition-all ${
              contentionFilter === 'critical'
                ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/30 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                Critical Contention
              </span>
              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                {Math.round((criticalCount / totalRooms) * 100)}%
              </span>
            </div>
            <div className="text-2xl font-black text-rose-900 mt-1 font-mono">{criticalCount} Rooms</div>
            <div className="text-[10px] text-slate-500 mt-0.5">High session density + high ratio</div>
          </button>

          <button
            onClick={() => setContentionFilter('uncovered')}
            className={`p-3 rounded-lg border text-left transition-all ${
              contentionFilter === 'uncovered'
                ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/30 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                Missing Key-Holder
              </span>
              <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">
                Risk
              </span>
            </div>
            <div className="text-2xl font-black text-purple-900 mt-1 font-mono">{uncoveredCount} Rooms</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Sessions scheduled with no active key holder</div>
          </button>

          <button
            onClick={() => setContentionFilter('moderate')}
            className={`p-3 rounded-lg border text-left transition-all ${
              contentionFilter === 'moderate'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Moderate Contention
              </span>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                Watch
              </span>
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1 font-mono">{moderateCount} Rooms</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Average load, key-holder near 75% cap</div>
          </button>

          <button
            onClick={() => setContentionFilter('balanced')}
            className={`p-3 rounded-lg border text-left transition-all ${
              contentionFilter === 'balanced'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/30 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Optimal / Balanced
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                Healthy
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-900 mt-1 font-mono">{balancedCount} Rooms</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Smooth capacity and active coverage</div>
          </button>
        </div>

        {/* Intensity Legend & Active Filter */}
        <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Filtered:</span>
            <span className="font-bold text-slate-800">
              {filteredRooms.length} of {totalRooms} Laboratory Rooms
            </span>
            {contentionFilter !== 'all' && (
              <button
                onClick={() => setContentionFilter('all')}
                className="text-xs text-sky-700 hover:text-sky-900 underline font-medium ml-2"
              >
                Reset Filter (Show All)
              </button>
            )}
          </div>

          {/* 2D Intensity Color Gradient Scale */}
          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono">
            <span className="font-bold text-slate-700">Contention Scale:</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300"></span> 0h (Idle)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-400"></span> 2h (Light)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-200 border border-amber-400"></span> 4h (Moderate)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-rose-400 border border-rose-600"></span> 6h+ / High Bottleneck
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-purple-300 border border-purple-500"></span> Missing Key
            </span>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: 2D INTENSITY GRID MATRIX */}
      {viewMode === 'grid_2d' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid3X3 className="w-4 h-4 text-[#002147]" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-serif">
                Laboratory Room × Weekday Usage Density & Contention Matrix
              </h4>
            </div>
            <span className="text-[11px] text-slate-500">
              Click any cell or room row to inspect scheduled sessions & key custody
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#002147] text-white text-[11px]">
                  <th className="p-3 font-semibold sticky left-0 bg-[#002147] z-10 min-w-[180px]">
                    Laboratory Room
                  </th>
                  <th className="p-3 font-semibold text-center min-w-[70px]">Key Custody</th>
                  {WEEKDAYS.map((day) => (
                    <th key={day} className="p-3 font-semibold text-center min-w-[110px]">
                      {day}
                    </th>
                  ))}
                  <th className="p-3 font-semibold text-center min-w-[90px]">Weekly Density</th>
                  <th className="p-3 font-semibold text-center min-w-[100px]">Session : ARA Ratio</th>
                  <th className="p-3 font-semibold text-center min-w-[100px]">Contention Score</th>
                  <th className="p-3 font-semibold text-center min-w-[110px] sticky right-0 bg-[#002147] z-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRooms.map((item) => {
                  const isSelected = activeInspectorRoomId === item.room.id;
                  const ratioIsHigh = item.sessionToAraRatio >= 3.0;

                  return (
                    <tr
                      key={item.room.id}
                      onClick={() => {
                        setActiveInspectorRoomId(item.room.id);
                        if (onSelectRoom) onSelectRoom(item.room);
                      }}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-50/70 font-semibold' : ''
                      }`}
                    >
                      {/* Room Code & Block Name */}
                      <td className="p-3 sticky left-0 bg-white hover:bg-slate-50 z-10 border-r border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {item.room.room_code}
                          </span>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded font-bold">
                            {item.block?.block_code || 'B-510'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]" title={item.room.room_name}>
                          {item.room.room_name}
                        </div>
                      </td>

                      {/* Key Holder Pill */}
                      <td className="p-2.5 text-center border-r border-slate-200">
                        {item.keyHolder ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200" title={`Key Custodian: ${item.keyHolder.full_name}`}>
                            <KeyRound className="w-2.5 h-2.5 text-purple-600" />
                            {item.keyHolder.avatar_initials}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300" title="No key-holder assigned">
                            VACANT
                          </span>
                        )}
                      </td>

                      {/* 5 Day Density Heat Cells */}
                      {WEEKDAYS.map((day) => {
                        const daySessions = item.sessions.filter((s) => s.day_of_week === day);
                        const dayHours = daySessions.reduce((sum, s) => sum + (s.duration_hours || 2), 0);
                        const hasUnassignedSession = daySessions.some(
                          (s) => !assignments.some((a) => a.session_id === s.id && a.status !== 'Declined')
                        );

                        // Heat shading logic
                        let cellStyle = 'bg-slate-50 text-slate-300 border-slate-100';
                        if (dayHours >= 4 || (dayHours > 0 && !item.keyHolder)) {
                          cellStyle = 'bg-rose-100 text-rose-950 border-rose-300 font-bold';
                        } else if (dayHours === 3 || dayHours === 2) {
                          cellStyle = 'bg-amber-100/80 text-amber-950 border-amber-300 font-semibold';
                        } else if (dayHours > 0) {
                          cellStyle = 'bg-emerald-100/70 text-emerald-950 border-emerald-300';
                        }

                        return (
                          <td key={day} className="p-1.5 text-center border-r border-slate-200">
                            <div
                              className={`p-1.5 rounded border text-[10px] transition-all flex flex-col items-center justify-center min-h-[38px] ${cellStyle}`}
                              title={`${day}: ${daySessions.length} sessions (${dayHours}h)`}
                            >
                              {daySessions.length > 0 ? (
                                <>
                                  <span className="font-mono font-bold leading-tight">
                                    {daySessions.length} sess ({dayHours}h)
                                  </span>
                                  <div className="flex items-center gap-1 text-[9px] mt-0.5">
                                    <span className="truncate max-w-[70px] text-slate-700">
                                      {daySessions[0].course_id.replace('course-', '').toUpperCase()}
                                    </span>
                                    {hasUnassignedSession && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" title="ARA Required"></span>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-mono">-</span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Weekly Density */}
                      <td className="p-3 text-center border-r border-slate-200">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {item.totalWeeklyHours}h
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {item.sessions.length} sessions
                        </div>
                      </td>

                      {/* Session-to-ARA Ratio */}
                      <td className="p-3 text-center border-r border-slate-200">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            ratioIsHigh
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                          title={`${item.sessions.length} sessions across ${item.assignedAraCount} ARAs`}
                        >
                          {item.sessionToAraRatio}:1
                        </span>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          {item.assignedAraCount} ARA assigned
                        </div>
                      </td>

                      {/* Contention Score Meter */}
                      <td className="p-3 text-center border-r border-slate-200">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              item.contentionLevel === 'Critical'
                                ? 'bg-rose-100 text-rose-900 border-rose-300'
                                : item.contentionLevel === 'Uncovered'
                                ? 'bg-purple-100 text-purple-900 border-purple-300'
                                : item.contentionLevel === 'Moderate'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            {item.contentionScore}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">
                            {item.contentionLevel}
                          </span>
                        </div>
                      </td>

                      {/* Actions Column with Fix/Edit Button */}
                      <td className="p-2 text-center sticky right-0 bg-white hover:bg-slate-50 z-10">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveInspectorRoomId(item.room.id);
                              setEditingRoom(item.room);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-md border border-amber-500 shadow-2xs transition-all active:scale-95"
                            title="Edit / Fix Room Allocation and Key Custody"
                          >
                            <Wrench className="w-3 h-3 text-slate-950" />
                            <span>Fix / Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: ROOM PROFILE CARDS */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((item) => {
            const isCritical = item.contentionLevel === 'Critical';
            const isUncovered = item.contentionLevel === 'Uncovered';
            const isModerate = item.contentionLevel === 'Moderate';
            const isSelected = activeInspectorRoomId === item.room.id;

            let cardBg = 'bg-white border-slate-200 hover:border-slate-300';
            let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
            let progressBg = 'bg-emerald-500';

            if (isUncovered) {
              cardBg = 'bg-purple-50/40 border-purple-300 hover:border-purple-400';
              badgeBg = 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
              progressBg = 'bg-purple-600';
            } else if (isCritical) {
              cardBg = 'bg-rose-50/40 border-rose-300 hover:border-rose-400';
              badgeBg = 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
              progressBg = 'bg-rose-600';
            } else if (isModerate) {
              cardBg = 'bg-amber-50/30 border-amber-300 hover:border-amber-400';
              badgeBg = 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
              progressBg = 'bg-amber-500';
            }

            return (
              <div
                key={item.room.id}
                onClick={() => {
                  setActiveInspectorRoomId(item.room.id);
                  if (onSelectRoom) onSelectRoom(item.room);
                }}
                className={`rounded-xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-md relative ${cardBg} ${
                  isSelected ? 'ring-2 ring-[#002147] border-[#002147]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 font-mono">
                        {item.room.room_code}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                        {item.block?.block_code || 'B-510'}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-700 truncate max-w-[200px]" title={item.room.room_name}>
                      {item.room.room_name}
                    </h4>
                  </div>

                  <div className="text-right">
                    <div className={`px-2 py-0.5 rounded text-[10px] border flex items-center gap-1 ${badgeBg}`}>
                      {isCritical && <Flame className="w-3 h-3 text-rose-600" />}
                      {isUncovered && <KeyRound className="w-3 h-3 text-purple-600" />}
                      {isModerate && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                      {item.contentionLevel.toUpperCase()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Score: <strong>{item.contentionScore}</strong>/100
                    </div>
                  </div>
                </div>

                {/* Contention Meter Bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden my-2.5">
                  <div
                    className={`h-full transition-all ${progressBg}`}
                    style={{ width: `${Math.max(8, item.contentionScore)}%` }}
                  ></div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 text-center py-2 bg-white/70 rounded-lg border border-slate-100 text-[11px]">
                  <div>
                    <div className="text-[10px] text-slate-400">Weekly Density</div>
                    <div className="font-bold text-slate-900 font-mono">
                      {item.totalWeeklyHours}h
                    </div>
                    <div className="text-[9px] text-slate-500">{item.sessions.length} sessions</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400">Ratio (Sess:ARA)</div>
                    <div className={`font-bold font-mono ${item.sessionToAraRatio >= 3.0 ? 'text-rose-700' : 'text-slate-900'}`}>
                      {item.sessionToAraRatio}:1
                    </div>
                    <div className="text-[9px] text-slate-500">{item.assignedAraCount} ARA</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400">Key Custody</div>
                    <div className="font-bold text-slate-900 truncate px-1" title={item.keyHolder?.full_name || 'None'}>
                      {item.keyHolder ? item.keyHolder.avatar_initials : 'VACANT'}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {item.keyHolder ? `${item.keyHolder.current_weekly_hours}h load` : 'No ARA'}
                    </div>
                  </div>
                </div>

                {/* Factors */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
                  {item.contentionFactors.length > 0 ? (
                    <div className="space-y-1">
                      {item.contentionFactors.slice(0, 2).map((factor, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-slate-700 text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                          <span className="truncate">{factor}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-emerald-700 text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Optimal session density & coverage</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="text-[#002147] font-bold flex items-center gap-0.5">
                    Inspect <ChevronRight className="w-3 h-3" />
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveInspectorRoomId(item.room.id);
                      setEditingRoom(item.room);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-md border border-amber-500 shadow-2xs transition-all active:scale-95"
                  >
                    <Wrench className="w-3 h-3 text-slate-950" />
                    <span>Fix / Edit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-in or Modal Room Contention Inspector */}
      {inspectorData && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-[#002147]/20 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#002147] text-amber-400 font-bold flex items-center justify-center font-mono text-sm shadow-sm">
                {inspectorData.room.room_code.replace('Room ', '')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 font-serif">
                    {inspectorData.room.room_code} — {inspectorData.room.room_name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-slate-100 text-slate-700">
                    Capacity: {inspectorData.room.capacity} seats
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  {inspectorData.block?.name} • Lab Type: {inspectorData.room.lab_type}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingRoom(inspectorData.room)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg border border-amber-500 shadow-sm transition-all active:scale-95"
              >
                <Wrench className="w-3.5 h-3.5 text-slate-950" />
                <span>Fix Allocation & Custody (Admin/Head)</span>
              </button>
              <button
                onClick={() => setActiveInspectorRoomId(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left Col: Key-Holder and Operational Profile */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3 text-xs">
              <div className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                Key Custody & Custodian Profile
              </div>

              {inspectorData.keyHolder ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#002147] text-amber-400 font-bold flex items-center justify-center text-xs">
                      {inspectorData.keyHolder.avatar_initials}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{inspectorData.keyHolder.full_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {inspectorData.keyHolder.ara_code} • {inspectorData.keyHolder.phone}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Program / Standing:</span>
                      <span className="font-semibold text-slate-800">{inspectorData.keyHolder.program || 'CSE'} ({inspectorData.keyHolder.gpa_or_standing})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Weekly Hours Assigned:</span>
                      <span className={`font-bold ${inspectorData.keyHolder.current_weekly_hours >= inspectorData.keyHolder.max_weekly_hours ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {inspectorData.keyHolder.current_weekly_hours}h / {inspectorData.keyHolder.max_weekly_hours}h cap
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mandatory Rule (§14):</span>
                      <span className="font-semibold text-slate-800">
                        {inspectorData.isKeyHolderMandatory ? 'Enforced (+60 pts)' : 'Standard Preference'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    Unassigned Key Custody!
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    No active ARA has key custody for this room. Sessions scheduled here cannot proceed unless an assistant holds physical room access.
                  </p>
                </div>
              )}
            </div>

            {/* Middle Col: Scheduled Sessions in this Room */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs md:col-span-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-700" />
                  Scheduled Laboratory Sessions ({inspectorData.sessions.length})
                </div>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  {inspectorData.totalWeeklyHours} Hours / Week
                </span>
              </div>

              {inspectorData.sessions.length === 0 ? (
                <p className="text-slate-400 py-4 text-center italic">No laboratory sessions scheduled in this room.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {inspectorData.sessions.map((sess) => {
                    const sessAssignment = assignments.find(
                      (a) => a.session_id === sess.id && a.status !== 'Declined'
                    );
                    const assignedAra = sessAssignment ? aras.find((a) => a.id === sessAssignment.ara_id) : null;

                    return (
                      <div
                        key={sess.id}
                        className="p-2 bg-white rounded border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#002147]">{sess.day_of_week}</span>{' '}
                          <span className="font-mono text-slate-600">({sess.start_time} - {sess.end_time})</span>
                          <div className="text-[11px] text-slate-600">
                            {sess.course_id.replace('course-', '').toUpperCase()} • {sess.section} • {sess.duration_hours}h
                          </div>
                        </div>

                        <div className="text-right text-[11px]">
                          {assignedAra ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-bold">
                              Assigned: {assignedAra.full_name}
                            </span>
                          ) : (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-bold">
                              ARA Required
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Administrative Recommendation */}
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs">
                <div className="font-bold flex items-center gap-1 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  Administrator Recommendation:
                </div>
                <p className="text-[11px] leading-relaxed">{inspectorData.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Fix / Edit Room Allocation Modal */}
      {editingRoom && (
        <RoomAllocationFixModal
          isOpen={!!editingRoom}
          onClose={() => setEditingRoom(null)}
          room={editingRoom}
          block={blocks.find((b) => b.id === editingRoom.block_id)}
          contentionData={roomContentionList.find((r) => r.room.id === editingRoom.id)}
          aras={aras}
          sessions={sessions}
          assignments={assignments}
          roomResponsibilities={roomResponsibilities}
          currentRole={currentUserRole}
          onUpdateRoomResponsibility={onUpdateRoomResponsibility}
          onAssignAraToSession={onAssignAraToSession}
        />
      )}
    </div>
  );
};
