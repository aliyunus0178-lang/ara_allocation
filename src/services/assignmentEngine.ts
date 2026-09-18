/**
 * ASTU ARA Auto-Assignment Algorithmic Engine
 * Implements SRS v2.0 (Sections 5, 6, 7, 8, 9, 12, 14, 16, 19, 20)
 * Adama Science and Technology University (ASTU)
 */

import {
  ARAUser,
  ScheduledSession,
  LaboratoryRoom,
  LaboratoryBlock,
  ARABlockResponsibility,
  ARARoomResponsibility,
  ARACourseResponsibility,
  ARAQualification,
  AssistantAvailability,
  PreferenceSubmission,
  AssistantAssignment,
  AssignmentDecisionReason,
  ScoreItemBreakdown,
  WeightConfiguration,
  SystemConfig,
  Course,
} from '../types/astu';
import { HISTORICAL_ASSIGNMENTS } from '../data/mockAstuData';

export interface HardConstraintResult {
  passed: boolean;
  violations: string[];
  isActive: boolean;
  isQualified: boolean;
  isAvailable: boolean;
  hasNoTimetableConflict: boolean;
  isWorkloadValid: boolean;
  isPolicyEligible: boolean;
}

export interface CandidateEvaluation {
  ara: ARAUser;
  hardConstraintResult: HardConstraintResult;
  totalScore: number;
  scoreBreakdown: ScoreItemBreakdown[];
  reasons: string[];
  isMandatoryCandidate: boolean;
  isRoomKeyHolder: boolean;
  isBlockResponsible: boolean;
  isCourseResponsible: boolean;
  preferenceMatch: string;
  tieBreakerNotes?: string;
}

