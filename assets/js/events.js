"use strict";
window.OrbitEvents = (() => {
  const roles = {
    attending: "Attending",
    speaking: "Speaking",
    organizing: "Organizing",
  };
  function validDate(value) {
    return (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value
    );
  }
  function safeLink(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }
  function validEvent(event) {
    return (
      event &&
      typeof event.id === "string" &&
      /^[a-z0-9-]+$/.test(event.id) &&
      typeof event.title === "string" &&
      event.title.trim().length > 0 &&
      validDate(event.date) &&
      (!event.endDate ||
        (validDate(event.endDate) && event.endDate >= event.date)) &&
      Object.hasOwn(roles, event.role) &&
      typeof event.location === "string" &&
      (!event.description || typeof event.description === "string") &&
      (!event.url || safeLink(event.url))
    );
  }
  function localDay(now = new Date()) {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
  }
  function selectEvents(events, view, today = localDay()) {
    return events
      .filter((e) =>
        view === "past"
          ? (e.endDate || e.date) < today
          : (e.endDate || e.date) >= today
      )
      .sort((a, b) =>
        view === "past"
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date)
      );
  }
  function formatDate(date, options) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      ...options,
    }).format(new Date(`${date}T12:00:00Z`));
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function init() {
    const grid = document.querySelector("#events-list"),
      empty = document.querySelector("#events-empty"),
      status = document.querySelector("#events-status");
    let events = [],
      view = "upcoming",
      failed = false;
    function render() {
      const today = localDay(),
        items = selectEvents(events, view, today);
      grid.replaceChildren();
      empty.hidden = !!items.length;
      status.textContent = failed
        ? "The event list is temporarily unavailable."
        : items.length
        ? `${items.length} ${
            view === "past" ? "past" : "upcoming or ongoing"
          } ${items.length === 1 ? "event" : "events"}`
        : view === "past"
        ? "No past events listed yet."
        : "New coordinates coming soon.";
      empty.querySelector("h3").textContent = failed
        ? "A brief pause in the signal."
        : view === "past"
        ? "The flight log starts here."
        : "See you somewhere interesting.";
      empty.querySelector("p").textContent = failed
        ? "Please check back soon for event details."
        : view === "past"
        ? "Past events will stay here as the calendar moves forward."
        : "I’ll share the conferences, meetups, and community events I’m heading to. My next stops will appear here once confirmed.";
      for (const event of items) {
        const card = element("article", "event-card"),
          stamp = element("div", "event-stamp");
        stamp.setAttribute("aria-hidden", "true");
        stamp.append(
          element("span", "", formatDate(event.date, { month: "short" })),
          element("strong", "", formatDate(event.date, { day: "2-digit" })),
          element("span", "", formatDate(event.date, { year: "numeric" }))
        );
        const body = element("div", "event-body"),
          labels = element("div", "event-labels");
        labels.append(element("span", "event-role", roles[event.role]));
        if (event.date <= today && (event.endDate || event.date) >= today)
          labels.append(element("span", "event-now", "Happening now"));
        const heading = element("h3", "", event.title),
          meta = element("p", "event-meta");
        const start = element(
          "time",
          "",
          formatDate(event.date, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        );
        start.dateTime = event.date;
        meta.append(start);
        if (event.endDate && event.endDate !== event.date) {
          const end = element(
            "time",
            "",
            formatDate(event.endDate, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          );
          end.dateTime = event.endDate;
          meta.append(" – ", end);
        }
        meta.append(` · ${event.location}`);
        body.append(labels, heading, meta);
        if (event.description)
          body.append(element("p", "event-description", event.description));
        card.append(stamp, body);
        if (event.url) {
          const link = element("a", "event-link", "Event details ↗");
          link.href = event.url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.setAttribute("aria-label", `Event details: ${event.title}`);
          card.append(link);
        }
        grid.append(card);
      }
    }
    document.querySelectorAll("[data-events-view]").forEach((button) => {
      button.addEventListener("click", () => {
        view = button.dataset.eventsView;
        document
          .querySelectorAll("[data-events-view]")
          .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        render();
      });
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) render();
    });
    fetch("assets/data/events.json")
      .then((r) => {
        if (!r.ok) throw Error("Unavailable");
        return r.json();
      })
      .then((data) => {
        if (!Array.isArray(data.events)) throw Error("Invalid event list");
        events = data.events.filter(validEvent);
        render();
      })
      .catch(() => {
        failed = true;
        render();
      });
  }
  return { init, validEvent, selectEvents, localDay };
})();
