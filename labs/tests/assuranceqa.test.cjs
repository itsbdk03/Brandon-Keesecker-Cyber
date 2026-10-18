'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const qa=require('../assuranceqa-engine.js');
test('sample corpus contains six synthetic control records',()=>assert.equal(qa.SAMPLE.length,6));
test('normalization rejects empty inputs',()=>assert.throws(()=>qa.normalize([]),/1 to 100/));
test('normalization rejects duplicate controls',()=>assert.throws(()=>qa.normalize([qa.SAMPLE[0],qa.SAMPLE[0]]),/unique/));
test('normalization rejects malformed control identifiers',()=>assert.throws(()=>qa.normalize([{...qa.SAMPLE[0],id:'../SECRET'}]),/invalid control/));
test('normalization rejects unsupported statuses',()=>assert.throws(()=>qa.normalize([{...qa.SAMPLE[0],status:'approved'}]),/invalid status/));
test('normalization bounds record count',()=>assert.throws(()=>qa.normalize(Array.from({length:101},(_,i)=>({...qa.SAMPLE[0],id:'AC-'+(i+1)}))),/1 to 100/));
test('complete example avoids heuristic findings',()=>{
 const result=qa.review(qa.SAMPLE[0]); assert.equal(result.score,100);assert.equal(result.findings.length,0);
});
test('missing owner produces a high finding',()=>{
 const result=qa.review({...qa.SAMPLE[0],owner:''});assert(result.findings.some(f=>f.code==='OWN-01'&&f.severity==='high'));
});
test('missing evidence produces traceability warning for implemented status',()=>{
 const result=qa.review({...qa.SAMPLE[0],evidence:[]});assert(result.findings.some(f=>f.code==='EVID-01'));assert(result.findings.some(f=>f.code==='TRACE-01'));
});
test('planned narrative with insufficient detail is flagged',()=>{
 const result=qa.review(qa.SAMPLE[4]);assert(result.findings.some(f=>f.code==='NARR-02'));
});
test('results are deterministic for identical input',()=>assert.deepEqual(qa.summarize(qa.SAMPLE),qa.summarize(qa.SAMPLE)));
test('CSV export safely escapes quotes',()=>{
 const csv=qa.csv([{...qa.SAMPLE[0],title:'The "critical" service'}]);assert(csv.includes('"The ""critical"" service"'));
});
test('markdown export explicitly disclaims authorization conclusions',()=>{
 const markdown=qa.markdown(qa.SAMPLE); assert(markdown.includes('Not an OSCAL schema validation'));assert(markdown.includes('AC-2'));
});
test('not-applicable status needs rationale',()=>{
 const result=qa.review({...qa.SAMPLE[0],status:'not-applicable',narrative:''});assert(result.findings.some(f=>f.code==='NA-01'));
});
test('scores are bounded between 0 and 100',()=>{
 const result=qa.review({...qa.SAMPLE[0],owner:'',boundary:'',narrative:'',frequency:'',evidence:[]});assert(result.score>=0&&result.score<=100);
});