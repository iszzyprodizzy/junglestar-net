const SUPABASE_URL="https://xfknuiuqzihtgodnybwv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_GEtDFPOEv3WS2vo76wBd-g_7BgGEPQG";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let robotRows=[];
const e=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const slug=s=>String(s||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const fmt=d=>d?new Intl.DateTimeFormat("en-US",{dateStyle:"short",timeStyle:"short"}).format(new Date(d)):"—";

async function requireSession(){
 const {data:{session}}=await db.auth.getSession();
 if(!session){location.replace("/jungle-star-command/login/");return null;}
 const u=session.user,m=u.user_metadata||{},n=m.full_name||m.name||u.email||"Command User";
 document.getElementById("account-name").textContent=n;
 document.getElementById("account-email").textContent=u.email||"Authenticated";
 document.getElementById("account-avatar").textContent=(n.trim()[0]||"J").toUpperCase();
 return session;
}
async function loadRobotRows(){
 const body=document.getElementById("records-body");
 body.innerHTML='<tr><td colspan="9">Loading…</td></tr>';
 const {data,error}=await db.from("robot_knowledge").select("*").order("updated_at",{ascending:false}).limit(500);
 if(error){body.innerHTML='<tr><td colspan="9">'+e(error.message)+'</td></tr>';return;}
 robotRows=data||[];renderRobotRows();
}
function renderRobotRows(){
 const q=(document.getElementById("search-records").value||"").toLowerCase().trim();
 const data=robotRows.filter(r=>!q||JSON.stringify(r).toLowerCase().includes(q));
 document.getElementById("records-body").innerHTML=data.length?data.map(r=>`<tr>
 <td>${e(fmt(r.updated_at))}</td><td><strong>${e(r.robot_name)}</strong></td>
 <td>${e(r.record_type)}</td><td><strong>${e(r.title)}</strong><br>${e((r.body||"").slice(0,140))}</td>
 <td>${e(r.project||"—")}</td><td>${e(r.approval_state)}</td><td>${e(r.training_state)}</td>
 <td>${e(r.source_reference||r.source_type||"—")}</td><td>${e(r.notes||r.candidate_meaning||"—")}</td>
 </tr>`).join(""):'<tr><td colspan="9">No records yet.</td></tr>';
}
async function saveRobotRecord(ev){
 ev.preventDefault();
 const robotName=document.getElementById("robot-name").value.trim();
 const payload={
  robot_slug:slug(robotName),robot_name:robotName,record_type:document.getElementById("record-type").value,
  title:document.getElementById("title").value.trim(),body:document.getElementById("body").value.trim()||null,
  source_type:document.getElementById("source-type").value.trim()||null,
  source_url:document.getElementById("source-url").value.trim()||null,
  source_reference:document.getElementById("source-reference").value.trim()||null,
  candidate_meaning:document.getElementById("candidate-meaning").value.trim()||null,
  approval_state:document.getElementById("approval-state").value,
  training_state:document.getElementById("training-state").value,
  project:document.getElementById("project").value.trim()||null,
  related_ip:document.getElementById("related-ip").value.trim()||null,
  tags:document.getElementById("tags").value.split(",").map(x=>x.trim()).filter(Boolean),
  notes:document.getElementById("notes").value.trim()||null
 };
 const status=document.getElementById("save-status");status.textContent="Saving…";
 const {error}=await db.from("robot_knowledge").insert(payload);
 if(error){status.textContent="SAVE FAILED: "+error.message;return;}
 status.textContent="SAVED TO ROBOT HALL.";ev.target.reset();await loadRobotRows();
}
document.addEventListener("DOMContentLoaded",async()=>{
 document.getElementById("training-form").addEventListener("submit",saveRobotRecord);
 document.getElementById("search-records").addEventListener("input",renderRobotRows);
 document.getElementById("refresh-records").addEventListener("click",loadRobotRows);
 document.getElementById("command-sign-out").addEventListener("click",async()=>{await db.auth.signOut();location.replace("/jungle-star-command/login/");});
 document.getElementById("page-opened").textContent="PAGE OPENED: "+new Intl.DateTimeFormat("en-US",{dateStyle:"medium",timeStyle:"short"}).format(new Date());
 if(await requireSession())await loadRobotRows();
});