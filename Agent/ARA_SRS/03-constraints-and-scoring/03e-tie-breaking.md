# 3e. Tie-Breaking
**Doc ID:** SRS-ARA-03e | **Parent:** [README.md](../README.md)

If two or more candidates have identical total scores after all factors
are applied, the system shall resolve the tie in this order:

1. Prefer the candidate with the lower current workload
   (better workload balance).
2. If still tied, prefer the candidate with the earlier `ara_id`
   creation date (seniority) — configurable to a different deterministic
   rule per institution.
3. If still tied, flag the session for manual administrator selection
   rather than resolving arbitrarily.

---
**Related:** [03b-scoring-weights.md](03b-scoring-weights.md)
