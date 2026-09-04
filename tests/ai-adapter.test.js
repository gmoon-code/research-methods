
global.window={};
global.localStorage={
  _d:{},
  getItem(k){return this._d[k]??null},
  setItem(k,v){this._d[k]=String(v)}
};
require("../assets/ai-adapter.js");
const A=window.RMSAI;
A.setConfig({endpoint:"https://example.test/api/coach",enabled:true});
if(!A.enabled()) process.exit(1);
const c=A.getConfig();
if(c.endpoint!=="https://example.test/api/coach") process.exit(1);
console.log("PASS AI adapter config");
