# Project catalog guide

The catalog lives in `assets/js/projects.js` as `window.PORTFOLIO_PROJECTS`. It currently contains 14 entries: 11 documented work or research entries and 3 planned weekend labs. The factual source audit remains in [content-sources.md](content-sources.md).

## What the UI represents

The neural network and project nodes are a navigation metaphor for related areas of work. It must not turn every entry into a claim about an autonomous, deployed agent. The catalog includes employer engineering, model evaluation, translation research, medical imaging research, a published assistive-mobility project, personal projects, and unimplemented ideas.

The `role` field is a short explanation of that focus, not a new employment title. Planned entries begin their role with “Planned:”. A `built` lifecycle means the supplied evidence describes work undertaken; it does not mean every system is finished, open source, clinically validated, or publicly reproducible.

## Data contract

Existing fields remain compatible: `id`, `title`, `category`, `type`, `tags`, `summary`, `detail`, `flow`, `outcome`, `highlights`, `link`, `art`, `status`, `lifecycle`, `employer`, `year`, `sourceLabel`, and `sourceUrl`.

Each entry now also contains:

| Field | Meaning |
| --- | --- |
| `role` | One-sentence project responsibility or research focus. |
| `activityLabel` | Documented activity period or status, such as `2026–present`, `Spring 2024`, or `Planned`. |
| `problem` | The problem addressed, with planned investigations explicitly labeled. |
| `approach` | An ordered array of 3–5 steps supported by the sources, or proposed steps for a planned project. |
| `contribution` | An array describing Kshitij’s documented contribution; team work must not become sole ownership. |
| `evaluation` | Reported evidence and its practical limits, or a proposed evaluation with no results claimed. |
| `constraints` | Source, reproducibility, scope, or confidentiality qualifications specific to the entry. |
| `nextSteps` | Future opportunities or proposed first milestones. These are not shipped features or commitments. |
| `resources` | An array of 2–3 resource objects; all current entries have 3. |

Resource objects have this shape:

```js
{
  label: "Add demo after implementation",
  url: null,
  status: "placeholder",
  kind: "demo"
}
```

Allowed resource kinds are `code`, `demo`, `case-study`, and `paper`. A resource with `status: "available"` has a real URL or an existing local path. “Available” means there is a destination, not that the destination is a working demo, complete implementation, independent verification, or a freshly accessible publisher page.

A resource with `status: "placeholder"` always has `url: null`. Display it as a clearly labeled inactive slot, never as an anchor with `href="#"`, an invented URL, a working demo button, or a link to a private employer system. Examples include “Add approved repository link” and “Add demo after implementation”.

## Source and time rules

- Use the supplied resumes for employer attribution and current experience. Enterprise descriptions stay at the public resume level.
- Activity labels describe the documented period, not live activity. Do not manufacture “last active”, commit times, availability indicators, or recent-update timestamps.
- Resume-reported metrics remain attributed. Do not invent dataset sizes, baselines, hardware, clinical validation, or statistical significance.
- The legal translation BLEU value remains `0.58` as supplied; do not silently convert it into a different scale.
- Cognitive-Chair’s 2023 publication and AIST 2022 award are separate dates.
- Fracture research stays under review unless an actual accepted paper or authorized update is provided.
- Future improvements for built projects begin with “A future…” or equivalent language. Planned projects contain only intended work and proposed evaluation.
- Preserve `lifecycle: "planned"` and **PLANNED / WEEKEND LAB** until implementation evidence is available. Retrieval and chatbot summaries must preserve these distinctions.

## Link review

Public links were reviewed during this update. A fresh GitHub API check confirmed the machine-translation repository has size 0. Browser retrieval confirmed the public RAG repository’s README identifies it as an NLP assignment. These checks establish link context, not the portfolio’s reported project outcomes.

| Entry | Destination | Treatment |
| --- | --- | --- |
| Financial RAG | [rag repository](https://github.com/kshitij1010/rag) | The repository displays related NLP assignment material; it is not verified implementation evidence for the financial pipeline. The legacy `link` is now `null`, and the resource label is “Related NLP repository”. |
| Gujarati–English research | [machine-translation repository](https://github.com/kshitij1010/machine-translation) | The repository is empty. Label it “Repository scaffold (no code yet)”; do not imply that visitors can reproduce the research from it. |
| Cognitive-Chair | [IEEE Xplore paper](https://ieeexplore.ieee.org/abstract/document/10065338) | Retained from the original portfolio and supplied resume. Automated access failed during review, so this update does not claim independent publisher verification. |
| LegalEase | [Historical case study](../legalease.html) | Existing local page; no verified project-specific public code or demo. |
| CLSP translation | [Historical case study](../cslp.html) | Existing local page. The newer resume wording governs the current benchmark account. |
| Fracture detection | [Historical case study](../fracture-detection.html) | Existing local page describes classification/localization/segmentation. The new case study avoids treating its unquantified language as clinical performance evidence. |
| Cognitive-Chair | [Historical case study](../ai-chair.html) | Existing local page supports signal processing and command interpretation. Individual subsystem ownership is not documented. |

The role and approach descriptions for legacy research summarize the owner’s supplied materials. No new claims of external validation are introduced. If a repository becomes complete or a correct project repository is provided, verify it before replacing a placeholder or changing its label.

## Publishing an update

1. Edit the project record and confirm that all claims have a source.
2. Set real resource URLs only after checking their content and relevance.
3. Keep employer implementation links private unless an approved public destination exists.
4. Preserve stable IDs so filters, deep links, and saved exploration progress keep working.
5. Run `node --check assets/js/projects.js`.
6. Run the root project’s normal content-generation and verification workflow when integrating the change. The generator also rebuilds every standalone page in `briefs/`.

No secret, customer data, internal endpoint, or private repository path belongs in this file or the public catalog.

## Architecture and sharing

Each project has a one-page summary at `briefs/<id>.html`. The page includes a print layout and the same interactive diagram as the project dialog. It is generated from the catalog; edit the data, not the generated HTML.

`assets/js/architecture.js` contains component descriptions and trade-offs in the same order as each project’s `flow` array. Keep descriptions grounded in documented methods. Trade-offs are explicitly framed as design considerations, not claims about exact implementation. Proposed projects retain their planned status in every view.

To publish a personal repository link, replace the appropriate null resource URL with its public HTTPS URL and set `status` to `available`, then run `node scripts/build-content.mjs`. This refreshes the cards, source catalog, and all 14 summary pages.
