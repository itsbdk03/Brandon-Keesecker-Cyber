'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../schema.sql'),'utf8').toLowerCase();
const entities=['workspaces','workspace_members','incidents','incident_comments','incident_events','incident_evidence'];
test('every exposed user table has RLS enabled',()=>{
 for(const name of entities)assert(source.includes('alter table public.'+name+' enable row level security;'),name);
});
test('all user table policies target authenticated principals',()=>{
 const policies=[...source.matchAll(/create policy [\w_]+ on public\.[\w_]+ for (?:select|insert|update|delete) to ([a-z_]+)/g)];
 assert(policies.length>=10);
 assert(policies.every(m=>m[1]==='authenticated'));
});
test('workspace-isolation helpers use current authenticated identity',()=>{
 for(const name of ['member_of','can_edit','is_admin'])assert(source.includes('function private.'+name+'('));
 assert(source.includes('auth.uid()'));
 assert(source.includes('m.workspace_id=wid'));
});
test('critical membership-based access checks cover incident data and evidence',()=>{
 assert(source.includes('private.member_of(workspace_id)'));
 assert(source.includes('private.can_edit(workspace_id)'));
 assert(source.includes('private.incident_workspace(incident_id)'));
 assert(source.includes("bucket_id='incidentdesk-evidence'"));
});
test('client has no direct permissions to mutate audit event table',()=>{
 assert.match(source,/grant select on public\.incident_events to authenticated;/);
 assert(!/grant (?:insert|update|delete).*public\.incident_events to authenticated;/.test(source));
});
test('client cannot update owner and workspace IDs through column grants',()=>{
 assert(source.includes('grant update(title,description,severity,status,assigned_to) on public.incidents to authenticated;'));
 assert(!source.includes('grant update on public.incidents to authenticated;'));
});
test('private storage is bounded and excludes HTML and executables',()=>{
 assert.match(source,/incidentdesk-evidence',false,5242880/);
 assert(!source.includes("'application/x-msdownload'"));
 assert(!source.includes("'text/html'"));
});
test('public clients do not contain service-role or secret API keys',()=>{
 const dir=path.join(__dirname,'..');
 for(const f of ['config.js','app.js','index.html']){
  const value=fs.readFileSync(path.join(dir,f),'utf8');
  assert(!value.includes('sb_secret_'),f);
  assert(!value.includes('eyJhbGciOiJIUzI1Ni'),f);
  assert(!value.includes('service_role:'),f);
 }
});
test('storage object path parsing is safe for other bucket identifiers',()=>{
 assert(source.includes('function private.safe_path_uuid('));
 assert(source.includes('private.safe_path_uuid(name,1)'));
});
