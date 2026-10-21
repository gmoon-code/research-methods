/* Review-only visual authoring for the four existing student laboratory guides.
 * This module never mutates student guidance, tool logic or publication services.
 */
window.RMSLabGuidanceAuthoring=(()=>{
  "use strict";
  const $=id=>document.getElementById(id);
  const clone=value=>JSON.parse(JSON.stringify(value));
  const original=clone(window.RMSStudentGuidance||{});
  const allowedLabs=["literature","methods","data","writing"];
  const panelFields=["title","text"];
  const drafts=new Map();
  let lab="literature",step="",selected="",pending=false,mounted=false;
  const limits={title:180,text:2400};

  function tabs(group){
    const target=original.labs?.[group];
    return target&&typeof target==="object"?Object.keys(target):[];
  }
  function panel(group,key){return original.labs?.[group]?.[key]||null;}
  function path(group,key,field){return "labs."+group+"."+key+"."+field;}
  function resolve(p){
    if(typeof p!=="string")return null;
    const parts=p.split(".");
    if(parts.length!==4||parts[0]!=="labs"||
       !allowedLabs.includes(parts[1])||!panelFields.includes(parts[3]))
      return null;
    const sourcePanel=panel(parts[1],parts[2]);
    if(!sourcePanel||typeof sourcePanel[parts[3]]!=="string")return null;
    return {lab:parts[1],step:parts[2],field:parts[3],
      original:sourcePanel[parts[3]]};
  }
  function value(p){
    const entry=resolve(p);
    if(!entry)return "";
    return drafts.has(p)?drafts.get(p):entry.original;
  }
  function edited(){
    return [...drafts].map(([p,value])=>{
      const sourceEntry=resolve(p);
      return sourceEntry?{path:p,original:sourceEntry.original,value}:null;
    }).filter(Boolean).sort((a,b)=>a.path.localeCompare(b.path));
  }
  function validText(field,txt){
    return typeof txt==="string"&&txt.trim().length>0&&
      txt.length<=limits[field]&&!/[<>]/.test(txt)&&
      !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(txt);
  }
  function validate(){
    const issues=[];
    if(!original||original.version!=="2.1"||!original.fields||
       allowedLabs.some(x=>!tabs(x).length))
      issues.push("The expected student guide structure was not found.");
    const edits=edited();
    if(edits.length>64)issues.push("Too many edits for one lab-guidance review packet.");
    for(const edit of edits){
      const record=resolve(edit.path);
      if(!record||!validText(record.field,edit.value))
        issues.push("Invalid wording at "+edit.path+".");
    }
    return {ok:!issues.length,issues,edits};
  }
  function showStatus(message){
    const check=validate();
    $("labGuideStatus").textContent=message||
      (check.issues[0]||(check.edits.length+" proposed lab wording changes · Nothing published"));
    $("labGuideExport").disabled=pending||!check.ok||!check.edits.length;
    $("labGuideReset").disabled=pending||!
      edited().some(e=>e.path.startsWith("labs."+lab+"."+step+"."));
    $("labGuideCount").textContent=check.edits.length+" proposed changes";
  }
  function choose(p){
    if(!resolve(p))return;
    selected=p;
    renderPreview();
    $("labGuideEditText").focus({preventScroll:true});
  }
  function edit(txt){
    const rec=resolve(selected);
    if(!rec)return;
    if(txt===rec.original)drafts.delete(selected);
    else drafts.set(selected,txt);
    renderPreview();
    showStatus();
  }
  function renderPreview(){
    const p=panel(lab,step);
    const preview=$("labGuidePreview");
    if(!preview)return;
    preview.replaceChildren();
    if(!p)return;
    const add=(field,tag)=>{
      const wrapper=document.createElement(tag);
      wrapper.className="lab-guide-edit-line";
      const button=document.createElement("button");
      button.type="button";
      button.className="activity-edit-target";
      const key=path(lab,step,field);
      button.dataset.labGuidePath=key;
      button.textContent=value(key);
      if(selected===key)button.setAttribute("aria-current","true");
      button.addEventListener("click",()=>choose(key));
      wrapper.appendChild(button);preview.appendChild(wrapper);
    };
    add("title","h4");
    add("text","p");
    if((p.terms||[]).length){
      const terms=document.createElement("div");terms.className="lab-guide-locked";
      const heading=document.createElement("strong");heading.textContent="Linked terms · protected";
      const list=document.createElement("p");
      list.textContent=p.terms.join(" · ");
      terms.append(heading,list);preview.appendChild(terms);
    }
    if((p.decisionKeys||[]).length){
      const guard=document.createElement("p");guard.className="lab-guide-locked";
      guard.textContent="Protected decision keys · "+p.decisionKeys.join(", ");
      preview.appendChild(guard);
    }
    const record=resolve(selected);
    const active=record&&record.lab===lab&&record.step===step;
    $("labGuideInspector").hidden=!active;
    if(active){
      $("labGuideSelectedLabel").textContent=
        lab+" → "+step+" → "+record.field;
      const input=$("labGuideEditText");
      if(document.activeElement!==input)input.value=value(selected);
      input.maxLength=limits[record.field];
      input.rows=record.field==="title"?3:9;
      $("labGuideOriginal").textContent=record.original;
      $("labGuideCharacterCount").textContent=
        value(selected).length+" / "+limits[record.field];
      $("labGuideRevert").disabled=value(selected)===record.original;
    }
  }
  function switchPanel(){
    selected="";
    $("labGuideStep").replaceChildren();
    for(const key of tabs(lab)){
      const opt=document.createElement("option");opt.value=key;
      opt.textContent=panel(lab,key).title;
      $("labGuideStep").appendChild(opt);
    }
    step=tabs(lab)[0]||"";
    $("labGuideStep").value=step;
    renderPreview();showStatus();
  }
  function resetField(){
    if(window.RMSInlineReviewEditor?.beforeContextChange?.()===false)return;
    const record=resolve(selected);
    if(record)edit(record.original);
  }
  function resetPanel(){
    if(window.RMSInlineReviewEditor?.beforeContextChange?.()===false)return;
    const start="labs."+lab+"."+step+".";
    if(![...drafts.keys()].some(k=>k.startsWith(start)))return;
    if(!window.confirm("Discard proposed wording changes for this lab panel?"))return;
    for(const key of [...drafts.keys()])if(key.startsWith(start))drafts.delete(key);
    selected="";renderPreview();showStatus();
  }
  function review(){
    const check=validate(),box=$("labGuideReviewList");
    box.replaceChildren();
    if(!check.edits.length)box.textContent="No lab wording changes are proposed.";
    for(const change of check.edits){
      const row=document.createElement("section");row.className="activity-review-item";
      const heading=document.createElement("strong");heading.textContent=change.path;
      const old=document.createElement("p");old.textContent="Original · "+change.original;
      const latest=document.createElement("p");latest.textContent="Proposed · "+change.value;
      row.append(heading,old,latest);box.appendChild(row);
    }
    $("labGuideReviewValidation").textContent=check.ok?
      "Teaching titles and explanations only. Glossary links and decision keys remain protected.":
      check.issues.join(" ");
    $("labGuideReviewDialog").showModal();
  }
  async function fingerprint(){
    const data=new TextEncoder().encode(JSON.stringify(original));
    const digest=await crypto.subtle.digest("SHA-256",data);
    return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
  }
  async function exportPacket(){
    const check=validate();
    if(!check.ok||!check.edits.length)return;
    pending=true;showStatus("Preparing laboratory wording review…");
    try{
      const packet={
        schema_version:"rms-lab-guidance-review-v1",
        source_file:"assets/student-guidance.js",
        source_sha256:await fingerprint(),
        review_required:true,live_publication:false,
        preserves:["lab panel identities","glossary links","decision keys","student projects",
          "laboratory calculations","workflow buttons","student choice options"],
        edits:check.edits
      };
      const blob=new Blob([JSON.stringify(packet,null,2)+"\n"],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const anchor=document.createElement("a");anchor.href=url;
      anchor.download="rms-lab-guidance-review.json";
      document.body.appendChild(anchor);anchor.click();anchor.remove();
      setTimeout(()=>URL.revokeObjectURL(url),10000);
      showStatus("Lab wording review exported locally. No changes were published.");
    }catch{
      showStatus("Lab review export requires a secure browser with SHA-256 support.");
    }finally{pending=false;showStatus($("labGuideStatus").textContent);}
  }
  async function importPacket(file){
    if(!file)return;
    pending=true;showStatus("Checking saved laboratory review…");
    try{
      if(file.size>160000)throw Error("Review file is too large.");
      const packet=JSON.parse(await file.text());
      if(!packet||packet.schema_version!=="rms-lab-guidance-review-v1"||
         packet.source_file!=="assets/student-guidance.js"||
         packet.live_publication!==false||packet.review_required!==true||
         !Array.isArray(packet.edits)||!packet.edits.length||
         packet.edits.length>64)
        throw Error("Unsupported laboratory review packet.");
      if(packet.source_sha256!==await fingerprint())
        throw Error("This packet refers to a different Student Guide version.");
      const next=new Map();
      for(const change of packet.edits){
        const rec=resolve(change?.path);
        if(!rec||next.has(change.path)||change.original!==rec.original||
           !validText(rec.field,change.value))
          throw Error("The packet contains an unknown or altered instruction.");
        if(change.value!==rec.original)next.set(change.path,change.value);
      }
      if(drafts.size&&!window.confirm(
        "Replace all unsaved laboratory wording proposals with the imported review?"))return;
      drafts.clear();
      for(const [key,v] of next)drafts.set(key,v);
      selected="";renderPreview();
      showStatus("Restored "+next.size+" laboratory wording proposals. Nothing published.");
    }catch(error){
      showStatus("Lab review rejected. "+(error?.message||"Unable to read file."));
    }finally{
      pending=false;$("labGuideImport").value="";
      showStatus($("labGuideStatus").textContent);
    }
  }
  function mount(){
    if(mounted)return true;
    if(!$("labGuideLab")||!$("labGuidePreview")||!original.labs)return false;
    for(const key of allowedLabs){
      const opt=document.createElement("option");opt.value=key;
      opt.textContent=key[0].toUpperCase()+key.slice(1)+" Lab";
      $("labGuideLab").appendChild(opt);
    }
    $("labGuideLab").value=lab;
    $("labGuideLab").addEventListener("change",event=>{
      if(event.target.value===lab)return;
      if(window.RMSInlineReviewEditor?.beforeContextChange?.()===false){
        event.target.value=lab;
        return;
      }
      lab=event.target.value;switchPanel();
    });
    $("labGuideStep").addEventListener("change",event=>{
      if(event.target.value===step)return;
      if(window.RMSInlineReviewEditor?.beforeContextChange?.()===false){
        event.target.value=step;
        return;
      }
      step=event.target.value;selected="";renderPreview();showStatus();
    });
    $("labGuideEditText").addEventListener("input",e=>edit(e.target.value));
    $("labGuideRevert").addEventListener("click",resetField);
    $("labGuideReset").addEventListener("click",resetPanel);
    $("labGuideReview").addEventListener("click",review);
    $("labGuideExport").addEventListener("click",()=>{void exportPacket();});
    $("labGuideImport").addEventListener("change",event=>{
      void importPacket(event.target.files?.[0]);
    });
    switchPanel();mounted=true;return true;
  }
  return Object.freeze({mount,validate});
})();