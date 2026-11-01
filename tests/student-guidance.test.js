
global.window={};
require("../assets/student-guidance.js");
const G=window.RMSStudentGuidance;
if(Object.keys(G.stages).length!==18)process.exit(1);
if(Object.keys(G.fields).length!==113)process.exit(1);
if(Object.keys(G.glossary).length<80)process.exit(1);
for(const k of ["binary","experimental unit","estimand","paired data","confounder","p-value","effect size"])if(!G.glossary[k])process.exit(1);
for(let i=1;i<=18;i++){const s=G.stages[i];if(!s||s.steps.length<4||s.examples.length<1||s.stuck.length<2||s.terms.length<2)process.exit(1);}
for(const h of Object.values(G.fields))if(!h.meaning||!h.write||!h.example||!h.questions?.length||!h.avoid)process.exit(1);
for(const lab of ["literature","methods","data","writing"])if(!G.labs[lab]||Object.keys(G.labs[lab]).length<7)process.exit(1);
// Stage C-X3c3a | first 30 glossary definitions and methodological boundaries.
const firstThirty=Object.keys(G.glossary).slice(0,30);
if(firstThirty.length!==30||firstThirty[0]!=="analysis"||firstThirty[29]!=="Fisher exact test")process.exit(1);
for(const term of firstThirty)if(!G.glossary[term]?.trim()||G.glossary[term].includes("—"))process.exit(1);
if(!/organising evidence/.test(G.glossary.analysis))process.exit(1);
if(!/related terms when justified/.test(G.glossary["boolean search"]))process.exit(1);
if(!/labelling passages/.test(G.glossary.coding))process.exit(1);
if(!/repeated studies/.test(G.glossary["confidence interval"]))process.exit(1);
if(!/standardised/.test(G.glossary["controlled condition"]))process.exit(1);
if(!/carryover may still require/.test(G.glossary.counterbalancing))process.exit(1);
if(!/The numerical value calculated/.test(G.glossary.estimand))process.exit(1);
if(!/independently assigned/.test(G.glossary["experimental unit"]))process.exit(1);
if(!/In observational research, exposure is recorded/.test(G.glossary.exposure))process.exit(1);

// Stage C-X3c3b | glossary definitions 31-60 retain inferential distinctions.
const middleThirty=Object.keys(G.glossary).slice(30,60);
if(middleThirty.length!==30||middleThirty[0]!=="generalization"||middleThirty[29]!=="predictor")process.exit(1);
for(const term of middleThirty)if(!G.glossary[term]?.trim()||G.glossary[term].includes("—"))process.exit(1);
if(!/generalisation/.test(G.glossary.generalization))process.exit(1);
if(!/re-identified/.test(G.glossary.identifier))process.exit(1);
if(!/matched pairs/.test(G.glossary["independent groups"]))process.exit(1);
if(!/population or model parameter/.test(G.glossary["interval estimate"]))process.exit(1);
if(!/a brief scan cannot establish/.test(G.glossary["literature gap"]))process.exit(1);
if(!/dependence between estimates/.test(G.glossary["meta-analysis"]))process.exit(1);
if(!/observed zero/.test(G.glossary["missing data"]))process.exit(1);
if(!/categorical data/.test(G.glossary.numerical))process.exit(1);
if(!/test statistic at least as extreme/.test(G.glossary["p-value"]))process.exit(1);
if(!/census/.test(G.glossary.population))process.exit(1);
if(!/observed or assigned/.test(G.glossary.predictor))process.exit(1);

// Stage C-X3c3c | final 30 glossary definitions.
const finalThirty=Object.keys(G.glossary).slice(60);
if(finalThirty.length!==30||finalThirty[0]!=="protocol"||finalThirty[29]!=="identifiable data")process.exit(1);
for(const term of finalThirty)if(!G.glossary[term]?.trim()||G.glossary[term].includes("—"))process.exit(1);
if(!/later changes, which should be dated/.test(G.glossary.protocol))process.exit(1);
if(!/diagrams, models and observed interactions/.test(G.glossary["qualitative data"]))process.exit(1);
if(!/chance imbalances may remain/.test(G.glossary["random assignment"]))process.exit(1);
if(!/actually contribute evidence/.test(G.glossary.sample))process.exit(1);
if(!/probabilistic or non-probabilistic/.test(G.glossary["sampling frame"]))process.exit(1);
if(!/pairs whose classifications differ/.test(G.glossary["McNemar test"]))process.exit(1);
if(!/without identifying which conditions differ/.test(G.glossary["Cochran Q"]))process.exit(1);
if(!/does not automatically represent a causal effect/.test(G.glossary.regression))process.exit(1);

