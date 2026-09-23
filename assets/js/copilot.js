"use strict";
window.OrbitCopilot = (() => {
  let openTopicHandler;
  let topics = [],
    config = { enableAI: false, endpoint: "" },
    lastTopic = null,
    busy = false;
  const $ = (s) => document.querySelector(s);
  const singular = {
    skills: "skill",
    publications: "publication",
    papers: "paper",
    projects: "project",
    agents: "agent",
    hobbies: "hobby",
    interests: "interest",
    drumming: "drum",
    drums: "drum",
    djing: "dj",
    technologies: "technology",
    roles: "role",
    awards: "award",
    models: "model",
    languages: "language",
  };
  const normalize = (s) =>
    s
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map((word) => singular[word] || word)
      .join(" ");
  const offTopic =
    /\b(ignore|disregard|system prompt|jailbreak|pretend|act as|write (?:me )?(?:a |an )?(?:essay|poem|story|script|code)|weather|recipe|horoscope|stock price|solve this|calculate|homework|politics|president|password|api key)\b/i;
  function rank(question, catalog = topics) {
    if (offTopic.test(question)) return [];
    const q = normalize(question),
      words = new Set(q.split(" "));
    const intro =
      /^(who (is|s) (kshitij( joshi)?|he)|who are you|tell me about (kshitij( joshi)?|yourself|him)|introduce (yourself|kshitij)|about (kshitij( joshi)?|you))$/.test(
        q
      );
    return catalog
      .map((t) => {
        let score = 0;
        for (const key of new Set(
          [t.title, ...(t.keywords || [])].map(normalize)
        )) {
          if (
            key.length < 2 ||
            ["about", "who", "overview", "intro"].includes(key)
          )
            continue;
          if (key.includes(" ") && ` ${q} `.includes(` ${key} `)) score += 16;
          else if (words.has(key)) score += 3;
        }
        if (intro && t.id === "experience") score += 15;
        if (
          words.has("rag") &&
          !/financial|finance|enterprise|eox/.test(q) &&
          t.id === "retrieval"
        )
          score += 16;
        if (words.has("eox")) {
          if (words.has("rag") && t.id === "enterprise-rag") score += 20;
          else if (
            /document|insurance|policy|pqc/.test(q) &&
            t.id === "documents"
          )
            score += 20;
          else if (/agent|tool/.test(q) && t.id === "agents") score += 20;
          else if (t.id === "eox") score += 6;
        }
        if ((words.has("agent") || words.has("agentic")) && t.id === "agents")
          score += 6;
        if (
          t.lifecycle === "planned" &&
          !/planned|weekend|future|next|roadmap|blueprint/.test(q)
        )
          score -= 3;
        return { topic: t, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
  }
  function init({ openDialog, navigate, toast }) {
    const log = $(".chat-log"),
      form = $(".chat-form"),
      input = form.querySelector("input"),
      submit = form.querySelector("button");
    const welcome = log.innerHTML;
    const loaded = Promise.all([
      fetch("assets/data/knowledge.json").then((r) => {
        if (!r.ok) throw Error("Knowledge unavailable");
        return r.json();
      }),
      fetch("assets/data/copilot-config.json")
        .then((r) => (r.ok ? r.json() : config))
        .catch(() => config),
    ])
      .then(([knowledge, settings]) => {
        topics = knowledge.topics;
        config = settings;
        if (config.enableAI && /^https:\/\//.test(config.endpoint))
          $("#copilot-mode").textContent = "SOURCE-FIRST · AI ENABLED";
      })
      .catch(() => {
        $("#copilot-mode").textContent = "SOURCE LIBRARY UNAVAILABLE";
      });
    function trimLog() {
      while (log.children.length > 24) log.firstElementChild.remove();
    }
    function message(text, kind = "assistant") {
      const node = document.createElement("div");
      node.className = `chat-message ${kind}`;
      if (text) {
        const p = document.createElement("p");
        p.textContent = text;
        node.append(p);
      }
      log.append(node);
      trimLog();
      log.scrollTop = log.scrollHeight;
      return node;
    }
    function sourceLinks(node, sources) {
      const links = document.createElement("div");
      links.className = "source-links";
      sources.slice(0, 4).forEach((source) => {
        const a = document.createElement("a");
        a.textContent = `↗ ${source.label}`;
        a.href = source.url;
        if (source.url.startsWith("#"))
          a.addEventListener("click", (e) => {
            e.preventDefault();
            navigate(source.url);
          });
        else {
          a.target = "_blank";
          a.rel = "noopener";
        }
        links.append(a);
      });
      node.append(links);
    }
    function followups(node, topic) {
      const list = document.createElement("div");
      list.className = "followups";
      topic.related.slice(0, 3).forEach((id) => {
        const related = topics.find((t) => t.id === id);
        if (!related) return;
        const b = document.createElement("button");
        b.textContent = related.title + " →";
        b.addEventListener("click", () => answer(related, true));
        list.append(b);
      });
      node.append(list);
    }
    async function answer(topic, showQuestion) {
      if (busy) return;
      lastTopic = topic;
      if (showQuestion) message(topic.title, "user");
      const node = message();
      const label = document.createElement("span");
      label.className = "answer-label";
      label.textContent = "RETRIEVED FROM THE PORTFOLIO";
      if (topic.lifecycle === "planned") {
        const badge = document.createElement("span");
        badge.className = "answer-label planned-answer";
        badge.textContent = "PLANNED CONCEPT · NOT COMPLETED";
        node.append(badge);
      }
      node.append(label);
      const text = document.createElement("p");
      text.textContent = topic.text;
      node.append(text);
      sourceLinks(node, topic.sources);
      followups(node, topic);
      log.scrollTop = log.scrollHeight;
      if (config.enableAI && /^https:\/\//.test(config.endpoint)) {
        busy = true;
        submit.disabled = true;
        label.textContent = "READING THE SOURCES…";
        try {
          const response = await fetch(config.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topicId: topic.id }),
            signal: AbortSignal.timeout(12000),
            credentials: "omit",
          });
          if (!response.ok) throw Error("Remote unavailable");
          const data = await response.json();
          if (
            typeof data.answer !== "string" ||
            data.answer.length > 5000 ||
            data.topicId !== topic.id
          )
            throw Error("Invalid answer");
          text.textContent = data.answer;
          label.textContent = data.cached
            ? "AI SUMMARY · CACHED · SOURCES BELOW"
            : "AI SUMMARY · SOURCES BELOW";
        } catch {
          label.textContent = "VERIFIED SOURCE ANSWER · AI UNAVAILABLE";
        } finally {
          busy = false;
          submit.disabled = false;
        }
      }
    }
    async function ask(question) {
      await loaded;
      if (busy) return;
      message(question, "user");
      if (!topics.length) {
        const node = message(
          "I couldn’t load the source library. You can still read the resume and project briefs directly."
        );
        sourceLinks(node, [
          { label: "Resume", url: "assets/Kshitij-Joshi-Resume.pdf" },
          { label: "Project archive", url: "#missions" },
        ]);
        return;
      }
      if (
        /^(more|tell me more|what else|details|go on|expand|more detail|what technologies|what tech)( please)?[?.!]*$/i.test(
          question.trim()
        ) &&
        lastTopic
      ) {
        answer(lastTopic, false);
        return;
      }
      const matches = rank(question);
      if (!matches.length) {
        const node = message(
          "I can help with Kshitij’s experience, projects, skills, education and interests. I don’t answer general-purpose questions or invent details. Pick a portfolio topic to explore."
        );
        followups(node, { related: ["experience", "eox", "research"] });
        return;
      }
      if (matches.length > 1 && matches[0].score === matches[1].score) {
        const node = message(
          "I found a few relevant parts of the portfolio. Which one should we explore?"
        );
        matches.slice(0, 3).forEach(({ topic }) => {
          const b = document.createElement("button");
          b.className = "topic-choice";
          b.textContent = topic.title + " ↗";
          b.addEventListener("click", () => answer(topic, true));
          node.append(b);
        });
        log.scrollTop = log.scrollHeight;
        return;
      }
      answer(matches[0].topic, false);
    }
    openTopicHandler = async (id) => {
      await loaded;
      const topic = topics.find((t) => t.id === id);
      openDialog("#copilot");
      if (topic) answer(topic, true);
    };
    $("#open-copilot").addEventListener("click", () => {
      openDialog("#copilot");
      input.focus();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const question = input.value.trim();
      if (question && !busy) {
        input.value = "";
        ask(question);
      }
    });
    document.querySelectorAll("[data-topic]").forEach((button) =>
      button.addEventListener("click", async () => {
        await loaded;
        const topic = topics.find((t) => t.id === button.dataset.topic);
        if (topic) answer(topic, true);
      })
    );
    $("#clear-chat").addEventListener("click", () => {
      if (busy) {
        toast("The current answer is still loading.");
        return;
      }
      log.innerHTML = welcome;
      lastTopic = null;
      input.value = "";
      input.focus();
    });
  }
  return {
    init,
    rank,
    openTopic(id) {
      return openTopicHandler?.(id);
    },
  };
})();
