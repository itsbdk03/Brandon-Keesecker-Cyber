/* IncidentDesk operations hardening: independently testable utilities. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.IncidentDeskOps=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const PAGE_SIZE=25;
const transitions=Object.freeze({
 new:['triage','investigating','contained','resolved'],
 triage:['investigating','contained','resolved'],
 investigating:['triage','contained','resolved'],
 contained:['investigating','resolved'],
 resolved:['investigating']
});
function canTransition(from,to){return from===to||!!transitions[from]?.includes(to)}
function escapeLike(str){return String(str||'').slice(0,100).trim().replace(/[\\%_]/g,'\\$&')}
function deadline(item,now=Date.now()){
 const due=Date.parse(item?.due_at||'');
 const visible=Number.isFinite(due);
 const overdue=visible&&!['contained','resolved'].includes(item.status)&&due<now;
 return {visible,overdue,due_at:visible?new Date(due).toISOString():null};
}
function hex(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}
async function hash(blob){
 if(!blob||typeof blob.arrayBuffer!=='function')throw Error('File data unavailable');
 if(typeof crypto==='undefined'||!crypto.subtle)throw Error('Secure browser required for SHA-256');
 return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())));
}
async function verify(blob,expected){return /^[a-f0-9]{64}$/.test(expected||'')&&(await hash(blob))===expected}
function pageRange(index){if(!Number.isInteger(index)||index<0)throw Error('Invalid page');return {from:index*PAGE_SIZE,to:(index+1)*PAGE_SIZE-1}}
function eventLabel(status){return ['SUBSCRIBED','CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)?status:'CONNECTING'}
function validateEmail(email){const value=String(email||'').trim().toLowerCase();if(value.length>254||!/^[-.\w+]+@[-.\w]+\.[a-z]{2,}$/i.test(value))throw Error('Enter a valid email address');return value}
return Object.freeze({PAGE_SIZE,transitions,canTransition,escapeLike,deadline,hex,hash,verify,pageRange,eventLabel,validateEmail});
});