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

  function render(draft,record) {
    const panel=byId("visualGuidanceEditor");
    if(!panel||!draft?.value||!record)return;
    if(fromVisual||panel.contains(document.activeElement))return;
    const key=String(record.key||"");
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
    const value=RICH.has(field)?el.innerHTML:el.textContent;
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
    panel.addEventListener("input",updateValue);
    const toolbar=panel.querySelector(".visual-guidance-toolbar");
    toolbar?.addEventListener("mousedown",event=>{
      if(event.target.closest("[data-guidance-format]"))event.preventDefault();
    });
    toolbar?.addEventListener("click",event=>{
      const button=event.target.closest("[data-guidance-format]");
      if(button)applyVisualFormat(button.dataset.guidanceFormat);
    });
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