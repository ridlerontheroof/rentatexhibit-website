---
name: Canvas comps need in-repo evidence
description: How to get canvas-based design-comp tasks past the completion code review
---
The rule: when a task's deliverable lives on the workspace canvas (mockup frames, sticky notes), also commit an in-repo equivalent — e.g. a `Board.tsx` that renders the variants side by side with labels/rationale, plus a `DIRECTIONS.md` — because the completion code review only sees the repo diff.

**Why:** Woods Crossing design-comps task was rejected twice: first for "missing rationale notes" (they existed only as canvas sticky notes), then for the missing side-by-side presentation. Adding Board.tsx + DIRECTIONS.md satisfied review.

**How to apply:** any canvas/mockup task with labeled variants or annotation deliverables — mirror labels/rationale into committed files before markTaskComplete. Also: review checks comp claims against rendering (e.g. documented font pairing must actually apply — sandbox-global heading font overrides component `font-serif` unless scoped with a wrapper-class CSS rule).
