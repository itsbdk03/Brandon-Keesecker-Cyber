/* Source-backed engineering architecture diagrams for the 7 existing methodology entries. */
(()=>{'use strict';
const source=window.BKEngineeringModel;
if(!source||!source.validate())return;
const elt=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
for(const key of source.keys){
 const item=source.get(key),section=document.getElementById(item.section);
 if(!section)continue;
 const block=elt('div','bk-method-architecture');
 block.append(elt('h3','bk-method-flow-title','Architecture / evidence flow'));
 const flow=elt('div','bk-eng-flow');flow.setAttribute('role','list');flow.setAttribute('aria-label',item.name+' engineering pipeline');
 item.stages.forEach((stage,i)=>{
  const step=elt('div','bk-eng-stage');step.setAttribute('role','listitem');
  step.append(elt('span','bk-eng-stage-n',stage[0]),elt('h4','',stage[1]),elt('p','',stage[2]));flow.append(step);
  if(i<item.stages.length-1){const arrow=elt('span','bk-eng-link','→');arrow.setAttribute('aria-hidden','true');flow.append(arrow)}
 });
 block.append(flow);
 const box=elt('div','bk-method-verified');
 box.append(elt('strong','', 'VALIDATION & REVIEW'),elt('p','',item.verification));
 const actions=elt('div','bk-eng-actions');
 for(const path of item.files){
  const a=elt('a','bk-eng-source','View '+path.split('/').at(-1)+' ↗');
  a.href='https://github.com/itsbdk03/Brandon-Keesecker-Cyber/blob/main/'+path;
  a.rel='noopener noreferrer';a.target='_blank';actions.append(a)
 }
 box.append(actions);block.append(box);
 section.append(block);
}
})();