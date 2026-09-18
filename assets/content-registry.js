window.RMSContentRegistry = (() => {
  "use strict";

  function deepFreeze(value) {
    if (
      !value ||
      typeof value !== "object" ||
      Object.isFrozen(value)
    ) {
      return value;
    }

    Object.freeze(value);

    for (const key of Object.keys(value)) {
      deepFreeze(value[key]);
    }

    return value;
  }

  const registry = {
  "schema_version": "1.0",
  "content_version": "v3-content-foundation-2",
  "records": [
    {
      "key": "curriculum.stage.1.guidance",
      "type": "stage_guidance",
      "location": "Stage 1 · Find your research interests",
      "phase": "discover",
      "phase_label": "Phase 1 · Discover",
      "stage_id": 1,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Find your research interests",
        "nav": "Research interests",
        "purpose": "Start with questions you genuinely care about. A good project begins with curiosity, a problem, a pattern, or an unresolved explanation, not with a statistical test.",
        "learn_html": "\r\n        <h3>Research starts before the research question</h3>\r\n        <p>Your first job is to generate possible areas of inquiry. Look for topics that are interesting enough to sustain weeks of work and concrete enough that evidence could eventually be collected.</p>\r\n        <div class=\"concept-box\"><strong>Four productive starting points</strong><br>\r\n        A phenomenon you want to explain · a problem you want to understand · a claim you are unsure about · a pattern you have noticed.</div>\r\n        <p>Do not force yourself to identify an independent variable yet. Some strong projects are descriptive, correlational, qualitative, or literature-based and may never manipulate a variable.</p>\r\n        <h3>Interest inventory</h3>\r\n        <ul>\r\n          <li>What science topics make you keep reading after class?</li>\r\n          <li>What real-world problems feel unresolved or poorly understood?</li>\r\n          <li>What claims do people repeat that you would like to check with evidence?</li>\r\n          <li>What patterns have you noticed in school, nature, technology, health, behavior, or your community?</li>\r\n          <li>What tools, datasets, organisms, materials, or settings can you realistically access?</li>\r\n        </ul>",
        "example_html": "<strong>Example</strong><p>Broad interest: memory. Observation: I remember vocabulary differently depending on how I study. Possible research direction: compare study procedures using delayed recall.</p>",
        "warning_html": "<strong>Avoid this trap</strong><ul><li>Choosing a topic only because it sounds impressive.</li><li>Beginning with “I need to use ANOVA.”</li><li>Choosing a topic that requires unsafe procedures or inaccessible equipment.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.2.guidance",
      "type": "stage_guidance",
      "location": "Stage 2 · Narrow a topic and test feasibility",
      "phase": "discover",
      "phase_label": "Phase 1 · Discover",
      "stage_id": 2,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Narrow a topic and test feasibility",
        "nav": "Narrow the topic",
        "purpose": "Turn a broad interest into a manageable research topic by specifying the phenomenon, context, population or system, and realistic scope.",
        "learn_html": "\r\n        <h3>Topic is broader than question</h3>\r\n        <p>A research topic names the area you will study. Your research question will later define the exact evidence you need.</p>\r\n        <div class=\"concept-box\"><strong>Narrowing sequence</strong><br>Broad area → subtopic → phenomenon or problem → context/population/system → measurable or analyzable angle.</div>\r\n        <h3>Use a feasibility filter</h3>\r\n        <ul>\r\n          <li><strong>Interest.</strong> Will you remain curious after the first week?</li>\r\n          <li><strong>Relevance.</strong> Is there a scientific, practical, theoretical, or local reason to ask?</li>\r\n          <li><strong>Feasibility.</strong> Can you obtain the evidence, time, equipment, participants, or sources?</li>\r\n          <li><strong>Ethics and safety.</strong> Can the study be done without unacceptable risk or inappropriate use of people or data?</li>\r\n          <li><strong>Scope.</strong> Can one student project answer a useful part of the problem?</li>\r\n        </ul>\r\n        <p>A small, well-designed question is stronger than a huge question with weak evidence.</p>",
        "example_html": "<strong>Example</strong><p>Too broad: social media and teenagers. Better topic: short-form video use and bedtime routines among students in one school context. The final question still comes later.</p>",
        "warning_html": "<strong>Scope warning</strong><ul><li>“Climate change,” “cancer,” or “AI and society” are fields, not manageable student projects.</li><li>Do not claim your project will solve a global problem.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.3.guidance",
      "type": "stage_guidance",
      "location": "Stage 3 · Explore the research landscape",
      "phase": "discover",
      "phase_label": "Phase 1 · Discover",
      "stage_id": 3,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Explore the research landscape",
        "nav": "Preliminary background scan",
        "purpose": "Do a small background scan before locking the question. Learn the language researchers use, discover how the topic has been studied, and identify what evidence is realistically available.",
        "learn_html": "\r\n        <h3>Preliminary search is reconnaissance</h3>\r\n        <p>You are not writing the literature review yet. You are learning enough to avoid designing a question that is already poorly framed, impossible to measure, or disconnected from the field.</p>\r\n        <ul>\r\n          <li>Identify 2–4 core concepts in your topic.</li>\r\n          <li>Build a synonym bank for each concept.</li>\r\n          <li>Try several search strings, not one.</li>\r\n          <li>Read abstracts and methods from a few strong papers.</li>\r\n          <li>Record how researchers define and measure the main constructs.</li>\r\n          <li>Notice repeated limitations, disagreements, populations, and methods.</li>\r\n        </ul>\r\n        <div class=\"concept-box\"><strong>Important distinction</strong><br>A “research gap” is not something you invent to make a project sound novel. It is a claim about the existing literature and must be supported by what you actually found. A student project may also be justified as a replication, local application, classroom-scale investigation, or methodological exercise without claiming worldwide novelty.</div>",
        "example_html": "<strong>Search example</strong><p>Concepts: retrieval practice · delayed recall · biology vocabulary. Synonyms: practice testing, active recall, memory retention, delayed retention. Search strings can combine these with AND/OR.</p>",
        "warning_html": "<strong>Do not lock the question too early</strong><ul><li>Preliminary reading may reveal that your original variable has no feasible measure.</li><li>A paper can suggest a method without proving that method is appropriate for your study.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.4.guidance",
      "type": "stage_guidance",
      "location": "Stage 4 · Write and refine the research question",
      "phase": "discover",
      "phase_label": "Phase 1 · Discover",
      "stage_id": 4,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Write and refine the research question",
        "nav": "Research question",
        "purpose": "Create a focused question whose wording matches the kind of evidence you can collect and the kind of conclusion your design could support.",
        "learn_html": "\r\n        <h3>The research question controls the rest of the study</h3>\r\n        <p>A strong question is specific enough to determine what evidence is needed without predetermining the answer.</p>\r\n        <h3>Common question families</h3>\r\n        <ul>\r\n          <li><strong>Descriptive.</strong> What is present, how much, how often, or how is it distributed?</li>\r\n          <li><strong>Correlational or associational.</strong> How are two measured variables related?</li>\r\n          <li><strong>Experimental.</strong> How does deliberately changing X affect Y under defined conditions?</li>\r\n          <li><strong>Qualitative.</strong> How do people describe, explain, experience, or interpret something?</li>\r\n          <li><strong>Review.</strong> What does the existing literature collectively say about a defined question?</li>\r\n          <li><strong>Meta-analysis.</strong> What is the pooled quantitative effect across sufficiently comparable studies? This is advanced.</li>\r\n        </ul>\r\n        <div class=\"concept-box\"><strong>Wording matters</strong><br>Observational questions should usually use terms such as association, relationship, difference, pattern, or prediction. Causal words such as effect, causes, increases, reduces, or leads to require a design that can support causal inference.</div>\r\n        <p>The question should identify the outcome or phenomenon, the comparison or predictor when relevant, and the population/system/context when that boundary matters.</p>",
        "example_html": "<strong>Refinement example</strong><p>Weak: Does music help people study? Better experimental question: How does instrumental background music compared with silence affect reading-comprehension accuracy during 20-minute sessions among students under the tested conditions?</p>",
        "warning_html": "<strong>Question problems</strong><ul><li>Leading questions that assume the result.</li><li>Terms such as “better,” “successful,” or “healthy” with no definition.</li><li>Questions that require data you cannot obtain.</li><li>Causal wording for correlational designs.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.5.guidance",
      "type": "stage_guidance",
      "location": "Stage 5 · Build a systematic search strategy",
      "phase": "literature",
      "phase_label": "Phase 2 · Build the evidence base",
      "stage_id": 5,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Build a systematic search strategy",
        "nav": "Literature search",
        "purpose": "Search deliberately enough that your literature review represents the topic rather than only the first papers returned by a search engine.",
        "learn_html": "\r\n        <h3>Turn the question into searchable concepts</h3>\r\n        <p>Break the research question into concept blocks. Build synonyms inside each block and connect concepts with Boolean operators.</p>\r\n        <div class=\"concept-box\"><strong>Pattern</strong><br>(\"concept A\" OR synonym OR synonym) AND (\"concept B\" OR synonym) AND (population OR context)</div>\r\n        <h3>Search in layers</h3>\r\n        <ol>\r\n          <li>Use a broad scholarly index to learn the vocabulary.</li>\r\n          <li>Use a subject database for stronger field coverage.</li>\r\n          <li>Use citation chaining from a strong anchor paper.</li>\r\n          <li>Record your search terms and inclusion decisions.</li>\r\n        </ol>\r\n        <p>Google Scholar can be a starting point. Depending on the field, students may also use PubMed, ERIC, PsycINFO, Web of Science, Scopus, IEEE Xplore, JSTOR, or reputable government and institutional datasets.</p>",
        "example_html": "<strong>Example</strong><p>(\"retrieval practice\" OR \"practice testing\" OR \"active recall\") AND (\"delayed recall\" OR retention) AND (adolescent* OR \"high school\")</p>",
        "warning_html": "<strong>Search quality</strong><ul><li>One search string is not comprehensive.</li><li>“Recent” does not automatically mean “better.” Foundational sources may be older.</li><li>Do not use a source simply because it supports your prediction.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.6.guidance",
      "type": "stage_guidance",
      "location": "Stage 6 · Evaluate, read, and extract sources",
      "phase": "literature",
      "phase_label": "Phase 2 · Build the evidence base",
      "stage_id": 6,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Evaluate, read, and extract sources",
        "nav": "Source evaluation",
        "purpose": "Read research as evidence. Record design, sample, measures, findings, limitations, and relevance so later synthesis is traceable.",
        "learn_html": "\r\n        <h3>Peer review is useful, but it is not a quality guarantee</h3>\r\n        <p>Evaluate whether a source is appropriate for your particular claim. Consider recency when it matters, relevance, author and venue, methods, measurement quality, sample, transparency, conflicts of interest, and whether the conclusions match the design.</p>\r\n        <h3>Read papers structurally</h3>\r\n        <ul>\r\n          <li><strong>Introduction.</strong> What problem and theoretical context are established?</li>\r\n          <li><strong>Methods.</strong> Who or what was studied, how were constructs measured, and what design was used?</li>\r\n          <li><strong>Results.</strong> What evidence was actually produced?</li>\r\n          <li><strong>Discussion.</strong> How do the authors interpret it, and what limitations do they acknowledge?</li>\r\n        </ul>\r\n        <div class=\"concept-box\"><strong>Extraction rule</strong><br>Keep a distinction between what the authors measured, what they observed, and what they concluded. Your notes should make it possible to verify every later literature claim.</div>",
        "example_html": "<strong>Source note</strong><p>Design: correlational survey. Sample: n = 420 secondary students. Measures: validated well-being scale and self-reported activity hours. Finding: small positive association. Limits: cross-sectional, self-report, possible confounding.</p>",
        "warning_html": "<strong>Avoid source-by-source thinking</strong><ul><li>Your literature review should not become “Study A said… Study B said… Study C said…”</li><li>Do not copy sentences into notes without marking them as direct quotations.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.7.guidance",
      "type": "stage_guidance",
      "location": "Stage 7 · Synthesize the literature and justify the study",
      "phase": "literature",
      "phase_label": "Phase 2 · Build the evidence base",
      "stage_id": 7,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Synthesize the literature and justify the study",
        "nav": "Synthesis and gap",
        "purpose": "Move from individual papers to patterns across papers. Identify convergence, disagreement, methodological limitations, and the precise reason your study is worth doing.",
        "learn_html": "\r\n        <h3>Synthesis asks what the literature says collectively</h3>\r\n        <p>Group evidence by themes, mechanisms, methods, populations, theoretical positions, or patterns in findings. Compare sources inside paragraphs.</p>\r\n        <ul>\r\n          <li>Where do studies converge?</li>\r\n          <li>Where do findings conflict?</li>\r\n          <li>Do different methods produce different answers?</li>\r\n          <li>Which populations, contexts, timeframes, or measures dominate the evidence?</li>\r\n          <li>Which limitations repeat across studies?</li>\r\n        </ul>\r\n        <h3>Choose an honest justification</h3>\r\n        <p>Your project may address a documented literature gap, reproduce a known result in a new context, compare methods, extend a finding, resolve an inconsistency, or investigate a local question. Do not imply that “no research exists” unless your search can support that claim.</p>",
        "example_html": "<strong>Synthesis example</strong><p>Several studies report a benefit of retrieval practice for delayed retention, but they differ in learner age, material type, feedback timing, and delay interval. A student project might therefore test one clearly bounded version under local classroom conditions without claiming to settle the wider literature.</p>",
        "warning_html": "<strong>Common failure</strong><ul><li>Calling any limitation a “gap.”</li><li>Claiming novelty from a quick Google Scholar search.</li><li>Treating disagreement as proof that one study is wrong.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.8.guidance",
      "type": "stage_guidance",
      "location": "Stage 8 · Write the literature review",
      "phase": "literature",
      "phase_label": "Phase 2 · Build the evidence base",
      "stage_id": 8,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Write the literature review",
        "nav": "Literature review",
        "purpose": "Build a coherent explanation of what is known, how the evidence fits together, what remains uncertain, and how that reasoning leads to your study.",
        "learn_html": "\r\n        <h3>A literature review is synthesis, not an annotated bibliography</h3>\r\n        <p>Most paragraphs should organize sources around an idea or problem, then compare the evidence. The exact structure depends on discipline and assignment.</p>\r\n        <h3>Useful structures</h3>\r\n        <ul>\r\n          <li><strong>Thematic.</strong> Organize around recurring concepts or mechanisms.</li>\r\n          <li><strong>Methodological.</strong> Compare what different designs or measures reveal.</li>\r\n          <li><strong>Chronological.</strong> Use when the development of an idea over time is itself informative.</li>\r\n          <li><strong>Theoretical.</strong> Compare models or explanatory frameworks.</li>\r\n        </ul>\r\n        <div class=\"concept-box\"><strong>Paragraph logic</strong><br>Claim about the literature → evidence from multiple sources → comparison or qualification → implication for the topic or your study.</div>\r\n        <p>In some scientific papers, the literature review is integrated into the Introduction. In some courses, it is a separate section. Follow your assignment while keeping the same synthesis principles.</p>",
        "example_html": "<strong>Weak versus stronger</strong><p>Weak: “Smith studied X. Lee studied X. Park studied X.” Stronger: “Across three studies, X was consistently associated with Y, although the magnitude was smaller in samples using measure Z (citations).”</p>",
        "warning_html": "<strong>Citation integrity</strong><ul><li>Every citation must actually support the nearby claim.</li><li>Do not cite a review as if you personally checked every primary study it summarizes.</li><li>Never invent a reference or DOI.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.9.guidance",
      "type": "stage_guidance",
      "location": "Stage 9 · Choose the research design",
      "phase": "design",
      "phase_label": "Phase 3 · Design the study",
      "stage_id": 9,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Choose the research design",
        "nav": "Research design",
        "purpose": "Match the design to the question. Different questions require different evidence, and not every study is an experiment.",
        "learn_html": "\r\n        <h3>Method follows question</h3>\r\n        <ul>\r\n          <li><strong>Descriptive.</strong> Characterize one or more features without testing a causal explanation.</li>\r\n          <li><strong>Correlational/observational.</strong> Measure variables without assigning the exposure and examine association.</li>\r\n          <li><strong>Experimental.</strong> Manipulate an independent variable and compare outcomes under conditions designed to reduce alternative explanations.</li>\r\n          <li><strong>Quasi-experimental.</strong> Compare an intervention or naturally formed conditions without full random assignment.</li>\r\n          <li><strong>Qualitative.</strong> Investigate meaning, experience, process, or explanation using textual or observational evidence.</li>\r\n          <li><strong>Mixed methods.</strong> Combine qualitative and quantitative components because each answers a different part of the question.</li>\r\n          <li><strong>Literature review.</strong> Synthesize existing studies without statistically pooling effects.</li>\r\n          <li><strong>Meta-analysis.</strong> Quantitatively combine comparable effect estimates using a defensible synthesis model.</li>\r\n        </ul>\r\n        <div class=\"concept-box\"><strong>Causal caution</strong><br>Manipulation alone does not guarantee strong causal inference. Assignment, comparison conditions, confounding, measurement, adherence, attrition, and implementation all affect what can be concluded.</div>",
        "example_html": "<strong>Example</strong><p>Question: “Is weekly study time associated with exam score?” → observational correlational design. Question: “How does assigned retrieval practice versus rereading affect delayed recall?” → experimental or quasi-experimental design depending on assignment and control.</p>",
        "warning_html": "<strong>Design mismatch</strong><ul><li>Do not label measured exposure as an “independent variable” if you did not manipulate it; predictor or exposure is often clearer.</li><li>Do not force qualitative questions into IV/DV language.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.10.guidance",
      "type": "stage_guidance",
      "location": "Stage 10 · Define hypotheses, variables, controls, and experimental units",
      "phase": "design",
      "phase_label": "Phase 3 · Design the study",
      "stage_id": 10,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Define hypotheses, variables, controls, and experimental units",
        "nav": "Hypothesis and variables",
        "purpose": "Translate the question into precise constructs and, when appropriate, predictions. Learn the difference among independent variables, predictors, outcomes, controlled conditions, control groups, covariates, confounders, and experimental units.",
        "learn_html": "\r\n        <h3>A hypothesis is not mandatory for every study</h3>\r\n        <p>Directional hypotheses are useful when theory or prior evidence supports a prediction in a quantitative confirmatory study. Exploratory, descriptive, qualitative, and many review questions may not need a formal hypothesis.</p>\r\n        <h3>Variable language</h3>\r\n        <ul>\r\n          <li><strong>Independent variable.</strong> A factor deliberately manipulated in an experiment.</li>\r\n          <li><strong>Predictor/exposure.</strong> A measured variable used to explain or predict an outcome in observational work.</li>\r\n          <li><strong>Dependent/outcome variable.</strong> The response you measure.</li>\r\n          <li><strong>Controlled conditions.</strong> Features intentionally standardized across experimental conditions. “Constants” is a common classroom term, but controlled condition is usually more precise.</li>\r\n          <li><strong>Control group/condition.</strong> A comparison condition that provides a reference. This is different from a controlled variable.</li>\r\n          <li><strong>Covariate/confounder.</strong> A measured or unmeasured factor related to the exposure and outcome that can complicate interpretation.</li>\r\n          <li><strong>Experimental unit.</strong> The smallest unit independently assigned to a treatment. Ten seeds in one treated pot are not automatically ten independent experimental units.</li>\r\n        </ul>\r\n        <div class=\"concept-box\"><strong>Operational definition</strong><br>Every construct that drives the study must be translated into exactly what is manipulated, observed, scored, counted, or measured.</div>",
        "example_html": "<strong>Example</strong><p>Construct: memory retention. Operational outcome: number of 20 target definitions recalled correctly after 48 hours using a prespecified scoring rubric.</p>",
        "warning_html": "<strong>Pseudoreplication</strong><ul><li>Repeated measurements are not automatically independent observations.</li><li>Multiple leaves on one plant, students within one class, or trials from one participant may create nested or repeated data.</li><li>Use the Methods Lab to separate independent units, repeats, and subsamples before choosing statistics.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.11.guidance",
      "type": "stage_guidance",
      "location": "Stage 11 · Plan sampling, measurement, validity, and ethics",
      "phase": "design",
      "phase_label": "Phase 3 · Design the study",
      "stage_id": 11,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Plan sampling, measurement, validity, and ethics",
        "nav": "Sampling and measurement",
        "purpose": "Decide who or what will provide evidence, how constructs will be measured, and how the study will protect validity, reliability, privacy, safety, and participants.",
        "learn_html": "\r\n        <h3>Population, sample, and unit are different</h3>\r\n        <p>The population is the broader group you want to understand. The sample is what you actually study. The unit of analysis is what each analyzed observation represents.</p>\r\n        <h3>Sampling affects generalization</h3>\r\n        <p>Convenience sampling may be entirely reasonable for a classroom project, but it limits how far results can be generalized. Random assignment and random sampling solve different problems. Random assignment strengthens causal comparisons. Probability sampling supports population inference.</p>\r\n        <h3>Measurement quality</h3>\r\n        <ul>\r\n          <li><strong>Reliability.</strong> Does the procedure produce sufficiently consistent measurements?</li>\r\n          <li><strong>Validity.</strong> Does the measure support the interpretation you want to make from the score or observation?</li>\r\n          <li><strong>Calibration/precision.</strong> Are tools accurate enough for the expected effect?</li>\r\n          <li><strong>Blinding.</strong> Could knowledge of condition influence measurement or scoring?</li>\r\n        </ul>\r\n        <div class=\"concept-box\"><strong>Human participants</strong><br>Surveys, interviews, identifiable observations, existing student records, audio/video, health information, or interventions involving people can require consent, privacy safeguards, school approval, and sometimes formal ethics review. Student projects should not assume that classroom access equals research permission.</div>",
        "example_html": "<strong>Example</strong><p>A convenience sample of one class can answer a local classroom question, but the paper should not claim that the result represents all teenagers.</p>",
        "warning_html": "<strong>Ethics is part of design</strong><ul><li>Do not collect sensitive data simply because it would be interesting.</li><li>Avoid unnecessary identifiers.</li><li>Participants must not be coerced by grades, authority, or peer pressure.</li><li>The Methods Lab separates sampling, recruitment, consent/assent, authority, privacy, storage, and procedure-specific risk.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.12.guidance",
      "type": "stage_guidance",
      "location": "Stage 12 · Write the method and lock the data plan",
      "phase": "design",
      "phase_label": "Phase 3 · Design the study",
      "stage_id": 12,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Write the method and lock the data plan",
        "nav": "Method and protocol",
        "purpose": "Create a procedure detailed enough that another researcher could understand what was done, then predefine how data will be recorded, cleaned, and analyzed before looking at the final results.",
        "learn_html": "\r\n        <h3>Methods should make the study auditable</h3>\r\n        <p>A strong Method section usually explains participants or units, materials/instruments, design, variables or coding structure, procedure, and planned analysis. Exact headings vary by discipline.</p>\r\n        <h3>Design the data table before collecting data</h3>\r\n        <p>Ask two questions. What does one row represent? What does each column represent? If those answers are unclear, the data structure is not ready.</p>\r\n        <div class=\"concept-box\"><strong>Data dictionary</strong><br>For every variable, record the name, definition, type, units or categories, allowed range, missing-value code, and how it is measured.</div>\r\n        <h3>Predefine analytic decisions</h3>\r\n        <ul>\r\n          <li>Primary outcome and primary comparison.</li>\r\n          <li>Missing-data handling.</li>\r\n          <li>Outlier or exclusion rules.</li>\r\n          <li>Planned descriptive statistics and graphs.</li>\r\n          <li>Candidate inferential analysis and assumptions, if warranted.</li>\r\n        </ul>\r\n        <p>If the plan changes after seeing the data, document the change. Exploratory analyses are legitimate when labeled as exploratory.</p>",
        "example_html": "<strong>Replication test</strong><p>Give your procedure to a classmate. If they cannot tell what to measure, when to measure it, how many trials to perform, or what counts as a valid observation, the method needs more detail.</p>",
        "warning_html": "<strong>Do not write the analysis plan after seeing which test gives p &lt; .05</strong><ul><li>Choose analyses from the question, design, variable types, and assumptions.</li><li>Keep raw data unchanged and document cleaning decisions.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.13.guidance",
      "type": "stage_guidance",
      "location": "Stage 13 · Collect, clean, visualize, and describe data",
      "phase": "analyze",
      "phase_label": "Phase 4 · Collect and analyze",
      "stage_id": 13,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Collect, clean, visualize, and describe data",
        "nav": "Data quality and descriptives",
        "purpose": "Protect the raw record, check data quality, and understand the evidence before running formal tests.",
        "learn_html": "\r\n        <h3>Raw data first</h3>\r\n        <p>Keep an unchanged raw-data file. Create a separate cleaned dataset with a record of every correction, exclusion, recoding decision, and derived variable.</p>\r\n        <h3>Before inferential statistics</h3>\r\n        <ol>\r\n          <li>Check IDs and duplicates.</li>\r\n          <li>Check impossible values and units.</li>\r\n          <li>Inspect missingness and protocol deviations.</li>\r\n          <li>Plot the data in a way that preserves the design structure.</li>\r\n          <li>Compute descriptive statistics appropriate to variable type.</li>\r\n          <li>Look for outliers, ceiling/floor effects, skew, clustering, and repeated observations.</li>\r\n        </ol>\r\n        <div class=\"concept-box\"><strong>Descriptive statistics depend on data type</strong><br>Numerical data may use mean/SD and median/IQR. Categorical data use counts and proportions. Paired and repeated data should preserve within-unit relationships. Qualitative evidence requires a transparent corpus and coding trail.</div>",
        "example_html": "<strong>Example</strong><p>For a paired study, do not show only two separate bar means. A paired dot or line plot reveals whether the same participants improved, declined, or varied across conditions.</p>",
        "warning_html": "<strong>Data cleaning is not result improvement</strong><ul><li>Do not remove an outlier because it weakens the effect.</li><li>Do not replace missing observations with invented values.</li><li>Do not silently change units or categories.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.14.guidance",
      "type": "stage_guidance",
      "location": "Stage 14 · Choose and justify the data analysis",
      "phase": "analyze",
      "phase_label": "Phase 4 · Collect and analyze",
      "stage_id": 14,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Choose and justify the data analysis",
        "nav": "Statistical analysis",
        "purpose": "Select analysis from the research question, design structure, outcome type, and assumptions. Statistical significance is one part of interpretation, not the goal of the study.",
        "learn_html": "\r\n        <h3>Start with the estimand, not the test name</h3>\r\n        <p>First ask what quantity answers the research question. A mean difference? A paired change? A proportion difference? An association? A slope? A theme? The test follows from that structure.</p>\r\n        <h3>Core interpretation</h3>\r\n        <ul>\r\n          <li>Report effect magnitude in meaningful units when possible.</li>\r\n          <li>Use an effect size appropriate to the design.</li>\r\n          <li>Describe uncertainty with confidence intervals when appropriate.</li>\r\n          <li>A p-value measures compatibility of the observed data with a specified null model under its assumptions. It is not the probability that your hypothesis is true and does not measure practical importance.</li>\r\n          <li>A non-significant result is not proof of “no effect.” Consider the estimate, interval, power/precision, and study limitations.</li>\r\n        </ul>\r\n        <div class=\"concept-box\"><strong>Assumptions are design-specific</strong><br>Independence comes from the study design. For a paired t-test, normality concerns the difference scores, not each condition separately. Equal variance is not required for Welch's two-sample t-test. Regression assumptions concern residuals and model form. Do not choose a test from a normality test alone.</div>",
        "example_html": "<strong>Example</strong><p>Two independent groups with a continuous outcome → compare distributions and means; Welch's t-test is a strong default when mean comparison is appropriate because it does not require equal population variances. Report the raw mean difference, CI, and an effect size.</p>",
        "warning_html": "<strong>Statistical red flags</strong><ul><li>Running many tests until something is significant.</li><li>Treating repeated observations as independent.</li><li>Using percentages as if they were raw counts in chi-square.</li><li>Choosing Pearson versus Spearman solely from a normality p-value.</li><li>Reporting p without magnitude or context.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.15.guidance",
      "type": "stage_guidance",
      "location": "Stage 15 · Write the Results section",
      "phase": "analyze",
      "phase_label": "Phase 4 · Collect and analyze",
      "stage_id": 15,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Write the Results section",
        "nav": "Results",
        "purpose": "Report what the analysis produced in a traceable, neutral way. Keep explanation and implications for the Discussion.",
        "learn_html": "\r\n        <h3>Results answer “What did the evidence show?”</h3>\r\n        <p>Every reported number, table, figure, code, or theme should trace back to the dataset or analysis output.</p>\r\n        <h3>Recommended sequence</h3>\r\n        <ol>\r\n          <li>Describe the analyzed sample or corpus and exclusions.</li>\r\n          <li>Report descriptive statistics and data-quality information relevant to interpretation.</li>\r\n          <li>Present figures and tables that directly address the question.</li>\r\n          <li>Report primary statistical or qualitative results with complete information.</li>\r\n          <li>Report weak, null, unexpected, and contradictory findings as transparently as favorable findings.</li>\r\n        </ol>\r\n        <div class=\"concept-box\"><strong>Quantitative reporting</strong><br>Include the estimate or raw difference, units, uncertainty interval when appropriate, test statistic and degrees of freedom when a test is used, p-value, and effect size where meaningful. The exact reporting format depends on analysis.</div>\r\n        <div class=\"concept-box\"><strong>Qualitative reporting</strong><br>Explain the analytic approach, themes/codes, prevalence carefully if counted, and representative evidence. Keep a traceable codebook and do not turn qualitative frequency counts into unsupported population statistics.</div>",
        "example_html": "<strong>Correlational wording</strong><p>“Screen time and sleep duration were negatively associated in the analyzed sample…” not “Screen time reduced sleep.”</p>",
        "warning_html": "<strong>Keep Results separate</strong><ul><li>Do not explain mechanisms here if your course separates Results and Discussion.</li><li>Do not hide non-significant or small results.</li><li>Do not duplicate every table value in prose.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.16.guidance",
      "type": "stage_guidance",
      "location": "Stage 16 · Write the Discussion and limitations",
      "phase": "write",
      "phase_label": "Phase 5 · Write and audit",
      "stage_id": 16,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Write the Discussion and limitations",
        "nav": "Discussion",
        "purpose": "Answer the research question, explain what the findings may mean, compare them with prior literature, evaluate alternative explanations, and state exactly how far the claims can go.",
        "learn_html": "\r\n        <h3>Discussion converts results into warranted claims</h3>\r\n        <ol>\r\n          <li>Answer the research question directly.</li>\r\n          <li>Interpret the most important findings without simply repeating numbers.</li>\r\n          <li>Explain plausible mechanisms and alternative explanations.</li>\r\n          <li>Compare the findings with prior research.</li>\r\n          <li>Analyze limitations by explaining how each one changes interpretation.</li>\r\n          <li>Discuss generalizability, practical or theoretical implications, and future research.</li>\r\n        </ol>\r\n        <div class=\"concept-box\"><strong>Limitation ≠ apology</strong><br>A useful limitation statement identifies a feature of the design, explains the direction or type of uncertainty it creates, and shows how a future study could address it.</div>\r\n        <p>For correlational work, explicitly consider confounding and reverse causation. For experiments, examine assignment, control, adherence, expectancy, measurement, attrition, and generalization. For qualitative work, discuss sampling, reflexivity, coding decisions, credibility, and transferability. For reviews, discuss search coverage, study quality, heterogeneity, and publication bias where relevant.</p>",
        "example_html": "<strong>Strong limitation logic</strong><p>“Because study condition was confounded with time of day, the observed difference cannot be attributed uniquely to the intervention. A future counterbalanced design would separate these explanations.”</p>",
        "warning_html": "<strong>Overclaiming</strong><ul><li>Statistical significance does not turn an observational study into an experiment.</li><li>A large effect in one small convenience sample does not guarantee a population effect.</li><li>Do not claim a mechanism you did not measure as if it were observed.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.17.guidance",
      "type": "stage_guidance",
      "location": "Stage 17 · Write the conclusion, abstract, title, and keywords",
      "phase": "write",
      "phase_label": "Phase 5 · Write and audit",
      "stage_id": 17,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Write the conclusion, abstract, title, and keywords",
        "nav": "Conclusion and abstract",
        "purpose": "Finish the paper by compressing the study accurately. The conclusion closes the argument. The abstract gives a stand-alone summary of the full paper and is usually written last.",
        "learn_html": "\r\n        <h3>Conclusion</h3>\r\n        <p>A conclusion should synthesize the answer, strongest evidence, main boundary, and reasonable implication without adding new results or new literature.</p>\r\n        <h3>Abstract</h3>\r\n        <p>Write the abstract after the paper is stable. In most empirical research papers it briefly states the problem or purpose, method/design and sample or system, most important results, and main conclusion. Exact length and structure depend on the assignment or journal.</p>\r\n        <p>Abstracts generally avoid detailed calculations, long literature reviews, unexplained abbreviations, and citations unless a discipline or assignment specifically requires them.</p>\r\n        <h3>Title</h3>\r\n        <p>A strong title identifies the central variables/phenomenon, population or context when useful, and sometimes the design. It should be informative without claiming more than the study established.</p>",
        "example_html": "<strong>Title example</strong><p>“Retrieval Practice and 48-Hour Biology Vocabulary Recall in a Repeated Within-Student Classroom Study” communicates more than “The Effects of Studying.”</p>",
        "warning_html": "<strong>Abstract warning</strong><ul><li>Do not report results that do not appear in the paper.</li><li>Do not write “proved” or “definitively demonstrated.”</li><li>Do not introduce a new recommendation in the conclusion.</li></ul>"
      }
    },
    {
      "key": "curriculum.stage.18.guidance",
      "type": "stage_guidance",
      "location": "Stage 18 · Citations, references, and final alignment audit",
      "phase": "write",
      "phase_label": "Phase 5 · Write and audit",
      "stage_id": 18,
      "revision": "seed-v2.17.1",
      "published": true,
      "value": {
        "title": "Citations, references, and final alignment audit",
        "nav": "Citations and final audit",
        "purpose": "Verify that every claim is supported, every source is real and traceable, citation style is consistent, and the question, design, data, analysis, results, and conclusion all align.",
        "learn_html": "\r\n        <h3>Citation integrity comes before formatting</h3>\r\n        <ul>\r\n          <li>A citation should support the exact nearby claim.</li>\r\n          <li>Paraphrasing still requires citation.</li>\r\n          <li>Direct quotations require quotation formatting and a locator such as a page number when the style calls for it.</li>\r\n          <li>Every in-text citation should have a matching reference entry and vice versa.</li>\r\n          <li>Verify references against the original source. Never trust an AI-generated reference without checking it.</li>\r\n        </ul>\r\n        <h3>APA 7 essentials for this studio</h3>\r\n        <p>Use author–date in-text citations. Two authors are named in each citation. For three or more authors, APA 7 normally uses the first author plus “et al.” from the first citation. Journal references typically include authors, year, article title, journal title, volume, issue when applicable, pages or article number, and DOI as a URL when available.</p>\r\n        <div class=\"concept-box\"><strong>Final alignment question</strong><br>Could a reader start with your research question and trace a continuous logical path through the variables/constructs, method, dataset, analysis, results, and final claim?</div>",
        "example_html": "<strong>APA in-text examples</strong><p>Narrative: Chen and Lee (2024) … &nbsp; Parenthetical: (Chen & Lee, 2024). Three or more authors: Chen et al. (2024).</p>",
        "warning_html": "<strong>Final integrity check</strong><ul><li>No fabricated references.</li><li>No citation attached to a claim the paper does not support.</li><li>No causal language beyond the design.</li><li>No p-value interpreted as effect size or probability the hypothesis is true.</li></ul>"
      }
    }
  ]
};

  return deepFreeze(registry);
})();
