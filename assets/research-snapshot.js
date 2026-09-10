
window.RMSResearchSnapshot=(()=>{
 const C=window.RMSCurriculum,Paths=window.RMSPathways;
 const phaseGroups=[
   {id:"question",title:"1 · Question & Direction",subtitle:"What you are studying and why",stages:[1,2,3,4]},
   {id:"literature",title:"2 · Literature & Evidence Base",subtitle:"Search, source evidence, synthesis, and rationale",stages:[5,6,7,8]},
   {id:"design",title:"3 · Study Design & Method",subtitle:"Design, variables/constructs, units, sampling, measurement, ethics, and protocol",stages:[9,10,11,12]},
   {id:"analysis",title:"4 · Data, Analysis & Results",subtitle:"Data structure, descriptive work, analysis choice, and results",stages:[13,14,15]},
   {id:"interpretation",title:"5 · Discussion & Paper",subtitle:"Interpretation, limitations, conclusion, abstract, and final audit",stages:[16,17,18]}
 ];
 const trim=v=>String(v??"").trim();
 const filled=v=>trim(v)!=="";
 const clean=s=>String(s??"").replace(/\s+/g," ").trim();

 function fieldMeta(stageId,key){
   const s=C.stages.find(x=>Number(x.id)===Number(stageId));if(!s)return null;
   for(const sec of s.sections||[]){
     for(const f of sec.fields||[])if(f[0]===key)return {label:Paths.label?Paths.label(window.__rmsSnapshotProject||{},key,f[1]):f[1],baseLabel:f[1],type:f[2],section:sec.title};
   }
   return null;
 }

 function stageFields(project,stageId,showEmpty=false){
   const s=C.stages.find(x=>Number(x.id)===Number(stageId));if(!s)return[];
   const out=[];
   for(const sec of s.sections||[]){
     for(const f of sec.fields||[]){
       const [key,baseLabel,type]=f;
       if(Paths.shouldShowField && !Paths.shouldShowField(project,key,stageId))continue;
       const value=project.data?.[key];
       if(!showEmpty&&!filled(value))continue;
       out.push({
         key,label:Paths.label?Paths.label(project,key,baseLabel):baseLabel,
         value:trim(value),type,section:sec.title,stage:stageId
       });
     }
   }
   if(Number(stageId)===7){
     [["gapSourceIds","Source IDs that directly support the rationale"],["gapBoundary","Evidence that would make the rationale/gap statement too strong"]].forEach(([key,label])=>{
       const value=project.data?.[key];if(showEmpty||filled(value))out.push({key,label,value:trim(value),type:"textarea",section:"Literature rationale audit",stage:7});
     });
   }
   return out;
 }

 function stageStatus(project,stageId){
   const s=C.stages.find(x=>Number(x.id)===Number(stageId));if(!s)return{done:0,total:0};
   let done=0,total=0;
   for(const sec of s.sections||[])for(const f of sec.fields||[]){
     if(Paths.shouldShowField && !Paths.shouldShowField(project,f[0],stageId))continue;
     total++;if(filled(project.data?.[f[0]]))done++;
   }
   return {done,total,ready:!!project.ready?.[stageId]};
 }

 function first(...vals){return vals.map(trim).find(Boolean)||""}

 function coreChain(project){
   const d=project.data||{},path=Paths.selected?Paths.selected(project):{name:project.pathway?.selected||"Unsure"};
   const entries=[
     {label:"Research question",value:d.finalRQ,stage:4,priority:1},
     {label:"Research path",value:path?.name||"",stage:4,priority:2},
     {label:"Study / review design",value:d.designType,stage:9,priority:3},
     {label:"Why this study",value:first(d.gapStatement,d.rqJustification,d.litToRQ),stage:7,priority:4},
     {label:"Prediction / hypothesis",value:d.researchHyp,stage:10,priority:5},
     {label:"Predictor / exposure / manipulated factor",value:d.predictorIV,stage:10,priority:6},
     {label:"Outcome / response",value:d.outcomeDV,stage:10,priority:7},
     {label:"Independent / evidence unit",value:first(d.experimentalUnit,d.rowUnit),stage:10,priority:8},
     {label:"Population / system",value:d.population,stage:11,priority:9},
     {label:"Actual sample / corpus",value:d.sample,stage:11,priority:10},
     {label:"Primary analysis",value:d.analysisChoice,stage:14,priority:11},
     {label:"Primary quantity / estimand",value:d.primaryEstimand,stage:14,priority:12},
     {label:"Main result",value:d.result1,stage:15,priority:13},
     {label:"Current answer to RQ",value:d.directAnswer,stage:16,priority:14},
     {label:"Claim boundary",value:d.claimBoundary,stage:9,priority:15},
     {label:"Main limitations",value:d.limitations,stage:16,priority:16},
     {label:"Working title",value:d.titleDraft,stage:17,priority:17}
   ].filter(x=>filled(x.value));
   return entries;
 }

 function sourceSummary(project){
   const rows=project.sources||[];
   const included=rows.filter(x=>String(x.screeningStatus||"").toLowerCase()==="included").length;
   const verified=rows.filter(x=>x.verified).length;
   return {total:rows.length,included,verified};
 }

 function sectionData(project,showEmpty=false){
   return phaseGroups.map(g=>({
     ...g,
     stages:g.stages.map(id=>{
       const s=C.stages.find(x=>Number(x.id)===Number(id));
       return {id,title:Paths.stageTitle?Paths.stageTitle(project,id,s?.title||s?.nav||`Stage ${id}`):(s?.title||`Stage ${id}`),
         fields:stageFields(project,id,showEmpty),status:stageStatus(project,id)};
     })
   }));
 }



 function crossPathFields(project){
   const out=[];
   for(const s of C.stages||[])for(const sec of s.sections||[])for(const f of sec.fields||[]){
     const [key,baseLabel,type]=f,value=project.data?.[key];
     if(!filled(value))continue;
     if(Paths.shouldShowField && Paths.shouldShowField(project,key,s.id))continue;
     out.push({stage:s.id,key,label:baseLabel,value:trim(value),type});
   }
   return out;
 }

 function workspaceData(project){
   const sources=(project.sources||[]).map(s=>({
     id:s.id||"",citation:trim(s.citation||s.title),status:trim(s.screeningStatus),
     design:trim(s.design),sample:trim(s.sample||s.population),finding:trim(s.finding),limits:trim(s.limits),verified:!!s.verified
   }));
   const searchLog=(project.searchLog||[]).map(x=>({
     date:trim(x.date),database:trim(x.database),query:trim(x.query),filters:trim(x.filters),results:trim(x.results),kept:trim(x.kept),notes:trim(x.notes)
   }));
   const schema=(project.schema||[]).map(x=>({
     name:trim(x.name),type:trim(x.type),unit:trim(x.unit||x.units),definition:trim(x.definition)
   }));
   const runs=(project.analysis?.runs||[]).map((x,i)=>({
     id:`A${i+1}`,summary:trim(x.neutral_summary),test:trim(x.output?.test||x.structure),time:trim(x.timestamp)
   }));
   const writing=Object.entries(project.writing?.sections||{}).filter(([,v])=>filled(v)).map(([k,v])=>({
     section:k,text:trim(v),words:(String(v).match(/\b[\w’'-]+\b/g)||[]).length
   }));
   const m=project.methods||{};
   const methodRecords={
     design:Object.entries(m.design||{}).filter(([,v])=>filled(v)).map(([k,v])=>({key:k,value:typeof v==="object"?JSON.stringify(v):trim(v)})),
     sampling:Object.entries(m.sampling||{}).filter(([,v])=>filled(v)).map(([k,v])=>({key:k,value:typeof v==="object"?JSON.stringify(v):trim(v)})),
     ethics:Object.entries(m.ethics||{}).filter(([,v])=>filled(v)).map(([k,v])=>({key:k,value:typeof v==="object"?JSON.stringify(v):trim(v)})),
     constructs:(m.constructs||[]).filter(x=>Object.values(x||{}).some(filled)),
     conditions:(m.conditions||[]).filter(x=>Object.values(x||{}).some(filled)),
     measurements:(m.measurements||[]).filter(x=>Object.values(x||{}).some(filled)),
     procedureSteps:(m.procedureSteps||[]).filter(x=>Object.values(x||{}).some(filled)),
     protocolVersions:(m.protocolVersions||[]).length
   };
   const feedback=(project.journey?.teacherFeedback||[]).map(x=>({
     milestone:trim(x.milestone||x.checkpoint||""),comment:trim(x.comment||x.feedback||x.detail||""),time:trim(x.importedAt||x.time||"")
   })).filter(x=>x.comment);
   const versionArchive=(project.flow?.versionArchive||[]).map(x=>({
     time:trim(x.time),kind:trim(x.kind),key:trim(x.key),
     stageValue:trim(x.stageValue),labValue:trim(x.labValue)
   }));
   return {sources,searchLog,schema,runs,writing,feedback,methodRecords,crossPath:crossPathFields(project),versionArchive};
 }

 function summaryStats(project){
   let filledCount=0,visibleCount=0;
   for(let i=1;i<=18;i++){const x=stageStatus(project,i);filledCount+=x.done;visibleCount+=x.total}
   return {
     filled:filledCount,visible:visibleCount,ready:Object.values(project.ready||{}).filter(Boolean).length,
     sources:sourceSummary(project)
   };
 }

 function markdown(project,showEmpty=false){
   const lines=[`# ${project.name||"My Research Project"} — Current Research Snapshot`];
   if(project.context)lines.push(`\n**Context:** ${project.context}`);
   const path=Paths.selected?Paths.selected(project).name:(project.pathway?.selected||"Unsure");
   lines.push(`\n**Current research path:** ${path}`);
   lines.push(`**Current stage:** ${project.currentStage||1} of 18`);
   lines.push(`**Stages marked ready:** ${Object.values(project.ready||{}).filter(Boolean).length} of 18`);
   lines.push(`\n## At-a-glance research chain`);
   const core=coreChain(project);
   if(core.length)core.forEach(x=>lines.push(`\n**${x.label}**\n\n${clean(x.value)}`));
   else lines.push("\nNo major research decisions have been recorded yet.");
   for(const group of sectionData(project,showEmpty)){
     lines.push(`\n## ${group.title}`);
     for(const st of group.stages){
       const any=st.fields.length>0;
       if(!any&&!showEmpty)continue;
       lines.push(`\n### Stage ${st.id} · ${st.title}`);
       if(!any)lines.push("\n_No current response yet._");
       for(const f of st.fields){
         lines.push(`\n**${f.label}**\n\n${f.value||"_Not yet completed._"}`);
       }
     }
   }
   const ss=sourceSummary(project),ws=workspaceData(project);
   if(ws.searchLog.length){
     lines.push(`\n## Search history`);
     ws.searchLog.forEach((x,i)=>lines.push(`\n**Search ${i+1}${x.database?` · ${x.database}`:""}**\n\n${x.query||"_No query recorded_"}${x.date?`\n\nDate: ${x.date}`:""}${x.filters?`\n\nFilters: ${x.filters}`:""}${x.notes?`\n\nNotes: ${x.notes}`:""}`));
   }
   const mr=ws.methodRecords||{};
   if(mr.constructs?.length||mr.conditions?.length||mr.measurements?.length||mr.procedureSteps?.length||mr.design?.length||mr.sampling?.length||mr.ethics?.length){
     lines.push(`\n## Structured Methods Lab records`);
     if(mr.constructs?.length){lines.push(`\n### Constructs / variables`);mr.constructs.forEach((x,i)=>lines.push(`\n${i+1}. ${Object.entries(x).filter(([,v])=>filled(v)).map(([k,v])=>`${k}: ${v}`).join(" | ")}`))}
     if(mr.conditions?.length){lines.push(`\n### Conditions / comparisons`);mr.conditions.forEach((x,i)=>lines.push(`\n${i+1}. ${Object.entries(x).filter(([,v])=>filled(v)).map(([k,v])=>`${k}: ${v}`).join(" | ")}`))}
     if(mr.measurements?.length){lines.push(`\n### Measurements`);mr.measurements.forEach((x,i)=>lines.push(`\n${i+1}. ${Object.entries(x).filter(([,v])=>filled(v)).map(([k,v])=>`${k}: ${v}`).join(" | ")}`))}
     if(mr.procedureSteps?.length){lines.push(`\n### Procedure steps`);mr.procedureSteps.forEach((x,i)=>lines.push(`\n${i+1}. ${Object.entries(x).filter(([,v])=>filled(v)).map(([k,v])=>`${k}: ${v}`).join(" | ")}`))}
   }
   if(ss.total){
     lines.push(`\n## Source workspace\n\n${ss.total} source record(s), ${ss.included} marked included, ${ss.verified} bibliography record(s) marked verified.`);
     ws.sources.forEach(s=>{
       let block=`\n### ${s.id||"Source"}\n\n${s.citation||"_No citation recorded_"}`;
       if(s.finding)block+=`\n\n**Finding / contribution**\n\n${s.finding}`;
       if(s.limits)block+=`\n\n**Limitations / boundary**\n\n${s.limits}`;
       lines.push(block);
     });
   }
   if(ws.schema.length){lines.push(`\n## Current data schema`);ws.schema.forEach(x=>lines.push(`\n**${x.name||"Unnamed column"}** — ${[x.type,x.unit].filter(Boolean).join(" · ")}${x.definition?`\n\n${x.definition}`:""}`))}
   if(ws.runs.length){lines.push(`\n## Stored analysis runs`);ws.runs.forEach(x=>lines.push(`\n**${x.id}${x.test?` · ${x.test}`:""}**\n\n${x.summary||"_No neutral summary stored_"}`))}
   if(ws.writing.length){lines.push(`\n## Writing Lab drafts`);ws.writing.forEach(x=>lines.push(`\n### ${x.section}\n\n${x.text}`))}
   if(ws.feedback.length){lines.push(`\n## Teacher feedback`);ws.feedback.forEach(x=>lines.push(`\n- ${x.comment}`))}
   if(ws.crossPath?.length){lines.push(`\n## Earlier / cross-path responses`);ws.crossPath.forEach(x=>lines.push(`\n**Stage ${x.stage} · ${x.label}**\n\n${x.value}`))}
   if(ws.versionArchive?.length){
     lines.push(`\n## Earlier duplicate versions preserved during upgrade`);
     ws.versionArchive.forEach(x=>lines.push(`\n**${x.key} · ${x.kind}**\n\nStage/notebook version: ${x.stageValue||"_blank_"}\n\nEarlier Lab version: ${x.labValue||"_blank_"}`));
   }
   return lines.join("\n");
 }

 return {phaseGroups,stageFields,stageStatus,coreChain,sourceSummary,crossPathFields,workspaceData,sectionData,summaryStats,markdown};
})();
