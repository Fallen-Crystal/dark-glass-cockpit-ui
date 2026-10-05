# Visual QA Criteria

A valid implementation should be checked in an actual browser when possible.

Review:

1. material — translucent, not opaque gray;
2. edge — visible, not white/neon;
3. hierarchy — content beats decoration;
4. fluid — canvas visible, pointer works, fallback works;
5. 3D — drag/select/focus remain stable;
6. breathing — coordinated, no conflicting pulse sources;
7. particle background — subtle after intro;
8. settings — live, no accidental page dimming;
9. console — no runtime errors;
10. privacy/genericity — no personal names, paths or domain-specific source data.

See `qa/QA-GUIDE.md` for the browser acceptance workflow.
