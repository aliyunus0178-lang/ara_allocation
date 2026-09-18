import React, { useState } from 'react';
import { 
  ARAUser, 
  Course, 
  ScheduledSession, 
  PreferenceSubmission, 
  AssistantAssignment,
  SystemConfig,
  ARAQualification,
  LaboratoryRoom,
  LaboratoryBlock
} from '../types/astu';
import { 
  Sparkles, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RotateCcw, 
  GraduationCap, 
  Trash2, 
  Calendar, 
  FileCheck,
  Check,
  X
} from 'lucide-react';

interface RealtimePreferencePortalProps {
  currentAraId: string;
  setCurrentAraId: (id: string) => void;
  aras: ARAUser[];
  courses: Course[];
  sessions: ScheduledSession[];
  rooms: LaboratoryRoom[];
  blocks: LaboratoryBlock[];
  preferences: PreferenceSubmission[];
  assignments: AssistantAssignment[];
  qualifications: ARAQualification[];
  systemConfig: SystemConfig;
  onSubmitRealtimePreference: (courseId: string, rank: 1 | 2 | 3) => void;
  onWithdrawPreference: (prefId: string) => void;
  onAcceptAssignment: (assignmentId: string) => void;
  onDeclineAssignment: (assignmentId: string) => void;
}

