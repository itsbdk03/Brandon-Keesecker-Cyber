'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const model=require('../command-model.js');
test('command navigator refers to only the existing seven tools',()=>{
 assert.equal(model.validate(),true);
 assert.deepEqual(model.projects.map(p=>p.id),['controls','hunt','cloud','risk','config','path','assurance']);
});
test('unfiltered command menu shows all seven labs',()=>{
 assert.equal(model.search('', 'hunt').projects.length,7);
 assert.equal(model.search('', 'hunt').actions.length,5);
});
test('finding a project works by name and framework keyword',()=>{
 assert.equal(model.search('attackpath','path').projects[0].id,'path');
 assert(model.search('FedRAMP','hunt').projects.some(p=>p.id==='controls'));
 assert(model.search('OSCAL','controls').projects.some(p=>p.id==='assurance'));
});
test('search is case-insensitive and whitespace normalized',()=>{
 assert.equal(model.search('  DETECTION  ', 'controls').projects[0].id,'hunt');
 assert.equal(model.search('  cloud   ', 'controls').projects.length>=2,true);
});
test('search requires all tokens rather than broadening the result',()=>{
 assert.deepEqual(model.search('impossible keywordnotfound','path').projects,[]);
 assert.equal(model.search('AWS JSON','path').projects[0].id,'config');
});
test('scope-specific actions are not offered for invalid current selection',()=>{
 assert.equal(model.search('export','invalid').actions.length,0);
 assert.equal(model.search('export','controls').actions[0].id,'report');
});
test('project URLs use an actual existing route and respect current host context',()=>{
 assert.equal(model.urlFor('risk','hub'),'#risk');
 assert.equal(model.urlFor('risk','assurance'),'index.html#risk');
 assert.equal(model.urlFor('assurance','hub'),'assuranceflow.html');
 assert.throws(()=>model.urlFor('unknown'),/Unknown/);
});
test('search query is bounded and strips punctuation',()=>{
 assert.equal(model.clean('   ATTACK***path  '),'attack path');
 assert.equal(model.clean('X'.repeat(130)).length,100);
});
test('command ranking favors exact names, not tags',()=>{
 assert(model.rank({name:'risk',tags:'cloud'},'risk')>model.rank({name:'cloud',tags:'risk'},'risk'));
});
