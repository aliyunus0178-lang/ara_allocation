# 9. Assignment Algorithm (Consolidated)
**Doc ID:** SRS-ARA-09 | **Parent:** [README.md](README.md)

For each laboratory session (batch) or each preference submission (real-time):

1. Identify the candidate laboratory room and block.
2. Identify block responsible ARA(s), room key holder(s), course
   responsible ARA(s).
3. Retrieve all active ARAs (or, for real-time, the single submitting ARA).
4. Remove candidates violating any hard constraint, incl. qualification.
5. Score remaining candidates (block, key-holder, course responsibility,
   preferences, history, day/time, workload balance).
6. Apply the mandatory-responsibility rule if configured.
7. Resolve ties.
8. Assign selected candidate(s) — supporting multiple required ARAs.
9. Mark assignment tentative or final per configuration.
10. Store the full decision record.
11. If no candidate exists, mark "ARA Assignment Required."
12. For real-time submissions with no available session, place in the
    pending queue and re-evaluate on future availability changes.
13. Validate the complete schedule for conflicts after each run.

---
**Related:** [03b-scoring-weights.md](03-constraints-and-scoring/03b-scoring-weights.md), [04a-availability-check.md](04-realtime-assignment/04a-availability-check.md)
