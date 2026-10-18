/* AttackPath Lab: deterministic graph analysis for fictional defensive tabletop exercises. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.AttackPathEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const nodes=[
    {id:'internet',name:'External Actor',kind:'entry',x:64,y:180},
    {id:'web',name:'Public Web App',kind:'edge',x:268,y:90},
    {id:'idp',name:'Identity Gateway',kind:'edge',x:268,y:275},
    {id:'workload',name:'App Workload',kind:'system',x:472,y:90},
    {id:'admin',name:'Admin Session',kind:'system',x:472,y:275},
    {id:'database',name:'Data Store',kind:'target',x:676,y:45},
    {id:'backup',name:'Backup Vault',kind:'target',x:676,y:185},
    {id:'egress',name:'Outbound Channel',kind:'target',x:676,y:325}
  ];
  const weaknesses=[
    {id:'unpatchedApp',label:'Patch vulnerable public application',short:'Unpatched application',group:'Application',why:'Hardening the public-facing application removes the modeled route from the web tier to the workload.'},
    {id:'stolenCredentials',label:'Revoke compromised credentials',short:'Compromised credentials',group:'Identity',why:'Credential rotation and session invalidation interrupt the modeled attacker foothold into the identity gateway.'},
    {id:'mfaNotEnforced',label:'Enforce phishing-resistant MFA',short:'No strong MFA',group:'Identity',why:'Strong authentication can interrupt credential-only progression to a privileged session.'},
    {id:'privilegedRoleBroad',label:'Constrain privileged access',short:'Excessive role access',group:'Identity',why:'Least privilege removes the modeled administrator-to-workload progression.'},
    {id:'lateralMovementOpen',label:'Segment application and database',short:'Unrestricted east-west access',group:'Network',why:'Segmentation blocks the modeled application-to-database route.'},
    {id:'backupUnsegmented',label:'Isolate backup management',short:'Flat backup trust boundary',group:'Resilience',why:'Separating backup access from application and administrative sessions reduces modeled backup exposure.'},
    {id:'egressUnrestricted',label:'Restrict and monitor outbound traffic',short:'Unrestricted outbound access',group:'Network',why:'Egress safeguards block modeled unapproved outbound paths, subject to verification in a real environment.'}
  ];
  const edges=[
    {from:'internet',to:'web',requires:[],label:'Exposed web interface'},
    {from:'web',to:'workload',requires:['unpatchedApp'],label:'Application exploitation'},
    {from:'internet',to:'idp',requires:['stolenCredentials'],label:'Credential replay attempt'},
    {from:'idp',to:'admin',requires:['mfaNotEnforced'],label:'Privileged sign-in'},
    {from:'admin',to:'workload',requires:['privilegedRoleBroad'],label:'Privilege pivot'},
    {from:'workload',to:'database',requires:['lateralMovementOpen'],label:'Data tier access'},
    {from:'admin',to:'backup',requires:['backupUnsegmented'],label:'Backup admin access'},
    {from:'workload',to:'backup',requires:['backupUnsegmented'],label:'Backup network access'},
    {from:'workload',to:'egress',requires:['egressUnrestricted'],label:'Outbound activity'},
    {from:'database',to:'egress',requires:['egressUnrestricted'],label:'Data movement'}
  ];
  const targets=['database','backup','egress'];
  const scenarios={
    exposed:{name:'Exposed hybrid cloud · tabletop',note:'Two entry routes are available. Multiple weaknesses combine into alternative paths.',flags:Object.fromEntries(weaknesses.map(w=>[w.id,true]))},
    identity:{name:'Identity-focused incident · tabletop',note:'The public application is patched; stolen credentials and weak identity defenses remain.',flags:{unpatchedApp:false,stolenCredentials:true,mfaNotEnforced:true,privilegedRoleBroad:true,lateralMovementOpen:true,backupUnsegmented:true,egressUnrestricted:true}},
    hardened:{name:'Hardened environment · comparison',note:'All modeled weaknesses are mitigated. This is a demonstration state, not evidence of actual security.',flags:Object.fromEntries(weaknesses.map(w=>[w.id,false]))}
  };
  const clone=o=>JSON.parse(JSON.stringify(o));
  function validate(flags){if(!flags||typeof flags!=='object'||Array.isArray(flags))throw Error('Expected an object of scenario flags.');for(const w of weaknesses)if(typeof flags[w.id]!=='boolean')throw Error('Missing or invalid boolean: '+w.id);return flags}
  function analyze(flags){
    validate(flags);
    const activeEdges=edges.filter(e=>e.requires.every(id=>flags[id]===true));
    const paths=[];
    const visit=(node,path)=>{
      if(path.length>nodes.length)return;
      if(targets.includes(node))paths.push([...path]);
      for(const e of activeEdges){if(e.from===node&&!path.includes(e.to))visit(e.to,[...path,e.to])}
    };
    visit('internet',['internet']);
    const reached=[...new Set(paths.map(p=>p.at(-1)))];
    return {activeEdges,paths,reached,totalPaths:paths.length,reachedCount:reached.length};
  }
  function prioritize(flags){
    const before=analyze(flags);
    return weaknesses.filter(w=>flags[w.id]).map(w=>{
      const after=analyze({...flags,[w.id]:false});
      return {...w,pathsBlocked:before.totalPaths-after.totalPaths,targetsReduced:before.reachedCount-after.reachedCount,remainingPaths:after.totalPaths};
    }).sort((a,b)=>b.targetsReduced-a.targetsReduced||b.pathsBlocked-a.pathsBlocked||a.label.localeCompare(b.label));
  }
  return {nodes,edges,weaknesses,targets,scenarios,clone,validate,analyze,prioritize};
});
