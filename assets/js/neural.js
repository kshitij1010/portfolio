"use strict";
window.NeuralPortfolio = (() => {
  function init({projects,showProject}) {
    const map = document.querySelector('#neural-map');
    const probe = document.querySelector('#neural-probe');
    const positions = [[10,24],[10,50],[10,76],[36,14],[36,38],[36,62],[36,86],[63,14],[63,38],[63,62],[63,86],[89,24],[89,50],[89,76]];
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
    const edges=[];
    [[0,3],[0,4],[1,4],[1,5],[2,5],[2,6],[3,7],[3,8],[4,7],[4,8],[4,9],[5,8],[5,9],[6,9],[6,10],[7,11],[8,11],[8,12],[9,12],[9,13],[10,13]].forEach(([from,to])=>{
      const line=document.createElementNS(svg.namespaceURI,'line');line.setAttribute('x1',positions[from][0]);line.setAttribute('y1',positions[from][1]);line.setAttribute('x2',positions[to][0]);line.setAttribute('y2',positions[to][1]);svg.append(line);edges.push({line,from,to});
    });map.append(svg);
    const buttons=[];
    function select(index) {
      const p=projects[index];
      buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
      edges.forEach(({line,from,to})=>line.classList.toggle('connected',from===index||to===index));
      probe.replaceChildren();
      const label=document.createElement('span');label.className='probe-kicker';label.textContent=`NODE ${String(index+1).padStart(2,'0')} · ${p.lifecycle==='planned'?'PLANNED CONCEPT':p.employer || p.type}`;
      const title=document.createElement('h3');title.textContent=p.title;
      const desc=document.createElement('p');desc.textContent=p.summary;
      const open=document.createElement('button');open.className='probe-open';open.textContent='Explore this project ↗';open.addEventListener('click',()=>showProject(p.id));
      probe.append(label,title,desc,open);
    }
    projects.forEach((p,i)=>{
      const b=document.createElement('button');b.type='button';b.className='neural-node';b.style.left=positions[i][0]+'%';b.style.top=positions[i][1]+'%';b.style.setProperty('--phase',`${i*-.43}s`);b.textContent=String(i+1).padStart(2,'0');b.setAttribute('aria-label',`Probe ${p.title}${p.lifecycle==='planned'?' (planned)':''}`);b.title=p.title;b.addEventListener('click',()=>select(i));
      b.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(i+1)%projects.length;if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(i+projects.length-1)%projects.length;if(next!==undefined){e.preventDefault();buttons[next].focus();select(next);}});
      buttons.push(b);map.append(b);
    });select(0);
  }
  return {init};
})();
