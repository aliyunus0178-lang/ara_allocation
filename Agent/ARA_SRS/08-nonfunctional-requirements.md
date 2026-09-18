# 8. Non-Functional Requirements
**Doc ID:** SRS-ARA-08 | **Parent:** [README.md](README.md)

- **Notifications:** Notify ARAs (email and/or in-app, configurable) on:
  new auto-assignment, pending-queue status changes, confirmation
  requirements, and overrides affecting them.
- **Roles:** At minimum support ARA Administrator, Department Head
  (optional override authority), and ARA (self-service submission)
  roles. Role-to-permission mapping is configurable.
- **Auditability:** All assignment decisions, scores, and overrides are
  retained for a configurable audit retention period (institutional
  default: current academic year + 2 prior years).
- **Performance:** The batch engine shall process a full semester's
  session load (up to several thousand sessions) within an
  operationally acceptable window (e.g., overnight batch run).
  Real-time submission evaluation resolves within a few seconds under
  normal load.
- **Concurrency:** Simultaneous preference submissions competing for
  the same session slot are resolved deterministically (e.g.,
  row-level locking) so no session is double-assigned.

---
**Related:** [04b-batch-reconciliation.md](04-realtime-assignment/04b-batch-reconciliation.md)
