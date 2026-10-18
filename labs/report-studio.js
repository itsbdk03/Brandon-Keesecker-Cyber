/* Studio-level, consistent printable analyst reports for the existing seven labs. */
(()=>{'use strict';
const engine=window.BKReportEngine;if(!engine)return;
const $=s=>document.querySelector(s),sample='Synthetic sample inputs. This is not a formal control assessment, vulnerability scan, audit, or independent assurance.';
const metric=(label,value,note='')=>({label,value:String(value),note});
const finding=(id,name,status,evidence,action)=>({id:String(id??''),finding:String(name??''),status:String(status??''),evidence:String(evidence??''),action:String(action??'')});
const recommendations=['Independently confirm source data, environment boundary, and assumptions.','Request actual implementation evidence and record reviewer decisions.','Validate findings and compensating safeguards through an authorized review.'];
const common=(title,area)=>({title,area,subtitle:'Illustrative workpaper • local interactive demonstration',scope:sample,metrics:[],findings:[],recommendations:recommendations.slice(),limitations:[sample,'A modeled score is not a measure of real control effectiveness.'],methodology:'Explainable demonstration rules and documented illustrative data; no live integrations or official authorization decision.'});
function build(name){
  const src=window.BKLabData;
  let p;
  if(name==='controls'){
    if(!src)throw Error('ControlTrace data unavailable');
    const rows=src.controls();
    p=common('ControlTrace | Evidence Quality Review','CONTROL EVIDENCE / GRC');
    p.metrics=[metric('Control records',rows.length),metric('Ready by sample status',rows.filter(x=>x.status==='ready').length),metric('Open gaps',rows.filter(x=>x.status==='gap').length),metric('Missing support',rows.filter(x=>!x.narrative?.trim()||!x.evidence?.trim()).length)];
    p.findings=rows.map(x=>finding(x.id,x.name,x.status,x.evidence||'Evidence unavailable',x.note||'Validate implementation and reviewer approval.'));
    p.methodology='Curated fictional implementation narratives and evidence references; status is user-editable, not independently validated.';
  }else if(name==='hunt'){
    if(!src)throw Error('SignalHunt data unavailable');
    const events=src.events(),findings=src.findings();
    p=common('SignalHunt | Detection Investigation','DETECTION ENGINEERING / FORENSICS');
    p.metrics=[metric('Events reviewed',events.length),metric('Rule findings',findings.length),metric('High / critical',findings.filter(x=>['High','Critical'].includes(x.severity)).length),metric('Identities observed',new Set(events.map(x=>x.user)).size)];
    p.findings=findings.map((x,i)=>finding(x.technique||i+1,x.rule,x.severity,(x.timestamp||'')+' • '+(x.user||'')+' • '+(x.ip||'')+' • '+(x.detail||''),'Corroborate identity, source, endpoint and additional telemetry.'));
    p.methodology='Deterministic local detection heuristics with source-aware failure-to-success correlations. Subsequent process/network events are temporal context only.';
    p.recommendations=['Verify MFA and source context for the observed authentication sequence.','Inspect endpoint process ancestry and raw commands before escalating.','Check network direction, reputation, and allow/block logs before inferring activity.'];
    p.limitations.push('MITRE ATT&CK technique tags are investigation context, not attribution or proof of compromise.');
  }else if(name==='cloud'){
    if(!src)throw Error('CloudGuard data unavailable');
    const state=src.cloud(),items=src.cloudControls(),applied=items.filter(x=>state[x.id]);
    p=common('CloudGuard | Architecture Safeguard Review','DEFENSE IN DEPTH / CLOUD');
    p.metrics=[metric('Safeguards modeled',items.length),metric('Applied in model',applied.length),metric('Outstanding in model',items.length-applied.length),metric('Status','Tabletop only')];
    p.findings=items.map(x=>finding(x.id,x.name,state[x.id]?'Modeled applied':'Modeled absent',x.description||'User-controlled sample safeguard',state[x.id]?'Test whether this control works as intended.':'Evaluate feasibility, ownership, and secure deployment.'));
    p.methodology='Simple local architecture safeguarding toggles with hand-weighted illustrative scoring.';
    p.limitations.push('No live cloud account, network flow, identity provider, or DoD impact level is evaluated.');
  }else if(name==='risk'){
    if(!src)throw Error('RiskMatrix data unavailable');
    const rows=src.risks(),score=x=>Math.round(Number(x.l)*Number(x.i)*(1-.15*Number(x.m)));
    p=common('RiskMatrix | Risk Treatment Brief','RISK GOVERNANCE / DECISION SUPPORT');
    p.metrics=[metric('Risks tracked',rows.length),metric('Elevated residual',rows.filter(x=>score(x)>=10).length),metric('Average residual',rows.length?(rows.reduce((n,x)=>n+score(x),0)/rows.length).toFixed(1):'N/A'),metric('Scale','0–25')];
    p.findings=rows.slice().sort((a,b)=>score(b)-score(a)).map(x=>finding(x.id,x.name,'Residual '+score(x)+'/25','Owner: '+x.owner+' • likelihood '+x.l+' • impact '+x.i+' • mitigation '+x.m+'/5','Confirm treatment authority, due date, ownership, and acceptable residual risk.'));
    p.methodology='Illustrative score: round(likelihood × impact × [1 − 0.15 × maturity]). Not a NIST-prescribed method.';
    p.recommendations=['Validate risk appetite and criticality before selecting treatments.','Record approval, owners, next review dates, and compensating controls.'];
  }else if(name==='config'){
    const data=window.BKConfigLensReport?.();
    if(!data||!data.review)throw Error('Configuration review unavailable');
    const a=data.review.after,delta=data.review;
    p=common('ConfigLens | Configuration Findings and Delta','CLOUD CONFIGURATION / REVIEW');
    p.metrics=[metric('Evaluated checks',a.evaluations),metric('Findings',a.results.length),metric('Unassessed fields',a.unassessed),metric('Verified resolved',delta.resolved.length)];
    p.findings=a.results.map(x=>finding(x.ruleId,x.title,x.severity,x.resource+' • '+x.evidence,x.fix));
    for(const old of delta.unverified)p.findings.push(finding(old.ruleId,old.title,'Not reverified',old.resource+' • original: '+old.evidence,'Restore the missing check evidence; do not assume remediation.'));
    for(const x of a.unknown)p.findings.push(finding(x.ruleId,'Unassessed configuration','Unknown',x.resource+' • '+x.field,x.reason));
    p.scope='Represented sections: '+a.scopedSections+'/7. Sections absent from JSON: '+(a.missingSections.join(', ')||'none')+'. Only explicitly supported properties are evaluated.';
    p.methodology='12 deterministic checks over a narrow user-supplied AWS JSON summary. Rechecking an absent property is not proof of remediation.';
    p.recommendations=['Verify observed configuration through approved AWS-native and organizational processes.','Preserve original before/after evidence and explain why each previously flagged check is resolved.','Determine whether omitted services or properties are outside the real assessment boundary.'];
    p.limitations.push('Not a live AWS scan, Terraform analysis, IAM simulation, or compliance assessment.');
  }else if(name==='path'){
    const data=window.BKAttackPathReport?.();
    if(!data)throw Error('Attack path model unavailable');
    p=common('AttackPath | Defensive Tabletop Brief','THREAT MODELING / GRAPH ANALYSIS');
    p.metrics=[metric('Protected targets',data.targets.length),metric('Targets reachable',data.analysis.reachedCount),metric('Modeled routes',data.analysis.totalPaths),metric('Safeguards enabled',data.weaknesses.filter(x=>!data.flags[x.id]).length)];
    p.findings=data.targets.map(id=>finding(id,(data.nodes.find(n=>n.id===id)||{}).name||id,data.analysis.reached.includes(id)?'Reachable':'Unreached','Direct graph search of fictional edge transitions','Review reachability assumptions and safeguard dependencies.'));
    p.findings.push(...data.priorities.slice(0,8).map(x=>finding(x.id,x.label,'Opportunity',x.pathsBlocked+' routes interrupted • '+x.targetsReduced+' targets newly unreachable',x.why)));
    p.methodology='Directed-graph traversal over an eight-node fictional topology. Priorities are counterfactual results of toggling one safeguard at a time.';
    p.limitations.push('Modeled path counts are not exploit probabilities or completeness guarantees.');
  }else if(name==='assurance'){
    const data=window.BKAssuranceReport?.();
    if(!data)throw Error('AssuranceFlow records unavailable');
    p=common('AssuranceFlow | Documentation Quality Brief','CONTROL IMPLEMENTATION / GRC');
    p.metrics=[metric('Records',data.summary.controls),metric('Quality heuristic',data.summary.score+'/100'),metric('Open review items',data.summary.withGaps),metric('Evidence referenced',data.summary.evidenceLinked)];
    p.findings=data.items.map(x=>finding(x.id,x.title,x.status+' • '+x.score+'/100','Owner: '+(x.owner||'unassigned')+' • '+x.evidence.join(', '),x.problems.join('; ')||'Review effectiveness separately.'));
    p.methodology='Demonstration scoring combines owner, narrative length, evidence reference, and self-reported status. Partial OSCAL import/export is not schema validation.';
    p.limitations.push('Documentation completion is not a control assessment, OSCAL conformance test, or authorization decision.');
  }else throw Error('Unknown lab');
  p.generated=new Date().toISOString();
  return p;
}
function downloadReport(name){
  const payload=engine.html(build(name));
  const blob=new Blob([payload],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=name+'-print-ready-report.html';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function addButton(area,name){
  if(!area)return;
  const button=document.createElement('button');
  button.type='button';button.className='btn ghost bk-print-report';button.textContent='▤ Executive report';
  button.title='Download a locally generated, printable report (HTML, use Print / Save as PDF)';
  button.setAttribute('aria-label','Download a print-ready report for '+name);
  button.addEventListener('click',()=>{
    try{downloadReport(name)}catch(err){
      const status=document.querySelector('#configMessage,#huntError,#controlSaveMessage,#toast');
      if(status)status.textContent='Unable to prepare report: '+err.message;
    }
  });
  area.prepend(button);
}
if(document.getElementById('panel-controls')){
  for(const name of ['controls','hunt','cloud','risk','config','path']){
    addButton(document.querySelector('#panel-'+name+' .pane-heading .buttonbar'),name);
  }
}else if(document.getElementById('exportReport')){
  addButton(document.getElementById('exportReport').parentElement,'assurance');
}
})();
