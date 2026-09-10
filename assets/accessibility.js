
window.RMSAccessibility=(()=>{
  let lastFocused=null;
  let rootOpener=null;
  let uid=0;
  const openerByBackdrop=new WeakMap();

  const focusableSelector=[
    'a[href]','button:not([disabled])','input:not([disabled])','select:not([disabled])',
    'textarea:not([disabled])','details > summary','[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function visible(el){
    if(!el || el.hidden) return false;
    const s=getComputedStyle(el);
    return s.display!=="none" && s.visibility!=="hidden";
  }

  function focusables(container){
    return [...container.querySelectorAll(focusableSelector)]
      .filter(el=>visible(el) && !el.closest('[inert]'));
  }

  function titleFor(modal){
    return modal.querySelector('h1,h2,h3,h4,[data-dialog-title]');
  }

  function closeControl(backdrop){
    return [...backdrop.querySelectorAll('button')].find(b=>
      /^close$/i.test(b.textContent.trim()) ||
      /^cancel$/i.test(b.textContent.trim()) ||
      /^go back$/i.test(b.textContent.trim()) ||
      /^back$/i.test(b.textContent.trim()) ||
      /^close/i.test(b.id||"")
    );
  }

  function enhanceBackdrop(backdrop){
    if(backdrop.dataset.a11yEnhanced==="1") return;
    const modal=backdrop.querySelector('.modal');
    if(!modal) return;

    backdrop.dataset.a11yEnhanced="1";
    const opener=document.activeElement && document.activeElement!==document.body ? document.activeElement : null;
    const existing=[...document.querySelectorAll('.modal-backdrop')].filter(b=>b!==backdrop && visible(b));
    if(!existing.length && opener && !opener.closest('.modal-backdrop')) rootOpener=opener;
    openerByBackdrop.set(backdrop,opener);
    if(opener) lastFocused=opener;

    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('tabindex','-1');

    const title=titleFor(modal);
    if(title){
      if(!title.id) title.id=`rms-dialog-title-${++uid}`;
      modal.setAttribute('aria-labelledby',title.id);
      title.setAttribute('tabindex','-1');
    }else{
      modal.setAttribute('aria-label','Research Methods Studio dialog');
    }

    const close=closeControl(backdrop);
    if(close && !close.getAttribute('aria-label') && !close.textContent.trim()){
      close.setAttribute('aria-label','Close dialog');
    }

    refreshModalState();

    requestAnimationFrame(()=>{
      const preferred=title || close || focusables(modal)[0] || modal;
      try{preferred.focus({preventScroll:true})}catch(_){preferred.focus()}
    });
  }

  function refreshModalState(){
    const backs=[...document.querySelectorAll('.modal-backdrop')].filter(visible);
    const shell=document.querySelector('.app-shell');
    if(backs.length){
      document.body.classList.add('modal-open');
      if(shell){
        shell.inert=true;
        shell.setAttribute('aria-hidden','true');
      }
      backs.forEach((b,i)=>{
        const top=i===backs.length-1;
        if(top){
          b.inert=false;
          b.removeAttribute('aria-hidden');
        }else{
          b.inert=true;
          b.setAttribute('aria-hidden','true');
        }
      });
    }else{
      document.body.classList.remove('modal-open');
      if(shell){
        shell.inert=false;
        shell.removeAttribute('aria-hidden');
      }
      const restoreTarget=(rootOpener && rootOpener.isConnected && !rootOpener.disabled) ? rootOpener : lastFocused;
      if(restoreTarget && restoreTarget.isConnected && !restoreTarget.disabled){
        requestAnimationFrame(()=>{try{restoreTarget.focus({preventScroll:true})}catch(_){restoreTarget.focus()}});
      }
      lastFocused=null;
      rootOpener=null;
    }
  }

  function closeTopModal(){
    const backs=[...document.querySelectorAll('.modal-backdrop')].filter(visible);
    const top=backs[backs.length-1];
    if(!top) return false;
    const close=closeControl(top);
    if(close){ close.click(); return true; }
    top.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    if(top.isConnected) top.remove();
    refreshModalState();
    return true;
  }

  function keyHandler(e){
    const helper=document.querySelector('#aiHelperPanel:not([hidden])');
    if(helper && (helper.contains(document.activeElement) || e.key==="Escape")) return;
    const backs=[...document.querySelectorAll('.modal-backdrop')].filter(visible);
    if(!backs.length) return;
    const top=backs[backs.length-1];
    const modal=top.querySelector('.modal');
    if(!modal) return;

    if(e.key==="Escape"){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      closeTopModal();
      return;
    }

    if(e.key!=="Tab") return;
    const items=focusables(modal);
    if(!items.length){
      e.preventDefault();
      modal.focus();
      return;
    }
    const first=items[0],last=items[items.length-1],active=document.activeElement;
    if(e.shiftKey && (active===first || !modal.contains(active))){
      e.preventDefault();last.focus();
    }else if(!e.shiftKey && active===last){
      e.preventDefault();first.focus();
    }
  }

  function ensureStatusSemantics(){
    document.querySelectorAll('.coach-feedback.bad,.stat-caution,.policy-note').forEach(el=>{
      if(!el.hasAttribute('role')) el.setAttribute('role','status');
    });
    document.querySelectorAll('.coach-feedback.good,.ready-status,.save-status').forEach(el=>{
      if(!el.hasAttribute('aria-live')) el.setAttribute('aria-live','polite');
    });
  }

  function ensureTableAccessibility(){
    document.querySelectorAll('table').forEach(table=>{
      if(!table.hasAttribute('tabindex')) table.setAttribute('tabindex','0');
      if(!table.getAttribute('aria-label') && !table.getAttribute('aria-labelledby')){
        const nearby=table.closest('section,details,.modal,.card');
        const h=nearby?.querySelector('h2,h3,h4,summary');
        if(h){
          if(!h.id) h.id=`rms-table-title-${++uid}`;
          table.setAttribute('aria-labelledby',h.id);
        }else{
          table.setAttribute('aria-label','Research data table');
        }
      }
    });
  }

  function auditAndEnhance(root=document){
    root.querySelectorAll?.('.modal-backdrop').forEach(enhanceBackdrop);
    ensureStatusSemantics();
    ensureTableAccessibility();
  }

  function init(){
    const skip=document.querySelector('.skip-link');
    if(skip){
      skip.addEventListener('click',e=>{
        const target=document.querySelector(skip.getAttribute('href')||'#mainContent');
        if(target){e.preventDefault();target.focus({preventScroll:true});target.scrollIntoView({block:'start'});}
      });
    }
    document.addEventListener('keydown',keyHandler,true);
    const obs=new MutationObserver(records=>{
      let changed=false;
      const restore=[];
      for(const rec of records){
        rec.addedNodes.forEach(node=>{
          if(node.nodeType!==1) return;
          if(node.matches?.('.modal-backdrop')) enhanceBackdrop(node);
          node.querySelectorAll?.('.modal-backdrop').forEach(enhanceBackdrop);
          changed=true;
        });
        rec.removedNodes.forEach(node=>{
          if(node.nodeType!==1) return;
          const removed=[];
          if(node.matches?.('.modal-backdrop')) removed.push(node);
          node.querySelectorAll?.('.modal-backdrop').forEach(x=>removed.push(x));
          removed.forEach(b=>{const opener=openerByBackdrop.get(b);if(opener)restore.push(opener)});
          changed=true;
        });
      }
      if(changed){
        ensureStatusSemantics();
        ensureTableAccessibility();
        refreshModalState();
        const opener=restore[restore.length-1];
        if(opener && opener.isConnected && !opener.closest('[inert]')){
          requestAnimationFrame(()=>{try{opener.focus({preventScroll:true})}catch(_){opener.focus()}});
        }
      }
    });
    obs.observe(document.body,{childList:true,subtree:true});
    auditAndEnhance(document);
  }

  if(document.readyState==="loading") document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  return {auditAndEnhance,enhanceBackdrop,refreshModalState,closeTopModal,focusables};
})();