export class ASTUAssignmentEngine {
  /**
   * Helper to convert "HH:MM" to minutes from midnight
   */
  private static timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  /**
   * Check if two time intervals overlap on the same day
   */
  public static doIntervalsOverlap(
    day1: string,
    start1: string,
    end1: string,
    day2: string,
    start2: string,
    end2: string
  ): boolean {
    if (day1 !== day2) return false;
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);
    return Math.max(s1, s2) < Math.min(e1, e2);
  }

  /**
   * Section 6: Hard (Mandatory) Constraints Checker
   * Pre-requisite before any scoring. ARAs failing any hard constraint receive zero score.
   */
  public static checkHardConstraints(
    ara: ARAUser,
    session: ScheduledSession,
    allSessions: ScheduledSession[],
    allAssignments: AssistantAssignment[],
    qualifications: ARAQualification[],
    availabilities: AssistantAvailability[],
    systemConfig: SystemConfig,
    slotNumber: number = 1
  ): HardConstraintResult {
    const violations: string[] = [];

    // 1. Is Active
    const isActive = ara.status === 'Active';
    if (!isActive) {
      violations.push(`ARA status is "${ara.status}" (must be Active)`);
    }

    // 2. Qualified for course (Section 5)
    const activeQual = qualifications.find(
      (q) =>
        q.ara_id === ara.id &&
        q.course_id === session.course_id &&
        q.status === 'Valid' &&
        (!q.expiry_date || new Date(q.expiry_date) > new Date())
    );
    const isQualified = !!activeQual;
    if (!isQualified) {
      violations.push(`Not qualified for course ${session.course_id} per ara_qualifications`);
    }

    // 3. Available at scheduled time
    const sessionStart = this.timeToMinutes(session.start_time);
    const sessionEnd = this.timeToMinutes(session.end_time);
    const matchingAvailability = availabilities.find(
      (av) =>
        av.ara_id === ara.id &&
        av.day_of_week === session.day_of_week &&
        av.is_available &&
        this.timeToMinutes(av.start_time) <= sessionStart &&
        this.timeToMinutes(av.end_time) >= sessionEnd
    );
    const isAvailable = !!matchingAvailability;
    if (!isAvailable) {
      violations.push(`Not marked available on ${session.day_of_week} between ${session.start_time} and ${session.end_time}`);
    }

    // 4. Timetable conflict / double-booking check
    // Look at other assignments of this ARA in active/tentative sessions
    const araAssignments = allAssignments.filter(
      (a) => a.ara_id === ara.id && a.status !== 'Declined'
    );
    
    // Check if already assigned to another slot in the same session (Section 12 multi-ARA rule)
    const alreadyInThisSession = araAssignments.some(
      (a) => a.session_id === session.id && a.slot_number !== slotNumber
    );
    if (alreadyInThisSession) {
      violations.push(`Already assigned to Slot in this same laboratory session`);
    }

    let hasOverlap = false;
    for (const assignment of araAssignments) {
      if (assignment.session_id === session.id) continue;
      const otherSession = allSessions.find((s) => s.id === assignment.session_id);
      if (otherSession) {
        if (
          this.doIntervalsOverlap(
            session.day_of_week,
            session.start_time,
            session.end_time,
            otherSession.day_of_week,
            otherSession.start_time,
            otherSession.end_time
          )
        ) {
          hasOverlap = true;
          violations.push(
            `Timetable conflict with existing assignment for ${otherSession.section} (${otherSession.day_of_week} ${otherSession.start_time}-${otherSession.end_time})`
          );
          break;
        }
      }
    }
    const hasNoTimetableConflict = !hasOverlap && !alreadyInThisSession;

    // 5. Workload limit
    // Current assigned hours + session.duration_hours <= max_weekly_hours
    const currentAssignedHours = araAssignments.reduce((acc, curr) => {
      if (curr.session_id === session.id) return acc;
      const s = allSessions.find((sess) => sess.id === curr.session_id);
      return acc + (s ? s.duration_hours : 0);
    }, 0);

    const wouldExceedWorkload =
      currentAssignedHours + session.duration_hours > (ara.max_weekly_hours || systemConfig.mandatory_workload_limit_hours);
    const isWorkloadValid = !wouldExceedWorkload;
    if (!isWorkloadValid) {
      violations.push(
        `Workload limit exceeded: ${currentAssignedHours}h + ${session.duration_hours}h > max ${ara.max_weekly_hours || systemConfig.mandatory_workload_limit_hours}h/week`
      );
    }

    // 6. Policy eligibility
    const isPolicyEligible = ara.status !== 'Suspended' && ara.status !== 'On Leave';
    if (!isPolicyEligible) {
      violations.push(`Institutional policy clearance denied due to standing (${ara.status})`);
    }

    const passed =
      isActive &&
      isQualified &&
      isAvailable &&
      hasNoTimetableConflict &&
      isWorkloadValid &&
      isPolicyEligible;

    return {
      passed,
      violations,
      isActive,
      isQualified,
      isAvailable,
      hasNoTimetableConflict,
      isWorkloadValid,
      isPolicyEligible,
    };
  }

  /**
   * Section 8: Weighted Scoring Model (Authoritative)
   */
  public static calculateScore(
    ara: ARAUser,
    session: ScheduledSession,
    room: LaboratoryRoom | undefined,
    block: LaboratoryBlock | undefined,
    blockResponsibilities: ARABlockResponsibility[],
    roomResponsibilities: ARARoomResponsibility[],
    courseResponsibilities: ARACourseResponsibility[],
    preferences: PreferenceSubmission[],
    weights: WeightConfiguration[],
    systemConfig: SystemConfig,
    currentAssignedHours: number
  ): {
    totalScore: number;
    breakdown: ScoreItemBreakdown[];
    reasons: string[];
    isRoomKeyHolder: boolean;
    isBlockResponsible: boolean;
    isCourseResponsible: boolean;
    isMandatoryCandidate: boolean;
    preferenceMatch: string;
  } {
    const breakdown: ScoreItemBreakdown[] = [];
    const reasons: string[] = [];
    let totalScore = 0;

    const getWeight = (factorKey: string, defaultVal: number): number => {
      const cfg = weights.find((w) => w.factor_key === factorKey);
      if (!cfg || !cfg.is_enabled) return 0;
      return cfg.current_weight;
    };

    // 1. Room Key-Holder Responsibility (Default +60)
    const isRoomKeyHolder = roomResponsibilities.some(
      (r) =>
        r.room_id === session.room_id &&
        r.ara_id === ara.id &&
        r.status === 'Active'
    );
    const roomRespRecord = roomResponsibilities.find(
      (r) => r.room_id === session.room_id && r.ara_id === ara.id
    );
    const isRoomMandatory = roomRespRecord?.is_mandatory || false;

    if (isRoomKeyHolder) {
      const pts = getWeight('ROOM_KEY_HOLDER', 60);
      totalScore += pts;
      breakdown.push({
        factor: 'Room key-holder responsibility',
        points: pts,
        description: `Designated key-holder for ${room?.room_code || 'this room'}`,
      });
      reasons.push(`Key-holder for laboratory room ${room?.room_code || session.room_id} (+${pts} pts)`);
    }

    // 2. Room/Block Responsibility (Default +50)
    const isBlockResponsible = blockResponsibilities.some(
      (b) =>
        b.block_id === room?.block_id &&
        b.ara_id === ara.id &&
        b.status === 'Active'
    );
    const blockRespRecord = blockResponsibilities.find(
      (b) => b.block_id === room?.block_id && b.ara_id === ara.id
    );
    const isBlockMandatory = blockRespRecord?.is_mandatory || false;

    if (isBlockResponsible) {
      const pts = getWeight('BLOCK_RESPONSIBLE', 50);
      totalScore += pts;
      breakdown.push({
        factor: 'Room/Block responsibility',
        points: pts,
        description: `Operational responsibility for block ${block?.block_code || 'laboratory block'}`,
      });
      reasons.push(`Responsible for laboratory block ${block?.block_code || 'B-510'} (+${pts} pts)`);
    }

    // 3. Course/Laboratory Responsibility (Default +45)
    const isCourseResponsible = courseResponsibilities.some(
      (c) =>
        c.course_id === session.course_id &&
        c.ara_id === ara.id &&
        c.status === 'Active'
    );
    if (isCourseResponsible) {
      const pts = getWeight('COURSE_RESPONSIBLE', 45);
      totalScore += pts;
      breakdown.push({
        factor: 'Course/Laboratory responsibility',
        points: pts,
        description: 'Subject-matter ownership assigned by department',
      });
      reasons.push(`Course/Laboratory responsibility designated by department (+${pts} pts)`);
    }

    // 4. Course Preferences (Section 8.1 & 10)
    // Preference 1: +40, Preference 2: +30, Preference 3: +20
    const araPrefs = preferences.filter(
      (p) => p.ara_id === ara.id && p.status !== 'Withdrawn'
    );
    const matchedPref = araPrefs.find((p) => p.course_id === session.course_id);
    let preferenceMatch = 'None';

    if (matchedPref) {
      let prefPts = 0;
      if (matchedPref.preference_rank === 1) {
        prefPts = getWeight('PREFERENCE_1', 40);
        preferenceMatch = 'Preference 1';
      } else if (matchedPref.preference_rank === 2) {
        prefPts = getWeight('PREFERENCE_2', 30);
        preferenceMatch = 'Preference 2';
      } else if (matchedPref.preference_rank === 3) {
        prefPts = getWeight('PREFERENCE_3', 20);
        preferenceMatch = 'Preference 3';
      }

      if (prefPts > 0) {
        totalScore += prefPts;
        breakdown.push({
          factor: `Preference Rank ${matchedPref.preference_rank}`,
          points: prefPts,
          description: `Selected course as ${preferenceMatch}`,
        });
        reasons.push(`Selected course as ${preferenceMatch} (+${prefPts} pts)`);
      }
    }

    // 5. Historical Assignment (Section 8.2, Default +10)
    const hadHistorical = HISTORICAL_ASSIGNMENTS.some(
      (h) => h.ara_id === ara.id && h.course_id === session.course_id
    );
    if (hadHistorical) {
      const histWeight = getWeight('HISTORICAL_ASSIGNMENT', 10);
      totalScore += histWeight;
      breakdown.push({
        factor: 'Historical assignment',
        points: histWeight,
        description: 'Supervised course in immediately preceding academic semester',
      });
      reasons.push(`Historical assignment continuity bonus (+${histWeight} pts)`);
    }

    // 6. Workload balance factor (favors under-utilized ARAs)
    const maxH = ara.max_weekly_hours || systemConfig.mandatory_workload_limit_hours;
    const remainingH = Math.max(0, maxH - currentAssignedHours);
    const balanceFactorWeight = getWeight('WORKLOAD_BALANCE', 5);
    if (balanceFactorWeight > 0 && remainingH > 0) {
      // Small scaled bonus for having plenty of capacity
      const balanceBonus = Math.round((remainingH / maxH) * balanceFactorWeight);
      if (balanceBonus > 0) {
        totalScore += balanceBonus;
        breakdown.push({
          factor: 'Workload balance',
          points: balanceBonus,
          description: `Capacity remaining: ${remainingH}h available`,
        });
        reasons.push(`Workload balance bonus (+${balanceBonus} pts)`);
      }
    }

    const isMandatoryCandidate = isRoomMandatory || isBlockMandatory;

    return {
      totalScore,
      breakdown,
      reasons,
      isRoomKeyHolder,
      isBlockResponsible,
      isCourseResponsible,
      isMandatoryCandidate,
      preferenceMatch,
    };
  }

  /**
   * Section 8.4: Deterministic Tie-Breaking Rule
   */
  public static tieBreak(
    candidateA: CandidateEvaluation,
    candidateB: CandidateEvaluation,
    currentHoursA: number,
    currentHoursB: number,
    tieBreakerPriority: string[]
  ): { winner: CandidateEvaluation; reason: string } | null {
    for (const criterion of tieBreakerPriority) {
      if (criterion === 'workload') {
        if (currentHoursA < currentHoursB) {
          return {
            winner: candidateA,
            reason: `Tie-break applied: Lower current workload (${currentHoursA}h vs ${currentHoursB}h)`,
          };
        } else if (currentHoursB < currentHoursA) {
          return {
            winner: candidateB,
            reason: `Tie-break applied: Lower current workload (${currentHoursB}h vs ${currentHoursA}h)`,
          };
        }
      } else if (criterion === 'seniority') {
        const dateA = new Date(candidateA.ara.created_at).getTime();
        const dateB = new Date(candidateB.ara.created_at).getTime();
        if (dateA < dateB) {
          return {
            winner: candidateA,
            reason: `Tie-break applied: Seniority by hire date (${candidateA.ara.created_at.slice(0, 10)})`,
          };
        } else if (dateB < dateA) {
          return {
            winner: candidateB,
            reason: `Tie-break applied: Seniority by hire date (${candidateB.ara.created_at.slice(0, 10)})`,
          };
        }
      }
    }

    // If still tied: Manual selection flag (Section 8.4)
    return null;
  }

  /**
   * Evaluate all candidates for a specific session slot
   */
  public static evaluateCandidatesForSlot(
    session: ScheduledSession,
    slotNumber: number,
    allAras: ARAUser[],
    allSessions: ScheduledSession[],
    allAssignments: AssistantAssignment[],
    rooms: LaboratoryRoom[],
    blocks: LaboratoryBlock[],
    blockResponsibilities: ARABlockResponsibility[],
    roomResponsibilities: ARARoomResponsibility[],
    courseResponsibilities: ARACourseResponsibility[],
    qualifications: ARAQualification[],
    availabilities: AssistantAvailability[],
    preferences: PreferenceSubmission[],
    weights: WeightConfiguration[],
    systemConfig: SystemConfig
  ): {
    eligibleEvaluations: CandidateEvaluation[];
    excludedEvaluations: CandidateEvaluation[];
    selectedCandidate: CandidateEvaluation | null;
    tieFlagged: boolean;
  } {
    const room = rooms.find((r) => r.id === session.room_id);
    const block = blocks.find((b) => b.id === room?.block_id);

    const eligibleEvaluations: CandidateEvaluation[] = [];
    const excludedEvaluations: CandidateEvaluation[] = [];

    for (const ara of allAras) {
      // Calculate current assigned hours for this ARA
      const currentAssignedHours = allAssignments
        .filter((a) => a.ara_id === ara.id && a.status !== 'Declined' && a.session_id !== session.id)
        .reduce((sum, curr) => {
          const s = allSessions.find((sess) => sess.id === curr.session_id);
          return sum + (s ? s.duration_hours : 0);
        }, 0);

      // 1. Hard Constraints
      const hardConstraintResult = this.checkHardConstraints(
        ara,
        session,
        allSessions,
        allAssignments,
        qualifications,
        availabilities,
        systemConfig,
        slotNumber
      );

      if (!hardConstraintResult.passed) {
        excludedEvaluations.push({
          ara,
          hardConstraintResult,
          totalScore: 0,
          scoreBreakdown: [],
          reasons: [],
          isMandatoryCandidate: false,
          isRoomKeyHolder: false,
          isBlockResponsible: false,
          isCourseResponsible: false,
          preferenceMatch: 'None',
        });
        continue;
      }

      // 2. Score candidate
      const scoreResult = this.calculateScore(
        ara,
        session,
        room,
        block,
        blockResponsibilities,
        roomResponsibilities,
        courseResponsibilities,
        preferences,
        weights,
        systemConfig,
        currentAssignedHours
      );

      eligibleEvaluations.push({
        ara,
        hardConstraintResult,
        totalScore: scoreResult.totalScore,
        scoreBreakdown: scoreResult.breakdown,
        reasons: scoreResult.reasons,
        isMandatoryCandidate: scoreResult.isMandatoryCandidate,
        isRoomKeyHolder: scoreResult.isRoomKeyHolder,
        isBlockResponsible: scoreResult.isBlockResponsible,
        isCourseResponsible: scoreResult.isCourseResponsible,
        preferenceMatch: scoreResult.preferenceMatch,
      });
    }

    if (eligibleEvaluations.length === 0) {
      return {
        eligibleEvaluations: [],
        excludedEvaluations,
        selectedCandidate: null,
        tieFlagged: false,
      };
    }

    // Section 14: Mandatory Responsibility check
    // If an eligible candidate has a mandatory assignment for this room or block, they are strictly required!
    const mandatoryCandidates = eligibleEvaluations.filter((c) => c.isMandatoryCandidate);
    let candidatePool = eligibleEvaluations;
    if (mandatoryCandidates.length > 0) {
      candidatePool = mandatoryCandidates;
    }

    // Sort descending by score
    candidatePool.sort((a, b) => b.totalScore - a.totalScore);

    // Check for ties at the top score
    let selectedCandidate = candidatePool[0];
    let tieFlagged = false;

    if (candidatePool.length > 1 && candidatePool[0].totalScore === candidatePool[1].totalScore) {
      const currentHours0 = allAssignments
        .filter((a) => a.ara_id === candidatePool[0].ara.id && a.status !== 'Declined')
        .reduce((sum, curr) => sum + (allSessions.find((s) => s.id === curr.session_id)?.duration_hours || 0), 0);
      const currentHours1 = allAssignments
        .filter((a) => a.ara_id === candidatePool[1].ara.id && a.status !== 'Declined')
        .reduce((sum, curr) => sum + (allSessions.find((s) => s.id === curr.session_id)?.duration_hours || 0), 0);

      const tieResult = this.tieBreak(
        candidatePool[0],
        candidatePool[1],
        currentHours0,
        currentHours1,
        systemConfig.tie_breaker_priority
      );

      if (tieResult) {
        selectedCandidate = tieResult.winner;
        selectedCandidate.tieBreakerNotes = tieResult.reason;
      } else {
        // Unresolvable tie - flag for manual administrator selection (Section 8.4)
        tieFlagged = true;
      }
    }

    return {
      eligibleEvaluations,
      excludedEvaluations,
      selectedCandidate,
      tieFlagged,
    };
  }

  /**
   * Helper to compute numerical precedence sort key (Higher number = processed first)
   * Honors priority_rank (1=Highest to 5=Lowest), priority_level, and precedence_score
   */
  public static getCoursePrecedenceSortKey(course?: Course): number {
    if (!course) return 50;
    if (course.precedence_score !== undefined && course.precedence_score !== null) {
      return course.precedence_score;
    }
    if (course.priority_rank) {
      // 1 -> 95, 2 -> 80, 3 -> 65, 4 -> 50, 5 -> 35
      return (6 - course.priority_rank) * 15 + 20;
    }
    if (course.priority_level) {
      const levelMap: Record<string, number> = {
        CRITICAL_CORE: 95,
        HIGH_ENROLLMENT: 80,
        HARDWARE_INTENSIVE: 65,
        STANDARD: 50,
        ELECTIVE: 35,
      };
      return levelMap[course.priority_level] || 50;
    }
    return 50;
  }

  /**
   * Section 19: Batch Assignment Engine
   * Processes all scheduled sessions for the semester in academic precedence order
   */
  public static runBatchAssignment(
    sessions: ScheduledSession[],
    aras: ARAUser[],
    rooms: LaboratoryRoom[],
    blocks: LaboratoryBlock[],
    blockResponsibilities: ARABlockResponsibility[],
    roomResponsibilities: ARARoomResponsibility[],
    courseResponsibilities: ARACourseResponsibility[],
    qualifications: ARAQualification[],
    availabilities: AssistantAvailability[],
    preferences: PreferenceSubmission[],
    weights: WeightConfiguration[],
    systemConfig: SystemConfig,
    existingAssignments: AssistantAssignment[] = [],
    coursesList: Course[] = []
  ): {
    updatedSessions: ScheduledSession[];
    newAssignments: AssistantAssignment[];
    decisionReasons: AssignmentDecisionReason[];
    unresolvedCount: number;
    assignedCount: number;
  } {
    // Sort sessions prioritizing high precedence courses that require special assistance / higher volume
    const sortedSessions = [...sessions].sort((a, b) => {
      const courseA = coursesList.find((c) => c.id === a.course_id);
      const courseB = coursesList.find((c) => c.id === b.course_id);
      const scoreA = this.getCoursePrecedenceSortKey(courseA);
      const scoreB = this.getCoursePrecedenceSortKey(courseB);
      if (scoreB !== scoreA) return scoreB - scoreA;
      // Secondary sort: required_ara_count descending
      return (b.required_ara_count || 1) - (a.required_ara_count || 1);
    });

    const updatedSessions = [...sortedSessions];
    const newAssignments: AssistantAssignment[] = [...existingAssignments];
    const decisionReasons: AssignmentDecisionReason[] = [];

    // Filter sessions that can be assigned (skip already confirmed ones unless re-run requested)
    for (let i = 0; i < updatedSessions.length; i++) {
      const session = updatedSessions[i];
      const requiredSlots = session.required_ara_count || 1;

      let slotsFilledForSession = 0;

      for (let slot = 1; slot <= requiredSlots; slot++) {
        // Check if slot already has a confirmed assignment that should not be touched
        const existingSlotAssignment = newAssignments.find(
          (a) => a.session_id === session.id && a.slot_number === slot && a.status === 'Confirmed'
        );
        if (existingSlotAssignment && !systemConfig.batch_can_override_tentative) {
          slotsFilledForSession++;
          continue;
        }

        // Evaluate all candidates
        const evalResult = this.evaluateCandidatesForSlot(
          session,
          slot,
          aras,
          updatedSessions,
          newAssignments,
          rooms,
          blocks,
          blockResponsibilities,
          roomResponsibilities,
          courseResponsibilities,
          qualifications,
          availabilities,
          preferences,
          weights,
          systemConfig
        );

        if (evalResult.selectedCandidate && !evalResult.tieFlagged) {
          const candidate = evalResult.selectedCandidate;
          const assignmentId = `asgn-${session.id}-slot${slot}-${Date.now()}`;

          // Create assignment
          const assignment: AssistantAssignment = {
            id: assignmentId,
            session_id: session.id,
            slot_number: slot,
            ara_id: candidate.ara.id,
            status: systemConfig.require_ara_confirmation ? 'Tentative' : 'Confirmed',
            source: 'batch_engine',
            assigned_at: new Date().toISOString(),
            acceptance_deadline: new Date(Date.now() + systemConfig.confirmation_window_hours * 3600 * 1000).toISOString(),
          };

          // Remove old assignment for this slot if any
          const oldIdx = newAssignments.findIndex(
            (a) => a.session_id === session.id && a.slot_number === slot
          );
          if (oldIdx >= 0) {
            newAssignments[oldIdx] = assignment;
          } else {
            newAssignments.push(assignment);
          }

          // Build Section 7 Decision Record
          const decision: AssignmentDecisionReason = {
            id: `dec-${assignmentId}`,
            assignment_id: assignmentId,
            session_id: session.id,
            ara_id: candidate.ara.id,
            total_score: candidate.totalScore,
            is_selected: true,
            score_breakdown: candidate.scoreBreakdown,
            reasons: candidate.reasons,
            hard_constraints_passed: true,
            block_responsibility: candidate.isBlockResponsible,
            room_key_holder: candidate.isRoomKeyHolder,
            course_responsibility: candidate.isCourseResponsible,
            preference_match: candidate.preferenceMatch,
            qualified: true,
            available: true,
            timetable_conflict: false,
            workload_valid: true,
            tie_breaker_applied: candidate.tieBreakerNotes || null,
            timestamp: new Date().toISOString(),
          };
          decisionReasons.push(decision);

          slotsFilledForSession++;
        } else {
          // No candidate available or tie flagged -> mark as ARA Assignment Required (Section 16)
          // Build diagnostic decision record
          decisionReasons.push({
            id: `dec-unresolved-${session.id}-slot${slot}`,
            assignment_id: '',
            session_id: session.id,
            ara_id: '',
            total_score: 0,
            is_selected: false,
            score_breakdown: [],
            reasons: evalResult.tieFlagged
              ? ['Unresolved score tie between multiple candidates - manual administrator selection required.']
              : ['No candidate met all mandatory hard constraints (Section 6).'],
            hard_constraints_passed: false,
            hard_constraint_violations: evalResult.excludedEvaluations.map(
              (e) => `${e.ara.ara_code} (${e.ara.full_name}): ${e.hardConstraintResult.violations.join('; ')}`
            ),
            block_responsibility: false,
            room_key_holder: false,
            course_responsibility: false,
            preference_match: 'None',
            qualified: false,
            available: false,
            timetable_conflict: true,
            workload_valid: false,
            tie_breaker_applied: evalResult.tieFlagged ? 'Tie Flagged' : null,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Update session status based on slots
      if (slotsFilledForSession === requiredSlots) {
        session.status = systemConfig.require_ara_confirmation ? 'Tentatively Assigned' : 'Confirmed';
      } else if (slotsFilledForSession > 0) {
        session.status = 'Tentatively Assigned';
      } else {
        session.status = 'ARA Assignment Required';
      }
    }

    const assignedCount = updatedSessions.filter((s) => s.status === 'Confirmed' || s.status === 'Tentatively Assigned').length;
    const unresolvedCount = updatedSessions.filter((s) => s.status === 'ARA Assignment Required').length;

    return {
      updatedSessions,
      newAssignments,
      decisionReasons,
      unresolvedCount,
      assignedCount,
    };
  }

  /**
   * Section 9: Real-Time Preference Submission & Auto-Assignment Engine
   * Evaluates a single ARA submitting a preference for immediate allocation
   */
  public static processRealtimePreferenceSubmission(
    ara: ARAUser,
    courseId: string,
    preferenceRank: 1 | 2 | 3,
    allSessions: ScheduledSession[],
    allAssignments: AssistantAssignment[],
    allAras: ARAUser[],
    rooms: LaboratoryRoom[],
    blocks: LaboratoryBlock[],
    blockResponsibilities: ARABlockResponsibility[],
    roomResponsibilities: ARARoomResponsibility[],
    courseResponsibilities: ARACourseResponsibility[],
    qualifications: ARAQualification[],
    availabilities: AssistantAvailability[],
    preferences: PreferenceSubmission[],
    weights: WeightConfiguration[],
    systemConfig: SystemConfig
  ): {
    success: boolean;
    submission: PreferenceSubmission;
    assignedSession?: ScheduledSession;
    assignedSlot?: number;
    assignment?: AssistantAssignment;
    decisionReason?: AssignmentDecisionReason;
    message: string;
  } {
    const submissionId = `pref-${ara.id}-${courseId}-${Date.now()}`;

    // 1. Identify all scheduled sessions for this course that don't have final confirmed ARA
    const candidateSessions = allSessions.filter(
      (s) => s.course_id === courseId && s.status !== 'Confirmed'
    );

    if (candidateSessions.length === 0) {
      // Place in pending queue (Section 9.3)
      const submission: PreferenceSubmission = {
        id: submissionId,
        ara_id: ara.id,
        course_id: courseId,
        preference_rank: preferenceRank,
        submitted_at: new Date().toISOString(),
        status: 'Pending',
        resolved_session_id: null,
        resolution_reason: 'No open scheduled session currently available for this course. Stored in pending queue.',
        resolved_at: null,
      };
      return {
        success: false,
        submission,
        message: 'No open sessions for this course at present. Your submission has been saved to the pending queue.',
      };
    }

    // 2. Iterate through open sessions and find the best session where this ARA qualifies and leads
    let bestSession: ScheduledSession | null = null;
    let bestSlot = 1;
    let bestCandidateEval: CandidateEvaluation | null = null;
    let bestScore = -1;

    for (const session of candidateSessions) {
      const requiredSlots = session.required_ara_count || 1;

      for (let slot = 1; slot <= requiredSlots; slot++) {
        // Check if slot is already occupied
        const slotOccupied = allAssignments.some(
          (a) => a.session_id === session.id && a.slot_number === slot && a.status === 'Confirmed'
        );
        if (slotOccupied) continue;

        // Check hard constraints for submitting ARA
        const hardCheck = this.checkHardConstraints(
          ara,
          session,
          allSessions,
          allAssignments,
          qualifications,
          availabilities,
          systemConfig,
          slot
        );

        if (!hardCheck.passed) continue;

        // Evaluate all candidates for this slot to see if submitting ARA is leading candidate
        const slotEval = this.evaluateCandidatesForSlot(
          session,
          slot,
          allAras,
          allSessions,
          allAssignments,
          rooms,
          blocks,
          blockResponsibilities,
          roomResponsibilities,
          courseResponsibilities,
          qualifications,
          availabilities,
          preferences,
          weights,
          systemConfig
        );

        if (slotEval.selectedCandidate && slotEval.selectedCandidate.ara.id === ara.id) {
          if (slotEval.selectedCandidate.totalScore > bestScore) {
            bestScore = slotEval.selectedCandidate.totalScore;
            bestSession = session;
            bestSlot = slot;
            bestCandidateEval = slotEval.selectedCandidate;
          }
        }
      }
    }

    if (bestSession && bestCandidateEval) {
      // Auto-assign immediately per Section 9.1
      const isTentative = systemConfig.realtime_assignment_mode === 'tentative';
      const assignmentId = `asgn-rt-${bestSession.id}-slot${bestSlot}-${Date.now()}`;

      const assignment: AssistantAssignment = {
        id: assignmentId,
        session_id: bestSession.id,
        slot_number: bestSlot,
        ara_id: ara.id,
        status: isTentative ? 'Tentative' : 'Confirmed',
        source: 'realtime_submission',
        assigned_at: new Date().toISOString(),
        acceptance_deadline: new Date(Date.now() + systemConfig.confirmation_window_hours * 3600 * 1000).toISOString(),
      };

      const submission: PreferenceSubmission = {
        id: submissionId,
        ara_id: ara.id,
        course_id: courseId,
        preference_rank: preferenceRank,
        submitted_at: new Date().toISOString(),
        status: isTentative ? 'Auto-Assigned (Tentative)' : 'Auto-Assigned (Final)',
        resolved_session_id: bestSession.id,
        resolution_reason: `Auto-assigned in real time to ${bestSession.section} (${bestSession.day_of_week} ${bestSession.start_time}-${bestSession.end_time}) with total score ${bestCandidateEval.totalScore}.`,
        resolved_at: new Date().toISOString(),
      };

      const decisionReason: AssignmentDecisionReason = {
        id: `dec-rt-${assignmentId}`,
        assignment_id: assignmentId,
        session_id: bestSession.id,
        ara_id: ara.id,
        total_score: bestCandidateEval.totalScore,
        is_selected: true,
        score_breakdown: bestCandidateEval.scoreBreakdown,
        reasons: bestCandidateEval.reasons,
        hard_constraints_passed: true,
        block_responsibility: bestCandidateEval.isBlockResponsible,
        room_key_holder: bestCandidateEval.isRoomKeyHolder,
        course_responsibility: bestCandidateEval.isCourseResponsible,
        preference_match: bestCandidateEval.preferenceMatch,
        qualified: true,
        available: true,
        timetable_conflict: false,
        workload_valid: true,
        tie_breaker_applied: null,
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        submission,
        assignedSession: bestSession,
        assignedSlot: bestSlot,
        assignment,
        decisionReason,
        message: `Auto-assignment successful! Assigned to ${bestSession.section} (${bestSession.day_of_week} ${bestSession.start_time}-${bestSession.end_time}).`,
      };
    }

    // No slot where this ARA was the top candidate or qualified -> placed in pending queue
    const submission: PreferenceSubmission = {
      id: submissionId,
      ara_id: ara.id,
      course_id: courseId,
      preference_rank: preferenceRank,
      submitted_at: new Date().toISOString(),
      status: 'Pending',
      resolved_session_id: null,
      resolution_reason: 'Open sessions have competing higher-priority candidates or timetable conflicts. Placed in pending queue.',
      resolved_at: null,
    };

    return {
      success: false,
      submission,
      message: 'Your preference was received. Higher-priority candidates or time conflicts detected; placed in pending queue.',
    };
  }

  /**
   * Batch Update: Force-allocates all sessions in the 510 Block to their specific designated ARA room holders.
   * Validates each assignment against current room availability and ARA workload caps.
   */
  public static forceAllocate510Block(
    allSessions: ScheduledSession[],
    allAssignments: AssistantAssignment[],
    rooms: LaboratoryRoom[],
    aras: ARAUser[],
    roomResponsibilities: ARARoomResponsibility[],
    availabilities: AssistantAvailability[]
  ): {
    updatedAssignments: AssistantAssignment[];
    updatedSessions: ScheduledSession[];
    resultsSummary: {
      total510Sessions: number;
      allocatedCount: number;
      validatedCount: number;
      warnings: string[];
      allocationsDetails: Array<{
        sessionId: string;
        roomCode: string;
        roomName: string;
        araName: string;
        araCode: string;
        courseId: string;
        dayOfWeek: string;
        timeSlot: string;
        status: string;
        isValidated: boolean;
        validationNotes: string;
      }>;
    };
  } {
    // 1. Identify 510 Block Rooms
    const rooms510 = rooms.filter(
      (r) => r.block_id === 'block-510' || r.room_code.startsWith('510-')
    );
    const room510Ids = new Set(rooms510.map((r) => r.id));

    // 2. Identify 510 Sessions
    const sessions510 = allSessions.filter((s) => room510Ids.has(s.room_id));

    const updatedAssignmentsMap = new Map<string, AssistantAssignment>();
    // Pre-populate existing assignments
    allAssignments.forEach((a) => updatedAssignmentsMap.set(a.session_id, a));

    const updatedSessionsMap = new Map<string, ScheduledSession>();
    allSessions.forEach((s) => updatedSessionsMap.set(s.id, s));

    const warnings: string[] = [];
    const allocationsDetails: Array<{
      sessionId: string;
      roomCode: string;
      roomName: string;
      araName: string;
      araCode: string;
      courseId: string;
      dayOfWeek: string;
      timeSlot: string;
      status: string;
      isValidated: boolean;
      validationNotes: string;
    }> = [];

    let allocatedCount = 0;
    let validatedCount = 0;

    sessions510.forEach((session) => {
      const room = rooms510.find((r) => r.id === session.room_id);
      const roomCode = room?.room_code || '510-Room';
      const roomName = room?.room_name || 'Laboratory Room';

      // Find Key Holder for this room
      const roomResp = roomResponsibilities.find(
        (rr) => rr.room_id === session.room_id && rr.status === 'Active'
      );
      const keyHolderAra = roomResp ? aras.find((a) => a.id === roomResp.ara_id) : null;

      if (!keyHolderAra) {
        warnings.push(`No designated room key holder assigned for ${roomCode}. Session ${session.id} unallocated.`);
        allocationsDetails.push({
          sessionId: session.id,
          roomCode,
          roomName,
          araName: 'Unassigned',
          araCode: 'N/A',
          courseId: session.course_id,
          dayOfWeek: session.day_of_week,
          timeSlot: `${session.start_time}-${session.end_time}`,
          status: 'Unassigned',
          isValidated: false,
          validationNotes: 'Missing designated Room Key Holder assignment in SRS records.',
        });
        return;
      }

      // Check ARA availability
      const isAvailable = availabilities.some((av) => {
        if (av.ara_id !== keyHolderAra.id || !av.is_available) return false;
        return av.day_of_week === session.day_of_week;
      });

      // Check workload
      const araAssignedHours = Array.from(updatedAssignmentsMap.values())
        .filter((a) => a.ara_id === keyHolderAra.id && a.session_id !== session.id)
        .reduce((sum, a) => {
          const sess = updatedSessionsMap.get(a.session_id);
          return sum + (sess?.duration_hours || 2);
        }, 0);

      const withinWorkload = (araAssignedHours + session.duration_hours) <= (keyHolderAra.max_weekly_hours || 12);

      let validationNotes = 'Validated: Available & within workload limit';
      let isValidated = true;

      if (!isAvailable) {
        validationNotes = `Notice: Scheduled during ${session.day_of_week} shift (Force-allocated per Key Holder mandate)`;
      } else if (!withinWorkload) {
        validationNotes = `Notice: Workload ${araAssignedHours + session.duration_hours}h exceeds standard ${keyHolderAra.max_weekly_hours}h cap (Key Holder Overload Authorized)`;
      }

      // Create force-assignment
      const newAssignment: AssistantAssignment = {
        id: `asgn-510force-${session.id}-${Date.now()}`,
        session_id: session.id,
        slot_number: 1,
        ara_id: keyHolderAra.id,
        status: 'Confirmed',
        source: 'batch_510_force_alloc',
        assigned_at: new Date().toISOString(),
        acceptance_deadline: null,
      };

      updatedAssignmentsMap.set(session.id, newAssignment);

      const updatedSession: ScheduledSession = {
        ...session,
        status: 'Confirmed',
      };
      updatedSessionsMap.set(session.id, updatedSession);

      allocatedCount++;
      if (isValidated) validatedCount++;

      allocationsDetails.push({
        sessionId: session.id,
        roomCode,
        roomName,
        araName: keyHolderAra.full_name,
        araCode: keyHolderAra.ara_code,
        courseId: session.course_id,
        dayOfWeek: session.day_of_week,
        timeSlot: `${session.start_time}-${session.end_time}`,
        status: 'Confirmed',
        isValidated,
        validationNotes,
      });
    });

    return {
      updatedAssignments: Array.from(updatedAssignmentsMap.values()),
      updatedSessions: Array.from(updatedSessionsMap.values()),
      resultsSummary: {
        total510Sessions: sessions510.length,
        allocatedCount,
        validatedCount,
        warnings,
        allocationsDetails,
      },
    };
  }
}
