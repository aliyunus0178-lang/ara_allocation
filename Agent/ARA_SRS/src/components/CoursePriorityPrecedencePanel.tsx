import React, { useState } from 'react';
import { Course, CoursePriorityLevel } from '../types/astu';
import { 
  Award, 
  Layers, 
  Users, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Search, 
  Filter,
  ShieldAlert,
  GraduationCap,
  GripVertical,
  ArrowRightLeft,
  RotateCcw,
  Save,
  Check,
  Zap,
  Info
} from 'lucide-react';

interface CoursePriorityPrecedencePanelProps {
  courses: Course[];
  onUpdateCoursePriority?: (courseId: string, updates: Partial<Course>) => void;
  onBatchUpdateCoursePriorities?: (updatedCourses: Course[]) => void;
}

interface PriorityLaneConfig {
  rank: 1 | 2 | 3 | 4 | 5;
  title: string;
  subtitle: string;
  defaultScore: number;
  badgeColor: string;
  borderColor: string;
  laneBg: string;
  accentColor: string;
  priorityLevel: CoursePriorityLevel;
  icon: React.ReactNode;
}

const PRIORITY_LANES: PriorityLaneConfig[] = [
  {
    rank: 1,
    title: 'Level 1: Critical Core (Highest)',
    subtitle: 'Allocated 1st by engine. Prerequisite core labs, dual-ARA rooms & OS',
    defaultScore: 95,
    badgeColor: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    borderColor: 'border-rose-300 dark:border-rose-800/80',
    laneBg: 'bg-rose-50/40 dark:bg-rose-950/20',
    accentColor: 'text-rose-700 dark:text-rose-400',
    priorityLevel: 'CRITICAL_CORE',
    icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
  },
  {
    rank: 2,
    title: 'Level 2: High Enrollment',
    subtitle: 'Allocated 2nd. Massive multi-section freshman C++ & programming labs',
    defaultScore: 80,
    badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    borderColor: 'border-amber-300 dark:border-amber-800/80',
    laneBg: 'bg-amber-50/40 dark:bg-amber-950/20',
    accentColor: 'text-amber-700 dark:text-amber-400',
    priorityLevel: 'HIGH_ENROLLMENT',
    icon: <Users className="w-4 h-4 text-amber-600" />,
  },
  {
    rank: 3,
    title: 'Level 3: Standard Laboratory',
    subtitle: 'Allocated 3rd. Standard upper-division computer science & engineering labs',
    defaultScore: 65,
    badgeColor: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    borderColor: 'border-indigo-300 dark:border-indigo-800/80',
    laneBg: 'bg-indigo-50/40 dark:bg-indigo-950/20',
    accentColor: 'text-indigo-700 dark:text-indigo-400',
    priorityLevel: 'STANDARD',
    icon: <Layers className="w-4 h-4 text-indigo-600" />,
  },
  {
    rank: 4,
    title: 'Level 4: Moderate Practical',
    subtitle: 'Allocated 4th. Hardware toolkits, specialized labs & smaller groups',
    defaultScore: 50,
    badgeColor: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    borderColor: 'border-slate-300 dark:border-slate-700',
    laneBg: 'bg-slate-50/60 dark:bg-slate-900/30',
    accentColor: 'text-slate-700 dark:text-slate-300',
    priorityLevel: 'HARDWARE_INTENSIVE',
    icon: <Sparkles className="w-4 h-4 text-slate-600" />,
  },
  {
    rank: 5,
    title: 'Level 5: Low / Elective (Lowest)',
    subtitle: 'Allocated last. Departmental electives & independent research labs',
    defaultScore: 35,
    badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    borderColor: 'border-emerald-300 dark:border-emerald-800/80',
    laneBg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    accentColor: 'text-emerald-700 dark:text-emerald-400',
    priorityLevel: 'ELECTIVE',
    icon: <GraduationCap className="w-4 h-4 text-emerald-600" />,
  },
];

