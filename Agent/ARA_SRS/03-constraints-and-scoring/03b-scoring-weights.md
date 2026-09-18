# 3b. Assignment Scoring Model (Authoritative)
**Doc ID:** SRS-ARA-03b | **Parent:** [README.md](../README.md)

This is the single authoritative decision model, replacing any purely
sequential priority check. Order below sets the **default** weight
ordering only; actual weights are configurable per institution.

| Factor | Default Weight | Rationale |
|---|---:|---|
| Hard eligibility | Exclusion (not scored) | Must pass before scoring |
| Room key-holder responsibility | +60 | Direct accountability for that room |
| Block responsibility | +50 | Broader accountability across the block |
| Course responsibility | +45 | Institutional designation, ranked above raw preference |
| Preference 1 / 2 / 3 | +40 / +30 / +20 | Personal ranked choice |
| Historical assignment | +10 | See [03c](03c-historical-window.md) |
| Preferred day / time | +10 / +10 | |
| Workload balance | +variable | Favors under-utilized ARAs on ties |

The ARA Administrator may reconfigure any weight, including disabling a
factor (weight 0) or making it effectively mandatory-preferred.

---
**Related:** [03c-historical-window.md](03c-historical-window.md), [03d-conflict-resolution.md](03d-conflict-resolution.md)
