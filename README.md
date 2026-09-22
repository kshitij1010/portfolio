# Kshitij Joshi · Mission Control

An interactive space-themed portfolio for **https://kshitij1010.github.io/portfolio/**. The existing GitHub Pages main/root configuration stays in place.

## Local preview

```sh
python3 -m http.server 5178 --bind 127.0.0.1
```

Open `http://127.0.0.1:5178`. The portfolio needs no build, API key, package install, or backend to run.

## Explore

- Supernova/Aurora accent palettes, Syne headings, Manrope body type, IBM Plex Mono labels, and original colorful SVG artwork.
- Fourteen mission briefs: eleven documented projects/research items and three explicitly **planned** weekend lab concepts.
- Three EOX Vantage workstreams: enterprise agent workflows, enterprise knowledge retrieval, and Policy Quality Check.
- Project filters, text search, shareable `?mission=project-id` links, source citations, architecture flows, and a locally saved mission passport.
- Keyboard command palette (`⌘K` / `Ctrl+K`), responsive navigation, reduced-motion support, and accessible native dialogs.
- An expanded music/game deck: drumming, DJing, Jiu Jitsu flow decisions, soccer, and Orbit Runner.

The planned labs (Agent Observatory, Incident Flight Recorder, and Paper → Experiment) are future designs, not accomplishments. Their cards, details, sources, and copilot topics preserve that distinction.

## Orbit: source-first portfolio guide

Orbit retrieves from 25 curated topics in `assets/data/knowledge.json`. Each response includes resume, project, or publication links; ambiguous queries offer topic choices. Visitors can jump directly from a mission brief into its corresponding copilot topic.

The default **Source Mode** uses no model tokens. It displays documented facts locally rather than pretending to be an LLM. It refuses general-purpose requests, does not execute tools or browse visitor links, and never invents details to fill gaps. Conversation text stays in the current tab and is not saved to local storage.

An optional backend supports OpenAI or Anthropic summaries. It accepts exactly `{ "topicId": "approved-topic" }`, never visitor questions, prompts, uploaded documents, or conversation history. Only server-owned facts reach the provider. Persistent request/token reservations, per-client limits, cached answers, short output limits, and no retries control usage. See [worker/README.md](worker/README.md) for configuration, limitations, and activation. This is **not deployed or connected to a paid account by default**; the frontend uses `enableAI: false` and an empty endpoint in `assets/data/copilot-config.json`.

Consumer Pro login sessions are not embedded or repurposed for public site traffic. Optional hosted AI requires server-side API credentials and a separately deployed backend. Hard call and output limits are implemented; reserved token estimates are not a guaranteed dollar cap. The site stays functional if the backend is disabled, unavailable, or out of quota.

## Photos, travel, and personal writing

The Field Notes section has photo, travel, and writing filters, full-entry readers, and a keyboard-accessible photo viewer. It shows explicitly labeled upcoming collections until the owner supplies real photos and posts. Add content to `assets/data/journal.json`; see [docs/journal-guide.md](docs/journal-guide.md) for the schema and photo folder. No trips or posts are invented.

## Content updates

1. Edit `assets/js/projects.js` for project titles, content, status, sources, and architecture flows.
2. Edit the profile topics/artwork in `scripts/build-content.mjs` when profile facts change.
3. Run `node scripts/build-content.mjs`. It refreshes static cards in `index.html` and the copilot catalog from the same project source.
4. Review the visible status and source links, and rerun the checks below.

Profile, timeline, publications, and section layout live in `index.html`. Base styles are in `assets/css/orbit.css`; the updated palette and layout are in `assets/css/aurora.css`. Arcade and copilot logic are separate modules.

The four owner-supplied September 2026 resumes inform current facts. The public download is the Palantir variant. The local assistant is sourced from the Apple MIND variant and cites that distinction in [docs/content-sources.md](docs/content-sources.md). Metrics and awards are resume-reported. Enterprise descriptions stay at the public resume level: no customer data, private code, internal URLs, or credentials. LinkedIn's public profile supports the environmental volunteering summary; no unverified X handle is included.

The old top-level experience, education, project, publications, and skills URLs redirect to the new sections. Older individual project pages remain historical case studies.

## Verification

```sh
python3 scripts/verify.py
node --check assets/js/orbit.js
node --check assets/js/copilot.js
node --check assets/js/arcade.js
node --test scripts/test-worker.mjs scripts/test-copilot.mjs
```

Optional browser smoke tests use Playwright and a running preview:

```sh
node scripts/browser-smoke.cjs
node scripts/arcade-smoke.cjs
node scripts/integration-smoke.cjs
```

Install Playwright in your development environment first. `PLAYWRIGHT_MODULE` can point at an existing installation; `CHROME_PATH` can point at a local Chrome executable; `PORTFOLIO_URL` overrides the preview URL. Browser tests make no paid model requests. Worker tests mock the providers and verify both scope and quota enforcement. A Wrangler deployment dry-run also validates the optional Worker bundle; it does not publish or call a model.

## Hosting and privacy

Merging into `main` publishes at the existing GitHub Pages URL. All frontend asset paths are relative to support `/portfolio/`; `.nojekyll` enables direct static asset serving. Google Fonts is the only external runtime stylesheet, with system fallbacks. No analytics scripts are loaded on the homepage. Local storage holds UI preferences, mission progress, and game/music settings. Audio starts only on explicit interaction and stops on close/backgrounding. Optional remote AI has separate provider/hosting plans; GitHub Pages and Source Mode remain free of AI usage costs.
