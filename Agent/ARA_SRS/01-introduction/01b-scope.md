# 1b. Scope
**Doc ID:** SRS-ARA-01b | **Parent:** [README.md](../README.md)

## In Scope
- Block-level and room-level responsibility modeling and configuration.
- Course/laboratory responsibility and qualification tracking.
- Weighted, configurable automatic assignment (batch and real-time).
- ARA preference submission, confirmation, and pending-queue workflows.
- Semester rollover configuration for responsibility records.
- Mandatory-vs-preferred responsibility policy and authorized overrides.
- Full decision auditability (scores, reasons, overrides).
- Notification of ARAs on assignment, pending status, and overrides.

## Out of Scope
- Payroll/compensation calculation for ARA hours.
- General university course registration/enrollment (student-facing).
- Physical key/access-control hardware integration (assumed handled by a
  separate facilities system; this SRS tracks only the responsibility
  record, not physical key issuance).
- Long-term capacity planning/forecasting beyond current + next semester.

## Assumptions
- Course, session, and room scheduling data already exists or is imported
  from an existing academic scheduling system.
- ARA identity, activation, and base HR status are managed upstream.

---
**Related:** [01a-purpose.md](01a-purpose.md)
