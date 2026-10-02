/* ROBOT ROOM NOTEBOOK — BUILD 2026-10-01 */
(function(){
  const match=location.pathname.match(/^\/jungle-star-command\/robot-hall\/([^/]+)\/?$/);
  if(!match) return;
  const slug=match[1];
  if(["registry","training","cattle-silver-gold"].includes(slug)) return;
  const display=slug.split("-").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ");
  const main=document.querySelector("main");
  if(!main) return;
  const section=document.createElement("section");
  section.innerHTML=`
    <div class="eyebrow">Live Robot Notebook</div>
    <h2 class="section-title">Put information inside ${display}.</h2>
    <p class="section-copy">Save source notes, document leads, lessons, continuity, Cattle/Silver/Gold findings, project links and next actions. These records live in Supabase under your signed-in Command account.</p>
    <div class="robot-feature">
      <div class="robot-room-form">
        <input id="rr-title" placeholder="Title / record name">
        <select id="rr-type"><option>training</option><option>source</option><option>continuity</option><option>document</option><option>decision</option><option>correction</option><option>cattle</option><option>silver</option><option>gold</option></select>
        <textarea id="rr-body" placeholder="Paste notes, source text, document summary or continuity here."></textarea>
        <input id="rr-source" placeholder="Source URL / filename / spreadsheet tab / receipt">
        <input id="rr-project" placeholder="Project / business">
        <input id="rr-related" placeholder="Related character / product / song / book / IP">
        <select id="rr-approval"><option value="needs_review">Needs Review</option><option value="approved">Approved</option><option value="conflicting">Conflicting</option><option value="parked">Parked</option></select>
        <select id="rr-training"><option value="untrained">Untrained</option><option value="queued">Queued</option><option value="trained">Trained</option><option value="retrieval_proven">Retrieval Proven</option></select>
        <textarea id="rr-notes" placeholder="Next action / follow-up"></textarea>
        <button class="btn primary" id="rr-save" type="button">SAVE TO ${display.toUpperCase()}</button>
        <div id="rr-status" class="robot-room-status"></div>
      </div>
    </div>
    <div class="robot-room-records">
      <div class="eyebrow">Saved Records</div>
      <h2 class="section-title">What ${display} already knows.</h2>
      <div id="rr-list">Loading…</div>
    </div>`;
  main.appendChild(section);

  const style=document.createElement("style");
  style.textContent=`
    .robot-room-form{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .robot-room-form input,.robot-room-form select,.robot-room-form textarea{padding:12px;border:1px solid var(--line);border-radius:12px;background:#0b1119;color:var(--text);font:inherit}
    .robot-room-form textarea{grid-column:1/-1;min-height:100px;resize:vertical}
    .robot-room-form #rr-save,.robot-room-status{grid-column:1/-1}
    .robot-room-status{min-height:22px;color:var(--muted)}
    .rr-card{margin:10px 0;padding:16px;border:1px solid var(--line);border-radius:16px;background:#0e131b}
    .rr-card strong{color:var(--text)}.rr-meta{margin-top:7px;color:var(--muted);font-size:.78rem}
    @media(max-width:700px){.robot-room-form{grid-template-columns:1fr}.robot-room-form textarea,.robot-room-form #rr-save,.robot-room-status{grid-column:auto}}
  `;
  document.head.appendChild(style);

  const escape=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  async function load(){
    const {data,error}=await commandSupabase.from("robot_knowledge").select("*").eq("robot_slug",slug).order("updated_at",{ascending:false}).limit(100);
    const list=document.getElementById("rr-list");
    if(error){list.textContent=error.message;return;}
    list.innerHTML=(data||[]).length?(data||[]).map(r=>`<article class="rr-card"><strong>${escape(r.title)}</strong><div class="rr-meta">${escape(r.record_type)} • ${escape(r.approval_state)} • ${escape(r.training_state)} • ${escape(r.project||"No project")} • ${new Date(r.updated_at).toLocaleString()}</div><p>${escape(r.body||r.candidate_meaning||r.notes||"")}</p><div class="rr-meta">Source: ${escape(r.source_reference||r.source_url||r.source_type||"—")} | Related: ${escape(r.related_ip||"—")}</div></article>`).join(""):"No records yet. Add the first one above.";
  }
  document.getElementById("rr-save").addEventListener("click",async()=>{
    const title=document.getElementById("rr-title").value.trim();
    if(!title){document.getElementById("rr-status").textContent="Add a title first.";return;}
    const source=document.getElementById("rr-source").value.trim();
    const payload={
      robot_slug:slug,
      robot_name:document.querySelector("h1")?.textContent.replace(".","").trim()||display,
      record_type:document.getElementById("rr-type").value,
      title,
      body:document.getElementById("rr-body").value.trim()||null,
      source_url:/^https?:\/\//i.test(source)?source:null,
      source_reference:source||null,
      approval_state:document.getElementById("rr-approval").value,
      training_state:document.getElementById("rr-training").value,
      project:document.getElementById("rr-project").value.trim()||null,
      related_ip:document.getElementById("rr-related").value.trim()||null,
      notes:document.getElementById("rr-notes").value.trim()||null
    };
    document.getElementById("rr-status").textContent="Saving…";
    const {error}=await commandSupabase.from("robot_knowledge").insert(payload);
    if(error){document.getElementById("rr-status").textContent="SAVE FAILED: "+error.message;return;}
    document.getElementById("rr-status").textContent="SAVED.";
    ["rr-title","rr-body","rr-source","rr-project","rr-related","rr-notes"].forEach(id=>document.getElementById(id).value="");
    await load();
  });
  load();
})();