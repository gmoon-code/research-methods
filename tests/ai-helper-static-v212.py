
from pathlib import Path
import json,re
r=Path(__file__).resolve().parents[1]
idx=(r/"index.html").read_text()
app=(r/"assets/app.js").read_text()
helper=(r/"assets/ai-helper.js").read_text()
ui=(r/"assets/ai-helper-ui.js").read_text()
adapter=(r/"assets/ai-adapter.js").read_text()
schema=json.loads((r/"docs/AI_HELPER_RESPONSE_SCHEMA_v2.12.json").read_text())

for asset in ["assets/ai-adapter.js","assets/ai-helper.js","assets/ai-helper-ui.js"]:
    assert asset in idx
assert idx.index("assets/ai-adapter.js") < idx.index("assets/ai-helper.js") < idx.index("assets/ai-helper-ui.js") < idx.index("assets/app.js")
assert "AIHelper.normalizeProject" in app
assert "AIHelperUI.bind" in app
assert "chatEndpoint" in app
assert "AI.reviewEnabled()" in app
assert "mode:\"helper_chat\"" in adapter
assert "direct_completion_guard:true" in helper
assert "do_not_invent_sources:true" in helper
assert "do_not_calculate_statistics_from_raw_data:true" in helper
assert "Ask Research AI" in ui
assert "Do not enter student names" in ui
assert "counts_as_stage_support" in ui
assert schema["properties"]["scaffold_level_used"]["maximum"]==5
assert schema["properties"]["direct_completion_guard"]["additionalProperties"] is False
assert (r/"backend/openai-cloudflare-worker/worker.mjs").exists()
print("PASS v2.12 AI helper static integration and contract safeguards")
