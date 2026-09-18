# 2b. Laboratory Block Responsible ARA
**Doc ID:** SRS-ARA-02b | **Parent:** [README.md](../README.md)

The ARA Administrator shall be able to assign an ARA as responsible for a
laboratory block.

**Example:**
```
Block: B-510 | Responsible ARA: ARA-001
Responsibility: Key Holder / Laboratory Block Responsible
Effective: 2026 Semester 1
```

The assignment record shall include:
- start date, end date
- academic year, semester
- responsibility type
- status
- `is_mandatory` flag (drives override behavior —
  see [05e-mandatory-override.md](../05-workflows/05e-mandatory-override.md))

---
**Related:** [02c-room-key-holder.md](02c-room-key-holder.md)
