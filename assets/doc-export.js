(() => {
  'use strict';
  const PROJECT_KEY = 'research_methods_studio_v1';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  function project() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PROJECT_KEY) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function valueHtml(value) {
    if (Array.isArray(value)) return `<ul>${value.filter(Boolean).map(v => `<li>${esc(typeof v === 'object' ? JSON.stringify(v) : v)}</li>`).join('')}</ul>`;
    if (value && typeof value === 'object') return `<pre>${esc(JSON.stringify(value, null, 2))}</pre>`;
    return `<p>${esc(value).replace(/\n/g, '<br>')}</p>`;
  }

  function stageSections(p) {
    const stages = window.RMSCurriculum?.stages || [];
    const d = p.data || {};
    const parts = [];
    for (const stage of stages) {
      const fields = [];
      for (const section of stage.sections || []) {
        for (const field of section.fields || []) {
          const [key, label] = field;
          const value = d[key];
          if (value === undefined || value === null || value === '') continue;
          fields.push(`<h4>${esc(label)}</h4>${valueHtml(value)}`);
        }
      }
      if (fields.length) {
        parts.push(`<section><h2>Stage ${Number(stage.id)}. ${esc(stage.title || stage.nav || '')}</h2>${fields.join('')}</section>`);
      }
    }
    return parts.join('');
  }

  function sourcesSection(p) {
    const sources = Array.isArray(p.sources) ? p.sources : [];
    if (!sources.length) return '';
    return `<section><h2>Literature records</h2>${sources.map(source => `
      <div class="source">
        <h3>${esc(source.id || 'Source')} ${source.verified ? '<span class="verified">Verified</span>' : ''}</h3>
        <p><strong>Citation</strong><br>${esc(source.citation || source.title || '')}</p>
        ${source.finding ? `<p><strong>Finding or evidence note</strong><br>${esc(source.finding)}</p>` : ''}
        ${source.limits ? `<p><strong>Limitations</strong><br>${esc(source.limits)}</p>` : ''}
      </div>`).join('')}</section>`;
  }

  function fallbackDataSection(p) {
    const d = p.data || {};
    const used = new Set();
    for (const stage of window.RMSCurriculum?.stages || []) {
      for (const section of stage.sections || []) for (const field of section.fields || []) used.add(field[0]);
    }
    const remaining = Object.entries(d).filter(([key, value]) => !used.has(key) && value !== '' && value !== undefined && value !== null);
    if (!remaining.length) return '';
    return `<section><h2>Additional notebook fields</h2>${remaining.map(([key, value]) => `<h4>${esc(key.replace(/([a-z])([A-Z])/g, '$1 $2'))}</h4>${valueHtml(value)}`).join('')}</section>`;
  }

  function wordDocument(p) {
    const ready = Object.values(p.ready || {}).filter(Boolean).length;
    const total = window.RMSCurriculum?.stages?.length || 18;
    const title = p.name || 'Research Methods Studio Notebook';
    return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.45;color:#222;max-width:7.3in;margin:.7in auto}h1{font-size:20pt;margin:0 0 6pt}h2{font-size:15pt;margin:20pt 0 7pt;border-bottom:1px solid #bbb;padding-bottom:4pt}h3{font-size:12pt;margin:12pt 0 4pt}h4{font-size:10.5pt;margin:10pt 0 2pt;color:#444}p{margin:2pt 0 8pt}pre{white-space:pre-wrap;font-family:Calibri,Arial,sans-serif;border:1px solid #ddd;padding:8pt}.meta{color:#555}.source{border-left:3px solid #999;padding-left:9pt;margin:10pt 0}.verified{font-size:8.5pt;border:1px solid #8aa68f;padding:1pt 4pt;margin-left:4pt}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4pt}</style></head>
<body>
<h1>${esc(title)}</h1>
<p class="meta">${p.context ? `${esc(p.context)}<br>` : ''}Exported ${esc(new Date().toLocaleString())}<br>Progress ${ready} of ${total} stages marked ready</p>
${stageSections(p) || '<p>No notebook fields have been completed yet.</p>'}
${sourcesSection(p)}
${fallbackDataSection(p)}
</body></html>`;
  }

  function filename(p) {
    const stem = String(p.name || 'research-notebook').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'research-notebook';
    return `${stem}.doc`;
  }

  function downloadWord() {
    const p = project();
    const blob = new Blob(['\ufeff', wordDocument(p)], { type: 'application/msword;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename(p);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 600);
  }

  function bind() {
    const button = document.getElementById('exportMd');
    if (!button) return;
    button.textContent = 'Download Word (.doc)';
    button.title = 'Download your research notebook as a Word-compatible .doc file';
    button.onclick = downloadWord;
  }

  window.RMSDocExport = { downloadWord, wordDocument };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
