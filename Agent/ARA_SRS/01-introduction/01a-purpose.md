# 1a. Purpose
**Doc ID:** SRS-ARA-01a | **Parent:** [README.md](../README.md)

The system shall support assigning ARAs (Academic Resource Assistants) to
specific laboratory blocks and/or laboratory rooms for which they have
operational responsibility, and shall support both:

- **Batch/scheduled assignment** — automatic assignment run when laboratory
  sessions are scheduled for a semester.
- **Real-time preference-driven assignment** — an ARA submits a preferred
  course at any time, and the system immediately attempts to assign them
  if the course/session is available
  ([04a-availability-check.md](../04-realtime-assignment/04a-availability-check.md)).

An ARA may be designated as one or more of:

- Laboratory Block Responsible ARA
- Laboratory Room Key Holder
- Course/Laboratory Responsible ARA
- General ARA

These responsibilities shall be configurable by the ARA Administrator, and
shall be used by the scheduling engine when automatically assigning ARAs
to laboratory sessions.

---
**Related:** [01b-scope.md](01b-scope.md), [09-algorithm.md](../09-algorithm.md)
