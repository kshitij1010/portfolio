"use strict";
window.OrbitJournal = (() => {
  const $ = (s) => document.querySelector(s);
  const allowedKinds = ["photo", "travel", "writing"];
  const names = {
    photo: "Photo journal",
    travel: "Travel diary",
    writing: "Personal blog",
  };
  // Journal data is published with the site. No visitor uploads or remote HTML are executed.
  function safeAsset(path) {
    return (
      typeof path === "string" &&
      /^assets\/images\/journal\/[a-zA-Z0-9_./-]+\.(?:jpe?g|png|webp|avif)$/i.test(
        path
      ) &&
      !path.includes("..")
    );
  }
  function validEntry(entry) {
    return (
      entry &&
      /^[a-z0-9-]+$/.test(entry.id) &&
      allowedKinds.includes(entry.type) &&
      typeof entry.title === "string" &&
      entry.title.length <= 160 &&
      Array.isArray(entry.body) &&
      entry.body.every((p) => typeof p === "string") &&
      (!entry.cover ||
        (safeAsset(entry.cover.src) && typeof entry.cover.alt === "string")) &&
      (!entry.photos ||
        (Array.isArray(entry.photos) &&
          entry.photos.every(
            (p) => safeAsset(p.src) && typeof p.alt === "string"
          )))
    );
  }
  function init({ openDialog }) {
    let entries = [],
      filter = "all",
      selectedPhoto = 0,
      currentPhotos = [];
    const grid = $("#journal-grid"),
      empty = $("#journal-empty");
    function image(photo, lazy = true) {
      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = photo.alt;
      if (lazy) img.loading = "lazy";
      img.decoding = "async";
      return img;
    }
    function paragraph(text) {
      const p = document.createElement("p");
      p.textContent = text;
      return p;
    }
    function showPhoto(index) {
      selectedPhoto = (index + currentPhotos.length) % currentPhotos.length;
      const photo = currentPhotos[selectedPhoto],
        stage = $("#journal-photo-stage");
      stage.replaceChildren(image(photo, false));
      $("#journal-photo-caption").textContent = photo.caption || photo.alt;
      $("#journal-photo-position").textContent = `${selectedPhoto + 1} / ${
        currentPhotos.length
      }`;
      $("#journal-photo-prev").disabled = $("#journal-photo-next").disabled =
        currentPhotos.length < 2;
    }
    function openEntry(entry) {
      $("#journal-title").textContent = entry.title;
      $("#journal-type").textContent = names[entry.type];
      $("#journal-meta").textContent = [entry.date || "", entry.location || ""]
        .filter(Boolean)
        .join(" · ");
      const body = $("#journal-body");
      body.replaceChildren();
      if (entry.cover) {
        const hero = image(entry.cover, false);
        hero.className = "journal-cover";
        body.append(hero);
      }
      for (const text of entry.body) body.append(paragraph(text));
      currentPhotos = entry.photos || [];
      $("#journal-photo-viewer").hidden = !currentPhotos.length;
      if (currentPhotos.length) showPhoto(0);
      openDialog("#journal-dialog");
    }
    function render() {
      const items = entries.filter(
        (e) => filter === "all" || e.type === filter
      );
      grid.replaceChildren();
      empty.hidden = items.length > 0;
      $("#journal-status").textContent = items.length
        ? `${items.length} ${
            items.length === 1 ? "entry" : "entries"
          } in this collection`
        : filter === "all"
        ? "The first entries are on their way."
        : `No ${names[filter].toLowerCase()} entries published yet.`;
      for (const entry of items) {
        const article = document.createElement("article");
        article.className = "journal-card";
        const button = document.createElement("button");
        button.className = "journal-open";
        if (entry.cover) button.append(image(entry.cover));
        else {
          const graphic = document.createElement("div");
          graphic.className = `journal-card-art ${entry.type}`;
          graphic.setAttribute("aria-hidden", "true");
          graphic.textContent = { photo: "◉", travel: "↗", writing: "✎" }[
            entry.type
          ];
          button.append(graphic);
        }
        const content = document.createElement("div");
        content.className = "journal-card-copy";
        const kind = document.createElement("span");
        kind.className = "section-index";
        kind.textContent = names[entry.type];
        const title = document.createElement("h3");
        title.textContent = entry.title;
        content.append(kind, title);
        if (entry.excerpt) content.append(paragraph(entry.excerpt));
        const action = document.createElement("span");
        action.className = "journal-link";
        action.textContent =
          entry.type === "writing" ? "Read the story ↗" : "Open the journal ↗";
        content.append(action);
        button.append(content);
        button.addEventListener("click", () => openEntry(entry));
        article.append(button);
        grid.append(article);
      }
    }
    document.querySelectorAll("[data-journal-filter]").forEach((button) =>
      button.addEventListener("click", () => {
        filter = button.dataset.journalFilter;
        document
          .querySelectorAll("[data-journal-filter]")
          .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        render();
      })
    );
    $("#journal-photo-prev").addEventListener("click", () =>
      showPhoto(selectedPhoto - 1)
    );
    $("#journal-photo-next").addEventListener("click", () =>
      showPhoto(selectedPhoto + 1)
    );
    $("#journal-dialog").addEventListener("keydown", (event) => {
      if (
        currentPhotos.length &&
        !/INPUT|TEXTAREA/.test(event.target.tagName) &&
        ["ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        event.preventDefault();
        showPhoto(selectedPhoto + (event.key === "ArrowLeft" ? -1 : 1));
      }
    });
    fetch("assets/data/journal.json")
      .then((r) => {
        if (!r.ok) throw Error("Unavailable");
        return r.json();
      })
      .then((data) => {
        entries = (Array.isArray(data.entries) ? data.entries : []).filter(
          validEntry
        );
        render();
      })
      .catch(() => {
        $("#journal-status").textContent =
          "The journal is taking a short break. Check back for the first entries.";
      });
  }
  return { init, validEntry, safeAsset };
})();
