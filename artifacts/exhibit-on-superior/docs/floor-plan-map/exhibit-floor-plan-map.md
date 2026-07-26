# Exhibit On Superior — Floor Plan Logic & Unit Map

Generated 2026-07-26 directly from the website's floor-plan dataset (rentatexhibit.com).
Purpose: give an AI assistant everything needed to map any apartment unit number to its
floor plan, square footage, layout, floor, and building position band.

## 1. How unit numbers work (the core rule)

**Unit number = 2-digit floor + 2-digit unit line, always zero-padded (FFUU), except the "4M" mezzanine which uses `04M` + line (5 characters, AppFolio format).**

- Each floor plan is a **unit line**: a position on the floor plate (line 1–10) repeated across a range of floors.
- Example: unit line 6 on floor 6 → apartment **0606**. Unit line 2 on floors 30–34 → **3002, 3102, 3202, 3302, 3402**. Unit line 2 on the mezzanine → **04M02**.
- Single-digit floors ARE zero-padded (floor 6 → "06"), so a valid unit number is 4 digits ("203" → "0203") or the 5-character `04M` form.

## 2. The mezzanine rule (there is NO floor 5)

The building's podium has a mezzanine above floor 4. **It is its own level named "4M" — matching AppFolio — and is never renumbered to floor 5.**

- A plan sheet labeled `4M` exists only on the mezzanine level. AppFolio writes its apartments as `04M` + two-digit unit line (e.g. unit line 4 there is apartment **04M04**, 5 characters).
- A range ending in M includes the mezzanine: `4-4M` → floors 4 and 4M; `3-4M` → floors 3, 4, and 4M.
- The 4M level sorts between floor 4 and floor 6; unit numbers like "0502" do NOT exist.

## 3. Floor bands (building position)

| Band | Floors | Meaning |
|---|---|---|
| Podium | 2–4M | podium |
| Mid-Rise | 6–16 | mid |
| High-Rise | 17–29 | high |
| Penthouse | 30–34 | penthouse |

## 4. Layout categories

- **Studio** (`studio`)
- **Convertible / Jr. Convertible** (`convertible`)
- **1 Bed** (`1br`)
- **2 Bed** (`2br`)
- **3 Bed** (`3br`)
- Studio and Convertible layouts count as 0 bedrooms. "Jr. Convertible" is a smaller convertible.
- Square footage across the whole building: **448–1528 sq ft**.

## 5. How plans are grouped on the website

The site shows **27 floor-plan cards**, grouped from **34 sheet-level plans**. Plans with the same unit line + category + bath count + den flag are one "residence line" card; each floor-band variant may differ slightly in sq ft (layouts shift between the podium, tower, and penthouse floor plates). When mapping a specific apartment, always use the variant whose floor range contains that apartment's floor.

## 6. All 34 sheet-level plans (authoritative)

Columns: unit line; floor label as printed on the sheet; expanded floor range; layout; beds; baths; den; sq ft; the real apartment numbers it produces; the plan's website ID (used in `?plan=` deep links and image filenames).

