import React from 'react';
import { WeightConfiguration, SystemConfig } from '../types/astu';
import { 
  Sliders, 
  RotateCcw, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Info,
  Scale
} from 'lucide-react';
import { INITIAL_WEIGHT_CONFIGURATIONS } from '../data/mockAstuData';

interface ScoringWeightsEditorProps {
  weights: WeightConfiguration[];
  systemConfig: SystemConfig;
  onUpdateWeight: (id: string, newWeight: number, isEnabled: boolean) => void;
  onUpdateSystemConfig: (updated: Partial<SystemConfig>) => void;
  onResetWeightsToDefault: () => void;
}

export const ScoringWeightsEditor: React.FC<ScoringWeightsEditorProps> = ({
  weights,
  systemConfig,
  onUpdateWeight,
  onUpdateSystemConfig,
  onResetWeightsToDefault,
}) => {
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
    </div>
  );
};
