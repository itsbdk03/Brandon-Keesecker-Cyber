'use strict';
(()=>{
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const download=(name,data,type='text/markdown')=>{const blob=new Blob([data],{type});let url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)};
  const now=()=>new Date().toISOString();
  const source=()=>window.BKLabData;
  const heading=(title,sub)=>`<div class="v6-insight-header"><span class="mono">ANALYST INSIGHTS // EXPLAINABLE</span><h3>${esc(title)}</h3><p>${esc(sub)}</p></div>`;
  const panel=(title,body,accent='')=>`<article class="v6-insight ${accent}"><strong>${esc(title)}</strong><p>${esc(body)}</p></article>`;
  function controlInsights(){const data=source();if(!data)return;const rows=data.controls();let incomplete=rows.filter(r=>!r.evidence.trim()||!r.narrative.trim());let unresolved=rows.filter(r=>r.status!=='ready');let suspicious=rows.filter(r=>r.status==='ready'&&(!r.evidence.trim()||!r.narrative.trim()));let suggested=unresolved.slice().sort((a,b)=>(a.status==='gap'?-1:1)-(b.status==='gap'?-1:1)).slice(0,3);
    $('#controlInsights').innerHTML=heading('Evidence-quality review','Beyond status counts: focus on traceability, documentation completeness, and the next steps that make an assessor’s work easier.')+`<div class="v6-insight-grid">${panel('Documentation coverage',`${rows.length-incomplete.length}/${rows.length} example controls have both a narrative and evidence reference.`)}${panel('Remediation queue',`${unresolved.length} controls remain in progress or have open gaps.`,'warn')}${panel('Readiness cross-check',suspicious.length?`${suspicious.length} item(s) are marked ready but have missing implementation text or evidence.`:'No sample records are marked ready without supporting narrative/evidence.','good')}</div>`+`<div class="v6-next"><strong>Suggested next actions</strong>${suggested.length?'<ol>'+suggested.map(c=>`<li><span class="mono">${esc(c.id)}</span> ${esc(c.name)} — ${esc(c.note||'Validate evidence, ownership and assessment scope.')}</li>`).join('')+'</ol>':'<p>Sample records show no outstanding statuses; independently test control effectiveness before an assessment.</p>'}</div>`;
  }
  function correlate(){
    const data=source();if(!data)return;
    const watch=$('#huntWatch').value.split(',').map(x=>x.trim()).filter(Boolean);
    const chains=window.SignalHuntCorrelation.correlate(data.events(),watch,{limit:5});
    const box=$('#huntCorrelation');if(!box)return;
    box.innerHTML=heading('Correlated activity sequences','Initial authentication requires matching identity and source IP within ten minutes. Select a timeline event to inspect its context and verification needs.');
    if(!chains.length){const empty=document.createElement('div');empty.className='v6-insight';empty.textContent='No authentication chain met the same-source, three-failure rule. Individual findings may still merit review.';box.append(empty);return;}
    for(const c of chains){
      const article=document.createElement('article');article.className='v6-timeline-card';
      const top=document.createElement('div');top.className='v6-timeline-title';
      const label=document.createElement('strong');label.textContent='Identity: '+c.user+' · Auth source: '+c.sourceIp;
      const pill=document.createElement('span');pill.className='pill '+(c.steps.length>=4?'red':'amber');pill.textContent=c.confidence;top.append(label,pill);
      const timeline=document.createElement('div');timeline.className='v6-timeline';timeline.setAttribute('role','group');timeline.setAttribute('aria-label','Investigate correlated sequence stages');
      const inspector=document.createElement('div');inspector.className='v6-timeline-inspector';inspector.setAttribute('aria-live','polite');
      const buttons=[];
      const inspectStep=index=>{
        const step=c.steps[index];
        buttons.forEach((btn,i)=>btn.setAttribute('aria-pressed',String(i===index)));
        inspector.replaceChildren();
        const marker=document.createElement('span');marker.className='v6-timeline-kicker';marker.textContent='SELECTED OBSERVATION '+(index+1)+' / '+c.steps.length;
        const name=document.createElement('h4');name.textContent=step.label;
        const when=document.createElement('p');when.textContent='Observed: '+step.time.replace('T',' ').slice(0,19)+'Z · '+step.tip;
        const caution=document.createElement('p');caution.className='v6-timeline-caution';
        caution.textContent=index<2?'Confirm identity, source IP ownership, event order and the actual sign-in trail before attributing an attack.':'This later observation shares an identity and time window only; verify process lineage, endpoint and network provenance independently.';
        inspector.append(marker,name,when,caution);
      };
      c.steps.forEach((step,i)=>{
        const row=document.createElement('button');row.type='button';row.className='v6-timeline-step';row.setAttribute('aria-pressed',String(i===0));
        const n=document.createElement('span');n.className='v6-timeline-dot';n.textContent=i+1;
        const title=document.createElement('strong');title.textContent=step.label;
        const detail=document.createElement('small');detail.textContent=step.time.replace('T',' ').slice(0,19)+'Z · '+step.tip;
        row.append(n,title,detail);
        row.addEventListener('click',()=>inspectStep(i));
        row.addEventListener('keydown',event=>{if(!['ArrowRight','ArrowLeft'].includes(event.key))return;event.preventDefault();const next=(i+(event.key==='ArrowRight'?1:-1)+c.steps.length)%c.steps.length;buttons[next].focus();inspectStep(next)});
        timeline.append(row);buttons.push(row);
      });
      const tip=document.createElement('p');tip.className='note';tip.textContent='Timeline links are analyst leads: validate raw timestamps, device evidence and account provenance before drawing conclusions.';
      article.append(top,timeline,inspector,tip);inspectStep(0);box.append(article);
    }
  }
  function cloudInsights(){let d=source();if(!d)return;let state=d.cloud(),items=d.cloudControls();let pending=items.filter(c=>!state[c.id]);let points=items.filter(c=>state[c.id]).reduce((s,c)=>s+c.weight,0);let el=$('#cloudInsights');el.innerHTML=heading('Defense-in-depth review','A lightweight gap summary for explaining architectural tradeoffs—not a validated estimate of risk reduction.')+`<div class="v6-insight-grid">${panel('Illustrative improvement',`${points} model points below the original unprotected example.`,'good')}${panel('Open safeguards',`${pending.length} of ${items.length} measures remain disabled.`,'warn')}${panel('Next verification','Collect configuration evidence, confirm ownership, and test whether enabled safeguards work as intended.')}</div>`;
  }
  function riskInsights(){let d=source();if(!d)return;let rows=d.risks(),res=r=>Math.round(r.l*r.i*(1-.15*r.m));let ordered=rows.slice().sort((a,b)=>res(b)-res(a)).slice(0,4);let box=$('#riskInsights');if(!box){box=document.createElement('div');box.id='riskInsights';box.className='v6-insights';$('#panel-risk').appendChild(box)}box.innerHTML=heading('Treatment priorities','Risk scores are a starting point for decisions. Owners should evaluate exposure, compensating safeguards, acceptance authority and deadlines.')+`<div class="v6-insight-grid">${ordered.length?ordered.map((r,i)=>panel(`#${i+1} · ${r.name}`,`${r.owner} · inherent ${r.l*r.i}/25 · residual ${res(r)}/25 · mitigation maturity ${r.m}/5`,i===0?'warn':'' )).join(''):panel('No active risks','Add a fictional scenario to populate this prioritization queue.')}</div>`;
  }
  $('#controlBrief').addEventListener('click',()=>{let rows=source().controls(),lines=['# ControlTrace — Sample Audit Brief',`Generated (UTC): ${now()}`,'','Educational, fictional demonstration. Not a FedRAMP/DoD attestation.','',`Program focus label: ${$('#controlBaseline').value}`,'','## Executive summary',`Controls tracked: ${rows.length}`,`Evidence ready: ${rows.filter(x=>x.status==='ready').length}`,`Open gaps: ${rows.filter(x=>x.status==='gap').length}`,'','## Control detail',...rows.flatMap(c=>[`### ${c.id} — ${c.name}`,`Owner: ${c.owner}`,`Status: ${c.status}`,`Implementation: ${c.narrative}`,`Evidence: ${c.evidence}`,`Remediation: ${c.note}`,'']),'## Assessment caveat','These fictional samples require actual control testing, scope validation, and authoritative requirements before real use.'];download('controltrace-audit-brief.md',lines.join('\n'))});
  $('#huntBrief').addEventListener('click',()=>{let d=source(),findings=d.findings(),events=d.events(),lines=['# SignalHunt — Analyst Case Narrative',`Generated (UTC): ${now()}`,'','## Scope',`${events.length} events analyzed with browser-local heuristics.`,`${findings.length} findings generated. Validate independently before triage decisions.`,'','## Findings',...findings.flatMap((f,i)=>[`### ${i+1}. ${f.rule} (${f.severity})`,`Time: ${f.timestamp}`,`Technique / category: ${f.technique}`,`User: ${f.user}; IP: ${f.ip}`,`Evidence: ${f.detail}`,'Recommended verification: correlate identities, time windows, endpoint context, network records, and authentication factors.','']),'## Limitations','Rules are simplified and may produce false positives or miss malicious activity; no live threat intelligence lookups occur.'];download('signalhunt-case-narrative.md',lines.join('\n'))});
  $('#cloudBrief').addEventListener('click',()=>{let d=source(),st=d.cloud(),items=d.cloudControls(),lines=['# CloudGuard — Architecture Review',`Generated (UTC): ${now()}`,'','Model only; not a validated risk score, FedRAMP authorization, or DoD IL assessment.',`Scenario: ${$('#cloudScenario').value}`,'','## Enabled safeguards',...items.filter(x=>st[x.id]).map(x=>`- ${x.name}: ${x.description}`),'','## Open exposures',...items.filter(x=>!st[x.id]).map(x=>`- ${x.name}: ${x.description}`),'','## Recommended next steps','Verify actual configuration settings, inherited responsibilities, logs, encryption key ownership, and assessment boundary evidence.'];download('cloudguard-architecture-review.md',lines.join('\n'))});
  $('#riskBrief').addEventListener('click',()=>{let d=source(),rows=d.risks(),res=r=>Math.round(r.l*r.i*(1-.15*r.m)),lines=['# RiskMatrix — Example Risk Committee Memo',`Generated (UTC): ${now()}`,'','Scores are illustrative, not NIST-prescribed.','',`Risks assessed: ${rows.length}`,`High or critical residual: ${rows.filter(r=>res(r)>=10).length}`,'','## Ranked risk treatment queue',...rows.sort((a,b)=>res(b)-res(a)).flatMap((r,i)=>[`### ${i+1}. ${r.name}`,`ID: ${r.id}; owner: ${r.owner}`,`Inherent: ${r.l*r.i}/25; residual: ${res(r)}/25; maturity: ${r.m}/5`,'Follow-up: validate compensating controls, treatment ownership, due date, and risk acceptance authority.','']),'## Decision caveat','This sample prioritization is not a substitute for a formal organizational risk methodology.'];download('riskmatrix-treatment-memo.md',lines.join('\n'))});
  document.addEventListener('input',e=>{if(e.target.closest('#riskTable'))riskInsights()});
  window.addEventListener('bklab:controls',controlInsights);window.addEventListener('bklab:hunt',correlate);window.addEventListener('bklab:cloud',cloudInsights);window.addEventListener('bklab:risk',riskInsights);
  controlInsights();correlate();cloudInsights();riskInsights();
})();
