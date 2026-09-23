"use strict";
/* Public, high-level workflow explanations. Trade-offs are design considerations,
   not claims about undisclosed production internals. */
window.PortfolioArchitecture = (() => {
  const descriptions = {
    agents: [
      ["Translate stakeholder requirements into a workflow that connects business context, information, and actions.", "Define success before adding tools; broader autonomy increases the evaluation surface."],
      ["Provide contextual information from distributed enterprise data for the workflow.", "More context can improve coverage but also adds irrelevant material and model cost."],
      ["Backend services connect model decisions with tools and enterprise workflows.", "Tool flexibility needs explicit boundaries, validation, and recoverable failures."],
      ["Use LLM evaluation and workflow analysis to inform engineering decisions.", "Evaluate useful task outcomes as well as plausible individual responses."]
    ],
    "enterprise-rag": [
      ["Connect proprietary enterprise knowledge bases to the retrieval platform.", "Coverage, freshness, and permissions need to be considered together."],
      ["Semantic retrieval identifies information related to the enterprise query.", "Recall and precision compete; a larger result set is not automatically better."],
      ["Pass relevant retrieved information into the inference workflow.", "Context selection balances evidence coverage against noise and context limits."],
      ["Scalable LLM inference uses retrieved context to support enterprise AI workflows.", "Latency, cost, and groundedness must be evaluated together. Providers and exact configuration are not public."]
    ],
    documents: [
      ["OCR makes the content of insurance documents available to the review pipeline.", "Poor scan quality can propagate errors into every downstream stage."],
      ["A multi-model LLM pipeline extracts structured document information.", "Flexible extraction still requires consistent schemas and handling of missing values."],
      ["An explicit verification stage checks extracted information before reconciliation.", "Stricter checks can reduce silent errors while increasing review effort."],
      ["Reconcile information as part of end-to-end policy quality validation.", "Conflicting evidence should remain visible instead of being silently resolved by a model."]
    ],
    local: [
      ["Personal context informs a local assistant designed around the person using it.", "Personalization is useful only when the context is relevant and the user can control it."],
      ["Personalized retrieval and ranking select context for the assistant.", "Personal relevance and diversity can pull ranking in different directions."],
      ["The documented project uses Llama 3.2 3B, LoRA, Unsloth, and local serving.", "Local execution gives control over the runtime but constrains memory and model capacity."],
      ["Generate responses that reflect retrieved context and explored model adaptations.", "Preference adaptation should not override factual grounding or general capability."]
    ],
    financial: [
      ["Query rewriting prepares financial questions for retrieval.", "A rewrite can improve recall or unintentionally change the question."],
      ["Hybrid retrieval works with table-aware document splitting to preserve useful financial context.", "Numeric exact matches and semantic similarity answer different retrieval needs."],
      ["Maximal Marginal Relevance selects a more diverse set of retrieved passages.", "Diversity reduces duplication, but too much can displace the most relevant evidence."],
      ["Llama 3.2 uses retrieved context through a LangChain/FAISS-based workflow.", "Financial claims need supporting context; fluent generation is not evidence of numeric correctness."]
    ],
    evaluations: [
      ["Inspect model outputs on code-reasoning tasks.", "A final answer can hide a flawed reasoning process; both need careful review."],
      ["Analyze recurring reasoning failures and behavioral patterns.", "A useful taxonomy must be specific enough to guide interventions without overfitting examples."],
      ["Explore reinforcement learning and post-training interventions.", "Improvements in one behavior can introduce regressions elsewhere."],
      ["Connect evaluation findings to training decisions and model understanding.", "Conclusions depend on representative tasks; no private benchmark or model details are published."]
    ],
    translation: [
      ["Investigate Gujarati–English translation in a low-resource language setting.", "Language coverage and domain distribution influence what an evaluation measures."],
      ["Explore LLM-assisted translation methods in the JHU CLSP research workflow.", "Assistance can add useful context, but must be checked for meaning drift."],
      ["Work with MarianMT and NLLB for Gujarati–English translation.", "Model capacity, language coverage, and domain fit affect the choice of baseline."],
      ["Analyze translation errors and reported Flores200 performance.", "Aggregate metrics should be read alongside specific error types and meaning preservation."]
    ],
    legalease: [
      ["Use legal text as the domain for translation research.", "Terminology and obligations require more care than surface fluency alone."],
      ["Domain fine-tuning adapts translation behavior to legal language.", "Specialization may help legal terminology while reducing general-domain robustness."],
      ["IndicTrans and Fairseq support the documented translation workflow.", "Translation outputs still need review when subtle wording changes legal meaning."],
      ["Assess translation quality and the resume-reported reduction in manual effort.", "The supplied BLEU value is preserved as reported; its scale and evaluation setup should be clarified before comparison."]
    ],
    "cognitive-load": [
      ["Study pupil and gaze signals during telerobotic surgery tasks.", "Signal quality and individual differences complicate comparison across participants."],
      ["Use brightness-aware features and gaze entropy to describe observed behavior.", "Pupil changes can reflect lighting as well as cognitive activity."],
      ["Explore personalized machine learning with Random Forest models.", "Personalization can improve fit while limiting transfer to unseen participants."],
      ["Estimate cognitive load from the processed features.", "A research estimate is not a clinical decision or a claim of clinical validation."]
    ],
    chair: [
      ["EEG and EOG provide the brain–computer interface signals for Cognitive-Chair.", "Noise and variability can make a signal difficult to interpret reliably."],
      ["Process the acquired signals before interpreting potential commands.", "Filtering can suppress artifacts but may also remove useful information."],
      ["Interpret processed signals as part of the assistive-mobility workflow.", "False activations and missed commands have different usability consequences."],
      ["Connect interpreted commands with the wheelchair movement concept described in the publication.", "Assistive actuation needs explicit safety evaluation; a research prototype is not a certified mobility device."]
    ],
    fracture: [
      ["Study orthopedic X-rays for AI-assisted fracture detection research.", "Image quality and dataset composition affect how broadly results can generalize."],
      ["Explore classification, localization, and segmentation methods described in the historical project.", "Image-level predictions and localization answer different clinical questions."],
      ["Evaluate AI methods in the documented research collaboration.", "Useful evaluation must consider missed fractures as well as false positives."],
      ["Communicate findings in the manuscript and presentation listed in the supplied resume.", "The manuscript remains under review; the public description does not establish clinical deployment."]
    ],
    "agent-observatory": [
      ["Proposed: define synthetic tasks with explicit pass/fail criteria.", "A small suite is reproducible but may not represent real-world complexity."],
      ["Proposed: capture and replay model decisions and tool calls.", "Replay improves comparison but cannot reproduce every nondeterministic interaction."],
      ["Proposed: inject tool failures and misleading retrieved context.", "Controlled failures are explainable; overly artificial cases can mislead evaluation."],
      ["Proposed: compare task completion, evidence use, latency, and token costs.", "Optimize useful outcomes within a budget, rather than one metric in isolation."]
    ],
    "incident-copilot": [
      ["Proposed: begin with a synthetic incident and a simulated alert.", "Synthetic scenarios protect private data but need realistic failure patterns."],
      ["Proposed: gather evidence through read-only retrieval tools.", "Read-only access limits side effects but does not guarantee correct interpretation."],
      ["Proposed: construct a timeline linked to the retrieved evidence.", "Ordering events is useful; temporal proximity alone does not establish causation."],
      ["Proposed: present findings and request human approval for any suggested changes.", "Approval adds friction but keeps proposed actions separate from execution."]
    ],
    "paper-to-experiment": [
      ["Proposed: start with one open-access ML paper.", "A paper may omit implementation details needed for reproduction."],
      ["Proposed: extract claims with citations to supporting passages.", "Traceability makes review easier but does not establish that a claim is correct."],
      ["Proposed: create a minimal experiment plan from the cited claims.", "A small reproduction is feasible but may cover only a narrow part of the paper."],
      ["Proposed: review assumptions and resource needs before executing anything.", "Explicit assumptions expose gaps that an apparently complete plan can conceal."]
    ]
  };
  function nodes(project) {
    return project.flow.map((label, i) => ({label, detail: descriptions[project.id][i][0], tradeoff: descriptions[project.id][i][1]}));
  }
  function render(container, project) {
    container.replaceChildren();
    const make = (tag, cls, text) => { const el = document.createElement(tag); el.className = cls; el.textContent = text; return el; };
    const heading = make("h3", "architecture-heading", "Inside the system");
    const note = make("p", "architecture-note", project.lifecycle === "planned" ? "Proposed architecture · not implemented. Select a component to explore the design." : "High-level schematic from documented work. Select a component to explore its role and design considerations.");
    const diagram = make("div", "architecture-nodes", "");
    diagram.setAttribute("role", "group"); diagram.setAttribute("aria-label", "Interactive architecture components");
    const panel = make("div", "architecture-inspector", "");
    panel.setAttribute("aria-live", "polite");
    const stages = nodes(project);
    const buttons = [];
    function select(index) {
      buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
      const stage = stages[index];
      panel.replaceChildren(make("span", "architecture-step", `COMPONENT ${index + 1} / ${stages.length}`), make("h4", "", stage.label), make("p", "", stage.detail), make("strong", "", "Design consideration"), make("p", "", stage.tradeoff));
    }
    stages.forEach((stage, i) => {
      const button = make("button", "architecture-node", ""); button.type = "button";
      button.append(make("span", "", String(i+1).padStart(2,"0")), make("strong", "", stage.label));
      button.addEventListener("click", () => select(i));
      button.addEventListener("keydown", (event) => {
        let next;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (i+1)%stages.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (i+stages.length-1)%stages.length;
        if (next !== undefined) {event.preventDefault();buttons[next].focus();select(next);}
      });
      buttons.push(button); diagram.append(button);
    });
    const stack = make("p", "architecture-stack", `${project.lifecycle === "planned" ? "Proposed focus" : "Documented project context"}: ${project.tags.join(" · ")}. Component notes explain the public workflow; they do not disclose an exact production topology.`);
    container.append(heading,note,diagram,panel,stack);select(0);
  }
  return {nodes,render};
})();
