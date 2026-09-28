---
packages:
  group:dimah-survey: minor
---

### Publish each survey document once

Publishing stores an immutable version and points the survey at it. An unchanged document reuses that version. Each response keeps the version id it started with, and a full response list returns each of those versions once.
