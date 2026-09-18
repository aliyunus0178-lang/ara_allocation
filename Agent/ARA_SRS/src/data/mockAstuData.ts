/**
 * ASTU Mock Data conforming to Standard Academic Brand & SRS v2.0
 * Adama Science and Technology University (ASTU)
 * School of Electrical Engineering & Computing (SOEEC)
 * Integrated with University Semester Courses & Responsible ARAs
 */

import {
  LaboratoryBlock,
  LaboratoryRoom,
  ARAUser,
  ARABlockResponsibility,
  ARARoomResponsibility,
  ARACourseResponsibility,
  ARAQualification,
  Course,
  ScheduledSession,
  AssistantAvailability,
  PreferenceSubmission,
  AssistantAssignment,
  WeightConfiguration,
  SystemConfig,
  AuditLogEntry,
  SystemNotification,
  AssignmentDecisionReason,
  AssignmentOverride
} from '../types/astu';

import {
  UNIVERSITY_BLOCKS,
  UNIVERSITY_ROOMS,
  UNIVERSITY_COURSES,
  UNIVERSITY_ARAS,
  UNIVERSITY_BLOCK_RESPONSIBILITIES,
  UNIVERSITY_ROOM_RESPONSIBILITIES,
  UNIVERSITY_QUALIFICATIONS,
  UNIVERSITY_AVAILABILITIES,
  UNIVERSITY_SCHEDULED_SESSIONS
} from './astuUniversityDataset';

export const INITIAL_SYSTEM_CONFIG: SystemConfig = {
  academic_year: '2026/2027',
  semester: 'Semester I',
  realtime_auto_assign_enabled: true,
  realtime_assignment_mode: 'tentative', // 'tentative' vs 'final' (Section 9.2)
  batch_can_override_tentative: false,
  max_preferences_per_ara: 3,
  require_ara_confirmation: true,
  confirmation_window_hours: 48,
  historical_lookback_semesters: 1, // Section 8.2 (default immediately preceding semester)
  historical_decay_factor: 0.8,
  mandatory_workload_limit_hours: 12, // Section 6 mandatory workload limit
  tie_breaker_priority: ['workload', 'seniority', 'manual'], // Section 8.4
  rollover_default_policy: 'auto_carry', // Section 13
};

// University Domain Entities
export const INITIAL_BLOCKS: LaboratoryBlock[] = UNIVERSITY_BLOCKS;
export const INITIAL_ROOMS: LaboratoryRoom[] = UNIVERSITY_ROOMS;
export const INITIAL_COURSES: Course[] = UNIVERSITY_COURSES;
export const INITIAL_ARAS: ARAUser[] = UNIVERSITY_ARAS;

export const INITIAL_BLOCK_RESPONSIBILITIES: ARABlockResponsibility[] = UNIVERSITY_BLOCK_RESPONSIBILITIES;
export const INITIAL_ROOM_RESPONSIBILITIES: ARARoomResponsibility[] = UNIVERSITY_ROOM_RESPONSIBILITIES;

// Section 5: Course Responsibilities
export const INITIAL_COURSE_RESPONSIBILITIES: ARACourseResponsibility[] = [
  {
    id: 'course-resp-1',
    course_id: 'course-cseg1104', // CSEg 1104
    ara_id: 'ara-001',            // Abebe is also course responsible (SRS Section 20)
    responsibility_type: 'COURSE_RESPONSIBLE',
    academic_year: '2026/2027',
    semester: 'Semester I',
    status: 'Active',
  },
  {
    id: 'course-resp-ali',
    course_id: 'course-cseg3201',
    ara_id: 'ara-ali',
    responsibility_type: 'COURSE_RESPONSIBLE',
    academic_year: '2026/2027',
    semester: 'Semester I',
    status: 'Active',
  },
  {
    id: 'course-resp-bir',
    course_id: 'course-cseg3203',
    ara_id: 'ara-birhanu-d',
    responsibility_type: 'COURSE_RESPONSIBLE',
    academic_year: '2026/2027',
    semester: 'Semester I',
    status: 'Active',
  },
  {
    id: 'course-resp-yoh',
    course_id: 'course-cseg2101',
    ara_id: 'ara-yohanes',
    responsibility_type: 'COURSE_RESPONSIBLE',
    academic_year: '2026/2027',
    semester: 'Semester I',
    status: 'Active',
  },
];

// Section 5 & 17: Qualifications (`ara_qualifications`)
export const INITIAL_QUALIFICATIONS: ARAQualification[] = UNIVERSITY_QUALIFICATIONS;

