# 4b. Reconciliation with the Batch Engine
**Doc ID:** SRS-ARA-04b | **Parent:** [README.md](../README.md)

Real-time submissions and the batch engine write to the same assignment
records, so the following rule applies:

- A real-time auto-assignment is marked **tentative** until the batch
  engine's next run or an administrator finalizes it — unless the
  institution configures real-time assignments as immediately final.
- The batch engine treats existing tentative assignments as a strong
  (not unconditionally hard) input: by default it will not displace a
  tentative assignment unless a hard constraint is newly violated, or
  the institution configures tentative assignments to be freely re-scored.
- This behavior is configurable by the ARA Administrator.

---
**Related:** [04a-availability-check.md](04a-availability-check.md), [09-algorithm.md](../09-algorithm.md)
