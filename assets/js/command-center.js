"use strict";
window.CommandCenter = (() => {
  // Intent routing is a local navigation demo, never a live agent or model request.
  const routes = {
    agents: {
      label: "Agent systems",
      reason: "Matched tool orchestration, document workflows, and evaluation.",
      ids: ["agents", "documents", "evaluations"],
    },
    retrieval: {
      label: "RAG & knowledge",
      reason:
        "Matched enterprise retrieval, financial documents, and local models.",
      ids: ["enterprise-rag", "financial", "local"],
    },
    research: {
      label: "Research & ML",
      reason:
        "Matched language research, human-centered ML, and assistive systems.",
      ids: ["translation", "cognitive-load", "chair"],
    },
    planned: {
      label: "What's next",
      reason: "Matched future designs. These projects are not implemented yet.",
      ids: ["agent-observatory", "incident-copilot", "paper-to-experiment"],
    },
  };
  function init({ projects, showProject }) {
    const $ = (s) => document.querySelector(s);
    const make = (tag, className, text) => {
      const node = document.createElement(tag);
      node.className = className;
      node.textContent = text;
      return node;
    };
    const built = projects.filter((p) => p.lifecycle !== "planned");
    $("#metric-total").textContent = projects.length;
    $("#metric-built").textContent = built.length;
    $("#metric-planned").textContent = String(
      projects.length - built.length
    ).padStart(2, "0");
    $("#sidebar-project-count").textContent = projects.length;
    const pinned = $("#sidebar-agents");
    for (const id of ["agents", "enterprise-rag", "documents"]) {
      const project = projects.find((p) => p.id === id);
      if (!project) continue;
      const button = make("button", "sidebar-agent", project.title);
      button.addEventListener("click", () => showProject(id));
      pinned.append(button);
    }
    const logs = $("#mission-log-list");
    for (const id of [
      "documents",
      "enterprise-rag",
      "evaluations",
      "cognitive-load",
    ]) {
      const project = projects.find((p) => p.id === id);
      if (!project) continue;
      const button = make("button", "mission-row", "");
      const copy = make("span", "", "");
      copy.append(
        make("strong", "", project.title),
        make("small", "", project.summary)
      );
      button.append(
        make("span", "log-period", project.activityLabel || project.year),
        copy,
        make("span", "log-record", "Read brief ↗")
      );
      button.addEventListener("click", () => showProject(id));
      logs.append(button);
    }
    document.querySelectorAll("[data-route]").forEach((button) => {
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        const route = routes[button.dataset.route];
        if (!route) return;
        document
          .querySelectorAll("[data-route]")
          .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        const matches = route.ids
          .map((id) => projects.find((p) => p.id === id))
          .filter(Boolean);
        const log = $("#router-log");
        log.replaceChildren();
        [
          `Exploring: ${route.label}`,
          route.reason,
          `${matches.length} projects found. Select a brief below.`,
        ].forEach((line, index) => {
          const p = make("p", "", "");
          p.append(
            make("span", "", String(index + 1).padStart(2, "0")),
            document.createTextNode(line)
          );
          log.append(p);
        });
        const results = $("#route-results");
        results.replaceChildren();
        matches.forEach((project) => {
          const result = make("button", "route-result", ""),
            text = make("span", "", "");
          text.append(
            make("strong", "", project.title),
            make(
              "small",
              "",
              project.lifecycle === "planned"
                ? "Planned concept · Not implemented"
                : project.role || project.type
            )
          );
          result.append(text, make("span", "", "↗"));
          result.addEventListener("click", () => showProject(project.id));
          results.append(result);
        });
      });
    });
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const link = document.querySelector(
              `.nav a[href="#${entry.target.id}"]`
            );
            if (link) {
              const copy = link.cloneNode(true);
              copy
                .querySelectorAll("span, small")
                .forEach((node) => node.remove());
              $("#current-section").textContent = copy.textContent.trim();
            }
          }
        },
        { rootMargin: "-10% 0px -60% 0px" }
      );
      document
        .querySelectorAll("main section[id]")
        .forEach((section) => observer.observe(section));
    }
  }
  return { init, routes };
})();
