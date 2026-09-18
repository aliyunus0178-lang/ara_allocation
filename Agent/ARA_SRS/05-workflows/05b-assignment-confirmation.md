# 5b. Assignment Acceptance / Confirmation
**Doc ID:** SRS-ARA-05b | **Parent:** [README.md](../README.md)

When an ARA is auto-assigned (batch or real-time):

- The system shall notify the ARA of the assignment.
- The institution may configure whether the ARA must actively confirm
  within a defined window, or whether the assignment is final on
  creation with no confirmation step.
- If confirmation is required and the ARA declines or does not respond
  within the window, the session returns to the candidate pool and the
  next-ranked eligible candidate is evaluated.

---
**Related:** [06a-status-lifecycle.md](../06-operations/06a-status-lifecycle.md)
