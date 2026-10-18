/* IncidentDesk — secure Supabase adapter + standalone synthetic local demonstration.
 * Never embed service_role keys. Every live query is additionally restricted by PostgreSQL RLS.
 */
(()=>{'use strict';
const M=window.IncidentDeskModel,O=window.IncidentDeskOps,C=window.INCIDENTDESK_CONFIG||{},q=s=>document.querySelector(s);
if(!M||!O)return;
const s={mode:'demo',client:null,user:null,workspace:null,role:'demo',selected:null,view:'overview',channel:null,editing:null,loading:false,store:null,workspaces:[],invites:[],pageIndex:0,pageTotal:0,metrics:null,realtimeStatus:'DISCONNECTED'};
const clone=x=>JSON.parse(JSON.stringify(x));
try{s.store=JSON.parse(sessionStorage.getItem('incidentdesk_demo_v1')||'null')}catch(e){}
if(!s.store||!Array.isArray(s.store.incidents))s.store=M.sample();
const persist=()=>{if(s.mode==='demo')try{sessionStorage.setItem('incidentdesk_demo_v1',JSON.stringify(s.store))}catch(e){}};
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function badge(value){return el('span','pill '+String(value||'').toLowerCase(),String(value||'unknown'))}
function clear(host){host.replaceChildren()}
function formatDate(value){const t=Date.parse(value);return Number.isFinite(t)?new Date(t).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Unknown'}
function toast(message){const t=q('#toast');t.textContent=message;t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{t.hidden=true},4200)}
function rows(type){return s.store[type]||[]}
function canEdit(){return s.mode==='demo'||['admin','analyst'].includes(s.role)}
function isAdmin(){return s.mode==='demo'||s.role==='admin'}
function urlFor(kind,id){return kind==='workspaces'?null:id}
function key(item){return item.key||'IR-'+item.id.slice(0,8).toUpperCase()}
function page(name){s.view=name;for(const v of document.querySelectorAll('.view'))v.classList.toggle('active',v.id==='view-'+name);for(const b of document.querySelectorAll('.nav-item[data-view]')){const on=b.dataset.view===name;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false')}q('#pageName').textContent=name==='overview'?'Overview':name==='incidents'?'Incidents':name==='activity'?'Activity trail':'Team & access';q('.sidebar').classList.remove('open');q('#mobileMenu').setAttribute('aria-expanded','false');render()}
function graph(host,data,palette){clear(host);const max=Math.max(1,...Object.values(data));for(const [k,v] of Object.entries(data)){const row=el('div','bar-row');const name=el('span','bar-label',k),track=el('div','bar-track'),fill=el('div','bar-fill'),value=el('span','bar-value',String(v));fill.style.width=(v/max*100)+'%';fill.style.background=palette[k]||'#67d5c2';track.append(fill);row.append(name,track,value);host.append(row)}}
function caseItem(item){
 const row=el('div','case-item'),title=el('div','case-name');title.append(el('strong','',item.title),el('small','',key(item)+' · '+formatDate(item.updated_at)));
 const open=el('button','open-link','Review →');open.type='button';open.setAttribute('aria-label','Review '+item.title);open.addEventListener('click',()=>showDetail(item.id));
 row.append(badge(item.severity),title,badge(item.status),open);return row
}
function renderOverview(){
 const overview=s.mode==='live'&&s.metrics?s.metrics:M.overview(rows('incidents'));
 const metrics=[['TOTAL CASES',overview.total,'Cases in visible workspace'],['ACTIVE INVESTIGATIONS',overview.open,'Not yet resolved'],['OPEN CRITICAL',overview.critical,'High-priority response'],['CASES RESOLVED',overview.resolved,'Closed after investigation']];
 const host=q('#kpiGrid');clear(host);for(const [label,count,note] of metrics){const card=el('div','kpi');card.append(el('span','kpi-label',label),el('strong','',String(count)),el('small','',note));host.append(card)}
 graph(q('#severityGraph'),overview.bySeverity,{critical:'#fc8096',high:'#f4ad82',medium:'#eacb8c',low:'#89c3ec'});
 graph(q('#statusGraph'),overview.byStatus,{new:'#79b8ed',triage:'#dfc787',investigating:'#8c9fe9',contained:'#73d9bf',resolved:'#4eab97'});
 const recent=M.filter(rows('incidents')).filter(x=>x.status!=='resolved').slice(0,5);const list=q('#priorityCases');clear(list);for(const item of recent)list.append(caseItem(item));if(!recent.length)list.append(el('p','muted-small','No open cases in the current workspace.'));
}
function renderCases(){
 const params={query:q('#search').value,status:q('#statusFilter').value,severity:q('#severityFilter').value};
 const list=s.mode==='live'?rows('incidents'):M.filter(rows('incidents'),params),tbody=q('#caseRows');clear(tbody);q('#caseEmpty').hidden=list.length>0;const pagination=q('#casePagination');pagination.hidden=s.mode!=='live';if(s.mode==='live'){q('#pageCount').textContent='Page '+(s.pageIndex+1)+' of '+Math.max(1,Math.ceil(s.pageTotal/O.PAGE_SIZE))+' · '+s.pageTotal+' cases';q('#pagePrev').disabled=s.pageIndex===0;q('#pageNext').disabled=(s.pageIndex+1)*O.PAGE_SIZE>=s.pageTotal;}
 for(const item of list){const tr=document.createElement('tr');const a=document.createElement('td');a.append(el('strong','',item.title),el('small','',key(item)));const open=el('button','','Open →');open.type='button';open.setAttribute('aria-label','Open case '+key(item));open.addEventListener('click',()=>showDetail(item.id));const last=document.createElement('td');last.append(open);const owner=item.assigned_to?'Assigned':'Unassigned';const cells=[a,document.createElement('td'),document.createElement('td'),el('td','',owner),el('td','',formatDate(item.updated_at)),last];cells[1].append(badge(item.severity));cells[2].append(badge(item.status));tr.append(...cells);tbody.append(tr)}
}
function activityView(host,events,empty='No activity yet.'){
 clear(host);if(!events.length){host.append(el('p','muted-small',empty));return}
 for(const event of events.slice(0,120)){const row=el('div','activity-row');const icon=el('span','activity-symbol',event.event_type==='created'?'＋':event.event_type==='updated'?'↻':event.event_type==='evidence_added'?'▣':'◉');const body=el('div','activity-body');body.append(el('strong','',event.event_type.replace('_',' ').toUpperCase()+' · '+(rows('incidents').find(x=>x.id===event.incident_id)?.title||'Case')),el('p','',event.note||'Activity recorded'),el('small','',formatDate(event.created_at)));row.append(icon,body);host.append(row)}
}
function renderTeam(){
 const host=q('#memberList');clear(host);q('#workspaceName').textContent=s.workspace?.name||(s.mode==='demo'?'Fictional SOC Team':'No workspace');
 for(const member of rows('members')){const line=el('div','member-row');const avatar=el('span','activity-symbol',(member.user_id||'?').slice(-2).toUpperCase()),body=el('div','activity-body');body.append(el('strong','',member.user_id===s.user?.id?'Your account':member.user_id),el('small','',member.role.toUpperCase()));line.append(avatar,body);host.append(line)}
 if(!rows('members').length)host.append(el('p','muted-small','Sign in and create a workspace to begin.'));
 const select=q('#workspaceSelect');select.replaceChildren();for(const w of (s.mode==='demo'?rows('workspaces'):s.workspaces)){const option=el('option','',w.name);option.value=w.id;select.append(option)}if(s.workspace)select.value=s.workspace.id;select.disabled=s.mode==='demo'||s.workspaces.length<2;
 const invites=q('#pendingInvitations');clear(invites);
 for(const invite of s.invites){const row=el('div','member-row'),body=el('div','activity-body');body.append(el('strong','',invite.workspace_name||invite.email||'Invitation'),el('small','',invite.role+' · expires '+formatDate(invite.expires_at)));row.append(el('span','activity-symbol','✉'),body);if(invite.accept){const accept=el('button','button subtle','Accept');accept.type='button';accept.addEventListener('click',()=>acceptInvitation(invite.id));row.append(accept)}invites.append(row)}
 q('#setupWorkspace').hidden=s.mode==='demo'||!!s.workspace;
 q('#memberForm').querySelector('button[type=submit]').disabled=!isAdmin()||!s.workspace;
}
function render(){
 q('#navCount').textContent=rows('incidents').length;
 if(s.view==='overview')renderOverview();
 if(s.view==='incidents')renderCases();
 if(s.view==='activity')activityView(q('#activityList'),rows('events').slice().sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)));
 if(s.view==='team')renderTeam();
}
function mode(){
 const live=s.mode==='live';
 q('#modeName').textContent=live?'Authenticated workspace':'Fictional demo environment';
 q('#syncState').textContent=live?'● '+(s.realtimeStatus==='SUBSCRIBED'?'Realtime connected':'RLS · '+s.realtimeStatus):'● Demo local';
 q('#authButton').textContent=live?'Account settings':'Connect account';
 q('#userBadge').textContent=live?(s.user?.email||'U').slice(0,2).toUpperCase():'BD';
 q('#bannerMessage').textContent=live?'Authenticated Supabase environment. Do not enter real incidents or customer evidence into this portfolio demonstration.':'Interactive synthetic SOC dataset. Actions in demo mode stay in this browser session; no production system is modified.';
 q('.banner-chip').textContent=live?'SECURE SESSION':'SANDBOX';
 q('#signOut').hidden=!live;
}
function openForm(item=null){
 if(!canEdit()){toast('Read-only role: only analysts and admins can modify records.');return}
 s.editing=item?.id||null;
 const form=q('#incidentForm');form.reset();
 q('#formTitle').textContent=item?'Edit incident':'Create incident';
 if(item){for(const k of ['title','description','severity','status'])form.elements.namedItem(k).value=item[k]}
 q('#incidentDialog').showModal();form.elements.namedItem('title').focus()
}
function showDetail(id){
 const item=rows('incidents').find(x=>x.id===id);if(!item)return;
 s.selected=id;q('#detailTitle').textContent=item.title;q('#detailId').textContent=key(item);
 const badges=q('#detailMeta');clear(badges);badges.append(badge(item.severity),badge(item.status),el('span','mono','Created '+formatDate(item.created_at)));const deadline=O.deadline(item);q('#deadlineInfo').textContent=deadline.visible?'Response deadline: '+new Date(deadline.due_at).toLocaleString()+(deadline.overdue?' · OVERDUE':''):'Response deadline not recorded in this fictional case.';q('#deadlineInfo').classList.toggle('overdue',deadline.overdue);
 q('#detailDescription').textContent=item.description||'No description supplied.';
 q('#editIncident').disabled=!canEdit();q('#noteForm').hidden=!canEdit();q('#evidenceForm').hidden=!canEdit();
 for(const b of document.querySelectorAll('.detail-tab')){b.classList.toggle('active',b.dataset.detail==='notes');b.setAttribute('aria-selected',b.dataset.detail==='notes'?'true':'false')}
 for(const p of document.querySelectorAll('.detail-page'))p.classList.toggle('active',p.id==='detail-notes');
 const comments=rows('comments').filter(c=>c.incident_id===id).slice().sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
 const notes=q('#caseNotes');clear(notes);for(const note of comments){const row=el('div','activity-row'),body=el('div','activity-body');body.append(el('strong','', 'Analyst observation'),el('p','',note.body),el('small','',formatDate(note.created_at)));row.append(el('span','activity-symbol','◉'),body);notes.append(row)}
 if(!comments.length)notes.append(el('p','muted-small','No analyst notes yet.'));
 const files=q('#caseEvidence');clear(files);
 for(const evidence of rows('evidence').filter(e=>e.incident_id===id)){const row=el('div','evidence-row'),body=el('div','activity-body');body.append(el('strong','',evidence.original_name),el('small','',evidence.size_bytes+' bytes · '+formatDate(evidence.created_at)+' · v'+(evidence.version||1)+(evidence.sha256?' · SHA-256 '+evidence.sha256.slice(0,16)+'…':'')));row.append(el('span','activity-symbol','▣'),body);if(s.mode==='live'){const link=el('button','button subtle','Download');link.type='button';link.addEventListener('click',()=>downloadEvidence(evidence));row.append(link)}files.append(row)}
 if(!files.children.length)files.append(el('p','muted-small','No evidence metadata. Use fictional files only.'));
 activityView(q('#caseHistory'),rows('events').filter(e=>e.incident_id===id).slice().sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)));
 if(!q('#detailDialog').open)q('#detailDialog').showModal()
}
function download(name,text,type='text/markdown'){
 const blob=new Blob([text],{type:type+';charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200)
}
async function promiseResult(result){if(result.error)throw result.error;return result.data}
function requireAuth(){if(!s.user||!s.client)throw Error('Live authentication required')}
async function saveIncident(evt){
 evt.preventDefault();const form=evt.currentTarget;
 const input=Object.fromEntries(new FormData(form));
 const next=M.validate(input);
 if(s.editing&&s.mode==='live'){const prior=rows('incidents').find(x=>x.id===s.editing);if(prior&&!O.canTransition(prior.status,next.status)){toast('Invalid transition: '+prior.status+' → '+next.status);return}}
 try{
  if(s.mode==='demo'){if(s.editing)M.update(s.store,s.editing,next);else M.create(s.store,next);persist()}
  else {
   requireAuth();if(!s.workspace||!canEdit())throw Error('You need analyst access in an active workspace');
   if(s.editing)await promiseResult(await s.client.from('incidents').update(next).eq('id',s.editing).eq('workspace_id',s.workspace.id));
   else await promiseResult(await s.client.from('incidents').insert({...next,workspace_id:s.workspace.id,created_by:s.user.id}));
   await refreshLive();
  }
  q('#incidentDialog').close();toast(s.editing?'Incident updated':'Incident created');s.editing=null;render();
 }catch(err){toast('Unable to save: '+err.message)}
}
async function saveNote(evt){
 evt.preventDefault();const value=q('#noteText').value;
 try{
  if(s.mode==='demo'){M.comment(s.store,s.selected,value);persist()}
  else{requireAuth();if(!canEdit())throw Error('Insufficient workspace permissions');await promiseResult(await s.client.from('incident_comments').insert({incident_id:s.selected,author_id:s.user.id,body:value.trim()}));await refreshLive()}
  q('#noteText').value='';showDetail(s.selected);toast('Analyst note recorded');
 }catch(err){toast('Unable to save note: '+err.message)}
}
async function upload(evt){
 evt.preventDefault();const file=q('#evidenceFile').files[0];
 try{
  M.validateFile(file);
  if(s.mode==='demo'){M.attach(s.store,s.selected,file);persist();toast('Demo metadata attached; file not uploaded')}
  else{
   requireAuth();if(!canEdit())throw Error('Read-only account');
   const sha256=await O.hash(file);const previous=rows('evidence').filter(e=>e.incident_id===s.selected&&e.original_name===file.name).sort((a,b)=>(b.version||1)-(a.version||1))[0];const version=previous?(previous.version||1)+1:1;
   const path=s.workspace.id+'/'+s.selected+'/'+crypto.randomUUID()+'/'+file.name.replace(/[^a-zA-Z0-9_.-]/g,'_');
   const storage=s.client.storage.from(C.evidenceBucket||'incidentdesk-evidence');
   const uploaded=await storage.upload(path,file,{contentType:file.type,upsert:false});
   if(uploaded.error)throw uploaded.error;
   try{await promiseResult(await s.client.from('incident_evidence').insert({incident_id:s.selected,workspace_id:s.workspace.id,uploaded_by:s.user.id,original_name:file.name,size_bytes:file.size,storage_path:path,sha256,content_type:file.type,version}))}
   catch(e){throw new Error(e.message+'; administrator review may be needed for an unlinked private object')}
   await refreshLive();toast('Private evidence stored successfully');
  }
  q('#evidenceForm').reset();showDetail(s.selected);
 }catch(err){toast('Evidence failed: '+err.message)}
}
async function downloadEvidence(item){
 try{requireAuth();const res=await s.client.storage.from(C.evidenceBucket).download(item.storage_path);const blob=await promiseResult(res);if(item.sha256&&!await O.verify(blob,item.sha256))throw Error('SHA-256 mismatch: evidence differs from recorded digest');if(item.sha256)toast('Evidence SHA-256 verified');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=item.original_name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1400)}catch(err){toast('Download blocked: '+err.message)}
}
async function refreshLive(){
 if(!s.user||!s.client)return;
 const client=s.client;
 const workspaces=await promiseResult(await client.from('workspaces').select('id,name,created_by').order('created_at',{ascending:true}).limit(100));
 s.workspaces=workspaces;
 if(s.workspace&&!workspaces.some(w=>w.id===s.workspace.id))s.workspace=null;
 if(!s.workspace)s.workspace=workspaces[0]||null;
 try{
  const pending=await promiseResult(await client.rpc('my_pending_invitations'));
  s.invites=(pending||[]).map(x=>({...x,accept:true}));
 }catch(err){s.invites=[];console.warn('Pending invitation lookup failed:',err.message)}
 if(!s.workspace){
  s.role='none';s.metrics=null;s.pageTotal=0;s.pageIndex=0;
  s.store={workspaces:[],members:[],incidents:[],comments:[],events:[],evidence:[]};
  mode();render();return;
 }
 const wid=s.workspace.id;
 const filters={query:q('#search').value.trim(),status:q('#statusFilter').value,severity:q('#severityFilter').value};
 const results=client.from('incidents').select('*',{count:'exact'}).eq('workspace_id',wid);
 if(filters.status)results.eq('status',filters.status);
 if(filters.severity)results.eq('severity',filters.severity);
 if(filters.query)results.ilike('title','%'+O.escapeLike(filters.query)+'%');
 const [members,summary]=await Promise.all([
  promiseResult(await client.from('workspace_members').select('user_id,role,workspace_id').eq('workspace_id',wid)),
  promiseResult(await client.rpc('workspace_incident_metrics',{wid}))
 ]);
 s.metrics=summary;
 s.role=members.find(m=>m.user_id===s.user.id)?.role||'viewer';
 const range=O.pageRange(s.pageIndex);
 const output=await results.order('updated_at',{ascending:false}).range(range.from,range.to);
 if(output.error)throw output.error;
 s.pageTotal=output.count||0;
 if(s.pageIndex>0&&s.pageIndex*O.PAGE_SIZE>=s.pageTotal){s.pageIndex=Math.max(0,Math.ceil(s.pageTotal/O.PAGE_SIZE)-1);return refreshLive()}
 const incidents=output.data||[],ids=incidents.map(x=>x.id);
 let comments=[],events=[],evidence=[];
 if(ids.length){
  [comments,evidence]=await Promise.all([
   promiseResult(await client.from('incident_comments').select('*').in('incident_id',ids).order('created_at',{ascending:false}).limit(500)),
   promiseResult(await client.from('incident_evidence').select('*').in('incident_id',ids).order('created_at',{ascending:false}).limit(500))
  ]);
 }
 events=await promiseResult(await client.from('incident_events').select('*').eq('workspace_id',wid).order('created_at',{ascending:false}).limit(150));
 s.store={workspaces,members,incidents,comments,events,evidence};
 mode();render();if(s.selected&&q('#detailDialog').open)showDetail(s.selected);
}
async function acceptInvitation(id){
 try{
  if(s.mode!=='live')throw Error('Sign in to accept an invitation');
  await promiseResult(await s.client.rpc('accept_workspace_invitation',{invitation_id:id}));
  s.workspace=null;s.pageIndex=0;await refreshLive();subscribe();toast('Invitation accepted: your workspace is available');
 }catch(err){toast('Invitation not accepted: '+err.message)}
}
async function switchWorkspace(id){
 if(s.mode!=='live')return;
 const target=s.workspaces.find(w=>w.id===id);if(!target)return;
 s.workspace=target;s.pageIndex=0;s.selected=null;s.metrics=null;
 await refreshLive();subscribe();toast('Switched workspace to '+target.name);
}
function subscribe(){
 if(s.channel){s.client.removeChannel(s.channel);s.channel=null}
 if(!s.workspace)return;
 s.channel=s.client.channel('incidentdesk:'+s.workspace.id)
 .on('postgres_changes',{event:'*',schema:'public',table:'incidents',filter:'workspace_id=eq.'+s.workspace.id},()=>refreshLive().catch(console.warn))
 .on('postgres_changes',{event:'*',schema:'public',table:'incident_events',filter:'workspace_id=eq.'+s.workspace.id},()=>refreshLive().catch(console.warn))
 .subscribe(status=>{s.realtimeStatus=O.eventLabel(status);mode();if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')toast('Realtime interrupted; refresh or reconnect to see latest case changes');});
}
async function initializeLive(){
 const valid=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(C.url||'')&&/^sb_publishable_[\w-]+$/.test(C.publishableKey||'');
 if(!valid||!window.supabase?.createClient)return;
 s.client=window.supabase.createClient(C.url,C.publishableKey,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
 const {data,error}=await s.client.auth.getSession();if(error){toast('Auth session error: '+error.message);return}
 if(data.session?.user)await connected(data.session.user);
 s.client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_IN'&&session?.user&&(!s.user||s.user.id!==session.user.id))setTimeout(()=>connected(session.user).catch(e=>toast('Load failed: '+e.message)),0);if(event==='SIGNED_OUT')setTimeout(disconnected,0)});
}
async function connected(user){
 s.user=user;s.mode='live';s.workspace=null;
 try{await refreshLive();subscribe();toast('Authenticated workspace connected')}
 catch(e){toast('Workspace loading failed: '+e.message)}
}
function disconnected(){if(s.channel&&s.client)s.client.removeChannel(s.channel);s.channel=null;s.user=null;s.workspace=null;s.workspaces=[];s.invites=[];s.metrics=null;s.pageIndex=0;s.role='demo';s.mode='demo';try{s.store=JSON.parse(sessionStorage.getItem('incidentdesk_demo_v1')||'null')||M.sample()}catch(e){s.store=M.sample()}mode();render()}
function bind(){
 for(const b of document.querySelectorAll('.nav-item[data-view]'))b.addEventListener('click',()=>page(b.dataset.view));
 q('#mobileMenu').addEventListener('click',()=>{const open=q('.sidebar').classList.toggle('open');q('#mobileMenu').setAttribute('aria-expanded',String(open))});
 q('#createOverview').addEventListener('click',()=>openForm());q('#createIncidents').addEventListener('click',()=>openForm());q('#viewAll').addEventListener('click',()=>page('incidents'));
 let searchTimeout=null;
 for(const id of ['search','statusFilter','severityFilter'])q('#'+id).addEventListener(id==='search'?'input':'change',()=>{
  if(s.mode==='demo'){renderCases();return}
  clearTimeout(searchTimeout);searchTimeout=setTimeout(()=>{s.pageIndex=0;refreshLive().catch(e=>toast('Search failed: '+e.message))},id==='search'?350:0);
 });
 q('#pagePrev').addEventListener('click',()=>{if(s.mode==='live'&&s.pageIndex>0){s.pageIndex--;refreshLive().catch(e=>toast(e.message))}});
 q('#pageNext').addEventListener('click',()=>{if(s.mode==='live'&&(s.pageIndex+1)*O.PAGE_SIZE<s.pageTotal){s.pageIndex++;refreshLive().catch(e=>toast(e.message))}});
 q('#workspaceSelect').addEventListener('change',e=>switchWorkspace(e.target.value).catch(err=>toast(err.message)));

 q('#clearFilters').addEventListener('click',()=>{q('#search').value='';q('#statusFilter').value='';q('#severityFilter').value='';if(s.mode==='live'){s.pageIndex=0;refreshLive().catch(e=>toast(e.message))}else renderCases()});
 q('#incidentForm').addEventListener('submit',saveIncident);q('#noteForm').addEventListener('submit',saveNote);q('#evidenceForm').addEventListener('submit',upload);
 q('#editIncident').addEventListener('click',()=>{const item=rows('incidents').find(x=>x.id===s.selected);q('#detailDialog').close();openForm(item)});
 q('#exportIncident').addEventListener('click',()=>{const item=rows('incidents').find(x=>x.id===s.selected);if(!item)return;const id=item.id;download((item.key||'incidentdesk-case')+'.md',M.report(item,rows('comments').filter(x=>x.incident_id===id),rows('events').filter(x=>x.incident_id===id),rows('evidence').filter(x=>x.incident_id===id)))});
 for(const b of document.querySelectorAll('.detail-tab'))b.addEventListener('click',()=>{for(const x of document.querySelectorAll('.detail-tab'))x.classList.toggle('active',x===b);for(const x of document.querySelectorAll('.detail-page'))x.classList.toggle('active',x.id==='detail-'+b.dataset.detail)});
 for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>q('#'+b.dataset.close).close());
 q('#authButton').addEventListener('click',()=>{q('#authHint').textContent=s.client?'Use a magic link to sign in. Redirect must be allowlisted in Supabase.':'Backend not yet configured. You can explore the complete fictional demo; live authentication will work after Supabase is connected.';q('#authDialog').showModal()});
 q('#authForm').addEventListener('submit',async e=>{e.preventDefault();if(!s.client){q('#authHint').textContent='Live backend not provisioned yet. The demo remains available.';return}const email=new FormData(e.currentTarget).get('email');const redirectTo=location.origin+location.pathname;const {error}=await s.client.auth.signInWithOtp({email,options:{emailRedirectTo:redirectTo}});q('#authHint').textContent=error?'Sign-in failed: '+error.message:'Magic link sent. Check your inbox and return to this page.'});
 q('#signOut').addEventListener('click',async()=>{if(s.client){await s.client.auth.signOut();q('#authDialog').close();toast('Signed out; returned to fictional demo')}});
 q('#setupWorkspace').addEventListener('click',async()=>{if(!s.client||!s.user)return;const name=window.prompt('Workspace name (fictional data only):','My Security Response Team');if(!name)return;try{await promiseResult(await s.client.from('workspaces').insert({name:name.trim(),created_by:s.user.id}));s.workspace=null;await refreshLive();subscribe();toast('Workspace created')}catch(e){toast('Workspace creation failed: '+e.message)}});
 q('#memberForm').addEventListener('submit',async e=>{
  e.preventDefault();if(s.mode!=='live'||!isAdmin()||!s.workspace){toast('Admin workspace required');return}
  const data=Object.fromEntries(new FormData(e.currentTarget));
  try{
   const email=O.validateEmail(data.email);
   await promiseResult(await s.client.from('workspace_invitations').insert({
    workspace_id:s.workspace.id,email,role:data.role,created_by:s.user.id
   }));
   s.invites=await promiseResult(await s.client.from('workspace_invitations').select('id,email,role,expires_at').eq('workspace_id',s.workspace.id).is('accepted_at',null));
   await refreshLive();e.target.reset();toast('Invitation created. Share the app sign-in link with '+email);
  }catch(err){toast('Invitation failed: '+err.message)}
 });
}
bind();mode();render();initializeLive().catch(e=>toast('Supabase initialization failed: '+e.message));
})();