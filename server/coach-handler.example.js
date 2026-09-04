/**
 * Provider-agnostic reference handler.
 * This is NOT deployed by GitHub Pages.
 * Adapt to a serverless platform or normal server.
 */

import stagePrompts from "../prompts/stage_prompts_v1.2.json" with { type: "json" };
import responseSchema from "../docs/COACH_RESPONSE_SCHEMA_v1.2.json" with { type: "json" };

export async function handleCoachRequest(request, { callModel, validateJson }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  const body = await request.json();
  const stageId = Number(body.stage_id);
  if (!Number.isInteger(stageId) || stageId < 1 || stageId > 18) {
    return json({ error: "Invalid stage_id" }, 400);
  }

  const stage = stagePrompts.stages[String(stageId)];
  const system = [
    stagePrompts.common_rules,
    stage.system_addendum,
    `Requested scaffold level: ${Math.max(0, Math.min(5, Number(body.scaffold_level || 0)))}.`
  ].join("\n\n");

  const input = {
    stage_id: stageId,
    project_context: body.project_context || {},
    student_work: body.student_work || {},
    deterministic_flags: body.deterministic_flags || [],
    source_context: body.source_context || [],
    course_config: body.course_config || {}
  };

  const modelOutput = await callModel({
    system,
    input,
    schema: responseSchema
  });

  const valid = validateJson(responseSchema, modelOutput);
  if (!valid.ok) {
    return json({ error: "Model response failed schema validation", details: valid.errors }, 502);
  }
  return json(modelOutput, 200);
}

function json(value, status=200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
