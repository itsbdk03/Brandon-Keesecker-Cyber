'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),m=require('../exercise-model.js');
test('the seven projects each have a bounded, usable walkthrough',()=>{
 assert.equal(m.verifyDefinition(),true);
 assert.deepEqual(m.keys,['controls','hunt','cloud','risk','config','path','assurance']);
 for(const key of m.keys){const d=m.missions[key];assert.equal(d.steps.length,3);assert(d.why.length>35);assert(d.verified.length>25)}
});
test('unknown projects and invalid state are rejected',()=>{
 assert.throws(()=>m.evaluate('new-lab',{}),/Unknown/);
 assert.throws(()=>m.evaluate('hunt',null),/snapshot/);
});
test('ControlTrace must select an actual gap while gap filtering',()=>{
 const items=[{id:'CM-06',status:'gap'},{id:'AC-02',status:'ready'}];
 assert.equal(m.evaluate('controls',{filter:'all',selected:'CM-06',records:items}).complete,false);
 assert.equal(m.evaluate('controls',{filter:'gap',selected:'AC-02',records:items}).complete,false);
 assert.equal(m.evaluate('controls',{filter:'gap',selected:'CM-06',records:items}).complete,true);
});
test('SignalHunt requires BOTH a finding and correlated timeline',()=>{
 assert.equal(m.evaluate('hunt',{findings:4,chains:0}).complete,false);
 assert.equal(m.evaluate('hunt',{findings:0,chains:1}).complete,false);
 assert.equal(m.evaluate('hunt',{findings:4,chains:2}).complete,true);
});
test('CloudGuard does not pass unless all six safeguards are enabled',()=>{
 assert.equal(m.evaluate('cloud',{safeguards:[true,true,true,true,true]}).complete,false);
 assert.equal(m.evaluate('cloud',{safeguards:[true,true,true,true,false,true]}).complete,false);
 assert.equal(m.evaluate('cloud',{safeguards:Array(6).fill(true)}).complete,true);
});
test('RiskMatrix needs a populated and actively filtered cell',()=>{
 assert.equal(m.evaluate('risk',{filtered:false,shown:2}).complete,false);
 assert.equal(m.evaluate('risk',{filtered:true,shown:0}).complete,false);
 assert.equal(m.evaluate('risk',{filtered:true,shown:1}).complete,true);
});
test('ConfigLens requires a genuine sample comparison, not absent evidence',()=>{
 assert.equal(m.evaluate('config',{preset:'custom',findings:0,resolved:10}).complete,false);
 assert.equal(m.evaluate('config',{preset:'hardened',findings:0,resolved:0}).complete,false);
 assert.equal(m.evaluate('config',{preset:'hardened',findings:1,resolved:10}).complete,false);
 assert.equal(m.evaluate('config',{preset:'hardened',findings:0,resolved:10}).complete,true);
});
test('AttackPath must have initialized before reachability can pass',()=>{
 assert.equal(m.evaluate('path',{ready:false,reachable:0,routes:0}).complete,false);
 assert.equal(m.evaluate('path',{ready:true,reachable:0,routes:2}).complete,false);
 assert.equal(m.evaluate('path',{ready:true,reachable:1,routes:0}).complete,false);
 assert.equal(m.evaluate('path',{ready:true,reachable:0,routes:0}).complete,true);
});
test('AssuranceFlow requires actual RA-5 status and no rubric problems',()=>{
 const data=[{id:'RA-5',status:'gap',score:55,problems:['No narrative']},{id:'AC-2',status:'implemented',problems:[]}];
 assert.equal(m.evaluate('assurance',{items:data}).complete,false);
 assert.equal(m.evaluate('assurance',{items:[{id:'RA-5',status:'implemented',problems:['Missing evidence']}]}).complete,false);
 assert.equal(m.evaluate('assurance',{items:[{id:'RA-5',status:'implemented',score:100,problems:[]}]}).complete,true);
});
test('evaluation neither mutates provided objects nor emits a credential claim',()=>{
 const snapshot={preset:'hardened',findings:0,resolved:9};
 const previous=JSON.stringify(snapshot),result=m.evaluate('config',snapshot);
 assert.equal(JSON.stringify(snapshot),previous);
 assert.equal(result.complete,true);
 assert(!/certified|authorized|compliant/i.test(result.evidence));
 assert(Object.isFrozen(result));
});
