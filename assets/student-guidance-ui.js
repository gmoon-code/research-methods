
window.RMSGuidanceUI=(()=>{
 const G=window.RMSStudentGuidance;
 const E=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
 const id=x=>document.getElementById(x);
 function termDef(term){return G.glossary[String(term||"").toLowerCase()]||""}
 function termsHTML(terms=[]){
   return `<div class="guide-terms">${terms.map(t=>`<details><summary>${E(t)}</summary><p>${E(termDef(t)||"Definition not yet available in the glossary.")}</p></details>`).join("")}</div>`;
 }
 function stagePanel(stageId,compact=false){
   const g=G.stages[Number(stageId)];if(!g)return"";
   if(compact)return `<div class="stage-help-compact"><strong>Not sure what to do?</strong><span>${E(g.plain)}</span><button class="ghost small" data-open-student-guide="${stageId}">Open step-by-step guide</button></div>`;
   return `<div class="stage-guide">
     <div class="guide-kicker">Student guide · Stage ${stageId}</div><h3>${E(g.title)}</h3><p class="guide-plain">${E(g.plain)}</p>
     <h4>How to do this stage</h4><ol class="guide-steps">${g.steps.map(x=>`<li>${E(x)}</li>`).join("")}</ol>
     <div class="guide-strong"><strong>What a strong response looks like</strong><p>${E(g.strong)}</p></div>
     <details class="guide-examples" open><summary>Examples to guide your thinking</summary>${g.examples.map(x=>`<div class="guide-example"><b>${E(x.label)}</b><p>${E(x.text)}</p></div>`).join("")}<div class="example-boundary">Examples are models of reasoning and specificity. Change the content to match your own project; do not paste an example as your answer.</div></details>
     <details class="guide-stuck"><summary>If you are stuck, try one of these</summary><ul>${g.stuck.map(x=>`<li>${E(x)}</li>`).join("")}</ul></details>
     <h4>Words you need for this stage</h4>${termsHTML(g.terms)}
   </div>`;
 }
 function fieldHelp(key,label){
   const h=G.fields[key];if(!h)return"";
   return `<details class="field-help"><summary>Need help with “${E(label)}”?</summary>
    <div class="field-help-grid"><div><b>What this means</b><p>${E(h.meaning)}</p></div><div><b>What to write</b><p>${E(h.write)}</p></div><div><b>Mini example</b><p>${E(h.example)}</p></div><div><b>Questions to ask yourself</b><ul>${(h.questions||[]).map(q=>`<li>${E(q)}</li>`).join("")}</ul></div></div>
    <div class="field-avoid"><b>Common mistake</b> ${E(h.avoid)}</div>
   </details>`;
 }
 function labelHelp(label){
   const hit=Object.entries(G.fields).find(([,h])=>h.meaning&&String(label).toLowerCase().includes(String(h.meaning).slice(0,0)));
   return "";
 }
 function labPanel(lab,tab){
   const h=G.labs?.[lab]?.[tab];if(!h)return"";
   return `<div class="lab-guide"><div><strong>${E(h.title)}</strong><p>${E(h.text)}</p></div><details><summary>Terms used here</summary>${termsHTML(h.terms||[])}</details></div>`;
 }
 function glossaryModal(initial=""){
   const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="glossaryBackdrop";
   const renderList=q=>{
     q=String(q||"").trim().toLowerCase();
     const items=Object.entries(G.glossary).filter(([k,v])=>!q||k.includes(q)||v.toLowerCase().includes(q)).sort((a,b)=>a[0].localeCompare(b[0]));
     return items.map(([k,v])=>`<div class="glossary-entry"><b>${E(k)}</b><p>${E(v)}</p></div>`).join("")||'<p class="muted">No matching term. Try a shorter word.</p>';
   };
   wrap.innerHTML=`<div class="modal glossary-modal"><div class="journey-head"><div><h3>Research Terms & Clarifications</h3><p>You are not expected to know these words before using the site. Search whenever a term is unclear.</p></div><button class="ghost small" id="closeGlossary">Close</button></div><label><span>Search a research term</span><input id="glossarySearch" value="${E(initial)}" placeholder="Try binary, paired, confounder, p-value…"></label><div id="glossaryList" class="glossary-list">${renderList(initial)}</div></div>`;
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
 return {stagePanel,fieldHelp,labPanel,termsHTML,glossaryModal,guideModal,bindDelegated,termDef};
})();
