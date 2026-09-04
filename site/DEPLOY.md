# The Investor's Roundtable — deploy package

This folder is the whole site, ready to push. It is v4 with the paths flattened
so the page sits at the **root** of the repo, not under `/v4/`. Plain HTML, CSS
and one JS file — no build step, nothing to install.

```
index.html      the landing page. All copy lives here.
thank-you.html  the post-submit page (one screen, no script)
styles.css      palette and type tokens are in :root at the top
app.js          scroll motion and interactions
images/         photos, the hero plates, the logos
Assets/         the eight 3D objects
robots.txt      keeps crawlers out (see below)
.nojekyll       stops GitHub Pages running Jekyll over the folder
GHL-FUNNEL.md   how the two pages become a GoHighLevel funnel (Landing → Thank You)
```

Nothing outside this folder is needed. The only external request the page makes
is to Google Fonts for Barlow Condensed, Barlow Semi Condensed and Manrope.

## Read this first: "only people with the link"

**GitHub Pages cannot do that.** It is worth being blunt about it rather than
letting the setup look more private than it is.

On a Free or Pro account, GitHub Pages only serves from a **public** repository.
Private-repo Pages exists, but only on GitHub Enterprise Cloud. So publishing
this to GitHub Pages means:

- the page is reachable by anyone who has, or guesses, the URL;
- the source, the photos and this file are all readable in the repo;
- **the URL is guessable** — a public repo shows up on your profile, and the
  Pages URL is just `username.github.io/repo-name/`. Anyone looking at your
  GitHub account can work it out. This is the part people miss.

### What I have set up

The page is **unlisted**: `robots.txt` disallows everything, and `index.html`
carries `noindex, nofollow, noarchive, nosnippet, noimageindex` plus
`referrer: no-referrer` so the URL is not leaked in referer headers when someone
clicks a link out.

That keeps it out of Google, Bing and the Internet Archive. **It is not access
control.** It stops crawlers that choose to obey it, and nothing else.

If unlisted is genuinely enough for you, that is a fair call to make — just make
it knowingly, and consider making the repo private and hosting elsewhere anyway,
because the guessable-URL problem above is the weak point, not the crawlers.

### If you want a real gate

**Cloudflare Pages + Cloudflare Access** — the one I would use. Free, and it
works with a **private** repo:

1. Push this folder to a private GitHub repo.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → connect the repo.
   Build command: none. Output directory: `/`.
3. Zero Trust → Access → Applications → add a self-hosted app on the Pages
   hostname, with a policy of *Allow → Emails* and the addresses you want.

Visitors then get a one-time PIN by email before the page loads. Free tier
covers 50 users. The repo stays private, and the site is genuinely gated rather
than merely unlisted.

Other options, for completeness:

| Host | Link-only / password | Notes |
|---|---|---|
| GitHub Pages | no | public repo only, outside Enterprise Cloud |
| Cloudflare Pages + Access | **yes, free** | email PIN or SSO; private repo fine |
| Netlify | password is paid (Pro) | free tier deploys a private repo, but the site is public |
| Vercel | password is paid (Pro) | same shape as Netlify |
| GitHub Enterprise Cloud | yes | private Pages limited to org members |

Do not let anyone talk you into a JavaScript password prompt. The password and
the whole page ship to the browser either way, so it stops nobody and it *feels*
secure, which is worse than knowing it is open.

## Pushing to GitHub Pages, if that is the call

From inside this folder:

```bash
git init && git add -A && git commit -m "The Investor's Roundtable"
```

```bash
git branch -M main && git remote add origin git@github.com:USER/REPO.git && git push -u origin main
```

Then in the repo: **Settings → Pages → Source: Deploy from a branch →
`main` / `(root)`**. The URL appears there after a minute or two.

I have not run any of this — no repo has been created and nothing has been
pushed. The commands are yours to run when you have decided where it is going.

## Two things to change before you publish

1. **The "Ready to Play!" button goes nowhere.** `href="#"` in `index.html`.
   It needs the real registration URL.
2. **`og:image` is a relative path.** Link previews in Slack, WhatsApp and
   Facebook need an absolute one. Once you know the final URL:

   ```html
   <meta property="og:image" content="https://YOUR-DOMAIN/images/14-og.jpg">
   ```

## One thing worth a decision, not a code change

`images/` holds photographs of real, identifiable attendees, and the quote
carries Ivan Cai's name. That was fine while this was a local file. Publishing
it — even unlisted — puts those faces on the open web, and an unlisted URL is
one forward away from being a public one.

Worth confirming you have the attendees' say-so before it goes up. It is the one
item in this package that a config change cannot fix.
