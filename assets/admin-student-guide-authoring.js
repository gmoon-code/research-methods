/* Review-only authoring for Stage Guide and per-field help in the Student Guide.
 * Keeps term links, choice logic, student records and publisher out of scope.
 */
window.RMSStudentGuideAuthoring=(()=>{
  "use strict";
  const id=x=>document.getElementById(x);
  const clone=x=>JSON.parse(JSON.stringify(x));
  const original=clone(window.RMSStudentGuidance||{});
  const curriculum=window.RMSCurriculum;
  const entries=new Map(),edits=new Map();
  const limits={heading:180,label:180,body:2400};
  let mode="stage",recordId="1",chosen="",pending=false,mounted=false;
  let fieldFilter="";
  const stageKeys=["title","plain","strong"],fieldKeys=["meaning","write","example","avoid"];
  const stageRecords=original.stages||{},fieldRecords=original.fields||{};

  function register(path,text,label,kind="body"){
    if(typeof text!=="string"||!text.trim()||entries.has(path))return;
    entries.set(path,{path,text,label,kind,record:modeFromPath(path)});
  }
  function modeFromPath(path){
    const bits=path.split(".");
    return {mode:bits[0]==="stages"?"stage":"field",id:bits[1]};
  }
  for(const [stageId,stage] of Object.entries(stageRecords)){
    for(const key of stageKeys)register("stages."+stageId+"."+key,stage[key],key,
      key==="title"?"heading":"body");
    for(const key of ["steps","stuck"]){
      if(!Array.isArray(stage[key]))continue;
      stage[key].forEach((s,i)=>register("stages."+stageId+"."+key+"."+i,s,key+" "+(i+1)));
    }
    if(Array.isArray(stage.examples))stage.examples.forEach((example,i)=>{
      for(const key of ["label","text"])
        register("stages."+stageId+".examples."+i+"."+key,
          example[key],"example "+(i+1)+" "+key,key==="label"?"label":"body");
    });
    const w=stage.walkthrough;
    if(w&&typeof w==="object"){
      for(const key of ["situation","draft"])
        register("stages."+stageId+".walkthrough."+key,w[key],"walkthrough "+key);
      if(Array.isArray(w.thinking))w.thinking.forEach((text,i)=>
        register("stages."+stageId+".walkthrough.thinking."+i,
          text,"reasoning "+(i+1)));
    }
  }
  for(const [key,field] of Object.entries(fieldRecords)){
    for(const name of fieldKeys)
      register("fields."+key+"."+name,field[name],name);
    if(Array.isArray(field.questions))
      field.questions.forEach((text,i)=>register("fields."+key+".questions."+i,
        text,"question "+(i+1)));
  }

  function recordEntries(){
    return [...entries.values()].filter(e=>
      e.record.mode===mode&&e.record.id===recordId);
  }
  function currentValue(path){
    return edits.has(path)?edits.get(path):entries.get(path)?.text||"";
  }
  function validText(entry,text){
    return typeof text==="string"&&text.trim().length>0&&
      text.length<=limits[entry.kind]&&!/[<>]/.test(text)&&
      !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text);
  }
  function collect(){
    return [...edits.entries()].map(([path,value])=>{
      const entry=entries.get(path);
      return entry?{path,original:entry.text,value}:null;
    }).filter(Boolean).sort((a,b)=>a.path.localeCompare(b.path));
  }
  function validate(){
    const errors=[];
    if(original.version!=="2.1"||
       Object.keys(stageRecords).length!==18||
       Object.keys(fieldRecords).length!==113||
       !(entries.size>=1000))
      errors.push("Unrecognised Student Guide version or help structure.");
    const modifications=collect();
    if(modifications.length>500)errors.push("Only 500 changes can be reviewed together.");
    for(const x of modifications){
      const entry=entries.get(x.path);
      if(!entry||!validText(entry,x.value))
        errors.push("Please correct "+x.path+" before exporting.");
    }
    return {ok:!errors.length,errors,edits:modifications};
  }
  function status(message){
    const result=validate();
    id("studentGuideStatus").textContent=message||
      result.errors[0]||
      (result.edits.length+" proposed Student Guide changes · Local only");
    id("studentGuideCount").textContent=result.edits.length+" proposed changes";
    id("studentGuideExport").disabled=pending||!result.ok||!result.edits.length;
    id("studentGuideReset").disabled=pending||
      !recordEntries().some(x=>edits.has(x.path));
  }
  function select(path){
    if(!entries.has(path))return;
    chosen=path;
    preview();
    id("studentGuideEdit").focus({preventScroll:true});
  }
  function section(title){
    const element=document.createElement("section");
    element.className="student-guide-preview-group";
    const label=document.createElement("h5");label.textContent=title;
    element.appendChild(label);
    id("studentGuidePreview").appendChild(element);
    return element;
  }
  function line(group,entry){
    const outer=document.createElement("div");
    outer.className="student-guide-preview-line";
    const button=document.createElement("button");
    button.type="button";button.className="activity-edit-target";
    button.dataset.guidePath=entry.path;
    button.textContent=currentValue(entry.path);
    if(entry.path===chosen)button.setAttribute("aria-current","true");
    button.addEventListener("click",()=>select(entry.path));
    const kind=document.createElement("small");
    kind.textContent=entry.label;
    outer.append(kind,button);group.appendChild(outer);
  }
  function preview(){
    const region=id("studentGuidePreview");
    if(!region)return;
    region.replaceChildren();
    const rec=recordEntries();
    let activeGroup="";
    let group=null;
    for(const entry of rec){
      const parts=entry.path.split(".");
      const name=parts[0]==="stages"?
        (["examples","steps","stuck","walkthrough"].includes(parts[2])?
          parts[2]:"Overview") :
        (parts[2]==="questions"?"Questions":"Field explanation");
      if(name!==activeGroup){
        activeGroup=name;group=section(
          name[0].toUpperCase()+name.slice(1));
      }
      line(group,entry);
    }
    if(mode==="stage"&&stageRecords[recordId]?.terms?.length){
      const protectedTerms=document.createElement("p");
      protectedTerms.className="student-guide-protected";
      protectedTerms.textContent="Protected research-term links · "+
        stageRecords[recordId].terms.join(" · ");
      region.appendChild(protectedTerms);
    }
    const entry=entries.get(chosen);
    const isActive=entry&&entry.record.mode===mode&&entry.record.id===recordId;
    id("studentGuideInspector").hidden=!isActive;
    if(isActive){
      id("studentGuideSelected").textContent=entry.label+" · "+entry.path;
      const textarea=id("studentGuideEdit");
      // Do not rewrite the value during typing, which would move the caret.
      if(document.activeElement!==textarea)textarea.value=currentValue(chosen);
      textarea.maxLength=limits[entry.kind];
      textarea.rows=entry.kind==="heading"||entry.kind==="label"?3:8;
      id("studentGuideOriginal").textContent=entry.text;
      id("studentGuideCharacters").textContent=
        currentValue(chosen).length+" / "+limits[entry.kind];
      id("studentGuideRevert").disabled=currentValue(chosen)===entry.text;
    }
  }
  function edit(value){
    const entry=entries.get(chosen);
    if(!entry)return;
    if(value===entry.text)edits.delete(chosen);
    else edits.set(chosen,value);
    preview();status();
  }
  function updateRecord(){
    if(id("studentGuideRecord").value===recordId)return;
    if(window.RMSInlineReviewEditor?.beforeContextChange?.()===false){
      id("studentGuideRecord").value=recordId;
      return;
    }
    chosen="";
    recordId=id("studentGuideRecord").value;
    preview();status();
  }
  function fieldNames(){
    const used=new Map();
    for(const stage of curriculum?.stages||[]){
      for(const sec of stage.sections||[])
        for(const f of sec.fields||[]){
          if(fieldRecords[f[0]]&&!used.has(f[0]))
            used.set(f[0],{stage:stage.id,label:f[1]});
        }
    }
    return used;
  }
  const fieldLabels=fieldNames();
  function renderOptions(){
    const dropdown=id("studentGuideRecord");
    dropdown.replaceChildren();
    if(mode==="stage"){
      for(const [key,record] of Object.entries(stageRecords)){
        const o=document.createElement("option");o.value=key;
        o.textContent="Stage "+key+" · "+record.title;
        dropdown.appendChild(o);
      }
    }else{
      const query=fieldFilter.trim().toLowerCase();
      for(const key of Object.keys(fieldRecords)){
        const ref=fieldLabels.get(key);
        const name=(ref?.label||key)+" · "+key;
        if(query&&!name.toLowerCase().includes(query))continue;
        const o=document.createElement("option");o.value=key;
        o.textContent=(ref?"Stage "+ref.stage+" · ":"")+name;
        dropdown.appendChild(o);
      }
    }
    const found=[...dropdown.options].some(o=>o.value===recordId);
    if(!found)recordId=dropdown.options[0]?.value||"";
    dropdown.value=recordId;
    chosen="";preview();status();
  }
  function review(){
    const check=validate(),box=id("studentGuideReviewList");
    box.replaceChildren();
    if(!check.edits.length)box.textContent="No Student Guide changes.";
    for(const c of check.edits){
      const row=document.createElement("section");row.className="activity-review-item";
      const h=document.createElement("strong");h.textContent=c.path;
      const before=document.createElement("p");before.textContent="Original · "+c.original;
      const after=document.createElement("p");after.textContent="Proposed · "+c.value;
      row.append(h,before,after);box.appendChild(row);
    }
    id("studentGuideReviewValidation").textContent=
      check.ok?"Student Guide text only. All term links, field IDs, and guidance arrays retain their structure.":
      check.errors.join(" ");
    id("studentGuideReviewDialog").showModal();
  }
  function resetField(){
    if(window.RMSInlineReviewEditor?.beforeContextChange?.()===false)return;
    const entry=entries.get(chosen);
    if(entry)edit(entry.text);
  }
  function resetRecord(){
    if(window.RMSInlineReviewEditor?.beforeContextChange?.()===false)return;
    const paths=recordEntries().filter(x=>edits.has(x.path));
    if(!paths.length)return;
    if(!window.confirm("Discard proposed wording changes for this help record?"))return;
    for(const e of paths)edits.delete(e.path);
    chosen="";preview();status();
  }
  async function fingerprint(){
    const bytes=new TextEncoder().encode(JSON.stringify(original));
    const digest=await crypto.subtle.digest("SHA-256",bytes);
    return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
  }
  async function exportPacket(){
    const check=validate();
    if(!check.ok||!check.edits.length)return;
    pending=true;status("Preparing Student Guide review packet…");
    try{
      const packet={
        schema_version:"rms-student-guide-review-v1",
        source_file:"assets/student-guidance.js",
        source_sha256:await fingerprint(),
        review_required:true,live_publication:false,
        preserves:["stage numbers","student field IDs","guide term links",
          "glossary entries","list lengths and order","laboratory decision keys",
          "student response data","guidance publication contracts"],
        edits:check.edits
      };
      const blob=new Blob([JSON.stringify(packet,null,2)+"\n"],{type:"application/json"});
      const uri=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=uri;
      a.download="rms-student-guide-review.json";
      document.body.append(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(uri),10000);
      status("Review packet exported locally · No content was published.");
    }catch{
      status("Export requires a secure browser with SHA-256 support.");
    }finally{pending=false;status(id("studentGuideStatus").textContent);}
  }
  async function importPacket(file){
    if(!file)return;
    pending=true;status("Checking saved Student Guide review…");
    try{
      if(file.size>900000)throw Error("Student Guide review file exceeds 900 KB.");
      const packet=JSON.parse(await file.text());
      if(!packet||packet.schema_version!=="rms-student-guide-review-v1"||
         packet.source_file!=="assets/student-guidance.js"||
         packet.review_required!==true||packet.live_publication!==false||
         !Array.isArray(packet.edits)||!packet.edits.length||
         packet.edits.length>500)
        throw Error("Unsupported Student Guide review packet.");
      if(packet.source_sha256!==await fingerprint())
        throw Error("This packet refers to a different Student Guide version.");
      const imported=new Map();
      for(const c of packet.edits){
        const entry=entries.get(c?.path);
        if(!entry||imported.has(c.path)||c.original!==entry.text||
           !validText(entry,c.value))
          throw Error("The packet contains an unknown or altered help field.");
        if(c.value!==entry.text)imported.set(c.path,c.value);
      }
      if(edits.size&&!window.confirm(
        "Replace all unsaved Student Guide changes with the imported review?"))return;
      edits.clear();
      for(const [path,v] of imported)edits.set(path,v);
      chosen="";preview();
      status("Restored "+imported.size+" Student Guide wording changes. Nothing published.");
    }catch(error){
      status("Import rejected. "+(error?.message||"Unable to read review file."));
    }finally{
      pending=false;id("studentGuideImport").value="";
      status(id("studentGuideStatus").textContent);
    }
  }
  function mount(){
    if(mounted)return true;
    if(!id("studentGuideMode")||!id("studentGuidePreview")||!entries.size)return false;
    id("studentGuideMode").addEventListener("change",e=>{
      if(e.target.value===mode)return;
      if(window.RMSInlineReviewEditor?.beforeContextChange?.()===false){
        e.target.value=mode;
        return;
      }
      mode=e.target.value;
      recordId=mode==="stage"?"1":Object.keys(fieldRecords)[0];
      id("studentGuideFieldSearch").hidden=mode!=="field";
      fieldFilter="";id("studentGuideFieldSearch").value="";
      renderOptions();
    });
    id("studentGuideFieldSearch").addEventListener("input",e=>{
      if(e.target.value===fieldFilter)return;
      if(window.RMSInlineReviewEditor?.beforeContextChange?.()===false){
        e.target.value=fieldFilter;
        return;
      }
      fieldFilter=e.target.value;renderOptions();
    });
    id("studentGuideRecord").addEventListener("change",updateRecord);
    id("studentGuideEdit").addEventListener("input",e=>edit(e.target.value));
    id("studentGuideRevert").addEventListener("click",resetField);
    id("studentGuideReset").addEventListener("click",resetRecord);
    id("studentGuideReview").addEventListener("click",review);
    id("studentGuideExport").addEventListener("click",()=>{void exportPacket();});
    id("studentGuideImport").addEventListener("change",e=>{
      void importPacket(e.target.files?.[0]);
    });
    renderOptions();mounted=true;return true;
  }
  return Object.freeze({mount,validate});
})();