// Stage C-X3c4a | first 25 student-help entries and source-status boundaries.
const firstFieldKeys=Object.keys(G.fields).slice(0,25);
if(firstFieldKeys.length!==25||firstFieldKeys[0]!=="interest1"||firstFieldKeys[24]!=="rq2")process.exit(1);
for(const k of firstFieldKeys){
 const v=G.fields[k];
 if(!v.meaning||!v.write||!v.example||!v.questions?.length||!v.avoid||JSON.stringify(v).includes("—"))process.exit(1);
}
if(!/still require confirmation/.test(G.fields.access1.example))process.exit(1);
if(!/Radish seeds/.test(G.fields.contextPop.example))process.exit(1);
if(!/analysing records/.test(G.fields.timeLimit.meaning))process.exit(1);
if(!/18 labelled dishes/.test(G.fields.resources.example))process.exit(1);
if(!/actually run/.test(G.fields.prelimSearch.meaning))process.exit(1);
if(!/label the claim as something to investigate/.test(G.fields.known.write))process.exit(1);
if(!/For a proposed review/.test(G.fields.methodsSeen.write))process.exit(1);
if(!/based on source evidence already read/.test(G.fields.uncertain.write))process.exit(1);
if(!/hypothetical reading exercise/.test(G.fields.questionShift.example))process.exit(1);
if(!/describe the study practices/.test(G.fields.rq2.example))process.exit(1);

// Stage C-X3c4b | literature-help content checkpoints.
const k25=Object.keys(G.fields).slice(25,50);
if(k25.length!==25||k25[0]!=="rq3"||k25[24]!=="litDraft")process.exit(1);
for(const key of k25){const v=G.fields[key];if(!v.meaning||!v.write||!v.example||!v.questions?.length||!v.avoid||JSON.stringify(v).includes("—"))process.exit(1)}
if(!G.fields.rqJustification.example.includes("would not be anonymous"))process.exit(1);
if(!G.fields.searchLog.example.includes("not an executed search"))process.exit(1);
if(!G.fields.litThemePlan.write.includes("as many sections as the actual evidence needs"))process.exit(1);
if(!G.fields.litDraft.example.includes("Fictional drafting illustration only"))process.exit(1);
// Stage C-X3c4c | research design and methods help entries 51-75.
const thirdFieldKeys=Object.keys(G.fields).slice(50,75);
if(thirdFieldKeys.length!==25||thirdFieldKeys[0]!=="designType"||thirdFieldKeys[24]!=="procedure")process.exit(1);
for(const key of thirdFieldKeys){
 const v=G.fields[key];
 if(!v.meaning||!v.write||!v.example||!v.questions?.length||!v.avoid||JSON.stringify(v).includes("—"))process.exit(1);
}
if(!G.fields.designType.example.includes("Correlational / observational"))process.exit(1);
if(!G.fields.comparisonStructure.example.includes("18 dishes"))process.exit(1);
if(!G.fields.researchHyp.example.includes("100 mM NaCl"))process.exit(1);
if(!G.fields.outcomeDV.example.includes("Day 7 shoot length"))process.exit(1);
if(!G.fields.operationalDefs.example.includes("visible_shoot"))process.exit(1);
if(!G.fields.experimentalUnit.example.includes("not five independent treatment replicates"))process.exit(1);
if(!G.fields.sample.example.includes("Neither is a completed sample count"))process.exit(1);
if(!G.fields.sampleLimits.meaning.includes("generalisation"))process.exit(1);
if(!G.fields.instrument.example.includes("millimetre-marked ruler"))process.exit(1);
if(!G.fields.measureQuality.example.includes("does not independently assess germination"))process.exit(1);
if(!G.fields.materials.example.includes("90 radish seeds"))process.exit(1);
if(!G.fields.procedure.example.includes("keeping no-visible-shoot zeroes distinct from missing records"))process.exit(1);

