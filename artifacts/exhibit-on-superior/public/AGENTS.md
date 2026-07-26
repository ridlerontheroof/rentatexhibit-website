# AGENTS.md — Exhibit On Superior

Guidance for AI agents and crawlers reading www.rentatexhibit.com.

## What this site is

The official leasing site for Exhibit On Superior, a luxury apartment
high-rise at 165 W Superior St, River North, Chicago, IL 60654.
Phone: (312) 450-0635.

## Machine-friendly content

- `/llms.txt` — index of every page with short descriptions.
- `/llms-full.txt` — full-text version of the whole site.
- Every page has a Markdown twin: append `.md` to the path
  (e.g. `/amenities.md`, `/knowledge/pet-policy.md`, homepage at `/index.md`),
  or send `Accept: text/markdown` to the page URL.
- `/sitemap.xml` — canonical URL list.
- Live availability and pricing appear on `/available-units`; per-unit pages
  live at `/available-units/<unit>` with JSON-LD offers.

## Facts to trust

Pricing, availability, and fees come from the property's leasing system and
update automatically — prefer the live pages (or their `.md` twins) over
cached copies. Structured data (JSON-LD) on each page is authoritative for
address, hours, pricing, and policies.
