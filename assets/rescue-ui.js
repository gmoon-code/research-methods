
window.RMSRescueUI=(()=>{
 const R=window.RMSRescue,G=window.RMSStudentGuidance,Paths=window.RMSPathways;
 const E=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
 const id=x=>document.getElementById(x);
 let ctx={project:null,save:null,Competency:null,render:null,currentStage:null};
 function pathId(){return ctx.project?.pathway?.selected||"unsure"}
 function close(){id("rescueBackdrop")?.remove()}
 function levelButton(n,st){
   const used=st.levelsUsed.includes(n),open=R.canOpen(st,n);
   const names={1:"Clarify the task",2:"Explain the concept",3:"Compare examples",4:"Parallel walkthrough",5:"Build my answer"};
   return `<button class="rescue-level ${used?"used":""}" data-rescue-level="${n}" ${open?"":"disabled"}><span>L${n}</span><b>${names[n]}</b>${used?"<small>used</small>":open?"":"<small>open the prior level first</small>"}</button>`;
 }
 function levelContent(cfg,n){
   const x=cfg.levels[String(n)];
   if(n===1)return `<div class="rescue-content"><h4>${E(x.name)}</h4><p>${E(x.body)}</p><div class="rescue-reflect"><b>Before going further</b><p>${E(x.prompt)}</p></div></div>`;
   if(n===2)return `<div class="rescue-content"><h4>${E(x.name)}</h4><p>${E(x.body)}</p>${x.questions?.length?`<b>Ask yourself</b><ul>${x.questions.map(q=>`<li>${E(q)}</li>`).join("")}</ul>`:""}</div>`;
   if(n===3){
     const c=x.choice;
     return `<div class="rescue-content"><h4>${E(x.name)}</h4><div class="rescue-example good"><b>Model of the expected specificity</b><p>${E(x.strong_example)}</p></div><div class="rescue-example avoid"><b>Common mistake to avoid</b><p>${E(x.avoid)}</p></div>${c?`<div class="rescue-choices"><b>${E(c.title)}</b><p>${E(c.prompt||"")}</p>${Object.entries(c.options||{}).map(([k,v])=>`<div><strong>${E(k)}</strong><span>${E(v)}</span></div>`).join("")}</div>`:""}</div>`;
   }
   if(n===4){
     const w=x.walkthrough;
     return `<div class="rescue-content"><h4>${E(x.name)}</h4>${w?`<div class="parallel-tag">Parallel example · do not copy as your answer</div><div class="walk-situation"><b>Situation</b><p>${E(w.situation)}</p></div><ol>${(w.thinking||[]).map(t=>`<li>${E(t)}</li>`).join("")}</ol><div class="walk-draft"><b>Where that reasoning leads</b><p>${E(w.draft)}</p></div>`:`<p>Use the Stage Guide's worked reasoning example, then return here.</p>`}<div class="example-boundary">${E(x.boundary||"")}</div></div>`;
   }
   return "";
 }
 function builder(cfg,key,current,meta){
   const frame=R.currentFrame(pathId(),key),isSelect=meta.type==="select";
   if(isSelect){
     return `<div class="rescue-content rescue-builder"><h4>Help me build my own answer</h4><div class="rescue-frame"><b>Decision frame</b><p>Choose the option that matches the evidence structure, then explain why it fits your project. The choice is not applied until you provide the reasoning.</p></div>
       <label><span>Choice</span><select id="rescueOwnAnswer"><option value="">Choose…</option>${(meta.options||[]).map(o=>`<option ${current===o?"selected":""}>${E(o)}</option>`).join("")}</select></label>
       <label><span>Why does this choice fit your project?</span><textarea id="rescueRationale" placeholder="Explain the evidence/design feature that makes this option appropriate."></textarea></label>
       <button class="primary" id="applyRescueAnswer">Apply my choice</button><div id="rescueApplyStatus"></div></div>`;
   }
   return `<div class="rescue-content rescue-builder"><h4>Help me build my own answer</h4><div class="rescue-frame"><b>Use this structure</b><p>${E(frame)}</p></div>
     <label><span>1. Write the core answer in your own words</span><textarea id="rescueCore" placeholder="Write your project-specific decision, observation, or claim."></textarea></label>
     <label><span>2. Add the specific detail or evidence that makes it precise</span><textarea id="rescueDetail" placeholder="Add units, population, procedure, evidence, comparison, or boundary as relevant."></textarea></label>
     <label><span>3. Explain why this fits your project</span><textarea id="rescueRationale" placeholder="This rationale is required before the system will apply the draft."></textarea></label>
     <div class="rescue-preview"><b>Your assembled draft</b><p id="rescuePreview">Start typing above. The system only combines your own words.</p></div>
     <button class="primary" id="applyRescueAnswer">Apply my draft to this field</button><div id="rescueApplyStatus"></div></div>`;
 }
 function fieldModal(stage,key){
   const cfg=R.model.fields[key];if(!cfg)return;
   const p=ctx.project,st=R.fieldState(p,stage,key),current=String(p.data?.[key]??""),meta=cfg;
   const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="rescueBackdrop";
   wrap.innerHTML=`<div class="modal rescue-modal"><div class="journey-head"><div><div class="guide-kicker">Progressive help · Stage ${stage}</div><h3>${E(Paths?.label?Paths.label(p,key,cfg.label):cfg.label)}</h3><p>Support increases one level at a time. Your current attempt is preserved before the first level is recorded.</p></div><button class="ghost small" id="closeRescue">Close</button></div>
     <div class="rescue-attempt"><b>Your current attempt</b><p>${current.trim()?E(current):"<em>No text yet. Requesting help will record that you could not yet start this field.</em>"}</p></div>
     <div class="rescue-ladder">${[1,2,3,4,5].map(n=>levelButton(n,st)).join("")}</div>
     <div id="rescueLevelContent">${st.maxLevel?levelContent(cfg,Math.min(st.maxLevel,4)):"<div class='rescue-start'><b>Start with Level 1.</b><p>Each higher level becomes available after the previous level is opened.</p></div>"}</div>
     <div class="rescue-integrity"><b>Authorship rule</b><p>Examples are not inserted automatically. Level 5 can organize only the words and choices you provide, and it requires you to explain why the answer fits.</p></div>
   </div>`;
   document.body.appendChild(wrap);id("closeRescue").onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};
   bindFieldModal(stage,key,cfg,current,meta);
 }
 function bindFieldModal(stage,key,cfg,current,meta){
   document.querySelectorAll("[data-rescue-level]").forEach(b=>b.onclick=()=>{
     const n=Number(b.dataset.rescueLevel),st=R.fieldState(ctx.project,stage,key);
     if(!R.canOpen(st,n))return;
     R.useFieldLevel(ctx.project,stage,key,n,current,pathId(),ctx.Competency);ctx.save();
     if(n<5) id("rescueLevelContent").innerHTML=levelContent(cfg,n);
     else id("rescueLevelContent").innerHTML=builder(cfg,key,current,meta);
     document.querySelectorAll("[data-rescue-level]").forEach(x=>{
       const nn=Number(x.dataset.rescueLevel),s=R.fieldState(ctx.project,stage,key);
       x.disabled=!R.canOpen(s,nn);x.classList.toggle("used",s.levelsUsed.includes(nn));
       const sm=x.querySelector("small");if(sm)sm.textContent=s.levelsUsed.includes(nn)?"used":R.canOpen(s,nn)?"":"open the prior level first";
     });
     if(n===5)bindBuilder(stage,key,current,meta);
   });
 }
 function bindBuilder(stage,key,before,meta){
   if(meta.type!=="select"){
     const update=()=>{const a=id("rescueCore")?.value.trim()||"",b=id("rescueDetail")?.value.trim()||"";id("rescuePreview").textContent=[a,b].filter(Boolean).join(" ")||"Start typing above. The system only combines your own words."};
     ["rescueCore","rescueDetail"].forEach(x=>{if(id(x))id(x).oninput=update});
   }
   id("applyRescueAnswer").onclick=()=>{
     try{
       let after="";
       if(meta.type==="select") after=id("rescueOwnAnswer").value;
       else after=[id("rescueCore").value.trim(),id("rescueDetail").value.trim()].filter(Boolean).join(" ");
       const rationale=id("rescueRationale").value.trim();
       R.applyFieldRevision(ctx.project,stage,key,before,after,rationale,pathId(),ctx.Competency);
       ctx.project.data[key]=after;ctx.save();
       id("rescueApplyStatus").innerHTML='<div class="coach-feedback good"><b>Applied.</b><br>Your original attempt remains in the rescue history. Re-read the field in your notebook and edit the wording if needed.</div>';
       if(ctx.render)setTimeout(()=>{close();ctx.render()},450);
     }catch(e){id("rescueApplyStatus").innerHTML=`<div class="coach-feedback warn">${E(e.message)}</div>`}
   };
 }
 function navigator(stage){
   const p=ctx.project,allEntries=Object.entries(R.model.fields).filter(([k,x])=>Number(x.stage)===Number(stage)&&(!Paths?.shouldShowField||Paths.shouldShowField(p,k,stage)));
   let currentKeys=[];
   try{
     const s=window.RMSCurriculum.stages.find(x=>Number(x.id)===Number(stage)),secs=(s.sections||[]).map(sec=>({...sec,fields:sec.fields.filter(f=>!Paths?.shouldShowField||Paths.shouldShowField(p,f[0],stage))})).filter(sec=>sec.fields.length);
     const idx=window.RMSStudentFlow?.sectionIndex?.(p,stage,secs.length)||0;
     currentKeys=(secs[idx]?.fields||[]).map(f=>f[0]);
   }catch{}
   const current=allEntries.filter(([k])=>currentKeys.includes(k)),other=allEntries.filter(([k])=>!currentKeys.includes(k));
   const renderEntries=entries=>entries.map(([k,x])=>{const val=String(p.data?.[k]??"").trim(),lv=R.maxFieldLevel(p,stage,k);return `<button data-rescue-field="${k}"><div><b>${E(Paths?.label?Paths.label(p,k,x.label):x.label)}</b><small>${val?"Has a current response":"Blank"} · help L${lv}</small></div><span>Open help →</span></button>`}).join("");
   const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="rescueBackdrop",sum=R.stageSupportSummary(p,stage);
   wrap.innerHTML=`<div class="modal rescue-modal rescue-navigator"><div class="journey-head"><div><div class="guide-kicker">No-dead-end help</div><h3>What are you stuck on?</h3><p>Start with the part you are working on now. Help becomes more direct only when you request another level.</p></div><button class="ghost small" id="closeRescue">Close</button></div>
     <div class="rescue-stage-summary"><span>Stage</span><b>${stage}</b><span>Highest optional help used here</span><b>L${sum.maxLevel||0}</b></div>
     <h4>Current part of this stage</h4><div class="rescue-field-list">${renderEntries(current.length?current:allEntries.slice(0,4))}</div>
     ${other.length?`<details class="other-stage-help"><summary>Other fields in Stage ${stage}</summary><div class="rescue-field-list">${renderEntries(other)}</div></details>`:""}
     <div class="rescue-integrity"><b>If you cannot even start</b><p>That is okay. Open the field and begin at Level 1. Your blank or original attempt is preserved before stronger support appears.</p></div>
   </div>`;
   document.body.appendChild(wrap);id("closeRescue").onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};
   document.querySelectorAll("[data-rescue-field]").forEach(b=>b.onclick=()=>{const k=b.dataset.rescueField;close();fieldModal(stage,k)});
 }
 function labModal(lab,tab){
   const cfg=R.model.labs?.[lab]?.[tab];if(!cfg)return;
   const p=ctx.project,st=R.labState(p,lab,tab),wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="rescueBackdrop";
   const choices=(cfg.decision_keys||[]).map(k=>G.choices?.[k]).filter(Boolean);
   wrap.innerHTML=`<div class="modal rescue-modal"><div class="journey-head"><div><div class="guide-kicker">Progressive laboratory help</div><h3>${E(cfg.title)}</h3><p>Use only as much support as you need. Lab help is logged to Stage ${cfg.stage}.</p></div><button class="ghost small" id="closeRescue">Close</button></div>
     <div class="rescue-ladder">${[1,2,3,4,5].map(n=>levelButton(n,st)).join("")}</div><div id="rescueLevelContent"><div class="rescue-start"><b>Start at Level 1.</b></div></div></div>`;
   document.body.appendChild(wrap);id("closeRescue").onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};
   document.querySelectorAll("[data-rescue-level]").forEach(b=>b.onclick=()=>{
     const n=Number(b.dataset.rescueLevel),s=R.labState(p,lab,tab);if(!R.canOpen(s,n))return;
     R.useLabLevel(p,lab,tab,n,pathId(),ctx.Competency);ctx.save();
     if(n===1)id("rescueLevelContent").innerHTML=`<div class="rescue-content"><h4>Clarify the task</h4><p>${E(cfg.body)}</p><div class="rescue-reflect">What exact decision or action in this tab is stopping you?</div></div>`;
     if(n===2)id("rescueLevelContent").innerHTML=`<div class="rescue-content"><h4>Explain the concepts</h4>${(cfg.terms||[]).map(t=>`<details><summary>${E(t)}</summary><p>${E(G.glossary?.[String(t).toLowerCase()]||"Use Research Terms for this concept.")}</p></details>`).join("")||"<p>Use the contextual guide above the laboratory tab and identify the evidence structure before choosing a tool.</p>"}</div>`;
     if(n===3)id("rescueLevelContent").innerHTML=`<div class="rescue-content"><h4>Compare the available choices</h4>${choices.length?choices.map(c=>`<div class="rescue-choices"><b>${E(c.title)}</b><p>${E(c.prompt||"")}</p>${Object.entries(c.options||{}).map(([k,v])=>`<div><strong>${E(k)}</strong><span>${E(v)}</span></div>`).join("")}</div>`).join(""):"<p>Compare the candidate choices by asking what evidence each one assumes and what claim it permits.</p>"}</div>`;
     if(n===4){const w=cfg.walkthrough;id("rescueLevelContent").innerHTML=`<div class="rescue-content"><h4>Parallel walkthrough</h4>${w?`<div class="parallel-tag">Different context</div><p><b>Situation</b> ${E(w.situation)}</p><ol>${w.thinking.map(x=>`<li>${E(x)}</li>`).join("")}</ol><p><b>Resulting draft</b> ${E(w.draft)}</p>`:"<p>Return to the Stage Guide and follow its worked reasoning example.</p>"}</div>`}
     if(n===5){id("rescueLevelContent").innerHTML=`<div class="rescue-content rescue-builder"><h4>Build the next decision from your own reasoning</h4><p>${E(cfg.next_prompt)}</p><label><span>My next decision / plan</span><textarea id="labRescueNote"></textarea></label><label><span>Why it fits this project</span><textarea id="labRescueRationale"></textarea></label><button class="primary" id="saveLabRescue">Save my reasoning note</button><div id="labRescueStatus"></div></div>`;id("saveLabRescue").onclick=()=>{try{R.saveLabNote(p,lab,tab,id("labRescueNote").value,id("labRescueRationale").value,pathId(),ctx.Competency);ctx.save();id("labRescueStatus").innerHTML='<div class="coach-feedback good">Saved to the project rescue history. Return to the lab and make the actual decision there.</div>'}catch(e){id("labRescueStatus").innerHTML=`<div class="coach-feedback warn">${E(e.message)}</div>`}}}
     document.querySelectorAll("[data-rescue-level]").forEach(x=>{const nn=Number(x.dataset.rescueLevel),ss=R.labState(p,lab,tab);x.disabled=!R.canOpen(ss,nn);x.classList.toggle("used",ss.levelsUsed.includes(nn));});
   });
 }
 function bind(project,save,Competency,render,currentStage){
   ctx={project,save,Competency,render,currentStage};
   R.normalizeProject(project);
   if(document.documentElement.dataset.rescueBound)return;
   document.documentElement.dataset.rescueBound="1";
   document.addEventListener("click",e=>{
     const f=e.target.closest?.("[data-progressive-help]");if(f){e.preventDefault();fieldModal(Number(f.dataset.helpStage),f.dataset.progressiveHelp);return}
     const n=e.target.closest?.("[data-open-rescue-navigator]");if(n){e.preventDefault();navigator(Number(n.dataset.openRescueNavigator)||Number(ctx.currentStage?.())||1);return}
     const l=e.target.closest?.("[data-rescue-lab]");if(l){e.preventDefault();const [lab,tab]=l.dataset.rescueLab.split("|");labModal(lab,tab);return}
   });
 }
 return {bind,fieldModal,navigator,labModal};
})();
