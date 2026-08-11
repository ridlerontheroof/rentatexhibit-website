/**
 * SightMap placement mockup — COLLAPSED state.
 * The section sits directly below the Available Residences strip (below the
 * fold on all viewports). Before activation the site ships only a poster
 * image + launch button (click-to-load EmbedFacade pattern) — no Engrain JS.
 */
import { PageShell, UnitsStrip, SplitHeadline, BORDER, GOLD, MUTED } from "./_shared/exhibit";

export function Collapsed() {
  return (
    <PageShell>
      {/* NEW: SightMap section (collapsed facade) */}
      <section className="px-4 pb-8">
        <div className="mx-auto max-w-6xl">
          <SplitHeadline script="Find It on the Map" caps="Explore the Building" />
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm" style={{ color: MUTED }}>
            Exhibit On Superior has 34 residential floors in River North, Chicago — 5 residences
            are available today. Browse floor by floor on the interactive map; availability is
            synced automatically from our leasing system.
          </p>

          <div
            className="relative mt-6 w-full overflow-hidden aspect-[3/4] sm:aspect-[16/9] sm:max-h-[620px]"
            style={{ border: `1px solid ${BORDER}` }}
          >
            <img
              src="/__mockup/images/sightmap-poster.png"
              alt="Interactive property map of Exhibit On Superior"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute inset-0 bg-black/30" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span
                className="inline-flex items-center gap-3 px-6 py-3 text-xs uppercase tracking-wider text-white backdrop-blur-sm"
                style={{ border: "1px solid rgba(255,255,255,0.6)", background: "rgba(0,0,0,0.6)" }}
              >
                <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M3 1.5l9 5.5-9 5.5z" />
                </svg>
                Explore the interactive map
              </span>
            </span>
            <span className="absolute inset-x-0 bottom-3 text-center text-xs uppercase tracking-wider text-white/90">
              5 residences available now · updated daily
            </span>
          </div>
          <p className="mt-2 text-center text-xs" style={{ color: MUTED }}>
            Loads on click — the map’s code never slows the page down.
          </p>
        </div>
      </section>

      <UnitsStrip />

      {/* Existing content that follows today */}
      <section className="mt-10 px-4 py-10 text-center" style={{ borderTop: `1px solid ${BORDER}` }}>
        <SplitHeadline script="Find Your Perfect Fit" caps="Explore All Layouts" />
        <p className="mx-auto mt-3 max-w-xl text-sm" style={{ color: MUTED }}>
          Looking for a specific layout rather than what’s available today? Every distinct floor
          plan has its own page…
        </p>
        <span className="mt-5 inline-block px-4 py-2 text-xs uppercase tracking-wider" style={{ border: `1px solid ${GOLD}`, color: GOLD }}>
          Browse All Floor Plans
        </span>
      </section>
    </PageShell>
  );
}