// Assistant Availability
export const INITIAL_AVAILABILITY: AssistantAvailability[] = UNIVERSITY_AVAILABILITIES;

// Scheduled Sessions (with Benchmark Session in Room 510-05)
export const INITIAL_SESSIONS: ScheduledSession[] = UNIVERSITY_SCHEDULED_SESSIONS;

// Section 8.1: Authoritative Default Weights Table from SRS v2.0
export const INITIAL_WEIGHT_CONFIGURATIONS: WeightConfiguration[] = [
  {
    id: 'w-1',
    factor_key: 'ROOM_KEY_HOLDER',
    factor_name: 'Room key-holder responsibility',
    default_weight: 60,
    current_weight: 60,
    is_enabled: true,
    rationale: 'Direct physical/operational accountability for that specific laboratory room.',
  },
  {
    id: 'w-2',
    factor_key: 'BLOCK_RESPONSIBLE',
    factor_name: 'Room/Block responsibility',
    default_weight: 50,
    current_weight: 50,
    is_enabled: true,
    rationale: 'Broader operational accountability across the laboratory block.',
  },
  {
    id: 'w-3',
    factor_key: 'COURSE_RESPONSIBLE',
    factor_name: 'Course/Laboratory responsibility',
    default_weight: 45,
    current_weight: 45,
    is_enabled: true,
    rationale: 'Institutional designation of subject-matter ownership — ranked above raw personal preference.',
  },
  {
    id: 'w-4',
    factor_key: 'PREFERENCE_1',
    factor_name: 'Preference 1 (Top Rank)',
    default_weight: 40,
    current_weight: 40,
    is_enabled: true,
    rationale: 'First-choice course indicated by the ARA in their submission.',
  },
  {
    id: 'w-5',
    factor_key: 'PREFERENCE_2',
    factor_name: 'Preference 2 (Second Rank)',
    default_weight: 30,
    current_weight: 30,
    is_enabled: true,
    rationale: 'Second-choice course preference.',
  },
  {
    id: 'w-6',
    factor_key: 'PREFERENCE_3',
    factor_name: 'Preference 3 (Third Rank)',
    default_weight: 20,
    current_weight: 20,
    is_enabled: true,
    rationale: 'Third-choice course preference.',
  },
  {
    id: 'w-7',
    factor_key: 'HISTORICAL_ASSIGNMENT',
    factor_name: 'Historical assignment (Previous Semester)',
    default_weight: 10,
    current_weight: 10,
    is_enabled: true,
    rationale: 'Continuity bonus for ARA who successfully supervised this course in the immediate prior semester.',
  },
  {
    id: 'w-8',
    factor_key: 'PREFERRED_DAY',
    factor_name: 'Preferred day match',
    default_weight: 10,
    current_weight: 10,
    is_enabled: true,
    rationale: 'Matches the ARA self-reported optimal teaching day.',
  },
  {
    id: 'w-9',
    factor_key: 'PREFERRED_TIME',
    factor_name: 'Preferred time match',
    default_weight: 10,
    current_weight: 10,
    is_enabled: true,
    rationale: 'Matches the ARA preferred morning vs afternoon teaching window.',
  },
  {
    id: 'w-10',
    factor_key: 'WORKLOAD_BALANCE',
    factor_name: 'Workload balance factor',
    default_weight: 5,
    current_weight: 5,
    is_enabled: true,
    rationale: 'Variable weight favoring under-utilized ARAs when scores tie.',
  },
];

