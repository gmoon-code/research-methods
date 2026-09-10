
window.RMSStudentHelpUI=(()=>{
  const G=window.RMSStudentGuidance,R=window.RMSResponseExamples,Guide=window.RMSGuidanceUI,RescueUI=window.RMSRescueUI,AIUI=window.RMSAIHelperUI,F=window.RMSStudentFlow,C=window.RMSCurriculum;
  const E=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const id=x=>document.getElementById(x);
  let ctx={project:null,currentStage:null};

  function fieldInfo(key){
    const stage=Number(ctx.currentStage?.()||ctx.project.currentStage||1),s=C.stages.find(x=>x.id===stage);
    for(const sec of s.sections||[])for(const f of sec.fields||[])if(f[0]===key)return{stage,label:F.fieldLabel(ctx.project,key,f[1]),type:f[2]};
    return{stage,label:key,type:"textarea"};
  }

  function openField(key,mode="help"){
    const info=fieldInfo(key),h=G.fields?.[key],r=R.fields?.[key],wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="unifiedHelpBackdrop";
    wrap.innerHTML=`<div class="modal unified-help-modal"><div class="journey-head"><div><div class="guide-kicker">Help for this field</div><h3>${E(info.label)}</h3></div><button class="ghost small" id="closeUnifiedHelp">Close</button></div>
      ${h?`<section class="help-block"><h4>What is this asking me to do?</h4><p>${E(h.meaning)}</p><p><b>What to write</b> ${E(h.write)}</p></section>`:""}
      ${r?`<section class="help-block ${mode==="example"?"emphasis":""}"><h4>What should a response look like?</h4><p><b>Typical response</b> ${E(r.expected_shape)} · ${E(r.typical_length)}</p><div class="help-example weak"><b>Too vague</b><p>${E(r.too_vague)}</p></div><div class="help-example strong"><b>Good working response</b><p>${E(r.good_working_response)}</p></div>${r.detailed_response?`<details><summary>See a more detailed model</summary><p>${E(r.detailed_response)}</p></details>`:""}</section>`:""}
      ${h?.questions?.length?`<section class="help-block"><h4>Questions to ask yourself</h4><ul>${h.questions.map(q=>`<li>${E(q)}</li>`).join("")}</ul></section>`:""}
      <div class="help-actions">
        <button class="secondary" id="openProgressiveFromHelp">Help me get unstuck</button>
        <button class="ghost" id="openTermsFromHelp">Look up a research term</button>
        <button class="ghost" id="openAIFromHelp">Research Chat</button>
      </div>
    </div>`;
    document.body.appendChild(wrap);id("closeUnifiedHelp").onclick=()=>wrap.remove();wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};
    id("openProgressiveFromHelp").onclick=()=>{wrap.remove();RescueUI.fieldModal(info.stage,key)};
    id("openTermsFromHelp").onclick=()=>{wrap.remove();Guide.glossaryModal("")};
    id("openAIFromHelp").onclick=()=>{wrap.remove();AIUI.toggle(true)};
  }

  function openGlobal(){
    const p=ctx.project,stage=Number(ctx.currentStage?.()||p.currentStage||1),s=C.stages.find(x=>x.id===stage),t=F.transitionFor(stage),wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="unifiedHelpBackdrop";
    wrap.innerHTML=`<div class="modal unified-help-modal"><div class="journey-head"><div><div class="guide-kicker">Help without leaving your place</div><h3>Help with Stage ${stage}</h3><p>${E(s.title)}</p></div><button class="ghost small" id="closeUnifiedHelp">Close</button></div>
      <section class="help-block"><h4>What should I be doing right now?</h4><p>${E(t.now)}</p><p><b>What happens next</b> ${E(t.next)}</p></section>
      <div class="help-choice-grid">
        <button id="openGuideFromHelp"><b>Explain this stage</b><span>Read the stage guide in beginner-friendly language.</span></button>
        <button id="openStuckFromHelp"><b>I have no idea what to do</b><span>Choose the exact decision that is blocking you and increase support gradually.</span></button>
        <button id="openTermsFromHelp"><b>Explain a research word</b><span>Search Research Terms without leaving the project.</span></button>
        <button id="openAIFromHelp"><b>Research Chat</b><span>Ask a question about this stage or your current project.</span></button>
      </div>
    </div>`;
    document.body.appendChild(wrap);id("closeUnifiedHelp").onclick=()=>wrap.remove();wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};
    id("openGuideFromHelp").onclick=()=>{wrap.remove();Guide.guideModal(stage)};
    id("openStuckFromHelp").onclick=()=>{wrap.remove();RescueUI.navigator(stage)};
    id("openTermsFromHelp").onclick=()=>{wrap.remove();Guide.glossaryModal("")};
    id("openAIFromHelp").onclick=()=>{wrap.remove();AIUI.toggle(true)};
  }

  function bind(project,currentStage){
    ctx={project,currentStage};
    if(document.documentElement.dataset.unifiedHelpBound)return;
    document.documentElement.dataset.unifiedHelpBound="1";
    document.addEventListener("click",e=>{
      const h=e.target.closest?.("[data-unified-help]");if(h){e.preventDefault();openField(h.dataset.unifiedHelp,"help");return}
      const x=e.target.closest?.("[data-unified-example]");if(x){e.preventDefault();openField(x.dataset.unifiedExample,"example");return}
    });
  }
  return {bind,openField,openGlobal};
})();
