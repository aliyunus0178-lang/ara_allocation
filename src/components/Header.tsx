import React, { useState } from 'react';
import { UserRole, SystemNotification, ARAUser } from '../types/astu';
import { 
  Building2, 
  Bell, 
  ShieldCheck, 
  GraduationCap, 
  CheckCircle2, 
  Calendar, 
  UserCheck, 
  X,
  Layers,
  Sparkles,
  UserPlus,
  LogIn,
  Key,
  User,
  Sun,
  Moon,
  Activity
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  notifications: SystemNotification[];
  onMarkNotificationRead: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  assignedCount: number;
  unresolvedCount: number;
  totalSessions: number;
  onOpenQuickDemo: () => void;
  currentAra?: ARAUser;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  setCurrentRole,
  notifications,
  onMarkNotificationRead,
  activeTab,
  setActiveTab,
  assignedCount,
  unresolvedCount,
  totalSessions,
  onOpenQuickDemo,
  currentAra,
  onOpenAuthModal,
  isDarkMode = false,
  onToggleTheme
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="bg-[#002147] text-white border-b border-amber-500/30 sticky top-0 z-40 shadow-lg">
      {/* Top Academic Ribbon */}
      <div className="bg-[#001733] px-4 py-1.5 text-xs text-slate-300 flex flex-wrap items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold text-amber-400">
            <GraduationCap className="w-3.5 h-3.5" />
            ADAMA SCIENCE & TECHNOLOGY UNIVERSITY (ASTU)
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-300">School of Electrical Engineering & Computing</span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-300">Dept. of Computer Science & Engineering</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-slate-300 font-mono">
            <Calendar className="w-3 h-3 text-amber-400" />
            AY 2026/2027 • Semester I
          </span>
          <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-mono text-[11px] font-medium">
            SRS v2.0 Final
          </span>
        </div>
      </div>

      {/* Main Brand & Controls Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* University Crest & Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#002147] rounded-[7px] flex flex-col items-center justify-center border border-amber-400/40">
              <Building2 className="w-5 h-5 text-amber-400" />
              <span className="text-[8px] font-bold tracking-widest text-amber-300 leading-none mt-0.5">ASTU</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 font-serif">
                ARA Laboratory Allocation System
              </h1>
              <span className="text-[11px] bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded font-mono font-semibold">
                CSEg / B-510
              </span>
            </div>
            <p className="text-xs text-slate-300 hidden sm:block">
              Block Responsibility, Room Key-Holder & Course Preference Auto-Assignment Engine
            </p>
          </div>
        </div>

        {/* Right Side: Role Switcher, SARA Register/Login, Notifications, Quick SRS Demo */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* SARA Registration Button */}
          <button
            onClick={() => onOpenAuthModal('register')}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-3 py-1.5 rounded-lg border border-amber-500/40 shadow-sm transition-all active:scale-95"
            title="Register new Student Academic Resource Assistant"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Register</span>
            <span>SARA</span>
          </button>

          {/* SARA / ARA Login Account Switcher */}
          <button
            onClick={() => onOpenAuthModal('login')}
            className="flex items-center gap-2 text-xs bg-slate-900/90 hover:bg-slate-800 border border-white/20 text-white font-medium px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
            title="Switch ARA account or login as administrator"
          >
            {currentAra ? (
              <>
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {currentAra.avatar_initials}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-[11px] font-bold text-amber-300 leading-none truncate max-w-[130px]">
                    {currentAra.full_name}
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono leading-none">
                    {currentAra.assigned_rooms_summary ? currentAra.assigned_rooms_summary.split(',')[0] : 'ARA Portal'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs">Sign In / Switch</span>
              </>
            )}
          </button>

          {/* Quick SRS Benchmark Test */}
          <button
            onClick={onOpenQuickDemo}
            className="hidden xl:flex items-center gap-1.5 text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-md shadow-sm transition-all active:scale-95"
            title="View Section 20 Benchmark Assignment Record"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>SRS §20 Benchmark</span>
          </button>

          {/* Role Switcher Pill */}
          <div className="bg-slate-900/80 border border-white/15 rounded-lg p-1 flex items-center">
            <label className="text-[11px] text-slate-400 px-2 hidden sm:inline flex items-center gap-1 font-medium">
              <UserCheck className="w-3 h-3 text-amber-400" /> Role:
            </label>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              className="bg-transparent text-xs text-amber-300 font-semibold focus:outline-none cursor-pointer pr-2 py-0.5"
            >
              <option value="ARA_ADMINISTRATOR" className="bg-slate-900 text-white">
                ARA Administrator
              </option>
              <option value="DEPARTMENT_HEAD" className="bg-slate-900 text-white">
                Department Head (Override Auth)
              </option>
              <option value="ARA_ASSISTANT" className="bg-slate-900 text-white">
                ARA Assistant (Self-Service)
              </option>
            </select>
          </div>

          {/* Global Academic Theme Toggle Button (Light vs. High-Contrast Dark Academic) */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                isDarkMode
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm hover:bg-amber-300'
                  : 'bg-slate-800/90 text-amber-300 border-white/20 hover:bg-slate-700/90'
              }`}
              title={isDarkMode ? 'Switch to Light Academic Theme' : 'Switch to High-Contrast Dark Academic Theme'}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span className="hidden lg:inline text-[11px] font-bold">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-amber-300 fill-amber-300/30" />
                  <span className="hidden lg:inline text-[11px] font-bold">Dark</span>
                </>
              )}
            </button>
          )}

          {/* Notifications Center Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-white/10 transition-colors"
              aria-label="System Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-700 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      System Notifications (SRS §18)
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotifs(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No recent notifications</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => onMarkNotificationRead(notif.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          notif.is_read
                            ? 'bg-slate-800/40 border-slate-800 text-slate-400'
                            : 'bg-slate-800/90 border-amber-500/40 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold mb-1">
                          <span className="text-amber-300">{notif.title}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <nav className="bg-[#001c3d] border-t border-white/10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('batch_allocations')}
            className={`px-3 py-2 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'batch_allocations'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Schedule & Batch Allocations
            <span className="ml-1 px-1.5 py-0.2 bg-slate-900/30 text-[10px] rounded-full">
              {assignedCount}/{totalSessions}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('my_profile')}
            className={`px-3 py-2 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'my_profile'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            My ARA Profile & Shifts
          </button>

          <button
            onClick={() => setActiveTab('realtime_portal')}
            className={`px-3 py-2 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'realtime_portal'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            ARA Preference & Real-Time Auto-Assign (§9, §10)
          </button>

          <button
            onClick={() => setActiveTab('blocks_and_rooms')}
            className={`px-3 py-2 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'blocks_and_rooms'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Blocks, Heatmap & Keys (§2, §3, §4)
          </button>

          <button
            onClick={() => setActiveTab('scoring_weights')}
            className={`px-3 py-2 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'scoring_weights'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Authoritative Scoring Weights (§8)
          </button>

          <button
            onClick={() => setActiveTab('overrides_unresolved')}
            className={`px-3 py-2 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'overrides_unresolved'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Overrides & Diagnostics (§14, §16)
            {unresolvedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold rounded-full">
                {unresolvedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('qualifications_workload')}
            className={`px-3 py-2 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'qualifications_workload'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Qualifications & Workloads (§5, §6)
          </button>

          <button
            onClick={() => setActiveTab('django_api')}
            className={`px-3 py-2 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'django_api'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="font-mono font-bold text-amber-300">{'{'}DRF{'}'}</span>
            Django REST API & Models
          </button>

          <button
            onClick={() => setActiveTab('audit_compliance')}
            className={`px-3 py-2 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit_compliance'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Audit Trail & SRS Checklist (§18)
          </button>

          <button
            onClick={() => setActiveTab('system_health')}
            className={`px-3 py-2 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'system_health'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            System Health (D3)
          </button>
        </div>
      </nav>
    </header>
  );
};