// Section 9.4: Preference submissions
export const INITIAL_PREFERENCE_SUBMISSIONS: PreferenceSubmission[] = [
  {
    id: 'pref-sub-1',
    ara_id: 'ara-001',
    course_id: 'course-cseg1104', // Matches SRS Section 7 & 20: Preference 1
    preference_rank: 1,
    submitted_at: '2026-09-10T09:00:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-ali-1',
    ara_id: 'ara-ali',
    course_id: 'course-cseg1101-peng',
    preference_rank: 1,
    submitted_at: '2026-09-10T10:00:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-ali-2',
    ara_id: 'ara-ali',
    course_id: 'course-cseg3201',
    preference_rank: 2,
    submitted_at: '2026-09-10T10:05:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-yoh-1',
    ara_id: 'ara-yohanes',
    course_id: 'course-cseg2101',
    preference_rank: 1,
    submitted_at: '2026-09-11T08:30:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-hai-1',
    ara_id: 'ara-haimanot',
    course_id: 'course-cseg3303',
    preference_rank: 1,
    submitted_at: '2026-09-11T09:15:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-sha-1',
    ara_id: 'ara-shambel',
    course_id: 'course-cseg4207',
    preference_rank: 1,
    submitted_at: '2026-09-11T11:00:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-bir-1',
    ara_id: 'ara-birhanu-d',
    course_id: 'course-cseg3203',
    preference_rank: 1,
    submitted_at: '2026-09-12T09:00:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-mes-1',
    ara_id: 'ara-mesay',
    course_id: 'course-cseg4201',
    preference_rank: 1,
    submitted_at: '2026-09-12T10:30:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-hac-1',
    ara_id: 'ara-hachalu',
    course_id: 'course-cseg3204',
    preference_rank: 1,
    submitted_at: '2026-09-12T14:20:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-eph-1',
    ara_id: 'ara-ephrem',
    course_id: 'course-cseg4301',
    preference_rank: 1,
    submitted_at: '2026-09-13T08:45:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-fan-1',
    ara_id: 'ara-fanos',
    course_id: 'course-cseg3202',
    preference_rank: 1,
    submitted_at: '2026-09-13T09:10:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-fik-1',
    ara_id: 'ara-fikadu',
    course_id: 'course-cseg4205',
    preference_rank: 1,
    submitted_at: '2026-09-13T11:00:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-brk-1',
    ara_id: 'ara-biruk',
    course_id: 'course-cseg5207',
    preference_rank: 1,
    submitted_at: '2026-09-13T13:30:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-mlk-1',
    ara_id: 'ara-milki',
    course_id: 'course-seng2206',
    preference_rank: 1,
    submitted_at: '2026-09-13T14:15:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-bg-1',
    ara_id: 'ara-bezawit',
    course_id: 'course-seng2206',
    preference_rank: 1,
    submitted_at: '2026-09-14T09:00:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-keb-1',
    ara_id: 'ara-kebede',
    course_id: 'course-cseg4207',
    preference_rank: 1,
    submitted_at: '2026-09-14T10:20:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-reg-1',
    ara_id: 'ara-regesa',
    course_id: 'course-cseg5307',
    preference_rank: 1,
    submitted_at: '2026-09-14T11:45:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
  {
    id: 'pref-bnd-1',
    ara_id: 'ara-berhanu-e',
    course_id: 'course-cseg2101',
    preference_rank: 1,
    submitted_at: '2026-09-14T13:10:00Z',
    status: 'Pending',
    resolved_session_id: null,
    resolution_reason: null,
    resolved_at: null,
  },
];

// Historical assignments (preceding semester 2025/2026 Semester II)
export const HISTORICAL_ASSIGNMENTS = [
  { ara_id: 'ara-001', course_id: 'course-cseg1104', semester: '2025/2026 Semester II' },
  { ara_id: 'ara-ali', course_id: 'course-cseg1101-peng', semester: '2025/2026 Semester II' },
  { ara_id: 'ara-yohanes', course_id: 'course-cseg2101', semester: '2025/2026 Semester II' },
  { ara_id: 'ara-birhanu-d', course_id: 'course-cseg3203', semester: '2025/2026 Semester II' },
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    recipient_ara_id: 'broadcast',
    title: 'ASTU Academic Allocation Window Open',
    message: 'Course preference submission window for Academic Year 2026/2027 Semester I is open until Sept 25. 16 Responsible ARAs & SARAs registered.',
    type: 'assignment',
    timestamp: '2026-09-10T08:00:00Z',
    is_read: true,
  },
  {
    id: 'notif-2',
    recipient_ara_id: 'ara-ali',
    title: 'Key Holder Confirmation',
    message: 'You have been designated as Laboratory Key Holder for Room 510-08 (Advanced Software Engineering Lab).',
    type: 'assignment',
    timestamp: '2026-09-02T10:00:00Z',
    is_read: false,
  },
  {
    id: 'notif-3',
    recipient_ara_id: 'ara-yohanes',
    title: 'Dual Room Key Holder Confirmation',
    message: 'You have been designated as Laboratory Key Holder for Room 508-15 and Room 508-16.',
    type: 'assignment',
    timestamp: '2026-09-02T10:05:00Z',
    is_read: false,
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-001',
    timestamp: '2026-09-01T09:00:00Z',
    actor: 'Dr. Yonas Hailu (ARA Administrator)',
    role: 'ARA_ADMINISTRATOR',
    action: 'SYSTEM_BOOTSTRAP',
    entity_type: 'SystemConfig',
    entity_id: '2026/2027-S1',
    details: 'Initialized academic session with SRS v2.0 authoritative weighted scoring model & 31 university semester courses.',
  },
  {
    id: 'audit-002',
    timestamp: '2026-09-01T10:15:00Z',
    actor: 'Dr. Yonas Hailu (ARA Administrator)',
    role: 'ARA_ADMINISTRATOR',
    action: 'ASSIGN_BLOCK_RESPONSIBILITY',
    entity_type: 'LaboratoryBlock',
    entity_id: 'B-510',
    details: 'Assigned ARA-001 (Abebe Kebede) as Primary Block Responsible for B-510.',
  },
  {
    id: 'audit-003',
    timestamp: '2026-09-01T11:00:00Z',
    actor: 'Dr. Yonas Hailu (ARA Administrator)',
    role: 'ARA_ADMINISTRATOR',
    action: 'ASSIGN_KEY_HOLDER',
    entity_type: 'LaboratoryRoom',
    entity_id: 'Room 510-08',
    details: 'Designated Ali Kibret Muhamed as Room Key Holder for Room 510-08.',
  },
];

