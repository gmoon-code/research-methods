window.RMSLocalChatUI = (() => {
  "use strict";
  const Chat=window.RMSLocalChat, CFG=window.RMS_LOCAL_CHAT_CONFIG;
  let open=false,deviceInfo=null,root=null;

  const E=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const fmtBytes=n=>n==null?"Unknown":`${Math.round(n/1024/1024)} MB`;

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
    return `<div class="rms-chat-message ${m.role==="user"?"user":"assistant"}"><div class="rms-chat-role">${m.role==="user"?"You":"Research Chat"}</div><div class="rms-chat-text">${E(m.content).replace(/\n/g,"<br>")}</div>${meta}${action}</div>`;
  }

  function setupHtml(state){
    const info=deviceInfo||{};
    const warnings=[
      info.memoryWarning?`This browser reports ${info.deviceMemoryGB} GB of device memory. The local model may be slow or fail to load.`:"",
      info.storageWarning?`Estimated free browser storage is ${fmtBytes(info.freeStorageBytes)}. The model may not fit in cache.`:""
    ].filter(Boolean);
    return `<section class="rms-chat-setup">
      <h4>Set up free Research Chat on this device</h4>
      <p>Research Chat runs in this browser. There is no API key and no per-message fee. The first setup downloads about ${CFG.model.expectedFirstDownloadMB} MB from this GitHub Pages site.</p>
      <dl>
        <div><dt>Model</dt><dd>${E(CFG.model.displayName)}</dd></div>
        <div><dt>Acceleration</dt><dd>${info.webgpu?"WebGPU available; GPU will be tried first.":"WebGPU not detected; WebAssembly/CPU fallback will be used."}</dd></div>
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
    const p=state.progress||{}, pct=Number.isFinite(p.progress)?Math.round(p.progress):null;
    const label=p.file?`Downloading ${p.file.split("/").pop()}`:"Preparing local model";
    return `<div class="rms-chat-progress" role="status" aria-live="polite">
      <div><span>${E(label)}</span><b>${pct==null?"":pct+"%"}</b></div>
      <progress max="100" value="${pct==null?0:pct}"></progress>
      <small>${state.device==="webgpu"?"Trying WebGPU":"Using WebAssembly/CPU"}</small>
    </div>`;
  }

  function readyHtml(state){
    const msgs=Chat.messages();
    return `<div class="rms-chat-ready">
      <div class="rms-chat-status"><span class="dot"></span><b>Ready on this device</b><small>${state.device==="webgpu"?"WebGPU":"WebAssembly / CPU"}</small></div>
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
    document.getElementById("rmsChatClear")?.addEventListener("click",()=>{
      if(confirm("Clear this Research Chat conversation from this browser?")){Chat.clearConversation();render()}
    });
    document.getElementById("rmsChatUnload")?.addEventListener("click",()=>{Chat.dispose();render()});
    document.querySelectorAll("[data-chat-action]").forEach(b=>b.addEventListener("click",()=>{
      const targetId=b.dataset.chatAction;
      if(Chat.clickAction({targetId})){toggle(false)}
    }));
    const form=document.getElementById("rmsChatForm");
    if(form)form.onsubmit=async e=>{
      e.preventDefault();
      const input=document.getElementById("rmsChatInput"), q=input.value.trim();
      if(!q)return;
      input.value="";
      render();
      try{await Chat.ask(q)}catch(err){
        const box=document.getElementById("rmsChatMessages");
        if(box)box.insertAdjacentHTML("beforeend",`<div class="rms-chat-message assistant error"><div class="rms-chat-role">Research Chat</div><div class="rms-chat-text">${E(err?.message||err)}</div></div>`);
      }
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
    open=v==null?!open:!!v;
    render();
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
      settings.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();toggle(true)};
    }
  }

  return {init,toggle};
})();
