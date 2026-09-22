# Kshitij Joshi · Mission Control

A space-themed, interactive portfolio hosted at **https://kshitij1010.github.io/portfolio/**.

## Run locally

```sh
python3 -m http.server 5178 --bind 127.0.0.1
```

Open `http://127.0.0.1:5178`. No build step, package install, API keys, or backend is required.

## What is inside

- Responsive orbital homepage and project filters.
- Six project briefs with architecture flows and a locally saved exploration passport.
- Searchable command palette (`⌘K` / `Ctrl+K`).
- Orbit: a deterministic, topic-matching portfolio guide. It is explicitly labeled as a local guide, not an LLM or autonomous agent. Questions stay in the browser.
- Synthesized drum pads, an eight-step sequencer, a breathing pause, and a soccer timing game.
- Orbit Runner: keyboard and touch controls, pause/resume, and local best scores.
- Native accessible dialogs, visible focus states, reduced-motion support, and mobile navigation.

Google Fonts is the only external runtime stylesheet; system font fallbacks keep the site usable without it. There are no analytics scripts on the new homepage. Local storage holds only explored project IDs and the arcade best score. Audio begins only after a visitor plays a music interaction and loops stop on close/backgrounding.

## Content and sources

The four resumes supplied in September 2026 inform current roles, dates, skills, project descriptions, and publication status. The Palantir resume is used for the public download at `assets/Kshitij-Joshi-Resume.pdf`. The Apple MIND resume supplies the local Llama/LoRA assistant project. Descriptions of enterprise work stay at the public resume level; no private source code or customer data is included.

- EOX Vantage: February 2026–present.
- Scale AI: February 2025–January 2026.
- JHU CLSP: August 2024–January 2025.
- JHU ARCADE: January 2024–January 2025.
- Fracture research remains explicitly **under review**.
- Project metrics and awards are resume-reported, not independently reproduced benchmarks.
- IEEE and Springer links come from the original portfolio.

Edit `index.html` for profile, project cards, experience, research, and hobbies. Edit `assets/js/projects.js` for corresponding project modal content and `assets/js/orbit.js` for the copilot's curated knowledge. Keep card and modal summaries consistent. Styling is in `assets/css/orbit.css`.

The old top-level experience, education, projects, publications, and skills URLs redirect to the corresponding new sections. Older project detail pages remain available as historical material.

## Verification

```sh
python3 scripts/verify.py
node --check assets/js/orbit.js
node --check assets/js/projects.js
```

Browser smoke testing covers desktop/mobile overflow, project filters and dialogs, saved mission progress, command search, copilot responses, all four hobby interactions, flight controls/pause, and mobile navigation.

## GitHub Pages

The existing configuration serves `main` from the repository root. Merge the redesign branch into `main` to publish at the same URL. `.nojekyll` ensures direct static asset serving. All local asset paths are relative, so the `/portfolio/` project path works without configuration changes. Hosting continues to use GitHub Pages with no paid services.