export const CoursePriorityPrecedencePanel: React.FC<CoursePriorityPrecedencePanelProps> = ({
  courses,
  onUpdateCoursePriority,
  onBatchUpdateCoursePriorities,
}) => {
  const [localCourses, setLocalCourses] = useState<Course[]>(courses);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [draggingCourseId, setDraggingCourseId] = useState<string | null>(null);
  const [dragOverLaneRank, setDragOverLaneRank] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [appliedSuccessNotice, setAppliedSuccessNotice] = useState<boolean>(false);

  // Sync when prop courses changes
  React.useEffect(() => {
    setLocalCourses(courses);
  }, [courses]);

  // Derive rank for each course (1=Highest to 5=Lowest)
  const getCourseRank = (course: Course): 1 | 2 | 3 | 4 | 5 => {
    if (course.priority_rank) return course.priority_rank;
    if (course.priority_level === 'CRITICAL_CORE') return 1;
    if (course.priority_level === 'HIGH_ENROLLMENT') return 2;
    if (course.priority_level === 'STANDARD') return 3;
    if (course.priority_level === 'HARDWARE_INTENSIVE') return 4;
    if (course.priority_level === 'ELECTIVE') return 5;
    return 3;
  };

  // Filtered courses
  const filteredCourses = localCourses.filter((course) => {
    if (selectedDepartment !== 'all' && course.department !== selectedDepartment) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchCode = course.course_code.toLowerCase().includes(q);
      const matchName = course.course_name.toLowerCase().includes(q);
      const matchDept = course.department.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchDept) return false;
    }
    return true;
  });

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, courseId: string) => {
    e.dataTransfer.setData('text/plain', courseId);
    setDraggingCourseId(courseId);
  };

  const handleDragEnd = () => {
    setDraggingCourseId(null);
    setDragOverLaneRank(null);
  };

  // Handle Drag Over lane
  const handleDragOver = (e: React.DragEvent, rank: number) => {
    e.preventDefault();
    if (dragOverLaneRank !== rank) {
      setDragOverLaneRank(rank);
    }
  };

  // Handle Drop on lane
  const handleDrop = (e: React.DragEvent, targetRank: 1 | 2 | 3 | 4 | 5) => {
    e.preventDefault();
    const courseId = e.dataTransfer.getData('text/plain') || draggingCourseId;
    if (!courseId) return;

    moveCourseToRank(courseId, targetRank);
    setDraggingCourseId(null);
    setDragOverLaneRank(null);
  };

  // Move course to a specific rank
  const moveCourseToRank = (courseId: string, rank: 1 | 2 | 3 | 4 | 5) => {
    const lane = PRIORITY_LANES.find((l) => l.rank === rank);
    if (!lane) return;

    setLocalCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            priority_rank: rank,
            priority_level: lane.priorityLevel,
            precedence_score: lane.defaultScore,
            precedence_reason: `Set to ${lane.title} by Department Head drag-and-drop arbiter.`,
          };
        }
        return c;
      })
    );
    setHasUnsavedChanges(true);

    if (onUpdateCoursePriority) {
      onUpdateCoursePriority(courseId, {
        priority_rank: rank,
        priority_level: lane.priorityLevel,
        precedence_score: lane.defaultScore,
        precedence_reason: `Set to ${lane.title} by Department Head drag-and-drop arbiter.`,
      });
    }
  };

  // Toggle Dual ARA Requirement
  const handleToggleDualAra = (courseId: string, currentVal?: number) => {
    const newVal = currentVal === 2 ? 1 : 2;
    setLocalCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, required_ara_per_room: newVal } : c))
    );
    setHasUnsavedChanges(true);

    if (onUpdateCoursePriority) {
      onUpdateCoursePriority(courseId, { required_ara_per_room: newVal });
    }
  };

  // Apply All Changes to Engine
  const handleApplyAllChanges = () => {
    if (onBatchUpdateCoursePriorities) {
      onBatchUpdateCoursePriorities(localCourses);
    } else if (onUpdateCoursePriority) {
      localCourses.forEach((c) => {
        onUpdateCoursePriority(c.id, {
          priority_rank: c.priority_rank,
          priority_level: c.priority_level,
          precedence_score: c.precedence_score,
          required_ara_per_room: c.required_ara_per_room,
          precedence_reason: c.precedence_reason,
        });
      });
    }
    setHasUnsavedChanges(false);
    setAppliedSuccessNotice(true);
    setTimeout(() => setAppliedSuccessNotice(false), 4000);
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    setLocalCourses(courses);
    setHasUnsavedChanges(false);
  };

  const departments = Array.from(new Set(localCourses.map((c) => c.department)));

  return (
    <div className="space-y-6" id="course-precedence-editor">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Department Head Precedence Arbiter (SRS §19)
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Visual Drag & Drop Priority Matrix
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-serif">
              Course Precedence & Multi-Assistant Priority Editor
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Drag-and-drop course cards into priority lanes (Level 1 = High Precedence to Level 5 = Low Precedence). The batch assignment engine evaluates and sorts sessions by precedence order to guarantee high-demand courses secure qualified ARAs first.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <button
              onClick={handleApplyAllChanges}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                hasUnsavedChanges
                  ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {appliedSuccessNotice ? (
                <>
                  <Check className="w-4 h-4" />
                  Precedence Applied!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Apply & Sync Engine Sorting
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Notification Bar */}
        {appliedSuccessNotice && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Course precedence ranking successfully applied to the ASTU Assignment Engine sorting pipeline. Next batch allocation will evaluate Level 1 sessions first!
            </span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search course code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-3">
            <span>{filteredCourses.length} Courses</span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              {filteredCourses.filter((c) => (c.required_ara_per_room || 1) > 1).length} Dual-ARA Labs
            </span>
          </div>
        </div>
      </div>

      {/* 5 Visual Drag & Drop Lanes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
        {PRIORITY_LANES.map((lane) => {
          const laneCourses = filteredCourses.filter((c) => getCourseRank(c) === lane.rank);
          const isDragOver = dragOverLaneRank === lane.rank;

          return (
            <div
              key={lane.rank}
              onDragOver={(e) => handleDragOver(e, lane.rank)}
              onDrop={(e) => handleDrop(e, lane.rank)}
              className={`flex flex-col rounded-xl border transition-all min-h-[460px] ${
                lane.borderColor
              } ${lane.laneBg} ${
                isDragOver ? 'ring-2 ring-indigo-500 scale-[1.01] shadow-md' : 'shadow-xs'
              }`}
            >
              {/* Lane Header */}
              <div className="p-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 rounded-t-xl backdrop-blur-xs">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {lane.icon}
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      Level {lane.rank}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${lane.badgeColor}`}>
                    {lane.defaultScore} pts
                  </span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mt-1">
                  {lane.priorityLevel.replace('_', ' ')}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight line-clamp-2">
                  {lane.subtitle}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                  <span>{laneCourses.length} Courses</span>
                  <span>{laneCourses.reduce((sum, c) => sum + (c.lab_count || 1), 0)} Labs</span>
                </div>
              </div>

              {/* Lane Drop Zone & Course Cards */}
              <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto max-h-[580px]">
                {laneCourses.length === 0 ? (
                  <div
                    className={`h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-3 text-center transition-colors ${
                      isDragOver
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    <ArrowRightLeft className="w-4 h-4 mb-1 opacity-60" />
                    <span className="text-[11px] font-medium">Drop courses here</span>
                    <span className="text-[9px]">Priority Level {lane.rank}</span>
                  </div>
                ) : (
                  laneCourses.map((course) => {
                    const isDualAra = (course.required_ara_per_room || 1) > 1;
                    const isBeingDragged = draggingCourseId === course.id;

                    return (
                      <div
                        key={course.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, course.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white dark:bg-slate-900 border rounded-lg p-3 shadow-2xs hover:shadow-sm transition-all cursor-grab active:cursor-grabbing select-none ${
                          isBeingDragged
                            ? 'opacity-40 scale-95 border-indigo-500 ring-2 ring-indigo-400'
                            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                      >
                        {/* Course Code & Drag Handle */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-1">
                            <GripVertical className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                            <span className="font-mono font-bold text-xs text-indigo-950 dark:text-indigo-300">
                              {course.course_code}
                            </span>
                          </div>

                          {/* Quick Level Switcher Dropdown */}
                          <select
                            value={getCourseRank(course)}
                            onChange={(e) => moveCourseToRank(course.id, Number(e.target.value) as any)}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-slate-700 dark:text-slate-300"
                            title="Quick switch priority level"
                          >
                            <option value={1}>L1 (High)</option>
                            <option value={2}>L2</option>
                            <option value={3}>L3</option>
                            <option value={4}>L4</option>
                            <option value={5}>L5 (Low)</option>
                          </select>
                        </div>

                        {/* Course Name */}
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 line-clamp-2 leading-tight">
                          {course.course_name}
                        </div>

                        {/* Course Metadata */}
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          <span>{course.department}</span>
                          <span>Year {course.year_level || 1} • {course.credit_hours} Cr</span>
                        </div>

                        {/* Dual ARA Toggle Pill */}
                        <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleDualAra(course.id, course.required_ara_per_room);
                            }}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono transition-all flex items-center gap-1 ${
                              isDualAra
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                            title="Click to toggle Dual ARA requirement (2 assistants per lab)"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            {isDualAra ? 'Dual ARA (2)' : 'Single ARA (1)'}
                          </button>

                          <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                            {course.precedence_score || lane.defaultScore} pts
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
