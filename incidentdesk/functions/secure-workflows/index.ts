// IncidentDesk verified workflows — Supabase Edge Function.
// JWT required. No secret/service key in the browser. Synthetic portfolio data only.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const json=(value,status=200)=>new Response(JSON.stringify(value),{
 status,headers:{"content-type":"application/json","access-control-allow-origin":"*",
 "access-control-allow-headers":"authorization,apikey,content-type","access-control-allow-methods":"POST, OPTIONS"}
});
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const hex=buffer=>Array.from(new Uint8Array(buffer),x=>x.toString(16).padStart(2,"0")).join("");
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return json({ok:true});
 if(req.method!=="POST")return json({error:"POST required"},405);
 const auth=req.headers.get("authorization")||"";
 if(!auth.startsWith("Bearer "))return json({error:"A signed-in user is required"},401);
 const jwt=auth.slice(7),url=Deno.env.get("SUPABASE_URL"),
   publicKey=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY"),
   serverKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!publicKey||!serverKey)return json({error:"Secure runtime not configured"},503);
 const userDb=createClient(url,publicKey,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await userDb.auth.getUser(jwt);
 if(authError||!user)return json({error:"Invalid authenticated session"},401);
 let input;try{input=await req.json()}catch{return json({error:"Invalid JSON body"},400)}
 if(!input||typeof input!=="object")return json({error:"Invalid request"},400);
 const service=createClient(url,serverKey,{auth:{persistSession:false,autoRefreshToken:false}});
 if(input.operation==="verify_evidence"){
  const evidence_id=String(input.evidence_id||"");
  if(!uuid.test(evidence_id))return json({error:"Invalid evidence identifier"},400);
  const {data:item,error}=await userDb.from("incident_evidence").select("id,incident_id,workspace_id,storage_path,sha256,size_bytes").eq("id",evidence_id).maybeSingle();
  if(error||!item)return json({error:"Evidence not available to this user"},404);
  if(item.size_bytes>5242880)return json({error:"Evidence exceeds verification limit"},413);
  const result=await userDb.storage.from("incidentdesk-evidence").download(item.storage_path);
  if(result.error||!result.data)return json({error:"Private evidence download not permitted"},403);
  if(result.data.size>5242880)return json({error:"Evidence exceeds verification limit"},413);
  const digest=hex(await crypto.subtle.digest("SHA-256",await result.data.arrayBuffer()));
  const verified=digest===item.sha256 && result.data.size===item.size_bytes;
  // A verification is complete only if its custody record is durably saved.
  // A service-role insert failure is NOT a successful verification.
  const custody=await service.from("evidence_custody_events").insert({
   workspace_id:item.workspace_id,incident_id:item.incident_id,evidence_id:item.id,
   actor_id:user.id,action:verified?"download_verified":"download_failed",sha256:digest,
   description:verified?"Server independently downloaded and matched SHA-256 and file size":
                        "Server independently downloaded the object; hash or file size mismatch"
  });
  if(custody.error){
   console.error("Evidence verification audit write failed",custody.error.code||"unknown");
   return json({verified:false,error:"Evidence audit registration failed; verification cannot be trusted"},503);
  }
  if(!verified)return json({verified:false,error:"Evidence integrity check failed"},409);
  return json({verified:true,sha256:digest,bytes:result.data.size,
   note:"Server SHA-256 and size matched; custody event recorded."});
 }
 if(input.operation==="send_invitation"){
  const invitation_id=String(input.invitation_id||"");
  if(!uuid.test(invitation_id))return json({error:"Invalid invitation identifier"},400);
  const {data:invite,error}=await userDb.from("workspace_invitations")
   .select("id,workspace_id,email,role,expires_at,accepted_at,created_by,email_sent_at")
   .eq("id",invitation_id).maybeSingle();
  if(error||!invite||invite.created_by!==user.id)return json({error:"Invitation unavailable or not owned by sender"},403);
  const {data:membership}=await userDb.from("workspace_members").select("role")
   .eq("workspace_id",invite.workspace_id).eq("user_id",user.id).maybeSingle();
  if(membership?.role!=="admin")return json({error:"Workspace administrator required"},403);
  if(invite.accepted_at||Date.parse(invite.expires_at)<Date.now())return json({error:"Invitation is no longer pending"},409);
  if(invite.email_sent_at&&Date.now()-Date.parse(invite.email_sent_at)<3600000)
   return json({error:"Invitation already sent in the past hour"},429);
  const provider=Deno.env.get("RESEND_API_KEY"),from=Deno.env.get("INCIDENTDESK_MAIL_FROM"),appUrl=Deno.env.get("INCIDENTDESK_APP_URL");
  if(!provider||!from||!appUrl)return json({error:"Email sender not configured. Invitation remains available for manual sharing."},503);
  let verifiedUrl;
  try{verifiedUrl=new URL(appUrl);if(verifiedUrl.protocol!=="https:")throw Error("HTTPS only")}
  catch{return json({error:"Configured application URL must be HTTPS"},503)}
  const workspace=await userDb.from("workspaces").select("name").eq("id",invite.workspace_id).maybeSingle();
  const name=workspace.data?.name||"a security workspace";
  const message=["You have been invited to IncidentDesk.","","Workspace: "+name,
   "Role: "+invite.role,"Expires: "+invite.expires_at,"",
   "Sign in with this exact email address to review and accept the invitation:",
   verifiedUrl.href,"",
   "This is a fictional incident-management portfolio demonstration. Do not upload confidential information."].join("\n");
  const res=await fetch("https://api.resend.com/emails",{method:"POST",
   headers:{"authorization":"Bearer "+provider,"content-type":"application/json"},
   body:JSON.stringify({from,to:[invite.email],subject:"IncidentDesk workspace invitation",text:message})});
  if(!res.ok)return json({error:"Email provider did not accept the message; invitation remains pending"},502);
  const response=await res.json().catch(()=>({}));
  const saved=await service.from("workspace_invitations").update({
   email_sent_at:new Date().toISOString(),email_delivery_id:String(response.id||"").slice(0,160)
  }).eq("id",invite.id);
  if(saved.error)return json({error:"Email accepted, but delivery record could not be updated"},500);
  return json({sent:true,email_delivery_id:String(response.id||""),note:"Provider accepted message; recipient delivery is not independently confirmed."});
 }
 return json({error:"Unknown operation"},400);
});
