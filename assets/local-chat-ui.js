window.RMSLocalChatUI = (() => {
  "use strict";
  const Chat=window.RMSLocalChat, CFG=window.RMS_LOCAL_CHAT_CONFIG;
  let open=false,deviceInfo=null,root=null;

  const E=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const fmtBytes=n=>n==null?"Unknown":`${Math.round(n/1024/1024)} MB`;
  const firstDownloadMB=info=>info?.webgpu?CFG.model.expectedWebGPUDownloadMB:CFG.model.expectedWasmDownloadMB;

  function launcher(){
    let b=document.getElementById("researchChatLauncher");
    if(b)return b;
    b=document.createElement("button");
    b.id="researchChatLauncher";
    b.className="rms-chat-launcher";
    b.type="button";
    b.setAttribute("aria-haspopup","dialog");
    b.innerHTML='<span aria-hidden="true">Chat</span><strong>Research Chat</strong>';
    b.onclick=()=>toggle();
    document.body.appendChild(b);
    return b;
  }

  function messageHtml(m){
    const action=m.action?`<button class="rms-chat-inline-action" data-chat-action="${E(m.action.targetId||"")}">${E(m.action.label||"Open tool")}</button>`:"";
    const meta=m.role==="assistant"&&m.guard?`<div class="rms-chat-meta">Built-in safeguard · ${E(m.guard.replaceAll("_"," "))}</div>`:"";
    const cls=`rms-chat-message ${m.role==="user"?"user":"assistant"}${m.error?" error":""}`;
    return `<div class="${cls}"><div class="rms-chat-role">${m.role==="user"?"You":"Research Chat"}</div><div class="rms-chat-text">${E(m.content).replace(/\n/g,"<br>")}</div>${meta}${action}</div>`;
  }

  function setupHtml(state){
    const info=deviceInfo||{},downloadMB=firstDownloadMB(info);
    const warnings=[
      info.memoryWarning?`This browser reports ${info.deviceMemoryGB} GB of device memory. The local model may be slow or fail to load.`:"",
      info.storageWarning?`Estimated free browser storage is ${fmtBytes(info.freeStorageBytes)}. Research Chat may not have enough cache space.`:""
    ].filter(Boolean);
    const fallbackNote=info.webgpu?`If the GPU model cannot load, Research Chat may download the additional ${CFG.model.wasmDtype} fallback of about ${CFG.model.expectedWasmDownloadMB} MB.`:"CPU/WebAssembly generation can be substantially slower than WebGPU. Test this exact device before class.";
    return `<section class="rms-chat-setup">
      <h4>Set up free Research Chat on this device</h4>
      <p>Research Chat runs in this browser. There is no API key and no per-message fee. The first setup normally downloads about ${downloadMB} MB from this GitHub Pages site. The browser normally caches the model for later visits on this device.</p>
      <dl>
        <div><dt>Model</dt><dd>${E(CFG.model.displayName)}</dd></div>
        <div><dt>This device</dt><dd>${info.webgpu?`WebGPU available. Research Chat will try the smaller ${CFG.model.webgpuDtype} GPU model first.`:`WebGPU not detected. Research Chat will use the ${CFG.model.wasmDtype} WebAssembly/CPU model.`}</dd></div>
        <div><dt>First download</dt><dd>About ${downloadMB} MB on the expected path. Do this before class when possible.</dd></div>
        <div><dt>Fallback</dt><dd>${E(fallbackNote)}</dd></div>
        <div><dt>After loading</dt><dd>Questions and selected project context are processed on this device.</dd></div>
      </dl>
      ${warnings.map(x=>`<div class="rms-chat-warning">${E(x)}</div>`).join("")}
      <div class="rms-chat-caution"><b>Small-model limitation</b><br>This local model can misunderstand a question or state something inaccurate. Use it for explanation and feedback. Keep the Studio’s deterministic method/statistics checks and your teacher as the authority for consequential decisions.</div>
      <button class="primary" id="rmsChatLoadModel">${state.status==="loading"?"Loading…":"Download and load Research Chat"}</button>
      ${state.status==="loading"?progressHtml(state):""}
      ${state.status==="error"?`<div class="rms-chat-error">${E(state.error)}<br><button class="ghost small" id="rmsChatRetry">Try again</button></div>`:""}
    </section>`;
  }

  function progressHtml(state){
    const route=state.device==="webgpu"?`Trying WebGPU ${state.dtype||""}`:`Using WebAssembly/CPU ${state.dtype||""}`;
    return `<div class="rms-chat-progress" role="status" aria-live="polite">
      <div><span>Loading the local model…</span><b></b></div>
      <progress></progress>
      <small>${E(route.trim())}. Large model loading can take a while on the first visit.</small>
    </div>`;
  }

  function readyHtml(state){
    const msgs=Chat.messages();
    const execution=state.device==="webgpu"?`WebGPU ${state.dtype||""}`:`WebAssembly / CPU ${state.dtype||""}`;
    return `<div class="rms-chat-ready">
      <div class="rms-chat-status"><span class="dot"></span><b>Ready on this device</b><small>${E(execution.trim())}</small></div>
      <label class="rms-chat-context"><input type="checkbox" id="rmsChatContext" ${Chat.contextEnabled()?"checked":""}> <span>Use my current research-project context</span></label>
      <div class="rms-chat-messages" id="rmsChatMessages" aria-live="polite">${msgs.length?msgs.map(messageHtml).join(""):`<div class="rms-chat-empty"><b>Ask about the part that is stopping you.</b><p>Examples: “What does operational definition mean?” “Why do I need an independent unit?” “Can you check the reasoning in my current answer?”</p></div>`}</div>
      <form id="rmsChatForm" class="rms-chat-form">
        <label class="sr-only" for="rmsChatInput">Ask Research Chat a question</label>
        <textarea id="rmsChatInput" maxlength="5000" rows="3" placeholder="Ask a research-method question…"></textarea>
        <div><small>${state.status==="generating"?"Thinking on this device…":"The local model does not search the internet."}</small><button class="primary" ${state.status==="generating"?"disabled":""}>${state.status==="generating"?"Thinking…":"Ask"}</button></div>
      </form>
      <details class="rms-chat-options"><summary>Chat options</summary><button class="ghost small" id="rmsChatClear">Clear conversation</button><button class="ghost small" id="rmsChatUnload">Unload model from memory</button></details>
    </div>`;
  }

  function panelHtml(state){
    return `<div class="rms-chat-panel" role="dialog" aria-modal="false" aria-labelledby="rmsChatTitle">
      <header><div><span>Local research help</span><h3 id="rmsChatTitle">Research Chat</h3></div><button class="ghost small" id="rmsChatClose" aria-label="Close Research Chat">Close</button></header>
      <div class="rms-chat-privacy">Runs on this device · no API key · no per-message fee</div>
      <div class="rms-chat-body">${state.status==="ready"||state.status==="generating"?readyHtml(state):setupHtml(state)}</div>
    </div>`;
  }

  function bind(){
    document.getElementById("rmsChatClose")?.addEventListener("click",()=>toggle(false));
    document.getElementById("rmsChatLoadModel")?.addEventListener("click",()=>Chat.load());
    document.getElementById("rmsChatRetry")?.addEventListener("click",()=>Chat.load());
    document.getElementById("rmsChatContext")?.addEventListener("change",e=>Chat.setContextEnabled(e.target.checked));
    document.getElementById("rmsChatClear")?.addEventListener("click",()=>{if(confirm("Clear this Research Chat conversation from this browser?")){Chat.clearConversation();render()}});
    document.getElementById("rmsChatUnload")?.addEventListener("click",()=>{Chat.dispose();render()});
    document.querySelectorAll("[data-chat-action]").forEach(b=>b.addEventListener("click",()=>{if(Chat.clickAction({targetId:b.dataset.chatAction}))toggle(false)}));
    const form=document.getElementById("rmsChatForm");
    if(form)form.onsubmit=async e=>{
      e.preventDefault();
      const input=document.getElementById("rmsChatInput"),q=input.value.trim();if(!q)return;
      input.value="";render();
      try{await Chat.ask(q)}catch(err){Chat.recordError(err?.message||err)}
      render();
      requestAnimationFrame(()=>{const m=document.getElementById("rmsChatMessages");if(m)m.scrollTop=m.scrollHeight});
    };
  }

  function render(state=Chat.getState()){
    if(!root)return;
    root.innerHTML=open?panelHtml(state):"";
    root.hidden=!open;
    launcher().setAttribute("aria-expanded",open?"true":"false");
    if(open)bind();
  }

  function toggle(v){
    open=v==null?!open:!!v;render();
    if(open)requestAnimationFrame(()=>document.getElementById(Chat.getState().status==="ready"?"rmsChatInput":"rmsChatLoadModel")?.focus());
    else launcher().focus();
  }

  async function init(){
    launcher();
    root=document.createElement("div");root.id="researchChatRoot";root.hidden=true;document.body.appendChild(root);
    deviceInfo=await Chat.deviceCheck();
    Chat.onState(s=>render(s));

    const settings=document.getElementById("aiSettings");
    if(settings){
      settings.textContent="Research Chat";
      settings.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();toggle(true)},true);
    }
  }

  return {init,toggle};
})();
