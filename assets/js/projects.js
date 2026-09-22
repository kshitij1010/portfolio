window.PORTFOLIO_PROJECTS = [
  {
    id: "agents",
    title: "Enterprise AI agents",
    category: "agentic",
    type: "AGENTIC SYSTEMS",
    tags: ["Tool orchestration", "MCP", "LLMs"],
    summary:
      "Connecting enterprise knowledge, tools, and reasoning to turn complex requests into useful actions.",
    detail:
      "At EOX Vantage, I develop agentic AI workflows that bring together enterprise data, tool orchestration, and contextual retrieval. My work spans backend services, model inference, and translating business requirements into usable AI systems.",
    flow: ["Enterprise data", "Retrieve", "Reason", "Use tools"],
    outcome:
      "Focus: useful, contextual decision support across distributed enterprise information.",
    link: null,
    art: "graph",
    status: "EOX VANTAGE · 2026",
  },
  {
    id: "documents",
    title: "Document intelligence",
    category: "agentic",
    type: "MULTI-MODEL ORCHESTRATION",
    tags: ["OCR", "Verification", "LLM pipelines"],
    summary:
      "From insurance documents to structured answers, with extraction, verification, and reconciliation built in.",
    detail:
      "I architected a multi-model LLM pipeline at EOX Vantage for insurance document quality validation. It combines OCR, structured extraction, verification, and reconciliation to support complex document review.",
    flow: ["OCR", "Extract", "Verify", "Reconcile"],
    outcome:
      "Focus: an end-to-end document review workflow with explicit validation stages.",
    link: null,
    art: "docs",
    status: "EOX VANTAGE · 2026",
  },
  {
    id: "local",
    title: "A more personal AI",
    category: "agentic",
    type: "LOCAL FOUNDATION MODELS",
    tags: ["Llama 3.2", "LoRA", "Unsloth"],
    summary:
      "A local assistant exploring what happens when retrieval and model behavior adapt to the person using them.",
    detail:
      "A personal AI assistant built around a local Llama 3.2 3B model, fine-tuned using LoRA and Unsloth. The project brings together training and inference workflows with personalized retrieval, ranking, and preference learning.",
    flow: ["Personal context", "Retrieve", "Local model", "Respond"],
    outcome: "Focus: personalized retrieval and local model serving.",
    link: null,
    art: "graph",
    status: "PERSONAL PROJECT · 2026",
  },
  {
    id: "financial",
    title: "Financial RAG, with context",
    category: "retrieval",
    type: "RETRIEVAL & REASONING",
    tags: ["Llama 3.2", "LangChain", "FAISS"],
    summary:
      "Financial answers that preserve the important part: the structure and context of the source documents.",
    detail:
      "Built a financial document intelligence pipeline with Llama 3.2, LangChain, and FAISS. Query rewriting, hybrid retrieval, and maximal marginal relevance improve document selection. A custom HTMLTableAwareTextSplitter preserves table structure rather than flattening away relationships.",
    flow: ["Rewrite query", "Hybrid retrieval", "MMR", "Grounded answer"],
    outcome:
      "Reported project result: 35% improvement in retrieval accuracy on financial reports.",
    link: "https://github.com/kshitij1010/rag",
    art: "docs",
    status: "PROJECT · 2024",
  },
  {
    id: "translation",
    title: "Language without barriers",
    category: "research",
    type: "LOW-RESOURCE NLP",
    tags: ["MarianMT", "NLLB", "IndicTrans"],
    summary:
      "From Gujarati–English translation to legal language: making information accessible across boundaries.",
    detail:
      "At Johns Hopkins CLSP, I researched LLM-assisted Gujarati-to-English translation using MarianMT and NLLB. In LegalEase, I fine-tuned IndicTrans with Fairseq for domain-specific legal translation.",
    flow: ["Source text", "Domain adaptation", "Translation", "Evaluation"],
    outcome:
      "Reported results: 15% improvement on Flores200; LegalEase achieved a BLEU score of 0.58.",
    link: "https://github.com/kshitij1010/machine-translation",
    art: "translation",
    status: "JOHNS HOPKINS / LEGALEASE · 2024–25",
  },
  {
    id: "chair",
    title: "Thought into movement",
    category: "research",
    type: "HUMAN-CENTERED AI",
    tags: ["Brain–computer interface", "EEG", "EOG"],
    summary:
      "Cognitive-Chair: exploring brain-sensing interfaces to make assistive mobility more accessible.",
    detail:
      "Co-authored Cognitive-Chair, a brain-sensing wheelchair research project for paraplegic and quadriplegic people. The work explores brain–computer interfaces, EEG, and EOG for assistive mobility. Published in IEEE Xplore in 2023.",
    flow: ["Neural signals", "Process", "Interpret", "Movement"],
    outcome: "Best Paper Award, AIST 2022, as listed in my resume.",
    link: "https://ieeexplore.ieee.org/abstract/document/10065338",
    art: "chair",
    status: "IEEE XPLORE · 2023",
  },
];
