(() => {
  'use strict';

  const PROJECT_KEY = 'research_methods_studio_v1';
  const CODE_KEY = 'rms_chat_access_code_v214';
  const HISTORY_KEY = 'rms_chat_history_v214';
  const MAX_HISTORY = 8;
  const OMIT_FIELD = /(raw|dataset|data[_ -]?table|participant|respondent|student[_ -]?name|full[_ -]?name|email|phone|student[_ -]?id|identifier|address)/i;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  function endpoint() {
    const configured = window.RMS_RUNTIME_CONFIG?.researchChatEndpoint;
    return String(configured || '/api/research-chat').trim();
  }

  function safeProject() {
    try {
      const value = JSON.parse(localStorage.getItem(PROJECT_KEY) || 'null');
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  }

  function history() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.slice(-MAX_HISTORY) : [];
    } catch {
      return [];
    }
  }

  function saveHistory(items) {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(-MAX_HISTORY)));
    } catch {}
  }

  function code() {
    try { return sessionStorage.getItem(CODE_KEY) || ''; } catch { return ''; }
  }

  function saveCode(value) {
    try {
      if (value) sessionStorage.setItem(CODE_KEY, value);
      else sessionStorage.removeItem(CODE_KEY);
    } catch {}
  }

  function stageTitle(project) {
    const id = Number(project?.currentStage || 0);
    const stage = window.RMSCurriculum?.stages?.find?.(item => Number(item.id) === id);
    return { id, title: stage?.title || stage?.nav || '' };
  }

  function focusedField() {
    const el = document.activeElement?.matches?.('[data-field]') ? document.activeElement : document.querySelector('[data-field]:focus');
    if (!el) return { key: '', label: '', value: '' };
    const key = String(el.dataset.field || '');
    const label = el.closest('label')?.querySelector('span')?.textContent?.trim() || key;
    const blocked = OMIT_FIELD.test(key) || OMIT_FIELD.test(label);
    return {
      key,
      label,
      value: blocked ? '[omitted for privacy]' : String(el.value || '').slice(0, 2500)
    };
  }

  function projectSummary(project) {
    const d = project?.data || {};
    const candidates = {
      project_name: project?.name,
      course_context: project?.context,
      research_path: project?.pathway?.selected,
      broad_topic: d.broadTopic,
      topic_choice: d.topicChoice,
      research_question: d.finalRQ,
      purpose: d.purposeStatement,
      design: d.designType,
      predictor_or_iv: d.predictorIV,
      outcome_or_dv: d.outcomeDV,
      hypothesis: d.hypothesis,
      sample: d.samplePlan,
      measurement: d.measurementPlan,
      ethics: d.ethicsPlan,
      analysis_choice: d.analysisChoice,
      title: d.titleDraft
    };
    const summary = {};
    for (const [key, value] of Object.entries(candidates)) {
      if (value === undefined || value === null || value === '') continue;
      if (OMIT_FIELD.test(key)) continue;
      summary[key] = String(value).slice(0, 1800);
    }
    return summary;
  }

  function verifiedSources(project) {
    return (Array.isArray(project?.sources) ? project.sources : [])
      .filter(source => source?.verified === true)
      .slice(0, 20)
      .map(source => ({
        id: String(source.id || '').slice(0, 100),
        title: String(source.title || source.citation || '').slice(0, 300),
        citation: String(source.citation || '').slice(0, 500),
        year: String(source.year || '').slice(0, 40),
        finding: String(source.finding || '').slice(0, 1200),
        limits: String(source.limits || '').slice(0, 900),
        verified: true
      }))
      .filter(source => source.id && (source.title || source.citation));
  }

  function contextPayload(useProjectContext) {
    if (!useProjectContext) {
      return {
        stage: { id: 0, title: '' },
        focused_field: { key: '', label: '', value: '' },
        project: { summary: {}, verified_sources: [] }
      };
    }
    const project = safeProject();
    return {
      stage: stageTitle(project),
      focused_field: focusedField(),
      project: {
        summary: projectSummary(project),
        verified_sources: verifiedSources(project)
      }
    };
  }

  function ensureUI() {
    if ($('rmsResearchChat')) return;
    const panel = document.createElement('aside');
    panel.id = 'rmsResearchChat';
    panel.className = 'rms-chat-drawer';
    panel.setAttribute('aria-label', 'Research Chat');
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <div class="rms-chat-head">
        <div>
          <div class="eyebrow">Research support</div>
          <h2>Chat</h2>
        </div>
        <button class="ghost small" id="rmsChatClose" type="button" aria-label="Close Chat">Close</button>
      </div>
      <div class="rms-chat-status-row">
        <span id="rmsChatStatus" class="rms-chat-status">Not connected</span>
        <button class="ghost small" id="rmsChatSettings" type="button">Settings</button>
      </div>
      <div id="rmsChatSetup" class="rms-chat-setup">
        <label>
          <span>Class code</span>
          <input id="rmsChatCode" type="password" autocomplete="off" inputmode="text" placeholder="Enter your class code">
        </label>
        <button class="secondary small" id="rmsChatConnect" type="button">Connect</button>
      </div>
      <div class="rms-chat-privacy">
        <strong>What Chat sends</strong>
        <p>Your question and recent Chat messages go to the secure class Chat service. Relevant research responses from this notebook are included only when <b>Use my current project context</b> is on. Raw datasets are excluded. Obvious email addresses and phone numbers are removed when possible.</p>
      </div>
      <label class="rms-chat-context-toggle">
        <input id="rmsChatUseContext" type="checkbox" checked>
        <span>Use my current project context</span>
      </label>
      <div id="rmsChatMessages" class="rms-chat-messages" aria-live="polite"></div>
      <form id="rmsChatForm" class="rms-chat-form">
        <label>
          <span class="sr-only">Ask Chat a research question</span>
          <textarea id="rmsChatQuestion" rows="3" maxlength="3000" placeholder="Ask about the research step you are working on…"></textarea>
        </label>
        <div class="rms-chat-form-actions">
          <span class="muted tiny">Do not paste raw participant data or identifying information.</span>
          <button class="primary" id="rmsChatSend" type="submit">Send</button>
        </div>
      </form>`;
    document.body.appendChild(panel);

    $('rmsChatClose').onclick = close;
    $('rmsChatSettings').onclick = () => {
      $('rmsChatSetup').hidden = !$('rmsChatSetup').hidden;
      if (!$('rmsChatSetup').hidden) $('rmsChatCode').focus();
    };
    $('rmsChatConnect').onclick = connect;
    $('rmsChatForm').addEventListener('submit', send);
    $('rmsChatCode').value = code();
    renderHistory();
  }

  function renderHistory() {
    const box = $('rmsChatMessages');
    if (!box) return;
    const items = history();
    if (!items.length) {
      box.innerHTML = `<div class="rms-chat-empty"><strong>Ask about the step in front of you.</strong><p>Chat can explain research terms, help you evaluate a choice, or suggest what to check next. It will not invent data or sources.</p></div>`;
      return;
    }
    box.innerHTML = items.map(message => {
      const role = message.role === 'assistant' ? 'Chat' : 'You';
      return `<div class="rms-chat-message ${message.role === 'assistant' ? 'assistant' : 'user'}"><div class="rms-chat-role">${role}</div><div>${esc(message.content).replace(/\n/g, '<br>')}</div></div>`;
    }).join('');
    box.scrollTop = box.scrollHeight;
  }

  function renderAssistant(result) {
    const citations = Array.isArray(result?.citations) ? result.citations : [];
    const steps = Array.isArray(result?.next_steps) ? result.next_steps : [];
    const status = result?.status === 'source_verification_needed'
      ? `<div class="rms-chat-source-warning">Source verification needed before Chat can attach that citation.</div>`
      : '';
    const sourceHtml = citations.length
      ? `<div class="rms-chat-citations"><strong>Verified project sources</strong>${citations.map(c => `<div>${esc(c.source_id)} · ${esc(c.title)}</div>`).join('')}</div>`
      : '';
    const stepsHtml = steps.length
      ? `<div class="rms-chat-next"><strong>What to do next</strong><ol>${steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol></div>`
      : '';
    return `${status}<div>${esc(result?.answer || '').replace(/\n/g, '<br>')}</div>${stepsHtml}${sourceHtml}`;
  }

  function appendRenderedAssistant(result) {
    const box = $('rmsChatMessages');
    if (!box) return;
    if (box.querySelector('.rms-chat-empty')) box.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'rms-chat-message assistant';
    wrap.innerHTML = `<div class="rms-chat-role">Chat</div>${renderAssistant(result)}`;
    box.appendChild(wrap);
    box.scrollTop = box.scrollHeight;
  }

  function setStatus(text, state = '') {
    const el = $('rmsChatStatus');
    if (!el) return;
    el.textContent = text;
    el.dataset.state = state;
  }

  async function connect() {
    const entered = String($('rmsChatCode')?.value || '').trim();
    if (!entered) {
      setStatus('Enter the class code', 'bad');
      return false;
    }
    saveCode(entered);
    setStatus('Checking…', 'busy');
    try {
      const res = await fetch(`${endpoint()}?health=1`, {
        method: 'GET',
        headers: { 'x-rms-chat-code': entered }
      });
      if (res.status === 401) {
        setStatus('Class code not accepted', 'bad');
        return false;
      }
      if (!res.ok) {
        setStatus('Chat service unavailable', 'bad');
        return false;
      }
      const data = await res.json().catch(() => ({}));
      if (!data.ok) {
        setStatus('Chat service unavailable', 'bad');
        return false;
      }
      setStatus('Connected', 'ok');
      $('rmsChatSetup').hidden = true;
      return true;
    } catch {
      setStatus('Chat service unavailable', 'bad');
      return false;
    }
  }

  async function send(event) {
    event.preventDefault();
    const textarea = $('rmsChatQuestion');
    const sendButton = $('rmsChatSend');
    const question = String(textarea?.value || '').trim();
    if (!question) return;
    if (!code()) {
      $('rmsChatSetup').hidden = false;
      $('rmsChatCode').focus();
      setStatus('Enter the class code', 'bad');
      return;
    }

    const previous = history();
    const userMessage = { role: 'user', content: question };
    const outboundHistory = previous.slice(-MAX_HISTORY);
    saveHistory([...previous, userMessage]);
    renderHistory();
    textarea.value = '';
    sendButton.disabled = true;
    sendButton.textContent = 'Sending…';
    setStatus('Working…', 'busy');

    try {
      const res = await fetch(endpoint(), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-rms-chat-code': code()
        },
        body: JSON.stringify({
          question,
          history: outboundHistory,
          context: contextPayload(Boolean($('rmsChatUseContext')?.checked))
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setStatus('Class code not accepted', 'bad');
        $('rmsChatSetup').hidden = false;
        return;
      }
      if (!res.ok) throw new Error('chat_unavailable');
      const assistantText = String(data.answer || '');
      saveHistory([...history(), { role: 'assistant', content: assistantText }]);
      renderHistory();
      const box = $('rmsChatMessages');
      const assistantMessages = box ? box.querySelectorAll('.rms-chat-message.assistant') : [];
      const lastAssistant = assistantMessages.length ? assistantMessages[assistantMessages.length - 1] : null;
      if (lastAssistant) lastAssistant.innerHTML = `<div class="rms-chat-role">Chat</div>${renderAssistant(data)}`;
      setStatus('Connected', 'ok');
    } catch {
      setStatus('Chat service unavailable', 'bad');
      const box = $('rmsChatMessages');
      if (box) box.insertAdjacentHTML('beforeend', `<div class="rms-chat-message assistant"><div class="rms-chat-role">Chat</div><div>I could not reach the class Chat service. Your project work is still saved locally.</div></div>`);
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = 'Send';
    }
  }

  function open({ focusCode = false } = {}) {
    ensureUI();
    const panel = $('rmsResearchChat');
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('rms-chat-open');
    $('researchChatBtn')?.setAttribute('aria-expanded', 'true');
    if (focusCode || !code()) {
      $('rmsChatSetup').hidden = false;
      setTimeout(() => $('rmsChatCode')?.focus(), 0);
    } else {
      setTimeout(() => $('rmsChatQuestion')?.focus(), 0);
    }
  }

  function close() {
    const panel = $('rmsResearchChat');
    if (!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('rms-chat-open');
    $('researchChatBtn')?.setAttribute('aria-expanded', 'false');
    $('researchChatBtn')?.focus();
  }

  function bind() {
    ensureUI();
    const chatButton = $('researchChatBtn');
    if (chatButton) chatButton.onclick = () => open();

    const settings = $('aiSettings');
    if (settings) {
      settings.textContent = 'Chat settings';
      settings.onclick = () => open({ focusCode: true });
    }

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && $('rmsResearchChat')?.classList.contains('open')) close();
    });
  }

  window.RMSResearchChat = {
    open,
    close,
    contextPayload,
    projectSummary,
    verifiedSources
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
