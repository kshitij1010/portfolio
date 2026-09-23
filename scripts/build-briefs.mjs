import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ctx={window:{}};
vm.runInNewContext(readFileSync(resolve(root,'assets/js/projects.js'),'utf8'),ctx);
vm.runInNewContext(readFileSync(resolve(root,'assets/js/architecture.js'),'utf8'),ctx);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const href=url=>/^(https:|mailto:)/.test(url)?url:url.startsWith('#')?'../index.html'+url:'../'+url;
mkdirSync(resolve(root,'briefs'),{recursive:true});
for(const p of ctx.window.PORTFOLIO_PROJECTS){
  const planned=p.lifecycle==='planned';
  const stages=ctx.window.PortfolioArchitecture.nodes(p);
  const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111329"><title>${esc(p.title)} — Kshitij Joshi</title><meta name="description" content="${esc(p.summary)}"><link rel="icon" href="../assets/images/orbit-mark.svg"><link rel="stylesheet" href="../assets/css/orbit.css"><link rel="stylesheet" href="../assets/css/neural.css?v=neural-1"><link rel="stylesheet" href="../assets/css/brief.css?v=neural-1"><script defer src="../assets/js/projects.js?v=neural-1"></script><script defer src="../assets/js/architecture.js?v=neural-1"></script><script defer src="../assets/js/brief.js?v=neural-1"></script></head>
<body class="onepager" data-project-id="${esc(p.id)}"><header class="brief-nav"><a href="../index.html#missions">← All projects</a><span>Kshitij Joshi / AI Engineer</span><button id="print-brief" class="btn" hidden>Print / save PDF</button></header>
<main class="brief-sheet"><div class="brief-heading"><p class="eyebrow">${esc(p.type)} · ${esc(p.activityLabel)}</p><h1>${esc(p.title)}</h1><span class="brief-status">${planned?'Planned concept · not implemented':'Documented work'}</span><p class="brief-intro">${esc(p.detail)}</p></div>
<div class="brief-summary"><section><h2>The problem</h2><p>${esc(p.problem)}</p></section><section><h2>${planned?'Proposed approach':'Approach & contribution'}</h2><ul>${p.approach.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p>${esc(p.contribution[0])}</p></section><section><h2>${planned?'Proposed evaluation':'Outcome & evidence'}</h2><p>${esc(p.outcome)}</p><p>${esc(p.evaluation)}</p></section><section><h2>Scope & next steps</h2><p>${esc(p.constraints[0])}</p><p>${esc(p.nextSteps[0])}</p></section></div>
<section class="project-architecture" id="brief-architecture" aria-label="Interactive project architecture"><h2>System workflow</h2><p>High-level ${planned?'proposed':'documented'} workflow.</p><ol>${stages.map(n=>`<li><strong>${esc(n.label)}</strong> — ${esc(n.detail)}</li>`).join('')}</ol></section>
<footer class="brief-sources"><p><strong>${planned?'Proposed focus':'Project context'}:</strong> ${p.tags.map(esc).join(' · ')}</p><p><strong>Source:</strong> <a href="${esc(href(p.sourceUrl))}">${esc(p.sourceLabel)}</a></p><div class="brief-resource-list">${p.resources.map(r=>r.status==='available'?`<a href="${esc(href(r.url))}" target="_blank" rel="noopener noreferrer">${esc(r.label)} ↗</a>`:`<span>${esc(r.label)} · Link pending</span>`).join('')}</div><p class="brief-footnote">Kshitij Joshi · <a href="../index.html#contact">Get in touch</a> · Architecture is a public schematic, not an exact deployment topology. Design considerations are explanatory.</p></footer></main></body></html>`;
  writeFileSync(resolve(root,'briefs',`${p.id}.html`),html);
}
console.log(`Built ${ctx.window.PORTFOLIO_PROJECTS.length} shareable one-page summaries.`);
