/* One coherent, keyboard-first way to navigate the EXISTING seven projects.
 * Search and commands run locally; no network, account or telemetry.
 */
(()=>{'use strict';
const model=window.BKCommandModel;
if(!model||!model.validate())return;
const isAssurance=/\/assuranceflow\.html$/i.test(location.pathname);
const hostContext=isAssurance?'assurance':'hub';
const current=()=>isAssurance?'assurance':document.querySelector('.lab-nav.active[data-panel]')?.dataset.panel||'controls';
const elt=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const trigger=elt('button','bk-command-trigger','⌘  Explore projects');
trigger.type='button';trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-keyshortcuts','Control+K Meta+K');trigger.title='Search seven labs and common actions (Ctrl/⌘ + K)';
const dialog=elt('dialog','bk-command-dialog');
dialog.setAttribute('aria-label','Navigate security workbenches');
const panel=elt('div','bk-command-panel');
const head=elt('div','bk-command-heading');
head.append(elt('span','bk-command-eyebrow','CYBER WORKSPACE  /  COMMAND CENTER'));
const close=elt('button','bk-command-close','×');close.type='button';close.setAttribute('aria-label','Close command menu');head.append(close);
const searchRow=elt('div','bk-command-search-row');
const searchLabel=elt('label','bk-command-label','Search projects, controls, or actions');
const input=elt('input','bk-command-search');input.type='search';input.placeholder='Try FedRAMP, incident, graphs, export…';input.autocomplete='off';input.setAttribute('aria-label','Search projects and commands');
const hint=elt('p','bk-command-hint','Type to filter. Use ↑ ↓ to navigate, Enter to open, Esc to close.');
const results=elt('div','bk-command-results');results.id='bk-command-results';results.setAttribute('aria-live','polite');
input.setAttribute('aria-controls',results.id);
searchRow.append(searchLabel,input);
const footer=elt('div','bk-command-footer');
footer.append(elt('span','', '7 existing tools · fictional data · browser-local'),elt('span','',''));
panel.append(head,searchRow,hint,results,footer);dialog.append(panel);document.body.append(trigger,dialog);
let liveButtons=[],lastTrigger=null,restoreFocus=true;
function section(title,items,kind){
  if(!items.length)return null;
  const group=elt('section','bk-command-group');
  group.append(elt('h3','bk-command-section-title',title));
  for(const item of items){
    const button=elt('button','bk-command-result');button.type='button';
    button.dataset.command=kind+':'+item.id;
    const badge=elt('span','bk-command-result-icon',kind==='project'?item.number:'↗');
    const body=elt('span','bk-command-result-body');
    body.append(elt('strong','',kind==='project'?item.name:item.label),elt('small','',item.description));
    const end=elt('span','bk-command-result-end',kind==='project'?item.type:'ACTION');
    button.append(badge,body,end);
    button.addEventListener('click',()=>activate(kind,item.id));
    button.addEventListener('keydown',e=>{
      if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
      e.preventDefault();const i=liveButtons.indexOf(button);
      if(e.key==='ArrowDown'){(liveButtons[i+1]||liveButtons[0])?.focus()}
      else if(i===0)input.focus();else liveButtons[i-1]?.focus();
    });
    group.append(button);liveButtons.push(button);
  }
  return group;
}
function render(){
  if(!dialog.open)return;
  const q=input.value;
  const found=model.search(q,current());
  liveButtons=[];results.replaceChildren();
  const p=section('EXISTING SECURITY LABS',found.projects,'project');
  const a=section('CURRENT LAB ACTIONS',found.actions,'action');
  if(p)results.append(p);if(a)results.append(a);
  if(!liveButtons.length){const empty=elt('p','bk-command-empty','No matches in the existing seven projects. Try “cloud”, “risk”, “evidence”, or “report”.');results.append(empty)}
}
function show(){
  if(dialog.open)return;
  lastTrigger=document.activeElement;restoreFocus=true;input.value='';dialog.showModal();render();input.focus();
}
function hide(){if(dialog.open)dialog.close()}
function reveal(selector){
  const target=document.querySelector(selector);
  if(!target)return false;
  if(target.tagName==='DETAILS')target.open=true;
  target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  if(target.tagName==='DETAILS')target.querySelector('summary')?.focus({preventScroll:true});
  return true;
}
function runAction(id){
  const key=current(),prefix=isAssurance?'main':'#panel-'+key;
  if(id==='walkthrough'){document.querySelector('.bk-reviewer-launch')?.click();return}
  if(id==='exercise'){reveal(prefix+' .bk-proof');return}
  if(id==='engineering'){reveal(prefix+' .bk-engineering-lens');return}
  if(id==='report'){document.querySelector(prefix+' .bk-print-report')?.click();return}
  if(id==='copylink'){
    const uri=new URL(model.urlFor(key,hostContext),location.href).href;
    if(navigator.clipboard?.writeText)navigator.clipboard.writeText(uri).then(()=>{trigger.textContent='✓ Link copied';setTimeout(()=>trigger.textContent='⌘  Explore projects',1800)}).catch(()=>window.prompt('Copy this local project link:',uri));
    else window.prompt('Copy this local project link:',uri);
  }
}
function activate(kind,id){
  restoreFocus=false;
  hide();
  if(kind==='project'){
    if(id==='assurance'){if(!isAssurance)location.href=model.urlFor(id,'hub');else document.querySelector('main')?.scrollIntoView({block:'start'});return}
    if(isAssurance){location.href=model.urlFor(id,'assurance');return}
    const tab=document.querySelector('.lab-nav[data-panel="'+id+'"]');tab?.click();
    tab?.focus({preventScroll:true});return;
  }
  // Delay nothing. Commands operate synchronously on already-rendered data.
  if(model.actions.some(a=>a.id===id))runAction(id);
}
trigger.addEventListener('click',show);close.addEventListener('click',hide);
input.addEventListener('input',render);
input.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'){e.preventDefault();liveButtons[0]?.focus()}
  else if(e.key==='Enter'){e.preventDefault();liveButtons[0]?.click()}
});
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&!e.altKey&&e.key.toLowerCase()==='k'){e.preventDefault();if(dialog.open)hide();else show()}
});
dialog.addEventListener('click',e=>{if(e.target===dialog)hide()});
dialog.addEventListener('close',()=>{if(restoreFocus)lastTrigger?.focus?.({preventScroll:true})});
})();