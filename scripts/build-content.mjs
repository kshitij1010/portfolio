import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sandbox = { window: {} };
vm.runInNewContext(
  readFileSync(resolve(root, "assets/js/projects.js"), "utf8"),
  sandbox
);
const projects = sandbox.window.PORTFOLIO_PROJECTS;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
const palettes = [
  ["#ffac96", "#a571ec"],
  ["#74f0dc", "#3c87d8"],
  ["#c0a0ff", "#6175ed"],
  ["#f8cd83", "#e870a4"],
  ["#83ddff", "#7173e2"],
  ["#ff9dcc", "#a269e4"],
];
function artwork(p, i) {
  const [accent, second] = palettes[i % palettes.length];
  const id = "g-" + p.id;
  let inside = "";
  const network = `<path d="M69 54L160 103L249 50M64 155L160 103L253 155" stroke="${accent}" stroke-width="2" stroke-dasharray="4 5"/><rect x="120" y="70" width="80" height="64" rx="16" fill="url(#${id})"/><path d="M142 102h36M160 84v36" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>${[
    [64, 47],
    [247, 45],
    [58, 149],
    [250, 148],
  ]
    .map(
      ([x, y], n) =>
        `<rect x="${x - 18}" y="${
          y - 16
        }" width="36" height="32" rx="9" fill="#201936" stroke="${accent}"/><circle cx="${x}" cy="${y}" r="${
          n % 2 ? 6 : 4
        }" fill="${accent}"/>`
    )
    .join("")}`;
  const papers = `<g transform="rotate(-13 125 99)"><rect x="80" y="35" width="92" height="124" rx="9" fill="#322e53" stroke="${accent}"/><path d="M98 60h52M98 76h39M98 93h51M98 110h32" stroke="${accent}" stroke-width="3" opacity=".7"/></g><g transform="rotate(10 195 105)"><rect x="150" y="47" width="88" height="118" rx="9" fill="url(#${id})"/><path d="M168 75h48M168 91h35M168 108h46M168 125h27" stroke="#fff" stroke-width="3" opacity=".7"/></g><rect x="177" y="135" width="87" height="28" rx="5" fill="#172a33" stroke="${accent}"/><path d="M186 148l5 5 9-12" stroke="${accent}" stroke-width="2" fill="none"/><text x="211" y="153" fill="${accent}" font-size="10" font-family="monospace">${
    p.lifecycle === "planned" ? "DESIGN" : "CONTEXT"
  }</text>`;
  const eye = `<path d="M45 100q110-113 230 0-110 106-230 0Z" fill="#201831" stroke="${accent}" stroke-width="2"/><circle cx="160" cy="100" r="44" fill="url(#${id})"/><circle cx="160" cy="100" r="23" fill="#101129"/><circle cx="149" cy="86" r="7" fill="#fff" opacity=".9"/><path d="M48 169h45l12-20 10 33 14-20h39" fill="none" stroke="${accent}" stroke-width="2"/>`;
  const waves = Array.from({ length: 25 }, (_, j) => {
    const h = 20 + Math.abs(Math.sin(j * 0.7)) * 60 + Math.cos(j * 0.21) * 25;
    return `<rect x="${55 + j * 9}" y="${
      100 - h / 2
    }" width="5" height="${h}" rx="2" fill="${j % 3 ? accent : second}"/>`;
  }).join("");
  const language = `<rect x="49" y="50" width="87" height="93" rx="15" fill="url(#${id})"/><rect x="191" y="60" width="81" height="90" rx="15" fill="#25213e" stroke="${accent}"/><text x="92" y="113" text-anchor="middle" font-family="sans-serif" font-size="49" fill="#fff">અ</text><text x="232" y="121" text-anchor="middle" font-family="sans-serif" font-size="50" fill="${accent}">A</text><path d="M145 83h36l-7-7m7 7-7 7M181 119h-36l7-7m-7 7 7 7" stroke="${accent}" stroke-width="2" fill="none"/>`;
  const scope = `<circle cx="160" cy="100" r="67" fill="#21203c" stroke="${accent}" stroke-opacity=".5"/><circle cx="160" cy="100" r="45" fill="none" stroke="${accent}" stroke-opacity=".4"/><circle cx="160" cy="100" r="24" fill="url(#${id})"/><path d="M160 22v24M160 156v24M80 100h25M216 100h24" stroke="${accent}" stroke-width="2"/><path d="M160 100l42-45" stroke="#fff" stroke-width="2"/><circle cx="202" cy="55" r="6" fill="${accent}"/>`;
  if (/chair/.test(p.id))
    inside = `<circle cx="121" cy="48" r="13" fill="url(#${id})"/><path d="M120 70v45h49l22 38h30M120 90h45" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><path d="M101 94a37 37 0 1 0 52 43" fill="none" stroke="${accent}" stroke-width="5"/><path d="M179 44h12l7-15 10 33 9-18h25" fill="none" stroke="${second}" stroke-width="3"/>`;
  else if (/translation|legal/.test(p.id)) inside = language;
  else if (/cognitive|load|robot/.test(p.id)) inside = eye;
  else if (/music|synth/.test(p.id)) inside = waves;
  else if (/eval|cricket|research-scout/.test(p.id)) inside = scope;
  else if (/document|financial|rag|report/.test(p.id)) inside = papers;
  else inside = network;
  return `<div class="project-art" aria-hidden="true"><span class="art-index">MISSION / ${String(
    i + 1
  ).padStart(2, "0")}</span>${
    p.lifecycle === "planned"
      ? '<span class="lifecycle-badge">PLANNED</span>'
      : ""
  }<svg viewBox="0 0 320 200"><defs><linearGradient id="${id}" x2="1" y2="1"><stop stop-color="${accent}"/><stop offset="1" stop-color="${second}"/></linearGradient></defs>${inside}</svg><span class="art-type">${esc(
    p.type
  )}</span></div>`;
}
const cards = projects
  .map((p, i) => {
    const [accent, glow] = palettes[i % palettes.length];
    return `<article class="project" data-id="${esc(
      p.id
    )}" data-category="${esc(p.category)}" data-lifecycle="${
      p.lifecycle || "built"
    }" style="--card-accent:${accent};--card-glow:${glow}44">${artwork(
      p,
      i
    )}<div class="project-body"><div class="project-meta">${esc(
      p.status
    )}</div><h3>${esc(p.title)}</h3><p>${esc(
      p.summary
    )}</p><div class="tags">${p.tags
      .map((t) => `<span>${esc(t)}</span>`)
      .join("")}</div><button class="project-link" data-project="${esc(
      p.id
    )}" aria-label="Explore ${esc(p.title)}">${
      p.lifecycle === "planned" ? "View the blueprint" : "Explore mission"
    } <span>↗</span></button></div></article>`;
  })
  .join("\n");
