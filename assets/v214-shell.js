(() => {
  'use strict';
  const $ = id => document.getElementById(id);

  function currentStageLabel() {
    const active = document.querySelector('.nav-step.active .nav-label');
    const num = document.querySelector('.nav-step.active .nav-num');
    if (!active) return 'Current stage';
    const n = num?.textContent?.trim();
    const prefix = n && /^\d+$/.test(n) ? `Stage ${n}` : 'Current stage';
    return `${prefix} · ${active.textContent.trim()}`;
  }

  function updateCurrentStageButton() {
    const button = $('currentStageBtn');
    if (!button) return;
    button.textContent = currentStageLabel();
    button.title = 'Return to the research step you are working on';
  }

  function closeMenus(exceptId = '') {
    for (const id of ['helpMenu', 'moreMenu']) {
      if (id === exceptId) continue;
      const menu = $(id);
      const button = id === 'helpMenu' ? $('helpMenuBtn') : $('moreMenuBtn');
      if (menu) menu.hidden = true;
      button?.setAttribute('aria-expanded', 'false');
    }
  }

  function toggleMenu(menuId, buttonId) {
    const menu = $(menuId);
    const button = $(buttonId);
    if (!menu || !button) return;
    const willOpen = menu.hidden;
    closeMenus(willOpen ? menuId : '');
    menu.hidden = !willOpen;
    button.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) menu.querySelector('button')?.focus();
  }

  function invoke(selector) {
    const target = document.querySelector(selector);
    closeMenus();
    target?.click();
  }

  function bind() {
    $('helpMenuBtn')?.addEventListener('click', event => {
      event.stopPropagation();
      toggleMenu('helpMenu', 'helpMenuBtn');
    });
    $('moreMenuBtn')?.addEventListener('click', event => {
      event.stopPropagation();
      toggleMenu('moreMenu', 'moreMenuBtn');
    });
    $('currentStageBtn')?.addEventListener('click', () => {
      document.querySelector('#stageView:not([hidden]), #welcome:not([hidden])')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelector('.nav-step.active')?.focus({ preventScroll: true });
    });

    $('helpStuck')?.addEventListener('click', () => invoke('[data-open-rescue-navigator]'));
    $('helpGuide')?.addEventListener('click', () => invoke('#studentGuideBtn'));
    $('helpTerms')?.addEventListener('click', () => invoke('#glossaryBtn'));
    $('helpChat')?.addEventListener('click', () => {
      closeMenus();
      window.RMSResearchChat?.open?.();
    });

    document.addEventListener('click', event => {
      if (!event.target.closest('.top-menu-wrap')) closeMenus();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenus();
    });

    const nav = $('phaseNav');
    if (nav) new MutationObserver(updateCurrentStageButton).observe(nav, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    updateCurrentStageButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
