/* Local, proposal-only authoring for curriculum stage activities.
   No student data, source files or publication APIs are mutated. */
window.RMSActivityAuthoring=(()=>{
  "use strict";
  const $=id=>document.getElementById(id);
  const copy=data=>JSON.parse(JSON.stringify(data));
  const source=window.RMSCurriculum;
  const stages=Array.isArray(source?.stages)?source.stages:[];
  const originals=new Map(stages.map(stage=>[stage.id,copy(stage)]));
  const changes=new Map();
  let current=stages[0]?.id||0;
  let selected="";
  let mounted=false;
  let pending=false;
  const maxLengths={heading:180,description:1000,label:350,check:650};

  function entries(stage){
    const out=[];
    (stage.sections||[]).forEach((section,sectionIndex)=>{
      out.push({path:"s."+sectionIndex+".title",text:String(section.title||""),type:"heading",
        name:"Section "+(sectionIndex+1)+" heading"});
      out.push({path:"s."+sectionIndex+".desc",text:String(section.desc||""),type:"description",
        name:"Section "+(sectionIndex+1)+" instruction"});
      (section.fields||[]).forEach((field,fieldIndex)=>{
        out.push({path:"s."+sectionIndex+".f."+fieldIndex+".label",
          text:String(field[1]||""),type:"label",
          name:"Section "+(sectionIndex+1)+" · "+field[0]+" label"});
      });
    });
    (stage.checks||[]).forEach((text,index)=>{
      out.push({path:"c."+index,text:String(text||""),type:"check",
        name:"Completion check "+(index+1)});
    });
    return out;
  }

  function currentStage(){return originals.get(current);}
  function editable(){
    const original=currentStage();
    if(!original)return [];
    const staged=changes.get(current)||new Map();
    return entries(original).map(e=>({...e,value:staged.has(e.path)?staged.get(e.path):e.text}));
  }
  function allEdits(){
    const results=[];
    for(const [id,staged] of changes){
      const original=originals.get(id);
      if(!original)continue;
      const allowed=new Map(entries(original).map(e=>[e.path,e]));
      for(const [path,value] of staged){
        const entry=allowed.get(path);
        if(entry&&entry.text!==value){
          results.push({stage_id:id,path,original:entry.text,value});
        }
      }
    }
    return results.sort((a,b)=>a.stage_id-b.stage_id||a.path.localeCompare(b.path));
  }
  function inspect(){
    const errors=[];
    if(stages.length!==18||new Set(stages.map(s=>s.id)).size!==18)
      errors.push("Expected 18 unique curriculum stages.");
    for(const stage of stages){
      if(!Number.isInteger(stage.id)||stage.id<1||stage.id>18||
         !Array.isArray(stage.sections)||!Array.isArray(stage.checks))
        errors.push("Unexpected curriculum stage structure.");
    }
    const edits=allEdits();
    if(edits.length>300)errors.push("Too many edits in one review packet.");
    for(const edit of edits){
      const type=entries(originals.get(edit.stage_id)).find(e=>e.path===edit.path)?.type;
      const value=edit.value;
      if(typeof value!=="string"||!value.trim()||
         value.length>(maxLengths[type]||350)||
         /[<>]/.test(value)||/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value))
        errors.push("Stage "+edit.stage_id+" "+edit.path+" must be plain, nonempty text within its length limit.");
    }
    return {ok:!errors.length,errors,edits};
  }
  function button(text,entry){
    const node=document.createElement("button");
    node.type="button";
    node.className="activity-edit-target";
    node.dataset.activityPath=entry.path;
    node.textContent=text;
    if(selected===entry.path)node.setAttribute("aria-current","true");
    node.addEventListener("click",()=>select(entry.path));
    return node;
  }
  function renderPreview(){
    const region=$("activityPreview");
    if(!region)return;
    region.replaceChildren();
    const stage=currentStage();
    if(!stage)return;
    $("activityStageHeading").textContent="Stage "+stage.id+" · "+stage.title;
    const map=new Map(editable().map(e=>[e.path,e]));
    if(!(stage.sections||[]).length){
      const note=document.createElement("p");
      note.className="activity-empty";
      note.textContent="This stage uses a separate interactive activity. Its field structure is protected here; completion checks below can still be reviewed.";
      region.appendChild(note);
    }
    (stage.sections||[]).forEach((section,index)=>{
      const card=document.createElement("section");card.className="activity-section";
      const title=map.get("s."+index+".title");
      const heading=document.createElement("h4");
      heading.appendChild(button(title.value,title));card.appendChild(heading);
      const desc=map.get("s."+index+".desc");
      const caption=document.createElement("p");caption.className="activity-description";
      caption.appendChild(button(desc.value,desc));card.appendChild(caption);
      for(let i=0;i<(section.fields||[]).length;i++){
        const field=section.fields[i];
        const entry=map.get("s."+index+".f."+i+".label");
        const row=document.createElement("div");row.className="activity-field-preview";
        const label=document.createElement("div");label.className="activity-field-label";
        label.appendChild(button(entry.value,entry));
        const kind=document.createElement("small");
        kind.textContent=field[2]==="select"?"Choice field · options locked":
          field[2]==="textarea"?"Long response · ID locked":"Short response · ID locked";
        const placeholder=document.createElement("div");
        placeholder.className="activity-input-placeholder";
        placeholder.textContent=field[2]==="select"?"Student choices remain unchanged":"Student response field (preview only)";
        row.append(label,kind,placeholder);card.appendChild(row);
      }
      region.appendChild(card);
    });
    if((stage.checks||[]).length){
      const box=document.createElement("section");box.className="activity-section";
      const title=document.createElement("h4");title.textContent="Completion checks";box.appendChild(title);
      stage.checks.forEach((_,index)=>{
        const entry=map.get("c."+index);
        const row=document.createElement("div");row.className="activity-check-preview";
        const symbol=document.createElement("span");symbol.textContent="□";symbol.setAttribute("aria-hidden","true");
        row.append(symbol,button(entry.value,entry));box.appendChild(row);
      });
      region.appendChild(box);
    }
    const selectedEntry=editable().find(e=>e.path===selected);
    const inspector=$("activityInspector");
    inspector.hidden=!selectedEntry;
    if(selectedEntry){
      $("activitySelectedLabel").textContent=selectedEntry.name;
      // Preserve caret position while the teacher edits in the inspector.
      // Assigning textarea.value on every keystroke would jump the caret.
      if(document.activeElement!==$("activityEditText"))
        $("activityEditText").value=selectedEntry.value;
      $("activityEditText").maxLength=maxLengths[selectedEntry.type];
      $("activityOriginal").textContent=selectedEntry.text;
      $("activityFieldCounter").textContent=selectedEntry.value.length+" / "+maxLengths[selectedEntry.type];
      $("activityRevertField").disabled=selectedEntry.value===selectedEntry.text;
    }
  }
  function status(message){
    if(message)$("activityStatus").textContent=message;
    else{
      const validation=inspect();
      $("activityStatus").textContent=validation.errors.length?
        validation.errors[0]:validation.edits.length+" activity wording change"+
        (validation.edits.length===1?"":"s")+" · In-memory proposal only";
    }
    const validation=inspect();
    $("activityExport").disabled=pending||!validation.ok||!validation.edits.length;
    $("activityReset").disabled=pending||!changes.get(current)?.size;
    $("activityReviewCount").textContent=validation.edits.length+" proposed changes";
  }
  function select(path){
    if(!editable().some(e=>e.path===path))return;
    selected=path;
    renderPreview();
    $("activityEditText").focus({preventScroll:true});
  }
  function edit(value){
    if(!selected)return;
    const original=entries(currentStage()).find(e=>e.path===selected);
    if(!original)return;
    let staged=changes.get(current);
    if(!staged){staged=new Map();changes.set(current,staged);}
    if(original.text===value)staged.delete(selected);
    else staged.set(selected,value);
    if(!staged.size)changes.delete(current);
    renderPreview();status();
  }
  function resetField(){
    if(window.RMSInlineReviewEditor?.beforeContextChange?.()===false)return;
    const original=entries(currentStage()).find(e=>e.path===selected);
    if(original)edit(original.text);
  }
  function resetStage(){
    if(window.RMSInlineReviewEditor?.beforeContextChange?.()===false)return;
    if(!changes.get(current)?.size)return;
    if(!window.confirm("Discard the activity wording proposals for Stage "+current+"?"))return;
    changes.delete(current);selected="";renderPreview();status();
  }
  function review(){
    const info=inspect();
    const list=$("activityReviewList");list.replaceChildren();
    if(!info.edits.length){
      list.textContent="There are no changes to review.";
    }else{
      for(const e of info.edits){
        const section=document.createElement("section");section.className="activity-review-item";
        const title=document.createElement("strong");
        title.textContent="Stage "+e.stage_id+" · "+e.path;
        const old=document.createElement("p");
        old.textContent="Original · "+e.original;
        const latest=document.createElement("p");
        latest.textContent="Proposed · "+e.value;
        section.append(title,old,latest);list.appendChild(section);
      }
    }
    $("activityReviewValidation").textContent=info.ok?
      "Identity, field types, counts, and choices are excluded from this wording proposal.":
      info.errors.join(" ");
    $("activityReviewDialog").showModal();
  }
  async function fingerprint(){
    // Hash the entire original bundled curriculum so proposals can be
    // checked against the precise source version before anyone applies them.
    const bytes=new TextEncoder().encode(JSON.stringify(stages));
    const digest=await crypto.subtle.digest("SHA-256",bytes);
    return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
  }
  async function exportProposal(){
    const validation=inspect();
    if(!validation.ok||!validation.edits.length)return;
    pending=true;status("Preparing review-only proposal…");
    try{
      const result={
        schema_version:"rms-activity-wording-proposal-v1",
        source_file:"assets/curriculum.js",
        source_sha256:await fingerprint(),
        review_required:true,
        live_publication:false,
        preserves:["stage IDs","section counts and order","field keys","field types","select options","completion-check counts","student progress"],
        edits:validation.edits
      };
      const blob=new Blob([JSON.stringify(result,null,2)+"\n"],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;a.download="rms-activity-wording-review.json";
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),10000);
      status("Review packet exported locally · Nothing was published.");
    }catch{
      status("Could not export. Use a secure local browser that supports SHA-256.");
    }finally{pending=false;status($("activityStatus").textContent);}
  }
  async function importProposal(file){
    if(!file)return;
    pending=true;status("Checking the saved activity proposal…");
    try{
      if(file.size>300000)throw Error("The review packet exceeds 300 KB.");
      const packet=JSON.parse(await file.text());
      if(!packet||packet.schema_version!=="rms-activity-wording-proposal-v1"||
         packet.source_file!=="assets/curriculum.js"||
         packet.review_required!==true||packet.live_publication!==false||
         !Array.isArray(packet.edits)||!packet.edits.length||packet.edits.length>300)
        throw Error("This is not a supported activity wording review packet.");
      const currentHash=await fingerprint();
      if(packet.source_sha256!==currentHash)
        throw Error("This review packet was created against a different curriculum version.");
      const restored=new Map(),seen=new Set();
      for(const edit of packet.edits){
        if(!edit||!Number.isInteger(edit.stage_id)||
           typeof edit.path!=="string"||typeof edit.original!=="string"||
           typeof edit.value!=="string")
          throw Error("A review packet entry has an invalid structure.");
        const original=originals.get(edit.stage_id);
        const entry=original&&entries(original).find(e=>e.path===edit.path);
        const id=edit.stage_id+":"+edit.path;
        if(!entry||seen.has(id)||entry.text!==edit.original||
           !edit.value.trim()||edit.value.length>maxLengths[entry.type]||
           /[<>]/.test(edit.value)||
           /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(edit.value))
          throw Error("A proposed edit changes protected structure or contains invalid text.");
        seen.add(id);
        if(edit.value===entry.text)continue;
        if(!restored.has(edit.stage_id))restored.set(edit.stage_id,new Map());
        restored.get(edit.stage_id).set(edit.path,edit.value);
      }
      if(allEdits().length&&
         !window.confirm("Replace all current unsaved activity wording proposals with the imported packet?"))
        return;
      changes.clear();
      for(const [id,edits] of restored)changes.set(id,edits);
      selected="";renderPreview();
      status("Restored "+allEdits().length+" wording proposals from this curriculum version. Nothing was published.");
    }catch(error){
      status("Import rejected. "+(error?.message||"File could not be read."));
    }finally{
      pending=false;
      $("activityImport").value="";
      // Keep the user-facing success/error status while refreshing enabled controls.
      status($("activityStatus").textContent);
    }
  }
  function mount(){
    if(mounted)return true;
    if(!stages.length||!$("activityStage")||!$("activityPreview"))return false;
    const selector=$("activityStage");
    for(const stage of stages){
      const option=document.createElement("option");
      option.value=String(stage.id);option.textContent="Stage "+stage.id+" · "+stage.title;
      selector.appendChild(option);
    }
    selector.value=String(current);
    selector.addEventListener("change",()=>{
      if(Number(selector.value)===current)return;
      if(window.RMSInlineReviewEditor?.beforeContextChange?.()===false){
        selector.value=String(current);
        return;
      }
      current=Number(selector.value);selected="";renderPreview();status();
    });
    $("activityEditText").addEventListener("input",event=>edit(event.target.value));
    $("activityRevertField").addEventListener("click",resetField);
    $("activityReset").addEventListener("click",resetStage);
    $("activityReview").addEventListener("click",review);
    $("activityExport").addEventListener("click",()=>{void exportProposal();});
    $("activityImport").addEventListener("change",event=>{
      void importProposal(event.target.files?.[0]);
    });
    renderPreview();status();
    mounted=true;return true;
  }
  return Object.freeze({mount,inspect});
})();