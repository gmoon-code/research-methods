window.RMSLocalChat = (() => {
  "use strict";
  const CFG=window.RMS_LOCAL_CHAT_CONFIG, Policy=window.RMSLocalChatPolicy;
  let worker=null, state={status:"idle",device:"",dtype:"",progress:null,error:""}, pending=new Map(), listeners=new Set();

  function emit(){for(const fn of listeners)try{fn({...state})}catch{}}
  function set(patch){state={...state,...patch};emit()}
  function onState(fn){listeners.add(fn);fn({...state});return()=>listeners.delete(fn)}

  function store(){
    try{
      const data=JSON.parse(localStorage.getItem(CFG.storageKey)||"{}");
      return {loadedOnce:!!data.loadedOnce,contextEnabled:data.contextEnabled!==false,messages:Array.isArray(data.messages)?data.messages.slice(-40):[]};
    }catch{return{loadedOnce:false,contextEnabled:true,messages:[]}}
  }
  function save(data){try{localStorage.setItem(CFG.storageKey,JSON.stringify(data))}catch{}}
  function update(fn){const d=store();fn(d);save(d);return d}
  function messages(){return store().messages}
  function contextEnabled(){return store().contextEnabled}
  function setContextEnabled(v){update(d=>d.contextEnabled=!!v)}

  function addMessage(role,content,meta={}){
    const m={id:`lc-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,time:new Date().toISOString(),role,content:String(content||""),...meta};
    update(d=>{d.messages.push(m);d.messages=d.messages.slice(-40)});
    return m;
  }
  function recordError(message){return addMessage("assistant",String(message||"Research Chat error."),{error:true})}
  function clearConversation(){update(d=>d.messages=[])}

  function ensureWorker(){
    if(worker)return worker;
    const base=window.RMS_LOCAL_CHAT_ASSET_BASE||new URL("./assets/",document.baseURI).href;
    worker=new Worker(new URL("local-chat-worker.js",base),{type:"module"});
    worker.onmessage=e=>{
      const m=e.data||{};
      if(m.type==="loading")set({status:"loading",device:m.device||"",dtype:m.dtype||"",error:""});
      if(m.type==="load-warning")set({status:"loading",error:`${m.device||"device"} ${m.dtype||""} unavailable; trying fallback.`});
      if(m.type==="ready"){
        update(d=>d.loadedOnce=true);
        set({status:"ready",device:m.device||"",dtype:m.dtype||"",progress:null,error:""});
      }
      if(m.type==="generating")set({status:"generating",device:m.device||state.device,dtype:m.dtype||state.dtype,error:""});
      if(m.type==="result"){
        set({status:"ready",device:m.device||state.device,dtype:m.dtype||state.dtype,progress:null,error:""});
        const p=pending.get(m.requestId);pending.delete(m.requestId);p?.resolve?.(m);
      }
      if(m.type==="error"){
        set({status:"error",progress:null,error:m.message||"Research Chat model error."});
        const p=pending.get(m.requestId);pending.delete(m.requestId);p?.reject?.(new Error(m.message||"Research Chat model error."));
      }
    };
    worker.onerror=e=>set({status:"error",error:e.message||"Research Chat worker failed.",progress:null});
    return worker;
  }

  async function deviceCheck(){
    const memory=Number(navigator.deviceMemory||0);
    let storage=null;
    try{storage=await navigator.storage?.estimate?.()}catch{}
    const free=storage?.quota&&Number.isFinite(storage?.usage)?Math.max(0,storage.quota-storage.usage):null;
    return {
      webgpu:Boolean(navigator.gpu),deviceMemoryGB:memory||null,freeStorageBytes:free,
      memoryWarning:Boolean(memory&&memory<CFG.minimums.warnDeviceMemoryGB),
      storageWarning:Boolean(free!=null&&free<CFG.minimums.recommendedFreeStorageMB*1024*1024)
    };
  }

  function load(){
    if(["loading","ready","generating"].includes(state.status))return;
    set({status:"loading",progress:null,error:""});
    ensureWorker().postMessage({type:"load"});
  }

  function historyForModel(){
    return messages().filter(m=>m.role==="user"||m.role==="assistant").slice(-CFG.runtime.maxHistoryTurns*2)
      .map(m=>({role:m.role,content:String(m.content||"").slice(0,1000)}));
  }

  async function ask(question){
    const q=String(question||"").trim();
    if(!q)throw new Error("Enter a question first.");
    const project=Policy.readProject();
    const context=Policy.projectContext(project,contextEnabled());
    addMessage("user",q,{stageId:context?.stage?.id||null});

    const guarded=Policy.guard(q,context);
    if(guarded){
      addMessage("assistant",guarded.message,{guard:guarded.kind,scaffoldLevel:guarded.scaffoldLevel,action:guarded.action||null});
      return {guarded:true,...guarded};
    }
    if(state.status!=="ready")throw new Error("Download and load Research Chat before asking a model question.");

    const requestId=`req-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const system=Policy.systemPrompt(context),prompt=q.slice(0,5000);
    const result=await new Promise((resolve,reject)=>{
      pending.set(requestId,{resolve,reject});
      ensureWorker().postMessage({type:"generate",requestId,system,question:prompt,history:historyForModel(),maxNewTokens:CFG.runtime.maxNewTokens});
      setTimeout(()=>{
        const p=pending.get(requestId);
        if(p){pending.delete(requestId);reject(new Error("Research Chat took too long. Try a shorter question."));set({status:"ready",error:""})}
      },120000);
    });
    const answer=Policy.sanitizeModelText(result.text);
    addMessage("assistant",answer,{device:result.device||state.device,dtype:result.dtype||state.dtype,model:CFG.model.displayName,scaffoldLevel:context?.focusedField?.hasAttempt?2:1});
    return {guarded:false,message:answer,device:result.device||state.device,dtype:result.dtype||state.dtype};
  }

  function clickAction(action){
    const id=action?.targetId;if(!id)return false;
    const el=document.getElementById(id);if(!el)return false;
    el.click();return true;
  }

  function dispose(){
    if(worker){try{worker.postMessage({type:"dispose"});worker.terminate()}catch{}worker=null}
    set({status:"idle",device:"",dtype:"",progress:null,error:""});
  }

  return {
    config:CFG,onState,getState:()=>({...state}),deviceCheck,load,ask,dispose,
    messages,recordError,clearConversation,contextEnabled,setContextEnabled,clickAction
  };
})();
