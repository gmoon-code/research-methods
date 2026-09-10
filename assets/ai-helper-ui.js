
window.RMSAIHelperUI=(()=>{
  const H=window.RMSAIHelper,AI=window.RMSAI;
  const E=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  let ctx={project:null,save:null,Competency:null,PathCoach:null,Pilot:null,currentStage:null};
  let open=false,busy=false;
  const id=x=>document.getElementById(x);

  function p(){return ctx.project}
  function safeUrl(url){try{const u=new URL(url);return ["http:","https:"].includes(u.protocol)?u.href:""}catch{return""}}
  function textHTML(text){
    const lines=String(text||"").split(/\n/),out=[];let list=[];
    const flush=()=>{if(list.length){out.push(`<ul>${list.map(x=>`<li>${E(x)}</li>`).join("")}</ul>`);list=[]}};
    for(const raw of lines){
      const line=raw.trim();
      if(/^[-*]\s+/.test(line)){list.push(line.replace(/^[-*]\s+/,""));continue}
      flush();
      if(!line){out.push('<div class="ai-helper-spacer"></div>');continue}
      out.push(`<p>${E(line)}</p>`);
    }
    flush();return out.join("");
  }
  function access(){
    try{return ctx.Pilot?.featureAccess?.(p(),"ai")||{allowed:true,reason:""}}catch{return{allowed:true,reason:""}}
  }
  function status(){
    const a=access();
    if(!a.allowed)return {kind:"blocked",canAsk:false,label:"Research Chat is disabled for this pilot",detail:a.reason};
    if(!AI.chatConfigured())return {kind:"offline",canAsk:false,label:"Research Chat is unavailable right now",detail:"You can still use field examples, Help, Research Terms, and progressive help. Try Research Chat again later."};
    const c=AI.getConfig();
    if(!c.accessCodeSet)return {kind:"needs-code",canAsk:true,label:"Research Chat needs the class code",detail:"Enter the class code provided by your teacher. It is kept only for this browser session."};
    return {kind:"ready",canAsk:true,label:"Research Chat ready",detail:"The approved class endpoint and a session-only class code are configured. The connection is checked when you send a question."};
  }
  function floatingButton(){
    if(id("aiHelperLauncher"))return;
    const b=document.createElement("button");
    b.id="aiHelperLauncher";b.type="button";b.className="ai-helper-launcher";
    b.setAttribute("aria-haspopup","dialog");b.setAttribute("aria-controls","aiHelperPanel");b.setAttribute("aria-expanded","false");
    b.innerHTML='<span class="ai-helper-launch-icon" aria-hidden="true">Chat</span><span>Research Chat</span>';
    b.onclick=()=>toggle(true);
    document.body.appendChild(b);
  }
  function scaffoldBadge(m){
    if(m.role!=="assistant"||m.scaffold_level==null)return"";
    const n=Number(m.scaffold_level)||0;
    const label=n===0?"Explanation only":`Scaffold L${n}`;
    return `<span class="ai-helper-scaffold ${m.counts_as_stage_support?"counts":""}">${E(label)}${m.counts_as_stage_support?" · stage support":""}</span>`;
  }
  function citationsHTML(cites){
    if(!Array.isArray(cites)||!cites.length)return"";
    return `<details class="ai-helper-citations"><summary>Sources used in this answer</summary>${cites.map(c=>{
      const url=safeUrl(c.source_url||c.url||"");
      return `<div><b>${E(c.citation_label||c.title||c.claim||"Source")}</b>${url?` <a href="${E(url)}" target="_blank" rel="noopener">open source</a>`:""}${c.verified===true?' <span class="verified-source">verified in project</span>':""}</div>`;
    }).join("")}</details>`;
  }
  function messageHTML(m){
    if(m.role==="user")return `<article class="ai-helper-msg user"><div class="ai-helper-msg-head"><b>You</b><time>${new Date(m.time).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</time></div><div>${textHTML(m.content)}</div></article>`;
    if(m.role==="error")return `<article class="ai-helper-msg error"><div class="ai-helper-msg-head"><b>Connection problem</b></div><div>${textHTML(m.content)}</div></article>`;
    return `<article class="ai-helper-msg assistant"><div class="ai-helper-msg-head"><b>Research Chat</b>${scaffoldBadge(m)}</div><div>${textHTML(m.content)}</div>${m.questions?.length?`<div class="ai-helper-followups"><b>Questions for you</b><ul>${m.questions.map(q=>`<li>${E(q)}</li>`).join("")}</ul></div>`:""}${m.guard_note?`<div class="ai-helper-guard-note"><b>Why I did not write the answer for you</b><p>${E(m.guard_note)}</p></div>`:""}${citationsHTML(m.citations)}</article>`;
  }
  function emptyChat(){
    const s=H.stage(p()),f=H.currentField(p());
    return `<div class="ai-helper-empty"><div class="ai-helper-empty-icon">Chat</div><h3>Ask about anything in your research process</h3><p>I can explain research terms, clarify what a stage or field means, compare methods, help you understand warnings, discuss your current project decisions, and help you reason through something you are stuck on.</p>
      <div class="ai-helper-boundary"><b>I will protect your authorship.</b><span>If you ask me to make an unfinished research decision for you, I will first help you reason through it. If you already have an attempt, I can critique and help revise it.</span></div>
      <p class="ai-helper-current"><b>Current context</b> Stage ${s.id} · ${E(H.stageTitle(p()))}${f?` · ${E(f.label)}`:""}</p></div>`;
  }
  function quickHTML(){
    return `<div class="ai-helper-quick">${H.quickPrompts(p()).map(x=>`<button type="button" data-ai-helper-prompt="${E(x.prompt)}">${E(x.label)}</button>`).join("")}</div>`;
  }
  function panel(){
    if(id("aiHelperPanel"))return id("aiHelperPanel");
    const el=document.createElement("aside");el.id="aiHelperPanel";el.className="ai-helper-panel";el.hidden=true;
    el.setAttribute("role","dialog");el.setAttribute("aria-modal","false");el.setAttribute("aria-labelledby","aiHelperTitle");
    document.body.appendChild(el);return el;
  }
  function render(){
    floatingButton();const el=panel(),st=status(),msgs=p().aiHelper?.messages||[];
    id("aiHelperLauncher")?.setAttribute("aria-expanded",open?"true":"false");
    el.hidden=!open;if(!open)return;
    el.innerHTML=`<div class="ai-helper-head"><div><div class="ai-helper-kicker">Always available research chat</div><h2 id="aiHelperTitle">Research Chat</h2></div><div class="ai-helper-head-actions"><span class="ai-helper-status ${st.kind}">${E(st.label)}</span><button type="button" class="ghost small" id="closeAIHelper" aria-label="Close Research Chat">Close</button></div></div>
      <div class="ai-helper-context-row"><label><input type="checkbox" id="aiHelperUseContext" ${p().aiHelper.includeProjectContext!==false?"checked":""}> Use my current project context</label><span>Stage ${H.stage(p()).id} · ${E(H.stageTitle(p()))}</span></div>
      <div class="ai-helper-privacy-note"><b>Privacy</b><span>Your question and recent Research Chat messages go to the secure class Chat service. Relevant project responses are included only while <b>Use my current project context</b> is on. Raw datasets and obvious identifying fields are excluded before sending.</span></div>
      ${st.kind==="offline"||st.kind==="blocked"?`<div class="ai-helper-connect ${st.kind}"><b>${E(st.label)}</b><p>${E(st.detail)}</p>${st.kind==="offline"&&new URLSearchParams(location.search).get("mode")==="teacher"?'<button type="button" class="secondary small" id="openAIHelperSettings">Open Chat settings</button>':""}</div>`:""}
      ${st.kind==="needs-code"?`<div class="ai-helper-connect needs-code"><b>${E(st.label)}</b><p>${E(st.detail)}</p><label class="ai-helper-code-label"><span>Class Chat code</span><input id="aiHelperAccessCode" type="password" autocomplete="off" maxlength="256" placeholder="Enter class code"></label><button type="button" class="secondary small" id="connectAIHelper">Connect Research Chat</button></div>`:""}
      ${st.kind==="ready"?`<div class="ai-helper-connect ready"><b>${E(st.label)}</b><p>${E(st.detail)}</p></div>`:""}
      ${quickHTML()}
      <div class="ai-helper-conversation" id="aiHelperConversation" aria-live="polite">${msgs.length?msgs.map(messageHTML).join(""):emptyChat()}${busy?'<article class="ai-helper-msg assistant thinking"><b>Research Chat</b><p>Thinking through your question…</p></article>':""}</div>
      <form class="ai-helper-compose" id="aiHelperForm"><label for="aiHelperInput" class="sr-only">Research Chat a question</label><textarea id="aiHelperInput" rows="3" placeholder="Ask a question, paste a confusing sentence, or say what you are stuck on…" ${busy||!st.canAsk?"disabled":""}></textarea><div class="ai-helper-compose-bottom"><span>Do not enter student names or unnecessary private information.</span><div><button type="button" class="ghost small" id="clearAIHelper" ${msgs.length?"":"disabled"}>Clear chat</button><button type="submit" class="primary" ${busy||!st.canAsk?"disabled":""}>${busy?"Waiting…":"Ask"}</button></div></div></form>`;
    bindInside();
    requestAnimationFrame(()=>{
      const c=id("aiHelperConversation");if(c)c.scrollTop=c.scrollHeight;
    });
  }
  function bindInside(){
    if(id("closeAIHelper"))id("closeAIHelper").onclick=()=>toggle(false);
    if(id("openAIHelperSettings"))id("openAIHelperSettings").onclick=()=>{document.getElementById("aiSettings")?.click()};
    if(id("connectAIHelper"))id("connectAIHelper").onclick=async()=>{
      const input=id("aiHelperAccessCode"),button=id("connectAIHelper");
      try{
        const code=String(input?.value||"").trim();
        AI.setAccessCode(code);
        button.disabled=true;button.textContent="Connecting…";
        const h=await AI.health({force:true,interactive:false});
        if(!h.ok){if(h.requires_access_code)AI.clearAccessCode();alert(h.message||"Research Chat could not connect.")}
        render();
      }catch(err){alert(err?.message||String(err));render()}
    };
    if(id("aiHelperUseContext"))id("aiHelperUseContext").onchange=e=>{p().aiHelper.includeProjectContext=e.target.checked;ctx.save?.()};
    if(id("clearAIHelper"))id("clearAIHelper").onclick=()=>{if(confirm("Clear this Research Chat conversation? Your research notebook will not be changed.")){H.clear(p());ctx.save?.();render()}};
    document.querySelectorAll("[data-ai-helper-prompt]").forEach(b=>b.onclick=()=>{const ta=id("aiHelperInput");if(!ta)return;ta.value=b.dataset.aiHelperPrompt;ta.focus()});
    if(id("aiHelperForm"))id("aiHelperForm").onsubmit=async e=>{e.preventDefault();await send()};
    if(id("aiHelperInput"))id("aiHelperInput").onkeydown=e=>{
      if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();id("aiHelperForm")?.requestSubmit()}
    };
  }
  async function send(){
    const ta=id("aiHelperInput"),q=String(ta?.value||"").trim();if(!q||busy)return;
    const st=status();if(st.kind!=="online")return;
    const payload=H.buildPayload(p(),q,ctx.PathCoach);
    H.addMessage(p(),"user",q,{stage:H.stage(p()).id,field_key:H.currentField(p())?.key||""});
    p().aiHelper.events.push({time:new Date().toISOString(),type:"question_sent",stage:H.stage(p()).id,field:H.currentField(p())?.key||""});
    ctx.save?.();busy=true;render();
    try{
      const r=await AI.chat(payload);
      const message=String(r.message||r.answer||r.summary||"").trim();
      if(!message)throw new Error("The chat service returned an empty answer.");
      const level=Math.max(0,Math.min(5,Number(r.scaffold_level_used??1)||0));
      const counts=Boolean(r.counts_as_stage_support);
      const responseStage=Number(r.stage_id||H.stage(p()).id);
      const guard=r.direct_completion_guard||{};
      H.addMessage(p(),"assistant",message,{
        stage:responseStage,scaffold_level:level,counts_as_stage_support:counts,
        response_kind:r.response_kind||"clarification",
        questions:Array.isArray(r.questions_for_student)?r.questions_for_student.slice(0,4):[],
        citations:Array.isArray(r.citations)?r.citations.slice(0,8):[],
        guard_note:guard.direct_answer_withheld?String(guard.reason||"This looks like an unfinished research decision, so I am helping you reason through it before supplying a completed answer."):""
      });
      p().aiHelper.events.push({time:new Date().toISOString(),type:"answer_received",stage:responseStage,scaffold_level:level,counts_as_stage_support:counts,response_kind:r.response_kind||""});
      if(counts&&level>0)ctx.Competency?.recordSupport?.(p(),responseStage,level,"Research Chat",`Conversational chat help · ${r.response_kind||"research clarification"}`);
      ctx.save?.();
    }catch(err){
      H.addMessage(p(),"error",String(err?.message||err));
      p().aiHelper.events.push({time:new Date().toISOString(),type:"request_error",detail:String(err?.message||err)});
      ctx.save?.();
    }finally{busy=false;render()}
  }
  function toggle(value){
    open=value==null?!open:!!value;render();
    if(open)requestAnimationFrame(()=>id("aiHelperInput")?.focus());
    else id("aiHelperLauncher")?.focus();
  }
  function refresh(){if(open)render()}
  function bind(project,save,Competency,PathCoach,Pilot,currentStage){
    ctx={project,save,Competency,PathCoach,Pilot,currentStage};H.normalizeProject(project);floatingButton();render();
    document.addEventListener("focusin",e=>{
      const control=e.target;
      if(!control?.matches?.("input,textarea,select") || control.closest("#aiHelperPanel"))return;
      const key=control.dataset?.field||control.id||control.name||"";if(!key)return;
      const label=control.closest("label")?.querySelector("span")?.textContent?.trim()||control.getAttribute("aria-label")||key;
      const origin=control.dataset?.field?"stage_notebook":"workspace_control";
      H.setLastField(project,key,label,control.value,control.tagName.toLowerCase(),origin);if(open)refresh();
    });
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&open&&id("aiHelperPanel")&&!id("aiHelperPanel").hidden){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();toggle(false)}});
    window.addEventListener("rms-ai-config-changed",refresh);
  }
  return {bind,render,refresh,toggle,send};
})();
