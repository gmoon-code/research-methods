
global.window={dispatchEvent:()=>{}};global.CustomEvent=function(){};global.Blob=class{constructor(a){this.size=String(a[0]||"").length}};
global.localStorage={getItem(){throw new Error("blocked")},setItem(){throw new Error("blocked")},removeItem(){throw new Error("blocked")}};
require("../assets/pilot.js");const P=window.RMSPilot;let r=P.storageReport("x");if(r.available!==false)process.exit(1);if(P.onboardingSeen()!==false)process.exit(1);console.log("PASS storage-unavailable resilience");
