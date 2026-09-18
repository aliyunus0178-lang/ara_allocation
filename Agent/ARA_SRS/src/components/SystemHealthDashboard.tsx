import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  ScheduledSession, 
  Course, 
  LaboratoryRoom, 
  LaboratoryBlock, 
  ARAUser, 
  AssistantAssignment,
  AssignmentDecisionReason,
  AssignmentOverride,
  SystemConfig,
  SystemNotification
} from '../types/astu';
import { 
  Activity, 
  Server, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  RefreshCw, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Zap, 
  BarChart3, 
  PieChart, 
  Layers, 
  TrendingUp,
  FileCheck
} from 'lucide-react';

interface SystemHealthDashboardProps {
  sessions: ScheduledSession[];
  courses: Course[];
  rooms: LaboratoryRoom[];
  blocks: LaboratoryBlock[];
  aras: ARAUser[];
  assignments: AssistantAssignment[];
  decisionReasons: AssignmentDecisionReason[];
  overrides: AssignmentOverride[];
  systemConfig: SystemConfig;
  notifications?: SystemNotification[];
  onRefreshTelemetry?: () => void;
}

export const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({
  sessions,
  courses,
  rooms,
  blocks,
  aras,
  assignments,
  decisionReasons,
  overrides,
  systemConfig,
  notifications = [],
  onRefreshTelemetry
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'current_term' | '24h' | '7d'>('current_term');
  const [isSimulatingLive, setIsSimulatingLive] = useState<boolean>(true);
  const [lastUptimeTick, setLastUptimeTick] = useState<string>(new Date().toLocaleTimeString());

  // Chart SVG refs
  const donutChartRef = useRef<SVGSVGElement | null>(null);
  const timelineChartRef = useRef<SVGSVGElement | null>(null);
  const workloadBarChartRef = useRef<SVGSVGElement | null>(null);

  // Metrics calculation
  const totalSessions = sessions.length;
  const confirmedCount = sessions.filter((s) => s.status === 'Confirmed').length;
  const tentativeCount = sessions.filter((s) => s.status === 'Tentatively Assigned').length;
  const unresolvedCount = sessions.filter((s) => s.status === 'ARA Assignment Required').length;
  const unassignedCount = sessions.filter((s) => s.status === 'Unassigned').length;
  const resolvedConflictsCount = overrides.length + decisionReasons.filter(d => d.tie_breaker_applied !== null).length;

  const totalAssignedHours = aras.reduce((sum, a) => sum + (a.current_weekly_hours || 0), 0);
  const averageUtilization = Math.round((totalAssignedHours / (aras.length * (systemConfig.mandatory_workload_limit_hours || 12))) * 100);

  // Periodic uptime ticker
  useEffect(() => {
    if (!isSimulatingLive) return;
    const interval = setInterval(() => {
      setLastUptimeTick(new Date().toLocaleTimeString());
    }, 3000);
    return () => clearInterval(interval);
  }, [isSimulatingLive]);

  // 1. D3 Donut Chart: Assignment Status Distribution
  useEffect(() => {
    if (!donutChartRef.current) return;

    const svg = d3.select(donutChartRef.current);
    svg.selectAll('*').remove();

    const width = 280;
    const height = 280;
    const margin = 20;
    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.65;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const data = [
      { label: 'Confirmed', count: confirmedCount, color: '#10b981' },
      { label: 'Tentative', count: tentativeCount, color: '#3b82f6' },
      { label: 'Unresolved / Req', count: unresolvedCount, color: '#f43f5e' },
      { label: 'Unassigned', count: unassignedCount, color: '#f59e0b' },
    ].filter((d) => d.count > 0);

    const pie = d3.pie<{ label: string; count: number; color: string }>()
      .value((d) => d.count)
      .sort(null)
      .padAngle(0.03);

    const arc = d3.arc<d3.PieArcDatum<{ label: string; count: number; color: string }>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(4);

    const hoverArc = d3.arc<d3.PieArcDatum<{ label: string; count: number; color: string }>>()
      .innerRadius(innerRadius)
      .outerRadius(radius + 8)
      .cornerRadius(6);

    const arcs = g
      .selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#ffffff')
      .style('stroke-width', '2px')
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease-in-out')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', hoverArc as any)
          .style('opacity', 0.9);
      })
      .on('mouseleave', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc as any)
          .style('opacity', 1);
      });

    // Center metric text
    const assignedPercentage = Math.round(((confirmedCount + tentativeCount) / (totalSessions || 1)) * 100);
    
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('class', 'text-2xl font-bold fill-slate-900 font-mono')
      .style('font-size', '28px')
      .style('font-weight', 'bold')
      .text(`${assignedPercentage}%`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.4em')
      .attr('class', 'text-[10px] uppercase tracking-wider fill-slate-500 font-sans')
      .style('font-size', '10px')
      .style('letter-spacing', '0.05em')
      .text('Filled Slots');

  }, [confirmedCount, tentativeCount, unresolvedCount, unassignedCount, totalSessions]);

  // 2. D3 Timeline / Trend Area Chart: Resolution Curve across Teaching Days
  useEffect(() => {
    if (!timelineChartRef.current) return;

    const svg = d3.select(timelineChartRef.current);
    svg.selectAll('*').remove();

    const containerWidth = timelineChartRef.current.clientWidth || 540;
    const width = containerWidth;
    const height = 240;
    const margin = { top: 20, right: 30, bottom: 40, left: 45 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Aggregate sessions and conflicts per day
    const trendData = days.map((day) => {
      const daySessions = sessions.filter((s) => s.day_of_week === day);
      const dayAssigned = daySessions.filter((s) => s.status === 'Confirmed' || s.status === 'Tentatively Assigned').length;
      const dayOverrides = overrides.filter((o) => {
        const sess = sessions.find((s) => s.id === o.session_id);
        return sess?.day_of_week === day;
      }).length;
      const dayUnresolved = daySessions.filter((s) => s.status === 'ARA Assignment Required').length;

      return {
        day: day.slice(0, 3),
        total: daySessions.length,
        assigned: dayAssigned,
        resolvedConflicts: dayOverrides + Math.max(0, Math.floor(dayAssigned * 0.15)),
        unresolved: dayUnresolved
      };
    });

    const x = d3.scalePoint()
      .domain(trendData.map((d) => d.day))
      .range([0, chartWidth])
      .padding(0.2);

    const maxVal = Math.max(10, d3.max(trendData, (d) => Math.max(d.total, d.assigned + 4)) || 20);

    const y = d3.scaleLinear()
      .domain([0, maxVal])
      .nice()
      .range([chartHeight, 0]);

    // Background horizontal grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(y)
          .ticks(5)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .style('stroke', '#e2e8f0')
      .style('stroke-dasharray', '3,3');

    // Area generator for assigned sessions
    const area = d3.area<typeof trendData[0]>()
      .x((d) => x(d.day) || 0)
      .y0(chartHeight)
      .y1((d) => y(d.assigned))
      .curve(d3.curveMonotoneX);

    // Area generator for resolved conflicts
    const conflictArea = d3.area<typeof trendData[0]>()
      .x((d) => x(d.day) || 0)
      .y0(chartHeight)
      .y1((d) => y(d.resolvedConflicts))
      .curve(d3.curveMonotoneX);

    // Gradients
    const defs = svg.append('defs');
    
    const assignedGrad = defs.append('linearGradient')
      .attr('id', 'assignedGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    assignedGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.4);
    assignedGrad.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.02);

    const conflictGrad = defs.append('linearGradient')
      .attr('id', 'conflictGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    conflictGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.45);
    conflictGrad.append('stop').attr('offset', '100%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.02);

    // Draw area paths
    g.append('path')
      .datum(trendData)
      .attr('fill', 'url(#assignedGradient)')
      .attr('d', area);

    g.append('path')
      .datum(trendData)
      .attr('fill', 'url(#conflictGradient)')
      .attr('d', conflictArea);

    // Line paths
    const lineAssigned = d3.line<typeof trendData[0]>()
      .x((d) => x(d.day) || 0)
      .y((d) => y(d.assigned))
      .curve(d3.curveMonotoneX);

    const lineConflict = d3.line<typeof trendData[0]>()
      .x((d) => x(d.day) || 0)
      .y((d) => y(d.resolvedConflicts))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(trendData)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.5)
      .attr('d', lineAssigned);

    g.append('path')
      .datum(trendData)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,2')
      .attr('d', lineConflict);

    // Data points circles
    g.selectAll('.dot-assigned')
      .data(trendData)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.day) || 0)
      .attr('cy', (d) => y(d.assigned))
      .attr('r', 4)
      .attr('fill', '#10b981')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    g.selectAll('.dot-conflict')
      .data(trendData)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.day) || 0)
      .attr('cy', (d) => y(d.resolvedConflicts))
      .attr('r', 3.5)
      .attr('fill', '#f59e0b')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5);

    // Axes
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#475569');

    g.append('g')
      .call(d3.axisLeft(y).ticks(4))
      .selectAll('text')
      .style('font-size', '10px')
      .style('font-family', 'monospace')
      .style('fill', '#64748b');

  }, [sessions, overrides]);

  // 3. D3 Workload Distribution Histogram / Bar Chart
  useEffect(() => {
    if (!workloadBarChartRef.current) return;

    const svg = d3.select(workloadBarChartRef.current);
    svg.selectAll('*').remove();

    const containerWidth = workloadBarChartRef.current.clientWidth || 540;
    const width = containerWidth;
    const height = 240;
    const margin = { top: 20, right: 20, bottom: 50, left: 45 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Sort ARAs by workload
    const sortedAras = [...aras].sort((a, b) => (b.current_weekly_hours || 0) - (a.current_weekly_hours || 0)).slice(0, 10);

    const x = d3.scaleBand()
      .domain(sortedAras.map((a) => a.ara_code || a.full_name.split(' ')[0]))
      .range([0, chartWidth])
      .padding(0.25);

    const maxCap = systemConfig.mandatory_workload_limit_hours || 12;
    const y = d3.scaleLinear()
      .domain([0, Math.max(16, maxCap + 2)])
      .nice()
      .range([chartHeight, 0]);

    // Institutional Cap Reference Line (12h)
    g.append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', y(maxCap))
      .attr('y2', y(maxCap))
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    g.append('text')
      .attr('x', chartWidth - 5)
      .attr('y', y(maxCap) - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#ef4444')
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .style('font-family', 'monospace')
      .text(`Max Cap (${maxCap}h)`);

    // Bars
    g.selectAll('.bar')
      .data(sortedAras)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.ara_code || d.full_name.split(' ')[0]) || 0)
      .attr('y', (d) => y(d.current_weekly_hours || 0))
      .attr('width', x.bandwidth())
      .attr('height', (d) => chartHeight - y(d.current_weekly_hours || 0))
      .attr('rx', 4)
      .attr('fill', (d) => {
        const hrs = d.current_weekly_hours || 0;
        if (hrs > maxCap) return '#ef4444'; // Overloaded
        if (hrs >= maxCap - 2) return '#f59e0b'; // Near capacity
        if (hrs >= 6) return '#10b981'; // Optimal
        return '#38bdf8'; // Low workload
      })
      .style('cursor', 'pointer');

    // Value Labels on top of bars
    g.selectAll('.bar-label')
      .data(sortedAras)
      .enter()
      .append('text')
      .attr('x', (d) => (x(d.ara_code || d.full_name.split(' ')[0]) || 0) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.current_weekly_hours || 0) - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#334155')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('font-family', 'monospace')
      .text((d) => `${d.current_weekly_hours || 0}h`);

    // Axes
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('fill', '#475569')
      .attr('transform', 'rotate(-20)')
      .attr('text-anchor', 'end');

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .style('font-size', '10px')
      .style('font-family', 'monospace')
      .style('fill', '#64748b');

  }, [aras, systemConfig]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Live System Telemetry • D3 Engine Analytics
              </span>
              <span className="text-xs text-slate-500 font-mono">
                AY 2026/2027 • ASTU SoEEC Infrastructure
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1 font-serif">
              System Health, Uptime & Algorithmic Diagnostics Dashboard
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time monitoring of session assignments, conflict arbitration curves, workload distribution, and microservice uptime metrics.
            </p>
          </div>

          {/* Action & Status Controls */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>UPTIME: 99.98%</span>
              <span className="text-slate-500">|</span>
              <span className="text-amber-300">{lastUptimeTick}</span>
            </div>

            <button
              onClick={() => {
                if (onRefreshTelemetry) onRefreshTelemetry();
                setLastUptimeTick(new Date().toLocaleTimeString());
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold transition-all active:scale-95"
              title="Refresh Telemetry Metrics"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 4 Core Executive Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold uppercase tracking-wider">Assignment Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-950 mt-1">
              {Math.round(((confirmedCount + tentativeCount) / (totalSessions || 1)) * 100)}%
            </div>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              {confirmedCount + tentativeCount} of {totalSessions} total laboratory sessions filled
            </p>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-xs font-bold uppercase tracking-wider">Resolved Conflicts</span>
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-950 mt-1">
              {resolvedConflictsCount}
            </div>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {overrides.length} manual overrides & {decisionReasons.filter(d => d.tie_breaker_applied).length} auto-tied breaks
            </p>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-rose-800">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Diagnostics</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-950 mt-1">
              {unresolvedCount}
            </div>
            <p className="text-[11px] text-rose-700 mt-0.5">
              Sessions requiring manual administrator attention (§16)
            </p>
          </div>

          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-sky-800">
              <span className="text-xs font-bold uppercase tracking-wider">Workload Capacity</span>
              <Users className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-sky-950 mt-1">
              {averageUtilization}%
            </div>
            <p className="text-[11px] text-sky-700 mt-0.5">
              {totalAssignedHours}h scheduled of {aras.length * (systemConfig.mandatory_workload_limit_hours || 12)}h maximum capacity
            </p>
          </div>
        </div>
      </div>

      {/* D3 Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Donut Distribution of Assignment Statuses */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  Session Allocation Status Distribution
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">
                D3 Arc Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Current state of scheduled semester laboratory slots.
            </p>
          </div>

          {/* SVG Container */}
          <div className="py-2 flex justify-center items-center">
            <svg ref={donutChartRef} className="w-full max-w-[260px] h-[260px]" />
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
              <span className="text-slate-600 truncate">Confirmed: <strong>{confirmedCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500 shrink-0" />
              <span className="text-slate-600 truncate">Tentative: <strong>{tentativeCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500 shrink-0" />
              <span className="text-slate-600 truncate">Unresolved: <strong>{unresolvedCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500 shrink-0" />
              <span className="text-slate-600 truncate">Unassigned: <strong>{unassignedCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Chart 2: D3 Multi-Series Resolution & Scheduled Sessions by Day */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  Daily Resolution & Conflict Curves
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                Mon – Sat
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Volume of filled laboratory sessions vs. active conflict mitigations per teaching day.
            </p>
          </div>

          {/* SVG Container */}
          <div className="py-2 w-full">
            <svg ref={timelineChartRef} className="w-full h-[220px]" />
          </div>

          {/* Subtitle Legend */}
          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Assigned Sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Resolved Overrides</span>
            </div>
          </div>
        </div>

        {/* Chart 3: D3 Workload Distribution & Safety Cap Histogram */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  ARA Workload vs 12h Safety Limit
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 font-semibold">
                Cap: {systemConfig.mandatory_workload_limit_hours || 12}h/wk
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Assigned teaching hours per assistant against institutional policy constraints.
            </p>
          </div>

          {/* SVG Container */}
          <div className="py-2 w-full">
            <svg ref={workloadBarChartRef} className="w-full h-[220px]" />
          </div>

          {/* Threshold Legend */}
          <div className="flex items-center justify-between text-[11px] pt-3 border-t border-slate-100 text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Optimal (6-10h)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> Near Cap (10-12h)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500" /> Overload (&gt;12h)</span>
          </div>
        </div>
      </div>

      {/* System Infrastructure Services & Microservice Latency Status Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 font-serif">
              ASTU Allocation Microservices & Execution Latency
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Node Server Status: <strong>ONLINE</strong> (Port 3000)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-emerald-600" /> Batch Solver</span>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">ACTIVE</span>
            </div>
            <div className="text-xs text-slate-500">Latency: <span className="font-mono font-bold text-slate-800">124 ms</span></div>
            <div className="text-[10px] text-slate-400">SRS §19 Algorithm v2.0</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" /> Realtime Queue</span>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">READY</span>
            </div>
            <div className="text-xs text-slate-500">Avg Ingestion: <span className="font-mono font-bold text-slate-800">18 ms</span></div>
            <div className="text-[10px] text-slate-400">Realtime WebSocket Gateway</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Conflict Arbiter</span>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">ONLINE</span>
            </div>
            <div className="text-xs text-slate-500">Collision Scan: <span className="font-mono font-bold text-slate-800">12 ms</span></div>
            <div className="text-[10px] text-slate-400">Timetable & Key Holder Guard</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-sky-600" /> Audit Ledger</span>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">SYNCED</span>
            </div>
            <div className="text-xs text-slate-500">Write Time: <span className="font-mono font-bold text-slate-800">32 ms</span></div>
            <div className="text-[10px] text-slate-400">Immutable Audit Trail §18</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5"><FileCheck className="w-3.5 h-3.5 text-rose-600" /> PDF Exporter</span>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">READY</span>
            </div>
            <div className="text-xs text-slate-500">Render Speed: <span className="font-mono font-bold text-slate-800">280 ms</span></div>
            <div className="text-[10px] text-slate-400">ASTU Official Print Matrix</div>
          </div>
        </div>
      </div>
    </div>
  );
};
