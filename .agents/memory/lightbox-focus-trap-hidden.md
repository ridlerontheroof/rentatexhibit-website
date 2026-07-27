---
name: Lightbox focus traps must skip hidden controls
description: Why Tab traps in the photo lightboxes must filter display:none elements
---
The rule: any Tab focus trap that computes first/last focusables inside a lightbox dialog must use `tabbableIn()` (exported from the lightbox shortcut-keys hook), not a raw `querySelectorAll('a[href], button')`.

**Why:** the shared "?" shortcuts button is `hidden pointer-fine:lg:flex` — display:none on coarse-pointer/small viewports and headless browsers. Counting it as the trap's "last" focusable means the visually-last control never triggers the wrap, so a real browser Tabs straight out of the modal into the page behind it. jsdom tests don't catch this (no layout); it only reproduces in a real browser (CDP probe or the e2e tester).

**How to apply:** when adding/altering any modal or lightbox with a manual Tab trap, filter focusables by computed display and re-verify with a real-browser keyboard pass, not just jsdom.
