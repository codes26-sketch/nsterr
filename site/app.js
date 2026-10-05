(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const icons = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 15.4A8.4 8.4 0 0 1 8.6 3.4 8.5 8.5 0 1 0 20.6 15.4Z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.1 3.9M6.2 6.3C3.5 8.1 2 12 2 12s3.5 7 10 7c1 0 1.9-.2 2.8-.5"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>'
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  let questions = [];
  let owner = null;
  let visitorSession = false;
  let setupComplete = false;
  let initialCredentialsConfigured = false;
  let toastTimer;

  class ApiError extends Error {
    constructor(status, message, code) { super(message); this.status = status; this.code = code; }
  }
  async function api(path, { method = 'GET', body, retry = true } = {}) {
    const response = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && retry && owner && path !== '/api/owner-auth') {
      await signOutOwner(false);
      throw new ApiError(401, 'Your owner session ended. Please sign in again.');
    }
    if (!response.ok) throw new ApiError(response.status, data.error || 'NSTER could not complete that request.', data.code);
    return data;
  }
  function showToast(message) {
    const element = $('#toast'); element.textContent = message; element.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => element.hidden = true, 2900);
  }
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === 'dark';
    $('#themeToggle').innerHTML = dark ? icons.sun : icons.moon;
    $('#themeToggle').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    try { localStorage.setItem('nster-theme-v1', theme); } catch (_) {}
  }
  function hideMainViews() {
    $('#visitorGate').hidden = true;
    $('#visitorContent').hidden = true;
    $('#ownerWorkspace').hidden = true;
  }
  function showGate() {
    owner = null; visitorSession = false; hideMainViews(); $('#visitorGate').hidden = false;
    $('#visitorPassword').value = ''; $('#gateHint').textContent = ''; $('#gateHint').classList.remove('error');
    $('#questionSearch').value = ''; updateGate(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function updateGate() {
    $('#gateCopy').textContent = setupComplete
      ? 'Enter the password shared by your NSTER owner to view the answers.'
      : 'NSTER is ready for its main owner. Open the small owner control above to set it up.';
    $('#visitorPassword').disabled = !setupComplete;
    $('#visitorForm button[type="submit"]').disabled = !setupComplete;
  }
  async function showVisitor() {
    owner = null; hideMainViews(); $('#visitorContent').hidden = false;
    $('#visitorQaList').innerHTML = '<div class="empty-state">Loading answers…</div>';
    try { questions = (await api('/api/questions')).questions; renderQuestions(); }
    catch (error) { $('#visitorQaList').innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function showDialog(title, description, formHtml, formId) {
    $('#dialogRoot').innerHTML = `<div class="overlay" id="modalOverlay"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialogTitle"><div class="dialog-head"><div><h2 id="dialogTitle">${title}</h2><p>${description}</p></div><button type="button" class="close-btn" id="dialogClose" aria-label="Close">${closeIcon()}</button></div>${formHtml}</section></div>`;
    $('#dialogClose').addEventListener('click', closeDialog);
    $('#modalOverlay').addEventListener('click', event => { if (event.target.id === 'modalOverlay') closeDialog(); });
    const form = document.getElementById(formId); if (form) form.addEventListener('submit', event => event.preventDefault());
  }
  function closeDialog() { $('#dialogRoot').innerHTML = ''; }
  function closeIcon() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>'; }
  async function openOwnerAccess() {
    try {
      const status = await api('/api/status'); setupComplete = status.setupComplete; initialCredentialsConfigured = Boolean(status.initialCredentialsConfigured); updateGate();
    } catch (_) { /* The dialog still explains setup; its request will show an actionable error. */ }
    if (!setupComplete) { openSetupDialog(); return; }
    openLoginDialog();
  }
  function openSetupDialog() {
    const credentialFields = initialCredentialsConfigured ? '<p class="form-note">The first owner, visitor, and uploader accounts are configured privately in Netlify.</p>' : `<div><label for="setupDisplayName">Owner name</label><input class="field" id="setupDisplayName" maxlength="60" placeholder="How your name should appear" required></div>
      <div><label for="setupOwnerPass">Main owner password</label><input class="field" id="setupOwnerPass" type="password" minlength="8" maxlength="100" autocomplete="new-password" placeholder="At least 8 characters" required></div>
      <div><label for="setupVisitorPass">Visitor password</label><input class="field" id="setupVisitorPass" type="password" minlength="5" maxlength="100" autocomplete="new-password" placeholder="At least 5 characters" required></div>`;
    showDialog('Set up your NSTER', 'Create the first accounts for your private answer space.', `<form id="setupForm" class="form-stack">
      <div><label for="setupKey">One-time setup key</label><input class="field" id="setupKey" type="password" autocomplete="off" placeholder="From your Netlify environment settings" required></div>
      ${credentialFields}
      <p class="form-note">The setup key is stored only on Netlify. Share the visitor password with visitors; keep the owner password private.</p>
      <button class="primary-btn" type="submit">Create main owner access</button><p class="hint" id="dialogHint" aria-live="polite"></p>
    </form>`, 'setupForm');
    $('#setupForm').addEventListener('submit', async event => {
      event.preventDefault(); const button = event.currentTarget.querySelector('button[type="submit"]'); button.disabled = true;
      try {
        const result = await api('/api/setup', { method: 'POST', body: {
          setupKey: $('#setupKey').value,
          ...(initialCredentialsConfigured ? {} : { displayName: $('#setupDisplayName').value.trim(), ownerPassword: $('#setupOwnerPass').value, visitorPassword: $('#setupVisitorPass').value })
        }});
        setupComplete = true; owner = result.owner; closeDialog(); updateGate(); await loadOwnerWorkspace(); showToast('Your NSTER owner account is ready.');
      } catch (error) { setDialogError(error.message); button.disabled = false; }
    });
    $('#setupKey').focus();
  }
  function openLoginDialog() {
    showDialog('Owner access', 'Sign in to manage your NSTER space.', `<form id="loginForm" class="form-stack">
      <div><label for="accountType">Account type</label><select class="field" id="accountType"><option value="main">Main owner</option><option value="uploader">Question uploader</option></select></div>
      <div id="usernameField" hidden><label for="loginUsername">Username</label><input class="field" id="loginUsername" autocomplete="username" placeholder="Your username"></div>
      <div><label for="loginPassword">Password</label><input class="field" id="loginPassword" type="password" autocomplete="current-password" placeholder="Your password" required></div>
      <button class="primary-btn" type="submit">Sign in</button><p class="hint" id="dialogHint" aria-live="polite"></p>
    </form><p class="form-note">Question uploaders can publish new questions and answers. Only the main owner can change passwords or manage accounts.</p>`, 'loginForm');
    $('#accountType').addEventListener('change', () => { $('#usernameField').hidden = $('#accountType').value !== 'uploader'; });
    $('#loginForm').addEventListener('submit', async event => {
      event.preventDefault(); const button = event.currentTarget.querySelector('button[type="submit"]'); button.disabled = true;
      try {
        const accountType = $('#accountType').value;
        const result = await api('/api/owner-auth', { method: 'POST', body: {
          action: 'login', role: accountType,
          username: accountType === 'uploader' ? $('#loginUsername').value.trim() : '',
          password: $('#loginPassword').value
        }});
        owner = result.owner; closeDialog(); await loadOwnerWorkspace();
      } catch (error) { setDialogError(error.message); button.disabled = false; }
    });
    $('#loginPassword').focus();
  }
  function setDialogError(message) {
    const hint = $('#dialogHint'); if (!hint) return;
    hint.textContent = message; hint.classList.add('error');
  }
  async function loadOwnerWorkspace() {
    if (!owner) return;
    hideMainViews(); $('#ownerWorkspace').hidden = false;
    $('#ownerNameLine').textContent = owner.displayName;
    const isMain = owner.role === 'main';
    $('#ownerRoleLine').textContent = isMain ? 'Main owner · full access' : 'Question uploader · publish only';
    $('#workspaceTitle').textContent = isMain ? 'Your NSTER, your way.' : 'Share what you know.';
    $('#workspaceCopy').textContent = isMain ? 'Add helpful answers, keep the visitor password current, and invite a question uploader.' : 'Publish a helpful question and answer for NSTER visitors.';
    $('#questionFormTitle').textContent = isMain ? 'Add a question and answer' : 'Upload a question and answer';
    $('#questionFormCopy').textContent = isMain ? 'Share a clear answer. Add a code example when it helps.' : 'Your access lets you publish new answers for visitors.';
    $('#questionSubmit').innerHTML = `${isMain ? 'Publish question' : 'Upload question'} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`;
    $('#accessSettings').hidden = !isMain; $('#contributorSettings').hidden = !isMain; $('#existingQuestions').hidden = !isMain;
    if (isMain) { await loadAdminQuestions(); await loadContributors(); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function renderQuestions(filter = '') {
    const search = filter.trim().toLocaleLowerCase();
    const filtered = questions.filter(item => `${item.question} ${item.answer} ${item.code}`.toLocaleLowerCase().includes(search));
    $('#visitorQaList').innerHTML = filtered.length ? filtered.map((item, index) => `
      <article class="qa-card ${!search && index === 0 ? 'open' : ''}" data-id="${escapeHtml(item.id)}">
        <button class="qa-question" type="button" aria-expanded="${!search && index === 0 ? 'true' : 'false'}"><span>${escapeHtml(item.question)}</span><span class="chevron">${icons.chevron}</span></button>
        <div class="answer-wrap"><div class="answer-inner"><div class="answer">${escapeHtml(item.answer)}${item.code ? `<div class="codebox"><div class="code-top"><span>${escapeHtml(item.language || 'Code')}</span><button type="button" class="copy-btn" data-copy="${escapeHtml(item.id)}">${icons.copy} Copy code</button></div><pre><code>${escapeHtml(item.code)}</code></pre></div>` : ''}</div></div></div>
      </article>`).join('') : '<div class="empty-state">There are no matching answers yet.<br>Ask your NSTER owner to add one.</div>';
  }
  async function loadAdminQuestions() {
    try { questions = (await api('/api/questions')).questions; }
    catch (error) { showToast(error.message); questions = []; }
    const host = $('#adminQaList');
    host.innerHTML = questions.length ? questions.map(item => `<div class="admin-qa-row"><span title="${escapeHtml(item.question)}">${escapeHtml(item.question)}</span><button class="delete-btn" type="button" data-delete="${escapeHtml(item.id)}" aria-label="Delete ${escapeHtml(item.question)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"/></svg></button></div>`).join('') : '<p class="form-note">No questions published yet.</p>';
  }
  async function loadContributors() {
    try {
      const result = await api('/api/contributors');
      $('#contributorList').innerHTML = result.accounts.length ? result.accounts.map(person => `<div class="admin-qa-row"><span>${escapeHtml(person.displayName)} · ${escapeHtml(person.username)}</span><button class="delete-btn" type="button" data-remove-contributor="${escapeHtml(person.id)}" aria-label="Remove ${escapeHtml(person.username)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M5 12h14"/></svg></button></div>`).join('') : '<p class="form-note">No uploader accounts yet.</p>';
    } catch (error) { $('#contributorList').innerHTML = `<p class="form-note">${escapeHtml(error.message)}</p>`; }
  }
  async function signOutOwner(notify = true) {
    try { await api('/api/owner-auth', { method: 'POST', body: { action: 'logout' }, retry: false }); } catch (_) {}
    owner = null;
    if (notify) { showGate(); showToast('You are signed out.'); }
  }
  $('#themeToggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  $('#ownerOpen').addEventListener('click', openOwnerAccess);
  $('#brandHome').addEventListener('click', event => { event.preventDefault(); if (owner || visitorSession) showGate(); else showGate(); });
  $('#visitorForm').addEventListener('submit', async event => {
    event.preventDefault(); const hint = $('#gateHint'); hint.textContent = ''; hint.classList.remove('error');
    const button = event.currentTarget.querySelector('button[type="submit"]'); button.disabled = true;
    try { await api('/api/visitor-auth', { method: 'POST', body: { password: $('#visitorPassword').value } }); visitorSession = true; await showVisitor(); }
    catch (error) { hint.textContent = error.message; hint.classList.add('error'); $('#visitorPassword').select(); }
    finally { button.disabled = !setupComplete; }
  });
  document.querySelectorAll('.show-pass').forEach(button => {
    button.innerHTML = icons.eye;
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.toggle); const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password'; button.innerHTML = visible ? icons.eyeOff : icons.eye;
      button.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    });
  });
  $('#questionSearch').addEventListener('input', event => renderQuestions(event.target.value));
  $('#visitorQaList').addEventListener('click', async event => {
    const copy = event.target.closest('[data-copy]');
    if (copy) {
      const item = questions.find(row => row.id === copy.dataset.copy); if (!item) return;
      try { await navigator.clipboard.writeText(item.code); copy.innerHTML = '✓ Copied'; setTimeout(() => { copy.innerHTML = `${icons.copy} Copy code`; }, 1400); }
      catch (_) { showToast('Clipboard access is unavailable in this browser.'); }
      return;
    }
    const trigger = event.target.closest('.qa-question'); if (!trigger) return;
    const card = trigger.closest('.qa-card'); card.classList.toggle('open'); trigger.setAttribute('aria-expanded', card.classList.contains('open'));
  });
  $('#questionForm').addEventListener('submit', async event => {
    event.preventDefault(); const button = $('#questionSubmit'); button.disabled = true;
    try {
      await api('/api/questions', { method: 'POST', body: {
        question: $('#questionInput').value.trim(), answer: $('#answerInput').value.trim(),
        language: $('#codeLanguage').value.trim(), code: $('#codeInput').value.trim()
      }});
      event.currentTarget.reset(); showToast('Your question is published on NSTER.');
      if (owner?.role === 'main') await loadAdminQuestions();
    } catch (error) { showToast(error.message); }
    finally { button.disabled = false; }
  });
  $('#adminQaList').addEventListener('click', async event => {
    const button = event.target.closest('[data-delete]'); if (!button || owner?.role !== 'main') return;
    button.disabled = true;
    try { await api(`/api/questions?id=${encodeURIComponent(button.dataset.delete)}`, { method: 'DELETE' }); await loadAdminQuestions(); showToast('Question removed.'); }
    catch (error) { button.disabled = false; showToast(error.message); }
  });
  $('#visitorPasswordForm').addEventListener('submit', async event => {
    event.preventDefault(); const button = event.currentTarget.querySelector('button'); button.disabled = true;
    try { await api('/api/settings', { method: 'PATCH', body: { visitorPassword: $('#newVisitorPassword').value } }); event.currentTarget.reset(); showToast('Visitor password updated.'); }
    catch (error) { showToast(error.message); }
    finally { button.disabled = false; }
  });
  $('#contributorForm').addEventListener('submit', async event => {
    event.preventDefault(); const button = event.currentTarget.querySelector('button'); button.disabled = true;
    try {
      await api('/api/contributors', { method: 'POST', body: {
        username: $('#contributorName').value.trim(), displayName: $('#contributorDisplayName').value.trim(), password: $('#contributorPassword').value
      }});
      event.currentTarget.reset(); await loadContributors(); showToast('Question uploader account created.');
    } catch (error) { showToast(error.message); }
    finally { button.disabled = false; }
  });
  $('#contributorList').addEventListener('click', async event => {
    const button = event.target.closest('[data-remove-contributor]'); if (!button || owner?.role !== 'main') return;
    button.disabled = true;
    try { await api(`/api/contributors?id=${encodeURIComponent(button.dataset.removeContributor)}`, { method: 'DELETE' }); await loadContributors(); showToast('Uploader account removed.'); }
    catch (error) { button.disabled = false; showToast(error.message); }
  });
  $('#ownerLogout').addEventListener('click', () => signOutOwner(true));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && $('#dialogRoot').innerHTML) closeDialog(); });

  async function boot() {
    $('#year').textContent = new Date().getFullYear();
    let theme = 'light'; try { theme = localStorage.getItem('nster-theme-v1') || 'light'; } catch (_) {}
    setTheme(theme); updateGate();
    try {
      const [status, session] = await Promise.all([api('/api/status'), api('/api/session')]);
      setupComplete = status.setupComplete; initialCredentialsConfigured = Boolean(status.initialCredentialsConfigured); updateGate();
      if (session.role === 'main' || session.role === 'uploader') { owner = session.owner; await loadOwnerWorkspace(); }
      else if (session.role === 'visitor') { visitorSession = true; await showVisitor(); }
    } catch (_) {
      if (location.protocol !== 'file:') {
        $('#gateHint').textContent = 'Connect the Supabase database and Netlify Functions to open NSTER.';
        $('#gateHint').classList.add('error');
      }
    }
  }
  boot();
})();
