/**
 * ASTU Laboratory Allocation System - Core Types
 * Implements SRS v2.0 (Sections 1 to 20)
 * Adama Science and Technology University (ASTU)
 */

export type ResponsibilityType = 
  | 'BLOCK_RESPONSIBLE'
  | 'ROOM_KEY_HOLDER'
  | 'COURSE_RESPONSIBLE'
  | 'GENERAL_ARA';

export type ARAStatus = 
  | 'Active' 
  | 'Inactive' 
  | 'Suspended' 
  | 'On Leave' 
  | 'Pending Approval' 
  | 'Expired';

export type PreferenceSubmissionStatus = 
  | 'Pending' 
  | 'Auto-Assigned (Tentative)' 
  | 'Auto-Assigned (Final)' 
  | 'Rejected' 
  | 'Withdrawn';

export type SessionAssignmentStatus = 
  | 'Unassigned' 
  | 'Tentatively Assigned' 
  | 'Confirmed' 
  | 'ARA Assignment Required';

export type UserRole = 
  | 'ARA_ADMINISTRATOR' 
  | 'DEPARTMENT_HEAD' 
  | 'ARA_ASSISTANT';

export interface LaboratoryBlock {
  id: string;
  block_code: string; // e.g. 'B-510'
  building: string;   // e.g. 'School of Electrical Engineering & Computing'
  name: string;       // e.g. 'Computing & Software Engineering Laboratories'
  description: string;
  status: 'Active' | 'Maintenance' | 'Inactive';
  total_rooms: number;
}

export interface LaboratoryRoom {
  id: string;
  block_id: string;
  room_code: string;  // e.g. 'B-510-R05'
  room_name: string;  // e.g. 'Systems & Architecture Lab'
  capacity: number;
  lab_type: 'Software' | 'Hardware/Embedded' | 'Networking' | 'General Purpose' | 'AI & Robotics';
  key_status: 'Available' | 'Checked Out' | 'Restricted';
  status: 'Active' | 'Maintenance';
}

export interface ARAUser {
  id: string;
  ara_code: string;   // e.g. 'ARA-001' or 'SARA-001'
  full_name: string;
  email: string;
  phone?: string;
  department: string;
  program?: string;   // e.g. 'PEng', 'PSci', 'CSE', 'SE', 'CoEEC'
  year_level?: number; // 1 to 5 or Graduate
  role: ResponsibilityType;
  status: ARAStatus;
  max_weekly_hours: number;     // Configurable workload limit (e.g. 12 or 16 hrs)
  current_weekly_hours: number; // Calculated assigned hours
  created_at: string;           // Seniority tie-breaker (Section 8.4)
  avatar_initials: string;
  gpa_or_standing?: string;
  assigned_rooms_summary?: string; // e.g. "Room 510-08" or "Room 508-15, Room 508-16"
  is_sara?: boolean;            // Student Academic Resource Assistant
}

export interface ARABlockResponsibility {
  id: string;
  block_id: string;
  ara_id: string;
  responsibility_type: 'BLOCK_RESPONSIBLE';
  is_primary: boolean;
  is_mandatory: boolean; // Section 14 override behavior
  start_date: string;
  end_date: string;
  academic_year: string; // e.g. '2026/2027'
  semester: 'Semester I' | 'Semester II';
  status: ARAStatus;
}

export interface ARARoomResponsibility {
  id: string;
  room_id: string;
  ara_id: string;
  responsibility_type: 'ROOM_KEY_HOLDER';
  is_primary: boolean;
  is_mandatory: boolean; // Section 14
  start_date: string;
  end_date: string;
  academic_year: string;
  semester: 'Semester I' | 'Semester II';
  status: ARAStatus;
}

export interface ARACourseResponsibility {
  id: string;
  course_id: string;
  ara_id: string;
  responsibility_type: 'COURSE_RESPONSIBLE';
  academic_year: string;
  semester: 'Semester I' | 'Semester II';
  status: ARAStatus;
}

export interface ARAQualification {
  id: string;
  ara_id: string;
  course_id: string;
  qualified_date: string;
  expiry_date?: string | null;
  status: 'Valid' | 'Expired' | 'Revoked' | 'Pending Verification';
  certified_by: string;
}

export type CoursePriorityLevel = 
  | 'CRITICAL_CORE'
  | 'HIGH_ENROLLMENT'
  | 'HARDWARE_INTENSIVE'
  | 'STANDARD'
  | 'ELECTIVE';

export interface Course {
  id: string;
  course_code: string; // e.g. 'CSEg1101'
  course_name: string; // e.g. 'Introduction to Computing'
  department: string;
  program?: string;    // e.g. 'PEng', 'PSci', 'CoEEC', 'CSE', 'SE'
  year_level?: number; // 1, 2, 3, 4, 5
  credit_hours: number;
  lab_session_duration_hours: number; // e.g. 2 or 3
  level: 'Undergraduate' | 'Postgraduate';
  syllabus_topic: string;
  activity_type?: string[]; // e.g. ['lecture', 'laboratory'] or ['lecture']
  sections_list?: string[];
  lecture_count?: number;
  lab_count?: number;
  has_lab?: boolean;
  priority_level?: CoursePriorityLevel;
  priority_rank?: 1 | 2 | 3 | 4 | 5; // 1 = Highest (Critical), 5 = Lowest (Elective)
  precedence_score?: number; // 1 to 100 (higher = prioritized in allocation)
  required_ara_per_room?: number; // 1 or 2
  precedence_reason?: string;
  special_assistance_required?: boolean;
}

