// Presentation board: the three Woods Crossing homepage comps side by side,
// each labeled with its direction name and palette/type/rationale note.
// The same three comps are also placed as individual live frames on the
// workspace canvas (shapes wc-comp-*) with matching sticky notes (wc-note-*).

const directions = [
  {
    name: "Wasatch Warm — outdoorsy",
    component: "WasatchWarm",
    accent: "#C65932",
    palette: ["#F4EFE5", "#2B362B", "#C65932"],
    type: "Fraunces + DM Sans",
    rationale:
      "Leads with the property's strongest asset — the mountain-bench setting. Earthy, golden-hour tones read honest and comfortable, not luxury. Pick if the brand should feel rooted in the Wasatch outdoors.",
  },
  {
    name: "Clean Contemporary",
    component: "CleanContemporary",
    accent: "#416152",
    palette: ["#FAF9F5", "#416152", "#25372A"],
    type: "Outfit + DM Sans",
    rationale:
      "Airy, uncluttered, easy to scan — like a freshly cleaned apartment with the windows open. Sage green keeps it warm and natural instead of stark. Pick if the brand should feel calm, trustworthy, and current.",
  },
  {
    name: "Bold & Friendly",
    component: "BoldFriendly",
    accent: "#FAC61A",
    palette: ["#1C2B4A", "#FAC61A", "#FAF8F5", "#F46746"],
    type: "Bricolage Grotesque + DM Sans",
    rationale:
      "Confident color and rounded shapes give it real personality — energetic and neighborly, never intimidating. Pick if the brand should stand out from beige competitor sites and feel welcoming to families.",
  },
];

export function Board() {
  return (
    <div className="min-h-screen bg-neutral-100 p-8 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">
          Woods Crossing — homepage design comps
        </h1>
        <p className="mt-2 max-w-3xl text-neutral-600">
          Three modern Class B directions for Woods Crossing, 850 N. Hwy 89,
          North Salt Lake, UT. Real bundle content and photos throughout. Pick
          one direction to become the visual spec for the new site project.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {directions.map((d) => (
          <section
            key={d.component}
            className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
          >
            <div
              className="border-b-4 px-5 py-4"
              style={{ borderColor: d.accent }}
            >
              <h2 className="text-lg font-semibold text-neutral-900">{d.name}</h2>
              <div className="mt-2 flex items-center gap-2">
                {d.palette.map((c) => (
                  <span
                    key={c}
                    title={c}
                    className="h-5 w-5 rounded-full border border-neutral-300"
                    style={{ backgroundColor: c }}
                  />
                ))}
                <span className="ml-2 text-xs uppercase tracking-wide text-neutral-500">
                  {d.type}
                </span>
              </div>
            </div>
            <iframe
              title={d.name}
              src={`/__mockup/preview/woods-crossing/${d.component}`}
              className="h-[560px] w-full border-0 bg-neutral-50"
            />
            <p className="px-5 py-4 text-sm leading-relaxed text-neutral-700">
              {d.rationale}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
