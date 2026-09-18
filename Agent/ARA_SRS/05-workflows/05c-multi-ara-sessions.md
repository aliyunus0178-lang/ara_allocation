# 5c. Multi-ARA Sessions
**Doc ID:** SRS-ARA-05c | **Parent:** [README.md](../README.md)

A laboratory session may require more than one ARA (e.g., large
sections). The system shall:

- Allow a session to define a required ARA count (default 1).
- Run the scoring/assignment process independently for each required
  slot, excluding already-assigned ARAs from subsequent slots for the
  same session.
- Store all decision reasons per slot, per ARA
  (see [06c-decision-explanation.md](../06-operations/06c-decision-explanation.md)).

---
**Related:** [09-algorithm.md](../09-algorithm.md)
