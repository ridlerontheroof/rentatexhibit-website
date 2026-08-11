/**
 * SightMap placement mockup — EXPANDED state (real Engrain embed) with the
 * Exhibit-styled selected-unit CTA row beneath the map. The CTA row space is
 * reserved from the start (no layout shift when a unit is picked); before a
 * selection it shows a neutral hint.
 */
import { useState } from "react";
import { PageShell, UnitsStrip, SplitHeadline, GoldOutlineBtn, GreyBtn, BORDER, GOLD, MUTED } from "./_shared/exhibit";

export function Expanded() {
  const [selected] = useState({ apt: "0208", facts: "2 Bed · 2 Bath · 1,003 sq ft", rent: "$4,222/mo" });

  return (
    <PageShell>
      {/* NEW: SightMap section (map open) */}
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
            <iframe
              title="SightMap interactive property map showing unit availability"
              width="100%"
              height="100%"
              src="https://sightmap.com/embed/r5v516ejwny?enable_api=1"
              style={{ position: "absolute", inset: 0, border: 0 }}
              allow="geolocation; web-share; clipboard-write"
            />
          </div>

          {/* Selected-unit CTA row — fixed height, present from first paint. */}
          <div
            className="mt-0 flex min-h-[64px] flex-col items-center justify-between gap-3 bg-white px-4 py-3 md:flex-row"
            style={{ border: `1px solid ${BORDER}`, borderTop: 0 }}
          >
            {selected ? (
              <>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-lg font-semibold uppercase tracking-wider text-neutral-900">
                    Apt {selected.apt}
                  </span>
                  <span className="text-lg font-semibold" style={{ color: GOLD }}>{selected.rent}</span>
                  <span className="text-sm" style={{ color: MUTED }}>{selected.facts}</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <GreyBtn>Apt {selected.apt} details</GreyBtn>
                  <GreyBtn>Schedule a tour</GreyBtn>
                  <GoldOutlineBtn solid>Apply now</GoldOutlineBtn>
                </div>
              </>
            ) : (
              <p className="w-full text-center text-sm" style={{ color: MUTED }}>
                Select an apartment on the map to see pricing and book a tour.
              </p>
            )}
          </div>
          <p className="mt-2 text-center text-xs" style={{ color: MUTED }}>
            Tour and application always go through Exhibit’s own scheduler and application flow —
            the same links as the residence list above.
          </p>
        </div>
      </section>

      <UnitsStrip />
    </PageShell>
  );
}
