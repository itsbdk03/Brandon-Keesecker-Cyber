'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const e=require('../attackpath-engine.js');
const clone=o=>JSON.parse(JSON.stringify(o));
const exposed=()=>clone(e.scenarios.exposed.flags);

test('graph specifies unique node IDs and valid edge references',()=>{
  const ids=e.nodes.map(n=>n.id);
  assert.equal(new Set(ids).size,ids.length);
  for(const edge of e.edges){assert.ok(ids.includes(edge.from));assert.ok(ids.includes(edge.to));for(const flag of edge.requires)assert.ok(e.weaknesses.some(w=>w.id===flag));}
});
test('exposed scenario reaches all three protected assets',()=>{
  const a=e.analyze(exposed());
  assert.equal(a.reachedCount,3);
  assert.ok(a.totalPaths>=3);
  assert.deepEqual(a.reached.slice().sort(),[...e.targets].sort());
});
test('hardened scenario has no route to a protected target',()=>{
  const a=e.analyze(e.scenarios.hardened.flags);
  assert.equal(a.totalPaths,0);assert.equal(a.reachedCount,0);
});
test('identity-focused scenario retains some paths but removes web exploit progression',()=>{
  const a=e.analyze(e.scenarios.identity.flags);
  assert.ok(a.totalPaths>0);
  assert.ok(a.totalPaths<e.analyze(exposed()).totalPaths);
  assert.ok(a.paths.every(p=>!p.includes('web')));
});
test('strong MFA blocks only modeled privileged sign-in transition',()=>{
  const f=exposed();f.mfaNotEnforced=false;
  const a=e.analyze(f);
  assert.ok(!a.activeEdges.some(edge=>edge.from==='idp'&&edge.to==='admin'));
  assert.ok(a.paths.some(p=>p.includes('web')));
});
test('complete application hardening and credential revocation stop routes',()=>{
  const f=exposed();f.unpatchedApp=false;f.stolenCredentials=false;
  assert.equal(e.analyze(f).totalPaths,0);
});
test('network segmentation blocks modeled app-to-database route but not all paths',()=>{
  const f=exposed();f.lateralMovementOpen=false;
  const a=e.analyze(f);
  assert.ok(!a.paths.some(p=>p.includes('database')));
  assert.ok(a.totalPaths>0);
});
test('ranked actions reflect exact counterfactual differences',()=>{
  const flags=exposed();const before=e.analyze(flags);
  for(const p of e.prioritize(flags)){
    const after=e.analyze({...flags,[p.id]:false});
    assert.equal(p.pathsBlocked,before.totalPaths-after.totalPaths);
    assert.equal(p.targetsReduced,before.reachedCount-after.reachedCount);
  }
});
test('priorities empty when all safeguards applied',()=>{
  assert.deepEqual(e.prioritize(e.scenarios.hardened.flags),[]);
});
test('analysis is deterministic and does not mutate input flags',()=>{
  const flags=exposed(),before=clone(flags);
  assert.deepEqual(e.analyze(flags),e.analyze(flags));
  assert.deepEqual(flags,before);
});
test('invalid inputs are rejected and not counted as safe',()=>{
  assert.throws(()=>e.analyze(null),/Expected an object/);
  assert.throws(()=>e.analyze({}),/boolean/);
  assert.throws(()=>e.analyze({...exposed(),unpatchedApp:'false'}),/boolean/);
});

test('asset inspection explains route membership and graph dependencies',()=>{
  const d=e.inspectNode('database',exposed());
  assert.equal(d.id,'database');assert.equal(d.target,true);
  assert(d.routeCount>0);assert(d.incoming.length>0);
  assert(d.incoming.some(x=>x.from==='workload'&&x.active));
  assert(d.sampledRoutes.every(p=>p.includes('database')));
});
test('asset inspector does not confuse applying safeguards with deleting edges',()=>{
  const before=e.inspectNode('database',exposed());
  const after=e.inspectNode('database',e.scenarios.hardened.flags);
  assert.equal(after.routeCount,0);assert.equal(after.onTargetRoute,false);
  assert.equal(after.incoming.length,before.incoming.length);
  assert(after.incoming.some(x=>!x.active&&x.guards.some(g=>g.applied)));
});
test('every modeled asset is available for inspection',()=>{
  for(const node of e.nodes){const state=e.inspectNode(node.id,exposed());assert.equal(state.id,node.id);assert.equal(state.name,node.name)}
});
test('inspecting assets does not mutate their input safeguard flags',()=>{
  const flags=exposed(),original=JSON.stringify(flags);
  e.inspectNode('backup',flags);
  assert.equal(JSON.stringify(flags),original);
  assert.throws(()=>e.inspectNode('unknown',flags),/Unknown modeled asset/);
});
