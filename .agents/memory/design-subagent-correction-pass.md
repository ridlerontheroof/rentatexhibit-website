---
name: Design-subagent correction-pass pattern
description: Delegating a large multi-page frontend build to design subagents and correcting fidelity defects.
---

# Design-subagent build + correction pass

**Pattern:** For a large multi-page pixel-perfect build, the first design subagent gets you ~80% there but leaves fidelity defects (wrong asset paths, placeholder embeds, invented/simplified content, wrong routes). Rather than fixing everything by hand, run a second *scoped* "correction" subagent with an explicit defect list.

**Why:** subagents don't reliably honor every constraint in one shot; a focused correction pass with a concrete checklist is more effective than one giant brief.

**How to apply:**
- After any subagent build/correction pass, do NOT trust its self-report. Verify the specific claims yourself with grep + screenshots: address strings, CTA URLs, absence of placeholder embeds, route names, nav structure, provider wiring.
- Providers are a common casualty: a subagent rewriting `main.tsx`/`App.tsx` can silently drop `QueryClientProvider`/`HelmetProvider`, breaking data hooks at runtime ("No QueryClient set"). Re-check provider wiring after subagent edits.
- Subagents may hand-roll a fetch hook that diverges from the generated API client contract (missing required discriminator fields). Reconcile the hook payload with the OpenAPI/Zod schema.
