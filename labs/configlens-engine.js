'use strict';
// Portable, dependency-free ConfigLens rule engine. Rules analyze ONLY a defined JSON summary schema.
(function(root,factory){
  if(typeof module==='object' && module.exports){module.exports=factory();}
  else{root.ConfigLensEngine=factory();}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const docs={
    s3:'https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html',
    iam:'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html',
    sg:'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html',
    ct:'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/best-practices-security.html',
    rds:'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.Security.html',
    ebs:'https://docs.aws.amazon.com/ebs/latest/userguide/ebs-encryption.html',
    root:'https://docs.aws.amazon.com/IAM/latest/UserGuide/root-user-best-practices.html'
  };
  const catalog={
    'AWS-001':{title:'S3 Block Public Access disabled',severity:'High',category:'Storage',doc:docs.s3,ref:'AC-3 / SC-7',fix:'Enable relevant Block Public Access settings after confirming approved public access requirements.'},
    'AWS-002':{title:'S3 HTTPS enforcement not configured',severity:'Medium',category:'Storage',doc:docs.s3,ref:'SC-8',fix:'Review bucket policy and deny insecure transport using the aws:SecureTransport condition where appropriate.'},
    'AWS-003':{title:'S3 encryption explicitly disabled',severity:'Medium',category:'Storage',doc:docs.s3,ref:'SC-28',fix:'Review encryption settings and intended at-rest data protection; AWS S3 provides baseline default encryption, so confirm actual behavior.'},
    'AWS-004':{title:'IAM unrestricted actions and resources',severity:'Critical',category:'Identity',doc:docs.iam,ref:'AC-6',fix:'Replace unrestricted Action:* and Resource:* with tested least-privilege actions and scoped resources.'},
    'AWS-005':{title:'Administrative port exposed to public internet',severity:'Critical',category:'Network',doc:docs.sg,ref:'SC-7',fix:'Remove 0.0.0.0/0 or ::/0 access to SSH/RDP. Use approved controlled access paths and private administration.'},
    'AWS-006':{title:'CloudTrail trail disabled',severity:'High',category:'Monitoring',doc:docs.ct,ref:'AU-2 / AU-6',fix:'Configure an appropriate organization or account trail, retention, monitored delivery and protected destinations.'},
    'AWS-007':{title:'CloudTrail not multi-Region',severity:'Medium',category:'Monitoring',doc:docs.ct,ref:'AU-12',fix:'Assess whether a multi-Region trail is appropriate and enable it for the defined monitoring boundary.'},
    'AWS-008':{title:'CloudTrail log file validation disabled',severity:'Low',category:'Monitoring',doc:docs.ct,ref:'AU-9',fix:'Enable CloudTrail log file integrity validation and document periodic verification procedures.'},
    'AWS-009':{title:'RDS instance publicly accessible',severity:'High',category:'Database',doc:docs.rds,ref:'SC-7',fix:'Set PubliclyAccessible to false when not explicitly required. Use subnet placement and restricted security groups.'},
    'AWS-010':{title:'RDS storage encryption disabled',severity:'Medium',category:'Database',doc:docs.rds,ref:'SC-28',fix:'Plan encryption at rest and key management, including migration and snapshot considerations for existing instances.'},
    'AWS-011':{title:'EBS volume encryption disabled',severity:'Medium',category:'Compute',doc:docs.ebs,ref:'SC-28',fix:'Create encrypted volumes or snapshots and migrate through an approved method as needed; enable encryption by default.'},
    'AWS-012':{title:'Root user lacks MFA',severity:'Critical',category:'Identity',doc:docs.root,ref:'IA-2',fix:'Protect the root user with appropriately managed MFA, preferably phishing-resistant, and limit root usage.'}
  };
  let results=[],evaluations=0,resources=0,unknown=[];
  const add=(id,resource,evidence,extra={})=>results.push({ruleId:id,resource:String(resource),evidence:String(evidence),...extra,...catalog[id]});
  const check=(id,resource,actual,expected,evidence)=>{if(typeof actual!=='boolean'){unknown.push({ruleId:id,resource:String(resource),field:evidence.split(' = ')[0],reason:'Expected an explicit boolean; unavailable or invalid fields are unassessed.'});return;} ++evaluations;if(actual!==expected)add(id,resource,evidence)};
  const arrayOrEmpty=x=>Array.isArray(x)?x:[];
  function scan(doc){
    results=[];evaluations=0;resources=0;unknown=[];
    if(doc===null||typeof doc!=='object'||Array.isArray(doc))throw Error('Top-level configuration must be a JSON object.');
    if(doc.account&&typeof doc.account==='object'&&!Array.isArray(doc.account)){resources++;check('AWS-012','account/root',doc.account.rootMfa,true,'account.rootMfa = '+JSON.stringify(doc.account.rootMfa))}
    const s3=arrayOrEmpty(doc.s3Buckets);resources+=s3.length;
    s3.forEach((b,i)=>{if(!b||typeof b!=='object')return;let n=String(b.name||`bucket-${i+1}`).slice(0,150);check('AWS-001',`S3/${n}`,b.blockPublicAccess,true,`blockPublicAccess = ${JSON.stringify(b.blockPublicAccess)}`);check('AWS-002',`S3/${n}`,b.enforceTLS,true,`enforceTLS = ${JSON.stringify(b.enforceTLS)}`);check('AWS-003',`S3/${n}`,b.encryption?.enabled,true,`encryption.enabled = ${JSON.stringify(b.encryption?.enabled)}`)});
    const iam=arrayOrEmpty(doc.iamPolicies);resources+=iam.length;
    iam.forEach((p,i)=>{if(!p||typeof p!=='object')return;let name=String(p.name||`policy-${i+1}`).slice(0,150);arrayOrEmpty(p.statements).forEach((st,index)=>{if(!st||typeof st!=='object')return;let actions=Array.isArray(st.Action)?st.Action:[st.Action],resources=Array.isArray(st.Resource)?st.Resource:[st.Resource];if(st.Effect==='Allow'&&actions.includes('*')&&resources.includes('*')){evaluations++;add('AWS-004',`IAM/${name}`,'statement['+index+']: Effect=Allow, Action="*", Resource="*"')}else if(st.Effect==='Allow'&&actions.every(x=>typeof x==='string'&&x.length>0)&&resources.every(x=>typeof x==='string'&&x.length>0))evaluations++;else if(st.Effect==='Allow')unknown.push({ruleId:'AWS-004',resource:'IAM/'+name,field:'statements['+index+']',reason:'Incomplete Action or Resource in allowed policy statement.'})})});
    const groups=arrayOrEmpty(doc.securityGroups);resources+=groups.length;
    groups.forEach((g,i)=>{if(!g||typeof g!=='object')return;let name=String(g.id||`sg-${i+1}`).slice(0,150);arrayOrEmpty(g.ingress).forEach((r,k)=>{if(!r||typeof r!=='object')return;let start=Number(r.fromPort),end=Number(r.toPort),cidr=String(r.cidr||'');if(!Number.isFinite(start)||!Number.isFinite(end)||!cidr||!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>65535||start>end){unknown.push({ruleId:'AWS-005',resource:'SG/'+name,field:'ingress['+k+']',reason:'Invalid or incomplete network ingress rule.'});return;} ++evaluations;if(['0.0.0.0/0','::/0'].includes(cidr)&&[22,3389].some(p=>start<=p&&end>=p))add('AWS-005',`SG/${name}`,'ingress['+k+']: '+cidr+' → ports '+start+'-'+end)})});
    if(doc.cloudTrail&&typeof doc.cloudTrail==='object'&&!Array.isArray(doc.cloudTrail)){resources++;let t=doc.cloudTrail;check('AWS-006','CloudTrail/default',t.enabled,true,'enabled = '+JSON.stringify(t.enabled));check('AWS-007','CloudTrail/default',t.multiRegion,true,'multiRegion = '+JSON.stringify(t.multiRegion));check('AWS-008','CloudTrail/default',t.logFileValidation,true,'logFileValidation = '+JSON.stringify(t.logFileValidation))}
    const rds=arrayOrEmpty(doc.rdsInstances);resources+=rds.length;
    rds.forEach((x,i)=>{if(!x||typeof x!=='object')return;let name=String(x.id||`rds-${i+1}`).slice(0,150);check('AWS-009',`RDS/${name}`,x.publiclyAccessible,false,'publiclyAccessible = '+JSON.stringify(x.publiclyAccessible));check('AWS-010',`RDS/${name}`,x.storageEncrypted,true,'storageEncrypted = '+JSON.stringify(x.storageEncrypted))});
    const volumes=arrayOrEmpty(doc.ebsVolumes);resources+=volumes.length;
    volumes.forEach((x,i)=>{if(!x||typeof x!=='object')return;check('AWS-011',`EBS/${String(x.id||`vol-${i+1}`).slice(0,150)}`,x.encrypted,true,'encrypted = '+JSON.stringify(x.encrypted))});
    results.sort((a,b)=>({Critical:0,High:1,Medium:2,Low:3}[a.severity]-{Critical:0,High:1,Medium:2,Low:3}[b.severity]));
    return {resources,evaluations,results,passed:evaluations-results.length,unknown,unassessed:unknown.length};
  }
  function compare(before,after){
    const previous=scan(before),current=scan(after);
    // A finding is identified by rule, resource and the specific observed check.
    // Repeated findings on one resource remain distinct when evidence differs.
    const key=f=>[f.ruleId,f.resource,f.evidence].join('|');
    const old=new Set(previous.results.map(key)),now=new Set(current.results.map(key));
    return {before:previous,after:current,
      resolved:previous.results.filter(f=>!now.has(key(f))),
      introduced:current.results.filter(f=>!old.has(key(f))),
      persistent:current.results.filter(f=>old.has(key(f))),
      unassessedAfter:current.unknown};
  }
  return Object.freeze({catalog,scan,compare});
});
