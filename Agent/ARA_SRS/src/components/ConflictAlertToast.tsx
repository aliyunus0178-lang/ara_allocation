import React, { useEffect, useState } from 'react';
import { ConflictAlertEvent } from '../types/astu';
import { 
  AlertTriangle, 
  X, 
  Clock, 
  MapPin, 
  User, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink,
  Flame
} from 'lucide-react';

interface ConflictAlertToastProps {
  alert: ConflictAlertEvent | null;
  onDismiss: () => void;
  onNavigateToDiagnostics?: () => void;
}

export const ConflictAlertToast: React.FC<ConflictAlertToastProps> = ({
  alert,
  onDismiss,
  onNavigateToDiagnostics,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setIsVisible(true);
      // Auto-dismiss after 14 seconds if not clicked
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 14000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [alert, onDismiss]);

  if (!alert || !isVisible) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-lg w-full transition-all duration-300 transform translate-y-0 shadow-2xl animate-in slide-in-from-top-4">
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 border-2 border-rose-500/80 rounded-2xl shadow-2xl p-4 sm:p-5 text-white overflow-hidden relative backdrop-blur-md">
        {/* Glowing background pulse */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl pointer-events-none animate-pulse" />
        
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 relative z-10 pb-3 border-b border-rose-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center shrink-0 text-rose-400 shadow-inner">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-mono">
                  REAL-TIME CONFLICT ALERT
                </span>
                <span className="text-xs text-rose-300/80 font-mono">
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5 font-serif">
                Scheduling Overlap Detected in Manual Override
              </h4>
            </div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 200);
            }}
            className="text-rose-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conflict Details Body */}
        <div className="mt-3 space-y-2.5 text-xs relative z-10">
          <div className="flex items-center gap-2 bg-rose-900/40 border border-rose-500/30 p-2.5 rounded-xl">
            <User className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-slate-300">Conflicted Assistant: </span>
              <span className="font-bold text-amber-300">{alert.ara_name}</span>
              <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded ml-1.5 border border-amber-400/40">
                {alert.ara_code}
              </span>
            </div>
          </div>

          {/* Side by side comparison of overlapping sessions */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-white/10">
            {/* New Override Session */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block">
                Target Override Session
              </span>
              <div className="font-bold text-slate-100 text-xs truncate" title={alert.target_course_code}>
                {alert.target_course_code}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-300 font-mono">
                <Clock className="w-3 h-3 text-rose-400" />
                {alert.day_of_week} {alert.target_time}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-300 font-mono">
                <MapPin className="w-3 h-3 text-rose-400" />
                {alert.target_room_code}
              </div>
            </div>

            {/* Existing Colliding Session */}
            <div className="space-y-1 border-l border-white/10 pl-2.5">
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">
                Existing Active Shift
              </span>
              <div className="font-bold text-slate-100 text-xs truncate" title={alert.conflicting_course_code}>
                {alert.conflicting_course_code}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-300 font-mono">
                <Clock className="w-3 h-3 text-amber-400" />
                {alert.day_of_week} {alert.conflicting_time}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-300 font-mono">
                <MapPin className="w-3 h-3 text-amber-400" />
                {alert.conflicting_room_code}
              </div>
            </div>
          </div>

          {alert.override_reason && (
            <p className="text-[11px] text-slate-300 italic bg-white/5 p-2 rounded-lg border border-white/10">
              <span className="font-semibold text-rose-300 not-italic">Justification: </span>
              "{alert.override_reason}"
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="mt-3.5 pt-3 border-t border-rose-500/30 flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-1.5 text-[10px] text-rose-300 font-mono">
            <Flame className="w-3 h-3 text-rose-400" />
            Double-booking violation §6
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToDiagnostics && (
              <button
                onClick={() => {
                  onNavigateToDiagnostics();
                  setIsVisible(false);
                  setTimeout(onDismiss, 200);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <span>Diagnostics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 200);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/20 transition-all"
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
