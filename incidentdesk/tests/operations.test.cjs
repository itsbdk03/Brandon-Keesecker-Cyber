'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const O=require('../operations.js');
test('uses a fixed page size and exact nonoverlapping database page boundaries',()=>{
 assert.deepEqual(O.pageRange(0),{from:0,to:24});
 assert.deepEqual(O.pageRange(1),{from:25,to:49});
 assert.throws(()=>O.pageRange(-1));
});
test('normalizes searchable strings without letting percent or underscore become wildcard',()=>{
 assert.equal(O.escapeLike('ab%_cd'),'ab\\%\\_cd');
 assert.equal(O.escapeLike(' search '),'search');
});
test('prevents invalid incident status transitions',()=>{
 assert(O.canTransition('new','triage'));
 assert(O.canTransition('contained','resolved'));
 assert(!O.canTransition('resolved','new'));
 assert(!O.canTransition('new','unknown'));
});
test('overdue detection does not flag contained or resolved incidents',()=>{
 const now=Date.parse('2026-10-18T19:00:00Z');
 assert.equal(O.deadline({due_at:'2026-10-18T18:00:00Z',status:'new'},now).overdue,true);
 assert.equal(O.deadline({due_at:'2026-10-18T18:00:00Z',status:'contained'},now).overdue,false);
 assert.equal(O.deadline({due_at:null,status:'new'},now).visible,false);
});
test('normalizes invitation email and rejects invalid recipients',()=>{
 assert.equal(O.validateEmail(' Test@EXAMPLE.org '),'test@example.org');
 assert.throws(()=>O.validateEmail('user with space@example.com'));
});
test('Realtime status messages are constrained to expected states',()=>{
 assert.equal(O.eventLabel('SUBSCRIBED'),'SUBSCRIBED');
 assert.equal(O.eventLabel('PANIC'),'CONNECTING');
});
test('digest hex encoding is 64 lowercase characters for SHA-256',()=>{
 assert.equal(O.hex(new Uint8Array([0,255,16])),'00ff10');
});
test('hash and verification fail closed when browser crypto is unavailable',async()=>{
 await assert.rejects(()=>O.hash({arrayBuffer:async()=>new ArrayBuffer(1)}),/Secure browser/);
 assert.equal(await O.verify({arrayBuffer:async()=>new ArrayBuffer(1)},'invalid'),false);
});
