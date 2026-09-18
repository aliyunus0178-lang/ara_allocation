# 2a. Laboratory Block Structure
**Doc ID:** SRS-ARA-02a | **Parent:** [README.md](../README.md)

A laboratory block is a logical grouping of laboratory rooms.

**Example:**
```
Laboratory Block: B-510
Rooms: B-510-R01 … B-510-R15
```

The system shall maintain the relationship:

```
Laboratory Block → Laboratory Rooms → Responsible ARA(s)
                 → Courses/Laboratories → Scheduled Sessions
```

Each block and room record shall carry a status
(see [06a-status-lifecycle.md](../06-operations/06a-status-lifecycle.md)).

---
**Related:** [07a-core-entities.md](../07-data-model/07a-core-entities.md)
