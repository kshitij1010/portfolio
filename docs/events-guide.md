# Adding events

Edit `assets/data/events.json` and append an object to the `events` array:

```json
{
  "id": "unique-event-slug",
  "title": "Event name",
  "date": "2027-04-15",
  "endDate": "2027-04-16",
  "location": "Venue · City, State (or Online)",
  "role": "attending",
  "description": "A short note about the event or what you’re looking forward to.",
  "url": "https://example.com/event"
}
```

This is a schema example, not an actual attendance plan. Only add confirmed plans supplied by the owner.

- `id`, `title`, `date`, `location`, and `role` are required.
- Use `YYYY-MM-DD` dates in the event’s local calendar. `endDate` is inclusive and optional for single-day events.
- `role` is `attending`, `speaking`, or `organizing`. Only use a role that is confirmed.
- `description` and `url` are optional. Links must use HTTPS; prefer the organizer’s official event page.
- Events sort by start date, with nearest first. Events remain upcoming through the end date, then move to Past events automatically using the visitor’s local calendar day. Past events sort newest first.
- Dates describe attendance days, not an exact live timetable. Put a verified start time and time zone in the description when useful; link to the organizer for the latest schedule.
- Remove canceled attendance from the array. The past view records listed plans, so update or remove a plan if attendance changes.

The section is linked from navigation and the command palette. Content is rendered as plain text, not HTML. It runs on GitHub Pages without a backend, paid service, or visitor sign-in. The portfolio copilot does not yet retrieve the event list; event details remain directly available in this section.
