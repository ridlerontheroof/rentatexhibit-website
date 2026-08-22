# SMS consent production verification — pending

**Initially checked:** 2026-08-19, after the 14:46 UTC publish

**Most recently checked:** 2026-08-22

**Purpose:** evidence for SimpleVoIP A2P registration that the website records an
explicit SMS-consent decision for real leads.

## Current result

The deployed production database schema includes `leads.sms_consent` as a
nullable boolean. The post-publish data check is **partially confirmed, but not
yet complete**:

| SMS consent value | Production leads |
| --- | ---: |
| `true` | 2 |
| `false` | 0 |
| `NULL` | 19 |

Two post-publish tour leads submitted on **2026-08-21** and **2026-08-22** have
`sms_consent = true` and a populated notification timestamp. This confirms that
the production write path preserves an opt-in selection and that the leasing
notification sender accepted both messages. The 19 `NULL` values are legacy
leads that predate the consent-enabled deployment.

No production lead has yet submitted `sms_consent = false`, so the required
declined-consent write cannot yet be confirmed.

## Email verification status

The deployed notification template is wired to include an `SMS consent` row
when the saved value is non-null:

- `true` renders as **Opted in**
- `false` renders as **Declined**
- `NULL` omits the row for legacy leads

The two opted-in leads were marked as notified after the SMTP sender accepted
their messages. A direct read of the sender's Sent Mail mailbox was unavailable
during this check, so the visible inbox row is still awaiting a leasing-team
spot-check. No declined-consent lead exists yet to verify the corresponding
row.

## Required final spot-check

After new real leads have been received with both choices, run this read-only
production query:

```sql
SELECT sms_consent, count(*)
FROM leads
GROUP BY sms_consent;
```

Then confirm:

1. At least one `true` row and at least one `false` row exist.
2. The matching new lead notifications in the leasing inbox show
   `SMS consent: Opted in` and `SMS consent: Declined`.
3. Update this report with the grouped counts and verification date before
   citing it in the SimpleVoIP A2P registration packet.