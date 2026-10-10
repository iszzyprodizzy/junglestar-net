(() => {
  "use strict";
  const SUPABASE_URL = "https://xfknuiuqzihtgodnybwv.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GEtDFPOEv3WS2vo76wBd-g_7BgGEPQ";
  const AREAS = ["Great Food Fight","JW Comics","Jungle Star Publishing","Soap Station","Construction / HQ","Vox News","Academy & Community","Other / Ideas"];
  const STATUSES = ["Inbox","Ready","In Progress","Blocked","Waiting","Completed","Archived"];
  const TYPES = ["Task","Idea","Note","Product","Document","Link","Purchase","Book"];
  const areaIds = {"Great Food Fight":"gff","JW Comics":"jw","Jungle Star Publishing":"pub","Soap Station":"soap","Construction / HQ":"construction","Vox News":"vox","Academy & Community":"academy","Other / Ideas":"other"};
  const $ = id => document.getElementById(id);
  let userId = "";
  let items = [];
  let activeArea = "all";
  let storageKey = "";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const today = () => new Date().toISOString().slice(0,10);
  const makeId = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "item-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  function loadItems(){
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
      items = Array.isArray(parsed) ? parsed.filter(x => x && x.id && x.title) : [];
    } catch (e) { items = []; }
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
    $("stat-active").textContent = items.filter(x => ["Inbox","Ready","In Progress","Blocked","Waiting"].includes(x.status)).length;
    $("stat-done").textContent = items.filter(x => x.status === "Completed").length;
    AREAS.forEach(area => {
      const el = $("count-" + areaIds[area]);
      if(el) {
        const count = items.filter(x => x.area === area).length;
        el.textContent = count + (count === 1 ? " item" : " items");
      }
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
      return '<article class="item-card" data-id="' + esc(item.id) + '"><div class="item-main"><div class="item-topline"><span class="item-type">' + esc(item.type || "Note") + '</span><span class="item-area">' + esc(item.area || "Other / Ideas") + '</span><span class="status-pill ' + statusClass + '">' + esc(item.status || "Inbox") + '</span></div><h3 class="item-title">' + esc(item.title) + '</h3>' + (meta.length ? '<div class="item-meta">' + meta.map(m => '<span>' + esc(m) + '</span>').join("") + '</div>' : "") + (item.notes ? '<p class="item-notes">' + esc(item.notes) + '</p>' : "") + (item.link ? '<a class="item-link" href="' + esc(item.link) + '" target="_blank" rel="noopener noreferrer">↗ Open related link</a>' : "") + '</div><div class="item-controls"><label class="sr-only" for="status-' + esc(item.id) + '">Change status</label><select id="status-' + esc(item.id) + '" data-action="status" data-id="' + esc(item.id) + '">' + STATUSES.map(s => '<option' + (s === item.status ? " selected" : "") + '>' + esc(s) + '</option>').join("") + '</select><button type="button" data-action="archive" data-id="' + esc(item.id) + '" title="Archive this item; preserve it in your history">' + (item.status === "Archived" ? "Keep" : "Archive") + '</button></div></article>';
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
          area: AREAS.includes(raw.area) ? raw.area : "Other / Ideas",
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
    if(!item) return;
    if(target.dataset.action === "status") {
      if(!STATUSES.includes(target.value)) return;
      item.status = target.value; item.updatedAt = new Date().toISOString(); persist();
    } else if(target.dataset.action === "archive") {
      item.status = item.status === "Archived" ? "Inbox" : "Archived";
      item.updatedAt = new Date().toISOString(); persist();
    }
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
      const name = data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name || data.session.user.email || "Private workspace";
      $("user-label").textContent = name;
      loadItems(); setupAreaSelect();
      $("auth-gate").hidden = true; $("organizer-app").hidden = false;
      render();
    }).catch(() => window.location.replace("/jungle-star-command/login/"));
    client.auth.onAuthStateChange((event,session) => {
      if(event === "SIGNED_OUT" || !session?.user) window.location.replace("/jungle-star-command/login/");
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    $("capture-form").addEventListener("submit", addItem);
    $("items-list").addEventListener("change", handleListAction);
    $("items-list").addEventListener("click", handleListAction);
    ["search-items","filter-status","filter-type"].forEach(id => $(id).addEventListener(id === "search-items" ? "input" : "change", render));
    document.querySelectorAll("[data-area]").forEach(el => el.addEventListener("click", () => {
      activeArea = activeArea === el.dataset.area ? "all" : el.dataset.area;
      document.querySelectorAll("[data-area]").forEach(node => node.classList.toggle("selected", node.dataset.area === activeArea));
      render();
      $("your-work").scrollIntoView({behavior:"smooth",block:"start"});
    }));
    $("clear-area-filter").addEventListener("click", () => {activeArea="all";document.querySelectorAll("[data-area]").forEach(node=>node.classList.remove("selected"));render();});
    $("export-data").addEventListener("click", exportBackup);
    $("import-data").addEventListener("change", e => importBackup(e.target.files?.[0]));
    $("empty-capture").addEventListener("click", () => {$("capture-title").focus();$("quick-capture").scrollIntoView({behavior:"smooth",block:"center"});});
    initialize();
  });
})();