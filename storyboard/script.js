(() => {
  const story = document.getElementById('story');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const dotsWrap = document.getElementById('dots');
  const progressFill = document.getElementById('progressFill');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnToggle = document.getElementById('btnToggle');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let current = 0;
  let playing = !reduced;
  let autoTimer = null;

  // Build dots
  slides.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Ir al paso ' + (i + 1));
    b.addEventListener('click', () => goTo(i, true));
    dotsWrap.appendChild(b);
  });
  const dots = Array.from(dotsWrap.children);

  function setActive(i) {
    current = i;
    slides.forEach((s, idx) => s.classList.toggle('in-view', idx === i));
    dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
    progressFill.style.width = (((i + 1) / slides.length) * 100) + '%';
    animateCounters(slides[i]);
  }

  function goTo(i, user) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    slides[i].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    if (user) restartAuto();
  }

  // Observe which slide is in view (for scroll-driven state + reveal animations)
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.55) {
        const idx = slides.indexOf(entry.target);
        if (idx !== -1) setActive(idx);
      }
    });
  }, { root: story, threshold: [0, 0.55, 1] });
  slides.forEach((s) => io.observe(s));

  // Count-up numbers (slide 10)
  const counted = new WeakSet();
  function animateCounters(slide) {
    const nums = slide.querySelectorAll('.stat-num[data-count]');
    nums.forEach((el) => {
      if (counted.has(el)) return;
      counted.add(el);
      const target = parseFloat(el.dataset.count);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      if (reduced) { el.textContent = prefix + target + suffix; return; }
      const dur = 900;
      const start = performance.now();
      function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(target * eased);
        el.textContent = prefix + val + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  // Autoplay
  function stopAuto() { if (autoTimer) clearInterval(autoTimer); autoTimer = null; }
  function startAuto() {
    stopAuto();
    if (!playing) return;
    autoTimer = setInterval(() => {
      const next = (current + 1) % slides.length;
      goTo(next, false);
    }, 4600);
  }
  function restartAuto() { if (playing) startAuto(); }

  btnPrev.addEventListener('click', () => goTo(current - 1, true));
  btnNext.addEventListener('click', () => goTo(current + 1, true));
  btnToggle.addEventListener('click', () => {
    playing = !playing;
    btnToggle.textContent = playing ? 'Pausar' : 'Reproducir';
    if (playing) startAuto(); else stopAuto();
  });

  // Pause autoplay briefly on manual wheel/touch scroll, resume after idle
  let manualTimeout = null;
  story.addEventListener('wheel', () => {
    stopAuto();
    clearTimeout(manualTimeout);
    manualTimeout = setTimeout(restartAuto, 3000);
  }, { passive: true });
  story.addEventListener('touchmove', () => {
    stopAuto();
    clearTimeout(manualTimeout);
    manualTimeout = setTimeout(restartAuto, 3000);
  }, { passive: true });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1, true); }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goTo(current - 1, true); }
  });

  setActive(0);
  btnToggle.textContent = playing ? 'Pausar' : 'Reproducir';
  startAuto();

  // ---------------- Ambient background particles ----------------
  const bg = document.getElementById('bgCanvas');
  const bgCtx = bg.getContext('2d');
  let bgW, bgH, particles = [];
  function resizeBg() {
    bgW = bg.width = window.innerWidth;
    bgH = bg.height = window.innerHeight;
  }
  function initParticles() {
    particles = Array.from({ length: 46 }, () => ({
      x: Math.random() * bgW, y: Math.random() * bgH,
      vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.6 + 0.6,
    }));
  }
  function drawBg() {
    bgCtx.clearRect(0, 0, bgW, bgH);
    bgCtx.fillStyle = 'rgba(11,99,206,0.35)';
    particles.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = bgW; if (p.x > bgW) p.x = 0;
      if (p.y < 0) p.y = bgH; if (p.y > bgH) p.y = 0;
      bgCtx.beginPath(); bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2); bgCtx.fill();
    });
    bgCtx.strokeStyle = 'rgba(11,99,206,0.12)';
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 120 * 120) {
          bgCtx.globalAlpha = 1 - d2 / (120 * 120);
          bgCtx.beginPath(); bgCtx.moveTo(particles[i].x, particles[i].y); bgCtx.lineTo(particles[j].x, particles[j].y); bgCtx.stroke();
        }
      }
    }
    bgCtx.globalAlpha = 1;
  }
  function bgLoop() { drawBg(); requestAnimationFrame(bgLoop); }
  window.addEventListener('resize', () => { resizeBg(); initParticles(); });
  resizeBg(); initParticles();
  if (!reduced) bgLoop(); else drawBg();
})();
