# 4d. Data Requirements — Preference Submissions
**Doc ID:** SRS-ARA-04d | **Parent:** [README.md](../README.md)

New entity: `preference_submissions`

```
id
ara_id
course_id
submitted_at
status              -- pending, auto_assigned_tentative,
                    -- auto_assigned_final, rejected, withdrawn
resolved_session_id  (nullable)
resolution_reason
resolved_at
```

---
**Related:** [07b-new-entities.md](../07-data-model/07b-new-entities.md)
