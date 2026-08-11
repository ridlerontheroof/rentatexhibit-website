/**
 * Shared Exhibit On Superior look-and-feel helpers for the SightMap placement
 * mockups. Values mirror artifacts/exhibit-on-superior/src/index.css:
 *   gold  = hsl(42 40% 30%)  (accessible gold on white)
 *   font  = Barlow Semi Condensed; script = Reenie Beanie
 */
import type { ReactNode } from "react";

export const GOLD = "hsl(42 40% 30%)";
export const BORDER = "hsl(0 0% 88%)";
export const MUTED = "hsl(0 0% 42%)";

export function Fonts() {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@300;400;500;600;700&family=Reenie+Beanie&display=swap"
    />
  );
}

export function SplitHeadline({ script, caps }: { script?: string; caps: string }) {
  return (
    <div className="text-center">
      {script && (
        <p
          className="text-[28px] leading-none text-neutral-800"
          style={{ fontFamily: "'Reenie Beanie', cursive" }}
        >
          {script}
        </p>
      )}
      <h2 className="mt-1 text-[22px] font-normal uppercase tracking-[3px] text-neutral-900">
        {caps}
      </h2>
      <span aria-hidden className="mx-auto mt-2 block h-[2px] w-10" style={{ background: GOLD }} />
    </div>
  );
}

export function GoldOutlineBtn({ children, solid = false }: { children: ReactNode; solid?: boolean }) {
  return (
    <span
      className="inline-block cursor-pointer px-4 py-2 text-xs uppercase tracking-wider transition-colors"
      style={
        solid
          ? { background: GOLD, color: "white", border: `1px solid ${GOLD}` }
          : { border: `1px solid ${GOLD}`, color: GOLD }
      }
    >
      {children}
    </span>
  );
}

export function GreyBtn({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-block cursor-pointer px-4 py-2 text-xs uppercase tracking-wider text-neutral-800"
      style={{ border: `1px solid ${BORDER}` }}
    >
      {children}
    </span>
  );
}

/** Condensed stand-in for the live Available Residences strip above the map. */
export function UnitsStrip() {
  const units = [
    { apt: "0208", rent: "$4,222/mo", facts: "2 Bed · 2 Bath · 1,003 sq ft · Available Sep 9" },
    { apt: "0610", rent: "$2,350/mo", facts: "Jr. Convertible · 1 Bath · 492 sq ft · Available Oct 1" },
    { apt: "1001", rent: "$4,281/mo", facts: "2 Bed · 2 Bath · 898 sq ft · Available Oct 1" },
    { apt: "1301", rent: "$4,142/mo", facts: "2 Bed · 1 Bath · 898 sq ft · Available Sep 1" },
    { apt: "1705", rent: "$2,271/mo", facts: "Jr. Convertible · 1 Bath · 445 sq ft · Available Nov 23" },
  ];
  return (
    <section className="px-4 pb-6">
      <div className="mx-auto max-w-6xl bg-white p-4 md:p-6" style={{ border: `1px solid ${BORDER}` }}>
        <SplitHeadline caps="Available Residences" />
        <p className="mt-1 text-center text-sm" style={{ color: MUTED }}>
          Real-time availability and pricing, updated automatically from our leasing system.
        </p>
        <ul className="mt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          {units.map((u) => (
            <li
              key={u.apt}
              className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center gap-4">
                <span className="h-[64px] w-[86px] shrink-0 bg-neutral-200" style={{ border: `1px solid ${BORDER}` }} />
                <span className="flex w-28 shrink-0 flex-col">
                  <span className="text-lg font-semibold uppercase tracking-wider text-neutral-900">Apt {u.apt}</span>
                  <span className="text-lg font-semibold" style={{ color: GOLD }}>{u.rent}</span>
                </span>
                <span className="hidden text-sm md:block" style={{ color: MUTED }}>{u.facts}</span>
              </div>
              <span className="flex flex-wrap items-center gap-3">
                <GreyBtn>Apt {u.apt} details</GreyBtn>
                <GreyBtn>Schedule a tour</GreyBtn>
                <GoldOutlineBtn>Apply now</GoldOutlineBtn>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen bg-white pb-10"
      style={{ fontFamily: "'Barlow Semi Condensed', 'Helvetica Neue', Arial, sans-serif", fontSize: 15 }}
    >
      <Fonts />
      {/* Condensed page hero */}
      <div className="relative flex h-[150px] items-center justify-center bg-neutral-800 text-center">
        <div>
          <p className="text-[26px] text-white" style={{ fontFamily: "'Reenie Beanie', cursive" }}>
            Move-In Ready Residences
          </p>
          <h1 className="text-2xl font-normal uppercase tracking-[4px] text-white">Available Units</h1>
        </div>
      </div>
      <div className="pt-6">{children}</div>
    </div>
  );
}
