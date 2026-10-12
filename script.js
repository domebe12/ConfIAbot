(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  // ---------------- Utilidades ----------------
  const $ = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 30 : ms));
  const DEMO_TODAY = new Date(2026, 9, 11); // 11/10/2026 (fecha de la demo)
  const hhmm = () => new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

  // ---------------- Personas (portales) ----------------
  // Nombres, planes, cifras de portal y el resto de personajes son de ejemplo.
  const PERSONAS = {
    afiliado: {
      key: 'afiliado', name: 'Daniel Chacón', first: 'Daniel', initials: 'DC', broker: false,
      role: 'Portal afiliado · Plan Confiplus', tagline: 'Portal afiliado', foot: 'Plan Confiplus',
      canal: 'App móvil', clientId: 'daniel', clientName: 'Daniel Chacón', clientInitials: 'DC', clientKicker: 'Afiliado · Plan Confiplus',
      nav: ['🏠 Inicio', '📄 Mis solicitudes', '🩺 Citas médicas', '💳 Reembolsos', '📁 Documentos', '⚙️ Configuración'],
      stats: [['Activa', 'Tu cobertura'], ['2', 'Citas este año'], ['0', 'Trámites pendientes']],
      cards: [
        { ic: '🩺', b: 'Citas médicas', s: 'Agenda tu cita' }, { ic: '💊', b: 'Recetas', s: 'Tus medicinas' },
        { ic: '💳', b: 'Reembolsos', s: 'Consulta tu estado' }, { ic: '🤖', b: 'ConfIAbot', s: 'Tu asistente inteligente', hl: true },
      ],
      greet: 'Hola, Daniel', greetSub: '¿En qué podemos ayudarte hoy?',
      sub: 'Tu asistente te guía paso a paso, con palabras sencillas.',
      hint: '💡 Toca “ConfIAbot” y cuéntale que tu hijo tiene fiebre: te dice a dónde llevarlo ahora mismo.',
      intro: 'Hola Daniel 👋 Soy ConfIAbot, tu asistente de Confiamed. ¿En qué te puedo ayudar hoy?',
      starter: 'Mi hijo tiene fiebre y no sé a qué doctor llevarlo. ¿Dónde lo pueden atender hoy mismo?',
      profile: { edad: 38, imc: 25, historial_familiar_diabetes: 0, num_citas_glucosa_6m: 0, num_quejas_2m: 0, tiempo_respuesta_prom_h: 12, nps_score: 8, antiguedad: 6 },
    },
    broker: {
      key: 'broker', name: 'Nova', first: 'Nova', initials: 'NV', broker: true,
      role: 'Portal bróker', tagline: 'Portal bróker', foot: 'Bróker Confiamed',
      canal: 'Portal bróker', clientId: 'juan', clientName: 'Juan Pérez', clientInitials: 'JP', clientKicker: 'Afiliado · a cargo de Nova',
      nav: ['🏠 Inicio', '👥 Mis afiliados', '💳 Reembolsos', '✅ Autorizaciones', '📈 Cotizaciones', '⚙️ Configuración'],
      stats: [['128', 'Afiliados a cargo'], ['6', 'Trámites activos'], ['3', 'Reembolsos en revisión']],
      cards: [
        { ic: '👥', b: 'Mis afiliados', s: 'Consulta y gestiona' }, { ic: '✅', b: 'Autorizaciones', s: 'Solicita y da seguimiento' },
        { ic: '💳', b: 'Reembolsos', s: 'Estado de tus afiliados' }, { ic: '🤖', b: 'ConfIAbot', s: 'Tu asistente inteligente', hl: true },
      ],
      greet: 'Hola, Nova', greetSub: 'Tus afiliados y trámites, en un solo lugar.',
      sub: 'Pregúntale a ConfIAbot por cualquier trámite de tus afiliados.',
      hint: '💡 Toca “ConfIAbot” y consulta el estado de un reembolso de tu afiliado Juan Pérez.',
      intro: 'Hola Nova 👋 Soy ConfIAbot para brókers. ¿Qué trámite de tus afiliados quieres consultar?',
      starter: '¿En qué estado se encuentra el reembolso de mi afiliado Juan Pérez?',
      profile: { edad: 52, imc: 27, historial_familiar_diabetes: 0, num_citas_glucosa_6m: 0, num_quejas_2m: 0, tiempo_respuesta_prom_h: 12, nps_score: 7, antiguedad: 9 },
    },
  };
  let PERSONA = PERSONAS.afiliado;

  // Lugares de atención cercanos al Valle de Tumbaco (donde vive Daniel). Salvo el Hospital de los Valles, nombres, distancias, esperas y coberturas son de ejemplo.
  const PROVIDERS = [
    { id: 'valles', name: 'Hospital de los Valles', sub: 'Urgencias pediátricas · 24 horas', dist: 7.5, eta: '15 min', wait: 15, urg: 1.0, cov: 1.0, covTxt: 'Cubierto al 100%' },
    { id: 'cumbaya', name: 'Clínica Pediátrica Cumbayá', sub: 'Emergencias pediátricas · 24 horas', dist: 6.0, eta: '12 min', wait: 20, urg: 0.9, cov: 0.9, covTxt: 'Cubierto al 90%' },
    { id: 'tumbaco', name: 'Centro Médico Tumbaco', sub: 'Emergencias generales · pediatra de turno', dist: 2.5, eta: '6 min', wait: 45, urg: 0.75, cov: 1.0, covTxt: 'Cubierto al 100%' },
  ];
  const WEIGHTS = {
    alta: { urg: 0.45, wait: 0.25, dist: 0.20, cov: 0.10 },
    media: { urg: 0.35, wait: 0.20, dist: 0.25, cov: 0.20 },
    baja: { urg: 0.25, wait: 0.20, dist: 0.30, cov: 0.25 },
  };
  const LEVEL_TXT = { alta: 'Alta', media: 'Media', baja: 'Baja' };

  // Reembolsos activos del afiliado Juan Pérez (ejemplo)
  const REIMB_STAGES = ['Recibido', 'Revisión', 'Asignado a un ejecutivo', 'Respuesta', 'Pago'];
  const REIMBS = [
    { id: '2534', short: 'SIME Imagen', title: 'Tomografía simple', recv: '9/10/2026', date: new Date(2026, 9, 9), stage: 1, status: 'Revisión', eta: '24 horas',
      pick: 'Deseo consultar sobre el de SIME Imagen · Tomografía simple',
      msg: 'El Reembolso #2534 SIME Imagen, recibido el 9/10/2026, se encuentra en estado: Revisión. Se está asignando a un ejecutivo de liquidaciones y su respuesta estará en las próximas 24 horas.' },
    { id: '2519', short: 'Laboratorio clínico', title: 'Exámenes de sangre', recv: '2/10/2026', date: new Date(2026, 9, 2), stage: 3, status: 'Aprobado', eta: '48 horas',
      pick: 'Deseo consultar sobre el de Laboratorio clínico · Exámenes de sangre',
      msg: 'El Reembolso #2519 Laboratorio clínico, recibido el 2/10/2026, se encuentra en estado: Aprobado. Ya pasó a pago y se acreditará en las próximas 48 horas.' },
    { id: '2541', short: 'Consulta traumatología', title: 'Consulta médica', recv: '10/10/2026', date: new Date(2026, 9, 10), stage: 0, status: 'Recibido', eta: '72 horas',
      pick: 'Deseo consultar sobre el de Consulta de traumatología',
      msg: 'El Reembolso #2541 Consulta de traumatología, recibido el 10/10/2026, se encuentra en estado: Recibido. Pasa a revisión hoy mismo y tendrá respuesta en las próximas 72 horas.' },
  ];

  // Salidas de la red neuronal según el flujo
  const NET_LABELS = {
    default: { in: ['Texto del mensaje', 'Edad y género', 'Historial de citas', 'Quejas registradas', 'Diagnósticos previos', 'Canal de contacto'],
      out: ['Riesgo de salud', 'Riesgo de no renovación', 'Seguimiento estándar'] },
    fiebre: { in: ['Texto del mensaje', 'Edad del niño', 'Temperatura', 'Señales de alarma', 'Plan y cobertura', 'Red y ubicación'],
      out: ['Ir a urgencias ahora', 'Consulta prioritaria hoy', 'Cuidados en casa + control'] },
    reembolso: { in: ['Texto del mensaje', 'Tipo de trámite', 'Fecha de recepción', 'Estado actual', 'Historial del afiliado', 'Carga de liquidadores'],
      out: ['Escalar por demora', 'Seguimiento normal', 'Pago en camino'] },
  };


  // ---------------- State ----------------
  const state = { messages: 0, alerts: {}, lastIntent: null, pendingRow: null, risk: null, history: [] };


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

  // Dibuja UN árbol real del Random Forest entrenado (no un dibujo aproximado):
  // recorre el árbol con el perfil actual y resalta el camino de decisión real.
  const FEATURE_SHORT = {
    edad: 'edad', imc: 'IMC', historial_familiar_diabetes: 'hist. familiar', num_citas_glucosa_6m: 'citas glucosa',
    num_quejas_2m: 'quejas', tiempo_respuesta_prom_h: 't. respuesta', nps_score: 'NPS', antiguedad: 'antigüedad',
  };
  function layoutTree(node, feat, depth, x0, x1, onPath, out) {
    const x = (x0 + x1) / 2;
    const id = out.nodes.length;
    out.nodes.push({ x, y: depth, node, onPath });
    out.maxDepth = Math.max(out.maxDepth, depth);
    if (!('leaf' in node)) {
      const goRight = feat[node.f] > node.th;
      const li = layoutTree(node.l, feat, depth + 1, x0, x, onPath && !goRight, out);
      const ri = layoutTree(node.r, feat, depth + 1, x, x1, onPath && goRight, out);
      out.edges.push({ x1: x, y1: depth, x2: out.nodes[li].x, y2: depth + 1, onPath: onPath && !goRight });
      out.edges.push({ x1: x, y1: depth, x2: out.nodes[ri].x, y2: depth + 1, onPath: onPath && goRight });
    }
    return id;
  }
  function leafColor(p) {
    const r = Math.round(24 + (255 - 24) * p), g = Math.round(168 - (168 - 60) * p), b = Math.round(150 - 110 * p);
    return `rgb(${r},${g},${b})`;
  }
  // Dibuja una celda de árbol (curvas + nodos). hero=true => grande, brillante,
  // con texto final; hero=false => miniatura tenue (un árbol más del bosque real).
  function treeCellParts(out, y0, cellH, hero) {
    const rowH = cellH / (out.maxDepth + 1);
    const py = (d) => y0 + d * rowH;
    const parts = [];
    out.edges.forEach((e) => {
      const y1 = py(e.y1), y2 = py(e.y2), midY = (y1 + y2) / 2;
      const d = `M${e.x1},${y1} C${e.x1},${midY} ${e.x2},${midY} ${e.x2},${y2}`;
      if (hero) {
        const len = Math.hypot(e.x2 - e.x1, y2 - y1) * 1.25 + 10;
        const delay = (e.y1 * 0.16).toFixed(2);
        if (e.onPath) parts.push(`<path class="tree-edge" d="${d}" fill="none" stroke="#3fd6f0" stroke-width="2.6" stroke-linecap="round" filter="url(#treeGlow)" style="stroke-dasharray:${len};stroke-dashoffset:${len};animation-delay:${delay}s"/>`);
        else parts.push(`<path class="tree-edge" d="${d}" fill="none" stroke="rgba(135,180,220,0.22)" stroke-width="1" stroke-linecap="round" style="stroke-dasharray:${len};stroke-dashoffset:${len};animation-delay:${delay}s"/>`);
      } else {
        parts.push(`<path d="${d}" fill="none" stroke="${e.onPath ? 'rgba(63,214,240,0.55)' : 'rgba(135,180,220,0.16)'}" stroke-width="${e.onPath ? 1.2 : 0.7}" stroke-linecap="round"/>`);
      }
    });
    out.nodes.forEach((n) => {
      const isLeaf = 'leaf' in n.node;
      const cy = py(n.y);
      if (hero) {
        const delay = (n.y * 0.16 + 0.06).toFixed(2);
        if (isLeaf) {
          if (n.onPath) {
            const r = 9 + n.node.leaf * 5;
            parts.push(`<circle class="tree-node" cx="${n.x}" cy="${cy}" r="${r}" fill="${leafColor(n.node.leaf)}" filter="url(#treeGlow)" style="animation-delay:${delay}s"/>`);
            parts.push(`<circle class="tree-node" cx="${n.x}" cy="${cy}" r="${Math.max(2.5, r - 4)}" fill="#fff" opacity="0.9" style="animation-delay:${delay}s"/>`);
          } else parts.push(`<circle class="tree-node" cx="${n.x}" cy="${cy}" r="3.5" fill="rgba(135,180,220,0.3)" style="animation-delay:${delay}s"/>`);
        } else if (n.onPath) parts.push(`<circle class="tree-node" cx="${n.x}" cy="${cy}" r="7" fill="url(#nodeGlowOn)" filter="url(#treeGlow)" style="animation-delay:${delay}s"/>`);
        else parts.push(`<circle class="tree-node" cx="${n.x}" cy="${cy}" r="4" fill="rgba(135,180,220,0.4)" style="animation-delay:${delay}s"/>`);
      } else {
        const r = n.onPath ? (isLeaf ? 2.6 : 2.1) : 1.3;
        const fill = n.onPath ? (isLeaf ? leafColor(n.node.leaf) : '#5fe3f7') : 'rgba(135,180,220,0.35)';
        parts.push(`<circle cx="${n.x}" cy="${cy}" r="${r}" fill="${fill}"/>`);
      }
    });
    return { parts, py };
  }
  // Reconstruye, como un único trazo, el camino raíz→hoja realmente tomado
  // (mismas curvas que ya se dibujaron) para animar un punto viajando sobre él.
  function heroMotionPath(out, py) {
    let current = out.nodes[0];
    let d = `M${current.x},${py(current.y)}`;
    for (;;) {
      const edge = out.edges.find((e) => e.onPath && e.y1 === current.y && Math.abs(e.x1 - current.x) < 0.01);
      if (!edge) break;
      const y1 = py(edge.y1), y2 = py(edge.y2), midY = (y1 + y2) / 2;
      d += ` C${edge.x1},${midY} ${edge.x2},${midY} ${edge.x2},${y2}`;
      const next = out.nodes.find((n) => n.y === edge.y2 && Math.abs(n.x - edge.x2) < 0.01);
      if (!next) break;
      current = next;
    }
    return d;
  }
  function renderForestSVG(model, feat, treeIdx) {
    const svg = document.getElementById('forestSvg');
    const caption = document.getElementById('forestCaption');
    if (!svg || !model) return;
    const trees = model.rf.trees;
    const heroIdx = treeIdx % trees.length;
    const W = 920, H = 372, TX0 = 20, TX1 = 540;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const isDiab = model === (MODELS && MODELS.diabetes);
    const probs = trees.map((t) => evalTree(t, feat));
    const mean = probs.reduce((a, b2) => a + b2, 0) / probs.length;

    // árbol grande con el camino de decisión resaltado
    const out = { nodes: [], edges: [], maxDepth: 0 };
    layoutTree(trees[heroIdx], feat, 0, TX0 + 10, TX1 - 10, true, out);
    const { parts, py } = treeCellParts(out, 40, H - 80, true);
    const parts2 = ['<defs><filter id="treeGlow" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<radialGradient id="nodeGlowOn" cx="40%" cy="35%" r="65%"><stop offset="0%" stop-color="#eafeff"/><stop offset="45%" stop-color="#5fe3f7"/><stop offset="100%" stop-color="#0c87ad"/></radialGradient></defs>'];
    parts2.push('<text x="' + TX0 + '" y="20" font-size="13" font-weight="700" style="animation-delay:.1s">Un árbol de decisión, por dentro</text>');
    parts2.push('<g id="heroTree">' + parts.join('') + '</g>');
    const leafN = out.nodes.find((n) => n.onPath && 'leaf' in n.node);
    if (leafN) {
      const r = 9 + leafN.node.leaf * 5, cy = py(leafN.y);
      const right = leafN.x < (TX0 + TX1) / 2;
      parts2.push('<text x="' + (right ? leafN.x + r + 8 : leafN.x - r - 8) + '" y="' + (cy + 4) + '" font-size="15" font-weight="800" text-anchor="' + (right ? 'start' : 'end') + '" style="animation-delay:1.2s">' + Math.round(leafN.node.leaf * 100) + '%</text>');
    }

    // votación de los árboles del bosque
    const VX = 600, rowH = 21, vy0 = 56, barW = 205;
    parts2.push('<text x="' + VX + '" y="20" font-size="13" font-weight="700" style="animation-delay:.3s">Los ' + trees.length + ' árboles votan</text>');
    probs.forEach((p, i) => {
      const y = vy0 + i * rowH, d = (1.0 + i * 0.16).toFixed(2);
      parts2.push('<g class="vote-row" style="animation-delay:' + d + 's">' +
        '<text x="' + VX + '" y="' + (y + 4) + '" font-size="10.5" style="opacity:1;animation:none;fill:#8fb3d6">Árbol ' + (i + 1) + '</text>' +
        '<rect x="' + (VX + 62) + '" y="' + (y - 5) + '" width="' + barW + '" height="10" rx="5" fill="rgba(255,255,255,.08)"/>' +
        '<rect class="vote-bar" x="' + (VX + 62) + '" y="' + (y - 5) + '" width="' + Math.max(4, p * barW).toFixed(1) + '" height="10" rx="5" fill="' + leafColor(p) + '" style="animation-delay:' + d + 's"/>' +
        '<text x="' + (VX + 62 + barW + 8) + '" y="' + (y + 4) + '" font-size="10.5" style="opacity:1;animation:none;fill:#dcebf8">' + Math.round(p * 100) + '%</text></g>');
    });
    const fy = vy0 + trees.length * rowH + 14, fd = (1.0 + trees.length * 0.16 + 0.3).toFixed(2);
    parts2.push('<g class="vote-row" style="animation-delay:' + fd + 's"><line x1="' + VX + '" y1="' + (fy - 14) + '" x2="' + (VX + 330) + '" y2="' + (fy - 14) + '" stroke="rgba(114,190,230,.3)"/>' +
      '<text x="' + VX + '" y="' + (fy + 14) + '" font-size="12" style="opacity:1;animation:none;fill:#bcd4ec">Promedio del bosque</text>' +
      '<text x="' + (VX + 330) + '" y="' + (fy + 16) + '" font-size="26" font-weight="800" text-anchor="end" style="opacity:1;animation:none;fill:' + leafColor(mean) + '">' + Math.round(mean * 100) + '%</text></g>');
    svg.innerHTML = parts2.join('');

    // punto de luz recorriendo el camino tomado por el árbol grande
    const heroG = svg.querySelector('#heroTree');
    const mp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mp.setAttribute('d', heroMotionPath(out, py)); mp.setAttribute('fill', 'none'); mp.setAttribute('stroke', 'none');
    heroG.appendChild(mp);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '6'); dot.setAttribute('class', 'flow-packet');
    heroG.appendChild(dot);
    const len = mp.getTotalLength(), dur = 1200, start = performance.now();
    (function tick(t) {
      const p = Math.min(1, (t - start) / dur), pt = mp.getPointAtLength(p * len);
      dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
      if (p >= 1) dot.style.opacity = '0'; else requestAnimationFrame(tick);
    })(start);

    if (caption) {
      caption.textContent = '→ Random Forest real: a la izquierda, el camino que sigue un árbol con los datos de esta persona; a la derecha, lo que vota cada uno de los ' + trees.length + ' árboles para ' + (isDiab ? 'riesgo de diabetes tipo 2' : 'riesgo de no renovación') + '.';
    }
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
  function plural(n, singular, plural2) { return n + ' ' + (n === 1 ? singular : plural2); }
  function realStatsLine(intent, risk) {
    return ' Además, el modelo real (regresión logística + random forest) estima ' + risk.renov.pct +
      '% de probabilidad de no renovación para ' + PERSONAS[intent.persona].clientName + ' (percentil ' + risk.renov.pctl + ' del segmento).';
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
  const chatFab = $('chatFab');
  function showView(name) {
    views.forEach((v) => v.classList.toggle('active', v.dataset.view === name));
    tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.view === name));
    document.body.classList.toggle('pre-portal', name === 'bienvenida' || name === 'selector');
    if (name === 'almacenamiento') renderPendingRow();
    if (name === 'procesamiento') playNetwork();
    if (name === 'cliente') renderClient();
    if (name === 'chat') { ensureChatIntro(); chatInput.focus(); }
    if (chatFab) chatFab.classList.toggle('hide', name === 'bienvenida' || name === 'selector' || name === 'chat');
    window.scrollTo(0, 0);
  }
  function unlockTab(name) {
    const b = tabBtns.find((x) => x.dataset.view === name);
    if (b) b.disabled = false;
  }
  tabBtns.forEach((b) => b.addEventListener('click', () => { if (!b.disabled) showView(b.dataset.view); }));
  $('btnStart').addEventListener('click', () => showView('selector'));
  $('roleAfiliado').addEventListener('click', () => { applyPersona('afiliado'); showView('inicio'); });
  $('roleBroker').addEventListener('click', () => { applyPersona('broker'); showView('inicio'); });
  $('btnSwitchPortal').addEventListener('click', () => { runToken++; showView('selector'); });
  $('btnGoProc').addEventListener('click', () => showView('procesamiento'));
  $('btnGoCliente').addEventListener('click', () => showView('cliente'));
  if (chatFab) chatFab.addEventListener('click', () => showView('chat'));
  $('pCards').addEventListener('click', (e) => { if (e.target.closest('.portal-card.highlight')) showView('chat'); });
  $('pCards').addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.portal-card.highlight')) { e.preventDefault(); showView('chat'); }
  });
  $('behindLinks').addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) showView(b.dataset.go);
  });

  // ---------------- Chat: utilidades ----------------
  const chatBody = $('chatBody');
  const chatForm = $('chatForm');
  const chatInput = $('chatInput');
  const chatAttachBtn = $('chatAttachBtn');
  const chatFileInput = $('chatFileInput');
  let flow = null, runToken = 0;
  const alive = (tk) => tk === runToken;
  const scrollChat = () => { chatBody.scrollTop = chatBody.scrollHeight; };

  function addBubble(text, who) {
    const d = document.createElement('div');
    d.className = 'bubble ' + who;
    d.textContent = text;
    chatBody.appendChild(d);
    scrollChat();
    return d;
  }
  function addRich(html) {
    const d = document.createElement('div');
    d.className = 'bubble bot rich';
    d.innerHTML = html;
    chatBody.appendChild(d);
    scrollChat();
    return d;
  }
  function addTyping() {
    const d = document.createElement('div');
    d.className = 'typing-dots';
    d.innerHTML = '<span></span><span></span><span></span>';
    chatBody.appendChild(d);
    scrollChat();
    return d;
  }
  async function say(text, ms, cls) {
    const tk = runToken;
    const t = addTyping();
    await wait(ms == null ? 800 : ms);
    t.remove();
    if (!alive(tk)) return false;
    addBubble(text, 'bot' + (cls ? ' ' + cls : ''));
    return true;
  }
  function removeChips() { chatBody.querySelectorAll('.chat-chips').forEach((c) => c.remove()); }
  function addChips(opts) {
    removeChips();
    const box = document.createElement('div');
    box.className = 'chat-chips';
    opts.forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-chip' + (o.cls ? ' ' + o.cls : '');
      b.textContent = o.label;
      b.addEventListener('click', () => userSays(o.say || o.label, o.v));
      box.appendChild(b);
    });
    chatBody.appendChild(box);
    scrollChat();
  }
  function addStepper(labels) {
    const el = addRich('<div class="stepper"><div class="stepper-title">ConfIAbot está trabajando…</div><ol>' +
      labels.map((l) => '<li><span class="st-dot"></span><span>' + l + '</span></li>').join('') + '</ol></div>');
    const lis = el.querySelectorAll('li');
    return {
      set(i, st) {
        const li = lis[i]; if (!li) return;
        li.classList.remove('done', 'now');
        li.classList.add(st);
        li.querySelector('.st-dot').textContent = st === 'done' ? '✓' : '';
      },
      title(t) { el.querySelector('.stepper-title').textContent = t; },
    };
  }
  function addTimeline(stage) {
    return addRich('<div class="stepper"><div class="stepper-title">Recorrido del reembolso</div><ol>' +
      REIMB_STAGES.map((s, i) => '<li class="' + (i < stage ? 'done' : i === stage ? 'now' : '') + '"><span class="st-dot">' + (i < stage ? '✓' : '') + '</span><span>' + s +
        (i === stage ? '<small>Aquí está ahora</small>' : '') + '</span></li>').join('') + '</ol></div>');
  }

  // ---------------- Panel "Detrás de escena" ----------------
  const behindSteps = $('behindSteps');
  const behindLinks = $('behindLinks');
  const stepEl = (n) => behindSteps.querySelector('li[data-step="' + n + '"]');
  const behind = {
    reset() {
      behindSteps.querySelectorAll('li').forEach((li) => { li.classList.remove('active', 'done'); li.querySelector('.bs-detail').innerHTML = ''; });
      behindLinks.hidden = true;
    },
    active(n) { const s = stepEl(n); s.classList.remove('done'); s.classList.add('active'); },
    done(n) { const s = stepEl(n); s.classList.remove('active'); s.classList.add('done'); },
    chip(n, text, cls) {
      const s = document.createElement('span');
      s.className = 'bs-chip' + (cls ? ' ' + cls : '');
      s.textContent = text;
      stepEl(n).querySelector('.bs-detail').appendChild(s);
    },
    line(n, html) {
      const d = document.createElement('div');
      d.className = 'bs-line';
      d.innerHTML = html;
      stepEl(n).querySelector('.bs-detail').appendChild(d);
    },
    meter(n, pct) {
      const m = document.createElement('div');
      m.className = 'bs-meter';
      m.innerHTML = '<i></i>';
      stepEl(n).querySelector('.bs-detail').appendChild(m);
      requestAnimationFrame(() => requestAnimationFrame(() => { m.firstChild.style.width = pct + '%'; }));
    },
  };
  function beginBehind(chips) {
    const tk = runToken;
    behind.reset();
    behind.active(1);
    setTimeout(() => {
      if (!alive(tk)) return;
      behind.chip(1, 'Canal: ' + PERSONA.canal);
      behind.chip(1, '🕒 ' + hhmm());
      behind.done(1);
      behind.active(2);
      chips.forEach((c) => behind.chip(2, c[0], c[1]));
    }, reduced ? 20 : 700);
  }

  // Corre el "motor": el chat muestra pasos sencillos y, a la vez, el panel
  // muestra lo que ocurre de verdad (guardar → analizar → decidir).
  async function runAnalysis(tk, labels, hooks) {
    behind.done(2);
    const st = addStepper(labels);
    for (let i = 0; i < labels.length; i++) {
      if (!alive(tk)) return false;
      st.set(i, 'now');
      if (i === 0) hooks.save();
      else if (i === 1) { behind.done(3); hooks.model(); }
      else if (i === 2) { behind.done(4); hooks.decide(); }
      await wait(950);
      st.set(i, 'done');
    }
    if (!alive(tk)) return false;
    behind.done(5);
    st.title('Listo ✓');
    return true;
  }

  function finalize(intent, messages) {
    state.lastIntent = intent;
    state.messages++;
    state.history.unshift({ time: nowLabel(), msg: messages.join(' · '), label: intent.label });
    queueStorageRow(messages, intent);
    unlockTab('almacenamiento'); unlockTab('procesamiento'); unlockTab('cliente');
    behindLinks.hidden = false;
    showToast();
  }

  // ---------------- Flujo 1: afiliado · fiebre de su hijo ----------------
  const FEVER_STEPS = [
    { key: 'edad', ask: 'Gracias por contarme. Para decirte el mejor lugar, solo necesito 3 datos rápidos. Primero: ¿cuántos años tiene tu hijo?',
      opts: [{ label: 'Menos de 2 años', v: 'lt2' }, { label: 'De 2 a 5 años', v: '2a5' }, { label: 'De 6 a 12 años', v: '6a12' }, { label: 'De 13 a 17 años', v: '13a17' }],
      names: { lt2: 'menos de 2 años', '2a5': '2 a 5 años', '6a12': '6 a 12 años', '13a17': '13 a 17 años' }, chipLabel: 'Edad',
      parse(t) {
        t = norm(t);
        if (/beb[eé]|recien|meses|mes\b/.test(t)) return 'lt2';
        const m = t.match(/(\d+)/);
        if (!m) return null;
        const n = +m[1];
        return n < 2 ? 'lt2' : n <= 5 ? '2a5' : n <= 12 ? '6a12' : n <= 17 ? '13a17' : null;
      } },
    { key: 'temp', ask: 'Entiendo. ¿Qué tan alta es la fiebre ahora?',
      opts: [{ label: 'Menos de 38,5°', v: 'baja' }, { label: 'Entre 38,5° y 39,5°', v: 'media' }, { label: 'Más de 39,5°', v: 'alta' }, { label: 'No tengo termómetro, se siente caliente', v: 'media' }],
      names: { baja: 'menos de 38,5°', media: '38,5° a 39,5°', alta: 'más de 39,5°' }, chipLabel: 'Fiebre',
      parse(t) {
        t = norm(t);
        const m = t.match(/(\d{2})(?:[.,](\d))?/);
        if (m) { const v = parseFloat(m[1] + '.' + (m[2] || '0')); if (v >= 35 && v <= 43) return v < 38.5 ? 'baja' : v <= 39.5 ? 'media' : 'alta'; }
        if (/termometro|caliente|calentura/.test(t)) return 'media';
        return null;
      } },
    { key: 'alarma', ask: 'Última pregunta: ¿tiene alguna de estas señales? Está muy decaído, respira con dificultad, vomita sin parar o le salieron manchas en la piel.',
      opts: [{ label: 'Sí, alguna de esas', v: 'si' }, { label: 'No, solo tiene fiebre', v: 'no' }],
      names: { si: 'sí', no: 'no' }, chipLabel: 'Señales de alarma',
      parse(t) {
        t = norm(t);
        if (/^(no|ninguna|solo)/.test(t) || /no tiene|solo fiebre|ninguna/.test(t)) return 'no';
        if (/^(si|alguna)|decaid|dificultad|vomit|mancha/.test(t)) return 'si';
        return null;
      } },
  ];
  function feverLevel(d) {
    const pts = (d.edad === 'lt2' ? 2 : d.edad === '2a5' ? 1 : 0) + (d.temp === 'alta' ? 2 : d.temp === 'media' ? 1 : 0) + (d.alarma === 'si' ? 3 : 0);
    return { pts, level: pts >= 3 ? 'alta' : pts >= 1 ? 'media' : 'baja', pct: Math.round((pts / 7) * 100) };
  }
  function rankProviders(level) {
    const w = WEIGHTS[level];
    return PROVIDERS.map((p) => {
      const parts = { urg: p.urg, wait: 1 - p.wait / 60, dist: 1 - p.dist / 10, cov: p.cov };
      const score = Math.round((parts.urg * w.urg + parts.wait * w.wait + parts.dist * w.dist + parts.cov * w.cov) * 100);
      return { p, parts, score };
    }).sort((a, b) => b.score - a.score);
  }

  async function startFever(text) {
    const tk = runToken;
    flow = { type: 'fiebre', step: 0, data: {}, messages: [text], awaiting: 'step', busy: true };
    beginBehind([['Quién: ' + PERSONA.name], ['Zona: Valle de Tumbaco', 'good'], ['Motivo: fiebre en un menor', 'hot']]);
    if (!await say('Claro, ' + PERSONA.first + ', te ayudo ahora mismo. Vamos a encontrar dónde atenderlo hoy.', 900)) return;
    askFeverStep(tk);
  }
  async function askFeverStep(tk) {
    const s = FEVER_STEPS[flow.step];
    flow.busy = true;
    if (!await say(s.ask, 700)) return;
    flow.busy = false;
    addChips(s.opts);
  }
  async function feverAnswer(text, v) {
    const tk = runToken;
    const s = FEVER_STEPS[flow.step];
    const val = v || s.parse(text);
    if (!val) {
      flow.busy = true;
      if (!await say('No te entendí del todo. Elige una de estas opciones, por favor:', 600)) return;
      flow.busy = false;
      addChips(s.opts);
      return;
    }
    flow.data[s.key] = val;
    behind.chip(2, s.chipLabel + ': ' + s.names[val], (s.key === 'alarma' && val === 'si') || (s.key === 'temp' && val === 'alta') ? 'hot' : 'good');
    flow.step++;
    if (flow.step < FEVER_STEPS.length) { askFeverStep(tk); return; }
    analyzeFever(tk);
  }
  async function analyzeFever(tk) {
    flow.busy = true;
    const d = flow.data;
    const { pts, level, pct } = feverLevel(d);
    const ranked = rankProviders(level);
    const best = ranked[0];
    profile.tiempo_respuesta_prom_h = 12;
    state.risk = computeRisk() || fallbackRisk();
    const ok = await runAnalysis(tk, [
      'Revisando tu plan y tu cobertura',
      'Buscando prestadores abiertos cerca de Tumbaco',
      'Comparando cercanía y tiempo de espera',
      'Ordenando de la mejor a la menos recomendada',
    ], {
      save() {
        behind.active(3);
        behind.line(3, '<b>Registro #AF-' + String(2400 + state.messages + 1) + '</b> guardado en la base única');
        behind.chip(3, 'Sin duplicar datos', 'good');
      },
      model() {
        behind.active(4);
        behind.line(4, 'Nivel de urgencia: <b>' + LEVEL_TXT[level] + '</b> (' + pts + ' de 7 puntos)');
        behind.meter(4, Math.max(8, pct));
        behind.line(4, 'Riesgo de no renovación (modelo real): <b>' + state.risk.renov.pct + '%</b>');
      },
      decide() {
        behind.active(5);
        behind.line(5, 'Mejor opción: <b>' + best.p.name + '</b> · ' + best.score + '/100');
        behind.chip(5, 'Reglas + datos de ejemplo', '');
      },
    });
    if (!ok) return;
    const intent = { id: 'fiebre', flow: 'fiebre', persona: 'afiliado', label: 'Urgencia pediátrica', level, pts, pct, ranked, data: d };
    finalize(intent, flow.messages);

    if (level === 'alta') addBubble('⚠️ Por lo que me cuentas, no esperes: lleva a tu hijo a urgencias ahora. Si respira muy mal o no reacciona, llama al 911.', 'bot warn-note');
    else if (level === 'media') addBubble('Conviene que un médico lo vea hoy. Estas son tus mejores opciones:', 'bot');
    else addBubble('No suena grave, pero conviene que lo vea un médico si la fiebre sigue. Estas son tus opciones:', 'bot');
    await wait(500);
    if (!alive(tk)) return;
    addBubble('Entiendo tu preocupación, ' + PERSONA.first + '. Dentro de tu red hemos analizado los prestadores más cercanos a ti en el Valle de Tumbaco y estas 3 opciones son donde puedes acudir inmediatamente. Te las ordené de la mejor a la menos recomendada:', 'bot');
    const html = ranked.map((r, i) =>
      '<button type="button" class="opt-card pick' + (i === 0 ? ' best' : '') + '" data-id="' + r.p.id + '" style="animation-delay:' + (i * 0.2) + 's">' +
      (i === 0 ? '<span class="opt-badge">Recomendada</span>' : '') +
      '<span class="opt-rank">' + (i + 1) + '</span><div class="opt-body"><b>' + r.p.name + '</b><small>' + r.p.sub + '</small>' +
      '<div class="opt-meta"><span class="opt-tag">📍 ' + r.p.dist.toString().replace('.', ',') + ' km · ' + r.p.eta + '</span>' +
      '<span class="opt-tag ' + (r.p.wait <= 15 ? 'ok' : 'warn') + '">⏱ Espera ~' + r.p.wait + ' min</span>' +
      '<span class="opt-tag ok">✓ ' + r.p.covTxt + '</span></div>' +
      '<div class="opt-match"><div class="bar"><i data-w="' + r.score + '"></i></div><span>' + r.score + '% encaja</span></div></div></button>').join('');
    const el = addRich(html);
    requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll('.bar i').forEach((i) => { i.style.width = i.dataset.w + '%'; })));
    await wait(900);
    if (!alive(tk)) return;
    flow.ranked = ranked;
    flow.awaiting = 'pick';
    flow.busy = false;
    addBubble('Toca el lugar al que vas a ir y te dejo todo listo.', 'bot');
  }
  async function feverPick(text, id) {
    const tk = runToken;
    let r = null;
    if (id) r = flow.ranked.find((x) => x.p.id === id);
    else {
      const t = norm(text);
      if (/valles|\b1\b|primer/.test(t)) r = flow.ranked.find((x) => x.p.id === 'valles') || flow.ranked[0];
      else if (/cumbaya|clinica/.test(t)) r = flow.ranked.find((x) => x.p.id === 'cumbaya');
      else if (/tumbaco|centro/.test(t)) r = flow.ranked.find((x) => x.p.id === 'tumbaco');
      else if (/\b2\b|segund/.test(t)) r = flow.ranked[1];
      else if (/\b3\b|tercer/.test(t)) r = flow.ranked[2];
    }
    if (!r) { await say('Toca una de las tres opciones de arriba para elegir.', 500); return; }
    flow.busy = true;
    chatBody.querySelectorAll('.opt-card.pick').forEach((c) => { c.classList.remove('pick'); c.disabled = true; if (c.dataset.id === r.p.id) c.classList.add('best'); });
    if (state.lastIntent) { state.lastIntent.picked = r.p.id; }
    const pos = flow.ranked.indexOf(r) + 1;
    const bld = '<svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="rcSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3fb"/><stop offset="1" stop-color="#eaf6ff"/></linearGradient></defs><rect width="320" height="120" fill="url(#rcSky)"/><rect x="40" y="38" width="150" height="82" rx="4" fill="#fff" stroke="#c4d9ec"/><rect x="170" y="22" width="110" height="98" rx="4" fill="#f4f9fe" stroke="#c4d9ec"/>' +
      Array.from({ length: 12 }, (_, i) => '<rect x="' + (52 + (i % 6) * 22) + '" y="' + (50 + Math.floor(i / 6) * 26) + '" width="14" height="14" rx="2" fill="#7fb8e6"/>').join('') +
      Array.from({ length: 12 }, (_, i) => '<rect x="' + (182 + (i % 4) * 24) + '" y="' + (34 + Math.floor(i / 4) * 26) + '" width="14" height="14" rx="2" fill="#7fb8e6"/>').join('') +
      '<rect x="228" y="92" width="26" height="28" fill="#0b63ce"/><circle cx="236" cy="60" r="0" fill="none"/><rect x="95" y="100" width="40" height="20" fill="#0b63ce"/><text x="115" y="114" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">✚</text></svg>';
    const why = [
      pos === 1 ? 'Mejor puntaje de tus 3 opciones: ' + r.score + '/100' : 'Puesto ' + pos + ' de 3 (' + r.score + '/100) por la urgencia de tu caso',
      'Dentro de la cobertura de tu plan · ' + r.p.covTxt.toLowerCase(),
      r.p.urg >= 0.9 ? 'Atiende emergencias pediátricas las 24 horas' : 'Tiene pediatra de turno para emergencias',
      'Espera aproximada de ' + r.p.wait + ' min · a ' + r.p.eta + ' de tu ubicación',
    ];
    addRich('<div class="res-card"><div class="res-head"><b>Resultado</b><small>' + (pos === 1 ? 'Mejor opción para tu hijo' : 'La opción que elegiste') + '</small></div>' +
      '<div class="res-photo">' + bld + '<span class="res-badge">' + (pos === 1 ? '✔ Recomendado' : '✔ Tu elección') + '</span></div>' +
      '<div class="res-name">' + r.p.name + '</div><div class="res-sub">' + r.p.sub.split(' · ')[0] + '</div>' +
      '<div class="res-tiles"><div><span>🕒</span><b>24/7</b><small>Atención continua</small></div><div><span>🛡️</span><b>Dentro</b><small>de cobertura</small></div><div><span>📍</span><b>A ' + r.p.eta + '</b><small>de tu ubicación</small></div></div>' +
      '<div class="res-why"><b>¿Por qué esta opción?</b>' + why.map((w) => '<div>✔ ' + w + '</div>').join('') + '</div></div>');
    await wait(700);
    if (!alive(tk)) return;
    if (!await say('Perfecto, ' + PERSONA.first + '. Avisé a ' + r.p.name + ' que vas en camino con tu hijo. Lleva tu cédula y tu carné digital: tu plan cubre la atención. Mañana te escribo para saber cómo sigue. 💙', 900)) return;
    flow.done = true; flow.busy = false;
  }

  // ---------------- Flujo 2: bróker · estado de un reembolso ----------------
  async function startReimb(text) {
    const tk = runToken;
    flow = { type: 'reembolso', data: {}, messages: [text], awaiting: 'pick', busy: true };
    beginBehind([['Bróker: ' + PERSONA.name], ['Afiliado: Juan Pérez', 'good'], ['Trámite: reembolso', 'hot']]);
    if (!await say('Un momento, ' + PERSONA.first + ', busco a tu afiliado Juan Pérez…', 800)) return;
    showReimbList(tk);
  }
  async function showReimbList(tk) {
    flow.busy = true;
    flow.awaiting = 'pick';
    if (!await say('El afiliado Juan Pérez cuenta con los siguientes reembolsos activos. ¿Cuál deseas consultar?', 700)) return;
    const html = REIMBS.map((r, i) =>
      '<button type="button" class="opt-card pick" data-id="' + r.id + '" style="animation-delay:' + (i * 0.15) + 's">' +
      '<span class="opt-rank">#</span><div class="opt-body"><b>#' + r.id + ' · ' + r.short + '</b><small>' + r.title + ' · recibido el ' + r.recv + '</small>' +
      '<div class="opt-meta"><span class="opt-tag ' + (r.stage === 3 ? 'ok' : 'warn') + '">' + r.status + '</span></div></div></button>').join('');
    addRich(html);
    flow.busy = false;
    addChips([{ label: 'Deseo consultar sobre el de SIME Imagen · Tomografía simple', v: '2534', cls: 'suggest' }]);
  }
  async function reimbPick(text, id) {
    const tk = runToken;
    let r = id ? REIMBS.find((x) => x.id === id) : null;
    if (!r) {
      const t = norm(text);
      if (/2534|sime|tomograf|imagen/.test(t)) r = REIMBS[0];
      else if (/2519|laborat|sangre/.test(t)) r = REIMBS[1];
      else if (/2541|traumat/.test(t)) r = REIMBS[2];
    }
    if (!r) {
      flow.busy = true;
      if (!await say('No encontré ese reembolso. Elige uno de la lista:', 600)) return;
      flow.busy = false;
      return;
    }
    flow.busy = true;
    removeChips();
    chatBody.querySelectorAll('.opt-card.pick').forEach((c) => { c.classList.remove('pick'); c.disabled = true; });
    const hours = Math.round((DEMO_TODAY - r.date) / 3600000);
    behind.chip(2, 'Reembolso #' + r.id, 'hot');
    profile.tiempo_respuesta_prom_h = Math.min(72, hours);
    state.risk = computeRisk() || fallbackRisk();
    const ok = await runAnalysis(tk, [
      'Buscando el reembolso #' + r.id + ' en la base única',
      'Leyendo su estado y sus documentos',
      'Calculando cuándo habrá respuesta',
      'Asignando un ejecutivo de liquidaciones',
    ], {
      save() {
        behind.active(3);
        behind.line(3, '<b>Consulta #BR-' + String(900 + state.messages + 1) + '</b> guardada en la base única');
        behind.chip(3, 'Trazabilidad del bróker', 'good');
      },
      model() {
        behind.active(4);
        behind.line(4, 'Tiempo en el sistema: <b>' + hours + ' h</b> · estado: <b>' + r.status + '</b>');
        behind.meter(4, Math.min(100, Math.round((hours / 72) * 100)));
        behind.line(4, 'Riesgo de no renovación (modelo real): <b>' + state.risk.renov.pct + '%</b>');
      },
      decide() {
        behind.active(5);
        behind.line(5, 'Respuesta al bróker: <b>' + r.status + '</b> · ≤ ' + r.eta);
        behind.chip(5, 'Reglas + datos de ejemplo', '');
      },
    });
    if (!ok) return;
    const intent = { id: 'reembolso', flow: 'reembolso', persona: 'broker', label: 'Estado de reembolso', reimb: r, hours };
    finalize(intent, flow.messages);
    addBubble(r.msg, 'bot');
    await wait(500);
    if (!alive(tk)) return;
    addTimeline(r.stage);
    await wait(700);
    if (!alive(tk)) return;
    flow.awaiting = 'post';
    flow.busy = false;
    addChips([{ label: 'Avísame cuando cambie el estado', v: 'notify', cls: 'suggest' }, { label: 'Consultar otro reembolso', v: 'other', cls: 'ghost' }]);
  }
  async function reimbPost(text, v) {
    const t = norm(text);
    const val = v || (/avis|notific|cambie/.test(t) ? 'notify' : /otro|otra|lista/.test(t) ? 'other' : null);
    flow.busy = true;
    if (val === 'notify') {
      if (!await say('Listo, ' + PERSONA.first + '. Te aviso aquí y por correo apenas cambie el estado del reembolso.', 800)) return;
      flow.busy = false;
      addChips([{ label: 'Consultar otro reembolso', v: 'other', cls: 'ghost' }]);
    } else if (val === 'other') {
      showReimbList(runToken);
    } else {
      if (!await say('Puedo avisarte cuando cambie el estado, o consultar otro reembolso de Juan Pérez:', 600)) return;
      flow.busy = false;
      addChips([{ label: 'Avísame cuando cambie el estado', v: 'notify', cls: 'suggest' }, { label: 'Consultar otro reembolso', v: 'other', cls: 'ghost' }]);
    }
  }

  // ---------------- Enrutador de mensajes ----------------
  function isFeverText(t) { return /fiebre|calentura|temperatura|hij[oa]|doctor|pediatr|urgenc|emergenc|llevar|nino|nina/.test(norm(t)); }
  function isReimbText(t) { return /reembols|rembols|juan|perez|sime|tomograf|estado|tramite/.test(norm(t)); }

  function userSays(text, value) {
    if (flow && flow.busy) return;
    addBubble(text, 'user');
    chatAttachBtn.classList.remove('hint');
    removeChips();
    if (flow && !flow.done && flow.awaiting) {
      if (flow.type === 'fiebre') {
        if (flow.awaiting === 'step') return feverAnswer(text, value);
        if (flow.awaiting === 'pick') return feverPick(text, value);
      } else {
        if (flow.awaiting === 'pick') return reimbPick(text, value);
        if (flow.awaiting === 'post') return reimbPost(text, value);
      }
    }
    // Sin flujo activo (o ya terminó): ¿empieza uno nuevo?
    if (PERSONA.key === 'afiliado' && isFeverText(text)) { startFever(text); return; }
    if (PERSONA.key === 'broker' && isReimbText(text)) { startReimb(text); return; }
    if (flow && flow.done) flow = null;
    (async () => {
      flow = null;
      if (await say('Para esta demostración puedo ayudarte con esto:', 600)) addChips([{ label: PERSONA.starter, cls: 'suggest' }]);
    })();
  }

  function ensureChatIntro() {
    if (chatBody.children.length) return;
    addBubble(PERSONA.intro, 'bot');
    addChips([{ label: PERSONA.starter, cls: 'suggest' }]);
  }

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    userSays(text);
  });
  chatBody.addEventListener('click', (e) => {
    const c = e.target.closest('.opt-card.pick');
    if (!c || !flow || flow.busy) return;
    if (flow.type === 'fiebre' && flow.awaiting === 'pick') {
      const r = flow.ranked.find((x) => x.p.id === c.dataset.id);
      userSays('Voy a ' + r.p.name, c.dataset.id);
    } else if (flow.type === 'reembolso' && flow.awaiting === 'pick') {
      const r = REIMBS.find((x) => x.id === c.dataset.id);
      userSays(r.pick, c.dataset.id);
    }
  });
  if (chatAttachBtn && chatFileInput) {
    chatAttachBtn.addEventListener('click', () => chatFileInput.click());
    chatFileInput.addEventListener('change', () => {
      const file = chatFileInput.files && chatFileInput.files[0];
      chatFileInput.value = '';
      if (file) userSays('📎 ' + file.name);
    });
  }


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

  function queueStorageRow(messages, intent) {
    const text = Array.isArray(messages) ? messages.join('\n') : messages;
    state.pendingRow = { time: nowLabel(), canal: PERSONA.canal, msg: text, intent: intent.label };
  }
  function nowLabel() {
    return 'Hoy · ' + new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  }
  function renderPendingRow() {
    if (!state.pendingRow) {
      btnGoProc.disabled = state.lastIntent === null || !!pendingSaveRow;
      btnGuardar.disabled = !pendingSaveRow;
      return;
    }
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
    tr.children[4].innerHTML = '<span class="tag-state pending">Listo para guardar</span>';
    pendingSaveRow = tr;
    btnGuardar.disabled = false;
  }
  let pendingSaveRow = null;
  const btnGuardar = document.getElementById('btnGuardar');
  const dbCol = document.getElementById('dbCol');
  const dbBadge = document.getElementById('dbBadge');
  btnGuardar.addEventListener('click', () => {
    if (!pendingSaveRow) return;
    pendingSaveRow.children[4].innerHTML = '<span class="tag-state ok">Guardado ✓</span>';
    pendingSaveRow = null;
    btnGuardar.disabled = true;
    dbCol.classList.remove('db-pulse'); void dbCol.offsetWidth; dbCol.classList.add('db-pulse');
    dbBadge.classList.remove('show'); void dbBadge.offsetWidth; dbBadge.classList.add('show');
    setTimeout(() => dbCol.classList.remove('db-pulse'), 1200);
    setTimeout(() => { btnGoProc.disabled = false; }, reduced ? 50 : 500);
  });

  // ---------------- Procesamiento: flujo animado ----------------
  const reasoningText = $('reasoningText');
  const btnGoCliente = $('btnGoCliente');
  let procTimer = null;
  function settleReasoning(risk) {
    reasoningText.textContent = reasoningFor(state.lastIntent, risk);
    paintDecision(state.lastIntent, risk);
    btnGoCliente.disabled = false;
  }
  function playNetwork() {
    clearTimeout(procTimer);
    $('decisionCard').hidden = true;
    btnGoCliente.disabled = true;
    if (!state.lastIntent) {
      paintMlFlow(null);
      reasoningText.textContent = 'Envía un mensaje en el Chat para ver el razonamiento del modelo.';
      return;
    }
    const risk = state.risk || fallbackRisk();
    paintMlFlow(state.lastIntent, risk);
    reasoningText.textContent = '';
    procTimer = setTimeout(() => settleReasoning(risk), reduced ? 50 : 8000);
  }

  // ---------------- Cliente interno: buscador de afiliado ----------------
  const AFFILIATES = [
    { id: 'daniel', name: 'Daniel Chacón', cedula: '1712345678' },
    { id: 'juan', name: 'Juan Pérez', cedula: '1718765432' },
    { id: 'carlos', name: 'Carlos Mendoza Ruiz', cedula: '0923456781' },
    { id: 'ana', name: 'Ana Torres Vega', cedula: '1756789012' },
  ];
  const clientSearch = document.getElementById('clientSearch');
  const searchSuggestions = document.getElementById('searchSuggestions');
  const clientEmpty = document.getElementById('clientEmpty');
  const clientResults = document.getElementById('clientResults');
  let clientSelected = false;

  function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function renderSuggestions(query) {
    const q = norm(query.trim());
    if (!q) { searchSuggestions.classList.remove('show'); return; }
    const matches = AFFILIATES.filter((a) => norm(a.name).includes(q) || a.cedula.includes(q));
    if (!matches.length) { searchSuggestions.classList.remove('show'); return; }
    searchSuggestions.innerHTML = matches.map((a) =>
      '<div class="suggestion-item" data-name="' + a.name + '">' + a.name + ' <small>' + a.cedula + '</small></div>').join('');
    searchSuggestions.classList.add('show');
  }
  clientSearch.addEventListener('input', () => renderSuggestions(clientSearch.value));
  clientSearch.addEventListener('focus', () => renderSuggestions(clientSearch.value));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.client-search-wrap')) searchSuggestions.classList.remove('show');
  });
  searchSuggestions.addEventListener('click', (e) => {
    const item = e.target.closest('.suggestion-item');
    if (!item) return;
    const affiliate = AFFILIATES.find((a) => a.name === item.dataset.name);
    clientSearch.value = affiliate.name;
    searchSuggestions.classList.remove('show');
    if (affiliate.id === PERSONA.clientId) {
      clientSelected = true;
      clientEmpty.hidden = true;
      clientResults.hidden = false;
      renderClient();
    } else {
      clientSelected = false;
      clientResults.hidden = true;
      clientEmpty.hidden = false;
      clientEmpty.innerHTML = '<span class="client-empty-ic">🚧</span><p>Esta demo solo tiene datos en vivo para <b>' + PERSONA.clientName + '</b> — el caso que trabajaste en el chat. Búscalo para ver su ficha completa.</p>';
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
  function animateCount(el, to, suffix) {
    suffix = suffix || '';
    const from = parseInt(el.dataset.count || '0', 10) || 0;
    el.dataset.count = to;
    const start = performance.now(), dur = 650;
    function tick(t) {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const opText = document.getElementById('opText');

  let lastShowDiab = false;
  const DIAB_PLAN = ['Agendar control con endocrinología', 'Enviar material educativo sobre alimentación', 'Activar seguimiento trimestral de glucosa'];
  const RENOV_PLAN = ['Contacto proactivo de un asesor en 24h', 'Ofrecer compensación o mejora de plan', 'Marcar cuenta para seguimiento prioritario'];
  const DEFAULT_PLAN = ['Continuar monitoreo estándar', 'Enviar recordatorio de bienestar preventivo'];

  function renderClient() {
    animateCount(statMsgs, state.messages);
    const li = state.lastIntent;
    const risk = state.risk || fallbackRisk();

    if (risk.diab.high) {
      addAlert({
        key: 'diabetes', icon: '⚠️', title: 'Riesgo de diabetes tipo 2',
        text: 'Modelo real (regresión logística + random forest): ' + risk.diab.pct + '% de probabilidad — percentil ' + risk.diab.pctl +
          ' del segmento, con ' + plural(profile.num_citas_glucosa_6m, 'consulta relacionada', 'consultas relacionadas') + ' a glucosa en los últimos 6 meses.',
        plan: DIAB_PLAN,
      });
    }
    if (risk.renov.high) {
      addAlert({
        key: 'renovacion', icon: '⚠️', title: 'Riesgo de no renovación',
        text: 'Modelo real (regresión logística + random forest): ' + risk.renov.pct + '% de probabilidad — percentil ' + risk.renov.pctl +
          ' del segmento, con ' + plural(profile.num_quejas_2m, 'queja registrada', 'quejas registradas') + ' recientemente.',
        plan: RENOV_PLAN,
      });
    }
    if (li && li.flow === 'fiebre') {
      addAlert({ key: 'urgencia', icon: '🩺', title: 'Consulta de urgencia pediátrica',
        text: 'Consultó por la fiebre de su hijo (urgencia ' + LEVEL_TXT[li.level].toLowerCase() + ')' + (li.picked ? ' y eligió ' + li.ranked.find((x) => x.p.id === li.picked).p.name : '') + '.',
        plan: flowPlan(li) });
    }
    if (li && li.flow === 'reembolso') {
      addAlert({ key: 'reembolso', icon: '🧾', title: 'Reembolso #' + li.reimb.id + ' en estado ' + li.reimb.status,
        text: 'Lleva ' + li.hours + ' h en el sistema; la respuesta está comprometida en ' + li.reimb.eta + '.',
        plan: flowPlan(li) });
    }
    const strategyList = document.getElementById('strategyList');
    if (strategyList) {
      const items = [...flowPlan(li), ...(risk.renov.high ? RENOV_PLAN : []), ...(risk.diab.high ? DIAB_PLAN : [])];
      strategyList.innerHTML = (items.length ? items : DEFAULT_PLAN).map((p) =>
        '<li><span class="strategy-box"></span><span class="strategy-text">' + p + '</span><span class="strategy-check">✓</span></li>'
      ).join('');
    }
    const count = Object.keys(state.alerts).length;
    animateCount(statAlerts, count);
    statRenewal.textContent = risk.renov.high ? 'Alto' : 'Bajo';
    statRenewalWrap.classList.toggle('risk', risk.renov.high);
    alertBaseline.style.display = count ? 'none' : 'flex';

    if (riskGauge) {
      const pct = risk.renov.pct;
      const segmentAvgPct = Math.round((MODELS ? MODELS.no_renovacion.segment_mean : 0.17) * 100);
      riskGauge.style.setProperty('--pct', pct);
      riskGauge.classList.toggle('risk', risk.renov.high);
      riskGaugeLabel.textContent = risk.renov.high ? 'Alto' : 'Bajo';
      animateCount(riskPctEl, pct, '%');
      const delta = pct - segmentAvgPct;
      riskDeltaEl.classList.toggle('risk', risk.renov.high);
      riskDeltaEl.textContent = (delta === 0
        ? 'en línea con el promedio del segmento'
        : (delta > 0 ? '↑ ' + delta + '% vs. promedio del segmento' : '↓ ' + Math.abs(delta) + '% vs. promedio del segmento')) +
        ' · percentil ' + risk.renov.pctl;
    }
    if (opText) {
      if (li && li.flow) opText.textContent = flowReco(li);
      else if (risk.renov.high) opText.textContent = 'Recomendación personalizada: contacto proactivo de un asesor de retención y revisión del plan en las próximas 24h.';
      else if (risk.diab.high) opText.textContent = 'Recomendación personalizada: programa de control de glucosa, seguimiento nutricional y recordatorio de citas con endocrinología.';
      else opText.textContent = 'Recomendación personalizada: recordatorio de control médico y programa de bienestar.';
    }
    let showDiab = false;
    if (MODELS) {
      showDiab = false;
      lastShowDiab = showDiab;
      renderForestSVG(showDiab ? MODELS.diabetes : MODELS.no_renovacion, profile, 0);
    }
    renderAiChips(risk, count, showDiab);
    renderHistory();
    renderProfile360(risk);
  }

  // ---------------- Perfil 360° del afiliado ----------------
  function renderProfile360(risk) {
    const diabText = document.getElementById('p360DiabText');
    if (diabText) {
      diabText.innerHTML = risk.diab.high
        ? '<b>Riesgo metabólico</b> alto detectado'
        : '<b>Riesgo metabólico</b> bajo';
    }
    const citasText = document.getElementById('p360CitasText');
    if (citasText) {
      const n = state.messages || 0;
      citasText.innerHTML = '<b>' + n + ' ' + (n === 1 ? 'interacción' : 'interacciones') + '</b> con ConfIAbot';
    }
    const fill = document.getElementById('p360RiskFill');
    const pctEl = document.getElementById('p360RiskPct');
    if (fill && pctEl) {
      const pct = risk.renov.pct;
      fill.style.width = pct + '%';
      fill.classList.toggle('risk', risk.renov.high);
      pctEl.classList.toggle('risk', risk.renov.high);
      pctEl.textContent = pct + '%';
    }
  }

  // ---------------- Pestañas del Cliente interno ----------------
  const SEED_HISTORY = [
    { time: 'Ayer · 16:42', msg: '¿Cuál es mi plan actual?', label: 'Consulta general' },
    { time: 'Ayer · 09:15', msg: 'Necesito mi carné digital', label: 'Consulta general' },
  ];
  const historyList = document.getElementById('historyList');
  function renderHistory() {
    if (!historyList) return;
    const rows = [...state.history, ...SEED_HISTORY];
    historyList.innerHTML = rows.map((r) =>
      '<li class="history-item"><div class="hi-main"><span class="hi-time">' + r.time + '</span>' +
      '<span class="hi-msg">' + r.msg + '</span></div><span class="hi-tag">' + r.label + '</span></li>'
    ).join('');
  }
  const clientTabs = document.getElementById('clientTabs');
  if (clientTabs) {
    clientTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.ct');
      if (!btn) return;
      clientTabs.querySelectorAll('.ct').forEach((c) => c.classList.toggle('active', c === btn));
      const name = btn.dataset.tab;
      document.querySelectorAll('.client-tabpanel').forEach((p) => {
        p.hidden = p.dataset.tabPanel !== name;
      });
      // El panel del árbol está oculto (display:none) hasta que se entra a esta
      // pestaña, así que la animación de zoom no se alcanza a ver si corrió antes.
      // La re-disparamos cada vez que el afiliado entra a Recomendaciones.
      if (name === 'recomendaciones' && MODELS && state.risk) {
        renderForestSVG(lastShowDiab ? MODELS.diabetes : MODELS.no_renovacion, profile, 0);
      }
    });
  }

  // ---------------- Resúmenes llamativos (ai-chip) por módulo ----------------
  function setChip(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  function renderAiChips(risk, alertCount, showDiab) {
    const anyHigh = risk.renov.high || risk.diab.high;
    setChip('chipClientText', anyHigh
      ? 'Perfil con ' + plural(alertCount, 'señal activa', 'señales activas') + ' — requiere atención'
      : 'Perfil estable · sin señales de riesgo relevantes');

    setChip('chipRiskText', risk.renov.high
      ? 'Riesgo alto de no renovación (' + risk.renov.pct + '%) — percentil ' + risk.renov.pctl + ' del segmento'
      : 'Riesgo bajo de no renovación (' + risk.renov.pct + '%) — dentro de lo esperado');

    setChip('chipStrategyText', risk.renov.high
      ? 'Prioridad alta: contacto de retención en menos de 24h'
      : (risk.diab.high ? 'Prioridad media: seguimiento preventivo de salud' : 'Prioridad estándar: mantener el buen vínculo'));

    setChip('chipModelText', (showDiab ? 'Riesgo de salud' : 'No renovación') +
      ' · ' + (MODELS ? MODELS[showDiab ? 'diabetes' : 'no_renovacion'].rf.trees.length : 12) + ' árboles votando en tiempo real');

    setChip('chipValueText', state.messages === 1
      ? '1 mensaje analizado ya mejora la atención que recibe'
      : state.messages + ' mensajes analizados ya mejoran la atención que recibe');
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


  // ---------------- Persona: aplicar portal elegido y reiniciar la demo ----------------
  function setText(id, t) { const el = $(id); if (el) el.textContent = t; }
  function applyPersona(key) {
    runToken++;
    PERSONA = PERSONAS[key];
    const P = PERSONA;
    // reinicio de la sesión
    flow = null;
    chatBody.innerHTML = '';
    behind.reset();
    state.messages = 0; state.alerts = {}; state.history = []; state.lastIntent = null; state.risk = null; state.pendingRow = null;
    pendingSaveRow = null;
    btnGuardar.disabled = true; btnGoProc.disabled = true; $('btnGoCliente').disabled = true;
    storeBody.innerHTML = '';
    seedRows.forEach((r) => storeBody.appendChild(makeRow(r, false)));
    alertsWrap.querySelectorAll('.alert-card:not(.baseline)').forEach((a) => a.remove());
    clearTimeout(procTimer);
    $('decisionCard').hidden = true;
    ['almacenamiento', 'procesamiento', 'cliente'].forEach((n) => { const b = tabBtns.find((x) => x.dataset.view === n); if (b) b.disabled = true; });
    clientSelected = false; clientSearch.value = '';
    clientResults.hidden = true; clientEmpty.hidden = false;
    clientEmpty.innerHTML = '<span class="client-empty-ic">🗂️</span><p>Busca a <b id="clientEmptyName">' + P.clientName + '</b> arriba para abrir su ficha — es el caso que acabas de trabajar en el chat.</p>';
    Object.assign(profile, P.profile);

    // cabecera
    $('personaChip').hidden = false;
    const setAv = (id) => { const a = $(id); if (a) { a.textContent = P.initials; a.classList.toggle('broker', P.broker); } };
    ['personaAvatar', 'pFootAvatar', 'pTopAvatar', 'cAvatar'].forEach(setAv);
    setText('personaName', P.name); setText('personaRole', P.role);
    // portal (inicio)
    setText('pTagline', P.tagline); setText('pFootName', P.name); setText('pFootSub', P.foot);
    setText('pGreet', P.greet); setText('pGreetSub', P.greetSub);
    $('pNav').innerHTML = P.nav.map((n, i) => '<li' + (i === 0 ? ' class="active"' : '') + '>' + n + '</li>').join('');
    $('pStats').querySelectorAll('.qstat').forEach((q, i) => { q.querySelector('b').textContent = P.stats[i][0]; q.querySelector('small').textContent = P.stats[i][1]; });
    $('pCards').innerHTML = P.cards.map((c) =>
      '<div class="portal-card' + (c.hl ? ' highlight" id="btnOpenChat" role="button" tabindex="0' : '') + '"><span class="pc-ic">' + c.ic + '</span><b>' + c.b + '</b><small>' + c.s + '</small></div>').join('');
    setText('pSub', P.sub); setText('pHint', P.hint);
    // chat
    setText('cName', P.name); setText('cSub', P.role);
    // cliente interno
    const ca = $('clientAvatar'); ca.textContent = P.clientInitials;
    setText('clientName', P.clientName); setText('clientKicker', P.clientKicker); setText('clientEmptyName', P.clientName);
    clientSearch.placeholder = 'Buscar afiliado por nombre…';
  }


  // ---------------- Flujo ML animado: entrada → decisiones → red → resultado ----------------
  function mlFlowData(intent, risk) {
    const msg = state.history.length ? state.history[0].msg.split(' · ')[0] : '';
    if (intent.flow === 'fiebre') {
      const d = intent.data, best = intent.ranked[0];
      const edad = { lt2: 'Menos de 2 años', '2a5': '2 a 5 años', '6a12': '6 a 12 años', '13a17': '13 a 17 años' }[d.edad];
      return {
        title: 'Así decide ConfIAbot: del mensaje a la mejor opción',
        entrada: [['💬', 'Conversación del afiliado', msg], ['🧒', 'Edad del paciente', edad], ['📍', 'Ubicación del afiliado', 'Valle de Tumbaco'], ['🛡️', 'Cobertura del afiliado', PERSONAS.afiliado.foot]],
        decisiones: [
          ['⚠️', '¿Es una emergencia?', intent.level === 'alta' ? 'Sí' : intent.level === 'media' ? 'Conviene hoy' : 'No', intent.level === 'alta'],
          ['🧑‍⚕️', '¿Requiere atención pediátrica?', 'Sí', false],
          ['🏥', '¿Qué prestadores tienen capacidad de atenderlo?', intent.ranked.length + ' con cupo', false],
          ['💲', '¿Cuál es la opción más conveniente?', best.score + '/100', false],
          ['🧠', 'Evaluación de prestadores', 'Ranking listo', false],
        ],
        nodes: intent.ranked.map((r) => r.p.name.replace('Hospital de los ', 'H. de los ').replace('Clínica Pediátrica ', 'Clín. Ped. ').replace('Centro Médico ', 'C. M. ')),
        netTitle: 'Red neuronal en vivo', netSub: 'cada salida es un prestador cercano a Tumbaco',
        scores: intent.ranked.map((r) => r.score + '/100'),
        result: { name: best.p.name, sub: best.p.sub, chips: ['📍 ' + String(best.p.dist).replace('.', ',') + ' km · ' + best.p.eta, '⏱ Espera ~' + best.p.wait + ' min', '✓ ' + best.p.covTxt],
          why: ['Puntaje más alto: ' + best.score + '/100', 'Dentro de la cobertura de tu plan', best.p.urg >= 1 ? 'Urgencias pediátricas las 24 horas' : 'Atención de emergencias disponible', 'Esperas y cercanía comparadas con los otros 2'], score: best.score, scoreLbl: 'de 100 · mejor opción' },
        steps: ['Datos', 'Decisiones', 'Red de prestadores', '★ Mejor opción'],
      };
    }
    const r = intent.reimb;
    return {
      title: 'Así decide ConfIAbot: del mensaje al estado del trámite',
      entrada: [['💬', 'Conversación del bróker', msg], ['👤', 'Afiliado consultado', 'Juan Pérez'], ['🧾', 'Trámite', 'Reembolso #' + r.id + ' · ' + r.short], ['📅', 'Recibido', r.recv]],
      decisiones: [
        ['📄', '¿Está completo el trámite?', 'Sí', false],
        ['⏱️', '¿Cuánto tiempo lleva en el sistema?', intent.hours + ' h', intent.hours >= 48],
        ['🧑‍💼', '¿Qué ejecutivos pueden liquidarlo?', '3 disponibles', false],
        ['📆', '¿Cuándo habrá respuesta?', '≤ ' + r.eta, false],
        ['🧠', 'Evaluación de ejecutivos', 'Asignado', false],
      ],
      nodes: ['Ejecutivo A', 'Ejecutivo B', 'Ejecutivo C'],
      netTitle: 'Red neuronal en vivo', netSub: 'cada salida es un ejecutivo de liquidaciones',
      scores: ['asignado', 'disponible', 'disponible'],
      result: { name: 'Estado: ' + r.status, sub: 'Reembolso #' + r.id + ' · ' + r.short, chips: ['📅 Recibido ' + r.recv, '⏱ ' + intent.hours + ' h en el sistema', '📬 Respuesta ≤ ' + r.eta],
        why: ['Trámite completo, sin papeles faltantes', 'Se asigna a un ejecutivo de liquidaciones', 'Respuesta dentro del plazo prometido', 'Se avisa al bróker apenas cambie el estado'], score: r.stage + 1, scoreLbl: 'de 5 etapas del recorrido' },
      steps: ['Datos', 'Decisiones', 'Ejecutivos', '★ Respuesta'],
    };
  }
  // Red neuronal en capas: entradas con nombre → capas ocultas que se encienden de
  // izquierda a derecha → salidas (las opciones). Se resalta el camino ganador.
  function buildNetSVG(f, inLabels) {
    const W = 880, H = 270, counts = [6, 8, 8, 6, 3], xs = [175, 320, 460, 600, 735];
    const ys = counts.map((c) => Array.from({ length: c }, (_, i) => 22 + ((i + 0.5) * (H - 44)) / c));
    const T0 = 4.4, STEP = 0.5;
    const win = [2, 4, 3, 3, 0];            // camino ganador (un nodo por capa)
    const winY = (l) => ys[l][win[l]];
    let g = '<defs><filter id="mlfGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<radialGradient id="mlfNode" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#eafeff"/><stop offset=".5" stop-color="#3fd6f0"/><stop offset="1" stop-color="#0c87ad"/></radialGradient>' +
      '<radialGradient id="mlfBest" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#f0fff6"/><stop offset=".5" stop-color="#3ee08f"/><stop offset="1" stop-color="#128a52"/></radialGradient></defs>';
    for (let l = 0; l < 4; l++) {
      ys[l].forEach((y1, i) => ys[l + 1].forEach((y2, j) => {
        g += '<line class="mlf-e" x1="' + xs[l] + '" y1="' + y1.toFixed(1) + '" x2="' + xs[l + 1] + '" y2="' + y2.toFixed(1) + '" style="animation-delay:' + (T0 + l * STEP + 0.15 + ((i * 7 + j * 3) % 5) * 0.05).toFixed(2) + 's"/>';
      }));
    }
    let path = 'M' + xs[0] + ',' + winY(0).toFixed(1);
    for (let l = 0; l < 4; l++) {
      g += '<line class="mlf-win" x1="' + xs[l] + '" y1="' + winY(l).toFixed(1) + '" x2="' + xs[l + 1] + '" y2="' + winY(l + 1).toFixed(1) + '" style="animation-delay:' + (T0 + 2.2 + l * 0.35).toFixed(2) + 's"/>';
      path += ' L' + xs[l + 1] + ',' + winY(l + 1).toFixed(1);
    }
    counts.forEach((c, l) => ys[l].forEach((y, i) => {
      const isWin = win[l] === i, isOut = l === 4;
      const r = isOut ? (isWin ? 12 : 8) : l === 0 ? 7 : 5.5;
      const cls = 'mlf-n' + (isWin && isOut ? ' best' : isWin ? ' win' : '');
      g += '<circle class="' + cls + '" cx="' + xs[l] + '" cy="' + y.toFixed(1) + '" r="' + r + '" style="animation-delay:' + (T0 + l * STEP + (isWin ? 0 : (i % 3) * 0.08)).toFixed(2) + 's"' + (isWin ? ' filter="url(#mlfGlow)"' : '') + '/>';
    }));
    ys[0].forEach((y, i) => { g += '<text class="mlf-lbl in" x="' + (xs[0] - 14) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end" style="animation-delay:' + (T0 - 0.2 + i * 0.06).toFixed(2) + 's">' + inLabels[i] + '</text>'; });
    ys[4].forEach((y, i) => {
      g += '<text class="mlf-lbl out' + (i === 0 ? ' best' : '') + '" x="' + (xs[4] + 20) + '" y="' + (y - 1).toFixed(1) + '" style="animation-delay:' + (T0 + 4 * STEP + 0.3).toFixed(2) + 's">' + f.nodes[i] + '</text>' +
        '<text class="mlf-lbl sc' + (i === 0 ? ' best' : '') + '" x="' + (xs[4] + 20) + '" y="' + (y + 11).toFixed(1) + '" style="animation-delay:' + (T0 + 4 * STEP + 0.4).toFixed(2) + 's">' + (i === 0 ? '★ ' : '') + f.scores[i] + '</text>';
    });
    ['Entrada', 'Capas de análisis', 'Opciones'].forEach((t, i) => {
      g += '<text class="mlf-cap" x="' + [xs[0], (xs[1] + xs[3]) / 2, xs[4]][i] + '" y="' + (H + 14) + '" text-anchor="middle">' + t + '</text>';
    });
    // pulso viajando por el camino ganador
    g += '<circle r="5" fill="#fff" filter="url(#mlfGlow)" opacity="0"><set attributeName="opacity" to="1" begin="' + (T0 + 2.4).toFixed(1) + 's"/><animateMotion dur="2.2s" begin="' + (T0 + 2.4).toFixed(1) + 's" repeatCount="indefinite" path="' + path + '"/></circle>';
    return '<svg viewBox="0 -4 ' + W + ' ' + (H + 22) + '" role="img" aria-label="Red neuronal">' + g + '</svg>';
  }
  function paintMlFlow(intent, risk) {
    const box = $('mlFlow');
    if (!intent) { box.hidden = true; box.innerHTML = ''; return; }
    const f = mlFlowData(intent, risk);
    const t = (s) => s.toFixed(2) + 's';
    const svg = buildNetSVG(f, NET_LABELS[intent.flow].in);
    box.innerHTML =
      '<div class="mlf-title">' + f.title + '</div><div class="mlf-sub">Entrada → decisiones → red neuronal → resultado, con los datos de esta conversación.</div>' +
      '<div class="mlf-grid">' +
      '<div class="mlf-col a"><div class="mlf-head"><span class="mlf-num">1</span><div><b>Entrada</b><small>Información recibida por ConfIAbot</small></div></div>' +
      f.entrada.map((e, i) => '<div class="mlf-in" style="animation-delay:' + t(0.2 + i * 0.35) + '"><span class="ic">' + e[0] + '</span><div><b>' + e[1] + '</b><small>' + e[2] + '</small></div></div>').join('') + '</div>' +
      '<div class="mlf-col b"><div class="mlf-head"><span class="mlf-num">2</span><div><b>Decisiones</b><small>Análisis inteligente, paso a paso</small></div></div>' +
      f.decisiones.map((q, i) => '<div class="mlf-q" style="animation-delay:' + t(1.7 + i * 0.5) + '"><span class="ic">' + q[0] + '</span><span class="t">' + q[1] + '</span>' +
        '<span class="mlf-think" style="animation-delay:' + t(1.9 + i * 0.5) + '">…</span><span class="mlf-ans' + (q[3] ? ' hot' : '') + '" style="animation-delay:' + t(2.3 + i * 0.5) + '">' + q[2] + '</span></div>').join('') + '</div>' +
      '<div class="mlf-col n"><div class="mlf-head"><span class="mlf-num">3</span><div><b>Red neuronal</b><small>' + f.netSub + '</small></div></div><div class="mlf-net">' + svg + '</div></div>' +
      '<div class="mlf-col r mlf-result" style="animation-delay:' + t(7.2) + '"><div class="mlf-head"><span class="mlf-num">4</span><div><b>Resultado</b><small>' + (intent.flow === 'fiebre' ? 'Mejor opción para el afiliado' : 'Respuesta para el bróker') + '</small></div></div>' +
      '<span class="mlf-badge">' + (intent.flow === 'fiebre' ? 'Recomendado' : 'Resuelto') + '</span><div class="mlf-rname">' + f.result.name + '</div><div class="mlf-rsub">' + f.result.sub + '</div>' +
      '<div class="mlf-chips">' + f.result.chips.map((c) => '<span>' + c + '</span>').join('') + '</div>' +
      '<div class="mlf-score">' + f.result.score + '</div><div class="mlf-sub" style="margin-bottom:10px">' + f.result.scoreLbl + '</div>' +
      '<div class="mlf-why"><b>¿Por qué esta opción?</b>' + f.result.why.map((w) => '<div>' + w + '</div>').join('') + '</div></div>' +
      '</div>';
    box.hidden = false;
  }

  // ---------------- Decisión del motor (Procesamiento) ----------------
  const FOOTNOTE = '<div class="dc-weights" style="margin-top:10px">Motor de reglas con datos de ejemplo (distancias, esperas y coberturas simuladas). El riesgo de no renovación sí lo calcula el modelo real entrenado.</div>';
  function reasoningFor(intent, risk) {
    if (intent.flow === 'fiebre') {
      const w = WEIGHTS[intent.level];
      return 'Se combinan la edad del niño, la temperatura y las señales de alarma para estimar la urgencia (nivel ' + LEVEL_TXT[intent.level].toLowerCase() + ', ' + intent.pts + ' de 7 puntos). ' +
        'Con ese nivel el motor decide qué pesa más al ordenar los lugares: atención de urgencias ' + Math.round(w.urg * 100) + '%, espera ' + Math.round(w.wait * 100) + '%, cercanía ' + Math.round(w.dist * 100) + '% y cobertura ' + Math.round(w.cov * 100) + '%. ' +
        'Resultado: ' + intent.ranked[0].p.name + ' encabeza la lista.' + realStatsLine(intent, risk);
    }
    return 'El motor lee el estado del reembolso #' + intent.reimb.id + ' (' + intent.reimb.status + '), el tiempo que lleva en el sistema (' + intent.hours + ' h) y la carga de los ejecutivos de liquidaciones para estimar cuándo habrá respuesta (≤ ' + intent.reimb.eta + '). ' +
      'Ese tiempo de espera también entra como dato al modelo de retención.' + realStatsLine(intent, risk);
  }
  function paintDecision(intent, risk) {
    const card = $('decisionCard'), title = $('decisionTitle'), body = $('decisionBody');
    if (!intent) { card.hidden = true; return; }
    card.hidden = false;
    if (intent.flow === 'fiebre') {
      const w = WEIGHTS[intent.level];
      title.textContent = 'Decisión del motor · ¿a dónde llevar al hijo de ' + PERSONAS.afiliado.first + '?';
      const bar = (lbl, v) => '<div class="dc-bar"><span>' + lbl + '</span><div><i style="width:' + Math.round(v * 100) + '%"></i></div></div>';
      body.innerHTML =
        '<div class="dc-weights">Nivel de urgencia <b>' + LEVEL_TXT[intent.level] + '</b> → pesos: urgencias ' + Math.round(w.urg * 100) + '% · espera ' + Math.round(w.wait * 100) + '% · cercanía ' + Math.round(w.dist * 100) + '% · cobertura ' + Math.round(w.cov * 100) + '%</div>' +
        intent.ranked.map((r, i) => '<div class="dc-row"><span class="rk">' + (i + 1) + '</span><div class="nm"><b>' + r.p.name + '</b><small>' + r.p.sub + '</small></div>' +
          '<div class="dc-bars">' + bar('Urgencias', r.parts.urg) + bar('Espera', r.parts.wait) + bar('Cercanía', r.parts.dist) + bar('Cobertura', r.parts.cov) + '</div>' +
          '<div class="dc-score">' + r.score + '</div></div>').join('') +
        '<div class="dc-checks">' +
        '<div class="dc-check good"><b>✓ Dentro de la red</b>Los 3 lugares están en la red del plan de ' + PERSONAS.afiliado.first + '.</div>' +
        '<div class="dc-check ' + (intent.level === 'alta' ? 'warn' : 'good') + '"><b>' + (intent.level === 'alta' ? '⚠ Alerta de seguridad' : '✓ Sin señales de alarma graves') + '</b>' +
        (intent.level === 'alta' ? 'Se avisó que vaya a urgencias ya y se mostró el 911.' : 'Se recomienda control médico hoy.') + '</div>' +
        '<div class="dc-check ' + (risk.renov.high ? 'warn' : 'good') + '"><b>Modelo real · retención</b>' + risk.renov.pct + '% de riesgo de no renovación (percentil ' + risk.renov.pctl + ').</div></div>' + FOOTNOTE;
    } else {
      const r = intent.reimb;
      title.textContent = 'Decisión del motor · reembolso #' + r.id + ' de Juan Pérez';
      body.innerHTML =
        '<div class="dc-steps">' + REIMB_STAGES.map((s, i) => '<div class="dc-step ' + (i < r.stage ? 'done' : i === r.stage ? 'now' : '') + '">' + (i < r.stage ? '✓ ' : '') + s + '</div>').join('') + '</div>' +
        '<div class="dc-checks">' +
        '<div class="dc-check good"><b>✓ Documentos completos</b>El trámite no requiere más papeles del afiliado.</div>' +
        '<div class="dc-check ' + (intent.hours >= 48 ? 'warn' : 'good') + '"><b>' + (intent.hours >= 48 ? '⚠ ' : '✓ ') + 'Tiempo en el sistema</b>' + intent.hours + ' horas · respuesta comprometida en ' + r.eta + '.</div>' +
        '<div class="dc-check good"><b>✓ Ejecutivo disponible</b>Cola de liquidaciones con 14 casos (simulado) · asignación en minutos.</div>' +
        '<div class="dc-check ' + (risk.renov.high ? 'warn' : 'good') + '"><b>Modelo real · retención</b>' + risk.renov.pct + '% de riesgo de no renovación con ' + intent.hours + ' h de espera (percentil ' + risk.renov.pctl + ').</div></div>' + FOOTNOTE;
    }
  }
  function flowPlan(li) {
    if (!li) return [];
    if (li.flow === 'fiebre') return ['Llamada de seguimiento en 24 h para saber cómo sigue su hijo', 'Registrar la atención recibida en su historial'];
    return ['Priorizar la asignación a un ejecutivo de liquidaciones', 'Avisar a Nova apenas cambie el estado'];
  }
  function flowReco(li) {
    if (li.flow === 'fiebre') return 'Recomendación: dar seguimiento a la atención de urgencia de su hijo y confirmar en 24 h que esté bien. Es un momento clave para que sienta a Confiamed de su lado.';
    return 'Recomendación: cerrar el reembolso #' + li.reimb.id + ' dentro del plazo prometido y avisar a la bróker; una respuesta a tiempo protege la renovación del afiliado.';
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

  // ---------------- Inicio ----------------
  applyPersona('afiliado');
  $('personaChip').hidden = true;
})();
