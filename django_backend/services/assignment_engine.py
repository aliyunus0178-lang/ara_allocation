"""
Adama Science and Technology University (ASTU)
School of Electrical Engineering & Computing
Assignment Engine Service (Python / Django Implementation)
SRS Version 2.0 (Final) — Section 6, 8, 9, 12, 14, 19
"""

from datetime import datetime, time
from typing import List, Dict, Any, Optional, Tuple


class HardConstraintChecker:
    """
    Section 6: Hard (Mandatory) Constraints
    """
    @staticmethod
    def evaluate(ara, session, active_qualifications, existing_assignments, availabilities, max_workload_hours=12):
        violations = []

        # 1. Active status check
        if ara.status != 'Active':
            violations.append(f"ARA status is {ara.status} (requires Active)")

        # 2. Qualification check (Section 5 & 17)
        is_qualified = any(
            q.ara_id == ara.id and q.course_id == session.course_id and q.status == 'Valid'
            for q in active_qualifications
        )
        if not is_qualified:
            violations.append(f"ARA is not qualified for course {session.course.course_code}")

        # 3. Availability check
        matching_av = any(
            av.ara_id == ara.id and av.day_of_week == session.day_of_week and av.is_available
            and av.start_time <= session.start_time and av.end_time >= session.end_time
            for av in availabilities
        )
        if not matching_av:
            violations.append(f"Not available on {session.day_of_week} during {session.start_time}-{session.end_time}")

        # 4. Overlapping timetable conflict (double-booking)
        for asgn in existing_assignments:
            if asgn.ara_id == ara.id and asgn.session.day_of_week == session.day_of_week:
                # Check interval overlap
                s1, e1 = session.start_time, session.end_time
                s2, e2 = asgn.session.start_time, asgn.session.end_time
                if max(s1, s2) < min(e1, e2):
                    violations.append(f"Conflict with existing session {asgn.session.section} at {s2}-{e2}")
                    break

        # 5. Workload limit
        current_hours = sum(
            asgn.session.duration_hours for asgn in existing_assignments if asgn.ara_id == ara.id
        )
        if current_hours + session.duration_hours > max_workload_hours:
            violations.append(f"Workload cap exceeded: {current_hours}h + {session.duration_hours}h > {max_workload_hours}h")

        # 6. Policy clearance
        if ara.status in ['Suspended', 'On Leave']:
            violations.append("Institutional clearance rejected due to administrative status")

        return len(violations) == 0, violations


class AuthoritativeScorer:
    """
    Section 8: Authoritative Weighted Scoring Model
    """
    @staticmethod
    def calculate_score(ara, session, block_resps, room_resps, course_resps, preferences, weights):
        score = 0
        breakdown = []
        reasons = []

        # 1. Room key-holder responsibility (+60)
        is_key_holder = any(
            r.room_id == session.room_id and r.ara_id == ara.id and r.status == 'Active'
            for r in room_resps
        )
        if is_key_holder:
            w = weights.get('ROOM_KEY_HOLDER', 60)
            score += w
            breakdown.append({'factor': 'Room key-holder responsibility', 'points': w})
            reasons.append(f"Direct room key-holder for {session.room.room_code} (+{w} pts)")

        # 2. Block responsibility (+50)
        is_block_resp = any(
            b.block_id == session.room.block_id and b.ara_id == ara.id and b.status == 'Active'
            for b in block_resps
        )
        if is_block_resp:
            w = weights.get('BLOCK_RESPONSIBLE', 50)
            score += w
            breakdown.append({'factor': 'Room/Block responsibility', 'points': w})
            reasons.append(f"Responsible for laboratory block {session.room.block.block_code} (+{w} pts)")

        # 3. Course responsibility (+45)
        is_course_resp = any(
            c.course_id == session.course_id and c.ara_id == ara.id and c.status == 'Active'
            for c in course_resps
        )
        if is_course_resp:
            w = weights.get('COURSE_RESPONSIBLE', 45)
            score += w
            breakdown.append({'factor': 'Course responsibility', 'points': w})
            reasons.append(f"Course/Laboratory responsibility designated by department (+{w} pts)")

        # 4. Preferences (1st: +40, 2nd: +30, 3rd: +20)
        for pref in preferences:
            if pref.ara_id == ara.id and pref.course_id == session.course_id:
                if pref.preference_rank == 1:
                    w = weights.get('PREFERENCE_1', 40)
                    score += w
                    breakdown.append({'factor': 'Preference 1', 'points': w})
                    reasons.append(f"Selected course as Preference 1 (+{w} pts)")
                elif pref.preference_rank == 2:
                    w = weights.get('PREFERENCE_2', 30)
                    score += w
                    breakdown.append({'factor': 'Preference 2', 'points': w})
                    reasons.append(f"Selected course as Preference 2 (+{w} pts)")
                elif pref.preference_rank == 3:
                    w = weights.get('PREFERENCE_3', 20)
                    score += w
                    breakdown.append({'factor': 'Preference 3', 'points': w})
                    reasons.append(f"Selected course as Preference 3 (+{w} pts)")

        return score, breakdown, reasons
