/* SignalHunt correlation: independent, deterministic rules for fictional event timelines.
 * A correlation is an investigation lead, not evidence of compromise or causation.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.SignalHuntCorrelation=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const asTime=e=>Date.parse(e.timestamp);
  function correlate(events,watchlist=[],options={}){
    if(!Array.isArray(events))throw Error('Expected an array of events.');
    const tenMinutes=600000,oneHour=3600000,limit=Math.max(1,Math.min(100,Number(options.limit)||25));
    const watched=new Set((Array.isArray(watchlist)?watchlist:[]).map(x=>String(x).trim()).filter(Boolean));
    const sorted=events.filter(e=>e&&typeof e==='object'&&Number.isFinite(asTime(e))).slice().sort((a,b)=>asTime(a)-asTime(b));
    const grouped=new Map();
    for(const e of sorted){
      if(e.type!=='auth'||!e.user||!e.ip)continue;
      const key=JSON.stringify([String(e.user),String(e.ip)]);
      if(!grouped.has(key))grouped.set(key,[]);
      grouped.get(key).push(e);
    }
    const chains=[];
    for(const [key,records] of grouped){
      const [user,sourceIp]=JSON.parse(key);
      const successes=records.filter(e=>e.status==='success');
      for(const success of successes){
        const t=asTime(success);
        const failures=records.filter(e=>e.status==='failure'&&asTime(e)<t&&t-asTime(e)<=tenMinutes);
        if(failures.length<3)continue;
        const later=sorted.filter(e=>String(e.user)===user&&asTime(e)>t&&asTime(e)-t<=oneHour);
        const script=later.find(e=>e.type==='process'&&/powershell|pwsh|wscript|cscript/i.test(String(e.process??'')));
        const outbound=later.find(e=>e.type==='network'&&watched.has(String(e.destination??'')));
        const steps=[
          {label:'Three or more authentication failures',time:failures.at(-3).timestamp,tip:'T1110 context · same user and IP, within 10 minutes'},
          {label:'Successful authentication',time:success.timestamp,tip:'T1078 context · same user and source IP'}
        ];
        if(script)steps.push({label:'Subsequent script telemetry',time:script.timestamp,tip:'T1059 context · same identity, endpoint not independently correlated'});
        if(outbound)steps.push({label:'Subsequent watchlisted connection',time:outbound.timestamp,tip:'Same identity in sample; verify device and process linkage'});
        chains.push({user,sourceIp,steps,confidence:steps.length>=4?'Multiple temporal signals (unverified link)':'Authentication sequence (source matched)',failureCount:failures.length,successTime:success.timestamp});
      }
    }
    return chains.sort((a,b)=>asTime(a.steps[1])-asTime(b.steps[1])).slice(0,limit);
  }
  return Object.freeze({correlate});
});
