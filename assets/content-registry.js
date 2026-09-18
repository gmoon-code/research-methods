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
    schema_version: "1.0",
    content_version: "v3-content-foundation-1",
    records: [
      {
        key: "curriculum.stage.1.guidance",
        type: "stage_guidance",
        location: "Stage 1 · Find your research interests",
        stage_id: 1,
        revision: "seed-v2.17.1",
        published: true,
        value: {
          "title": "Find your research interests",
          "nav": "Research interests",
          "purpose": "Start with questions you genuinely care about. A good project begins with curiosity, a problem, a pattern, or an unresolved explanation, not with a statistical test.",
          "learn_html": "\r\n        <h3>Research starts before the research question</h3>\r\n        <p>Your first job is to generate possible areas of inquiry. Look for topics that are interesting enough to sustain weeks of work and concrete enough that evidence could eventually be collected.</p>\r\n        <div class=\"concept-box\"><strong>Four productive starting points</strong><br>\r\n        A phenomenon you want to explain · a problem you want to understand · a claim you are unsure about · a pattern you have noticed.</div>\r\n        <p>Do not force yourself to identify an independent variable yet. Some strong projects are descriptive, correlational, qualitative, or literature-based and may never manipulate a variable.</p>\r\n        <h3>Interest inventory</h3>\r\n        <ul>\r\n          <li>What science topics make you keep reading after class?</li>\r\n          <li>What real-world problems feel unresolved or poorly understood?</li>\r\n          <li>What claims do people repeat that you would like to check with evidence?</li>\r\n          <li>What patterns have you noticed in school, nature, technology, health, behavior, or your community?</li>\r\n          <li>What tools, datasets, organisms, materials, or settings can you realistically access?</li>\r\n        </ul>",
          "example_html": "<strong>Example</strong><p>Broad interest: memory. Observation: I remember vocabulary differently depending on how I study. Possible research direction: compare study procedures using delayed recall.</p>",
          "warning_html": "<strong>Avoid this trap</strong><ul><li>Choosing a topic only because it sounds impressive.</li><li>Beginning with “I need to use ANOVA.”</li><li>Choosing a topic that requires unsafe procedures or inaccessible equipment.</li></ul>"
}
      }
    ]
  };

  return deepFreeze(registry);
})();
