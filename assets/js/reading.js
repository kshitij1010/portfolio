"use strict";
window.OrbitReading = (() => {
  const collections = {
    foundations: "Foundations",
    recent: "New research",
    guides: "Articles & blogs",
  };
  function validEntry(entry) {
    if (
      !entry ||
      typeof entry.id !== "string" ||
      !/^[a-z0-9-]+$/.test(entry.id) ||
      !["paper", "article", "blog"].includes(entry.kind) ||
      !Object.hasOwn(collections, entry.collection) ||
      !["title", "authors", "summary", "sourceLabel"].every(
        (key) => typeof entry[key] === "string" && entry[key].trim()
      ) ||
      typeof entry.published !== "string" ||
      !/^\d{4}(-\d{2}-\d{2})?$/.test(entry.published) ||
      !Array.isArray(entry.tags) ||
      !entry.tags.every((tag) => typeof tag === "string") ||
      typeof entry.favorite !== "boolean"
    )
      return false;
    try {
      const url = new URL(entry.url);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }
  function selectEntries(entries, filter, query) {
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const result = entries.filter(
      (entry) =>
        (filter === "all" ||
          (filter === "favorites"
            ? entry.favorite
            : entry.collection === filter)) &&
        words.every((word) =>
          `${entry.title} ${entry.authors} ${entry.tags.join(" ")} ${
            entry.summary
          }`
            .toLowerCase()
            .includes(word)
        )
    );
    return filter === "recent"
      ? result.sort((a, b) => b.published.localeCompare(a.published))
      : result;
  }
  function node(tag, cls, text) {
    const el = document.createElement(tag);
    el.className = cls;
    el.textContent = text;
    return el;
  }
  function init() {
    const grid = document.querySelector("#reading-grid"),
      search = document.querySelector("#reading-search"),
      status = document.querySelector("#reading-status"),
      more = document.querySelector("#reading-more"),
      empty = document.querySelector("#reading-empty");
    let entries = [],
      filter = "all",
      limit = 6,
      failed = false;
    function render() {
      const matches = selectEntries(entries, filter, search.value),
        visible = matches.slice(0, limit);
      grid.replaceChildren();
      empty.hidden = !!matches.length;
      empty.textContent = failed
        ? "The reading shelf is temporarily unavailable. Please try again later."
        : filter === "favorites" && !search.value.trim()
        ? "Personal favorites and notes are coming soon. Explore the curated collections in the meantime."
        : "No readings match this selection. Try another topic or collection.";
      status.textContent = failed
        ? "Unable to load readings"
        : `Showing ${visible.length} of ${matches.length} readings`;
      more.hidden = visible.length >= matches.length;
      more.textContent = `Show ${Math.min(
        6,
        matches.length - visible.length
      )} more readings ↓`;
      for (const entry of visible) {
        const card = node("article", `reading-card ${entry.collection}`, ""),
          meta = node("div", "reading-meta", "");
        meta.append(
          node("span", "", collections[entry.collection]),
          node("span", "", entry.published)
        );
        const heading = node("h3", "", ""),
          link = node("a", "", entry.title);
        link.href = entry.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        heading.append(link);
        const tags = node("div", "reading-tags", "");
        entry.tags.forEach((tag) => tags.append(node("span", "", tag)));
        card.append(
          meta,
          heading,
          node("p", "reading-author", entry.authors),
          node("p", "reading-summary", entry.summary),
          tags
        );
        if (entry.favorite)
          card.append(node("span", "reading-favorite", "Kshitij’s pick"));
        const source = link.cloneNode(false);
        source.className = "reading-source";
        source.textContent = `${entry.sourceLabel} ↗`;
        source.setAttribute("aria-label", `Read ${entry.kind}: ${entry.title}`);
        card.append(source);
        grid.append(card);
      }
    }
    document.querySelectorAll("[data-reading-filter]").forEach((button) =>
      button.addEventListener("click", () => {
        filter = button.dataset.readingFilter;
        limit = 6;
        document
          .querySelectorAll("[data-reading-filter]")
          .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        render();
      })
    );
    search.addEventListener("input", () => {
      limit = 6;
      render();
    });
    more.addEventListener("click", () => {
      limit += 6;
      render();
    });
    fetch("assets/data/reading.json")
      .then((r) => {
        if (!r.ok) throw Error("Unavailable");
        return r.json();
      })
      .then((data) => {
        if (
          !Array.isArray(data.entries) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(data.updated)
        )
          throw Error("Invalid catalog");
        entries = data.entries.filter(validEntry);
        const updated = document.querySelector("#reading-updated");
        updated.dateTime = data.updated;
        updated.textContent = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(`${data.updated}T12:00:00Z`));
        render();
      })
      .catch(() => {
        failed = true;
        render();
      });
  }
  return { init, validEntry, selectEntries };
})();
