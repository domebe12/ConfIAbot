(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------- Intent engine ----------------
  const INTENTS = [
    {
      id: 'glucosa',
      test: (t) => /gluco|az[uú]car|diabet/.test(t),
      label: 'Riesgo de salud (glucosa)',
      botReply: 'Veo que mencionas temas de glucosa. Ya registré esto junto a tu historial reciente — cuentas con varias consultas relacionadas. Te recomiendo agendar un control con endocrinología cuanto antes.',
      reasoning: 'Se detectan varias consultas relacionadas a glucosa en los últimos 6 meses, combinadas con la edad del afiliado (45 años). El modelo activa la rama de "Señales de salud" y concluye riesgo ALTO de diabetes tipo 2.',
      treePath: 'salud-alto',
      alert: { key: 'diabetes', icon: '⚠️', title: 'Riesgo de diabetes tipo 2',
        text: '4 consultas relacionadas a glucosa en los últimos 6 meses, combinadas con la edad del afiliado.',
        plan: ['Agendar control con endocrinología', 'Enviar material educativo sobre alimentación', 'Activar seguimiento trimestral de glucosa'] },
    },
    {
      id: 'queja',
      test: (t) => /quej|reclam|molest|insatisf|mal servicio|p[eé]sim|no.{0,3}resuelv/.test(t),
      label: 'Riesgo de satisfacción (queja)',
      botReply: 'Lamento que hayas tenido inconvenientes. Registré tu comentario — veo que no es la primera vez, así que lo estoy escalando a nuestro equipo de retención para un seguimiento personalizado.',
      reasoning: 'Se detectan quejas repetidas en los últimos 2 meses. El modelo activa la rama de "Señales de satisfacción" y concluye riesgo ALTO de no renovación.',
      treePath: 'queja-alto',
      alert: { key: 'renovacion', icon: '⚠️', title: 'Riesgo de no renovación',
        text: '3 quejas registradas en los últimos 2 meses — patrón de insatisfacción recurrente.',
        plan: ['Contacto proactivo de un asesor en 24h', 'Ofrecer compensación o mejora de plan', 'Marcar cuenta para seguimiento prioritario'] },
    },
    {
      id: 'cita', test: (t) => /cita|turno|agendar|consulta m[eé]dica/.test(t),
      label: 'Consulta de cita médica',
      botReply: 'Tu próxima cita es el 15 de octubre de 2025 a las 10:30 a.m. con el Dr. Andrés López en Clínica SanVida. ¿Quieres que te la recuerde un día antes?',
      reasoning: 'Consulta puntual sobre citas médicas, sin patrón de riesgo asociado. El modelo sigue la rama de "Señales de salud" con desenlace de seguimiento estándar.',
      treePath: 'salud-bajo',
    },
    {
      id: 'reembolso', test: (t) => /reembolso|reintegr|devoluci[oó]n/.test(t),
      label: 'Solicitud de reembolso',
      botReply: 'Para tu reembolso necesito la factura y el comprobante de pago. Ya inicié la solicitud — te llegará una confirmación por correo en las próximas 24 horas.',
      reasoning: 'Solicitud administrativa estándar. No se activan señales de riesgo; el modelo la clasifica como interacción informativa normal.',
      treePath: 'queja-bajo',
    },
    {
      id: 'receta', test: (t) => /receta|medicamento|farmacia|pastilla/.test(t),
      label: 'Consulta de receta',
      botReply: 'Tu receta activa incluye Losartán 50mg — puedes reclamarla en cualquier farmacia afiliada presentando tu cédula. ¿Quieres que te muestre las farmacias más cercanas?',
      reasoning: 'Consulta puntual sobre medicación, sin patrón de riesgo asociado. Camino de seguimiento estándar dentro de "Señales de salud".',
      treePath: 'salud-bajo',
    },
    {
      id: 'autorizacion', test: (t) => /autorizaci|procedimiento|cirug[ií]a/.test(t),
      label: 'Autorización de procedimiento',
      botReply: 'Tu solicitud de autorización fue recibida y está en revisión por nuestro equipo médico. El tiempo estimado de respuesta es de 48 horas.',
      reasoning: 'Solicitud administrativa estándar. Interacción informativa normal, sin señales de riesgo.',
      treePath: 'queja-bajo',
    },
  ];
  const DEFAULT_INTENT = {
    id: 'general', label: 'Consulta general',
    botReply: 'Gracias por tu mensaje, lo registré. Mientras lo reviso más a fondo, ¿hay algo puntual en lo que te pueda ayudar — una cita, un reembolso, una receta o una autorización?',
    reasoning: 'El mensaje no coincide con un patrón de riesgo conocido. El modelo lo clasifica como interacción informativa normal y sigue aprendiendo del historial del afiliado.',
    treePath: 'queja-bajo',
  };
  function matchIntent(text) {
    const t = text.toLowerCase();
    return INTENTS.find((i) => i.test(t)) || DEFAULT_INTENT;
  }

  // ---------------- State ----------------
  const state = { messages: 0, alerts: {}, lastIntent: null, pendingRow: null };

  // ---------------- View switching ----------------
  const views = Array.from(document.querySelectorAll('.view'));
  const tabBtns = Array.from(document.querySelectorAll('.tab-btn'));
  function showView(name) {
    views.forEach((v) => v.classList.toggle('active', v.dataset.view === name));
    tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.view === name));
    if (name === 'almacenamiento') renderPendingRow();
    if (name === 'procesamiento') playTree();
    if (name === 'cliente') renderClient();
    if (name === 'chat') document.getElementById('chatInput').focus();
  }
  function unlockTab(name) {
    const b = tabBtns.find((x) => x.dataset.view === name);
    if (b) b.disabled = false;
  }
  tabBtns.forEach((b) => b.addEventListener('click', () => { if (!b.disabled) showView(b.dataset.view); }));
  document.getElementById('btnOpenChat').addEventListener('click', () => showView('chat'));
  document.getElementById('btnGoProc').addEventListener('click', () => showView('procesamiento'));
  document.getElementById('btnGoCliente').addEventListener('click', () => showView('cliente'));

  // ---------------- Chat ----------------
  const chatBody = document.getElementById('chatBody');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');

  function addBubble(text, who) {
    const d = document.createElement('div');
    d.className = 'bubble ' + who;
    d.textContent = text;
    chatBody.appendChild(d);
    chatBody.scrollTop = chatBody.scrollHeight;
    return d;
  }
  function addTyping() {
    const d = document.createElement('div');
    d.className = 'typing-dots';
    d.innerHTML = '<span></span><span></span><span></span>';
    chatBody.appendChild(d);
    chatBody.scrollTop = chatBody.scrollHeight;
    return d;
  }

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    addBubble(text, 'user');
    chatInput.value = '';
    const intent = matchIntent(text);
    state.lastIntent = intent;
    state.messages++;

    const typing = addTyping();
    setTimeout(() => {
      typing.remove();
      addBubble(intent.botReply, 'bot');
      queueStorageRow(text, intent);
      unlockTab('almacenamiento'); unlockTab('procesamiento'); unlockTab('cliente');
      showToast();
    }, reduced ? 50 : 950);
  });

  // ---------------- Toast ----------------
  const toast = document.getElementById('toast');
  let toastTimer = null;
  function showToast() {
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 6000);
  }
  toast.addEventListener('click', () => { toast.classList.remove('show'); showView('almacenamiento'); });

  // ---------------- Almacenamiento ----------------
  const storeBody = document.getElementById('storeBody');
  const btnGoProc = document.getElementById('btnGoProc');
  const seedRows = [
    { time: 'Ayer · 16:42', canal: 'App móvil', msg: '¿Cuál es mi plan actual?', intent: 'Consulta general', state: 'ok' },
    { time: 'Ayer · 09:15', canal: 'Portal web', msg: 'Necesito mi carné digital', intent: 'Consulta general', state: 'ok' },
  ];
  seedRows.forEach((r) => storeBody.appendChild(makeRow(r, false)));

  function makeRow(r, isNew) {
    const tr = document.createElement('tr');
    if (isNew) tr.classList.add('new-row');
    tr.innerHTML =
      '<td>' + r.time + '</td>' +
      '<td>' + r.canal + '</td>' +
      '<td class="cell-msg"></td>' +
      '<td><span class="tag-intent">' + r.intent + '</span></td>' +
      '<td><span class="tag-state ' + r.state + '">' + (r.state === 'ok' ? 'Guardado ✓' : 'Guardando…') + '</span></td>';
    tr.querySelector('.cell-msg').textContent = r.msg;
    return tr;
  }

  function queueStorageRow(text, intent) {
    state.pendingRow = { time: nowLabel(), canal: 'App móvil', msg: text, intent: intent.label };
  }
  function nowLabel() {
    return 'Hoy · ' + new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  }
  function renderPendingRow() {
    if (!state.pendingRow) { btnGoProc.disabled = state.lastIntent === null; return; }
    const r = state.pendingRow; state.pendingRow = null;
    const tr = document.createElement('tr');
    tr.classList.add('new-row');
    tr.innerHTML =
      '<td>' + r.time + '</td>' +
      '<td>' + r.canal + '</td>' +
      '<td class="cell-msg"><span class="caret">|</span></td>' +
      '<td></td><td><span class="tag-state pending">Guardando…</span></td>';
    storeBody.insertBefore(tr, storeBody.firstChild);
    btnGoProc.disabled = true;
    const cell = tr.querySelector('.cell-msg');
    const caret = cell.querySelector('.caret');
    if (reduced) {
      cell.textContent = r.msg;
      finishRow(tr, r);
      return;
    }
    let i = 0;
    const speed = Math.max(12, Math.min(34, 900 / r.msg.length));
    const timer = setInterval(() => {
      cell.insertBefore(document.createTextNode(r.msg[i]), caret);
      i++;
      if (i >= r.msg.length) { clearInterval(timer); setTimeout(() => finishRow(tr, r), 250); }
    }, speed);
  }
  function finishRow(tr, r) {
    tr.querySelector('.caret')?.remove();
    tr.children[3].innerHTML = '<span class="tag-intent">' + r.intent + '</span>';
    tr.children[4].innerHTML = '<span class="tag-state ok">Guardado ✓</span>';
    btnGoProc.disabled = false;
  }

  // ---------------- Procesamiento (decision tree) ----------------
  const reasoningText = document.getElementById('reasoningText');
  const btnGoCliente = document.getElementById('btnGoCliente');
  const PATHS = {
    'salud-alto': { nodes: ['n-root', 'n-a'], edges: ['e-root-a', 'e-a-a1'], leaf: 'leaf-salud-alto', danger: true },
    'salud-bajo': { nodes: ['n-root', 'n-a'], edges: ['e-root-a', 'e-a-a2'], leaf: 'leaf-salud-bajo', danger: false },
    'queja-alto': { nodes: ['n-root', 'n-b'], edges: ['e-root-b', 'e-b-b1'], leaf: 'leaf-queja-alto', danger: true },
    'queja-bajo': { nodes: ['n-root', 'n-b'], edges: ['e-root-b', 'e-b-b2'], leaf: 'leaf-queja-bajo', danger: false },
  };
  function clearTree() {
    document.querySelectorAll('#treeSvg .active').forEach((el) => el.classList.remove('active'));
    document.querySelectorAll('#treeSvg .win').forEach((el) => el.classList.remove('win', 'danger'));
  }
  function playTree() {
    clearTree();
    btnGoCliente.disabled = true;
    if (!state.lastIntent) { reasoningText.textContent = 'Envía un mensaje en el Chat para ver el razonamiento del modelo.'; return; }
    const path = PATHS[state.lastIntent.treePath];
    reasoningText.textContent = '';
    const steps = [...path.nodes, ...path.edges];
    steps.forEach((id, idx) => {
      setTimeout(() => { document.getElementById(id).classList.add('active'); }, reduced ? 0 : idx * 260);
    });
    setTimeout(() => {
      const leaf = document.getElementById(path.leaf);
      leaf.classList.add('win'); if (path.danger) leaf.classList.add('danger');
      reasoningText.textContent = state.lastIntent.reasoning;
      btnGoCliente.disabled = false;
    }, reduced ? 0 : steps.length * 260 + 200);
  }

  // ---------------- Cliente interno ----------------
  const statMsgs = document.getElementById('statMsgs');
  const statAlerts = document.getElementById('statAlerts');
  const statRenewal = document.getElementById('statRenewal');
  const statRenewalWrap = document.getElementById('statRenewalWrap');
  const alertsWrap = document.getElementById('alertsWrap');
  const alertBaseline = document.getElementById('alertBaseline');

  function renderClient() {
    statMsgs.textContent = state.messages;
    if (state.lastIntent && state.lastIntent.alert) addAlert(state.lastIntent.alert);
    const count = Object.keys(state.alerts).length;
    statAlerts.textContent = count;
    const highRisk = !!state.alerts.renovacion;
    statRenewal.textContent = highRisk ? 'Alto' : 'Bajo';
    statRenewalWrap.classList.toggle('risk', highRisk);
    alertBaseline.style.display = count ? 'none' : 'flex';
  }
  function addAlert(a) {
    if (state.alerts[a.key]) return;
    state.alerts[a.key] = true;
    const div = document.createElement('div');
    div.className = 'alert-card warn';
    div.innerHTML = '<span class="alert-ic">' + a.icon + '</span><div><b>' + a.title + '</b><p>' + a.text + '</p>' +
      '<ul>' + a.plan.map((p) => '<li>' + p + '</li>').join('') + '</ul></div>';
    alertsWrap.appendChild(div);
  }

  // ---------------- Ambient background particles ----------------
  const bg = document.getElementById('bgCanvas');
  const bgCtx = bg.getContext('2d');
  let bgW, bgH, particles = [];
  function resizeBg() { bgW = bg.width = window.innerWidth; bgH = bg.height = document.documentElement.scrollHeight; }
  function initParticles() {
    particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * bgW, y: Math.random() * bgH,
      vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15, r: Math.random() * 1.5 + 0.6,
    }));
  }
  function drawBg() {
    bgCtx.clearRect(0, 0, bgW, bgH);
    bgCtx.fillStyle = 'rgba(11,99,206,0.3)';
    particles.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = bgW; if (p.x > bgW) p.x = 0;
      if (p.y < 0) p.y = bgH; if (p.y > bgH) p.y = 0;
      bgCtx.beginPath(); bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2); bgCtx.fill();
    });
  }
  function bgLoop() { drawBg(); requestAnimationFrame(bgLoop); }
  window.addEventListener('resize', () => { resizeBg(); initParticles(); });
  resizeBg(); initParticles();
  if (!reduced) bgLoop(); else drawBg();
})();
