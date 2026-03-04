/* ═══════════════════════════════════════════════════════════
   SUJAL — YOS™  |  trucks.js  v4  (Scroll Parallax Edition)
   ─────────────────────────────────────────────────────────
   Hero layers:
     #hero-sky   – amber sky/dusk gradient drawn on canvas
     #hero-truck-layer – SVG semi-truck, moved by scroll (translateX)
     #hero-wire  – 3D wireframe trucks + stars, fades in on scroll

   Benefit cards: top-down AI tracking view (7 lanes, numbered 8–14)
   Mosaic cells:  aerial / dashboard / YOS glow / dock animations
   Testimonial:   night warehouse scene
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── utils ── */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

  /* perspective project for 3-D wireframes */
  function rotXY(x, y, z, rx, ry) {
    const y1 = y * Math.cos(rx) - z * Math.sin(rx);
    const z1 = y * Math.sin(rx) + z * Math.cos(rx);
    const x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
    const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
    return [x2, y1, z2];
  }
  function proj(x, y, z, cx, cy, fov) {
    const s = fov / (fov + z);
    return { x: cx + x * s, y: cy + y * s, s };
  }

  /* ═══════════════════════════════════════════════════════════
     1.  DEEP CINEMATIC SCROLL & PARALLAX (LERP)
         Creates buttery-smooth interpolated scrolling effects.
         Hero video pushes up/scales slightly.
         Hero text scales down and fades out faster.
         Wireframe canvas fades in smoothly.
  ═══════════════════════════════════════════════════════ */
  let targetY = window.scrollY;
  let currentY = window.scrollY;

  const wireCanvas = document.getElementById('hero-wire');
  const heroEl = document.getElementById('hero');
  const heroContent = document.querySelector('.hero-content');
  const heroVideo = document.getElementById('hero-video');

  const reveals = document.querySelectorAll('.reveal');
  const canvases = document.querySelectorAll('.m-canvas, .b-card-canvas, .test-img-canvas');

  window.addEventListener('scroll', () => {
    targetY = window.scrollY;
  }, { passive: true });

  function scrollLoop() {
    /* smooth interpolation equation */
    currentY = lerp(currentY, targetY, 0.08);

    /* 1. HERO PARALLAX */
    if (heroEl) {
      const heroH = heroEl.offsetHeight || window.innerHeight;
      const progress = clamp(currentY / heroH, 0, 1);

      if (heroVideo) {
        const vy = currentY * 0.45;
        const vScale = 1 + (progress * 0.08);
        heroVideo.style.transform = `translateY(${vy}px) scale(${vScale})`;
      }

      if (heroContent) {
        const cy = currentY * -0.3;
        const cScale = 1 - (progress * 0.15);
        const copacity = clamp(1 - (progress * 1.8), 0, 1);
        heroContent.style.transform = `translateY(${cy}px) scale(${cScale})`;
        heroContent.style.opacity = String(copacity);
      }

      if (wireCanvas) {
        const wp = clamp((progress - 0.15) / 0.55, 0, 1);
        wireCanvas.style.opacity = String(ease(wp));
      }
    }

    /* 2. DEEP SCROLL REVEALS (Text & Elements) 
          Mapped to exact viewport percentage = true cinematic scrub */
    const wh = window.innerHeight;

    reveals.forEach(el => {
      const rect = el.getBoundingClientRect();
      const topDist = rect.top;
      /* Element starts revealing when it enters the bottom of the screen (topDist = wh) 
         and is fully revealed when it reaches 75% down the screen (topDist = wh * 0.75) */
      const rawP = 1 - ((topDist - (wh * 0.75)) / (wh * 0.25));
      const p = clamp(rawP, 0, 1);
      const eased = ease(p);

      const ty = (1 - eased) * 40; /* floats up 40px */
      el.style.transform = `translateY(${ty}px)`;
      el.style.opacity = String(eased);
    });

    /* 3. CANVAS PARALLAX (Subtle depth on all graphics)
          Moves canvases slightly against scroll direction */
    canvases.forEach(cvs => {
      const rect = cvs.getBoundingClientRect();
      const centerD = rect.top + (rect.height / 2) - (wh / 2);
      const prlxY = centerD * 0.15; /* 15% parallax speed */
      cvs.style.transform = `translateY(${prlxY}px)`;
    });

    requestAnimationFrame(scrollLoop);
  }
  scrollLoop();


  /* ═══════════════════════════════════════════════════════════
     3.  WIREFRAME CANVAS  — 3-D cage trucks + starfield
  ═══════════════════════════════════════════════════════ */
  if (wireCanvas) {
    function resizeWire() {
      wireCanvas.width = wireCanvas.offsetWidth || window.innerWidth;
      wireCanvas.height = wireCanvas.offsetHeight || window.innerHeight;
    }
    resizeWire();
    window.addEventListener('resize', resizeWire, { passive: true });

    const wctx = wireCanvas.getContext('2d');
    let wT = 0;

    /* Stars */
    const STARS = 300;
    const sx = new Float32Array(STARS), sy = new Float32Array(STARS);
    const sr = new Float32Array(STARS), sa = new Float32Array(STARS);
    for (let i = 0; i < STARS; i++) {
      sx[i] = Math.random(); sy[i] = Math.random();
      sr[i] = Math.random() * 1.4 + 0.3;
      sa[i] = Math.random() * 0.45 + 0.06;
    }

    /* Dot cloud (atmospheric particles around trucks) */
    const DOTS = 160;
    const dx = new Float32Array(DOTS), dy = new Float32Array(DOTS), dz = new Float32Array(DOTS);
    const da = new Float32Array(DOTS), dr = new Float32Array(DOTS);
    for (let i = 0; i < DOTS; i++) {
      dx[i] = (Math.random() - 0.5) * 3.6; dy[i] = (Math.random() - 0.5) * 2.2; dz[i] = (Math.random() - 0.5) * 3.6;
      da[i] = Math.random() * 0.32 + 0.04; dr[i] = Math.random() * 1.5 + 0.3;
    }

    /* Truck 3-D mesh (normalised coords) */
    /* Trailer box [-3,0]×[-1,1]×[-1,1] + cab [0,1]×[-0.8,1.1]×[-0.85,0.85] */
    const TL = [[-3, -1, -1], [-3, 1, -1], [-3, 1, 1], [-3, -1, 1], [0, -1, -1], [0, 1, -1], [0, 1, 1], [0, -1, 1]];
    const CB = [[0, -0.8, -0.85], [0, 1.1, -0.85], [0, 1.1, 0.85], [0, -0.8, 0.85], [1, -0.8, -0.85], [1, 1.1, -0.85], [1, 1.1, 0.85], [1, -0.8, 0.85]];
    const BOX_E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    /* internal ribs */
    const RIBS = [];
    for (let rx = -2.4; rx < 0; rx += 0.65) {
      RIBS.push([[rx, -1, -1], [rx, 1, -1]], [[rx, -1, 1], [rx, 1, 1]], [[rx, -1, -1], [rx, -1, 1]]);
    }
    /* windshield diagonals */
    const WS = [[[0.7, 1.1, -0.85], [1, 0.55, -0.75]], [[0.7, 1.1, 0.85], [1, 0.55, 0.75]], [[0.7, 1.1, -0.85], [0.7, 1.1, 0.85]], [[1, 0.55, -0.75], [1, 0.55, 0.75]]];
    /* axle circles (8-gon) */
    function axleCircle(ax, sz) {
      const pts = [];
      for (let a = 0; a < 8; a++) pts.push([ax, -1 + Math.cos(a / 8 * Math.PI * 2) * 0.42, sz * 0.88 + Math.sin(a / 8 * Math.PI * 2) * 0.14]);
      return pts.map((p, i, arr) => [p, arr[(i + 1) % 8]]);
    }
    const WHEELS = [-2.4, -0.35, 0.75].flatMap(ax => [-1, 1].flatMap(sz => axleCircle(ax, sz)));

    /* 3 truck instances */
    const TRUCKS = [
      { ox: 0, oy: 0.04, oz: 0, rx: 0.04, ry: 0.55, scale: 145, alpha: 0.78, vry: 0.0006 },
      { ox: -0.5, oy: -0.22, oz: 1.8, rx: 0.06, ry: 0.28, scale: 82, alpha: 0.48, vry: 0.0004 },
      { ox: 0.6, oy: -0.19, oz: 0.8, rx: 0.03, ry: 0.82, scale: 68, alpha: 0.36, vry: 0.0003 },
    ];

    function drawTruck3D(ctx, truck, W, H) {
      const { ox, oy, oz, rx, ry, scale, alpha } = truck;
      const cx = W * (0.5 + ox * 0.25), cy = H * (0.44 + oy * 0.24);
      const FOV = 330;

      function p3(vx, vy, vz) {
        const [a, b, c] = rotXY(vx * scale, vy * scale, vz * scale + oz * scale, rx, ry);
        return proj(a, b, c, cx, cy, FOV);
      }
      function line3(v0, v1, col, lw) {
        const p0 = p3(...v0), p1 = p3(...v1);
        ctx.strokeStyle = col; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
      }

      ctx.save(); ctx.globalAlpha = alpha;

      /* trailer edges – blue */
      BOX_E.forEach(([a, b]) => line3(TL[a], TL[b], 'rgba(74,158,255,0.58)', 0.7));
      /* ribs */
      RIBS.forEach(([v0, v1]) => line3(v0, v1, 'rgba(74,158,255,0.14)', 0.4));
      /* cab edges – brighter blue-white */
      BOX_E.forEach(([a, b]) => line3(CB[a], CB[b], 'rgba(165,215,255,0.68)', 0.8));
      /* windshield */
      WS.forEach(([v0, v1]) => line3(v0, v1, 'rgba(140,200,255,0.52)', 0.55));
      /* wheels */
      WHEELS.forEach(([v0, v1]) => line3(v0, v1, 'rgba(74,158,255,0.42)', 0.5));
      /* vertex glow dots */
      [...TL, ...CB].forEach(v => { const pp = p3(...v); ctx.fillStyle = 'rgba(120,195,255,0.72)'; ctx.beginPath(); ctx.arc(pp.x, pp.y, 1.3, 0, Math.PI * 2); ctx.fill(); });

      ctx.restore();
    }

    function wireLoop() {
      const W = wireCanvas.width, H = wireCanvas.height;
      wctx.clearRect(0, 0, W, H);
      wT += 0.012;

      /* stars */
      for (let i = 0; i < STARS; i++) {
        const fl = 0.55 + 0.45 * Math.sin(wT * 1.4 + sx[i] * 12);
        wctx.fillStyle = `rgba(255,255,255,${sa[i] * fl})`;
        wctx.beginPath(); wctx.arc(sx[i] * W, sy[i] * H, sr[i], 0, Math.PI * 2); wctx.fill();
      }

      /* dot cloud */
      for (let i = 0; i < DOTS; i++) {
        const [rx2, ry2, rz2] = rotXY(dx[i] * 115, dy[i] * 85, dz[i] * 85, 0.05, wT * 0.038);
        const pp = proj(rx2, ry2, rz2, W * 0.5, H * 0.42, 330);
        if (pp.s <= 0) continue;
        const fl = 0.4 + 0.6 * Math.sin(wT * 1.2 + dx[i] * 5);
        wctx.fillStyle = `rgba(74,158,255,${da[i] * fl})`;
        wctx.beginPath(); wctx.arc(pp.x, pp.y, dr[i] * pp.s, 0, Math.PI * 2); wctx.fill();
      }

      /* horizontal AI scan line */
      const scanX = ((wT * 0.14) % 1) * W;
      wctx.strokeStyle = 'rgba(74,158,255,0.18)'; wctx.lineWidth = 1.5;
      wctx.setLineDash([5, 10]);
      wctx.beginPath(); wctx.moveTo(scanX, 0); wctx.lineTo(scanX, H * 0.88); wctx.stroke();
      wctx.setLineDash([]);

      /* rotate + draw trucks */
      TRUCKS.forEach(tr => {
        tr.ry += tr.vry;
        drawTruck3D(wctx, tr, W, H);
      });

      requestAnimationFrame(wireLoop);
    }
    wireLoop();
  }

  /* ═══════════════════════════════════════════════════════
     4.  BENEFIT CARD CANVASES
         Top-down AI yard tracking (7 lanes, 8–14)
  ═══════════════════════════════════════════════════════ */
  function drawTopTruck(ctx, cx, cy, len, wid, color, alpha, bbox, label) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.strokeStyle = color; ctx.lineWidth = 1.1;
    ctx.strokeRect(cx - len * 0.6, cy - wid / 2, len * 0.78, wid);
    /* cargo grid */
    ctx.strokeStyle = color.replace(/[\d.]+\)$/, '0.15)'); ctx.lineWidth = 0.4;
    for (let i = 1; i < 5; i++) { const gx = cx - len * 0.6 + len * 0.78 * i / 5; ctx.beginPath(); ctx.moveTo(gx, cy - wid / 2); ctx.lineTo(gx, cy + wid / 2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(cx - len * 0.6, cy); ctx.lineTo(cx - len * 0.6 + len * 0.78, cy); ctx.stroke();
    /* cab */
    ctx.strokeStyle = color; ctx.lineWidth = 1.1;
    ctx.strokeRect(cx - len * 0.6 + len * 0.78, cy - wid * 0.4, len * 0.2, wid * 0.8);
    /* wheels */
    ctx.fillStyle = color.replace(/[\d.]+\)$/, '0.5)');
    [[-0.5, -0.52], [-0.3, -0.52], [-0.1, -0.47], [-0.5, 0.52], [-0.3, 0.52], [-0.1, 0.47]].forEach(([wx, wy]) => {
      ctx.fillRect(cx + wx * len - 3, wy > 0 ? cy + wy * wid - 4 : cy + wy * wid, 6, 4);
    });
    /* bounding box */
    if (bbox) {
      const pad = len * 0.12;
      ctx.strokeStyle = color; ctx.lineWidth = 1.3; ctx.setLineDash([5, 4]);
      ctx.strokeRect(cx - len * 0.6 - pad, cy - wid / 2 - pad, len + pad * 2, wid + pad * 2);
      ctx.setLineDash([]);
      /* corner brackets */
      const bk = len * 0.07;
      [[cx - len * 0.6 - pad, cy - wid / 2 - pad, 1, 1], [cx + len * 0.4 + pad, cy - wid / 2 - pad, -1, 1],
      [cx - len * 0.6 - pad, cy + wid / 2 + pad, 1, -1], [cx + len * 0.4 + pad, cy + wid / 2 + pad, -1, -1]].forEach(([bx, by, sx, sy]) => {
        ctx.lineWidth = 2; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(bx + sx * bk, by); ctx.lineTo(bx, by); ctx.lineTo(bx, by + sy * bk); ctx.stroke();
      });
    }
    if (label) { ctx.fillStyle = color; ctx.font = '9px "DM Mono", monospace'; ctx.globalAlpha = alpha * 0.85; ctx.fillText(label, cx - len * 0.6, cy - wid * 0.6 - 4); }
    ctx.restore();
  }

  function drawBeam(ctx, x, H, alpha) {
    const g = ctx.createLinearGradient(x, 0, x, H);
    g.addColorStop(0, 'rgba(0,255,136,0)'); g.addColorStop(0.35, `rgba(0,255,136,${alpha * 0.5})`);
    g.addColorStop(0.55, `rgba(0,255,136,${alpha})`); g.addColorStop(0.75, `rgba(0,255,136,${alpha * 0.5})`);
    g.addColorStop(1, 'rgba(0,255,136,0)');
    ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); ctx.restore();
  }

  document.querySelectorAll('.b-card-canvas').forEach(canvas => {
    const scene = canvas.dataset.scene;
    function rsz() { canvas.width = canvas.offsetWidth || 400; canvas.height = canvas.offsetHeight || 600; }
    rsz(); window.addEventListener('resize', rsz, { passive: true });
    const ctx = canvas.getContext('2d');
    let ct = Math.random() * 60;

    const CST = new Float32Array(80 * 4);
    for (let i = 0; i < 80; i++) { CST[i * 4] = Math.random(); CST[i * 4 + 1] = Math.random(); CST[i * 4 + 2] = Math.random() * 0.9 + 0.2; CST[i * 4 + 3] = Math.random() * 0.3 + 0.04; }

    const LANES = 7;
    const lTrucks = Array.from({ length: LANES }, (_, i) => ({
      progress: Math.random(), speed: 0.0006 + Math.random() * 0.0005, present: Math.random() > 0.3,
      label: ['AMERICAN FREIGHT', 'RYDER TRANSPORT', 'FEDEX SUPPLY'][i % 3],
    }));
    let active = 1, beamP = 0;

    function loop() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H); ct += 0.012;
      ctx.fillStyle = '#050810'; ctx.fillRect(0, 0, W, H);
      /* stars */
      for (let i = 0; i < 80; i++) { const fl = 0.55 + 0.45 * Math.sin(ct * 1.3 + CST[i * 4] * 10); ctx.fillStyle = `rgba(255,255,255,${CST[i * 4 + 3] * fl})`; ctx.beginPath(); ctx.arc(CST[i * 4] * W, CST[i * 4 + 1] * H, CST[i * 4 + 2], 0, Math.PI * 2); ctx.fill(); }
      const lW = W / LANES;
      /* lane dividers */
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 0.5;
      for (let i = 1; i < LANES; i++) { ctx.beginPath(); ctx.moveTo(lW * i, 0); ctx.lineTo(lW * i, H); ctx.stroke(); }
      [0.28, 0.72].forEach(ly => { ctx.beginPath(); ctx.moveTo(0, H * ly); ctx.lineTo(W, H * ly); ctx.stroke(); });
      /* lane numbers */
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.font = '11px "DM Mono", monospace';
      for (let i = 0; i < LANES; i++) ctx.fillText(String(8 + i), lW * i + lW * 0.36, H * 0.22);
      /* gate line */
      if (scene === 'gate-overhead') { ctx.strokeStyle = 'rgba(232,92,26,0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(0, H * 0.42); ctx.lineTo(W, H * 0.42); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = 'rgba(232,92,26,0.6)'; ctx.font = '8px "DM Mono",monospace'; ctx.fillText('GATE LINE', W * 0.03, H * 0.40); }
      /* beam */
      beamP += 0.006; if (beamP > 1) { beamP = 0; active = (active + 1) % LANES; }
      drawBeam(ctx, lW * active + lW * 0.5, H, (Math.sin(ct * 1.5) + 1) / 2 * 0.9);
      /* trucks */
      lTrucks.forEach((tk, i) => {
        if (!tk.present) { if (Math.random() < 0.001) tk.present = true; return; }
        tk.progress += tk.speed; if (tk.progress > 1.1) { tk.progress = -0.1; tk.present = Math.random() > 0.2; }
        const tcx = lW * i + lW * 0.5, tcy = tk.progress * (H * 0.82) + H * 0.09;
        const tLen = lW * 0.88, tWid = lW * 0.36, isOn = i === active;
        drawTopTruck(ctx, tcx, tcy, tLen, tWid, isOn ? 'rgba(0,255,136,0.88)' : 'rgba(74,158,255,0.52)', isOn ? 1 : 0.62, isOn, null);
        if (isOn && tk.label) { ctx.fillStyle = 'rgba(0,255,136,0.8)'; ctx.font = '7.5px "DM Mono",monospace'; const rx = tcx + lW * 0.58, ry = tcy - tLen * 0.08; ctx.fillText(tk.label, rx, ry); ctx.fillText(scene === 'gate-overhead' ? 'CHECK IN ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TRACKED', rx, ry + 11); }
      });
      /* HUD corners */
      ctx.strokeStyle = 'rgba(74,158,255,0.28)'; ctx.lineWidth = 1.2; const c = 16;
      [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]].forEach(([hx, hy, sx2, sy]) => { ctx.beginPath(); ctx.moveTo(hx + sx2 * c, hy); ctx.lineTo(hx, hy); ctx.lineTo(hx, hy + sy * c); ctx.stroke(); });
      requestAnimationFrame(loop);
    }
    loop();
  });

  /* ═══════════════════════════════════════════════════════
     5.  MOSAIC CELL ANIMATIONS
  ═══════════════════════════════════════════════════════ */
  document.querySelectorAll('.m-canvas').forEach(canvas => {
    const anim = canvas.dataset.anim;
    function rsz() { canvas.width = canvas.offsetWidth || 300; canvas.height = canvas.offsetHeight || 280; }
    rsz(); window.addEventListener('resize', rsz, { passive: true });
    const ctx = canvas.getContext('2d'); let mt = Math.random() * 60;
    const MS = new Float32Array(50 * 4);
    for (let i = 0; i < 50; i++) { MS[i * 4] = Math.random(); MS[i * 4 + 1] = Math.random(); MS[i * 4 + 2] = Math.random() * 0.8 + 0.2; MS[i * 4 + 3] = Math.random() * 0.28 + 0.04; }
    function loop() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H); mt += 0.012;
      ctx.fillStyle = '#06090f'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 50; i++) { const fl = 0.5 + 0.5 * Math.sin(mt * 1.4 + MS[i * 4] * 8); ctx.fillStyle = `rgba(255,255,255,${MS[i * 4 + 3] * fl})`; ctx.beginPath(); ctx.arc(MS[i * 4] * W, MS[i * 4 + 1] * H, MS[i * 4 + 2], 0, Math.PI * 2); ctx.fill(); }

      if (anim === 'gate-aerial' || anim === 'agentic') {
        const lanes = 5, lW = W / lanes;
        ctx.strokeStyle = 'rgba(74,158,255,0.07)'; ctx.lineWidth = 0.5;
        for (let i = 1; i < lanes; i++) { ctx.beginPath(); ctx.moveTo(lW * i, 0); ctx.lineTo(lW * i, H); ctx.stroke(); }
        [0.3, 0.6].forEach(ly => { ctx.beginPath(); ctx.moveTo(0, H * ly); ctx.lineTo(W, H * ly); ctx.stroke(); });
        [0.22, 0.65].forEach((lf, i) => { const tcy = ((mt * 0.035 + i * 0.55) % 1.2 - 0.1) * H; drawTopTruck(ctx, lf * W, tcy, W * 0.18, W * 0.08, 'rgba(74,158,255,0.7)', 0.75, i === 0, null); });
        drawBeam(ctx, (Math.sin(mt * 0.5) + 1) / 2 * W, H, 0.55);
        if (anim === 'gate-aerial') { ctx.strokeStyle = 'rgba(232,92,26,0.38)'; ctx.lineWidth = 1; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(0, H * 0.42); ctx.lineTo(W, H * 0.42); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = 'rgba(232,92,26,0.65)'; ctx.font = '8px "DM Mono",monospace'; ctx.fillText('GATE IN', W * 0.04, H * 0.4); }
      }
      if (anim === 'smartyard') {
        ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(0, 0, W, H * 0.1); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.font = '8px "DM Mono",monospace'; ctx.fillText('SmartYard™ YMS  ·  LIVE', W * 0.04, H * 0.065);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 0.5;
        for (let g = 0; g < 8; g++) { ctx.beginPath(); ctx.moveTo(W * g / 7, H * 0.1); ctx.lineTo(W * g / 7, H * 0.68); ctx.stroke(); }
        for (let g = 0; g < 4; g++) { const gy = H * 0.1 + g * (H * 0.58 / 3); ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
        [{ x: 0.15, y: 0.28, c: '0,255,136' }, { x: 0.42, y: 0.38, c: '0,255,136' }, { x: 0.65, y: 0.22, c: '74,158,255' }, { x: 0.78, y: 0.45, c: '232,92,26' }, { x: 0.30, y: 0.52, c: '74,158,255' }].forEach(a => {
          const pulse = (Math.sin(mt * 1.5 + a.x * 10) + 1) / 2; ctx.fillStyle = `rgba(${a.c},0.85)`; ctx.beginPath(); ctx.arc(a.x * W, a.y * H, 3, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = `rgba(${a.c},${0.25 * pulse})`; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(a.x * W, a.y * H, 3 + 5 * pulse, 0, Math.PI * 2); ctx.stroke();
        });
        ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(0, H * 0.7, W, H * 0.3);
        ['GATE IN  #09  YK4-829', 'DOCK 11  ASSIGNED  ▶', '⚠ DWELL >4H  LANE 7'].forEach((row, i) => { ctx.fillStyle = i === 2 ? 'rgba(232,92,26,0.75)' : 'rgba(255,255,255,0.32)'; ctx.font = '7px "DM Mono",monospace'; ctx.fillText(row, W * 0.04, H * 0.75 + i * H * 0.08); });
      }
      if (anim === 'what-yos') {
        const glow = (Math.sin(mt * 0.7) + 1) / 2;
        const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.65); bg.addColorStop(0, `rgba(74,158,255,${0.1 * glow})`); bg.addColorStop(1, 'rgba(74,158,255,0)'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        ctx.shadowColor = `rgba(74,158,255,${0.7 * glow})`; ctx.shadowBlur = 24; ctx.fillStyle = `rgba(255,255,255,${0.65 + 0.35 * glow})`; ctx.textAlign = 'center'; ctx.font = `700 ${Math.min(W * 0.2, 48)}px "DM Sans",sans-serif`; ctx.fillText('YOS™', W / 2, H / 2 + 6); ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = `300 ${Math.min(W * 0.065, 13)}px "DM Mono",monospace`; ctx.fillText('YARD OPERATING SYSTEM', W / 2, H / 2 + 28); ctx.textAlign = 'left';
      }
      if (anim === 'dock-ai') {
        for (let i = 0; i < 5; i++) { const bx = W * (0.04 + i * 0.19); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 0.6; ctx.strokeRect(bx, H * 0.14, W * 0.16, H * 0.5); for (let s = 1; s < 7; s++) { ctx.beginPath(); ctx.moveTo(bx, H * 0.14 + s * (H * 0.5 / 7)); ctx.lineTo(bx + W * 0.16, H * 0.14 + s * (H * 0.5 / 7)); ctx.stroke(); } ctx.fillStyle = i % 2 === 0 ? 'rgba(0,255,136,0.85)' : 'rgba(255,255,255,0.2)'; ctx.fillRect(bx + W * 0.05, H * 0.11, 8, 4); }
        const ty = ((mt * 0.032) % 1.4 - 0.2) * H; drawTopTruck(ctx, W * 0.31, ty, W * 0.2, W * 0.1, 'rgba(0,255,136,0.88)', 0.9, true, null);
        ctx.fillStyle = 'rgba(0,255,136,0.65)'; ctx.font = '8px "DM Mono",monospace'; ctx.fillText('GATE IN · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), W * 0.04, H * 0.9);
      }
      requestAnimationFrame(loop);
    }
    loop();
  });

  /* ═══════════════════════════════════════════════════════
     6.  TESTIMONIAL — night warehouse & parked truck
  ═══════════════════════════════════════════════════════ */
  document.querySelectorAll('.test-img-canvas').forEach(canvas => {
    function rsz() { canvas.width = canvas.offsetWidth || 500; canvas.height = canvas.offsetHeight || 380; }
    rsz(); window.addEventListener('resize', rsz, { passive: true });
    const ctx = canvas.getContext('2d'); let tt = 0;
    const TS = new Float32Array(80 * 4); for (let i = 0; i < 80; i++) { TS[i * 4] = Math.random(); TS[i * 4 + 1] = Math.random() * 0.55; TS[i * 4 + 2] = Math.random() * 0.8 + 0.2; TS[i * 4 + 3] = Math.random() * 0.28 + 0.05; }
    function loop() {
      const W = canvas.width, H = canvas.height; ctx.clearRect(0, 0, W, H); tt += 0.01;
      ctx.fillStyle = '#060809'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 80; i++) { const fl = 0.55 + 0.45 * Math.sin(tt + TS[i * 4] * 7); ctx.fillStyle = `rgba(255,255,255,${TS[i * 4 + 3] * fl})`; ctx.beginPath(); ctx.arc(TS[i * 4] * W, TS[i * 4 + 1] * H, TS[i * 4 + 2], 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(16,13,8,0.95)'; ctx.fillRect(0, H * 0.36, W, H * 0.64);
      for (let i = 0; i < 6; i++) { const wx = W * (0.05 + i * 0.16); ctx.fillStyle = Math.sin(tt * 0.35 + i) > 0 ? 'rgba(220,140,40,0.32)' : 'rgba(35,28,18,0.8)'; ctx.fillRect(wx, H * 0.4, W * 0.1, H * 0.12); }
      drawTopTruck(ctx, W * 0.35, H * 0.74, W * 0.35, W * 0.1, 'rgba(74,158,255,0.55)', 0.7, false, null);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5;
      for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(W * i / 5, H * 0.58); ctx.lineTo(W * i / 5, H); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(0, H * 0.68); ctx.lineTo(W, H * 0.68); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.font = '8px "DM Mono",monospace'; ctx.fillText('RYDER DISTRIBUTION CENTER · 3AM', W * 0.04, H * 0.95);
      requestAnimationFrame(loop);
    }
    loop();
  });

})();
