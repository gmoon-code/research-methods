window.RMSPilot = (() => {
  const VERSION="2.0.1-rc1";
  const BASELINE_ID="RMS-PILOT-BASELINE-v2.0";
  const RECOVERY_SUFFIX="_recovery_v2";
  const META_SUFFIX="_pilot_meta_v2";
  const ONBOARD_KEY="rms_v2_onboarding_seen";
  let lastStatus={ok:true,time:null,message:"Not saved yet"};
  function lsGet(key){try{return localStorage.getItem(key)}catch{return null}}
  function lsSet(key,value){try{localStorage.setItem(key,value);return true}catch{return false}}
  function lsRemove(key){try{localStorage.removeItem(key);return true}catch{return false}}

  function normalizeProject(p){
    p.pilot=p.pilot||{};
    const x=p.pilot;
    x.softwareVersion=x.softwareVersion||VERSION;
    x.baselineId=x.baselineId||"";
    x.pilotStartedAt=x.pilotStartedAt||"";
    x.config=x.config||{};
    x.runtimeEvents=x.runtimeEvents||[];
    x.restoreHistory=x.restoreHistory||[];
    return p;
  }
  function bytes(s){return new Blob([String(s||"")]).size}
  function stableHash(str){let h=2166136261;str=String(str||"");for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,"0")}
  function emit(status){lastStatus=status;try{window.dispatchEvent(new CustomEvent("rms-save-status",{detail:status}))}catch{}}
  function safeSave(key,project){
    normalizeProject(project); const raw=JSON.stringify(project),now=new Date().toISOString();
    try{
      const metaKey=key+META_SUFFIX,recoveryKey=key+RECOVERY_SUFFIX;
      let meta={};try{meta=JSON.parse(localStorage.getItem(metaKey)||"{}")||{}}catch{}
      const prev=localStorage.getItem(key),lastRecovery=meta.lastRecovery?new Date(meta.lastRecovery).getTime():0;
      if(prev && Date.now()-lastRecovery>5*60*1000 && bytes(prev)<2_500_000){
        try{localStorage.setItem(recoveryKey,prev);meta.lastRecovery=now}catch{}
      }
      localStorage.setItem(key,raw);
      meta.lastSavedAt=now;meta.bytes=bytes(raw);meta.version=VERSION;localStorage.setItem(metaKey,JSON.stringify(meta));
      emit({ok:true,time:now,message:"Saved locally",bytes:meta.bytes});return {ok:true,...meta};
    }catch(err){emit({ok:false,time:now,message:`Save failed: ${err?.message||err}`});return {ok:false,error:String(err?.message||err)}}
  }
  function safeLoad(key){
    let primary=null,recovery=null,error="";
    try{const raw=localStorage.getItem(key);if(raw)primary=JSON.parse(raw)}catch(e){error=String(e?.message||e)}
    if(primary)return {project:normalizeProject(primary),source:"primary",error:""};
    try{const raw=localStorage.getItem(key+RECOVERY_SUFFIX);if(raw)recovery=JSON.parse(raw)}catch(e){error+=(error?"; ":"")+String(e?.message||e)}
    return {project:recovery?normalizeProject(recovery):null,source:recovery?"recovery":"none",error};
  }
  function storageReport(key){
    let available=true,error="";try{const t="__rms_storage_test__";localStorage.setItem(t,"1");localStorage.removeItem(t)}catch(e){available=false;error=String(e?.message||e)}
    let meta={};try{meta=JSON.parse(lsGet(key+META_SUFFIX)||"{}")||{}}catch{}
    const primary=lsGet(key)||"",recovery=lsGet(key+RECOVERY_SUFFIX)||"";
    return {available,error,primaryBytes:bytes(primary),recoveryBytes:bytes(recovery),lastSavedAt:meta.lastSavedAt||"",lastRecovery:meta.lastRecovery||"",lastStatus};
  }
  function clone(x){return JSON.parse(JSON.stringify(x))}
  function privacyCopy(project){
    const p=clone(project);normalizeProject(p);
    if(p.analysis){p.analysis.rawData=[];p.analysis.fileName=p.analysis.fileName?"[omitted from privacy copy]":""}
    if(p.writing?.sections)for(const k of Object.keys(p.writing.sections))p.writing.sections[k]="[full manuscript omitted]";
    if(Array.isArray(p.sources))p.sources=p.sources.map(s=>({id:s.id,citation:s.citation,title:s.title,authors:s.authors,year:s.year,screeningStatus:s.screeningStatus,verified:s.verified,themes:s.themes,themeEvidence:s.themeEvidence}));
    return p;
  }
  function backupEnvelope(project,mode="full"){
    const body=mode==="privacy"?privacyCopy(project):clone(project),payload=JSON.stringify(body);
    return {packet_type:"rms_project_backup",version:"2.0",mode,created_at:new Date().toISOString(),baseline_id:BASELINE_ID,checksum_fingerprint:stableHash(payload),project:body,
      warning:mode==="full"?"Full recovery backup may contain raw data, source notes, and manuscript text. Store it according to school/privacy requirements.":"Privacy-minimized copy is not a complete recovery backup."};
  }
  function validateBackup(packet){
    if(packet?.packet_type==="rms_project_backup"&&packet.version==="2.0"&&packet.project){
      const fp=stableHash(JSON.stringify(packet.project)),ok=fp===packet.checksum_fingerprint,mode=packet.mode||"full";
      return {ok,project:ok?normalizeProject(packet.project):null,mode,legacy:false,restorable:ok&&mode!=="privacy",error:ok&&mode==="privacy"?"Privacy-minimized copies intentionally omit raw data and manuscript text and cannot be used as recovery backups.":ok?"":"Backup integrity fingerprint does not match."};
    }
    if(packet && typeof packet==="object" && (packet.data||packet.ready||packet.name))return {ok:true,project:normalizeProject(packet),mode:"legacy-full",legacy:true,restorable:true};
    return {ok:false,restorable:false,error:"File is not a recognized Research Methods Studio project backup."};
  }
  function clearProjectStorage(key,{clearOnboarding=true}={}){
    const removed={primary:lsRemove(key),recovery:lsRemove(key+RECOVERY_SUFFIX),meta:lsRemove(key+META_SUFFIX),onboarding:true};
    if(clearOnboarding)removed.onboarding=lsRemove(ONBOARD_KEY);
    return removed;
  }
  function featureAccess(project,feature){
    normalizeProject(project);
    const started=!!project.pilot.baselineId;
    if(!started)return {allowed:true,reason:"Pilot baseline has not been started."};
    const c=project.pilot.config||{};
    if(feature==="ai"){
      if(c.aiPolicy==="secure-approved-backend")return {allowed:true,reason:"Pilot policy permits only the approved secure AI backend."};
      return {allowed:false,reason:"AI is disabled by the frozen classroom pilot policy for this project."};
    }
    if(feature==="public-transfer"){
      if(c.transferPolicy==="classroom-practice")return {allowed:true,reason:"Public transfer bank is enabled for classroom practice."};
      if(c.transferPolicy==="private-evaluation-bank")return {allowed:false,reason:"The public transfer bank is disabled to avoid exposing or contaminating the separate private evaluation workflow."};
      return {allowed:false,reason:"Transfer tasks are disabled by the frozen classroom pilot policy for this project."};
    }
    return {allowed:true,reason:"No pilot restriction applies."};
  }
  function backupFilename(project,mode="full"){
    const stem=String(project?.name||"research-project").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,42)||"research-project";
    const stamp=new Date().toISOString().replace(/[:.]/g,"-");
    return `${stem}-${mode==="privacy"?"privacy-copy":"full-backup"}-${stamp}.json`;
  }
  function applyRestore(current,restored){
    const p=normalizeProject(restored);p.pilot.restoreHistory.push({time:new Date().toISOString(),fromVersion:current?.pilot?.softwareVersion||"unknown",restoredVersion:p.pilot.softwareVersion||"unknown"});return p;
  }
  function readiness(project,key){
    normalizeProject(project);const c=project.pilot.config||{},storage=storageReport(key),checks=[];
    const add=(id,label,ok,critical=true,note="")=>checks.push({id,label,ok:!!ok,critical,note});
    add("storage","Browser local storage works",storage.available,true,storage.error);
    add("alias","Student naming/privacy convention selected",c.identityPolicy==="alias"||c.identityPolicy==="school-approved",true,"Use aliases/project codes unless school policy explicitly requires identifiable names.");
    add("backup","Backup cadence defined",!!c.backupCadence,true,"A static browser app needs an explicit backup routine.");
    add("teacher","Teacher checkpoint process defined",!!c.teacherReviewProcess,true);
    add("ethics","Human-participant/ethics escalation process acknowledged",c.ethicsProcess===true,true);
    add("data","Raw-data storage location defined",!!c.rawDataLocation,true);
    add("ai","AI policy selected",["disabled","secure-approved-backend"].includes(c.aiPolicy),true,"Do not place provider keys in browser code.");
    add("transfer","Transfer-bank use defined",["classroom-practice","disabled","private-evaluation-bank"].includes(c.transferPolicy),false);
    add("freeze","Measurement baseline freeze acknowledged",c.freezeAcknowledged===true,true,"Pilot measurement rules should not change mid-pilot without a documented deviation/version change.");
    const critical=checks.filter(x=>x.critical&&!x.ok).length,warnings=checks.filter(x=>!x.critical&&!x.ok).length;
    return {checks,critical,warnings,ready:critical===0,storage,baselineId:BASELINE_ID,softwareVersion:VERSION};
  }
  function startPilot(project,key){const r=readiness(project,key);if(!r.ready)throw new Error("Resolve critical pilot-readiness items first.");normalizeProject(project);project.pilot.baselineId=BASELINE_ID;project.pilot.pilotStartedAt=project.pilot.pilotStartedAt||new Date().toISOString();project.pilot.softwareVersion=VERSION;return project.pilot}
  function baselineStatus(project){normalizeProject(project);return {expected:BASELINE_ID,projectBaseline:project.pilot.baselineId||"not started",matches:!project.pilot.baselineId||project.pilot.baselineId===BASELINE_ID,startedAt:project.pilot.pilotStartedAt||""}}
  function logRuntime(project,type,detail){normalizeProject(project);const e={time:new Date().toISOString(),type,detail:String(detail||"")};project.pilot.runtimeEvents.push(e);if(project.pilot.runtimeEvents.length>100)project.pilot.runtimeEvents=project.pilot.runtimeEvents.slice(-100);return e}
  function enhanceAccessibility(){
    const obs=new MutationObserver(()=>{document.querySelectorAll(".modal-backdrop .modal").forEach(m=>{if(!m.hasAttribute("role")){m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("tabindex","-1");const h=m.querySelector("h3,h2");if(h&&!h.id)h.id="dialog-title-"+Math.random().toString(36).slice(2,8);if(h)m.setAttribute("aria-labelledby",h.id)}})});obs.observe(document.body,{childList:true,subtree:true});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"){const xs=[...document.querySelectorAll(".modal-backdrop")];const top=xs[xs.length-1];if(top)top.remove()}});
  }
  function onboardingSeen(){return lsGet(ONBOARD_KEY)==="1"}
  function markOnboardingSeen(){return lsSet(ONBOARD_KEY,"1")}
  return {VERSION,BASELINE_ID,normalizeProject,safeSave,safeLoad,storageReport,backupEnvelope,validateBackup,clearProjectStorage,featureAccess,backupFilename,applyRestore,readiness,startPilot,baselineStatus,logRuntime,enhanceAccessibility,onboardingSeen,markOnboardingSeen};
})();
