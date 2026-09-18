# 7a. Data Model — Core Entities
**Doc ID:** SRS-ARA-07a | **Parent:** [README.md](../README.md)

```
laboratory_blocks
  id, block_code, building, name, description, status

laboratory_rooms
  id, block_id, room_code, capacity, lab_type, status

ara_block_responsibilities
  id, block_id, ara_id, responsibility_type, is_primary,
  is_mandatory, start_date, end_date, academic_year, semester, status

ara_room_responsibilities
  id, room_id, ara_id, responsibility_type, is_primary,
  is_mandatory, start_date, end_date, academic_year, semester, status

ara_course_responsibilities
  id, course_id, ara_id, responsibility_type,
  academic_year, semester, status

assistant_preferences
assistant_availability
assistant_assignments
assignment_scores
assignment_decision_reasons
```

---
**Related:** [07b-new-entities.md](07b-new-entities.md)
