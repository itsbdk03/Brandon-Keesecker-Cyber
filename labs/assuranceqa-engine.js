/* AssuranceQA — deterministic, dependency-free documentation quality checks.
 * This tool checks completeness of synthetic sample records. It does not assess compliance.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  if(root) root.AssuranceQA=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SAMPLE=[
    {id:'AC-2',title:'Account Management',owner:'Identity Operations',boundary:'Corporate identity platform',status:'implemented',frequency:'Daily automated checks and quarterly reviews',evidence:['EX-IDENTITY-001','EX-REVIEW-002'],narrative:'Identity Operations uses a documented access-request workflow to approve, provision, review and revoke account access. A daily automation flags inactive accounts; the team reviews access quarterly and records exceptions in a restricted work queue.'},
    {id:'IA-2',title:'Identification and Authentication',owner:'Platform Security',boundary:'Cloud administrative console',status:'implemented',frequency:'',evidence:['EX-MFA-003'],narrative:'MFA is enabled for administrators.'},
    {id:'AU-2',title:'Event Logging',owner:'',boundary:'',status:'in-progress',frequency:'Weekly review',evidence:[],narrative:'The security team collects selected authentication and administrative events through a centralized logging service. Engineers check ingestion health weekly and investigate alerts according to the incident procedure.'},
    {id:'CM-6',title:'Configuration Settings',owner:'Cloud Platform',boundary:'Managed cloud hosts',status:'implemented',frequency:'Each release',evidence:['EX-BASELINE-004'],narrative:'Cloud Platform deploys reviewed baseline settings using version-controlled infrastructure templates. Changes receive peer approval before deployment; a release-time check compares approved settings with the proposed change.'},
    {id:'IR-4',title:'Incident Handling',owner:'Response Team',boundary:'Enterprise systems',status:'planned',frequency:'',evidence:[],narrative:'An incident handling process will be documented.'},
    {id:'CA-7',title:'Continuous Monitoring',owner:'Security Governance',boundary:'Authorized system',status:'in-progress',frequency:'Monthly',evidence:['EX-MONITOR-005'],narrative:'Security Governance consolidates monitoring exceptions through the tracking register and reviews open corrective actions monthly with system owners. The process escalates overdue remediation items using the governance review forum.'}
  ];
  const severities={high:18,medium:10,low:5};
  const clean=v=>typeof v==='string'?v.trim():'';
  const statuses=new Set(['implemented','in-progress','planned','not-applicable']);
  const safeRecord=(item,index)=>{
    if(!item || typeof item!=='object' || Array.isArray(item)) throw new Error('Record '+(index+1)+' must be an object.');
    const id=clean(item.id).toUpperCase();
    if(!/^[A-Z]{2}-\d{1,3}(?:\(\d{1,2}\))?$/.test(id)) throw new Error('Record '+(index+1)+' has an invalid control identifier.');
    const status=clean(item.status);
    if(!statuses.has(status)) throw new Error(id+' has an invalid status.');
    const evidence=Array.isArray(item.evidence)?item.evidence.map(clean).filter(Boolean):[];
    return {id,title:clean(item.title).slice(0,120),owner:clean(item.owner).slice(0,120),
      boundary:clean(item.boundary).slice(0,200),status,frequency:clean(item.frequency).slice(0,180),
      narrative:clean(item.narrative).slice(0,4000),evidence:evidence.slice(0,25).map(x=>x.slice(0,140))};
  };
  function normalize(input){
    if(!Array.isArray(input)||input.length<1||input.length>100) throw new Error('Provide an array of 1 to 100 fictional control records.');
    const results=input.map(safeRecord);
    if(new Set(results.map(x=>x.id)).size!==results.length) throw new Error('Control identifiers must be unique.');
    return results;
  }
  function review(item){
    const r=safeRecord(item,0),findings=[];
    const add=(code,severity,reason,next)=>findings.push({code,severity,reason,next});
    if(!r.owner) add('OWN-01','high','No accountable owner has been named.','Identify a fictional responsible role or team.');
    if(!r.boundary) add('SCOPE-01','medium','System or component boundary is missing.','Describe which example service or component implements the control.');
    if(!r.narrative) add('NARR-01','high','Implementation statement is missing.','Explain who performs the control, how it works, and what is retained.');
    else if(r.narrative.length<90) add('NARR-02','medium','Narrative is brief and may lack operational detail.','Add testable detail about process, mechanism and artifacts.');
    if(!r.frequency) add('CAD-01','medium','Review or operating cadence is unspecified.','Describe a meaningful operating or review frequency.');
    if(!r.evidence.length) add('EVID-01','high','No evidence references are mapped.','Link synthetic artifact IDs so a reviewer can trace the claim.');
    if(r.status==='implemented'&&!r.evidence.length) add('TRACE-01','medium','Implemented status has no linked demonstration evidence.','Align implementation status with documented supporting references.');
    if(r.status==='planned'&&r.narrative.length>150) add('STATE-01','low','Detailed narrative is present while status is planned.','Clarify whether the statement describes future intent or an existing process.');
    if(r.status==='not-applicable'&&!r.narrative) add('NA-01','medium','Not-applicable status lacks an explanatory rationale.','Document why the example control does not apply.');
    return {record:r,findings,score:Math.max(0,100-findings.reduce((sum,x)=>sum+severities[x.severity],0))};
  }
  function summarize(input){
    const reviews=normalize(input).map(review);
    return {reviews,total:reviews.length,findings:reviews.reduce((n,r)=>n+r.findings.length,0),
      mean:Math.round(reviews.reduce((n,r)=>n+r.score,0)/reviews.length),
      high:reviews.reduce((n,r)=>n+r.findings.filter(f=>f.severity==='high').length,0)};
  }
  function csv(input){
    const summary=summarize(input), esc=s=>'"'+String(s??'').replace(/"/g,'""').replace(/\r?\n/g,' ')+'"';
    const rows=[['Control','Title','Status','Owner','QA Score','Severity','Finding','Recommendation']];
    summary.reviews.forEach(r=>{
      if(!r.findings.length) rows.push([r.record.id,r.record.title,r.record.status,r.record.owner,r.score,'None','No heuristic gaps identified','Further human review required']);
      r.findings.forEach(f=>rows.push([r.record.id,r.record.title,r.record.status,r.record.owner,r.score,f.severity,f.reason,f.next]));
    });
    return rows.map(row=>row.map(esc).join(',')).join('\r\n');
  }
  function markdown(input){
    const summary=summarize(input),out=['# AssuranceQA — Fictional Documentation Review','', '> Educational heuristic report. Not an OSCAL schema validation, audit conclusion, or FedRAMP authorization determination.','', 'Reviewed controls: '+summary.total+' | Findings: '+summary.findings+' | Mean QA indicator: '+summary.mean+'/100', ''];
    summary.reviews.forEach(r=>{
      out.push('## '+r.record.id+' — '+r.record.title, 'Status: '+r.record.status+' | QA indicator: '+r.score+'/100', '');
      if(!r.findings.length) out.push('- No automated heuristic gaps detected; manual review still needed.');
      r.findings.forEach(f=>out.push('- **'+f.severity.toUpperCase()+' · '+f.code+':** '+f.reason+' **Next:** '+f.next));
      out.push('');
    });
    return out.join('\n');
  }
  return {SAMPLE,normalize,review,summarize,csv,markdown};
});