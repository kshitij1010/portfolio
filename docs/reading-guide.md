# Curating the reading radar

The library lives in `assets/data/reading.json`. It is a selected reading list, separate from Kshitij’s publications and project claims. The September 22, 2026 snapshot contains 13 foundational papers, seven recent preprints, and three articles/blog posts.

The recent entries were verified against the authors’ arXiv records, including five submissions from September 21 announced in the September 22 feed. `published` records the original submission date, not the announcement date. Foundational papers use their original submission year; publication venue dates can differ. Every entry links directly to its source.

## Add an entry

```json
{
  "id": "unique-reading-slug",
  "title": "Verified title",
  "authors": "Author or organization",
  "published": "2026-09-22",
  "kind": "paper",
  "collection": "recent",
  "tags": ["Agents", "Evaluation"],
  "summary": "A short, original explanation of the contribution and why it is useful.",
  "url": "https://example.com/original-source",
  "sourceLabel": "arXiv · preprint",
  "favorite": false
}
```

This is a schema example. Add only verified sources.

- `kind`: `paper`, `article`, or `blog`.
- `collection`: `foundations`, `recent`, or `guides`.
- Use a four-digit year or an ISO date for `published`.
- Use HTTPS links to the original paper, author's post, or publisher. Summaries are original paraphrases; do not copy abstracts.
- Set `favorite: true` only when Kshitij selects an item as a personal favorite. No seeded item implies he has read, authored, endorsed, or personally selected it.
- Update the top-level `updated` date after reviewing the collection. The public date must reflect an actual review, not the current browser date.
- The recent collection sorts by date; other collections use the JSON's editorial order. Search matches titles, authors, tags, and summaries. Six entries display at a time.

This is a static snapshot, not an automatically refreshed feed or exhaustive catalog of AI research. Recent preprints are selected for relevance to agents, reasoning, and evaluation; their long-term impact is not yet established. The foundations are editorial choices, not a citation ranking. Review and rotate recent entries as the field changes. The arXiv recent-submissions link provides a path to ongoing discovery without scraping, credentials, API calls, or hosting costs.

The public copilot remains focused on Kshitij’s experience; adding reading materials does not make it a general research chatbot.
