'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../model.js');
test('starter casebook contains seven explicitly fictional scenarios',()=>{
 const d=M.sample();assert.equal(d.incidents.length,7);assert.equal(d.workspaces.length,1);assert.equal(d.members.length,3);
 assert(d.incidents.every(x=>x.id.startsWith('demo-')&&x.workspace_id==='demo-workspace'));
});
test('case priorities sort critical then high then medium then low',()=>{
 const d=M.sample();const rows=M.filter(d.incidents);assert.deepEqual(rows.map(x=>x.severity).slice(0,1),['critical']);assert.equal(rows.at(-1).severity,'low');
});
test('case filtering uses query, status and severity simultaneously',()=>{
 const d=M.sample();assert.equal(M.filter(d.incidents,{severity:'critical'}).length,1);assert.equal(M.filter(d.incidents,{status:'resolved'}).length,2);
 assert.equal(M.filter(d.incidents,{query:'storage',severity:'high'}).length,1);
 assert.equal(M.filter(d.incidents,{query:'storage',severity:'low'}).length,0);
});
test('overview counts only unresolved critical cases as outstanding',()=>{
 const m=M.overview(M.sample().incidents);assert.equal(m.total,7);assert.equal(m.critical,1);assert.equal(m.resolved,2);assert.equal(m.open,5);
});
test('input validation constrains title and severity',()=>{
 assert.throws(()=>M.validate({title:'a',severity:'low',status:'new'}),/Title/);
 assert.throws(()=>M.validate({title:'Valid',severity:'maximum',status:'new'}),/severity/);
 assert.throws(()=>M.validate({title:'Valid',severity:'high',status:'ignored'}),/status/);
});
test('input validation enforces description bound',()=>{
 assert.throws(()=>M.validate({title:'Valid',description:'x'.repeat(10001),severity:'low',status:'new'}),/Description/);
});
test('new incident is editable and adds immutable-style event history in demo',()=>{
 const d=M.sample();const record=M.create(d,{title:'Test alert',description:'synthetic',severity:'low',status:'new'});
 assert.equal(d.incidents.length,8);assert(d.events.some(x=>x.incident_id===record.id&&x.event_type==='created'));
 const updated=M.update(d,record.id,{title:'Revised alert',description:'synthetic',severity:'high',status:'investigating'});
 assert.equal(updated.severity,'high');assert(d.events.some(x=>x.incident_id===record.id&&x.event_type==='updated'));
});
test('updating an absent incident does not create it',()=>{
 assert.throws(()=>M.update(M.sample(),'invalid',{title:'Valid name',severity:'low',status:'new'}),/not found/);
});
test('analyst notes are scoped to existing incident and length-validated',()=>{
 const d=M.sample(),incident=d.incidents[0];
 assert.throws(()=>M.comment(d,'absent','text'),/not found/);
 assert.throws(()=>M.comment(d,incident.id,''),/Note/);
 const n=M.comment(d,incident.id,'Observed synthetic indicator');assert.equal(n.incident_id,incident.id);
 assert(d.events.some(x=>x.event_type==='commented'&&x.incident_id===incident.id));
});
test('file validation enforces MIME, size and extension',()=>{
 assert(M.validateFile({name:'sample.txt',size:120,type:'text/plain'}));
 for(const f of [{name:'payload.exe',size:110,type:'application/octet-stream'},{name:'test.txt',size:0,type:'text/plain'},{name:'huge.pdf',size:7000000,type:'application/pdf'},{name:'photo.exe',size:100,type:'image/png'}])assert.throws(()=>M.validateFile(f),/supported/);
});
test('demo evidence records contain metadata only, not uploaded bytes',()=>{
 const d=M.sample(),i=d.incidents[0].id;
 const f=M.attach(d,i,{name:'sample.txt',size:10,type:'text/plain'});
 assert.equal(f.demo_only,true);assert.equal(d.evidence.length,1);assert(!JSON.stringify(f).includes('base64'));
});
test('report includes provenance and clear validation limits',()=>{
 const d=M.sample(),incident=d.incidents[0],out=M.report(incident,d.comments,d.events,d.evidence);
 assert.match(out,/IncidentDesk/);assert.match(out,/Synthetic/);assert.match(out,/not an independent SOC assessment/);
 assert.match(out,/Audit trail/);
});
test('filtering is nonmutating',()=>{
 const d=M.sample(),copy=JSON.stringify(d.incidents);M.filter(d.incidents,{query:'risk'});assert.equal(JSON.stringify(d.incidents),copy);
});
