'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const model=require('../engineering-model.js');
test('only the seven established projects are documented',()=>{
 assert.equal(model.validate(),true);
 assert.deepEqual(model.keys,['controls','hunt','cloud','risk','config','path','assurance']);
});
test('all dossiers have four concrete pipeline stages',()=>{
 for(const key of model.keys){
   const e=model.get(key);
   assert.equal(e.stages.length,4,key);
   for(const stage of e.stages){assert.equal(stage.length,3);assert(stage.every(x=>x.length>10),key)}
 }
});
test('every dossier identifies a decision and at least two limits',()=>{
 for(const key of model.keys){
  const e=model.get(key);
  assert(e.question.endsWith('?'),key);
  assert(e.decisions.length>=2,key);
  assert(e.limits.length>=2,key);
  assert(e.verification.length>30,key);
 }
});
test('source and test links point at files that actually exist',()=>{
 for(const key of model.keys)for(const file of model.get(key).files){
  assert(fs.existsSync(path.join(root,file)),key+': missing '+file);
 }
});
test('every dossier routes to an actual technical note section',()=>{
 const html=fs.readFileSync(path.join(root,'labs/methodology.html'),'utf8');
 for(const key of model.keys)assert(html.includes('id="'+model.get(key).section+'"'),key);
});
test('the hub and standalone workbench load model before renderer',()=>{
 for(const name of ['labs/index.html','labs/assuranceflow.html']){
  const html=fs.readFileSync(path.join(root,name),'utf8');
  assert(html.indexOf('engineering-model.js')>=0,name);
  assert(html.indexOf('engineering-model.js')<html.indexOf('engineering-lens.js'),name);
  assert(html.includes('engineering-lens.css'),name);
 }
});
test('the full case-study page has seven jump links',()=>{
 const html=fs.readFileSync(path.join(root,'labs/methodology.html'),'utf8');
 for(const key of model.keys)assert(html.includes('href="#'+model.get(key).section+'"'),key);
});
test('no dossier claims official certification or live scanning',()=>{
 for(const key of model.keys){
  const e=model.get(key);const limits=e.limits.join(' ').toLowerCase();
  assert(/no |not |does not /.test(limits),key);
  assert(e.inputs.length>40,key);
 }
});
