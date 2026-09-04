
window.RMSEngine = (() => {
  const vague = /\b(better|worse|good|bad|successful|effective|healthy|smart|productive|focus|happiness|stress|engagement|impact|affect)\b/i;
  const causal = /\b(effect|affect|cause|causes|caused|increase|decrease|improve|reduce|lead to|results in|makes?)\b/i;
  const assoc = /\b(relationship|association|correlation|related|predict|linked)\b/i;

  function questionFeedback(q, type){
    const out=[];
    const text=(q||"").trim();
    if(text.length<25) out.push("The question may still be too broad. Add the outcome/phenomenon, comparison or predictor when relevant, and the population/system/context when it matters.");
    if(vague.test(text)) out.push("At least one term may need an operational definition. Explain exactly what will be observed or measured.");
    if(type && /Correlational|Descriptive|Qualitative|Literature/.test(type) && causal.test(text) && !assoc.test(text))
      out.push("The wording may imply causation even though the selected question family does not necessarily support a causal design.");
    if(!text.includes("?")) out.push("Write the research question as an explicit question.");
    if(!out.length) out.push("The question passes the basic wording screen. Methodological adequacy still depends on feasibility, measurement, sampling, and design.");
    return out;
  }

  function statsRecommendation(cfg){
    const structure=cfg.structure, outcome=cfg.outcome, assumptions=cfg.assumptions;
    let r={primary:"Start with descriptive statistics and visualization.",graph:"Plot the raw data in a way that preserves the design.",effect:"Report a meaningful estimate with units where possible.",assumptions:"Check design validity, missingness, outliers, and measurement quality first.",notes:[]};

    if(structure==="one_numeric"){
      r.primary="Descriptive analysis. Mean and SD when meaningful; median and IQR for skewed or robust summaries.";
      r.graph="Histogram, dot plot, or boxplot.";
      r.effect="No inferential effect size is required unless the question compares the sample with a defined reference.";
    } else if(structure==="two_numeric"){
      r.primary=outcome==="ordinal" ? "Spearman rank correlation as a common option for ordinal or monotonic association." : "Pearson correlation for an approximately linear numerical association; Spearman for ordinal or monotonic relationships when Pearson is not appropriate.";
      r.graph="Scatterplot with individual observations. Inspect form, clusters, leverage points, and outliers.";
      r.effect="Correlation coefficient with confidence interval where available. Regression slope may be more interpretable if prediction/change per unit X is central.";
      r.assumptions="Pearson requires a meaningful linear relationship and independence of units. Regression requires an appropriate functional form and well-behaved residuals for its inferential model.";
      r.notes.push("Correlation does not establish causation.");
    } else if(structure==="two_independent_cont"){
      r.primary="Welch's independent-samples t-test is a strong default for comparing two independent means when a mean comparison is scientifically meaningful.";
      r.graph="Raw-data dot/strip plot, boxplot, or violin-style distribution display with group summaries.";
      r.effect="Raw mean difference with confidence interval; standardized mean difference such as Hedges' g or Cohen's d when useful.";
      r.assumptions="Independent experimental/observational units, meaningful quantitative outcome, no extreme model violations. Welch's test does not require equal population variances.";
      if(assumptions==="ordinal_or_severe") r.notes.push("For ordinal outcomes or severe distribution problems in a small sample, consider a rank-based method such as Mann–Whitney, but interpret the estimand carefully.");
    } else if(structure==="two_paired_cont"){
      r.primary="Paired-samples t-test when the difference scores are reasonably modeled by a normal distribution; a paired nonparametric alternative may be appropriate for ordinal or problematic difference distributions.";
      r.graph="Paired dot/line plot and a plot of difference scores.";
      r.effect="Mean paired difference with confidence interval; paired standardized effect when useful.";
      r.assumptions="Pairs must correspond to the same unit or matched unit. For the paired t-test, normality concerns the difference scores.";
      if(assumptions==="ordinal_or_severe") r.notes.push("Wilcoxon signed-rank has its own assumptions, including a meaningful rank structure and commonly symmetry of paired differences. A sign test is more robust but less efficient.");
    } else if(structure==="three_independent_cont"){
      r.primary="One-way ANOVA when model assumptions are reasonable; Welch ANOVA is preferable when variances differ materially. Use planned contrasts or multiplicity-aware post-hoc comparisons.";
      r.graph="Raw-data group distributions with means/medians and uncertainty.";
      r.effect="Group mean differences and confidence intervals; omnibus effect size such as omega squared/eta squared where appropriate.";
      r.assumptions="Independent units and a suitable quantitative outcome. Classical ANOVA assumes homoscedastic residuals; Welch ANOVA relaxes equal-variance assumptions.";
      if(assumptions==="ordinal_or_severe") r.notes.push("Kruskal–Wallis can be considered for ordinal or rank-focused comparisons, followed by appropriate post-hoc analysis if needed.");
    } else if(structure==="three_repeated_cont"){
      r.primary="Repeated-measures ANOVA for suitable continuous repeated data, or a mixed-effects model when the structure is more complex. Friedman test is a common rank-based alternative.";
      r.graph="Individual trajectories plus condition summaries.";
      r.effect="Condition differences with intervals and an appropriate repeated-measures effect size.";
      r.assumptions="Repeated observations are not independent. Repeated-measures ANOVA adds assumptions such as sphericity; mixed models require a justified covariance/random-effects structure.";
    } else if(structure==="two_categorical"){
      r.primary="Chi-square test of independence for categorical count data when expected counts are adequate; Fisher's exact test is useful for small 2×2 tables.";
      r.graph="Bar chart or mosaic-style display using counts/proportions.";
      r.effect="Risk difference/risk ratio/odds ratio for meaningful 2×2 outcomes, or Cramér's V for general association.";
      r.assumptions="Use raw counts, independent units, and adequate expected counts for the chi-square approximation.";
    } else if(structure==="paired_binary"){
      r.primary="McNemar's test for paired binary outcomes measured on the same units under two conditions/time points.";
      r.graph="Paired transition table or before/after proportion display.";
      r.effect="Report discordant-pair counts and a paired proportion/odds interpretation where appropriate.";
      r.assumptions="Matched/paired binary observations. The test is driven by discordant pairs.";
    } else if(structure==="repeated_binary"){
      r.primary="Cochran's Q test is a common omnibus test for the same units measured on a binary outcome across three or more related conditions.";
      r.graph="Condition proportions with participant-level transitions when feasible.";
      r.effect="Report condition-specific proportions and follow-up paired comparisons with multiplicity control if the omnibus result warrants them.";
      r.assumptions="Repeated binary measurements on the same units; observations are related within unit.";
    } else if(structure==="qualitative"){
      r.primary="Transparent qualitative coding and synthesis. Build a codebook, apply codes systematically, develop themes, examine discrepant cases, and preserve an audit trail.";
      r.graph="Theme/evidence table, code map, or carefully labeled descriptive counts if counting is meaningful.";
      r.effect="Do not force inferential effect sizes onto word-based data. Report evidence, prevalence only when defined, and analytic credibility.";
      r.assumptions="Clarify sampling, unit of analysis, coding approach, reflexivity, coder procedures, and how themes were supported.";
    } else if(structure==="review"){
      r.primary="Narrative or structured literature synthesis. Extract study characteristics and findings, then synthesize patterns and disagreements.";
      r.graph="Study matrix, evidence map, or theme-by-study matrix.";
      r.effect="Do not compute a pooled effect unless the project meets meta-analysis requirements.";
      r.assumptions="Transparent search, inclusion logic, study appraisal, and traceability from themes to included studies.";
    } else if(structure==="meta"){
      r.primary="Meta-analysis only when studies provide sufficiently comparable outcomes/effect metrics and a defensible synthesis model can be specified.";
      r.graph="Forest plot with study effects and uncertainty.";
      r.effect="Pooled effect with confidence interval plus heterogeneity analysis.";
      r.assumptions="Independence of study samples/effects, appropriate effect-size conversion, weighting, heterogeneity model, and publication-bias limitations. This is an advanced route.";
    }
    r.notes.unshift("Always report descriptive evidence before or alongside inferential results.");
    r.notes.push("Statistical significance does not measure practical importance and cannot repair a weak design.");
    return r;
  }

  function apaJournalReference(x){
    const authors=(x.authors||"").trim();
    const year=(x.year||"n.d.").trim()||"n.d.";
    const title=(x.title||"Article title").trim();
    const journal=(x.journal||"Journal Title").trim();
    const volume=(x.volume||"").trim();
    const issue=(x.issue||"").trim();
    const pages=(x.pages||"").trim();
    const doi=(x.doi||"").trim();
    let s=`${authors || "Author, A. A."} (${year}). ${title}. ${journal}`;
    if(volume) s+=`, ${volume}`;
    if(issue) s+=`(${issue})`;
    if(pages) s+=`, ${pages}`;
    s+=".";
    if(doi) s+=` ${doi.startsWith("http")?doi:"https://doi.org/"+doi.replace(/^doi:\s*/i,"")}`;
    return s;
  }

  function alignment(project){
    const d=project.data||{};
    const rows=[
      ["Research question",d.finalRQ||"",!!d.finalRQ],
      ["Design",d.designType||"",!!d.designType && d.designType!=="Undecided"],
      ["Main predictor/IV",d.predictorIV||"Not applicable or not yet defined",!!d.predictorIV || /Descriptive|Qualitative|Literature review/.test(d.designType||"")],
      ["Outcome/phenomenon",d.outcomeDV||d.phenomenon||"",!!(d.outcomeDV||d.phenomenon)],
      ["Operational definitions",d.operationalDefs||"",!!d.operationalDefs || /Qualitative|Literature review/.test(d.designType||"")],
      ["Unit of analysis",d.experimentalUnit||d.rowUnit||"",!!(d.experimentalUnit||d.rowUnit)],
      ["Data structure",d.columns||"",!!d.columns],
      ["Analysis",d.analysisChoice||"",!!d.analysisChoice],
      ["Primary result",d.result1||"",!!d.result1],
      ["Direct answer",d.directAnswer||"",!!d.directAnswer]
    ];
    return rows;
  }

  return {questionFeedback,statsRecommendation,apaJournalReference,alignment};
})();
