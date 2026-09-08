
window.RMSCurriculum = (() => {
  const phases = [
    {id:"discover",label:"Phase 1 · Discover",steps:[1,2,3,4]},
    {id:"literature",label:"Phase 2 · Build the evidence base",steps:[5,6,7,8]},
    {id:"design",label:"Phase 3 · Design the study",steps:[9,10,11,12]},
    {id:"analyze",label:"Phase 4 · Collect and analyze",steps:[13,14,15]},
    {id:"write",label:"Phase 5 · Write and audit",steps:[16,17,18]}
  ];

  const stages = [
    {
      id:1, phase:"discover", title:"Find your research interests",
      nav:"Research interests",
      purpose:"Start with questions you genuinely care about. A good project begins with curiosity, a problem, a pattern, or an unresolved explanation, not with a statistical test.",
      learn:`
        <h3>Research starts before the research question</h3>
        <p>Your first job is to generate possible areas of inquiry. Look for topics that are interesting enough to sustain weeks of work and concrete enough that evidence could eventually be collected.</p>
        <div class="concept-box"><strong>Four productive starting points</strong><br>
        A phenomenon you want to explain · a problem you want to understand · a claim you are unsure about · a pattern you have noticed.</div>
        <p>Do not force yourself to identify an independent variable yet. Some strong projects are descriptive, correlational, qualitative, or literature-based and may never manipulate a variable.</p>
        <h3>Interest inventory</h3>
        <ul>
          <li>What science topics make you keep reading after class?</li>
          <li>What real-world problems feel unresolved or poorly understood?</li>
          <li>What claims do people repeat that you would like to check with evidence?</li>
          <li>What patterns have you noticed in school, nature, technology, health, behavior, or your community?</li>
          <li>What tools, datasets, organisms, materials, or settings can you realistically access?</li>
        </ul>`,
      example:`<strong>Example</strong><p>Broad interest: memory. Observation: I remember vocabulary differently depending on how I study. Possible research direction: compare study procedures using delayed recall.</p>`,
      warning:`<strong>Avoid this trap</strong><ul><li>Choosing a topic only because it sounds impressive.</li><li>Beginning with “I need to use ANOVA.”</li><li>Choosing a topic that requires unsafe procedures or inaccessible equipment.</li></ul>`,
      custom:"interestCompass",
      sections:[
        {title:"Interest inventory",desc:"Write freely. These are idea seeds, not final topics.",fields:[
          ["interest1","Three science or research areas I enjoy","textarea"],
          ["problem1","A problem or pattern I have noticed","textarea"],
          ["claim1","A claim I would like to investigate","textarea"],
          ["access1","Resources, settings, people, organisms, tools, or datasets I can realistically access","textarea"]
        ]},
        {title:"Generate possibilities",desc:"Create at least three possible directions before choosing one.",fields:[
          ["ideaA","Possible direction A","textarea"],["ideaB","Possible direction B","textarea"],["ideaC","Possible direction C","textarea"]
        ]}
      ],
      checks:["I generated multiple possibilities before committing.","At least one idea can plausibly be investigated with evidence.","I have not selected a method or statistic merely because it sounds advanced."]
    },
    {
      id:2, phase:"discover", title:"Narrow a topic and test feasibility",
      nav:"Narrow the topic",
      purpose:"Turn a broad interest into a manageable research topic by specifying the phenomenon, context, population or system, and realistic scope.",
      learn:`
        <h3>Topic is broader than question</h3>
        <p>A research topic names the area you will study. Your research question will later define the exact evidence you need.</p>
        <div class="concept-box"><strong>Narrowing sequence</strong><br>Broad area → subtopic → phenomenon or problem → context/population/system → measurable or analyzable angle.</div>
        <h3>Use a feasibility filter</h3>
        <ul>
          <li><strong>Interest.</strong> Will you remain curious after the first week?</li>
          <li><strong>Relevance.</strong> Is there a scientific, practical, theoretical, or local reason to ask?</li>
          <li><strong>Feasibility.</strong> Can you obtain the evidence, time, equipment, participants, or sources?</li>
          <li><strong>Ethics and safety.</strong> Can the study be done without unacceptable risk or inappropriate use of people or data?</li>
          <li><strong>Scope.</strong> Can one student project answer a useful part of the problem?</li>
        </ul>
        <p>A small, well-designed question is stronger than a huge question with weak evidence.</p>`,
      example:`<strong>Example</strong><p>Too broad: social media and teenagers. Better topic: short-form video use and bedtime routines among students in one school context. The final question still comes later.</p>`,
      warning:`<strong>Scope warning</strong><ul><li>“Climate change,” “cancer,” or “AI and society” are fields, not manageable student projects.</li><li>Do not claim your project will solve a global problem.</li></ul>`,
      sections:[
        {title:"Narrowing map",desc:"Define the boundaries of the topic.",fields:[
          ["broadTopic","Broad area","text"],["subtopic","Specific subtopic","text"],["phenomenon","Phenomenon, relationship, experience, or problem","textarea"],["contextPop","Population, system, organism, setting, or context","textarea"],["scope","What part of the issue I can realistically study","textarea"]
        ]},
        {title:"Feasibility check",desc:"Be realistic before investing heavily in the topic.",fields:[
          ["timeLimit","Time available","text"],["resources","Equipment/data/source access","textarea"],["safety","Safety or ethics concerns I can already see","textarea"],["topicChoice","Working research topic","textarea"]
        ]}
      ],
      checks:["My topic is narrower than a field such as biology, psychology, or climate change.","I can identify a realistic source of evidence.","The topic appears safe and feasible within my course timeline."]
    },
    {
      id:3, phase:"discover", title:"Explore the research landscape",
      nav:"Preliminary background scan",
      purpose:"Do a small background scan before locking the question. Learn the language researchers use, discover how the topic has been studied, and identify what evidence is realistically available.",
      learn:`
        <h3>Preliminary search is reconnaissance</h3>
        <p>You are not writing the literature review yet. You are learning enough to avoid designing a question that is already poorly framed, impossible to measure, or disconnected from the field.</p>
        <ul>
          <li>Identify 2–4 core concepts in your topic.</li>
          <li>Build a synonym bank for each concept.</li>
          <li>Try several search strings, not one.</li>
          <li>Read abstracts and methods from a few strong papers.</li>
          <li>Record how researchers define and measure the main constructs.</li>
          <li>Notice repeated limitations, disagreements, populations, and methods.</li>
        </ul>
        <div class="concept-box"><strong>Important distinction</strong><br>A “research gap” is not something you invent to make a project sound novel. It is a claim about the existing literature and must be supported by what you actually found. A student project may also be justified as a replication, local application, classroom-scale investigation, or methodological exercise without claiming worldwide novelty.</div>`,
      example:`<strong>Search example</strong><p>Concepts: retrieval practice · delayed recall · biology vocabulary. Synonyms: practice testing, active recall, memory retention, delayed retention. Search strings can combine these with AND/OR.</p>`,
      warning:`<strong>Do not lock the question too early</strong><ul><li>Preliminary reading may reveal that your original variable has no feasible measure.</li><li>A paper can suggest a method without proving that method is appropriate for your study.</li></ul>`,
      sections:[
        {title:"Search language",desc:"Extract the vocabulary of the field.",fields:[
          ["concepts","Core concepts","textarea"],["synonyms","Synonyms and related terms","textarea"],["prelimSearch","Two or three preliminary search strings","textarea"]
        ]},
        {title:"What the scan taught me",desc:"Record what changed in your understanding.",fields:[
          ["known","What appears reasonably well established","textarea"],["methodsSeen","Methods or measurements used in existing studies","textarea"],["uncertain","What appears uncertain, inconsistent, underexplored, or context-dependent","textarea"],["questionShift","How my possible question changed after reading","textarea"]
        ]}
      ],
      checks:["I searched using more than one wording.","I looked at how researchers actually measured the key concepts.","I am not claiming a gap that I have not verified."]
    },
    {
      id:4, phase:"discover", title:"Write and refine the research question",
      nav:"Research question",
      purpose:"Create a focused question whose wording matches the kind of evidence you can collect and the kind of conclusion your design could support.",
      learn:`
        <h3>The research question controls the rest of the study</h3>
        <p>A strong question is specific enough to determine what evidence is needed without predetermining the answer.</p>
        <h3>Common question families</h3>
        <ul>
          <li><strong>Descriptive.</strong> What is present, how much, how often, or how is it distributed?</li>
          <li><strong>Correlational or associational.</strong> How are two measured variables related?</li>
          <li><strong>Experimental.</strong> How does deliberately changing X affect Y under defined conditions?</li>
          <li><strong>Qualitative.</strong> How do people describe, explain, experience, or interpret something?</li>
          <li><strong>Review.</strong> What does the existing literature collectively say about a defined question?</li>
          <li><strong>Meta-analysis.</strong> What is the pooled quantitative effect across sufficiently comparable studies? This is advanced.</li>
        </ul>
        <div class="concept-box"><strong>Wording matters</strong><br>Observational questions should usually use terms such as association, relationship, difference, pattern, or prediction. Causal words such as effect, causes, increases, reduces, or leads to require a design that can support causal inference.</div>
        <p>The question should identify the outcome or phenomenon, the comparison or predictor when relevant, and the population/system/context when that boundary matters.</p>`,
      example:`<strong>Refinement example</strong><p>Weak: Does music help people study? Better experimental question: How does instrumental background music compared with silence affect reading-comprehension accuracy during 20-minute sessions among students under the tested conditions?</p>`,
      warning:`<strong>Question problems</strong><ul><li>Leading questions that assume the result.</li><li>Terms such as “better,” “successful,” or “healthy” with no definition.</li><li>Questions that require data you cannot obtain.</li><li>Causal wording for correlational designs.</li></ul>`,
      sections:[
        {title:"Draft several versions",desc:"Variation helps expose hidden assumptions.",fields:[
          ["rq1","Draft question 1","textarea"],["rq2","Draft question 2","textarea"],["rq3","Draft question 3","textarea"]
        ]},
        {title:"Lock the working question",desc:"You may revise it later, but record the reason.",fields:[
          ["questionType","Question family","select",["Descriptive","Correlational / observational","Experimental","Qualitative","Literature review","Meta-analysis","Mixed methods / unsure"]],
          ["finalRQ","Working research question","textarea"],["rqJustification","Why this question is feasible, ethical, and answerable with evidence","textarea"]
        ]}
      ],
      checks:["The question can be answered with evidence I can realistically obtain.","Key vague terms have been defined or will be operationalized.","The wording does not claim causation unless my design could support it.","The question does not assume the answer."]
    },
    {
      id:5, phase:"literature", title:"Build a systematic search strategy",
      nav:"Literature search",
      purpose:"Search deliberately enough that your literature review represents the topic rather than only the first papers returned by a search engine.",
      learn:`
        <h3>Turn the question into searchable concepts</h3>
        <p>Break the research question into concept blocks. Build synonyms inside each block and connect concepts with Boolean operators.</p>
        <div class="concept-box"><strong>Pattern</strong><br>("concept A" OR synonym OR synonym) AND ("concept B" OR synonym) AND (population OR context)</div>
        <h3>Search in layers</h3>
        <ol>
          <li>Use a broad scholarly index to learn the vocabulary.</li>
          <li>Use a subject database for stronger field coverage.</li>
          <li>Use citation chaining from a strong anchor paper.</li>
          <li>Record your search terms and inclusion decisions.</li>
        </ol>
        <p>Google Scholar can be a starting point. Depending on the field, students may also use PubMed, ERIC, PsycINFO, Web of Science, Scopus, IEEE Xplore, JSTOR, or reputable government and institutional datasets.</p>`,
      example:`<strong>Example</strong><p>("retrieval practice" OR "practice testing" OR "active recall") AND ("delayed recall" OR retention) AND (adolescent* OR "high school")</p>`,
      warning:`<strong>Search quality</strong><ul><li>One search string is not comprehensive.</li><li>“Recent” does not automatically mean “better.” Foundational sources may be older.</li><li>Do not use a source simply because it supports your prediction.</li></ul>`,
      custom:"searchBuilder",
      sections:[
        {title:"Concept blocks",desc:"Make your search reproducible.",fields:[
          ["searchBlock1","Concept block 1 and synonyms","textarea"],["searchBlock2","Concept block 2 and synonyms","textarea"],["searchBlock3","Population/context block if relevant","textarea"],["searchStrings","Final Boolean search strings","textarea"]
        ]},
        {title:"Search plan",desc:"Record where and what you will keep.",fields:[
          ["databases","Databases/search tools I will use","textarea"],["includeCriteria","Inclusion criteria","textarea"],["excludeCriteria","Exclusion criteria","textarea"],["searchLog","Search log or dates searched","textarea"]
        ]}
      ],
      checks:["I have at least two search strings or search routes.","I defined what makes a source relevant enough to keep.","I will record enough information to reproduce my search decisions."]
    },
    {
      id:6, phase:"literature", title:"Evaluate, read, and extract sources",
      nav:"Source evaluation",
      purpose:"Read research as evidence. Record design, sample, measures, findings, limitations, and relevance so later synthesis is traceable.",
      learn:`
        <h3>Peer review is useful, but it is not a quality guarantee</h3>
        <p>Evaluate whether a source is appropriate for your particular claim. Consider recency when it matters, relevance, author and venue, methods, measurement quality, sample, transparency, conflicts of interest, and whether the conclusions match the design.</p>
        <h3>Read papers structurally</h3>
        <ul>
          <li><strong>Introduction.</strong> What problem and theoretical context are established?</li>
          <li><strong>Methods.</strong> Who or what was studied, how were constructs measured, and what design was used?</li>
          <li><strong>Results.</strong> What evidence was actually produced?</li>
          <li><strong>Discussion.</strong> How do the authors interpret it, and what limitations do they acknowledge?</li>
        </ul>
        <div class="concept-box"><strong>Extraction rule</strong><br>Keep a distinction between what the authors measured, what they observed, and what they concluded. Your notes should make it possible to verify every later literature claim.</div>`,
      example:`<strong>Source note</strong><p>Design: correlational survey. Sample: n = 420 secondary students. Measures: validated well-being scale and self-reported activity hours. Finding: small positive association. Limits: cross-sectional, self-report, possible confounding.</p>`,
      warning:`<strong>Avoid source-by-source thinking</strong><ul><li>Your literature review should not become “Study A said… Study B said… Study C said…”</li><li>Do not copy sentences into notes without marking them as direct quotations.</li></ul>`,
      custom:"sourceManager",
      sections:[],
      checks:["For my key sources, I recorded design, sample/context, measures, findings, and limitations.","I can distinguish original study results from the authors' interpretation.","Direct quotations are clearly marked so I will not accidentally paraphrase too closely."]
    },
    {
      id:7, phase:"literature", title:"Synthesize the literature and justify the study",
      nav:"Synthesis and gap",
      purpose:"Move from individual papers to patterns across papers. Identify convergence, disagreement, methodological limitations, and the precise reason your study is worth doing.",
      learn:`
        <h3>Synthesis asks what the literature says collectively</h3>
        <p>Group evidence by themes, mechanisms, methods, populations, theoretical positions, or patterns in findings. Compare sources inside paragraphs.</p>
        <ul>
          <li>Where do studies converge?</li>
          <li>Where do findings conflict?</li>
          <li>Do different methods produce different answers?</li>
          <li>Which populations, contexts, timeframes, or measures dominate the evidence?</li>
          <li>Which limitations repeat across studies?</li>
        </ul>
        <h3>Choose an honest justification</h3>
        <p>Your project may address a documented literature gap, reproduce a known result in a new context, compare methods, extend a finding, resolve an inconsistency, or investigate a local question. Do not imply that “no research exists” unless your search can support that claim.</p>`,
      example:`<strong>Synthesis example</strong><p>Several studies report a benefit of retrieval practice for delayed retention, but they differ in learner age, material type, feedback timing, and delay interval. A student project might therefore test one clearly bounded version under local classroom conditions without claiming to settle the wider literature.</p>`,
      warning:`<strong>Common failure</strong><ul><li>Calling any limitation a “gap.”</li><li>Claiming novelty from a quick Google Scholar search.</li><li>Treating disagreement as proof that one study is wrong.</li></ul>`,
      custom:"synthesisMatrix",
      sections:[
        {title:"Evidence map",desc:"Synthesize across sources.",fields:[
          ["theme1","Theme or convergence 1","textarea"],["theme2","Theme or convergence 2","textarea"],["theme3","Theme or convergence 3","textarea"],["tensions","Contradictions, tensions, or boundary conditions","textarea"],["repeatedLimits","Repeated methodological limitations","textarea"]
        ]},
        {title:"Study justification",desc:"State exactly what your project contributes at its real scale.",fields:[
          ["gapType","Best description","select",["Documented literature gap","Replication","Extension to a new context/population","Method comparison","Resolve or explore inconsistent findings","Local/practical question","Learning-focused investigation","Other"]],
          ["gapStatement","Precise justification or gap statement","textarea"],["litToRQ","How the literature leads to my research question","textarea"]
        ]}
      ],
      checks:["My synthesis contains patterns across multiple sources.","My study justification is supported by the literature I actually reviewed.","I have not confused a limitation with proof of a research gap."]
    },
    {
      id:8, phase:"literature", title:"Write the literature review",
      nav:"Literature review",
      purpose:"Build a coherent explanation of what is known, how the evidence fits together, what remains uncertain, and how that reasoning leads to your study.",
      learn:`
        <h3>A literature review is synthesis, not an annotated bibliography</h3>
        <p>Most paragraphs should organize sources around an idea or problem, then compare the evidence. The exact structure depends on discipline and assignment.</p>
        <h3>Useful structures</h3>
        <ul>
          <li><strong>Thematic.</strong> Organize around recurring concepts or mechanisms.</li>
          <li><strong>Methodological.</strong> Compare what different designs or measures reveal.</li>
          <li><strong>Chronological.</strong> Use when the development of an idea over time is itself informative.</li>
          <li><strong>Theoretical.</strong> Compare models or explanatory frameworks.</li>
        </ul>
        <div class="concept-box"><strong>Paragraph logic</strong><br>Claim about the literature → evidence from multiple sources → comparison or qualification → implication for the topic or your study.</div>
        <p>In some scientific papers, the literature review is integrated into the Introduction. In some courses, it is a separate section. Follow your assignment while keeping the same synthesis principles.</p>`,
      example:`<strong>Weak versus stronger</strong><p>Weak: “Smith studied X. Lee studied X. Park studied X.” Stronger: “Across three studies, X was consistently associated with Y, although the magnitude was smaller in samples using measure Z (citations).”</p>`,
      warning:`<strong>Citation integrity</strong><ul><li>Every citation must actually support the nearby claim.</li><li>Do not cite a review as if you personally checked every primary study it summarizes.</li><li>Never invent a reference or DOI.</li></ul>`,
      sections:[
        {title:"Literature review outline",desc:"Plan the argument before drafting.",fields:[
          ["litIntroPlan","Opening, scope, and key definitions","textarea"],["litThemePlan","Theme sequence and sources under each theme","textarea"],["litTensionPlan","Where disagreement or limitations will appear","textarea"],["litEndPlan","How the review will lead to the study purpose/question","textarea"]
        ]},
        {title:"Drafting workspace",desc:"Write in your own words, then verify every claim and citation.",fields:[
          ["litDraft","Literature review draft","textarea"]
        ]}
      ],
      checks:["The review is organized by ideas rather than one paragraph per source.","Important claims are supported with appropriate citations.","The final part of the review logically leads to the study purpose and question."]
    },
    {
      id:9, phase:"design", title:"Choose the research design",
      nav:"Research design",
      purpose:"Match the design to the question. Different questions require different evidence, and not every study is an experiment.",
      learn:`
        <h3>Method follows question</h3>
        <ul>
          <li><strong>Descriptive.</strong> Characterize one or more features without testing a causal explanation.</li>
          <li><strong>Correlational/observational.</strong> Measure variables without assigning the exposure and examine association.</li>
          <li><strong>Experimental.</strong> Manipulate an independent variable and compare outcomes under conditions designed to reduce alternative explanations.</li>
          <li><strong>Quasi-experimental.</strong> Compare an intervention or naturally formed conditions without full random assignment.</li>
          <li><strong>Qualitative.</strong> Investigate meaning, experience, process, or explanation using textual or observational evidence.</li>
          <li><strong>Mixed methods.</strong> Combine qualitative and quantitative components because each answers a different part of the question.</li>
          <li><strong>Literature review.</strong> Synthesize existing studies without statistically pooling effects.</li>
          <li><strong>Meta-analysis.</strong> Quantitatively combine comparable effect estimates using a defensible synthesis model.</li>
        </ul>
        <div class="concept-box"><strong>Causal caution</strong><br>Manipulation alone does not guarantee strong causal inference. Assignment, comparison conditions, confounding, measurement, adherence, attrition, and implementation all affect what can be concluded.</div>`,
      example:`<strong>Example</strong><p>Question: “Is weekly study time associated with exam score?” → observational correlational design. Question: “How does assigned retrieval practice versus rereading affect delayed recall?” → experimental or quasi-experimental design depending on assignment and control.</p>`,
      warning:`<strong>Design mismatch</strong><ul><li>Do not label measured exposure as an “independent variable” if you did not manipulate it; predictor or exposure is often clearer.</li><li>Do not force qualitative questions into IV/DV language.</li></ul>`,
      custom:"designMatcher",
      sections:[
        {title:"Design choice",desc:"Select the family that best matches the final research question.",fields:[
          ["designType","Primary design","select",["Descriptive","Correlational / observational","Experimental","Quasi-experimental","Qualitative","Mixed methods","Literature review","Meta-analysis","Undecided"]],
          ["designWhy","Why this design can answer my question","textarea"],["comparisonStructure","What is compared or observed, if anything","textarea"],["claimBoundary","What this design will and will not allow me to claim","textarea"]
        ]}
      ],
      checks:["My design directly addresses the wording of my research question.","I understand whether I am manipulating an exposure or only measuring it.","I have stated an appropriate boundary on causal interpretation."]
    },
    {
      id:10, phase:"design", title:"Define hypotheses, variables, controls, and experimental units",
      nav:"Hypothesis and variables",
      purpose:"Translate the question into precise constructs and, when appropriate, predictions. Learn the difference among independent variables, predictors, outcomes, controlled conditions, control groups, covariates, confounders, and experimental units.",
      learn:`
        <h3>A hypothesis is not mandatory for every study</h3>
        <p>Directional hypotheses are useful when theory or prior evidence supports a prediction in a quantitative confirmatory study. Exploratory, descriptive, qualitative, and many review questions may not need a formal hypothesis.</p>
        <h3>Variable language</h3>
        <ul>
          <li><strong>Independent variable.</strong> A factor deliberately manipulated in an experiment.</li>
          <li><strong>Predictor/exposure.</strong> A measured variable used to explain or predict an outcome in observational work.</li>
          <li><strong>Dependent/outcome variable.</strong> The response you measure.</li>
          <li><strong>Controlled conditions.</strong> Features intentionally standardized across experimental conditions. “Constants” is a common classroom term, but controlled condition is usually more precise.</li>
          <li><strong>Control group/condition.</strong> A comparison condition that provides a reference. This is different from a controlled variable.</li>
          <li><strong>Covariate/confounder.</strong> A measured or unmeasured factor related to the exposure and outcome that can complicate interpretation.</li>
          <li><strong>Experimental unit.</strong> The smallest unit independently assigned to a treatment. Ten seeds in one treated pot are not automatically ten independent experimental units.</li>
        </ul>
        <div class="concept-box"><strong>Operational definition</strong><br>Every construct that drives the study must be translated into exactly what is manipulated, observed, scored, counted, or measured.</div>`,
      example:`<strong>Example</strong><p>Construct: memory retention. Operational outcome: number of 20 target definitions recalled correctly after 48 hours using a prespecified scoring rubric.</p>`,
      warning:`<strong>Pseudoreplication</strong><ul><li>Repeated measurements are not automatically independent observations.</li><li>Multiple leaves on one plant, students within one class, or trials from one participant may create nested or repeated data.</li><li>Use the Methods Lab to separate independent units, repeats, and subsamples before choosing statistics.</li></ul>`,
      sections:[
        {title:"Prediction",desc:"Only use a formal hypothesis when it fits the study.",fields:[
          ["hypothesisNeeded","Does this study need a formal hypothesis?","select",["Yes","No","Unsure"]],
          ["researchHyp","Research or directional hypothesis if appropriate","textarea"],["nullHyp","Null hypothesis if an inferential test is planned","textarea"],["hypReason","Evidence or theory supporting the prediction","textarea"]
        ]},
        {title:"Constructs and variables",desc:"Use precise labels based on the design.",fields:[
          ["predictorIV","Manipulated IV or measured predictor/exposure","textarea"],["outcomeDV","Outcome/dependent variable","textarea"],["operationalDefs","Operational definitions and units","textarea"],["controlCondition","Control/comparison group or condition, if applicable","textarea"],["controlledConditions","Controlled conditions / standardized procedures","textarea"],["confounders","Potential confounders or alternative explanations","textarea"],["experimentalUnit","Experimental or observational unit","textarea"]
        ]}
      ],
      checks:["I did not invent a hypothesis simply because research papers are supposed to have one.","My main constructs have operational definitions.","I can distinguish a control group from controlled conditions.","I know what one independent experimental or observational unit is."]
    },
    {
      id:11, phase:"design", title:"Plan sampling, measurement, validity, and ethics",
      nav:"Sampling and measurement",
      purpose:"Decide who or what will provide evidence, how constructs will be measured, and how the study will protect validity, reliability, privacy, safety, and participants.",
      learn:`
        <h3>Population, sample, and unit are different</h3>
        <p>The population is the broader group you want to understand. The sample is what you actually study. The unit of analysis is what each analyzed observation represents.</p>
        <h3>Sampling affects generalization</h3>
        <p>Convenience sampling may be entirely reasonable for a classroom project, but it limits how far results can be generalized. Random assignment and random sampling solve different problems. Random assignment strengthens causal comparisons. Probability sampling supports population inference.</p>
        <h3>Measurement quality</h3>
        <ul>
          <li><strong>Reliability.</strong> Does the procedure produce sufficiently consistent measurements?</li>
          <li><strong>Validity.</strong> Does the measure support the interpretation you want to make from the score or observation?</li>
          <li><strong>Calibration/precision.</strong> Are tools accurate enough for the expected effect?</li>
          <li><strong>Blinding.</strong> Could knowledge of condition influence measurement or scoring?</li>
        </ul>
        <div class="concept-box"><strong>Human participants</strong><br>Surveys, interviews, identifiable observations, existing student records, audio/video, health information, or interventions involving people can require consent, privacy safeguards, school approval, and sometimes formal ethics review. Student projects should not assume that classroom access equals research permission.</div>`,
      example:`<strong>Example</strong><p>A convenience sample of one class can answer a local classroom question, but the paper should not claim that the result represents all teenagers.</p>`,
      warning:`<strong>Ethics is part of design</strong><ul><li>Do not collect sensitive data simply because it would be interesting.</li><li>Avoid unnecessary identifiers.</li><li>Participants must not be coerced by grades, authority, or peer pressure.</li><li>The Methods Lab separates sampling, recruitment, consent/assent, authority, privacy, storage, and procedure-specific risk.</li></ul>`,
      sections:[
        {title:"Population and sample",desc:"Define exactly who or what is studied.",fields:[
          ["population","Target population or system","textarea"],["sample","Actual sample","textarea"],["samplingMethod","Sampling method and why it is feasible","textarea"],["sampleLimits","How sampling limits generalization","textarea"]
        ]},
        {title:"Measurement and ethics",desc:"Explain how evidence will be trustworthy and safe.",fields:[
          ["instrument","Instrument, measure, sensor, rubric, survey, interview, or observation procedure","textarea"],["measureQuality","Evidence or plan for reliability, validity, calibration, or scoring consistency","textarea"],["ethicsIssues","Ethical, privacy, safety, or environmental issues","textarea"],["ethicsPlan","How those issues will be handled and who must approve","textarea"]
        ]}
      ],
      checks:["I distinguished population, sample, and unit of analysis.","My measurement actually represents the construct in the research question.","I identified limits to generalization.","Human-participant or safety issues will be reviewed before collection begins."]
    },
    {
      id:12, phase:"design", title:"Write the method and lock the data plan",
      nav:"Method and protocol",
      purpose:"Create a procedure detailed enough that another researcher could understand what was done, then predefine how data will be recorded, cleaned, and analyzed before looking at the final results.",
      learn:`
        <h3>Methods should make the study auditable</h3>
        <p>A strong Method section usually explains participants or units, materials/instruments, design, variables or coding structure, procedure, and planned analysis. Exact headings vary by discipline.</p>
        <h3>Design the data table before collecting data</h3>
        <p>Ask two questions. What does one row represent? What does each column represent? If those answers are unclear, the data structure is not ready.</p>
        <div class="concept-box"><strong>Data dictionary</strong><br>For every variable, record the name, definition, type, units or categories, allowed range, missing-value code, and how it is measured.</div>
        <h3>Predefine analytic decisions</h3>
        <ul>
          <li>Primary outcome and primary comparison.</li>
          <li>Missing-data handling.</li>
          <li>Outlier or exclusion rules.</li>
          <li>Planned descriptive statistics and graphs.</li>
          <li>Candidate inferential analysis and assumptions, if warranted.</li>
        </ul>
        <p>If the plan changes after seeing the data, document the change. Exploratory analyses are legitimate when labeled as exploratory.</p>`,
      example:`<strong>Replication test</strong><p>Give your procedure to a classmate. If they cannot tell what to measure, when to measure it, how many trials to perform, or what counts as a valid observation, the method needs more detail.</p>`,
      warning:`<strong>Do not write the analysis plan after seeing which test gives p &lt; .05</strong><ul><li>Choose analyses from the question, design, variable types, and assumptions.</li><li>Keep raw data unchanged and document cleaning decisions.</li></ul>`,
      custom:"dataSchemaBuilder",
      sections:[
        {title:"Method blueprint",desc:"Write enough detail for replication.",fields:[
          ["materials","Materials, software, instruments, or data sources","textarea"],["procedure","Step-by-step procedure","textarea"],["replication","Number of units, trials, repeated measurements, or observations and why","textarea"],["methodControls","Randomization, counterbalancing, blinding, standardization, control condition, or other validity protections","textarea"]
        ]},
        {title:"Data plan",desc:"Define the dataset before collection.",fields:[
          ["rowUnit","What one row represents","text"],["columns","Planned columns, variable names, units/categories","textarea"],["missingRule","Missing-data rule","textarea"],["exclusionRule","Exclusion/outlier rule decided in advance","textarea"],["analysisIntent","Primary descriptive and inferential/qualitative analysis plan","textarea"]
        ]}
      ],
      checks:["Another student could follow my procedure without guessing the major steps.","I know exactly what one row and each column will represent.","I identified my primary outcome/comparison before analyzing results.","Missing-data and exclusion decisions will be documented."]
    },
    {
      id:13, phase:"analyze", title:"Collect, clean, visualize, and describe data",
      nav:"Data quality and descriptives",
      purpose:"Protect the raw record, check data quality, and understand the evidence before running formal tests.",
      learn:`
        <h3>Raw data first</h3>
        <p>Keep an unchanged raw-data file. Create a separate cleaned dataset with a record of every correction, exclusion, recoding decision, and derived variable.</p>
        <h3>Before inferential statistics</h3>
        <ol>
          <li>Check IDs and duplicates.</li>
          <li>Check impossible values and units.</li>
          <li>Inspect missingness and protocol deviations.</li>
          <li>Plot the data in a way that preserves the design structure.</li>
          <li>Compute descriptive statistics appropriate to variable type.</li>
          <li>Look for outliers, ceiling/floor effects, skew, clustering, and repeated observations.</li>
        </ol>
        <div class="concept-box"><strong>Descriptive statistics depend on data type</strong><br>Numerical data may use mean/SD and median/IQR. Categorical data use counts and proportions. Paired and repeated data should preserve within-unit relationships. Qualitative evidence requires a transparent corpus and coding trail.</div>`,
      example:`<strong>Example</strong><p>For a paired study, do not show only two separate bar means. A paired dot or line plot reveals whether the same participants improved, declined, or varied across conditions.</p>`,
      warning:`<strong>Data cleaning is not result improvement</strong><ul><li>Do not remove an outlier because it weakens the effect.</li><li>Do not replace missing observations with invented values.</li><li>Do not silently change units or categories.</li></ul>`,
      sections:[
        {title:"Data integrity log",desc:"Record what happened to the data.",fields:[
          ["rawLocation","Where the unchanged raw data are stored","textarea"],["missingObserved","Missing observations and how they were handled","textarea"],["errorsCorrections","Data-entry errors, corrections, exclusions, or protocol deviations","textarea"],["plots","Plots/figures used to inspect the data","textarea"],["descriptives","Descriptive statistics or qualitative corpus summary","textarea"]
        ]}
      ],
      checks:["I preserved the raw data unchanged.","Every exclusion or correction has a reason.","I visualized the data before choosing or interpreting an inferential test.","My descriptive summaries match the variable types and design."]
    },
    {
      id:14, phase:"analyze", title:"Choose and justify the data analysis",
      nav:"Statistical analysis",
      purpose:"Select analysis from the research question, design structure, outcome type, and assumptions. Statistical significance is one part of interpretation, not the goal of the study.",
      learn:`
        <h3>Start with the estimand, not the test name</h3>
        <p>First ask what quantity answers the research question. A mean difference? A paired change? A proportion difference? An association? A slope? A theme? The test follows from that structure.</p>
        <h3>Core interpretation</h3>
        <ul>
          <li>Report effect magnitude in meaningful units when possible.</li>
          <li>Use an effect size appropriate to the design.</li>
          <li>Describe uncertainty with confidence intervals when appropriate.</li>
          <li>A p-value measures compatibility of the observed data with a specified null model under its assumptions. It is not the probability that your hypothesis is true and does not measure practical importance.</li>
          <li>A non-significant result is not proof of “no effect.” Consider the estimate, interval, power/precision, and study limitations.</li>
        </ul>
        <div class="concept-box"><strong>Assumptions are design-specific</strong><br>Independence comes from the study design. For a paired t-test, normality concerns the difference scores, not each condition separately. Equal variance is not required for Welch's two-sample t-test. Regression assumptions concern residuals and model form. Do not choose a test from a normality test alone.</div>`,
      example:`<strong>Example</strong><p>Two independent groups with a continuous outcome → compare distributions and means; Welch's t-test is a strong default when mean comparison is appropriate because it does not require equal population variances. Report the raw mean difference, CI, and an effect size.</p>`,
      warning:`<strong>Statistical red flags</strong><ul><li>Running many tests until something is significant.</li><li>Treating repeated observations as independent.</li><li>Using percentages as if they were raw counts in chi-square.</li><li>Choosing Pearson versus Spearman solely from a normality p-value.</li><li>Reporting p without magnitude or context.</li></ul>`,
      custom:"statsWizard",
      sections:[
        {title:"Analysis decision log",desc:"Save the reasoning behind the analysis.",fields:[
          ["primaryEstimand","The quantity that most directly answers my question","textarea"],["analysisChoice","Primary analysis and justification","textarea"],["assumptionChecks","Assumptions/design checks and what I observed","textarea"],["effectSizePlan","Effect size and/or interval estimate","textarea"],["multiplicity","Multiple comparisons or exploratory analyses and how I will handle/label them","textarea"]
        ]}
      ],
      checks:["My analysis matches the design structure and outcome type.","I identified the effect or quantity I want to estimate, not only a test name.","I will report magnitude and uncertainty where appropriate.","I understand what the p-value does and does not mean."]
    },
    {
      id:15, phase:"analyze", title:"Write the Results section",
      nav:"Results",
      purpose:"Report what the analysis produced in a traceable, neutral way. Keep explanation and implications for the Discussion.",
      learn:`
        <h3>Results answer “What did the evidence show?”</h3>
        <p>Every reported number, table, figure, code, or theme should trace back to the dataset or analysis output.</p>
        <h3>Recommended sequence</h3>
        <ol>
          <li>Describe the analyzed sample or corpus and exclusions.</li>
          <li>Report descriptive statistics and data-quality information relevant to interpretation.</li>
          <li>Present figures and tables that directly address the question.</li>
          <li>Report primary statistical or qualitative results with complete information.</li>
          <li>Report weak, null, unexpected, and contradictory findings as transparently as favorable findings.</li>
        </ol>
        <div class="concept-box"><strong>Quantitative reporting</strong><br>Include the estimate or raw difference, units, uncertainty interval when appropriate, test statistic and degrees of freedom when a test is used, p-value, and effect size where meaningful. The exact reporting format depends on analysis.</div>
        <div class="concept-box"><strong>Qualitative reporting</strong><br>Explain the analytic approach, themes/codes, prevalence carefully if counted, and representative evidence. Keep a traceable codebook and do not turn qualitative frequency counts into unsupported population statistics.</div>`,
      example:`<strong>Correlational wording</strong><p>“Screen time and sleep duration were negatively associated in the analyzed sample…” not “Screen time reduced sleep.”</p>`,
      warning:`<strong>Keep Results separate</strong><ul><li>Do not explain mechanisms here if your course separates Results and Discussion.</li><li>Do not hide non-significant or small results.</li><li>Do not duplicate every table value in prose.</li></ul>`,
      sections:[
        {title:"Results map",desc:"Plan traceability before writing paragraphs.",fields:[
          ["analysisSample","Final analyzed sample/corpus and exclusions","textarea"],["result1","Primary result and exact supporting output/table/figure","textarea"],["result2","Secondary result and exact supporting output/table/figure","textarea"],["unexpected","Null, weak, unexpected, or contradictory result","textarea"],["resultsDraft","Results section draft","textarea"]
        ]}
      ],
      checks:["Every key result is traceable to raw/cleaned data or an analysis output.","I used language appropriate to the research design.","I reported weak or non-significant results transparently.","Interpretation and recommendations are reserved for the Discussion."]
    },
    {
      id:16, phase:"write", title:"Write the Discussion and limitations",
      nav:"Discussion",
      purpose:"Answer the research question, explain what the findings may mean, compare them with prior literature, evaluate alternative explanations, and state exactly how far the claims can go.",
      learn:`
        <h3>Discussion converts results into warranted claims</h3>
        <ol>
          <li>Answer the research question directly.</li>
          <li>Interpret the most important findings without simply repeating numbers.</li>
          <li>Explain plausible mechanisms and alternative explanations.</li>
          <li>Compare the findings with prior research.</li>
          <li>Analyze limitations by explaining how each one changes interpretation.</li>
          <li>Discuss generalizability, practical or theoretical implications, and future research.</li>
        </ol>
        <div class="concept-box"><strong>Limitation ≠ apology</strong><br>A useful limitation statement identifies a feature of the design, explains the direction or type of uncertainty it creates, and shows how a future study could address it.</div>
        <p>For correlational work, explicitly consider confounding and reverse causation. For experiments, examine assignment, control, adherence, expectancy, measurement, attrition, and generalization. For qualitative work, discuss sampling, reflexivity, coding decisions, credibility, and transferability. For reviews, discuss search coverage, study quality, heterogeneity, and publication bias where relevant.</p>`,
      example:`<strong>Strong limitation logic</strong><p>“Because study condition was confounded with time of day, the observed difference cannot be attributed uniquely to the intervention. A future counterbalanced design would separate these explanations.”</p>`,
      warning:`<strong>Overclaiming</strong><ul><li>Statistical significance does not turn an observational study into an experiment.</li><li>A large effect in one small convenience sample does not guarantee a population effect.</li><li>Do not claim a mechanism you did not measure as if it were observed.</li></ul>`,
      sections:[
        {title:"Discussion architecture",desc:"Build interpretation around anchor findings.",fields:[
          ["directAnswer","Direct answer to the research question","textarea"],["interpret1","Interpretation of anchor finding 1 with evidence boundary","textarea"],["interpret2","Interpretation of anchor finding 2 with evidence boundary","textarea"],["litCompare","How findings converge with or differ from prior literature","textarea"],["alternatives","Alternative explanations or mechanisms","textarea"],["limitations","At least two limitations and exactly how each restricts claims","textarea"],["implications","Realistic implications and who/what they apply to","textarea"],["future","Specific future research that follows from the findings","textarea"],["discussionDraft","Discussion draft","textarea"]
        ]}
      ],
      checks:["The first part answers the research question.","Interpretations are tied to actual results.","Limitations explain how interpretation is restricted.","I separated plausible mechanisms from mechanisms that were directly measured."]
    },
    {
      id:17, phase:"write", title:"Write the conclusion, abstract, title, and keywords",
      nav:"Conclusion and abstract",
      purpose:"Finish the paper by compressing the study accurately. The conclusion closes the argument. The abstract gives a stand-alone summary of the full paper and is usually written last.",
      learn:`
        <h3>Conclusion</h3>
        <p>A conclusion should synthesize the answer, strongest evidence, main boundary, and reasonable implication without adding new results or new literature.</p>
        <h3>Abstract</h3>
        <p>Write the abstract after the paper is stable. In most empirical research papers it briefly states the problem or purpose, method/design and sample or system, most important results, and main conclusion. Exact length and structure depend on the assignment or journal.</p>
        <p>Abstracts generally avoid detailed calculations, long literature reviews, unexplained abbreviations, and citations unless a discipline or assignment specifically requires them.</p>
        <h3>Title</h3>
        <p>A strong title identifies the central variables/phenomenon, population or context when useful, and sometimes the design. It should be informative without claiming more than the study established.</p>`,
      example:`<strong>Title example</strong><p>“Retrieval Practice and 48-Hour Biology Vocabulary Recall in a Repeated Within-Student Classroom Study” communicates more than “The Effects of Studying.”</p>`,
      warning:`<strong>Abstract warning</strong><ul><li>Do not report results that do not appear in the paper.</li><li>Do not write “proved” or “definitively demonstrated.”</li><li>Do not introduce a new recommendation in the conclusion.</li></ul>`,
      sections:[
        {title:"Closing sections",desc:"Write these after Results and Discussion are stable.",fields:[
          ["conclusionDraft","Conclusion","textarea"],["abstractDraft","Abstract","textarea"],["titleDraft","Proposed title","text"],["keywords","Keywords","text"]
        ]}
      ],
      checks:["The conclusion contains no new evidence.","The abstract states purpose, method, central result, and conclusion at the correct level of certainty.","The title describes the study without overstating causality or generalizability."]
    },
    {
      id:18, phase:"write", title:"Citations, references, and final alignment audit",
      nav:"Citations and final audit",
      purpose:"Verify that every claim is supported, every source is real and traceable, citation style is consistent, and the question, design, data, analysis, results, and conclusion all align.",
      learn:`
        <h3>Citation integrity comes before formatting</h3>
        <ul>
          <li>A citation should support the exact nearby claim.</li>
          <li>Paraphrasing still requires citation.</li>
          <li>Direct quotations require quotation formatting and a locator such as a page number when the style calls for it.</li>
          <li>Every in-text citation should have a matching reference entry and vice versa.</li>
          <li>Verify references against the original source. Never trust an AI-generated reference without checking it.</li>
        </ul>
        <h3>APA 7 essentials for this studio</h3>
        <p>Use author–date in-text citations. Two authors are named in each citation. For three or more authors, APA 7 normally uses the first author plus “et al.” from the first citation. Journal references typically include authors, year, article title, journal title, volume, issue when applicable, pages or article number, and DOI as a URL when available.</p>
        <div class="concept-box"><strong>Final alignment question</strong><br>Could a reader start with your research question and trace a continuous logical path through the variables/constructs, method, dataset, analysis, results, and final claim?</div>`,
      example:`<strong>APA in-text examples</strong><p>Narrative: Chen and Lee (2024) … &nbsp; Parenthetical: (Chen & Lee, 2024). Three or more authors: Chen et al. (2024).</p>`,
      warning:`<strong>Final integrity check</strong><ul><li>No fabricated references.</li><li>No citation attached to a claim the paper does not support.</li><li>No causal language beyond the design.</li><li>No p-value interpreted as effect size or probability the hypothesis is true.</li></ul>`,
      custom:"citationAndAudit",
      sections:[
        {title:"Final writing audit",desc:"Record remaining fixes before submission.",fields:[
          ["citationStyle","Required citation style","select",["APA 7","MLA","Chicago","Other / teacher-specific"]],
          ["citationAudit","Citation/reference issues I still need to fix","textarea"],["finalEdits","Final methodological or writing revisions","textarea"]
        ]}
      ],
      checks:["Every factual/research claim that needs support has an appropriate source.","Every in-text citation has a matching reference entry and vice versa.","The final conclusion does not exceed the design or sample.","The question, method, data, analysis, results, and discussion form one aligned chain."]
    }
  ];

  const terms = [
    ["Construct","An idea you want to study, such as memory, stress, biodiversity, or trust. A construct usually needs an operational definition before it can be measured."],
    ["Operational definition","The exact rule for how a construct will be manipulated, observed, scored, counted, or measured."],
    ["Experimental unit","The smallest unit independently assigned to a treatment. It determines the true replication structure of an experiment."],
    ["Confounder","A factor associated with both an exposure/comparison and an outcome that can create or distort an apparent relationship."],
    ["Effect size","A quantitative description of the magnitude of a difference or association. It is different from statistical significance."],
    ["Confidence interval","An interval estimate used to communicate uncertainty about a parameter under a statistical model and repeated-sampling procedure."],
    ["Synthesis","Integration of evidence across multiple sources to identify patterns, disagreement, boundaries, methods, and implications."],
    ["Traceability","The ability to connect a written claim back to the source, raw data, analytic decision, table, figure, code, or statistical output that supports it."]
  ];

  return {phases, stages, terms};
})();
