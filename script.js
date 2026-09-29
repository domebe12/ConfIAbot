(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------- Intent engine ----------------
  const INTENTS = [
    {
      id: 'glucosa',
      test: (t) => /gluco|az[uú]car|diabet/.test(t),
      label: 'Riesgo de salud (glucosa)',
      botReply: 'Veo que mencionas temas de glucosa. Ya registré esto junto a tu historial reciente — cuentas con varias consultas relacionadas. Te recomiendo agendar un control con endocrinología cuanto antes.',
      reasoning: 'Se detectan consultas relacionadas a glucosa, combinadas con la edad del afiliado. El modelo activa la rama de "Señales de salud".',
      treePath: 'salud-alto',
    },
    {
      id: 'queja',
      test: (t) => /quej|reclam|molest|insatisf|mal servicio|p[eé]sim|no.{0,3}resuelv/.test(t),
      label: 'Riesgo de satisfacción (queja)',
      botReply: 'Lamento que hayas tenido inconvenientes. Registré tu comentario — veo que no es la primera vez, así que lo estoy escalando a nuestro equipo de retención para un seguimiento personalizado.',
      reasoning: 'Se detectan quejas repetidas. El modelo activa la rama de "Señales de satisfacción".',
      treePath: 'queja-alto',
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
  const BRANCH = {
    glucosa: 'diabetes', cita: 'diabetes', receta: 'diabetes',
    queja: 'no_renovacion', reembolso: 'no_renovacion', autorizacion: 'no_renovacion', general: 'no_renovacion',
  };

  // ---------------- State ----------------
  const state = { messages: 0, alerts: {}, lastIntent: null, pendingRow: null, risk: null };

  // ---------------- Modelo real: Regresión Logística + Random Forest ----------------
  // Entrenados con scikit-learn sobre una base de afiliados sintética (ver
  // train_models.py) y exportados a assets/models.json. La inferencia corre
  // aquí mismo, en el navegador, con los pesos/árboles reales del modelo.
  let MODELS = null;
  fetch('assets/models.json')
    .then((r) => r.json())
    .then((m) => { MODELS = m; paintModelMeta(); })
    .catch(() => {});

  // Perfil "vivo" del afiliado — arranca en valores neutrales y se actualiza
  // con cada mensaje real del chat (no son casillas fijas: alimentan el modelo).
  const profile = {
    edad: 45, imc: 25, historial_familiar_diabetes: 0, num_citas_glucosa_6m: 0,
    num_quejas_2m: 0, tiempo_respuesta_prom_h: 20, nps_score: 8, antiguedad: 6,
  };
  const DIAB_THRESHOLD = 0.45, RENOV_THRESHOLD = 0.5;

  function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
  function predictLogreg(model, feat) {
    const { mean, scale, coef, intercept } = model.logreg;
    let z = intercept;
    model.features.forEach((f, i) => { z += ((feat[f] - mean[i]) / scale[i]) * coef[i]; });
    return sigmoid(z);
  }
  function evalTree(node, feat) {
    if ('leaf' in node) return node.leaf;
    return feat[node.f] <= node.th ? evalTree(node.l, feat) : evalTree(node.r, feat);
  }
  function predictRF(model, feat) {
    const probs = model.rf.trees.map((t) => evalTree(t, feat));
    return probs.reduce((a, b) => a + b, 0) / probs.length;
  }
  function predictEnsemble(model, feat) { return (predictLogreg(model, feat) + predictRF(model, feat)) / 2; }
  function percentileOf(model, score) {
    const arr = model.segment_sample;
    let i = 0; while (i < arr.length && arr[i] <= score) i++;
    return Math.round((i / arr.length) * 100);
  }
  function fallbackRisk() {
    return { diab: { proba: 0, pct: 0, pctl: 0, high: false }, renov: { proba: 0, pct: 0, pctl: 0, high: false } };
  }
  function computeRisk() {
    if (!MODELS) return null;
    const diabP = predictEnsemble(MODELS.diabetes, profile);
    const renovP = predictEnsemble(MODELS.no_renovacion, profile);
    return {
      diab: { proba: diabP, pct: Math.round(diabP * 100), pctl: percentileOf(MODELS.diabetes, diabP), high: diabP >= DIAB_THRESHOLD },
      renov: { proba: renovP, pct: Math.round(renovP * 100), pctl: percentileOf(MODELS.no_renovacion, renovP), high: renovP >= RENOV_THRESHOLD },
    };
  }
  function applyIntentToProfile(intent) {
    if (intent.id === 'glucosa') profile.num_citas_glucosa_6m = Math.min(8, profile.num_citas_glucosa_6m + 1);
    if (intent.id === 'queja') {
      profile.num_quejas_2m = Math.min(6, profile.num_quejas_2m + 1);
      profile.tiempo_respuesta_prom_h = Math.min(72, profile.tiempo_respuesta_prom_h + 6);
      profile.nps_score = Math.max(1, profile.nps_score - 1.1);
    }
  }
  function outcomeFromRisk(intent, risk) {
    const branch = BRANCH[intent.id] || 'no_renovacion';
    if (branch === 'diabetes') return { index: risk.diab.high ? 0 : 2, danger: risk.diab.high };
    return { index: risk.renov.high ? 1 : 2, danger: risk.renov.high };
  }
  function plural(n, singular, plural2) { return n + ' ' + (n === 1 ? singular : plural2); }
  function realStatsLine(intent, risk) {
    const branch = BRANCH[intent.id] || 'no_renovacion';
    if (branch === 'diabetes') {
      return ' Modelo real (regresión logística + random forest): ' + risk.diab.pct + '% de probabilidad de riesgo de diabetes tipo 2 (percentil ' + risk.diab.pctl + ' del segmento, con ' + plural(profile.num_citas_glucosa_6m, 'consulta relacionada', 'consultas relacionadas') + ' a glucosa registrada' + (profile.num_citas_glucosa_6m === 1 ? '' : 's') + ').';
    }
    return ' Modelo real (regresión logística + random forest): ' + risk.renov.pct + '% de probabilidad de no renovación (percentil ' + risk.renov.pctl + ' del segmento, con ' + plural(profile.num_quejas_2m, 'queja registrada', 'quejas registradas') + ').';
  }
  function paintModelMeta() {
    const el = document.getElementById('modelMeta');
    if (!el || !MODELS) return;
    el.textContent = 'Modelo real entrenado con scikit-learn sobre ' + MODELS.meta.trained_on.toLocaleString('es-EC') +
      ' registros sintéticos · AUC diabetes ' + MODELS.diabetes.metrics.auc_logreg +
      ' · AUC no renovación ' + MODELS.no_renovacion.metrics.auc_logreg;
  }

  // ---------------- View switching ----------------
  const views = Array.from(document.querySelectorAll('.view'));
  const tabBtns = Array.from(document.querySelectorAll('.tab-btn'));
  function showView(name) {
    views.forEach((v) => v.classList.toggle('active', v.dataset.view === name));
    tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.view === name));
    if (name === 'almacenamiento') renderPendingRow();
    if (name === 'procesamiento') playNetwork();
    if (name === 'cliente') renderClient();
    if (name === 'chat') document.getElementById('chatInput').focus();
  }
  function unlockTab(name) {
    const b = tabBtns.find((x) => x.dataset.view === name);
    if (b) b.disabled = false;
  }
  tabBtns.forEach((b) => b.addEventListener('click', () => { if (!b.disabled) showView(b.dataset.view); }));
  const btnOpenChat = document.getElementById('btnOpenChat');
  btnOpenChat.addEventListener('click', () => showView('chat'));
  btnOpenChat.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showView('chat'); } });
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
    applyIntentToProfile(intent);
    state.risk = computeRisk() || fallbackRisk();
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

  // ---------------- Procesamiento (red neuronal profunda) ----------------
  const reasoningText = document.getElementById('reasoningText');
  const btnGoCliente = document.getElementById('btnGoCliente');
  const netCanvas = document.getElementById('netCanvas');
  const netCtx = netCanvas.getContext('2d');

  const LAYER_COUNTS = [6, 9, 9, 7, 3];
  const INPUT_LABELS = ['Texto del mensaje', 'Edad y género', 'Historial de citas', 'Quejas registradas', 'Diagnósticos previos', 'Canal de contacto'];
  const OUTPUT_LABELS = ['Riesgo de salud', 'Riesgo de no renovación', 'Seguimiento estándar'];
  const LAYER_DELAY = 230, RAMP = 300;

  let netNodes = [], netEdges = [], netW = 0, netH = 0, netAnimId = null, netStart = 0, netSettled = false, netOutcome = null;

  function buildNetLayout() {
    const rect = netCanvas.getBoundingClientRect();
    netW = rect.width; netH = rect.height;
    const dpr = window.devicePixelRatio || 1;
    netCanvas.width = netW * dpr; netCanvas.height = netH * dpr;
    netCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const padLeft = Math.min(150, netW * 0.19);
    const padRight = Math.min(190, netW * 0.24);
    const padTop = 14, padBottom = 14;
    netNodes = [];
    LAYER_COUNTS.forEach((count, layer) => {
      const x = padLeft + (layer * (netW - padLeft - padRight)) / (LAYER_COUNTS.length - 1);
      for (let i = 0; i < count; i++) {
        const y = padTop + ((i + 1) * (netH - padTop - padBottom)) / (count + 1);
        netNodes.push({ layer, index: i, x, y, delay: layer * LAYER_DELAY + i * 14 });
      }
    });
    netEdges = [];
    for (let l = 0; l < LAYER_COUNTS.length - 1; l++) {
      const a = netNodes.filter((n) => n.layer === l);
      const b = netNodes.filter((n) => n.layer === l + 1);
      a.forEach((na) => b.forEach((nb) => netEdges.push({ a: na, b: nb })));
    }
  }
  function smoothstep(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function nodeProgress(node, t) { return smoothstep((t - node.delay) / RAMP); }

  function drawNet(t) {
    netCtx.clearRect(0, 0, netW, netH);
    // edges
    netEdges.forEach((e) => {
      const p = nodeProgress(e.a, t);
      if (p <= 0.01) { netCtx.strokeStyle = 'rgba(15,58,92,0.07)'; netCtx.lineWidth = 1; }
      else {
        const alpha = 0.10 + 0.55 * p;
        netCtx.strokeStyle = 'rgba(31,186,214,' + alpha.toFixed(2) + ')';
        netCtx.lineWidth = 1 + p * 0.8;
      }
      netCtx.beginPath(); netCtx.moveTo(e.a.x, e.a.y); netCtx.lineTo(e.b.x, e.b.y); netCtx.stroke();
    });
    // nodes
    netNodes.forEach((n) => {
      const p = nodeProgress(n, t);
      const isInput = n.layer === 0, isOutput = n.layer === LAYER_COUNTS.length - 1;
      const isWin = isOutput && netOutcome && n.index === netOutcome.index && netSettled;
      let r = isInput || isOutput ? 7 : 5;
      if (isWin) r = 9;

      if (isWin) {
        netCtx.beginPath(); netCtx.arc(n.x, n.y, r + 7, 0, Math.PI * 2);
        netCtx.fillStyle = netOutcome.danger ? 'rgba(194,52,52,0.16)' : 'rgba(24,138,74,0.16)';
        netCtx.fill();
      }
      netCtx.beginPath(); netCtx.arc(n.x, n.y, r, 0, Math.PI * 2);
      if (isWin) netCtx.fillStyle = netOutcome.danger ? '#c23434' : '#188a4a';
      else if (p <= 0.01) netCtx.fillStyle = '#dbe6f0';
      else netCtx.fillStyle = 'rgb(' + Math.round(11 + (31 - 11) * p) + ',' + Math.round(37 + (186 - 37) * p) + ',' + Math.round(69 + (214 - 69) * p) + ')';
      netCtx.fill();
      if (p > 0.01 || isWin) { netCtx.lineWidth = 1.5; netCtx.strokeStyle = isWin ? '#fff' : 'rgba(11,99,206,0.35)'; netCtx.stroke(); }
    });
    // labels
    netCtx.font = '600 10.5px Inter, sans-serif';
    netCtx.textBaseline = 'middle';
    netNodes.filter((n) => n.layer === 0).forEach((n, i) => {
      netCtx.fillStyle = '#4f6b85'; netCtx.textAlign = 'right';
      netCtx.fillText(INPUT_LABELS[i] || '', n.x - 12, n.y);
    });
    netNodes.filter((n) => n.layer === LAYER_COUNTS.length - 1).forEach((n) => {
      const isWin = netOutcome && n.index === netOutcome.index && netSettled;
      netCtx.fillStyle = isWin ? (netOutcome.danger ? '#c23434' : '#188a4a') : '#4f6b85';
      netCtx.font = isWin ? '700 11px Inter, sans-serif' : '600 10.5px Inter, sans-serif';
      netCtx.textAlign = 'left';
      netCtx.fillText(OUTPUT_LABELS[n.index] || '', n.x + 14, n.y);
    });
  }

  function netLoop(now) {
    const t = now - netStart;
    drawNet(t);
    const totalDur = (LAYER_COUNTS.length - 1) * LAYER_DELAY + RAMP;
    if (t < totalDur) {
      netAnimId = requestAnimationFrame(netLoop);
    } else {
      netSettled = true;
      drawNet(totalDur);
      reasoningText.textContent = state.lastIntent.reasoning + realStatsLine(state.lastIntent, state.risk || fallbackRisk());
      btnGoCliente.disabled = false;
    }
  }
  function playNetwork() {
    if (netAnimId) cancelAnimationFrame(netAnimId);
    buildNetLayout();
    btnGoCliente.disabled = true;
    netSettled = false;
    if (!state.lastIntent) {
      netOutcome = null; drawNet(-1);
      reasoningText.textContent = 'Envía un mensaje en el Chat para ver el razonamiento del modelo.';
      return;
    }
    const risk = state.risk || fallbackRisk();
    netOutcome = outcomeFromRisk(state.lastIntent, risk);
    reasoningText.textContent = '';
    if (reduced) {
      netSettled = true;
      const totalDur = (LAYER_COUNTS.length - 1) * LAYER_DELAY + RAMP;
      drawNet(totalDur);
      reasoningText.textContent = state.lastIntent.reasoning + realStatsLine(state.lastIntent, risk);
      btnGoCliente.disabled = false;
      return;
    }
    netStart = performance.now();
    netAnimId = requestAnimationFrame(netLoop);
  }
  window.addEventListener('resize', () => {
    if (document.querySelector('.view[data-view="procesamiento"]').classList.contains('active')) {
      buildNetLayout();
      const totalDur = (LAYER_COUNTS.length - 1) * LAYER_DELAY + RAMP;
      drawNet(netSettled ? totalDur : 0);
    }
  });

  // ---------------- Cliente interno ----------------
  const statMsgs = document.getElementById('statMsgs');
  const statAlerts = document.getElementById('statAlerts');
  const statRenewal = document.getElementById('statRenewal');
  const statRenewalWrap = document.getElementById('statRenewalWrap');
  const alertsWrap = document.getElementById('alertsWrap');
  const alertBaseline = document.getElementById('alertBaseline');
  const riskGauge = document.getElementById('riskGauge');
  const riskGaugeLabel = document.getElementById('riskGaugeLabel');
  const riskPctEl = document.getElementById('riskPct');
  const riskDeltaEl = document.getElementById('riskDelta');
  const opText = document.getElementById('opText');

  function renderClient() {
    statMsgs.textContent = state.messages;
    const risk = state.risk || fallbackRisk();

    if (risk.diab.high) {
      addAlert({
        key: 'diabetes', icon: '⚠️', title: 'Riesgo de diabetes tipo 2',
        text: 'Modelo real (regresión logística + random forest): ' + risk.diab.pct + '% de probabilidad — percentil ' + risk.diab.pctl +
          ' del segmento, con ' + plural(profile.num_citas_glucosa_6m, 'consulta relacionada', 'consultas relacionadas') + ' a glucosa en los últimos 6 meses.',
        plan: ['Agendar control con endocrinología', 'Enviar material educativo sobre alimentación', 'Activar seguimiento trimestral de glucosa'],
      });
    }
    if (risk.renov.high) {
      addAlert({
        key: 'renovacion', icon: '⚠️', title: 'Riesgo de no renovación',
        text: 'Modelo real (regresión logística + random forest): ' + risk.renov.pct + '% de probabilidad — percentil ' + risk.renov.pctl +
          ' del segmento, con ' + plural(profile.num_quejas_2m, 'queja registrada', 'quejas registradas') + ' recientemente.',
        plan: ['Contacto proactivo de un asesor en 24h', 'Ofrecer compensación o mejora de plan', 'Marcar cuenta para seguimiento prioritario'],
      });
    }
    const count = Object.keys(state.alerts).length;
    statAlerts.textContent = count;
    statRenewal.textContent = risk.renov.high ? 'Alto' : 'Bajo';
    statRenewalWrap.classList.toggle('risk', risk.renov.high);
    alertBaseline.style.display = count ? 'none' : 'flex';

    if (riskGauge) {
      const pct = risk.renov.pct;
      const segmentAvgPct = Math.round((MODELS ? MODELS.no_renovacion.segment_mean : 0.17) * 100);
      riskGauge.style.setProperty('--pct', pct);
      riskGauge.classList.toggle('risk', risk.renov.high);
      riskGaugeLabel.textContent = risk.renov.high ? 'Alto' : 'Bajo';
      riskPctEl.textContent = pct + '%';
      const delta = pct - segmentAvgPct;
      riskDeltaEl.classList.toggle('risk', risk.renov.high);
      riskDeltaEl.textContent = (delta === 0
        ? 'en línea con el promedio del segmento'
        : (delta > 0 ? '↑ ' + delta + '% vs. promedio del segmento' : '↓ ' + Math.abs(delta) + '% vs. promedio del segmento')) +
        ' · percentil ' + risk.renov.pctl;
    }
    if (opText) {
      if (risk.renov.high) opText.textContent = 'Recomendación personalizada: contacto proactivo de un asesor de retención y revisión del plan en las próximas 24h.';
      else if (risk.diab.high) opText.textContent = 'Recomendación personalizada: programa de control de glucosa, seguimiento nutricional y recordatorio de citas con endocrinología.';
      else opText.textContent = 'Recomendación personalizada: recordatorio de control médico y programa de bienestar.';
    }
  }
  function addAlert(a) {
    let div = state.alerts[a.key];
    if (!div) {
      div = document.createElement('div');
      div.className = 'alert-card warn';
      alertsWrap.appendChild(div);
      state.alerts[a.key] = div;
    }
    div.innerHTML = '<span class="alert-ic">' + a.icon + '</span><div><b>' + a.title + '</b><p>' + a.text + '</p>' +
      '<ul>' + a.plan.map((p) => '<li>' + p + '</li>').join('') + '</ul></div>';
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
