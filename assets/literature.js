
window.RMSLiterature = (() => {
  const escCSV = v => `"${String(v??"").replaceAll('"','""')}"`;

  function normalizeProject(project){
    project.searchLog = project.searchLog || [];
    project.screening = project.screening || [];
    project.litClaims = project.litClaims || [];
    project.litOutline = project.litOutline || [];
    project.sources = (project.sources || []).map((s,i)=>({
      id:s.id || `S${String(i+1).padStart(2,"0")}`,
      citation:s.citation||"",
      authors:s.authors||"",
      year:s.year||"",
      title:s.title||"",
      journal:s.journal||"",
      doi:s.doi||"",
      url:s.url||"",
      type:s.type||"",
      design:s.design||"",
      sample:s.sample||"",
      population:s.population||s.sample||"",
      variables:s.variables||"",
      measures:s.measures||"",
      finding:s.finding||"",
      limits:s.limits||"",
      relevance:s.relevance||"",
      qualityNotes:s.qualityNotes||"",
      screeningStatus:["Included","Pending","Excluded"].includes(s.screeningStatus)?s.screeningStatus:"Pending",
      screeningReason:s.screeningReason||"",
      trapp:s.trapp||{timeframe:"",relevance:"",authority:"",accuracy:"",purpose:""},
      themes:s.themes||[],
      themeEvidence:s.themeEvidence||[],
      verified:s.verified||false
    }));
    return project;
  }

  function nextSourceId(project){
    const nums=(project.sources||[]).map(s=>Number(String(s.id||"").replace(/\D/g,""))||0);
    return `S${String((nums.length?Math.max(...nums):0)+1).padStart(2,"0")}`;
  }

  function trappSummary(s){
    const t=s.trapp||{};
    const vals=["timeframe","relevance","authority","accuracy","purpose"].map(k=>String(t[k]||"").trim());
    const filled=vals.filter(Boolean).length;
    return {filled,total:5,ready:filled===5};
  }

  function sourceCompleteness(s){
    const required=["citation","design","sample","measures","finding","limits","relevance"];
    const n=required.filter(k=>String(s[k]||"").trim()).length;
    return {filled:n,total:required.length,ratio:n/required.length};
  }

  function uniqueThemes(project){
    return [...new Set((project.sources||[]).filter(s=>s.screeningStatus==="Included").flatMap(s=>(s.themeEvidence||[]).map(e=>e.theme).concat(s.themes||[])).map(x=>String(x||"").trim()).filter(Boolean))].sort();
  }

  function themeMap(project){
    const themes=uniqueThemes(project);
    return themes.map(theme=>{
      const rows=(project.sources||[]).filter(s=>s.screeningStatus==="Included").map(s=>{
        const ev=(s.themeEvidence||[]).filter(e=>String(e.theme||"").trim()===theme);
        const legacy=(s.themes||[]).includes(theme) && !ev.length ? [{theme,stance:"background",note:"Legacy theme tag; supporting evidence has not been recorded"}] : [];
        const all=ev.concat(legacy);
        return all.length ? {source:s,evidence:all} : null;
      }).filter(Boolean);
      const stance = st => rows.filter(r=>r.evidence.some(e=>e.stance===st)).map(r=>r.source);
      return {
        theme,
        sources:rows,
        supporting:stance("supports"),
        conflicting:stance("conflicts"),
        mixed:stance("mixed"),
        background:stance("background")
      };
    });
  }

  function gapReadiness(project){
    const included=(project.sources||[]).filter(s=>s.screeningStatus==="Included");
    const themes=themeMap(project);
    const withMulti=themes.filter(t=>new Set([...t.supporting,...t.conflicting,...t.mixed].map(s=>s.id)).size>=2);
    const withConflict=themes.filter(t=>t.conflicting.length || t.mixed.length);
    const limitations=included.filter(s=>String(s.limits||"").trim()).length;
    const measurements=new Set(included.map(s=>s.measures).filter(Boolean)).size;
    const contexts=new Set(included.map(s=>s.sample).filter(Boolean)).size;
    const messages=[];
    if(!included.length) messages.push("No sources have been marked Included. Check eligibility decisions before summarising a literature pattern.");
    if(withMulti.length<2) messages.push("The current evidence map has fewer than two themes linking multiple student-included records with recorded evidence stances. Check eligibility, extracted findings and study measures before describing convergence; recorded stances do not independently verify a shared finding.");
    if(limitations<Math.max(2,Math.ceil(included.length/2))) messages.push("Extract limitations from more included studies before using recurring limitations as a study rationale.");
    return {
      included:included.length,
      themes:themes.length,
      multiSourceThemes:withMulti.length,
      conflictThemes:withConflict.length,
      measurementDiversity:measurements,
      contextDiversity:contexts,
      messages,
      safeToClaimGlobalGap: false
    };
  }

  function claimAudit(project){
    const byId=new Map((project.sources||[]).map(s=>[s.id,s]));
    return (project.litClaims||[]).map(c=>{
      const refs=[...new Set((c.sourceIds||[]).map(x=>String(x||"").trim()).filter(Boolean))];
      const includedIds=refs.filter(id=>byId.get(id)?.screeningStatus==="Included");
      const pendingIds=refs.filter(id=>byId.get(id)?.screeningStatus==="Pending");
      const excludedIds=refs.filter(id=>byId.get(id)?.screeningStatus==="Excluded");
      const missingIds=refs.filter(id=>!byId.has(id));
      return {
        ...c,
        sourceCount:includedIds.length,
        includedIds,
        pendingIds,
        excludedIds,
        missingIds,
        traceable:includedIds.length>0,
        synthesis:includedIds.length>=2
      };
    });
  }

  function makeStudyMatrixCSV(project){
    const heads=["Source ID","Citation","Population/context","Variables","Methods/design","Measures","Key findings","Limitations","Quality notes","Screening status"];
    const rows=(project.sources||[]).filter(s=>s.screeningStatus==="Included").map(s=>[
      s.id,s.citation,s.sample,s.variables,s.design,s.measures,s.finding,s.limits,s.qualityNotes,s.screeningStatus
    ]);
    return [heads,...rows].map(r=>r.map(escCSV).join(",")).join("\n");
  }

  function searchLogStatus(record){
    const x=record||{};
    const required=["date","database","query","filters","results"];
    const missing=required.filter(k=>String(x[k]??"").trim()==="");
    const complete=missing.length===0;
    const confirmed=complete && x.executed===true;
    return {complete,confirmed,missing,label:!complete?"Incomplete record":confirmed?"Execution confirmed by student":"Execution not confirmed"};
  }

  function reviseSearchLog(project,index,updates,reason,editedAt){
    const records=project.searchLog||[];
    const original=records[index];
    if(!original)throw Error("Search record was not found.");
    const why=String(reason??"").trim();
    if(!why)throw Error("Explain what was corrected and why, so the earlier record remains interpretable.");
    if(!/^\d{4}-\d{2}-\d{2}T/.test(String(editedAt??"")))throw Error("A valid revision timestamp is required.");
    const keys=["date","database","query","filters","results","kept","notes"];
    const before=Object.fromEntries(keys.map(k=>[k,original[k]??""]));
    before.executed=original.executed===true?true:original.executed===false?false:null;
    const after=Object.fromEntries(keys.map(k=>[k,String(updates?.[k]??original[k]??"").trim()]));
    const changed=keys.filter(k=>String(before[k])!==after[k]);
    if(!changed.length)throw Error("No record details changed. Review the fields before saving a correction.");
    const executionFields=["date","database","query","filters","results"];
    const requiresConfirmation=changed.some(k=>executionFields.includes(k));
    const oldRevisions=Array.isArray(original.revisions)?original.revisions:[];
    const revised={...original,...after,executed:requiresConfirmation?false:original.executed,
      revisions:[...oldRevisions,{at:String(editedAt),reason:why,changed,before}]};
    records[index]=revised;
    return {record:revised,changed,requiresConfirmation};
  }

  function makeSearchRevisionCSV(project){
    const heads=["Search record position","Current database","Current query","Revision timestamp","Correction reason","Changed fields","Previous date","Previous database","Previous query","Previous filters","Previous results","Previous screened/kept","Previous notes","Previously execution-confirmed"];
    const rows=(project.searchLog||[]).flatMap((record,i)=>(record.revisions||[]).map(rev=>[i+1,record.database,record.query,rev.at,rev.reason,(rev.changed||[]).join("; "),rev.before?.date,rev.before?.database,rev.before?.query,rev.before?.filters,rev.before?.results,rev.before?.kept,rev.before?.notes,rev.before?.executed===true?"yes":rev.before?.executed===false?"no":"not recorded"]));
    return [heads,...rows].map(row=>row.map(escCSV).join(",")).join("\n");
  }

  function makeSearchLogCSV(project){
    const heads=["Date","Database/search system","Search string","Filters","Results returned","Screened/kept","Notes","Documentation status"];
    const rows=(project.searchLog||[]).map(x=>[x.date,x.database,x.query,x.filters,x.results,x.kept,x.notes,searchLogStatus(x).label]);
    return [heads,...rows].map(r=>r.map(escCSV).join(",")).join("\n");
  }

  function makeThemeCSV(project){
    const map=themeMap(project);
    const heads=["Theme","Supporting studies","Conflicting studies","Mixed studies","Background/context studies"];
    const rows=map.map(t=>[
      t.theme,
      t.supporting.map(s=>s.id).join("; "),
      t.conflicting.map(s=>s.id).join("; "),
      t.mixed.map(s=>s.id).join("; "),
      t.background.map(s=>s.id).join("; ")
    ]);
    return [heads,...rows].map(r=>r.map(escCSV).join(",")).join("\n");
  }

  function outlineMarkdown(project){
    const d=project.data||{};
    const lines=[
      "# Literature Review Outline",
      "",
      d.finalRQ ? `**Research question:** ${d.finalRQ}` : "",
      d.gapStatement ? `**Study rationale / gap:** ${d.gapStatement}` : "",
      "",
      "## Opening",
      d.litIntroPlan||"_Not yet drafted_",
      ""
    ];
    const sourceStatuses=new Map((project.sources||[]).map(src=>[src.id,src.screeningStatus||"Pending"]));

    (project.litOutline||[]).forEach((p,i)=>{
      lines.push(`## Paragraph ${i+1}: ${p.theme||"Untitled theme"}`);
      lines.push(`**Paragraph job:** ${p.job||""}`);
      lines.push(`**Claim:** ${p.claim||""}`);
      const linkedIds=[...new Set((p.sourceIds||[]).map(x=>String(x||"").trim()).filter(Boolean))];
      lines.push(`**Linked source IDs (verify claim support):** ${linkedIds.join(", ")||"None recorded"}`);
      const unresolved=linkedIds.filter(id=>sourceStatuses.get(id)!=="Included");
      if(unresolved.length)lines.push(`**Eligibility to check:** ${unresolved.map(id=>`${id} (${sourceStatuses.get(id)||"unknown ID"})`).join(", ")}`);
      lines.push(`**Comparison / synthesis:** ${p.synthesis||""}`);
      lines.push(`**Contradiction / qualification:** ${p.tension||""}`);
      lines.push(`**Method/context explanation:** ${p.conditions||""}`);
      if(p.transition)lines.push(`**Connection or implication (where useful):** ${p.transition}`);
      lines.push("");
    });
    lines.push("## Closing / study justification");
    lines.push(d.litEndPlan||d.litToRQ||"_Not yet drafted_");
    return lines.filter(x=>x!==undefined).join("\n");
  }

  function sourceIdsForTheme(project,theme){
    const t=themeMap(project).find(x=>x.theme===theme);
    if(!t) return [];
    return [...new Set(t.sources.map(r=>r.source.id))];
  }

  return {
    normalizeProject,nextSourceId,trappSummary,sourceCompleteness,uniqueThemes,themeMap,
    gapReadiness,claimAudit,makeStudyMatrixCSV,makeSearchLogCSV,makeSearchRevisionCSV,searchLogStatus,reviseSearchLog,makeThemeCSV,
    outlineMarkdown,sourceIdsForTheme
  };
})();
