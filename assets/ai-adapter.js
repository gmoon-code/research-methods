
window.RMSAI = (() => {
  const STORAGE_KEY = "rms_ai_backend_v1_2";

  function getConfig(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}"); } catch { return {}; }
  }
  function setConfig(cfg){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg||{}));
  }
  function enabled(){
    const c=getConfig();
    return Boolean(c.enabled && c.endpoint);
  }
  async function review(payload){
    const c=getConfig();
    if(!c.enabled || !c.endpoint) throw new Error("AI Coach backend is not configured.");
    const res=await fetch(c.endpoint,{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(payload)
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error||`Coach request failed (${res.status}).`);
    return data;
  }
  return {getConfig,setConfig,enabled,review};
})();
