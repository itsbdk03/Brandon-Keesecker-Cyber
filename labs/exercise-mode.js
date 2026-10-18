/* Evidence Checks: local outcome verification for the seven existing labs. */
(()=>{'use strict';
const model=window.BKExerciseModel;if(!model||!model.verifyDefinition())return;
const standalone=/\/assuranceflow\.html$/i.test(location.pathname);
const make=(tag,cls,val)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(val!==undefined)el.textContent=val;return el};
const num=id=>{const n=Number(document.querySelector(id)?.textContent.trim());return Number.isFinite(n)?n:0};
function snapshot(key){
 const data=window.BKLabData;
 switch(key){
 case 'controls':return {filter:document.querySelector('#controlStatus')?.value,selected:document.querySelector('#controlSelected')?.textContent.trim(),records:data?.controls()||[]};
 case 'hunt':return {findings:data?.findings().length||0,chains:document.querySelectorAll('#huntCorrelation .v6-timeline-card').length};
 case 'cloud':{const c=data?.cloud()||{},defs=data?.cloudControls()||[];return {safeguards:defs.map(x=>!!c[x.id])}}
 case 'risk':return {filtered:!!document.querySelector('#riskHeat .heat-cell.highlight'),shown:document.querySelectorAll('#riskTable tr').length};
 case 'config':return {preset:document.querySelector('#configPreset')?.value,findings:num('#configFindings'),resolved:num('#configResolved')};
 case 'path':return {ready:!!window.BKAttackPathReport,reachable:num('#pathReach'),routes:num('#pathRoutes')};
 case 'assurance':return {items:window.BKAssuranceReport?.().items||[]};
 default:throw Error('Unrecognized project');
 }
}
function mount(key){
 const m=model.missions[key];if(!m)return;
 const host=standalone?document.querySelector('main'):document.querySelector('#panel-'+key);
 if(!host||host.querySelector('.bk-proof'))return;
 const root=make('details','bk-proof');root.dataset.project=key;
 const summary=make('summary','bk-proof-trigger');
 const word=make('span','bk-proof-trigger-text');
 word.append(make('span','bk-proof-kicker','EVIDENCE CHECK / '+m.name.toUpperCase()),make('strong','', 'Take a 60-second challenge · verify an outcome'));
 summary.append(make('span','bk-proof-symbol','◎'),word,make('span','bk-proof-chevron','⌄'));
 const body=make('div','bk-proof-inner');
 const intro=make('div','bk-proof-hero');
 intro.append(make('span','bk-proof-label','ONE PRACTICAL INVESTIGATION'),make('h3','',m.title),make('p','bk-proof-obj',m.objective));
 const cols=make('div','bk-proof-cols'),steps=make('section','bk-proof-steps'),why=make('section','bk-proof-why');
 steps.append(make('h4','', 'Your assignment'));
 const ordered=make('ol');for(const line of m.steps)ordered.append(make('li','',line));steps.append(ordered);
 why.append(make('h4','', 'Why it matters'),make('p','',m.why));cols.append(steps,why);
 const actions=make('div','bk-proof-actions');
 const locate=make('button','bk-proof-action','↗ Locate controls'),verify=make('button','bk-proof-action bk-proof-verify','✓ Verify current result'),copy=make('button','bk-proof-action','▤ Copy evidence note');
 for(const btn of [locate,verify,copy])btn.type='button';
 copy.disabled=true;actions.append(locate,verify,copy);
 const status=make('div','bk-proof-feedback');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 status.append(make('strong','', 'Ready to begin'),make('p','', 'Follow the steps, then check the current browser data. No server or account is involved.'));
 let last=null,time='';
 locate.addEventListener('click',()=>{const target=document.querySelector(m.target);if(!target)return;target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});if(target.matches('button,select,input,textarea,[tabindex]'))target.focus({preventScroll:true})});
 verify.addEventListener('click',()=>{
  try{
   const r=model.evaluate(key,snapshot(key));last=r;time=new Date().toISOString();
   status.classList.toggle('bk-proof-done',r.complete);
   status.replaceChildren(make('strong','',r.complete?'Modeled outcome verified ✓':'Not yet verified'),make('p','',r.evidence),make('small','',r.next));
   copy.disabled=!r.complete;
  }catch(e){last=null;copy.disabled=true;status.replaceChildren(make('strong','', 'Unable to inspect'),make('p','', 'Return to the workbench after it initializes and retry.'))}
 });
 copy.addEventListener('click',()=>{
  if(!last?.complete)return;
  const clean=s=>String(s??'').replace(/[\r\n]+/g,' ').replace(/[<>]/g,'').slice(0,500);
  const note=['# '+m.name+' — Evidence Check','','- Exercise: '+clean(m.title),'- Checked: '+time,'- Result: PASS (fictional local state only)','- Observed: '+clean(last.evidence),'- Interpretation: '+clean(m.why),'- Limitation: This confirms a modeled browser result, not a real security outcome or compliance status.','- Source: https://github.com/itsbdk03/Brandon-Keesecker-Cyber'].join('\n');
  const done=()=>{copy.textContent='Evidence note copied ✓';setTimeout(()=>copy.textContent='▤ Copy evidence note',1800)};
  if(navigator.clipboard?.writeText){navigator.clipboard.writeText(note).then(done).catch(()=>{copy.textContent='Clipboard unavailable; use HTTPS'})}
  else{const url=URL.createObjectURL(new Blob([note],{type:'text/markdown'}));const a=make('a');a.href=url;a.download=key+'-evidence-check.md';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);copy.textContent='Evidence note saved'}
 });
 body.append(intro,cols,actions,status,make('p','bk-proof-disclaimer','Synthetic, local demonstration only. A passing check does not validate a real security control, incident, configuration, or regulatory requirement.'));
 root.append(summary,body);
 const architecture=host.querySelector('.bk-engineering-lens');
 const preceding=architecture||host.querySelector(standalone?'.fineprint':'.pane-heading');
 if(preceding)preceding.insertAdjacentElement('afterend',root);else host.prepend(root);
}
for(const key of standalone?['assurance']:model.keys)mount(key);
})();