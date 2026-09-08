
window.RMSRescue=(()=>{
 const M=window.RMSRescueModel;
 function normalizeProject(p){
   p.rescue=p.rescue||{};
   const r=p.rescue;
   r.fields=r.fields||{};
   r.labs=r.labs||{};
   r.attemptSnapshots=r.attemptSnapshots||[];
   r.revisions=r.revisions||[];
   r.notes=r.notes||[];
   r.events=r.events||[];
   return p;
 }
 const now=()=>new Date().toISOString();
 const fieldId=(stage,key)=>`${Number(stage)}:${key}`;
 function fieldState(p,stage,key){
   normalizeProject(p);const id=fieldId(stage,key);
   p.rescue.fields[id]=p.rescue.fields[id]||{stage:Number(stage),key,maxLevel:0,levelsUsed:[],startedAt:"",initialAttemptId:"",lastUsedAt:""};
   return p.rescue.fields[id];
 }
 function snapshotAttempt(p,stage,key,value,path){
   normalizeProject(p);const st=fieldState(p,stage,key);
   if(st.initialAttemptId)return p.rescue.attemptSnapshots.find(x=>x.id===st.initialAttemptId)||null;
   const snap={id:`FA-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,time:now(),stage:Number(stage),key,
     value:String(value??""),status:String(value??"").trim()?"attempt_present":"blank_when_help_requested",researchPath:path||"unsure"};
   p.rescue.attemptSnapshots.push(snap);st.initialAttemptId=snap.id;st.startedAt=snap.time;return snap;
 }
 function useFieldLevel(p,stage,key,level,value,path,Competency){
   normalizeProject(p);level=Math.max(1,Math.min(5,Number(level)||1));
   const st=fieldState(p,stage,key);
   if(!canOpen(st,level)) throw new Error(`Open Level ${level-1} before Level ${level}.`);
   snapshotAttempt(p,stage,key,value,path);
   if(!st.levelsUsed.includes(level)){
     st.levelsUsed.push(level);st.levelsUsed.sort((a,b)=>a-b);
     st.maxLevel=Math.max(st.maxLevel,level);st.lastUsedAt=now();
     const label=M.scaffold_levels[String(level)]||`Level ${level}`;
     p.rescue.events.push({time:st.lastUsedAt,type:"field_support",stage:Number(stage),key,level,label,path:path||"unsure"});
     if(Competency?.recordSupport) Competency.recordSupport(p,stage,level,`Progressive help · ${key}`,label);
   }
   return st;
 }
 function canOpen(st,level){return Number(level)===1 || st.maxLevel>=Number(level)-1 || st.levelsUsed.includes(Number(level))}
 function currentFrame(path,key){
   const f=M.fields[key]?.levels?.["5"];if(!f)return"";
   return f.path_frames?.[path]||f.frame||"";
 }
 function applyFieldRevision(p,stage,key,before,after,rationale,path,Competency){
   normalizeProject(p);const st=fieldState(p,stage,key),cfg=M.fields[key];
   if(st.maxLevel<4)throw new Error("Open the parallel worked example before using Level 5.");
   if(!String(after||"").trim())throw new Error("Write the answer you want to keep first.");
   if(cfg?.type==="select" && (cfg.options||[]).length && !cfg.options.includes(String(after)))throw new Error("Choose one of the available field options.");
   if(!String(rationale||"").trim())throw new Error("Explain why this answer fits your project before applying it.");
   const ev={id:`FR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,time:now(),stage:Number(stage),key,
     before:String(before??""),after:String(after??""),rationale:String(rationale),path:path||"unsure",supportLevel:5};
   p.rescue.revisions.push(ev);p.rescue.events.push({time:ev.time,type:"field_revision",stage:Number(stage),key,level:5,path:ev.path});
   useFieldLevel(p,stage,key,5,before,path,Competency);
   return ev;
 }
 function labState(p,lab,tab){
   normalizeProject(p);const id=`${lab}:${tab}`;
   p.rescue.labs[id]=p.rescue.labs[id]||{lab,tab,maxLevel:0,levelsUsed:[],notes:[],startedAt:"",lastUsedAt:""};return p.rescue.labs[id];
 }
 function useLabLevel(p,lab,tab,level,path,Competency){
   const cfg=M.labs?.[lab]?.[tab];if(!cfg)throw new Error("Unknown laboratory help context.");
   const st=labState(p,lab,tab);level=Math.max(1,Math.min(5,Number(level)||1));
   if(!canOpen(st,level)) throw new Error(`Open Level ${level-1} before Level ${level}.`);
   if(!st.levelsUsed.includes(level)){
     st.levelsUsed.push(level);st.levelsUsed.sort((a,b)=>a-b);st.maxLevel=Math.max(st.maxLevel,level);st.lastUsedAt=now();if(!st.startedAt)st.startedAt=st.lastUsedAt;
     const label=M.scaffold_levels[String(level)]||`Level ${level}`;
     p.rescue.events.push({time:st.lastUsedAt,type:"lab_support",stage:cfg.stage,lab,tab,level,label,path:path||"unsure"});
     if(Competency?.recordSupport) Competency.recordSupport(p,cfg.stage,level,`Progressive lab help · ${lab}/${tab}`,label);
   }
   return st;
 }
 function saveLabNote(p,lab,tab,note,rationale,path,Competency){
   const st=labState(p,lab,tab);
   if(st.maxLevel<4)throw new Error("Open the parallel worked example before using Level 5.");
   if(!String(note||"").trim())throw new Error("Write the next decision or plan first.");
   if(!String(rationale||"").trim())throw new Error("Explain why it fits your project.");
   const cfg=M.labs?.[lab]?.[tab],ev={id:`LN-${Date.now().toString(36)}`,time:now(),lab,tab,stage:cfg?.stage||1,note:String(note),rationale:String(rationale),path:path||"unsure",supportLevel:5};
   normalizeProject(p);p.rescue.notes.push(ev);labState(p,lab,tab).notes.push(ev.id);useLabLevel(p,lab,tab,5,path,Competency);return ev;
 }
 function maxFieldLevel(p,stage,key){return fieldState(p,stage,key).maxLevel||0}
 function stageSupportSummary(p,stage){
   normalizeProject(p);const fs=Object.values(p.rescue.fields).filter(x=>Number(x.stage)===Number(stage));
   const ls=Object.values(p.rescue.labs).filter(x=>Number(M.labs?.[x.lab]?.[x.tab]?.stage)===Number(stage));
   const levels=[...fs,...ls].map(x=>x.maxLevel||0);
   return {contexts:levels.filter(Boolean).length,maxLevel:levels.length?Math.max(...levels):0};
 }
 return {model:M,normalizeProject,fieldState,snapshotAttempt,useFieldLevel,canOpen,currentFrame,applyFieldRevision,labState,useLabLevel,saveLabNote,maxFieldLevel,stageSupportSummary};
})();
