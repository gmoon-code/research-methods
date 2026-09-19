window.RMSAdminContentPublicationUI = (() => {
  "use strict";

  let mounted = false;
  let busy = false;
  let baselineSynced = false;
  let current = null;
  let revisions = [];

  function id(value) {
    return document.getElementById(
      value
    );
  }

  function service() {
    return window
      .RMSAdminContentService;
  }

  function publication() {
    return window
      .RMSAdminContentPublication;
  }

  function studioUi() {
    return window
      .RMSAdminContentStudioUI;
  }

  function registry() {
    return window
      .RMSContentRegistry;
  }

  function setStatus(
    message,
    tone = ""
  ) {
    const element =
      id(
        "contentPublicationStatus"
      );

    if (!element) {
      return;
    }

    element.textContent =
      String(message || "");

    element.dataset.tone =
      String(tone || "");
  }

  function formatTime(
    value
  ) {
    const timestamp =
      Date.parse(
        String(value || "")
      );

    if (
      !Number.isFinite(
        timestamp
      )
    ) {
      return "Unknown time";
    }

    return new Date(
      timestamp
    ).toLocaleString();
  }

  function shortRelease(
    value
  ) {
    const text =
      String(value || "");

    if (
      text.length <= 22
    ) {
      return text;
    }

    return (
      text.slice(0, 12) +
      "…" +
      text.slice(-7)
    );
  }

  function currentReleaseId() {
    return (
      typeof current
        ?.release_id ===
        "string"
        ? current.release_id
        : null
    );
  }

  function changeSummary() {
    return String(
      id(
        "contentChangeSummary"
      )?.value ||
      ""
    ).trim();
  }

  function renderEndpoint() {
    const origin =
      service()
        ?.endpointOrigin?.() ||
      "";

    const endpoint =
      id(
        "contentPublicationEndpoint"
      );

    if (endpoint) {
      endpoint.textContent =
        origin ||
        "Not configured";
    }

    const serviceEndpoint =
      id(
        "adminContentServiceEndpoint"
      );

    if (serviceEndpoint) {
      serviceEndpoint.textContent =
        origin ||
        "Not configured";
    }
  }

  function renderHistory() {
    const list =
      id(
        "contentRevisionList"
      );

    if (!list) {
      return;
    }

    list.replaceChildren();

    const count =
      id(
        "contentPublicationHistoryCount"
      );

    if (count) {
      count.textContent =
        `${revisions.length} revision${revisions.length === 1 ? "" : "s"}`;
    }

    if (
      revisions.length ===
      0
    ) {
      const empty =
        document.createElement(
          "p"
        );

      empty.className =
        "publication-empty";

      empty.textContent =
        "No revision history is available yet.";

      list.appendChild(
        empty
      );

      return;
    }

    for (
      const revision
      of revisions
    ) {
      const row =
        document.createElement(
          "div"
        );

      row.className =
        "publication-revision";

      const details =
        document.createElement(
          "div"
        );

      const name =
        document.createElement(
          "strong"
        );

      name.textContent =
        shortRelease(
          revision.release_id
        );

      const meta =
        document.createElement(
          "span"
        );

      meta.textContent =
        `${formatTime(
          revision.published_at
        )} · ${revision.change_summary || "No summary"}`;

      details.append(
        name,
        meta
      );

      row.appendChild(
        details
      );

      if (
        revision.release_id ===
        currentReleaseId()
      ) {
        const badge =
          document.createElement(
            "span"
          );

        badge.className =
          "section-status";

        badge.textContent =
          "Current";

        row.appendChild(
          badge
        );
      } else {
        const button =
          document.createElement(
            "button"
          );

        button.type =
          "button";

        button.className =
          "button";

        button.textContent =
          "Roll back";

        button.disabled =
          busy ||
          !service()?.isActive?.() ||
          !baselineSynced ||
          !currentReleaseId();

        button.addEventListener(
          "click",
          () => {
            void rollbackTo(
              revision.release_id
            );
          }
        );

        row.appendChild(
          button
        );
      }

      list.appendChild(
        row
      );
    }
  }

  function renderState() {
    const active =
      Boolean(
        service()
          ?.isActive?.()
      );

    const session =
      id(
        "contentPublicationSessionState"
      );

    if (session) {
      session.textContent =
        active
          ? "Connected"
          : "Not connected";
    }

    const currentElement =
      id(
        "contentPublicationCurrent"
      );

    if (currentElement) {
      currentElement.textContent =
        currentReleaseId()
          ? shortRelease(
              currentReleaseId()
            )
          : "No published release";
    }

    const dashboard =
      id(
        "adminContentPublishingStatus"
      );

    if (dashboard) {
      dashboard.textContent =
        active &&
        baselineSynced
          ? "Isolated backend connected"
          : "Isolated backend not connected";
    }

    const connect =
      id(
        "connectContentPublication"
      );

    if (connect) {
      connect.disabled =
        busy;
    }

    const disconnect =
      id(
        "disconnectContentPublication"
      );

    if (disconnect) {
      disconnect.disabled =
        busy ||
        !active;
    }

    const refresh =
      id(
        "refreshContentPublication"
      );

    if (refresh) {
      refresh.disabled =
        busy ||
        !active;
    }

    const publish =
      id(
        "publishContentRelease"
      );

    if (publish) {
      publish.disabled =
        busy ||
        !active ||
        !baselineSynced;
    }

    renderHistory();
  }

  function setBusy(value) {
    busy =
      Boolean(value);

    renderState();
  }

  function clearCode() {
    const input =
      id(
        "contentPublicationCode"
      );

    if (input) {
      input.value = "";
    }
  }

  async function loadRemote({
    forceRebase = false
  } = {}) {
    const api =
      service();

    const model =
      publication();

    const editor =
      studioUi();

    if (
      !api ||
      !model ||
      !editor ||
      !api.isActive()
    ) {
      baselineSynced =
        false;
      renderState();
      return false;
    }

    const stateResult =
      await api.state();

    if (
      !stateResult.ok ||
      stateResult.body
        ?.configured !==
        true
    ) {
      baselineSynced =
        false;

      setStatus(
        stateResult.error ||
        "Publication state could not be read.",
        "error"
      );

      renderState();
      return false;
    }

    current =
      stateResult.body
        .published === true
        ? stateResult.body.current
        : null;

    if (
      stateResult.body
        .published === true
    ) {
      const publicResult =
        await api
          .publicRelease();

      if (
        !publicResult.ok ||
        !publicResult.published ||
        !publicResult.release
      ) {
        baselineSynced =
          false;

        setStatus(
          publicResult.error ||
          "Current published content could not be loaded.",
          "error"
        );

        renderState();
        return false;
      }

      const hydrated =
        model.hydrateRelease(
          publicResult.release,
          registry()
        );

      if (!hydrated.ok) {
        baselineSynced =
          false;

        setStatus(
          hydrated.errors
            .join(" "),
          "error"
        );

        renderState();
        return false;
      }

      if (
        editor.hasDirtyDrafts() &&
        !forceRebase
      ) {
        const accepted =
          window.confirm(
            "Content Studio has in-memory draft changes. Connecting to the publication service will replace those drafts with the backend's current published release. Continue?"
          );

        if (!accepted) {
          baselineSynced =
            false;

          setStatus(
            "Publication service is connected, but publishing is locked until Content Studio is synchronized with the current backend release.",
            "warning"
          );

          renderState();
          return false;
        }
      }

      if (
        !editor.replaceBaseline(
          hydrated.records,
          "current isolated publication"
        )
      ) {
        baselineSynced =
          false;

        setStatus(
          "Content Studio could not load the current published release.",
          "error"
        );

        renderState();
        return false;
      }
    } else {
      if (
        editor.hasDirtyDrafts() &&
        !forceRebase
      ) {
        const accepted =
          window.confirm(
            "The isolated backend has no current publication. Keep the current in-memory drafts and use the bundled seed as the publication baseline?"
          );

        if (!accepted) {
          baselineSynced =
            false;
          renderState();
          return false;
        }
      }

      baselineSynced =
        true;
    }

    const historyResult =
      await api.revisions();

    if (
      historyResult.ok &&
      Array.isArray(
        historyResult.body
          ?.revisions
      )
    ) {
      revisions =
        historyResult.body
          .revisions;
    } else {
      revisions = [];
    }

    baselineSynced =
      true;

    setStatus(
      currentReleaseId()
        ? "Content Studio is synchronized with the isolated backend's current published release."
        : "Publication service is connected. The isolated backend has no current release.",
      "ok"
    );

    renderState();
    return true;
  }

  async function connect() {
    const api =
      service();

    const code =
      String(
        id(
          "contentPublicationCode"
        )?.value ||
        ""
      ).trim();

    if (!api) {
      setStatus(
        "Publication service module is unavailable.",
        "error"
      );
      return;
    }

    setBusy(true);

    const result =
      await api.login(
        code
      );

    clearCode();

    if (!result.ok) {
      baselineSynced =
        false;

      setStatus(
        result.error ||
        "Publication access was not accepted.",
        "error"
      );

      setBusy(false);
      return;
    }

    await loadRemote();

    setBusy(false);
  }

  function disconnect() {
    service()
      ?.leave?.();

    baselineSynced =
      false;
    current = null;
    revisions = [];

    setStatus(
      "Publication service disconnected. Existing Content Studio drafts remain in this page only.",
      ""
    );

    renderState();
  }

  async function refresh() {
    if (
      !service()
        ?.isActive?.()
    ) {
      return;
    }

    setBusy(true);
    await loadRemote();
    setBusy(false);
  }

  async function publish() {
    const api =
      service();

    const model =
      publication();

    const editor =
      studioUi();

    if (
      !api ||
      !model ||
      !editor ||
      !api.isActive() ||
      !baselineSynced
    ) {
      setStatus(
        "Connect and synchronize the publication service before publishing.",
        "warning"
      );
      return;
    }

    const result =
      model.buildCandidate(
        editor.snapshotRecords(),
        currentReleaseId(),
        changeSummary()
      );

    if (!result.ok) {
      setStatus(
        result.errors
          .join(" "),
        "error"
      );
      return;
    }

    if (
      !window.confirm(
        "Publish the complete 18-stage guidance release to the isolated v3 backend? The public student site does not consume this backend yet."
      )
    ) {
      return;
    }

    setBusy(true);

    const response =
      await api.publish(
        result.candidate
      );

    if (!response.ok) {
      if (
        response.status ===
        409
      ) {
        baselineSynced =
          false;
      }

      setStatus(
        response.error ||
        "Publication failed.",
        response.status === 409
          ? "warning"
          : "error"
      );

      setBusy(false);
      renderState();
      return;
    }

    const summary =
      id(
        "contentChangeSummary"
      );

    if (summary) {
      summary.value = "";
    }

    await loadRemote({
      forceRebase: true
    });

    setStatus(
      "The complete 18-stage release was published to the isolated v3 backend and Content Studio was rebased to that release.",
      "ok"
    );

    setBusy(false);
  }

  async function rollbackTo(
    targetReleaseId
  ) {
    const api =
      service();

    const model =
      publication();

    if (
      !api ||
      !model ||
      !api.isActive() ||
      !baselineSynced
    ) {
      return;
    }

    const result =
      model.buildRollback(
        currentReleaseId(),
        targetReleaseId,
        changeSummary()
      );

    if (!result.ok) {
      setStatus(
        result.errors
          .join(" "),
        "error"
      );
      return;
    }

    if (
      !window.confirm(
        `Create a new release that restores revision ${shortRelease(targetReleaseId)}? The public student site still will not consume this backend.`
      )
    ) {
      return;
    }

    setBusy(true);

    const response =
      await api.rollback(
        result.request
      );

    if (!response.ok) {
      if (
        response.status ===
        409
      ) {
        baselineSynced =
          false;
      }

      setStatus(
        response.error ||
        "Rollback failed.",
        response.status === 409
          ? "warning"
          : "error"
      );

      setBusy(false);
      renderState();
      return;
    }

    const summary =
      id(
        "contentChangeSummary"
      );

    if (summary) {
      summary.value = "";
    }

    await loadRemote({
      forceRebase: true
    });

    setStatus(
      "Rollback created a new current release and Content Studio was synchronized to it.",
      "ok"
    );

    setBusy(false);
  }

  async function restoreSession() {
    const api =
      service();

    if (
      !api ||
      !api.hasStoredSession()
    ) {
      renderState();
      return;
    }

    setBusy(true);

    const verified =
      await api.verify();

    if (verified) {
      await loadRemote({
        forceRebase: true
      });
    } else {
      baselineSynced =
        false;
      setStatus(
        "Saved publication session could not be verified. Connect again to publish.",
        "warning"
      );
    }

    setBusy(false);
  }

  function mount() {
    if (mounted) {
      return true;
    }

    if (
      !service() ||
      !publication() ||
      !studioUi() ||
      !registry()
    ) {
      setStatus(
        "Publication modules are unavailable.",
        "error"
      );
      return false;
    }

    renderEndpoint();

    id(
      "connectContentPublication"
    )?.addEventListener(
      "click",
      () => {
        void connect();
      }
    );

    id(
      "disconnectContentPublication"
    )?.addEventListener(
      "click",
      disconnect
    );

    id(
      "refreshContentPublication"
    )?.addEventListener(
      "click",
      () => {
        void refresh();
      }
    );

    id(
      "publishContentRelease"
    )?.addEventListener(
      "click",
      () => {
        void publish();
      }
    );

    id(
      "contentPublicationCode"
    )?.addEventListener(
      "keydown",
      event => {
        if (
          event.key ===
          "Enter"
        ) {
          event.preventDefault();
          void connect();
        }
      }
    );

    renderState();

    mounted = true;

    void restoreSession();

    return true;
  }

  return Object.freeze({
    mount
  });
})();