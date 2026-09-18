# 4a. Real-Time Availability Check on Submission
**Doc ID:** SRS-ARA-04a | **Parent:** [README.md](../README.md)

When an ARA submits a course preference for auto-assignment
(see [05a-preference-submission.md](../05-workflows/05a-preference-submission.md)),
the system shall immediately:

1. Identify scheduled sessions for that course/lab with no final,
   confirmed ARA assignment.
2. For each session, run the hard-constraint check
   ([03a-hard-constraints.md](../03-constraints-and-scoring/03a-hard-constraints.md))
   against the submitting ARA.
3. If at least one session passes, score the ARA per
   [03b-scoring-weights.md](../03-constraints-and-scoring/03b-scoring-weights.md).
4. If the ARA is the leading eligible candidate (accounting for other
   pending submissions for the same session), **auto-assign
   immediately** and mark the session tentatively filled.
5. If no open, eligible session exists, place the submission in the
   pending queue ([04c-pending-queue.md](04c-pending-queue.md)).

"Available" means: the course has at least one session not yet in a
final Assigned/Confirmed state, and the ARA passes all hard constraints
for at least one such session.

---
**Related:** [04b-batch-reconciliation.md](04b-batch-reconciliation.md)
