# Add photos, travel stories, and personal posts

The personal section is ready but intentionally has no invented trips, photographs, or blog posts. Published entries live in `assets/data/journal.json`; the site reads that file directly, so no backend or hosting change is needed.

## Add an entry

1. Put approved photos in `assets/images/journal/`. Use simple filenames such as `city-evening.jpg`. JPEG, PNG, WebP, and AVIF are supported. Keep full-resolution originals elsewhere; web-sized copies around 1600–2000 pixels on the long edge usually work well.
2. Add an entry to the JSON `entries` array using this schema. Replace the example values with the actual story before publishing.
3. Preview the card and reader, check captions/alt text, then commit and merge the site changes.

```json
{
  "entries": [
    {
      "id": "your-story-slug",
      "type": "travel",
      "title": "Your actual story title",
      "date": "Your actual travel or publication date",
      "location": "Your actual location, if you want it public",
      "excerpt": "A short introduction for the card.",
      "cover": {
        "src": "assets/images/journal/your-photo.jpg",
        "alt": "Describe the actual scene."
      },
      "body": [
        "First paragraph in your own words.",
        "Second paragraph. Each item becomes a separate paragraph."
      ],
      "photos": [
        {
          "src": "assets/images/journal/your-photo.jpg",
          "alt": "Describe the actual scene.",
          "caption": "Your caption for this photograph."
        }
      ]
    }
  ]
}
```

`type` is `photo`, `travel`, or `writing`. `id`, `type`, `title`, and `body` are required; `body` may be an empty array for a photo collection. Cover images, photo arrays, date, location, and excerpt are optional. There is no required publishing schedule. Text is rendered as plain text, not executable HTML. A writing entry can include a cover and photos just like a travel diary.

Visitors can filter the journal, open a full entry, and browse its photographs with Previous/Next controls or arrow keys. Until entries are supplied, the section shows clearly labeled “coming soon” collection cards. No private files, social accounts, or visitor uploads are read automatically.
