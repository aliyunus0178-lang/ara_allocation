# 2d. Course Responsibility & Qualification
**Doc ID:** SRS-ARA-02d | **Parent:** [README.md](../README.md)

The system shall support assigning an ARA as **Course Responsible ARA**
for a particular laboratory course, e.g.:
```
ARA-001 → Responsible Course: CSEg 1104
```

Separately, the system shall track **qualification**:
- `ara_qualifications` records which courses/labs an ARA is certified or
  qualified to supervise, with issue date, optional expiry date, and status.
- An ARA who is not qualified for a course is a **hard exclusion**
  (see [03a-hard-constraints.md](../03-constraints-and-scoring/03a-hard-constraints.md))
  regardless of preference, block responsibility, or key-holder status.

This separation exists because responsibility is an administrative
designation, while qualification is a certification/competency fact.

---
**Related:** [07b-new-entities.md](../07-data-model/07b-new-entities.md)
