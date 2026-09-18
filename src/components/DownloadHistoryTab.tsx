import React, { useState } from 'react';
import { 
  DownloadReportRecord, 
  ScheduledSession, 
  Course, 
  LaboratoryRoom, 
  LaboratoryBlock, 
  ARAUser, 
  ARARoomResponsibility,
  AssistantAssignment,
  AssignmentDecisionReason,
  AssignmentOverride,
  SystemConfig
} from '../types/astu';
import { 
  Download, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Building2, 
  Users, 
  ShieldCheck, 
  Calendar, 
  Sparkles,
  RefreshCw,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { generateOfficialAstuPdfReport } from '../services/pdfReportGenerator';
import { INITIAL_SYSTEM_CONFIG } from '../data/mockAstuData';

interface DownloadHistoryTabProps {
  downloadHistory: DownloadReportRecord[];
  sessions: ScheduledSession[];
  courses: Course[];
  rooms: LaboratoryRoom[];
  blocks: LaboratoryBlock[];
  aras: ARAUser[];
  roomResponsibilities: ARARoomResponsibility[];
  assignments?: AssistantAssignment[];
  decisionReasons?: AssignmentDecisionReason[];
  overrides?: AssignmentOverride[];
  systemConfig?: SystemConfig;
  onTriggerNewReport?: () => void;
  onRecordNewDownload?: (record: DownloadReportRecord) => void;
}

export const DownloadHistoryTab: React.FC<DownloadHistoryTabProps> = ({
  downloadHistory,
  sessions,
  courses,
  rooms,
  blocks,
  aras,
  roomResponsibilities,
  assignments = [],
  decisionReasons = [],
  overrides = [],
  systemConfig = INITIAL_SYSTEM_CONFIG,
  onTriggerNewReport,
  onRecordNewDownload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const filteredHistory = downloadHistory.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.report_title.toLowerCase().includes(q);
      const matchBy = item.generated_by_name.toLowerCase().includes(q);
      const matchScope = item.scope_description.toLowerCase().includes(q);
      if (!matchTitle && !matchBy && !matchScope) return false;
    }
    return true;
  });

  const handleReDownload = async (record: DownloadReportRecord) => {
    setIsGenerating(record.id);
    try {
      // Re-trigger the authoritative PDF generator
      generateOfficialAstuPdfReport({
        sessions,
        courses,
        rooms,
        blocks,
        aras,
        assignments,
        roomResponsibilities,
        decisionReasons,
        overrides,
        systemConfig
      });
      
      if (onRecordNewDownload) {
        onRecordNewDownload({
          ...record,
          id: `hist-${Date.now()}`,
          generated_at: new Date().toISOString(),
          download_count: record.download_count + 1,
        });
      }
    } catch (err) {
      console.error('Failed to re-download report:', err);
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                Archive & Compliance Ledger • Current Semester I
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                AY 2026/2027
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-serif">
              Laboratory Allocation PDF Reports — Download & Audit History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Access, inspect, and re-download official institutional timetable packages, room custodian endorsement manifests, and multi-assistant batch allocations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {onTriggerNewReport && (
              <button
                onClick={onTriggerNewReport}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg border border-amber-500 shadow-sm transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Generate New PDF Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter & Search Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports by title, generator (e.g. Ali Kibret, SoEEC Master, Block B-510)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Official & Sealed">Official & Sealed</option>
              <option value="Pre-Approval">Pre-Approval</option>
              <option value="Draft Matrix">Draft Matrix</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-[#001733] text-white uppercase text-[11px] font-mono tracking-wider">
              <tr>
                <th className="py-3 px-4">Report Package & Title</th>
                <th className="py-3 px-3">Academic Term</th>
                <th className="py-3 px-3">Generated By</th>
                <th className="py-3 px-3">Scope & Metrics</th>
                <th className="py-3 px-3">Date & Format</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-medium text-sm text-slate-600 dark:text-slate-400">No report download records found</p>
                    <p className="text-xs text-slate-400 mt-1">Generate a new report to log and archive downloads for this semester.</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center shrink-0 text-amber-600 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">
                            {item.report_title}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {item.scope_description}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                        {item.academic_term}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {item.generated_by_name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {item.generated_by_role}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="space-y-0.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        <div><strong>{item.total_sessions}</strong> Sessions • <strong>{item.total_rooms}</strong> Rooms</div>
                        <div><strong>{item.total_aras}</strong> Designated ARAs</div>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div>
                        <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 block">
                          {new Date(item.generated_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.file_size}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Official & Sealed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : item.status === 'Pre-Approval'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                          : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleReDownload(item)}
                        disabled={isGenerating === item.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#002147] hover:bg-[#001733] text-amber-400 text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                        title="Re-download this PDF report package immediately"
                      >
                        <Download className={`w-3.5 h-3.5 ${isGenerating === item.id ? 'animate-bounce' : ''}`} />
                        <span>{isGenerating === item.id ? 'Generating...' : 'Re-Download PDF'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