| Line | Sheet label | Floors | Layout | Beds | Baths | Den | Sq Ft | Apartment #s | Plan ID |
|---|---|---|---|---|---|---|---|---|---|
| 5 | 2 | 2–2 | 2 Bed / 1 Bath | 2 | 1 | No | 821 | 0205 | unit-5-floor-2 |
| 6 | 2 | 2–2 | 1 Bed / 1 Bath | 1 | 1 | No | 619 | 0206 | unit-6-floor-2 |
| 7 | 2 | 2–2 | 1 Bed / 1 Bath | 1 | 1 | No | 630 | 0207 | unit-7-floor-2 |
| 8 | 2 | 2–2 | 2 Bed / 2 Bath | 2 | 2 | No | 1,003 | 0208 | unit-8-floor-2 |
| 9 | 2 | 2–2 | 2 Bed / 2 Bath | 2 | 2 | No | 929 | 0209 | unit-9-floor-2 |
| 10 | 2 | 2–2 | 2 Bed / 2 Bath | 2 | 2 | No | 935 | 0210 | unit-10-floor-2 |
| 1 | 3 | 3–3 | 2 Bed / 2 Bath | 2 | 2 | No | 1,135 | 0301 | unit-1-floor-3 |
| 2 | 3 | 3–3 | Studio | 0 | 1 | No | 448 | 0302 | unit-2-floor-3 |
| 3 | 3-4M | 3–4M | 1 Bed / 1 Bath | 1 | 1 | No | 656 | 0303, 0403, 04M03 | unit-3-floors-3-4m |
| 4 | 3 | 3–3 | 2 Bed / 2 Bath | 2 | 2 | No | 1,079 | 0304 | unit-4-floor-3 |
| 1 | 4-4M | 4–4M | 1 Bed / 1 Bath | 1 | 1 | No | 768 | 0401, 04M01 | unit-1-floors-4-4m |
| 2 | 4-4M | 4–4M | 1 Bed / 1 Bath | 1 | 1 | No | 628 | 0402, 04M02 | unit-2-floors-4-4m |
| 4 | 4 | 4–4 | 2 Bed / 2 Bath | 2 | 2 | No | 1,026 | 0404 | unit-4-floor-4 |
| 4 | 4M | 4M–4M | 2 Bed / 2 Bath | 2 | 2 | No | 1,052 | 04M04 | unit-4-floor-4m |
| 1 | 6-29 | 6–29 | 2 Bed / 2 Bath | 2 | 2 | No | 899 | 0601–2901 (24 units) | unit-1-floors-6-29 |
| 2 | 6-29 | 6–29 | Convertible | 0 | 1 | No | 554 | 0602–2902 (24 units) | unit-2-floors-6-29 |
| 3 | 6-29 | 6–29 | Studio | 0 | 1 | No | 484 | 0603–2903 (24 units) | unit-3-floors-6-29 |
| 4 | 6-29 | 6–29 | 2 Bed + Den / 2 Bath | 2 | 2 | Yes | 983 | 0604–2904 (24 units) | unit-4-floors-6-29 |
| 5 | 6-29 | 6–29 | Jr. Convertible | 0 | 1 | No | 450 | 0605–2905 (24 units) | unit-5-floors-6-29 |
| 6 | 6-29 | 6–29 | 2 Bed / 1 Bath | 2 | 1 | No | 769–776 | 0606–2906 (24 units) | unit-6-floors-6-29 |
| 7 | 6-16 | 6–16 | 1 Bed / 1 Bath | 1 | 1 | No | 665 | 0607–1607 (11 units) | unit-7-floors-6-16 |
| 8 | 6-29 | 6–29 | 1 Bed / 1 Bath | 1 | 1 | No | 645 | 0608–2908 (24 units) | unit-8-floors-6-29 |
| 9 | 6-29 | 6–29 | 2 Bed / 1 Bath | 2 | 1 | No | 779 | 0609–2909 (24 units) | unit-9-floors-6-29 |
| 10 | 6-29 | 6–29 | Jr. Convertible | 0 | 1 | No | 478 | 0610–2910 (24 units) | unit-10-floors-6-29 |
| 1 | 30-34 | 30–34 | 3 Bed / 3 Bath | 3 | 3 | No | 1,455 | 3001, 3101, 3201, 3301, 3401 | unit-1-floors-30-34 |
| 2 | 30-34 | 30–34 | 3 Bed / 3 Bath | 3 | 3 | No | 1,528 | 3002, 3102, 3202, 3302, 3402 | unit-2-floors-30-34 |
| 3 | 30-34 | 30–34 | Jr. Convertible | 0 | 1 | No | 456 | 3003, 3103, 3203, 3303, 3403 | unit-3-floors-30-34 |
| 4 | 30-34 | 30–34 | 2 Bed / 1 Bath | 2 | 1 | No | 767 | 3004, 3104, 3204, 3304, 3404 | unit-4-floors-30-34 |
| 5 | 30-34 | 30–34 | 1 Bed / 1 Bath | 1 | 1 | No | 669 | 3005, 3105, 3205, 3305, 3405 | unit-5-floors-30-34 |
| 6 | 30-34 | 30–34 | 1 Bed / 1 Bath | 1 | 1 | No | 651 | 3006, 3106, 3206, 3306, 3406 | unit-6-floors-30-34 |
| 7 | 30-34 | 30–34 | 2 Bed / 1 Bath | 2 | 1 | No | 779 | 3007, 3107, 3207, 3307, 3407 | unit-7-floors-30-34 |
| 8 | 30-34 | 30–34 | Jr. Convertible | 0 | 1 | No | 478 | 3008, 3108, 3208, 3308, 3408 | unit-8-floors-30-34 |
| 7 | 22-29 | 22–29 | 1 Bed / 1 Bath | 1 | 1 | No | 672 | 2207–2907 (8 units) | unit-7-floors-22-29 |
| 7 | 17-21 | 17–21 | 1 Bed / 1 Bath | 1 | 1 | No | 669 | 1707, 1807, 1907, 2007, 2107 | unit-7-floors-17-21 |

