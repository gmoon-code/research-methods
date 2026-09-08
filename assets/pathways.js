
window.RMSPathways=(()=>{
  const M=window.RMSPathwayModel;
  const pathById=id=>M.paths.find(x=>x.id===id)||M.paths[0];
  function normalizeProject(p){
    p.pathway=p.pathway||{};
    const x=p.pathway;
    x.selected=x.selected||"unsure";
    x.confirmed=!!x.confirmed;
    x.confirmedAt=x.confirmedAt||"";
    x.source=x.source||"";
    x.showExtraByStage=x.showExtraByStage||{};
    x.history=x.history||[];
    return p;
  }
  function recommendationFromQuestionType(q){
    const t=String(q||"").toLowerCase();
    if(t.includes("meta"))return"meta_analysis";
    if(t.includes("literature"))return"literature_review";
    if(t.includes("qualitative"))return"qualitative";
    if(t.includes("quasi"))return"quasi_experimental";
    if(t.includes("experimental"))return"experimental";
    if(t.includes("correl")||t.includes("observ"))return"observational";
    if(t.includes("descriptive"))return"descriptive_quantitative";
    if(t.includes("mixed"))return"mixed_methods";
    return"unsure";
  }
  function recommendation(p){return recommendationFromQuestionType(p.data?.questionType)}
  function select(p,id,source="student"){
    normalizeProject(p);
    const prev=p.pathway.selected,next=pathById(id).id;
    p.pathway.selected=next;
    p.pathway.confirmed=next!=="unsure";
    p.pathway.confirmedAt=new Date().toISOString();
    p.pathway.source=source;
    if(prev!==next){
      p.ready=p.ready||{};
      for(let stage=9;stage<=18;stage++) p.ready[stage]=false;
      if((p.methods?.protocolVersions||[]).length) p.pathway.protocolReviewRequired=true;
      p.pathway.history.push({time:p.pathway.confirmedAt,from:prev,to:next,source,downstreamReadinessInvalidated:true});
    }else p.pathway.history.push({time:p.pathway.confirmedAt,from:prev,to:next,source});
    return p.pathway.selected;
  }
  function selected(p){normalizeProject(p);return pathById(p.pathway.selected)}
  function fieldMode(p,key){
    normalizeProject(p);
    const path=p.pathway.selected||"unsure";
    return M.field_modes[path]?.[key]||"core";
  }
  function shouldShowField(p,key,stage){
    const mode=fieldMode(p,key);
    if(mode!=="hide")return true;
    if(String(p.data?.[key]??"").trim())return true;
    return !!p.pathway.showExtraByStage?.[stage];
  }
  function hiddenCountForStage(p,stage,fieldKeys){
    return fieldKeys.filter(k=>fieldMode(p,k)==="hide"&&!String(p.data?.[k]??"").trim()).length;
  }
  function toggleExtras(p,stage){
    normalizeProject(p);p.pathway.showExtraByStage[stage]=!p.pathway.showExtraByStage[stage];
    return p.pathway.showExtraByStage[stage];
  }
  function label(p,key,defaultLabel){
    const path=p.pathway?.selected||"unsure";
    return M.label_overrides[path]?.[key]||defaultLabel;
  }
  function focus(p,stage){return M.stage_focus[p.pathway?.selected||"unsure"]?.[stage]||""}
  function stageTitle(p,stage,defaultTitle){return M.stage_titles[p.pathway?.selected||"unsure"]?.[stage]||defaultTitle}
  function toolRelevance(p,tool){return M.tool_relevance[p.pathway?.selected||"unsure"]?.[tool]||"supporting"}
  function requiredVisibleFields(p,stage,sections){
    const arr=[];
    for(const sec of sections||[])for(const f of sec.fields||[]){
      if(shouldShowField(p,f[0],stage)&&fieldMode(p,f[0])==="core")arr.push(f[0]);
    }
    return arr;
  }
  function completion(p,stage,sections){
    const keys=requiredVisibleFields(p,stage,sections);
    const done=keys.filter(k=>String(p.data?.[k]??"").trim()).length;
    return {done,total:keys.length,missing:keys.filter(k=>!String(p.data?.[k]??"").trim())};
  }
  function routeSummary(p){
    const path=selected(p),rec=pathById(recommendation(p));
    return {path,recommended:rec,confirmed:p.pathway.confirmed,match:path.id===rec.id||rec.id==="unsure"};
  }
  return {model:M,normalizeProject,pathById,recommendationFromQuestionType,recommendation,select,selected,fieldMode,shouldShowField,
    hiddenCountForStage,toggleExtras,label,focus,stageTitle,toolRelevance,completion,routeSummary};
})();
