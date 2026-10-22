/* Visual authoring for the existing validated six-field stage-guidance schema.
 * Admin authentication and publication remain in the existing Content Studio.
 */
window.RMSVisualGuidance=(()=>{
  "use strict";

  const FIELD_TO_ID=Object.freeze({
    title:"contentTitle",
    nav:"contentNav",
    purpose:"contentPurpose",
    learn_html:"contentLearnHtml",
    example_html:"contentExampleHtml",
    warning_html:"contentWarningHtml"
  });
  const RICH=new Set(["learn_html","example_html","warning_html"]);
  const EDITABLE_TAGS=new Set(["H3","P","DIV","STRONG","B","EM","I","BR","UL","OL","LI","SPAN"]);
  let mounted=false;
  let lastStage="";
  let fromVisual=false;
  let selectedBlock=null;
  let dragPointer=null;
  const byId=id=>document.getElementById(id);

  function status(message,warning=false) {
    const element=byId("visualGuidanceStatus");
    if(!element)return;
    element.textContent=message;
    element.dataset.warning=warning?"true":"false";
  }

  function safeMarkup(html) {
    if(!html||typeof html!=="string")return null;
    const candidate=document.implementation.createHTMLDocument("sanitized guidance");
    const host=candidate.createElement("div");
    // Validation must run before this string enters a live DOM.
    const api=window.RMSAdminContentStudio;
    if(!api||!api.validateValue)return null;
    // Validate using an allowed, complete record with this markup.
    const validation=api.validateValue({
      title:"Preview",nav:"Preview",purpose:"Preview",
      learn_html:html,
      example_html:"<p>Example</p>",
      warning_html:"<p>Warning</p>"
    });
    if(!validation.ok)return null;
    host.innerHTML=html;
    for(const node of host.querySelectorAll("*")){
      if(!EDITABLE_TAGS.has(node.tagName))return null;
      for(const attribute of node.attributes) {
        if(attribute.name!=="class"||attribute.value!=="concept-box")return null;
      }
    }
    return host;
  }

  function blockStatus(message) {
    const text=byId("visualBlockStatus");
    if(text)text.textContent=message;
  }

  function activeBlock() {
    if(!selectedBlock)return null;
    const host=byId("visualGuidanceEditor")?.querySelector(
      '[data-visual-field="'+selectedBlock.field+'"]');
    if(!host||!RICH.has(selectedBlock.field))return null;
    const block=host.children.item(selectedBlock.index);
    return block?{host,block,field:selectedBlock.field}:null;
  }

  function blockControls() {
    const active=activeBlock();
    const hasBlock=!!active;
    const index=selectedBlock?.index??0;
    const list=hasBlock&&["UL","OL"].includes(active.block.tagName);
    const enabled={
      visualAddParagraph:hasBlock,
      visualAddHeading:hasBlock,
      visualAddList:hasBlock,
      visualAddListItem:!!list,
      visualDuplicateBlock:hasBlock,
      visualMoveBlockUp:hasBlock&&index>0,
      visualMoveBlockDown:hasBlock&&index<active.host.children.length-1,
      visualRemoveBlock:hasBlock&&active.host.children.length>1
    };
    for(const [id,canUse] of Object.entries(enabled)){
      const button=byId(id);
      if(button)button.disabled=!canUse;
    }
  }

  function selectBlock(event){
    const panel=byId("visualGuidanceEditor");
    const target=event.target?.nodeType===Node.TEXT_NODE?
      event.target.parentElement:event.target;
    const host=target?.closest?.(".visual-guidance-rich[data-visual-field]");
    if(!panel||!host||!panel.contains(host))return;
    let block=target===host?host.firstElementChild:target;
    while(block&&block.parentElement!==host)block=block.parentElement;
    if(!block||block.parentElement!==host)return;
    const index=[...host.children].indexOf(block);
    if(index<0)return;
    byId("visualGuidanceInlineComposer")?.remove();
    for(const mark of panel.querySelectorAll("[data-visual-selected]"))
      mark.removeAttribute("data-visual-selected");
    selectedBlock={field:host.dataset.visualField,index};
    block.setAttribute("data-visual-selected","");
    blockControls();
    positionDragHandle();
    positionQuickToolbar(true);
    blockStatus("Selected "+selectedBlock.field.replace("_html","").replace("_"," ")+
      " block "+(index+1)+" of "+host.children.length+
      ". Use the controls to add, move, or remove it.");
  }

  function clearBlockSelection() {
    selectedBlock=null;
    for(const mark of byId("visualGuidanceEditor")?.querySelectorAll(
      "[data-visual-selected]")||[])mark.removeAttribute("data-visual-selected");
    blockControls();
    byId("visualGuidanceMoveHandle")?.remove();
    byId("visualGuidanceQuickToolbar")?.remove();
    byId("visualGuidanceInlineComposer")?.remove();
    blockStatus("Click a paragraph, heading, concept box, or list below to select a block.");
  }

  // The outline marker is editor-only metadata. Remove it from a detached
  // clone before a value enters the authoritative schema-validated draft.
  function cleanRichHtml(host){
    const copy=host.cloneNode(true);
    for(const mark of copy.querySelectorAll("[data-visual-selected]"))
      mark.removeAttribute("data-visual-selected");
    return copy.innerHTML;
  }

  function validRichChange(field,html){
    const record={title:"Preview",nav:"Preview",purpose:"Preview",
      learn_html:"<p>Preview</p>",example_html:"<p>Example</p>",
      warning_html:"<p>Warning</p>"};
    record[field]=html;
    return window.RMSAdminContentStudio?.validateValue?.(record);
  }


  // Dragging a whole rich-content block uses the same production schema
  // validator as the accessible Move up and Move down toolbar controls.
  function positionDragHandle(){
    const active=activeBlock(),handle=byId("visualGuidanceMoveHandle");
    if(dragPointer)return;
    if(!active||active.host.children.length<2){
      handle?.remove();return;
    }
    const grip=handle||document.createElement("button");
    if(!handle){
      grip.id="visualGuidanceMoveHandle";grip.type="button";
      grip.textContent="⠿";
      grip.title="Drag this content block to change its order";
      grip.setAttribute("aria-label","Drag selected guidance block; use Move up and Move down for keyboard navigation");
      grip.style.cssText="position:fixed;z-index:9999;width:32px;height:32px;display:grid;place-items:center;border:2px solid #27654f;border-radius:6px;background:#fff;color:#164d39;cursor:grab;touch-action:none;box-shadow:0 2px 7px #0003;font:700 22px/1 system-ui";
      grip.addEventListener("click",event=>event.stopPropagation());
      grip.addEventListener("pointerdown",event=>{
        if(event.button!==0||dragPointer)return;
        const selected=activeBlock();
        if(!selected||selected.host.children.length<2)return;
        event.preventDefault();event.stopPropagation();
        const box=grip.getBoundingClientRect();
        dragPointer={id:event.pointerId,field:selected.field,index:selectedBlock.index,
          x:event.clientX,y:event.clientY,left:box.left,top:box.top};
        grip.setPointerCapture(event.pointerId);
        grip.style.cursor="grabbing";
      });
      grip.addEventListener("pointermove",event=>{
        const drag=dragPointer;
        if(!drag||drag.id!==event.pointerId)return;
        event.preventDefault();
        grip.style.left=(drag.left+event.clientX-drag.x)+"px";
        grip.style.top=(drag.top+event.clientY-drag.y)+"px";
        clearGuidanceDropMarks();
        const target=guidanceDropTarget(event.clientX,event.clientY,drag.field,grip);
        if(target){
          const box=target.getBoundingClientRect();
          target.setAttribute("data-visual-drop-target",
            event.clientY>=box.top+box.height/2?"after":"before");
        }
      });
      const finish=event=>{
        const drag=dragPointer;
        if(!drag||drag.id!==event.pointerId)return;
        event.preventDefault();event.stopPropagation();
        const target=event.type==="pointerup"?
          guidanceDropTarget(event.clientX,event.clientY,drag.field,grip):null;
        const box=target?.getBoundingClientRect();
        const index=target?[...target.parentElement.children].indexOf(target):-1;
        const after=!!box&&event.clientY>=box.top+box.height/2;
        dragPointer=null;
        if(grip.hasPointerCapture(event.pointerId))grip.releasePointerCapture(event.pointerId);
        grip.style.cursor="grab";
        clearGuidanceDropMarks();
        if(index>=0&&index!==drag.index)
          moveGuidanceBlock(drag.field,drag.index,index,after);
        positionDragHandle();
      };
      grip.addEventListener("pointerup",finish);
      grip.addEventListener("pointercancel",finish);
      document.body.appendChild(grip);
    }
    const blockBox=active.block.getBoundingClientRect();
    const viewport=window.innerWidth;
    grip.style.display=blockBox.bottom<0||blockBox.top>window.innerHeight?"none":"grid";
    grip.style.left=Math.max(0,Math.min(viewport-32,blockBox.left-37))+"px";
    grip.style.top=Math.max(0,Math.min(window.innerHeight-32,blockBox.top+4))+"px";
  }
  // This toolbar is kept outside all editable guidance fields. Every action
  // delegates to the existing validated six-field draft operation.
  function positionQuickToolbar(rebuild=false){
    let bar=byId("visualGuidanceQuickToolbar");
    const active=activeBlock();
    if(!active||!active.block.isConnected||
       byId("visualGuidanceEditor")?.closest("[hidden]")){
      bar?.remove();return;
    }
    if(rebuild||!bar){
      bar?.remove();
      bar=document.createElement("div");
      bar.id="visualGuidanceQuickToolbar";
      bar.setAttribute("role","toolbar");
      bar.setAttribute("aria-label","Selected guidance block actions");
      bar.style.cssText="position:fixed;z-index:9998;display:flex;align-items:center;"+
        "flex-wrap:wrap;gap:4px;padding:5px;max-width:min(260px,calc(100vw - 12px));"+
        "border:1px solid #9bbbae;border-radius:8px;background:#fff;color:#183f30;"+
        "box-shadow:0 3px 14px #0003;font:600 12px/1.3 system-ui";
      const add=(label,description,action,enabled=true)=>{
        const button=document.createElement("button");
        button.type="button";button.textContent=label;
        button.setAttribute("aria-label",description);
        button.disabled=!enabled;
        button.style.cssText="min-height:32px;padding:5px 7px;"+
          "border:1px solid #a4bdaf;border-radius:5px;background:#eff7f1;"+
          "color:inherit;font:inherit;cursor:pointer";
        button.addEventListener("click",event=>{
          event.preventDefault();event.stopPropagation();
          if(button.disabled)return;
          if(action==="add")openInlineComposer();
          else editBlock(action);
        });
        bar.append(button);
      };
      const {host}=active,index=selectedBlock.index;
      add("+ Text","Enter text for a new paragraph next to the selected block","add");
      add("Copy","Duplicate selected guidance block","duplicate");
      add("↑","Move selected guidance block up","up",index>0);
      add("↓","Move selected guidance block down","down",index<host.children.length-1);
      add("Remove","Remove selected guidance block","remove",host.children.length>1);
      document.body.append(bar);
    }
    const box=active.block.getBoundingClientRect();
    if(box.bottom<0||box.top>window.innerHeight||
      !byId("visualGuidanceEditor")?.getClientRects().length){
      bar.style.display="none";return;
    }
    bar.style.display="flex";
    const width=bar.getBoundingClientRect().width||235;
    const height=bar.getBoundingClientRect().height||42;
    const maxLeft=Math.max(5,window.innerWidth-width-5);
    const maxTop=Math.max(5,window.innerHeight-height-5);
    let left,top;
    if(box.right+width+8<window.innerWidth-5){
      left=box.right+7;top=box.top;
    }else if(box.left-width-8>5){
      left=box.left-width-7;top=box.top;
    }else if(box.top-height-9>5){
      left=box.left;top=box.top-height-8;
    }else{
      left=box.right-width;top=box.top+Math.min(box.height+7,60);
    }
    bar.style.left=Math.max(5,Math.min(maxLeft,left))+"px";
    bar.style.top=Math.max(5,Math.min(maxTop,top))+"px";
  }

  // Composer actions use the same validated insertion routine as the
  // full Content Studio block tools. The overlay is outside all contenteditable
  // fields and can never enter stage HTML or publication proposals.
  function positionInlineComposer(){
    const panel=byId("visualGuidanceInlineComposer");
    const active=activeBlock();
    if(!panel||!active)return;
    const toolbar=byId("visualGuidanceQuickToolbar"),view=window;
    const pivot=(toolbar&&toolbar.style.display!=="none"?
      toolbar:active.block).getBoundingClientRect();
    const width=panel.getBoundingClientRect().width||300;
    const height=panel.getBoundingClientRect().height||240;
    const maxLeft=Math.max(5,view.innerWidth-width-5);
    const maxTop=Math.max(5,view.innerHeight-height-5);
    const left=Math.max(5,Math.min(maxLeft,pivot.left));
    const after=pivot.bottom+7,before=pivot.top-height-7;
    panel.style.left=left+"px";
    panel.style.top=Math.max(5,Math.min(maxTop,
      after+height<=view.innerHeight-5?after:
      before>=5?before:maxTop))+"px";
  }
  function openInlineComposer(){
    const active=activeBlock();
    if(!active)return;
    byId("visualGuidanceInlineComposer")?.remove();
    const selected={...selectedBlock};
    const dialog=document.createElement("section");
    dialog.id="visualGuidanceInlineComposer";
    dialog.setAttribute("role","dialog");
    dialog.setAttribute("aria-label","Add guidance block here");
    dialog.setAttribute("aria-modal","false");
    dialog.style.cssText="position:fixed;z-index:10001;display:grid;gap:8px;"+
      "width:min(312px,calc(100vw - 10px));max-height:calc(100vh - 10px);"+
      "overflow:auto;box-sizing:border-box;padding:13px;border:1px solid #9bbbae;"+
      "border-radius:10px;background:#fff;color:#183f30;box-shadow:0 8px 24px #0004;"+
      "font:14px/1.4 system-ui,sans-serif";
    const title=document.createElement("strong");
    title.textContent="Add after selected block";
    const choiceLabel=document.createElement("label");
    choiceLabel.textContent="Block type";
    choiceLabel.style.cssText="font-weight:600;display:grid;gap:4px";
    const choice=document.createElement("select");
    choice.id="visualGuidanceInlineKind";
    const kinds=[["paragraph","Paragraph"],["heading","Section heading"],
      ["list","Bullet list"]];
    if(["UL","OL"].includes(active.block.tagName))
      kinds.push(["list-item","Item in selected list"]);
    for(const [id,label] of kinds){
      const option=document.createElement("option");
      option.value=id;option.textContent=label;choice.append(option);
    }
    choice.style.cssText="padding:8px;width:100%;border:1px solid #9bbbae;"+
      "border-radius:6px;background:#fff;color:#183f30;font:inherit";
    choiceLabel.append(choice);
    const textLabel=document.createElement("label");
    textLabel.textContent="Block text";
    textLabel.style.cssText="font-weight:600;display:grid;gap:4px";
    const textarea=document.createElement("textarea");
    textarea.id="visualGuidanceInlineText";
    textarea.rows=3;textarea.maxLength=1200;
    textarea.style.cssText="box-sizing:border-box;width:100%;resize:vertical;"+
      "padding:8px;border:1px solid #9bbbae;border-radius:6px;"+
      "font:inherit;color:#183f30;background:#fff";
    textLabel.append(textarea);
    const feedback=document.createElement("p");
    feedback.setAttribute("role","status");
    feedback.setAttribute("aria-live","polite");
    feedback.style.cssText="margin:0;font-size:12px;line-height:1.4";
    const row=document.createElement("div");
    row.style.cssText="display:flex;justify-content:flex-end;gap:7px";
    const closeBtn=document.createElement("button");
    closeBtn.type="button";closeBtn.textContent="Cancel";
    const addBtn=document.createElement("button");
    addBtn.type="button";addBtn.textContent="Add block";
    for(const button of [closeBtn,addBtn]){
      button.style.cssText="padding:8px 10px;min-height:36px;"+
        "border:1px solid #9bbbae;border-radius:6px;"+
        "background:"+(button===addBtn?"#e5f2e9":"#fff")+
        ";color:#183f30;font:600 13px system-ui;cursor:pointer";
    }
    const dismiss=()=>{
      dialog.remove();
      byId("visualGuidanceQuickToolbar")?.querySelector(
        'button[aria-label="Enter text for a new paragraph next to the selected block"]')
        ?.focus({preventScroll:true});
    };
    closeBtn.addEventListener("click",dismiss);
    const submit=()=>{
      if(!activeBlock()||selected.field!==selectedBlock.field||
         selected.index!==selectedBlock.index){
        feedback.textContent="Selection changed. Choose a guidance block again.";
        return;
      }
      const text=textarea.value.trim();
      if(!text){feedback.textContent="Write some text before adding a block.";return;}
      byId("visualBlockText").value=text;
      const accepted=editBlock(choice.value);
      if(accepted===true)dismiss();
      else feedback.textContent=byId("visualBlockStatus")?.textContent||
        "The content block was not accepted by the guidance validator.";
    };
    addBtn.addEventListener("click",submit);
    dialog.addEventListener("keydown",event=>{
      if(event.key==="Escape"){event.preventDefault();event.stopPropagation();dismiss();}
      else if((event.ctrlKey||event.metaKey)&&event.key==="Enter"){
        event.preventDefault();event.stopPropagation();submit();
      }
    });
    row.append(closeBtn,addBtn);
    dialog.append(title,choiceLabel,textLabel,feedback,row);
    document.body.append(dialog);
    positionInlineComposer();
    choice.focus({preventScroll:true});
  }

  function clearGuidanceDropMarks(){
    for(const node of document.querySelectorAll("[data-visual-drop-target]"))
      node.removeAttribute("data-visual-drop-target");
  }
  function guidanceDropTarget(x,y,field,grip){
    const prev=grip.style.pointerEvents;
    grip.style.pointerEvents="none";
    const hit=document.elementFromPoint(x,y);
    grip.style.pointerEvents=prev;
    const host=byId("visualGuidanceEditor")?.querySelector(
      '[data-visual-field="'+field+'"]');
    let target=hit;
    while(target&&target.parentElement!==host)target=target.parentElement;
    return target?.parentElement===host?target:null;
  }
  function moveGuidanceBlock(field,sourceIndex,targetIndex,after){
    const host=byId("visualGuidanceEditor")?.querySelector(
      '[data-visual-field="'+field+'"]');
    const source=host?.children[sourceIndex],target=host?.children[targetIndex];
    if(!source||!target||source===target)return false;
    const original=host.innerHTML;
    if(after)target.after(source);else target.before(source);
    const selected=[...host.children].indexOf(source);
    const proposed=cleanRichHtml(host);
    const validation=validRichChange(field,proposed);
    if(!validation?.ok){
      host.innerHTML=original;
      blockStatus("Move rejected. "+(validation?.errors?.[0]||"Invalid guidance markup."));
      return false;
    }
    for(const mark of host.querySelectorAll("[data-visual-selected]"))
      mark.removeAttribute("data-visual-selected");
    selectedBlock={field,index:selected};
    source.setAttribute("data-visual-selected","");
    host.dispatchEvent(new Event("input",{bubbles:true}));
    blockControls();
    positionQuickToolbar(true);
    blockStatus("Content block moved. The existing draft validator has approved the new order.");
    return true;
  }

  function editBlock(action){
    const active=activeBlock();
    if(!active){blockStatus("Choose a content block first.");return false;}
    const {host,block,field}=active;
    const original=host.innerHTML;
    const previousIndex=selectedBlock.index;
    const text=byId("visualBlockText")?.value.trim()||"";
    if(["paragraph","heading","list","list-item"].includes(action)&&!text){
      blockStatus("Enter text before inserting a paragraph or list item.");
      byId("visualBlockText")?.focus();
      return false;
    }
    let nextIndex=previousIndex;
    if(action==="paragraph"||action==="heading"||action==="list"){
      const next=document.createElement(action==="paragraph"?"p":action==="heading"?"h3":"ul");
      if(action!=="list")next.textContent=text;
      else {
        const li=document.createElement("li");
        li.textContent=text;next.appendChild(li);
      }
      block.after(next);
      nextIndex=previousIndex+1;
    } else if(action==="list-item"){
      if(!["UL","OL"].includes(block.tagName))return;
      const li=document.createElement("li");li.textContent=text;
      block.appendChild(li);
    } else if(action==="duplicate"){
      // Clone only the selected content subtree. Validation below checks that
      // the resulting HTML still satisfies the published six-field schema.
      const copy=block.cloneNode(true);
      for(const mark of [copy,...copy.querySelectorAll("[data-visual-selected]")])
        mark.removeAttribute("data-visual-selected");
      block.after(copy);
      nextIndex=previousIndex+1;
    } else if(action==="up"){
      if(previousIndex===0)return;
      block.previousElementSibling.before(block);
      nextIndex=previousIndex-1;
    } else if(action==="down"){
      if(previousIndex>=host.children.length-1)return;
      block.nextElementSibling.after(block);
      nextIndex=previousIndex+1;
    } else if(action==="remove"){
      if(host.children.length<=1)return;
      block.remove();
      nextIndex=Math.min(previousIndex,host.children.length-1);
    } else return;
    const proposed=cleanRichHtml(host);
    const checked=validRichChange(field,proposed);
    if(!checked?.ok){
      host.innerHTML=original;
      blockStatus("Change rejected. "+
        (checked?.errors?.[0]||"The content format is not supported."));
      blockControls();
      return false;
    }
    for(const mark of host.querySelectorAll("[data-visual-selected]"))
      mark.removeAttribute("data-visual-selected");
    selectedBlock={field,index:nextIndex};
    const chosen=host.children.item(nextIndex);
    chosen?.setAttribute("data-visual-selected","");
    host.dispatchEvent(new Event("input",{bubbles:true}));
    if(action==="paragraph"||action==="heading"||action==="list"||action==="list-item")
      byId("visualBlockText").value="";
    blockControls();
    positionDragHandle();
    positionQuickToolbar(true);
    blockStatus("Block updated in this stage's in-memory draft. "+
      "Use Validate draft to review the complete guidance record.");
    return true;
  }

  function render(draft,record) {
    const panel=byId("visualGuidanceEditor");
    if(!panel||!draft?.value||!record)return;
    if(fromVisual||panel.contains(document.activeElement))return;
    const key=String(record.key||"");
    if(lastStage!==key||selectedBlock)clearBlockSelection();
    lastStage=key;
    byId("visualGuidanceRecord").textContent=
      "Stage "+record.stage_id+" · "+(record.phase_label||record.phase||"");
    let invalid=false;
    for(const [field] of Object.entries(FIELD_TO_ID)) {
      const element=panel.querySelector('[data-visual-field="'+field+'"]');
      if(!element)continue;
      const value=String(draft.value[field]||"");
      if(RICH.has(field)) {
        const safe=safeMarkup(value);
        if(!safe){invalid=true;continue;}
        element.replaceChildren(...[...safe.childNodes].map(node=>
          document.importNode(node,true)));
      } else {
        element.textContent=value;
      }
    }
    status(invalid?
      "Some draft HTML is invalid. Correct it in the source field before visual editing.":
      "Click any text below to edit. Changes update the existing Content Studio fields.",invalid);
  }

  function insertPlainText(event,editable) {
    event.preventDefault();
    const selection=window.getSelection();
    if(!selection||!selection.rangeCount)return;
    const range=selection.getRangeAt(0);
    if(!editable.contains(range.commonAncestorContainer))return;
    const text=event.clipboardData?.getData("text/plain")||"";
    range.deleteContents();
    const node=document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    editable.dispatchEvent(new Event("input",{bubbles:true}));
  }

  function updateValue(event) {
    const el=event.target.closest("[data-visual-field]");
    if(!el||!byId("visualGuidanceEditor").contains(el))return;
    const field=el.dataset.visualField;
    const input=byId(FIELD_TO_ID[field]);
    if(!input)return;
    const value=RICH.has(field)?cleanRichHtml(el):el.textContent;
    if(RICH.has(field)) {
      const api=window.RMSAdminContentStudio;
      const recordValue={title:"Preview",nav:"Preview",purpose:"Preview",
        learn_html:"<p>Preview</p>",example_html:"<p>Preview</p>",
        warning_html:"<p>Preview</p>"};
      recordValue[field]=value;
      const result=api?.validateValue?.(recordValue);
      if(!result?.ok) {
        status("This visual edit needs correction. "+
          (result?.errors?.[0]||"Use supported paragraphs, lists and emphasis only."),true);
      }else status("Visual changes update the Content Studio draft immediately.");
    }
    fromVisual=true;
    try {
      input.value=value;
      input.dispatchEvent(new Event("input",{bubbles:true}));
    } finally {fromVisual=false;}
  }

  function applyVisualFormat(tag) {
    if(tag!=="strong"&&tag!=="em")return;
    const selection=window.getSelection();
    if(!selection||!selection.rangeCount||selection.isCollapsed){
      status("Select part of a teaching paragraph, example, or warning first.",true);
      return;
    }
    const range=selection.getRangeAt(0);
    const host=[...document.querySelectorAll("#visualGuidanceEditor .visual-guidance-rich")]
      .find(element=>element.contains(range.commonAncestorContainer));
    if(!host){
      status("Formatting is available inside teaching, example, and warning blocks.",true);
      return;
    }
    const mark=document.createElement(tag);
    try{
      range.surroundContents(mark);
    }catch{
      status("Select text within a single paragraph, then apply formatting.",true);
      return;
    }
    selection.removeAllRanges();
    host.dispatchEvent(new Event("input",{bubbles:true}));
    status("Formatting applied. The existing draft validator checks the updated content.");
  }

  function mount() {
    if(mounted)return true;
    const panel=byId("visualGuidanceEditor");
    if(!panel||!window.RMSAdminContentStudio)return false;
    const dragStyles=document.createElement("style");
    dragStyles.id="rms-guidance-drag-feedback";
    dragStyles.textContent=
      '[data-visual-drop-target="before"]{box-shadow:0 -4px 0 #2b8060!important;}'+
      '[data-visual-drop-target="after"]{box-shadow:0 4px 0 #2b8060!important;}';
    document.head.appendChild(dragStyles);
    panel.addEventListener("input",updateValue);
    panel.addEventListener("click",event=>{
      if(event.target.closest(".visual-guidance-rich[data-visual-field]"))
        selectBlock(event);
    });
    // A keyboard user can focus a rich-content region and select its first
    // block, then move the caret through the document with arrow keys.
    panel.addEventListener("focusin",event=>{
      if(event.target.matches?.(".visual-guidance-rich[data-visual-field]"))
        selectBlock({target:window.getSelection()?.anchorNode||event.target});
    });
    panel.addEventListener("keyup",event=>{
      if(!event.target.matches?.(".visual-guidance-rich[data-visual-field]"))return;
      if(["ArrowUp","ArrowDown","Home","End"].includes(event.key))
        selectBlock({target:window.getSelection()?.anchorNode||event.target});
    });
    const commands={
      visualAddParagraph:"paragraph",visualAddHeading:"heading",visualAddList:"list",
      visualAddListItem:"list-item",visualDuplicateBlock:"duplicate",
      visualMoveBlockUp:"up",
      visualMoveBlockDown:"down",visualRemoveBlock:"remove"
    };
    for(const [id,action] of Object.entries(commands))
      byId(id)?.addEventListener("click",()=>editBlock(action));
    blockControls();
    const toolbar=panel.querySelector(".visual-guidance-toolbar");
    toolbar?.addEventListener("mousedown",event=>{
      if(event.target.closest("[data-guidance-format]"))event.preventDefault();
    });
    toolbar?.addEventListener("click",event=>{
      const button=event.target.closest("[data-guidance-format]");
      if(button)applyVisualFormat(button.dataset.guidanceFormat);
    });
    document.addEventListener("scroll",positionDragHandle,true);
    document.addEventListener("scroll",()=>positionQuickToolbar(),true);
    document.addEventListener("scroll",()=>positionInlineComposer(),true);
    window.addEventListener("resize",positionDragHandle);
    window.addEventListener("resize",()=>positionQuickToolbar());
    window.addEventListener("resize",()=>positionInlineComposer());
    panel.addEventListener("paste",event=>{
      const editable=event.target.closest("[data-visual-field]");
      if(!editable)return;
      // Paste plain text only, no external rich HTML or event handlers.
      insertPlainText(event,editable);
    });
    panel.addEventListener("keydown",event=>{
      const element=event.target.closest("[data-visual-field]");
      if(!element)return;
      if(!RICH.has(element.dataset.visualField)&&event.key==="Enter")
        event.preventDefault();
    });
     mounted=true;
    return true;
  }
  return Object.freeze({mount,render});
})();