## 7. The 27 website floor-plan cards (grouped view)

| Line | Layout | Category | Sq Ft | Bands | Sheet variants | Total units | Card ID |
|---|---|---|---|---|---|---|---|
| 5 | 2 Bed / 1 Bath | 2 Bed | 821 | Podium (2–4M) | 2 | 1 | 5-2br-1-std |
| 6 | 1 Bed / 1 Bath | 1 Bed | 619–651 | Podium (2–4M), Penthouse (30–34) | 2; 30-34 | 6 | 6-1br-1-std |
| 7 | 1 Bed / 1 Bath | 1 Bed | 630–672 | Podium (2–4M), Mid-Rise (6–16), High-Rise (17–29) | 2; 6-16; 17-21; 22-29 | 25 | 7-1br-1-std |
| 8 | 2 Bed / 2 Bath | 2 Bed | 1003 | Podium (2–4M) | 2 | 1 | 8-2br-2-std |
| 9 | 2 Bed / 2 Bath | 2 Bed | 929 | Podium (2–4M) | 2 | 1 | 9-2br-2-std |
| 10 | 2 Bed / 2 Bath | 2 Bed | 935 | Podium (2–4M) | 2 | 1 | 10-2br-2-std |
| 1 | 2 Bed / 2 Bath | 2 Bed | 899–1135 | Podium (2–4M), Mid-Rise (6–16), High-Rise (17–29) | 3; 6-29 | 25 | 1-2br-2-std |
| 2 | Studio | Studio | 448 | Podium (2–4M) | 3 | 1 | 2-studio-1-std |
| 3 | 1 Bed / 1 Bath | 1 Bed | 656 | Podium (2–4M) | 3-4M | 3 | 3-1br-1-std |
| 4 | 2 Bed / 2 Bath | 2 Bed | 1026–1079 | Podium (2–4M) | 3; 4; 4M | 3 | 4-2br-2-std |
| 1 | 1 Bed / 1 Bath | 1 Bed | 768 | Podium (2–4M) | 4-4M | 2 | 1-1br-1-std |
| 2 | 1 Bed / 1 Bath | 1 Bed | 628 | Podium (2–4M) | 4-4M | 2 | 2-1br-1-std |
| 2 | Convertible | Convertible / Jr. Convertible | 554 | Mid-Rise (6–16), High-Rise (17–29) | 6-29 | 24 | 2-convertible-1-std |
| 3 | Studio | Studio | 484 | Mid-Rise (6–16), High-Rise (17–29) | 6-29 | 24 | 3-studio-1-std |
| 4 | 2 Bed + Den / 2 Bath | 2 Bed | 983 | Mid-Rise (6–16), High-Rise (17–29) | 6-29 | 24 | 4-2br-2-den |
| 5 | Jr. Convertible | Convertible / Jr. Convertible | 450 | Mid-Rise (6–16), High-Rise (17–29) | 6-29 | 24 | 5-convertible-1-std |
| 6 | 2 Bed / 1 Bath | 2 Bed | 769–776 | Mid-Rise (6–16), High-Rise (17–29) | 6-29 | 24 | 6-2br-1-std |
| 8 | 1 Bed / 1 Bath | 1 Bed | 645 | Mid-Rise (6–16), High-Rise (17–29) | 6-29 | 24 | 8-1br-1-std |
| 9 | 2 Bed / 1 Bath | 2 Bed | 779 | Mid-Rise (6–16), High-Rise (17–29) | 6-29 | 24 | 9-2br-1-std |
| 10 | Jr. Convertible | Convertible / Jr. Convertible | 478 | Mid-Rise (6–16), High-Rise (17–29) | 6-29 | 24 | 10-convertible-1-std |
| 1 | 3 Bed / 3 Bath | 3 Bed | 1455 | Penthouse (30–34) | 30-34 | 5 | 1-3br-3-std |
| 2 | 3 Bed / 3 Bath | 3 Bed | 1528 | Penthouse (30–34) | 30-34 | 5 | 2-3br-3-std |
| 3 | Jr. Convertible | Convertible / Jr. Convertible | 456 | Penthouse (30–34) | 30-34 | 5 | 3-convertible-1-std |
| 4 | 2 Bed / 1 Bath | 2 Bed | 767 | Penthouse (30–34) | 30-34 | 5 | 4-2br-1-std |
| 5 | 1 Bed / 1 Bath | 1 Bed | 669 | Penthouse (30–34) | 30-34 | 5 | 5-1br-1-std |
| 7 | 2 Bed / 1 Bath | 2 Bed | 779 | Penthouse (30–34) | 30-34 | 5 | 7-2br-1-std |
| 8 | Jr. Convertible | Convertible / Jr. Convertible | 478 | Penthouse (30–34) | 30-34 | 5 | 8-convertible-1-std |

