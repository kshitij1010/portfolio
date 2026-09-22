"use strict";
/* Local-first side quests: no network requests, accounts, or external audio. */
window.OrbitArcade = (() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let api,
    initialized = false,
    audio,
    master,
    hobbyCleanup = () => {},
    drumHit;
  const voices = new Set();
  function audioContext() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    if (!audio) {
      audio = new Audio();
      master = audio.createGain();
      master.gain.value = 0.45;
      const limiter = audio.createDynamicsCompressor();
      master.connect(limiter);
      limiter.connect(audio.destination);
    }
    if (audio.state === "suspended") audio.resume().catch(() => {});
    return audio;
  }
  function sound(kind) {
    const ctx = audioContext();
    if (!ctx) return;
    const now = ctx.currentTime,
      gain = ctx.createGain();
    gain.connect(master);
    let source, duration;
    if (["snare", "hat"].includes(kind)) {
      duration = kind === "snare" ? 0.14 : 0.045;
      const buffer = ctx.createBuffer(
        1,
        ctx.sampleRate * duration,
        ctx.sampleRate
      );
      const values = buffer.getChannelData(0);
      for (let i = 0; i < values.length; i++) values[i] = Math.random() * 2 - 1;
      source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = kind === "snare" ? 1600 : 7500;
      source.connect(filter);
      filter.connect(gain);
      gain.gain.setValueAtTime(kind === "snare" ? 0.6 : 0.32, now);
    } else {
      duration = kind === "kick" ? 0.24 : kind === "tom" ? 0.2 : 0.08;
      source = ctx.createOscillator();
      source.type = kind === "tick" ? "triangle" : "sine";
      const frequency =
        { kick: 155, tom: 250, tick: 950, signal: 640, shield: 430 }[kind] ||
        440;
      source.frequency.setValueAtTime(frequency, now);
      source.frequency.exponentialRampToValueAtTime(
        kind === "kick" ? 42 : frequency * 0.5,
        now + duration
      );
      source.connect(gain);
      gain.gain.setValueAtTime(kind === "tick" ? 0.16 : 0.6, now);
    }
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    voices.add(source);
    source.onended = () => {
      voices.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    source.start(now);
    source.stop(now + duration);
  }
  function silence() {
    for (const voice of voices) {
      try {
        voice.stop();
      } catch {
        /* Already ended. */
      }
    }
    voices.clear();
    if (audio?.state === "running") audio.suspend().catch(() => {});
  }
  function cleanHobby() {
    hobbyCleanup();
    hobbyCleanup = () => {};
    drumHit = null;
    silence();
  }
  function shell(title, subtitle, html) {
    $("#hobby-title").textContent = title;
    $(
      "#hobby-content"
    ).innerHTML = `<p class="arcade-intro">${subtitle}</p>${html}`;
  }
  const stepsMarkup = (className) =>
    `<div class="${className}" aria-hidden="true">${Array.from(
      { length: 16 },
      (_, i) =>
        `<span data-position="${i}">${
          i % 2 === 0 ? ((i / 2) % 4) + 1 : "·"
        }</span>`
    ).join("")}</div>`;
  function tempoMarkup(id, value) {
    return `<label class="arcade-range" for="${id}"><span>Tempo <output id="${id}-value">${value}</output> BPM</span><input id="${id}" type="range" min="60" max="160" value="${value}" step="1"></label>`;
  }
  function drums() {
    shell(
      "The zero-gravity pocket.",
      "A two-bar rhythm lab. Play the pads, record a groove, then loop it at a new tempo. A / S / D / F work while this window is open.",
      `<div class="arcade-console"><div class="arcade-console-top"><span>ORBIT / RHYTHM LAB</span><span class="arcade-badge">16 steps · 2 bars</span></div>
      <div class="arcade-pads">${[
        ["kick", "A", "01 / Foundation"],
        ["snare", "S", "02 / Backbeat"],
        ["hat", "D", "03 / Texture"],
        ["tom", "F", "04 / Color"],
      ]
        .map(
          ([kind, key, detail]) =>
            `<button class="arcade-pad" data-sound="${kind}" aria-label="Play ${kind}, keyboard ${key}"><kbd>${key}</kbd><strong>${
              kind === "hat" ? "HI-HAT" : kind.toUpperCase()
            }</strong><small>${detail}</small></button>`
        )
        .join("")}</div>
      ${stepsMarkup("drum-timeline")}
      <div class="arcade-settings">${tempoMarkup(
        "drum-tempo",
        110
      )}<button class="btn arcade-small" id="drum-metronome" aria-pressed="false">Metronome off</button></div>
      <div class="arcade-actions"><button class="btn primary" id="drum-record">● Record 2 bars</button><button class="btn" id="drum-play" disabled>↻ Play recording</button><button class="btn" id="drum-clear" disabled>Clear</button></div>
      <p class="arcade-status" id="drum-status" role="status">Your first beat starts here. Sound turns on when you play.</p></div>`
    );
    let tempo = 110,
      recording = false,
      playback = false,
      metronome = false,
      timer,
      metroTimer,
      events = [],
      start = 0,
      step = 0;
    const timeline = $$(".drum-timeline span");
    function highlight(index) {
      timeline.forEach((el, i) => el.classList.toggle("current", i === index));
    }
    function renderEvents() {
      timeline.forEach((el, i) =>
        el.classList.toggle(
          "recorded",
          events.some((event) => event.step === i)
        )
      );
    }
    function stop() {
      clearTimeout(timer);
      recording = playback = false;
      $("#drum-record").textContent = "● Record 2 bars";
      $("#drum-play").textContent = "↻ Play recording";
      $("#drum-play").disabled = !events.length;
      $("#drum-clear").disabled = !events.length;
      $("#drum-tempo").disabled = false;
      highlight(-1);
    }
    function tick() {
      if (!recording && !playback) return;
      highlight(step);
      if (playback)
        events
          .filter((event) => event.step === step)
          .forEach((event) => sound(event.kind));
      if (metronome && step % 2 === 0) sound("tick");
      step++;
      timer = setTimeout(() => {
        if (step === 16 && recording) {
          stop();
          $("#drum-status").textContent = events.length
            ? `${events.length} hits captured. Play it back or build a new groove.`
            : "No hits captured. Press record, then play the pads.";
          return;
        }
        step %= 16;
        tick();
      }, 30000 / tempo);
    }
    function restartMetro() {
      clearInterval(metroTimer);
      if (metronome)
        metroTimer = setInterval(() => {
          if (!recording && !playback) sound("tick");
        }, 60000 / tempo);
    }
    drumHit = (kind) => {
      sound(kind);
      const pad = $(`[data-sound="${kind}"]`);
      pad.classList.remove("hit");
      // A single CSS animation avoids a timer per pad hit.
      void pad.offsetWidth;
      pad.classList.add("hit");
      if (recording) {
        const recordedStep = Math.min(
          15,
          Math.floor((performance.now() - start) / (30000 / tempo))
        );
        if (
          !events.some(
            (event) => event.kind === kind && event.step === recordedStep
          )
        )
          events.push({ kind, step: recordedStep });
        renderEvents();
      }
    };
    $$("[data-sound]").forEach((button) =>
      button.addEventListener("click", () => drumHit(button.dataset.sound))
    );
    $("#drum-record").addEventListener("click", () => {
      if (recording) {
        stop();
        $("#drum-status").textContent =
          "Recording stopped. Your captured hits are ready to loop.";
        return;
      }
      stop();
      audioContext();
      events = [];
      renderEvents();
      recording = true;
      step = 0;
      start = performance.now();
      $("#drum-tempo").disabled = true;
      $("#drum-play").disabled = true;
      $("#drum-clear").disabled = true;
      $("#drum-record").textContent = "■ Stop recording";
      $("#drum-status").textContent =
        "Recording now — two bars, sixteen eighth-note steps. Play!";
      tick();
    });
    $("#drum-play").addEventListener("click", () => {
      if (playback) {
        stop();
        $("#drum-status").textContent =
          "Loop stopped. Your groove is still here.";
        return;
      }
      stop();
      audioContext();
      playback = true;
      step = 0;
      $("#drum-play").textContent = "■ Stop loop";
      $("#drum-status").textContent =
        "Your groove is looping. Change the tempo to find a new pocket.";
      tick();
    });
    $("#drum-clear").addEventListener("click", () => {
      stop();
      events = [];
      stop();
      renderEvents();
      $("#drum-status").textContent =
        "A clean slate. Make something unexpected.";
    });
    $("#drum-metronome").addEventListener("click", (event) => {
      metronome = !metronome;
      event.currentTarget.setAttribute("aria-pressed", String(metronome));
      event.currentTarget.textContent = `Metronome ${metronome ? "on" : "off"}`;
      if (metronome) {
        audioContext();
        if (!recording && !playback) sound("tick");
      }
      restartMetro();
    });
    $("#drum-tempo").addEventListener("input", (event) => {
      tempo = Number(event.target.value);
      $("#drum-tempo-value").textContent = tempo;
      restartMetro();
    });
    hobbyCleanup = () => {
      clearTimeout(timer);
      clearInterval(metroTimer);
    };
  }
  const presets = {
    house: [
      [0, 4, 8, 12],
      [4, 12],
      [2, 6, 10, 14],
    ],
    broken: [
      [0, 3, 8, 10],
      [4, 12],
      [0, 2, 5, 6, 8, 10, 13, 14],
    ],
    gravity: [
      [0, 7, 10],
      [4, 11, 12],
      [0, 3, 6, 8, 11, 14],
    ],
  };
  function dj() {
    shell(
      "A tiny club. Your universe.",
      "Sculpt a 16-step loop across three tracks. Each column is a sixteenth note; brighter boundaries mark the beat. Switch grooves, add swing, and save your own pattern.",
      `<div class="arcade-console"><div class="arcade-console-top"><span>DEEP SPACE / MIXER</span><span class="arcade-badge" id="dj-position">STANDBY</span></div>
      <div class="dj-presets"><label for="dj-preset">Launch a groove</label><select id="dj-preset"><option value="house">Lunar house</option><option value="broken">Broken orbit</option><option value="gravity">Zero gravity</option></select><button class="btn arcade-small" id="dj-load">Load preset</button></div>
      <div class="dj-tracks">${["kick", "snare", "hat"]
        .map(
          (kind) =>
            `<div class="dj-track"><button class="dj-track-label" data-mute="${kind}" aria-pressed="false" aria-label="Mute ${kind}">${
              kind === "hat" ? "HI-HAT" : kind.toUpperCase()
            }<small>LIVE</small></button><div class="dj-steps">${Array.from(
              { length: 16 },
              (_, i) =>
                `<button data-track="${kind}" data-step="${i}" class="dj-step" aria-label="${kind}, step ${
                  i + 1
                }" aria-pressed="false">${i + 1}</button>`
            ).join("")}</div></div>`
        )
        .join("")}</div>
      <div class="arcade-settings">${tempoMarkup(
        "dj-tempo",
        118
      )}<label class="arcade-range" for="dj-swing"><span>Swing <output id="dj-swing-value">0</output>%</span><input type="range" id="dj-swing" min="0" max="35" value="0"></label></div>
      <div class="arcade-actions"><button class="btn primary" id="dj-play">▶ Play groove</button><button class="btn" id="dj-save">Save groove</button><button class="btn" id="dj-clear">Clear all</button></div>
      <p class="arcade-status" id="dj-status" role="status">Three tracks. Sixteen steps. Find a rhythm that feels like you.</p><p class="arcade-footnote">Saved on this device. Synthesized here in your browser.</p></div>`
    );
    let tempo = 118,
      swing = 0,
      playing = false,
      step = 0,
      timer;
    const kinds = ["kick", "snare", "hat"],
      muted = new Set();
    let pattern = Object.fromEntries(
      kinds.map((kind, i) => [kind, [...presets.house[i]]])
    );
    const saved = api.storage.get("orbit-groove-v2", null);
    if (
      saved &&
      kinds.every(
        (kind) =>
          Array.isArray(saved[kind]) &&
          saved[kind].every(
            (value) => Number.isInteger(value) && value >= 0 && value < 16
          )
      )
    )
      pattern = saved;
    function render() {
      $$(".dj-step").forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(
            pattern[button.dataset.track].includes(Number(button.dataset.step))
          )
        )
      );
    }
    function stop() {
      clearTimeout(timer);
      playing = false;
      $("#dj-play").textContent = "▶ Play groove";
      $("#dj-position").textContent = "STANDBY";
      $$(".dj-step").forEach((button) => button.classList.remove("current"));
    }
    function tick() {
      if (!playing) return;
      $$(".dj-step").forEach((button) =>
        button.classList.toggle("current", Number(button.dataset.step) === step)
      );
      kinds.forEach((kind) => {
        if (!muted.has(kind) && pattern[kind].includes(step)) sound(kind);
      });
      $("#dj-position").textContent = `BEAT ${
        Math.floor(step / 4) + 1
      } / STEP ${step + 1}`;
      const delay =
        (15000 / tempo) * (1 + (step % 2 === 0 ? swing : -swing) / 100);
      step = (step + 1) % 16;
      timer = setTimeout(tick, delay);
    }
    render();
    $$(".dj-step").forEach((button) =>
      button.addEventListener("click", () => {
        const kind = button.dataset.track,
          value = Number(button.dataset.step);
        pattern[kind] = pattern[kind].includes(value)
          ? pattern[kind].filter((n) => n !== value)
          : [...pattern[kind], value];
        render();
      })
    );
    $$("[data-mute]").forEach((button) =>
      button.addEventListener("click", () => {
        const kind = button.dataset.mute;
        muted.has(kind) ? muted.delete(kind) : muted.add(kind);
        button.setAttribute("aria-pressed", String(muted.has(kind)));
        button.setAttribute(
          "aria-label",
          `${muted.has(kind) ? "Unmute" : "Mute"} ${kind}`
        );
        $("small", button).textContent = muted.has(kind) ? "MUTED" : "LIVE";
      })
    );
    $("#dj-load").addEventListener("click", () => {
      pattern = Object.fromEntries(
        kinds.map((kind, i) => [kind, [...presets[$("#dj-preset").value][i]]])
      );
      render();
      $("#dj-status").textContent =
        "Preset loaded. Make it your own with a few changes.";
    });
    $("#dj-play").addEventListener("click", () => {
      if (playing) {
        stop();
        $("#dj-status").textContent =
          "Groove paused. All your edits are still here.";
      } else {
        audioContext();
        playing = true;
        step = 0;
        $("#dj-play").textContent = "■ Stop groove";
        $("#dj-status").textContent =
          "Live. Toggle steps or mute tracks as the loop plays.";
        tick();
      }
    });
    $("#dj-clear").addEventListener("click", () => {
      kinds.forEach((kind) => (pattern[kind] = []));
      render();
      $("#dj-status").textContent = "All steps cleared. Build from silence.";
    });
    $("#dj-save").addEventListener("click", () => {
      api.storage.set("orbit-groove-v2", pattern);
      $("#dj-status").textContent =
        "Groove saved on this device. It will be here next time.";
    });
    $("#dj-tempo").addEventListener("input", (event) => {
      tempo = Number(event.target.value);
      $("#dj-tempo-value").textContent = tempo;
    });
    $("#dj-swing").addEventListener("input", (event) => {
      swing = Number(event.target.value);
      $("#dj-swing-value").textContent = swing;
    });
    hobbyCleanup = stop;
  }
  function jiu() {
    const decisions = [
      {
        title: "Before the round",
        text: "A new training partner asks what kind of round you want. What sets up a useful session?",
        choices: ["Agree on pace and a focus", "Keep the plan a mystery"],
        answer: 0,
        why: "Clear expectations help both partners practice deliberately. Communication is part of the skill.",
      },
      {
        title: "A position feels unfamiliar",
        text: "You cannot see a clear path through a position during technical practice. What is a useful next step?",
        choices: [
          "Rush to make something happen",
          "Pause, ask, and reset the position",
        ],
        answer: 1,
        why: "A thoughtful reset gives you a chance to understand the position with your coach or partner. Curiosity beats guessing.",
      },
      {
        title: "After the round",
        text: "You noticed the same decision point several times. What makes the next session more focused?",
        choices: [
          "Pick one question to work on",
          "Try to remember every detail",
        ],
        answer: 0,
        why: "One specific question creates a manageable practice goal. Small, repeatable learning loops add up.",
      },
    ];
    shell(
      "Stay curious. Find your flow.",
      "Jiu Jitsu is a practice in attention, patience, and adaptation. Explore three off-the-mat choices, then take an optional quiet reset.",
      `<div class="arcade-console"><div class="arcade-console-top"><span>THE MAT / MINDSET LAB</span><span class="arcade-badge" id="jiu-progress">01 / 03</span></div><div class="jiu-flow"><div class="jiu-orbit" aria-hidden="true"><span>心</span></div><div><h3 id="jiu-question-title"></h3><p id="jiu-question"></p></div></div><div class="jiu-choices" id="jiu-choices"></div><p class="arcade-status" id="jiu-feedback" role="status">Choose a response to explore the idea.</p><button class="btn" id="jiu-next" hidden>Next decision →</button></div>
      <div class="breath-card"><div id="breath-orb" class="breath-orb"><span id="breath-label">RESET</span></div><div><h3>A little room to breathe.</h3><p>Three gentle cycles: four seconds in, four seconds out. Follow your own comfortable pace.</p><button class="btn" id="breathe-start">Begin 24-second pause</button><p class="arcade-status" role="status" id="breath-status">Ready whenever you are.</p></div></div>`
    );
    let index = 0,
      timer,
      seconds = 0;
    function showQuestion() {
      const decision = decisions[index];
      $("#jiu-progress").textContent = `0${index + 1} / 03`;
      $("#jiu-question-title").textContent = decision.title;
      $("#jiu-question").textContent = decision.text;
      $("#jiu-feedback").textContent = "Choose a response to explore the idea.";
      $("#jiu-next").hidden = true;
      $("#jiu-choices").replaceChildren();
      decision.choices.forEach((choice, i) => {
        const button = document.createElement("button");
        button.className = "jiu-choice";
        button.textContent = choice;
        button.addEventListener("click", () => {
          $$(".jiu-choice").forEach((node) => {
            node.disabled = true;
          });
          button.classList.add(i === decision.answer ? "chosen" : "consider");
          $("#jiu-feedback").textContent = `${
            i === decision.answer
              ? "A useful practice. "
              : "Consider another approach. "
          }${decision.why}`;
          $("#jiu-next").hidden = false;
          $("#jiu-next").textContent =
            index === 2 ? "Explore again ↻" : "Next decision →";
        });
        $("#jiu-choices").append(button);
      });
    }
    $("#jiu-next").addEventListener("click", () => {
      index = (index + 1) % 3;
      showQuestion();
      $(".jiu-choice").focus();
    });
    showQuestion();
    function stopBreath(done = false) {
      clearInterval(timer);
      timer = null;
      $("#breath-orb").classList.remove("inhaling", "exhaling");
      $("#breath-label").textContent = done ? "READY" : "RESET";
      $("#breathe-start").textContent = "Begin 24-second pause";
      $("#breath-status").textContent = done
        ? "A little pause, then back to your orbit."
        : "Paused. Follow whatever pace feels comfortable.";
    }
    function breathTick() {
      if (seconds >= 24) {
        stopBreath(true);
        return;
      }
      const inhale = seconds % 8 < 4;
      $("#breath-label").textContent = `${inhale ? "IN" : "OUT"} · ${
        4 - (seconds % 4)
      }`;
      $("#breath-orb").classList.toggle("inhaling", inhale);
      $("#breath-orb").classList.toggle("exhaling", !inhale);
      if (seconds % 4 === 0)
        $("#breath-status").textContent = `Cycle ${
          Math.floor(seconds / 8) + 1
        } of 3. Breathe ${inhale ? "in" : "out"} at a comfortable pace.`;
      seconds++;
    }
    $("#breathe-start").addEventListener("click", () => {
      if (timer) {
        stopBreath();
        return;
      }
      seconds = 0;
      $("#breathe-start").textContent = "Stop pause";
      breathTick();
      timer = setInterval(breathTick, 1000);
    });
    hobbyCleanup = () => clearInterval(timer);
  }
  function soccer() {
    shell(
      "Five shots. One constellation.",
      "Pick a corner, watch the keeper, and shoot when your power reaches the teal zone. A goal needs good power and a clear path past the keeper.",
      `<div class="arcade-console"><div class="arcade-console-top"><span>STELLAR / SHOOTOUT</span><span class="arcade-badge" id="soccer-round">SHOT 1 / 5</span></div>
      <div class="soccer-pitch"><div class="soccer-goal"><span class="soccer-net"></span><span class="soccer-keeper" id="soccer-keeper" aria-hidden="true">✦</span></div><div class="soccer-targets" role="group" aria-label="Aim your shot">${[
        "Left corner",
        "Center",
        "Right corner",
      ]
        .map(
          (label, i) =>
            `<button class="soccer-target" data-aim="${
              [20, 50, 80][i]
            }" aria-pressed="${i === 0}">${label}</button>`
        )
        .join(
          ""
        )}</div><span id="soccer-ball" class="soccer-ball" aria-hidden="true">⚽</span></div>
      <div class="soccer-scorecard" aria-label="Shot results">${Array.from(
        { length: 5 },
        (_, i) =>
          `<span data-shot="${i}" aria-label="Shot ${i + 1}, not taken">${
            i + 1
          }</span>`
      ).join("")}</div>
      <div class="soccer-power-label"><span>SHOT POWER</span><span>Target: 58–86%</span></div><div class="soccer-power" aria-hidden="true"><span class="soccer-sweetspot"></span><span id="soccer-power-marker"></span></div>
      <label class="soccer-precision"><input type="checkbox" id="soccer-precision" ${
        reducedMotion.matches ? "checked" : ""
      }> Precision mode <small>Set power yourself; no moving targets.</small></label>
      <label class="arcade-range" id="soccer-manual-wrap" for="soccer-manual" ${
        reducedMotion.matches ? "" : "hidden"
      }><span>Power <output id="soccer-manual-value">72</output>%</span><input type="range" id="soccer-manual" min="0" max="100" value="72"></label>
      <div class="arcade-actions"><button class="btn primary" id="penalty">Line up shot</button><span class="arcade-record" id="soccer-best"></span></div><p class="arcade-status" role="status" id="penalty-result">Aim left, center, or right. Then line up your shot.</p></div>`
    );
    let aim = 20,
      round = 0,
      goals = 0,
      active = false,
      frame,
      start = 0,
      power = 0,
      keeper = 50;
    let best = Math.min(
      5,
      Math.max(0, Number(api.storage.get("orbit-soccer-best", 0)) || 0)
    );
    $("#soccer-best").textContent = `PERSONAL BEST ${best} / 5`;
    const precision = () => $("#soccer-precision").checked;
    function draw() {
      $("#soccer-power-marker").style.left = `${power}%`;
      $("#soccer-keeper").style.left = `${keeper}%`;
    }
    function animate(now) {
      if (!active || precision()) return;
      const time = (now - start) / 1000;
      power = (1 - Math.cos(time * 3.2)) * 50;
      keeper = 50 + 32 * Math.sin(time * 1.8 + round * 1.4);
      draw();
      frame = requestAnimationFrame(animate);
    }
    $$("[data-aim]").forEach((button) =>
      button.addEventListener("click", () => {
        aim = Number(button.dataset.aim);
        $$("[data-aim]").forEach((node) =>
          node.setAttribute("aria-pressed", String(node === button))
        );
      })
    );
    $("#soccer-precision").addEventListener("change", () => {
      active = false;
      cancelAnimationFrame(frame);
      $("#soccer-manual-wrap").hidden = !precision();
      $("#penalty").textContent = round === 5 ? "New shootout" : "Line up shot";
      $("#penalty-result").textContent = precision()
        ? "Precision mode: set your power, then aim away from the stationary keeper."
        : "Timing mode: line up your shot and shoot in the teal zone.";
    });
    $("#soccer-manual").addEventListener("input", (event) => {
      power = Number(event.target.value);
      $("#soccer-manual-value").textContent = power;
      draw();
    });
    $("#penalty").addEventListener("click", () => {
      if (round === 5) {
        round = goals = 0;
        $$("[data-shot]").forEach((node, i) => {
          node.className = "";
          node.textContent = i + 1;
          node.setAttribute("aria-label", `Shot ${i + 1}, not taken`);
        });
        $("#soccer-round").textContent = "SHOT 1 / 5";
      }
      if (!active) {
        active = true;
        start = performance.now();
        $("#soccer-ball").classList.remove("shot");
        keeper = [50, 20, 80, 50, 20][round];
        power = precision() ? Number($("#soccer-manual").value) : 0;
        $("#penalty").textContent = "Shoot!";
        $("#soccer-precision").disabled = true;
        $("#penalty-result").textContent = precision()
          ? `Keeper: ${
              keeper === 20 ? "left" : keeper === 80 ? "right" : "center"
            }. Choose an open target and set power to 58–86%.`
          : "Keeper moving. Aim away, then shoot at 58–86% power.";
        draw();
        if (!precision()) frame = requestAnimationFrame(animate);
        return;
      }
      active = false;
      cancelAnimationFrame(frame);
      $("#soccer-precision").disabled = false;
      const onTarget = power >= 58 && power <= 86,
        saved = Math.abs(keeper - aim) < 18;
      const goal = onTarget && !saved;
      if (goal) goals++;
      const badge = $(`[data-shot="${round}"]`);
      badge.className = goal ? "goal" : "miss";
      badge.textContent = goal ? "✓" : "×";
      badge.setAttribute(
        "aria-label",
        `Shot ${round + 1}: ${goal ? "goal" : "miss"}`
      );
      $("#soccer-ball").style.setProperty("--shot-x", `${aim}%`);
      $("#soccer-ball").classList.add("shot");
      const result = goal
        ? "GOAL! A clean finish."
        : !onTarget
        ? power < 58
          ? "Not enough power. The keeper collects it."
          : "Too much power — over the bar."
        : "Saved! The keeper read that corner.";
      round++;
      if (round === 5) {
        best = Math.max(best, goals);
        api.storage.set("orbit-soccer-best", best);
        $("#soccer-best").textContent = `PERSONAL BEST ${best} / 5`;
        $("#soccer-round").textContent = `FULL TIME / ${goals} GOALS`;
        $("#penalty-result").textContent = `${result} ${Math.round(
          power
        )}% power. Shootout complete: ${goals} out of 5. ${
          goals === 5
            ? "A perfect constellation."
            : "There is always another match."
        }`;
        $("#penalty").textContent = "New shootout";
      } else {
        $("#soccer-round").textContent = `SHOT ${round + 1} / 5`;
        $("#penalty-result").textContent = `${result} ${Math.round(
          power
        )}% power. ${goals} ${
          goals === 1 ? "goal" : "goals"
        } from ${round} shots.`;
        $("#penalty").textContent = "Next shot";
      }
    });
    hobbyCleanup = () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }
  function showHobby(kind) {
    cleanHobby();
    (({ drums, dj, jiu, soccer })[kind] || drums)();
    $("#hobby-dialog").dataset.kind = kind;
    api.openDialog("#hobby-dialog");
  }

  let runner;
  function initRunner() {
    const canvas = $("#game"),
      ctx = canvas.getContext("2d"),
      dialog = $("#game-dialog");
    if (!ctx)
      return {
        launch() {
          api.openDialog("#game-dialog");
          $("#game-score").textContent =
            "Canvas games are unavailable in this browser.";
        },
        pause() {},
      };
    canvas.setAttribute(
      "aria-label",
      "Orbit Runner. Collect teal diamonds, dodge coral asteroids, and recover lavender shield rings. Steer with arrow keys or A and D. Space activates a shield pulse; P pauses. The score and mission are announced below."
    );
    $("#game-title").textContent = "Signals from the unknown.";
    const settings = document.createElement("div");
    settings.className = "runner-settings";
    settings.innerHTML =
      '<label for="runner-mode">Flight mode <select id="runner-mode"><option value="cruise">Cruise · easy orbit</option><option value="expedition">Expedition · faster flight</option></select></label><button class="btn arcade-small" id="runner-sound" aria-pressed="false">Sound off</button><span class="arcade-record" id="runner-best"></span>';
    canvas.before(settings);
    const mission = document.createElement("p");
    mission.id = "runner-mission";
    mission.className = "runner-mission";
    mission.setAttribute("role", "status");
    mission.textContent =
      "MISSION 01 / Recover 8 signals from the asteroid belt.";
    canvas.before(mission);
    const pulseButton = document.createElement("button");
    pulseButton.id = "runner-pulse";
    pulseButton.textContent = "Shield pulse · SPACE";
    pulseButton.disabled = true;
    $(".touch-controls", dialog).append(pulseButton);
    $(".game-help", dialog).textContent =
      "← → / A D to steer · drag the ship on touch screens · Space for a 1-second shield pulse · P to pause. Teal diamonds = signals. Lavender rings = shield repair. Keep a collection streak for bonus points. Three shields per flight; a new sector every 8 signals.";
    let playing = false,
      paused = false,
      frame,
      last = 0,
      elapsed = 0,
      spawn = 0,
      score = 0,
      signals = 0,
      shields = 3,
      combo = 0,
      stage = 1,
      ship = 360,
      invincible = 0,
      pulseCooldown = 0,
      pulseActive = 0,
      objects = [],
      held = new Set(),
      audioOn = false,
      dragging = false;
    let best = Math.max(
        0,
        Number(api.storage.get("orbit-runner-v2-best", 0)) || 0
      ),
      speedScale = 0.85;
    const stars = Array.from({ length: 58 }, (_, i) => ({
      x: (i * 137.51) % 720,
      y: (i * 71.31) % 400,
      size: i % 3 === 0 ? 1.5 : 0.8,
    }));
    function status() {
      $("#game-score").textContent = `${score} pts · ${shields} shields · ${
        combo ? `×${Math.min(combo, 5)} combo` : "find your streak"
      }`;
      $("#runner-best").textContent = `BEST ${best}`;
      $("#runner-mission").textContent = `SECTOR ${String(stage).padStart(
        2,
        "0"
      )} / ${
        [
          "Recover the lost signals",
          "Map the nebula",
          "Chart a new constellation",
        ][(stage - 1) % 3]
      } · ${signals % 8} / 8 signals`;
    }
    function draw(message, subline) {
      ctx.fillStyle = "#071126";
      ctx.fillRect(0, 0, 720, 400);
      const nebula = ctx.createRadialGradient(560, 90, 0, 560, 90, 310);
      nebula.addColorStop(0, "#7060a529");
      nebula.addColorStop(1, "#07112600");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, 720, 400);
      for (const star of stars) {
        ctx.fillStyle = "#7890b0";
        ctx.fillRect(
          star.x,
          (star.y + (reducedMotion.matches ? 0 : elapsed * 14)) % 400,
          star.size,
          star.size
        );
      }
      ctx.strokeStyle = "#79b7c81c";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(565, 100, 115, 30, -0.28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#243b66";
      ctx.beginPath();
      ctx.arc(565, 100, 49, 0, Math.PI * 2);
      ctx.fill();
      for (const object of objects) {
        ctx.beginPath();
        if (object.kind === "signal") {
          ctx.fillStyle = "#65ead5";
          ctx.moveTo(object.x, object.y - 10);
          ctx.lineTo(object.x + 7, object.y);
          ctx.lineTo(object.x, object.y + 10);
          ctx.lineTo(object.x - 7, object.y);
          ctx.closePath();
          ctx.fill();
        } else if (object.kind === "shield") {
          ctx.strokeStyle = "#b3a3ff";
          ctx.lineWidth = 3;
          ctx.arc(object.x, object.y, 11, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "#d9d0ff";
          ctx.fillRect(object.x - 5, object.y - 1, 10, 2);
          ctx.fillRect(object.x - 1, object.y - 5, 2, 10);
        } else {
          ctx.fillStyle = "#fa947f";
          for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2 + object.spin,
              radius = object.radius * (i % 2 ? 0.8 : 1),
              x = object.x + Math.cos(angle) * radius,
              y = object.y + Math.sin(angle) * radius;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#a85355";
          ctx.beginPath();
          ctx.arc(
            object.x + 3,
            object.y - 3,
            object.radius * 0.28,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
      if (invincible > 0 || pulseActive > 0) {
        ctx.strokeStyle = "#b3a3ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ship, 350, pulseActive > 0 ? 33 : 25, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#d8e8ff";
      ctx.beginPath();
      ctx.moveTo(ship, 330);
      ctx.lineTo(ship + 16, 365);
      ctx.lineTo(ship, 358);
      ctx.lineTo(ship - 16, 365);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#65ead5";
      ctx.fillRect(ship - 3, 342, 6, 10);
      ctx.fillStyle = "#ff907e";
      ctx.beginPath();
      ctx.moveTo(ship - 5, 364);
      ctx.lineTo(
        ship,
        playing && !paused ? 377 + Math.sin(elapsed * 24) * 4 : 371
      );
      ctx.lineTo(ship + 5, 364);
      ctx.fill();
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "#bbc7dc";
      ctx.fillText(
        `SECTOR ${stage}    SHIELDS ${"●".repeat(shields)}${"○".repeat(
          3 - shields
        )}`,
        18,
        27
      );
      ctx.textAlign = "right";
      ctx.fillStyle = "#65ead5";
      ctx.fillText(`${score} PTS`, 700, 27);
      if (message) {
        ctx.fillStyle = "#071126df";
        ctx.fillRect(0, 138, 720, 108);
        ctx.textAlign = "center";
        ctx.fillStyle = "#eef1ff";
        ctx.font = "bold 23px sans-serif";
        ctx.fillText(message, 360, 180);
        ctx.fillStyle = "#b7c6dc";
        ctx.font = "12px monospace";
        ctx.fillText(
          subline || "COLLECT SIGNALS · REPAIR SHIELDS · CHART THE UNKNOWN",
          360,
          209
        );
      }
    }
    function end() {
      playing = false;
      held.clear();
      cancelAnimationFrame(frame);
      best = Math.max(best, score);
      api.storage.set("orbit-runner-v2-best", best);
      $("#runner-mode").disabled = false;
      $("#start-game").textContent = "Fly again";
      $("#pause-game").disabled = true;
      pulseButton.disabled = true;
      status();
      $(
        "#game-score"
      ).textContent = `Flight complete · ${score} points · ${signals} signals · best ${best}`;
      draw(
        "MISSION LOG SAVED",
        `${signals} SIGNALS RECOVERED · ${score} POINTS · SECTOR ${stage}`
      );
    }
    function updatePulse() {
      pulseButton.disabled = !playing || paused || pulseCooldown > 0;
      pulseButton.textContent =
        pulseCooldown > 0
          ? `Pulse recharging · ${Math.ceil(pulseCooldown)}s`
          : "Shield pulse · SPACE";
    }
    function pulse() {
      if (!playing || paused || pulseCooldown > 0) return;
      pulseActive = 1;
      pulseCooldown = 6;
      updatePulse();
      if (audioOn) sound("shield");
    }
    function tick(time) {
      if (!playing || paused) return;
      const dt = Math.min((time - last) / 1000, 0.04);
      last = time;
      elapsed += dt;
      spawn += dt;
      invincible = Math.max(0, invincible - dt);
      pulseActive = Math.max(0, pulseActive - dt);
      pulseCooldown = Math.max(0, pulseCooldown - dt);
      if (held.has("left")) ship -= 370 * dt;
      if (held.has("right")) ship += 370 * dt;
      ship = Math.max(20, Math.min(700, ship));
      if (spawn > Math.max(0.34, 0.62 - stage * 0.025)) {
        spawn = 0;
        const roll = Math.random();
        objects.push({
          x: 25 + Math.random() * 670,
          y: -25,
          radius: 13 + Math.random() * 10,
          kind: roll < 0.5 ? "signal" : roll < 0.58 ? "shield" : "rock",
          speed: (110 + Math.min(elapsed * 0.7 + stage * 15, 145)) * speedScale,
          spin: Math.random() * Math.PI,
        });
      }
      let changed = false;
      for (const object of objects) {
        object.y += object.speed * dt;
        if (
          Math.hypot(object.x - ship, object.y - 350) <
          (object.kind === "rock" ? object.radius + 11 : 25)
        ) {
          if (object.kind === "signal") {
            signals++;
            combo++;
            score += 10 * Math.min(combo, 5);
            stage = Math.floor(signals / 8) + 1;
            if (audioOn) sound("signal");
          } else if (object.kind === "shield") {
            shields = Math.min(3, shields + 1);
            score += 5;
            if (audioOn) sound("shield");
          } else if (invincible === 0 && pulseActive === 0) {
            shields--;
            combo = 0;
            invincible = 1.5;
            if (shields <= 0) {
              end();
              return;
            }
          }
          object.y = 500;
          object.collected = true;
          changed = true;
        }
        if (
          object.y > 430 &&
          object.kind === "signal" &&
          !object.collected &&
          combo
        ) {
          combo = 0;
          changed = true;
        }
      }
      objects = objects.filter((object) => object.y < 430);
      if (changed) status();
      updatePulse();
      draw();
      frame = requestAnimationFrame(tick);
    }
    function startGame() {
      cancelAnimationFrame(frame);
      playing = true;
      paused = false;
      elapsed =
        spawn =
        score =
        signals =
        combo =
        invincible =
        pulseCooldown =
        pulseActive =
          0;
      shields = 3;
      stage = 1;
      ship = 360;
      objects = [];
      held.clear();
      speedScale = $("#runner-mode").value === "cruise" ? 0.85 : 1.25;
      $("#runner-mode").disabled = true;
      $("#start-game").textContent = "Restart flight";
      $("#pause-game").disabled = false;
      $("#pause-game").textContent = "Pause";
      status();
      updatePulse();
      last = performance.now();
      canvas.focus();
      frame = requestAnimationFrame(tick);
    }
    function togglePause() {
      if (!playing) return;
      paused = !paused;
      held.clear();
      dragging = false;
      $("#pause-game").textContent = paused ? "Resume" : "Pause";
      updatePulse();
      if (paused) {
        cancelAnimationFrame(frame);
        draw("HOLDING ORBIT", "TAKE YOUR TIME · RESUME WHEN YOU ARE READY");
        silence();
      } else {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }
    $("#start-game").addEventListener("click", startGame);
    $("#pause-game").addEventListener("click", togglePause);
    pulseButton.addEventListener("click", pulse);
    $("#runner-sound").addEventListener("click", (event) => {
      audioOn = !audioOn;
      event.currentTarget.textContent = `Sound ${audioOn ? "on" : "off"}`;
      event.currentTarget.setAttribute("aria-pressed", String(audioOn));
      if (audioOn) sound("signal");
      else silence();
    });
    dialog.addEventListener("close", () => {
      playing = paused = false;
      dragging = false;
      held.clear();
      cancelAnimationFrame(frame);
      $("#pause-game").disabled = true;
      $("#runner-mode").disabled = false;
      pulseButton.disabled = true;
      silence();
    });
    document.addEventListener("keydown", (event) => {
      if (
        !dialog.open ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)
      )
        return;
      const key = event.key.toLowerCase();
      if (["arrowleft", "a", "arrowright", "d"].includes(key)) {
        event.preventDefault();
        held.add(["arrowleft", "a"].includes(key) ? "left" : "right");
      }
      if (key === "p" && !event.repeat) {
        event.preventDefault();
        togglePause();
      }
      if (key === " " && event.target === canvas && !event.repeat) {
        event.preventDefault();
        pulse();
      }
    });
    document.addEventListener("keyup", (event) => {
      const key = event.key.toLowerCase();
      if (["arrowleft", "a"].includes(key)) held.delete("left");
      if (["arrowright", "d"].includes(key)) held.delete("right");
    });
    for (const direction of ["left", "right"]) {
      const button = $(`#move-${direction}`);
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        held.add(direction);
      });
      for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
        button.addEventListener(name, () => held.delete(direction));
      button.addEventListener("keydown", (event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          held.add(direction);
        }
      });
      button.addEventListener("keyup", () => held.delete(direction));
      button.addEventListener("blur", () => held.delete(direction));
    }
    function steer(event) {
      if (!playing || paused) return;
      const bounds = canvas.getBoundingClientRect();
      ship = Math.max(
        20,
        Math.min(700, ((event.clientX - bounds.left) / bounds.width) * 720)
      );
    }
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", (event) => {
      dragging = true;
      canvas.setPointerCapture(event.pointerId);
      steer(event);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (dragging) steer(event);
    });
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
      canvas.addEventListener(name, () => (dragging = false));
    status();
    draw("YOUR NEXT MISSION AWAITS");
    return {
      launch() {
        api.openDialog("#game-dialog");
        draw("YOUR NEXT MISSION AWAITS");
      },
      pause() {
        held.clear();
        if (playing && !paused) togglePause();
      },
    };
  }
  function init(options) {
    if (initialized) return;
    initialized = true;
    api = options;
    $$("[data-hobby]").forEach((button) =>
      button.addEventListener("click", () => showHobby(button.dataset.hobby))
    );
    $("#hobby-dialog").addEventListener("close", cleanHobby);
    document.addEventListener("keydown", (event) => {
      if (
        !$("#hobby-dialog").open ||
        $("#hobby-dialog").dataset.kind !== "drums" ||
        !drumHit ||
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)
      )
        return;
      const kind = { a: "kick", s: "snare", d: "hat", f: "tom" }[
        event.key.toLowerCase()
      ];
      if (kind) {
        event.preventDefault();
        drumHit(kind);
      }
    });
    runner = initRunner();
    $("#play-game").addEventListener("click", launchGame);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        runner.pause();
        if ($("#hobby-dialog").open) $("#hobby-dialog").close();
        silence();
      }
    });
    window.addEventListener("blur", () => {
      runner.pause();
      if ($("#hobby-dialog").open) $("#hobby-dialog").close();
      silence();
    });
  }
  function launchGame() {
    runner?.launch();
  }
  return { init, launchGame };
})();
