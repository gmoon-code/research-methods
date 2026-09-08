
window.RMSTransferUI=(()=>{
 const T=window.RMSTransfer,C=window.RMSCompetency;
 const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])),id=x=>document.getElementById(x);
 const dl=(n,t,type="application/json")=>{const b=new Blob([t],{type}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
 function taskView(p,set,taskId){
   const t=T.task(taskId),r=set.responses[taskId]||{},locked=!!r.independent;
   return `<div class="transfer-task"><div class="transfer-task-head"><div><span>${esc(t.id)} · ${esc(t.domain)}</span><h4>${esc(t.title)}</h4></div><div>${(t.competencies||[]).map(k=>`<span class="transfer-comp">${esc(C?.model?.competencies?.find(x=>x.key===k)?.id||k)}</span>`).join("")}</div></div>
    <div class="scenario">${esc(t.scenario)}</div><ol>${t.prompts.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>
    ${!locked?`<label><span>Your independent response</span><textarea id="transferResponse" class="transfer-response"></textarea></label><div class="transfer-rule"><strong>No coaching yet.</strong> Submit this response before opening the conceptual cue. This first response is locked as transfer evidence.</div><button class="primary" id="submitTransfer">Lock independent response</button>`:
    `<div class="locked-response"><strong>Independent response locked</strong><p>${esc(r.independent.text)}</p><small>${esc(new Date(r.independent.time).toLocaleString())}</small></div>
      ${!r.supportUsed?`<button class="ghost small" id="openTransferCue">Optional conceptual cue</button>`:`<div class="transfer-cue"><strong>Conceptual cue · support level 2</strong><p>${esc(t.cue)}</p></div>`}
      ${r.supportUsed?`<label><span>Optional revised response after the cue</span><textarea id="transferRevision" class="transfer-response">${esc(r.revision?.text||"")}</textarea></label><button class="secondary small" id="saveTransferRevision">Save supported revision</button>`:""}
    `}
   </div>`;
 }
 function student(p,save){
   T.normalizeProject(p);let set=T.currentSet(p);
   if(!set)return `<div class="transfer-section"><h4>Novel-context transfer assessment</h4><p>The Transfer Lab selects candidate tasks whose surface topic overlaps as little as possible with your current project while covering different research competencies.</p><div class="transfer-warning"><strong>Candidate classroom assessment only.</strong><br>These tasks are public and unvalidated. They cannot serve as a secret held-out test in formal validation research.</div><button class="primary" id="startTransfer">Start 3-task transfer set</button></div>`;
   const prog=T.setProgress(p,set),next=set.taskIds.find(x=>!set.responses[x]?.independent)||set.taskIds[set.taskIds.length-1],profile=T.transferProfile(p);
   return `<div class="transfer-section"><div class="transfer-set-head"><div><span>${esc(set.id)}</span><h4>${set.status==="complete"?"Completed transfer set":"Transfer set in progress"}</h4></div><b>${prog.independent}/${prog.total} independent responses</b></div>
    <div class="transfer-progress">${set.taskIds.map(x=>`<span class="${set.responses[x]?.independent?"done":""}">${esc(x)}</span>`).join("")}</div>
    ${set.status!=="complete"?taskView(p,set,next):`<div class="stat-good">All independent responses are locked. Transfer competence still requires human rating using the task-specific criteria.</div>`}
    ${prog.complete&&set.status!=="complete"?'<button class="primary" id="finalizeTransfer">Complete transfer set</button>':""}
    ${set.status==="complete"?`<div class="button-row"><button class="primary" id="exportTransferPacket">Export blinded response packet</button><label class="ghost file-button">Import rated packet<input type="file" hidden id="importTransferRatings" accept=".json,application/json"></label><button class="ghost" id="newTransferSet">Start another set</button></div>`:""}
    ${profile.length?`<div class="transfer-profile"><h4>Imported human ratings</h4>${profile.map(x=>`<div><span>${esc(C?.model?.competencies?.find(c=>c.key===x.competency)?.name||x.competency)}</span><b>${x.mean.toFixed(2)} / 3</b><small>n=${x.n}; range ${x.min}–${x.max}</small></div>`).join("")}</div>`:""}
   </div>`;
 }
 function rater(){
   return `<div class="transfer-section"><h4>Human rater workspace</h4><p>Import a blinded transfer-response packet. Rate only the evidence in the response using the general 0–3 rubric plus the task-specific evidence criterion. Do not see another rater's scores first.</p>
    <label class="primary file-button">Import response packet<input type="file" hidden id="raterInput" accept=".json,application/json"></label><div id="raterWorkspace"></div></div>`;
 }
 function validation(){
   return `<div class="transfer-section"><h4>Two-rater agreement workspace</h4><p>Import two independently completed rater packets for the same response set. Agreement metrics describe scoring consistency; they do not validate the competency construct itself.</p>
    <div class="form-grid two"><label><span>Rater A packet</span><input type="file" id="raterA" accept=".json,application/json"></label><label><span>Rater B packet</span><input type="file" id="raterB" accept=".json,application/json"></label></div><button class="secondary" id="calcAgreement">Calculate agreement</button><div id="agreementResult"></div></div>`;
 }
 function protocol(){
   return `<div class="transfer-section"><h4>Validation boundary</h4><div class="transfer-warning"><strong>Public task bank ≠ held-out validation set.</strong><br>Any formal study of instrument performance needs a separately authored, privately stored item pool that is frozen before evaluation and never used to tune the scoring system.</div>
   <div class="protocol-grid"><div><b>Development items</b><p>May be revised after pilot feedback. Used to improve instructions, rubric language, and software.</p></div><div><b>Locked evaluation items</b><p>Stored outside the public GitHub repository. Human raters score responses without seeing engine output.</p></div><div><b>Rater reliability</b><p>Report exact agreement and kappa statistics with confusion matrices and disagreement review.</p></div><div><b>Construct validation</b><p>Requires more than agreement. Examine content coverage, response processes, relationships with external evidence, fairness, and transfer.</p></div></div></div>`;
 }
 function open(p,save,active="student"){
   T.normalizeProject(p);const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="transferBackdrop",tabs=[["student","Student transfer"],["rater","Rater mode"],["validation","Agreement"],["protocol","Validation protocol"]];
   const content=active==="student"?student(p,save):active==="rater"?rater():active==="validation"?validation():protocol();
   wrap.innerHTML=`<div class="modal transfer-modal"><div class="journey-head"><div><h3>Transfer Assessment & Validation Lab</h3><p>Novel-context response → locked first attempt → optional support → human rating → reliability analysis.</p></div><button class="ghost small" id="closeTransfer">Close</button></div><div class="transfer-tabs">${tabs.map(([k,l])=>`<button data-ttab="${k}" class="${active===k?"active":""}">${l}</button>`).join("")}</div>${content}</div>`;
   document.body.appendChild(wrap);const rr=t=>{wrap.remove();open(p,save,t||active)};wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};id("closeTransfer").onclick=()=>wrap.remove();document.querySelectorAll("[data-ttab]").forEach(b=>b.onclick=()=>rr(b.dataset.ttab));
   bind(p,save,rr,active);
 }
 function bind(p,save,rr,active){
   if(id("startTransfer"))id("startTransfer").onclick=()=>{T.startSet(p,3);save();rr("student")};
   if(id("submitTransfer"))id("submitTransfer").onclick=()=>{const s=T.currentSet(p),task=s.taskIds.find(x=>!s.responses[x]?.independent);if(!id("transferResponse").value.trim()){alert("Write your response first.");return}T.submitIndependent(p,s.id,task,id("transferResponse").value);save();rr("student")};
   if(id("openTransferCue"))id("openTransferCue").onclick=()=>{const s=T.currentSet(p),task=s.taskIds.find(x=>s.responses[x]?.independent&&!s.responses[x]?.revision)||s.taskIds[s.taskIds.length-1];T.useCue(p,s.id,task);save();rr("student")};
   if(id("saveTransferRevision"))id("saveTransferRevision").onclick=()=>{const s=T.currentSet(p),task=s.taskIds.find(x=>s.responses[x]?.independent&&s.responses[x]?.supportUsed&&!s.responses[x]?.revision)||s.taskIds[s.taskIds.length-1];T.saveRevision(p,s.id,task,id("transferRevision").value);save();rr("student")};
   if(id("finalizeTransfer"))id("finalizeTransfer").onclick=()=>{T.finalizeSet(p,T.currentSet(p).id);save();rr("student")};
   if(id("exportTransferPacket"))id("exportTransferPacket").onclick=()=>{const s=T.currentSet(p),packet=T.responsePacket(p,s.id);dl(`${packet.blinded_id}-transfer-response.json`,JSON.stringify(packet,null,2))};
   if(id("newTransferSet"))id("newTransferSet").onclick=()=>{T.startSet(p,3);save();rr("student")};
   if(id("importTransferRatings"))id("importTransferRatings").onchange=async()=>{const f=id("importTransferRatings").files?.[0];if(!f)return;try{T.importRatings(p,JSON.parse(await f.text()));save();rr("student")}catch(e){alert(e.message)}};

   if(id("raterInput"))id("raterInput").onchange=async()=>{const f=id("raterInput").files?.[0];if(!f)return;let packet;try{packet=JSON.parse(await f.text())}catch{alert("Invalid JSON.");return}
     if(packet.packet_type!=="rms_transfer_response"){alert("Not a transfer response packet.");return}
     const out=T.raterTemplate(packet,"");
     id("raterWorkspace").innerHTML=`<div class="rater-header"><label><span>Rater ID / initials</span><input id="raterId"></label><div><span>Blinded set</span><b>${esc(packet.blinded_id)}</b></div></div>${packet.tasks.map((x,ti)=>{
       const task=T.task(x.task_id);return `<div class="rater-task"><h4>${esc(x.task_id)} · ${esc(x.title)}</h4><div class="scenario">${esc(x.scenario)}</div><div class="locked-response"><strong>Independent response</strong><p>${esc(x.independent_response)}</p></div>${x.supported_revision?`<details><summary>Supported revision · L${x.support_level}</summary><p>${esc(x.supported_revision)}</p></details>`:""}<div class="rating-grid">${x.competencies.map(c=>`<div class="rating-row"><div><b>${esc(C?.model?.competencies?.find(z=>z.key===c)?.name||c)}</b><p>${esc(task.criteria[c]||"")}</p></div><select data-rate-level="${ti}|${c}"><option value="">Rate…</option><option value="0">0 · Emerging</option><option value="1">1 · Supported</option><option value="2">2 · Developing independence</option><option value="3">3 · Independent reasoning</option></select><input data-rate-note="${ti}|${c}" placeholder="Evidence note"></div>`).join("")}</div></div>`}).join("")}<button class="primary" id="exportRaterPacket">Export rater packet</button>`;
     id("exportRaterPacket").onclick=()=>{out.rater_id=id("raterId").value.trim();out.created_at=new Date().toISOString();out.ratings=[];packet.tasks.forEach((x,ti)=>x.competencies.forEach(c=>{const level=document.querySelector(`[data-rate-level="${ti}|${c}"]`)?.value;if(level==="")return;out.ratings.push({task_id:x.task_id,competency:c,response_type:"independent",level:Number(level),note:document.querySelector(`[data-rate-note="${ti}|${c}"]`)?.value||""})}));if(!out.ratings.length){alert("Enter at least one rating.");return}dl(`${packet.blinded_id}-${out.rater_id||"rater"}-ratings.json`,JSON.stringify(out,null,2))};
   };

   if(id("calcAgreement"))id("calcAgreement").onclick=async()=>{const fa=id("raterA").files?.[0],fb=id("raterB").files?.[0];if(!fa||!fb){alert("Choose both rater packets.");return}let A,B;try{A=JSON.parse(await fa.text());B=JSON.parse(await fb.text())}catch{alert("Invalid JSON.");return}
     if(A.response_set_id!==B.response_set_id){alert("Rater packets are for different response sets.");return}
     const pairs=T.alignedRatings(A,B),a=T.agreement(pairs),by=T.agreementByCompetency(A,B),dis=T.disagreements(A,B),pct=x=>x===null?"—":(x*100).toFixed(1)+"%",num=x=>x===null?"—":x.toFixed(3);
     id("agreementResult").innerHTML=`<div class="agreement-summary"><div><span>Aligned ratings</span><b>${a.n}</b></div><div><span>Exact agreement</span><b>${pct(a.agreement)}</b></div><div><span>Cohen κ</span><b>${num(a.kappa)}</b></div><div><span>Quadratic weighted κ</span><b>${num(a.weightedKappa)}</b></div><div><span>Disagreements</span><b>${dis.length}</b></div></div>
       <div class="table-wrap"><table><thead><tr><th>Competency</th><th>n</th><th>Agreement</th><th>κ</th><th>Weighted κ</th></tr></thead><tbody>${by.map(x=>`<tr><td>${esc(C?.model?.competencies?.find(z=>z.key===x.competency)?.name||x.competency)}</td><td>${x.n}</td><td>${pct(x.agreement)}</td><td>${num(x.kappa)}</td><td>${num(x.weightedKappa)}</td></tr>`).join("")}</tbody></table></div>
       <div class="transfer-warning"><strong>Interpretation</strong><br>Agreement does not establish that the rubric measures the intended construct. Small n can make kappa unstable, and prevalence/marginal distributions affect unweighted kappa.</div>
       <button class="ghost small" id="exportDisagreements">Export disagreement JSON</button>`;
     id("exportDisagreements").onclick=()=>dl(`${A.blinded_id||A.response_set_id}-rater-disagreements.json`,JSON.stringify({response_set_id:A.response_set_id,rater_a:A.rater_id,rater_b:B.rater_id,summary:a,by_competency:by,disagreements:dis},null,2));
   };
 }
 return {open};
})();
