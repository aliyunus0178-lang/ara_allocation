import React, { useState } from 'react';
import { WeightConfiguration, SystemConfig, Course } from '../types/astu';
import { 
  Sliders, 
  RotateCcw, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Info,
  Scale,
  Award,
  Zap,
  Check,
  Search,
  ShieldAlert
} from 'lucide-react';
import { INITIAL_WEIGHT_CONFIGURATIONS } from '../data/mockAstuData';

interface ScoringWeightsEditorProps {
  weights: WeightConfiguration[];
  systemConfig: SystemConfig;
  courses?: Course[];
  onUpdateWeight: (id: string, newWeight: number, isEnabled: boolean) => void;
  onUpdateSystemConfig: (updated: Partial<SystemConfig>) => void;
  onResetWeightsToDefault: () => void;
  onUpdateCoursePriority?: (courseId: string, updates: Partial<Course>) => void;
  onHighPrecedenceAutoFill?: () => void;
}

export const ScoringWeightsEditor: React.FC<ScoringWeightsEditorProps> = ({
  weights,
  systemConfig,
  courses = [],
  onUpdateWeight,
  onUpdateSystemConfig,
  onResetWeightsToDefault,
  onUpdateCoursePriority,
  onHighPrecedenceAutoFill,
}) => {
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [priorityFeedback, setPriorityFeedback] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                Authoritative Decision Model • SRS §8
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Single Unified Scoring Hierarchy
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1 font-serif">
              Assignment Scoring Model Weights & Decision Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Replaces sequential priority with the authoritative weighted scoring engine. Adjust weights, historical decay lookbacks, tie-breaking rules, and real-time reconciliation policies.
            </p>
          </div>

          <button
            onClick={onResetWeightsToDefault}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to SRS v2.0 Defaults</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Weights Config Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Authoritative Factors & Weights (SRS §8.1)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">10 Scored Factors</span>
          </div>

          <div className="space-y-3">
            {weights.map((w) => (
              <div
                key={w.id}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={w.is_enabled}
                      onChange={(e) => onUpdateWeight(w.id, w.current_weight, e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 font-sans">{w.factor_name}</span>
                      <span className="text-slate-400 font-mono text-[10px] ml-2">({w.factor_key})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-[11px]">
                      Default: <strong className="text-slate-700 font-mono">+{w.default_weight}</strong>
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-slate-400 font-semibold">+</span>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={w.current_weight}
                        onChange={(e) => onUpdateWeight(w.id, Number(e.target.value) || 0, w.is_enabled)}
                        disabled={!w.is_enabled}
                        className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-right font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                      />
                      <span className="text-slate-500 text-[10px]">pts</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <p className="italic">{w.rationale}</p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={w.current_weight}
                    onChange={(e) => onUpdateWeight(w.id, Number(e.target.value) || 0, w.is_enabled)}
                    disabled={!w.is_enabled}
                    className="w-32 accent-amber-600 disabled:opacity-40"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Column: Additional Policies (8.2, 8.4, 9.2) */}
        <div className="space-y-6">
          {/* Section 8.2: Historical Lookback Window */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Historical Assignment Window (SRS §8.2)
              </h3>
            </div>

            <p className="text-slate-600 text-[11px] leading-relaxed">
              By default, considers immediately preceding semester only. Configure longer lookback windows with decay for older semesters.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lookback Semesters: <strong className="text-amber-700 font-mono">{systemConfig.historical_lookback_semesters} semester(s)</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={systemConfig.historical_lookback_semesters}
                  onChange={(e) => onUpdateSystemConfig({ historical_lookback_semesters: Number(e.target.value) })}
                  className="w-full accent-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Decay Factor per Prior Semester: <strong className="text-amber-700 font-mono">{systemConfig.historical_decay_factor}x</strong>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.1"
                  value={systemConfig.historical_decay_factor}
                  onChange={(e) => onUpdateSystemConfig({ historical_decay_factor: Number(e.target.value) })}
                  className="w-full accent-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Section 8.4: Tie-Breaking Hierarchy */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Scale className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Deterministic Tie-Breaking Rule (SRS §8.4)
              </h3>
            </div>

            <div className="space-y-2 text-[11px] text-slate-700">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#002147] text-amber-400 font-bold flex items-center justify-center font-mono">1</span>
                <div>
                  <strong className="text-slate-900">Lower current workload:</strong>
                  <span className="text-slate-500 block">Favors under-utilized ARAs to maintain balanced teaching hours.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#002147] text-amber-400 font-bold flex items-center justify-center font-mono">2</span>
                <div>
                  <strong className="text-slate-900">Seniority (Creation Timestamp):</strong>
                  <span className="text-slate-500 block">Earlier ARA appointment date breaks secondary ties deterministically.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-900">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center font-mono">3</span>
                <div>
                  <strong className="text-amber-950">Manual Administrator Selection:</strong>
                  <span className="text-amber-800 block">If still tied, flags session for administrator resolution rather than arbitrary choice.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 9.2: Real-time & Batch Reconciliation */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Batch Reconciliation (SRS §9.2)
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Real-Time Auto-Assignment Status:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSystemConfig({ realtime_assignment_mode: 'tentative' })}
                    className={`p-2 rounded border font-bold text-center transition-colors ${
                      systemConfig.realtime_assignment_mode === 'tentative'
                        ? 'bg-[#002147] text-amber-400 border-amber-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Tentative
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSystemConfig({ realtime_assignment_mode: 'final' })}
                    className={`p-2 rounded border font-bold text-center transition-colors ${
                      systemConfig.realtime_assignment_mode === 'final'
                        ? 'bg-[#002147] text-amber-400 border-amber-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Immediately Final
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={systemConfig.batch_can_override_tentative}
                  onChange={(e) => onUpdateSystemConfig({ batch_can_override_tentative: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 mt-0.5"
                />
                <span className="text-[11px] text-slate-600 leading-tight">
                  Allow batch engine to re-score and displace existing tentative real-time assignments if a higher score candidate emerges.
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* COURSE PRIORITY & CAPSTONE / FYP PRECEDENCE CONFIG       */}
      {/* ========================================================= */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider font-serif">
                Course Priority & Capstone / Final Year Project Precedence Configuration
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Guarantees that high-stakes Capstone and Final Year Project courses are assigned available assistant hours first during assistance scarcity.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!courses || !onUpdateCoursePriority) return;
              const capstoneCourses = courses.filter((c) =>
                c.course_name.toLowerCase().includes('capstone') ||
                c.course_name.toLowerCase().includes('final year project') ||
                c.course_name.toLowerCase().includes('capston') ||
                c.course_code.includes('5307') ||
                c.course_code.includes('4203') ||
                c.course_code.includes('5213')
              );
              capstoneCourses.forEach((c) => {
                onUpdateCoursePriority(c.id, {
                  priority_level: 'CRITICAL_CORE',
                  priority_rank: 1,
                  precedence_score: 100,
                  special_assistance_required: true,
                });
              });
              if (onHighPrecedenceAutoFill) {
                onHighPrecedenceAutoFill();
              }
              setPriorityFeedback(`Successfully boosted ${capstoneCourses.length} Capstone & FYP courses and executed High-Precedence Auto-Fill!`);
              setTimeout(() => setPriorityFeedback(null), 4000);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#002147] hover:bg-[#001733] text-amber-400 font-bold text-xs rounded-lg shadow-sm border border-amber-500/40 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Force High-Precedence for Capstone & FYP</span>
          </button>
        </div>

        {priorityFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{priorityFeedback}</span>
          </div>
        )}

        <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-950 leading-relaxed flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Assistant Scarcity Protection Policy:</strong> When available ARA/SARA assistant hours are scarce, courses explicitly flagged with <strong>High-Precedence (CRITICAL_CORE)</strong> will consume qualified assistant capacity first before lower-tier or general lab sessions are considered.
          </div>
        </div>

        {/* Course Cards / Table */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] font-mono">
              Departmental Courses ({courses?.length || 0})
            </span>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by code or course name..."
                value={courseSearchQuery}
                onChange={(e) => setCourseSearchQuery(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-xs w-64 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {courses
              ?.filter((c) =>
                courseSearchQuery
                  ? c.course_code.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                    c.course_name.toLowerCase().includes(courseSearchQuery.toLowerCase())
                  : true
              )
              .map((c) => {
                const isCapstone =
                  c.course_name.toLowerCase().includes('capstone') ||
                  c.course_name.toLowerCase().includes('final year project') ||
                  c.course_name.toLowerCase().includes('capston') ||
                  c.course_code.includes('5307') ||
                  c.course_code.includes('4203') ||
                  c.course_code.includes('5213');

                const isHighPrecedence = c.priority_level === 'CRITICAL_CORE' || (c.precedence_score || 0) >= 90;

                return (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-xl border space-y-2 text-xs transition-all ${
                      isCapstone
                        ? 'bg-amber-50/70 border-amber-300'
                        : isHighPrecedence
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : 'bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                          <span>{c.course_code}</span>
                          {isCapstone && (
                            <span className="bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded text-[9px] font-bold">
                              Capstone / FYP
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-slate-700 text-xs mt-0.5 line-clamp-1">
                          {c.course_name}
                        </h4>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isHighPrecedence
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {c.priority_level || 'NORMAL'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-500 font-medium">Precedence Score:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={c.precedence_score || 50}
                          onChange={(e) => {
                            if (onUpdateCoursePriority) {
                              onUpdateCoursePriority(c.id, { precedence_score: Number(e.target.value) || 0 });
                            }
                          }}
                          className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono font-bold text-slate-900"
                        />
                        <span className="text-slate-400">pts</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateCoursePriority) {
                            const newLevel = isHighPrecedence ? 'ELECTIVE' : 'CRITICAL_CORE';
                            const newScore = isHighPrecedence ? 50 : 100;
                            onUpdateCoursePriority(c.id, {
                              priority_level: newLevel,
                              priority_rank: isHighPrecedence ? 3 : 1,
                              precedence_score: newScore,
                              special_assistance_required: true,
                            });
                          }
                        }}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          isHighPrecedence
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                            : 'bg-slate-200 hover:bg-amber-500 hover:text-slate-950 text-slate-800'
                        }`}
                      >
                        {isHighPrecedence ? '✓ High Precedence Flagged' : '+ Flag High Precedence'}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
