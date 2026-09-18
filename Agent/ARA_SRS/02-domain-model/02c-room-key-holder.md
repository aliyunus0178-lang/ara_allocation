# 2c. Room-Level Key Holder
**Doc ID:** SRS-ARA-02c | **Parent:** [README.md](../README.md)

The system shall support room-level responsibility in addition to
block-level responsibility. Either model — or both simultaneously — shall
be configurable per institution.

**Example:**
```
B-510-R01 → ARA-001
B-510-R02 → ARA-001
B-510-R03 → ARA-002
```

**Conflict rule:** if a room's key holder differs from the block's
responsible ARA, both are treated as independent scoring factors (see
[03d-conflict-resolution.md](../03-constraints-and-scoring/03d-conflict-resolution.md))
rather than one being decided as "correct" ahead of scoring.

---
**Related:** [02b-block-responsibility.md](02b-block-responsibility.md)
