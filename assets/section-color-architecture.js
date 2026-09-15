window.RMSSectionArchitecture = (() => {
  const ORDER = ['yellow', 'green', 'turquoise', 'pink'];

  function colorForPhaseIndex(index) {
    return ORDER[index % ORDER.length];
  }

  function assign(el, color, group = '') {
    if (!el || !color) return;

    el.dataset.sectionColor = color;

    if (group) {
      el.dataset.sectionGroup = group;
    }
  }

  function clearAssignments() {
    document
      .querySelectorAll('[data-section-color],[data-section-group]')
      .forEach((el) => {
        el.removeAttribute('data-section-color');
        el.removeAttribute('data-section-group');
      });
  }

  function colorRouteByPhase() {
    const phases = [
      ...document.querySelectorAll('#phaseNav .route-phase')
    ];

    phases.forEach((phase, index) => {
      const color = colorForPhaseIndex(index);

      assign(phase, color, 'phase');

      const head = phase.querySelector('.route-phase-head');
      assign(head, color, 'phase-heading');

      phase.querySelectorAll('.route-step').forEach((step) => {
        assign(step, color, 'stage-navigation');

        assign(
          step.querySelector('.route-step-icon'),
          color,
          'stage-navigation'
        );

        assign(
          step.querySelector('.route-step-main'),
          color,
          'stage-navigation'
        );
      });
    });

    return phases;
  }

  function currentPhaseColor(phases) {
    const currentStep = document.querySelector(
      '#phaseNav .route-step.current'
    );

    if (currentStep) {
      const currentPhase = currentStep.closest('.route-phase');
      const index = phases.indexOf(currentPhase);

      if (index >= 0) {
        return colorForPhaseIndex(index);
      }
    }

    return 'yellow';
  }

  function colorCurrentStage(color) {
    const stageCard = document.querySelector('.stage-card');

    if (!stageCard) return;

    assign(stageCard, color, 'current-phase');

    const structuralSelectors = [
      '.stage-header',
      '.stage-meta',
      '.stage-meta .phase-pill',
      '.stage-tabs',
      '.stage-tabs button',
      '.tab-panel',
      '.lesson',
      '.work',
      '.check',
      '.form-section',
      '.current-form-section',
      '.stage-section-outline',
      '.stage-section-outline button',
      '.concept-box',
      '.example-box',
      '.warning-box',
      '.wizard',
      '.wizard-result',
      '.source-card',
      '.table-wrap',
      '.readiness',
      '.ready-controls',
      '.coach-panel',
      '.coach-feedback',
      '.citation-output',
      '.stats-note',
      '.align-row',
      '.tool-card'
    ];

    structuralSelectors.forEach((selector) => {
      stageCard.querySelectorAll(selector).forEach((el) => {
        assign(el, color, 'current-phase');
      });
    });

    stageCard
      .querySelectorAll('h2,h3,h4,h5')
      .forEach((heading) => {
        assign(
          heading,
          color,
          'current-phase-heading'
        );
      });
  }

  function colorOrientationCues(color) {
    const selectors = [
      '.progress-card',
      '.progress-head',
      '.progress-track',
      '.snapshot',
      '.rightbar-kicker',
      '.sidebar-note'
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        assign(el, color, 'current-phase-cue');
      });
    });
  }

  function colorWelcome() {
    const welcome = document.querySelector('#welcome');

    if (!welcome || welcome.hidden) return;

    assign(welcome, 'yellow', 'phase-one');

    welcome
      .querySelectorAll('h2,h3,h4,.eyebrow,.form-section')
      .forEach((el) => {
        assign(el, 'yellow', 'phase-one');
      });
  }

  function apply() {
    clearAssignments();

    const phases = colorRouteByPhase();
    const currentColor = currentPhaseColor(phases);

    colorCurrentStage(currentColor);
    colorOrientationCues(currentColor);
    colorWelcome();
  }

  let scheduled = false;

  function scheduleApply() {
    if (scheduled) return;

    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      apply();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      scheduleApply,
      { once: true }
    );
  } else {
    scheduleApply();
  }

  window.addEventListener('load', scheduleApply);

  const observer = new MutationObserver(scheduleApply);

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      'hidden',
      'class',
      'aria-selected',
      'aria-expanded'
    ]
  });

  return {
    apply: scheduleApply
  };
})();