
window.RMSGuidanceUI=(()=>{
 const G=window.RMSStudentGuidance,R=window.RMSResponseExamples;
 const E=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
 const id=x=>document.getElementById(x);
 function termDef(term){return G.glossary[String(term||"").toLowerCase()]||""}
 function termsHTML(terms=[]){
   return `<div class="guide-terms">${terms.map(t=>`<details><summary>${E(t)}</summary><p>${E(termDef(t)||"Definition not yet available in the glossary.")}</p></details>`).join("")}</div>`;
 }
 function choiceHelp(key){
   const c=G.choices?.[key];if(!c)return"";
   const rows=Object.entries(c.options||{}).map(([k,v])=>`<div class="choice-option"><b>${E(k)}</b><p>${E(v)}</p></div>`).join("");
   return `<details class="decision-help"><summary>${E(c.title||"How do I choose?")}</summary><p class="decision-prompt">${E(c.prompt||"")}</p><div class="choice-options">${rows}</div>${c.questions?.length?`<div class="decision-questions"><b>Ask yourself</b><ul>${c.questions.map(q=>`<li>${E(q)}</li>`).join("")}</ul></div>`:""}</details>`;
 }
 function stagePanel(stageId,compact=false){
   const g=G.stages[Number(stageId)];if(!g)return"";
   if(compact)return `<div class="stage-help-compact"><strong>Not sure what to do?</strong><span>${E(g.plain)}</span><button class="ghost small" data-open-student-guide="${stageId}">Open step-by-step guide</button></div>`;
   return `<div class="stage-guide">
     <div class="guide-kicker">Student guide · Stage ${stageId}</div><h3>${E(g.title)}</h3><p class="guide-plain">${E(g.plain)}</p>
     <h4>How to do this stage</h4><ol class="guide-steps">${g.steps.map(x=>`<li>${E(x)}</li>`).join("")}</ol>
     ${g.walkthrough?`<details class="guide-walkthrough" open><summary>See how a first-time researcher could think through this</summary><div class="walk-situation"><b>Situation</b><p>${E(g.walkthrough.situation)}</p></div><div class="walk-thinking"><b>Reasoning</b><ol>${g.walkthrough.thinking.map(x=>`<li>${E(x)}</li>`).join("")}</ol></div><div class="walk-draft"><b>Possible draft after that reasoning</b><p>${E(g.walkthrough.draft)}</p></div><div class="example-boundary">The value of this example is the reasoning path. Your own evidence and wording should come from your project.</div></details>`:""}
     <div class="guide-strong"><strong>What a strong response looks like</strong><p>${E(g.strong)}</p></div>
     <details class="guide-examples" open><summary>Examples to guide your thinking</summary>${g.examples.map(x=>`<div class="guide-example"><b>${E(x.label)}</b><p>${E(x.text)}</p></div>`).join("")}<div class="example-boundary">Examples are models of reasoning and specificity. Change the content to match your own project; do not paste an example as your answer.</div></details>
     <details class="guide-stuck"><summary>If you are stuck, try one of these</summary><ul>${g.stuck.map(x=>`<li>${E(x)}</li>`).join("")}</ul></details>
     <h4>Words you need for this stage</h4>${termsHTML(g.terms)}
   </div>`;
 }
 function responseCue(key,value="",type="textarea"){
   const r=R?.fields?.[key];if(!r)return"";
   if(type==="select")return `<div class="response-cue"><b>What belongs here</b><span>${E(r.expected_shape)}. ${E(r.typical_length)}</span></div>`;
   const words=String(value||"").trim()?String(value).trim().split(/\s+/).length:0;
   return `<div class="response-cue" data-response-cue="${E(key)}"><div><b>Typical working response</b><span>${E(r.expected_shape)} · ${E(r.typical_length)}</span></div><small data-response-count="${E(key)}">${words} word${words===1?"":"s"} currently</small></div>`;
 }
 function responseExamples(key){
   const r=R?.fields?.[key];if(!r)return"";
   return `<div class="response-models">
     <div class="response-expectation"><b>How much should I write?</b><p>${E(r.expected_shape)}. A typical working response is ${E(r.typical_length)}.</p><small>${E(r.length_note)}</small></div>
     <div class="response-contrast vague"><b>Too vague</b><p>${E(r.too_vague)}</p></div>
     <div class="response-contrast good"><b>Good working response</b><p>${E(r.good_working_response)}</p><small>This is a model from another research context. Use the level of specificity, not the answer.</small></div>
     ${r.detailed_response?`<div class="response-contrast detailed"><b>More detailed response when this field needs fuller explanation</b><p>${E(r.detailed_response)}</p></div>`:""}
     <div class="response-why"><b>Why this is the right kind of response</b><p>${E(r.why_it_works)}</p></div>
   </div>`;
 }
 function updateResponseCount(key,value){
   const el=document.querySelector(`[data-response-count="${CSS.escape(String(key))}"]`);if(!el)return;
   const words=String(value||"").trim()?String(value).trim().split(/\s+/).length:0;
   el.textContent=`${words} word${words===1?"":"s"} currently`;
 }
 function fieldHelp(key,label){
   const h=G.fields[key];if(!h)return"";
   return `<details class="field-help"><summary>Need help with “${E(label)}”?</summary>
    ${responseExamples(key)}
    <div class="field-help-grid"><div><b>What this means</b><p>${E(h.meaning)}</p></div><div><b>What to write</b><p>${E(h.write)}</p></div><div><b>Quick mini example</b><p>${E(h.example)}</p></div><div><b>Questions to ask yourself</b><ul>${(h.questions||[]).map(q=>`<li>${E(q)}</li>`).join("")}</ul></div></div>
    <div class="field-avoid"><b>Common mistake</b> ${E(h.avoid)}</div>${choiceHelp(key)}
   </details>`;
 }
 function labelHelp(label){
   const hit=Object.entries(G.fields).find(([,h])=>h.meaning&&String(label).toLowerCase().includes(String(h.meaning).slice(0,0)));
   return "";
 }
 function labPanel(lab,tab){
   const h=G.labs?.[lab]?.[tab];if(!h)return"";
   return `<details class="lab-guide"><summary>Help with this step</summary><div><strong>${E(h.title)}</strong><p>${E(h.text)}</p>${(h.decisionKeys||[]).map(k=>choiceHelp(k)).join("")}<button class="ghost small lab-rescue-button" data-rescue-lab="${E(lab)}|${E(tab)}">I’m stuck · open progressive help</button><details><summary>Research terms used here</summary>${termsHTML(h.terms||[])}</details></div></details>`;
 }
 function glossaryModal(initial=""){
   const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="glossaryBackdrop";
   const allItems=()=>Object.entries(G.glossary).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>`<div class="glossary-entry"><b>${E(k)}</b><p>${E(v)}</p></div>`).join("");
   const renderList=q=>{
     q=String(q||"").trim().toLowerCase();
     if(!q)return `<div class="glossary-start"><b>Search for the word that is stopping you.</b><p>Try part of a word if you are unsure of the exact term.</p><details><summary>Browse all research terms</summary><div class="glossary-list">${allItems()}</div></details></div>`;
     const items=Object.entries(G.glossary).filter(([k,v])=>k.includes(q)||v.toLowerCase().includes(q)).sort((a,b)=>a[0].localeCompare(b[0]));
     return items.map(([k,v])=>`<div class="glossary-entry"><b>${E(k)}</b><p>${E(v)}</p></div>`).join("")||'<p class="muted">No matching term. Try a shorter word.</p>';
   };
   wrap.innerHTML=`<div class="modal glossary-modal"><div class="journey-head"><div><h3>Research Terms</h3><p>${E(G.novicePromise||"You are not expected to know these words before using the site.")}</p></div><button class="ghost small" id="closeGlossary">Close</button></div><label><span>What word do you want explained?</span><input id="glossarySearch" value="${E(initial)}" placeholder="Try binary, confounder, p-value, sampling…"></label><div id="glossaryList" class="glossary-results">${renderList(initial)}</div></div>`;
   document.body.appendChild(wrap);id("closeGlossary").onclick=()=>wrap.remove();wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};id("glossarySearch").oninput=()=>id("glossaryList").innerHTML=renderList(id("glossarySearch").value);id("glossarySearch").focus();
 }
 function guideModal(stageId){
   const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="studentGuideBackdrop";
   wrap.innerHTML=`<div class="modal student-guide-modal"><div class="journey-head"><div><h3>Stage ${stageId} Student Guide</h3><p>Use this when you need more explanation before continuing.</p></div><button class="ghost small" id="closeStudentGuide">Close</button></div>${stagePanel(stageId,false)}</div>`;
   document.body.appendChild(wrap);id("closeStudentGuide").onclick=()=>wrap.remove();wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};
 }
 function bindDelegated(){
   if(document.documentElement.dataset.guidanceBound)return;
   document.documentElement.dataset.guidanceBound="1";
   document.addEventListener("click",e=>{
     const g=e.target.closest?.("[data-open-student-guide]");if(g){e.preventDefault();guideModal(Number(g.dataset.openStudentGuide));return}
     const t=e.target.closest?.("[data-open-glossary]");if(t){e.preventDefault();glossaryModal(t.dataset.openGlossary||"");return}
   });
 }
 return {stagePanel,fieldHelp,responseCue,responseExamples,updateResponseCount,choiceHelp,labPanel,termsHTML,glossaryModal,guideModal,bindDelegated,termDef};
})();
