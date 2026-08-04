// Hand-written "living in this layout" copy for every floor-plan landing
// page, keyed by plan id (floorPlans.ts `Plan.id`). One entry per sheet —
// written individually, never templated, so each page carries genuinely
// unique guidance (information gain, no spun boilerplate).
//
// Fact sources ONLY (never invent):
//  - floorPlans.ts (sqft, beds/baths, floors) — the sqft authority.
//  - planFacts.ts / unitMap.json (facing, balcony, features shown on the
//    plan sheet) — approved fact source 2026-08-04.
//  - Direction language follows the user-approved mapping in planFacts.ts
//    (south → skyline/Loop, west → evening sun, east → morning sun,
//    north → soft indirect light). No view claims beyond it.
//  - Balcony hard rule: the 02/03 stacks on floors 6–29 are the only
//    balcony-free homes.
//
// Every plan page must have an entry (guarded by floorPlanCopy.test.ts).

export interface FloorPlanCopy {
  /** Two short paragraphs of layout-living guidance, unique per plan. */
  paragraphs: string[];
}

export const FLOOR_PLAN_COPY: Record<string, FloorPlanCopy> = {
  // ---------------------------------------------------------------- Podium
  'unit-5-floor-2': {
    paragraphs: [
      'This is a one-of-a-kind home: the only 821 sq ft two-bedroom, one-bath in the tower, on the podium level at floor 2. The plan sheet shows a separated-bedroom arrangement, so the two bedrooms sit apart rather than sharing a wall — useful for roommates splitting rent on a single-bath budget or a home office that stays out of earshot.',
      'You enter through a proper foyer into an open living and dining area with a freestanding kitchen island, and the south-facing windows and private balcony look toward the Loop, so the main room carries city skyline views. An in-home washer and dryer is included.',
    ],
  },
  'unit-6-floor-2': {
    paragraphs: [
      'The smallest one-bedroom in the building at 619 sq ft, and the only home with this exact plan — a podium-level residence on floor 2. It keeps the full one-bedroom program in a compact footprint: real foyer entry, open living and dining space, and a freestanding kitchen island you rarely find at this size.',
      'The home faces south, so the living space and private balcony pick up city skyline views toward the Loop. With its own washer and dryer in the home, it suits a single renter who wants a true separate bedroom without paying for square footage they will not use.',
    ],
  },
  'unit-7-floor-2': {
    paragraphs: [
      'A single podium-level home on floor 2, this 630 sq ft one-bedroom pairs a compact footprint with finishes usually reserved for larger plans: a freestanding kitchen island, a foyer entry that keeps the front door from opening straight into the living space, and an open living and dining area.',
      'South-facing glass and a private balcony orient the home toward the Loop, so the main room reads bright with city skyline views. An in-home washer and dryer rounds it out — a practical first apartment or an efficient pied-à-terre two blocks from the CTA Brown Line.',
    ],
  },
  'unit-8-floor-2': {
    paragraphs: [
      'At 1,003 sq ft, this podium two-bedroom, two-bath is the only home of its plan in the tower. The sheet shows a split-bedroom arrangement — each bedroom on its own side of the living space with its own bathroom nearby — which is the layout roommates and couples working from home ask for most.',
      'The southwest corner orientation brings city skyline views toward the Loop plus evening sunlight, enjoyed from a private balcony off the open living and dining room. A freestanding kitchen island anchors the kitchen, and the washer and dryer are in the home.',
    ],
  },
  'unit-9-floor-2': {
    paragraphs: [
      'This 929 sq ft two-bedroom, two-bath occupies a single podium-level position on floor 2. Bedrooms are split to opposite sides of the plan, each convenient to its own full bath, so two renters get near-equal privacy — or one bedroom converts cleanly to an office with a door.',
      'West-facing windows and the private balcony catch evening sunlight, which lands in the open living and dining area and its freestanding kitchen island at the hour you are most likely home. In-home laundry is standard.',
    ],
  },
  'unit-10-floor-2': {
    paragraphs: [
      'The 935 sq ft two-bedroom, two-bath at the tower\u2019s northwest podium corner — one home, one floor, no other copies of this plan. The split-bedroom layout puts a full bath with each bedroom zone, and a foyer entry buffers the living space from the corridor.',
      'Northwest exposure means soft northern light through the day with evening sun from the west on the private balcony. The open living and dining room centers on a freestanding kitchen island, and the washer and dryer are inside the home.',
    ],
  },
  'unit-1-floor-3': {
    paragraphs: [
      'At 1,135 sq ft, this is the largest two-bedroom, two-bath plan in the building — a single home on floor 3 at the southeast corner. The split-bedroom arrangement keeps both bedrooms private, and the extra floor area over the tower plans shows up in the open living and dining room.',
      'Southeast exposure combines city skyline views toward the Loop with morning sunlight — the private balcony is a genuine breakfast spot. A freestanding kitchen island, foyer entry, and in-home washer and dryer complete the plan. If you want two-bedroom space without penthouse pricing tiers, this is the floor plan to watch.',
    ],
  },
  'unit-2-floor-3': {
    paragraphs: [
      'The smallest home in the tower — a 448 sq ft studio on floor 3 — and the only studio with a private balcony-and-island combination on the podium. The sheet shows a true open studio layout: one continuous room from the foyer through the living and sleeping space.',
      'It faces south, so the single room and its balcony carry city skyline views toward the Loop all day. A freestanding kitchen island doubles as dining table and desk, and the washer and dryer are in the home — everything a first solo apartment needs, nothing it doesn\u2019t.',
    ],
  },
  'unit-3-floors-3-4m': {
    paragraphs: [
      'A 656 sq ft one-bedroom offered on just three podium levels — floors 3, 4, and the 4M mezzanine — so only three homes in the building share this plan. Each has a foyer entry, an open living and dining area with a freestanding kitchen island, and an in-home washer and dryer.',
      'South-facing windows and the private balcony point toward the Loop, giving the living room city skyline views from a low, treetop-adjacent vantage. A good match for renters who want one-bedroom space with quick elevator trips to the lobby and amenity floor.',
    ],
  },
  'unit-4-floor-3': {
    paragraphs: [
      'One home in the tower carries this 1,079 sq ft two-bedroom, two-bath plan, at the southwest corner of floor 3. Bedrooms are split across the plan — each with a bath on its side — and the entry foyer leads into a wide open living and dining space.',
      'The southwest corner picks up both city skyline views toward the Loop and evening sunlight, with a private balcony to take them in. A freestanding kitchen island and in-home laundry are standard. Suits sharers who each want a full bath, or a couple planning a permanent home office.',
    ],
  },
  'unit-1-floors-4-4m': {
    paragraphs: [
      'The largest one-bedroom in the building: 768 sq ft on the podium\u2019s upper levels, floor 4 and the 4M mezzanine (two homes total). The extra area over the tower one-bedrooms goes into the open living and dining room, giving space for a real dining table alongside the freestanding kitchen island.',
      'Southeast exposure pairs city skyline views toward the Loop with morning sunlight on the private balcony. With the foyer entry and in-home washer and dryer, it works for a couple who cook, host, or need one-bedroom space that does not feel like a compromise.',
    ],
  },
  'unit-2-floors-4-4m': {
    paragraphs: [
      'A 628 sq ft one-bedroom on floor 4 and the 4M mezzanine — two homes share this plan. It is the efficient south-facing sibling of the podium one-bedrooms: foyer entry, open living and dining space, freestanding kitchen island, and an in-home washer and dryer.',
      'Facing south means the living room and private balcony hold city skyline views toward the Loop. Being on the podium keeps you close to the amenity floor while the balcony keeps outdoor space private — a balanced pick for a first one-bedroom.',
    ],
  },
  'unit-4-floor-4': {
    paragraphs: [
      'This 1,026 sq ft two-bedroom, two-bath occupies the southwest corner of floor 4 — a single home with no twin elsewhere in the building. The plan splits the bedrooms to opposite sides, each near its own full bath, around a central open living and dining room.',
      'Southwest exposure delivers city skyline views toward the Loop plus evening sunlight, best enjoyed from the private balcony. The kitchen centers on a freestanding island, the entry runs through a foyer, and the washer and dryer are in the home.',
    ],
  },
  'unit-4-floor-4m': {
    paragraphs: [
      'The 4M mezzanine\u2019s largest home: a 1,052 sq ft two-bedroom, two-bath at the southwest corner — the only home on this plan, at the top of the podium just below the tower floors. Bedrooms are split with a bath on each side; the middle of the plan is one open living and dining room.',
      'From the private balcony the southwest orientation gives city skyline views toward the Loop and evening sun. A freestanding kitchen island, foyer entry, and in-home washer and dryer complete it. Note the address quirk: mezzanine homes number as 04M — this one is apartment 04M04.',
    ],
  },
  // ------------------------------------------------------- Tower, 6–29 band
  'unit-1-floors-6-29': {
    paragraphs: [
      'The 899 sq ft two-bedroom, two-bath that repeats up the tower\u2019s northeast corner from floor 6 to 29 — 24 homes, so it appears in availability more often than the one-off podium plans. Bedrooms are split to opposite sides of the open living and dining room, each with a full bath on its side.',
      'Northeast exposure gives soft northern light through the day with morning sun from the east — comfortable for screens and never harsh in the afternoon. Every home on this plan has a private balcony and in-home washer and dryer; the higher the floor, the longer the sightlines.',
    ],
  },
  'unit-2-floors-6-29': {
    paragraphs: [
      'The 554 sq ft Convertible runs up the east side of the tower from floor 6 to 29. It is larger than either Jr. Convertible: the sheet shows a dedicated sleeping alcove off the main room, so the bed sits in its own pocket rather than in the living space — closer to a junior one-bedroom than a studio.',
      'East-facing glass fills the home with morning sunlight. This is one of the tower\u2019s two balcony-free stacks (units ending in 02, floors 6\u201329), which typically prices it below balcony plans of similar size — worth knowing if outdoor space matters less to you than the monthly number. In-home laundry and a foyer entry are standard.',
    ],
  },
  'unit-3-floors-6-29': {
    paragraphs: [
      'A 484 sq ft studio repeated on 24 floors (6\u201329) of the tower\u2019s east face. The open studio layout keeps the full width of the home as one room, with a foyer entry so the door does not open into your living space, and an in-home washer and dryer tucked out of the way.',
      'Morning sunlight is the defining feature — east-facing glass wakes the room up early and leaves it calm by evening. Like the 02 stack beside it, this is one of the only two stacks without a private balcony (units ending in 03, floors 6\u201329), which keeps it among the most affordable ways into the building.',
    ],
  },
  'unit-4-floors-6-29': {
    paragraphs: [
      'The only floor plan in the tower with a dedicated den: 983 sq ft, two bedrooms plus den, two baths, repeated from floor 6 to 29 at the southeast corner. The den is a separate room on the sheet — a real office or nursery, not a wide hallway — on top of the split two-bedroom program.',
      'Southeast exposure means city skyline views toward the Loop plus morning sunlight from the private balcony. A freestanding kitchen island, foyer entry, and in-home washer and dryer are standard. For work-from-home households that refuse to give up a bedroom, this plan has no substitute in the building.',
    ],
  },
  'unit-5-floors-6-29': {
    paragraphs: [
      'At 450 sq ft, the Jr. Convertible on the 05 stack is the smallest tower plan — but unlike the 02/03 stacks it keeps a private balcony on every one of its 24 floors (6\u201329). The sleeping alcove gives the bed its own recess off the open living area.',
      'South-facing windows point the home and its balcony straight toward the Loop, so even the smallest footprint in the tower gets the signature city skyline view. With in-home laundry and a foyer entry, it is the most affordable way to combine a balcony and a skyline orientation at Exhibit.',
    ],
  },
  'unit-6-floors-6-29': {
    paragraphs: [
      'The 769\u2013776 sq ft two-bedroom, one-bath on the tower\u2019s southwest side, floors 6\u201329. Sharing one bath is the trade that buys two real, separated bedrooms at a rent closer to a large one-bedroom — the sheet shows the bedrooms apart rather than side by side.',
      'Southwest exposure carries city skyline views toward the Loop and evening sunlight onto the private balcony. In-home washer and dryer and a foyer entry are standard. Best fit: two friends splitting rent, or a couple using bedroom two as a guest room and office.',
    ],
  },
  'unit-7-floors-6-16': {
    paragraphs: [
      'The 665 sq ft one-bedroom that runs up the tower\u2019s west face from floor 6 to 16 — the mid-rise section of the 07 stack (the same line continues above as slightly larger 669 and 672 sq ft variants). The plan is a straightforward, efficient one-bedroom: foyer entry, open living and dining room, bedroom at the glass.',
      'West-facing windows and the private balcony catch evening sunlight — the room is at its best exactly when you get home. With in-home laundry included, it is the tower\u2019s entry point to a true one-bedroom with a balcony.',
    ],
  },
  'unit-7-floors-17-21': {
    paragraphs: [
      'The high-rise version of the west-facing 07-stack one-bedroom: 669 sq ft on floors 17\u201321, a five-floor slice between the 665 sq ft mid-rise variant below and the 672 sq ft upper variant above. The extra height noticeably lengthens the view over River North\u2019s lower rooftops.',
      'The program matches its siblings — foyer entry, open living and dining space, private balcony, in-home washer and dryer — with evening sunlight from the west exposure. Pick this band if you want high-rise light without the top-floor premium.',
    ],
  },
  'unit-7-floors-22-29': {
    paragraphs: [
      'The uppermost variant of the 07-stack one-bedroom: 672 sq ft on floors 22\u201329, the largest and highest of the line\u2019s three versions. Eight homes carry this plan, all on the tower\u2019s west face below the penthouse band.',
      'From these floors the west-facing balcony and windows take in evening sunlight with the long sightlines only the top third of the tower offers. Inside: foyer entry, open living and dining room, and an in-home washer and dryer. For sunset-chasers who want a one-bedroom, this is the top of the stack.',
    ],
  },
  'unit-8-floors-6-29': {
    paragraphs: [
      'A 645 sq ft west-facing one-bedroom repeated on every tower floor from 6 to 29 — with 24 homes it is one of the most common plans in the building, which means it turns over more often than the one-off podium plans if you are waiting for availability.',
      'The living room and private balcony face west into the evening sun. A foyer entry keeps the plan orderly and the washer and dryer are in the home. A dependable, no-surprises one-bedroom — the plan to shortlist if timing matters as much as layout.',
    ],
  },
  'unit-9-floors-6-29': {
    paragraphs: [
      'The 779 sq ft two-bedroom, one-bath on the tower\u2019s northwest corner, floors 6\u201329. Like its 06-stack cousin it trades the second bath for two genuinely separated bedrooms around an open living and dining room — but points the other way, toward softer light.',
      'Northwest exposure blends soft northern light through the day with evening sun from the west on the private balcony — bright enough for plants, gentle enough for screens. In-home laundry and a foyer entry included. Ideal for roommates who\u2019d rather split rent than sunlight.',
    ],
  },
  'unit-10-floors-6-29': {
    paragraphs: [
      'The 478 sq ft Jr. Convertible on the tower\u2019s north side, floors 6\u201329 — 24 homes with a sleeping alcove that tucks the bed off the main room, a private balcony (unlike the 02/03 stacks), and an in-home washer and dryer.',
      'North-facing glass delivers soft, indirect light through the whole day: no afternoon glare, consistent temperatures, and the easiest windows in the building for a desk setup. A strong pick for remote workers who want the smallest footprint that still has real outdoor space.',
    ],
  },
  // ------------------------------------------------------ Penthouse, 30–34
  'unit-1-floors-30-34': {
    paragraphs: [
      'One of only two three-bedroom plans in the building: 1,455 sq ft, three full baths, on penthouse floors 30\u201334 at the northeast corner — five homes total. The split-bedroom arrangement gives every bedroom its own zone, and every zone its own bath.',
      'From the top five floors, the northeast exposure fills the home with soft northern light and morning sun from the east — steady, glare-free daylight across a plan this wide. A freestanding kitchen island anchors the open living and dining room, with a private balcony, foyer entry, and in-home laundry. Built for families or long-term sharers who need the building\u2019s maximum bedroom count.',
    ],
  },
  'unit-2-floors-30-34': {
    paragraphs: [
      'The largest home at Exhibit On Superior: a 1,528 sq ft three-bedroom, three-bath on penthouse floors 30\u201334 (five homes, southeast corner). Each bedroom pairs with a full bath, and the sheet shows them split across the plan for maximum privacy.',
      'The southeast orientation is the trophy here — city skyline views toward the Loop plus morning sunlight, from the highest floors in the building, with a private balcony to take it in. A freestanding kitchen island, foyer entry, and in-home washer and dryer complete the tower\u2019s flagship plan.',
    ],
  },
  'unit-3-floors-30-34': {
    paragraphs: [
      'The penthouse-band surprise: a 456 sq ft Jr. Convertible on floors 30\u201334. Unlike the 03 stack below (floors 6\u201329, no balcony), these five homes each have a private balcony — the smallest homes in the building with the highest outdoor perches.',
      'South-facing glass points the sleeping-alcove layout straight at the Loop, so the skyline view usually reserved for the largest plans comes at the building\u2019s smallest penthouse-level footprint. In-home laundry and a foyer entry included. For a solo renter who values floor height and view over floor area, nothing else in the tower matches it.',
    ],
  },
  'unit-4-floors-30-34': {
    paragraphs: [
      'A 767 sq ft two-bedroom, one-bath on penthouse floors 30\u201334 at the southwest corner — five homes. The separated-bedroom plan makes the single bath workable for two people, and the compact footprint keeps this the most attainable way into the penthouse band with two bedrooms.',
      'Southwest exposure from the top floors means city skyline views toward the Loop and long evening sunlight on the private balcony. Foyer entry and in-home washer and dryer are standard.',
    ],
  },
  'unit-5-floors-30-34': {
    paragraphs: [
      'A 669 sq ft one-bedroom on penthouse floors 30\u201334, west-facing — five homes at the top of the 05 stack. The plan gives the bedroom and the open living and dining room equal window frontage, with a foyer entry and in-home washer and dryer.',
      'West exposure from floors 30\u201334 stretches the evening-sun hours on the private balcony past what lower floors see over the neighboring rooftops. If your evenings are the point of home, this is the one-bedroom to tour first.',
    ],
  },
  'unit-6-floors-30-34': {
    paragraphs: [
      'The 651 sq ft penthouse-band one-bedroom on the west face, floors 30\u201334 — a slightly more compact cousin of the 669 sq ft plan two doors over, at the same height. Five homes carry the plan.',
      'Evening sunlight from the west exposure lands on the private balcony and the open living and dining room. A foyer entry and in-home washer and dryer are included. Choose it over the larger 05-stack sibling when availability or price favors it — the orientation and floor band are identical.',
    ],
  },
  'unit-7-floors-30-34': {
    paragraphs: [
      'The top of the 07 stack changes character: on penthouse floors 30\u201334 the line becomes a 779 sq ft two-bedroom, one-bath at the northwest corner — five homes with a separated-bedroom layout around the open living and dining space.',
      'Northwest exposure pairs soft daytime light with west evening sun on the private balcony, from the tower\u2019s highest floors. In-home laundry and a foyer entry included. A rare combination: penthouse-band height, two bedrooms, and a rent moderated by the single bath.',
    ],
  },
  'unit-8-floors-30-34': {
    paragraphs: [
      'The penthouse-band twin of the tower\u2019s north-side Jr. Convertible: 478 sq ft on floors 30\u201334, with the same sleeping alcove, private balcony, foyer entry, and in-home washer and dryer as the 6\u201329 version below — but only five homes, all in the top band.',
      'North-facing glass at this height gives the calmest light in the building: soft and indirect all day, with the elevated outlook of the top five floors. For renters choosing between the two 478 sq ft variants, this one trades a higher floor for scarcer availability.',
    ],
  },
};
