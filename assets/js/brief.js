"use strict";
(() => {
  const project = window.PORTFOLIO_PROJECTS.find(p => p.id === document.body.dataset.projectId);
  if (!project) return;
  window.PortfolioArchitecture.render(document.querySelector('#brief-architecture'), project);
  const print = document.querySelector('#print-brief');
  print.hidden = false;
  print.addEventListener('click', () => window.print());
})();
