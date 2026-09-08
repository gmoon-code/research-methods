
global.window={};
window.RMSPathwayModel={
  version:"2.3",
  paths:[
    {id:"unsure",name:"Unsure"},{id:"descriptive_quantitative",name:"Descriptive"},{id:"observational",name:"Observational"},
    {id:"experimental",name:"Experimental"},{id:"quasi_experimental",name:"Quasi"},{id:"qualitative",name:"Qualitative"},
    {id:"literature_review",name:"Review"},{id:"meta_analysis",name:"Meta"},{id:"mixed_methods",name:"Mixed"}
  ],
  field_modes:{
    unsure:{researchHyp:"core",predictorIV:"core",primaryEstimand:"core"},
    descriptive_quantitative:{researchHyp:"hide",predictorIV:"hide",primaryEstimand:"core"},
    observational:{researchHyp:"optional",predictorIV:"core",controlCondition:"hide"},
    experimental:{researchHyp:"core",predictorIV:"core",controlCondition:"core"},
    qualitative:{researchHyp:"hide",predictorIV:"hide",primaryEstimand:"hide",analysisChoice:"core"},
    literature_review:{researchHyp:"hide",predictorIV:"hide",primaryEstimand:"hide",analysisChoice:"core"},
    meta_analysis:{researchHyp:"hide",predictorIV:"core",primaryEstimand:"core"},
    mixed_methods:{researchHyp:"core",predictorIV:"core",primaryEstimand:"core"}
  },
  label_overrides:{qualitative:{analysisChoice:"Qualitative analysis approach"},literature_review:{sample:"Included study set"}},
  stage_focus:{qualitative:{14:"Analyze qualitative evidence"}},
  stage_titles:{qualitative:{14:"Analyze qualitative evidence"}},
  tool_relevance:{qualitative:{dataLab:"supporting"}}
};
require("../assets/pathways.js");
const P=window.RMSPathways;
if(P.recommendationFromQuestionType("Qualitative")!=="qualitative")process.exit(1);
if(P.recommendationFromQuestionType("Literature review")!=="literature_review")process.exit(1);
if(P.recommendationFromQuestionType("Correlational / observational")!=="observational")process.exit(1);
let p={data:{questionType:"Qualitative"},pathway:{}};
P.normalizeProject(p);
P.select(p,"qualitative");
if(P.fieldMode(p,"researchHyp")!=="hide")process.exit(1);
if(P.fieldMode(p,"analysisChoice")!=="core")process.exit(1);
if(P.label(p,"analysisChoice","Analysis")!=="Qualitative analysis approach")process.exit(1);
p.data.researchHyp="previous work";
if(!P.shouldShowField(p,"researchHyp",10))process.exit(1);
p.data.researchHyp="";
if(P.shouldShowField(p,"researchHyp",10))process.exit(1);
P.toggleExtras(p,10);
if(!P.shouldShowField(p,"researchHyp",10))process.exit(1);
console.log("PASS guided pathway engine");
