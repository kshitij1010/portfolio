"use strict";
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const projects = window.PORTFOLIO_PROJECTS;
  const storage = {
    get(key, fallback) {
      try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* Private browsing still works. */
      }
    },
  };
  const saved = storage.get("orbit-missions", []);
  const explored = new Set(
    Array.isArray(saved)
      ? saved.filter((id) => projects.some((p) => p.id === id))
      : []
  );
  let toastTimer;
  function toast(message) {
    const node = $(".toast");
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      node.hidden = true;
    }, 3500);
  }
  function passport() {
    $("#mission-progress").textContent = `${explored.size} / ${
      projects.length
    } explored${
      explored.size === projects.length ? " · Universe explorer unlocked ✧" : ""
    }`;
  }
  passport();
  $("#year").textContent = new Date().getFullYear();
  let focusBeforeDialog;
  function openDialog(id) {
    const dialog = $(id);
    if (dialog.open) return;
    const previous = $("dialog[open]")
      ? focusBeforeDialog
      : document.activeElement;
    $$("dialog[open]").forEach((d) => d.close());
    focusBeforeDialog = previous;
    dialog.showModal();
    document.body.style.overflow = "hidden";
  }
  $$("dialog").forEach((dialog) => {
    dialog
      .querySelector(".close")
      .addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          dialog.close();
      }
    });
    dialog.addEventListener("close", () => {
      if (!$("dialog[open]")) {
        document.body.style.overflow = "";
        if (focusBeforeDialog?.isConnected)
          focusBeforeDialog.focus({ preventScroll: true });
      }
    });
  });
  function navigate(target) {
    $$("dialog[open]").forEach((d) => d.close());
    $(target)?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    history.replaceState(null, "", target);
  }
  $(".mobile-menu").addEventListener("click", () => {
    const expanded = $(".nav").classList.toggle("open");
    $(".mobile-menu").setAttribute("aria-expanded", String(expanded));
  });
  $$(".nav a").forEach((a) =>
    a.addEventListener("click", () => {
      $(".nav").classList.remove("open");
      $(".mobile-menu").setAttribute("aria-expanded", "false");
    })
  );
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting)
            $$(".nav a").forEach((a) =>
              a.classList.toggle("active", a.hash === `#${entry.target.id}`)
            );
        });
      },
      { rootMargin: "-15% 0px -60% 0px" }
    );
    $$("main section[id]").forEach((s) => observer.observe(s));
  }
  let activeFilter = "all",
    expanded = false;
  function filterProjects() {
    const query = $("#project-search").value.toLowerCase().trim();
    const matching = projects.filter(
      (p) =>
        (activeFilter === "all" ||
          (activeFilter === "eox"
            ? p.employer === "EOX Vantage"
            : activeFilter === "planned"
            ? p.lifecycle === "planned"
            : p.category === activeFilter)) &&
        `${p.title} ${p.summary} ${p.tags.join(" ")} ${p.employer || ""}`
          .toLowerCase()
          .includes(query)
    );
    const shown =
      activeFilter === "all" && !query && !expanded
        ? matching.slice(0, 6)
        : matching;
    const ids = new Set(shown.map((p) => p.id));
    $$(".project").forEach((card) => (card.hidden = !ids.has(card.dataset.id)));
    $("#project-count").textContent = matching.length
      ? `Showing ${shown.length} of ${matching.length} missions${
          activeFilter === "planned"
            ? " · Design concepts, not completed work"
            : ""
        }`
      : "No matching missions. Try another technology or clear your search.";
    $("#more-projects").hidden = !(
      activeFilter === "all" &&
      !query &&
      matching.length > 6
    );
    $("#more-projects").textContent = expanded
      ? "Show selected missions ↑"
      : `Explore all ${matching.length} missions ↓`;
  }
  $$(".filters .filter").forEach((button) =>
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      $$(".filters .filter").forEach((b) =>
        b.setAttribute("aria-pressed", String(b === button))
      );
      filterProjects();
    })
  );
  $("#project-search").addEventListener("input", filterProjects);
  $("#more-projects").addEventListener("click", () => {
    expanded = !expanded;
    filterProjects();
    if (!expanded) $("#missions").scrollIntoView();
  });
  filterProjects();
  function showProject(id) {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    $("#project-title").textContent = project.title;
    $("#project-type").textContent =
      (project.lifecycle === "planned" ? "PLANNED / " : "") + project.type;
    $("#project-description").textContent = project.detail;
    $("#project-outcome").textContent = project.outcome;
    $("#project-dialog").dataset.lifecycle = project.lifecycle || "built";
    $("#project-highlights").replaceChildren();
    (project.highlights || []).forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      $("#project-highlights").append(li);
    });
    $("#project-source").replaceChildren();
    if (project.sourceUrl) {
      const a = document.createElement("a");
      a.href = project.sourceUrl;
      a.textContent = `Source: ${project.sourceLabel}`;
      a.target = "_blank";
      a.rel = "noopener";
      $("#project-source").append(a);
    }

    $("#project-flow").replaceChildren();
    project.flow.forEach((stage, i) => {
      if (i) {
        const arrow = document.createElement("i");
        arrow.textContent = "→";
        $("#project-flow").append(arrow);
      }
      const node = document.createElement("span");
      node.textContent = stage;
      $("#project-flow").append(node);
    });
    $("#project-tags").replaceChildren();
    project.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.textContent = tag;
      $("#project-tags").append(span);
    });
    $("#project-actions").replaceChildren();
    const link = document.createElement("a");
    link.className = "btn primary";
    link.href = project.link || "mailto:kshitijjoshi017@gmail.com";
    link.textContent = project.link
      ? id === "chair"
        ? "Read the paper ↗"
        : /github\.com/.test(project.link)
        ? "Explore repository ↗"
        : "Historical case study ↗"
      : "Talk about this project ↗";
    if (project.link) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    $("#project-actions").append(link);
    const share = document.createElement("button");
    share.className = "btn";
    share.textContent = "Copy mission link ⧉";
    share.addEventListener("click", async () => {
      const url = new URL(location.href);
      url.searchParams.set("mission", project.id);
      url.hash = "missions";
      try {
        await navigator.clipboard.writeText(url.href);
        toast("Mission link copied.");
      } catch {
        toast(url.href);
      }
    });
    $("#project-actions").append(share);
    const askButton = document.createElement("button");
    askButton.className = "btn";
    askButton.textContent = "Ask Orbit about this ✧";
    askButton.addEventListener("click", () =>
      window.OrbitCopilot.openTopic(project.id)
    );
    $("#project-actions").append(askButton);

    openDialog("#project-dialog");
    explored.add(id);
    storage.set("orbit-missions", [...explored]);
    passport();
  }
  $$("[data-project]").forEach((button) =>
    button.addEventListener("click", () => showProject(button.dataset.project))
  );
  $("#fracture-detail").addEventListener("click", () => {
    $("#hobby-dialog").dataset.kind = "";
    $("#hobby-title").textContent = "AI for fracture detection";
    $("#hobby-content").innerHTML =
      '<p>Evaluation of Artificial Intelligence Methods for Fracture Detection in Orthopedic X-Rays explores machine learning approaches to orthopedic imaging.</p><p>The work received a Rapid Fire Presentation Award from the Clinical Orthopedic Society. The manuscript is listed as <strong>under review</strong> in my current resume.</p><a class="btn primary" href="mailto:kshitijjoshi017@gmail.com">Ask about the research ↗</a>';
    openDialog("#hobby-dialog");
  });
  $("#copy-email").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("kshitijjoshi017@gmail.com");
      toast("Email copied. Say hello!");
    } catch {
      toast("kshitijjoshi017@gmail.com");
    }
  });
  const commands = [
    {
      title: "Photo journals, travel & personal blog",
      type: "Field notes",
      run: () => navigate("#journal"),
    },
    {
      title: "Explore all missions",
      type: "Destination",
      run: () => navigate("#missions"),
    },
    {
      title: "Experience & education",
      type: "Flight path",
      run: () => navigate("#trajectory"),
    },
    {
      title: "Research & publications",
      type: "Destination",
      run: () => navigate("#research"),
    },
    {
      title: "Drumming, DJing, Jiu Jitsu & soccer",
      type: "Side quests",
      run: () => navigate("#off-duty"),
    },
    {
      title: "Contact Kshitij",
      type: "Open a channel",
      run: () => navigate("#contact"),
    },
    {
      title: "Play Orbit Runner",
      type: "Arcade",
      run: () => window.OrbitArcade.launchGame(),
    },
    {
      title: "Ask Orbit, the portfolio guide",
      type: "Copilot",
      run: () => openDialog("#copilot"),
    },
    ...projects.map((p) => ({
      title: p.title,
      type: "Project",
      run: () => showProject(p.id),
    })),
  ];
  function renderCommands() {
    const q = $("#command-search").value.toLowerCase().trim();
    const container = $("#command-results");
    container.replaceChildren();
    const matches = commands.filter((c) =>
      `${c.title} ${c.type}`.toLowerCase().includes(q)
    );
    matches.forEach((c) => {
      const b = document.createElement("button");
      const name = document.createElement("span");
      name.textContent = c.title;
      const type = document.createElement("small");
      type.textContent = c.type;
      b.append(name, type);
      b.addEventListener("click", c.run);
      container.append(b);
    });
    if (!matches.length) {
      const p = document.createElement("p");
      p.className = "no-results";
      p.textContent = "No signals here. Try “research”, “AI”, or “play”.";
      container.append(p);
    }
  }
  function commandPalette() {
    $("#command-search").value = "";
    renderCommands();
    openDialog("#command-dialog");
    $("#command-search").focus();
  }
  $(".command-trigger").addEventListener("click", commandPalette);
  $("#command-search").addEventListener("input", renderCommands);
  $("#command-search").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      $("#command-results button")?.click();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      $("#command-results button")?.focus();
    }
  });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      $("#command-dialog").open
        ? $("#command-dialog").close()
        : commandPalette();
    }
  });
  window.OrbitCopilot.init({ openDialog, navigate, toast });
  window.OrbitArcade.init({ openDialog, toast, storage });
  window.OrbitJournal.init({ openDialog });
  const themeButton = $("#theme-toggle");
  function setTheme(value) {
    document.documentElement.dataset.palette = value;
    themeButton.setAttribute("aria-pressed", String(value === "aurora"));
    themeButton.querySelector("span").textContent =
      value === "aurora" ? "AURORA" : "SUPERNOVA";
  }
  setTheme(storage.get("orbit-palette", "supernova"));
  themeButton.addEventListener("click", () => {
    const next =
      document.documentElement.dataset.palette === "aurora"
        ? "supernova"
        : "aurora";
    setTheme(next);
    storage.set("orbit-palette", next);
  });
  const deepLink = new URLSearchParams(location.search).get("mission");
  if (deepLink && projects.some((p) => p.id === deepLink))
    showProject(deepLink);
})();
