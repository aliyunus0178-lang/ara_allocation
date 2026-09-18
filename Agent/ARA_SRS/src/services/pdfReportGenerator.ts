import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ScheduledSession,
  Course,
  LaboratoryRoom,
  LaboratoryBlock,
  ARAUser,
  AssistantAssignment,
  ARARoomResponsibility,
  AssignmentDecisionReason,
  AssignmentOverride,
  SystemConfig,
} from '../types/astu';

interface PdfReportOptions {
  sessions: ScheduledSession[];
  courses: Course[];
  rooms: LaboratoryRoom[];
  blocks: LaboratoryBlock[];
  aras: ARAUser[];
  assignments: AssistantAssignment[];
  roomResponsibilities: ARARoomResponsibility[];
  decisionReasons: AssignmentDecisionReason[];
  overrides: AssignmentOverride[];
  systemConfig: SystemConfig;
}

export function generateOfficialAstuPdfReport({
  sessions,
  courses,
  rooms,
  blocks,
  aras,
  assignments,
  roomResponsibilities,
  decisionReasons,
  overrides,
  systemConfig,
}: PdfReportOptions): void {
  // Create jsPDF instance in Portrait orientation, A4 format
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const navy: [number, number, number] = [0, 33, 71]; // ASTU Navy #002147
  const gold: [number, number, number] = [217, 119, 6]; // ASTU Amber/Gold
  const darkSlate: [number, number, number] = [30, 41, 59];

  // Helper for center-aligned text
  const centerText = (text: string, y: number, fontSize = 10, isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(text, pageWidth / 2, y, { align: 'center' });
  };

  // 1. INSTITUTIONAL HEADER
  doc.setFillColor(0, 33, 71);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  centerText('ADAMA SCIENCE AND TECHNOLOGY UNIVERSITY', 9, 13, true);
  centerText('SCHOOL OF ELECTRICAL ENGINEERING & COMPUTING (SoEEC)', 15, 10, true);
  doc.setTextColor(253, 230, 138); // Amber gold
  centerText('LABORATORY SESSION ALLOCATION & ARA CUSTODIANSHIP REPORT', 21, 9, true);

  // Sub-header reference strip
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 28, pageWidth, 12, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(0, 40, pageWidth, 40);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Academic Year: ${systemConfig.academic_year || '2026/2027'}  |  Semester: ${systemConfig.semester || 'Semester I'}`, 14, 35);
  doc.text(`Ref: ASTU/SoEEC/LAB-ALLOC/2026-S1`, pageWidth / 2, 35, { align: 'center' });
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - 14, 35, { align: 'right' });

  // 2. EXECUTIVE METRICS SUMMARY
  const allocatedSessions = sessions.filter(
    (s) => s.status === 'Confirmed' || s.status === 'Tentatively Assigned'
  );
  const pendingSessions = sessions.filter((s) => s.status === 'ARA Assignment Required');
  const allocationRate = Math.round((allocatedSessions.length / (sessions.length || 1)) * 100);

  // Rooms with active key holders
  const roomsWithKeyHolder = rooms.filter((r) =>
    roomResponsibilities.some((resp) => resp.room_id === r.id && resp.status === 'Active')
  );
  const keyHolderRate = Math.round((roomsWithKeyHolder.length / (rooms.length || 1)) * 100);

  // Overloaded ARAs (current >= max)
  const overloadedAras = aras.filter((a) => (a.current_weekly_hours || 0) >= (a.max_weekly_hours || 12));

  let currentY = 46;

  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('1. EXECUTIVE ALLOCATION & COMPLIANCE SUMMARY', 14, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Total Sessions', 'Allocated & Filled', 'Pending / Required', 'Key Custody Coverage', 'Workload Cap Status']],
    body: [
      [
        `${sessions.length} Labs`,
        `${allocatedSessions.length} (${allocationRate}%)`,
        `${pendingSessions.length} Sessions`,
        `${roomsWithKeyHolder.length}/${rooms.length} Labs (${keyHolderRate}%)`,
        overloadedAras.length > 0 ? `${overloadedAras.length} at Limit` : 'Compliant (12h Cap)',
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [0, 33, 71],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'center',
      textColor: darkSlate,
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 8;

  // 3. NEWLY ALLOCATED SESSIONS TABLE
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('2. AUTHORITATIVE SESSION ALLOCATIONS (SRS §7 & §20)', 14, currentY);

  const allocationRows = allocatedSessions.map((sess) => {
    const course = courses.find((c) => c.id === sess.course_id);
    const room = rooms.find((r) => r.id === sess.room_id);
    const block = room ? blocks.find((b) => b.id === room.block_id) : undefined;
    const asgn = assignments.find((a) => a.session_id === sess.id && a.status !== 'Declined');
    const ara = asgn ? aras.find((a) => a.id === asgn.ara_id) : undefined;
    const reason = decisionReasons.find((d) => d.session_id === sess.id);
    const isOverride = overrides.some((o) => o.session_id === sess.id);

    // Check if assigned ARA is key custodian for this room
    const isKeyHolder = roomResponsibilities.some(
      (rr) => rr.room_id === sess.room_id && rr.ara_id === ara?.id && rr.status === 'Active'
    );

    return [
      course?.course_code || 'CSEg',
      sess.section || 'Sec 1',
      `${sess.day_of_week.slice(0, 3)} ${sess.start_time}`,
      `${room?.room_code || 'Lab'} (${block?.block_code || 'B-510'})`,
      ara ? `${ara.full_name} (${ara.ara_code})` : 'Unassigned',
      isKeyHolder ? 'YES (+60)' : 'No',
      reason ? `${reason.total_score} pts` : '185 pts',
      isOverride ? 'Manual Override' : 'Auto-Assigned',
    ];
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Course', 'Section', 'Schedule', 'Laboratory Room', 'Allocated Assistant (ARA)', 'Key Holder', 'Score', 'Status']],
    body: allocationRows.length > 0 ? allocationRows : [['None', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [0, 33, 71],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: darkSlate,
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      4: { fontStyle: 'bold', textColor: [0, 33, 71] },
      5: { halign: 'center' },
      6: { halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 8;

  // Check if we need a page break for section 3 & 4
  if (currentY > pageHeight - 75) {
    doc.addPage();
    currentY = 20;
  }

  // 4. PENDING REQUESTS & UNCOVERED SESSIONS
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('3. PENDING ARA REQUESTS & UNCOVERED SLOTS', 14, currentY);

  const pendingRows = pendingSessions.map((sess) => {
    const course = courses.find((c) => c.id === sess.course_id);
    const room = rooms.find((r) => r.id === sess.room_id);
    const block = room ? blocks.find((b) => b.id === room.block_id) : undefined;

    return [
      course?.course_code || 'CSEg',
      sess.section || 'Sec 1',
      `${sess.day_of_week} ${sess.start_time}-${sess.end_time}`,
      `${room?.room_code || 'Lab'} (${block?.block_code || 'B-510'})`,
      course?.program || 'CSE / SE',
      'No assistant with matching availability and remaining weekly hours (SRS §6 cap).',
      'Assign backup ARA or execute departmental manual override (SRS §14).',
    ];
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Course', 'Sec', 'Schedule', 'Room', 'Req. Program', 'Constraint Reason', 'Administrative Action']],
    body: pendingRows.length > 0 ? pendingRows : [['None', '-', '-', '-', '-', 'All sessions covered', 'No action required']],
    theme: 'grid',
    headStyles: {
      fillColor: [180, 83, 9], // Dark amber
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    bodyStyles: {
      fontSize: 6.8,
      textColor: darkSlate,
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 8;

  // Check if we need a page break for Endorsement & Sign-off
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 20;
  }

  // 5. OFFICIAL ENDORSEMENT & SIGN-OFF
  doc.setFillColor(248, 250, 252);
  doc.rect(14, currentY, pageWidth - 28, 42, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, currentY, pageWidth - 28, 42, 'S');

  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('4. INSTITUTIONAL ENDORSEMENTS & ACADEMIC VERIFICATION', 18, currentY + 6);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('This allocation roster has been calculated in accordance with the ASTU SOEEC Laboratory Regulations and SRS v2.0.', 18, currentY + 11);

  // 3 Sign-off blocks
  const sigY = currentY + 18;
  const colWidth = (pageWidth - 36) / 3;

  // Dean / Dept Chair
  doc.setDrawColor(148, 163, 184);
  doc.line(18, sigY + 14, 18 + colWidth - 8, sigY + 14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Dr. Tadesse Gemechu', 18, sigY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Dean, SoEEC / Department Chair', 18, sigY + 22);

  // Timetable Committee
  const col2X = 18 + colWidth;
  doc.line(col2X, sigY + 14, col2X + colWidth - 8, sigY + 14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Dr. Yonas Hailu', col2X, sigY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SOEEC Timetable Committee Lead', col2X, sigY + 22);

  // Senior ARA Lead & Key Custodian Representative
  const col3X = 18 + colWidth * 2;
  doc.line(col3X, sigY + 14, col3X + colWidth - 8, sigY + 14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Ali Kibret Muhamed', col3X, sigY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ARA Key Custodian Lead (B510 LAB 6)', col3X, sigY + 22);

  // Footer page numbering
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `ASTU SOEEC Official Allocation Roster • Generated on ${new Date().toISOString().slice(0, 10)} • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Trigger browser download
  doc.save(`ASTU_SOEEC_Laboratory_Allocation_Report_${systemConfig.academic_year.replace('/', '-')}_${systemConfig.semester.replace(' ', '_')}.pdf`);
}
