'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const reports=require('../report-engine.js');
const input=()=>({title:'ConfigLens sample',area:'Cloud review',
  metrics:[{label:'Findings',value:'2',note:'sample only'}],
  findings:[{id:'AWS-005',finding:'Open SSH',status:'Critical',evidence:'203.0.113.1/32',action:'Limit ingress'}],
  recommendations:['Validate through authorized read-only AWS tooling'],
  limitations:['Partial JSON summary only'],
  methodology:'Pure deterministic example evaluation',
  generated:'2026-10-18T20:00:00.000Z'});
test('builds standalone print-ready HTML',()=>{
 const s=reports.html(input());
 assert.match(s,/<!doctype html>/);
 assert.match(s,/ConfigLens sample/);
 assert.match(s,/AWS-005/);
 assert.match(s,/Print \/ Save as PDF/);
 assert.match(s,/@media print/);
 assert.match(s,/2026-10-18T20:00:00.000Z/);
});
test('escaped user text never becomes a tag or attribute',()=>{
 const m=input();m.title='<img src=x onerror=alert(1)> ';m.findings[0].evidence='</td><script>alert(1)</script><td>';
 const s=reports.html(m);
 assert(!s.includes('<script>alert(1)</script>'));
 assert(!s.includes('<img src=x'));
 assert(s.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
 assert(s.includes('&lt;img src=x onerror=alert(1)&gt;'));
});
test('works with no findings but retains limitations',()=>{
 const m=input();m.findings=[];
 const s=reports.html(m);
 assert.match(s,/No findings or review records/);
 assert.match(s,/Partial JSON summary/);
});
test('keeps report generation separate from supplied model',()=>{
 const m=input(),snapshot=JSON.stringify(m);
 reports.html(m);reports.markdown(m);
 assert.equal(JSON.stringify(m),snapshot);
});
test('required fields are validated',()=>{
 assert.throws(()=>reports.html({title:'missing',metrics:[],findings:[]}),/missing/i);
 assert.throws(()=>reports.html(null),/title/i);
});
test('large arrays are bounded in public report output',()=>{
 const m=input();m.findings=Array.from({length:370},(_,i)=>({...m.findings[0],id:'ITEM-'+i}));
 const n=reports.normalize(m);
 assert.equal(n.findings.length,300);
 assert(!reports.html(m).includes('ITEM-369'));
});
test('common documentation fields and escape work for unicode',()=>{
 assert.equal(reports.escape('A & B < C "ok"'),'A &amp; B &lt; C &quot;ok&quot;');
 const m=input();m.subtitle='MFA • least privilege';assert.match(reports.html(m),/MFA • least privilege/);
});
test('Markdown output retains useful evidence and guardrail',()=>{
 const s=reports.markdown(input());
 assert.match(s,/AWS-005/);assert.match(s,/not an official assessment/);
 assert.match(s,/Limitations/);
});