## 8. Complete unit roster by floor (298 apartments)

### Floor 2 — Podium band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 0205 | 2 Bed / 1 Bath | 821 | unit-5-floor-2 |
| 0206 | 1 Bed / 1 Bath | 619 | unit-6-floor-2 |
| 0207 | 1 Bed / 1 Bath | 630 | unit-7-floor-2 |
| 0208 | 2 Bed / 2 Bath | 1,003 | unit-8-floor-2 |
| 0209 | 2 Bed / 2 Bath | 929 | unit-9-floor-2 |
| 0210 | 2 Bed / 2 Bath | 935 | unit-10-floor-2 |

### Floor 3 — Podium band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 0301 | 2 Bed / 2 Bath | 1,135 | unit-1-floor-3 |
| 0302 | Studio | 448 | unit-2-floor-3 |
| 0303 | 1 Bed / 1 Bath | 656 | unit-3-floors-3-4m |
| 0304 | 2 Bed / 2 Bath | 1,079 | unit-4-floor-3 |

### Floor 4 — Podium band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 0401 | 1 Bed / 1 Bath | 768 | unit-1-floors-4-4m |
| 0402 | 1 Bed / 1 Bath | 628 | unit-2-floors-4-4m |
| 0403 | 1 Bed / 1 Bath | 656 | unit-3-floors-3-4m |
| 0404 | 2 Bed / 2 Bath | 1,026 | unit-4-floor-4 |

### Floor 4M (the "4M" mezzanine level) — Podium band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 04M01 | 1 Bed / 1 Bath | 768 | unit-1-floors-4-4m |
| 04M02 | 1 Bed / 1 Bath | 628 | unit-2-floors-4-4m |
| 04M03 | 1 Bed / 1 Bath | 656 | unit-3-floors-3-4m |
| 04M04 | 2 Bed / 2 Bath | 1,052 | unit-4-floor-4m |