export const INITIAL_ASSIGNMENTS: AssistantAssignment[] = [
  {
    id: 'asgn-cseg1104-sec1-grp1-slot1',
    session_id: 'session-cseg1104-sec1-grp1',
    slot_number: 1,
    ara_id: 'ara-001',
    status: 'Confirmed',
    source: 'batch_engine',
    assigned_at: '2026-09-15T14:30:00Z',
    acceptance_deadline: null,
  },
];

export const INITIAL_DECISION_REASONS: AssignmentDecisionReason[] = [
  {
    id: 'dec-asgn-cseg1104-sec1-grp1-slot1',
    assignment_id: 'asgn-cseg1104-sec1-grp1-slot1',
    session_id: 'session-cseg1104-sec1-grp1',
    ara_id: 'ara-001',
    total_score: 90,
    is_selected: true,
    score_breakdown: [
      { factor: 'Room/Block responsibility', points: 50, description: 'Designated Block Responsible for B-510' },
      { factor: 'Preference 1', points: 40, description: 'First priority course preference' },
    ],
    reasons: [
      'Responsible for laboratory block B-510 (+50 pts)',
      'Selected CSEg 1104 as Preference 1 (+40 pts)',
      'Qualified for CSEg 1104 (Certified on 2023-09-15)',
      'Available during scheduled period (Monday 10:00-12:00)',
      'No timetable conflict',
      'Workload within limit (2h assigned / max 12h)',
    ],
    hard_constraints_passed: true,
    block_responsibility: true,
    room_key_holder: false,
    course_responsibility: false,
    preference_match: 'Preference 1',
    qualified: true,
    available: true,
    timetable_conflict: false,
    workload_valid: true,
    tie_breaker_applied: null,
    timestamp: '2026-09-15T14:30:00Z',
  },
];

export const INITIAL_OVERRIDES: AssignmentOverride[] = [
  {
    id: 'ovr-demo-1',
    session_id: 'sess-cseg1101-s01',
    overriding_user_id: 'dept-head-1',
    overriding_user_name: 'Dr. Tesfaye (Dept Head)',
    overriding_role: 'DEPARTMENT_HEAD',
    original_candidate_ara_id: 'ara-yohanes',
    assigned_ara_id: 'ara-ali',
    reason: 'Department Head confirmation of Room 510-08 primary key-holder priority assignment for PEng computing laboratory.',
    created_at: '2026-09-14T11:20:00Z',
  },
];

export const INITIAL_ASTU_DATA = {
  blocks: INITIAL_BLOCKS,
  rooms: INITIAL_ROOMS,
  aras: INITIAL_ARAS,
  courses: INITIAL_COURSES,
  sessions: INITIAL_SESSIONS,
  block_responsibilities: INITIAL_BLOCK_RESPONSIBILITIES,
  room_responsibilities: INITIAL_ROOM_RESPONSIBILITIES,
  course_responsibilities: INITIAL_COURSE_RESPONSIBILITIES,
  qualifications: INITIAL_QUALIFICATIONS,
  availabilities: INITIAL_AVAILABILITY,
  preferences: INITIAL_PREFERENCE_SUBMISSIONS,
  weights: INITIAL_WEIGHT_CONFIGURATIONS,
  config: INITIAL_SYSTEM_CONFIG,
  assignments: INITIAL_ASSIGNMENTS,
  decision_reasons: INITIAL_DECISION_REASONS,
  notifications: INITIAL_NOTIFICATIONS,
  overrides: INITIAL_OVERRIDES,
  audit_logs: INITIAL_AUDIT_LOGS,
};
