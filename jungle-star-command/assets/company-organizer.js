(() => {
  "use strict";
  const SUPABASE_URL = "https://xfknuiuqzihtgodnybwv.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GEtDFPOEv3WS2vo76wBd-g_7BgGEPQ";
  const DEFAULT_AREAS = ["Great Food Fight","JW Comics","Jungle Star Publishing","Soap Station","Construction / HQ","Vox News","Academy & Community","Other / Ideas"];
  let AREAS = [...DEFAULT_AREAS];
  const STATUSES = ["Inbox","Ready","In Progress","Blocked","Waiting","Completed","Archived"];
  const TYPES = ["Task","Idea","Note","Product","Document","Link","Purchase","Book"];
  const areaIds = {"Great Food Fight":"gff","JW Comics":"jw","Jungle Star Publishing":"pub","Soap Station":"soap","Construction / HQ":"construction","Vox News":"vox","Academy & Community":"academy","Other / Ideas":"other"};
  const $ = id => document.getElementById(id);
  let userId = "";
  let items = [];
  let activeArea = "all";
  let storageKey = "";
  let customAreasKey = "";
  let editingId = "";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const today = () => new Date().toISOString().slice(0,10);
  const makeId = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "item-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  function loadItems(){
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
      items = Array.isArray(parsed) ? parsed.filter(x => x && x.id && x.title) : [];
    } catch (e) { items = []; }
    try {
      const saved = JSON.parse(localStorage.getItem(customAreasKey) || "[]");
      const valid = Array.isArray(saved) ? saved.filter(a => typeof a === "string" && a.trim()).map(a => a.trim().slice(0,70)) : [];
      AREAS = [...DEFAULT_AREAS, ...valid.filter(a => !DEFAULT_AREAS.some(d => d.toLowerCase() === a.toLowerCase()))];
    } catch (e) { AREAS = [...DEFAULT_AREAS]; }
  }
  function saveCustomAreas(){
    try { localStorage.setItem(customAreasKey, JSON.stringify(AREAS.filter(a => !DEFAULT_AREAS.includes(a)))); return true; }
    catch(e) { alert("Could not save the workspace list in this browser. Your existing captured items were not changed."); return false; }
  }
  function renderCustomAreas(){
    const custom = AREAS.filter(a => !DEFAULT_AREAS.includes(a));
    $("custom-area-shortcuts").innerHTML = custom.map(a => '<button class="area-shortcut" data-area="' + esc(a) + '"><i class="dot custom-dot"></i> ' + esc(a) + '</button>').join("");
    $("custom-area-cards").innerHTML = custom.map(a => '<button class="area-card custom-area-card" data-area="' + esc(a) + '"><span class="area-symbol custom-symbol">✧</span><span class="area-copy"><b>' + esc(a) + '</b><small>Custom business / workspace</small><em data-custom-count="' + esc(a) + '">0 items</em></span><span class="chevron">›</span></button>').join("");
    $("workspace-count").textContent = AREAS.length + " WORKSPACES";
  }
  function addWorkspace(event){
    event.preventDefault();
    const input = $("workspace-name"), message = $("workspace-message");
    const name = input.value.trim().replace(/\s+/g," ");
    if(!name) return;
    if(AREAS.some(a => a.toLowerCase() === name.toLowerCase())) { message.textContent = "That workspace already exists. Select it from the list."; return; }
    AREAS.push(name);
    if(!saveCustomAreas()) { AREAS.pop(); return; }
    renderCustomAreas(); setupAreaSelect(); $("capture-area").value = name;
    input.value = ""; message.textContent = "Workspace added. It is now available in Business / Area."; renderStats();
  }
  function persist(){
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
      render();
      return true;
    } catch (e) {
      alert("This browser could not save the organizer data. Please export your current items and check available browser storage.");
      return false;
    }
  }
  function dateLabel(value){
    if(!value) return "";
    const d = new Date(value + "T12:00:00");
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
  }
  function setupAreaSelect(){
    $("capture-area").innerHTML = AREAS.map(a => '<option value="' + esc(a) + '">' + esc(a) + '</option>').join("");
  }
  function visibleItems(){
    const q = $("search-items").value.trim().toLowerCase();
    const status = $("filter-status").value;
    const type = $("filter-type").value;
    return items.filter(item => {
      if(activeArea !== "all" && item.area !== activeArea) return false;
      if(status !== "all" && item.status !== status) return false;
      if(type !== "all" && item.type !== type) return false;
      if(q && ![item.title,item.notes,item.area,item.category,item.project,item.type,item.link].join(" ").toLowerCase().includes(q)) return false;
      return true;
    }).sort((a,b) => {
      const rank = s => s === "Inbox" ? 0 : s === "In Progress" ? 1 : s === "Ready" ? 2 : s === "Blocked" ? 3 : s === "Waiting" ? 4 : s === "Completed" ? 5 : 6;
      return rank(a.status)-rank(b.status) || String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt));
    });
  }
  function renderStats(){
    $("stat-total").textContent = items.length;
    $("stat-areas").textContent = AREAS.length;
    $("stat-active").textContent = items.filter(x => ["Inbox","Ready","In Progress","Blocked","Waiting"].includes(x.status)).length;
    $("stat-done").textContent = items.filter(x => x.status === "Completed").length;
    AREAS.forEach(area => {
      const el = $("count-" + areaIds[area]);
      if(el) {
        const count = items.filter(x => x.area === area).length;
        el.textContent = count + (count === 1 ? " item" : " items");
      }
    });
    document.querySelectorAll("[data-custom-count]").forEach(el => {
      const count = items.filter(x => x.area === el.dataset.customCount).length;
      el.textContent = count + (count === 1 ? " item" : " items");
    });
  }
  function render(){
    renderStats();
    const filtered = visibleItems();
    $("clear-area-filter").hidden = activeArea === "all";
    $("work-heading").textContent = activeArea === "all" ? "Your Captured Items" : activeArea;
    $("work-subtitle").textContent = activeArea === "all" ? "Your saved thoughts, tasks, products, and reference points." : "Everything captured for " + activeArea + ".";
    const list = $("items-list");
    list.innerHTML = filtered.map(item => {
      const statusClass = item.status === "Blocked" ? "blocked" : item.status === "Completed" ? "completed" : item.status === "Waiting" ? "waiting" : "";
      const meta = [item.project ? "Project: " + item.project : "",item.category ? "Category: " + item.category : "",item.due ? "Due " + dateLabel(item.due) : "",item.createdAt ? "Added " + dateLabel(item.createdAt.slice(0,10)) : ""].filter(Boolean);
      const editor = editingId === item.id ? '<form class="item-editor" data-edit-form="' + esc(item.id) + '"><label>Title<input name="title" maxlength="240" required value="' + esc(item.title) + '"></label><div class="editor-grid"><label>Type<select name="type">' + TYPES.map(t => '<option' + (t === item.type ? " selected" : "") + '>' + esc(t) + '</option>').join("") + '</select></label><label>Business / Area<select name="area">' + AREAS.map(a => '<option value="' + esc(a) + '"' + (a === item.area ? " selected" : "") + '>' + esc(a) + '</option>').join("") + '</select></label><label>Category<input name="category" maxlength="80" value="' + esc(item.category) + '"></label><label>Project<input name="project" maxlength="120" value="' + esc(item.project) + '"></label><label>Status<select name="status">' + STATUSES.map(s => '<option' + (s === item.status ? " selected" : "") + '>' + esc(s) + '</option>').join("") + '</select></label><label>Due date<input name="due" type="date" value="' + esc(item.due) + '"></label></div><label>Notes<textarea name="notes" rows="3" maxlength="4000">' + esc(item.notes) + '</textarea></label><label>Related link<input name="link" type="url" value="' + esc(item.link) + '" placeholder="https://…"></label><div class="editor-actions"><button class="primary-button" type="submit">Save Changes</button><button class="outline-button" type="button" data-action="cancel-edit" data-id="' + esc(item.id) + '">Cancel</button></div></form>' : "";
      return '<article class="item-card" data-id="' + esc(item.id) + '"><div class="item-main"><div class="item-topline"><span class="item-type">' + esc(item.type || "Note") + '</span><span class="item-area">' + esc(item.area || "Other / Ideas") + '</span><span class="status-pill ' + statusClass + '">' + esc(item.status || "Inbox") + '</span></div><h3 class="item-title">' + esc(item.title) + '</h3>' + (meta.length ? '<div class="item-meta">' + meta.map(m => '<span>' + esc(m) + '</span>').join("") + '</div>' : "") + (item.notes ? '<p class="item-notes">' + esc(item.notes) + '</p>' : "") + (item.link ? '<a class="item-link" href="' + esc(item.link) + '" target="_blank" rel="noopener noreferrer">↗ Open related link</a>' : "") + '</div><div class="item-controls"><label class="sr-only" for="status-' + esc(item.id) + '">Change status</label><select id="status-' + esc(item.id) + '" data-action="status" data-id="' + esc(item.id) + '">' + STATUSES.map(s => '<option' + (s === item.status ? " selected" : "") + '>' + esc(s) + '</option>').join("") + '</select><button type="button" data-action="edit" data-id="' + esc(item.id) + '">Edit</button><button type="button" data-action="archive" data-id="' + esc(item.id) + '" title="Archive this item; preserve it in your history">' + (item.status === "Archived" ? "Keep" : "Archive") + '</button></div>' + editor + '</article>';
    }).join("");
    $("empty-state").classList.toggle("show", filtered.length === 0);
    $("empty-state").querySelector("h3").textContent = items.length === 0 ? "Your workspace is ready." : "No items match this view.";
    $("empty-state").querySelector("p").textContent = items.length === 0 ? "Capture your first thought above, or choose a company area to get started." : "Try another search or filter. Your saved items have not been deleted.";
  }
  function setArea(area){
    activeArea = area;
    document.querySelectorAll("[data-area]").forEach(el => el.classList.toggle("selected", el.dataset.area === area));
    $("work-section")?.scrollIntoView({behavior:"smooth",block:"start"});
    render();
  }
  function addItem(event){
    event.preventDefault();
    const title = $("capture-title").value.trim();
    if(!title) { $("capture-title").focus(); return; }
    const item = {
      id: makeId(), title, type: $("capture-type").value,
      area: $("capture-area").value || "Other / Ideas",
      category: $("capture-category").value.trim(),
      project: $("capture-project").value.trim(),
      notes: $("capture-notes").value.trim(),
      link: $("capture-link").value.trim(),
      due: $("capture-due").value,
      status: "Inbox", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    items.unshift(item);
    if(!persist()) { items.shift(); return; }
    $("capture-form").reset();
    $("capture-area").value = item.area;
    $("capture-title").focus();
    activeArea = "all";
    render();
  }
  function exportBackup(){
    const backup = {format:"JungleStarCompanyOrganizer",version:2,exportedAt:new Date().toISOString(),areas:AREAS.filter(a => !DEFAULT_AREAS.includes(a)),items};
    const blob = new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "jungle-star-company-organizer-backup-" + today() + ".json";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  async function importBackup(file){
    if(!file) return;
    try {
      const data = JSON.parse(await file.text());
      const incoming = Array.isArray(data) ? data : data.items;
      if(!Array.isArray(incoming)) throw new Error("This file does not contain an organizer item list.");
      if(!Array.isArray(data) && Array.isArray(data.areas)) {
        data.areas.forEach(rawArea => {
          if(typeof rawArea === "string") {
            const name = rawArea.trim().slice(0,70);
            if(name && !AREAS.some(a => a.toLowerCase() === name.toLowerCase())) AREAS.push(name);
          }
        });
        saveCustomAreas(); renderCustomAreas(); setupAreaSelect();
      }
      let added = 0;
      const known = new Set(items.map(x => x.id));
      incoming.forEach(raw => {
        if(!raw || !raw.title) return;
        const item = {
          id: String(raw.id || makeId()), title: String(raw.title).slice(0,240),
          type: TYPES.includes(raw.type) ? raw.type : "Note",
          area: (typeof raw.area === "string" && raw.area.trim()) ? raw.area.trim().slice(0,70) : "Other / Ideas",
          category: String(raw.category || "").slice(0,80), project: String(raw.project || "").slice(0,120),
          notes: String(raw.notes || "").slice(0,4000), link: String(raw.link || ""),
          due: String(raw.due || ""), status: STATUSES.includes(raw.status) ? raw.status : "Inbox",
          createdAt: raw.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString()
        };
        if(known.has(item.id)) item.id = makeId();
        known.add(item.id); items.push(item); added++;
      });
      persist();
      renderCustomAreas(); setupAreaSelect(); render();
      alert("Restore complete: " + added + " item(s) imported. Existing items were preserved.");
    } catch(e) { alert("Could not restore this backup: " + e.message); }
    $("import-data").value = "";
  }
  function handleListAction(event){
    const target = event.target.closest("[data-action]");
    if(!target) return;
    const item = items.find(x => x.id === target.dataset.id);
    if(target.dataset.action === "cancel-edit") { editingId = ""; render(); return; }
    if(!item) return;
    if(target.dataset.action === "edit") { editingId = item.id; render(); return; }
    if(target.dataset.action === "status") {
      if(!STATUSES.includes(target.value)) return;
      item.status = target.value; item.updatedAt = new Date().toISOString(); persist();
    } else if(target.dataset.action === "archive") {
      item.status = item.status === "Archived" ? "Inbox" : "Archived";
      item.updatedAt = new Date().toISOString(); persist();
    }
  }
  function saveEditedItem(event){
    const form = event.target.closest("[data-edit-form]");
    if(!form) return;
    event.preventDefault();
    const item = items.find(x => x.id === form.dataset.editForm);
    if(!item) return;
    const data = new FormData(form), title = String(data.get("title") || "").trim();
    if(!title) { form.elements.title.focus(); return; }
    item.title=title.slice(0,240); item.type=TYPES.includes(data.get("type"))?data.get("type"):"Note";
    item.area=String(data.get("area")||"Other / Ideas").slice(0,70); item.category=String(data.get("category")||"").trim().slice(0,80);
    item.project=String(data.get("project")||"").trim().slice(0,120); item.status=STATUSES.includes(data.get("status"))?data.get("status"):"Inbox";
    item.due=String(data.get("due")||""); item.notes=String(data.get("notes")||"").trim().slice(0,4000); item.link=String(data.get("link")||"").trim();
    item.updatedAt=new Date().toISOString(); editingId=""; persist();
  }
  function initialize(){
    const client = window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    client.auth.getSession().then(({data,error}) => {
      if(error || !data?.session?.user) {
        window.location.replace("/jungle-star-command/login/");
        return;
      }
      userId = data.session.user.id;
      storageKey = "jsc_company_organizer_v1_" + userId;
      customAreasKey = "jsc_company_organizer_areas_v1_" + userId;
      const name = data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name || data.session.user.email || "Private workspace";
      $("user-label").textContent = name;
      loadItems(); setupAreaSelect(); renderCustomAreas();
      $("auth-gate").hidden = true; $("organizer-app").hidden = false;
      render();
    }).catch(() => window.location.replace("/jungle-star-command/login/"));
    client.auth.onAuthStateChange((event,session) => {
      if(event === "SIGNED_OUT" || !session?.user) window.location.replace("/jungle-star-command/login/");
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    $("capture-form").addEventListener("submit", addItem);
    $("workspace-form").addEventListener("submit", addWorkspace);
    $("items-list").addEventListener("change", handleListAction);
    $("items-list").addEventListener("click", handleListAction);
    $("items-list").addEventListener("submit", saveEditedItem);
    ["search-items","filter-status","filter-type"].forEach(id => $(id).addEventListener(id === "search-items" ? "input" : "change", render));
    document.addEventListener("click", event => {
      const area = event.target.closest("[data-area]");
      if(!area) return;
      activeArea = activeArea === area.dataset.area ? "all" : area.dataset.area;
      document.querySelectorAll("[data-area]").forEach(node => node.classList.toggle("selected", node.dataset.area === activeArea));
      render(); $("your-work").scrollIntoView({behavior:"smooth",block:"start"});
    });
    $("show-tasks").addEventListener("click", () => {
      const button=$("show-tasks"), isTaskView=$("filter-type").value==="Task";
      $("filter-type").value=isTaskView?"all":"Task";
      button.setAttribute("aria-pressed",String(!isTaskView));
      button.textContent=isTaskView?"Tasks only":"Showing tasks · Show all types";
      render(); $("your-work").scrollIntoView({behavior:"smooth",block:"start"});
    });
    $("clear-area-filter").addEventListener("click", () => {activeArea="all";document.querySelectorAll("[data-area]").forEach(node=>node.classList.remove("selected"));render();});
    $("export-data").addEventListener("click", exportBackup);
    $("import-data").addEventListener("change", e => importBackup(e.target.files?.[0]));
    $("empty-capture").addEventListener("click", () => {$("capture-title").focus();$("quick-capture").scrollIntoView({behavior:"smooth",block:"center"});});
    initialize();
  });
})();