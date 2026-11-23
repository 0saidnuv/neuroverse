/* ============================================================
   NEUROVERSE ARCADE — Minijuegos 06 a 10
   06 RHYTHM CORE · 07 REACTION X · 08 DEFEND THE CORE
   09 DETECTIVE 404 · 10 NEON RACE
   ============================================================ */
(function () {
  var AR = NV.Arcade, U = AR.U, esc = NV.UI.esc, fmt = NV.UI.fmt, art = AR.art;

  /* =====================================================================
     06 · RHYTHM CORE — ritmo y reflejos (música generada, sin derechos)
     ===================================================================== */
  var LANE_C = ['#a855f7', '#22d3ee', '#f472b6', '#facc15'], LANE_F = [330, 392, 440, 523], LANE_K = ['D', 'F', 'J', 'K'];
  AR.register({
    id: 'rhythm', num: '06', name: 'RHYTHM CORE', icon: '🎵', category: 'Ritmo y reflejos', difficulty: 4, levels: true, xpPer: 120,
    c1: '#f472b6', c2: '#facc15',
    desc: 'Las notas de energía caen al núcleo: púlsalas justo a tiempo con el ritmo generado por el sistema.',
    howTo: ['Pulsa D F J K (o toca los carriles) cuando la nota cruce la línea brillante.', 'PERFECTO, GENIAL o BIEN según tu precisión. Los combos multiplican tus puntos.', 'Cada nota fallada drena la energía del núcleo. Si llega a 0, pierdes.', 'Termina la pista para ganar. En niveles altos el ritmo es más rápido y denso.'],
    art: art('rhythm', '#f472b6', '#facc15', '<line x1="40" y1="10" x2="40" y2="110"/><line x1="80" y1="10" x2="80" y2="110"/><line x1="120" y1="10" x2="120" y2="110"/><line x1="160" y1="10" x2="160" y2="110"/><line x1="25" y1="92" x2="175" y2="92" stroke-width="4"/><rect x="48" y="30" width="24" height="10" rx="4" fill="url(#ga-rhythm)"/><rect x="128" y="62" width="24" height="10" rx="4" fill="url(#ga-rhythm)"/>'),
    create: function (ctx) {
      var L = ctx.level, W = 480, H = 640, HIT = 560;
      var bpm = 96 + (L - 1) * 14, beat = 60 / bpm, length = 42, travel = Math.max(0.95, 1.7 - L * 0.12);
      var notes = [], t = -2.2, score = 0, combo = 0, maxCombo = 0, energy = 100, counts = { PERFECTO: 0, GENIAL: 0, BIEN: 0, FALLO: 0 };
      var nextBeat = 0, flashes = [0, 0, 0, 0], judgeText = null, finished = false;
      // Genera la pista: patrones que se vuelven más densos
      (function () {
        var b = 0, last = -1;
        while (b * beat < length) {
          var time = b * beat, dense = time / length;
          var lane = U.rnd(0, 3); if (lane === last && Math.random() < .6) lane = (lane + U.rnd(1, 3)) % 4; last = lane;
          notes.push({ t: time, lane: lane, done: false });
          if (L >= 2 && dense > .3 && Math.random() < .25 + L * .05) notes.push({ t: time + beat / 2, lane: (lane + 2) % 4, done: false });
          if (L >= 3 && dense > .6 && Math.random() < .15 + L * .04) notes.push({ t: time, lane: (lane + 1) % 4, done: false });
          b += (Math.random() < .2 && L < 3) ? 2 : 1;
        }
        notes.sort(function (a, c) { return a.t - c.t; });
      })();
      ctx.root.innerHTML = '<div class="rc-wrap"><div class="rc-box"></div><div class="rc-keys">' + LANE_K.map(function (k, i) { return '<button class="rc-key" data-lane="' + i + '" style="--lc:' + LANE_C[i] + '">' + k + '</button>'; }).join('') + '</div></div>';
      var cv = U.canvas(ctx.root.querySelector('.rc-box'), W, H), g = cv.getContext('2d');
      function hud() { ctx.hud({ score: score, level: L, combo: combo, comboLabel: 'COMBO', lives: null, time: Math.max(0, length - Math.max(0, t)), progress: Math.max(0, t) / length, label: 'Energía del núcleo: ' + Math.round(energy) + '% · ' + bpm + ' BPM' }); }
      function judge(lane) {
        if (finished) return;
        flashes[lane] = 0.15;
        var best = null, bd = 1;
        notes.forEach(function (n) { if (!n.done && n.lane === lane) { var d = Math.abs(n.t - t); if (d < bd) { bd = d; best = n; } } });
        if (!best || bd > 0.18) { return; } // pulsación sin nota cercana: sin castigo
        best.done = true;
        var name = bd <= 0.06 ? 'PERFECTO' : bd <= 0.12 ? 'GENIAL' : 'BIEN';
        var base = { PERFECTO: 300, GENIAL: 200, BIEN: 100 }[name];
        combo++; maxCombo = Math.max(maxCombo, combo); counts[name]++;
        score += Math.round(base * (1 + combo / 25)); energy = Math.min(100, energy + 2);
        ctx.tone(LANE_F[lane] * (name === 'PERFECTO' ? 2 : 1), 0.12, { type: 'triangle', vol: 0.18 });
        judgeText = { s: name, c: LANE_C[lane], life: 0.5 };
        hud();
      }
      function miss(n) {
        n.done = true; combo = 0; counts.FALLO++; energy -= 8; judgeText = { s: 'FALLO', c: '#ef4444', life: 0.5 };
        ctx.tone(110, 0.15, { type: 'sawtooth', vol: 0.08 });
        if (energy <= 0 && !finished) { finished = true; ctx.sfx('defeat'); ctx.after(400, function () { ctx.end({ score: score, win: false, level: L, message: '¡El núcleo se quedó sin energía!', stats: stats() }); }); }
        hud();
      }
      function stats() { return { 'Perfectos': counts.PERFECTO, 'Geniales': counts.GENIAL, 'Bien': counts.BIEN, 'Fallos': counts.FALLO, 'Combo máximo': maxCombo }; }
      function update(dt) {
        if (finished) return;
        t += dt;
        // pulso de la música generada: bombo en cada tiempo y platillo a contratiempo
        while (t >= nextBeat * beat / 2 && nextBeat * beat / 2 <= length) {
          if (nextBeat % 2 === 0) ctx.tone(60, 0.18, { type: 'sine', vol: 0.32, slide: 35 }); else ctx.tone(2400, 0.03, { type: 'square', vol: 0.025 });
          nextBeat++;
        }
        notes.forEach(function (n) { if (!n.done && t - n.t > 0.18) miss(n); });
        flashes = flashes.map(function (f) { return Math.max(0, f - dt); });
        if (judgeText) judgeText.life -= dt;
        if (t > length + 0.5 && !finished) {
          finished = true; L++;
          var acc = Math.round((counts.PERFECTO + counts.GENIAL + counts.BIEN) / Math.max(1, notes.length) * 100);
          ctx.end({ score: score, win: true, level: L, message: '¡Pista completada! Precisión: ' + acc + '%', stats: stats(), achievements: maxCombo >= 30 ? ['a_combo'] : [] });
        }
        if (Math.random() < 0.1) hud();
      }
      function render() {
        g.fillStyle = '#060418'; g.fillRect(0, 0, W, H);
        var lw = W / 4, pulse = (t > 0 ? (t % beat) / beat : 0);
        for (var i = 0; i < 4; i++) {
          var grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, LANE_C[i] + '33');
          g.fillStyle = grd; g.fillRect(i * lw + 2, 0, lw - 4, H);
          if (flashes[i] > 0) { g.fillStyle = LANE_C[i] + '55'; g.fillRect(i * lw + 2, 0, lw - 4, H); }
        }
        g.strokeStyle = 'rgba(255,255,255,.08)'; for (var y = (t * 200) % 40; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
        // línea de golpe
        U.glow(g, '#fff', 20 - pulse * 14); g.fillStyle = 'rgba(255,255,255,' + (0.9 - pulse * .5) + ')'; g.fillRect(0, HIT - 3, W, 6);
        // notas
        notes.forEach(function (n) {
          if (n.done) return; var y = HIT - (n.t - t) / travel * HIT; if (y < -30 || y > H + 30) return;
          U.glow(g, LANE_C[n.lane], 18); g.fillStyle = LANE_C[n.lane];
          var x = n.lane * lw + 12; g.beginPath(); if (g.roundRect) g.roundRect(x, y - 12, lw - 24, 24, 10); else g.rect(x, y - 12, lw - 24, 24); g.fill();
          g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(x + 8, y - 4, lw - 40, 6);
        });
        U.glow(g, 'transparent', 0);
        // energía
        g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(12, 12, W - 24, 8); g.fillStyle = energy > 30 ? '#22d3ee' : '#ef4444'; g.fillRect(12, 12, (W - 24) * Math.max(0, energy) / 100, 8);
        if (t < 0) { g.fillStyle = '#fff'; g.font = '900 64px Orbitron, sans-serif'; g.textAlign = 'center'; g.fillText(Math.ceil(-t), W / 2, H / 2); }
        if (judgeText && judgeText.life > 0) { g.globalAlpha = Math.min(1, judgeText.life * 3); U.glow(g, judgeText.c, 20); g.fillStyle = judgeText.c; g.font = '900 34px Orbitron, sans-serif'; g.textAlign = 'center'; g.fillText(judgeText.s, W / 2, HIT - 80 - (0.5 - judgeText.life) * 60); if (combo > 4) { g.font = '700 22px Orbitron, sans-serif'; g.fillText(combo + ' COMBO', W / 2, HIT - 44); } g.globalAlpha = 1; U.glow(g, 'transparent', 0); }
      }
      ctx.loop(function (dt) { update(dt); render(); });
      var keyMap = { d: 0, f: 1, j: 2, k: 3, D: 0, F: 1, J: 2, K: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3 };
      ctx.on(document, 'keydown', function (e) { if (e.repeat) return; var l = keyMap[e.key]; if (l != null) { judge(l); e.preventDefault(); } });
      ctx.root.querySelectorAll('[data-lane]').forEach(function (b) { ctx.on(b, 'pointerdown', function (e) { e.preventDefault(); judge(+b.getAttribute('data-lane')); }); });
      ctx.on(cv, 'pointerdown', function (e) { var p = U.pt(cv, e); judge(Math.max(0, Math.min(3, Math.floor(p.x / (W / 4))))); });
      hud(); render();
      return { test: {
        // Simula la canción: golpea cada nota con precisión "perfecta" (o falla todas)
        play: function (fail) { while (!finished) { var due = notes.filter(function (n) { return !n.done && n.t <= t; }); if (!fail) due.forEach(function (n) { judge(n.lane); }); update(1 / 60); } },
        state: function () { return { t: t, score: score, combo: combo, energy: energy, notes: notes.length, finished: finished }; }
      } };
    }
  });

  /* =====================================================================
     07 · REACTION X — reacción con señales falsas
     ===================================================================== */
  var SHAPES = [{ id: 'circle', n: 'CÍRCULO' }, { id: 'square', n: 'CUADRADO' }, { id: 'diamond', n: 'ROMBO' }, { id: 'tri', n: 'TRIÁNGULO' }];
  var COLORS = [{ c: '#22d3ee', n: 'CIAN' }, { c: '#a855f7', n: 'VIOLETA' }, { c: '#facc15', n: 'DORADO' }, { c: '#f472b6', n: 'ROSA' }];
  AR.register({
    id: 'reaction', num: '07', name: 'REACTION X', icon: '⚡', category: 'Reflejos', difficulty: 3, levels: true, xpPer: 40,
    c1: '#facc15', c2: '#22d3ee',
    desc: 'Señales de colores y formas aparecen sin aviso. Pulsa SOLO la señal indicada… y no caigas en las trampas.',
    howTo: ['Arriba se indica la señal objetivo (forma + color).', 'Cuando aparezca, tócala o presiona ESPACIO lo más rápido posible.', 'Si pulsas una señal falsa o dejas pasar la correcta, pierdes una vida.', '5 niveles de 12 señales: cada nivel las señales duran menos y las trampas se parecen más.'],
    art: art('reaction', '#facc15', '#22d3ee', '<circle cx="60" cy="60" r="22"/><rect x="110" y="40" width="40" height="40" transform="rotate(45 130 60)"/><path d="M100 15 L92 55 h14 l-8 45" stroke-width="4"/>'),
    create: function (ctx) {
      var L = ctx.level, lives = 3, score = 0, shown = 0, PER = 12, target, cur = null, hits = 0, falses = 0, misses = 0, rts = [], levelsDone = 0, waitT = null, streak = 0;
      ctx.root.innerHTML = '<div class="rx-wrap"><div class="rx-target" id="rx-t"></div><div class="rx-arena" id="rx-a"><div class="rx-wait">PREPÁRATE…</div></div><div class="rx-rt" id="rx-rt">Tiempo de reacción: —</div></div>';
      var arena = ctx.root.querySelector('#rx-a'), tEl = ctx.root.querySelector('#rx-t'), rtEl = ctx.root.querySelector('#rx-rt');
      function shapeHTML(sh, col) { return '<div class="rx-sig ' + sh + '" style="--sc:' + col + '"></div>'; }
      function newTarget() {
        target = { sh: U.pick(SHAPES), col: U.pick(COLORS) };
        tEl.innerHTML = '<span>PULSA SOLO:</span>' + shapeHTML(target.sh.id, target.col.c) + '<b style="color:' + target.col.c + '">' + target.sh.n + ' ' + target.col.n + '</b>';
        tEl.classList.remove('pop'); void tEl.offsetWidth; tEl.classList.add('pop');
      }
      function hud() { ctx.hud({ score: score, level: L, combo: streak, lives: lives, maxLives: 3, progress: (levelsDone + shown / PER) / 5, label: 'Nivel ' + (levelsDone + 1) + ' de 5 · señal ' + Math.min(shown, PER) + '/' + PER }); }
      function schedule() {
        arena.innerHTML = ''; cur = null;
        if (shown >= PER) {
          levelsDone++; L++;
          if (levelsDone >= 5) { finish(true); return; }
          ctx.sfx('achievement'); ctx.toast('⚡ ¡NIVEL ' + L + '! Nueva señal objetivo', 'power'); shown = 0; newTarget(); hud();
        }
        waitT = ctx.after(U.rnd(500, 1300), spawn);
      }
      function spawn() {
        shown++;
        var isT = Math.random() < 0.42, sh, col;
        if (isT) { sh = target.sh; col = target.col; }
        else {
          // trampas: en niveles altos comparten forma o color con el objetivo
          var r = Math.random();
          if (L >= 2 && r < 0.4) { sh = target.sh; col = U.pick(COLORS.filter(function (c) { return c !== target.col; })); }
          else if (L >= 2 && r < 0.8) { col = target.col; sh = U.pick(SHAPES.filter(function (s) { return s !== target.sh; })); }
          else { sh = U.pick(SHAPES.filter(function (s) { return s !== target.sh; })); col = U.pick(COLORS.filter(function (c) { return c !== target.col; })); }
        }
        var win = Math.max(550, 1500 - L * 130);
        var x = U.rnd(10, 80), y = U.rnd(12, 72);
        arena.innerHTML = '<div class="rx-pos" style="left:' + x + '%;top:' + y + '%">' + shapeHTML(sh.id, col.c) + '</div>';
        cur = { isT: isT, at: performance.now(), done: false };
        var c0 = cur;
        ctx.on(arena.querySelector('.rx-sig'), 'pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); press(); });
        ctx.after(win, function () { if (cur === c0 && !c0.done) { c0.done = true; if (c0.isT) { misses++; lose('¡Dejaste pasar la señal!'); } else { score += 20; schedule(); } } });
        hud();
      }
      function press() {
        if (!cur || cur.done) { return; }
        cur.done = true;
        if (cur.isT) {
          var rt = Math.round(performance.now() - cur.at); rts.push(rt); hits++; streak++;
          var gain = Math.max(50, 600 - rt) + streak * 10; score += gain;
          rtEl.textContent = 'Tiempo de reacción: ' + rt + ' ms'; ctx.sfx('correct'); ctx.burstAt(arena.querySelector('.rx-sig'), [target.col.c, '#fff']); ctx.floatAt(arena.querySelector('.rx-sig'), '+' + gain, 'plus');
          hud(); ctx.after(150, schedule);
        } else { falses++; lose('¡Era una señal FALSA!'); }
      }
      function lose(msg) {
        lives--; streak = 0; ctx.sfx('wrong'); ctx.flash(); ctx.shake(arena); rtEl.textContent = msg; hud();
        if (lives <= 0) { finish(false); return; }
        ctx.after(500, schedule);
      }
      function finish(win) {
        var avg = rts.length ? Math.round(rts.reduce(function (a, b) { return a + b; }, 0) / rts.length) : 0;
        var prec = Math.round(hits / Math.max(1, hits + falses + misses) * 100);
        ctx.end({ score: score, win: win, level: L, message: win ? '¡Reflejos de élite! Superaste los 5 niveles.' : 'Te quedaste sin vidas en el nivel ' + (levelsDone + 1) + '.', stats: { 'Reacción promedio': avg ? avg + ' ms' : '—', 'Precisión': prec + '%', 'Aciertos': hits, 'Falsas pulsadas': falses, 'Perdidas': misses }, achievements: avg && avg < 450 && hits >= 10 ? ['a_react'] : [] });
      }
      ctx.on(document, 'keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (cur && !cur.done) press(); } });
      newTarget(); hud(); schedule();
      return { test: { current: function () { return cur && !cur.done ? { isT: cur.isT } : null; }, press: press, state: function () { return { L: L, lives: lives, score: score, shown: shown, levelsDone: levelsDone }; } } };
    }
  });

  /* =====================================================================
     08 · DEFEND THE CORE — defensa de torres en tiempo real
     ===================================================================== */
  var TD_PATH = [[-1, 2], [3, 2], [3, 7], [7, 7], [7, 1], [11, 1], [11, 8], [14, 8], [14, 4], [15, 4]]; // en casillas (16×10), termina en el núcleo
  var TOWERS = {
    pulse: { n: 'PULSO', icon: '⚡', cost: 50, range: 2.3, dmg: 11, rate: 0.35, color: '#22d3ee', desc: 'Disparo rápido' },
    cryo: { n: 'CRIO', icon: '❄', cost: 70, range: 2.0, dmg: 4, rate: 0.7, slow: 0.5, color: '#93c5fd', desc: 'Ralentiza enemigos' },
    rail: { n: 'RAILGUN', icon: '✹', cost: 120, range: 4.2, dmg: 70, rate: 1.6, color: '#f472b6', desc: 'Largo alcance, gran daño' }
  };
  var ENEMIES = {
    drone: { hp: 34, speed: 1.6, reward: 7, color: '#ef4444', r: 0.22 },
    swarm: { hp: 14, speed: 2.5, reward: 3, color: '#f97316', r: 0.15 },
    tank: { hp: 150, speed: 0.8, reward: 18, color: '#a855f7', r: 0.32 },
    boss: { hp: 900, speed: 0.6, reward: 90, color: '#facc15', r: 0.45 }
  };
  AR.register({
    id: 'defense', num: '08', name: 'DEFEND THE CORE', icon: '🛡️', category: 'Estrategia', difficulty: 4, levels: false, xpPer: 150,
    c1: '#a855f7', c2: '#f472b6',
    desc: 'Oleadas de virus avanzan por la red hacia el núcleo. Construye defensas, administra tus créditos y mejora tus torres.',
    howTo: ['Elige una torre abajo y toca una casilla libre (fuera del camino) para construirla.', 'Toca una torre construida para MEJORARLA (hasta nivel 3).', 'Presiona INICIAR OLEADA. Cada enemigo destruido da créditos.', 'Sobrevive a 10 oleadas (con jefes en la 5 y la 10). Si el núcleo llega a 0, pierdes.'],
    art: art('defense', '#a855f7', '#f472b6', '<path d="M10 40 H70 V90 H130 V30 H190" stroke-width="10" opacity=".35"/><circle cx="185" cy="30" r="10" fill="url(#ga-defense)"/><rect x="85" y="52" width="22" height="22" rx="4"/><circle cx="96" cy="63" r="30" stroke-dasharray="4 5" stroke-width="1.5"/><circle cx="50" cy="40" r="6" fill="#ef4444" stroke="none"/>'),
    create: function (ctx) {
      var COLS = 16, ROWS = 10, TS = 50, W = COLS * TS, H = ROWS * TS;
      var credits = 160, coreHp = 20, wave = 0, MAXW = 10, enemies = [], towers = [], beams = [], spawnQ = [], spawnT = 0, inWave = false, selType = 'pulse', kills = 0, score = 0, ended = false, time = 0, auto = false;
      // casillas del camino
      var pathCells = {}, pts = TD_PATH.map(function (p) { return { x: (p[0] + .5) * TS, y: (p[1] + .5) * TS }; });
      for (var i = 0; i < TD_PATH.length - 1; i++) {
        var a = TD_PATH[i], b = TD_PATH[i + 1], dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]), x = a[0], y = a[1];
        while (x !== b[0] || y !== b[1]) { pathCells[x + ',' + y] = 1; x += dx; y += dy; } pathCells[b[0] + ',' + b[1]] = 1;
      }
      var segLen = [], total = 0; for (i = 0; i < pts.length - 1; i++) { var l = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y); segLen.push(l); total += l; }
      function posAt(d) { for (var k = 0; k < segLen.length; k++) { if (d <= segLen[k]) { var t = d / segLen[k]; return { x: pts[k].x + (pts[k + 1].x - pts[k].x) * t, y: pts[k].y + (pts[k + 1].y - pts[k].y) * t }; } d -= segLen[k]; } return pts[pts.length - 1]; }
      ctx.root.innerHTML = '<div class="td-wrap"><div class="td-box"></div><div class="td-bar">' +
        Object.keys(TOWERS).map(function (k) { var T = TOWERS[k]; return '<button class="td-tower ' + (k === selType ? 'on' : '') + '" data-tw="' + k + '" style="--tc:' + T.color + '"><span>' + T.icon + '</span><b>' + T.n + '</b><small>' + T.cost + ' ⓒ · ' + T.desc + '</small></button>'; }).join('') +
        '<div class="td-credits" id="td-cr"></div><button class="btn btn-primary" id="td-wave">▶ INICIAR OLEADA 1</button><label class="toggle td-auto"><input type="checkbox" id="td-auto"><span class="tg"></span>Oleadas automáticas</label></div></div>';
      var cv = U.canvas(ctx.root.querySelector('.td-box'), W, H), g = cv.getContext('2d');
      var waveBtn = ctx.root.querySelector('#td-wave'), crEl = ctx.root.querySelector('#td-cr');
      function hud() {
        ctx.hud({ score: score, level: wave, combo: kills, comboLabel: 'DERRIBOS', lives: null, time: null, progress: wave / MAXW, label: 'Oleada ' + wave + ' de ' + MAXW + ' · Núcleo ' + coreHp + '/20' });
        crEl.innerHTML = 'ⓒ <b>' + credits + '</b> créditos · 💠 Núcleo <b>' + coreHp + '</b>';
        waveBtn.disabled = inWave || ended; waveBtn.textContent = inWave ? 'OLEADA EN CURSO…' : '▶ INICIAR OLEADA ' + (wave + 1);
        ctx.root.querySelectorAll('[data-tw]').forEach(function (b) { b.classList.toggle('poor', TOWERS[b.getAttribute('data-tw')].cost > credits); });
      }
      function startWave() {
        if (inWave || ended) return; wave++; inWave = true;
        var n = 6 + wave * 2, hpMul = 1 + (wave - 1) * 0.22; spawnQ = [];
        for (var k = 0; k < n; k++) {
          var type = wave >= 3 && k % 4 === 3 ? 'tank' : wave >= 2 && k % 3 === 1 ? 'swarm' : 'drone';
          spawnQ.push({ type: type, hpMul: hpMul, delay: type === 'swarm' ? 0.35 : 0.8 });
        }
        if (wave % 5 === 0) spawnQ.push({ type: 'boss', hpMul: hpMul * (wave / 5), delay: 1.5 });
        spawnT = 0.5; ctx.sfx('roar'); ctx.toast('⚠ OLEADA ' + wave + (wave % 5 === 0 ? ' · ¡JEFE VIRAL!' : ''), 'power'); hud();
      }
      function place(cx, cy) {
        if (ended) return;
        if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return;
        var tw = towers.find(function (t) { return t.cx === cx && t.cy === cy; });
        if (tw) { // mejorar
          var cost = Math.round(TOWERS[tw.type].cost * 0.7 * tw.lvl);
          if (tw.lvl >= 3) { ctx.toast('Torre al nivel máximo', 'warn'); return; }
          if (credits < cost) { ctx.toast('Mejora: necesitas ' + cost + ' créditos', 'warn'); return; }
          credits -= cost; tw.lvl++; ctx.sfx('power'); score += 20; hud(); return;
        }
        if (pathCells[cx + ',' + cy] || (cx === 15 && cy === 4)) { ctx.toast('No puedes construir sobre el camino', 'warn'); return; }
        var T = TOWERS[selType];
        if (credits < T.cost) { ctx.sfx('wrong'); ctx.toast('Créditos insuficientes', 'warn'); return; }
        credits -= T.cost; towers.push({ type: selType, cx: cx, cy: cy, lvl: 1, cd: 0, angle: 0 }); ctx.sfx('shield'); hud();
      }
      function update(dt) {
        if (ended) return;
        time += dt;
        if (inWave && spawnQ.length) {
          spawnT -= dt;
          if (spawnT <= 0) { var s = spawnQ.shift(), E = ENEMIES[s.type]; enemies.push({ type: s.type, hp: E.hp * s.hpMul, max: E.hp * s.hpMul, d: 0, slow: 0, speed: E.speed }); spawnT = s.delay; }
        }
        enemies.forEach(function (e) {
          var sp = e.speed * TS * (e.slow > 0 ? 0.5 : 1); e.slow = Math.max(0, e.slow - dt); e.d += sp * dt;
          if (e.d >= total) { e.dead = true; e.leaked = true; coreHp -= e.type === 'boss' ? 5 : 1; ctx.sfx('hit'); ctx.flash('rgba(239,68,68,.3)'); }
        });
        towers.forEach(function (t) {
          var T = TOWERS[t.type], range = (T.range + (t.lvl - 1) * 0.35) * TS, dmg = T.dmg * Math.pow(1.6, t.lvl - 1);
          t.cd -= dt; if (t.cd > 0) return;
          var tx = (t.cx + .5) * TS, ty = (t.cy + .5) * TS, best = null;
          enemies.forEach(function (e) { if (e.dead) return; var p = posAt(e.d); if (Math.hypot(p.x - tx, p.y - ty) <= range && (!best || e.d > best.d)) best = e; });
          if (!best) return;
          var bp = posAt(best.d); t.angle = Math.atan2(bp.y - ty, bp.x - tx);
          best.hp -= dmg; if (T.slow) best.slow = 1.2; t.cd = T.rate;
          beams.push({ x1: tx, y1: ty, x2: bp.x, y2: bp.y, c: T.color, life: t.type === 'rail' ? 0.25 : 0.08, w: t.type === 'rail' ? 5 : 2 });
          if (best.hp <= 0 && !best.dead) { best.dead = true; kills++; credits += ENEMIES[best.type].reward; score += ENEMIES[best.type].reward * 10; best.boom = 0.3; }
        });
        enemies = enemies.filter(function (e) { return !e.dead; });
        beams.forEach(function (b) { b.life -= dt; }); beams = beams.filter(function (b) { return b.life > 0; });
        if (coreHp <= 0) { ended = true; coreHp = 0; ctx.sfx('explode'); ctx.after(600, function () { ctx.end({ score: score, win: false, message: '¡El núcleo cayó en la oleada ' + wave + '!', stats: stats() }); }); return; }
        if (inWave && !spawnQ.length && !enemies.length) {
          inWave = false; var bonus = 40 + wave * 10; credits += bonus; score += wave * 100 + coreHp * 10; ctx.sfx('correct');
          if (wave >= MAXW) { ended = true; score += coreHp * 100; ctx.end({ score: score, win: true, message: '¡Defendiste el núcleo de las 10 oleadas!', stats: stats(), achievements: ['a_core'] }); return; }
          ctx.toast('✔ Oleada ' + wave + ' superada · +' + bonus + ' créditos', 'ok');
          if (auto) ctx.after(1500, startWave);
        }
        if (Math.random() < 0.15) hud();
      }
      function stats() { return { 'Oleadas': wave + '/' + MAXW, 'Derribos': kills, 'Núcleo': coreHp + '/20', 'Torres': towers.length }; }
      function render() {
        g.fillStyle = '#070620'; g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(139,92,246,.12)'; g.lineWidth = 1;
        for (var x = 0; x <= COLS; x++) { g.beginPath(); g.moveTo(x * TS, 0); g.lineTo(x * TS, H); g.stroke(); }
        for (var y = 0; y <= ROWS; y++) { g.beginPath(); g.moveTo(0, y * TS); g.lineTo(W, y * TS); g.stroke(); }
        Object.keys(pathCells).forEach(function (k) { var p = k.split(',').map(Number); if (p[0] < 0) return; g.fillStyle = 'rgba(59,130,246,.16)'; g.fillRect(p[0] * TS + 1, p[1] * TS + 1, TS - 2, TS - 2); });
        g.strokeStyle = 'rgba(34,211,238,.5)'; g.lineWidth = 2; g.setLineDash([8, 8]); g.lineDashOffset = -time * 40; g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); g.stroke(); g.setLineDash([]);
        // núcleo
        var core = pts[pts.length - 1]; U.glow(g, '#22d3ee', 30); g.fillStyle = coreHp > 6 ? '#22d3ee' : '#ef4444'; g.beginPath(); g.arc(core.x - 5, core.y, 20 + Math.sin(time * 4) * 3, 0, 7); g.fill(); U.glow(g, 'transparent', 0);
        // torres
        towers.forEach(function (t) {
          var T = TOWERS[t.type], tx = (t.cx + .5) * TS, ty = (t.cy + .5) * TS;
          g.fillStyle = 'rgba(20,16,56,.95)'; g.strokeStyle = T.color; g.lineWidth = 2; U.glow(g, T.color, 12);
          g.beginPath(); g.arc(tx, ty, 17, 0, 7); g.fill(); g.stroke();
          g.save(); g.translate(tx, ty); g.rotate(t.angle); g.fillStyle = T.color; g.fillRect(0, -3, 18, 6); g.restore();
          g.fillStyle = '#fff'; U.glow(g, 'transparent', 0); g.font = '10px sans-serif'; g.textAlign = 'center'; g.fillText('★'.repeat(t.lvl), tx, ty + 27);
        });
        // enemigos
        enemies.forEach(function (e) {
          var p = posAt(e.d), E = ENEMIES[e.type], r = E.r * TS;
          U.glow(g, E.color, 14); g.fillStyle = e.slow > 0 ? '#93c5fd' : E.color;
          g.beginPath(); for (var k = 0; k < 6; k++) { var a = k / 6 * 6.283 + time * 3; g.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); } g.closePath(); g.fill();
          U.glow(g, 'transparent', 0); g.fillStyle = '#000a'; g.fillRect(p.x - r, p.y - r - 8, r * 2, 4); g.fillStyle = '#22c55e'; g.fillRect(p.x - r, p.y - r - 8, r * 2 * Math.max(0, e.hp / e.max), 4);
        });
        beams.forEach(function (b) { g.globalAlpha = Math.min(1, b.life * 8); U.glow(g, b.c, 14); g.strokeStyle = b.c; g.lineWidth = b.w; g.beginPath(); g.moveTo(b.x1, b.y1); g.lineTo(b.x2, b.y2); g.stroke(); });
        g.globalAlpha = 1; U.glow(g, 'transparent', 0);
      }
      ctx.on(cv, 'pointerdown', function (e) { var p = U.pt(cv, e); place(Math.floor(p.x / TS), Math.floor(p.y / TS)); });
      ctx.root.querySelectorAll('[data-tw]').forEach(function (b) { ctx.on(b, 'click', function () { selType = b.getAttribute('data-tw'); ctx.root.querySelectorAll('[data-tw]').forEach(function (x) { x.classList.toggle('on', x === b); }); ctx.sfx('click'); }); });
      ctx.on(waveBtn, 'click', startWave);
      ctx.on(ctx.root.querySelector('#td-auto'), 'change', function (e) { auto = e.target.checked; });
      ctx.loop(function (dt) { update(dt); render(); });
      hud(); render();
      // Lugares estratégicos (junto a varias curvas del camino) para el jugador automático de pruebas
      var SPOTS = [[4, 3], [6, 6], [8, 2], [10, 2], [4, 6], [12, 7], [8, 6], [10, 7], [13, 5], [6, 3], [2, 3], [12, 2], [9, 4], [5, 8], [13, 9], [15, 7]];
      return { test: {
        build: function () { // gasta créditos: torres en lugares libres y mejoras
          var free = SPOTS.filter(function (s) { return !towers.some(function (t) { return t.cx === s[0] && t.cy === s[1]; }); });
          var types = ['pulse', 'rail', 'cryo', 'pulse', 'rail'];
          while (free.length && credits >= 120) { selType = types[towers.length % types.length]; if (credits < TOWERS[selType].cost) break; var s = free.shift(); place(s[0], s[1]); }
          towers.forEach(function (t) { var c = Math.round(TOWERS[t.type].cost * 0.7 * t.lvl); if (t.lvl < 3 && credits >= c + 50) place(t.cx, t.cy); });
        },
        startWave: startWave, tick: function (s) { for (var i = 0; i < s * 30; i++) update(1 / 30); },
        state: function () { return { wave: wave, inWave: inWave, coreHp: coreHp, credits: credits, enemies: enemies.length, towers: towers.length, ended: ended, score: score }; }
      } };
    }
  });

  /* =====================================================================
     09 · DETECTIVE 404 — misterios con evidencias
     ===================================================================== */
  var CASES = [
    {
      title: 'El examen filtrado', icon: '📄',
      intro: 'El martes, el archivo del examen de matemáticas se copió desde la computadora del profesor a las 13:04. ¿Quién lo hizo?',
      suspects: [{ id: 'rodrigo', n: 'Rodrigo', d: 'Monitor del laboratorio de cómputo' }, { id: 'valeria', n: 'Valeria', d: 'Jefa de grupo' }, { id: 'ivan', n: 'Iván', d: 'Ayudante del profesor' }],
      evidence: [
        { id: 'log', icon: '🖥️', t: 'Registro de la computadora', x: 'La sesión se desbloqueó a las 13:02 escribiendo la contraseña del profesor. No se usó huella ni otra cuenta.' },
        { id: 'nota', icon: '🗒️', t: 'Nota adhesiva', x: 'Bajo el teclado del profesor había una nota con su contraseña. Solo se ve al levantar el teclado para limpiar el escritorio.' },
        { id: 'torneo', icon: '🏐', t: 'Foto del torneo', x: 'Foto con fecha y hora: martes 13:00–13:30, Valeria juega la final de voleibol en la cancha.' },
        { id: 'conserje', icon: '🧹', t: 'Testimonio del conserje', x: 'Rodrigo cerró el laboratorio a las 12:55 y estuvo en la cafetería hasta las 13:20; varios compañeros lo confirman.' },
        { id: 'agenda', icon: '📅', t: 'Agenda del profesor', x: 'Cada martes, al terminar la clase de las 12:00, Iván ordena y limpia el escritorio del profesor.' },
        { id: 'usb', icon: '💾', t: 'Memoria USB', x: 'USB olvidada junto a la computadora, con las iniciales "I. M.". Contiene el examen, copiado el martes a las 13:04.' }
      ],
      culprit: 'ivan', key: ['usb', 'agenda', 'nota'],
      solution: 'Valeria y Rodrigo tienen coartada (foto del torneo y testimonio). Iván limpia el escritorio, por lo que pudo ver la nota con la contraseña, y su USB tiene el archivo copiado a las 13:04.'
    },
    {
      title: 'El huerto marchito', icon: '🌱',
      intro: 'Las plantas de jitomate del huerto escolar amanecieron sanas, pero a mediodía estaban marchitas. ¿Qué pasó y quién fue el responsable?',
      suspects: [{ id: 'marco', n: 'Marco', d: 'Club de cocina' }, { id: 'lucia', n: 'Lucía', d: 'Club de ecología' }, { id: 'pepe', n: 'Don Pepe', d: 'Jardinero del plantel' }],
      evidence: [
        { id: 'suelo', icon: '🧪', t: 'Análisis del suelo', x: 'El suelo tiene muchísima sal (cloruro de sodio). El exceso de sal hace que las raíces pierdan agua y la planta se marchite.' },
        { id: 'bitacora', icon: '📓', t: 'Bitácora del club de cocina', x: 'Hoy prepararon salmuera (agua con mucha sal) para conservas de 10:00 a 11:00. Nota: "el sobrante se tiró afuera".' },
        { id: 'oficio', icon: '📨', t: 'Oficio de dirección', x: 'Don Pepe está de vacaciones toda la semana; no ha venido al plantel.' },
        { id: 'foto', icon: '📷', t: 'Foto del club de ecología', x: 'Lucía regó con agua de la llave a las 8:00. Foto de las 9:00: plantas sanas.' },
        { id: 'cubeta', icon: '🪣', t: 'Cubeta junto al huerto', x: 'Cubeta vacía con etiqueta "SALMUERA - Club de cocina" y restos blancos de sal en el borde.' },
        { id: 'clima', icon: '🌤️', t: 'Reporte del clima', x: 'Día templado, 24 °C, sin heladas ni granizo.' }
      ],
      culprit: 'marco', key: ['cubeta', 'bitacora', 'suelo'],
      solution: 'El suelo tiene exceso de sal; la bitácora y la cubeta muestran que la salmuera del club de cocina se tiró en el huerto. Fue Marco, aunque probablemente sin intención: falta de información, no maldad. El clima y las coartadas descartan otras causas.'
    },
    {
      title: 'El perfil falso', icon: '📱',
      intro: 'Apareció un perfil anónimo que publica burlas sobre el grupo. Orientación necesita saber quién lo creó para detener el acoso y mediar.',
      suspects: [{ id: 'daniel', n: 'Daniel', d: 'Grupo 102' }, { id: 'karla', n: 'Karla', d: 'Grupo 102' }, { id: 'emilio', n: 'Emilio', d: 'Grupo 102' }],
      evidence: [
        { id: 'router', icon: '📡', t: 'Registro del router', x: 'La cuenta se creó desde la red WiFi del plantel el jueves a las 16:40.' },
        { id: 'lista', icon: '📋', t: 'Asistencia del taller vespertino', x: 'El jueves a las 16:40 seguían en el plantel Karla y Emilio. Daniel salió a las 14:00.' },
        { id: 'meta', icon: '🖼️', t: 'Metadatos de la foto de perfil', x: 'La imagen se tomó con un celular modelo "Nova X".' },
        { id: 'inventario', icon: '📦', t: 'Inventario de Cultura Digital', x: 'Para la práctica de seguridad, cada alumno registró su celular: Karla usa un "Lumen 5" y Emilio un "Nova X".' },
        { id: 'correo', icon: '✉️', t: 'Correo de recuperación', x: 'El perfil tiene como correo de recuperación "e.********@correo.com".' },
        { id: 'rumor', icon: '💬', t: 'Rumor en el pasillo', x: '"Seguro fue Daniel, siempre anda con el celular". (Opinión sin pruebas)' }
      ],
      culprit: 'emilio', key: ['meta', 'inventario', 'correo'],
      solution: 'Daniel ya no estaba en el plantel. Entre Karla y Emilio, solo Emilio tiene un "Nova X", el modelo de la foto, y el correo empieza con "e". El rumor no es evidencia: sin pruebas es solo una opinión. El caso se atiende con mediación y orientación, no con más burlas.'
    },
    {
      title: 'El trofeo desaparecido', icon: '🏆',
      intro: 'El trofeo de básquetbol desapareció de la vitrina entre las 7:00 y las 7:30. La vitrina estaba cerrada con llave y no fue forzada.',
      suspects: [{ id: 'ana', n: 'Ana', d: 'Capitana del equipo' }, { id: 'bruno', n: 'Bruno', d: 'Intendente' }, { id: 'carla', n: 'Carla', d: 'Jugadora del equipo' }],
      evidence: [
        { id: 'camara', icon: '🎥', t: 'Cámara del pasillo', x: 'A las 7:12 pasa una persona con chamarra amarilla del equipo de básquetbol cargando una caja.' },
        { id: 'chamarras', icon: '🧥', t: 'Lista de uniformes', x: 'Solo Ana y Carla tienen la chamarra amarilla del equipo.' },
        { id: 'entrada', icon: '🪪', t: 'Registro de entrada', x: 'Ana pasó su credencial en la puerta principal a las 7:25.' },
        { id: 'llave', icon: '🔑', t: 'Libreta de llaves', x: 'A las 7:05 Carla pidió la llave de la vitrina en la oficina de deportes "para sacar balones".' },
        { id: 'supervision', icon: '🧽', t: 'Reporte de supervisión', x: 'Bruno trapeó el segundo piso de 7:00 a 8:00; la supervisora estuvo con él.' },
        { id: 'anuario', icon: '📸', t: 'Aviso del anuario', x: 'La foto oficial del equipo para el anuario estaba programada a las 7:40 en el patio.' }
      ],
      culprit: 'carla', key: ['llave', 'camara', 'chamarras'],
      solution: 'Bruno tiene coartada y Ana llegó hasta las 7:25. Carla pidió la llave a las 7:05 y la cámara muestra la chamarra amarilla a las 7:12. Probablemente lo tomó para la foto del anuario: fue un préstamo sin permiso, no un robo, pero debió avisar.'
    }
  ];
  AR.CASES = CASES;
  AR.register({
    id: 'detective', num: '09', name: 'DETECTIVE 404', icon: '🕵️', category: 'Investigación', difficulty: 3, levels: false, xpPer: 40,
    c1: '#6366f1', c2: '#22d3ee',
    desc: 'Casos originales en el plantel: examina evidencias, descarta coartadas y señala al responsable con pruebas.',
    howTo: ['Toca las carpetas de evidencia para examinarlas.', 'Cuando tengas una teoría, presiona ACUSAR: elige al responsable Y la evidencia que lo demuestra.', 'Solo puedes citar evidencias que ya examinaste. Tienes 2 intentos por caso.', 'Resuelve 3 casos; ganas si resuelves al menos 2. Menos tiempo y menos errores = más puntos.'],
    art: art('detective', '#6366f1', '#22d3ee', '<circle cx="85" cy="55" r="28"/><line x1="105" y1="75" x2="140" y2="105" stroke-width="7"/><text x="85" y="66" text-anchor="middle" font-size="30" font-family="Orbitron,sans-serif" fill="url(#ga-detective)" stroke="none">?</text>'),
    create: function (ctx) {
      var list = U.shuffle(CASES).slice(0, 3), ci = 0, score = 0, solved = 0, perfectCase = false, c, seen, tries, caseStart, timerId;
      function hud() { ctx.hud({ score: score, level: ci + 1, combo: solved, comboLabel: 'RESUELTOS', lives: c ? 2 - tries : null, maxLives: 2, progress: ci / list.length, label: 'Caso ' + Math.min(ci + 1, list.length) + ' de ' + list.length + ' · evidencias examinadas: ' + (seen ? Object.keys(seen).length : 0), time: c ? Math.round((Date.now() - caseStart) / 1000) + ' s' : null }); }
      function load() {
        c = list[ci]; seen = {}; tries = 0; caseStart = Date.now();
        ctx.root.innerHTML = '<div class="dt-wrap"><div class="dt-case glass"><div class="dt-stamp">CASO #' + (404 + ci) + '</div><h3>' + c.icon + ' ' + esc(c.title) + '</h3><p>' + esc(c.intro) + '</p></div>' +
          '<div class="dt-cols"><div><div class="side-title">SOSPECHOSOS</div><div class="dt-suspects">' + c.suspects.map(function (s) { return '<div class="dt-sus"><div class="dt-face">' + s.n.charAt(0) + '</div><b>' + esc(s.n) + '</b><small>' + esc(s.d) + '</small></div>'; }).join('') + '</div>' +
          '<div class="side-title">EVIDENCIAS</div><div class="dt-evs">' + c.evidence.map(function (e) { return '<button class="dt-ev" data-ev="' + e.id + '"><span class="dt-ev-front">📁<small>' + esc(e.t) + '</small></span><span class="dt-ev-back">' + e.icon + ' <b>' + esc(e.t) + '</b><br>' + esc(e.x) + '</span></button>'; }).join('') + '</div></div>' +
          '<div class="dt-note glass"><div class="side-title">LIBRETA DEL DETECTIVE</div><div id="dt-notes" class="dt-notes"><p class="muted">Examina evidencias: aquí se anotarán.</p></div><button class="btn btn-primary wide" id="dt-accuse">⚖ ACUSAR</button></div></div></div>';
        ctx.root.querySelectorAll('[data-ev]').forEach(function (b) { ctx.on(b, 'click', function () { examine(b.getAttribute('data-ev'), b); }); });
        ctx.on(ctx.root.querySelector('#dt-accuse'), 'click', accuseUI);
        hud();
      }
      function examine(id, b) {
        if (seen[id]) return; seen[id] = true; b.classList.add('open'); ctx.sfx('whoosh');
        var e = c.evidence.find(function (x) { return x.id === id; });
        var notes = ctx.root.querySelector('#dt-notes');
        if (Object.keys(seen).length === 1) notes.innerHTML = '';
        notes.insertAdjacentHTML('beforeend', '<div class="dt-line">' + e.icon + ' <b>' + esc(e.t) + ':</b> ' + esc(e.x) + '</div>');
        hud();
      }
      function accuseUI() {
        var ex = c.evidence.filter(function (e) { return seen[e.id]; });
        if (!ex.length) { ctx.toast('Primero examina al menos una evidencia.', 'warn'); return; }
        ctx.paused = true;
        NV.UI.modal({ title: '⚖ ACUSACIÓN', html: '<p>¿Quién es responsable?</p><div class="dt-pick">' + c.suspects.map(function (s) { return '<label class="toggle"><input type="radio" name="dt-s" value="' + s.id + '"><span class="tg"></span>' + esc(s.n) + '</label>'; }).join('') + '</div><p>¿Qué evidencia lo demuestra mejor?</p><div class="dt-pick">' + ex.map(function (e) { return '<label class="toggle"><input type="radio" name="dt-e" value="' + e.id + '"><span class="tg"></span>' + e.icon + ' ' + esc(e.t) + '</label>'; }).join('') + '</div>',
          buttons: [{ label: 'Seguir investigando', value: null, cls: 'btn-ghost' }, { label: 'ACUSAR', cls: 'btn-primary', collect: function (box) { var s = box.querySelector('[name=dt-s]:checked'), e = box.querySelector('[name=dt-e]:checked'); return { s: s && s.value, e: e && e.value }; } }] })
          .then(function (v) { ctx.paused = false; if (v) accuse(v.s, v.e); });
      }
      function accuse(s, e) {
        if (!s || !e) { ctx.toast('Elige un sospechoso y una evidencia.', 'warn'); return; }
        if (!seen[e]) { ctx.toast('Solo puedes citar evidencias examinadas.', 'warn'); return; }
        var ok = s === c.culprit && c.key.indexOf(e) >= 0;
        if (ok) {
          var secs = Math.round((Date.now() - caseStart) / 1000);
          var gain = Math.max(300, 1000 - tries * 300 - Math.max(0, secs - 60) * 3);
          score += gain; solved++; if (tries === 0) perfectCase = true;
          ctx.sfx('victory'); NV.UI.confetti(60);
          NV.UI.alert('✔ ¡CASO RESUELTO! +' + gain, '<p>' + esc(c.solution) + '</p>').then(nextCase);
        } else {
          tries++; ctx.sfx('wrong'); ctx.shake();
          var why = s !== c.culprit ? 'Las evidencias no señalan a esa persona. Revisa las coartadas.' : 'La persona es correcta, pero esa evidencia no lo demuestra por sí sola.';
          if (tries >= 2) { NV.UI.alert('✖ CASO SIN RESOLVER', '<p>' + why + '</p><p><b>Solución:</b> ' + esc(c.solution) + '</p>').then(nextCase); }
          else { ctx.toast('✖ ' + why + ' (te queda 1 intento)', 'warn'); }
        }
        hud();
      }
      function nextCase() {
        ci++;
        if (ci >= list.length) { c = null; ctx.end({ score: score, win: solved >= 2, message: 'Resolviste ' + solved + ' de ' + list.length + ' casos.', stats: { 'Casos resueltos': solved + '/' + list.length }, achievements: perfectCase ? ['a_detective'] : [] }); return; }
        load();
      }
      timerId = ctx.every(1000, hud);
      load();
      return { test: { solve: function (wrong) {
        c.evidence.forEach(function (e) { var b = ctx.root.querySelector('[data-ev="' + e.id + '"]'); if (b) examine(e.id, b); });
        if (wrong) accuse(c.suspects.find(function (s) { return s.id !== c.culprit; }).id, c.evidence[0].id);
        else accuse(c.culprit, c.key[0]);
      }, state: function () { return { ci: ci, solved: solved, score: score }; } } };
    }
  });

  /* =====================================================================
     10 · NEON RACE — carreras arcade con compuertas de conocimiento
     ===================================================================== */
  AR.register({
    id: 'race', num: '10', name: 'NEON RACE', icon: '🏎️', category: 'Carreras', difficulty: 3, levels: true, xpPer: 60,
    c1: '#22d3ee', c2: '#f472b6',
    desc: 'Carrera a toda velocidad contra 3 rivales. Atraviesa la compuerta correcta (VERDADERO / FALSO) para obtener TURBO.',
    howTo: ['Dirige con ← → (o A / D) o tocando los botones. ↓ frena. ESPACIO o el botón usa NITRO.', 'Recoge orbes de energía para llenar el nitro. Esquiva barreras y manchas de aceite.', 'En las COMPUERTAS DE CONOCIMIENTO pasa por el lado de la respuesta correcta: VERDADERO a la izquierda y FALSO a la derecha.', 'Termina en el podio (1° a 3°) para ganar.'],
    art: art('race', '#22d3ee', '#f472b6', '<path d="M70 115 L95 10 M130 115 L105 10" stroke-width="2"/><path d="M100 110 v-10 M100 85 v-10 M100 60 v-8" stroke-dasharray="1"/><path d="M88 96 l12 -26 l12 26 z" fill="url(#ga-race)"/>'),
    create: function (ctx) {
      var L = ctx.level, W = 480, H = 720, ROAD_L = 60, ROAD_R = 420, LEN = 5200 + L * 800;
      var car = { x: 240, speed: 0, max: 520 + L * 20, dist: 0, nitro: 40, boost: 0, stun: 0 }, steer = 0, brake = false;
      var rivals = [{ n: 'VÉRTICE', c: '#f472b6', v: 0.9 + L * 0.012 }, { n: 'PULSAR', c: '#facc15', v: 0.86 + L * 0.012 }, { n: 'ÓRBITA', c: '#10b981', v: 0.82 + L * 0.012 }].map(function (r, i) { return { n: r.n, c: r.c, v: r.v, dist: -40 - i * 50, x: 110 + i * 120, wob: Math.random() * 6 }; });
      var objs = [], gates = [], gateCorrect = 0, gateTotal = 0, orbs = 0, crashes = 0, time = 0, finished = false, auto = false, score = 0;
      // Genera la pista: obstáculos, orbes, impulsos y compuertas
      (function () {
        for (var d = 500; d < LEN - 300; d += U.rnd(130, 230) - L * 6) {
          var r = Math.random();
          objs.push({ d: d, x: U.rnd(ROAD_L + 30, ROAD_R - 30), type: r < 0.42 ? 'barrier' : r < 0.58 ? 'oil' : r < 0.85 ? 'orb' : 'pad' });
        }
        var facts = U.shuffle(NV.RAPID);
        for (var gd = 1100, k = 0; gd < LEN - 400; gd += 1300, k++) {
          gates.push({ d: gd, f: facts[k % facts.length], done: false });
          objs = objs.filter(function (o) { return Math.abs(o.d - gd) > 160; });
        }
      })();
      ctx.root.innerHTML = '<div class="nr-wrap"><div class="nr-box"></div><div class="nr-ctrl"><button data-c="left">◀</button><button data-c="nitro">🔥 NITRO</button><button data-c="brake">■</button><button data-c="right">▶</button></div></div>';
      var cv = U.canvas(ctx.root.querySelector('.nr-box'), W, H), g = cv.getContext('2d');
      function position() { return 1 + rivals.filter(function (r) { return r.dist > car.dist; }).length; }
      function hud() { ctx.hud({ score: score, level: L, combo: position() + '° / 4', comboLabel: 'POSICIÓN', lives: null, time: Math.round(time) + ' s', progress: Math.min(1, car.dist / LEN), label: Math.round(car.dist) + ' / ' + LEN + ' m · ' + Math.round(car.speed / 4) + ' km/h · nitro ' + Math.round(car.nitro) + '%' }); }
      function update(dt) {
        if (finished) return;
        time += dt;
        if (auto) autopilot();
        var target = car.max * (car.boost > 0 ? 1.45 : 1) * (car.stun > 0 ? 0.45 : 1) * (brake ? 0.5 : 1);
        car.speed += (target - car.speed) * Math.min(1, dt * (car.speed < target ? 0.9 : 3));
        car.x += steer * 330 * dt; car.x = Math.max(ROAD_L + 18, Math.min(ROAD_R - 18, car.x));
        car.dist += car.speed * dt * 0.5; car.boost = Math.max(0, car.boost - dt); car.stun = Math.max(0, car.stun - dt);
        rivals.forEach(function (r) { r.dist += car.max * r.v * dt * 0.5 * (0.97 + Math.sin(time * 0.7 + r.wob) * 0.05); r.x += Math.sin(time * 1.3 + r.wob) * 30 * dt; });
        objs.forEach(function (o) {
          if (o.hit || Math.abs(o.d - car.dist) > 14) return;
          if (Math.abs(o.x - car.x) < (o.type === 'oil' ? 34 : 30)) {
            o.hit = true;
            if (o.type === 'barrier') { car.stun = 1.1; crashes++; ctx.sfx('hit'); ctx.shake(cv); ctx.flash('rgba(239,68,68,.3)'); }
            else if (o.type === 'oil') { car.stun = 0.6; car.x += U.pick([-60, 60]); ctx.sfx('wrong'); }
            else if (o.type === 'orb') { car.nitro = Math.min(100, car.nitro + 20); orbs++; score += 50; ctx.sfx('power'); }
            else { car.boost = Math.max(car.boost, 1.2); ctx.sfx('laser'); }
          }
        });
        gates.forEach(function (gt) {
          if (gt.done || car.dist < gt.d) return;
          gt.done = true; gateTotal++;
          var saidTrue = car.x < (ROAD_L + ROAD_R) / 2;
          if (saidTrue === gt.f.a) { gateCorrect++; car.boost = 3; score += 300; ctx.sfx('correct'); ctx.toast('🔥 ¡TURBO! Correcto: ' + esc(gt.f.e), 'ok'); }
          else { car.stun = 0.8; ctx.sfx('wrong'); ctx.toast('✖ Era ' + (gt.f.a ? 'VERDADERO' : 'FALSO') + ': ' + esc(gt.f.e), 'warn'); }
        });
        if (car.dist >= LEN) {
          finished = true;
          var pos = position(); score += (5 - pos) * 1000 + Math.max(0, Math.round(200 - time)) * 5;
          ctx.sfx(pos <= 3 ? 'victory' : 'defeat');
          ctx.end({ score: score, win: pos <= 3, level: L + (pos === 1 ? 1 : 0), message: pos === 1 ? '¡PRIMER LUGAR! Eres el piloto más rápido del Neuroverse.' : 'Terminaste en ' + pos + '° lugar.', stats: { 'Posición': pos + '°', 'Tiempo': Math.round(time) + ' s', 'Compuertas correctas': gateCorrect + '/' + gateTotal, 'Choques': crashes, 'Orbes': orbs }, achievements: pos === 1 ? ['a_race'] : [] });
        }
        if (Math.random() < 0.12) hud();
      }
      function autopilot() {
        // Piloto automático de pruebas: busca la compuerta correcta y esquiva barreras
        var tx = car.x, gt = gates.find(function (x) { return !x.done && x.d - car.dist < 400; });
        if (gt) tx = gt.f.a ? 140 : 340;
        else { var ob = objs.find(function (o) { return !o.hit && o.d > car.dist && o.d - car.dist < 220 && (o.type === 'barrier' || o.type === 'oil') && Math.abs(o.x - car.x) < 50; }); if (ob) tx = ob.x > 240 ? ob.x - 110 : ob.x + 110; }
        steer = Math.abs(tx - car.x) < 8 ? 0 : tx > car.x ? 1 : -1;
        if (car.nitro >= 30 && car.boost <= 0) useNitro();
      }
      function useNitro() { if (car.nitro < 30 || finished) return; car.nitro -= 30; car.boost = Math.max(car.boost, 1.6); ctx.sfx('laser'); }
      function render() {
        var camY = H - 140, scale = 1; // la cámara sigue al auto del jugador
        g.fillStyle = '#05031a'; g.fillRect(0, 0, W, H);
        // ciudad lateral
        for (var i = 0; i < 14; i++) { var by = ((i * 90 + car.dist * 0.6) % (H + 90)) - 90; g.fillStyle = i % 2 ? 'rgba(168,85,247,.25)' : 'rgba(34,211,238,.18)'; g.fillRect(4, by, 40, 70); g.fillRect(W - 44, (by + 45) % H, 40, 60); }
        // pista
        g.fillStyle = '#0c0a2c'; g.fillRect(ROAD_L, 0, ROAD_R - ROAD_L, H);
        U.glow(g, '#22d3ee', 16); g.strokeStyle = '#22d3ee'; g.lineWidth = 4; g.beginPath(); g.moveTo(ROAD_L, 0); g.lineTo(ROAD_L, H); g.moveTo(ROAD_R, 0); g.lineTo(ROAD_R, H); g.stroke(); U.glow(g, 'transparent', 0);
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; g.setLineDash([30, 40]); g.lineDashOffset = -car.dist * 1.0;
        [180, 300].forEach(function (x) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }); g.setLineDash([]);
        // líneas de velocidad
        if (car.boost > 0) { g.strokeStyle = 'rgba(250,204,21,.4)'; for (var s = 0; s < 12; s++) { var lx = ROAD_L + Math.random() * (ROAD_R - ROAD_L), ly = Math.random() * H; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx, ly + 60); g.stroke(); } }
        function sy(d) { return camY - (d - car.dist); }
        // meta
        var fy = sy(LEN); if (fy > -40 && fy < H) { for (var q = 0; q < 12; q++) { g.fillStyle = q % 2 ? '#fff' : '#000'; g.fillRect(ROAD_L + q * 30, fy, 30, 14); g.fillStyle = q % 2 ? '#000' : '#fff'; g.fillRect(ROAD_L + q * 30, fy + 14, 30, 14); } }
        // compuertas
        gates.forEach(function (gt) {
          var y = sy(gt.d); if (y < -120 || y > H + 40) return;
          g.fillStyle = 'rgba(34,197,94,.18)'; g.fillRect(ROAD_L, y - 20, (ROAD_R - ROAD_L) / 2, 40); g.fillStyle = 'rgba(239,68,68,.18)'; g.fillRect(240, y - 20, (ROAD_R - ROAD_L) / 2, 40);
          U.glow(g, '#a855f7', 14); g.fillStyle = '#a855f7'; g.fillRect(ROAD_L, y - 24, ROAD_R - ROAD_L, 4); U.glow(g, 'transparent', 0);
          g.font = '700 16px Orbitron, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#86efac'; g.fillText('VERDADERO', 150, y + 6); g.fillStyle = '#fca5a5'; g.fillText('FALSO', 330, y + 6);
          if (!gt.done && y > 0) { g.fillStyle = 'rgba(10,8,36,.92)'; g.fillRect(20, y - 100, W - 40, 60); g.strokeStyle = '#a855f7'; g.strokeRect(20, y - 100, W - 40, 60); g.fillStyle = '#fff'; g.font = '600 15px "Exo 2", sans-serif'; wrap(gt.f.t, W / 2, y - 76, W - 60, 18); }
        });
        // objetos
        objs.forEach(function (o) {
          if (o.hit) return; var y = sy(o.d); if (y < -30 || y > H + 30) return;
          if (o.type === 'barrier') { U.glow(g, '#ef4444', 14); g.fillStyle = '#ef4444'; g.fillRect(o.x - 26, y - 8, 52, 16); g.fillStyle = '#fff'; g.fillRect(o.x - 20, y - 2, 40, 4); }
          else if (o.type === 'oil') { g.fillStyle = 'rgba(15,15,30,.95)'; U.glow(g, '#6366f1', 10); g.beginPath(); g.ellipse(o.x, y, 28, 14, 0, 0, 7); g.fill(); }
          else if (o.type === 'orb') { U.glow(g, '#22d3ee', 18); g.fillStyle = '#22d3ee'; g.beginPath(); g.arc(o.x, y, 10 + Math.sin(time * 8) * 2, 0, 7); g.fill(); }
          else { U.glow(g, '#facc15', 16); g.fillStyle = '#facc15'; g.beginPath(); g.moveTo(o.x, y - 18); g.lineTo(o.x + 18, y + 10); g.lineTo(o.x - 18, y + 10); g.fill(); }
        });
        U.glow(g, 'transparent', 0);
        rivals.forEach(function (r) { drawCar(r.x, sy(r.dist), r.c, false); });
        drawCar(car.x, camY, car.stun > 0 && Math.floor(time * 20) % 2 ? '#64748b' : '#a855f7', true);
        // mini ranking
        g.fillStyle = 'rgba(5,3,26,.8)'; g.fillRect(W - 150, 8, 142, 92); g.font = '700 12px Orbitron, sans-serif'; g.textAlign = 'left';
        rivals.concat([{ n: 'TÚ', c: '#a855f7', dist: car.dist }]).sort(function (a, b) { return b.dist - a.dist; }).forEach(function (r, i) { g.fillStyle = r.c; g.fillText((i + 1) + '. ' + r.n, W - 140, 28 + i * 20); });
        // nitro
        g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(12, H - 24, 150, 10); g.fillStyle = '#facc15'; g.fillRect(12, H - 24, 1.5 * car.nitro, 10);
      }
      function wrap(text, x, y, max, lh) { var words = text.split(' '), line = '', yy = y; words.forEach(function (w) { var t = line + w + ' '; if (g.measureText(t).width > max && line) { g.fillText(line, x, yy); line = w + ' '; yy += lh; } else line = t; }); g.fillText(line, x, yy); }
      function drawCar(x, y, c, me) {
        if (y < -60 || y > H + 60) return;
        U.glow(g, c, me ? 24 : 14); g.fillStyle = c;
        g.beginPath(); g.moveTo(x, y - 34); g.lineTo(x + 18, y + 10); g.lineTo(x + 14, y + 26); g.lineTo(x - 14, y + 26); g.lineTo(x - 18, y + 10); g.closePath(); g.fill();
        g.fillStyle = '#e0f2fe'; g.fillRect(x - 7, y - 8, 14, 10);
        if (me && car.boost > 0) { g.fillStyle = '#facc15'; g.beginPath(); g.moveTo(x - 9, y + 26); g.lineTo(x, y + 52 + Math.random() * 14); g.lineTo(x + 9, y + 26); g.fill(); }
        U.glow(g, 'transparent', 0);
      }
      var keys = {};
      function upd() { steer = (keys.r ? 1 : 0) - (keys.l ? 1 : 0); brake = !!keys.b; }
      ctx.on(document, 'keydown', function (e) {
        if (['ArrowLeft', 'a', 'A'].indexOf(e.key) >= 0) keys.l = 1; else if (['ArrowRight', 'd', 'D'].indexOf(e.key) >= 0) keys.r = 1; else if (['ArrowDown', 's', 'S'].indexOf(e.key) >= 0) keys.b = 1; else if (e.key === ' ' || e.key === 'ArrowUp') useNitro(); else return;
        e.preventDefault(); upd();
      });
      ctx.on(document, 'keyup', function (e) { if (['ArrowLeft', 'a', 'A'].indexOf(e.key) >= 0) keys.l = 0; if (['ArrowRight', 'd', 'D'].indexOf(e.key) >= 0) keys.r = 0; if (['ArrowDown', 's', 'S'].indexOf(e.key) >= 0) keys.b = 0; upd(); });
      ctx.root.querySelectorAll('[data-c]').forEach(function (b) {
        var c = b.getAttribute('data-c');
        ctx.on(b, 'pointerdown', function (e) { e.preventDefault(); if (c === 'nitro') useNitro(); else { keys[c === 'left' ? 'l' : c === 'right' ? 'r' : 'b'] = 1; upd(); } });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { ctx.on(b, ev, function () { if (c !== 'nitro') { keys[c === 'left' ? 'l' : c === 'right' ? 'r' : 'b'] = 0; upd(); } }); });
      });
      ctx.loop(function (dt) { update(dt); render(); });
      hud(); render();
      return { test: { autopilot: function (on) { auto = on !== false; }, tick: function (s) { for (var i = 0; i < s * 30; i++) update(1 / 30); }, state: function () { return { dist: car.dist, LEN: LEN, pos: position(), gates: gateCorrect + '/' + gateTotal, crashes: crashes, finished: finished }; } } };
    }
  });
})();
