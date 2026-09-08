/*
 * v2.15 GitHub-only Research Chat compatibility adapter.
 *
 * The legacy RMSAI interface is retained so older deterministic Coach screens
 * do not crash. Cloud review is deliberately disabled in this GitHub-only build.
 * Research Chat itself runs locally in the browser through the scripts loaded below.
 */
window.RMSAI = (() => {
  function getConfig(){return {enabled:false,mode:"local-browser-only"}}
  function setConfig(){return getConfig()}
  function enabled(){return false}
  async function review(){
    throw new Error("Cloud AI review is disabled in this GitHub-only build. Use Research Chat for local explanation and feedback.");
  }
  return {getConfig,setConfig,enabled,review};
})();

(() => {
  const base=new URL("./",document.currentScript.src);
  const css=document.createElement("link");
  css.rel="stylesheet";
  css.href=new URL("local-chat.css",base).href;
  document.head.appendChild(css);

  const scripts=[
    "local-chat-config.js",
    "local-chat-policy.js",
    "local-chat.js",
    "local-chat-ui.js"
  ];
  let chain=Promise.resolve();
  for(const name of scripts){
    chain=chain.then(()=>new Promise((resolve,reject)=>{
      const s=document.createElement("script");
      s.src=new URL(name,base).href;
      s.onload=resolve;
      s.onerror=()=>reject(new Error(`Could not load ${name}`));
      document.head.appendChild(s);
    }));
  }
  chain.then(()=>{
    const start=()=>window.RMSLocalChatUI?.init?.();
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
    else setTimeout(start,0);
  }).catch(err=>console.error("Research Chat failed to initialize:",err));
})();
