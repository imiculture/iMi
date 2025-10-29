(function () {
  'use strict';

  // Configuration
  const BASE_PATH = ''; // set to 'images/' if images are in a subfolder
  const IMAGES = [
    '6049f4f2-edb0-46fa-b0b9-e609b78e31a9.JPG',
    '3b75e501-e909-44e5-8f34-c00f59110b69.JPG',
    '905b2066-92d2-4132-ac4a-79fa102e661b.JPG'
  ];
  const INTERVAL = 7000;
  const TRANSITION_MS = 1000;
  const PREFERS_REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // State
  let current = 0;
  let running = !PREFERS_REDUCED;
  let timer = null;

  // Create two background layers for crossfade
  const layerA = document.createElement('div');
  const layerB = document.createElement('div');
  [layerA, layerB].forEach((el, i) => {
    el.className = i === 0 ? 'bg-layer bg-a' : 'bg-layer bg-b';
    Object.assign(el.style, {
      position: 'fixed',
      inset: '0',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      transition: `opacity ${TRANSITION_MS}ms ease`,
      opacity: '0',
      zIndex: '0',
      pointerEvents: 'none'
    });
    document.body.insertBefore(el, document.body.firstChild);
  });
  // Ensure overlay/content remain above (existing CSS uses z-index 1/2)
  layerA.style.zIndex = '0';
  layerB.style.zIndex = '0';
  layerA.style.opacity = '1'; // show first layer initially

  function buildUrl(name) {
    return BASE_PATH + encodeURI(name);
  }

  // Preload images, return array of successfully loaded src strings
  function preloadImages(list) {
    const promises = list.map(name => new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({ ok: true, src: buildUrl(name) });
      img.onerror = () => resolve({ ok: false, src: buildUrl(name) });
      img.src = buildUrl(name);
    }));
    return Promise.all(promises);
  }

  // Safely set background on a layer
  function setLayer(el, src) {
    if (!src) el.style.backgroundImage = 'none';
    else el.style.backgroundImage = `url("${src}")`;
  }

  // Show image index with crossfade
  let visible = 0; // 0 -> layerA visible, 1 -> layerB visible
  function showIndex(i) {
    if (!loaded.length) return;
    i = ((i % loaded.length) + loaded.length) % loaded.length;
    const nextSrc = loaded[i];
    const hidden = visible === 0 ? layerB : layerA;
    const shown = visible === 0 ? layerA : layerB;

    // prepare hidden layer with next image
    setLayer(hidden, nextSrc);

    // Force reflow then crossfade
    requestAnimationFrame(() => {
      hidden.style.opacity = '1';
      shown.style.opacity = '0';
      visible = visible === 0 ? 1 : 0;
    });

    current = i;
  }

  function next() { showIndex(current + 1); }
  function prev() { showIndex(current - 1); }

  function startAuto() {
    stopAuto();
    if (PREFERS_REDUCED) return;
    running = true;
    timer = setInterval(next, INTERVAL);
  }
  function stopAuto() {
    running = false;
    if (timer) { clearInterval(timer); timer = null; }
  }
  function toggleAuto() { if (running) stopAuto(); else startAuto(); }

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { next(); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { prev(); e.preventDefault(); }
    if (e.key === ' ' || e.key === 'Spacebar') { toggleAuto(); e.preventDefault(); }
  });

  // Pause/resume on visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAuto(); else if (!PREFERS_REDUCED) startAuto();
  });

  // --- Particles (optimized) ---
  const canvas = document.getElementById('particles');
  let ctx = null;
  let particles = [];
  let animId = null;
  let dpr = Math.max(1, window.devicePixelRatio || 1);

  if (canvas && canvas.getContext) {
    ctx = canvas.getContext('2d');
  }

  function resizeCanvas() {
    if (!ctx) return;
    dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles(adaptiveCount());
  }

  // Adaptive particle count based on screen area (keep reasonable)
  function adaptiveCount() {
    const area = window.innerWidth * window.innerHeight;
    if (area < 400000) return 40; // small screens
    if (area < 1000000) return 80;
    return 140; // desktops
  }

  class Particle {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.x = Math.random() * window.innerWidth;
      this.y = initial ? Math.random() * window.innerHeight : window.innerHeight + Math.random() * 100;
      this.size = Math.random() * 2 + 0.6;
      this.speed = Math.random() * 0.6 + 0.2;
      this.opacity = Math.random() * 0.6 + 0.2;
      this.color = `rgba(255, ${Math.floor(Math.random() * 120)}, ${Math.floor(Math.random() * 40)}, ${this.opacity})`;
    }
    update() {
      this.y -= this.speed;
      if (this.y < -20) this.reset(false);
    }
    draw(ctx) {
      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function initParticles(num = 120) {
    particles = [];
    const n = Math.max(10, Math.min(300, num));
    for (let i = 0; i < n; i++) particles.push(new Particle());
  }

  function animateParticles() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    for (let p of particles) { p.update(); p.draw(ctx); }
    animId = requestAnimationFrame(animateParticles);
  }

  // Pause particle animation when tab hidden for battery savings
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
    } else {
      if (!animId) animateParticles();
    }
  });

  window.addEventListener('resize', () => {
    // throttle resize to avoid thrashing
    if (this._resizeTO) clearTimeout(this._resizeTO);
    this._resizeTO = setTimeout(resizeCanvas, 120);
  });

  // --- Initialization ---
  let loaded = [];

  (async function init() {
    // Preload images and filter successful loads
    const results = await preloadImages(IMAGES);
    loaded = results.filter(r => r.ok).map(r => r.src);

    if (!loaded.length) {
      // fallback: use first path raw or keep body background color
      console.warn('No images loaded; check paths. Falling back to body background color.');
      document.body.style.background = '#111';
      return;
    }

    // Show first loaded image
    setLayer(layerA, loaded[0]);
    layerA.style.opacity = '1';
    layerB.style.opacity = '0';
    current = 0;

    // Start auto-advance if allowed
    if (!PREFERS_REDUCED) startAuto();

    // Start particles if canvas available
    if (ctx) {
      resizeCanvas();
      animateParticles();
    }
  }());

})();
