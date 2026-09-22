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
    const previous = document.activeElement;
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
  $$(".filter").forEach((button) =>
    button.addEventListener("click", () => {
      $$(".filter").forEach((b) =>
        b.setAttribute("aria-pressed", String(b === button))
      );
      $$(".project").forEach((card) => {
        card.hidden =
          button.dataset.filter !== "all" &&
          card.dataset.category !== button.dataset.filter;
      });
    })
  );
  function showProject(id) {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    $("#project-title").textContent = project.title;
    $("#project-type").textContent = project.type;
    $("#project-description").textContent = project.detail;
    $("#project-outcome").textContent = project.outcome;
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
        : "Explore repository ↗"
      : "Talk about this project ↗";
    if (project.link) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    $("#project-actions").append(link);
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
    { title: "Play Orbit Runner", type: "Arcade", run: launchGame },
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
  $("#open-copilot").addEventListener("click", () => openDialog("#copilot"));
  const knowledge = [
    {
      words: ["agent", "mcp", "tool", "orchestrat"],
      text: "Kshitij builds agentic workflows at EOX Vantage, connecting enterprise data, tools, and contextual retrieval. Explore the enterprise agents mission for a quick architecture walkthrough.",
      link: "#missions",
      label: "Explore AI missions",
    },
    {
      words: ["rag", "retriev", "financial", "document", "insurance"],
      text: "His work spans enterprise RAG, insurance document intelligence, and financial document reasoning. The financial project uses Llama 3.2, LangChain, FAISS, and a table-aware splitter; his resume reports a 35% retrieval accuracy improvement.",
      link: "#missions",
      label: "Browse retrieval projects",
    },
    {
      words: ["experience", "work", "career", "eox", "scale", "job", "role"],
      text: "Currently: AI Engineer at EOX Vantage (February 2026–present). Previously: ML Engineer, Gen AI at Scale AI (February 2025–January 2026), research at Johns Hopkins CLSP and ARCADE, and ML engineering at MarwizTech.",
      link: "#trajectory",
      label: "See the full flight path",
    },
    {
      words: ["research", "paper", "publication", "fracture", "chair"],
      text: "Research includes Cognitive-Chair (IEEE Xplore, 2023; Best Paper Award, AIST 2022), orthopedic fracture detection (under review; Rapid Fire Presentation Award), and IoT environmental monitoring (Springer, 2021).",
      link: "#research",
      label: "Read the research",
    },
    {
      words: [
        "music",
        "fun",
        "hobb",
        "drum",
        "dj",
        "jiu",
        "soccer",
        "sport",
        "personal",
        "beyond",
      ],
      text: "Away from the terminal: drumming, DJing, Jiu Jitsu, and soccer. The side-quest deck has playable drum pads, a step sequencer, a breathing break, and a penalty challenge.",
      link: "#off-duty",
      label: "Try a side quest",
    },
    {
      words: ["education", "university", "degree", "hopkins", "study"],
      text: "Kshitij holds a master’s in Data Science from Johns Hopkins University and a BTech in Computer Science & Engineering from GSFC University. His Johns Hopkins research covered low-resource translation and cognitive load in telerobotic surgery.",
      link: "#trajectory",
      label: "Explore the background",
    },
    {
      words: ["contact", "email", "hire", "connect", "resume", "cv"],
      text: "Reach Kshitij at kshitijjoshi017@gmail.com. You can also find his GitHub, LinkedIn, and a downloadable resume here.",
      link: "#contact",
      label: "Open a channel",
    },
    {
      words: ["local", "llama", "fine", "lora"],
      text: "His personal AI assistant uses a local Llama 3.2 3B model, LoRA fine-tuning with Unsloth, and personalized retrieval and ranking. It is featured in the missions section.",
      link: "#missions",
      label: "Explore the local assistant",
    },
    {
      words: ["translation", "language", "nlp", "gujarati", "legal"],
      text: "At JHU CLSP, Kshitij researched Gujarati–English translation with MarianMT and NLLB. LegalEase fine-tunes IndicTrans for legal translation. His resume reports a 15% improvement on Flores200 and a 0.58 BLEU score for LegalEase.",
      link: "#missions",
      label: "Explore language research",
    },
    {
      words: ["skill", "python", "stack", "technolog"],
      text: "His toolkit spans Python, SQL, PyTorch, Hugging Face, LangGraph, LangChain, MCP, FastAPI, and cloud infrastructure. His focus is connecting models, retrieval, tools, and evaluation into useful systems.",
      link: "#trajectory",
      label: "See skills in context",
    },
  ];
  function ask(question) {
    const log = $(".chat-log");
    const user = document.createElement("div");
    user.className = "chat-message user";
    user.textContent = question;
    log.append(user);
    const q = question.toLowerCase();
    let best = null,
      bestScore = 0;
    knowledge.forEach((k) => {
      const score = k.words.reduce(
        (total, w) => total + (q.includes(w) ? 1 : 0),
        0
      );
      if (score > bestScore) {
        best = k;
        bestScore = score;
      }
    });
    const answer = document.createElement("div");
    answer.className = "chat-message";
    answer.textContent =
      best?.text ||
      "That is outside my small flight manual. I can help with projects, experience, education, research, skills, or hobbies. For anything else, send Kshitij a note.";
    const a = document.createElement("a");
    a.href = best?.link || "#contact";
    a.textContent = (best?.label || "Contact Kshitij") + " ↗";
    a.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(a.hash);
    });
    answer.append(a);
    log.append(answer);
    log.scrollTop = log.scrollHeight;
  }
  $(".chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $(".chat-form input");
    const value = input.value.trim();
    if (value) {
      ask(value);
      input.value = "";
    }
  });
  $$("[data-ask]").forEach((b) =>
    b.addEventListener("click", () => ask(b.dataset.ask))
  );

  // Audio is synthesized locally and starts only after an explicit user gesture.
  let audio,
    loopTimer = null,
    breatheTimer = null,
    soccerTimer = null;
  function audioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      toast("Audio is not supported in this browser.");
      return null;
    }
    if (!audio) audio = new AudioCtx();
    if (audio.state === "suspended") audio.resume();
    return audio;
  }
  function hit(kind) {
    const ctx = audioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    if (kind === "kick" || kind === "tom") {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(kind === "kick" ? 140 : 240, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.22);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + 0.32);
    } else {
      const length = kind === "snare" ? 0.15 : 0.055;
      const buffer = ctx.createBuffer(
        1,
        ctx.sampleRate * length,
        ctx.sampleRate
      );
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = kind === "snare" ? 1200 : 7000;
      noise.connect(filter);
      filter.connect(gain);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + length);
      noise.start(t);
      noise.stop(t + length);
    }
  }
  function cleanupHobby() {
    clearInterval(loopTimer);
    clearInterval(breatheTimer);
    clearInterval(soccerTimer);
    loopTimer = breatheTimer = soccerTimer = null;
  }
  $("#hobby-dialog").addEventListener("close", cleanupHobby);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (playing && !paused) togglePause();
      if (loopTimer) {
        cleanupHobby();
        const play = $("#loop-play");
        if (play) play.textContent = "Play loop";
      }
      if (soccerTimer || breatheTimer) $("#hobby-dialog").close();
    }
  });
  function showHobby(kind) {
    cleanupHobby();
    const area = $("#hobby-content");
    if (kind === "drums") {
      $("#hobby-title").textContent = "Find your pocket.";
      area.innerHTML =
        '<p>A tiny drum machine for a quick creative break. Tap a pad, or use the A / S / D / F keys. Sound starts when you play.</p><div class="pads"><button class="pad" data-sound="kick">A / KICK</button><button class="pad" data-sound="snare">S / SNARE</button><button class="pad" data-sound="hat">D / HI-HAT</button><button class="pad" data-sound="tom">F / TOM</button></div>';
      area
        .querySelectorAll("[data-sound]")
        .forEach((b) =>
          b.addEventListener("click", () => hit(b.dataset.sound))
        );
    }
    if (kind === "dj") {
      $("#hobby-title").textContent = "Build a little groove.";
      area.innerHTML =
        '<p>Eight steps. Infinite rabbit holes. Toggle the kick pattern, then press play for a 110 BPM loop with hi-hats.</p><div class="pattern">' +
        Array.from(
          { length: 8 },
          (_, i) =>
            `<button class="beat" aria-label="Step ${i + 1}" aria-pressed="${
              i % 4 === 0
            }" data-step="${i}"></button>`
        ).join("") +
        '</div><button class="btn primary" id="loop-play">Play loop</button><p class="copilot-note">Synthesized in your browser. No audio files or tracking.</p>';
      area
        .querySelectorAll(".beat")
        .forEach((b) =>
          b.addEventListener("click", () =>
            b.setAttribute(
              "aria-pressed",
              String(b.getAttribute("aria-pressed") !== "true")
            )
          )
        );
      $("#loop-play").addEventListener("click", () => {
        if (loopTimer) {
          clearInterval(loopTimer);
          loopTimer = null;
          $("#loop-play").textContent = "Play loop";
          $$(".beat").forEach((b) => (b.style.outline = ""));
          return;
        }
        audioContext();
        let step = 0;
        const tick = () => {
          const beats = $$(".beat");
          beats.forEach(
            (b, i) => (b.style.outline = i === step ? "2px solid #edf0e9" : "")
          );
          if (beats[step].getAttribute("aria-pressed") === "true") hit("kick");
          hit("hat");
          step = (step + 1) % 8;
        };
        tick();
        loopTimer = setInterval(tick, 60000 / 110 / 2);
        $("#loop-play").textContent = "Stop loop";
      });
    }
    if (kind === "jiu") {
      $("#hobby-title").textContent = "Find a moment of flow.";
      area.innerHTML =
        '<p>Jiu Jitsu is one of my off-screen pursuits. Take a short pause here before your next mission.</p><div style="display:grid;place-items:center;height:170px"><div id="breath" style="width:130px;height:130px;border:1px solid #d5f588;border-radius:50%;display:grid;place-items:center;background:#d5f5880d;font-family:var(--mono);font-size:14px" role="status">Ready?</div></div><button class="btn primary" id="breathe-start">Start a 24-second reset</button>';
      $("#breathe-start").addEventListener("click", () => {
        let seconds = 0;
        $("#breathe-start").disabled = true;
        const update = () => {
          const stage = Math.floor(seconds / 4) % 2;
          $("#breath").textContent = stage === 0 ? "Breathe in" : "Breathe out";
        };
        update();
        breatheTimer = setInterval(() => {
          seconds++;
          if (seconds >= 24) {
            clearInterval(breatheTimer);
            breatheTimer = null;
            $("#breath").textContent = "Back to orbit.";
            $("#breathe-start").disabled = false;
            return;
          }
          update();
        }, 1000);
      });
    }
    if (kind === "soccer") {
      $("#hobby-title").textContent = "One shot. Make it count.";
      area.innerHTML =
        '<p>Stop the moving ball in the green zone to score. A small timing challenge for the beautiful game.</p><div style="height:90px;position:relative;background:#14241c;border:1px solid #415c42;margin:25px 0;border-radius:5px"><div style="position:absolute;left:40%;width:20%;height:100%;background:#d5f58835;border-inline:1px solid #d5f588"></div><span id="soccer-ball" style="position:absolute;top:25px;left:0;font-size:25px;transform:translateX(-50%)">⚽</span></div><p id="penalty-result" role="status">Press start to line up your shot.</p><button class="btn primary" id="penalty">Start</button>';
      let position = 5,
        direction = 1;
      $("#penalty").addEventListener("click", () => {
        if (soccerTimer) {
          clearInterval(soccerTimer);
          soccerTimer = null;
          $("#penalty-result").textContent =
            position >= 40 && position <= 60
              ? "GOAL! Top corner energy."
              : "Just wide. Another shot?";
          $("#penalty").textContent = "Try again";
        } else {
          $("#penalty-result").textContent =
            "Watch the ball. Shoot in the green zone.";
          $("#penalty").textContent = "Shoot!";
          soccerTimer = setInterval(() => {
            position += direction * 2;
            if (position >= 95 || position <= 5) direction *= -1;
            $("#soccer-ball").style.left = position + "%";
          }, 22);
        }
      });
    }
    openDialog("#hobby-dialog");
    $("#hobby-dialog").dataset.kind = kind;
  }
  $$("[data-hobby]").forEach((b) =>
    b.addEventListener("click", () => showHobby(b.dataset.hobby))
  );
  document.addEventListener("keydown", (e) => {
    if (
      $("#hobby-dialog").open &&
      $("#hobby-dialog").dataset.kind === "drums" &&
      !e.repeat &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      const keys = { a: "kick", s: "snare", d: "hat", f: "tom" };
      const sound = keys[e.key.toLowerCase()];
      if (sound) {
        e.preventDefault();
        hit(sound);
        const pad = $(`[data-sound="${sound}"]`);
        pad.classList.add("hit");
        setTimeout(() => pad.classList.remove("hit"), 100);
      }
    }
  });

  const canvas = $("#game"),
    ctx = canvas.getContext("2d");
  let playing = false,
    paused = false,
    frame = 0,
    last = 0,
    elapsed = 0,
    spawn = 0,
    score = 0,
    ship = 360,
    objects = [],
    held = new Set(),
    bestScore = Number(storage.get("orbit-best", 0)) || 0;
  const stars = Array.from({ length: 65 }, (_, i) => ({
    x: (i * 137.51) % 720,
    y: (i * 71.31) % 400,
    size: i % 3 === 0 ? 1.5 : 0.7,
  }));
  function drawGame(message) {
    if (!ctx) return;
    ctx.fillStyle = "#080e14";
    ctx.fillRect(0, 0, 720, 400);
    for (const star of stars) {
      ctx.fillStyle = "#688177";
      ctx.fillRect(star.x, (star.y + elapsed * 12) % 400, star.size, star.size);
    }
    for (const object of objects) {
      ctx.fillStyle = object.signal ? "#d5f588" : "#e7996e";
      ctx.beginPath();
      if (object.signal) {
        ctx.moveTo(object.x, object.y - 9);
        ctx.lineTo(object.x + 7, object.y);
        ctx.lineTo(object.x, object.y + 9);
        ctx.lineTo(object.x - 7, object.y);
      } else {
        for (let i = 0; i < 7; i++) {
          const angle = (i / 7) * Math.PI * 2;
          const radius = object.radius * (i % 2 ? 0.83 : 1);
          const x = object.x + Math.cos(angle) * radius,
            y = object.y + Math.sin(angle) * radius;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#d5f588";
    ctx.beginPath();
    ctx.moveTo(ship, 335);
    ctx.lineTo(ship + 13, 365);
    ctx.lineTo(ship, 358);
    ctx.lineTo(ship - 13, 365);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8daf6e";
    ctx.fillRect(
      ship - 3,
      365,
      6,
      playing && !paused ? 12 + Math.sin(elapsed * 25) * 5 : 8
    );
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "#8d9d95";
    ctx.fillText(`BEST / ${bestScore}`, 20, 28);
    if (message) {
      ctx.fillStyle = "#080e14c9";
      ctx.fillRect(0, 120, 720, 105);
      ctx.textAlign = "center";
      ctx.fillStyle = "#e8efe3";
      ctx.font = "22px monospace";
      ctx.fillText(message, 360, 167);
      ctx.font = "12px monospace";
      ctx.fillStyle = "#a0b496";
      ctx.fillText("COLLECT SIGNALS. KEEP EXPLORING.", 360, 198);
    }
  }
  function launchGame() {
    openDialog("#game-dialog");
    drawGame("YOUR NEXT MISSION AWAITS");
  }
  function endGame() {
    playing = false;
    held.clear();
    cancelAnimationFrame(frame);
    bestScore = Math.max(bestScore, score);
    storage.set("orbit-best", bestScore);
    $("#start-game").textContent = "Try again";
    $("#pause-game").disabled = true;
    $("#game-score").textContent = `Flight complete · Signals: ${score}`;
    drawGame("SIGNAL LOST. CURIOSITY INTACT.");
  }
  function tick(time) {
    if (!playing || paused) return;
    const dt = Math.min((time - last) / 1000, 0.04);
    last = time;
    elapsed += dt;
    spawn += dt;
    if (held.has("left")) ship -= 340 * dt;
    if (held.has("right")) ship += 340 * dt;
    ship = Math.max(18, Math.min(702, ship));
    if (spawn > 0.6) {
      spawn = 0;
      objects.push({
        x: 25 + Math.random() * 670,
        y: -22,
        radius: 12 + Math.random() * 11,
        signal: Math.random() < 0.4,
        speed: 100 + Math.min(elapsed * 3, 190),
      });
    }
    for (const object of objects) {
      object.y += object.speed * dt;
      if (
        Math.hypot(object.x - ship, object.y - 350) <
        (object.signal ? 22 : object.radius + 10)
      ) {
        if (object.signal) {
          score++;
          object.y = 450;
          $("#game-score").textContent = `Signals: ${score}`;
        } else {
          endGame();
          return;
        }
      }
    }
    objects = objects.filter((o) => o.y < 430);
    drawGame();
    frame = requestAnimationFrame(tick);
  }
  function startGame() {
    cancelAnimationFrame(frame);
    playing = true;
    paused = false;
    elapsed = 0;
    spawn = 0;
    score = 0;
    ship = 360;
    objects = [];
    held.clear();
    $("#start-game").textContent = "Restart";
    $("#pause-game").disabled = false;
    $("#pause-game").textContent = "Pause";
    $("#game-score").textContent = "Signals: 0";
    last = performance.now();
    canvas.focus();
    frame = requestAnimationFrame(tick);
  }
  function togglePause() {
    if (!playing) return;
    paused = !paused;
    $("#pause-game").textContent = paused ? "Resume" : "Pause";
    held.clear();
    if (paused) {
      cancelAnimationFrame(frame);
      drawGame("HOLDING ORBIT");
    } else {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  $("#play-game").addEventListener("click", launchGame);
  $("#start-game").addEventListener("click", startGame);
  $("#pause-game").addEventListener("click", togglePause);
  $("#game-dialog").addEventListener("close", () => {
    playing = false;
    paused = false;
    held.clear();
    cancelAnimationFrame(frame);
    $("#pause-game").disabled = true;
  });
  document.addEventListener("keydown", (e) => {
    if (!$("#game-dialog").open) return;
    const key = e.key.toLowerCase();
    if (["arrowleft", "a", "arrowright", "d"].includes(key)) {
      e.preventDefault();
      held.add(["arrowleft", "a"].includes(key) ? "left" : "right");
    }
    if (key === "p" && !e.repeat) togglePause();
  });
  document.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    if (["arrowleft", "a"].includes(key)) held.delete("left");
    if (["arrowright", "d"].includes(key)) held.delete("right");
  });
  window.addEventListener("blur", () => {
    held.clear();
    if (playing && !paused) togglePause();
  });
  for (const direction of ["left", "right"]) {
    const b = $(`#move-${direction}`);
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      held.add(direction);
    });
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
      b.addEventListener(name, () => held.delete(direction));
  }
  canvas.style.touchAction = "none";
  let dragging = false;
  function steer(e) {
    if (!playing) return;
    const bounds = canvas.getBoundingClientRect();
    ship = Math.max(
      18,
      Math.min(702, ((e.clientX - bounds.left) / bounds.width) * 720)
    );
  }
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    steer(e);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) steer(e);
  });
  canvas.addEventListener("pointerup", () => (dragging = false));
  canvas.addEventListener("pointercancel", () => (dragging = false));
  drawGame("YOUR NEXT MISSION AWAITS");
})();
