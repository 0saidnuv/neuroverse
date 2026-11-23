/* ============================================================
   NEUROVERSE — Utilidades de interfaz y efectos visuales
   Navegación entre pantallas, modales, notificaciones, confeti,
   partículas, logotipo SVG, jefes SVG y cuentas regresivas.
   ============================================================ */
window.NV = window.NV || {};

NV.UI = (function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var current = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function fmt(n) { return Math.round(n || 0).toLocaleString('es-MX'); }

  /* ---------- Pantallas ---------- */
  function show(id) {
    var next = document.getElementById('s-' + id);
    if (!next) return;
    if (current && current !== next) { current.classList.remove('active'); current.classList.add('leaving'); var c = current; setTimeout(function () { c.classList.remove('leaving'); }, 450); }
    next.classList.add('active');
    next.scrollTop = 0;
    current = next;
    document.body.setAttribute('data-screen', id);
    $('#topbar').classList.toggle('hidden', id === 'splash');
    window.scrollTo(0, 0);
  }
  function currentId() { return current ? current.id.replace('s-', '') : null; }

  /* ---------- Notificaciones ---------- */
  function toast(html, type, ms) {
    var t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.innerHTML = html;
    $('#toasts').appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, ms || 3200);
    setTimeout(function () { t.remove(); }, (ms || 3200) + 500);
  }
  function achievementToast(a) {
    NV.Audio.play('achievement');
    toast('<div class="ach-toast"><div class="ach-icon">' + a.icon + '</div><div><div class="ach-kicker">' + (a.secret ? '¡MISIÓN SECRETA COMPLETADA!' : '¡LOGRO DESBLOQUEADO!') + '</div><div class="ach-name">' + esc(a.name) + '</div><div class="ach-desc">' + esc(a.desc) + ' · +' + a.xp + ' XP</div></div></div>', 'achievement', 4500);
    burst(window.innerWidth - 180, 90, 40, ['#a855f7', '#22d3ee', '#facc15']);
  }

  /* ---------- Modal ---------- */
  var modalResolve = null;
  function modal(opts) {
    // opts: { title, html, buttons: [{label, value, cls}], dismiss }
    return new Promise(function (resolve) {
      var ov = $('#ov-modal'), box = $('.modal', ov);
      modalResolve = resolve;
      box.innerHTML = (opts.title ? '<h2 class="modal-title">' + opts.title + '</h2>' : '') +
        '<div class="modal-body">' + (opts.html || '') + '</div>' +
        '<div class="modal-actions">' + (opts.buttons || [{ label: 'Aceptar', value: true, cls: 'btn-primary' }]).map(function (b, i) {
          return '<button class="btn ' + (b.cls || '') + '" data-mi="' + i + '">' + b.label + '</button>';
        }).join('') + '</div>';
      $$('[data-mi]', box).forEach(function (btn) {
        btn.addEventListener('click', function () {
          NV.Audio.play('click');
          var b = opts.buttons ? opts.buttons[+btn.getAttribute('data-mi')] : { value: true };
          var val = b.value;
          if (typeof b.collect === 'function') val = b.collect(box);
          close(); resolve(val);
        });
      });
      ov.classList.remove('hidden');
      ov.onclick = function (e) { if (e.target === ov && opts.dismiss !== false) { close(); resolve(null); } };
      var first = $('input, textarea, select', box) || $('.btn-primary', box);
      if (first) setTimeout(function () { first.focus(); }, 50);
    });
    function close() { $('#ov-modal').classList.add('hidden'); modalResolve = null; }
  }
  function isModalOpen() { return !$('#ov-modal').classList.contains('hidden'); }
  function confirm(title, text, okLabel, danger) {
    return modal({ title: title, html: '<p>' + text + '</p>', buttons: [{ label: 'Cancelar', value: false, cls: 'btn-ghost' }, { label: okLabel || 'Confirmar', value: true, cls: danger ? 'btn-danger' : 'btn-primary' }] });
  }
  function alert(title, html) { return modal({ title: title, html: html, buttons: [{ label: 'Entendido', value: true, cls: 'btn-primary' }] }); }
  function prompt(title, label, value, type) {
    return modal({
      title: title,
      html: '<label class="field"><span>' + label + '</span><input class="input" id="modal-input" type="' + (type || 'text') + '" maxlength="40" value="' + esc(value || '') + '"></label>',
      buttons: [{ label: 'Cancelar', value: null, cls: 'btn-ghost' }, { label: 'Aceptar', cls: 'btn-primary', collect: function (box) { return $('#modal-input', box).value.trim(); } }]
    });
  }

  /* ---------- Flash y sacudida ---------- */
  function flash(color) {
    var f = $('#flash');
    f.style.background = color || 'rgba(239,68,68,.35)';
    f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
  }
  function shake(elm) {
    elm = elm || $('#app');
    elm.classList.remove('shake'); void elm.offsetWidth; elm.classList.add('shake');
  }

  /* ---------- Cuenta regresiva ---------- */
  function countdown(label, from) {
    from = from || 3;
    return new Promise(function (resolve) {
      var ov = $('#ov-countdown'), num = $('.cd-num', ov);
      $('.cd-label', ov).innerHTML = label || 'PREPÁRATE';
      ov.classList.remove('hidden');
      var n = from;
      function tick() {
        if (n < 0) { ov.classList.add('hidden'); resolve(); return; }
        if (n > 0) { num.textContent = n; NV.Audio.play('count'); }
        else { num.textContent = '¡YA!'; NV.Audio.play('go'); }
        num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop');
        n--; setTimeout(tick, n < 0 ? 650 : 800);
      }
      tick();
    });
  }

  /* ---------- Transición entre mundos ---------- */
  function transition(world, subtitle) {
    return new Promise(function (resolve) {
      var ov = $('#ov-transition');
      ov.style.setProperty('--wc', world.color); ov.style.setProperty('--wc2', world.color2);
      $('.tr-inner', ov).innerHTML = '<div class="tr-rings"><i></i><i></i><i></i></div><div class="tr-icon">' + world.icon + '</div>' +
        '<div class="tr-kicker">ENTRANDO A</div><div class="tr-name">' + esc(world.name) + '</div><div class="tr-sub">' + esc(subtitle || world.subject) + '</div>';
      ov.classList.remove('hidden'); ov.classList.remove('play'); void ov.offsetWidth; ov.classList.add('play');
      NV.Audio.play('whoosh');
      setTimeout(function () { ov.classList.add('hidden'); resolve(); }, 2100);
    });
  }

  /* ---------- Fondo de partículas discretas ---------- */
  function startBackground() {
    var c = $('#bg-canvas'), g = c.getContext('2d'), pts = [], W, H;
    function resize() {
      W = c.width = window.innerWidth; H = c.height = window.innerHeight;
      var n = Math.min(90, Math.floor(W * H / 22000));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.6 + .4, h: Math.random() < .5 ? 270 : 190 });
    }
    resize(); window.addEventListener('resize', resize);
    function loop() {
      g.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i]; p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fillStyle = 'hsla(' + p.h + ',90%,70%,.7)'; g.fill();
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < 12000) { g.strokeStyle = 'hsla(' + p.h + ',90%,70%,' + (0.12 * (1 - d / 12000)) + ')'; g.lineWidth = 1; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); }
        }
      }
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ---------- Confeti / explosiones de partículas ---------- */
  var fx = { parts: [], running: false };
  function fxLoop() {
    var c = $('#fx-canvas'), g = c.getContext('2d');
    if (c.width !== window.innerWidth) { c.width = window.innerWidth; c.height = window.innerHeight; }
    g.clearRect(0, 0, c.width, c.height);
    fx.parts = fx.parts.filter(function (p) { return p.life > 0; });
    fx.parts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.vx *= 0.99; p.life -= 1; p.rot += p.vr;
      g.save(); g.globalAlpha = Math.min(1, p.life / 40); g.translate(p.x, p.y); g.rotate(p.rot);
      g.fillStyle = p.color;
      if (p.shape === 'rect') g.fillRect(-p.s, -p.s / 2, p.s * 2, p.s); else { g.beginPath(); g.arc(0, 0, p.s, 0, 6.283); g.fill(); }
      g.restore();
    });
    if (fx.parts.length) requestAnimationFrame(fxLoop); else { fx.running = false; g.clearRect(0, 0, c.width, c.height); }
  }
  function addParts(list) { fx.parts = fx.parts.concat(list); if (!fx.running) { fx.running = true; requestAnimationFrame(fxLoop); } }
  function burst(x, y, n, colors) {
    var arr = [];
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, sp = Math.random() * 6 + 2; arr.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 0.12, life: 60 + Math.random() * 30, s: Math.random() * 3 + 1.5, color: colors[i % colors.length], shape: 'circle', rot: 0, vr: 0 }); }
    addParts(arr);
  }
  function confetti(n) {
    var colors = ['#a855f7', '#22d3ee', '#3b82f6', '#f472b6', '#facc15', '#ffffff'], arr = [];
    for (var i = 0; i < (n || 180); i++) arr.push({ x: Math.random() * window.innerWidth, y: -20 - Math.random() * 300, vx: (Math.random() - .5) * 3, vy: Math.random() * 3 + 2, grav: 0.05, life: 220 + Math.random() * 120, s: Math.random() * 4 + 3, color: colors[i % colors.length], shape: 'rect', rot: Math.random() * 6, vr: (Math.random() - .5) * .3 });
    addParts(arr);
  }
  function floatText(text, x, y, cls) {
    var d = document.createElement('div');
    d.className = 'float-text ' + (cls || '');
    d.textContent = text; d.style.left = x + 'px'; d.style.top = y + 'px';
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 1400);
  }

  /* ---------- Logotipo original (SVG) ---------- */
  function logoSVG(kind) {
    var mini = kind === 'mini';
    var nodes = [[50, 22], [74, 36], [74, 64], [50, 78], [26, 64], [26, 36], [50, 50]];
    var links = [[0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [0, 2], [1, 3], [2, 4], [3, 5], [4, 0], [5, 1]];
    return '<svg class="logo-svg ' + (mini ? 'mini' : 'big') + '" viewBox="0 0 100 100" aria-hidden="true">' +
      '<defs><linearGradient id="lg-' + kind + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a855f7"/><stop offset=".55" stop-color="#3b82f6"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>' +
      '<filter id="glow-' + kind + '"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      '<g filter="url(#glow-' + kind + ')">' +
      '<polygon class="logo-hex" points="50,4 90,27 90,73 50,96 10,73 10,27" fill="none" stroke="url(#lg-' + kind + ')" stroke-width="' + (mini ? 6 : 3) + '"/>' +
      (mini ? '' : '<polygon class="logo-hex2" points="50,12 83,31 83,69 50,88 17,69 17,31" fill="none" stroke="url(#lg-' + kind + ')" stroke-width="0.8" stroke-dasharray="3 4" opacity=".7"/>') +
      links.map(function (l) { var a = nodes[l[0]], b = nodes[l[1]]; return '<line class="logo-link" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="url(#lg-' + kind + ')" stroke-width="' + (mini ? 3 : 1.4) + '"/>'; }).join('') +
      nodes.map(function (n, i) { return '<circle class="logo-node" style="animation-delay:' + (i * 0.15) + 's" cx="' + n[0] + '" cy="' + n[1] + '" r="' + (i === 6 ? (mini ? 9 : 7) : (mini ? 5 : 3.2)) + '" fill="' + (i === 6 ? '#22d3ee' : '#c4b5fd') + '"/>'; }).join('') +
      '</g></svg>';
  }

  /* ---------- Jefes finales (SVG animado, original) ---------- */
  function bossSVG(boss) {
    var c1 = boss.color, c2 = boss.color2, shape = boss.shape;
    var core = '';
    if (shape === 'cube') core = '<g class="b-core"><rect x="70" y="70" width="60" height="60" rx="6" fill="url(#bg1)" transform="rotate(45 100 100)"/><rect x="82" y="82" width="36" height="36" fill="#0b0820" transform="rotate(45 100 100)"/></g>';
    else if (shape === 'eye') core = '<g class="b-core"><ellipse cx="100" cy="100" rx="48" ry="28" fill="url(#bg1)"/><circle cx="100" cy="100" r="18" fill="#0b0820"/><circle class="b-pupil" cx="100" cy="100" r="8" fill="' + c2 + '"/></g>';
    else if (shape === 'ring') core = '<g class="b-core"><circle cx="100" cy="100" r="40" fill="none" stroke="url(#bg1)" stroke-width="14"/><circle cx="100" cy="100" r="16" fill="url(#bg1)"/></g>';
    else if (shape === 'omega') core = '<g class="b-core"><path d="M62 132 h22 v-10 a34 34 0 1 1 32 0 v10 h22 v-14 h-10 a44 44 0 1 0 -56 0 h-10z" fill="url(#bg1)"/><circle cx="100" cy="88" r="10" fill="' + c2 + '"/></g>';
    else core = '<g class="b-core"><circle cx="100" cy="100" r="42" fill="url(#bg1)"/><circle cx="100" cy="100" r="22" fill="#0b0820"/><circle class="b-pupil" cx="100" cy="100" r="10" fill="' + c2 + '"/></g>';
    var spikes = '';
    for (var i = 0; i < 12; i++) { var a = i * 30; spikes += '<polygon points="100,18 106,40 94,40" fill="' + (i % 2 ? c1 : c2) + '" opacity=".85" transform="rotate(' + a + ' 100 100)"/>'; }
    return '<svg class="boss-svg" viewBox="0 0 200 200" aria-hidden="true"><defs>' +
      '<radialGradient id="bg1"><stop offset="0" stop-color="' + c2 + '"/><stop offset="1" stop-color="' + c1 + '"/></radialGradient>' +
      '<radialGradient id="bgAura"><stop offset="0" stop-color="' + c1 + '" stop-opacity=".55"/><stop offset="1" stop-color="' + c1 + '" stop-opacity="0"/></radialGradient>' +
      '<filter id="bglow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      '<circle class="b-aura" cx="100" cy="100" r="98" fill="url(#bgAura)"/>' +
      '<g filter="url(#bglow)"><g class="b-spikes">' + spikes + '</g>' +
      '<circle class="b-ring1" cx="100" cy="100" r="62" fill="none" stroke="' + c2 + '" stroke-width="2" stroke-dasharray="10 8"/>' +
      '<circle class="b-ring2" cx="100" cy="100" r="74" fill="none" stroke="' + c1 + '" stroke-width="1.5" stroke-dasharray="2 6"/>' +
      core + '</g></svg>';
  }

  function hearts(n, max) {
    var s = '';
    for (var i = 0; i < max; i++) s += '<span class="heart ' + (i < n ? '' : 'lost') + '">❤</span>';
    return s;
  }

  return {
    $: $, $$: $$, esc: esc, fmt: fmt, show: show, currentId: currentId,
    toast: toast, achievementToast: achievementToast, modal: modal, isModalOpen: isModalOpen,
    confirm: confirm, alert: alert, prompt: prompt, flash: flash, shake: shake,
    countdown: countdown, transition: transition, startBackground: startBackground,
    burst: burst, confetti: confetti, floatText: floatText, logoSVG: logoSVG, bossSVG: bossSVG, hearts: hearts
  };
})();
