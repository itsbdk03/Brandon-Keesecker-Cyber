/* Engineering Lens overlays the existing seven labs with source-backed case studies.
 * No extra project, network request, tracking, external asset, or framework.
 */
(()=>{'use strict';
const model=window.BKEngineeringModel;
if(!model||!model.validate())return;
const isAssurance=/\/assuranceflow\.html$/i.test(location.pathname);
const project=()=>isAssurance?'assurance':document.querySelector('.lab-nav.active[data-panel]')?.dataset.panel||'controls';
const pane=key=>isAssurance?document.querySelector('main'):document.querySelector('#panel-'+key);
const icon='<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14"/><circle cx="7" cy="5" r="2" fill="#0a2432"/><circle cx="14" cy="10" r="2" fill="#0a2432"/></svg>';
function element(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x}
function build(key){
 const entry=model.get(key);if(!entry)return;
 const host=pane(key);if(!host)return;
 if(host.querySelector('.bk-engineering-lens'))return;
 const details=element('details','bk-engineering-lens');details.setAttribute('data-project',key);
 const summary=element('summary','bk-engineering-summary');
 const iconWrap=element('span','bk-eng-symbol');iconWrap.innerHTML=icon;
 const words=element('span','bk-eng-summary-text');
 words.append(element('span','bk-eng-eyebrow','ENGINEERING LENS / SOURCE-BACKED WALKTHROUGH'),element('strong','', 'Explore architecture, decisions & validation'));
 const arrow=element('span','bk-eng-chevron','⌄');
 summary.append(iconWrap,words,arrow);
 const content=element('div','bk-engineering-content');
 const lead=element('div','bk-eng-lead');
 lead.append(element('span','bk-eng-chip',entry.area),element('h3','',entry.question));
 const note=element('p','bk-eng-note','All inputs are synthetic or local examples. This view documents modeled behavior and software verification—not a production security assessment.');
 const small=element('p','bk-eng-input');small.append(element('b','', 'INPUTS  '),document.createTextNode(entry.inputs));
 const flow=element('div','bk-eng-flow');flow.setAttribute('role','list');flow.setAttribute('aria-label',entry.name+' software pipeline');
 for(const [i,stage] of entry.stages.entries()){
  const part=element('section','bk-eng-stage');part.setAttribute('role','listitem');
  part.append(element('span','bk-eng-stage-n',stage[0]),element('h4','',stage[1]),element('p','',stage[2]));
  flow.append(part);if(i!==entry.stages.length-1){const join=element('span','bk-eng-link','→');join.setAttribute('aria-hidden','true');flow.append(join)}
 }
 const grid=element('div','bk-eng-grid');
 const list=(heading,items,cls)=>{
  const item=element('div','bk-eng-card '+cls);item.append(element('h4','',heading));
  const ul=element('ul');for(const desc of items){const li=element('li','',desc);ul.append(li)}item.append(ul);return item
 };
 grid.append(list('Engineering choices',entry.decisions,'decisions'),list('Assumptions and limitations',entry.limits,'limits'));
 const verified=element('div','bk-eng-verification');
 const verText=element('div');verText.append(element('strong','', 'How the implementation is verified'),element('p','',entry.verification));verified.append(verText);
 const buttons=element('div','bk-eng-actions');
 const download=element('button','bk-eng-download','↓ Download case-study notes');
 download.type='button';
 download.addEventListener('click',()=>{
  const t=model.get(key);
  const lines=['# '+t.name+' — Security Engineering Case Study','', '> Synthetic, browser-only learning demonstration. Not an official assessment or assurance opinion.','', '## Engineering question',t.question,'','## Data inputs',t.inputs,'','## Architecture / Data Flow'];
  for(const [i,x] of t.stages.entries())lines.push((i+1)+'. **'+x[1]+'** — '+x[2]);
  lines.push('','## Technical choices',...t.decisions.map(x=>'- '+x),'','## Validation',t.verification,'','## Known limitations',...t.limits.map(x=>'- '+x),'','## Relevant source files',...t.files.map(x=>'- https://github.com/itsbdk03/Brandon-Keesecker-Cyber/blob/main/'+x),'','## Ethical use','No real client systems, confidential findings, controlled unclassified information, credentials or authorization conclusions are provided.');
  const url=URL.createObjectURL(new Blob([lines.join('\n')+'\n'],{type:'text/markdown;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=t.name.toLowerCase()+'-engineering-case-study.md';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 });
 buttons.append(download);
 for(const ref of entry.files){const a=element('a','bk-eng-source',ref.split('/').slice(-1)[0]+' ↗');a.href='https://github.com/itsbdk03/Brandon-Keesecker-Cyber/blob/main/'+ref;a.target='_blank';a.rel='noopener noreferrer';buttons.append(a)}
 const method=document.createElement('a');method.className='bk-eng-method';method.href='methodology.html#'+entry.section;method.textContent='Full technical case study →';
 if(isAssurance)method.href='methodology.html#assuranceflow';
 content.append(lead,note,small,flow,grid,verified,buttons,method);
 details.append(summary,content);
 const anchor=isAssurance?host.querySelector('.fineprint'):host.querySelector('.pane-heading');
 if(anchor)anchor.insertAdjacentElement('afterend',details);else host.prepend(details);
}
for(const key of model.keys)build(key);
if(!isAssurance){
 // Preserve individual panel open/closed state as users compare labs.
 document.querySelectorAll('.lab-nav[data-panel]').forEach(btn=>btn.addEventListener('click',()=>{
  const key=btn.dataset.panel;
  const section=pane(key)?.querySelector('.bk-engineering-lens');
  if(section&&section.open)section.scrollIntoView({block:'nearest',behavior:'instant'});
 }));
}
})();