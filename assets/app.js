
(() => {
  "use strict";
  const C=window.RMSCurriculum,E=window.RMSEngine,Coach=window.RMSCoach,AI=window.RMSAI,Lit=window.RMSLiterature,Methods=window.RMSMethods,Stats=window.RMSAnalytics,DataLab=window.RMSDataLab,Writing=window.RMSWriting,WritingLab=window.RMSWritingLab,Transfer=window.RMSTransfer,TransferUI=window.RMSTransferUI,Competency=window.RMSCompetency,CompetencyUI=window.RMSCompetencyUI,Journey=window.RMSJourney,JourneyUI=window.RMSJourneyUI,Pilot=window.RMSPilot,PilotUI=window.RMSPilotUI,Guide=window.RMSGuidanceUI,Paths=window.RMSPathways,PathUI=window.RMSPathwayUI,PathCoach=window.RMSNoviceGuard,Rescue=window.RMSRescue,RescueUI=window.RMSRescueUI,Exemplar=window.RMSExemplar,ExemplarUI=window.RMSExemplarUI;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const KEY="research_methods_studio_v1";
  let project=Pilot.normalizeProject(Journey.normalizeProject(Competency.normalizeProject(Transfer.normalizeProject(Writing.normalizeProject(Stats.normalizeProject(Methods.normalizeProject(Lit.normalizeProject(Exemplar.normalizeProject(Rescue.normalizeProject(Paths.normalizeProject({name:"",context:"",currentStage:1,ready:{},data:{},sources:[],reviews:[],schema:[],searchLog:[],litClaims:[],litOutline:[],methods:{},analysis:{},writing:{},transfer:{},competency:{},journey:{},pilot:{},pathway:{},rescue:{},created:new Date().toISOString()})))))))))));

  const load=()=>{const got=Pilot.safeLoad(KEY);if(got.project){project=got.project;project.reviews=project.reviews||[];project.schema=project.schema||[];project.sources=project.sources||[];project.ready=project.ready||{};project.data=project.data||{};Paths.normalizeProject(project);Rescue.normalizeProject(project);Exemplar.normalizeProject(project);Lit.normalizeProject(project);Methods.normalizeProject(project);Stats.normalizeProject(project);Writing.normalizeProject(project);Transfer.normalizeProject(project);Competency.normalizeProject(project);Journey.normalizeProject(project);Pilot.normalizeProject(project);if(got.source==="recovery"){Pilot.logRuntime(project,"recovery_load","Primary project could not be read; recovery snapshot was loaded.");Pilot.safeSave(KEY,project)}}};
  const save=()=>Pilot.safeSave(KEY,project);
  const stage=id=>C.stages.find(s=>s.id===Number(id));
  const current=()=>stage(project.currentStage);
  function pct(){return Math.round(Object.values(project.ready||{}).filter(Boolean).length/C.stages.length*100)}

  function renderNav(){
    $("phaseNav").innerHTML=C.phases.map(ph=>`<div class="phase"><div class="phase-title">${esc(ph.label)}</div>${ph.steps.map(id=>{
      const s=stage(id),title=Paths.stageTitle(project,id,s.nav);return `<button class="nav-step ${project.currentStage===id?"active":""} ${project.ready[id]?"done":""}" data-stage="${id}"><span class="nav-num">${project.ready[id]?"✓":id}</span><span class="nav-label">${esc(title)}</span></button>`
    }).join("")}</div>`).join("");
    document.querySelectorAll("[data-stage]").forEach(b=>b.onclick=()=>{project.currentStage=Number(b.dataset.stage);save();renderAll();window.scrollTo({top:210,behavior:"smooth"})});
    $("progressPct").textContent=pct()+"%";$("progressBar").style.width=pct()+"%";
    $("progressText").textContent=`${Object.values(project.ready||{}).filter(Boolean).length} of ${C.stages.length} stages marked ready`;
    const mobile=$("mobileStageSelect");
    if(mobile){mobile.innerHTML=C.stages.map(s=>`<option value="${s.id}" ${project.currentStage===s.id?"selected":""}>${s.id}. ${esc(Paths.stageTitle(project,s.id,s.nav))}</option>`).join("");mobile.onchange=()=>{project.currentStage=Number(mobile.value);save();renderAll();window.scrollTo({top:210,behavior:"smooth"})}}
  }

  function snapshot(){
    const d=project.data;
    const vals=[
      ["Research path",Paths.selected(project).name],
      ["Topic",d.topicChoice||d.broadTopic],
      ["Research question",d.finalRQ],
      ["Design",d.designType],
      ["Predictor / IV",d.predictorIV],
      ["Outcome",d.outcomeDV],
      ["Analysis",d.analysisChoice],
      ["Title",d.titleDraft]
    ].filter(x=>x[1]);
    $("snapshot").innerHTML=vals.length?vals.map(v=>`<div class="snap-item"><span>${esc(v[0])}</span><b>${esc(v[1])}</b></div>`).join(""):`<p class="empty-snap">Your major decisions will appear here as the project develops.</p>`;
  }

  function termCard(){
    const t=C.terms[(project.currentStage-1)%C.terms.length];
    $("termCard").innerHTML=`<div class="term"><strong>${esc(t[0])}</strong><div>${esc(t[1])}</div><div class="term-next">Research vocabulary is introduced when it becomes useful, not as a memorization list.</div></div>`;
  }

  function fieldHTML(f,stageId){
    const [key,baseLabel,type,options]=f, val=project.data[key]??"", mode=Paths.fieldMode(project,key), label=Paths.label(project,key,baseLabel);
    let control="";
    if(type==="textarea") control=`<label><span>${esc(label)} ${PathUI.fieldBadge(mode)}</span><textarea data-field="${key}">${esc(val)}</textarea></label>`;
    else if(type==="select") control=`<label><span>${esc(label)} ${PathUI.fieldBadge(mode)}</span><select data-field="${key}"><option value="">Choose…</option>${options.map(o=>`<option ${val===o?"selected":""}>${esc(o)}</option>`).join("")}</select></label>`;
    else control=`<label><span>${esc(label)} ${PathUI.fieldBadge(mode)}</span><input data-field="${key}" value="${esc(val)}"></label>`;
    const supportLevel=Rescue.maxFieldLevel(project,stageId,key);
    return `<div class="guided-field ${mode==="hide"?"cross-design-field":""}">${control}<div class="field-support-row"><button type="button" class="progressive-help-button" data-progressive-help="${key}" data-help-stage="${stageId}">Progressive help${supportLevel?` · L${supportLevel} used`:""}</button></div>${Guide.fieldHelp(key,label)}</div>`;
  }

  function sectionsHTML(s){
    return s.sections.map(sec=>{
      const visible=sec.fields.filter(f=>Paths.shouldShowField(project,f[0],s.id));
      if(!visible.length)return"";
      return `<div class="form-section"><h4>${esc(sec.title)}</h4><p>${esc(sec.desc)}</p><div class="form-grid ${visible.length>4?"two":""}">${visible.map(f=>fieldHTML(f,s.id)).join("")}</div></div>`;
    }).join("");
  }

  function sourceManager(){
    const cards=project.sources.map((s,i)=>{
      const comp=Lit.sourceCompleteness(s), tr=Lit.trappSummary(s);
      const stClass=s.screeningStatus==="Included"?"status-inc":s.screeningStatus==="Excluded"?"status-exc":"status-pen";
      return `<div class="source-card"><div class="lit-source-head"><div><div class="lit-source-title">${esc(s.id)} · ${esc(s.citation||s.title||"Untitled source")}</div><div><span class="pill ${stClass}">${esc(s.screeningStatus)}</span><span class="pill">${Math.round(comp.ratio*100)}% extraction</span><span class="pill">${tr.filled}/5 TRAPP</span>${s.verified?'<span class="pill green">bibliography verified</span>':""}</div></div><div class="source-actions"><button class="ghost small" data-edit-source="${i}">Edit</button><button class="danger small" data-del-source="${i}">Remove</button></div></div>
        <p><b>Design</b> ${esc(s.design||"—")} · <b>Population/context</b> ${esc(s.sample||"—")}</p>
        <p><b>Measures</b> ${esc(s.measures||"—")}</p><p><b>Finding</b> ${esc(s.finding||"—")}</p><p><b>Limitations</b> ${esc(s.limits||"—")}</p>
        ${(s.themeEvidence||[]).length?`<p><b>Theme evidence</b><br>${s.themeEvidence.map(e=>`<span class="theme-chip">${esc(e.theme)} · ${esc(e.stance)}</span>`).join("")}</p>`:""}</div>`;
    }).join("");
    return `<div class="form-section"><h4>Study extraction records</h4><p>This stage stores the evidence needed for the study matrix and later synthesis. The full Literature Workspace adds screening, TRAPP evaluation, theme stance, evidence mapping, and paragraph planning.</p>
      <div class="button-row"><button class="secondary" id="openLitFromSource">Open full Literature Workspace</button></div>
      <div>${cards||'<p class="muted">No sources added yet. Open the Literature Workspace to add and screen sources.</p>'}</div></div>`;
  }

  function interestCompass(){
    return `<div class="tool-card"><h4>Interest Compass</h4><p>Use this after writing your own interests. It generates question pathways, not a finished topic.</p><details class="choice-help" open><summary>What do these kinds of curiosity mean?</summary><ul><li><b>Describe</b> asks what exists, how common it is, or what a distribution looks like.</li><li><b>Relationship</b> asks whether measured variables vary together. A relationship does not automatically mean causation.</li><li><b>Cause</b> asks what happens when something is deliberately changed and needs a design that addresses alternative explanations.</li><li><b>Experience</b> asks how people describe meanings, experiences, processes, or reasons.</li><li><b>Literature</b> asks what existing research collectively shows.</li></ul></details>
      <div class="form-grid two"><label><span>Paste the interest/problem/claim you want to explore</span><textarea id="interestText">${esc([project.data.interest1,project.data.problem1,project.data.claim1].filter(Boolean).join("\n"))}</textarea></label>
      <label><span>What kind of curiosity is strongest?</span><select id="interestCuriosity"><option value="">Show several paths</option><option value="describe">Describe a pattern</option><option value="relationship">Study a relationship</option><option value="cause">Test a possible cause</option><option value="experience">Understand experiences/explanations</option><option value="literature">Synthesize existing research</option></select></label></div>
      <button id="runInterest" class="secondary">Generate research pathways</button><div id="interestResult"></div></div>`;
  }

  function searchBuilder(){
    return `<div class="tool-card"><h4>Boolean Search Builder</h4><p>Enter synonyms separated by commas. The builder creates a draft query that you should adapt to the database syntax.</p><details class="choice-help" open><summary>How concept blocks work</summary><p>A <b>concept block</b> is one major idea in your question. Put alternative words for the same idea in one block. <b>OR</b> usually joins synonyms. <b>AND</b> joins different concepts.</p><p><b>Example</b> ("retrieval practice" OR "practice testing") AND (biology OR science) AND recall</p><button class="ghost small" data-open-glossary="boolean search">Explain Boolean search</button></details>
      <div class="form-grid three"><label><span>Concept block A</span><textarea id="boolA">${esc(project.data.searchBlock1||"")}</textarea></label><label><span>Concept block B</span><textarea id="boolB">${esc(project.data.searchBlock2||"")}</textarea></label><label><span>Population/context block</span><textarea id="boolC">${esc(project.data.searchBlock3||"")}</textarea></label></div>
      <button id="buildBoolean" class="secondary">Build draft search</button><div id="booleanResult"></div></div>`;
  }

  function synthesisMatrix(){
    const themes=[...new Set(project.sources.flatMap(s=>s.themes||[]).map(t=>t.trim()).filter(Boolean))].sort();
    if(!project.sources.length) return `<div class="tool-card"><h4>Synthesis Matrix</h4><p>Add source records in Stage 6 first. The matrix will use each source's theme tags.</p></div>`;
    if(!themes.length) return `<div class="tool-card"><h4>Synthesis Matrix</h4><p>Your sources do not have theme tags yet. Return to Stage 6 and add 1–3 tags to important sources.</p></div>`;
    return `<div class="tool-card"><h4>Theme-by-source synthesis matrix</h4><p>A dot means the source was tagged as contributing to that theme. Use the matrix to test whether a “theme” is actually supported across studies.</p><div class="table-wrap"><table class="synth-matrix"><thead><tr><th>Source</th>${themes.map(t=>`<th>${esc(t)}</th>`).join("")}</tr></thead><tbody>${project.sources.map(s=>`<tr><td>${esc(s.citation||"Untitled")}</td>${themes.map(t=>`<td class="synth-dot">${(s.themes||[]).includes(t)?"●":""}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>`;
  }

  function designMatcher(){
    return `<div class="tool-card"><h4>Research Design Matcher</h4><p>Answer based on what your question is trying to know. The result is a recommendation to evaluate, not an automatic method assignment.</p><details class="choice-help" open><summary>How to answer the design questions</summary><ul><li><b>Describe</b> means “what exists or how is it distributed?”</li><li><b>Associate</b> means “do two measured variables vary together?”</li><li><b>Cause</b> means “what is the effect of deliberately changing a factor?”</li><li><b>Experience</b> means “how do people explain or experience something?”</li><li><b>Manipulated</b> means the researcher deliberately sets a condition. Observing naturally different groups is not manipulation.</li><li><b>Random assignment</b> uses a random process to place experimental units into conditions. It is different from random sampling.</li></ul><div class="button-row"><button class="ghost small" data-open-glossary="random assignment">Random assignment</button><button class="ghost small" data-open-glossary="observational study">Observational study</button></div></details>
      <div class="form-grid two"><label><span>Primary goal</span><select id="dmGoal"><option value="">Choose…</option><option value="describe">Describe what exists / distribution</option><option value="associate">Estimate relationship or prediction</option><option value="cause">Estimate effect of changing something</option><option value="experience">Understand experiences / explanations</option><option value="review">Synthesize existing literature</option><option value="pool">Pool quantitative effects across studies</option></select></label>
      <label><span>Will the exposure/intervention be deliberately manipulated?</span><select id="dmManip"><option value="no">No / not applicable</option><option value="yes">Yes</option></select></label>
      <label><span>If people/units receive conditions, can assignment be randomized?</span><select id="dmAssign"><option value="na">Not applicable</option><option value="random">Yes, randomized</option><option value="nonrandom">No / naturally formed groups</option></select></label>
      <label><span>Primary evidence</span><select id="dmEvidence"><option value="numbers">Mostly numerical/categorical</option><option value="words">Mostly words/observations</option><option value="both">Both</option></select></label></div>
      <button id="runDesignMatcher" class="secondary">Recommend design family</button><div id="designMatcherResult"></div></div>`;
  }

  function dataSchemaBuilder(){
    const rows=(project.schema||[]).map((r,i)=>`<div class="schema-row"><input value="${esc(r.name)}" data-schema-name="${i}"><select data-schema-type="${i}"><option ${r.type==="ID"?"selected":""}>ID</option><option ${r.type==="Numeric"?"selected":""}>Numeric</option><option ${r.type==="Categorical"?"selected":""}>Categorical</option><option ${r.type==="Ordinal"?"selected":""}>Ordinal</option><option ${r.type==="Binary"?"selected":""}>Binary</option><option ${r.type==="Text"?"selected":""}>Text</option><option ${r.type==="Date/time"?"selected":""}>Date/time</option></select><input value="${esc(r.definition)}" data-schema-def="${i}" placeholder="unit, coding rule, allowed values"><button class="danger small" data-schema-del="${i}">×</button></div>`).join("");
    return `<div class="tool-card"><h4>Data Table & Dictionary Builder</h4><p>Define columns before collecting final data. The CSV template will contain headers only. Never use blank cells to mean several different things.</p><details class="choice-help" open><summary>What do the data types mean?</summary><ul><li><b>ID</b> tracks a unit, such as plant_01.</li><li><b>Numeric</b> is a meaningful quantity such as 12.4 cm.</li><li><b>Categorical</b> is a named group such as treatment A/B/C.</li><li><b>Ordinal</b> is an ordered category such as low/medium/high.</li><li><b>Binary</b> has exactly two categories such as yes/no, germinated/not germinated, or correct/incorrect.</li><li><b>Text</b> stores open written evidence.</li><li><b>Date/time</b> records when something occurred.</li></ul><button class="ghost small" data-open-glossary="binary">Explain binary more</button></details>
      <div class="schema-list">${rows||'<p class="muted tiny">No columns defined yet.</p>'}</div>
      <div class="button-row"><button id="addSchema" class="secondary small">Add column</button><button id="downloadSchema" class="ghost small">Download CSV template</button></div></div>`;
  }

  function customHTML(s){
    if(s.custom==="interestCompass")return interestCompass();
    if(s.custom==="searchBuilder")return searchBuilder();
    if(s.custom==="sourceManager")return sourceManager();
    if(s.custom==="synthesisMatrix")return synthesisMatrix();
    if(s.custom==="designMatcher")return designMatcher()+`<div class="tool-card"><h4>Methods Laboratory</h4><p>Continue from design choice into variables, units, sampling, measurement, ethics, procedure, data structure, and protocol audit.</p><button class="secondary" id="openMethodsFromStage">Open Methods Lab</button></div>`;
    if(s.custom==="dataSchemaBuilder")return dataSchemaBuilder()+`<div class="tool-card"><h4>Full pre-collection audit</h4><p>The Methods Lab checks whether the data table matches the independent unit, measurement plan, procedure, sampling, and ethics route.</p><button class="secondary" id="openMethodsFromStage">Open Methods Lab</button></div>`;
    if(s.custom==="statsWizard")return statsWizard()+`<div class="tool-card"><h4>Data & Statistics Laboratory</h4><p>Import actual CSV data, inspect quality, choose the analysis from the design structure, run calculations, and preserve a traceable Results record.</p><button class="secondary" id="openDataFromStage">Open Data & Statistics Lab</button></div>`;
    if(s.custom==="citationAndAudit")return citationAndAudit()+`<div class="tool-card"><h4>Scientific Writing Laboratory</h4><p>Audit citations and the complete question → method → analysis → result → conclusion chain.</p><button class="secondary" id="openWritingFromStage">Open Writing Lab</button></div>`;
    return "";
  }

  function coachPanel(){
    const hist=(project.reviews||[]).filter(r=>r.stage===current().id).slice(-4).reverse();
    const aiPolicy=Pilot.featureAccess(project,"ai");
    const ai=AI.enabled()&&aiPolicy.allowed;
    return `<div class="coach-panel"><div class="coach-panel-head"><div><h4>Research Coach</h4><div class="muted tiny">Local diagnostics are always available. A secure AI backend can add deeper prose-level feedback.</div></div><span class="ai-status ${ai?"on":""}">${ai?"AI connected":"local only"}</span></div>
      <div class="button-row"><button class="ghost small" id="saveIndependent">Save independent checkpoint</button><button class="primary small" id="reviewStage">Run local review</button>${ai?'<button class="secondary small" id="reviewAI">Ask AI Coach</button>':""}</div><div id="independentStatus"></div><div id="coachReview"></div><div id="aiCoachReview"></div>
      ${hist.length?`<details class="history"><summary>Previous reviews for this stage (${hist.length})</summary>${hist.map(h=>`<div class="history-row">${new Date(h.time).toLocaleString()} · ${esc(h.kind||"local")} · ${h.score!==undefined?`score ${h.score}/100 · `:""}${esc(h.label||h.verdict||"review")}</div>`).join("")}</details>`:""}</div>`;
  }


  function statsWizard(){
    return `<div class="wizard">
      <h4>Analysis decision wizard</h4>
      <p class="muted tiny">This wizard recommends an analysis family. It does not decide whether your data are good enough for inference.</p>
      <details class="choice-help" open><summary>Read this before choosing an option</summary>
      <p><b>Numerical</b> means meaningful quantities such as height, time, temperature, or score. <b>Categorical</b> means named groups. <b>Ordinal</b> means ordered categories. <b>Binary</b> means exactly two categories.</p>
      <p><b>Independent groups</b> contain different units. <b>Paired/repeated</b> means the same unit is measured more than once. If the same student, plant, dish, animal, or sample appears repeatedly, those observations are related.</p>
      <p><b>Estimand</b> is the exact quantity you want to learn, such as a mean difference, paired change, proportion, or association.</p>
      <div class="button-row"><button class="ghost small" data-open-glossary="binary">Binary</button><button class="ghost small" data-open-glossary="paired data">Paired data</button><button class="ghost small" data-open-glossary="estimand">Estimand</button></div></details>
      <div class="form-grid two">
        <label><span>Data/design structure</span><select id="statStructure">
          <option value="">Choose…</option>
          <option value="one_numeric">One numerical outcome, describe distribution</option>
          <option value="two_numeric">Two measured numerical/ordinal variables</option>
          <option value="two_independent_cont">Two independent groups, numerical outcome</option>
          <option value="two_paired_cont">Two paired/repeated conditions, numerical outcome</option>
          <option value="three_independent_cont">Three or more independent groups, numerical outcome</option>
          <option value="three_repeated_cont">Three or more repeated conditions, numerical outcome</option>
          <option value="two_categorical">Two categorical variables / independent binary groups</option>
          <option value="paired_binary">Paired binary outcome, two conditions</option>
          <option value="repeated_binary">Repeated binary outcome, three or more conditions</option>
          <option value="qualitative">Qualitative text / interview / open responses</option>
          <option value="review">Literature review</option>
          <option value="meta">Meta-analysis</option>
        </select></label>
        <label><span>Outcome type</span><select id="statOutcome"><option value="continuous">Continuous/numerical</option><option value="count">Count</option><option value="ordinal">Ordinal/ranked</option><option value="binary">Binary</option><option value="nominal">Nominal categories</option><option value="text">Text/qualitative</option></select></label>
        <label><span>Potential distribution/scale issue</span><select id="statAssume"><option value="unknown">Not assessed yet</option><option value="reasonable">No major problem seen</option><option value="ordinal_or_severe">Ordinal outcome or severe skew/outliers/small-sample concern</option></select></label>
      </div>
      <button class="secondary" id="runWizard">Recommend analysis family</button>
      <div id="wizardResult"></div>
    </div>`;
  }

  function citationAndAudit(){
    const rows=E.alignment(project);
    return `<div class="form-section"><h4>APA 7 journal-article citation practice</h4><p>This helper is for practice. Verify the final reference against the original article and your official style guide.</p>
      <div class="form-grid two">
        <label><span>Authors exactly as you plan to format them</span><input id="citAuthors" placeholder="Chen, A. A., & Lee, B. B."></label>
        <label><span>Year</span><input id="citYear" placeholder="2026"></label>
        <label><span>Article title</span><input id="citTitle"></label><label><span>Journal</span><input id="citJournal"></label>
        <label><span>Volume</span><input id="citVolume"></label><label><span>Issue</span><input id="citIssue"></label>
        <label><span>Pages or article number</span><input id="citPages"></label><label><span>DOI</span><input id="citDoi" placeholder="10.xxxx/xxxxx"></label>
      </div><button id="makeCitation" class="secondary">Build practice reference</button><div id="citationOutput"></div>
    </div>
    <div class="form-section"><h4>Whole-paper alignment audit</h4><p>A missing item does not always mean the study is wrong, but it tells you what needs review.</p>
      ${rows.map(r=>`<div class="align-row"><div class="a-label">${esc(r[0])}</div><div class="a-value">${esc(r[1]||"Not yet recorded")}</div><div class="a-check ${r[2]?"oktxt":"warntxt"}">${r[2]?"Recorded":"Review"}</div></div>`).join("")}
    </div>`;
  }

  function renderStage(){
    const s=current();
    $("welcome").hidden=true;$("stageView").hidden=false;
    $("stageView").innerHTML=`<article class="card stage-card">
      <header class="stage-header"><div class="stage-meta"><span class="phase-pill">${esc(C.phases.find(p=>p.id===s.phase).label)}</span><span class="stage-count">Stage ${s.id} of ${C.stages.length}</span></div><h2>${esc(Paths.stageTitle(project,s.id,s.title))}</h2><div class="purpose">${esc(s.purpose)}</div></header>
      ${PathUI.stageBanner(project,s.id,s.sections)}
      <div class="exemplar-inline-card"><div><b>See this decision inside a complete path-matched project</b><span>The exemplar library automatically opens the complete project matching your current research path. You can also compare other paths. Viewing worked stage content is logged as Level 4 support.</span></div><button class="ghost small" data-open-exemplar-stage="${s.id}">Worked Stage ${s.id}</button></div>
      <div class="stage-tabs"><button class="active" data-tab="learn">1 · Learn</button><button data-tab="work">2 · Do the work</button><button data-tab="check">3 · Check & revise</button></div>
      <div class="tab-panel" id="tabLearn"><div class="lesson-grid"><div class="lesson">${Guide.stagePanel(s.id,false)}${s.learn}</div><aside>${`<div class="example-box">${s.example}</div><div class="warning-box">${s.warning}</div>`}</aside></div></div>
      <div class="tab-panel hidden" id="tabWork"><div class="work"><h3>Your research notebook</h3>${Guide.stagePanel(s.id,true)}<div class="no-dead-end"><div><b>Still stuck?</b><span>Choose the exact field that is blocking you and increase support one level at a time.</span></div><button class="secondary small" data-open-rescue-navigator="${s.id}">Open progressive help</button></div>${coachPanel()}${s.id===4?`<div class="tool-card path-suggestion"><h4>Choose the research path after refining your question</h4><p>Your current question family suggests <b>${esc(Paths.pathById(Paths.recommendation(project)).name)}</b>. Confirm the path so later stages show only the decisions that normally belong to that design.</p><button class="secondary" data-open-pathway>Choose / confirm research path</button></div>`:""}${customHTML(s)}${s.id>=15&&s.id<=17?`<div class="tool-card"><h4>Scientific Writing Laboratory</h4><p>Use the evidence maps and section-specific audits while drafting this part of the paper.</p><button class="secondary" id="openWritingFromStage">Open Writing Lab</button></div>`:""}${sectionsHTML(s)}</div></div>
      <div class="tab-panel hidden" id="tabCheck"><div class="check"><h3>Readiness check</h3><p>Mark a stage ready only when these statements are true. You can return later and revise.</p>${(()=>{const pc=Paths.completion(project,s.id,s.sections),gate=PathCoach.stageGate(s.id,project);return `<div class="path-readiness ${gate.canMarkReady?"ready-pass":""}"><b>${esc(PathCoach.pathName(project))} readiness</b>${pc.total?`<span>${pc.done}/${pc.total} visible core notebook fields currently contain a response.</span>`:""}${gate.missing?.length?`<small>Coach-required items still blank: ${gate.missing.slice(0,6).map(k=>esc(Paths.label(project,k,k))).join(", ")}${gate.missing.length>6?"…":""}</small>`:`<small>No core pathway field is currently missing.</small>`}</div>`})()}<div class="readiness">${PathCoach.readinessChecks(s.id,project,s.checks).map((c,i)=>`<label class="ready-item"><input type="checkbox" data-ready-check="${i}"><span>${esc(c)}</span></label>`).join("")}</div><div id="pathGateFeedback"></div>${s.id===4?'<button class="secondary" id="checkRQ">Run question wording check</button><div id="rqFeedback"></div>':""}<div class="ready-controls"><span class="ready-status ${project.ready[s.id]?"good":""}">${project.ready[s.id]?"Stage marked ready":"Not yet marked ready"}</span><button class="${project.ready[s.id]?"secondary":"primary"}" id="markReady">${project.ready[s.id]?"Mark as not ready":"Mark stage ready"}</button></div></div></div>
    </article>`;
    bindStage();
  }



  function litSourceForm(s={},idx=null){
    const t=s.trapp||{};
    const ev=s.themeEvidence||[];
    return `<div class="lit-section"><h4>${idx===null?"Add a source":`Edit ${esc(s.id)}`}</h4><p>Bibliographic verification and methodological evaluation are separate. “Verified” means you checked the bibliographic record against the actual source; it does not mean the study is high quality.</p>
      <div class="form-grid two">
        <label><span>Working citation</span><input id="lfCitation" value="${esc(s.citation||"")}"></label>
        <label><span>Title</span><input id="lfTitle" value="${esc(s.title||"")}"></label>
        <label><span>Authors</span><input id="lfAuthors" value="${esc(s.authors||"")}"></label>
        <label><span>Year</span><input id="lfYear" value="${esc(s.year||"")}"></label>
        <label><span>Journal / publisher</span><input id="lfJournal" value="${esc(s.journal||"")}"></label>
        <label><span>DOI</span><input id="lfDoi" value="${esc(s.doi||"")}"></label>
        <label><span>URL</span><input id="lfUrl" value="${esc(s.url||"")}"></label>
        <label><span>Source type</span><select id="lfType">${["Peer-reviewed empirical article","Systematic review / meta-analysis","Scholarly review","Government / institutional report","Book / chapter","Other"].map(o=>`<option ${s.type===o?"selected":""}>${o}</option>`).join("")}</select></label>
        <label><span>Study design</span><input id="lfDesign" value="${esc(s.design||"")}"></label>
        <label><span>Population / context</span><textarea id="lfSample">${esc(s.sample||"")}</textarea></label>
        <label><span>Variables / constructs</span><textarea id="lfVariables">${esc(s.variables||"")}</textarea></label>
        <label><span>Measures / operational definitions</span><textarea id="lfMeasures">${esc(s.measures||"")}</textarea></label>
        <label><span>Key finding in comparable language</span><textarea id="lfFinding">${esc(s.finding||"")}</textarea></label>
        <label><span>Limitations</span><textarea id="lfLimits">${esc(s.limits||"")}</textarea></label>
        <label><span>Relevance / gap clue</span><textarea id="lfRelevance">${esc(s.relevance||"")}</textarea></label>
        <label><span>Quality / methods notes</span><textarea id="lfQuality">${esc(s.qualityNotes||"")}</textarea></label>
        <label><span>Screening status</span><select id="lfStatus">${["Included","Pending","Excluded"].map(o=>`<option ${s.screeningStatus===o?"selected":""}>${o}</option>`).join("")}</select></label>
        <label><span>Reason for include/exclude/pending</span><textarea id="lfScreenReason">${esc(s.screeningReason||"")}</textarea></label>
        <label><span>Bibliographic record checked against source?</span><select id="lfVerified"><option value="false" ${!s.verified?"selected":""}>Not yet</option><option value="true" ${s.verified?"selected":""}>Yes</option></select></label>
      </div>
      <h4 style="margin-top:16px">TRAPP source evaluation</h4><div class="trapp-grid">
        ${[["timeframe","Timeframe"],["relevance","Relevance"],["authority","Authority"],["accuracy","Accuracy"],["purpose","Purpose"]].map(([k,l])=>`<div class="trapp-box"><label><span>${l}</span><textarea id="tr_${k}" placeholder="Evidence and judgment">${esc(t[k]||"")}</textarea></label></div>`).join("")}
      </div>
      <h4 style="margin-top:16px">Theme evidence</h4><p class="muted tiny">A source can support one theme, conflict with another, or provide mixed/background evidence. Add a short note explaining what the paper contributes.</p>
      <div id="themeEvidenceRows">${ev.map((e,j)=>themeEvidenceRow(e,j)).join("")}</div>
      <button class="ghost small" id="addThemeEvidence">Add theme evidence</button>
      <div class="button-row"><button class="primary" id="saveLitSource">${idx===null?"Add source":"Save changes"}</button>${idx!==null?'<button class="ghost" id="cancelLitEdit">Cancel</button>':""}</div>
    </div>`;
  }

  function themeEvidenceRow(e={},j=0){
    return `<div class="theme-evidence-row" data-theme-row="${j}"><input data-themename="${j}" placeholder="Theme" value="${esc(e.theme||"")}"><select data-themestance="${j}">${["supports","conflicts","mixed","background"].map(o=>`<option ${e.stance===o?"selected":""}>${o}</option>`).join("")}</select><input data-themenote="${j}" placeholder="What does this source contribute?" value="${esc(e.note||"")}"><button class="danger small" data-theme-del="${j}">×</button></div>`;
  }

  function searchWorkspace(){
    return `<div class="lit-section"><h4>Search log</h4><p>Record actual searches. This allows you to distinguish “I did not find it” from “I searched systematically enough to support a claim about the literature.”</p>
      <div class="form-grid two">
        <label><span>Date</span><input type="date" id="slDate"></label><label><span>Database / search system</span><input id="slDatabase" placeholder="Google Scholar, ERIC, PubMed…"></label>
        <label><span>Exact search string</span><textarea id="slQuery"></textarea></label><label><span>Filters / limits</span><textarea id="slFilters" placeholder="Years, language, article type, population…"></textarea></label>
        <label><span>Results returned</span><input id="slResults"></label><label><span>Screened / kept</span><input id="slKept"></label><label><span>Notes / what changed next</span><textarea id="slNotes"></textarea></label>
      </div><button class="secondary" id="addSearchLog">Add search</button>
      <div>${(project.searchLog||[]).map((x,i)=>`<div class="search-entry"><div style="float:right"><button class="danger small" data-del-search="${i}">Remove</button></div><b>${esc(x.database||"Search")} · ${esc(x.date||"date not recorded")}</b><p>${esc(x.query||"")}</p><p>Filters: ${esc(x.filters||"—")} · Results: ${esc(x.results||"—")} · Screened/kept: ${esc(x.kept||"—")}</p><p>${esc(x.notes||"")}</p></div>`).join("")||'<p class="muted tiny">No searches logged yet.</p>'}</div>`;
  }

  function screeningWorkspace(){
    const sources=project.sources||[];
    return `<div class="lit-section"><h4>Screening board</h4><p>Not every source found belongs in the review. Make each include/exclude decision explicit and keep the reason.</p>
      <div class="table-wrap"><table><thead><tr><th>ID</th><th>Source</th><th>Status</th><th>Reason</th><th>Extraction</th><th>TRAPP</th><th></th></tr></thead><tbody>${sources.map((s,i)=>{
        const c=Lit.sourceCompleteness(s),t=Lit.trappSummary(s);
        return `<tr><td>${esc(s.id)}</td><td>${esc(s.citation||s.title||"Untitled")}</td><td><select data-screen-status="${i}">${["Included","Pending","Excluded"].map(o=>`<option ${s.screeningStatus===o?"selected":""}>${o}</option>`).join("")}</select></td><td><input data-screen-reason="${i}" value="${esc(s.screeningReason||"")}" placeholder="Why?"></td><td>${c.filled}/${c.total}</td><td>${t.filled}/${t.total}</td><td><button class="ghost small" data-litedit="${i}">Edit</button></td></tr>`;
      }).join("")}</tbody></table></div>${!sources.length?'<p class="muted tiny">Add sources first.</p>':""}</div>`;
  }

  function studyMatrixWorkspace(){
    const included=project.sources.filter(s=>s.screeningStatus==="Included");
    return `<div class="lit-section"><h4>Study matrix</h4><p>Your course materials require population/context, variables, methods/design, key findings, limitations, and quality notes so theme claims remain traceable.</p>
      <div class="lit-toolbar"><button class="ghost small" id="downloadStudyMatrix">Download study matrix CSV</button></div>
      <div class="matrix-scroll"><table><thead><tr><th>ID</th><th>Study</th><th>Population/context</th><th>Variables</th><th>Method/design</th><th>Measures</th><th>Key finding</th><th>Limitations</th><th>Quality notes</th></tr></thead><tbody>${included.map(s=>`<tr><td>${esc(s.id)}</td><td>${esc(s.citation||s.title)}</td><td>${esc(s.sample)}</td><td>${esc(s.variables)}</td><td>${esc(s.design)}</td><td>${esc(s.measures)}</td><td>${esc(s.finding)}</td><td>${esc(s.limits)}</td><td>${esc(s.qualityNotes)}</td></tr>`).join("")}</tbody></table></div></div>`;
  }

  function synthesisWorkspace(){
    const map=Lit.themeMap(project);
    const included=project.sources.filter(s=>s.screeningStatus==="Included");
    const themes=Lit.uniqueThemes(project);
    let matrix="";
    if(themes.length && included.length){
      matrix=`<div class="matrix-scroll"><table><thead><tr><th>Study</th>${themes.map(t=>`<th>${esc(t)}</th>`).join("")}</tr></thead><tbody>${included.map(s=>`<tr><td>${esc(s.id)} · ${esc(s.citation||s.title)}</td>${themes.map(t=>{
        const ev=(s.themeEvidence||[]).find(e=>e.theme===t);
        if(!ev) return "<td></td>";
        const cl=ev.stance==="supports"?"matrix-cell-support":ev.stance==="conflicts"?"matrix-cell-conflict":ev.stance==="mixed"?"matrix-cell-mixed":"matrix-cell-background";
        return `<td class="${cl}" title="${esc(ev.note||"")}">${esc(ev.stance)}</td>`;
      }).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    return `<div class="lit-section"><h4>Synthesis matrix</h4><p>The goal is comparison across studies. “Supports,” “conflicts,” “mixed,” and “background” prevent a theme tag from falsely implying that every paper agrees.</p>${matrix||'<p class="muted tiny">Add theme evidence to included source records.</p>'}
      <div class="lit-toolbar"><button class="ghost small" id="downloadThemeMatrix">Download theme synthesis CSV</button></div>
      <h4 style="margin-top:16px">Evidence map</h4>${map.map(t=>`<div class="source-card"><h5>${esc(t.theme)}</h5><p><b>Supporting</b> ${esc(t.supporting.map(s=>s.id).join(", ")||"none")}</p><p><b>Conflicting</b> ${esc(t.conflicting.map(s=>s.id).join(", ")||"none")}</p><p><b>Mixed</b> ${esc(t.mixed.map(s=>s.id).join(", ")||"none")}</p><p><b>Background/context</b> ${esc(t.background.map(s=>s.id).join(", ")||"none")}</p></div>`).join("")||'<p class="muted tiny">No themes yet.</p>'}</div>`;
  }

  function gapWorkspace(){
    const g=Lit.gapReadiness(project);
    return `<div class="lit-section"><h4>Gap & study-rationale evidence check</h4><p>This does not “find a gap” automatically. It checks whether you have enough organized evidence to justify the type of claim you want to make.</p>
      <div class="lit-scorecards"><div class="lit-scorecard"><span>Included studies</span><b>${g.included}</b></div><div class="lit-scorecard"><span>Themes</span><b>${g.themes}</b></div><div class="lit-scorecard"><span>Multi-source themes</span><b>${g.multiSourceThemes}</b></div><div class="lit-scorecard"><span>Conflict/mixed themes</span><b>${g.conflictThemes}</b></div><div class="lit-scorecard"><span>Measure diversity</span><b>${g.measurementDiversity}</b></div></div>
      ${g.messages.map(x=>`<div class="gap-warning">${esc(x)}</div>`).join("")}
      <div class="form-grid two" style="margin-top:12px">
        <label><span>Rationale type</span><select data-field="gapType"><option value="">Choose…</option>${["Documented literature gap","Replication","Extension to a new context/population","Method comparison","Resolve or explore inconsistent findings","Local/practical question","Learning-focused investigation","Other"].map(o=>`<option ${project.data.gapType===o?"selected":""}>${o}</option>`).join("")}</select></label>
        <label><span>Which source IDs directly support this rationale?</span><input data-field="gapSourceIds" value="${esc(project.data.gapSourceIds||"")}" placeholder="S01, S03, S07"></label>
        <label><span>Precise rationale / gap statement</span><textarea data-field="gapStatement">${esc(project.data.gapStatement||"")}</textarea></label>
        <label><span>What evidence would make this statement too strong?</span><textarea data-field="gapBoundary">${esc(project.data.gapBoundary||"")}</textarea></label>
      </div>
      <div class="concept-box"><strong>Interpretation rule</strong><br>${g.safeToClaimGlobalGap?"Your evidence base is large enough to begin evaluating a broader gap claim, but the claim still depends on search coverage and source quality.":"Do not claim that “no research exists.” Use a bounded rationale such as replication, local extension, inconsistent findings, or a gap within the literature you actually reviewed."}</div></div>`;
  }

  function claimsWorkspace(){
    const audit=Lit.claimAudit(project);
    return `<div class="lit-section"><h4>Claim–source traceability</h4><p>Each literature claim should point to the studies that support it. Claims supported by multiple sources are candidates for synthesis; a one-source claim may still be valid but should not be presented as a broad consensus.</p>
      <div class="form-grid two"><label><span>Literature claim</span><textarea id="claimText"></textarea></label><label><span>Supporting source IDs</span><input id="claimSources" placeholder="S01, S04"></label><label><span>Claim type</span><select id="claimType"><option>Theme / convergence</option><option>Difference / contradiction</option><option>Methodological limitation</option><option>Definition / background</option><option>Gap / rationale</option></select></label><label><span>Boundary / qualification</span><textarea id="claimBoundary"></textarea></label></div><button class="secondary" id="addLitClaim">Add claim</button>
      ${audit.map((c,i)=>`<div class="claim-entry"><div style="float:right"><button class="danger small" data-del-claim="${i}">Remove</button></div><b>${esc(c.type||"Claim")}</b><p>${esc(c.text)}</p><p>Sources: ${esc((c.sourceIds||[]).join(", ")||"none")} · <span class="${c.sourceCount>=2?"trace-good":c.sourceCount===1?"trace-warn":"trace-bad"}">${c.sourceCount>=2?"multi-source synthesis candidate":c.sourceCount===1?"one-source claim":"untraceable"}</span></p><p>Boundary: ${esc(c.boundary||"—")}</p></div>`).join("")||'<p class="muted tiny">No claims recorded yet.</p>'}</div>`;
  }

  function outlineWorkspace(){
    const themes=Lit.uniqueThemes(project);
    return `<div class="lit-section"><h4>Literature-review paragraph planner</h4><p>The planner structures synthesis; it does not write the paragraph. Each paragraph should have a job, a claim, multiple sources where appropriate, comparison/qualification, and a transition or implication.</p>
      <div class="form-grid two"><label><span>Choose theme for new paragraph</span><select id="outlineTheme"><option value="">Choose…</option>${themes.map(t=>`<option>${esc(t)}</option>`).join("")}</select></label><label><span>Or type a paragraph focus</span><input id="outlineCustom"></label></div><button class="secondary" id="addOutline">Add paragraph plan</button>
      ${(project.litOutline||[]).map((p,i)=>`<div class="outline-entry"><div style="float:right"><button class="danger small" data-del-outline="${i}">Remove</button></div><div class="outline-top"><label><span>Theme / focus</span><input data-outline-theme="${i}" value="${esc(p.theme||"")}"></label><label><span>Source IDs</span><input data-outline-sources="${i}" value="${esc((p.sourceIds||[]).join(", "))}"></label></div>
        <label><span>Paragraph job</span><textarea data-outline-job="${i}">${esc(p.job||"")}</textarea></label>
        <label><span>Claim about the literature</span><textarea data-outline-claim="${i}">${esc(p.claim||"")}</textarea></label>
        <label><span>How the studies compare / synthesize</span><textarea data-outline-synth="${i}">${esc(p.synthesis||"")}</textarea></label>
        <label><span>Contradiction / qualification</span><textarea data-outline-tension="${i}">${esc(p.tension||"")}</textarea></label>
        <label><span>How method, measure, population, or context may explain differences</span><textarea data-outline-cond="${i}">${esc(p.conditions||"")}</textarea></label>
        <label><span>Transition / implication for next paragraph or study</span><textarea data-outline-transition="${i}">${esc(p.transition||"")}</textarea></label>
      </div>`).join("")}
      <div class="lit-toolbar"><button class="ghost small" id="downloadLitOutline">Export outline Markdown</button></div></div>`;
  }

  function literatureWorkspace(active="search", editIndex=null){
    Lit.normalizeProject(project);
    const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="litBackdrop";
    const tabs=[["search","1 · Search log"],["sources","2 · Sources & TRAPP"],["screen","3 · Screening"],["study","4 · Study matrix"],["synth","5 · Synthesis"],["gap","6 · Gap/rationale"],["claims","7 · Claim audit"],["outline","8 · Outline"]];
    function content(){
      if(active==="search")return searchWorkspace();
      if(active==="sources")return litSourceForm(editIndex===null?{}:project.sources[editIndex],editIndex);
      if(active==="screen")return screeningWorkspace();
      if(active==="study")return studyMatrixWorkspace();
      if(active==="synth")return synthesisWorkspace();
      if(active==="gap")return gapWorkspace();
      if(active==="claims")return claimsWorkspace();
      if(active==="outline")return outlineWorkspace();
      return "";
    }
    wrap.innerHTML=`<div class="modal lit-modal"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start"><div><h3>Literature Research Workspace</h3><p>Search → evaluate → screen → extract → synthesize → justify → trace claims → outline.</p></div><button class="ghost small" id="closeLit">Close</button></div><div class="lit-tabs">${tabs.map(([k,l])=>`<button data-lit-tab="${k}" class="${active===k?"active":""}">${l}</button>`).join("")}</div>${Guide.labPanel("literature",active)}<div id="litContent">${content()}</div></div>`;
    document.body.appendChild(wrap);
    const rerender=(tab=active,idx=null)=>{wrap.remove();literatureWorkspace(tab,idx)};
    $("closeLit").onclick=()=>wrap.remove();
    wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};
    document.querySelectorAll("[data-lit-tab]").forEach(b=>b.onclick=()=>rerender(b.dataset.litTab));
    bindLitWorkspace(rerender,active,editIndex);
  }

  function bindLitWorkspace(rerender,active,editIndex){
    document.querySelectorAll("#litBackdrop [data-field]").forEach(el=>{
      el.oninput=()=>{project.data[el.dataset.field]=el.value;save()};
      el.onchange=el.oninput;
    });
    if($("addSearchLog")) $("addSearchLog").onclick=()=>{
      project.searchLog.push({date:$("slDate").value,database:$("slDatabase").value,query:$("slQuery").value,filters:$("slFilters").value,results:$("slResults").value,kept:$("slKept").value,notes:$("slNotes").value});save();rerender("search");
    };
    document.querySelectorAll("[data-del-search]").forEach(b=>b.onclick=()=>{project.searchLog.splice(Number(b.dataset.delSearch),1);save();rerender("search")});
    if($("addThemeEvidence")) $("addThemeEvidence").onclick=()=>{
      const rows=[...document.querySelectorAll("#themeEvidenceRows [data-theme-row]")].length;
      $("themeEvidenceRows").insertAdjacentHTML("beforeend",themeEvidenceRow({},rows));
      bindThemeDelete();
    };
    function collectThemeEvidence(){
      return [...document.querySelectorAll("#themeEvidenceRows [data-theme-row]")].map(row=>{
        const j=row.dataset.themeRow;
        return {theme:document.querySelector(`[data-themename="${j}"]`)?.value.trim()||"",stance:document.querySelector(`[data-themestance="${j}"]`)?.value||"supports",note:document.querySelector(`[data-themenote="${j}"]`)?.value.trim()||""};
      }).filter(e=>e.theme);
    }
    function bindThemeDelete(){
      document.querySelectorAll("[data-theme-del]").forEach(b=>b.onclick=()=>{document.querySelector(`[data-theme-row="${b.dataset.themeDel}"]`)?.remove()});
    }
    bindThemeDelete();
    if($("saveLitSource")) $("saveLitSource").onclick=()=>{
      const base=editIndex===null?{id:Lit.nextSourceId(project)}:{...project.sources[editIndex]};
      const obj={...base,citation:$("lfCitation").value,title:$("lfTitle").value,authors:$("lfAuthors").value,year:$("lfYear").value,journal:$("lfJournal").value,doi:$("lfDoi").value,url:$("lfUrl").value,type:$("lfType").value,design:$("lfDesign").value,sample:$("lfSample").value,variables:$("lfVariables").value,measures:$("lfMeasures").value,finding:$("lfFinding").value,limits:$("lfLimits").value,relevance:$("lfRelevance").value,qualityNotes:$("lfQuality").value,screeningStatus:$("lfStatus").value,screeningReason:$("lfScreenReason").value,verified:$("lfVerified").value==="true",trapp:{timeframe:$("tr_timeframe").value,relevance:$("tr_relevance").value,authority:$("tr_authority").value,accuracy:$("tr_accuracy").value,purpose:$("tr_purpose").value},themeEvidence:collectThemeEvidence()};
      obj.themes=[...new Set(obj.themeEvidence.map(e=>e.theme))];
      if(editIndex===null)project.sources.push(obj);else project.sources[editIndex]=obj;save();rerender("sources");
    };
    if($("cancelLitEdit")) $("cancelLitEdit").onclick=()=>rerender("sources");
    document.querySelectorAll("[data-litedit]").forEach(b=>b.onclick=()=>rerender("sources",Number(b.dataset.litedit)));
    document.querySelectorAll("[data-edit-source]").forEach(b=>b.onclick=()=>rerender("sources",Number(b.dataset.editSource)));
    document.querySelectorAll("[data-screen-status]").forEach(el=>el.onchange=()=>{project.sources[Number(el.dataset.screenStatus)].screeningStatus=el.value;save()});
    document.querySelectorAll("[data-screen-reason]").forEach(el=>el.oninput=()=>{project.sources[Number(el.dataset.screenReason)].screeningReason=el.value;save()});
    if($("downloadStudyMatrix")) $("downloadStudyMatrix").onclick=()=>download("literature-study-matrix.csv",Lit.makeStudyMatrixCSV(project),"text/csv");
    if($("downloadThemeMatrix")) $("downloadThemeMatrix").onclick=()=>download("literature-theme-synthesis.csv",Lit.makeThemeCSV(project),"text/csv");
    if($("addLitClaim")) $("addLitClaim").onclick=()=>{
      project.litClaims.push({text:$("claimText").value,type:$("claimType").value,sourceIds:$("claimSources").value.split(",").map(x=>x.trim()).filter(Boolean),boundary:$("claimBoundary").value});save();rerender("claims");
    };
    document.querySelectorAll("[data-del-claim]").forEach(b=>b.onclick=()=>{project.litClaims.splice(Number(b.dataset.delClaim),1);save();rerender("claims")});
    if($("addOutline")) $("addOutline").onclick=()=>{
      const theme=$("outlineTheme").value||$("outlineCustom").value.trim();
      const ids=theme?Lit.sourceIdsForTheme(project,theme):[];
      project.litOutline.push({theme,sourceIds:ids,job:"",claim:"",synthesis:"",tension:"",conditions:"",transition:""});save();rerender("outline");
    };
    document.querySelectorAll("[data-del-outline]").forEach(b=>b.onclick=()=>{project.litOutline.splice(Number(b.dataset.delOutline),1);save();rerender("outline")});
    const bindOutline=(attr,key,split=false)=>document.querySelectorAll(`[${attr}]`).forEach(el=>el.oninput=()=>{const i=Number(el.getAttribute(attr));project.litOutline[i][key]=split?el.value.split(",").map(x=>x.trim()).filter(Boolean):el.value;save()});
    bindOutline("data-outline-theme","theme");bindOutline("data-outline-sources","sourceIds",true);bindOutline("data-outline-job","job");bindOutline("data-outline-claim","claim");bindOutline("data-outline-synth","synthesis");bindOutline("data-outline-tension","tension");bindOutline("data-outline-cond","conditions");bindOutline("data-outline-transition","transition");
    if($("downloadLitOutline")) $("downloadLitOutline").onclick=()=>download("literature-review-outline.md",Lit.outlineMarkdown(project),"text/markdown");
  }


  function mInput(id,label,val="",type="text",options=[]){
    let control="";
    if(type==="textarea")control=`<label><span>${esc(label)}</span><textarea id="${id}">${esc(val)}</textarea></label>`;
    else if(type==="select")control=`<label><span>${esc(label)}</span><select id="${id}"><option value="">Choose…</option>${options.map(o=>`<option ${val===o?"selected":""}>${esc(o)}</option>`).join("")}</select></label>`;
    else control=`<label><span>${esc(label)}</span><input id="${id}" value="${esc(val)}"></label>`;
    const map=[
      ["experimental unit","experimental unit"],["random assignment","random assignment"],["counterbalancing","counterbalancing"],
      ["blinding","blinding"],["outcome","outcome"],["sampling frame","sampling frame"],["reliability","reliability"],
      ["validity","measurement validity"],["binary","binary"],["ordinal","ordinal"],["missing","missing data"]
    ];
    const hit=map.find(([word])=>label.toLowerCase().includes(word))?.[1];
    return `<div class="guided-field">${control}${type==="select"?Guide.choiceHelp(id):""}${hit?`<button type="button" class="term-inline-help" data-open-glossary="${hit}">What does ${esc(hit)} mean?</button>`:""}</div>`;
  }

  function constructRows(){
    return (project.methods.constructs||[]).map((x,i)=>`<div class="construct-row"><input data-mc-name="${i}" value="${esc(x.name||"")}" placeholder="Construct / variable"><select data-mc-role="${i}">${Methods.roleOptions(project).map(o=>`<option ${x.role===o?"selected":""}>${esc(o)}</option>`).join("")}</select><input data-mc-op="${i}" value="${esc(x.operational||"")}" placeholder="Exact operational definition"><button class="danger small" data-mc-del="${i}">×</button></div>`).join("");
  }

  function conditionsRows(){
    return (project.methods.conditions||[]).map((x,i)=>`<div class="condition-row"><input data-cond-name="${i}" value="${esc(x.name||"")}" placeholder="Condition / level"><input data-cond-def="${i}" value="${esc(x.definition||"")}" placeholder="Exactly what is done / exposure level"><button class="danger small" data-cond-del="${i}">×</button></div>`).join("");
  }

  function controlledRows(){
    return (project.methods.controlled||[]).map((x,i)=>`<div class="condition-row"><input data-ctl-name="${i}" value="${esc(x.name||"")}" placeholder="Controlled condition"><input data-ctl-def="${i}" value="${esc(x.definition||"")}" placeholder="How it is standardized / checked"><button class="danger small" data-ctl-del="${i}">×</button></div>`).join("");
  }

  function confounderRows(){
    return (project.methods.confounders||[]).map((x,i)=>`<div class="condition-row"><input data-cf-name="${i}" value="${esc(x.name||"")}" placeholder="Potential confounder / nuisance factor"><input data-cf-def="${i}" value="${esc(x.plan||"")}" placeholder="Why it matters and how handled/recorded"><button class="danger small" data-cf-del="${i}">×</button></div>`).join("");
  }

  function measurementRows(){
    return (project.methods.measurements||[]).map((x,i)=>`<div class="measurement-row"><div class="method-row-head"><b>${esc(x.construct||`Measure ${i+1}`)}</b><button class="danger small" data-mm-del="${i}">Remove</button></div><div class="form-grid two">
      <label><span>Construct / outcome</span><input data-mm-construct="${i}" value="${esc(x.construct||"")}"></label>
      <label><span>Instrument / procedure</span><input data-mm-instrument="${i}" value="${esc(x.instrument||"")}"></label>
      <label><span>Operational definition / scoring rule</span><textarea data-mm-operational="${i}">${esc(x.operational||"")}</textarea></label>
      <label><span>Unit / scale / categories</span><textarea data-mm-scale="${i}">${esc(x.scale||"")}</textarea></label>
      <label><span>Timing / frequency</span><textarea data-mm-timing="${i}">${esc(x.timing||"")}</textarea></label>
      <label><span>Reliability / consistency plan</span><textarea data-mm-reliability="${i}">${esc(x.reliability||"")}</textarea></label>
      <label><span>Validity evidence / rationale</span><textarea data-mm-validity="${i}">${esc(x.validity||"")}</textarea></label>
      <label><span>Calibration / scorer / blinding notes</span><textarea data-mm-quality="${i}">${esc(x.quality||"")}</textarea></label>
    </div></div>`).join("");
  }

  function procedureRows(){
    return (project.methods.procedureSteps||[]).map((x,i)=>`<div class="procedure-row"><input data-ps-phase="${i}" value="${esc(x.phase||"")}" placeholder="Phase"><textarea data-ps-action="${i}" placeholder="Exact action">${esc(x.action||"")}</textarea><textarea data-ps-record="${i}" placeholder="What is recorded">${esc(x.record||"")}</textarea><textarea data-ps-dev="${i}" placeholder="Deviation / decision rule">${esc(x.deviation||"")}</textarea><button class="danger small" data-ps-del="${i}">×</button></div>`).join("");
  }

  function methodsDesignTab(){
    const d=project.methods.design||{}, p=Methods.designProfile(project), a=PathCoach.methodSection(project,"design");
    return `<div class="methods-section"><h4>Design map</h4><p>The research question determines what evidence is needed. The selected design is <b>${esc(p.type)}</b>. Use this page to define how units reach conditions/exposures and what causal comparison is actually possible.</p>
      <div class="form-grid two">
        ${mInput("mdPrimaryOutcome","Primary outcome",d.primaryOutcome||project.data.outcomeDV||"")}
        ${mInput("mdExperimentalUnit",p.isExp||p.isQuasi?"Experimental unit":"Observational / analytic unit",d.experimentalUnit||project.data.experimentalUnit||"")}
        ${mInput("mdAssignment","How units reach conditions/exposure",d.assignment||"","select",["Random assignment","Nonrandom assignment","Naturally occurring / observed exposure","Single-group / no assignment","Not applicable"])}
        ${mInput("mdSameUnit","Does the same unit receive multiple conditions/time points?",d.sameUnitAllConditions||"","select",["yes","no","not applicable"])}
        ${mInput("mdOrder","Randomization / counterbalancing / order plan",d.orderPlan||"","textarea")}
        ${mInput("mdBlinding","Blinding / masking / expectancy-bias plan",d.blinding||"","textarea")}
        ${mInput("mdFidelity","Implementation/fidelity check",d.fidelity||"","textarea")}
        ${mInput("mdClaim","Maximum claim this design could support",d.claimCeiling||project.data.claimBoundary||"","textarea")}
      </div>
      <h4 style="margin-top:16px">Conditions / levels / comparison</h4><div class="conditions-grid">${conditionsRows()||'<p class="muted tiny">No conditions recorded.</p>'}</div><button class="ghost small" id="addCondition">Add condition</button>
      <h4 style="margin-top:16px">Design check</h4>${a.issues.map(x=>`<div class="issue ${x[0]}"><b>${esc(x[1])}</b><p>${esc(x[2])}</p></div>`).join("")||'<div class="issue info"><b>No major design-structure issue detected</b><p>Continue through replication, sampling, measurement, ethics, and data structure before collection.</p></div>'}
    </div>`;
  }

  function methodsVariablesTab(){
    return `<div class="methods-section"><h4>Constructs, roles, and operational definitions</h4><p>Do not start with labels such as IV or DV until the design makes those roles meaningful. Every central construct must be translated into exactly what is manipulated, measured, scored, counted, coded, or observed.</p>
      <div class="construct-row" style="font-size:9px;font-weight:900;text-transform:uppercase;color:#6d7a88"><div>Construct</div><div>Role in this design</div><div>Operational definition</div><div></div></div>
      <div>${constructRows()||'<p class="muted tiny">No constructs/variables recorded.</p>'}</div>
      <button class="ghost small" id="addConstruct">Add construct / variable</button>
      <h4 style="margin-top:16px">Controlled conditions</h4><p class="muted tiny">These are procedures or environmental features intentionally standardized. They are not the same thing as a control group.</p>
      <div class="controlled-grid">${controlledRows()||'<p class="muted tiny">No controlled conditions recorded.</p>'}</div><button class="ghost small" id="addControlled">Add controlled condition</button>
      <h4 style="margin-top:16px">Potential confounders / nuisance factors</h4><p class="muted tiny">Name alternative explanations or sources of systematic variation. Some can be controlled, some measured, some randomized across, and some simply acknowledged.</p>
      <div>${confounderRows()||'<p class="muted tiny">No potential confounders recorded.</p>'}</div><button class="ghost small" id="addConfounder">Add potential confounder</button>
    </div>`;
  }

  function methodsReplicationTab(){
    const d=project.methods.design||{}, r=PathCoach.methodSection(project,"replication");
    return `<div class="methods-section"><h4>Experimental unit, replication, repeated measurement, and subsampling</h4><p>Counting observations is not the same as counting independent units. This page protects against pseudoreplication.</p>
      <div class="form-grid two">
        ${mInput("mrUnit","Independent experimental/observational unit",d.experimentalUnit||"")}
        ${mInput("mrNUnits","Number of independent units",d.independentUnits||"")}
        ${mInput("mrRepeats","Repeated measurements/trials per unit",d.repeatsPerUnit||"")}
        ${mInput("mrSubs","Subsamples/technical measurements per unit",d.subsamplesPerUnit||"")}
        ${mInput("mrRowUnit","What one data-table row will represent",d.rowUnit||project.data.rowUnit||"")}
        ${mInput("mrCluster","Clustering / nesting structure",d.cluster||"","textarea")}
        ${mInput("mrRepReason","Why this replication structure is adequate/feasible",d.replicationReason||"","textarea")}
        ${mInput("mrIndependence","How independence or dependence will be handled in analysis",d.independencePlan||"","textarea")}
      </div>
      <div class="method-scorecards"><div class="method-scorecard"><span>Independent units</span><b>${r.nUnits||"—"}</b></div><div class="method-scorecard"><span>Repeats / unit</span><b>${r.repeats||"—"}</b></div><div class="method-scorecard"><span>Subsamples / unit</span><b>${r.subs||"—"}</b></div><div class="method-scorecard"><span>Structure</span><b style="font-size:11px">${esc(Methods.inferStructure(project).structure)}</b></div></div>
      ${r.issues.map(x=>`<div class="issue ${x[0]}"><b>${esc(x[1])}</b><p>${esc(x[2])}</p></div>`).join("")}
    </div>`;
  }

  function methodsSamplingTab(){
    const s=project.methods.sampling||{}, a=PathCoach.methodSection(project,"sampling");
    return `<div class="methods-section"><h4>Population, sample, sampling, and recruitment</h4><p>Random sampling and random assignment solve different problems. Sampling affects who the results may represent; assignment affects causal comparability between conditions.</p>
      <div class="form-grid two">
        ${mInput("msPopulation","Target population / system",s.population||project.data.population||"","textarea")}
        ${mInput("msFrame","Sampling frame / accessible population",s.frame||"","textarea")}
        ${mInput("msSample","Actual sample",s.sample||project.data.sample||"","textarea")}
        ${mInput("msMethod","Sampling method",s.method||project.data.samplingMethod||"","select",["Census / all available units","Simple random / probability sample","Stratified probability sample","Cluster sample","Systematic sample","Convenience sample","Purposive / criterion sample","Snowball / network sample","Other"])}
        ${mInput("msRecruit","Recruitment / selection procedure",s.recruitment||"","textarea")}
        ${mInput("msInclusion","Inclusion criteria",s.inclusion||"","textarea")}
        ${mInput("msExclusion","Eligibility exclusion criteria",s.exclusion||"","textarea")}
        ${mInput("msSize","Planned sample/unit count and rationale",s.sizeRationale||"","textarea")}
        ${mInput("msGeneral","Generalization boundary",s.generalization||project.data.sampleLimits||"","textarea")}
      </div>${a.issues.map(x=>`<div class="issue ${x[0]}"><b>${esc(x[1])}</b><p>${esc(x[2])}</p></div>`).join("")}
    </div>`;
  }

  function methodsMeasurementTab(){
    const a=PathCoach.methodSection(project,"measurement");
    return `<div class="methods-section"><h4>Measurement quality laboratory</h4><p>A named instrument is not enough. Explain what it measures, how scores are produced, when measurement occurs, whether it is sufficiently consistent, and why the score/observation supports the interpretation your question requires.</p>
      ${measurementRows()||'<p class="muted tiny">No measurements recorded.</p>'}<button class="ghost small" id="addMeasurement">Add measurement</button>
      <div style="margin-top:12px">${a.issues.map(x=>`<div class="issue ${x[0]}"><b>${esc(x[1])}</b><p>${esc(x[2])}</p></div>`).join("")}</div>
    </div>`;
  }

  function methodsEthicsTab(){
    const e=project.methods.ethics||{}, r=PathCoach.methodSection(project,"ethics");
    const cls=r.status==="clear"?"ethics-clear":r.status==="teacher_review"?"ethics-review":"ethics-stop";
    return `<div class="methods-section"><h4>Ethics, safety, privacy, and authority</h4><p>This page is an educational screening tool, not formal ethics approval. School policy, institutional review, applicable law, and teacher supervision still govern what may be done.</p>
      <div class="concept-box ${cls}"><strong>Status</strong><br>${esc(r.status.replaceAll("_"," "))}</div>
      <div class="form-grid two">
        ${mInput("meHuman","Human participants or identifiable human records?",e.humanParticipants||"","select",["yes","no"])}
        ${mInput("meMinors","Are any participants minors?",e.minors||"","select",["yes","no","not applicable"])}
        ${mInput("meIdent","Will you collect identifiers, images, audio, video, location, or linkable records?",e.identifiable||"","select",["yes","no"])}
        ${mInput("meSensitive","Does the study involve sensitive personal information?",e.sensitive||"","select",["yes","no"])}
        ${mInput("meIntervention","Will you assign/manipulate an intervention involving people?",e.intervention||"","select",["yes","no"])}
        ${mInput("meAuthority","Who has authority to approve/implement the intervention or data access?",e.authority||"","textarea")}
        ${mInput("meRisks","Possible physical, emotional, social, privacy, academic, environmental, or other risks",e.risks||"","textarea")}
        ${mInput("meConsent","Consent / permission process",e.consent||"","textarea")}
        ${mInput("meAssent","Assent / parent-guardian permission plan if relevant",e.assent||"","textarea")}
        ${mInput("meWithdraw","Voluntariness / withdrawal plan",e.withdrawal||"","textarea")}
        ${mInput("meDeid","Deidentification / confidentiality plan",e.deidentification||"","textarea")}
        ${mInput("meStorage","Storage, access, retention, and deletion plan",e.storage||"","textarea")}
        ${mInput("meRiskProc","Procedure-specific safety controls",e.procedureRisk||"","textarea")}
      </div>${r.issues.map(x=>`<div class="issue ${x[0]}"><b>${esc(x[1])}</b><p>${esc(x[2])}</p></div>`).join("")}
    </div>`;
  }

  function methodsProcedureTab(){
    const a=PathCoach.methodSection(project,"procedure");
    return `<div class="methods-section"><h4>Procedure builder</h4><p>Write the procedure as an ordered, auditable protocol. Another researcher should know what happens, what gets recorded, and what counts as a protocol deviation.</p>
      <div class="procedure-row" style="font-size:9px;font-weight:900;text-transform:uppercase;color:#6d7a88"><div>Phase</div><div>Action</div><div>Record</div><div>Deviation/decision rule</div><div></div></div>
      ${procedureRows()||'<p class="muted tiny">No procedure steps recorded.</p>'}
      <button class="ghost small" id="addProcedureStep">Add procedure step</button>
      <div style="margin-top:12px">${a.issues.map(x=>`<div class="issue ${x[0]}"><b>${esc(x[1])}</b><p>${esc(x[2])}</p></div>`).join("")}</div>
    </div>`;
  }

  function methodsDataTab(){
    const d=project.methods.design||{}, a=PathCoach.methodSection(project,"data");
    const rows=(project.schema||[]).map((r,i)=>`<div class="schema-row" style="grid-template-columns:1fr 120px 180px 1.4fr 90px 48px"><input data-schema-name="${i}" value="${esc(r.name||"")}"><select data-schema-type="${i}">${["ID","Numeric","Count","Categorical","Ordinal","Binary","Text","Date/time"].map(o=>`<option ${r.type===o?"selected":""}>${o}</option>`).join("")}</select><input data-schema-role="${i}" value="${esc(r.role||"")}" placeholder="role"><input data-schema-def="${i}" value="${esc(r.definition||"")}" placeholder="unit/categories/coding/allowed values"><input data-schema-missing="${i}" value="${esc(r.missing||"")}" placeholder="missing code"><button class="danger small" data-schema-del="${i}">×</button></div>`).join("");
    return `<div class="methods-section"><h4>Data table & dictionary</h4><p>Your research question decides the structure of the dataset. Define what one row represents, then define each column so another person could collect the same information.</p>
      <div class="form-grid two">${mInput("mRowUnit","What ONE row represents",d.rowUnit||project.data.rowUnit||"")}${mInput("mIdPlan","Identifier / linkage plan",d.identifierPlan||"","textarea")}</div>
      <div class="schema-list">${rows||'<p class="muted tiny">No columns defined.</p>'}</div>
      <div class="button-row"><button id="mAddSchema" class="secondary small">Add column</button><button id="mDownloadTemplate" class="ghost small">Download empty CSV</button><button id="mDownloadDictionary" class="ghost small">Download data dictionary</button></div>
      ${a.issues.map(x=>`<div class="issue ${x[0]}"><b>${esc(x[1])}</b><p>${esc(x[2])}</p></div>`).join("")}
    </div>`;
  }

  function methodsAuditTab(){
    const r=PathCoach.methodsReadiness(project), versions=project.methods.protocolVersions||[];
    return `<div class="methods-section"><h4>Pre-collection method audit</h4><p>Do this before final data collection. A locked protocol can still be amended later, but the previous version remains in the notebook.</p>
      <div class="audit-summary"><div class="audit-score">${r.score}</div><div><h4>${esc(r.label)}</h4><p>${r.critical} critical issue(s) · ${r.warning} warning(s) · ${r.info} information note(s)</p><p>Ethics/safety route: <b>${esc(r.ethicsStatus)}</b></p></div></div>
      ${Object.entries(r.sections).map(([name,x])=>`<div class="method-row"><div class="method-row-head"><b>${esc(name)}</b><span class="role-pill">${(x.issues||[]).length} issue(s)</span></div>${(x.issues||[]).slice(0,5).map(i=>`<div class="issue ${i[0]}"><b>${esc(i[1])}</b><p>${esc(i[2])}</p></div>`).join("")||'<p>No issue detected by current rule set.</p>'}</div>`).join("")}
      <div class="button-row"><button id="lockProtocol" class="primary" ${r.critical||r.ethicsStatus==="do_not_facilitate"?"disabled":""}>Lock protocol version</button><button id="downloadMethodPlan" class="ghost">Export method plan</button></div>
      ${r.critical?'<div class="gap-warning">Resolve critical methodological issues before locking the protocol.</div>':""}
      ${r.ethicsStatus==="do_not_facilitate"?'<div class="coach-feedback bad">This route must not proceed as a student-facilitated intervention. Redesign toward a safe observational/literature route and obtain teacher review.</div>':""}
      <h4 style="margin-top:16px">Protocol history</h4>${versions.slice().reverse().map((v,i)=>`<div class="protocol-card"><b>Version ${versions.length-i} · ${esc(new Date(v.lockedAt).toLocaleString())}</b><p>${esc(v.researchQuestion||"No question recorded")} · ${esc(v.designType||"No design recorded")}</p></div>`).join("")||'<p class="muted tiny">No locked protocol versions yet.</p>'}
    </div>`;
  }

  function methodsWorkspace(active="design"){
    Methods.normalizeProject(project);
    const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="methodsBackdrop";
    const tabs=[["design","1 · Design"],["vars","2 · Variables"],["rep","3 · Units & replication"],["sample","4 · Sampling"],["measure","5 · Measurement"],["ethics","6 · Ethics"],["procedure","7 · Procedure"],["data","8 · Data table"],["audit","9 · Audit & lock"]];
    const content=()=>active==="design"?methodsDesignTab():active==="vars"?methodsVariablesTab():active==="rep"?methodsReplicationTab():active==="sample"?methodsSamplingTab():active==="measure"?methodsMeasurementTab():active==="ethics"?methodsEthicsTab():active==="procedure"?methodsProcedureTab():active==="data"?methodsDataTab():methodsAuditTab();
    wrap.innerHTML=`<div class="modal methods-modal"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start"><div><h3>Methods & Study Design Laboratory</h3><p>Question → design → variables/constructs → units → sample → measurement → ethics → procedure → data structure → protocol lock.</p></div><button class="ghost small" id="closeMethods">Close</button></div><div class="methods-tabs">${tabs.map(([k,l])=>`<button data-mtab="${k}" class="${active===k?"active":""}">${l}</button>`).join("")}</div>${Guide.labPanel("methods",active)}<div>${content()}</div></div>`;
    document.body.appendChild(wrap);
    const rerender=tab=>{wrap.remove();methodsWorkspace(tab||active)};
    $("closeMethods").onclick=()=>wrap.remove();wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};
    document.querySelectorAll("[data-mtab]").forEach(b=>b.onclick=()=>rerender(b.dataset.mtab));
    bindMethodsWorkspace(rerender,active);
  }

  function bindMethodsWorkspace(rerender,active){
    const m=project.methods,d=m.design,s=m.sampling,e=m.ethics;
    const set=(id,obj,key)=>{if($(id)){$(id).oninput=()=>{obj[key]=$(id).value;save()};$(id).onchange=$(id).oninput}};
    [["mdPrimaryOutcome","primaryOutcome"],["mdExperimentalUnit","experimentalUnit"],["mdAssignment","assignment"],["mdSameUnit","sameUnitAllConditions"],["mdOrder","orderPlan"],["mdBlinding","blinding"],["mdFidelity","fidelity"],["mdClaim","claimCeiling"],
     ["mrUnit","experimentalUnit"],["mrNUnits","independentUnits"],["mrRepeats","repeatsPerUnit"],["mrSubs","subsamplesPerUnit"],["mrRowUnit","rowUnit"],["mrCluster","cluster"],["mrRepReason","replicationReason"],["mrIndependence","independencePlan"],
     ["mRowUnit","rowUnit"],["mIdPlan","identifierPlan"]].forEach(([id,k])=>set(id,d,k));
    [["msPopulation","population"],["msFrame","frame"],["msSample","sample"],["msMethod","method"],["msRecruit","recruitment"],["msInclusion","inclusion"],["msExclusion","exclusion"],["msSize","sizeRationale"],["msGeneral","generalization"]].forEach(([id,k])=>set(id,s,k));
    [["meHuman","humanParticipants"],["meMinors","minors"],["meIdent","identifiable"],["meSensitive","sensitive"],["meIntervention","intervention"],["meAuthority","authority"],["meRisks","risks"],["meConsent","consent"],["meAssent","assent"],["meWithdraw","withdrawal"],["meDeid","deidentification"],["meStorage","storage"],["meRiskProc","procedureRisk"]].forEach(([id,k])=>set(id,e,k));

    if($("addCondition")) $("addCondition").onclick=()=>{m.conditions.push({name:"",definition:""});save();rerender("design")};
    document.querySelectorAll("[data-cond-name]").forEach(x=>x.oninput=()=>{m.conditions[+x.dataset.condName].name=x.value;save()});
    document.querySelectorAll("[data-cond-def]").forEach(x=>x.oninput=()=>{m.conditions[+x.dataset.condDef].definition=x.value;save()});
    document.querySelectorAll("[data-cond-del]").forEach(x=>x.onclick=()=>{m.conditions.splice(+x.dataset.condDel,1);save();rerender("design")});

    if($("addConstruct")) $("addConstruct").onclick=()=>{m.constructs.push({name:"",role:Methods.roleOptions(project)[0],operational:""});save();rerender("vars")};
    document.querySelectorAll("[data-mc-name]").forEach(x=>x.oninput=()=>{m.constructs[+x.dataset.mcName].name=x.value;save()});
    document.querySelectorAll("[data-mc-role]").forEach(x=>x.onchange=()=>{m.constructs[+x.dataset.mcRole].role=x.value;save()});
    document.querySelectorAll("[data-mc-op]").forEach(x=>x.oninput=()=>{m.constructs[+x.dataset.mcOp].operational=x.value;save()});
    document.querySelectorAll("[data-mc-del]").forEach(x=>x.onclick=()=>{m.constructs.splice(+x.dataset.mcDel,1);save();rerender("vars")});
    if($("addControlled")) $("addControlled").onclick=()=>{m.controlled.push({name:"",definition:""});save();rerender("vars")};
    document.querySelectorAll("[data-ctl-name]").forEach(x=>x.oninput=()=>{m.controlled[+x.dataset.ctlName].name=x.value;save()});
    document.querySelectorAll("[data-ctl-def]").forEach(x=>x.oninput=()=>{m.controlled[+x.dataset.ctlDef].definition=x.value;save()});
    document.querySelectorAll("[data-ctl-del]").forEach(x=>x.onclick=()=>{m.controlled.splice(+x.dataset.ctlDel,1);save();rerender("vars")});
    if($("addConfounder")) $("addConfounder").onclick=()=>{m.confounders.push({name:"",plan:""});save();rerender("vars")};
    document.querySelectorAll("[data-cf-name]").forEach(x=>x.oninput=()=>{m.confounders[+x.dataset.cfName].name=x.value;save()});
    document.querySelectorAll("[data-cf-def]").forEach(x=>x.oninput=()=>{m.confounders[+x.dataset.cfDef].plan=x.value;save()});
    document.querySelectorAll("[data-cf-del]").forEach(x=>x.onclick=()=>{m.confounders.splice(+x.dataset.cfDel,1);save();rerender("vars")});

    if($("addMeasurement")) $("addMeasurement").onclick=()=>{m.measurements.push({construct:"",instrument:"",operational:"",scale:"",timing:"",reliability:"",validity:"",quality:""});save();rerender("measure")};
    ["construct","instrument","operational","scale","timing","reliability","validity","quality"].forEach(k=>document.querySelectorAll(`[data-mm-${k}]`).forEach(x=>x.oninput=()=>{m.measurements[+x.getAttribute(`data-mm-${k}`)][k]=x.value;save()}));
    document.querySelectorAll("[data-mm-del]").forEach(x=>x.onclick=()=>{m.measurements.splice(+x.dataset.mmDel,1);save();rerender("measure")});

    if($("addProcedureStep")) $("addProcedureStep").onclick=()=>{m.procedureSteps.push({phase:"",action:"",record:"",deviation:""});save();rerender("procedure")};
    ["phase","action","record","dev"].forEach(k=>document.querySelectorAll(`[data-ps-${k}]`).forEach(x=>x.oninput=()=>{const idx=+x.getAttribute(`data-ps-${k}`);m.procedureSteps[idx][k==="dev"?"deviation":k]=x.value;save()}));
    document.querySelectorAll("[data-ps-del]").forEach(x=>x.onclick=()=>{m.procedureSteps.splice(+x.dataset.psDel,1);save();rerender("procedure")});

    if($("mAddSchema")) $("mAddSchema").onclick=()=>{project.schema.push({name:`variable_${project.schema.length+1}`,type:"Numeric",role:"",definition:"",missing:"NA"});save();rerender("data")};
    document.querySelectorAll("[data-schema-name]").forEach(x=>x.oninput=()=>{project.schema[+x.dataset.schemaName].name=x.value;save()});
    document.querySelectorAll("[data-schema-type]").forEach(x=>x.onchange=()=>{project.schema[+x.dataset.schemaType].type=x.value;save()});
    document.querySelectorAll("[data-schema-role]").forEach(x=>x.oninput=()=>{project.schema[+x.dataset.schemaRole].role=x.value;save()});
    document.querySelectorAll("[data-schema-def]").forEach(x=>x.oninput=()=>{project.schema[+x.dataset.schemaDef].definition=x.value;save()});
    document.querySelectorAll("[data-schema-missing]").forEach(x=>x.oninput=()=>{project.schema[+x.dataset.schemaMissing].missing=x.value;save()});
    document.querySelectorAll("[data-schema-del]").forEach(x=>x.onclick=()=>{project.schema.splice(+x.dataset.schemaDel,1);save();rerender("data")});
    if($("mDownloadTemplate")) $("mDownloadTemplate").onclick=()=>download("research-data-template.csv",Methods.csvTemplate(project),"text/csv");
    if($("mDownloadDictionary")) $("mDownloadDictionary").onclick=()=>download("research-data-dictionary.csv",Methods.dictionaryCSV(project),"text/csv");

    if($("lockProtocol")) $("lockProtocol").onclick=()=>{
      const r=PathCoach.methodsReadiness(project);
      if(r.critical||r.ethicsStatus==="do_not_facilitate"){alert("Resolve critical path-specific or ethics issues before locking the protocol.");return}
      const snap=Methods.protocolSnapshot(project);
      snap.researchPath=project.pathway?.selected||"unsure";
      snap.instructionalBaseline="RMS-INSTRUCTIONAL-BASELINE-v2.4";
      project.methods.protocolVersions.push(snap);
      if(project.pathway) project.pathway.protocolReviewRequired=false;
      save();rerender("audit");
    };
    if($("downloadMethodPlan")) $("downloadMethodPlan").onclick=()=>download("method-planning-record.md",Methods.methodMarkdown(project),"text/markdown");
  }

  function stageStudentWork(){
    const s=current(), out={};
    for(const sec of (s.sections||[])) for(const f of sec.fields||[]) {
      const key=f[0]; if(project.data[key]!==undefined) out[key]=project.data[key];
    }
    if(s.id===6 || s.id===7 || s.id===8) out.sources=project.sources;
    if(s.id>=10 && s.id<=15) out.data_schema=project.schema;
    return out;
  }
  function stageContext(){
    const d=project.data;
    return {
      project_name:project.name,
      course_context:project.context,
      topic:d.topicChoice||d.broadTopic||"",
      research_question:d.finalRQ||"",
      question_type:d.questionType||"",
      design:d.designType||"",
      predictor_or_iv:d.predictorIV||"",
      outcome:d.outcomeDV||"",
      unit:d.experimentalUnit||d.rowUnit||"",
      research_path:project.pathway?.selected||"unsure",
      research_path_name:PathCoach.pathName(project)
    };
  }
  function renderAIResponse(r){
    const ds=Array.isArray(r.diagnostics)?r.diagnostics:[];
    const qs=Array.isArray(r.questions_for_student)?r.questions_for_student:[];
    const cites=r.source_status?.citations||[];
    return `<div class="ai-result"><div class="ai-summary"><b>${esc(r.verdict||"AI review")}</b><br>${esc(r.summary||"")}</div>
      ${ds.map(x=>`<div class="coach-msg ${x.severity==="critical"?"bad":x.severity==="warning"?"warn":"info"}"><b>${esc(x.category||"Diagnostic")}</b><p>${esc(x.finding||"")}</p><p>${esc(x.why_it_matters||"")}</p><p class="next">Your task: ${esc(x.student_task||"")}</p></div>`).join("")}
      ${qs.length?`<div class="coach-feedback"><b>Questions to answer next</b><br>${qs.map((q,i)=>`${i+1}. ${esc(q)}`).join("<br>")}</div>`:""}
      ${r.next_action?`<div class="coach-feedback good"><b>Next action</b><br>${esc(r.next_action)}</div>`:""}
      ${cites.length?`<div class="ai-cites"><b>Verified source records used by the coach</b><br>${cites.map(c=>`${esc(c.citation_label||c.claim)}${c.source_url?` · <a href="${esc(c.source_url)}" target="_blank" rel="noopener">source</a>`:""}${c.verified?" · verified":""}`).join("<br>")}</div>`:""}
      ${r.safety?.status && r.safety.status!=="clear"?`<div class="coach-feedback bad"><b>Safety/ethics status: ${esc(r.safety.status)}</b><br>${esc(r.safety.reason||"")}</div>`:""}
    </div>`;
  }

  function bindStage(){
    document.querySelectorAll(".stage-tabs button").forEach(b=>b.onclick=()=>{
      document.querySelectorAll(".stage-tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");
      ["Learn","Work","Check"].forEach(n=>$("tab"+n).classList.toggle("hidden",b.dataset.tab!==n.toLowerCase()));
    });
    document.querySelectorAll("[data-field]").forEach(el=>{
      el.oninput=()=>{project.data[el.dataset.field]=el.value;save();snapshot()};
      el.onchange=el.oninput;
    });
    if($("saveIndependent")) $("saveIndependent").onclick=()=>{
      const r=PathCoach.reviewStage(current().id,project);
      const ev=Competency.captureIndependent(project,current().id,r,stageStudentWork());
      save();
      $("independentStatus").innerHTML=`<div class="coach-feedback ${ev.independentEligible?"good":"warn"}"><b>Independent checkpoint saved</b><br>${ev.independentEligible?`This attempt was captured before any recorded support in Stage ${ev.stage}. Diagnostic feedback remains hidden until you request a review.`:`This checkpoint was saved after ${ev.priorSupportCount} recorded support event(s), so it will not be counted as independent evidence.`}</div>`;
    };
    if($("reviewStage")) $("reviewStage").onclick=()=>{
      const r=PathCoach.reviewStage(current().id,project);
      project.reviews.push({stage:current().id,time:new Date().toISOString(),kind:"local",score:r.score,label:r.label,messages:r.messages});
      Competency.recordReview(project,current().id,r,"local");
      Competency.recordSupport(project,current().id,1,"Local diagnostic review","Rule-based diagnostic feedback");
      save();
      $("coachReview").innerHTML=`<div class="coach-review-result"><div class="coach-score"><div class="score-circle">${r.score}</div><div class="score-label"><strong>${esc(r.label)}</strong><span>Diagnostic readiness score, not a grade</span></div></div>${r.messages.length?r.messages.map(x=>`<div class="coach-msg ${x.level}"><b>${esc(x.title)}</b><p>${esc(x.body)}</p>${x.next?`<p class="next">Next move: ${esc(x.next)}</p>`:""}</div>`).join(""):`<div class="coach-msg good"><b>No major rule-based issue detected</b><p>The stage passes the current local checks. Teacher/expert review can still identify issues this heuristic cannot detect.</p></div>`}</div>`;
    };
    if($("reviewAI")) $("reviewAI").onclick=async()=>{
      const btn=$("reviewAI"); btn.disabled=true; btn.textContent="Reviewing…";
      const local=PathCoach.reviewStage(current().id,project);
      const payload={
        stage_id:current().id,
        project_context:stageContext(),
        student_work:stageStudentWork(),
        deterministic_flags:local.messages.map(x=>({level:x.level,title:x.title,body:x.body})),
        scaffold_level:1,
        source_context:(current().id>=6 && current().id<=8)?project.sources:[],
        course_config:{audience:"secondary student",citation_style:project.data.citationStyle||"APA 7",research_path:project.pathway?.selected||"unsure",pathway_rule:"Evaluate only requirements appropriate to the confirmed research path; do not require hypotheses, IV/DV, p-values, effect sizes, participant sampling, or experimental controls unless that pathway and question genuinely need them."}
      };
      try{
        const r=await AI.review(payload);
        project.reviews.push({stage:current().id,time:new Date().toISOString(),kind:"AI",verdict:r.verdict,label:r.verdict});
        Competency.recordSupport(project,current().id,1,"AI Coach diagnostic","Source-grounded diagnostic review when configured");
        save(); $("aiCoachReview").innerHTML=renderAIResponse(r);
      }catch(err){
        $("aiCoachReview").innerHTML=`<div class="coach-feedback bad"><b>AI Coach unavailable</b><br>${esc(err.message)}</div>`;
      }finally{btn.disabled=false;btn.textContent="Ask AI Coach";}
    };
    if($("runInterest")) $("runInterest").onclick=()=>{
      Competency.recordSupport(project,current().id,2,"Interest Compass","Conceptual research-pathway cue");
      const r=Coach.interestDirections($("interestText").value,$("interestCuriosity").value);
      $("interestResult").innerHTML=`<div class="coach-feedback"><b>Keywords detected:</b> ${esc(r.keywords.join(", ")||"none yet")}<div class="direction-list">${r.directions.map(x=>`<div class="direction-item">${esc(x)}</div>`).join("")}</div></div>`;
    };
    if($("buildBoolean")) $("buildBoolean").onclick=()=>{
      Competency.recordSupport(project,current().id,3,"Boolean Search Builder","Structured search construction scaffold");
      const q=Coach.makeBoolean([$(`boolA`).value,$(`boolB`).value,$(`boolC`).value]);
      $("booleanResult").innerHTML=q?`<div class="citation-output">${esc(q)}</div>`:`<div class="coach-feedback warn">Add at least one concept block.</div>`;
      if(q){project.data.searchStrings=q;save();}
    };
    if($("runDesignMatcher")) $("runDesignMatcher").onclick=()=>{
      Competency.recordSupport(project,current().id,3,"Research Design Matcher","Structured design-selection scaffold");
      const r=Coach.designRecommendation($("dmGoal").value,$("dmManip").value,$("dmAssign").value,$("dmEvidence").value);
      $("designMatcherResult").innerHTML=`<div class="wizard-result"><h4>${esc(r.design)}</h4><p>${esc(r.why)}</p><div class="stats-note"><b>Claim ceiling:</b> ${esc(r.ceiling)}</div><button id="useDesign" class="primary small">Save as working design</button></div>`;
      $("useDesign").onclick=()=>{project.data.designType=r.design;project.data.designWhy=r.why;project.data.claimBoundary=r.ceiling;save();renderStage();activateWork()};
    };
    if($("addSchema")) $("addSchema").onclick=()=>{project.schema.push({name:`variable_${project.schema.length+1}`,type:"Numeric",definition:""});save();renderStage();activateWork()};
    document.querySelectorAll("[data-schema-name]").forEach(el=>el.oninput=()=>{project.schema[Number(el.dataset.schemaName)].name=el.value;save()});
    document.querySelectorAll("[data-schema-type]").forEach(el=>el.onchange=()=>{project.schema[Number(el.dataset.schemaType)].type=el.value;save()});
    document.querySelectorAll("[data-schema-def]").forEach(el=>el.oninput=()=>{project.schema[Number(el.dataset.schemaDef)].definition=el.value;save()});
    document.querySelectorAll("[data-schema-del]").forEach(el=>el.onclick=()=>{project.schema.splice(Number(el.dataset.schemaDel),1);save();renderStage();activateWork()});
    if($("downloadSchema")) $("downloadSchema").onclick=()=>{
      if(!project.schema.length){alert("Add at least one column first.");return}
      const headers=project.schema.map(r=>`"${String(r.name).replaceAll('"','""')}"`).join(",");
      download("research-data-template.csv",headers+"\\n","text/csv");
    };

    if($("markReady")) $("markReady").onclick=()=>{
      const stageId=current().id;
      if(project.ready[stageId]){project.ready[stageId]=false;save();renderAll();return}
      const gate=PathCoach.stageGate(stageId,project);
      if(!gate.canMarkReady){
        const target=$("pathGateFeedback");
        if(target) target.innerHTML=`<div class="coach-feedback warn"><b>This stage is not ready on the ${esc(PathCoach.pathName(project))} path yet.</b><br>${gate.missing?.length?`Complete: ${gate.missing.map(k=>esc(Paths.label(project,k,k))).join(", ")}.<br>`:""}${gate.blockingMessages?.map(x=>esc(x.body)).join("<br>")||""}<br>Open the field help or run the local review for a specific next move.</div>`;
        return;
      }
      project.ready[stageId]=true;save();renderAll();
    };
    if($("checkRQ")) $("checkRQ").onclick=()=>{const f=E.questionFeedback(project.data.finalRQ,project.data.questionType);$("rqFeedback").innerHTML=`<div class="coach-feedback ${f.length>1?"warn":"good"}">${f.map(esc).join("<br>")}</div>`};
    if($("openMethodsFromStage")) $("openMethodsFromStage").onclick=()=>methodsWorkspace(current().id===9?"design":current().id===10?"vars":current().id===11?"sample":"data");
    if($("openDataFromStage")) $("openDataFromStage").onclick=()=>DataLab.open(project,save,"setup");
    if($("openWritingFromStage")) $("openWritingFromStage").onclick=()=>WritingLab.open(project,save,current().id===15?"results":current().id===16?"discussion":current().id===17?"closing":current().id===18?"citations":"intro");
    if($("openLitFromSource")) $("openLitFromSource").onclick=()=>literatureWorkspace("sources");
    document.querySelectorAll("[data-edit-source]").forEach(b=>b.onclick=()=>literatureWorkspace("sources",Number(b.dataset.editSource)));
    if($("addSource")) $("addSource").onclick=()=>{
      project.sources.push({citation:$("srcCitation").value,type:$("srcType").value,design:$("srcDesign").value,sample:$("srcSample").value,measures:$("srcMeasures").value,finding:$("srcFinding").value,limits:$("srcLimits").value,relevance:$("srcRelevance").value,themes:$("srcThemes").value.split(",").map(x=>x.trim()).filter(Boolean)});
      save();renderStage();activateWork();
    };
    document.querySelectorAll("[data-del-source]").forEach(b=>b.onclick=()=>{project.sources.splice(Number(b.dataset.delSource),1);save();renderStage();activateWork()});
    if($("runWizard")) $("runWizard").onclick=()=>{
      Competency.recordSupport(project,current().id,3,"Statistics decision wizard","Structured analysis-selection scaffold");
      const cfg={structure:$("statStructure").value,outcome:$("statOutcome").value,assumptions:$("statAssume").value};
      if(!cfg.structure){$("wizardResult").innerHTML='<div class="coach-feedback warn">Choose a data/design structure first.</div>';return}
      const r=E.statsRecommendation(cfg);
      project.data.statsWizard=cfg;project.data.statsRecommendation=r;save();
      $("wizardResult").innerHTML=`<div class="wizard-result"><h4>Recommended analysis family</h4><dl><dt>Primary</dt><dd>${esc(r.primary)}</dd><dt>Graph</dt><dd>${esc(r.graph)}</dd><dt>Magnitude</dt><dd>${esc(r.effect)}</dd><dt>Checks</dt><dd>${esc(r.assumptions)}</dd></dl><div class="stats-note">${r.notes.map(esc).join("<br>")}</div><button id="useAnalysis" class="primary small">Save this reasoning to analysis plan</button></div>`;
      $("useAnalysis").onclick=()=>{project.data.analysisChoice=r.primary;project.data.assumptionChecks=r.assumptions;project.data.effectSizePlan=r.effect;save();renderStage();activateWork()};
    };
    if($("makeCitation")) $("makeCitation").onclick=()=>{
      const ref=E.apaJournalReference({authors:$("citAuthors").value,year:$("citYear").value,title:$("citTitle").value,journal:$("citJournal").value,volume:$("citVolume").value,issue:$("citIssue").value,pages:$("citPages").value,doi:$("citDoi").value});
      $("citationOutput").innerHTML=`<div class="citation-output">${esc(ref)}</div>`;
    };
  }

  function activateWork(){const b=document.querySelector('[data-tab="work"]');if(b)b.click()}

  function applyPilotFeaturePolicy(){
    const ai=Pilot.featureAccess(project,"ai"),tr=Pilot.featureAccess(project,"public-transfer");
    if($("aiSettings")){ $("aiSettings").disabled=!ai.allowed; $("aiSettings").classList.toggle("policy-disabled",!ai.allowed); $("aiSettings").title=ai.allowed?"":ai.reason; }
    if($("transferBtn")){ $("transferBtn").disabled=!tr.allowed; $("transferBtn").classList.toggle("policy-disabled",!tr.allowed); $("transferBtn").title=tr.allowed?"":tr.reason; }
  }
  function renderAll(){renderNav();snapshot();termCard();applyPilotFeaturePolicy();if(project.name)renderStage();else{$("welcome").hidden=false;$("stageView").hidden=true}}
  function markdown(){
    const d=project.data, lines=[`# ${project.name||"Research Project"}`,``,project.context?`**Context:** ${project.context}`:"",``];
    C.stages.forEach(s=>{lines.push(`## ${s.id}. ${s.title}`);for(const sec of s.sections){for(const f of sec.fields){const v=d[f[0]];if(v)lines.push(`**${f[1]}**\n\n${v}\n`)}}});
    if(project.sources.length){lines.push("## Source extraction records");project.sources.forEach((s,i)=>{lines.push(`### Source ${i+1}`);Object.entries(s).forEach(([k,v])=>{if(v)lines.push(`**${k}:** ${v}`)})})}
    return lines.join("\n");
  }
  function download(name,text,type="text/plain"){const blob=new Blob([text],{type});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
  $("beginProject").onclick=()=>{project.name=$("projectName").value.trim()||"My Research Project";project.context=$("projectContext").value.trim();save();renderAll()};
  $("exportJson").onclick=()=>download("research-methods-studio-v2-full-backup.json",JSON.stringify(Pilot.backupEnvelope(project,"full"),null,2),"application/json");
  $("exportMd").onclick=()=>download("research-notebook.md",markdown(),"text/markdown");
  $("resetProject").onclick=()=>{if(confirm("Start a new project? Download a backup first if you want to keep this notebook.")){Pilot.clearProjectStorage(KEY,{clearOnboarding:true});location.reload()}};


  $("pilotBtn").onclick=()=>PilotUI.open(project,save,KEY,"onboard");
  $("transferBtn").onclick=()=>{const a=Pilot.featureAccess(project,"public-transfer");if(!a.allowed){alert(a.reason);return}TransferUI.open(project,save,"student")};
  $("pathwayBtn").onclick=()=>PathUI.open(project,save,renderAll);
  $("studentGuideBtn").onclick=()=>Guide.guideModal(current().id);
  $("glossaryBtn").onclick=()=>Guide.glossaryModal("");
  Guide.bindDelegated();
  PathUI.bind(project,save,renderStage);
  RescueUI.bind(project,save,Competency,renderStage,()=>current().id);
  ExemplarUI.bind(project,save,Competency,()=>current().id);
  $("competencyBtn").onclick=()=>CompetencyUI.open(project,save,"overview");
  $("journeyBtn").onclick=()=>JourneyUI.openJourney(project,save,(stageId)=>{project.currentStage=stageId;save();renderAll();window.scrollTo({top:210,behavior:"smooth"})});
  $("teacherBtn").onclick=()=>JourneyUI.openTeacherDashboard();
  $("writingLab").onclick=()=>WritingLab.open(project,save,"intro");
  $("dataLab").onclick=()=>DataLab.open(project,save,"import");
  $("methodsLab").onclick=()=>methodsWorkspace("design");
  $("litLab").onclick=()=>literatureWorkspace("search");

  $("aiSettings").onclick=()=>{
    const access=Pilot.featureAccess(project,"ai");if(!access.allowed){alert(access.reason);return}
    const c=AI.getConfig();
    const wrap=document.createElement("div");wrap.className="modal-backdrop";
    wrap.innerHTML=`<div class="modal"><h3>AI Coach settings</h3><p>GitHub Pages cannot safely contain a model-provider API key. Enter only the URL of a secure server-side coach endpoint that implements the v1.2 backend contract.</p>
      <label><span>Secure coach endpoint</span><input id="aiEndpoint" placeholder="https://your-server.example/api/coach" value="${esc(c.endpoint||"")}"></label>
      <label style="margin-top:12px"><span>Enable AI Coach</span><select id="aiEnabled"><option value="false" ${!c.enabled?"selected":""}>No — local diagnostics only</option><option value="true" ${c.enabled?"selected":""}>Yes</option></select></label>
      <div class="modal-actions"><button class="ghost" id="closeAI">Cancel</button><button class="primary" id="saveAI">Save</button></div></div>`;
    document.body.appendChild(wrap);
    wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};
    $("closeAI").onclick=()=>wrap.remove();
    $("saveAI").onclick=()=>{AI.setConfig({endpoint:$("aiEndpoint").value.trim(),enabled:$("aiEnabled").value==="true"});wrap.remove();renderAll()};
  };


  Pilot.enhanceAccessibility();
  window.addEventListener("rms-save-status",e=>{const el=$("saveStatus");if(!el)return;el.textContent=e.detail.ok?`Saved · ${new Date(e.detail.time).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`:"Save problem";el.classList.toggle("save-error",!e.detail.ok);el.title=e.detail.message||""});
  window.addEventListener("error",e=>{try{Pilot.logRuntime(project,"runtime_error",e.message||"Unknown runtime error")}catch{}});
  window.addEventListener("unhandledrejection",e=>{try{Pilot.logRuntime(project,"unhandled_rejection",String(e.reason?.message||e.reason||"Unknown rejection"))}catch{}});
  load();
  {const sr=Pilot.storageReport(KEY),el=$("saveStatus");if(el){if(sr.lastSavedAt){el.textContent=`Saved · ${new Date(sr.lastSavedAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`;el.title="Last saved locally"}else{el.textContent=sr.available?"Not saved yet":"Storage unavailable";el.classList.toggle("save-error",!sr.available);el.title=sr.error||""}}}
  if(project.name){$("projectName").value=project.name;$("projectContext").value=project.context||""}
  renderAll();
  PilotUI.maybeOnboard(project,save,KEY);
})();
