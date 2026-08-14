# Replit Setup

## Import

Upload or import the project folder into Replit with the root `package.json`, `.replit`, `pnpm-lock.yaml`, `app/`, `public/`, `content/`, and `docs/` folders intact.

## Run

The `.replit` file uses:

```bash
pnpm run dev:replit
```

For local development outside Replit:

```bash
pnpm install
pnpm run dev
pnpm run build
```

## Environment

Create the following environment variables in Replit Secrets when ready:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_GTM_ID`
- `NEXT_PUBLIC_LEASING_FORM_ENDPOINT`
- `NEXT_PUBLIC_TOUR_FORM_ENDPOINT`
- `NEXT_PUBLIC_APPLICATION_FORM_ENDPOINT`

Leave analytics IDs blank until owner-controlled tracking accounts are ready. Do not reuse old source-site tracking IDs unless ownership is confirmed.
