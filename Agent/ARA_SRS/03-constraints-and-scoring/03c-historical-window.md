# 3c. Historical Assignment Window
**Doc ID:** SRS-ARA-03c | **Parent:** [README.md](../README.md)

By default, "historical assignment" considers only the immediately
preceding semester.

The ARA Administrator may configure:
- a longer lookback window (e.g., last 3 semesters)
- a decay factor so older semesters contribute a smaller weight

Historical assignment shall never override any hard constraint from
[03a-hard-constraints.md](03a-hard-constraints.md).

---
**Related:** [03b-scoring-weights.md](03b-scoring-weights.md)
