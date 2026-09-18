# 6b. Unavailable Responsible ARA / No Candidate Available
**Doc ID:** SRS-ARA-06b | **Parent:** [README.md](../README.md)

If the responsible ARA is unavailable, the system shall not
automatically assign them and shall continue to the next eligible
candidate per the scoring model
([03b-scoring-weights.md](../03-constraints-and-scoring/03b-scoring-weights.md)).

If no eligible candidate exists at all, the system shall mark the
session **"ARA Assignment Required"** and provide:

- responsible-ARA unavailability reason
- other eligible ARAs and their scores
- conflicts
- workload information

for administrator manual resolution.

---
**Related:** [06a-status-lifecycle.md](06a-status-lifecycle.md)
