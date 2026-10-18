/* Searchable navigation model for the same seven browser-local cybersecurity labs.
 * No remote search, tracking, storage, or eighth project.
 */
(function(root, factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BKCommandModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const projects=Object.freeze([
    {id:'controls',name:'ControlTrace',number:'01',type:'GRC',description:'Control narratives, ownership and evidence gaps',tags:'NIST FedRAMP CMMC compliance audit control evidence documentation SSP'},
    {id:'hunt',name:'SignalHunt',number:'02',type:'Detection',description:'Events, triage and source-aware correlations',tags:'SIEM security operations SOC logs incident forensic authentication threat'},
    {id:'cloud',name:'CloudGuard',number:'03',type:'Architecture',description:'Model defense-in-depth cloud safeguards',tags:'AWS architecture cloud MFA encryption least privilege'},
    {id:'risk',name:'RiskMatrix',number:'04',type:'Risk',description:'Heatmap, risk owners and treatment decisions',tags:'risk register likelihood impact governance scoring'},
    {id:'config',name:'ConfigLens',number:'05',type:'Cloud review',description:'Assess sample AWS JSON and remediation evidence',tags:'AWS cloud S3 IAM scan detection SARIF configuration'},
    {id:'path',name:'AttackPath',number:'06',type:'Threat modeling',description:'Explore fictional attack routes and safeguards',tags:'network attack graph path threat segmentation defense'},
    {id:'assurance',name:'AssuranceFlow',number:'07',type:'GRC automation',description:'Review control statements and partial OSCAL imports',tags:'FedRAMP OSCAL NIST SSP documentation control implementation evidence'}
  ]);
  const actions=Object.freeze([
    {id:'walkthrough',label:'Open guided walkthrough',description:'Four steps to explore this lab',tags:'help onboarding tour tutorial guide'},
    {id:'exercise',label:'Open Evidence Check',description:'Complete the lab’s measurable exercise',tags:'challenge demo verify outcome'},
    {id:'engineering',label:'View architecture and design decisions',description:'Inspect code, data flow and validation',tags:'engineering case study technical source architecture'},
    {id:'report',label:'Download executive report',description:'Export the current fictional analysis',tags:'print PDF report executive export'},
    {id:'copylink',label:'Copy a direct link',description:'Share this project’s exact route',tags:'URL link share bookmark'}
  ]);
  const clean=q=>String(q??'').toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim().slice(0,100);
  function rank(item,q){
    const tokens=clean(q).split(' ').filter(Boolean);
    if(!tokens.length)return 1;
    const name=clean(item.name||item.label);
    const type=clean(item.type||'');
    const description=clean(item.description);
    const tags=clean(item.tags);
    let score=0;
    for(const token of tokens){
      if(name===token)score+=40;
      else if(name.startsWith(token))score+=25;
      else if(name.includes(token))score+=18;
      else if(type.includes(token))score+=12;
      else if(tags.split(' ').some(t=>t.startsWith(token)))score+=8;
      else if(description.includes(token))score+=5;
      else return 0;
    }
    return score;
  }
  const scopedActions=current=>projects.some(p=>p.id===current)?actions.slice():[];
  function search(query,current){
    const q=clean(query);
    return {
      projects:projects.map((p,i)=>({...p,score:rank(p,q),index:i})).filter(p=>p.score>0).sort((a,b)=>b.score-a.score||a.index-b.index),
      actions:scopedActions(current).map((a,i)=>({...a,score:rank(a,q),index:i})).filter(a=>a.score>0).sort((a,b)=>b.score-a.score||a.index-b.index)
    };
  }
  function urlFor(id,locationKind='hub'){
    if(!projects.some(p=>p.id===id))throw Error('Unknown project route');
    if(locationKind!=='hub'&&locationKind!=='assurance')throw Error('Invalid host context');
    if(id==='assurance')return locationKind==='assurance'?'assuranceflow.html':'assuranceflow.html';
    return locationKind==='assurance'?'index.html#'+id:'#'+id;
  }
  function validate(){
    if(projects.length!==7||new Set(projects.map(p=>p.id)).size!==7)throw Error('Expected seven unique current projects');
    if(actions.some(a=>!a.id||!a.label))throw Error('Invalid command action');
    return true;
  }
  return Object.freeze({projects,actions,rank,search,urlFor,clean,validate});
});