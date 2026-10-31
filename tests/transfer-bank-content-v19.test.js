// Supplemental research-transfer task content integrity checks.
global.window={};
require("../assets/transfer-bank.js");
const active=window.RMSTransferBank;
const canonical=require("../assets/transfer-bank-v1.9.json");
const assert=require("assert");
assert.deepStrictEqual(active,canonical);
assert.strictEqual(canonical.tasks.length,20);
assert.strictEqual(new Set(canonical.tasks.map(t=>t.id)).size,20);
for(const task of canonical.tasks){
 assert.ok(task.title&&task.scenario&&task.cue&&Array.isArray(task.prompts)&&task.prompts.length);
 assert.ok(Array.isArray(task.competencies)&&task.competencies.length);
 for(const name of task.competencies)assert.ok(task.criteria[name]);
}
const byId=Object.fromEntries(canonical.tasks.map(t=>[t.id,t]));
assert.ok(/completed empirical study/.test(byId.TR15.scenario));
assert.ok(/proposal/.test(byId.TR15.cue));
assert.ok(/fictional citation-checking exercise/.test(byId.TR16.scenario));
assert.ok(/invented example source/.test(byId.TR16.scenario));
assert.ok(/fertiliser/.test(byId.TR13.scenario));
assert.ok(/unvalidated/.test(canonical.status));
console.log("PASS transfer bank content and hypothetical-source integrity");
