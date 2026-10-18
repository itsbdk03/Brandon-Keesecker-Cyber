// SignalHunt portable temporal correlation unit tests.
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {correlate}=require('../signalhunt-correlation.js');
const e=(min,type,status,user='alex',ip='192.0.2.1',extra={})=>({timestamp:new Date(Date.UTC(2026,9,1,12,min)).toISOString(),type,status,user,ip,...extra});
test('same user and source IP failure burst produces correlation',()=>{
  const d=[e(0,'auth','failure'),e(1,'auth','failure'),e(2,'auth','failure'),e(3,'auth','success')];
  const x=correlate(d);assert.equal(x.length,1);assert.equal(x[0].failureCount,3);assert.equal(x[0].sourceIp,'192.0.2.1');
});
test('cross-IP successes do not create a chain',()=>{
  const d=[e(0,'auth','failure'),e(1,'auth','failure'),e(2,'auth','failure'),e(3,'auth','success','alex','192.0.2.2')];
  assert.equal(correlate(d).length,0);
});
test('cross-user successes do not create a chain',()=>{
  const d=[e(0,'auth','failure'),e(1,'auth','failure'),e(2,'auth','failure'),e(3,'auth','success','jordan')];
  assert.equal(correlate(d).length,0);
});
test('auth failures outside ten minutes do not correlate',()=>{
  const d=[e(0,'auth','failure'),e(1,'auth','failure'),e(2,'auth','failure'),e(20,'auth','success')];
  assert.equal(correlate(d).length,0);
});
test('later successes are analyzed even when an earlier success lacks enough failures',()=>{
  const d=[e(0,'auth','failure'),e(1,'auth','success'),e(2,'auth','failure'),e(3,'auth','failure'),e(4,'auth','success')];
  const a=correlate(d);assert.equal(a.length,1);assert.match(a[0].successTime,/12:04/);
});
test('post-login telemetry adds contextual, not definitive, observations',()=>{
  const d=[e(0,'auth','failure'),e(1,'auth','failure'),e(2,'auth','failure'),e(3,'auth','success'),
    e(4,'process','started','alex','10.0.0.2',{process:'powershell.exe'}),
    e(5,'network','allowed','alex','10.0.0.2',{destination:'203.0.113.44'})];
  const a=correlate(d,['203.0.113.44']);
  assert.equal(a[0].steps.length,4);assert.match(a[0].confidence,/unverified/);
});
test('unrelated identity does not enrich correlation',()=>{
  const d=[e(0,'auth','failure'),e(1,'auth','failure'),e(2,'auth','failure'),e(3,'auth','success'),
    e(4,'process','started','other','10.0.0.3',{process:'powershell.exe'})];
  assert.equal(correlate(d).at(0).steps.length,2);
});
test('unparseable timestamps are dropped and input is not mutated',()=>{
  const d=[{timestamp:'nonsense',type:'auth',user:'alex',ip:'192.0.2.1',status:'success'},e(1,'auth','failure')];
  const original=JSON.stringify(d);assert.deepEqual(correlate(d),[]);assert.equal(JSON.stringify(d),original);
});
test('invalid event collections rejected',()=>assert.throws(()=>correlate(null),/array/));
