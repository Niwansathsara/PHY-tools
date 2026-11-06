import { isFirebaseConfigured, db, auth, watchAuth, isAdminUser, signInGoogle, signOutUser, collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "./firebase.js";

const $ = id => document.getElementById(id);
const gate = $("authGate"), adminApp = $("adminApp");
let currentAdmin = null, baseUnits = [], units = [], unitDocs = new Map(), customTools = [], editingUnitId = null, editingTool = null, statsTimer = null;
const toast = message => { const el=$("toast"); el.textContent=message; el.classList.add("show"); clearTimeout(window.__phyToast); window.__phyToast=setTimeout(()=>el.classList.remove("show"),2800); };
const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slug = value => String(value||"").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70);

function showGate(message, title="Admin access") { gate.hidden=false; adminApp.hidden=true; $("gateTitle").textContent=title; $("gateStatus").textContent=message; $("signOutBtn").hidden=!(auth?.currentUser); }
function showAdmin(user) { currentAdmin=user; gate.hidden=true; adminApp.hidden=false; $("signOutBtn").hidden=false; }

async function loadData() {
  const [unitSnap, toolSnap, catalogResponse] = await Promise.all([getDocs(collection(db,"units")), getDocs(collection(db,"customTools")), fetch("data/catalog.json",{cache:"no-store"})]);
  if (!catalogResponse.ok) throw new Error("Could not load the built-in syllabus catalogue.");
  const base = await catalogResponse.json(); baseUnits = base.units || [];
  unitDocs = new Map(unitSnap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
  const merged = new Map(baseUnits.map(u=>[u.id,{...u}]));
  for (const [id,override] of unitDocs) merged.set(id,{...(merged.get(id)||{}),...override,id});
  units = [...merged.values()];
  customTools = toolSnap.docs.map(d=>({id:d.id,...d.data()}));
  renderAdminLists();
}

function renderAdminLists() {
  $("toolUnit").innerHTML=units.map(u=>`<option value="${safe(u.id)}">${safe(u.name)}</option>`).join("");
  $("unitList").innerHTML=units.map(u=>{const isBase=baseUnits.some(b=>b.id===u.id);const hasOverride=unitDocs.has(u.id);return `<div class="admin-item"><div><b>${safe(u.name)}</b><small>${safe(u.id)}${isBase?" · Built-in unit":" · Additional unit"}</small></div><div class="actions"><button class="btn" type="button" data-edit-unit="${safe(u.id)}">Edit</button><button class="btn danger" type="button" data-remove-unit="${safe(u.id)}">${isBase?(hasOverride?"Reset":"Reset"):"Delete"}</button></div></div>`;}).join("");
  $("editTool").innerHTML='<option value="">Create a new simulation</option>'+customTools.map(t=>`<option value="${safe(t.id)}">${safe(t.title)}</option>`).join("");
  $("customToolList").innerHTML=customTools.map(t=>`<div class="admin-item"><div><b>${safe(t.title)}</b><small>${safe(units.find(u=>u.id===t.unitId)?.name||t.unitName||t.unitId||"Unit")}</small></div><div class="actions"><button class="btn" type="button" data-edit-tool="${safe(t.id)}">Edit</button><button class="btn danger" type="button" data-delete-tool="${safe(t.id)}">Delete</button></div></div>`).join("")||'<div class="status">No additional simulations uploaded yet.</div>';
  document.querySelectorAll("[data-edit-unit]").forEach(b=>b.addEventListener("click",()=>editUnit(b.dataset.editUnit)));
  document.querySelectorAll("[data-remove-unit]").forEach(b=>b.addEventListener("click",()=>removeUnit(b.dataset.removeUnit)));
  document.querySelectorAll("[data-edit-tool]").forEach(b=>b.addEventListener("click",()=>loadToolForEdit(b.dataset.editTool)));
  document.querySelectorAll("[data-delete-tool]").forEach(b=>b.addEventListener("click",()=>removeTool(b.dataset.deleteTool)));
}

function editUnit(id) { const u=units.find(x=>x.id===id); if(!u)return; editingUnitId=id; $("unitName").value=u.name||""; $("unitShort").value=u.short||""; $("unitIcon").value=u.icon||"📘"; $("saveUnitBtn").textContent="Update unit"; $("unitStatus").textContent=`Editing ${u.name}. Save to apply this change to the public library.`; window.scrollTo({top:0,behavior:"smooth"}); }
async function removeUnit(id) {
  const isBuiltIn=baseUnits.some(u=>u.id===id);
  if(isBuiltIn) { if(!unitDocs.has(id))return toast("This built-in unit is already at its original settings."); if(!confirm("Reset this built-in unit to its original name and description?"))return; }
  else { if(customTools.some(t=>t.unitId===id))return toast("Move or delete its uploaded tools before deleting this unit."); if(!confirm("Delete this additional syllabus unit?"))return; }
  try { await deleteDoc(doc(db,"units",id)); if(editingUnitId===id)clearUnitForm(); toast(isBuiltIn?"Built-in unit reset.":"Unit deleted."); await loadData(); }
  catch(e){console.error(e);toast("Could not remove the unit. Check Firestore rules.");}
}
function clearUnitForm(){editingUnitId=null;$("unitForm").reset();$("unitIcon").value="📘";$("saveUnitBtn").textContent="Add unit";$("unitStatus").textContent="Built-in syllabus units can be edited; deleting an override restores its original details.";}
$("unitForm").addEventListener("submit",async e=>{
  e.preventDefault(); const name=$("unitName").value.trim(); if(!name)return toast("Enter a unit name.");
  const id=editingUnitId||(slug(name)||`unit-${Date.now()}`);
  if(!editingUnitId&&units.some(u=>u.id===id))return toast("A unit with that name already exists.");
  const isBase=baseUnits.some(u=>u.id===id);
  const payload={name,short:$("unitShort").value.trim(),icon:$("unitIcon").value.trim()||"📘",custom:!isBase,updatedAt:serverTimestamp()};
  try{await setDoc(doc(db,"units",id),{...payload,...(!unitDocs.has(id)?{createdAt:serverTimestamp()}: {})},{merge:true});clearUnitForm();toast("Unit saved.");await loadData();}
  catch(err){console.error(err);toast("Could not save the unit. Check Firestore rules.");}
});
$("clearUnitBtn").addEventListener("click",clearUnitForm);

function loadToolForEdit(id) {
  editingTool=customTools.find(t=>t.id===id)||null; if(!editingTool)return;
  $("toolTitle").value=editingTool.title||""; $("toolUnit").value=editingTool.unitId||units[0]?.id||""; $("toolFormula").value=editingTool.formula||""; $("toolDescription").value=editingTool.description||""; $("toolFile").value=""; $("saveToolBtn").textContent="Update simulation"; $("toolStatus").textContent="Editing an uploaded simulation. Select a new HTML file only if you want to replace the existing file."; window.scrollTo({top:0,behavior:"smooth"});
}
function clearToolForm(){editingTool=null;$("toolForm").reset();$("editTool").value="";$("saveToolBtn").textContent="Save simulation";$("toolStatus").textContent="Uploaded simulations appear in the public library without requiring visitor login.";}
$("editTool").addEventListener("change",e=>{if(e.target.value)loadToolForEdit(e.target.value);else clearToolForm();});
$("clearToolBtn").addEventListener("click",clearToolForm);
$("toolForm").addEventListener("submit",async e=>{
  e.preventDefault(); const title=$("toolTitle").value.trim(), unitId=$("toolUnit").value, file=$("toolFile").files[0];
  if(!title||!unitId)return toast("Enter a title and choose a syllabus unit.");
  if(file&&(!file.name.toLowerCase().endsWith(".html")&&file.type!=="text/html"))return toast("Choose an HTML file.");
  if(file&&file.size>800*1024)return toast("HTML file must be smaller than 800 KB.");
  if(!editingTool&&!file)return toast("Choose an HTML simulation file.");
  const id=editingTool?.id||(slug(title)||`custom-${Date.now()}`);
  if(!editingTool&&customTools.some(t=>t.id===id))return toast("A tool with that title already exists.");
  try{
    if(file){const source=await file.text();await setDoc(doc(db,"customToolFiles",id),{html:source,updatedAt:serverTimestamp()});}
    const selected=units.find(u=>u.id===unitId);
    const record={title,unitId,unitName:selected?.name||"",formula:$("toolFormula").value.trim(),description:$("toolDescription").value.trim(),hasHtml:true,updatedAt:serverTimestamp()};
    if(editingTool)await updateDoc(doc(db,"customTools",id),record);else await setDoc(doc(db,"customTools",id),{...record,createdAt:serverTimestamp()});
    toast(editingTool?"Simulation updated.":"Simulation added.");clearToolForm();await loadData();
  }catch(err){console.error(err);toast("Could not save the simulation. Check Firestore rules and file size.");}
});
async function removeTool(id){
  if(!confirm("Delete this uploaded simulation and its HTML file? This cannot be undone."))return;
  try{await Promise.all([deleteDoc(doc(db,"customTools",id)),deleteDoc(doc(db,"customToolFiles",id))]);if(editingTool?.id===id)clearToolForm();toast("Simulation deleted.");await loadData();}
  catch(e){console.error(e);toast("Could not delete this simulation. Check Firestore rules.");}
}

async function refreshStats(){
  $("statsStatus").textContent="Refreshing visitor statistics…";
  try{
    const [presenceSnap,visitorSnap]=await Promise.all([getDocs(collection(db,"sitePresence")),getDocs(collection(db,"siteVisitors"))]);
    const now=Date.now(),online=presenceSnap.docs.filter(d=>{const ts=d.data().lastSeenAt;return ts&&typeof ts.toMillis==="function"&&(now-ts.toMillis())<=90000;}).length;
    $("onlineNow").textContent=String(online);$("totalVisitors").textContent=String(visitorSnap.size);
    $("statsStatus").textContent=`Updated ${new Date().toLocaleTimeString()} · Online users are browsers active in the last 90 seconds.`;
  }catch(e){console.error(e);$("statsStatus").textContent="Could not read statistics. Check that the Firestore rules below are published.";}
}
$("refreshStats").addEventListener("click",refreshStats);
$("googleSignInBtn").addEventListener("click",async()=>{
  const btn=$("googleSignInBtn");btn.disabled=true;btn.textContent="Connecting to Google…";
  try{await signInGoogle();}catch(e){console.error(e);$("gateStatus").textContent=e.message||"Google sign-in failed. Check Firebase Authentication settings.";}
  finally{btn.disabled=false;btn.textContent="Continue with Google";}
});
$("signOutBtn").addEventListener("click",async()=>{try{await signOutUser();showGate("Signed out.");}catch(e){toast("Could not sign out.");}});

if(!isFirebaseConfigured||!auth||!db){showGate("Firebase configuration is missing. Check js/firebase-config.js.");$("googleSignInBtn").disabled=true;}
else{
  watchAuth(async user=>{
    if(!user){if(statsTimer){clearInterval(statsTimer);statsTimer=null;}showGate("Sign in with the authorised Google account to manage the library.");return;}
    if(!isAdminUser(user)){showGate(`This account (${user.email||"anonymous"}) is not authorised. Use the verified administrator Google account.` ,"Administrator access required");return;}
    showAdmin(user);
    try{await loadData();await refreshStats();if(statsTimer)clearInterval(statsTimer);statsTimer=setInterval(refreshStats,30000);}
    catch(e){console.error(e);toast("Could not load admin data. Check Firestore rules and catalog.json.");}
  });
}
function applyAdminLanguage(language){
  const lang=language==='si'?'si':'en';document.documentElement.lang=lang;
  document.querySelectorAll('[data-en][data-si]').forEach(el=>{el.textContent=el.dataset[lang==='si'?'si':'en'];});
  $("adminLangToggle").textContent=lang==='en'?'සිංහල':'English';
  if($("saveUnitBtn"))$("saveUnitBtn").textContent=editingUnitId?(lang==='si'?'ඒකකය යාවත්කාලීන කරන්න':'Update unit'):(lang==='si'?'ඒකකය එක් කරන්න':'Add unit');
  if($("saveToolBtn"))$("saveToolBtn").textContent=editingTool?(lang==='si'?'Simulation යාවත්කාලීන කරන්න':'Update simulation'):(lang==='si'?'Simulation සුරකින්න':'Save simulation');
}
$("adminLangToggle").addEventListener("click",()=>{const current=document.documentElement.lang==='si'?'en':'si';try{localStorage.setItem('phy-lang',current)}catch(e){}applyAdminLanguage(current);});
try{applyAdminLanguage(localStorage.getItem('phy-lang')==='si'?'si':'en')}catch(e){applyAdminLanguage('en')}
