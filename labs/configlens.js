'use strict';
(()=>{
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const download=(name,data,type)=>{let blob=new Blob([data],{type});let url=URL.createObjectURL(blob);let a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)};
  const exposed={
    account:{alias:'research-lab-sample',rootMfa:false},
    s3Buckets:[{name:'demo-public-assets',blockPublicAccess:false,enforceTLS:false,encryption:{enabled:true,type:'SSE-S3'}},{name:'audit-archive',blockPublicAccess:true,enforceTLS:true,encryption:{enabled:true,type:'SSE-KMS'}}],
    iamPolicies:[{name:'over-permissive-demo',statements:[{Effect:'Allow',Action:'*',Resource:'*'}]},{name:'reader-example',statements:[{Effect:'Allow',Action:['s3:GetObject'],Resource:'arn:aws:s3:::audit-archive/*'}]}],
    securityGroups:[{id:'sg-remote-admin',ingress:[{protocol:'tcp',fromPort:22,toPort:22,cidr:'0.0.0.0/0'},{protocol:'tcp',fromPort:443,toPort:443,cidr:'0.0.0.0/0'}]}],
    cloudTrail:{enabled:true,multiRegion:false,logFileValidation:false},
    rdsInstances:[{id:'orders-db-demo',publiclyAccessible:true,storageEncrypted:false}],
    ebsVolumes:[{id:'vol-test-001',encrypted:false},{id:'vol-audit-002',encrypted:true}]
  };
  const hardened=JSON.parse(JSON.stringify(exposed));
  hardened.account.rootMfa=true;
  hardened.s3Buckets[0].blockPublicAccess=true;hardened.s3Buckets[0].enforceTLS=true;
  hardened.iamPolicies[0].statements=[{Effect:'Allow',Action:['s3:GetObject'],Resource:'arn:aws:s3:::demo-public-assets/*'}];
  hardened.securityGroups[0].ingress=[{protocol:'tcp',fromPort:22,toPort:22,cidr:'10.20.0.0/16'},{protocol:'tcp',fromPort:443,toPort:443,cidr:'0.0.0.0/0'}];
  hardened.cloudTrail.multiRegion=true;hardened.cloudTrail.logFileValidation=true;
  hardened.rdsInstances[0].publiclyAccessible=false;hardened.rdsInstances[0].storageEncrypted=true;hardened.ebsVolumes[0].encrypted=true;
  const {scan,catalog}=window.ConfigLensEngine;
  let results=[],evaluations=0,resources=0,current=null,review=null;
  let baseline=JSON.parse(JSON.stringify(exposed)),baselineLabel='Exposed sample baseline';
  const pct=()=>evaluations?Math.max(0,Math.round(100*(evaluations-results.length)/evaluations)):0;
  function renderCoverage(){
    const summary=review?.after;
    if(!summary)return;
    $('#configUnknown').textContent=summary.unassessed;
    $('#configSectionMissing').textContent=summary.missingSections.length;
    $('#configScopeCount').textContent=summary.scopedSections+'/7 SECTIONS';
    const unknownList=$('#configUnknownList');unknownList.replaceChildren();
    const addRow=(target,kind,main,detail)=>{const row=document.createElement('div');row.className='config-review-item';const label=document.createElement('strong');label.textContent=kind+' · '+main;const sub=document.createElement('small');sub.textContent=detail;row.append(label,sub);target.append(row)};
    for(const c of summary.unknown.slice(0,6))addRow(unknownList,'UNASSESSED',c.ruleId+' · '+c.resource,c.field+' — '+c.reason);
    for(const name of summary.missingSections.slice(0,7))addRow(unknownList,'NOT IN SCOPE',name,'This configuration summary did not include this section. No pass/fail inference is possible.');
    if(!unknownList.children.length)addRow(unknownList,'COVERAGE','No field-level gaps in represented sections','Scope is still limited to the supported checks and JSON model.');
    $('#configBaselineName').textContent=baselineLabel;
    $('#configResolved').textContent=review.resolved.length;
    $('#configPersistent').textContent=review.persistent.length;
    $('#configUnverified').textContent=review.unverified.length;
    $('#configIntroduced').textContent=review.introduced.length;
    const delta=$('#configDeltaList');delta.replaceChildren();
    for(const [kind,arr] of [['RESOLVED',review.resolved],['PERSISTENT',review.persistent],['UNVERIFIED',review.unverified],['INTRODUCED',review.introduced]]){
      if(!arr.length)continue;
      for(const finding of arr.slice(0,5))addRow(delta,kind,finding.ruleId+' · '+finding.resource,kind==='UNVERIFIED'?'A previously flagged check is absent or incomplete in the current data—not verified as fixed.':finding.title);
    }
    if(!delta.children.length)addRow(delta,'NO CHANGE','No finding changes to report','Try the exposed and hardened samples, or capture a reviewed snapshot as your baseline.');
  }
  function render(){let score=pct();$('#configChecks').textContent=evaluations;$('#configFindings').textContent=results.length;$('#configHigh').textContent=results.filter(r=>['Critical','High'].includes(r.severity)).length;$('#configScore').textContent=evaluations?score+'%':'N/A';$('#configRingValue').textContent=evaluations?score+'%':'N/A';$('#configResources').textContent=resources+' RESOURCES';$('#configProgress').style.width=score+'%';$('#configRing').style.setProperty('--percent',score);$('#configRing').style.setProperty('--ring',score>=85?'#59ebd3':score>=60?'#e8a963':'#df7182');
    let cats=['Critical','High','Medium','Low'];$('#configBreakdown').innerHTML=cats.map(c=>`<div><span><span class="dot" style="background:${{Critical:'#ee6a83',High:'#e9ad66',Medium:'#71a4ff',Low:'#74b6bb'}[c]}"></span>${c}</span><strong>${results.filter(x=>x.severity===c).length}</strong></div>`).join('');
    let severity=$('#configSeverity').value,q=$('#configSearch').value.toLowerCase().trim();let filtered=results.filter(r=>(severity==='all'||r.severity===severity)&&[r.title,r.ruleId,r.resource,r.category,r.evidence].join(' ').toLowerCase().includes(q));$('#configFindingLabel').textContent=filtered.length+' / '+results.length+' FINDINGS';let list=$('#configFindingList');list.replaceChildren();if(!filtered.length){let div=document.createElement('div');div.className='config-none';div.innerHTML=results.length?'<strong>No matches for these filters</strong><p>Change severity or search to view other results.</p>':'<strong>No findings from evaluated checks ✓</strong><p>This does not establish a secure system. Unsupported, omitted, and inherited settings are not evaluated.</p>';list.append(div)}
    renderCoverage();
    for(const r of filtered){const div=document.createElement('article');div.className='config-finding config-'+r.severity.toLowerCase();const style=r.severity==='Critical'?'red':r.severity==='High'?'amber':'blue';div.innerHTML=`<div class="cfg-top"><span class="mono">${esc(r.ruleId)} · ${esc(r.category)}</span><span class="pill ${style}">${esc(r.severity)}</span></div><h4>${esc(r.title)}</h4><div class="cfg-resource">${esc(r.resource)}</div><p>${esc(r.fix)}</p><details><summary>View evidence, mapping &amp; guidance</summary><p class="note">Illustrative NIST concepts: ${esc(r.ref)} — not an authoritative control assessment mapping.</p><div class="cfg-evidence">${esc(r.evidence)}</div><span class="cfg-step"><strong>Analyst action:</strong> ${esc(r.fix)}</span><a href="${esc(r.doc)}" target="_blank" rel="noopener noreferrer">Read official AWS guidance ↗</a></details>`;list.append(div)}
  }
  function run(input){if(input.length>1000000)throw Error('JSON exceeds the 1 MB demonstration limit');let data=JSON.parse(input);let state=scan(data);({results,evaluations,resources}=state);current=data;review=window.ConfigLensEngine.compare(baseline,data);render();$('#configMessage').textContent=`Reviewed ${state.resources} resource entries, evaluated ${state.evaluations} checks and identified ${state.results.length} findings. All processing is local.`}
  function selectPreset(preset){if(preset==='custom'){return}let data=preset==='hardened'?hardened:exposed;$('#configInput').value=JSON.stringify(data,null,2);run($('#configInput').value)}
  $('#configCaptureBaseline').addEventListener('click',()=>{if(!current)return;baseline=JSON.parse(JSON.stringify(current));baselineLabel='Captured local snapshot';review=window.ConfigLensEngine.compare(baseline,current);render();$('#configMessage').textContent='Baseline captured from last completed review. Run a changed input to compare.'});
  $('#configBaselineReset').addEventListener('click',()=>{baseline=JSON.parse(JSON.stringify(exposed));baselineLabel='Exposed sample baseline';if(current){review=window.ConfigLensEngine.compare(baseline,current);render();}$('#configMessage').textContent='Comparison baseline restored to the fictional exposed sample.'});
  $('#configDeltaExport').addEventListener('click',()=>{if(!review)return;const lines=['# ConfigLens — Before / After Configuration Review','', 'Synthetic local JSON only. This is NOT a live AWS or compliance assessment.','', 'Baseline: '+baselineLabel,'', '## Counts', '- Previous findings: '+review.before.results.length,'- Current findings: '+review.after.results.length,'- Resolved by modeled re-evaluation: '+review.resolved.length,'- Persistent: '+review.persistent.length,'- Introduced: '+review.introduced.length,'- Not reverified: '+review.unverified.length,'- Current unassessed fields: '+review.after.unassessed,'- Omitted JSON sections: '+review.after.missingSections.join(', '),''];for(const [label,arr] of [['Resolved',review.resolved],['Persistent',review.persistent],['Introduced',review.introduced],['Not reverified',review.unverified]]){lines.push('## '+label);if(!arr.length)lines.push('None');for(const x of arr)lines.push('- '+x.ruleId+' · '+x.resource+' · '+x.title);lines.push('')}lines.push('## Analyst cautions','A finding disappearing because a check is missing or invalid is not proof of remediation. All outcomes remain illustrative.');download('configlens-change-analysis.md',lines.join('\n'),'text/markdown')});
  $('#configPreset').addEventListener('change',e=>selectPreset(e.target.value));
  $('#configInput').addEventListener('input',()=>{if($('#configPreset').value!=='custom')$('#configPreset').value='custom';$('#configMessage').textContent='Input changed. Select Run configuration review to update findings.'});
  $('#configScan').addEventListener('click',()=>{try{run($('#configInput').value)}catch(e){$('#configMessage').textContent='Unable to review input: '+e.message}});
  $('#configFile').addEventListener('change',async e=>{let file=e.target.files?.[0];if(!file)return;try{if(file.size>1000000)throw Error('File exceeds 1 MB');$('#configPreset').value='custom';$('#configInput').value=await file.text();run($('#configInput').value)}catch(err){$('#configMessage').textContent='File error: '+err.message}finally{e.target.value=''}});
  $('#configSearch').addEventListener('input',render);$('#configSeverity').addEventListener('change',render);
  $('#configCopy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#configInput').value);$('#configMessage').textContent='Copied displayed JSON to clipboard.'}catch{$('#configInput').select();$('#configMessage').textContent='Select the highlighted JSON and copy it.'}});
  $('#configSarif').addEventListener('click',()=>{let rules=Object.entries(catalog).map(([id,v])=>({id,name:v.title,shortDescription:{text:v.title},helpUri:v.doc,properties:{tags:['security','aws',v.category.toLowerCase()],securitySeverity:{Critical:'9.0',High:'7.0',Medium:'5.0',Low:'2.0'}[v.severity]}}));let sarif={version:'2.1.0',$schema:'https://json.schemastore.org/sarif-2.1.0.json',runs:[{tool:{driver:{name:'ConfigLens',version:'1.0.0',informationUri:'https://docs.aws.amazon.com/security/',rules}},results:results.map(r=>({ruleId:r.ruleId,level:{Critical:'error',High:'error',Medium:'warning',Low:'note'}[r.severity],message:{text:r.title+' — '+r.resource+'. '+r.evidence+' Recommendation: '+r.fix},locations:[{physicalLocation:{artifactLocation:{uri:'aws-snapshot.json'},region:{startLine:1}}}],properties:{resource:r.resource,severity:r.severity,evidence:r.evidence}}))}]};download('configlens-findings.sarif',JSON.stringify(sarif,null,2),'application/sarif+json')});
  $('#configReport').addEventListener('click',()=>{let lines=['# ConfigLens — AWS Sample Configuration Review',`Generated (UTC): ${new Date().toISOString()}`,'','## Boundaries','Local JSON summary analysis only. No AWS API calls, live environment evaluation, Terraform parsing, or official compliance determination.','',`Resources represented: ${resources}`,`Checks evaluated: ${evaluations}`,`Findings: ${results.length}`,`Pass rate (of evaluated checks): ${evaluations?pct()+'%':'not available'}`,'','## Findings'];for(let r of results)lines.push(`### ${r.ruleId}: ${r.title}`,`Severity: ${r.severity}`,`Resource: ${r.resource}`,`Observed: ${r.evidence}`,`Remediation: ${r.fix}`,`Illustrative concepts: ${r.ref}`,`Official AWS guidance: ${r.doc}`,'');lines.push('## Assessment coverage','Unassessed fields: '+(review?.after.unassessed??0),'Sections omitted from input: '+(review?.after.missingSections.join(', ')||'None'),'','## Remediation comparison','Baseline: '+baselineLabel,'Resolved with re-evaluation: '+(review?.resolved.length??0),'Persistent: '+(review?.persistent.length??0),'Introduced: '+(review?.introduced.length??0),'Not reverified: '+(review?.unverified.length??0),'');lines.push('## Limitations','Only explicitly represented JSON properties can be evaluated. Absent properties are unknown, not passing. Ratings are illustrative and require independent assessment.');download('configlens-review-report.md',lines.join('\n'),'text/markdown')});
  window.BKConfigLensReport=()=>({current,review,results:results.slice(),evaluations,resources,baselineLabel});
  selectPreset('exposed');
})();
