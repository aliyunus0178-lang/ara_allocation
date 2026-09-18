# 3d. Block vs. Room Key-Holder Conflict Resolution
**Doc ID:** SRS-ARA-03d | **Parent:** [README.md](../README.md)

When the block-responsible ARA and the room key-holder are different
people for the same room:

1. Both scores apply independently and additively to whichever
   candidate holds each role. A candidate holding both roles for the
   same room receives both weights.
2. If this produces two different top-scoring candidates, the higher
   combined score wins.
3. The institution may configure either responsibility as **mandatory**
   (see [05e-mandatory-override.md](../05-workflows/05e-mandatory-override.md)),
   in which case the mandatory role's holder is required — not merely
   favored — unless excluded by a hard constraint.

---
**Related:** [03e-tie-breaking.md](03e-tie-breaking.md)
