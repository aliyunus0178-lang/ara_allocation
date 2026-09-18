import React, { useState, useMemo } from 'react';
import { 
  ARAUser, 
  AssistantAssignment, 
  ScheduledSession, 
  Course, 
  LaboratoryRoom,
  SystemConfig
} from '../types/astu';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell, 
  ReferenceLine 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Clock, 
  Filter, 
  Layers, 
  ArrowUpRight,
  ShieldAlert,
  Scale,
  Sparkles
} from 'lucide-react';

interface BatchAllocationAnalyticsProps {
  aras: ARAUser[];
  assignments: AssistantAssignment[];
  sessions: ScheduledSession[];
  courses: Course[];
  rooms: LaboratoryRoom[];
  systemConfig?: SystemConfig;
}

export const BatchAllocationAnalytics: React.FC<BatchAllocationAnalyticsProps> = ({
  aras,
  assignments,
  sessions,
  courses,
  rooms,
  systemConfig,
}) => {
  const [metricType, setMetricType] = useState<'hours' | 'sessions'>('hours');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'sara' | 'ara'>('all');

  // Calculate workload stats per ARA
  const araAnalyticsData = useMemo(() => {
    return aras
      .filter((ara) => {
        if (departmentFilter !== 'all' && ara.department !== departmentFilter) return false;
        if (roleFilter === 'sara' && !ara.is_sara) return false;
        if (roleFilter === 'ara' && ara.is_sara) return false;
        return true;
      })
      .map((ara) => {
        const araAssignments = assignments.filter(
          (a) => a.ara_id === ara.id && a.status !== 'Declined'
        );

        const assignedSessions = araAssignments
          .map((a) => sessions.find((s) => s.id === a.session_id))
          .filter(Boolean) as ScheduledSession[];

        const totalHours = assignedSessions.reduce(
          (sum, s) => sum + (s.duration_hours || 2),
          0
        );

        const maxHours = ara.max_weekly_hours || 12;
        const maxSessionsCap = Math.round(maxHours / 2);
        const utilizationRate = Math.round((totalHours / maxHours) * 100);

        // Check for concurrent time collisions on same day
        let hasConflict = false;
        for (let i = 0; i < assignedSessions.length; i++) {
          for (let j = i + 1; j < assignedSessions.length; j++) {
            const s1 = assignedSessions[i];
            const s2 = assignedSessions[j];
            if (s1.day_of_week === s2.day_of_week) {
              const parseTime = (t: string) => {
                const [h, m] = t.split(':').map(Number);
                return (h || 0) * 60 + (m || 0);
              };
              const s1Start = parseTime(s1.start_time);
              const s1End = parseTime(s1.end_time);
              const s2Start = parseTime(s2.start_time);
              const s2End = parseTime(s2.end_time);
              if (s1Start < s2End && s2Start < s1End) {
                hasConflict = true;
                break;
              }
            }
          }
          if (hasConflict) break;
        }

        let status: 'balanced' | 'near_capacity' | 'overloaded' | 'unallocated' = 'balanced';
        if (hasConflict || totalHours > maxHours) {
          status = 'overloaded';
        } else if (totalHours >= maxHours * 0.85) {
          status = 'near_capacity';
        } else if (totalHours === 0) {
          status = 'unallocated';
        }

        const nameParts = ara.full_name.split(' ');
        const shortName = `${nameParts[0]} (${ara.ara_code})`;

        return {
          id: ara.id,
          araCode: ara.ara_code,
          fullName: ara.full_name,
          shortName,
          department: ara.department,
          isSara: !!ara.is_sara,
          assignedHours: totalHours,
          maxWeeklyHours: maxHours,
          assignedSessionsCount: assignedSessions.length,
          maxSessionsCap,
          utilizationRate,
          status,
          hasConflict,
          assignedCourses: Array.from(
            new Set(
              assignedSessions
                .map((s) => courses.find((c) => c.id === s.course_id)?.course_code)
                .filter(Boolean)
            )
          ),
          assignedRooms: Array.from(
            new Set(
              assignedSessions
                .map((s) => rooms.find((r) => r.id === s.room_id)?.room_code)
                .filter(Boolean)
            )
          ),
        };
      })
      .sort((a, b) => b.assignedHours - a.assignedHours);
  }, [aras, assignments, sessions, courses, rooms, departmentFilter, roleFilter]);

  // Aggregate high level KPIs
  const aggregateStats = useMemo(() => {
    const totalAssignedHours = araAnalyticsData.reduce((sum, a) => sum + a.assignedHours, 0);
    const totalMaxHours = araAnalyticsData.reduce((sum, a) => sum + a.maxWeeklyHours, 0);
    const avgUtilization = totalMaxHours > 0 ? Math.round((totalAssignedHours / totalMaxHours) * 100) : 0;
    const overloadedCount = araAnalyticsData.filter((a) => a.status === 'overloaded').length;
    const nearCapacityCount = araAnalyticsData.filter((a) => a.status === 'near_capacity').length;
    const balancedCount = araAnalyticsData.filter((a) => a.status === 'balanced').length;
    const unallocatedCount = araAnalyticsData.filter((a) => a.status === 'unallocated').length;

    return {
      totalAssignedHours,
      totalMaxHours,
      avgUtilization,
      overloadedCount,
      nearCapacityCount,
      balancedCount,
      unallocatedCount,
    };
  }, [araAnalyticsData]);

  // Chart data formatting
  const chartData = araAnalyticsData.map((d) => ({
    name: d.shortName,
    fullName: d.fullName,
    araCode: d.araCode,
    department: d.department,
    isSara: d.isSara,
    assigned: metricType === 'hours' ? d.assignedHours : d.assignedSessionsCount,
    capacity: metricType === 'hours' ? d.maxWeeklyHours : d.maxSessionsCap,
    utilizationRate: d.utilizationRate,
    status: d.status,
    hasConflict: d.hasConflict,
    courses: d.assignedCourses.join(', ') || 'None',
    rooms: d.assignedRooms.join(', ') || 'None',
  }));

  const getBarFillColor = (status: string, hasConflict: boolean) => {
    if (hasConflict || status === 'overloaded') return '#e11d48'; // Rose/Red 600
    if (status === 'near_capacity') return '#d97706'; // Amber 600
    if (status === 'balanced') return '#4f46e5'; // Indigo 600
    return '#94a3b8'; // Slate 400
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isOverloaded = data.status === 'overloaded' || data.hasConflict;

      return (
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 text-xs max-w-xs space-y-2 z-50">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div>
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                {data.fullName}
                {data.isSara && (
                  <span className="px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[9px] font-bold">
                    SARA
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">{data.araCode} • {data.department}</div>
            </div>
            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
              isOverloaded 
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' 
                : data.status === 'near_capacity'
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
            }`}>
              {isOverloaded ? 'Overloaded' : data.status === 'near_capacity' ? 'Near Capacity' : 'Balanced'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Assigned</span>
              <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                {metricType === 'hours' ? `${data.assigned}h / week` : `${data.assigned} sessions`}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Capacity Limit</span>
              <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                {metricType === 'hours' ? `${data.capacity}h / week` : `${data.capacity} sessions`}
              </span>
            </div>
          </div>

          <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Workload Load:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{data.utilizationRate}%</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Assigned Labs:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 truncate max-w-[130px]">{data.courses}</span>
            </div>
            {data.hasConflict && (
              <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-[10px] mt-1 pt-1 border-t border-rose-100 dark:border-rose-900/50">
                <ShieldAlert className="w-3 h-3 flex-shrink-0" />
                <span>Double-booking timetable overlap detected!</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const departments = Array.from(new Set(aras.map((a) => a.department)));

  return (
    <div className="space-y-6" id="batch-allocation-analytics-panel">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Workload Optimization & Balance Analytics
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                ASTU SRS §6 & §8.3
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-serif">
              Batch Allocation Capacity vs. Load Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live Recharts visualization comparing actual assigned laboratory hours and sessions against official weekly capacity limits to prevent ARA fatigue and double-booking collisions.
            </p>
          </div>

          {/* Metric View Selector */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setMetricType('hours')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                metricType === 'hours'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Weekly Hours (hrs)
            </button>
            <button
              onClick={() => setMetricType('sessions')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                metricType === 'sessions'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Session Count
            </button>
          </div>
        </div>

        {/* 4 Executive KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-300 text-xs font-bold uppercase">
              <span>Total Allocated</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-950 dark:text-indigo-200 mt-1">
              {aggregateStats.totalAssignedHours} <span className="text-xs font-normal text-indigo-700 dark:text-indigo-300">hrs/week</span>
            </div>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5">
              {aggregateStats.avgUtilization}% total fleet capacity utilized
            </p>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase">
              <span>Balanced ARAs</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-950 dark:text-emerald-200 mt-1">
              {aggregateStats.balancedCount} <span className="text-xs font-normal text-emerald-700 dark:text-emerald-300">assistants</span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
              Optimal workload range (10% - 84%)
            </p>
          </div>

          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-bold uppercase">
              <span>Near Capacity</span>
              <Scale className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-950 dark:text-amber-200 mt-1">
              {aggregateStats.nearCapacityCount} <span className="text-xs font-normal text-amber-700 dark:text-amber-300">assistants</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
              85% - 100% of maximum allowance
            </p>
          </div>

          <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 text-xs font-bold uppercase">
              <span>Overloaded / Conflicts</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-950 dark:text-rose-200 mt-1">
              {aggregateStats.overloadedCount} <span className="text-xs font-normal text-rose-700 dark:text-rose-300">flagged</span>
            </div>
            <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
              Exceeds weekly cap or concurrent collision
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" /> Filter by:
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Personnel (ARA & SARA)</option>
            <option value="sara">Senior Assistants (SARA only)</option>
            <option value="ara">Resource Assistants (ARA only)</option>
          </select>

          <div className="ml-auto flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />
              <span className="text-slate-600 dark:text-slate-400">Assigned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-600 inline-block" />
              <span className="text-slate-600 dark:text-slate-400">Weekly Capacity Cap</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-600 inline-block" />
              <span className="text-slate-600 dark:text-slate-400">Overloaded Alert</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Recharts Bar Chart Visualization */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              Assistant Workload vs. Maximum Allowed Capacity
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive bar comparison with live utilization threshold metrics and conflict highlighting.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
            {chartData.length} Assistants Displayed
          </span>
        </div>

        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 65 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
              <XAxis
                dataKey="name"
                angle={-38}
                textAnchor="end"
                interval={0}
                height={70}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                label={{
                  value: metricType === 'hours' ? 'Assigned Hours / Week' : 'Sessions / Week',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 0,
                  style: { fontSize: 11, fill: '#64748b' },
                }}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
              />
              <ReferenceLine
                y={metricType === 'hours' ? 12 : 6}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: metricType === 'hours' ? 'Standard Cap (12h)' : 'Standard Cap (6 sessions)',
                  position: 'top',
                  fill: '#d97706',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              {/* Actual Assigned Bar with Cell coloring */}
              <Bar
                dataKey="assigned"
                name={metricType === 'hours' ? 'Assigned Weekly Hours' : 'Assigned Sessions Count'}
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarFillColor(entry.status, entry.hasConflict)}
                  />
                ))}
              </Bar>
              {/* Capacity Limit Bar */}
              <Bar
                dataKey="capacity"
                name={metricType === 'hours' ? 'Weekly Hours Cap' : 'Max Sessions Cap'}
                fill="#cbd5e1"
                radius={[4, 4, 0, 0]}
                opacity={0.6}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assistant Load Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Assistant Capacity & Balance Audit Table
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Granular breakdown of workload distribution, room custody, and conflict alerts.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {araAnalyticsData.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Assistant</th>
                <th className="p-3">Role</th>
                <th className="p-3">Department</th>
                <th className="p-3 text-center">Assigned Hours</th>
                <th className="p-3 text-center">Weekly Cap</th>
                <th className="p-3">Workload Bar</th>
                <th className="p-3">Load Status</th>
                <th className="p-3">Assigned Courses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {araAnalyticsData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-white">{row.fullName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{row.araCode}</div>
                  </td>
                  <td className="p-3">
                    {row.isSara ? (
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        SARA (Senior)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        ARA (Assistant)
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{row.department}</td>
                  <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                    {row.assignedHours}h <span className="text-[10px] text-slate-500 font-normal">({row.assignedSessionsCount} sess)</span>
                  </td>
                  <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400">
                    {row.maxWeeklyHours}h
                  </td>
                  <td className="p-3 w-40">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          row.hasConflict || row.status === 'overloaded'
                            ? 'bg-rose-600'
                            : row.status === 'near_capacity'
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(row.utilizationRate, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                      {row.utilizationRate}% utilized
                    </span>
                  </td>
                  <td className="p-3">
                    {row.hasConflict ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300">
                        <ShieldAlert className="w-3 h-3" /> Concurrent Conflict
                      </span>
                    ) : row.status === 'overloaded' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                        <AlertTriangle className="w-3 h-3" /> Overloaded
                      </span>
                    ) : row.status === 'near_capacity' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        <Scale className="w-3 h-3" /> Near Capacity
                      </span>
                    ) : row.status === 'balanced' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" /> Balanced
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800">
                        Unallocated
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                    {row.assignedCourses.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {row.assignedCourses.map((c) => (
                          <span key={c} className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-[10px] text-slate-700 dark:text-slate-300">
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No assigned courses</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
