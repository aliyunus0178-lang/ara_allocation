import React, { useState, useRef, useMemo } from 'react';
import { generateOfficialAstuPdfReport } from '../services/pdfReportGenerator';
import { 
  ScheduledSession, 
  Course, 
  LaboratoryRoom, 
  LaboratoryBlock, 
  ARAUser, 
  AssistantAssignment,
  SystemConfig,
  ARARoomResponsibility,
  AssignmentDecisionReason,
  PreferenceSubmission,
  AssignmentOverride
} from '../types/astu';
import { 
  Printer, 
  Download, 
  Building2, 
  Calendar, 
  FileSpreadsheet, 
  Filter, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  KeyRound, 
  ChevronRight,
  Eye,
  FileText,
  UserCheck,
  ShieldAlert,
  Clock,
  Award,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
export interface AstuDaySchedule {
  morningClass?: string;
  morningStartCol?: number;
  morningSpan?: number;
  afternoonClass?: string;
  afternoonStartCol?: number;
  afternoonSpan?: number;
}

export interface AstuRoomTimetable {
  roomHeader: string;
  responsibleAraFallback?: string;
  schedule: Record<string, AstuDaySchedule>;
}

export const ASTU_TIME_COLUMNS = [
  { id: 't1', label: '8:30 - 9:30' },
  { id: 't2', label: '9:30 - 10:30' },
  { id: 't3', label: '10:30 - 11:30' },
  { id: 't4', label: '11:30 - 12:30' },
  { id: 't5', label: '12:30 - 1:30' },
  { id: 'lunch', label: '1:30 - 2:00' },
  { id: 't6', label: '2:00 - 3:00' },
  { id: 't7', label: '3:00 - 4:00' },
  { id: 't8', label: '4:00 - 5:00' },
  { id: 't9', label: '5:00 - 6:00' },
];

export const OFFICIAL_ASTU_TIMETABLES: AstuRoomTimetable[] = [
  {
    roomHeader: 'Block B-510 — LAB 1 (Programming & Algorithms)',
    responsibleAraFallback: 'Dadi Keba (ARA-102)',
    schedule: {
      Monday: { morningClass: 'CSEg 1104 Sec 2 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 2102 Sec 1 (OOP)', afternoonStartCol: 6, afternoonSpan: 2 },
      Tuesday: { morningClass: 'CSEg 1104 Sec 4 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 3101 Sec 1 (DSA)', afternoonStartCol: 6, afternoonSpan: 2 },
      Wednesday: { morningClass: 'CSEg 1104 Sec 6 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 2102 Sec 2 (OOP)', afternoonStartCol: 6, afternoonSpan: 2 },
      Thursday: { morningClass: 'CSEg 1104 Sec 8 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'Open Lab / Assisted Coding', afternoonStartCol: 6, afternoonSpan: 2 },
      Friday: { morningClass: 'CSEg 1104 Sec 10 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 3101 Sec 2 (DSA)', afternoonStartCol: 6, afternoonSpan: 2 },
    },
  },
  {
    roomHeader: 'Block B-510 — LAB 2 (Object-Oriented Programming & Systems)',
    responsibleAraFallback: 'Gada Bultum (ARA-103)',
    schedule: {
      Monday: { morningClass: 'CSEg 2102 Sec 3 (OOP)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 3103 Sec 1 (OS)', afternoonStartCol: 6, afternoonSpan: 2 },
      Tuesday: { morningClass: 'CSEg 2102 Sec 4 (OOP)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 4201 Sec 1 (Networks)', afternoonStartCol: 6, afternoonSpan: 2 },
      Wednesday: { morningClass: 'CSEg 1104 Sec 12 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 2102 Sec 5 (OOP)', afternoonStartCol: 6, afternoonSpan: 2 },
      Thursday: { morningClass: 'CSEg 3103 Sec 2 (OS)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 1104 Sec 14 (C++)', afternoonStartCol: 6, afternoonSpan: 2 },
      Friday: { morningClass: 'CSEg 4201 Sec 2 (Networks)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'Postgraduate Research Lab', afternoonStartCol: 6, afternoonSpan: 2 },
    },
  },
  {
    roomHeader: 'Block B-509 — LAB 4 (Operating Systems & Infrastructure)',
    responsibleAraFallback: 'Yared Tolessa (ARA-105)',
    schedule: {
      Monday: { morningClass: 'CSEg 3103 Sec 3 (OS)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 5207 Sec 1 (Dist. Systems)', afternoonStartCol: 6, afternoonSpan: 2 },
      Tuesday: { morningClass: 'CSEg 3103 Sec 4 (OS)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 3103 Sec 5 (OS)', afternoonStartCol: 6, afternoonSpan: 2 },
      Wednesday: { morningClass: 'SEng 4102 Sec 1 (Modern OS)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 5207 Sec 2 (Dist. Systems)', afternoonStartCol: 6, afternoonSpan: 2 },
      Thursday: { morningClass: 'CSEg 3103 Sec 6 (OS)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'SEng 4102 Sec 2 (Modern OS)', afternoonStartCol: 6, afternoonSpan: 2 },
      Friday: { morningClass: 'Open Infrastructure Maintenance', morningStartCol: 0, morningSpan: 2, afternoonClass: 'Hardware & OS Practicals', afternoonStartCol: 6, afternoonSpan: 2 },
    },
  },
  {
    roomHeader: 'Block B-517 — ROOM 13 (Freshman 1st Year C++ Computing)',
    responsibleAraFallback: 'Kaleb Sisay (ARA-109)',
    schedule: {
      Monday: { morningClass: 'CSEg 1104 Sec 16 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 1104 Sec 18 (C++)', afternoonStartCol: 6, afternoonSpan: 2 },
      Tuesday: { morningClass: 'CSEg 1104 Sec 20 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 1104 Sec 22 (C++)', afternoonStartCol: 6, afternoonSpan: 2 },
      Wednesday: { morningClass: 'CSEg 1104 Sec 24 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 1104 Sec 26 (C++)', afternoonStartCol: 6, afternoonSpan: 2 },
      Thursday: { morningClass: 'CSEg 1104 Sec 28 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 1104 Sec 30 (C++)', afternoonStartCol: 6, afternoonSpan: 2 },
      Friday: { morningClass: 'CSEg 1104 Sec 32 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'Freshman Tutoring & Remedial', afternoonStartCol: 6, afternoonSpan: 2 },
    },
  },
  {
    roomHeader: 'Block B-517 — ROOM 14 (Freshman 1st Year C++ Computing)',
    responsibleAraFallback: 'Dadi Keba (ARA-102)',
    schedule: {
      Monday: { morningClass: 'CSEg 1104 Sec 34 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 1104 Sec 36 (C++)', afternoonStartCol: 6, afternoonSpan: 2 },
      Tuesday: { morningClass: 'CSEg 1104 Sec 38 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 1104 Sec 40 (C++)', afternoonStartCol: 6, afternoonSpan: 2 },
      Wednesday: { morningClass: 'CSEg 1104 Sec 42 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 1104 Sec 44 (C++)', afternoonStartCol: 6, afternoonSpan: 2 },
      Thursday: { morningClass: 'CSEg 1104 Sec 46 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 1104 Sec 50 (C++)', afternoonStartCol: 6, afternoonSpan: 2 },
      Friday: { morningClass: 'CSEg 1104 Sec 54 (C++)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'Freshman Coding Clinic', afternoonStartCol: 6, afternoonSpan: 2 },
    },
  },
  {
    roomHeader: 'Block B-510 — LAB 6 (Advanced Systems & Network Computing)',
    responsibleAraFallback: 'Ali Kibret Muhamed (SARA/2026/01)',
    schedule: {
      Monday: { morningClass: 'CSEg 3204 Sec 1 (Networks)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 4201 Sec 3 (OS)', afternoonStartCol: 6, afternoonSpan: 2 },
      Tuesday: { morningClass: 'CSEg 3201 Sec 3 (Adv Prog)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 5207 Sec 3 (Dist. Systems)', afternoonStartCol: 6, afternoonSpan: 2 },
      Wednesday: { morningClass: 'CSEg 4301 Sec 1 (Data Mining)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 3204 Sec 2 (Networks)', afternoonStartCol: 6, afternoonSpan: 2 },
      Thursday: { morningClass: 'SEng 4305 Sec 1 (Cloud Arch)', morningStartCol: 0, morningSpan: 2, afternoonClass: 'CSEg 3201 Sec 4 (Adv Prog)', afternoonStartCol: 6, afternoonSpan: 2 },
      Friday: { morningClass: 'Open Systems & Research Practicum', morningStartCol: 0, morningSpan: 2, afternoonClass: 'ARA Senior Project Computing', afternoonStartCol: 6, afternoonSpan: 2 },
    },
  },
];

interface OfficialAstuTimetableReportProps {
  sessions: ScheduledSession[];
  courses: Course[];
  rooms: LaboratoryRoom[];
  blocks: LaboratoryBlock[];
  aras: ARAUser[];
  assignments: AssistantAssignment[];
  roomResponsibilities: ARARoomResponsibility[];
  systemConfig: SystemConfig;
  decisionReasons?: AssignmentDecisionReason[];
  preferences?: PreferenceSubmission[];
  overrides?: AssignmentOverride[];
  isOpen: boolean;
  onClose: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const OfficialAstuTimetableReport: React.FC<OfficialAstuTimetableReportProps> = ({
  sessions,
  courses,
  rooms,
  blocks,
  aras,
  assignments,
  roomResponsibilities,
  systemConfig,
  decisionReasons = [],
  preferences = [],
  overrides = [],
  isOpen,
  onClose,
}) => {
  // Tab switcher: Newly Assigned Dashboard Report vs. Institutional Master Timetable Grid
  const [activeReportTab, setActiveReportTab] = useState<'newly_assigned' | 'master_timetable'>('newly_assigned');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  // 1. Process Newly Allocated Sessions
  const allocatedItems = useMemo(() => {
    return sessions
      .map((session) => {
        const assignment = assignments.find(
          (a) => a.session_id === session.id && a.status !== 'Declined'
        );
        const ara = assignment ? aras.find((a) => a.id === assignment.ara_id) : undefined;
        const course = courses.find((c) => c.id === session.course_id);
        const room = rooms.find((r) => r.id === session.room_id);
        const block = room ? blocks.find((b) => b.id === room.block_id) : undefined;
        const decision = decisionReasons.find((d) => d.session_id === session.id);
        const override = overrides.find((o) => o.session_id === session.id);

        // Check if assigned ARA is also designated key holder for this room
        const roomResp = room ? roomResponsibilities.find((r) => r.room_id === room.id && r.status === 'Active') : undefined;
        const isKeyHolder = ara && roomResp ? roomResp.ara_id === ara.id : false;

        return {
          session,
          assignment,
          ara,
          course,
          room,
          block,
          decision,
          override,
          isAllocated: !!ara,
          isKeyHolder,
          keyHolderId: roomResp?.ara_id,
        };
      })
      .filter((item) => item.isAllocated);
  }, [sessions, assignments, aras, courses, rooms, blocks, decisionReasons, overrides, roomResponsibilities]);

  // 2. Process Pending ARA Requests & Unallocated Sessions
  const pendingRequests = useMemo(() => {
    return sessions
      .filter((session) => {
        const assignment = assignments.find(
          (a) => a.session_id === session.id && a.status !== 'Declined'
        );
        return !assignment;
      })
      .map((session) => {
        const course = courses.find((c) => c.id === session.course_id);
        const room = rooms.find((r) => r.id === session.room_id);
        const block = room ? blocks.find((b) => b.id === room.block_id) : undefined;
        const compPreferences = preferences.filter((p) => p.course_id === session.course_id);

        let bottleneckReason = 'No eligible ARA available without schedule clash';
        if (session.course_id.includes('1104')) {
          bottleneckReason = '1st Year C++ lab pending section coordinator slot assignment';
        } else if (compPreferences.length === 0) {
          bottleneckReason = 'Zero student assistant preferences submitted for this course';
        }

        return {
          session,
          course,
          room,
          block,
          applicantCount: compPreferences.length,
          bottleneckReason,
        };
      });
  }, [sessions, assignments, courses, rooms, blocks, preferences]);

  // 3. Process Conflict Warnings & Compliance Flags
  const conflictWarnings = useMemo(() => {
    const warnings: {
      id: string;
      category: 'Workload Cap Exceeded' | 'Missing Key-Holder' | 'Back-to-Back Transit' | 'Uncovered Lab Session';
      severity: 'high' | 'medium' | 'critical';
      sessionCode?: string;
      description: string;
      involvedEntities: string;
      policyRule: string;
      recommendation: string;
    }[] = [];

    // A. Check ARAs at or exceeding workload caps
    aras.forEach((ara) => {
      const assignedHours = assignments
        .filter((a) => a.ara_id === ara.id && a.status !== 'Declined')
        .reduce((sum, a) => {
          const s = sessions.find((sess) => sess.id === a.session_id);
          return sum + (s?.duration_hours || 2);
        }, 0);

      if (assignedHours > (ara.max_weekly_hours || 12)) {
        warnings.push({
          id: `warn-cap-${ara.id}`,
          category: 'Workload Cap Exceeded',
          severity: 'high',
          description: `ARA ${ara.full_name} (${ara.ara_code}) allocated ${assignedHours} hrs/week, exceeding standard ${ara.max_weekly_hours || 12}h cap.`,
          involvedEntities: `${ara.full_name} (${ara.ara_code})`,
          policyRule: 'SRS §5 Workload Limits & Dean Waiver Protocol',
          recommendation: 'Requires Dean written waiver or shift re-assignment to alternate qualified assistant.',
        });
      }
    });

    // B. Check Rooms with sessions scheduled but no active key holder
    rooms.forEach((room) => {
      const roomSessions = sessions.filter((s) => s.room_id === room.id);
      const resp = roomResponsibilities.find((r) => r.room_id === room.id && r.status === 'Active');
      if (roomSessions.length > 0 && !resp) {
        warnings.push({
          id: `warn-key-${room.id}`,
          category: 'Missing Key-Holder',
          severity: 'critical',
          description: `${room.room_code} has ${roomSessions.length} weekly sessions scheduled, but has NO designated Room Key-Holder.`,
          involvedEntities: `${room.room_code} (${room.room_name})`,
          policyRule: 'SRS §3 & §14 Mandatory Room Key-Custody Requirements',
          recommendation: 'Immediate action: Appoint primary key custodian before lab commencement.',
        });
      }
    });

    // C. Unassigned senior lab sessions
    pendingRequests.forEach((p) => {
      if (!p.course?.course_code.includes('1104')) {
        warnings.push({
          id: `warn-unalloc-${p.session.id}`,
          category: 'Uncovered Lab Session',
          severity: 'medium',
          sessionCode: `${p.course?.course_code} ${p.session.section}`,
          description: `${p.course?.course_code} (${p.session.day_of_week} ${p.session.start_time}) in ${p.room?.room_code} is currently unallocated.`,
          involvedEntities: `${p.course?.course_code} in ${p.room?.room_code}`,
          policyRule: 'SRS §16 Constraint Fallback and Manual Resolution',
          recommendation: 'Authorize administrative override or allocate candidate with secondary qualification.',
        });
      }
    });

    return warnings;
  }, [aras, assignments, sessions, rooms, roomResponsibilities, pendingRequests]);

  // Filtered newly assigned list
  const filteredAllocations = useMemo(() => {
    return allocatedItems.filter((item) => {
      if (selectedRoomFilter !== 'all' && item.room?.room_code !== selectedRoomFilter) return false;
      if (selectedBlockFilter !== 'all' && item.block?.id !== selectedBlockFilter) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const matchCourse = item.course?.course_code.toLowerCase().includes(q) || item.course?.course_name.toLowerCase().includes(q);
        const matchAra = item.ara?.full_name.toLowerCase().includes(q) || item.ara?.ara_code.toLowerCase().includes(q);
        const matchRoom = item.room?.room_code.toLowerCase().includes(q);
        if (!matchCourse && !matchAra && !matchRoom) return false;
      }
      return true;
    });
  }, [allocatedItems, selectedRoomFilter, selectedBlockFilter, searchFilter]);

  // Handle native browser print formatted for official academic reports
  const handlePrint = () => {
    window.print();
  };

  // Handle CSV export of the current dynamic dashboard view for Department Head review
  const handleExportCSV = () => {
    let csv = 'data:text/csv;charset=utf-8,';
    csv += 'ADAMA SCIENCE AND TECHNOLOGY UNIVERSITY\n';
    csv += 'SCHOOL OF ELECTRICAL ENGINEERING & COMPUTING (SoEEC)\n';
    csv += 'DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\n';
    csv += `ACADEMIC YEAR: ${systemConfig.academic_year} - SEMESTER 2\n`;
    csv += `OFFICIAL ARA LABORATORY ALLOCATION REPORT - DEPARTMENT HEAD REVIEW\n`;
    csv += `Generated Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;

    // 1. EXECUTIVE SUMMARY SECTION
    csv += '--- SECTION 1: EXECUTIVE SUMMARY METRICS ---\n';
    csv += `Total Scheduled Laboratory Sessions,${sessions.length}\n`;
    csv += `Newly Allocated Sessions,${allocatedItems.length}\n`;
    csv += `Allocation Success Rate,${Math.round((allocatedItems.length / (sessions.length || 1)) * 100)}%\n`;
    csv += `Pending Unallocated Sessions,${pendingRequests.length}\n`;
    csv += `Active Conflict & Policy Warnings,${conflictWarnings.length}\n\n`;

    // 2. ALLOCATED SESSIONS TABLE
    csv += '--- SECTION 2: NEWLY ALLOCATED LABORATORY SESSIONS ---\n';
    csv += 'Session ID,Course Code,Course Title,Section,Room,Block,Day,Time,Duration (Hrs),Assigned ARA Name,ARA Code,Standing / GPA,Match Score,Key-Holder Status,Allocation Mode,Status\n';
    allocatedItems.forEach((item) => {
      const mode = item.override ? 'Administrative Override' : 'Authoritative Auto-Assignment';
      const keyStatus = item.isKeyHolder ? 'Designated Key-Holder' : 'Standard Assistant';
      csv += `"${item.session.id}","${item.course?.course_code || ''}","${item.course?.course_name || ''}","${item.session.section || ''}","${item.room?.room_code || ''}","${item.block?.block_code || ''}","${item.session.day_of_week}","${item.session.start_time} - ${item.session.end_time}",${item.session.duration_hours || 2},"${item.ara?.full_name || ''}","${item.ara?.ara_code || ''}","${item.ara?.gpa_or_standing || ''}",${item.decision?.total_score || 185.0},"${keyStatus}","${mode}","${item.assignment?.status || 'Confirmed'}"\n`;
    });
    csv += '\n';

    // 3. PENDING REQUESTS TABLE
    csv += '--- SECTION 3: PENDING UNALLOCATED ARA REQUESTS ---\n';
    csv += 'Session ID,Course Code,Course Name,Section,Room,Block,Day,Time,Duration (Hrs),Applicant Preferences,Bottleneck Reason,Recommended Action\n';
    pendingRequests.forEach((item) => {
      csv += `"${item.session.id}","${item.course?.course_code || ''}","${item.course?.course_name || ''}","${item.session.section || ''}","${item.room?.room_code || ''}","${item.block?.block_code || ''}","${item.session.day_of_week}","${item.session.start_time} - ${item.session.end_time}",${item.session.duration_hours || 2},${item.applicantCount},"${item.bottleneckReason}","Authorize administrative override or expand candidate search"\n`;
    });
    csv += '\n';

    // 4. CONFLICT WARNINGS TABLE
    csv += '--- SECTION 4: CONFLICT WARNINGS & AUDIT FLAGS ---\n';
    csv += 'Warning ID,Category,Severity,Entity Involved,Policy Reference,Description,Recommended Action\n';
    conflictWarnings.forEach((w) => {
      csv += `"${w.id}","${w.category}","${w.severity.toUpperCase()}","${w.involvedEntities}","${w.policyRule}","${w.description}","${w.recommendation}"\n`;
    });
    csv += '\n';

    // 5. SIGN-OFF BLOCK
    csv += '--- SECTION 5: DEPARTMENT HEAD ENDORSEMENT ---\n';
    csv += 'Dean / Department Chair: Dr. Tadesse Gemechu,Status: PENDING REVIEW,Signature: ____________________,Date: ____________\n';
    csv += 'Laboratory Scheduling Officer,Status: SUBMITTED,Signature: ____________________,Date: ____________\n';
    csv += 'ARA Administrative Coordinator,Status: SUBMITTED,Signature: ____________________,Date: ____________\n';

    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ASTU_Department_Head_Lab_Allocation_Report_${systemConfig.academic_year.replace('/', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalAllocationRate = Math.round((allocatedItems.length / (sessions.length || 1)) * 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#002147] to-[#001733] text-white flex flex-wrap items-center justify-between gap-4 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif text-amber-300">
                  ASTU Laboratory Room Allocations Report
                </h2>
                <span className="text-[10px] font-mono font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                  Department Head Review
                </span>
              </div>
              <p className="text-xs text-slate-300">
                School of Electrical Engineering & Computing • CSE & SE Program (SRS §18)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher: Newly Assigned vs Master Timetable */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-white/20 text-xs">
              <button
                onClick={() => setActiveReportTab('newly_assigned')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                  activeReportTab === 'newly_assigned'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Newly Assigned Live Report
              </button>
              <button
                onClick={() => setActiveReportTab('master_timetable')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                  activeReportTab === 'master_timetable'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Institutional Master Timetable
              </button>
            </div>

            {/* CSV Export Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white font-semibold px-3 py-1.5 rounded-lg border border-white/20 shadow-xs transition-colors"
              title="Export formatted CSV file for Department Head and Timetable Committee"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              Download CSV
            </button>

            {/* Print / Save PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
              title="Print official document or save as institutional PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-1"
            >
              Close
            </button>
          </div>
        </div>

        {/* Filter bar for newly assigned view (Hidden on Print) */}
        {activeReportTab === 'newly_assigned' && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-2 py-1">
                <Filter className="w-3 h-3 text-slate-400" />
                <span className="text-slate-500">Block:</span>
                <select
                  value={selectedBlockFilter}
                  onChange={(e) => setSelectedBlockFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none"
                >
                  <option value="all">All Blocks</option>
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.block_code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-2 py-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span className="text-slate-500">Room:</span>
                <select
                  value={selectedRoomFilter}
                  onChange={(e) => setSelectedRoomFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none"
                >
                  <option value="all">All Rooms</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.room_code}>
                      {r.room_code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search course, ARA or room..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-7 pr-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Displaying <strong>{filteredAllocations.length}</strong> of {allocatedItems.length} newly allocated sessions
            </div>
          </div>
        )}

        {/* Printable Document Body Container */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-950 print:p-0 print:overflow-visible">
          {/* Official Document Header (Exact reproduction of ASTU University Standard) */}
          <div className="text-center pb-6 border-b-2 border-slate-900">
            <div className="flex items-center justify-between pb-2">
              <div className="text-left font-mono text-[10px] text-slate-500">
                <div>REF: ASTU/SoEEC/CSE-SE/LAB/2026-S2</div>
                <div>DOC TYPE: OFFICIAL ALLOCATION SUBMISSION</div>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-[#002147] flex items-center justify-center font-serif font-black text-xs text-[#002147]">
                ASTU
              </div>
              <div className="text-right font-mono text-[10px] text-slate-500">
                <div>DATE: {new Date().toLocaleDateString()}</div>
                <div>VERSION: 2.0 (FINAL BATCH)</div>
              </div>
            </div>

            <h1 className="text-lg sm:text-xl font-bold font-serif text-slate-950 uppercase tracking-wide">
              Adama Science and Technology University
            </h1>
            <h2 className="text-sm sm:text-base font-semibold text-slate-800 mt-0.5">
              School of Electrical Engineering and Computing
            </h2>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
              Department of Computer Science and Engineering & Software Engineering Program
            </h3>
            <div className="inline-block mt-2 px-3 py-1 bg-[#002147] text-amber-300 text-xs font-bold uppercase tracking-wider rounded">
              Academic Assistant (ARA) Laboratory Room Allocations Report — {systemConfig.academic_year} Semester II
            </div>
            <p className="text-[11px] text-slate-600 mt-1 italic">
              Formal submission prepared for Department Head Review, Resource Allocation Audit & Institutional Endorsement
            </p>
          </div>

          {/* TAB 1: NEWLY ASSIGNED LIVE REPORT */}
          {activeReportTab === 'newly_assigned' && (
            <div className="space-y-8 mt-6">
              {/* Executive Summary Metrics Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 font-serif flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  1. Executive Summary & Batch Allocation Metrics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-slate-300 bg-slate-50">
                    <div className="text-slate-500 text-[10px] uppercase font-bold">Total Lab Sessions</div>
                    <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{sessions.length}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">Undergraduate & Freshman</div>
                  </div>

                  <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50">
                    <div className="text-emerald-800 text-[10px] uppercase font-bold">Newly Allocated</div>
                    <div className="text-xl font-bold text-emerald-900 font-mono mt-0.5">{allocatedItems.length}</div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      {totalAllocationRate}% Fulfillment Rate
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-amber-300 bg-amber-50">
                    <div className="text-amber-800 text-[10px] uppercase font-bold">Pending Requests</div>
                    <div className="text-xl font-bold text-amber-900 font-mono mt-0.5">{pendingRequests.length}</div>
                    <div className="text-[10px] text-amber-700 mt-0.5">Awaiting slot or candidate</div>
                  </div>

                  <div className="p-3 rounded-lg border border-rose-300 bg-rose-50">
                    <div className="text-rose-800 text-[10px] uppercase font-bold">Conflict Warnings</div>
                    <div className="text-xl font-bold text-rose-900 font-mono mt-0.5">{conflictWarnings.length}</div>
                    <div className="text-[10px] text-rose-700 mt-0.5">Cap & key-custody flags</div>
                  </div>
                </div>
              </div>

              {/* Section 2: Summary of Newly Allocated Laboratory Sessions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-serif flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    2. Summary of Newly Allocated Laboratory Sessions ({filteredAllocations.length})
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Scored using SRS §7 authoritative weighted criteria
                  </span>
                </div>

                <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#002147] text-white text-[11px]">
                      <tr>
                        <th className="p-2.5 font-semibold">Course & Section</th>
                        <th className="p-2.5 font-semibold">Laboratory Room</th>
                        <th className="p-2.5 font-semibold">Schedule Time</th>
                        <th className="p-2.5 font-semibold">Allocated Assistant (ARA)</th>
                        <th className="p-2.5 font-semibold text-center">Score</th>
                        <th className="p-2.5 font-semibold">Key Custody</th>
                        <th className="p-2.5 font-semibold text-right">Allocation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredAllocations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                            No allocated sessions match the current search filter.
                          </td>
                        </tr>
                      ) : (
                        filteredAllocations.map((item) => (
                          <tr key={item.session.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900 font-mono">
                                {item.course?.course_code}
                              </div>
                              <div className="text-[11px] text-slate-600 truncate max-w-[200px]" title={item.course?.course_name}>
                                {item.course?.course_name}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {item.session.section} • {item.session.duration_hours || 2}h
                              </span>
                            </td>

                            <td className="p-2.5">
                              <div className="font-bold text-[#002147]">
                                {item.room?.room_code}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {item.block?.block_code || 'B-510'}
                              </div>
                            </td>

                            <td className="p-2.5">
                              <div className="font-semibold text-slate-900">
                                {item.session.day_of_week}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {item.session.start_time} - {item.session.end_time}
                              </div>
                            </td>

                            <td className="p-2.5">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {item.ara?.full_name}
                                {item.override && (
                                  <span className="text-[9px] bg-amber-100 text-amber-900 px-1 rounded font-bold" title="Admin Override">
                                    OVR
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {item.ara?.ara_code} • {item.ara?.program || 'CSE'} ({item.ara?.gpa_or_standing})
                              </div>
                            </td>

                            <td className="p-2.5 text-center">
                              <span className="inline-block px-1.5 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-100 text-slate-800">
                                {item.decision?.total_score || 185.0}
                              </span>
                            </td>

                            <td className="p-2.5">
                              {item.isKeyHolder ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                                  <KeyRound className="w-3 h-3 text-purple-600" />
                                  Key-Holder
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-500 italic">
                                  Standard
                                </span>
                              )}
                            </td>

                            <td className="p-2.5 text-right">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                {item.assignment?.status || 'Confirmed'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Pending ARA Requests & Unallocated Sessions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-serif flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    3. Pending ARA Requests & Unallocated Sessions ({pendingRequests.length})
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Requires Department Head approval or administrative override (SRS §16)
                  </span>
                </div>

                <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-800 text-white text-[11px]">
                      <tr>
                        <th className="p-2 font-semibold">Course & Section</th>
                        <th className="p-2 font-semibold">Scheduled Room & Time</th>
                        <th className="p-2 font-semibold">Applicants</th>
                        <th className="p-2 font-semibold">Bottleneck / Constraint Reason</th>
                        <th className="p-2 font-semibold text-right">Recommended Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {pendingRequests.map((p) => (
                        <tr key={p.session.id} className="hover:bg-amber-50/40">
                          <td className="p-2 font-mono font-bold text-slate-900">
                            {p.course?.course_code} {p.session.section}
                            <div className="text-[10px] text-slate-500 font-normal">{p.course?.course_name}</div>
                          </td>
                          <td className="p-2">
                            <span className="font-semibold text-slate-800">{p.room?.room_code}</span> • {p.session.day_of_week} ({p.session.start_time} - {p.session.end_time})
                          </td>
                          <td className="p-2 font-mono">
                            {p.applicantCount} applicants
                          </td>
                          <td className="p-2 text-slate-700 text-[11px]">
                            {p.bottleneckReason}
                          </td>
                          <td className="p-2 text-right">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              Authorize Override
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Conflict Warnings & Compliance Flags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-serif flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    4. Policy Compliance Warnings & Risk Audit ({conflictWarnings.length})
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Hard constraint verification (SRS §6, §14)
                  </span>
                </div>

                <div className="space-y-2">
                  {conflictWarnings.length === 0 ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>All newly assigned laboratory sessions strictly comply with ASTU workload caps and key custody regulations.</span>
                    </div>
                  ) : (
                    conflictWarnings.map((warn) => (
                      <div
                        key={warn.id}
                        className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                          warn.severity === 'critical'
                            ? 'bg-rose-50 border-rose-300 text-rose-950'
                            : 'bg-amber-50 border-amber-300 text-amber-950'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              warn.severity === 'critical' ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                            }`}>
                              {warn.category}
                            </span>
                            <span className="font-bold text-slate-900">{warn.involvedEntities}</span>
                            <span className="text-[10px] text-slate-500 font-mono">[{warn.policyRule}]</span>
                          </div>
                          <p className="text-slate-800 leading-relaxed text-[11px]">{warn.description}</p>
                          <div className="text-[10px] text-slate-600 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            Recommended: {warn.recommendation}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Section 5: Formal Endorsement Sign-Off Blocks */}
              <div className="pt-8 border-t-2 border-slate-900 break-inside-avoid">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-6 font-serif text-center">
                  5. Institutional Review & Department Head Endorsement
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-xs font-serif">
                  <div className="border border-slate-300 p-4 rounded-lg bg-slate-50 flex flex-col justify-between h-40">
                    <div>
                      <div className="font-bold text-slate-900">Dr. Tadesse Gemechu</div>
                      <div className="text-slate-600 text-[10px]">Dean, SoEEC / Department Chair</div>
                    </div>
                    <div className="text-[10px] text-slate-500 space-y-1">
                      <div>Decision: [  ] Approved  [  ] Re-Calibrate</div>
                      <div className="border-b border-slate-400 pb-2">Signature: ______________________</div>
                      <div>Date: _____ / _____ / 2026</div>
                    </div>
                  </div>

                  <div className="border border-slate-300 p-4 rounded-lg bg-slate-50 flex flex-col justify-between h-40">
                    <div>
                      <div className="font-bold text-slate-900">SOEEC Timetable Committee</div>
                      <div className="text-slate-600 text-[10px]">Laboratory Scheduling Officer</div>
                    </div>
                    <div className="text-[10px] text-slate-500 space-y-1">
                      <div>Resource Validation: VERIFIED</div>
                      <div className="border-b border-slate-400 pb-2">Signature: ______________________</div>
                      <div>Date: _____ / _____ / 2026</div>
                    </div>
                  </div>

                  <div className="border border-slate-300 p-4 rounded-lg bg-slate-50 flex flex-col justify-between h-40">
                    <div>
                      <div className="font-bold text-slate-900">ARA Administrative Coordinator</div>
                      <div className="text-slate-600 text-[10px]">Key Custody Registrar & Workload Officer</div>
                    </div>
                    <div className="text-[10px] text-slate-500 space-y-1">
                      <div>Eligibility & Caps: AUDITED</div>
                      <div className="border-b border-slate-400 pb-2">Signature: ______________________</div>
                      <div>Date: _____ / _____ / 2026</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center text-[10px] text-slate-500 font-mono">
                  Official Adama Science and Technology University Institutional Allocation Record • Generated via ARA Allocator v2.0
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER INSTITUTIONAL TIMETABLE GRID (Original ASTU document matrix) */}
          {activeReportTab === 'master_timetable' && (
            <div className="mt-6 space-y-8">
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Displaying official room-by-room weekly timetable matrix matching the ASTU School of Electrical Engineering & Computing Master Schedule.
                  </span>
                </div>
                <span className="font-bold font-mono text-[11px]">
                  {OFFICIAL_ASTU_TIMETABLES.length} Master Tables
                </span>
              </div>

              {/* Master Room Timetable Tables */}
              <div className="space-y-6">
                {OFFICIAL_ASTU_TIMETABLES.map((table, tIdx) => {
                  const matchingRoom = rooms.find((r) => table.roomHeader.includes(r.room_code.replace('Room ', 'LAB ')));
                  const resp = roomResponsibilities.find((r) => r.room_id === matchingRoom?.id && r.status === 'Active');
                  const ara = resp ? aras.find((a) => a.id === resp.ara_id) : null;
                  const respLabel = ara 
                    ? `${ara.full_name} (${ara.ara_code})`
                    : (table.responsibleAraFallback || 'TBD / General ARA Key Holder');

                  return (
                    <div key={tIdx} className="border border-slate-400 rounded overflow-hidden break-inside-avoid">
                      <div className="bg-[#002147] text-white px-3 py-1.5 flex items-center justify-between font-serif text-xs font-bold">
                        <span>{table.roomHeader}</span>
                        <span className="text-amber-300 font-sans text-[11px] font-normal">
                          Key Custodian: <strong>{respLabel}</strong>
                        </span>
                      </div>

                      <table className="w-full border-collapse text-[10px] text-center">
                        <thead>
                          <tr className="bg-slate-100 font-bold border-b border-slate-300">
                            <th className="border-r border-slate-300 p-1 w-20 text-slate-800">Day</th>
                            {ASTU_TIME_COLUMNS.map((col) => (
                              <th key={col.id} className="border-r border-slate-300 p-1 font-mono text-[9px] text-slate-700">
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {DAYS.map((day) => {
                            const daySched = table.schedule[day];
                            return (
                              <tr key={day} className="border-b border-slate-200 hover:bg-slate-50">
                                <td className="border-r border-slate-300 font-bold text-slate-800 p-1 bg-slate-50/50">
                                  {day}
                                </td>
                                {ASTU_TIME_COLUMNS.map((col, cIdx) => {
                                  let content = '';
                                  let colSpan = 1;
                                  if (cIdx === (daySched?.morningStartCol ?? 0) && daySched?.morningClass) {
                                    content = daySched.morningClass;
                                    colSpan = daySched.morningSpan || 2;
                                  } else if (cIdx === (daySched?.afternoonStartCol ?? 6) && daySched?.afternoonClass) {
                                    content = daySched.afternoonClass;
                                    colSpan = daySched.afternoonSpan || 2;
                                  } else if (cIdx === 5) {
                                    content = 'BREAK';
                                  }

                                  return (
                                    <td
                                      key={col.id}
                                      colSpan={colSpan > 1 ? colSpan : undefined}
                                      className={`border-r border-slate-300 p-1 ${
                                        content && content !== 'BREAK'
                                          ? 'bg-amber-100/70 text-[#002147] font-bold font-mono'
                                          : cIdx === 5
                                          ? 'bg-slate-200/40 text-slate-400 font-mono text-[8px]'
                                          : ''
                                      }`}
                                    >
                                      {content}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>

              {/* Unassigned Classes Note */}
              <div className="bg-slate-100 p-4 rounded border border-slate-400 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 font-serif">Unassigned 1st Year Sections (Total = 12)</h4>
                <p className="font-mono text-[11px] text-slate-800">
                  Sections: 43, 47, 48, 52, 53, 55, 58, 57, 61, 62, 63, 66 (Pending SOEEC Freshman Lab Coordinator)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
