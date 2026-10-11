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
      role: 'Portal afiliado · Plan Oro', tagline: 'Portal afiliado', foot: 'Plan Oro',
      canal: 'App móvil', clientId: 'daniel', clientName: 'Daniel Chacón', clientInitials: 'DC', clientKicker: 'Afiliado · Plan Oro',
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
      key: 'broker', name: 'Andrea Salazar', first: 'Andrea', initials: 'AS', broker: true,
      role: 'Portal bróker', tagline: 'Portal bróker', foot: 'Bróker Confiamed',
      canal: 'Portal bróker', clientId: 'juan', clientName: 'Juan Pérez', clientInitials: 'JP', clientKicker: 'Afiliado · a cargo de Andrea Salazar',
      nav: ['🏠 Inicio', '👥 Mis afiliados', '💳 Reembolsos', '✅ Autorizaciones', '📈 Cotizaciones', '⚙️ Configuración'],
      stats: [['128', 'Afiliados a cargo'], ['6', 'Trámites activos'], ['3', 'Reembolsos en revisión']],
      cards: [
        { ic: '👥', b: 'Mis afiliados', s: 'Consulta y gestiona' }, { ic: '✅', b: 'Autorizaciones', s: 'Solicita y da seguimiento' },
        { ic: '💳', b: 'Reembolsos', s: 'Estado de tus afiliados' }, { ic: '🤖', b: 'ConfIAbot', s: 'Tu asistente inteligente', hl: true },
      ],
      greet: 'Hola, Andrea', greetSub: 'Tus afiliados y trámites, en un solo lugar.',
      sub: 'Pregúntale a ConfIAbot por cualquier trámite de tus afiliados.',
      hint: '💡 Toca “ConfIAbot” y consulta el estado de un reembolso de tu afiliado Juan Pérez.',
      intro: 'Hola Andrea 👋 Soy ConfIAbot para brókers. ¿Qué trámite de tus afiliados quieres consultar?',
      starter: '¿En qué estado se encuentra el reembolso de mi afiliado Juan Pérez?',
      profile: { edad: 52, imc: 27, historial_familiar_diabetes: 0, num_citas_glucosa_6m: 0, num_quejas_2m: 0, tiempo_respuesta_prom_h: 12, nps_score: 7, antiguedad: 9 },
    },
  };
  let PERSONA = PERSONAS.afiliado;

  // Lugares de atención (red del plan). Distancias, esperas y coberturas: datos de ejemplo.
  const PROVIDERS = [
    { id: 'valles', name: 'Hospital de los Valles', sub: 'Urgencias pediátricas · 24 horas', dist: 4.2, eta: '12 min', wait: 15, urg: 1.0, cov: 1.0, covTxt: 'Cubierto al 100%' },
    { id: 'santalucia', name: 'Clínica Pediátrica Santa Lucía', sub: 'Emergencias pediátricas · 24 horas', dist: 2.8, eta: '8 min', wait: 35, urg: 0.9, cov: 0.9, covTxt: 'Cubierto al 90%' },
    { id: 'quitonorte', name: 'Centro Médico Quito Norte', sub: 'Emergencias generales · pediatra de turno', dist: 6.5, eta: '18 min', wait: 10, urg: 0.7, cov: 1.0, covTxt: 'Cubierto al 100%' },
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
    const cols = 4, cellW = 240, cellH = 150;
    const rows = Math.ceil(trees.length / cols);
    const vbW = cols * cellW, vbH = rows * cellH;
    svg.setAttribute('viewBox', `0 0 ${vbW} ${vbH}`);

    const parts = [`<defs>
      <filter id="treeGlow" x="-120%" y="-120%" width="340%" height="340%">
        <feGaussianBlur stdDeviation="3.2" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="nodeGlowOn" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#eafeff"/>
        <stop offset="45%" stop-color="#5fe3f7"/>
        <stop offset="100%" stop-color="#0c87ad"/>
      </radialGradient>
    </defs>`, '<g id="forestGroup">'];

    let heroOut = null, heroPy = null, heroCx = 0, heroCy = 0;
    trees.forEach((tree, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x0 = col * cellW + 14, x1 = (col + 1) * cellW - 14;
      const y0 = row * cellH + 16;
      const out = { nodes: [], edges: [], maxDepth: 0 };
      layoutTree(tree, feat, 0, x0, x1, true, out);
      const isHero = i === heroIdx;
      const { parts: cellParts, py } = treeCellParts(out, y0, cellH - 32, isHero);
      if (isHero) {
        heroOut = out; heroPy = py;
        heroCx = col * cellW + cellW / 2; heroCy = row * cellH + cellH / 2;
        parts.push('<g id="heroTree">' + cellParts.join('') + '</g>');
      } else {
        parts.push('<g class="other-tree">' + cellParts.join('') + '</g>');
      }
    });
    parts.push('</g>');

    // texto final: solo el resultado, junto al nodo-hoja resaltado del árbol hero
    const leafPathNode = heroOut.nodes.find((n) => n.onPath && 'leaf' in n.node);
    if (leafPathNode) {
      const cy = heroPy(leafPathNode.y);
      const r = 9 + leafPathNode.node.leaf * 5;
      const delay = (leafPathNode.y * 0.16 + 0.3).toFixed(2);
      const onRight = leafPathNode.x <= heroCx + 20;
      const lx = onRight ? leafPathNode.x + r + 8 : leafPathNode.x - r - 8;
      const anchor = onRight ? 'start' : 'end';
      parts.push(`<text class="leaf-label" x="${lx}" y="${cy + 4}" font-size="13" font-weight="700" text-anchor="${anchor}" dominant-baseline="middle" fill="#eafeff" style="animation-delay:${delay}s">${Math.round(leafPathNode.node.leaf * 100)}%</text>`);
    }

    svg.innerHTML = parts.join('');

    // --- Coreografía: zoom al camino tomado -> punto viajando -> zoom out al bosque completo ---
    const group = svg.querySelector('#forestGroup');
    const scaleFactor = Math.min(3.2, Math.max(1.8, Math.min(vbW / cellW, vbH / cellH) * 0.82));
    const tx = vbW / 2 - scaleFactor * heroCx, ty = vbH / 2 - scaleFactor * heroCy;
    svg.classList.remove('zoomed-out');
    group.style.transition = 'none';
    group.style.transform = `translate(${tx}px,${ty}px) scale(${scaleFactor})`;
    void group.getBoundingClientRect();
    group.style.transition = 'transform 1.3s cubic-bezier(.3,.7,.15,1)';

    const motionD = heroMotionPath(heroOut, heroPy);
    const motionPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    motionPath.setAttribute('d', motionD);
    motionPath.setAttribute('fill', 'none');
    motionPath.setAttribute('stroke', 'none');
    const heroG = svg.querySelector('#heroTree');
    heroG.appendChild(motionPath);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '6'); dot.setAttribute('class', 'flow-packet');
    heroG.appendChild(dot);
    const totalLen = motionPath.getTotalLength();
    const dur = 1100, start = performance.now();
    function tick(t) {
      const p = Math.min(1, (t - start) / dur);
      const pt = motionPath.getPointAtLength(p * totalLen);
      dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
      if (p >= 1) dot.style.opacity = '0';
      else requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    clearTimeout(svg._zoomTimer);
    svg._zoomTimer = setTimeout(() => {
      group.style.transform = 'translate(0px,0px) scale(1)';
      svg.classList.add('zoomed-out');
    }, dur + 500);

    if (caption) {
      const label = model === (MODELS && MODELS.diabetes) ? 'riesgo de diabetes tipo 2' : 'riesgo de no renovación';
      caption.textContent = '→ Random Forest real (' + trees.length + ' árboles) — se resalta el camino que tomó el árbol #' + (heroIdx + 1) + ' para ' + label + '; luego se aleja la vista para ver el resto del bosque votando.';
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
  // Resultado de la red neuronal según el flujo que se acaba de vivir
  function outcomeFromIntent(intent, risk) {
    if (!intent) return { index: 2, danger: false };
    if (intent.flow === 'fiebre') {
      const idx = intent.level === 'alta' ? 0 : intent.level === 'media' ? 1 : 2;
      return { index: idx, danger: intent.level === 'alta' };
    }
    if (intent.flow === 'reembolso') {
      const idx = intent.reimb.stage >= 3 ? 2 : (intent.hours > 72 ? 0 : 1);
      return { index: idx, danger: idx === 0 };
    }
    return { index: 2, danger: false };
  }
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
    beginBehind([['Quién: ' + PERSONA.name], ['Motivo: fiebre en un menor', 'hot']]);
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
      'Buscando lugares con urgencias abiertos ahora',
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
    addBubble('Entiendo tu preocupación, ' + PERSONA.first + '. Dentro de tu red hemos analizado estas 3 opciones donde puedes acudir inmediatamente. Te las ordené de la mejor a la menos recomendada:', 'bot');
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
      else if (/lucia|santa/.test(t)) r = flow.ranked.find((x) => x.p.id === 'santalucia');
      else if (/norte|quito/.test(t)) r = flow.ranked.find((x) => x.p.id === 'quitonorte');
      else if (/\b2\b|segund/.test(t)) r = flow.ranked[1];
      else if (/\b3\b|tercer/.test(t)) r = flow.ranked[2];
    }
    if (!r) { await say('Toca una de las tres opciones de arriba para elegir.', 500); return; }
    flow.busy = true;
    chatBody.querySelectorAll('.opt-card.pick').forEach((c) => { c.classList.remove('pick'); c.disabled = true; if (c.dataset.id === r.p.id) c.classList.add('best'); });
    if (state.lastIntent) { state.lastIntent.picked = r.p.id; }
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

  // ---------------- Procesamiento (red neuronal profunda) ----------------
  const reasoningText = document.getElementById('reasoningText');
  const btnGoCliente = document.getElementById('btnGoCliente');
  const netCanvas = document.getElementById('netCanvas');
  const netCtx = netCanvas.getContext('2d');

  const LAYER_COUNTS = [6, 9, 9, 7, 3];
  let INPUT_LABELS = NET_LABELS.default.in, OUTPUT_LABELS = NET_LABELS.default.out;
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
      settleReasoning(state.risk || fallbackRisk());
      btnGoCliente.disabled = false;
    }
  }
  function settleReasoning(risk) {
    reasoningText.textContent = reasoningFor(state.lastIntent, risk);
    paintDecision(state.lastIntent, risk);
  }
  function playNetwork() {
    if (netAnimId) cancelAnimationFrame(netAnimId);
    const NL = NET_LABELS[state.lastIntent ? state.lastIntent.flow : 'default'];
    INPUT_LABELS = NL.in; OUTPUT_LABELS = NL.out;
    $('decisionCard').hidden = true;
    buildNetLayout();
    btnGoCliente.disabled = true;
    netSettled = false;
    if (!state.lastIntent) {
      netOutcome = null; drawNet(-1);
      reasoningText.textContent = 'Envía un mensaje en el Chat para ver el razonamiento del modelo.';
      return;
    }
    const risk = state.risk || fallbackRisk();
    netOutcome = outcomeFromIntent(state.lastIntent, risk);
    reasoningText.textContent = '';
    if (reduced) {
      netSettled = true;
      const totalDur = (LAYER_COUNTS.length - 1) * LAYER_DELAY + RAMP;
      drawNet(totalDur);
      settleReasoning(risk);
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
    if (netAnimId) cancelAnimationFrame(netAnimId);
    netOutcome = null;
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
    return ['Priorizar la asignación a un ejecutivo de liquidaciones', 'Avisar a la bróker apenas cambie el estado'];
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
