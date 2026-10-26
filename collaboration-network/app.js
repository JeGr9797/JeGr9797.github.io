'use strict';
const $=s=>document.querySelector(s),NS='http://www.w3.org/2000/svg';
const colors={planning:'#ab8aff',routing:'#51d7a0',learning:'#65b7ee'};
let data,selected='emmanuel',topic='all',query='',zoom=1;
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function el(tag,attrs,parent){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);parent.append(n);return n;}
function relevantPapers(){return data.papers.filter(p=>topic==='all'||p.topic===topic);}
function visible(n){return n.papers.some(id=>relevantPapers().some(p=>p.id===id))&&(!query||normalize(n.name).includes(normalize(query))||n.id==='emmanuel');}
function panel(){const n=data.nodes.find(n=>n.id===selected);const pubs=relevantPapers().filter(p=>n.papers.includes(p.id)).sort((a,b)=>b.year-a.year);
 $('#panel').innerHTML=`<div class="panel-eyebrow">${n.id==='emmanuel'?'The researcher':'Selected coauthor'}</div><div class="initials" style="border-color:${colors[n.topic]}">${n.id==='emmanuel'?'EG':escapeHTML(n.name.split(' ').filter(x=>x.length>2).map(x=>x[0]).slice(0,2).join(''))}</div><h3>${escapeHTML(n.name)}</h3><p class="role">${n.id==='emmanuel'?'Operations Research · Tecnológico de Monterrey':n.affiliation?escapeHTML(n.affiliation):'Research coauthor'}</p>${n.orcid?`<a class="profile" href="${escapeHTML(n.orcid)}" target="_blank" rel="noopener">ORCID profile ↗</a>`:''}<div class="panel-stat">${pubs.length} ${n.id==='emmanuel'?'publications in this collection':'shared publications'}${topic==='all'?'':' in this topic'}</div><div class="papers-label"><span>${n.id==='emmanuel'?'SELECTED PUBLICATIONS':'SHARED PUBLICATIONS'}</span><span>${String(pubs.length).padStart(2,'0')}</span></div>${pubs.map(p=>`<article class="paper"><div class="paper-meta"><i class="topic-dot" style="background:${colors[p.topic]}"></i>${p.year} · ${p.topic==='learning'?'Interpretable ML':p.topic==='routing'?'Routing & networks':'Planning & location'}</div><h4>${escapeHTML(p.title)}</h4><p class="journal">${escapeHTML(p.journal)}</p><a href="https://doi.org/${encodeURI(p.doi)}" target="_blank" rel="noopener">Read publication ↗</a></article>`).join('')||'<p class="role">No shared publications in this topic. Choose All research.</p>'}`;
}
function render(){const svg=$('#network');svg.replaceChildren();const root=el('g',{transform:`translate(425 354) scale(${zoom}) translate(-425 -354)`},svg);
 el('circle',{cx:425,cy:354,r:250,class:'guide'},root);el('circle',{cx:425,cy:354,r:132,class:'guide',opacity:'.25'},root);
 const others=data.nodes.filter(n=>n.id!=='emmanuel').sort((a,b)=>a.topic.localeCompare(b.topic)||b.papers.length-a.papers.length||a.name.localeCompare(b.name));
 const positions={emmanuel:{x:425,y:354}};
 others.forEach((n,i)=>{const a=-Math.PI/2+i*2*Math.PI/others.length;positions[n.id]={x:425+250*Math.cos(a),y:354+250*Math.sin(a),angle:a};});
 const visibleIDs=new Set(data.nodes.filter(visible).map(n=>n.id));
 const activeEdges=data.edges.filter(e=>visibleIDs.has(e.a)&&visibleIDs.has(e.b)&&e.papers.some(id=>relevantPapers().some(p=>p.id===id)));
 const neighbors=new Set([selected]);activeEdges.filter(e=>e.a===selected||e.b===selected).forEach(e=>{neighbors.add(e.a);neighbors.add(e.b);});
 const edges=el('g',{},root);
 activeEdges.forEach(e=>{const a=positions[e.a],b=positions[e.b],isSelected=e.a===selected||e.b===selected;el('path',{d:`M ${a.x} ${a.y} Q 425 354 ${b.x} ${b.y}`,class:`edge ${selected!=='emmanuel'&&!isSelected?'dim':''}`,stroke:isSelected?colors[data.nodes.find(n=>n.id===(e.a==='emmanuel'?e.b:e.a)).topic]:'#65708c','stroke-width':Math.min(1+e.papers.length*.6,4),'stroke-opacity':isSelected?'.55':'.18'},edges);});
 data.nodes.forEach(n=>{if(!visibleIDs.has(n.id))return;const pos=positions[n.id],self=n.id==='emmanuel';const g=el('g',{class:`node ${n.id===selected?'selected':''} ${!neighbors.has(n.id)?'dim':''}`,transform:`translate(${pos.x} ${pos.y})`,tabindex:0,role:'button','aria-label':`${n.name}, ${n.papers.length} publications`,'aria-pressed':n.id===selected},root);
 const r=self?39:9+n.papers.length*3;
 if(self)el('circle',{r:49,fill:'none',stroke:'#8063bb','stroke-opacity':'.2','stroke-width':1},g);
 el('circle',{r,fill:self?'#6c40ad':colors[n.topic]},g);
 el('title',{},g).textContent=`${n.name} · ${n.papers.length} publications`;
 if(self){el('text',{'text-anchor':'middle',y:5,style:'font-size:18px;fill:white;font-weight:600'},g).textContent='EG';el('text',{'text-anchor':'middle',y:66,style:'font-size:12px;fill:#e4d7ff'},g).textContent='Emmanuel Gómez-Rocha';el('text',{'text-anchor':'middle',y:83,style:'font-size:9px;fill:#7f8ba3'},g).textContent='OPERATIONS RESEARCH';}
 else {const right=Math.cos(pos.angle)>.15,left=Math.cos(pos.angle)<-.15;const tx=right?r+9:left?-r-9:0;const ty=right||left?4:Math.sin(pos.angle)>0?r+20:-r-12;const t=el('text',{x:tx,y:ty,'text-anchor':right?'start':left?'end':'middle'},g);let parts=n.name.split(' ');const last=parts.pop();el('tspan',{x:tx,dy:0},t).textContent=parts.join(' ');el('tspan',{x:tx,dy:14},t).textContent=last;}
 const select=()=>{selected=n.id;render();panel();};g.addEventListener('click',select);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});
 });$('#empty').hidden=visibleIDs.size>1;
}
async function init(){try{const response=await fetch('./data.json');if(!response.ok)throw Error('Data unavailable');data=await response.json();$('#authorCount').textContent=data.nodes.length-1;
 document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{topic=b.dataset.topic;document.querySelectorAll('[data-topic]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});if(!visible(data.nodes.find(n=>n.id===selected)))selected='emmanuel';render();panel();}));
 $('#search').addEventListener('input',e=>{query=e.target.value;if(query){const matches=data.nodes.filter(n=>n.id!=='emmanuel'&&visible(n));selected=matches.length===1?matches[0].id:'emmanuel';}else selected='emmanuel';render();panel();});
 $('#reset').addEventListener('click',()=>{selected='emmanuel';topic='all';query='';zoom=1;$('#search').value='';document.querySelectorAll('[data-topic]').forEach(b=>{b.classList.toggle('active',b.dataset.topic==='all');b.setAttribute('aria-pressed',b.dataset.topic==='all');});render();panel();});
 $('#zoomIn').onclick=()=>{zoom=Math.min(zoom+.15,1.6);render();};$('#zoomOut').onclick=()=>{zoom=Math.max(zoom-.15,.7);render();};
 render();panel();}catch(e){$('#panel').textContent='The publication data could not be loaded. Please reload the page.';console.error(e);}}
init();

if (window.parent !== window && new URLSearchParams(location.search).has('embed')) {
  const reportHeight = () => window.parent.postMessage({type:'collaboration-network-height',height:document.body.scrollHeight}, location.origin);
  new ResizeObserver(reportHeight).observe(document.body);
  window.addEventListener('load', reportHeight);
}
