/* Content Studio area switching. Presentation only, no persistence, source
 * mutations, publication calls, or authority changes.
 */
window.RMSAdminContentWorkspaceNavigation=(()=>{
  "use strict";
  const AREAS=Object.freeze([
    {key:"guidance",anchor:"visualGuidanceEditor",title:"Stage guidance",
      description:"Edit and validate the 18 stage-guidance drafts. Only these drafts belong to the isolated v3 publication service.",
      source:"contentDirtyCount",display:"guidanceEditorCount"},
    {key:"activities",anchor:"activityAuthoring",title:"Research activities",
      description:"Revise activity instructions, response-field labels and completion checks. Changes are review-only proposals.",
      source:"activityReviewCount",display:"activityEditorCount"},
    {key:"laboratories",anchor:"labGuideAuthoring",title:"Laboratory instructions",
      description:"Edit 32 instructional panels across four research laboratories. Interactive controls and decisions stay protected.",
      source:"labGuideCount",display:"labEditorCount"},
    {key:"student-guide",anchor:"studentGuideAuthoring",title:"Student Guide",
      description:"Edit stage explanations and field-level guidance. All glossary links and response identities remain unchanged.",
      source:"studentGuideCount",display:"studentEditorCount"},
    {key:"publication",anchor:"contentPublicationHeading",title:"Guidance publication",
      description:"Connect to the separate authenticated v3 service to publish or roll back a complete stage-guidance release. Review-only proposals cannot publish here.",
      source:"contentPublicationSessionState",display:"publicationEditorState"}
  ]);
  const byId=name=>document.getElementById(name);
  let selected="guidance",mounted=false,observer=null;
  function area(name){return AREAS.find(x=>x.key===name)||null;}
  function fromHash(){
    const hash=window.location.hash.slice(1);
    return AREAS.find(x=>x.anchor===hash)?.key||"";
  }
  function updateIndicators(){
    for(const next of AREAS){
      const value=byId(next.source)?.textContent?.trim()||"Unavailable";
      const output=byId(next.display);
      if(output&&output.textContent!==value)output.textContent=value;
    }
    const a=area(selected);
    const text=a&&(byId(a.source)?.textContent?.trim()||"Unavailable");
    const status=byId("contentViewStatus");
    if(status&&status.textContent!==text)status.textContent=text;
  }
  function show(key,{focus=false,updateHash=false}={}){
    const chosen=area(key);
    const nav=byId("contentAuthoringNav");
    if(!chosen||!nav||!byId("contentStudioPanel"))return false;
    if(chosen.key!==selected&&
       window.RMSInlineReviewEditor?.beforeContextChange?.()===false){
      // A hashchange may have come from browser history or a copied link.
      // Restore the current area's URL when a pending edit blocks it.
      if(window.location.hash!=="#"+area(selected).anchor)
        window.history.replaceState(null,"","#"+area(selected).anchor);
      return false;
    }
    selected=chosen.key;
    const preference=byId("reviewEditingPreference");
    if(preference)preference.hidden=
      !["activities","laboratories","student-guide"].includes(chosen.key);
    for(const item of byId("contentStudioPanel").querySelectorAll("[data-editor-workspace]")){
      item.hidden=item.dataset.editorWorkspace!==chosen.key;
    }
    for(const link of nav.querySelectorAll("[data-content-view]")){
      if(link.dataset.contentView===chosen.key)
        link.setAttribute("aria-current","page");
      else link.removeAttribute("aria-current");
    }
    byId("contentViewHeading").textContent=chosen.title;
    byId("contentViewDescription").textContent=chosen.description;
    updateIndicators();
    if(updateHash&&window.history?.replaceState)
      window.history.replaceState(null,"","#"+chosen.anchor);
    if(focus){
      // The current heading names the selected workspace to screen readers.
      byId("contentViewHeading").focus({preventScroll:true});
      nav.scrollIntoView({block:"start",behavior:"auto"});
    }
    return true;
  }
  function mount(){
    if(mounted)return true;
    const nav=byId("contentAuthoringNav");
    if(!nav||!byId("contentStudioPanel"))return false;
    for(const anchor of nav.querySelectorAll("[data-content-view]")){
      const key=anchor.dataset.contentView;
      if(!area(key))return false;
      anchor.addEventListener("click",event=>{
        event.preventDefault();
        show(key,{focus:true,updateHash:true});
      });
    }
    observer=new MutationObserver(()=>updateIndicators());
    for(const areaItem of AREAS){
      const el=byId(areaItem.source);
      if(el)observer.observe(el,{childList:true,characterData:true,subtree:true});
    }
    window.addEventListener("hashchange",()=>{
      const key=fromHash();
      if(!key)return;
      const panel=byId("contentStudioPanel");
      if(panel.hidden)
        document.querySelector('[data-admin-panel="content-studio"]')?.click();
      show(key,{focus:true});
    });
    show(fromHash()||"guidance");
    mounted=true;
    return true;
  }
  return Object.freeze({mount,show,hasLinkHash:()=>!!fromHash(),current:()=>selected});
})();