export interface DownloadReportRecord {
  id: string;
  report_title: string;
  academic_term: string;
  generated_at: string;
  generated_by_name: string;
  generated_by_role: string;
  scope_description: string;
  total_sessions: number;
  total_rooms: number;
  total_aras: number;
  file_format: 'PDF' | 'CSV';
  file_size: string;
  download_count: number;
  status: 'Official & Sealed' | 'Draft Matrix' | 'Pre-Approval';
}

export interface ConflictAlertEvent {
  id: string;
  timestamp: string;
  ara_id: string;
  ara_name: string;
  ara_code: string;
  target_session_id: string;
  target_course_code: string;
  target_room_code: string;
  target_time: string;
  conflicting_session_id: string;
  conflicting_course_code: string;
  conflicting_room_code: string;
  conflicting_time: string;
  day_of_week: string;
  override_reason?: string;
  severity: 'CRITICAL_COLLISION' | 'WORKLOAD_CAP_EXCEEDED' | 'ROOM_LOCKOUT';
}

export interface ScheduledSession {
  id: string;
  course_id: string;
  room_id: string;
  section: string;      // e.g. 'Section 1'
  group: string;        // e.g. 'Group 1'
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  start_time: string;   // e.g. '10:00'
  end_time: string;     // e.g. '12:00'
  duration_hours: number; // e.g. 2.0
  required_ara_count: number; // Section 12 Multi-ARA support (e.g. 1 or 2)
  academic_year: string;
  semester: 'Semester I' | 'Semester II';
  status: SessionAssignmentStatus;
  notes?: string;
}

export interface AssistantAvailability {
  id: string;
  ara_id: string;
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export type ARAAvailability = AssistantAvailability;

export interface AssistantPreference {
  id: string;
  ara_id: string;
  course_id: string;
  preference_rank: 1 | 2 | 3;
  preferred_day?: string;
  preferred_time?: string;
  submitted_at: string;
}

export interface PreferenceSubmission {
  id: string;
  ara_id: string;
  course_id: string;
  preference_rank: 1 | 2 | 3;
  submitted_at: string;
  status: PreferenceSubmissionStatus;
  resolved_session_id?: string | null;
  resolution_reason?: string | null;
  resolved_at?: string | null;
}

export interface AssistantAssignment {
  id: string;
  session_id: string;
  slot_number: number; // 1, 2, etc. (Multi-ARA Section 12)
  ara_id: string;
  status: 'Tentative' | 'Confirmed' | 'Declined';
  source: 'batch_engine' | 'realtime_submission' | 'authorized_override' | 'manual_admin' | 'batch_510_force_alloc';
  assigned_at: string;
  confirmed_at?: string | null;
  acceptance_deadline?: string | null;
}

export interface ScoreItemBreakdown {
  factor: string;
  points: number;
  description: string;
}

export interface AssignmentDecisionReason {
  id: string;
  assignment_id: string;
  session_id: string;
  ara_id: string;
  total_score: number;
  is_selected: boolean;
  score_breakdown: ScoreItemBreakdown[];
  reasons: string[];
  hard_constraints_passed: boolean;
  hard_constraint_violations?: string[];
  block_responsibility: boolean;
  room_key_holder: boolean;
  course_responsibility: boolean;
  preference_match: string; // 'Preference 1' | 'Preference 2' | 'Preference 3' | 'None'
  qualified: boolean;
  available: boolean;
  timetable_conflict: boolean;
  workload_valid: boolean;
  tie_breaker_applied?: string | null;
  timestamp: string;
}

export interface AssignmentOverride {
  id: string;
  session_id: string;
  overriding_user_id: string;
  overriding_user_name: string;
  overriding_role: string;
  original_candidate_ara_id: string;
  assigned_ara_id: string;
  reason: string; // Free text, required (Section 14.3)
  created_at: string;
}

export interface WeightConfiguration {
  id: string;
  factor_key: string;
  factor_name: string;
  default_weight: number;
  current_weight: number;
  is_enabled: boolean;
  rationale: string;
}

export interface SystemNotification {
  id: string;
  recipient_ara_id: string;
  title: string;
  message: string;
  type: 'assignment' | 'pending_queue' | 'confirmation_request' | 'override' | 'rollover';
  timestamp: string;
  is_read: boolean;
  session_id?: string;
  requires_action?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
}

export interface SystemConfig {
  academic_year: string;
  semester: 'Semester I' | 'Semester II';
  realtime_auto_assign_enabled: boolean;
  realtime_assignment_mode: 'tentative' | 'final';
  batch_can_override_tentative: boolean;
  max_preferences_per_ara: number;
  require_ara_confirmation: boolean;
  confirmation_window_hours: number;
  historical_lookback_semesters: number;
  historical_decay_factor: number; // e.g. 0.8 per semester
  mandatory_workload_limit_hours: number;
  tie_breaker_priority: ('workload' | 'seniority' | 'manual')[];
  rollover_default_policy: 'auto_carry' | 'manual_reassign';
}
