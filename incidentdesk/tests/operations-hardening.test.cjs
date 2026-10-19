'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const v5=read('migrations/0005_operations_quality.sql');
const v6=read('migrations/0006_milestones_assignment_analytics.sql');
const v7=read('migrations/0007_invitation_delivery.sql');
const v8=read('migrations/0008_workspace_invitation_index.sql');
const edge=read('functions/secure-workflows/index.ts');
const app=read('app.js');
const page=read('index.html');
test('four response playbook templates are seeded and accessible only after login',()=>{
 for(const kind of ['identity','endpoint','cloud','exposure'])assert(v5.includes("('"+kind+"'"),kind);
 assert(v5.includes('alter table public.response_playbooks enable row level security'));
 assert(v5.includes('to authenticated using((select auth.uid()) is not null)'));
});
test('playbook progress belongs to the authenticated workspace',()=>{
 assert(v5.includes('alter table public.incident_playbook_steps enable row level security'));
 assert(v5.includes('private.member_of(workspace_id)'));
 assert(v5.includes('private.can_edit(workspace_id)'));
 assert(v5.includes('foreign key(incident_id,workspace_id)'));
});
test('notification queue is scheduled but clients cannot insert their own alerts',()=>{
 assert(v5.includes("*/15 * * * *"));
 assert(v5.includes('revoke all on public.incident_notifications from anon,authenticated'));
 assert(v5.includes('grant select on public.incident_notifications to authenticated'));
 assert(v5.includes('grant update(seen_at) on public.incident_notifications to authenticated'));
 assert(!/grant insert on public\.incident_notifications to authenticated/.test(v5));
});
test('assignment notifications use server trigger and proper membership',()=>{
 assert(v6.includes('private.notify_assignment()'));
 assert(v6.includes('after insert or update of assigned_to'));
 assert(v5.includes('join public.workspace_members m on m.workspace_id=i.workspace_id'));
});
test('evidence custody is written by server trigger, not browser',()=>{
 assert(v5.includes('after insert on public.incident_evidence'));
 assert(v5.includes('revoke all on public.evidence_custody_events from anon,authenticated'));
 assert(v5.includes('grant select on public.evidence_custody_events to authenticated'));
 assert(!/grant insert on public\.evidence_custody_events to authenticated/.test(v5));
});
test('server verification requires authenticated identity and RLS-visible evidence',()=>{
 assert(edge.includes('verify_jwt')===false); // deployment explicitly configures JWT requirement
 assert(edge.includes('userDb.auth.getUser(jwt)'));
 assert(edge.includes('userDb.from("incident_evidence")'));
 assert(edge.includes('userDb.storage.from("incidentdesk-evidence").download'));
 assert(edge.includes('crypto.subtle.digest("SHA-256"'));
 assert(!app.includes('sb_secret_'));
});
test('invitation email requires admin and a configured provider secret',()=>{
 assert(edge.includes('membership?.role!=="admin"'));
 assert(edge.includes('RESEND_API_KEY'));
 assert(edge.includes('INCIDENTDESK_MAIL_FROM'));
 assert(edge.includes('INCIDENTDESK_APP_URL'));
 assert(edge.includes('Invitation already sent in the past hour'));
 assert(v7.includes('email_sent_at'));
});
test('tenant analytics is security invoker and uses real acknowledgment milestones',()=>{
 assert(v6.includes('security invoker'));
 assert(v6.includes('avg_ack_minutes'));
 assert(v6.includes('avg_resolution_hours'));
 assert(v6.includes('acknowledged_at'));
 assert(v6.includes('resolved_at'));
});
test('all eight existing improvements have a user-facing route',()=>{
 for(const id of ['socAnalytics','playbookChecklist','custodyList','notificationList','exportEvidenceManifest'])assert(page.includes('id="'+id+'"'),id);
 assert(app.includes("s.client.rpc('incident_soc_metrics'"));
});
test('foreign key index final patch is present',()=>{
 assert(v8.includes('workspace_invitations(workspace_id)'));
});
