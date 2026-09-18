# 7b. Data Model — New Entities (v2.0)
**Doc ID:** SRS-ARA-07b | **Parent:** [README.md](../README.md)

```
ara_qualifications
  id, ara_id, course_id, qualified_date, expiry_date, status

preference_submissions
  id, ara_id, course_id, submitted_at, status,
  resolved_session_id, resolution_reason, resolved_at

assignment_overrides
  id, session_id, overriding_user_id, original_candidate_ara_id,
  assigned_ara_id, reason, created_at

weight_configurations
  id, scope (institution/department/course), factor_name,
  weight_value, effective_date, status
```

---
**Related:** [07a-core-entities.md](07a-core-entities.md), [05e-mandatory-override.md](../05-workflows/05e-mandatory-override.md)