// Stage C-X3c4d | data handling and Results guidance 76-100.
const batchData=Object.keys(G.fields).slice(75,100);
if(batchData.length!==25||batchData[0]!=="replication"||batchData[24]!=="interpret2")process.exit(1);
for(const k of batchData){const x=G.fields[k];if(!x.meaning||!x.write||!x.example||!x.questions?.length||!x.avoid||JSON.stringify(x).includes("—"))process.exit(1)}
if(!G.fields.replication.example.includes("18 independently assigned dishes"))process.exit(1);
if(!G.fields.columns.example.includes("visible_shoot"))process.exit(1);
if(!G.fields.missingRule.example.includes("missing"))process.exit(1);
if(!G.fields.analysisIntent.example.includes("0 and 100 mM"))process.exit(1);
if(!G.fields.primaryEstimand.example.includes("Day 7 shoot length"))process.exit(1);
if(!G.fields.analysisChoice.example.includes("Welch two-sample t-test"))process.exit(1);
if(!G.fields.assumptionChecks.example.includes("six dish outcomes"))process.exit(1);
if(!G.fields.result2.example.includes("visible shoots"))process.exit(1);
if(!G.fields.resultsDraft.write.includes("Organise"))process.exit(1);
if(!G.fields.interpret2.example.includes("cannot itself establish a germination mechanism"))process.exit(1);
// Stage C-X3c4e | final 13 writing and citation help fields.
const lastGuideKeys=Object.keys(G.fields).slice(100);
if(lastGuideKeys.length!==13||lastGuideKeys[0]!=="litCompare"||lastGuideKeys[12]!=="finalEdits")process.exit(1);
for(const k of lastGuideKeys){const x=G.fields[k];if(!x.meaning||!x.write||!x.example||!x.questions?.length||!x.avoid||JSON.stringify(x).includes("—"))process.exit(1)}
if(!G.fields.litCompare.example.includes("fictional comparison"))process.exit(1);
if(!G.fields.implications.example.includes("If a verified"))process.exit(1);
if(!G.fields.future.example.includes("radicle emergence"))process.exit(1);
if(!G.fields.discussionDraft.write.includes("allowing the findings to guide paragraph order"))process.exit(1);
if(!G.fields.conclusionDraft.write.includes("For a proposal"))process.exit(1);
if(!G.fields.finalEdits.example.includes("visible-shoot presence"))process.exit(1);
// Stage C-X3c5a | stage summaries 1-6; distinguish proposed research from completed evidence.
const stagesA=[1,2,3,4,5,6].map(n=>G.stages[n]);
if(stagesA.some(s=>!s?.title||!s?.plain||s.steps.length<4||s.examples.length<1||s.stuck.length<2||s.terms.length<2||!s.walkthrough?.draft))process.exit(1);
if(stagesA.some(s=>JSON.stringify(s).includes("—")))process.exit(1);
if(!G.stages[1].steps[2].includes("require permission or confirmation"))process.exit(1);
if(!G.stages[2].walkthrough.draft.includes("would not establish a climate-change trend"))process.exit(1);
if(!G.stages[3].steps[3].includes("sources you have actually examined"))process.exit(1);
if(!G.stages[3].walkthrough.draft.includes("after checking relevant sources"))process.exit(1);
if(!G.stages[4].examples[0].text.includes("seeds per dish")||!G.stages[4].examples[2].text.includes("per dish on Day 7"))process.exit(1);
if(G.stages[4].examples.some(x=>/germinat|standardized/.test(x.text)))process.exit(1);
if(!G.stages[5].plain.includes("proposed searches distinct from completed searches"))process.exit(1);
if(!G.stages[5].steps[5].includes("search actually run"))process.exit(1);
if(!G.stages[5].walkthrough.draft.includes("has not yet been run"))process.exit(1);
if(!G.stages[6].steps[0].includes("page or section locations"))process.exit(1);
if(!G.stages[6].steps[3].includes("measurement quality directly"))process.exit(1);
if(!G.stages[6].examples[0].label.includes("Hypothetical"))process.exit(1);
// Stage C-X3c5b | stage summaries 7-12; literature, design and evidence units.
const stagesB=[7,8,9,10,11,12].map(n=>G.stages[n]);
if(stagesB.some(s=>!s?.title||!s?.plain||s.steps.length<4||s.examples.length<1||s.stuck.length<2||s.terms.length<2||!s.walkthrough?.draft))process.exit(1);
if(stagesB.some(s=>JSON.stringify(s).includes("—")))process.exit(1);
if(!G.stages[7].examples[0].text.includes("Fictional illustration only"))process.exit(1);
if(!G.stages[7].walkthrough.draft.includes("need the studies' estimates"))process.exit(1);
if(!G.stages[8].plain.includes("Some paragraphs compare"))process.exit(1);
if(!G.stages[8].walkthrough.draft.includes("cite the actual studies"))process.exit(1);
if(!G.stages[9].steps[1].includes("without random assignment"))process.exit(1);
if(!G.stages[10].examples[1].text.includes("dish is the experimental unit"))process.exit(1);
if(!G.stages[11].examples[0].text.includes("Planned sample"))process.exit(1);
if(!G.stages[11].examples[1].text.includes("does not independently establish germination"))process.exit(1);
if(!G.stages[12].examples[0].text.includes("visible_shoot")||!G.stages[12].examples[0].text.includes("dish_id"))process.exit(1);
if(!G.stages[12].examples[1].text.includes("does not establish whether a radicle emerged"))process.exit(1);
if(!G.stages[12].walkthrough.draft.includes("independently assigned dishes"))process.exit(1);
// Stage C-X3c5c | stages 13-18; data coding, reporting and writing integrity.
const stagesC=[13,14,15,16,17,18].map(n=>G.stages[n]);
if(stagesC.some(s=>!s?.title||!s?.plain||s.steps.length<4||s.examples.length<1||s.stuck.length<2||s.terms.length<2||!s.walkthrough?.draft))process.exit(1);
if(stagesC.some(s=>JSON.stringify(s).includes("—")))process.exit(1);
if(!G.stages[13].examples[0].text.includes("per-dish summaries"))process.exit(1);
if(!G.stages[13].examples[1].text.includes("unobserved seeds distinct from observed zeroes"))process.exit(1);
if(G.stages[13].examples.some(x=>x.text.startsWith("germinated is binary")))process.exit(1);
if(!G.stages[14].examples.some(x=>x.text.includes("paired binary data")))process.exit(1);
if(!G.stages[15].examples[0].text.includes("Do not insert invented values"))process.exit(1);
if(!G.stages[15].walkthrough.draft.includes("Hypothetical example only"))process.exit(1);
if(!G.stages[16].steps[6].includes("particular interpretations"))process.exit(1);
if(!G.stages[16].plain.includes("how the argument unfolds"))process.exit(1);
if(!G.stages[17].examples[1].text.includes("For a proposal"))process.exit(1);
if(!G.stages[17].steps[4].includes("proposed inquiry"))process.exit(1);
if(!G.stages[18].steps[6].includes("connections between adjacent sentences and paragraphs"))process.exit(1);
if(!G.stages[18].strong.includes("connected, varied argument"))process.exit(1);
// Stage C-X3c6a | literature lab source-integrity descriptions.
const litLab=G.labs.literature;
if(Object.keys(litLab).length!==8)process.exit(1);
for(const x of Object.values(litLab))if(!x.title||!x.text||!x.terms?.length||JSON.stringify(x).includes("—"))process.exit(1);
if(!litLab.search.text.includes("searches actually run")||!litLab.search.text.includes("proposed queries"))process.exit(1);
if(!litLab.sources.text.includes("original paper")||!litLab.sources.text.includes("page or table"))process.exit(1);
if(!litLab.screen.text.includes("leave uncertain records pending"))process.exit(1);
if(!litLab.synth.text.includes("verified source records"))process.exit(1);
if(!litLab.gap.text.includes("documented searches"))process.exit(1);
// Stage C-X3c6b | methods laboratory descriptions and ethics boundaries.
const methodLab=G.labs.methods;
if(Object.keys(methodLab).length!==9)process.exit(1);
for(const x of Object.values(methodLab))if(!x.title||!x.text||!x.terms?.length||JSON.stringify(x).includes("—"))process.exit(1);
if(!methodLab.design.text.includes("without random assignment"))process.exit(1);
if(!methodLab.vars.text.includes("operational definition")||!methodLab.vars.text.includes("timing"))process.exit(1);
if(!methodLab.rep.text.includes("subsamples"))process.exit(1);
if(!methodLab.sample.text.includes("Random sampling"))process.exit(1);
if(!methodLab.measure.text.includes("particular interpretation"))process.exit(1);
if(!/before recruitment/i.test(methodLab.ethics.text)||!methodLab.ethics.text.includes("assent"))process.exit(1);
if(!methodLab.procedure.text.includes("deviation"))process.exit(1);
if(!methodLab.data.text.includes("nested units")||!methodLab.data.text.includes("observed zero"))process.exit(1);
if(!methodLab.audit.text.includes("retrospective changes"))process.exit(1);
// Stage C-X3c6c | Data Lab descriptions and unit-level evidence integrity.
const dataLab=G.labs.data;
if(Object.keys(dataLab).length!==7)process.exit(1);
for(const x of Object.values(dataLab))if(!x.title||!x.text||!x.terms?.length||JSON.stringify(x).includes("—"))process.exit(1);
if(!dataLab.import.text.includes("source file unchanged")||!dataLab.import.text.includes("leading zeroes"))process.exit(1);
if(!dataLab.quality.text.includes("not automatic deletion commands"))process.exit(1);
if(!dataLab.explore.text.includes("categorical counts with denominators"))process.exit(1);
if(!dataLab.setup.text.includes("qualitative work")||!dataLab.setup.text.includes("clustered"))process.exit(1);
if(!dataLab.run.text.includes("selected column"))process.exit(1);
if(!dataLab.history.text.includes("dataset version")||!dataLab.history.text.includes("sensitivity runs"))process.exit(1);
if(!dataLab.audit.text.includes("reported sample")||!dataLab.audit.text.includes("causal claims"))process.exit(1);
// Stage C-X3c6d | Writing Lab source fidelity and sentence-level connections.
const writeLab=G.labs.writing;
if(Object.keys(writeLab).length!==8)process.exit(1);
for(const x of Object.values(writeLab))if(!x.title||!x.text||!x.terms?.length||JSON.stringify(x).includes("—"))process.exit(1);
if(!writeLab.intro.text.includes("without claiming novelty"))process.exit(1);
if(!writeLab.lit.text.includes("checked sources")||!writeLab.lit.text.includes("each paragraph"))process.exit(1);
if(!writeLab.method.text.includes("For a proposal"))process.exit(1);
if(!writeLab.results.text.includes("actual records")||!writeLab.results.text.includes("source passages"))process.exit(1);
if(!writeLab.discussion.text.includes("paragraph order")||!writeLab.discussion.text.includes("material limitation"))process.exit(1);
if(!writeLab.closing.text.includes("without inventing results"))process.exit(1);
if(!writeLab.citations.text.includes("quotation fidelity"))process.exit(1);
if(!writeLab.audit.text.includes("adjacent sentences and paragraphs")||!writeLab.audit.text.includes("Canadian English"))process.exit(1);
// Stage C-X3c7a | novice help and first research-choice groups.
if(Object.keys(G.choices).length!==21)process.exit(1);
if(!G.novicePromise.includes("Student Guide and Research Terms"))process.exit(1);
if(!G.choices.questionType.options.Descriptive.includes("seeds per dish show a visible shoot on Day 7"))process.exit(1);
if(!G.choices.gapType.options["Documented literature gap"].includes("databases, dates and scope"))process.exit(1);
if(!G.choices.designType.options["Quasi-experimental"].includes("without random assignment"))process.exit(1);
if(!G.choices.hypothesisNeeded.options.No.includes("exploratory qualitative"))process.exit(1);
if(!G.choices.citationStyle.options["APA 7"].includes("seventh edition"))process.exit(1);
console.log("PASS student guidance coverage");
