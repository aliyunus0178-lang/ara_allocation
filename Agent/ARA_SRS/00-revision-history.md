# Revision History
**Doc ID:** SRS-ARA-00 | **Parent:** [README.md](README.md)

| Version | Date | Author Role | Change Summary |
|---|---|---|---|
| 1.0 | (prior) | Systems Analyst | Initial draft: block/room/course responsibility, sequential priority-based assignment, weighted scoring example, decision explanation, data model. |
| 2.0 | 2026-09-18 | Systems Analyst | Production revision. See details below. |

## v2.0 Changes
1. Resolved conflict between v1's sequential-priority model and weighted-scoring
   model — weighted scoring is now the single authoritative decision model.
2. Defined block-vs-room-key-holder conflict resolution and tie-breaking rules.
3. Added `ara_qualifications` entity; qualification is now a hard exclusion.
4. Defined workload calculation and limits explicitly.
5. Added preference submission workflow (window, max preferences, edit/withdraw).
6. **New feature:** real-time preference submission with immediate
   auto-assignment when a course session is available, reconciled against
   the batch engine via a tentative/final assignment state.
7. Added assignment acceptance/confirmation step (configurable).
8. Added multi-ARA-per-session support.
9. Added semester rollover configuration (auto-carry-forward vs. manual).
10. Defined authorized override actor, logging, and audit trail.
11. Clarified historical-assignment lookback window and decay.
12. Reordered course responsibility above raw preference, with rationale.
13. Added non-functional requirements (notifications, roles, audit, performance,
    concurrency).
14. Added explicit status lifecycle for ARAs, submissions, and sessions.
15. Addressed concurrent double-booking under hard constraints.
16. Split the document into single-topic, component-wise files for
    maintainability and independent review/versioning.

---
**Related:** [README.md](README.md)
