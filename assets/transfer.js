
window.RMSTransfer = (() => {
  const BANK=window.RMSTransferBank;
  const present=v=>String(v??"").trim().length>0;
  function normalizeProject(p){
    p.transfer=p.transfer||{};
    const t=p.transfer;
    t.sets=t.sets||[];
    t.raterPackets=t.raterPackets||[];
    t.events=t.events||[];
    return p;
  }
  function uuid(){
    if(globalThis.crypto?.randomUUID)return crypto.randomUUID();
    return "x-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);
  }
  function keywords(s){
    const stop=new Set("the and or but for with from into this that these those how what why does did are was were have has had student students study research".split(" "));
    return [...new Set((String(s||"").toLowerCase().match(/[a-z][a-z-]{2,}/g)||[]).filter(x=>!stop.has(x)))];
  }
  function overlap(a,b){
    const A=new Set(a),B=new Set(b);let n=0;A.forEach(x=>{if(B.has(x))n++});return n;
  }
  function selectTasks(p,n=3){
    normalizeProject(p);
    const topic=keywords([p.data?.topicChoice,p.data?.broadTopic,p.data?.finalRQ].filter(Boolean).join(" "));
    const already=new Set(p.transfer.sets.flatMap(s=>s.taskIds||[]));
    let candidates=BANK.tasks.map(t=>({...t,_overlap:overlap(topic,t.keywords||[]),_used:already.has(t.id)}));
    candidates.sort((a,b)=>a._used-b._used||a._overlap-b._overlap||a.id.localeCompare(b.id));
    const out=[],covered=new Set(),domains=new Set();
    while(out.length<n && candidates.length){
      let bestIndex=0,best=-Infinity;
      candidates.forEach((t,i)=>{
        const newComp=(t.competencies||[]).filter(c=>!covered.has(c)).length;
        const newDomain=domains.has(t.domain)?0:1;
        const score=newComp*5+newDomain*3-t._overlap*4-(t._used?2:0);
        if(score>best){best=score;bestIndex=i}
      });
      const t=candidates.splice(bestIndex,1)[0];out.push(t);domains.add(t.domain);(t.competencies||[]).forEach(c=>covered.add(c));
    }
    return out;
  }
  function startSet(p,n=3){
    const selected=selectTasks(p,n),set={
      id:"TS-"+uuid(),createdAt:new Date().toISOString(),taskIds:selected.map(x=>x.id),responses:{},
      completedAt:"",status:"in_progress"
    };
    p.transfer.sets.push(set);p.transfer.events.push({time:new Date().toISOString(),type:"set_started",setId:set.id,taskIds:set.taskIds});
    return set;
  }
  function task(id){return BANK.tasks.find(x=>x.id===id)}
  function currentSet(p){normalizeProject(p);return p.transfer.sets[p.transfer.sets.length-1]||null}
  function submitIndependent(p,setId,taskId,text){
    normalizeProject(p);const s=p.transfer.sets.find(x=>x.id===setId);if(!s)throw new Error("Transfer set not found.");
    if(s.responses[taskId]?.independent)throw new Error("Independent response is already locked.");
    const r=s.responses[taskId]=s.responses[taskId]||{};
    r.independent={text:String(text||""),time:new Date().toISOString()};
    r.supportUsed=false;r.supportLevel=0;r.revision=null;
    p.transfer.events.push({time:r.independent.time,type:"transfer_independent_submitted",setId,taskId});
    return r;
  }
  function useCue(p,setId,taskId){
    const s=p.transfer.sets.find(x=>x.id===setId),r=s?.responses?.[taskId];if(!r?.independent)throw new Error("Submit the independent response first.");
    r.supportUsed=true;r.supportLevel=Math.max(r.supportLevel||0,2);r.cueOpenedAt=new Date().toISOString();
    p.transfer.events.push({time:r.cueOpenedAt,type:"transfer_support",setId,taskId,level:2,source:"task conceptual cue"});
    return task(taskId).cue;
  }
  function saveRevision(p,setId,taskId,text){
    const s=p.transfer.sets.find(x=>x.id===setId),r=s?.responses?.[taskId];if(!r?.independent)throw new Error("Submit the independent response first.");
    r.revision={text:String(text||""),time:new Date().toISOString(),supportLevel:r.supportLevel||0};
    p.transfer.events.push({time:r.revision.time,type:"transfer_revision",setId,taskId,supportLevel:r.revision.supportLevel});
  }
  function setProgress(p,set){
    const total=set.taskIds.length,ind=set.taskIds.filter(id=>set.responses[id]?.independent).length,rev=set.taskIds.filter(id=>set.responses[id]?.revision).length;
    return {total,independent:ind,revised:rev,complete:ind===total};
  }
  function finalizeSet(p,setId){
    const s=p.transfer.sets.find(x=>x.id===setId);if(!s)throw new Error("Transfer set not found.");
    const prog=setProgress(p,s);if(!prog.complete)throw new Error("Every task needs a locked independent response.");
    s.status="complete";s.completedAt=new Date().toISOString();p.transfer.events.push({time:s.completedAt,type:"set_completed",setId});
  }
  function blindId(p,set){
    const raw=[p.created||"",p.name||"",set.id].join("|");let h=2166136261;
    for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}
    return "B-"+(h>>>0).toString(16).padStart(8,"0").toUpperCase();
  }
  function responsePacket(p,setId){
    const s=p.transfer.sets.find(x=>x.id===setId);if(!s)throw new Error("Set not found.");
    return {
      packet_type:"rms_transfer_response",version:"1.9",bank_version:BANK.version,bank_status:BANK.status,
      exported_at:new Date().toISOString(),response_set_id:s.id,blinded_id:blindId(p,s),
      tasks:s.taskIds.map(id=>{
        const t=task(id),r=s.responses[id]||{};
        return {task_id:id,title:t.title,domain:t.domain,scenario:t.scenario,prompts:t.prompts,competencies:t.competencies,
          independent_response:r.independent?.text||"",independent_time:r.independent?.time||"",
          support_used:!!r.supportUsed,support_level:r.supportLevel||0,supported_revision:r.revision?.text||"",revision_time:r.revision?.time||""};
      }),
      privacy_note:"Packet omits student name, raw research dataset, and main project manuscript. The blinded_id is derived from local project/set information."
    };
  }
  function raterTemplate(packet,raterId=""){
    return {
      packet_type:"rms_transfer_ratings",version:"1.9",response_set_id:packet.response_set_id,blinded_id:packet.blinded_id,
      rater_id:raterId,created_at:new Date().toISOString(),ratings:[]
    };
  }
  function validateRating(r){
    return r && ["0","1","2","3",0,1,2,3].includes(r.level) && present(r.task_id) && present(r.competency);
  }
  function transferProfile(p){
    normalizeProject(p);const ratings=p.transfer.raterPackets.flatMap(x=>x.ratings||[]).filter(validateRating),by={};
    ratings.forEach(r=>{(by[r.competency]||(by[r.competency]=[])).push(Number(r.level))});
    return Object.entries(by).map(([competency,a])=>({competency,n:a.length,mean:a.reduce((s,x)=>s+x,0)/a.length,min:Math.min(...a),max:Math.max(...a)}));
  }
  function importRatings(p,packet){
    normalizeProject(p);
    if(packet?.packet_type!=="rms_transfer_ratings"||packet.version!=="1.9")throw new Error("Not a v1.9 transfer rating packet.");
    const set=p.transfer.sets.find(x=>x.id===packet.response_set_id);if(!set)throw new Error("Ratings belong to a transfer set not stored in this project.");
    p.transfer.raterPackets.push(packet);p.transfer.events.push({time:new Date().toISOString(),type:"ratings_imported",setId:set.id,rater:packet.rater_id||""});
  }

  function alignedRatings(A,B){
    const key=r=>`${r.task_id}|${r.competency}|${r.response_type||"independent"}`;
    const ma=new Map((A?.ratings||[]).filter(validateRating).map(r=>[key(r),r]));
    const mb=new Map((B?.ratings||[]).filter(validateRating).map(r=>[key(r),r]));
    return [...ma.keys()].filter(k=>mb.has(k)).map(k=>({key:k,a:Number(ma.get(k).level),b:Number(mb.get(k).level),ra:ma.get(k),rb:mb.get(k)}));
  }
  function confusion(pairs,k=4){
    const m=Array.from({length:k},()=>Array(k).fill(0));pairs.forEach(x=>{if(x.a>=0&&x.a<k&&x.b>=0&&x.b<k)m[x.a][x.b]++});return m;
  }
  function agreement(pairs,k=4){
    const n=pairs.length;if(!n)return {n:0,agreement:null,kappa:null,weightedKappa:null,matrix:confusion([],k)};
    const mat=confusion(pairs,k);let exact=0;for(let i=0;i<k;i++)exact+=mat[i][i];
    const po=exact/n,ra=Array(k).fill(0),rb=Array(k).fill(0);
    for(let i=0;i<k;i++)for(let j=0;j<k;j++){ra[i]+=mat[i][j];rb[j]+=mat[i][j]}
    let pe=0;for(let i=0;i<k;i++)pe+=(ra[i]/n)*(rb[i]/n);
    const kap=Math.abs(1-pe)<1e-12?null:(po-pe)/(1-pe);
    let pow=0,pew=0;
    for(let i=0;i<k;i++)for(let j=0;j<k;j++){
      const w=1-((i-j)*(i-j))/((k-1)*(k-1));
      pow+=w*mat[i][j]/n;pew+=w*(ra[i]/n)*(rb[j]/n);
    }
    const kw=Math.abs(1-pew)<1e-12?null:(pow-pew)/(1-pew);
    return {n,agreement:po,kappa:kap,weightedKappa:kw,matrix:mat};
  }
  function agreementByCompetency(A,B){
    const pairs=alignedRatings(A,B),groups={};
    pairs.forEach(x=>{const c=x.ra.competency;(groups[c]||(groups[c]=[])).push(x)});
    return Object.entries(groups).map(([competency,p])=>({competency,...agreement(p)}));
  }
  function disagreements(A,B){return alignedRatings(A,B).filter(x=>x.a!==x.b)}
  return {bank:BANK,normalizeProject,selectTasks,startSet,currentSet,task,submitIndependent,useCue,saveRevision,setProgress,finalizeSet,
    responsePacket,raterTemplate,transferProfile,importRatings,alignedRatings,confusion,agreement,agreementByCompetency,disagreements};
})();