export const RealtimePreferencePortal: React.FC<RealtimePreferencePortalProps> = ({
  currentAraId,
  setCurrentAraId,
  aras,
  courses,
  sessions,
  rooms,
  blocks,
  preferences,
  assignments,
  qualifications,
  systemConfig,
  onSubmitRealtimePreference,
  onWithdrawPreference,
  onAcceptAssignment,
  onDeclineAssignment,
}) => {
  const currentAra = aras.find((a) => a.id === currentAraId) || aras[0];
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [selectedRank, setSelectedRank] = useState<1 | 2 | 3>(1);
  const [courseSearchTerm, setCourseSearchTerm] = useState<string>('');
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // Filter courses based on user search term
  const filteredCourses = courses.filter((c) => {
    if (!courseSearchTerm.trim()) return true;
    const term = courseSearchTerm.toLowerCase();
    return (
      c.course_code.toLowerCase().includes(term) ||
      c.course_name.toLowerCase().includes(term) ||
      (c.program && c.program.toLowerCase().includes(term))
    );
  });

  const activeCourse = courses.find((c) => c.id === selectedCourseId);

  // ARA's current preferences
  const araPreferences = preferences.filter((p) => p.ara_id === currentAra.id);

  // ARA's current assignments
  const araAssignments = assignments.filter(
    (a) => a.ara_id === currentAra.id && a.status !== 'Declined'
  );

  // ARA's qualified courses (Section 5)
  const araQualifications = qualifications.filter(
    (q) => q.ara_id === currentAra.id && q.status === 'Valid'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    // Check if ARA is qualified for course
    const isQual = araQualifications.some((q) => q.course_id === selectedCourseId);
    if (!isQual) {
      setSubmissionFeedback(
        `Note: You are not certified/qualified for this course per Section 5. A hard constraint exclusion (Section 6) will apply.`
      );
    } else {
      setSubmissionFeedback(null);
    }

    onSubmitRealtimePreference(selectedCourseId, selectedRank);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Current ARA Switcher */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Real-Time Preference Submission & Auto-Assignment • SRS §9 & §10
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Real-time Mode: <strong className="text-slate-800 uppercase">{systemConfig.realtime_assignment_mode}</strong>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1 font-serif">
              ARA Self-Service Course Preference Portal
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit preferred courses at any time. The system immediately checks session availability, verifies hard constraints, scores your profile, and auto-assigns you if eligible.
            </p>
          </div>

          {/* ARA Selector for Testing */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 p-1.5 rounded-lg">
            <span className="text-xs font-semibold text-slate-600 px-1">Acting As ARA:</span>
            <select
              value={currentAraId}
              onChange={(e) => setCurrentAraId(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-[#002147] focus:outline-none"
            >
              {aras.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.ara_code} - {a.full_name} ({a.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ARA Profile Quick Snapshot */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#002147] text-amber-400 font-bold flex items-center justify-center text-sm border-2 border-amber-400/40 shrink-0">
              {currentAra.avatar_initials}
            </div>
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span>{currentAra.full_name}</span>
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px] font-semibold">
                  {currentAra.ara_code}
                </span>
                {currentAra.is_sara && (
                  <span className="bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded text-[10px] font-bold">
                    SARA
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                <span>{currentAra.email}</span>
                {currentAra.phone && <span>• {currentAra.phone}</span>}
                {currentAra.program && <span>• {currentAra.program} Yr {currentAra.year_level || 4}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            {currentAra.assigned_rooms_summary && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold">
                <span>Key Custody:</span>
                <span className="font-mono text-amber-800">{currentAra.assigned_rooms_summary}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400">Weekly Cap: </span>
              <span className="font-semibold text-slate-800">{currentAra.max_weekly_hours}h max</span>
            </div>
            <div>
              <span className="text-slate-400">Current Workload: </span>
              <span className={`font-semibold ${currentAra.current_weekly_hours >= currentAra.max_weekly_hours ? 'text-rose-700' : 'text-emerald-700'}`}>
                {currentAra.current_weekly_hours}h / {currentAra.max_weekly_hours}h
              </span>
            </div>
            <div>
              <span className="text-slate-400">Status: </span>
              <span className={`px-2 py-0.5 rounded font-bold ${
                currentAra.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {currentAra.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Column: Submit New Preference Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Send className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Submit Course Preference (SRS §10)
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Course Selector with Search */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Select Course / Laboratory:
                </label>
                <span className="text-[10px] text-slate-400">
                  {filteredCourses.length} of {courses.length} courses
                </span>
              </div>

              {/* Quick filter input */}
              <input
                type="text"
                placeholder="Filter by code or title (e.g. CSEg1101, Python)..."
                value={courseSearchTerm}
                onChange={(e) => setCourseSearchTerm(e.target.value)}
                className="w-full mb-2 bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500"
              />

              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                {filteredCourses.map((c) => {
                  const isQ = araQualifications.some((q) => q.course_id === c.id);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.course_code} - {c.course_name} {c.program ? `(${c.program})` : ''} {isQ ? '✓ Qualified' : '(Uncertified)'}
                    </option>
                  );
                })}
              </select>

              {/* Active Course Snapshot */}
              {activeCourse && (
                <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{activeCourse.course_code}: {activeCourse.course_name}</span>
                    <span className="text-amber-700 font-mono">{activeCourse.credit_hours} Cr</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                    <span>Program: {activeCourse.program || 'PEng'}</span>
                    <span>•</span>
                    <span>Year: {activeCourse.year_level || 1}</span>
                    <span>•</span>
                    <span>Type: {activeCourse.activity_type?.join(', ') || 'lecture, lab'}</span>
                    {activeCourse.lab_count ? (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-emerald-700">{activeCourse.lab_count} Lab Sections</span>
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* Preference Rank Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Preference Rank (Max 3 per ARA):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((rank) => (
                  <button
                    key={rank}
                    type="button"
                    onClick={() => setSelectedRank(rank as 1 | 2 | 3)}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-all ${
                      selectedRank === rank
                        ? 'bg-[#002147] text-amber-400 border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Preference {rank}
                    <div className="text-[10px] font-normal text-slate-400">
                      {rank === 1 ? '+40 pts' : rank === 2 ? '+30 pts' : '+20 pts'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Qualified Courses Reminder */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                <span>Your Active Qualifications (SRS §5):</span>
              </div>
              {araQualifications.length === 0 ? (
                <p className="text-rose-600 italic">No qualifications on record. Hard constraint will exclude auto-assignment.</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {araQualifications.map((q) => {
                    const course = courses.find((c) => c.id === q.course_id);
                    return (
                      <span key={q.id} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                        {course?.course_code}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Real-time Notice */}
            <div className="p-3 bg-sky-50 text-sky-900 rounded-lg border border-sky-200 text-[11px] leading-relaxed">
              <strong>Section 9 Automated Engine:</strong> Submitting will trigger an instant availability scan across all sessions for that course. If a slot is open and you are the top-ranked candidate, you will be auto-assigned immediately!
            </div>

            {submissionFeedback && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px]">
                {submissionFeedback}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#002147] hover:bg-[#001733] text-amber-400 font-bold rounded-lg shadow-md border border-amber-500/30 transition-all active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Submit & Auto-Assign in Real Time</span>
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Submissions & Assigned Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 11: Assigned Sessions & Active Confirmation Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  My Assigned Laboratory Sessions & Confirmation (SRS §11)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {araAssignments.length} Session(s) Allocated
              </span>
            </div>

            {araAssignments.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                You currently have no scheduled laboratory session assignments for this semester.
              </div>
            ) : (
              <div className="space-y-3">
                {araAssignments.map((asgn) => {
                  const session = sessions.find((s) => s.id === asgn.session_id);
                  const course = courses.find((c) => c.id === session?.course_id);
                  const room = rooms.find((r) => r.id === session?.room_id);
                  const block = blocks.find((b) => b.id === room?.block_id);

                  return (
                    <div
                      key={asgn.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-slate-900 font-mono">
                            {course?.course_code} - {course?.course_name}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            {session?.section} • {session?.group} • Slot #{asgn.slot_number}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            asgn.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                          }`}>
                            {asgn.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                            Source: {asgn.source.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px]">
                        <div>
                          <span className="text-slate-400">Day & Time: </span>
                          <span className="font-semibold text-slate-800">{session?.day_of_week} {session?.start_time}–{session?.end_time}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Location: </span>
                          <span className="font-semibold text-sky-800">{room?.room_code} ({block?.block_code})</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Assigned: </span>
                          <span className="text-slate-600">{new Date(asgn.assigned_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Section 11: Confirmation Controls */}
                      {asgn.status === 'Tentative' && (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <div className="text-[11px] text-amber-800 font-medium">
                            Action required: Confirm this slot to finalize your schedule.
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onDeclineAssignment(asgn.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded border border-rose-300 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                            <button
                              onClick={() => onAcceptAssignment(asgn.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Confirm Assignment</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 9.4 & 10: Preference Submissions & Status Tracking */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Submitted Preferences & Pending Queue (§9.3, §9.4, §10)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {araPreferences.length} of {systemConfig.max_preferences_per_ara} Preferences
              </span>
            </div>

            {araPreferences.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No preferences submitted yet. Submit above to initiate real-time auto-assignment.
              </div>
            ) : (
              <div className="space-y-2.5">
                {araPreferences.map((pref) => {
                  const course = courses.find((c) => c.id === pref.course_id);
                  const resolvedSession = sessions.find((s) => s.id === pref.resolved_session_id);

                  return (
                    <div
                      key={pref.id}
                      className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold px-2 py-0.5 rounded bg-[#002147] text-amber-400 text-[10px] font-mono">
                            Rank {pref.preference_rank}
                          </span>
                          <span className="font-bold text-slate-900 font-mono">
                            {course?.course_code}
                          </span>
                          <span className="text-slate-600 font-sans truncate max-w-[200px]">
                            {course?.course_name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Submitted: {new Date(pref.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                        {pref.resolution_reason && (
                          <div className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 mt-1">
                            <span className="font-semibold text-slate-800">Engine Note: </span>
                            {pref.resolution_reason}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          pref.status.includes('Auto-Assigned')
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : pref.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {pref.status}
                        </span>

                        {pref.status === 'Pending' && (
                          <button
                            onClick={() => onWithdrawPreference(pref.id)}
                            className="p-1.5 rounded text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                            title="Withdraw Preference"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
