#!/usr/bin/env node
'use strict';
/**
 * Public repository credential-hygiene gate.
 * Reviews the files actually tracked by Git; no external services, secrets,
 * passwords, or runtime credentials are required.
 * Reports file paths and categories only; never prints token values.
 */
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');

const ROOT=path.resolve(__dirname,'..');
const sensitivePath=/(?:^|\/)(?:\.env(?:\..*)?|id_(?:rsa|ed25519|ecdsa)|credentials(?:\.json)?|service-account(?:\.json)?|.*\.(?:pem|p12|pfx|key|tfstate|tfvars))$/i;
const sensitiveLeaf=/^\.?(?:secrets?|private)[-_]?(?:keys?|tokens?|credentials?)(?:\..+)?$/i;
const tokenRules=[
  ['private key material',/-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g],
  ['GitHub personal access token',/\bgh[pousr]_[A-Za-z0-9]{30,}\b/g],
  ['GitHub fine-grained token',/\bgithub_pat_[A-Za-z0-9_]{30,}\b/g],
  ['AWS access key ID',/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g],
  ['Google API key',/\bAIza[A-Za-z0-9_-]{35}\b/g],
  ['Supabase privileged API key',/\bsb_secret_[A-Za-z0-9_-]{18,}\b/g],
  ['Resend API key',/\bre_[A-Za-z0-9]{32,}\b/g],
  ['Stripe secret key',/\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/g],
  ['embedded PostgreSQL password',/\bpostgres(?:ql)?:\/\/[^\s"'<>/]+:[^\s"'@<>]+@[A-Za-z0-9.-]+(?::\d+)?\//gi],
  ['embedded URL authorization',/\bhttps?:\/\/[A-Za-z0-9._~%-]+:[^@\s"'<>]{8,}@[A-Za-z0-9.-]+\//gi]
];
const exceptions=new Set(['.env.example']);
function analyze(relative,content){
  const problems=[];
  const clean=relative.replace(/\\/g,'/');
  const basename=path.posix.basename(clean);
  if((sensitivePath.test(clean)||sensitiveLeaf.test(basename))&&!exceptions.has(clean))
    problems.push('sensitive file name');
  if(typeof content==='string'){
    for(const [label,expression] of tokenRules){
      expression.lastIndex=0;
      if(expression.test(content))problems.push(label);
    }
  }
  return problems;
}
function tracked(){
 const run=cp.spawnSync('git',['ls-files','-z','--cached'],{cwd:ROOT,encoding:'buffer',maxBuffer:4*1024*1024});
 if(run.error||run.status!==0)throw Error('Cannot enumerate tracked Git files');
 return run.stdout.toString('utf8').split('\0').filter(Boolean);
}
function audit(){
 const failures=[];
 const files=tracked();
 for(const rel of files){
   const full=path.resolve(ROOT,rel);
   if(!full.startsWith(ROOT+path.sep))throw Error('Unexpected repository path');
   const stat=fs.statSync(full);
   // Non-text blobs are screened by filename; never print or decode binary.
   const binary=/\.(?:webp|png|jpg|jpeg|gif|ico|pdf|zip|woff2?|mp4|svgz)$/i.test(rel);
   const content=(!binary&&stat.size<2*1024*1024)?fs.readFileSync(full,'utf8'):null;
   const findings=analyze(rel,content);
   if(findings.length)failures.push({file:rel,categories:findings});
 }
 if(failures.length){
   process.stderr.write('Credential hygiene gate failed in '+failures.length+' tracked files:\n');
   for(const item of failures)process.stderr.write(' - '+item.file+': '+item.categories.join(', ')+'\n');
   process.stderr.write('Remove the credential and revoke/rotate it if exposed. Examine Git history; deleting a file alone is insufficient.\n');
   process.exitCode=1;
 }else console.log('Credential hygiene gate passed ('+files.length+' tracked files; filenames and high-confidence credential patterns checked).');
}
if(require.main===module)audit();
module.exports={analyze};