### Floor 6 — Mid-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 0601 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 0602 | Convertible | 554 | unit-2-floors-6-29 |
| 0603 | Studio | 484 | unit-3-floors-6-29 |
| 0604 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 0605 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 0606 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 0607 | 1 Bed / 1 Bath | 665 | unit-7-floors-6-16 |
| 0608 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 0609 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 0610 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 7 — Mid-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 0701 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 0702 | Convertible | 554 | unit-2-floors-6-29 |
| 0703 | Studio | 484 | unit-3-floors-6-29 |
| 0704 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 0705 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 0706 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 0707 | 1 Bed / 1 Bath | 665 | unit-7-floors-6-16 |
| 0708 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 0709 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 0710 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 8 — Mid-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 0801 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 0802 | Convertible | 554 | unit-2-floors-6-29 |
| 0803 | Studio | 484 | unit-3-floors-6-29 |
| 0804 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 0805 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 0806 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 0807 | 1 Bed / 1 Bath | 665 | unit-7-floors-6-16 |
| 0808 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 0809 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 0810 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 9 — Mid-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 0901 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 0902 | Convertible | 554 | unit-2-floors-6-29 |
| 0903 | Studio | 484 | unit-3-floors-6-29 |
| 0904 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 0905 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 0906 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 0907 | 1 Bed / 1 Bath | 665 | unit-7-floors-6-16 |
| 0908 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 0909 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 0910 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 10 — Mid-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 1001 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 1002 | Convertible | 554 | unit-2-floors-6-29 |
| 1003 | Studio | 484 | unit-3-floors-6-29 |
| 1004 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 1005 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 1006 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 1007 | 1 Bed / 1 Bath | 665 | unit-7-floors-6-16 |
| 1008 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 1009 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 1010 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 11 — Mid-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 1101 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 1102 | Convertible | 554 | unit-2-floors-6-29 |
| 1103 | Studio | 484 | unit-3-floors-6-29 |
| 1104 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 1105 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 1106 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 1107 | 1 Bed / 1 Bath | 665 | unit-7-floors-6-16 |
| 1108 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 1109 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 1110 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 12 — Mid-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 1201 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 1202 | Convertible | 554 | unit-2-floors-6-29 |
| 1203 | Studio | 484 | unit-3-floors-6-29 |
| 1204 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 1205 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 1206 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 1207 | 1 Bed / 1 Bath | 665 | unit-7-floors-6-16 |
| 1208 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 1209 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 1210 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 13 — Mid-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 1301 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 1302 | Convertible | 554 | unit-2-floors-6-29 |
| 1303 | Studio | 484 | unit-3-floors-6-29 |
| 1304 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 1305 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 1306 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 1307 | 1 Bed / 1 Bath | 665 | unit-7-floors-6-16 |
| 1308 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 1309 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 1310 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 14 — Mid-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 1401 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 1402 | Convertible | 554 | unit-2-floors-6-29 |
| 1403 | Studio | 484 | unit-3-floors-6-29 |
| 1404 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 1405 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 1406 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 1407 | 1 Bed / 1 Bath | 665 | unit-7-floors-6-16 |
| 1408 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 1409 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 1410 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 15 — Mid-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 1501 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 1502 | Convertible | 554 | unit-2-floors-6-29 |
| 1503 | Studio | 484 | unit-3-floors-6-29 |
| 1504 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 1505 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 1506 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 1507 | 1 Bed / 1 Bath | 665 | unit-7-floors-6-16 |
| 1508 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 1509 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 1510 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 16 — Mid-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 1601 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 1602 | Convertible | 554 | unit-2-floors-6-29 |
| 1603 | Studio | 484 | unit-3-floors-6-29 |
| 1604 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 1605 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 1606 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 1607 | 1 Bed / 1 Bath | 665 | unit-7-floors-6-16 |
| 1608 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 1609 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 1610 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 17 — High-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 1701 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 1702 | Convertible | 554 | unit-2-floors-6-29 |
| 1703 | Studio | 484 | unit-3-floors-6-29 |
| 1704 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 1705 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 1706 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 1707 | 1 Bed / 1 Bath | 669 | unit-7-floors-17-21 |
| 1708 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 1709 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 1710 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 18 — High-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 1801 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 1802 | Convertible | 554 | unit-2-floors-6-29 |
| 1803 | Studio | 484 | unit-3-floors-6-29 |
| 1804 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 1805 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 1806 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 1807 | 1 Bed / 1 Bath | 669 | unit-7-floors-17-21 |
| 1808 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 1809 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 1810 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 19 — High-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 1901 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 1902 | Convertible | 554 | unit-2-floors-6-29 |
| 1903 | Studio | 484 | unit-3-floors-6-29 |
| 1904 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 1905 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 1906 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 1907 | 1 Bed / 1 Bath | 669 | unit-7-floors-17-21 |
| 1908 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 1909 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 1910 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 20 — High-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 2001 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 2002 | Convertible | 554 | unit-2-floors-6-29 |
| 2003 | Studio | 484 | unit-3-floors-6-29 |
| 2004 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 2005 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 2006 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 2007 | 1 Bed / 1 Bath | 669 | unit-7-floors-17-21 |
| 2008 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 2009 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 2010 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 21 — High-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 2101 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 2102 | Convertible | 554 | unit-2-floors-6-29 |
| 2103 | Studio | 484 | unit-3-floors-6-29 |
| 2104 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 2105 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 2106 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 2107 | 1 Bed / 1 Bath | 669 | unit-7-floors-17-21 |
| 2108 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 2109 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 2110 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 22 — High-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 2201 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 2202 | Convertible | 554 | unit-2-floors-6-29 |
| 2203 | Studio | 484 | unit-3-floors-6-29 |
| 2204 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 2205 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 2206 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 2207 | 1 Bed / 1 Bath | 672 | unit-7-floors-22-29 |
| 2208 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 2209 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 2210 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 23 — High-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 2301 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 2302 | Convertible | 554 | unit-2-floors-6-29 |
| 2303 | Studio | 484 | unit-3-floors-6-29 |
| 2304 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 2305 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 2306 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 2307 | 1 Bed / 1 Bath | 672 | unit-7-floors-22-29 |
| 2308 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 2309 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 2310 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 24 — High-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 2401 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 2402 | Convertible | 554 | unit-2-floors-6-29 |
| 2403 | Studio | 484 | unit-3-floors-6-29 |
| 2404 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 2405 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 2406 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 2407 | 1 Bed / 1 Bath | 672 | unit-7-floors-22-29 |
| 2408 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 2409 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 2410 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 25 — High-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 2501 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 2502 | Convertible | 554 | unit-2-floors-6-29 |
| 2503 | Studio | 484 | unit-3-floors-6-29 |
| 2504 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 2505 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 2506 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 2507 | 1 Bed / 1 Bath | 672 | unit-7-floors-22-29 |
| 2508 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 2509 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 2510 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 26 — High-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 2601 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 2602 | Convertible | 554 | unit-2-floors-6-29 |
| 2603 | Studio | 484 | unit-3-floors-6-29 |
| 2604 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 2605 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 2606 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 2607 | 1 Bed / 1 Bath | 672 | unit-7-floors-22-29 |
| 2608 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 2609 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 2610 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 27 — High-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 2701 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 2702 | Convertible | 554 | unit-2-floors-6-29 |
| 2703 | Studio | 484 | unit-3-floors-6-29 |
| 2704 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 2705 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 2706 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 2707 | 1 Bed / 1 Bath | 672 | unit-7-floors-22-29 |
| 2708 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 2709 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 2710 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 28 — High-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 2801 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 2802 | Convertible | 554 | unit-2-floors-6-29 |
| 2803 | Studio | 484 | unit-3-floors-6-29 |
| 2804 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 2805 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 2806 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 2807 | 1 Bed / 1 Bath | 672 | unit-7-floors-22-29 |
| 2808 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 2809 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 2810 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 29 — High-Rise band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 2901 | 2 Bed / 2 Bath | 899 | unit-1-floors-6-29 |
| 2902 | Convertible | 554 | unit-2-floors-6-29 |
| 2903 | Studio | 484 | unit-3-floors-6-29 |
| 2904 | 2 Bed + Den / 2 Bath | 983 | unit-4-floors-6-29 |
| 2905 | Jr. Convertible | 450 | unit-5-floors-6-29 |
| 2906 | 2 Bed / 1 Bath | 769–776 | unit-6-floors-6-29 |
| 2907 | 1 Bed / 1 Bath | 672 | unit-7-floors-22-29 |
| 2908 | 1 Bed / 1 Bath | 645 | unit-8-floors-6-29 |
| 2909 | 2 Bed / 1 Bath | 779 | unit-9-floors-6-29 |
| 2910 | Jr. Convertible | 478 | unit-10-floors-6-29 |

