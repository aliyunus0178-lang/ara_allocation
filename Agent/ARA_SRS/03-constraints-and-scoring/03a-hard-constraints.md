# 3a. Hard (Mandatory) Constraints
**Doc ID:** SRS-ARA-03a | **Parent:** [README.md](../README.md)

Before any scoring occurs, the system shall exclude any ARA who:

- is not active
- is not qualified for the course/lab (per `ara_qualifications`)
- is not available at the scheduled time
- already has another assignment at the same time — including cases
  where the same ARA is responsible for multiple rooms/blocks with
  overlapping sessions
- would exceed a configured mandatory workload limit, calculated as
  total assigned session-hours per week against a configurable per-ARA
  (or per-role) maximum
- is not eligible for the department/course/laboratory under
  institutional policy

Excluded ARAs never receive a score and are not considered further for
that session.

---
**Related:** [03b-scoring-weights.md](03b-scoring-weights.md)
