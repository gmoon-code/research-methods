/* Shared inline, plain-text authoring for the three proposal-only editors.
 * The existing inspector remains the authoritative draft and validator.
 * This module never touches student projects, remote APIs or publication.
 */
window.RMSInlineReviewEditor=(()=>{
  "use strict";
  const editors=[
    {preview:"activityPreview",attribute:"data-activity-path",inspector:"activityEditText"},
    {preview:"labGuidePreview",attribute:"data-lab-guide-path",inspector:"labGuideEditText"},
    {preview:"studentGuidePreview",attribute:"data-guide-path",inspector:"studentGuideEdit"}
  ];
  let mounted=false, active=null,internalSelection=false;
  let editingMode="direct";
  function selectInspectorTarget(target){
    internalSelection=true;
    try{target.click();}finally{internalSelection=false;}
  }
  const byId=id=>document.getElementById(id);
  const textIssue=(value,limit)=>{
    if(!value.trim())return "Text cannot be empty.";
    if(value.length>limit)return "Maximum length is "+limit+" characters.";
    if(/[<>]/.test(value))return "HTML and angle brackets are not supported.";
    if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))
      return "Control characters are not supported.";
    return "";
  };
  const targetFor=(root,config,path)=>[...root.querySelectorAll(
    ".activity-edit-target["+config.attribute+"]")].find(el=>
      el.getAttribute(config.attribute)===path);
  function closeEditor({focus=false}={}){
    if(!active)return;
    const edit=active;
    active=null;
    edit.form.remove();
    edit.target.hidden=false;
    edit.trigger.hidden=false;
    // Inline editing does not leave a duplicate inspector visible after
    // Save or Cancel. The explicit "Detailed inspector" action can reopen it.
    const inspector=byId(edit.config.inspector)?.closest(".activity-inspector");
    if(inspector)inspector.hidden=true;
    if(focus&&edit.trigger.isConnected)edit.trigger.focus({preventScroll:true});
  }
  function beforeContextChange(){
    if(!active)return true;
    // Changing a stage, record, or workspace must never silently destroy
    // text that has not yet reached the existing validated proposal model.
    if(active.textarea.value!==active.start &&
       !window.confirm(
         "This in-place edit has not been saved. Discard this wording and continue? " +
         "Choose Cancel to return to the editor and save your wording."
       )){
      active.textarea.focus({preventScroll:true});
      return false;
    }
    closeEditor();
    return true;
  }
  function syncStatus(edit){
    const error=textIssue(edit.textarea.value,edit.limit);
    const changed=edit.textarea.value!==edit.start;
    edit.save.disabled=!!error||!changed;
    edit.message.textContent=error||
      (changed?"Ready to save · review-only change":"No change yet");
    edit.message.dataset.invalid=String(!!error);
    edit.counter.textContent=edit.textarea.value.length+" / "+edit.limit;
  }
  function save(){
    if(!active)return;
    const edit=active;
    const issue=textIssue(edit.textarea.value,edit.limit);
    if(issue){syncStatus(edit);return;}
    const source=byId(edit.config.inspector);
    if(!source)return;
    const value=edit.textarea.value;
    closeEditor();
    source.value=value;
    source.dispatchEvent(new Event("input",{bubbles:true}));
    const inspector=source.closest(".activity-inspector");
    if(inspector)inspector.hidden=true;
    const replacement=targetFor(edit.root,edit.config,edit.path);
    if(replacement)replacement.focus({preventScroll:true});
  }
  function begin(root,config,path){
    if(!beforeContextChange())return;
    let target=targetFor(root,config,path);
    if(!target)return;
    // Use the original selection handler to establish the exact record and
    // inspector identity. Its render recreates this preview's button nodes.
    selectInspectorTarget(target);
    target=targetFor(root,config,path);
    const source=byId(config.inspector);
    if(!target||!source)return;
    // Scans also run after the author's original renderer rebuilds a preview.
    enrich(root,config);
    const trigger=target.nextElementSibling;
    if(!trigger?.classList.contains("inline-quick-edit"))return;
    const limit=Number(source.maxLength)>0?source.maxLength:2400;
    const box=document.createElement("div");
    box.className="inline-review-box";
    box.dataset.inlineEditing=path;
    const label=document.createElement("label");
    label.className="inline-review-label";
    const uid="inlineEditor"+(config.preview==="activityPreview"?"Activity":
      config.preview==="labGuidePreview"?"Lab":"Guide");
    label.htmlFor=uid;
    label.textContent="Edit this wording directly";
    const field=document.createElement("textarea");
    field.id=uid;field.className="inline-review-input";field.rows=3;
    field.maxLength=limit;
    field.value=source.value;
    const actions=document.createElement("div");
    actions.className="inline-review-actions";
    const counter=document.createElement("small");
    counter.className="inline-review-counter";
    const saveButton=document.createElement("button");
    saveButton.type="button";saveButton.className="button inline-review-save";
    saveButton.textContent="Save wording";
    const cancelButton=document.createElement("button");
    cancelButton.type="button";cancelButton.className="button inline-review-cancel";
    cancelButton.textContent="Cancel";
    const inspectButton=document.createElement("button");
    inspectButton.type="button";inspectButton.className="button inline-review-inspect";
    inspectButton.textContent="Detailed inspector";
    const hint=document.createElement("p");
    hint.className="inline-review-message";
    hint.setAttribute("role","status");
    hint.setAttribute("aria-live","polite");
    actions.append(saveButton,inspectButton,cancelButton,counter);
    box.append(label,field,actions,hint);
    // The editing form goes after the source text's parent, so headings,
    // paragraphs, checklist and field-label semantics remain intact.
    target.parentElement.after(box);
    target.hidden=true;
    trigger.hidden=true;
    active={
      root,config,path,form:box,target,trigger,textarea:field,
      save:saveButton,message:hint,counter,limit,start:field.value
    };
    field.addEventListener("input",()=>{
      if(active?.textarea===field){
        syncStatus(active);
        inspectButton.textContent=
          field.value===active.start?"Detailed inspector":"Save and open inspector";
      }
    });
    field.addEventListener("keydown",event=>{
      if(event.key==="Escape"){event.preventDefault();closeEditor({focus:true});}
      else if(event.key==="Enter"&&(event.ctrlKey||event.metaKey)){
        event.preventDefault();save();
      }
    });
    saveButton.addEventListener("click",save);
    cancelButton.addEventListener("click",()=>closeEditor({focus:true}));
    inspectButton.addEventListener("click",()=>{
      const edit=active;
      if(!edit)return;
      if(textIssue(edit.textarea.value,edit.limit)){
        syncStatus(edit);return;
      }
      if(edit.textarea.value!==edit.start)save();
      else closeEditor();
      const target=targetFor(edit.root,edit.config,edit.path);
      if(target){
        selectInspectorTarget(target);
        byId(edit.config.inspector)?.focus({preventScroll:true});
      }
    });
    syncStatus(active);
    field.focus({preventScroll:true});
    field.setSelectionRange(field.value.length,field.value.length);
  }
  function enrich(root,config){
    if(active&&active.root===root&&!root.contains(active.form))
      active=null; // An editor's owning stage/panel has changed.
    for(const target of root.querySelectorAll(
      ".activity-edit-target["+config.attribute+"]")){
      if(target.nextElementSibling?.classList.contains("inline-quick-edit"))
        continue;
      const path=target.getAttribute(config.attribute);
      const parent=target.parentElement;
      if(!path||!parent)continue;
      parent.classList.add("inline-edit-host");
      const quick=document.createElement("button");
      quick.type="button";
      quick.className="inline-quick-edit";
      quick.dataset.inlinePath=path;
      quick.setAttribute("aria-label","Edit this wording here");
      quick.title="Edit this wording in place";
      quick.textContent="✎";
      target.after(quick);
    }
  }
  function mount(){
    if(mounted)return true;
    if(!editors.every(e=>byId(e.preview)&&byId(e.inspector)))return false;
    for(const config of editors){
      const root=byId(config.preview);
      const obs=new MutationObserver(()=>enrich(root,config));
      obs.observe(root,{subtree:true,childList:true});
      // Text is directly editable by default. Preserve the original
      // inspector selection for the opt-in detailed mode and internal sync.
      root.addEventListener("click",event=>{
        const target=event.target.closest?.(".activity-edit-target");
        if(!target||!root.contains(target)||internalSelection)return;
        if(editingMode==="direct"){
          event.preventDefault();
          event.stopImmediatePropagation();
          const path=target.getAttribute(config.attribute);
          if(path)begin(root,config,path);
          return;
        }
        if(active&&!beforeContextChange()){
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },true);
      root.addEventListener("click",event=>{
        const quick=event.target.closest?.(".inline-quick-edit");
        if(!quick||!root.contains(quick))return;
        event.preventDefault();
        begin(root,config,quick.dataset.inlinePath);
      });
      enrich(root,config);
    }
    const choice=byId("reviewEditingMode");
    if(choice){
      choice.value="direct";
      choice.addEventListener("change",()=>{
        const next=choice.value;
        if(!["direct","inspector"].includes(next)){choice.value=editingMode;return;}
        if(next===editingMode)return;
        if(!beforeContextChange()){choice.value=editingMode;return;}
        editingMode=next;
        byId("reviewEditingHint").textContent=next==="direct"?
          "Click any passage to edit it where it appears. Use the detailed inspector when you need it.":
          "Click a passage to select it in the detailed inspector. The pencil still opens an inline editor.";
      });
    }
    // Actions that take snapshots or replace the underlying proposal must
    // first resolve any text still in the inline textarea.
    const reviewActions=new Set([
      "activityReview","activityExport","activityReset",
      "labGuideReview","labGuideExport","labGuideReset",
      "studentGuideReview","studentGuideExport","studentGuideReset"
    ]);
    const importInputs=new Set([
      "activityImport","labGuideImport","studentGuideImport"
    ]);
    document.addEventListener("click",event=>{
      const button=event.target.closest?.("button");
      if(!button||!reviewActions.has(button.id))return;
      if(!beforeContextChange()){
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },true);
    document.addEventListener("change",event=>{
      if(!importInputs.has(event.target?.id))return;
      if(!beforeContextChange()){
        event.target.value="";
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },true);
    // Handle leaving the entire tab, including reload, without discarding
    // partially typed inline text. Existing saved review proposals are
    // independently subject to their explicit export requirement.
    window.addEventListener("beforeunload",event=>{
      if(active&&active.textarea.value!==active.start){
        event.preventDefault();
        event.returnValue="";
      }
    });
    mounted=true;return true;
  }
  return Object.freeze({mount,beforeContextChange,isEditing:()=>!!active,mode:()=>editingMode});
})();