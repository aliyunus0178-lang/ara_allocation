# 4c. Pending Queue
**Doc ID:** SRS-ARA-04c | **Parent:** [README.md](../README.md)

If no session is currently available for auto-assignment:

- The preference submission is stored in a **pending** state
  (not rejected outright).
- The system shall re-evaluate pending submissions whenever session
  availability changes — a session is added, a slot opens due to
  cancellation, or a hard constraint changes (e.g., the ARA becomes
  newly qualified).
- The ARA shall be notified of pending status and of any resulting
  assignment or rejection
  (see [08-nonfunctional-requirements.md](../08-nonfunctional-requirements.md)).

---
**Related:** [04a-availability-check.md](04a-availability-check.md)
