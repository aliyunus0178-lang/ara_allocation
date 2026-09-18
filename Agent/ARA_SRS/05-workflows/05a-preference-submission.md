# 5a. Preference Submission Workflow
**Doc ID:** SRS-ARA-05a | **Parent:** [README.md](../README.md)

The system shall let an ARA:
- View courses/labs open for preference submission within the
  configured submission window for the current academic year/semester.
- Submit up to N ranked preferences (N configurable; default 3).
- Edit or withdraw a submission before it is auto-assigned or before the
  window closes, whichever comes first.
- View current status of each submission (pending, tentatively assigned,
  finally assigned, rejected).

The ARA Administrator shall configure:
- the submission window open/close dates per academic year/semester
- the maximum number of ranked preferences per ARA
- whether real-time auto-assignment is enabled, or whether all
  submissions simply feed the batch engine

---
**Related:** [04a-availability-check.md](../04-realtime-assignment/04a-availability-check.md)
