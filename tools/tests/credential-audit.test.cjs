'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {analyze}=require('../credential-audit.cjs');

test('publishable keys are public client configuration, not database credentials',()=>{
 assert.deepEqual(analyze('incidentdesk/config.js','window.INCIDENTDESK_CONFIG={publishableKey:"sb_publishable_test_public_key_only"}'),[]);
});
test('protected local files are never committed',()=>{
 assert.ok(analyze('.env.production','').includes('sensitive file name'));
 assert.ok(analyze('credentials.json','{}').includes('sensitive file name'));
 assert.deepEqual(analyze('.env.example','EXAMPLE_ONLY=true'),[]);
});
test('detect privileged secrets without echoing the original value',()=>{
 const candidate='sb_'+'secret_'+'X'.repeat(32);
 assert.ok(analyze('config.txt','const k="'+candidate+'"').includes('Supabase privileged API key'));
 const pat='-----BEGIN '+'PRIVATE KEY-----';
 assert.ok(analyze('artifact.txt',pat).includes('private key material'));
});
test('accept ordinary project configuration and documentation',()=>{
 assert.deepEqual(analyze('README.md','Project code, example names, and synthetic evidence only.'),[]);
 assert.deepEqual(analyze('architectures/index.html','<title>FedRAMP Moderate</title>'),[]);
});
