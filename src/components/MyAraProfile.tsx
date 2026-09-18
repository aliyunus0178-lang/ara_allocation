import React, { useState } from 'react';
import { 
  ARAUser, 
  Course, 
  ScheduledSession, 
  AssistantAssignment, 
  ARAQualification, 
  LaboratoryRoom, 
  LaboratoryBlock, 
  SystemConfig 
} from '../types/astu';
import { 
  User, 
  Clock, 
  Calendar, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Building2, 
  Sparkles, 
  Phone, 
  Mail, 
  BookOpen, 
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  FileCheck,
  ChevronRight
} from 'lucide-react';

interface MyAraProfileProps {
  currentAraId: string;
  setCurrentAraId: (id: string) => void;
  aras: ARAUser[];
  courses: Course[];
  sessions: ScheduledSession[];
  rooms: LaboratoryRoom[];
  blocks: LaboratoryBlock[];
  assignments: AssistantAssignment[];
  qualifications: ARAQualification[];
  systemConfig: SystemConfig;
  onAcceptAssignment?: (assignmentId: string) => void;
  onDeclineAssignment?: (assignmentId: string) => void;
  onNavigateToPreferences?: () => void;
}

export const MyAraProfile: React.FC<MyAraProfileProps> = ({
  currentAraId,
  setCurrentAraId,
  aras,
  courses,
  sessions,
  rooms,
  blocks,
  assignments,
  qualifications,
  systemConfig,
  onAcceptAssignment,
  onDeclineAssignment,
  onNavigateToPreferences,
}) => {
  const currentAra = aras.find((a) => a.id === currentAraId) || aras[0];
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');

  // Filter assignments for this specific ARA
  const myAssignments = assignments.filter(
    (a) => a.ara_id === currentAra.id && a.status !== 'Declined'
  );

  // Map each assignment to full session details
  const myShifts = myAssignments.map((assignment) => {
    const session = sessions.find((s) => s.id === assignment.session_id);
    const course = session ? courses.find((c) => c.id === session.course_id) : undefined;
    const room = session ? rooms.find((r) => r.id === session.room_id) : undefined;
    const block = room ? blocks.find((b) => b.id === room.block_id) : undefined;

    return {
      assignment,
      session,
      course,
      room,
      block,
    };
  }).filter((item) => item.session !== undefined);

  // Filter shifts by day if selected
  const filteredShifts = myShifts.filter((shift) => {
    if (selectedDayFilter === 'all') return true;
    return shift.session?.day_of_week === selectedDayFilter;
  });

  // Calculate total weekly hours assigned
  const totalAssignedHours = myShifts.reduce((sum, shift) => {
    return sum + (shift.session?.duration_hours || 2);
  }, 0);

  const maxWeeklyHours = currentAra.max_weekly_hours || 12;
  const hoursPercentage = Math.min(100, Math.round((totalAssignedHours / maxWeeklyHours) * 100));
  const remainingHours = Math.max(0, maxWeeklyHours - totalAssignedHours);

  // Qualifications for this ARA
  const myQualifications = qualifications.filter(
    (q) => q.ara_id === currentAra.id
  );

  return (
    <div className="space-y-6">
      {/* Top Academic Profile Header Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* ARA Avatar with Gold Border */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#002147] to-[#001733] text-amber-400 font-serif font-black text-2xl flex items-center justify-center border-2 border-amber-400 shadow-md shrink-0">
              {currentAra.avatar_initials}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900 font-serif">
                  {currentAra.full_name}
                </h2>
                <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded">
                  {currentAra.ara_code}
                </span>
                {currentAra.is_sara && (
                  <span className="text-xs font-bold bg-sky-50 text-sky-800 border border-sky-300 px-2 py-0.5 rounded flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    SARA Assistant
                  </span>
                )}
                <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded">
                  {currentAra.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-1">
                {currentAra.department} • Program: <strong className="text-slate-800">{currentAra.program || 'CSE'}</strong> • Year Level: <strong className="text-slate-800">{currentAra.year_level || 4}th Year</strong>
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {currentAra.email}
                </span>
                {currentAra.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {currentAra.phone}
                  </span>
                )}
                {currentAra.gpa_or_standing && (
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                    Standing: {currentAra.gpa_or_standing}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Account Switcher for Demo / Multi-User Support */}
          <div className="flex flex-col items-end gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg p-1.5">
              <span className="font-semibold text-slate-600 px-1">Switch ARA:</span>
              <select
                value={currentAraId}
                onChange={(e) => setCurrentAraId(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-[#002147] focus:outline-none"
              >
                {aras.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.ara_code} - {a.full_name} ({a.is_sara ? 'SARA' : 'ARA'})
                  </option>
                ))}
              </select>
            </div>

            {onNavigateToPreferences && (
              <button
                onClick={onNavigateToPreferences}
                className="flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900 underline"
              >
                Go to Self-Service Preference Portal <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Badges for Key Custody & Block Responsibility */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          {currentAra.assigned_rooms_summary ? (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold shadow-xs">
              <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Designated Key-Holder Custody (SRS §3):</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-950">
                {currentAra.assigned_rooms_summary}
              </span>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1 rounded-lg text-xs">
              General ARA (No primary key-holder room assigned)
            </div>
          )}

          <div className="bg-sky-50 border border-sky-200 text-sky-900 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium">
            <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
            <span>School of Electrical Engineering & Computing</span>
            <span className="text-sky-700 font-mono text-[11px]">AY {systemConfig.academic_year}</span>
          </div>
        </div>
      </div>

      {/* 3 Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Semester Workload Progress */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Weekly Assigned Workload (SRS §6)
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              {hoursPercentage}% Cap
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${
              totalAssignedHours >= maxWeeklyHours ? 'text-rose-700' : 'text-[#002147]'
            }`}>
              {totalAssignedHours}h
            </span>
            <span className="text-sm font-semibold text-slate-500">/ {maxWeeklyHours}h max per week</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                totalAssignedHours >= maxWeeklyHours
                  ? 'bg-rose-600'
                  : totalAssignedHours >= maxWeeklyHours * 0.75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${hoursPercentage}%` }}
            ></div>
          </div>

          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>{remainingHours}h remaining capacity</span>
            <span className="font-semibold text-slate-700">Policy: Max {maxWeeklyHours}h limit</span>
          </div>
        </div>

        {/* Card 2: Laboratory Shifts Count */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-600" />
              Allocated Laboratory Shifts
            </span>
            <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {myShifts.length} Sessions
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {myShifts.length}
            </span>
            <span className="text-sm text-slate-500">active sessions / week</span>
          </div>

          <div className="text-xs text-slate-600 space-y-1 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Days Active:</span>
              <span className="font-semibold text-slate-800">
                {Array.from(new Set(myShifts.map((s) => s.session?.day_of_week))).join(', ') || 'None scheduled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Confirmation Status:</span>
              <span className="font-semibold text-emerald-700">
                {myShifts.every((s) => s.assignment.status === 'Confirmed') ? 'All Confirmed ✓' : 'Pending Confirmation'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Academic Qualifications */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              Certified Qualifications (SRS §5)
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {myQualifications.filter((q) => q.status === 'Valid').length} Verified
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {myQualifications.length}
            </span>
            <span className="text-sm text-slate-500">courses certified</span>
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {myQualifications.map((q) => {
              const c = courses.find((course) => course.id === q.course_id);
              return (
                <span
                  key={q.id}
                  className="bg-slate-100 text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-300"
                >
                  {c?.course_code || q.course_id}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 1: Upcoming Laboratory Shifts Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-sky-600" />
                Schedule of Laboratory Shifts
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1 font-serif">
              My Assigned Laboratory Sessions for {systemConfig.semester}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              The authoritative list of lab sessions assigned to you by the auto-allocation engine. Please verify your attendance.
            </p>
          </div>

          {/* Day Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Filter Day:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {['all', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDayFilter(day)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    selectedDayFilter === day
                      ? 'bg-white text-[#002147] shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {day === 'all' ? 'All Days' : day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredShifts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No laboratory shifts scheduled for the selected filter. Check the Preference Portal to submit courses for auto-assignment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Day & Time Slot</th>
                  <th className="py-3 px-4">Room & Block</th>
                  <th className="py-3 px-4">Course & Curriculum</th>
                  <th className="py-3 px-4">Section / Group</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Role & Responsibility</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Confirmation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredShifts.map(({ assignment, session, course, room, block }) => {
                  const isKeyHolder = currentAra.assigned_rooms_summary?.includes(room?.room_code || '');

                  return (
                    <tr key={assignment.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Day & Time */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>{session?.day_of_week}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal pl-3.5">
                          {session?.start_time} - {session?.end_time}
                        </div>
                      </td>

                      {/* Room & Block */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono">
                          {room?.room_code}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {block?.block_code} • {room?.room_name}
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#002147] flex items-center gap-1.5">
                          <span>{course?.course_code}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                            {course?.program || 'CSE'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 max-w-xs truncate" title={course?.course_name}>
                          {course?.course_name}
                        </div>
                      </td>

                      {/* Section */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold">
                          {session?.section} {session?.group ? `(${session.group})` : ''}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {session?.duration_hours} hrs
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {isKeyHolder ? (
                          <span className="bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 w-fit">
                            <KeyRound className="w-3 h-3 text-amber-600" />
                            Room Key-Holder
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[10px]">
                            Primary Laboratory Assistant
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          assignment.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {assignment.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {assignment.status !== 'Confirmed' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onAcceptAssignment && onAcceptAssignment(assignment.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] shadow-xs flex items-center gap-1"
                              title="Accept & Confirm Shift"
                            >
                              <Check className="w-3 h-3" />
                              Accept
                            </button>
                            <button
                              onClick={() => onDeclineAssignment && onDeclineAssignment(assignment.id)}
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-100 text-rose-700 rounded text-[11px] border border-slate-300 hover:border-rose-300"
                              title="Decline / Request Substitute"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-medium text-[11px] flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Current Qualification Status Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Certified Qualifications Record (SRS §5)
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1 font-serif">
              Course Certification & Department Qualifications
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              The authoritative SOEEC Academic Commission registry of courses for which you are eligible to instruct laboratory sections.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded border border-slate-200">
            {myQualifications.length} Active Credentials
          </span>
        </div>

        {myQualifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No course qualifications on record. Please contact your Department Head or SOEEC Academic Commission to register course certifications.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Course Code & Title</th>
                  <th className="py-3 px-4">Department & Program</th>
                  <th className="py-3 px-4">Year Level</th>
                  <th className="py-3 px-4">Certification Date</th>
                  <th className="py-3 px-4">Certified By</th>
                  <th className="py-3 px-4">Qualification Status</th>
                  <th className="py-3 px-4 text-right">Auto-Assign Preference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {myQualifications.map((qual) => {
                  const course = courses.find((c) => c.id === qual.course_id);

                  return (
                    <tr key={qual.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Code & Title */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                          <span>{course?.course_code || qual.course_id}</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                            Certified
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 max-w-sm truncate" title={course?.course_name}>
                          {course?.course_name || 'Academic Laboratory Course'}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div>{course?.department || 'Computing Engineering'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{course?.program || 'CSE'}</div>
                      </td>

                      {/* Year Level */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        Year {course?.year_level || 1}
                      </td>

                      {/* Certified Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {qual.qualified_date || '2026-09-01'}
                      </td>

                      {/* Certified By */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {qual.certified_by || 'SOEEC Academic Commission'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          qual.status === 'Valid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {qual.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        {onNavigateToPreferences && (
                          <button
                            onClick={onNavigateToPreferences}
                            className="text-xs font-bold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 bg-sky-50 px-2.5 py-1 rounded border border-sky-200"
                          >
                            Submit Preference <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
