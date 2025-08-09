# rowhit.in — Personal Site

A simple, fast, nostalgic 90s-style personal website for Rohit. Static HTML/CSS/JS suitable for GitHub Pages with a tiny script and workflows to fetch and merge activity feeds (Blog, GitHub, optional X + LinkedIn) into `public/activity.json`.

## Structure
- `index.html`: Single page with sections (About, Experience, Skills, Activity, Resume)
- `styles.css`: Minimal, classic theme (off‑white paper, blue links, small caps labels)
- `scripts/fetch_feeds.js`: Node script to fetch/merge feeds
- `config.json`: Config inputs (RSS URL, GitHub username, optional X/LinkedIn JSON endpoints)
- `data/`: Intermediate JSON
  - `blog.json` (generated)
  - `github.json` (generated)
  - `x.json` (optional local fallback)
  - `linkedin.json` (optional local fallback)
- `public/activity.json`: Merged, sorted feed (generated)
- `assets/resume.pdf`: Placeholder resume
- `.github/workflows/`: Workflows to fetch feeds and build activity JSON
- `favicon.svg`: Simple favicon
- `CNAME`: Custom domain (`rowhit.in`)

## Requirements
- Node.js 20+ for running the fetch/merge script locally
- GitHub repository with Pages enabled (or any static host)

## Configure
Edit `config.json`:
```json
{
  "hashnode_rss_url": "https://blog.rowhit.in/rss.xml",
  "github_username": "rowhit",
  "x_feed_url": "",
  "linkedin_feed_url": ""
}
```
- Set `hashnode_rss_url` to your Hashnode RSS feed.
- Set `github_username` to your GitHub username.
- Optionally set `x_feed_url`/`linkedin_feed_url` to a JSON endpoint that returns an array of items like:
  ```json
  [
    { "title": "Short post text", "url": "https://x.com/...", "published": "2025-08-01T10:00:00Z" }
  ]
  ```
- Alternatively, place manual arrays in `data/x.json` and/or `data/linkedin.json`.

## Local development
1) Generate feeds (optional):
- Blog: `node scripts/fetch_feeds.js blog`
- GitHub: `node scripts/fetch_feeds.js github`
- Merge: `node scripts/fetch_feeds.js merge`

2) Serve locally (recommended so the Activity fetch works):
- Python: `python -m http.server 8080`
- Node: `npx http-server -c-1 .`
- Then open `http://localhost:8080/`.

You can also open `index.html` directly in the browser. CSS and content will load, and the Activity section will gracefully show “No recent activity yet” if `fetch()` is blocked by the file protocol.

## Activity feed format
- Sources: Blog (RSS), GitHub (Atom), optional X/LinkedIn (JSON)
- Normalized item fields:
  - `source`: `"Blog" | "GitHub" | "X" | "LinkedIn"`
  - `icon`: emoji/text icon
  - `title`: title or short text
  - `url`: permalink
  - `published`: ISO string
- Merge strategy: concatenate, filter invalid dates, sort by date desc, keep top 20 → `public/activity.json`.

## Workflows
- `.github/workflows/fetch_blog.yml` (hourly):
  - Runs `node scripts/fetch_feeds.js blog`
  - Commits `data/blog.json` if changed
- `.github/workflows/fetch_github.yml` (hourly, offset):
  - Runs `node scripts/fetch_feeds.js github`
  - Commits `data/github.json` if changed
- `.github/workflows/build_activity.yml` (every 6 hours):
  - Runs `node scripts/fetch_feeds.js merge`
  - Commits `public/activity.json` if changed
  - Publishes the site to the `gh-pages` branch

Permissions: workflows request `contents: write` and use the default `GITHUB_TOKEN`.

## Deploy to GitHub Pages
- Push this repository to GitHub.
- Ensure GitHub Pages is enabled for the default branch.
- Keep `CNAME` in the root for `rowhit.in`.
- Add DNS for `rowhit.in` to GitHub Pages.

## Styling and accessibility
- One-column layout (max 800px), paper background `#FAF7F1`, ink text `#2B2B2B`.
- Blue links `#0033CC` and visited purple `#551A8B`.
- Small caps section labels, thin rules, no animations.
- Semantic HTML, skip link, visible focus states, high contrast.

## Troubleshooting
- CSS not loading locally:
  - Paths are relative (`styles.css`, `favicon.svg`, `assets/resume.pdf`). If you previously saw `/styles.css` in the HTML, it’s been fixed.
  - If opening `index.html` directly, some browsers restrict `fetch()` from file URLs; use a local server for Activity to load.
  - Check Console/Network for 404s (ensure files exist and casing matches).
- Activity is empty:
  - Ensure `data/blog.json` and `data/github.json` exist or run the script.
  - Confirm `config.json` values are correct.
  - Re-run `node scripts/fetch_feeds.js merge`.
- GitHub Pages not updating:
  - Check Actions tab for workflow runs and logs.
  - Ensure Pages is enabled for the branch being published.

## License
MIT (or your preference). 