const indexPath = resolve(root, "index.html");
let html = readFileSync(indexPath, "utf8");
html = html.replace(
  /<!-- PROJECTS:START -->[\s\S]*?<!-- PROJECTS:END -->/,
  `<!-- PROJECTS:START -->\n<div class="projects">${cards}</div>\n<!-- PROJECTS:END -->`
);
writeFileSync(indexPath, html);
const resume = {
  label: "Current resume",
  url: "assets/Kshitij-Joshi-Resume.pdf",
};
const topics = [
  {
    id: "experience",
    title: "Career & experience",
    text: "Kshitij Joshi is an AI Engineer at EOX Vantage (February 2026–present), building enterprise RAG, agentic workflows, and multi-model insurance document intelligence. Previously he was a Machine Learning Engineer, Gen AI at Scale AI (February 2025–January 2026), researching code-reasoning model quality and reinforcement learning interventions. He was a Research Assistant at Johns Hopkins CLSP (August 2024–January 2025) and ARCADE (January 2024–January 2025), and a Machine Learning Engineer at MarwizTech (January–August 2023).",
    sources: [resume],
    related: ["eox", "research", "skills"],
    keywords: [
      "experience",
      "career",
      "background",
      "introduction",
      "intro",
      "role",
      "scale",
      "marwiz",
      "who",
      "about",
      "job",
      "overview",
    ],
  },
  {
    id: "eox",
    title: "Current work at EOX Vantage",
    text: "Since February 2026, Kshitij has worked as an AI Engineer at EOX Vantage in Cleveland. His documented work includes a production RAG platform for enterprise knowledge, a multi-model insurance document pipeline combining OCR, extraction, verification and reconciliation, and agentic workflows with enterprise data and tool orchestration. These summaries describe work at the public resume level; internal customer details are not included.",
    sources: [resume],
    related: ["agents", "documents", "enterprise-rag"],
    keywords: [
      "eox",
      "vantage",
      "current",
      "currently",
      "company",
      "based",
      "location",
      "enterprise",
      "insurance",
      "production",
    ],
  },
  {
    id: "education",
    title: "Education",
    text: "Kshitij holds a Master of Science in Data Science from Johns Hopkins University and a Bachelor of Technology in Computer Science and Engineering, with a specialization in Data Science, from GSFC University. His coursework covers machine translation, data mining, algorithms, optimization, machine learning, deep learning and NLP.",
    sources: [resume],
    related: ["research", "skills"],
    keywords: [
      "education",
      "degree",
      "university",
      "study",
      "studied",
      "school",
      "masters",
      "bachelor",
      "hopkins",
      "gsfc",
    ],
  },
  {
    id: "skills",
    title: "Engineering toolkit",
    text: "Kshitij’s resume lists Python, SQL, TypeScript/JavaScript, Rust and R; PyTorch, Scikit-Learn and Hugging Face; RAG, LangGraph, LangChain, RLHF, tool calling, MCP and LLM evaluation; FastAPI, Spark, Kafka, MLflow, Kubernetes, AWS, Azure and Google Cloud. His projects connect retrieval, model inference, tool orchestration and evaluation. Listed skills do not imply equal depth or duration across every technology.",
    sources: [resume],
    related: ["agents", "financial", "eox"],
    keywords: [
      "skill",
      "tech",
      "technology",
      "stack",
      "python",
      "rust",
      "sql",
      "typescript",
      "fastapi",
      "pytorch",
      "langgraph",
      "mcp",
      "cloud",
      "aws",
      "azure",
      "gcp",
      "tools",
    ],
  },
  {
    id: "research",
    title: "Research & publications",
    text: "Kshitij co-authored Cognitive-Chair, published in IEEE Xplore in 2023; his resume records a Best Paper Award at AIST 2022. The orthopedic fracture detection manuscript remains under review and received a Clinical Orthopedic Society Rapid Fire Presentation Award. His earlier IoT air and noise pollution monitoring work appears in Springer (2021). At Johns Hopkins he studied low-resource Gujarati–English translation and brightness-aware cognitive load estimation for telerobotic surgery.",
    sources: [
      resume,
      {
        label: "Cognitive-Chair · IEEE",
        url: "https://ieeexplore.ieee.org/abstract/document/10065338",
      },
      {
        label: "IoT monitoring · Springer",
        url: "https://link.springer.com/chapter/10.1007/978-3-030-71485-7_2",
      },
    ],
    related: ["chair", "translation", "cognitive-load"],
    keywords: [
      "research",
      "publication",
      "paper",
      "award",
      "fracture",
      "ieee",
      "springer",
      "published",
    ],
  },
  {
    id: "interests",
    title: "Beyond the terminal",
    text: "Kshitij’s personal interests include drumming, DJing, Jiu Jitsu and soccer. His public LinkedIn profile also lists environmental volunteering at the Nirja Foundation from May 2021 to June 2023, including tree planting, plant care and inventory coordination in Vadodara. The portfolio’s music, flow and soccer mini-games are playful expressions of those interests, not claims of professional athletic or musical credentials.",
    sources: [
      { label: "Personal interests", url: "#off-duty" },
      {
        label: "LinkedIn · volunteering",
        url: "https://www.linkedin.com/in/kshitijjoshi10/",
      },
    ],
    related: ["experience", "weekend"],
    keywords: [
      "interest",
      "hobbies",
      "hobby",
      "fun",
      "drum",
      "dj",
      "music",
      "jiu",
      "soccer",
      "volunteer",
      "environment",
      "personal",
      "beyond",
    ],
  },
  {
    id: "contact",
    title: "Connect with Kshitij",
    text: "Contact Kshitij at kshitijjoshi017@gmail.com. His GitHub handle is kshitij1010, and his LinkedIn profile is linkedin.com/in/kshitijjoshi10. The resume is downloadable from this portfolio. Contact him directly for availability, collaboration, or details beyond the public project summaries.",
    sources: [resume, { label: "Contact links", url: "#contact" }],
    related: ["experience", "eox"],
    keywords: [
      "contact",
      "email",
      "connect",
      "hire",
      "resume",
      "cv",
      "linkedin",
      "github",
      "availability",
      "available",
    ],
  },
  {
    id: "retrieval",
    title: "RAG across enterprise and financial documents",
    text: "Kshitij’s RAG work covers two distinct settings. At EOX Vantage, he builds production retrieval over enterprise knowledge and connects it to AI workflows. His financial document project uses Llama 3.2, LangChain and FAISS with query rewriting, hybrid retrieval, MMR and a table-aware text splitter. His resume reports a 35% retrieval improvement for the financial project; that metric does not describe the enterprise system.",
    sources: [
      resume,
      {
        label: "Financial RAG repository",
        url: "https://github.com/kshitij1010/rag",
      },
    ],
    related: ["enterprise-rag", "financial", "documents"],
    keywords: ["rag", "retrieval", "retrieval augmented generation"],
  },
  {
    id: "projects",
    title: "Project mission archive",
    text: "The portfolio includes 11 documented work and research missions: enterprise agents, enterprise RAG and Policy Quality Check at EOX Vantage; a local Llama assistant; financial document RAG; Scale AI model evaluation; translation and cognitive-load research at Johns Hopkins; LegalEase; Cognitive-Chair; and fracture detection research. Three additional weekend-lab entries are explicitly planned concepts, not completed work.",
    sources: [resume, { label: "Mission archive", url: "#missions" }],
    related: ["eox", "research", "weekend"],
    keywords: ["projects", "project", "portfolio", "missions"],
  },
  {
    id: "journal",
    title: "Photo journals, travel & writing",
    text: "Kshitij’s portfolio has a Field Notes section for personal photography, travel diaries and blog posts. No journal entries or new photographs have been supplied or published yet. The visible collection cards are clearly labeled coming soon. Specific destinations, trips and stories are not documented and should not be invented.",
    sources: [{ label: "Field Notes", url: "#journal" }],
    related: ["interests", "contact"],
    keywords: [
      "travel",
      "photo",
      "photography",
      "blog",
      "writing",
      "journal",
      "trip",
      "destination",
    ],
  },
  {
    id: "weekend",
    lifecycle: "planned",
    title: "Weekend lab: planned, not completed",
    text: "The Weekend Lab is a roadmap of agentic AI projects Kshitij intends to build. These entries are design concepts, not completed projects or demonstrated experience. Proposed architectures and evaluation plans describe future work; no shipped outcomes or benchmark results are claimed.",
    sources: [
      { label: "Weekend Lab blueprints", url: "#missions" },
      { label: "Content provenance", url: "docs/content-sources.md" },
    ],
    related: projects.filter((p) => p.lifecycle === "planned").map((p) => p.id),
    keywords: [
      "planned",
      "weekend",
      "future",
      "next",
      "roadmap",
      "blueprint",
      "plan",
    ],
  },
  ...projects.map((p) => ({
    id: p.id,
    title: p.title,
    text: `${
      p.lifecycle === "planned" ? "PLANNED CONCEPT. Not implemented. " : ""
    }${p.detail}\n${p.outcome}\n${(p.highlights || []).join(" ")}`,
    sources: [
      {
        label: p.sourceLabel || "Project brief",
        url: p.sourceUrl || `?mission=${p.id}#missions`,
      },
    ],
    related: [
      p.lifecycle === "planned"
        ? "weekend"
        : p.employer === "EOX Vantage"
        ? "eox"
        : "research",
      "skills",
    ],
    keywords: [p.title, ...p.tags, p.id.replaceAll("-", " ")],
    lifecycle: p.lifecycle || "built",
  })),
];
const aliases = {
  agents: [
    "agentic systems",
    "enterprise agents",
    "eox agents",
    "tool orchestration",
  ],
  "enterprise-rag": [
    "enterprise rag",
    "eox rag",
    "knowledge engine",
    "semantic retrieval",
  ],
  documents: [
    "pqc",
    "policy",
    "insurance documents",
    "ocr",
    "document intelligence",
  ],
  local: [
    "personal assistant",
    "local llama",
    "lora",
    "fine tuning",
    "unsloth",
  ],
  financial: ["financial rag", "finance", "table aware", "mmr", "faiss"],
  evaluations: [
    "scale ai",
    "rlhf",
    "reinforcement learning",
    "code reasoning",
    "model evaluation",
  ],
  translation: ["gujarati", "nllb", "marianmt", "clsp", "low resource"],
  legalease: ["legal", "indictrans", "fairseq", "legal translation"],
  "cognitive-load": ["pupillometry", "surgery", "robotics", "arcade", "gaze"],
  fracture: ["fracture detection", "x rays", "orthopedic"],
  chair: ["cognitive chair", "wheelchair", "brain computer", "eeg", "eog"],
  "agent-observatory": ["agent observatory", "agent evaluations"],
  "incident-copilot": ["incident flight recorder", "incident copilot"],
  "paper-to-experiment": ["paper to experiment", "paper reproduction"],
};
for (const topic of topics)
  topic.keywords = [...topic.keywords, ...(aliases[topic.id] || [])];
const known = new Set(topics.map((t) => t.id));
topics.forEach(
  (t) => (t.related = t.related.filter((id) => known.has(id) && id !== t.id))
);
writeFileSync(
  resolve(root, "assets/data/knowledge.json"),
  JSON.stringify({ version: "2026-09-22", topics }, null, 2) + "\n"
);
console.log(
  `Built ${projects.length} project cards and ${topics.length} source-backed topics.`
);
