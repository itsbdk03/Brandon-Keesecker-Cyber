/* Evidence Checks: deterministic, browser-only guided exercises for the existing 7 projects.
 * Only modeled UI outcomes are checked. The results do not validate real systems.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BKExerciseModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const missions=Object.freeze({
 controls:{name:'ControlTrace',title:'Trace an open control gap',objective:'Find a sample control that still needs evidence or documentation, then explain its next action.',steps:['Set the evidence-status filter to Gap.','Select any gap record from the filtered inventory.','Inspect its narrative, evidence IDs and remediation note before verifying.'],target:'#controlStatus',why:'A status alone cannot establish implementation. The owner, evidence and open action have to agree.',verified:'A gap-status record is selected while the gap filter is active.'},
 hunt:{name:'SignalHunt',title:'Correlate a suspicious sign-in',objective:'Produce a traceable investigation lead from the fictional authentication and endpoint events.',steps:['Use the preloaded fictional events and run detections.','Inspect the source-aware activity timeline.','Check that a rule finding and an authentication sequence are both visible.'],target:'#huntScan',why:'Correlation requires both timing and source identity. A sequence is an investigation lead, not proof of compromise.',verified:'Detection findings and at least one same-source timeline are visible.'},
 cloud:{name:'CloudGuard',title:'Apply defense in depth',objective:'Explore the modeled architecture after all six safeguards are enabled.',steps:['Review the six named safeguards.','Enable the remaining safeguards, or use Apply recommended safeguards.','Compare the updated architecture and remaining evidence requests.'],target:'#cloudSwitches',why:'Defense in depth spans identity, access, encryption, monitoring and networks; toggles are not deployed infrastructure.',verified:'All six modeled safeguards are enabled.'},
 risk:{name:'RiskMatrix',title:'Drill into the risk heatmap',objective:'Use the 5 × 5 matrix to isolate a specific likelihood/impact combination.',steps:['Inspect the fictional risks in the register.','Select a heatmap cell that contains at least one risk.','Confirm that the register is filtered to that combination.'],target:'#riskHeat',why:'Transparent scoring and interactive filtering expose assumptions that may otherwise be buried in a heatmap.',verified:'A nonempty heatmap cell is actively filtering the register.'},
 config:{name:'ConfigLens',title:'Reverify a hardening change',objective:'Contrast the exposed and hardened JSON snapshots without treating missing evidence as remediation.',steps:['Review the exposed sample and its findings.','Choose the Hardened environment sample.','Inspect the remediation comparison and verify resolved findings.'],target:'#configPreset',why:'Only checks that can be re-evaluated may substantiate modeled remediation; omitted fields remain unknown.',verified:'The hardened sample has zero findings and previously flagged checks are recorded as resolved.'},
 path:{name:'AttackPath',title:'Break the modeled attack routes',objective:'Interrupt all reachable paths to the three fictional protected assets.',steps:['Review the initial graph and reachable assets.','Apply safeguards individually or select Apply all safeguards.','Confirm that no targets remain reachable in the modeled graph.'],target:'#pathDiagram',why:'Reachability is a graph-model result, not an exploit probability or guarantee of real-world security.',verified:'The current graph has zero modeled reachable targets and routes.'},
 assurance:{name:'AssuranceFlow',title:'Complete the RA-5 documentation record',objective:'Improve a fictional vulnerability-monitoring record until the documentation rubric has no open issues.',steps:['Select the RA-5 record from the fictional control list.','Provide a responsible owner and a substantive narrative; retain a fictional evidence ID.','Choose Implemented, clear the open-gap text, and apply the changes.'],target:'#rows',why:'A complete record documents ownership and claimed implementation but cannot independently prove control effectiveness.',verified:'RA-5 has an implemented status and no open documentation problems under this illustrative rubric.'}
});
const keys=Object.freeze(Object.keys(missions));
const safeNum=x=>{const v=Number(x);return Number.isFinite(v)?v:0};
function evaluate(key,state){
 if(!missions[key])throw Error('Unknown project: '+key);
 if(!state||typeof state!=='object')throw Error('A current-state snapshot is required');
 let complete=false,evidence='',next='';
 switch(key){
 case 'controls':{
   const item=(Array.isArray(state.records)?state.records:[]).find(x=>x.id===state.selected);
   complete=state.filter==='gap'&&!!item&&item.status==='gap';
   evidence=complete?'Selected '+item.id+' is marked Gap; sample evidence and next-action fields are available for review.':'A gap record must be selected while the Gap status filter is active.';
   next='Select Gap in the status filter, then open one of the remaining records.';
   break;
 }
 case 'hunt':{
   const f=safeNum(state.findings),c=safeNum(state.chains);
   complete=f>0&&c>0;
   evidence=f+' fictional rule finding(s); '+c+' source-aware timeline(s) visible.';
   next='Run detections against the sample events, then inspect the correlated-activity section.';
   break;
 }
 case 'cloud':{
   const enabled=Array.isArray(state.safeguards)?state.safeguards.filter(Boolean).length:0;
   complete=enabled===6&&state.safeguards.length===6;
   evidence=enabled+'/6 illustrative safeguards enabled.';
   next='Turn on the remaining safeguards or use the existing Apply recommended safeguards button.';
   break;
 }
 case 'risk':{
   const filtered=!!state.filtered,shown=safeNum(state.shown);
   complete=filtered&&shown>0;
   evidence=filtered?'Heatmap filter is active; '+shown+' matching record(s).':'No active heatmap filter.';
   next='Click a populated heatmap cell and inspect the resulting risk register.';
   break;
 }
 case 'config':{
   const findings=safeNum(state.findings),resolved=safeNum(state.resolved);
   complete=state.preset==='hardened'&&findings===0&&resolved>0;
   evidence='Scenario '+String(state.preset||'unspecified')+'; '+findings+' current findings; '+resolved+' modeled resolutions.';
   next='Use the Hardened environment sample and review the before/after panel.';
   break;
 }
 case 'path':{
   const targets=safeNum(state.reachable),routes=safeNum(state.routes);
   complete=state.ready===true&&targets===0&&routes===0;
   evidence=targets+' reachable protected targets; '+routes+' modeled routes.';
   next='Apply all safeguards or isolate the specific weaknesses that keep routes reachable.';
   break;
 }
 case 'assurance':{
   const record=(Array.isArray(state.items)?state.items:[]).find(x=>x.id==='RA-5');
   const issues=Array.isArray(record?.problems)?record.problems:[];
   complete=!!record&&record.status==='implemented'&&issues.length===0;
   evidence=record?'RA-5: '+record.status+', '+record.score+'/100 documentation points, '+issues.length+' open rubric issue(s).':'RA-5 record unavailable.';
   next='Select RA-5, finish the narrative and owner, clear the gap, and apply your changes.';
   break;
 }
 }
 return Object.freeze({complete,evidence,next:complete?missions[key].verified:next});
}
function verifyDefinition(){
 if(keys.length!==7)throw Error('Exactly seven existing projects required');
 for(const key of keys){const m=missions[key];if(!m.name||!m.objective||m.steps.length!==3||!m.target||!m.verified||!m.why)throw Error('Incomplete '+key)}
 return true;
}
return Object.freeze({missions,keys,evaluate,verifyDefinition});
});