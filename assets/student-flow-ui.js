window.RMSStudentFlowUI = (() => {
  "use strict";

  const F = window.RMSStudentFlow;
  const C = window.RMSCurriculum;
  const Paths = window.RMSPathways;

  const E = s =>
    String(s ?? "").replace(
      /[&<>"']/g,
      m =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[m]
    );

  const id = x => document.getElementById(x);

  let ctx = {
    project: null,
    save: null,
    render: null,
    download: null
  };

  let globalDelegationBound = false;
  let previewStageId = null;
  let moreOpening = false;

  function safeSave() {
    try {
      return ctx.save?.();
    } catch (err) {
      console.error("Student flow save failed", err);
      return false;
    }
  }

  function safeRender() {
    try {
      return ctx.render?.();
    } catch (err) {
      console.error("Student flow render failed", err);
      return false;
    }
  }

  function removeModal(modalId) {
    id(modalId)?.remove();
  }

  function phaseIcon(state) {
    return state === "done"
      ? "✓"
      : state === "review"
        ? "!"
        : state === "current"
          ? "→"
          : "○";
  }

  let routeModalExpandedPhase = null;

  function routeHTML(p, compact = false) {
    F.normalizeProject(p);

    return C.phases
      .map(ph => {
        const ps = F.phaseStatus(p, ph);
        const current = ph.steps.includes(Number(p.currentStage));
        const expanded = compact
          ? (
              routeModalExpandedPhase
                ? String(ph.id) === String(routeModalExpandedPhase)
                : current
            )
          : current || !!p.flow.expandedPhases?.[ph.id];

        return `
          <section class="route-phase ${current ? "current" : ""}">
            <button
              type="button"
              class="route-phase-head"
              data-route-phase="${ph.id}"
              aria-expanded="${expanded}"
            >
              <div>
                <b>${E(F.phaseLabel(ph.id))}</b>
                <span>
                  ${ps.done}/${ps.total}
                  ${ps.review ? ` · ${ps.review} needs review` : ""}
                </span>
              </div>
              <span>${expanded ? "−" : "+"}</span>
            </button>

            <div
              class="route-phase-steps"
              ${expanded ? "" : "hidden"}
            >
              ${ph.steps
                .map(stageId => {
                  const s = C.stages.find(
                    x => x.id === stageId
                  );

                  const state = F.routeState(
                    p,
                    stageId
                  );

                  const progress = F.stageProgress(
                    p,
                    stageId
                  );

                  const why =
                    p.flow.reviewReasons?.[
                      stageId
                    ] || "";

                  return `
                    <button
                      type="button"
                      class="route-step ${state}"
                      data-route-stage="${stageId}"
                      data-route-state="${state}"
                      title="${E(why)}"
                    >
                      <span class="route-step-icon">
                        ${phaseIcon(state)}
                      </span>

                      <span class="route-step-main">
                        <b>
                          ${stageId}.
                          ${E(
                            Paths.stageTitle(
                              p,
                              stageId,
                              s.nav || s.title
                            )
                          )}
                        </b>

                        <small>
                          ${
                            state === "done"
                              ? "Done for now"
                              : state === "current"
                                ? "Working now"
                                : state === "review"
                                  ? "Needs review after an earlier change"
                                  : state === "future"
                                    ? "Preview available"
                                    : progress.total
                                      ? `${progress.done}/${progress.total} current fields filled`
                                      : "Available"
                          }
                        </small>
                      </span>
                    </button>
                  `;
                })
                .join("")}
            </div>
          </section>
        `;
      })
      .join("");
  }

  function openFullStagePreview(stageId) {
    const n = Number(stageId);

    if (!ctx.project || !Number.isFinite(n)) return;

    /*
      Preview exists only in memory.

      It deliberately does not change:
      - project.currentStage
      - visited stages
      - ready/completion state
      - saved project progress
    */
    previewStageId = n;

    removeModal("routeBackdrop");
    removeModal("futureStagePreview");

    safeRender();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function exitStagePreview() {
    if (previewStageId === null) return;

    previewStageId = null;

    safeRender();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function getPreviewStage() {
    return previewStageId;
  }

  function isPreviewing() {
    return previewStageId !== null;
  }

  function previewStage(stageId) {
    if (!ctx.project) return;

    removeModal("futureStagePreview");

    const p = ctx.project;
    const s = C.stages.find(
      x => x.id === Number(stageId)
    );

    if (!s) return;

    const t = F.transitionFor(stageId);

    const sections =
      (s.sections || [])
        .map(
          x => `<li>${E(x.title)}</li>`
        )
        .join("") ||
      "<li>Complete the main evidence or tool workflow for this stage.</li>";

    const wrap =
      document.createElement("div");

    wrap.className = "modal-backdrop";
    wrap.id = "futureStagePreview";

    wrap.innerHTML = `
      <div class="modal future-stage-preview">

        <div class="journey-head">
          <div>
            <div class="guide-kicker">
              Preview · Stage ${stageId} of 18
            </div>

            <h3>
              ${E(
                Paths.stageTitle(
                  p,
                  stageId,
                  s.title
                )
              )}
            </h3>
          </div>

          <button
            type="button"
            class="ghost small"
            id="closeFuturePreview"
          >
            Close
          </button>
        </div>

        <div class="future-preview-note">
          <b>
            You do not need to complete this yet.
          </b>

          <p>
            This preview shows where the research
            route is heading without opening the
            full advanced form early.
          </p>
        </div>

        <div class="flow-transition">
          <div>
            <span>FROM EARLIER</span>
            <p>${E(t.from)}</p>
          </div>

          <div class="current">
            <span>IN THIS STAGE</span>
            <p>${E(t.now)}</p>
          </div>

          <div>
            <span>NEXT</span>
            <p>${E(t.next)}</p>
          </div>
        </div>

        <div class="future-preview-outline">
          <h4>What this stage will involve</h4>
          <ol>${sections}</ol>
        </div>

        <div class="button-row">
          <button
            type="button"
            class="primary"
            id="returnCurrentStage"
          >
            Return to Stage ${p.currentStage}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(wrap);

    id("closeFuturePreview")?.addEventListener(
      "click",
      () => wrap.remove()
    );

    id("returnCurrentStage")?.addEventListener(
      "click",
      () => wrap.remove()
    );

    wrap.addEventListener("click", e => {
      if (e.target === wrap) {
        wrap.remove();
      }
    });
  }

  function openRoute() {
    if (!ctx.project) return;

    removeModal("routeBackdrop");

    const p = ctx.project;
    const currentPhase = C.phases.find(
      ph => ph.steps.includes(Number(p.currentStage))
    );
    routeModalExpandedPhase = currentPhase?.id ?? null;

    const wrap =
      document.createElement("div");

    wrap.className = "modal-backdrop";
    wrap.id = "routeBackdrop";

    wrap.innerHTML = `
      <div class="modal route-modal">

        <div class="journey-head">
          <div>
            <div class="guide-kicker">
              Your complete research route
            </div>

            <h3>My Research Route</h3>

            <p>
              See what you have completed,
              what you are working on,
              and what comes later.
            </p>
          </div>

          <button
            type="button"
            class="ghost small"
            id="closeRoute"
          >
            Close
          </button>
        </div>

        <div class="route-modal-progress">
          <b>Stage ${p.currentStage} of 18</b>

          <span>
            ${
              Object.values(
                p.ready || {}
              ).filter(Boolean).length
            }
            stages done for now
          </span>
        </div>

        <div class="route-modal-hint">
          Current phase opens first. Select another phase to inspect its stages.
        </div>

        <div id="routeModalList">
          ${routeHTML(p, true)}
        </div>
      </div>
    `;

    document.body.appendChild(wrap);

    id("closeRoute")?.addEventListener(
      "click",
      () => wrap.remove()
    );

    wrap.addEventListener("click", e => {
      if (e.target === wrap) {
        wrap.remove();
      }
    });

    bindRoute(wrap);
  }

  function bindRoute(scope = document) {
    scope
      .querySelectorAll?.(
        "[data-route-phase]"
      )
      .forEach(b => {
        b.onclick = () => {
          const ph = b.dataset.routePhase;
          const p = ctx.project;

          if (!p) return;

          const inRouteModal =
            scope.id === "routeBackdrop";

          if (inRouteModal) {
            routeModalExpandedPhase =
              String(routeModalExpandedPhase) === String(ph)
                ? null
                : ph;
          } else {
            p.flow.expandedPhases[ph] =
              !p.flow.expandedPhases[ph];

            safeSave();
          }

          const target =
            inRouteModal
              ? id("routeModalList")
              : id("phaseNav");

          if (target) {
            target.innerHTML =
              routeHTML(p, inRouteModal);
          }

          bindRoute(
            scope.id === "routeBackdrop"
              ? scope
              : document
          );
        };
      });

    scope
      .querySelectorAll?.(
        "[data-route-stage]"
      )
      .forEach(b => {
        b.onclick = () => {
          const stage =
            Number(
              b.dataset.routeStage
            );

          const state =
            b.dataset.routeState;

          if (state === "future") {
            openFullStagePreview(stage);
            return;
          }

          /*
            Real route navigation leaves preview mode before changing
            the student's actual current stage.
          */
          previewStageId = null;

          removeModal("routeBackdrop");

          if (!ctx.project) return;

          ctx.project.currentStage =
            stage;

          F.markVisited(
            ctx.project,
            stage
          );

          safeSave();
          safeRender();

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        };
      });
  }

  async function openMore() {
    if (moreOpening) return;

    moreOpening = true;
    removeModal("moreBackdrop");

    let teacherMode = false;

    try {
      teacherMode =
        !!(
          await window
            .RMSTeacherSession
            ?.verify?.()
        );
    } finally {
      moreOpening = false;
    }

    const wrap =
      document.createElement("div");

    wrap.className = "modal-backdrop";
    wrap.id = "moreBackdrop";

    wrap.innerHTML = `
      <div class="modal more-menu-modal">

        <div class="journey-head">
          <div>
            <h3>Project options</h3>

            <p>
              Secondary actions live here so
              the main workspace stays focused.
            </p>
          </div>

          <button
            type="button"
            class="ghost small"
            id="closeMore"
          >
            Close
          </button>
        </div>

        <div class="more-menu-grid">

          <button
            type="button"
            data-proxy-click="exportDoc"
          >
            <b>Download Word notebook</b>

            <span>
              Download your current research
              notebook as a Microsoft
              Word-compatible .doc file.
            </span>
          </button>

          <button
            type="button"
            data-proxy-click="exportJson"
          >
            <b>Download backup</b>

            <span>
              Create a full recovery copy
              before switching devices or
              making major changes.
            </span>
          </button>

          <button
            type="button"
            data-open-research-snapshot
          >
            <b>Open My Research Snapshot</b>

            <span>
              See your accumulated work in
              one organized view.
            </span>
          </button>

          <button
            type="button"
            data-proxy-click="journeyBtn"
          >
            <b>My Research Journey</b>

            <span>
              See your milestones, completed
              stages, unresolved work, and the
              next best action.
            </span>
          </button>

          <button
            type="button"
            data-proxy-click="resetProject"
            class="destructive-option"
          >
            <b>Start a different project</b>

            <span>
              Your current project will stay
              only if you download a backup
              first.
            </span>
          </button>
        </div>

        ${
          teacherMode
            ? `
              <details
                class="teacher-mode-tools"
                open
              >
                <summary>
                  Private setup tools
                </summary>

                <div class="more-menu-grid">

                  <button
                    type="button"
                    data-proxy-click="pilotBtn"
                  >
                    <b>Pilot & Recovery</b>
                    <span>
                      Operational recovery and
                      pilot controls.
                    </span>
                  </button>

                  <button
                    type="button"
                    data-proxy-click="competencyBtn"
                  >
                    <b>Learning Analytics</b>
                    <span>
                      Private competency evidence.
                    </span>
                  </button>

                  <button
                    type="button"
                    data-proxy-click="transferBtn"
                  >
                    <b>Transfer Lab</b>
                    <span>
                      Transfer-assessment tools.
                    </span>
                  </button>

                  <button
                    type="button"
                    id="leaveTeacherMode"
                  >
                    <b>Leave private mode</b>
                    <span>
                      Return this browser session to the normal
                      student workspace.
                    </span>
                  </button>

                  <button
                    type="button"
                    data-proxy-click="aiSettings"
                  >
                    <b>Chat settings</b>
                    <span>
                      View the owner-controlled
                      endpoint, manage the
                      session class code,
                      and test the approved
                      secure backend.
                    </span>
                  </button>

                </div>
              </details>
            `
            : ""
        }
      </div>
    `;

    document.body.appendChild(wrap);

    id("closeMore")?.addEventListener(
      "click",
      () => wrap.remove()
    );

    id("leaveTeacherMode")?.addEventListener(
      "click",
      () => {
        window.RMSTeacherSession?.leave?.();
        location.href = "./";
      }
    );



    wrap.addEventListener("click", e => {
      if (e.target === wrap) {
        wrap.remove();
      }
    });

    wrap
      .querySelectorAll(
        "[data-proxy-click]"
      )
      .forEach(b => {
        b.addEventListener(
          "click",
          () => {
            const requested =
              b.dataset.proxyClick;

            const target =
              id(requested) ||
              (
                requested ===
                "exportDoc"
                  ? id("exportMd")
                  : null
              );

            wrap.remove();

            if (target) {
              target.click();
            } else {
              console.warn(
                "More menu target was not found",
                requested
              );
            }
          }
        );
      });
  }

  function maybeOnboard(
    p,
    save
  ) {
    F.normalizeProject(p);

    if (p.flow.onboarded) {
      removeModal(
        "studentOnboarding"
      );
      return;
    }

    removeModal(
      "studentOnboarding"
    );

    const wrap =
      document.createElement("div");

    wrap.className =
      "modal-backdrop";

    wrap.id =
      "studentOnboarding";

    wrap.innerHTML = `
      <div
        class="modal student-onboarding"
      >
        <div class="guide-kicker">
          Before you start
        </div>

        <h3>
          Your research work stays
          organized as you go
        </h3>

        <div class="onboarding-points">

          <div>
            <b>
              Your route stays visible.
            </b>

            <span>
              You can always see where
              you are, what is done,
              and what comes next.
            </span>
          </div>

          <div>
            <b>
              Your work saves on this
              browser.
            </b>

            <span>
              You can return to earlier
              answers. Download a backup
              before switching devices.
            </span>
          </div>

          <div>
            <b>
              Earlier changes do not
              erase later work.
            </b>

            <span>
              If an earlier decision
              changes, later stages may
              be marked “Needs review”
              while your answers remain
              saved.
            </span>
          </div>

          <div>
            <b>
              Help is always available.
            </b>

            <span>
              Examples, explanations,
              progressive help,
              Research Terms, and
              Research Chat are
              available when needed.
            </span>
          </div>
        </div>

        <button
          type="button"
          class="primary"
          id="finishOnboarding"
        >
          Start Stage
          ${p.currentStage || 1}
        </button>
      </div>
    `;

    document.body.appendChild(
      wrap
    );

    const finish =
      id("finishOnboarding");

    if (!finish) {
      console.error(
        "Start Stage button was not created."
      );
      return;
    }

    finish.addEventListener(
      "click",
      e => {
        e.preventDefault();
        e.stopPropagation();

        /*
          Remove the blocking modal first.

          A storage/save problem must never
          leave the student trapped behind
          the onboarding overlay.
        */
        wrap.remove();

        p.flow.onboarded = true;

        try {
          save?.();
        } catch (err) {
          console.error(
            "Could not save onboarding state",
            err
          );
        }

        /*
          Re-render if a render function
          has already been supplied.
        */
        try {
          ctx.render?.();
        } catch (err) {
          console.error(
            "Could not render after onboarding",
            err
          );
        }
      }
    );
  }

  function offerUndo(
    label,
    fn
  ) {
    id("flowUndoToast")?.remove();

    const t =
      document.createElement("div");

    t.id = "flowUndoToast";
    t.className =
      "flow-undo-toast";

    t.setAttribute(
      "role",
      "status"
    );

    t.innerHTML = `
      <span>${E(label)}</span>
      <button type="button">
        Undo
      </button>
    `;

    document.body.appendChild(t);

    const timer =
      setTimeout(
        () => t.remove(),
        9000
      );

    t.querySelector("button")
      ?.addEventListener(
        "click",
        () => {
          clearTimeout(timer);

          try {
            fn?.();
          } finally {
            t.remove();
          }
        }
      );
  }

  function labStepper(
    tabs,
    active,
    attr
  ) {
    const i =
      Math.max(
        0,
        tabs.findIndex(
          x => x[0] === active
        )
      );

    const cur = tabs[i];
    const prev = tabs[i - 1];
    const next = tabs[i + 1];

    return `
      <div class="lab-stepper">

        <div class="lab-stepper-top">

          <div>
            <span>
              Step ${i + 1}
              of ${tabs.length}
            </span>

            <b>
              ${E(
                cur?.[1]?.replace(
                  /^\d+\s*·\s*/,
                  ""
                ) ||
                "Current step"
              )}
            </b>
          </div>

          <details>
            <summary>
              View full lab route
            </summary>

            <div class="lab-route-list">
              ${tabs
                .map(
                  ([k, l], j) => `
                    <button
                      type="button"
                      data-${attr}="${k}"
                      class="${
                        active === k
                          ? "active"
                          : j < i
                            ? "done"
                            : ""
                      }"
                    >
                      <span>
                        ${j < i ? "✓" : j + 1}
                      </span>

                      ${E(
                        l.replace(
                          /^\d+\s*·\s*/,
                          ""
                        )
                      )}
                    </button>
                  `
                )
                .join("")}
            </div>
          </details>
        </div>

        <div class="lab-stepper-nav">

          ${
            prev
              ? `
                <button
                  type="button"
                  class="ghost small"
                  data-${attr}="${prev[0]}"
                >
                  ←
                  ${E(
                    prev[1].replace(
                      /^\d+\s*·\s*/,
                      ""
                    )
                  )}
                </button>
              `
              : "<span></span>"
          }

          ${
            next
              ? `
                <button
                  type="button"
                  class="secondary small"
                  data-${attr}="${next[0]}"
                >
                  ${E(
                    next[1].replace(
                      /^\d+\s*·\s*/,
                      ""
                    )
                  )}
                  →
                </button>
              `
              : "<span></span>"
          }

        </div>
      </div>
    `;
  }

  function bindGlobalDelegation() {
    if (globalDelegationBound) {
      return;
    }

    globalDelegationBound = true;

    document.addEventListener(
      "click",
      e => {
        const more =
          e.target.closest?.(
            "#moreMenuBtn"
          );

        if (more) {
          e.preventDefault();
          openMore();
          return;
        }

        const route =
          e.target.closest?.(
            "#routeBtn"
          );

        if (route) {
          e.preventDefault();
          openRoute();
          return;
        }

        const inlineRoute =
          e.target.closest?.(
            "[data-route-open]"
          );

        if (inlineRoute) {
          e.preventDefault();
          openRoute();
        }
      }
    );
  }

  function init(
    project,
    save,
    render
  ) {
    ctx = {
      project,
      save,
      render
    };

    F.normalizeProject(
      project
    );

    bindGlobalDelegation();
  }

  return {
    init,
    routeHTML,
    bindRoute,
    openRoute,
    previewStage,
    openFullStagePreview,
    exitStagePreview,
    getPreviewStage,
    isPreviewing,
    openMore,
    maybeOnboard,
    offerUndo,
    labStepper
  };
})();
