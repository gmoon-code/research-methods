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
  // Read the preview in DOM order. These are the existing allowlisted
  // authoring paths, never arbitrary HTML nodes or student response fields.
  function recordTargets(root,config){
    return [...root.querySelectorAll(".activity-edit-target["+config.attribute+"]")];
  }
  function passageRanges(value){
    const groups=[];
    const separator=/\n[ \t]*\n/g;
    let start=0,match;
    while((match=separator.exec(value))){
      if(value.slice(start,match.index).trim())
        groups.push({start,end:match.index});
      start=separator.lastIndex;
    }
    if(value.slice(start).trim())groups.push({start,end:value.length});
    const parts=[];
    for(const group of groups){
      let at=group.start;
      while(group.end-at>460){
        // Prefer a sentence boundary. If none is available, use whitespace.
        const upper=Math.min(at+400,group.end);
        let cut=-1;
        for(let i=upper;i>=at+200;i--){
          if(/\s/.test(value[i]||"")&&/[.!?。！？”’)"']/.test(value[i-1]||"")){
            cut=i;break;
          }
        }
        if(cut<0){
          for(let i=upper;i>=at+200;i--){
            if(/\s/.test(value[i]||"")){cut=i;break;}
          }
        }
        if(cut<0)cut=upper;
        parts.push({start:at,end:cut});
        at=cut;
      }
      if(value.slice(at,group.end).trim())parts.push({start:at,end:group.end});
    }
    return parts.filter(part=>value.slice(part.start,part.end).trim());
  }
  function updateParts(edit){
    const parts=passageRanges(edit.textarea.value);
    const jump=edit.paragraphSelect;
    const previous=jump.value;
    jump.replaceChildren();
    parts.forEach((part,i)=>{
      const option=document.createElement("option");
      option.value=String(i);
      option.textContent="Part "+(i+1)+" · "+
        edit.textarea.value.slice(part.start,part.end)
          .trim().replace(/\s+/g," ").slice(0,74);
      jump.appendChild(option);
    });
    edit.parts=parts;
    edit.paragraphNav.hidden=parts.length<2;
    jump.value=Number(previous)<parts.length?previous:"0";
    edit.paragraphDescription.textContent=parts.length>1?
      parts.length+" reading sections · Jump selects text without changing it.":
      "";
  }
  function updatePosition(edit){
    const items=recordTargets(edit.root,edit.config);
    const selectedIndex=items.findIndex(item=>
      item.getAttribute(edit.config.attribute)===edit.path);
    edit.position.textContent="Wording "+(selectedIndex+1)+" of "+items.length;
    edit.previous.disabled=selectedIndex<=0;
    edit.next.disabled=selectedIndex>=items.length-1;
    const chooser=edit.targetSelect;
    chooser.replaceChildren();
    items.forEach((item,i)=>{
      const option=document.createElement("option");
      option.value=item.getAttribute(edit.config.attribute);
      const snippet=item.textContent.trim().replace(/\s+/g," ").slice(0,70);
      option.textContent=(i+1)+". "+(snippet||"Untitled wording");
      chooser.appendChild(option);
    });
    chooser.value=edit.path;
  }
  function jumpToPart(edit,index){
    const part=edit.parts[Number(index)];
    if(!part)return;
    const input=edit.textarea;
    input.focus({preventScroll:true});
    input.setSelectionRange(part.start,part.end);
  }
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
    if(error)edit.textarea.setAttribute("aria-invalid","true");
    else edit.textarea.removeAttribute("aria-invalid");
    edit.counter.textContent=edit.textarea.value.length+" / "+edit.limit;
    edit.previous.textContent=changed?"Save and previous":"Previous wording";
    edit.next.textContent=changed?"Save and next":"Next wording";
    if(error){
      edit.previous.disabled=true;
      edit.next.disabled=true;
    }else{
      const items=recordTargets(edit.root,edit.config);
      const pos=items.findIndex(item=>
        item.getAttribute(edit.config.attribute)===edit.path);
      edit.previous.disabled=pos<=0;
      edit.next.disabled=pos>=items.length-1;
    }
    updateParts(edit);
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
  function goTo(path){
    if(!active||!path)return;
    const edit=active;
    if(path===edit.path)return;
    if(!targetFor(edit.root,edit.config,path))return;
    if(textIssue(edit.textarea.value,edit.limit)){
      syncStatus(edit);
      edit.targetSelect.value=edit.path;
      edit.textarea.focus({preventScroll:true});
      return;
    }
    if(edit.textarea.value!==edit.start)save();
    else closeEditor();
    begin(edit.root,edit.config,path);
  }
  function moveBy(offset){
    if(!active)return;
    const edit=active;
    const targets=recordTargets(edit.root,edit.config);
    const index=targets.findIndex(item=>
      item.getAttribute(edit.config.attribute)===edit.path);
    const target=targets[index+offset];
    if(target)goTo(target.getAttribute(edit.config.attribute));
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
    label.id=uid+"Label";
    label.htmlFor=uid;
    const snippet=target.textContent.trim().replace(/\s+/g," ").slice(0,72);
    label.textContent="Edit wording · "+(snippet||"Selected passage");
    box.setAttribute("role","group");
    box.setAttribute("aria-labelledby",label.id);
    const field=document.createElement("textarea");
    field.id=uid;field.className="inline-review-input";field.rows=3;
    field.maxLength=limit;
    field.value=source.value;
    field.setAttribute("aria-describedby",uid+"Instructions "+uid+"Status");
    const instructions=document.createElement("p");
    instructions.id=uid+"Instructions";
    instructions.className="inline-review-keyboard-hint";
    instructions.textContent=
      "Ctrl+Enter or Command+Enter saves. Escape cancels. Alt+Up and Alt+Down move between wording items.";
    const navigator=document.createElement("div");
    navigator.className="inline-review-navigator";
    const position=document.createElement("small");
    position.className="inline-review-position";
    const previous=document.createElement("button");
    previous.type="button";previous.className="button inline-review-prev";
    previous.textContent="Previous wording";
    const next=document.createElement("button");
    next.type="button";next.className="button inline-review-next";
    next.textContent="Next wording";
    const targetLabel=document.createElement("label");
    targetLabel.className="inline-review-jump-label";
    targetLabel.textContent="Jump to wording";
    const targetSelect=document.createElement("select");
    targetSelect.className="inline-review-target-select";
    targetSelect.setAttribute("aria-label","Jump to another editable wording item");
    targetLabel.appendChild(targetSelect);
    navigator.append(position,previous,next,targetLabel);
    const paragraphNav=document.createElement("div");
    paragraphNav.className="inline-review-parts";
    paragraphNav.hidden=true;
    const paragraphLabel=document.createElement("label");
    paragraphLabel.textContent="Select a paragraph or reading section";
    const paragraphSelect=document.createElement("select");
    paragraphSelect.className="inline-review-part-select";
    paragraphSelect.setAttribute("aria-label","Jump to a paragraph or reading section");
    paragraphLabel.appendChild(paragraphSelect);
    const paragraphDescription=document.createElement("small");
    paragraphDescription.className="inline-review-part-description";
    paragraphNav.append(paragraphLabel,paragraphDescription);
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
    hint.id=uid+"Status";
    hint.className="inline-review-message";
    hint.setAttribute("role","status");
    hint.setAttribute("aria-live","polite");
    actions.append(saveButton,inspectButton,cancelButton,counter);
    box.append(label,navigator,paragraphNav,field,instructions,actions,hint);
    // The editing form goes after the source text's parent, so headings,
    // paragraphs, checklist and field-label semantics remain intact.
    target.parentElement.after(box);
    target.hidden=true;
    trigger.hidden=true;
    active={
      root,config,path,form:box,target,trigger,textarea:field,
      save:saveButton,message:hint,counter,limit,start:field.value,
      position,previous,next,targetSelect,paragraphNav,
      paragraphSelect,paragraphDescription,parts:[]
    };
    previous.addEventListener("click",()=>moveBy(-1));
    next.addEventListener("click",()=>moveBy(1));
    targetSelect.addEventListener("change",()=>goTo(targetSelect.value));
    paragraphSelect.addEventListener("change",()=>{
      if(active?.textarea===field)jumpToPart(active,paragraphSelect.value);
    });
    field.addEventListener("input",()=>{
      if(active?.textarea===field){
        syncStatus(active);
        inspectButton.textContent=
          field.value===active.start?"Detailed inspector":"Save and open inspector";
      }
    });
    field.addEventListener("keydown",event=>{
      if(event.key==="Escape"){event.preventDefault();closeEditor({focus:true});}
      else if(event.altKey&&!event.ctrlKey&&!event.metaKey&&event.key==="ArrowDown"){
        event.preventDefault();moveBy(1);
      }else if(event.altKey&&!event.ctrlKey&&!event.metaKey&&event.key==="ArrowUp"){
        event.preventDefault();moveBy(-1);
      }else if(event.key==="Enter"&&(event.ctrlKey||event.metaKey)){
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
    updatePosition(active);
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
      const snippet=target.textContent.trim().replace(/\s+/g," ").slice(0,68);
      const phrase=(target.dataset.proposed==="true"?"Edit revised ":"Edit ")+
        (snippet||"this wording");
      quick.setAttribute("aria-label",phrase);
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
    // Moving to another major Admin area previously left a dirty inline
    // edit hidden. Resolve it before changing the visible Admin panel.
    document.addEventListener("click",event=>{
      const nav=event.target.closest?.("button[data-admin-panel]");
      if(!nav||!active)return;
      if(!beforeContextChange()){
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },true);
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