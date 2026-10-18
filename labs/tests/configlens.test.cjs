// Regression tests for the actual ConfigLens rule engine used by the website.
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {scan,catalog}=require('../configlens-engine.js');
const sample=name=>JSON.parse(fs.readFileSync(path.join(__dirname,'../samples',name),'utf8'));
const codes=result=>result.results.map(f=>f.ruleId);
test('exposed sample reveals security issues in multiple layers',()=>{
  const r=scan(sample('configlens-exposed.json'));
  assert(r.results.length>=8);
  for(const id of ['AWS-001','AWS-002','AWS-004','AWS-005','AWS-007','AWS-008','AWS-009','AWS-010','AWS-011','AWS-012'])assert(codes(r).includes(id),`${id} missing`);
  assert.equal(r.passed,r.evaluations-r.results.length);
});
test('hardened sample passes all evaluated checks',()=>{
  const r=scan(sample('configlens-hardened.json'));
  assert.equal(r.results.length,0);
  assert(r.evaluations>10);
});
test('missing data is UNKNOWN rather than counted as a pass',()=>{
  const r=scan({account:{alias:'demo'},cloudTrail:{},s3Buckets:[{name:'example'}]});
  assert.equal(r.evaluations,0);assert.equal(r.passed,0);assert.equal(r.results.length,0);
});
test('malformed top-level input is rejected',()=>{
  for(const doc of [null,[],true,'s3'])assert.throws(()=>scan(doc),/top-level configuration/i);
});
test('unrestricted IAM allow is flagged but least-privilege statement is not',()=>{
  const fail=scan({iamPolicies:[{name:'a',statements:[{Effect:'Allow',Action:'*',Resource:'*'}]}]});
  assert(codes(fail).includes('AWS-004'));
  const pass=scan({iamPolicies:[{name:'b',statements:[{Effect:'Allow',Action:['s3:GetObject'],Resource:'arn:aws:s3:::bucket/*'}]}]});
  assert.equal(pass.results.length,0);
});
test('SSH or RDP exposed via IPv4 or IPv6 generates a finding',()=>{
  for(const [cidr,port] of [['0.0.0.0/0',22],['::/0',3389]]){
    const r=scan({securityGroups:[{id:'demo',ingress:[{cidr,fromPort:port,toPort:port}]}]});
    assert(codes(r).includes('AWS-005'));
  }
});
test('public HTTPS ingress alone does not match the SSH/RDP rule',()=>{
  const r=scan({securityGroups:[{id:'web',ingress:[{cidr:'0.0.0.0/0',fromPort:443,toPort:443}]}]});
  assert.equal(r.results.length,0);
});
test('missing root MFA, explicitly unencrypted resources and disabled trail are flagged',()=>{
  const r=scan({account:{rootMfa:false},s3Buckets:[{name:'a',encryption:{enabled:false}}],cloudTrail:{enabled:false},ebsVolumes:[{id:'v',encrypted:false}]});
  for(const id of ['AWS-003','AWS-006','AWS-011','AWS-012'])assert(codes(r).includes(id),id);
});
test('multiple resources produce independent findings and deterministic output',()=>{
  const d={rdsInstances:[{id:'a',publiclyAccessible:true},{id:'b',publiclyAccessible:true}]};
  const a=scan(d),b=scan(d);
  assert.equal(a.results.length,2);assert.deepEqual(a,b);
});
test('every finding links to a documented remediation and severity',()=>{
  const r=scan(sample('configlens-exposed.json'));
  for(const f of r.results){
    assert(catalog[f.ruleId]);assert(f.fix.length>12);assert(['Critical','High','Medium','Low'].includes(f.severity));
    assert(f.doc.startsWith('https://docs.aws.amazon.com/'));
  }
});
