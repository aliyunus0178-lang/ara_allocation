import React, { useState } from 'react';
import { 
  ARAUser, 
  Course, 
  ARAQualification, 
  AssistantAssignment,
  ScheduledSession
} from '../types/astu';
import { 
  GraduationCap, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ShieldCheck,
  Search
} from 'lucide-react';

interface QualificationsWorkloadMatrixProps {
  aras: ARAUser[];
  courses: Course[];
  qualifications: ARAQualification[];
  assignments: AssistantAssignment[];
  sessions: ScheduledSession[];
  onAddQualification: (qual: ARAQualification) => void;
}

export const QualificationsWorkloadMatrix: React.FC<QualificationsWorkloadMatrixProps> = ({
  aras,
  courses,
  qualifications,
  assignments,
  sessions,
  onAddQualification,
}) => {
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedAraId, setSelectedAraId] = useState<string>(aras[0]?.id || '');
  const [newCertCourseId, setNewCertCourseId] = useState<string>(courses[0]?.id || '');
  const [newCertExpiry, setNewCertExpiry] = useState<string>('2028-06-30');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleCreateQualification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAraId || !newCertCourseId) return;

    const newQual: ARAQualification = {
      id: `qual-${selectedAraId}-${newCertCourseId}-${Date.now()}`,
      ara_id: selectedAraId,
      course_id: newCertCourseId,
      qualified_date: new Date().toISOString().split('T')[0],
      expiry_date: newCertExpiry,
      certified_by: 'Head of CSE Dept (ASTU)',
      status: 'Valid',
    };

    onAddQualification(newQual);
  };

  const filteredQualifications = qualifications.filter((q) => {
    if (selectedCourseFilter !== 'all' && q.course_id !== selectedCourseFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const ara = aras.find((a) => a.id === q.ara_id);
      const course = courses.find((c) => c.id === q.course_id);
      const matchAra = ara?.full_name.toLowerCase().includes(query) || ara?.ara_code.toLowerCase().includes(query);
      const matchCourse = course?.course_code.toLowerCase().includes(query) || course?.course_name.toLowerCase().includes(query);
      if (!matchAra && !matchCourse) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                Hard Constraint Eligibility • SRS §5, §6, §17
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Mandatory Qualification Model
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1 font-serif">
              ARA Course Qualifications & Weekly Workload Utilization Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly enforces Section 5 qualifications (unqualified ARAs receive 0 points and hard rejection) and Section 6 workload caps (maximum 12 hours/week).
            </p>
          </div>
        </div>
      </div>

      {/* ARA Workload Utilization Bars (Section 6) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              ARA Weekly Workload Utilization (SRS §6 Workload Limit: 12h max)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {aras.length} Assistants Registered
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {aras.map((ara) => {
            // Calculate assigned hours
            const araAsgns = assignments.filter((a) => a.ara_id === ara.id && a.status !== 'Declined');
            const totalHours = araAsgns.reduce((sum, asgn) => {
              const session = sessions.find((s) => s.id === asgn.session_id);
              return sum + (session?.duration_hours || 0);
            }, 0);

            const percentage = Math.min(100, Math.round((totalHours / ara.max_weekly_hours) * 100));
            const isNearCap = percentage >= 75;
            const isFull = percentage >= 100;

            return (
              <div
                key={ara.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#002147] text-amber-400 font-bold flex items-center justify-center text-xs">
                      {ara.avatar_initials}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 font-mono">{ara.ara_code}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[120px]">{ara.full_name}</div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    ara.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {ara.status}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="text-slate-500">Weekly Hours:</span>
                    <span className={`font-bold ${isFull ? 'text-rose-700' : isNearCap ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {totalHours}h / {ara.max_weekly_hours}h ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isFull
                          ? 'bg-rose-600'
                          : isNearCap
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200">
                  <span>Sessions: {araAsgns.length} active</span>
                  <span className="font-mono text-slate-600">{ara.gpa_or_standing}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Qualifications Section (Section 5, 17) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Qualifications Registry Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Certified Course Qualifications (SRS §5 & §17)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none"
              >
                <option value="all">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left divide-y divide-slate-200">
              <thead className="bg-[#001733] text-white uppercase text-[10px] font-mono tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">ARA Code & Name</th>
                  <th className="py-2.5 px-3">Course Certified</th>
                  <th className="py-2.5 px-3">Certified Date</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredQualifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      No certified qualification records found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredQualifications.map((qual) => {
                    const ara = aras.find((a) => a.id === qual.ara_id);
                    const course = courses.find((c) => c.id === qual.course_id);

                    return (
                      <tr key={qual.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 font-mono">{ara?.ara_code}</div>
                          <div className="text-[11px] text-slate-500">{ara?.full_name}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-sky-800 font-mono">{course?.course_code}</span>
                          <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{course?.course_name}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {qual.qualified_date}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {qual.expiry_date}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {qual.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column: Issue Certification Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Plus className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Issue Course Certification
            </h3>
          </div>

          <form onSubmit={handleCreateQualification} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Assistant (ARA):
              </label>
              <select
                value={selectedAraId}
                onChange={(e) => setSelectedAraId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none"
              >
                {aras.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.ara_code} - {a.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Course to Certify:
              </label>
              <select
                value={newCertCourseId}
                onChange={(e) => setNewCertCourseId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_code} - {c.course_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Certification Expiry Date:
              </label>
              <input
                type="date"
                value={newCertExpiry}
                onChange={(e) => setNewCertExpiry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none"
              />
            </div>

            <div className="p-3 bg-slate-50 text-slate-600 rounded-lg text-[11px] leading-relaxed border border-slate-200">
              Per Section 5, qualifying an ARA enables them to be scored for this course during real-time auto-assignment and batch runs.
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#002147] hover:bg-[#001733] text-amber-400 font-bold rounded-lg shadow-sm border border-amber-500/30 transition-all"
            >
              Issue & Register Qualification
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
