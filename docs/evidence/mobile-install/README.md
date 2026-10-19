# Install email verification

`email.html` and `email.txt` are generated from the actual template with the
fixture ref `r_aZ09bY18`. Both formats have Jest snapshots, and assertions check
the URL and all three commands against the site's shared install definitions.
These are preview artifacts, not emails sent through Resend.

Local validation: 105 Jest tests and two email snapshots pass; frontend and
Worker TypeScript builds, lint, and a Wrangler deployment dry run pass. The
PostgreSQL migration suite checks quota boundaries, 24-hour duplicate
suppression, failure retries, stale leases, and server-only permissions.

The browser's approval gate declined the local preview origin, so this run
could not capture new phone/dialog/email screenshots or compare desktop
screenshots against main. Automated UI tests cover the dialog, privacy,
phone note, shared install controls, ref propagation, and resize behavior.

Before release, capture phone hero/dialog/success/failure, `/install` on phone
and desktop, and the email. Compare the desktop hero to main at 768px, 1024px,
and 1440px. After domain verification and deployment, test inbox delivery and
rendering in Gmail, Apple Mail, and Outlook, and inspect SPF/DKIM headers.
