# Publishing through GoHighLevel Funnels

Who does what:

| Piece | Role |
|---|---|
| **GitHub** (`anncbk/Cashflow-Game`) | Source of truth. Edit here, push here. GitHub Pages also serves every asset (CSS, JS, images, the `.ics`) at `https://anncbk.github.io/Cashflow-Game/site/` — call that **BASE**. |
| **GHL → Sites → Funnels** | The official, published URLs. One funnel, two steps: **Landing Page → Thank You**. |
| **GHL Form** `w7kI51nYMyGytQtdXI7y` ("Investor's Roundtable Sep 2026") | Registration + payment. Every submission lands in **Contacts** and can trigger a **Workflow**. It is already the form embedded in `index.html`. |

Both pages use relative asset paths and are pasted into GHL the same way: run the
one-liner in §2 to make the paths absolute, then paste the `<body>`. `thank-you.html`
is one screen and needs no script, so it is the easier of the two.

## 0. Before touching GHL

1. Push to GitHub and confirm the assets are live:
   ```bash
   for f in styles.css app.js thank-you.html images/16-hosts-bg.jpg images/hero4/crestbrick-logo.svg; do
     printf '%-28s ' "$f"; curl -s -o /dev/null -w '%{http_code}\n' "https://anncbk.github.io/Cashflow-Game/site/$f"
   done
   ```
   Every line must say `200`. A new image that is referenced but not committed 404s on the live page.
2. **Repo layout warning.** `origin/main` keeps the site under `site/` (plus a root `README.md`); this
   working copy has the site at its root and is 2 commits ahead / 14 behind. Reconcile that before
   pushing — merge, do not force-push.

## 1. Create the funnel

Sites → Funnels → **+ New Funnel** → name `Investor's Roundtable – Sep 2026`.
Add two steps, in this order:

| Step | Name | Path | Content |
|---|---|---|---|
| 1 | Landing Page | `/roundtable` | `index.html` |
| 2 | Thank You | `/roundtable/thank-you` | `thank-you.html` |

Settings → Domain: attach the domain the links will use. Note the full URL of step 2 — the form
needs it in §3.

## 2. Step 1 — the landing page

Open step 1 in the editor. Add one **Section** (full width, padding 0, background `#0A0E11`) →
one **Row** → one **Custom JS/HTML** element. Paste the `<body>` of `index.html` with its asset
paths made absolute — generate that copy, never hand-edit it:

```bash
sed -E 's#(src|href)="(images/|Assets/|media/|styles\.css|app\.js)#\1="https://anncbk.github.io/Cashflow-Game/site/\2#g' index.html > /tmp/index.ghl.html
```

Then paste from `<body>` to `</body>` of `/tmp/index.ghl.html` (leave out the `<head>`; the
`<link>` for fonts and `styles.css` must be added to the element too — copy the four `<link>`
lines from the head, they are safe inside the body).

The form is already inside that markup as an iframe, so registration data flows into Contacts
unchanged. Set the page's SEO meta to **noindex** (the page is unlisted on purpose, same as
`robots.txt` on GitHub Pages).

Alternative if the editor fights the paste: keep step 1 as a thin page whose only element is a
full-height iframe of `https://anncbk.github.io/Cashflow-Game/site/`. Data and redirect work the
same way, but the funnel URL then wraps another URL — use it as a fallback, not the plan.

## 3. Step 2 — the thank-you page

Open step 2. Same shell: one Section (full width, padding 0, background `#0A0E11`) → Row →
**Custom JS/HTML**. Make the paths absolute the same way and paste the `<body>` plus the two
`<link>` lines (Google Fonts and `styles.css`) from the head:

```bash
sed -E 's#(src|href)="(images/|Assets/|media/|styles\.css|app\.js)#\1="https://anncbk.github.io/Cashflow-Game/site/\2#g' thank-you.html > /tmp/thank-you.ghl.html
```

SEO meta: **noindex**. There is no script on this page, so nothing else to wire.

Now point the form at it. **Sites → Forms → Builder → open `Investor's Roundtable Sep 2026` →
Options → On Submit → Open URL** (a.k.a. "Redirect to URL") → paste the step-2 URL from §1 →
Save. That one setting is what turns two pages into a funnel: submit → pay → land on Thank You.
(If you rebuild step 1 with GHL's native Form element instead of the iframe, choose the form
there and set its submit action to the next step; the result is the same.)

## 4. Data → Contacts and workflow

Submissions of this form create or update a **Contact** automatically. The thank-you page
promises "your confirmation and receipt are on their way", so a workflow must send them:

Automation → Workflows → **+ Create** →
- Trigger: **Form Submitted**, filter *Form is* `Investor's Roundtable Sep 2026`.
- Actions: **Add Tag** `roundtable-sep-2026` → **Send Email** (confirmation with date, time,
  Level 3 Room 320, 7:00 PM registration, 7:30 PM sharp) → optional **Send WhatsApp/SMS** →
  **Internal Notification** to the team.
- Payment receipts come from GHL Payments on the form's own payment element; nothing to add.

## 5. Test before sharing the link

- Submit the form once with a real email. Check: Contact created with the tag · workflow ran ·
  browser landed on the step-2 URL · page renders in Manrope, no white flash, no horizontal
  scroll at ~380px.
- Click **Add to Calendar**; the Google Calendar event should show 11 Sep 2026, 7:00–10:30 PM
  SGT, Suntec City Convention Centre.
