# 5e. Mandatory vs. Preferred Responsibility, and Overrides
**Doc ID:** SRS-ARA-05e | **Parent:** [README.md](../README.md)

**Mandatory:** "Only the responsible ARA may supervise this
laboratory." Other ARAs are not considered unless an authorized
override is made.

**Preferred:** "The responsible ARA should be assigned when available,
but another eligible ARA may be assigned."

**Authorized Override:**
- Only the ARA Administrator role (or a higher-privileged role, e.g.
  Department Head) may override a mandatory assignment.
- Every override is logged: overriding user, timestamp, required
  free-text reason, original mandatory candidate, and candidate
  actually assigned.
- Override records are retained per audit policy
  ([08-nonfunctional-requirements.md](../08-nonfunctional-requirements.md)).

---
**Related:** [07b-new-entities.md](../07-data-model/07b-new-entities.md)
