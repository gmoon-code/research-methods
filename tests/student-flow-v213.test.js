
global.window={};
require("../assets/curriculum.js");
require("../assets/pathway-model.js");
require("../assets/pathways.js");
require("../assets/student-flow.js");

const F=window.RMSStudentFlow,P=window.RMSPathways,C=window.RMSCurriculum;
function project(){
  const p={name:"Flow QA",currentStage:1,ready:{},data:{},sources:[],searchLog:[],schema:[],
    methods:{design:{},sampling:{},ethics:{},constructs:[],conditions:[],measurements:[],procedureSteps:[],protocolVersions:[]},
    analysis:{runs:[]},writing:{sections:{}},pathway:{},flow:{}};
  P.normalizeProject(p);F.normalizeProject(p);return p;
}

let p=project();
if(F.recommendedStage(p)!==1)process.exit(1);
if(F.canWorkStage(p,1)!==true||F.canWorkStage(p,2)!==false||F.canWorkStage(p,10)!==false)process.exit(1);
p.ready[1]=true;
if(F.recommendedStage(p)!==2||!F.canWorkStage(p,2)||F.canWorkStage(p,3))process.exit(1);

// Preserve work while invalidating downstream readiness after an earlier canonical decision changes.
p.currentStage=4;
p.data.finalRQ="What is the association between sleep and quiz score?";
p.ready[9]=true;p.ready[10]=true;
p.data.designType="Observational";
p.data.outcomeDV="Quiz score";
let affected=F.noteFieldChange(p,"finalRQ",p.data.finalRQ,"How is reported weekday sleep duration associated with biology quiz score?");
F.syncDataField(p,"finalRQ","How is reported weekday sleep duration associated with biology quiz score?");
if(!affected.includes(9)||!affected.includes(10)||p.ready[9]||p.ready[10])process.exit(1);
if(!p.flow.needsReview[9]||!p.flow.reviewReasons[9].includes("Research question"))process.exit(1);
if(p.data.designType!=="Observational"||p.data.outcomeDV!=="Quiz score")process.exit(1);

// Re-review can clear the review marker without deleting work.
F.clearReview(p,9);
if(p.flow.needsReview[9])process.exit(1);

// Stage/Lab canonical synchronization in both directions.
F.syncDataField(p,"sample","30 students from one biology class");
if(p.methods.sampling.sample!=="30 students from one biology class")process.exit(1);
F.syncMethodFromLab(p,"sampling","sample","28 students with complete records");
if(p.data.sample!=="28 students with complete records")process.exit(1);

F.syncDataField(p,"discussionDraft","Stage discussion draft");
if(p.writing.sections.discussion!=="Stage discussion draft")process.exit(1);
F.syncWritingFromLab(p,"discussion","Writing Lab revised discussion");
if(p.data.discussionDraft!=="Writing Lab revised discussion")process.exit(1);

// Legacy duplicate versions are archived rather than silently discarded.
p.data.abstractDraft="Notebook abstract";
p.writing.sections.abstract="Older Lab abstract";
F.syncCanonical(p);
if(p.writing.sections.abstract!=="Notebook abstract")process.exit(1);
if(!(p.flow.versionArchive||[]).some(x=>x.key==="abstractDraft"&&x.labValue==="Older Lab abstract"))process.exit(1);

// Route status distinguishes current, done, future, and review.
let r=project();r.currentStage=2;r.ready[1]=true;F.markVisited(r,2);
if(F.routeState(r,1)!=="done"||F.routeState(r,2)!=="current")process.exit(1);
if(F.routeState(r,18)!=="future")process.exit(1);
r.flow.needsReview[10]=true;
if(F.routeState(r,10)!=="review")process.exit(1);

// Every stage has explicit continuity wording and every phase stays represented.
for(let i=1;i<=18;i++){
  const t=F.transitionFor(i);
  if(!t.from||!t.now||!t.next)process.exit(1);
}
if(C.phases.length!==5)process.exit(1);
console.log("PASS v2.13 route, continuity, dependency review, and single-source-of-truth flow engine");