### Floor 30 — Penthouse band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 3001 | 3 Bed / 3 Bath | 1,455 | unit-1-floors-30-34 |
| 3002 | 3 Bed / 3 Bath | 1,528 | unit-2-floors-30-34 |
| 3003 | Jr. Convertible | 456 | unit-3-floors-30-34 |
| 3004 | 2 Bed / 1 Bath | 767 | unit-4-floors-30-34 |
| 3005 | 1 Bed / 1 Bath | 669 | unit-5-floors-30-34 |
| 3006 | 1 Bed / 1 Bath | 651 | unit-6-floors-30-34 |
| 3007 | 2 Bed / 1 Bath | 779 | unit-7-floors-30-34 |
| 3008 | Jr. Convertible | 478 | unit-8-floors-30-34 |

### Floor 31 — Penthouse band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 3101 | 3 Bed / 3 Bath | 1,455 | unit-1-floors-30-34 |
| 3102 | 3 Bed / 3 Bath | 1,528 | unit-2-floors-30-34 |
| 3103 | Jr. Convertible | 456 | unit-3-floors-30-34 |
| 3104 | 2 Bed / 1 Bath | 767 | unit-4-floors-30-34 |
| 3105 | 1 Bed / 1 Bath | 669 | unit-5-floors-30-34 |
| 3106 | 1 Bed / 1 Bath | 651 | unit-6-floors-30-34 |
| 3107 | 2 Bed / 1 Bath | 779 | unit-7-floors-30-34 |
| 3108 | Jr. Convertible | 478 | unit-8-floors-30-34 |

