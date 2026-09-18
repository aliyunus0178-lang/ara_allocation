import React, { useState, useMemo } from 'react';
import { 
  ARAUser, 
  Course, 
  LaboratoryRoom, 
  LaboratoryBlock, 
  UserRole 
} from '../types/astu';
import { 
  X, 
  Key, 
  User, 
  UserPlus, 
  LogIn, 
  Search, 
  CheckCircle2, 
  ShieldAlert, 
  GraduationCap, 
  Building2, 
  Phone, 
  Mail, 
  Check, 
  Sparkles,
  BookOpen,
  Clock,
  Award
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
  aras: ARAUser[];
  currentAraId: string;
  onSelectAra: (araId: string) => void;
  onRegisterSARA: (newAraData: {
    full_name: string;
    email: string;
    phone: string;
    ara_code?: string;
    department: string;
    program: string;
    year_level: number;
    gpa_or_standing: string;
    selected_room_ids: string[];
    selected_course_ids: string[];
    block_responsibility?: string;
    max_weekly_hours: number;
  }) => void;
  courses: Course[];
  rooms: LaboratoryRoom[];
  blocks: LaboratoryBlock[];
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode,
  aras,
  currentAraId,
  onSelectAra,
  onRegisterSARA,
  courses,
  rooms,
  blocks,
  currentRole,
  onChangeRole,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('ALL');

  // Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAraCode, setRegAraCode] = useState('');
  const [regProgram, setRegProgram] = useState('CSE');
  const [regDepartment, setRegDepartment] = useState('Computer Science & Engineering');
  const [regYearLevel, setRegYearLevel] = useState(4);
  const [regGpa, setRegGpa] = useState('3.80 (High Honors)');
  const [regMaxHours, setRegMaxHours] = useState(12);
  const [regSelectedRooms, setRegSelectedRooms] = useState<string[]>([]);
  const [regSelectedCourses, setRegSelectedCourses] = useState<string[]>([]);
  const [regBlockResponsibility, setRegBlockResponsibility] = useState('');
  const [courseSearchFilter, setCourseSearchFilter] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Sync mode when initialMode prop changes
  React.useEffect(() => {
    setMode(initialMode);
    setFormError(null);
  }, [initialMode, isOpen]);

  // Generate next SARA code when entering registration mode
  React.useEffect(() => {
    if (mode === 'register' && !regAraCode) {
      const nextNum = aras.length + 1;
      setRegAraCode(`SARA/2026/${nextNum < 10 ? '0' + nextNum : nextNum}`);
    }
  }, [mode, aras.length, regAraCode]);

  // Filtered ARAs for login
  const filteredAras = useMemo(() => {
    return aras.filter((ara) => {
      const matchesSearch = 
        ara.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ara.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ara.phone && ara.phone.includes(searchQuery)) ||
        (ara.assigned_rooms_summary && ara.assigned_rooms_summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        ara.ara_code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesProgram = selectedProgramFilter === 'ALL' || ara.program === selectedProgramFilter;
      return matchesSearch && matchesProgram;
    });
  }, [aras, searchQuery, selectedProgramFilter]);

  // Filtered courses for qualification selection in registration
  const filteredCoursesForReg = useMemo(() => {
    if (!courseSearchFilter) return courses;
    return courses.filter((c) => 
      c.course_code.toLowerCase().includes(courseSearchFilter.toLowerCase()) ||
      c.course_name.toLowerCase().includes(courseSearchFilter.toLowerCase()) ||
      (c.program && c.program.toLowerCase().includes(courseSearchFilter.toLowerCase()))
    );
  }, [courses, courseSearchFilter]);

  if (!isOpen) return null;

  const handleToggleRoom = (roomId: string) => {
    setRegSelectedRooms((prev) => 
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const handleToggleCourse = (courseId: string) => {
    setRegSelectedCourses((prev) => 
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleSelectAllFilteredCourses = () => {
    const ids = filteredCoursesForReg.map(c => c.id);
    setRegSelectedCourses(prev => Array.from(new Set([...prev, ...ids])));
  };

  const handleClearSelectedCourses = () => {
    setRegSelectedCourses([]);
  };

  const handleProgramChange = (prog: string) => {
    setRegProgram(prog);
    if (prog === 'CSE') {
      setRegDepartment('Computer Science & Engineering');
    } else if (prog === 'SE') {
      setRegDepartment('Software Engineering');
    } else if (prog === 'PEng') {
      setRegDepartment('Pre-Engineering Program');
    } else if (prog === 'PSci') {
      setRegDepartment('Pre-Science Program');
    } else if (prog === 'CoEEC') {
      setRegDepartment('College of Electrical & Electronic Communications');
    }
  };

  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!regFullName.trim()) {
      setFormError('Full Name is required.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setFormError('A valid University or personal email address is required.');
      return;
    }
    if (!regPhone.trim()) {
      setFormError('Phone number is required for lab accountability contact.');
      return;
    }

    onRegisterSARA({
      full_name: regFullName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      ara_code: regAraCode.trim() || `SARA/2026/${aras.length + 1}`,
      department: regDepartment,
      program: regProgram,
      year_level: Number(regYearLevel),
      gpa_or_standing: regGpa.trim(),
      selected_room_ids: regSelectedRooms,
      selected_course_ids: regSelectedCourses,
      block_responsibility: regBlockResponsibility || undefined,
      max_weekly_hours: Number(regMaxHours) || 12,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#002147] px-6 py-4 border-b border-amber-500/30 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif tracking-tight text-white">
                  ASTU SARA & ARA Authentication Portal
                </h2>
                <span className="bg-amber-500/20 text-amber-300 text-[11px] font-mono font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                  SRS v2.0
                </span>
              </div>
              <p className="text-xs text-slate-300">
                School of Electrical Engineering & Computing • Academic Year 2026/2027 Semester I
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="bg-slate-950 px-6 pt-3 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setMode('login'); setFormError(null); }}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t border-x ${
                mode === 'login'
                  ? 'bg-slate-900 text-amber-400 border-slate-700 border-b-transparent shadow'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In as Registered ARA / Staff ({aras.length})
            </button>

            <button
              onClick={() => { setMode('register'); setFormError(null); }}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t border-x ${
                mode === 'register'
                  ? 'bg-slate-900 text-amber-400 border-slate-700 border-b-transparent shadow'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Register New SARA / ARA
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5 pb-2">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Active ARA:</span>
            <span className="font-semibold text-amber-300">
              {aras.find(a => a.id === currentAraId)?.full_name || 'None'}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-200">
          {mode === 'login' ? (
            /* ================= LOGIN VIEW ================= */
            <div className="space-y-5">
              {/* Quick Administrative Logins Banner */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                      Administrative & Department Roles
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Switch authority level to run allocation engine or execute Department Head overrides.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onChangeRole('ARA_ADMINISTRATOR');
                      onClose();
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      currentRole === 'ARA_ADMINISTRATOR'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                    }`}
                  >
                    ARA Administrator
                  </button>
                  <button
                    onClick={() => {
                      onChangeRole('DEPARTMENT_HEAD');
                      onClose();
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      currentRole === 'DEPARTMENT_HEAD'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                    }`}
                  >
                    Department Head
                  </button>
                </div>
              </div>

              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone number, room (e.g. 510-08)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400">Program:</span>
                  <select
                    value={selectedProgramFilter}
                    onChange={(e) => setSelectedProgramFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs text-amber-300 font-semibold rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
                  >
                    <option value="ALL">All Programs</option>
                    <option value="CSE">CSE (Computer Science)</option>
                    <option value="SE">SE (Software Eng.)</option>
                  </select>
                </div>
              </div>

              {/* ARA User List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {filteredAras.length === 0 ? (
                  <div className="col-span-2 text-center py-10 text-slate-400 text-xs">
                    No ARAs match your search query. Try searching by room number (e.g. 510-08) or name.
                  </div>
                ) : (
                  filteredAras.map((ara) => {
                    const isCurrent = ara.id === currentAraId;
                    return (
                      <div
                        key={ara.id}
                        className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-amber-950/20 border-amber-500/80 ring-1 ring-amber-500/50'
                            : 'bg-slate-800/70 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow">
                                {ara.avatar_initials}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-white text-xs leading-tight">
                                    {ara.full_name}
                                  </h4>
                                  {isCurrent && (
                                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                                      Active User
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {ara.ara_code} • {ara.program} Yr {ara.year_level || 4}
                                </span>
                              </div>
                            </div>

                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              ara.role === 'BLOCK_RESPONSIBLE'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : ara.role === 'ROOM_KEY_HOLDER'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            }`}>
                              {ara.role === 'ROOM_KEY_HOLDER' ? 'Key Holder' : ara.role === 'BLOCK_RESPONSIBLE' ? 'Block Resp.' : 'General ARA'}
                            </span>
                          </div>

                          {/* Contact & Room Details */}
                          <div className="mt-2.5 space-y-1 text-[11px] text-slate-300">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Mail className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">{ara.email}</span>
                            </div>
                            {ara.phone && (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>{ara.phone}</span>
                              </div>
                            )}
                            {ara.assigned_rooms_summary && (
                              <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                                <Key className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>Assigned: {ara.assigned_rooms_summary}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Switch / Select Button */}
                        <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Max {ara.max_weekly_hours}h/wk
                          </span>

                          <button
                            onClick={() => {
                              onSelectAra(ara.id);
                              onChangeRole('ARA_ASSISTANT');
                              onClose();
                            }}
                            className={`text-xs px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                              isCurrent
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                : 'bg-slate-700 text-white hover:bg-amber-500 hover:text-slate-950'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {isCurrent ? 'Continue as this ARA' : 'Log In as this ARA'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* ================= REGISTRATION VIEW ================= */
            <form onSubmit={handleSubmitRegistration} className="space-y-6">
              {formError && (
                <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-lg text-xs text-red-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Step 1: Personal Profile */}
              <div>
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <User className="w-4 h-4" />
                  1. SARA Personal & Academic Profile
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tsion Mengistu"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. tsion.mengistu@astu.edu.et"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0911223344"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      SARA / ARA Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SARA/2026/17"
                      value={regAraCode}
                      onChange={(e) => setRegAraCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Academic Program
                    </label>
                    <select
                      value={regProgram}
                      onChange={(e) => handleProgramChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-400"
                    >
                      <option value="CSE">Computer Science & Engineering (CSE)</option>
                      <option value="SE">Software Engineering (SE)</option>
                      <option value="CoEEC">CoEEC (Electrical & Electronics)</option>
                      <option value="PEng">Pre-Engineering (PEng)</option>
                      <option value="PSci">Pre-Science (PSci)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Year Level & Standing
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={regYearLevel}
                        onChange={(e) => setRegYearLevel(Number(e.target.value))}
                        className="w-full px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-semibold focus:outline-none focus:border-amber-400"
                      >
                        <option value={1}>Year 1</option>
                        <option value={2}>Year 2</option>
                        <option value={3}>Year 3</option>
                        <option value={4}>Year 4</option>
                        <option value={5}>Year 5</option>
                      </select>

                      <input
                        type="text"
                        placeholder="GPA / Standing"
                        value={regGpa}
                        onChange={(e) => setRegGpa(e.target.value)}
                        className="w-full px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Laboratory Key-Holder Responsibility */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="w-4 h-4" />
                      2. Designated Room Key-Holder Assignment (+60 pts Bonus)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Select specific laboratory rooms where this SARA holds key custody (SRS Section 8.1 & 8.3).
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-amber-300 font-semibold">
                    {regSelectedRooms.length} room(s) selected
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                  {rooms.map((room) => {
                    const isSelected = regSelectedRooms.includes(room.id);
                    return (
                      <button
                        type="button"
                        key={room.id}
                        onClick={() => handleToggleRoom(room.id)}
                        className={`p-2 rounded-lg border text-left transition-all flex items-center justify-between text-xs ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500/70 text-amber-200 shadow-sm'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <span className="font-bold block text-[11px]">{room.room_code}</span>
                          <span className="text-[10px] text-slate-400 truncate block">{room.room_name}</span>
                        </div>
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Certified Course Qualifications */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      3. Certified Course Qualifications (SRS Section 5 & 17)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Select courses from the official semester curriculum that this SARA is certified to assist.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFilteredCourses}
                      className="text-[11px] text-amber-300 hover:text-amber-200 underline"
                    >
                      Select All Filtered
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={handleClearSelectedCourses}
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                    >
                      Clear
                    </button>
                    <span className="text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      {regSelectedCourses.length} qualified
                    </span>
                  </div>
                </div>

                {/* Course Search Filter */}
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Filter courses by code (e.g. CSEg1101, CSEg3201) or name..."
                    value={courseSearchFilter}
                    onChange={(e) => setCourseSearchFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                  {filteredCoursesForReg.map((course) => {
                    const isSelected = regSelectedCourses.includes(course.id);
                    return (
                      <button
                        type="button"
                        key={course.id}
                        onClick={() => handleToggleCourse(course.id)}
                        className={`p-2 rounded-lg border text-left transition-all flex items-start justify-between text-xs ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500/70 text-amber-200 shadow-sm'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="pr-1 truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[11px] text-white">{course.course_code}</span>
                            {course.has_lab && (
                              <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1 rounded border border-sky-500/30">
                                Lab ({course.lab_count}h)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">{course.course_name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {course.program} • Year {course.year_level} • {course.credit_hours} cr
                          </span>
                        </div>
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border mt-0.5 ${
                          isSelected ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Workload & Block Designation */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Max Weekly Workload Hours (SRS Section 6 Limit)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={regMaxHours}
                      onChange={(e) => setRegMaxHours(Math.min(12, Math.max(1, Number(e.target.value))))}
                      className="w-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-xs text-slate-400">
                      Standard student assistant cap: 12 hrs/week
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Block Responsibility Designation (Optional)
                  </label>
                  <select
                    value={regBlockResponsibility}
                    onChange={(e) => setRegBlockResponsibility(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="">None (Individual Room / General Pool)</option>
                    {blocks.map((block) => (
                      <option key={block.id} value={block.id}>
                        {block.block_code} — {block.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel and return to Sign In
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-95 text-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  Register SARA & Proceed to Preferences
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer Banner */}
        <div className="bg-[#001733] px-6 py-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>ASTU Academic Allocation Engine v2.0 Online</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            SOEEC Laboratory Management Directive
          </span>
        </div>
      </div>
    </div>
  );
};
