(function () {
  "use strict";

  /* ----------------------------- Scenario data ----------------------------- */
  var scenarios = [
    {
      channel: "App móvil (urgente)",
      user: "Tengo una emergencia médica para mi hijo de 12 años. ¿A qué prestador me puedo acercar?",
      bot: "Lamentamos mucho lo sucedido. Te recomendamos el Hospital Vozandes: tiene emergencias pediátricas y está a 8 minutos de tu ubicación.",
      features: ["Emergencia", "Pediatría", "Ubicación", "Vozandes"],
      log: [
        "Mensaje recibido — canal: App móvil (urgente)",
        "Intención detectada: emergencia_pediatrica",
        "Cruzando red de prestadores + geolocalización…",
        "Prestador recomendado: Hospital Vozandes (94% match)",
        "Perfil actualizado — seguimiento activado"
      ],
      affName: "Paola S. · Ced. •••3390",
      chips: [
        { sw: "#33d6ee", html: "<b>Dependiente:</b> hijo, 12 años" },
        { sw: "#f2b33d", html: "<b>Emergencia</b> pediátrica" },
        { sw: "#3b8bff", html: "<b>Prestador:</b> Hospital Vozandes" },
        { sw: "#3fcb82", html: "<b>Respuesta:</b> 8 minutos" }
      ],
      riskLabel: "Urgencia de seguimiento",
      riskVal: 78,
      riskTone: "bad",
      predictions: [
        { label: "Próxima necesidad", prio: "alta", text: "Confirmar el ingreso y enviar la autorización de emergencia en tiempo real." },
        { label: "Prevención", prio: "alta", text: "Programar una llamada de seguimiento post-emergencia en 24 horas." },
        { label: "Oportunidad estratégica", prio: "media", text: "Hospital Vozandes concentra más casos pediátricos este trimestre: evaluar direccionar parte de la demanda a la red alterna para controlar costos." }
      ],
      action: "Enviar autorización de emergencia y notificar al prestador"
    },
    {
      channel: "Canal bróker",
      user: "Ayer presenté un reembolso. ¿En qué estado se encuentra?",
      bot: "Tu reembolso por consulta de dermatología está en revisión del bróker. El pago estimado es en 5 días hábiles.",
      features: ["Reembolso", "Dermatología", "Revisión", "Bróker"],
      log: [
        "Mensaje recibido — canal: Bróker",
        "Intención detectada: estado_reembolso",
        "Buscando trámite en cola de liquidaciones…",
        "Estado actual: en revisión (bróker)",
        "Perfil actualizado — SLA estimado: 5 días hábiles"
      ],
      affName: "Renato Vega · Ced. •••7708",
      chips: [
        { sw: "#3b8bff", html: "<b>Diagnóstico:</b> dermatología" },
        { sw: "#f2b33d", html: "<b>Estado:</b> en revisión" },
        { sw: "#33d6ee", html: "<b>SLA estimado:</b> 5 días" },
        { sw: "#3fcb82", html: "<b>Canal:</b> bróker" }
      ],
      riskLabel: "Riesgo de reclamo por demora",
      riskVal: 24,
      riskTone: "good",
      predictions: [
        { label: "Próxima necesidad", prio: "alta", text: "Notificar automáticamente cuando cambie el estado del trámite." },
        { label: "Prevención", prio: "media", text: "Adelantar la validación de documentos para evitar objeciones." },
        { label: "Oportunidad", prio: "media", text: "Ofrecer reembolso directo a cuenta para reducir el tiempo de pago." }
      ],
      action: "Enviar notificación de estado y tiempo estimado de pago"
    },
    {
      channel: "App móvil",
      user: "Subí mi receta. ¿Estos medicamentos tienen cobertura?",
      bot: "De los 4 medicamentos de tu receta, 3 están cubiertos por tu vademécum. El cuarto no, pero lo encuentras en Fybeca a 5 minutos de ti.",
      features: ["Receta", "Vademécum", "3 de 4", "Fybeca"],
      log: [
        "Mensaje recibido — canal: App móvil",
        "Intención detectada: validacion_receta",
        "Leyendo receta (OCR) + cruzando vademécum…",
        "Cobertura: 3 de 4 medicamentos",
        "Perfil actualizado — alternativa sugerida: Fybeca"
      ],
      affName: "Lucía Ortiz · Ced. •••1189",
      chips: [
        { sw: "#3b8bff", html: "<b>Diagnóstico:</b> hipertensión" },
        { sw: "#33d6ee", html: "<b>Medicamentos:</b> 4 recetados" },
        { sw: "#3fcb82", html: "<b>Cobertura:</b> 3 cubiertos" },
        { sw: "#f2b33d", html: "<b>Farmacia sugerida:</b> Fybeca" }
      ],
      riskLabel: "Riesgo de abandono de tratamiento",
      riskVal: 33,
      riskTone: "warn",
      predictions: [
        { label: "Próxima necesidad", prio: "media", text: "Confirmar el retiro del medicamento no cubierto." },
        { label: "Prevención", prio: "alta", text: "Alertar si el afiliado no confirma la compra en 72 horas." },
        { label: "Alerta de fraude", prio: "alta", text: "El prestador que emitió la receta muestra un patrón de diagnósticos generales en afiliados con preexistencias: evaluar con diagnóstico presuntivo." }
      ],
      action: "Enviar ubicación de farmacia y alternativa cubierta"
    },
    {
      channel: "Portal prestador",
      user: "Hoy me hice atender y tengo un pedido médico de laboratorio. ¿Cómo sigo?",
      bot: "Ingresa tu pedido en la app. Te damos respuesta a tu autorización en un máximo de 72 horas.",
      features: ["Pedido", "Laboratorio", "Autorización", "72h"],
      log: [
        "Mensaje recibido — canal: Portal prestador",
        "Intención detectada: solicitud_autorizacion",
        "Verificando cobertura del pedido…",
        "SLA comprometido: 72 horas",
        "Perfil actualizado — autorización en curso"
      ],
      affName: "Jorge Salazar · Ced. •••6624",
      chips: [
        { sw: "#3b8bff", html: "<b>Pedido:</b> laboratorio" },
        { sw: "#33d6ee", html: "<b>Prestador:</b> Hospital de los Valles" },
        { sw: "#f2b33d", html: "<b>SLA:</b> 72 horas" },
        { sw: "#3fcb82", html: "<b>Estado:</b> en curso" }
      ],
      riskLabel: "Riesgo de vencimiento del SLA",
      riskVal: 18,
      riskTone: "good",
      predictions: [
        { label: "Próxima necesidad", prio: "alta", text: "Enviar un recordatorio 24 horas antes de vencer el SLA." },
        { label: "Costo por caso", prio: "media", text: "El costo promedio de este tipo de pedido subió 12% este trimestre en la red de laboratorio." },
        { label: "Frecuencia de prestadores", prio: "media", text: "Hospital de los Valles concentra el mayor volumen de pedidos de laboratorio del mes." }
      ],
      action: "Confirmar recepción del pedido y activar el cronómetro de 72h"
    }
  ];

  /* ----------------------------- DOM refs ----------------------------- */
  var flow = document.getElementById("flow");
  var conn1 = document.getElementById("conn1");
  var conn2 = document.getElementById("conn2");
  var steps = Array.prototype.slice.call(document.querySelectorAll(".step"));
  var stepLines = Array.prototype.slice.call(document.querySelectorAll(".step-line"));
  var btnToggle = document.getElementById("btnToggle");
  var btnReplay = document.getElementById("btnReplay");
  var scnButtons = Array.prototype.slice.call(document.querySelectorAll(".chip-scn"));
  var userMsgEl = document.getElementById("userMsg");
  var botMsgEl = document.getElementById("botMsg");
  var channelLabel = document.getElementById("channelLabel");
  var affName = document.getElementById("affName");
  var chipsGrid = document.getElementById("chipsGrid");
  var riskLabel = document.getElementById("riskLabel");
  var riskVal = document.getElementById("riskVal");
  var riskFill = document.getElementById("riskFill");
  var predictionsEl = document.getElementById("predictions");
  var actionText = document.getElementById("actionText");
  var terminal = document.getElementById("terminal");
  var latencyEl = document.getElementById("latency");
  var panelChat = document.getElementById("panelChat");
  var panelCore = document.getElementById("panelCore");
  var panelProfile = document.getElementById("panelProfile");

  var toneColor = { good: "var(--success)", warn: "var(--warning)", bad: "var(--danger)" };

  /* ----------------------------- Stage machine ----------------------------- */
  var stages = ["0", "1", "2", "3", "4", "5"];
  var durations = [500, 900, 1000, 1300, 1300, 3600];
  var activeStepFor = { "0": 0, "1": 0, "2": 1, "3": 2, "4": 3, "5": 5 };

  var scnIndex = 0, idx = 0, timer = null, playing = true, autoAdvance = true;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var logTimer = null;

  function updateStepper(stage) {
    var activeIdx = activeStepFor[stage];
    steps.forEach(function (el, i) {
      var n = parseInt(el.getAttribute("data-step"), 10);
      el.classList.remove("done", "active");
      if (stage === "5") { el.classList.add("done"); }
      else if (n < activeIdx) { el.classList.add("done"); }
      else if (n === activeIdx) { el.classList.add("active"); }
      if (stepLines[i]) { stepLines[i].classList.toggle("done", stage === "5" || n < activeIdx); }
    });
  }

  function renderScenario(s) {
    userMsgEl.textContent = s.user;
    botMsgEl.textContent = s.bot;
    channelLabel.textContent = "Canal: " + s.channel;
    affName.textContent = s.affName;

    chipsGrid.innerHTML = s.chips.map(function (c) {
      return '<div class="chip-data"><span class="swatch" style="background:' + c.sw + '"></span><span>' + c.html + "</span></div>";
    }).join("");

    riskLabel.textContent = s.riskLabel;
    riskVal.textContent = s.riskVal + "%";
    riskVal.style.color = toneColor[s.riskTone];
    riskFill.style.width = s.riskVal + "%";
    riskFill.style.background = "linear-gradient(to right, var(--success), " + toneColor[s.riskTone] + ")";

    predictionsEl.innerHTML = s.predictions.map(function (p) {
      return '<div class="pred-card"><div class="pred-top"><span class="pred-label">' + p.label +
        '</span><span class="prio ' + p.prio + '">' + (p.prio === "alta" ? "Alta" : "Media") +
        '</span></div><p class="pred-text">' + p.text + "</p></div>";
    }).join("");

    actionText.textContent = s.action;
  }

  function resetRiskWidth() {
    riskFill.style.width = "0%";
  }

  function clearTerminal() {
    if (logTimer) { clearTimeout(logTimer); logTimer = null; }
    terminal.innerHTML = "";
  }

  function playLog(lines) {
    clearTerminal();
    var i = 0;
    function next() {
      if (i >= lines.length) return;
      var row = document.createElement("div");
      row.className = "log-line";
      var t = new Date();
      var ts = String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0") + ":" + String(t.getSeconds()).padStart(2, "0");
      row.innerHTML = '<span class="t">' + ts + "</span>" + lines[i];
      terminal.appendChild(row);
      while (terminal.children.length > 5) { terminal.removeChild(terminal.firstChild); }
      i++;
      logTimer = setTimeout(next, 420);
    }
    next();
  }

  function updateSpotlight(stage) {
    panelChat.classList.toggle("spotlight", stage === "0" || stage === "1");
    panelCore.classList.toggle("spotlight", stage === "2" || stage === "3");
    panelProfile.classList.toggle("spotlight", stage === "4" || stage === "5");
  }

  function setStage(i) {
    var stage = stages[i];
    flow.setAttribute("data-stage", stage);
    conn1.classList.toggle("active", stage === "2");
    conn2.classList.toggle("active", stage === "4");
    updateStepper(stage);
    updateSpotlight(stage);

    if (stage === "0") { resetRiskWidth(); clearTerminal(); }
    if (stage === "2") { netFire(); playLog(scenarios[scnIndex].log); }
    if (stage === "3") { netFire(); }
    if (stage === "5") { riskFill.style.width = scenarios[scnIndex].riskVal + "%"; }
    if (latencyEl) { latencyEl.textContent = "lat. " + (140 + Math.floor(Math.random() * 90)) + "ms"; }
  }

  function tick() {
    setStage(idx);
    timer = setTimeout(function () {
      idx = idx + 1;
      if (idx >= stages.length) {
        if (autoAdvance) {
          scnIndex = (scnIndex + 1) % scenarios.length;
          setActiveChip(scnIndex);
          renderScenario(scenarios[scnIndex]);
        }
        idx = 0;
      }
      tick();
    }, durations[idx]);
  }

  function stop() { if (timer) { clearTimeout(timer); timer = null; } }
  function start(fromZero) { stop(); if (fromZero) idx = 0; tick(); }

  function setActiveChip(n) {
    scnButtons.forEach(function (b) { b.classList.toggle("active", parseInt(b.getAttribute("data-scn"), 10) === n); });
  }

  btnToggle.addEventListener("click", function () {
    playing = !playing;
    btnToggle.textContent = playing ? "Pausar reproducción automática" : "Reanudar reproducción automática";
    if (playing) { start(false); } else { stop(); }
  });

  btnReplay.addEventListener("click", function () {
    playing = true;
    btnToggle.textContent = "Pausar reproducción automática";
    start(true);
  });

  scnButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      autoAdvance = false;
      scnIndex = parseInt(btn.getAttribute("data-scn"), 10);
      setActiveChip(scnIndex);
      renderScenario(scenarios[scnIndex]);
      playing = true;
      btnToggle.textContent = "Pausar reproducción automática";
      start(true);
    });
  });

  /* ----------------------------- Neural network canvas ----------------------------- */
  var canvas = document.getElementById("netCanvas");
  var ctx = canvas.getContext("2d");
  var netNodes = [];
  var netEdges = [];
  var fireStart = null;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var layerCounts = [4, 6, 5, 3];
  var outputLabels = ["Predicción", "Riesgo", "Acción"];

  function hashRand(a, b) {
    var x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function buildLayout() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var hPad = 40;
    var colX = [hPad, hPad + (w - 2 * hPad) * 0.36, hPad + (w - 2 * hPad) * 0.68, w - hPad];

    netNodes = [];
    layerCounts.forEach(function (count, layer) {
      var topPad = (layer === 0 || layer === 3) ? 26 : 14;
      for (var i = 0; i < count; i++) {
        var y = (h - topPad * 2) * ((i + 0.5) / count) + topPad;
        netNodes.push({ layer: layer, index: i, x: colX[layer], y: y });
      }
    });

    netEdges = [];
    for (var L = 0; L < layerCounts.length - 1; L++) {
      var from = netNodes.filter(function (n) { return n.layer === L; });
      var to = netNodes.filter(function (n) { return n.layer === L + 1; });
      from.forEach(function (a) {
        to.forEach(function (b) {
          netEdges.push({ a: a, b: b, base: 0.05 + hashRand(a.index * 7 + a.layer, b.index * 3 + b.layer) * 0.08 });
        });
      });
    }
  }

  function netFire() { fireStart = performance.now(); }

  function nodeProgress(node, t) {
    if (fireStart === null) return 0;
    var elapsed = t - fireStart;
    var delay = node.layer * 300 + node.index * 22;
    var p = (elapsed - delay) / 380;
    if (p < 0) return 0;
    if (p > 1) return 1;
    return p;
  }

  function drawNet(t) {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    var accent = "rgba(11,99,206,1)";
    var accent2 = "rgba(31,186,214,1)";

    // ambient idle pulse
    var idle = 0.5 + 0.5 * Math.sin(t * 0.0016);

    // edges
    netEdges.forEach(function (e) {
      var pa = nodeProgress(e.a, t);
      var pb = nodeProgress(e.b, t);
      var activeGlow = Math.max(pa * (1 - pb), pa > 0 && pb > 0 ? 0.5 : 0) ;
      var alpha = e.base * (0.5 + idle * 0.5) + activeGlow * 0.7;
      ctx.strokeStyle = "rgba(11,99,206," + Math.min(alpha, 0.65).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.stroke();
    });

    // nodes
    netNodes.forEach(function (n) {
      var p = nodeProgress(n, t);
      var baseR = n.layer === 0 || n.layer === 3 ? 5 : 3.6;
      var idlePulse = Math.sin(t * 0.0022 + n.layer * 1.3 + n.index * 0.7) * 0.5 + 0.5;
      var r = baseR + p * 2.4 + idlePulse * 0.6;
      var glow = 0.35 + idlePulse * 0.25 + p * 0.6;

      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 5, 0, Math.PI * 2);
      var grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r + 5);
      grad.addColorStop(0, "rgba(31,186,214," + Math.min(glow, 0.55).toFixed(3) + ")");
      grad.addColorStop(1, "rgba(31,186,214,0)");
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = (n.layer === 0 || n.layer === 3) ? accent2 : accent;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // traveling sparks — data moving from a node to the next layer, right after it fires
    if (fireStart !== null) {
      netEdges.forEach(function (e) {
        var pa = nodeProgress(e.a, t);
        if (pa < 1) return;
        var elapsed = t - fireStart;
        var delayA = e.a.layer * 300 + e.a.index * 22;
        var travelT = elapsed - (delayA + 380);
        var travelDur = 260;
        if (travelT < 0 || travelT > travelDur) return;
        var frac = travelT / travelDur;
        var x = e.a.x + (e.b.x - e.a.x) * frac;
        var y = e.a.y + (e.b.y - e.a.y) * frac;
        var sparkAlpha = Math.sin(frac * Math.PI);
        ctx.beginPath();
        ctx.arc(x, y, 1.9, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(31,186,214," + (0.9 * sparkAlpha).toFixed(3) + ")";
        ctx.shadowColor = "rgba(31,186,214,0.95)";
        ctx.shadowBlur = 7;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    // labels for input/output layers — centered above each node, clamped inside the canvas
    ctx.font = "9px 'Space Mono', monospace";
    ctx.fillStyle = "rgba(79,107,133,0.9)";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";

    function clampedX(x, text) {
      var half = ctx.measureText(text).width / 2;
      return Math.min(Math.max(x, half + 2), w - half - 2);
    }

    var inputLabels = scenarios[scnIndex].features;
    netNodes.filter(function (n) { return n.layer === 0; }).forEach(function (n, i) {
      var text = inputLabels[i] || "";
      ctx.fillText(text, clampedX(n.x, text), n.y - 11);
    });
    netNodes.filter(function (n) { return n.layer === 3; }).forEach(function (n, i) {
      var text = outputLabels[i] || "";
      ctx.fillText(text, clampedX(n.x, text), n.y - 11);
    });
  }

  function loop(t) {
    drawNet(t);
    requestAnimationFrame(loop);
  }

  function resizeCanvas() { buildLayout(); }
  window.addEventListener("resize", resizeCanvas);

  /* ----------------------------- Boot ----------------------------- */
  renderScenario(scenarios[0]);
  buildLayout();
  if (!reduced) {
    requestAnimationFrame(loop);
  } else {
    drawNet(0);
  }

  if (!reduced) {
    setTimeout(function () { start(true); }, 900);
  } else {
    setStage(5);
  }

  /* ----------------------------- Ambient background particles ----------------------------- */
  var bgCanvas = document.getElementById("bgCanvas");
  if (bgCanvas) {
    var bgCtx = bgCanvas.getContext("2d");
    var bgDpr = Math.min(window.devicePixelRatio || 1, 2);
    var bgParticles = [];

    function resizeBg() {
      bgCanvas.width = window.innerWidth * bgDpr;
      bgCanvas.height = window.innerHeight * bgDpr;
      bgCtx.setTransform(bgDpr, 0, 0, bgDpr, 0, 0);
    }

    function initBgParticles() {
      var count = Math.min(55, Math.floor((window.innerWidth * window.innerHeight) / 26000));
      bgParticles = [];
      for (var i = 0; i < count; i++) {
        bgParticles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          r: 1 + Math.random() * 1.4
        });
      }
    }

    function drawBg() {
      var w = window.innerWidth, h = window.innerHeight;
      bgCtx.clearRect(0, 0, w, h);
      bgParticles.forEach(function (p) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      });
      for (var i = 0; i < bgParticles.length; i++) {
        for (var j = i + 1; j < bgParticles.length; j++) {
          var a = bgParticles[i], b = bgParticles[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 16900) {
            var alpha = (1 - Math.sqrt(d2) / 130) * 0.10;
            bgCtx.strokeStyle = "rgba(11,99,206," + alpha.toFixed(3) + ")";
            bgCtx.lineWidth = 1;
            bgCtx.beginPath(); bgCtx.moveTo(a.x, a.y); bgCtx.lineTo(b.x, b.y); bgCtx.stroke();
          }
        }
      }
      bgParticles.forEach(function (p) {
        bgCtx.beginPath();
        bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        bgCtx.fillStyle = "rgba(31,186,214,0.32)";
        bgCtx.fill();
      });
    }

    function bgLoop() { drawBg(); requestAnimationFrame(bgLoop); }

    resizeBg();
    initBgParticles();
    if (!reduced) { requestAnimationFrame(bgLoop); } else { drawBg(); }
    window.addEventListener("resize", function () { resizeBg(); initBgParticles(); });
  }
})();
