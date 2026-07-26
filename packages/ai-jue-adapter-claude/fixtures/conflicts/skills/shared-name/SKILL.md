---
name: shared-name
description: Neutral fixture skill sharing a name with a command, to exercise the silent-override collision found in JUE-104
---

This skill and the command of the same name occupy one namespace in Claude
Code. Whichever loads last wins, silently, with no validation error.
