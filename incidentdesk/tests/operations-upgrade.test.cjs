'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const schema=read('migrations/0005_operations_quality.sql');
const milestone=read('migrations/0006_milestones_assignment_analytics.sql');
const mail=read('migrations/0007_invitation_delivery.sql');
const indexes=read('migrations/0008_staging_fk_consistency.sql');
const app=read('app.js'),page=read('index.html'),edge=read('functions/secure-workflows/index.ts');
test('new operations tables all enforce tenant-scoped RLS',()=>{
 for(const name of ['response_playbooks','incident_playbook_steps','evidence_custody_events','incident_notifications']){
   assert(schema.includes('alter table public.'+name+' enable row level security;'),name);
 }
 assert(schema.includes('private.member_of(workspace_id)'));
 assert(schema.includes('private.can_edit(workspace_id)'));
});
test('custody and scheduled alert records are not client-writable',()=>{
 assert(schema.includes('grant select on public.evidence_custody_events to authenticated;'));
 assert(schema.includes('grant select on public.incident_notifications to authenticated;'));
 assert(!schema.includes('grant insert on public.evidence_custody_events to authenticated'));
 assert(!schema.includes('grant insert on public.incident_notifications to authenticated'));
 assert(schema.includes("cron.schedule('incidentdesk-sla-alerts'"));
});
test('response playbook cases link to workspace and incident, not just an arbitrary ID',()=>{
 assert(schema.includes('constraint step_matches_incident foreign key(incident_id,workspace_id)'));
 assert(schema.includes('unique(incident_id,playbook_id,step_key)'));
 assert(schema.includes('completed_by=(select auth.uid())'));
});
test('accurate SOC analytics use acknowledgment and resolution timestamps',()=>{
 assert(milestone.includes('acknowledged_at timestamptz'));
 assert(milestone.includes('resolved_at timestamptz'));
 assert(milestone.includes('acknowledged_at-created_at'));
 assert(milestone.includes('resolved_at-created_at'));
 assert(!milestone.includes('updated_at<=due_at'));
});
test('invitations cannot claim a successful email from a browser update',()=>{
 assert(mail.includes('email_sent_at timestamptz'));
 assert(!mail.includes('grant update(email_sent_at)'));
 assert(edge.includes('RESEND_API_KEY'));
 assert(edge.includes('INCIDENTDESK_APP_URL'));
 assert(edge.includes('Invitation already sent in the past hour'));
});
test('Edge Function independently verifies file hashes after a user-scoped query',()=>{
 assert(edge.includes('userDb.auth.getUser(jwt)'));
 assert(edge.includes('userDb.from("incident_evidence")'));
 assert(edge.includes('userDb.storage.from("incidentdesk-evidence").download'));
 assert(edge.includes('crypto.subtle.digest("SHA-256"'));
 assert(edge.includes('evidence_custody_events'));
 assert(!edge.includes('Access-Control-Allow-Credentials'));
});
test('page exposes real operational features with no duplicated projects',()=>{
 for(const id of ['view-analytics','socAnalytics','notificationButton','playbookChecklist','custodyList','exportEvidenceManifest']){
  assert(page.includes('id="'+id+'"'),id);
 }
 assert(app.includes("from('incident_playbook_steps')"));
 assert(app.includes("rpc('incident_soc_metrics'"));
 assert(app.includes("functions.invoke('incidentdesk-secure-workflows'"));
});
test('all Supabase foreign key index findings have a planned covering index',()=>{
 for(const name of ['evidence_parent_case_cover_idx','invitations_accepted_by_idx','invitations_created_by_idx',
 'custody_workspace_cover_idx','playbook_steps_playbook_cover_idx','playbook_steps_workspace_cover_idx',
 'playbook_steps_incident_workspace_cover_idx'])assert(schema.includes(name)||milestone.includes(name),name);
 assert(indexes.includes('workspace_invites_workspace_cover_idx'));
});
test('staging and release guidance flags actual login and email as pending',()=>{
 const doc=read('RELEASE-ACCEPTANCE.md');
 assert(doc.includes('No actual end-to-end multi-account test yet'));
 assert(doc.includes('No email provider configured'));
 assert(doc.includes('staging'));
});