### Floor 32 — Penthouse band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 3201 | 3 Bed / 3 Bath | 1,455 | unit-1-floors-30-34 |
| 3202 | 3 Bed / 3 Bath | 1,528 | unit-2-floors-30-34 |
| 3203 | Jr. Convertible | 456 | unit-3-floors-30-34 |
| 3204 | 2 Bed / 1 Bath | 767 | unit-4-floors-30-34 |
| 3205 | 1 Bed / 1 Bath | 669 | unit-5-floors-30-34 |
| 3206 | 1 Bed / 1 Bath | 651 | unit-6-floors-30-34 |
| 3207 | 2 Bed / 1 Bath | 779 | unit-7-floors-30-34 |
| 3208 | Jr. Convertible | 478 | unit-8-floors-30-34 |

### Floor 33 — Penthouse band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 3301 | 3 Bed / 3 Bath | 1,455 | unit-1-floors-30-34 |
| 3302 | 3 Bed / 3 Bath | 1,528 | unit-2-floors-30-34 |
| 3303 | Jr. Convertible | 456 | unit-3-floors-30-34 |
| 3304 | 2 Bed / 1 Bath | 767 | unit-4-floors-30-34 |
| 3305 | 1 Bed / 1 Bath | 669 | unit-5-floors-30-34 |
| 3306 | 1 Bed / 1 Bath | 651 | unit-6-floors-30-34 |
| 3307 | 2 Bed / 1 Bath | 779 | unit-7-floors-30-34 |
| 3308 | Jr. Convertible | 478 | unit-8-floors-30-34 |

### Floor 34 — Penthouse band

| Unit # | Layout | Sq Ft | Plan ID |
|---|---|---|---|
| 3401 | 3 Bed / 3 Bath | 1,455 | unit-1-floors-30-34 |
| 3402 | 3 Bed / 3 Bath | 1,528 | unit-2-floors-30-34 |
| 3403 | Jr. Convertible | 456 | unit-3-floors-30-34 |
| 3404 | 2 Bed / 1 Bath | 767 | unit-4-floors-30-34 |
| 3405 | 1 Bed / 1 Bath | 669 | unit-5-floors-30-34 |
| 3406 | 1 Bed / 1 Bath | 651 | unit-6-floors-30-34 |
| 3407 | 2 Bed / 1 Bath | 779 | unit-7-floors-30-34 |
| 3408 | Jr. Convertible | 478 | unit-8-floors-30-34 |

---
*Regenerate after any dataset change: `pnpm --filter @workspace/exhibit-on-superior exec tsx scripts/generate-floor-plan-map.ts`. Source of truth: `src/data/floorPlans.ts`. No pricing/availability here by design — that lives in AppFolio.*
