/* ============================================================
   NEUROVERSE ARCADE — Minijuegos 01 a 05
   01 BRAIN RUSH · 02 MEMORY GLITCH · 03 WORD HACKER
   04 CYBER MAZE · 05 ELEMENTAL
   ============================================================ */
(function () {
  var AR = NV.Arcade, U = AR.U, esc = NV.UI.esc, fmt = NV.UI.fmt;

  // Ilustración SVG de cada tarjeta (original, generada con formas)
  function art(id, c1, c2, inner) {
    return '<svg class="arc-svg" viewBox="0 0 200 120" aria-hidden="true"><defs><linearGradient id="ga-' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>' +
      '<filter id="gf-' + id + '"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      '<rect width="200" height="120" fill="#0a0824"/><g opacity=".18" stroke="' + c2 + '">' + [20, 40, 60, 80, 100].map(function (y) { return '<line x1="0" y1="' + y + '" x2="200" y2="' + y + '"/>'; }).join('') + '</g>' +
      '<g filter="url(#gf-' + id + ')" fill="none" stroke="url(#ga-' + id + ')" stroke-width="3">' + inner + '</g></svg>';
  }
  AR.art = art;

  /* =====================================================================
     01 · BRAIN RUSH — velocidad matemática
     ===================================================================== */
  function makeOp(L) {
    var r = U.rnd, types = ['add', 'sub'];
    if (L >= 2) types.push('mul'); if (L >= 3) types.push('div'); if (L >= 4) types.push('pct'); if (L >= 5) types.push('eq');
    var t = U.pick(types), big = L >= 6 ? 3 : 1, a, b, x;
    if (t === 'add') { a = r(2, 20 * big + L * 5); b = r(2, 20 * big + L * 5); return { q: a + ' + ' + b, a: a + b }; }
    if (t === 'sub') { a = r(10, 30 * big + L * 5); b = r(1, a); return { q: a + ' − ' + b, a: a - b }; }
    if (t === 'mul') { a = r(2, 9 + L); b = r(2, 9 + (L > 4 ? 3 : 0)); return { q: a + ' × ' + b, a: a * b }; }
    if (t === 'div') { b = r(2, 9 + (L > 4 ? 3 : 0)); x = r(2, 10 + L); return { q: (b * x) + ' ÷ ' + b, a: x }; }
    if (t === 'pct') { var p = U.pick([10, 20, 25, 50]); a = r(1, 10 + L) * 20; return { q: p + '% de ' + a, a: a * p / 100 }; }
    x = r(1, 12); a = r(2, 6); b = r(1, 20);
    return { q: a + 'x + ' + b + ' = ' + (a * x + b) + '  →  x', a: x };
  }
  AR.makeOp = makeOp;

  AR.register({
    id: 'brain', num: '01', name: 'BRAIN RUSH', icon: '🧮', category: 'Matemáticas', difficulty: 3, levels: true, xpPer: 25,
    c1: '#8b5cf6', c2: '#22d3ee',
    desc: 'Velocidad matemática extrema: resuelve operaciones antes de que el reloj se agote.',
    howTo: ['Escribe el resultado con el teclado numérico en pantalla o con tu teclado y presiona OK / Enter.', 'Cada 5 aciertos subes de nivel: aparecen ×, ÷, porcentajes y ecuaciones.', 'Rachas de 3, 6 y 10 multiplican tus puntos ×2, ×3 y ×4.', 'Tienes 3 vidas. ¡Supera el nivel 8 para ganar!'],
    art: art('brain', '#8b5cf6', '#22d3ee', '<text x="100" y="78" text-anchor="middle" font-size="54" font-family="Orbitron,sans-serif" font-weight="900" fill="url(#ga-brain)" stroke="none">7×8</text><circle cx="100" cy="60" r="52" stroke-dasharray="8 6"/>'),
    create: function (ctx) {
      var L = ctx.level, lives = 3, score = 0, streak = 0, inLevel = 0, PER = 5, op, input = '', locked = false, best = 0, correct = 0, wrong = 0;
      ctx.root.innerHTML = '<div class="br-wrap"><div class="br-qtimer"><i></i></div><div class="br-q" id="br-q"></div><div class="br-input" id="br-in">_</div>' +
        '<div class="br-pad">' + ['7', '8', '9', '4', '5', '6', '1', '2', '3', '−', '0', '⌫'].map(function (k) { return '<button class="br-key" data-k="' + k + '">' + k + '</button>'; }).join('') + '<button class="br-key ok" data-k="OK">OK</button></div></div>';
      var qEl = ctx.root.querySelector('#br-q'), inEl = ctx.root.querySelector('#br-in'), bar = ctx.root.querySelector('.br-qtimer i');
      var qTime = 0, qLeft = 0;
      function mult() { return streak >= 10 ? 4 : streak >= 6 ? 3 : streak >= 3 ? 2 : 1; }
      function hud() { ctx.hud({ score: score, level: L, combo: streak + (mult() > 1 ? ' ×' + mult() : ''), lives: lives, maxLives: 3, progress: inLevel / PER, label: 'Nivel ' + L + ': ' + inLevel + '/' + PER + ' aciertos', time: qLeft }); }
      function next() {
        op = makeOp(L); input = ''; locked = false;
        qTime = Math.max(4, 12 - L * 0.9); qLeft = qTime;
        qEl.textContent = op.q; qEl.classList.remove('in'); void qEl.offsetWidth; qEl.classList.add('in');
        inEl.textContent = '_'; inEl.className = 'br-input'; hud();
      }
      function submit() {
        if (locked || input === '' || input === '-') return;
        locked = true;
        var ok = Number(input) === op.a;
        if (ok) {
          streak++; correct++; best = Math.max(best, streak); inLevel++;
          var gain = 10 * L * mult(); score += gain;
          ctx.sfx('correct'); inEl.classList.add('good'); ctx.floatAt(inEl, '+' + gain, 'plus'); ctx.burstAt(inEl);
          if (inLevel >= PER) {
            inLevel = 0; L++;
            if (L > 8) { hud(); ctx.end({ score: score, win: true, level: L - 1, message: '¡Dominaste las 8 velocidades de Brain Rush!', stats: stats() }); return; }
            ctx.sfx('achievement'); ctx.toast('⚡ ¡NIVEL ' + L + '! ' + ({ 2: 'Llegan las multiplicaciones', 3: 'Llegan las divisiones', 4: 'Llegan los porcentajes', 5: 'Llegan las ecuaciones' }[L] || 'Más rápido'), 'power');
          }
          ctx.after(350, next);
        } else fail('✖ Era ' + op.a);
        hud();
      }
      function fail(msg) {
        locked = true; streak = 0; lives--; wrong++;
        ctx.sfx('wrong'); ctx.shake(qEl); inEl.classList.add('bad'); inEl.textContent = msg; hud();
        if (lives <= 0) { ctx.after(700, function () { ctx.end({ score: score, win: false, level: L, message: 'Te quedaste sin vidas en el nivel ' + L + '.', stats: stats() }); }); return; }
        ctx.after(900, next);
      }
      function stats() { return { 'Aciertos': correct, 'Errores': wrong, 'Mejor racha': best, 'Nivel alcanzado': Math.min(L, 8) }; }
      function key(k) {
        if (locked) return;
        if (k === 'OK') return submit();
        if (k === '⌫') input = input.slice(0, -1);
        else if (k === '−') { if (!input) input = '-'; }
        else if (input.length < 6) input += k;
        inEl.textContent = input || '_'; ctx.sfx('click');
      }
      ctx.root.querySelectorAll('[data-k]').forEach(function (b) { ctx.on(b, 'click', function () { key(b.getAttribute('data-k')); }); });
      ctx.on(document, 'keydown', function (e) {
        if (/^[0-9]$/.test(e.key)) key(e.key);
        else if (e.key === 'Backspace') key('⌫');
        else if (e.key === '-') key('−');
        else if (e.key === 'Enter') key('OK');
        else return; e.preventDefault();
      });
      ctx.every(100, function () {
        if (locked) return;
        qLeft = Math.max(0, qLeft - 0.1); bar.style.width = (qLeft / qTime * 100) + '%'; ctx.hud({ time: qLeft });
        if (qLeft <= 0) fail('⏰ Era ' + op.a);
      });
      next();
      return { test: { answer: function () { return op.a; }, type: function (v) { String(v).split('').forEach(function (c) { key(c === '-' ? '−' : c); }); key('OK'); }, state: function () { return { L: L, lives: lives, score: score, locked: locked }; } } };
    }
  });

  /* =====================================================================
     02 · MEMORY GLITCH — secuencias de luces, símbolos y colores
     ===================================================================== */
  var PADS = [
    { c: '#a855f7', s: '◆', f: 262 }, { c: '#22d3ee', s: '●', f: 294 }, { c: '#3b82f6', s: '▲', f: 330 },
    { c: '#f472b6', s: '★', f: 349 }, { c: '#facc15', s: '✚', f: 392 }, { c: '#10b981', s: '■', f: 440 },
    { c: '#f97316', s: '✦', f: 494 }, { c: '#6366f1', s: '⬟', f: 523 }, { c: '#e11d48', s: '♥', f: 587 }
  ];
  AR.register({
    id: 'memory', num: '02', name: 'MEMORY GLITCH', icon: '🧠', category: 'Memoria', difficulty: 3, levels: true, xpPer: 25,
    c1: '#f472b6', c2: '#a855f7',
    desc: 'El sistema parpadea una secuencia de luces, símbolos y colores. Repítela sin fallar.',
    howTo: ['Observa la secuencia: cada panel se ilumina y suena.', 'Repítela tocando los paneles (o teclas 1–9).', 'Cada nivel agrega un paso. Desde el nivel 4 los paneles muestran símbolos y desde el nivel 6 ¡cambian de lugar! (recuerda el símbolo, no la posición).', '3 vidas. Supera el nivel 10 para ganar.'],
    art: art('memory', '#f472b6', '#a855f7', [0, 1, 2].map(function (r) { return [0, 1, 2].map(function (c) { return '<rect x="' + (55 + c * 32) + '" y="' + (12 + r * 32) + '" width="26" height="26" rx="5" ' + ((r + c) % 3 === 0 ? 'fill="url(#ga-memory)"' : '') + '/>'; }).join(''); }).join('')),
    create: function (ctx) {
      var L = ctx.level, lives = 3, score = 0, seq = [], pos = 0, phase = 'show', order = [0, 1, 2, 3, 4, 5, 6, 7, 8], best = 0;
      ctx.root.innerHTML = '<div class="mg-wrap"><div class="mg-status" id="mg-st">OBSERVA</div><div class="mg-grid" id="mg-grid"></div></div>';
      var grid = ctx.root.querySelector('#mg-grid'), stEl = ctx.root.querySelector('#mg-st');
      function draw() {
        grid.innerHTML = order.map(function (pi, slot) {
          var p = PADS[pi];
          return '<button class="mg-pad" data-slot="' + slot + '" style="--pc:' + p.c + '"><span>' + (L >= 4 ? p.s : '') + '</span><small>' + (slot + 1) + '</small></button>';
        }).join('');
        grid.querySelectorAll('.mg-pad').forEach(function (b) { ctx.on(b, 'pointerdown', function (e) { e.preventDefault(); press(+b.getAttribute('data-slot')); }); });
      }
      function padEl(pi) { return grid.querySelector('[data-slot="' + order.indexOf(pi) + '"]'); }
      function light(pi, ms) {
        var b = padEl(pi); if (!b) return;
        b.classList.add('on'); ctx.tone(PADS[pi].f, ms / 1000, { type: 'triangle', vol: 0.22 });
        ctx.after(ms, function () { b.classList.remove('on'); });
      }
      function hud() { ctx.hud({ score: score, level: L, combo: pos + '/' + seq.length, comboLabel: 'PASO', lives: lives, maxLives: 3, progress: (L - 1) / 10, label: 'Nivel ' + L + ' de 10 · secuencia de ' + seq.length }); }
      function newLevel() {
        seq = []; for (var i = 0; i < L + 2; i++) seq.push(U.rnd(0, 8));
        show();
      }
      function show() {
        phase = 'show'; pos = 0; order = [0, 1, 2, 3, 4, 5, 6, 7, 8]; draw(); hud();
        stEl.textContent = 'OBSERVA LA SECUENCIA'; stEl.className = 'mg-status';
        var step = Math.max(260, 650 - L * 40);
        seq.forEach(function (pi, i) { ctx.after(600 + i * step, function () { light(pi, step * 0.7); }); });
        ctx.after(600 + seq.length * step + 200, function () {
          if (L >= 6) { order = U.shuffle(order); draw(); grid.classList.add('glitch-shuffle'); ctx.after(400, function () { grid.classList.remove('glitch-shuffle'); }); ctx.sfx('whoosh'); stEl.textContent = '¡GLITCH! LOS PANELES CAMBIARON · TU TURNO'; }
          else stEl.textContent = 'TU TURNO';
          stEl.classList.add('you'); phase = 'input';
        });
      }
      function press(slot) {
        if (phase !== 'input') return;
        var pi = order[slot];
        light(pi, 220);
        if (pi === seq[pos]) {
          pos++; score += 5 * L; hud();
          if (pos >= seq.length) {
            phase = 'done'; score += 50 * L; best = L; ctx.sfx('correct'); ctx.burstAt(grid);
            stEl.textContent = '✔ ¡SECUENCIA CORRECTA!'; L++; hud();
            if (L > 10) { ctx.after(600, function () { ctx.end({ score: score, win: true, level: 10, message: 'Memoria de élite: superaste los 10 niveles.', stats: { 'Nivel máximo': 10, 'Vidas restantes': lives } }); }); return; }
            ctx.after(900, newLevel);
          }
        } else {
          phase = 'done'; lives--; ctx.sfx('wrong'); ctx.shake(grid); stEl.textContent = '✖ ERROR EN LA SECUENCIA'; stEl.className = 'mg-status bad'; hud();
          if (lives <= 0) { ctx.after(800, function () { ctx.end({ score: score, win: false, level: L, message: 'El glitch te venció en el nivel ' + L + '.', stats: { 'Nivel alcanzado': L, 'Secuencia más larga': L + 1 } }); }); return; }
          ctx.after(1100, show);
        }
      }
      ctx.on(document, 'keydown', function (e) { if (/^[1-9]$/.test(e.key)) { press(+e.key - 1); e.preventDefault(); } });
      newLevel();
      return { test: { seq: function () { return seq.slice(); }, phase: function () { return phase; }, pressPad: function (pi) { press(order.indexOf(pi)); }, state: function () { return { L: L, lives: lives, score: score }; } } };
    }
  });

  /* =====================================================================
     03 · WORD HACKER — palabras desordenadas (español e inglés)
     ===================================================================== */
  var WORDS = [
    // [palabra, idioma, pista]
    ['NUBE', 'ES', 'Flota en el cielo y trae lluvia'], ['LIBRO', 'ES', 'Tiene páginas y se lee'], ['TIERRA', 'ES', 'Nuestro planeta'], ['ENERGIA', 'ES', 'Capacidad para realizar un trabajo'],
    ['CELULA', 'ES', 'Unidad básica de la vida'], ['ATOMO', 'ES', 'Partícula que forma la materia'], ['EMPATIA', 'ES', 'Ponerse en el lugar del otro'], ['RESPETO', 'ES', 'Valor básico de la convivencia'],
    ['HIPOTESIS', 'ES', 'Posible explicación que se pone a prueba'], ['GUELAGUETZA', 'ES', 'Gran fiesta oaxaqueña de julio'], ['ALGORITMO', 'ES', 'Secuencia de pasos para resolver un problema'], ['ECUACION', 'ES', 'Igualdad con una incógnita'],
    ['FOTOSINTESIS', 'ES', 'Proceso con el que las plantas producen su alimento'], ['CONSTITUCION', 'ES', 'Ley suprema de México'], ['DEMOCRACIA', 'ES', 'Gobierno elegido por la ciudadanía'], ['RESILIENCIA', 'ES', 'Capacidad de recuperarse ante la adversidad'],
    ['CAT', 'EN', 'Gato'], ['BOOK', 'EN', 'Libro'], ['WATER', 'EN', 'Agua'], ['HOUSE', 'EN', 'Casa'], ['SCHOOL', 'EN', 'Escuela'], ['FRIEND', 'EN', 'Amigo/amiga'],
    ['TEACHER', 'EN', 'Maestro/maestra'], ['SCIENCE', 'EN', 'Ciencia'], ['COMPUTER', 'EN', 'Computadora'], ['KNOWLEDGE', 'EN', 'Conocimiento'], ['YESTERDAY', 'EN', 'Ayer'], ['BEAUTIFUL', 'EN', 'Hermoso/hermosa'],
    ['MOUSE', 'EN', 'Ratón (también de la computadora)'], ['TEAM', 'EN', 'Equipo'], ['DREAM', 'EN', 'Sueño'], ['FUTURE', 'EN', 'Futuro']
  ];
  AR.WORDS = WORDS;
  AR.register({
    id: 'words', num: '03', name: 'WORD HACKER', icon: '🔤', category: 'Lenguaje', difficulty: 2, levels: false, xpPer: 30,
    c1: '#3b82f6', c2: '#a78bfa',
    desc: 'Hackea el sistema reconstruyendo palabras cifradas en español e inglés.',
    howTo: ['Toca las letras (o escríbelas) en el orden correcto para formar la palabra.', 'Toca una letra colocada para regresarla. Retroceso borra la última.', 'La pista te dice el significado. El botón 💡 revela una letra (−20 pts, máx. 2 por palabra).', 'Descifra 10 palabras para ganar. Si se acaba el tiempo pierdes una vida (3 vidas).'],
    art: art('words', '#3b82f6', '#a78bfa', ['H', 'A', 'C', 'K'].map(function (l, i) { return '<rect x="' + (28 + i * 38) + '" y="38" width="32" height="40" rx="6"/><text x="' + (44 + i * 38) + '" y="68" text-anchor="middle" font-size="24" font-family="Orbitron,sans-serif" fill="url(#ga-words)" stroke="none">' + l + '</text>'; }).join('')),
    create: function (ctx) {
      var list = U.shuffle(WORDS.filter(function (w) { return w[0].length <= 6; })).slice(0, 4).concat(U.shuffle(WORDS.filter(function (w) { return w[0].length >= 7 && w[0].length <= 8; })).slice(0, 3), U.shuffle(WORDS.filter(function (w) { return w[0].length >= 9; })).slice(0, 3));
      var idx = 0, lives = 3, score = 0, streak = 0, word, tiles, disp, placed, hints, timer, solved = 0, locked;
      ctx.root.innerHTML = '<div class="wh-wrap"><div class="wh-term"><span class="wh-lang" id="wh-lang"></span><span id="wh-hint"></span></div><div class="wh-slots" id="wh-slots"></div><div class="wh-tiles" id="wh-tiles"></div><div class="btn-row center"><button class="btn btn-sm" id="wh-back">⌫ Borrar</button><button class="btn btn-sm" id="wh-help">💡 Revelar letra</button><button class="btn btn-sm btn-ghost" id="wh-shuf">🔀 Mezclar</button></div></div>';
      var slotsEl = ctx.root.querySelector('#wh-slots'), tilesEl = ctx.root.querySelector('#wh-tiles');
      function hud() { ctx.hud({ score: score, level: Math.min(3, 1 + Math.floor(idx / 4)), combo: streak, lives: lives, maxLives: 3, progress: idx / list.length, label: 'Palabra ' + Math.min(idx + 1, list.length) + ' de ' + list.length }); }
      function load() {
        locked = false; word = list[idx][0]; hints = 0; placed = [];
        var letters = word.split(''), sh;
        do { sh = U.shuffle(letters); } while (sh.join('') === word && word.length > 1);
        tiles = sh.map(function (ch, i) { return { ch: ch, id: i, used: false }; });
        disp = tiles.map(function (_, i) { return i; });   // orden visual de las letras
        ctx.root.querySelector('#wh-lang').textContent = list[idx][1] === 'ES' ? '🇲🇽 ESPAÑOL' : '🇺🇸 ENGLISH';
        ctx.root.querySelector('#wh-hint').textContent = 'PISTA: ' + list[idx][2];
        var t = Math.max(20, 40 - idx * 1.5);
        if (timer) timer.set(t); else timer = ctx.countdown(t, function () { lose('⏰ Tiempo agotado: era ' + word); });
        render(); hud();
      }
      function render() {
        slotsEl.innerHTML = word.split('').map(function (_, i) { var p = placed[i]; return '<button class="wh-slot ' + (p ? (p.hint ? 'hint' : 'filled') : '') + '" data-s="' + i + '">' + (p ? p.ch : '') + '</button>'; }).join('');
        tilesEl.innerHTML = disp.map(function (i) { var t = tiles[i]; return '<button class="wh-tile ' + (t.used ? 'used' : '') + '" data-t="' + i + '" ' + (t.used ? 'disabled' : '') + '>' + t.ch + '</button>'; }).join('');
        slotsEl.querySelectorAll('[data-s]').forEach(function (b) { ctx.on(b, 'click', function () { unplace(+b.getAttribute('data-s')); }); });
        tilesEl.querySelectorAll('[data-t]').forEach(function (b) { ctx.on(b, 'click', function () { place(+b.getAttribute('data-t')); }); });
      }
      function place(ti) {
        if (locked || tiles[ti].used) return;
        var slot = placed.findIndex(function (p, i) { return !p; }); if (slot < 0) slot = placed.length;
        if (slot >= word.length) return;
        placed[slot] = { ch: tiles[ti].ch, ti: ti }; tiles[ti].used = true; ctx.sfx('click'); render();
        if (placed.filter(Boolean).length === word.length) check();
      }
      function unplace(si) { if (locked || !placed[si] || placed[si].hint) return; tiles[placed[si].ti].used = false; placed[si] = null; render(); }
      function back() { for (var i = word.length - 1; i >= 0; i--) if (placed[i] && !placed[i].hint) { unplace(i); return; } }
      function hint() {
        if (locked || hints >= 2) { ctx.toast('Máximo 2 pistas por palabra.', 'warn'); return; }
        for (var i = 0; i < word.length; i++) {
          if (!placed[i] || placed[i].ch !== word[i]) {
            if (placed[i] && !placed[i].hint) { tiles[placed[i].ti].used = false; placed[i] = null; }
            var ti = tiles.findIndex(function (t) { return !t.used && t.ch === word[i]; });
            if (ti < 0) { // la letra está colocada en otro lugar: liberarla
              var j = placed.findIndex(function (p, k) { return p && !p.hint && p.ch === word[i] && k !== i; });
              if (j >= 0) { tiles[placed[j].ti].used = false; placed[j] = null; ti = tiles.findIndex(function (t) { return !t.used && t.ch === word[i]; }); }
            }
            if (ti < 0) return;
            tiles[ti].used = true; placed[i] = { ch: word[i], ti: ti, hint: true }; hints++; score = Math.max(0, score - 20);
            ctx.sfx('power'); render(); hud();
            if (placed.filter(Boolean).length === word.length) check();
            return;
          }
        }
      }
      function check() {
        var guess = placed.map(function (p) { return p ? p.ch : ''; }).join('');
        if (guess === word) {
          locked = true; timer.stop(); streak++; solved++;
          var gain = word.length * 20 + Math.round(timer.left) * 5 + (streak >= 3 ? 50 : 0);
          score += gain; ctx.sfx('correct'); ctx.burstAt(slotsEl); ctx.floatAt(slotsEl, '+' + gain, 'plus');
          slotsEl.classList.add('solved');
          ctx.after(900, function () { slotsEl.classList.remove('solved'); advance(); });
        } else {
          ctx.sfx('wrong'); ctx.shake(slotsEl); streak = 0;
          ctx.after(350, function () { placed = placed.map(function (p) { if (p && !p.hint) { tiles[p.ti].used = false; return null; } return p; }); render(); });
        }
        hud();
      }
      function lose(msg) {
        locked = true; lives--; streak = 0; ctx.sfx('wrong'); ctx.toast(msg, 'warn'); hud();
        if (lives <= 0) { ctx.after(900, function () { ctx.end({ score: score, win: false, message: 'Sistema bloqueado. Descifraste ' + solved + ' palabras.', stats: { 'Palabras': solved + '/' + list.length } }); }); return; }
        ctx.after(1200, advance);
      }
      function advance() {
        idx++;
        if (idx >= list.length) { ctx.end({ score: score, win: solved >= 7, message: solved >= 7 ? '¡Hackeo completo! Descifraste ' + solved + ' de 10 palabras.' : 'Descifraste ' + solved + ' de 10 (necesitas 7 para ganar).', stats: { 'Palabras': solved + '/' + list.length, 'Vidas': lives } }); return; }
        load();
      }
      ctx.on(ctx.root.querySelector('#wh-back'), 'click', back);
      ctx.on(ctx.root.querySelector('#wh-help'), 'click', hint);
      ctx.on(ctx.root.querySelector('#wh-shuf'), 'click', function () { if (locked) return; disp = U.shuffle(disp); ctx.sfx('whoosh'); render(); });
      ctx.on(document, 'keydown', function (e) {
        if (e.key === 'Backspace') { back(); e.preventDefault(); return; }
        var ch = e.key.toUpperCase(); if (!/^[A-ZÑ]$/.test(ch)) return;
        var ti = tiles.findIndex(function (t) { return !t.used && t.ch === ch; }); if (ti >= 0) { place(ti); e.preventDefault(); }
      });
      load();
      return { test: { word: function () { return word; }, typeWord: function () { word.split('').forEach(function (ch) { var ti = tiles.findIndex(function (t) { return !t.used && t.ch === ch; }); place(ti); }); }, state: function () { return { idx: idx, lives: lives, score: score, locked: locked }; } } };
    }
  });

  /* =====================================================================
     04 · CYBER MAZE — laberinto procedural con llaves y drones
     ===================================================================== */
  function genMaze(n) {
    var cells = [], i, stack = [[0, 0]], seen = {};
    for (i = 0; i < n * n; i++) cells.push({ n: true, s: true, e: true, w: true });
    seen['0,0'] = 1;
    while (stack.length) {
      var cur = stack[stack.length - 1], x = cur[0], y = cur[1];
      var opts = [[0, -1, 'n', 's'], [1, 0, 'e', 'w'], [0, 1, 's', 'n'], [-1, 0, 'w', 'e']].filter(function (d) { var nx = x + d[0], ny = y + d[1]; return nx >= 0 && ny >= 0 && nx < n && ny < n && !seen[nx + ',' + ny]; });
      if (!opts.length) { stack.pop(); continue; }
      var d = U.pick(opts), nx = x + d[0], ny = y + d[1];
      cells[y * n + x][d[2]] = false; cells[ny * n + nx][d[3]] = false; seen[nx + ',' + ny] = 1; stack.push([nx, ny]);
    }
    // abre algunos muros extra para crear rutas alternativas
    for (i = 0; i < n; i++) { var rx = U.rnd(0, n - 2), ry = U.rnd(0, n - 1); cells[ry * n + rx].e = false; cells[ry * n + rx + 1].w = false; }
    return cells;
  }
  function mazeNeighbors(cells, n, x, y) {
    var c = cells[y * n + x], out = [];
    if (!c.n) out.push([x, y - 1]); if (!c.s) out.push([x, y + 1]); if (!c.e) out.push([x + 1, y]); if (!c.w) out.push([x - 1, y]);
    return out;
  }
  function bfs(cells, n, from, to) {
    var q = [from], prev = {}, k = function (p) { return p[0] + ',' + p[1]; }; prev[k(from)] = null;
    while (q.length) {
      var c = q.shift(); if (c[0] === to[0] && c[1] === to[1]) break;
      mazeNeighbors(cells, n, c[0], c[1]).forEach(function (nb) { if (!(k(nb) in prev)) { prev[k(nb)] = c; q.push(nb); } });
    }
    var path = [], cur = to; if (!(k(to) in prev)) return [];
    while (cur) { path.unshift(cur); cur = prev[k(cur)]; }
    return path;
  }
  AR.register({
    id: 'maze', num: '04', name: 'CYBER MAZE', icon: '🌀', category: 'Lógica y acción', difficulty: 3, levels: true, xpPer: 30,
    c1: '#22d3ee', c2: '#3b82f6',
    desc: 'Laberintos que cambian en cada partida. Recoge las llaves, esquiva drones y firewalls, y escapa.',
    howTo: ['Muévete con las flechas, WASD, deslizando el dedo o con la cruceta en pantalla.', 'Recoge todas las llaves 🔑 para abrir la salida.', 'Evita los drones rojos y los firewalls cuando están encendidos: si te tocan pierdes una vida y vuelves al inicio.', 'Supera 5 laberintos para ganar. ¡Cada uno es más grande!'],
    art: art('maze', '#22d3ee', '#3b82f6', '<path d="M40 20h120v80H40zM60 20v60h20M100 40v60M120 20v40h20M140 80h20"/><circle cx="50" cy="90" r="6" fill="#22d3ee"/><circle cx="150" cy="30" r="5" fill="#facc15" stroke="none"/>'),
    create: function (ctx) {
      var L = ctx.level, lives = 3, score = 0, n, cells, player, keys, got, drones, walls, exit, timer, levelsDone = 0, hazards = true, hitCooldown = 0, tween = { x: 0, y: 0 };
      ctx.root.innerHTML = '<div class="mz-wrap"><div class="mz-canvas-box"></div><div class="dpad"><button data-d="up">▲</button><button data-d="left">◀</button><button data-d="down">▼</button><button data-d="right">▶</button></div></div>';
      var cv = U.canvas(ctx.root.querySelector('.mz-canvas-box'), 600, 600), g = cv.getContext('2d');
      function setup() {
        n = Math.min(21, 7 + L * 2); cells = genMaze(n);
        player = [0, 0]; tween = { x: 0, y: 0 }; exit = [n - 1, n - 1]; got = 0;
        var free = []; for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (x + y > 3 && !(x === n - 1 && y === n - 1)) free.push([x, y]);
        free = U.shuffle(free);
        keys = free.splice(0, Math.min(5, L + 1)).map(function (p) { return { x: p[0], y: p[1], got: false }; });
        drones = [];
        for (var d = 0; d < Math.min(5, L); d++) {
          var a = free.pop(), b = free.pop(); if (!a || !b) break;
          var path = bfs(cells, n, a, b); if (path.length < 3) continue;
          if (path.some(function (p) { return p[0] + p[1] < 3; })) continue;
          drones.push({ path: path, i: 0, dir: 1, t: 0, speed: Math.max(0.18, 0.42 - L * 0.03) });
        }
        walls = free.splice(0, Math.min(6, L * 2 - 1)).filter(function (p) { return p[0] + p[1] > 3; }).map(function (p) { return { x: p[0], y: p[1], phase: Math.random() * 3 }; });
        var t = 50 + n * 3;
        if (timer) timer.set(t); else timer = ctx.countdown(t, function () { hit('⏰ Tiempo agotado'); if (timer) timer.set(30); });
        hud();
      }
      function hud() { ctx.hud({ score: score, level: L, combo: got + '/' + keys.length, comboLabel: 'LLAVES', lives: lives, maxLives: 3, progress: levelsDone / 5, label: 'Laberinto ' + (levelsDone + 1) + ' de 5 · ' + n + '×' + n }); }
      function wallOn(w, time) { return ((time + w.phase) % 3) < 1.6; }
      var time = 0;
      function move(dir) {
        var d = { up: [0, -1, 'n'], down: [0, 1, 's'], left: [-1, 0, 'w'], right: [1, 0, 'e'] }[dir]; if (!d) return;
        var c = cells[player[1] * n + player[0]];
        if (c[d[2]]) { ctx.sfx('hover'); return; }
        player = [player[0] + d[0], player[1] + d[1]]; ctx.sfx('tick');
        keys.forEach(function (k) { if (!k.got && k.x === player[0] && k.y === player[1]) { k.got = true; got++; score += 25 * L; ctx.sfx('power'); hud(); } });
        if (player[0] === exit[0] && player[1] === exit[1]) {
          if (got < keys.length) { ctx.toast('🔒 Faltan ' + (keys.length - got) + ' llaves para abrir la salida', 'warn'); return; }
          levelsDone++; score += 100 * L + Math.round(timer.left) * 5; ctx.sfx('achievement'); ctx.flash('rgba(34,211,238,.3)');
          if (levelsDone >= 5) { ctx.end({ score: score, win: true, level: L, message: '¡Escapaste de los 5 laberintos!', stats: { 'Laberintos': 5, 'Vidas': lives } }); return; }
          L++; setup();
        }
        checkHazard();
      }
      function hit(msg) {
        if (hitCooldown > 0) return; hitCooldown = 1.2;
        lives--; ctx.sfx('wrong'); ctx.flash(); ctx.shake(cv); ctx.toast('💥 ' + msg, 'warn');
        player = [0, 0]; hud();
        if (lives <= 0) ctx.after(500, function () { ctx.end({ score: score, win: false, level: L, message: 'El sistema te atrapó en el laberinto ' + (levelsDone + 1) + '.', stats: { 'Laberintos': levelsDone + '/5' } }); });
      }
      function checkHazard() {
        if (!hazards) return;
        drones.forEach(function (dr) { var p = dr.path[dr.i]; if (p[0] === player[0] && p[1] === player[1]) hit('Un dron te alcanzó'); });
        walls.forEach(function (w) { if (w.x === player[0] && w.y === player[1] && wallOn(w, time)) hit('Firewall activo'); });
      }
      function update(dt) {
        time += dt; hitCooldown = Math.max(0, hitCooldown - dt);
        drones.forEach(function (dr) {
          dr.t += dt; if (dr.t >= dr.speed) { dr.t = 0; dr.i += dr.dir; if (dr.i >= dr.path.length - 1 || dr.i <= 0) dr.dir *= -1; dr.i = Math.max(0, Math.min(dr.path.length - 1, dr.i)); }
        });
        tween.x += (player[0] - tween.x) * Math.min(1, dt * 18); tween.y += (player[1] - tween.y) * Math.min(1, dt * 18);
        checkHazard();
      }
      function render() {
        var s = 600 / n; g.clearRect(0, 0, 600, 600); g.fillStyle = '#070620'; g.fillRect(0, 0, 600, 600);
        g.lineWidth = Math.max(2, s / 9); g.lineCap = 'round'; g.strokeStyle = '#3b82f6'; U.glow(g, '#22d3ee', 8);
        g.beginPath();
        for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
          var c = cells[y * n + x], X = x * s, Y = y * s;
          if (c.n) { g.moveTo(X, Y); g.lineTo(X + s, Y); } if (c.w) { g.moveTo(X, Y); g.lineTo(X, Y + s); }
          if (y === n - 1 && c.s) { g.moveTo(X, Y + s); g.lineTo(X + s, Y + s); } if (x === n - 1 && c.e) { g.moveTo(X + s, Y); g.lineTo(X + s, Y + s); }
        }
        g.stroke();
        // salida
        var open = got >= keys.length; U.glow(g, open ? '#22c55e' : '#a855f7', 20);
        g.fillStyle = open ? 'rgba(34,197,94,.7)' : 'rgba(168,85,247,.4)'; g.fillRect(exit[0] * s + s * .15, exit[1] * s + s * .15, s * .7, s * .7);
        g.fillStyle = '#fff'; g.font = (s * .45) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(open ? '⇲' : '🔒', exit[0] * s + s / 2, exit[1] * s + s / 2);
        // firewalls
        walls.forEach(function (w) { var on = wallOn(w, time); U.glow(g, '#f97316', on ? 18 : 0); g.fillStyle = on ? 'rgba(249,115,22,.75)' : 'rgba(249,115,22,.12)'; g.fillRect(w.x * s + 3, w.y * s + 3, s - 6, s - 6); });
        // llaves
        keys.forEach(function (k) { if (k.got) return; U.glow(g, '#facc15', 14); g.fillStyle = '#facc15'; g.font = (s * .55) + 'px sans-serif'; g.fillText('🔑', k.x * s + s / 2, k.y * s + s / 2 + Math.sin(time * 4 + k.x) * 2); });
        // drones
        drones.forEach(function (dr) { var p = dr.path[dr.i]; U.glow(g, '#ef4444', 18); g.fillStyle = '#ef4444'; g.beginPath(); g.arc(p[0] * s + s / 2, p[1] * s + s / 2, s * .3 + Math.sin(time * 10) * 1.5, 0, 7); g.fill(); });
        // jugador
        U.glow(g, '#22d3ee', 22); g.fillStyle = '#e0f2fe'; g.beginPath(); g.arc(tween.x * s + s / 2, tween.y * s + s / 2, s * .3, 0, 7); g.fill();
        g.fillStyle = '#22d3ee'; g.beginPath(); g.arc(tween.x * s + s / 2, tween.y * s + s / 2, s * .16, 0, 7); g.fill();
        U.glow(g, 'transparent', 0);
      }
      ctx.loop(function (dt) { update(dt); render(); });
      ctx.on(document, 'keydown', function (e) {
        var m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' }[e.key];
        if (m) { move(m); e.preventDefault(); }
      });
      ctx.root.querySelectorAll('[data-d]').forEach(function (b) { ctx.on(b, 'pointerdown', function (e) { e.preventDefault(); move(b.getAttribute('data-d')); }); });
      var sw = null;
      ctx.on(cv, 'pointerdown', function (e) { sw = { x: e.clientX, y: e.clientY }; });
      ctx.on(cv, 'pointerup', function (e) { if (!sw) return; var dx = e.clientX - sw.x, dy = e.clientY - sw.y; if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); sw = null; });
      setup(); render();
      return { test: {
        hazardsOff: function () { hazards = false; },
        // Ruta: llaves en orden y luego la salida
        solve: function () {
          var route = [], cur = player.slice();
          keys.filter(function (k) { return !k.got; }).concat([{ x: exit[0], y: exit[1] }]).forEach(function (t) { var p = bfs(cells, n, cur, [t.x, t.y]); route = route.concat(p.slice(1)); cur = [t.x, t.y]; });
          var prev = player.slice();
          route.forEach(function (p) { var dx = p[0] - prev[0], dy = p[1] - prev[1]; move(dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up'); prev = p; });
        },
        tick: function (s) { for (var i = 0; i < s * 20; i++) update(0.05); },
        state: function () { return { L: L, lives: lives, score: score, levelsDone: levelsDone, player: player.slice(), n: n, keys: keys.length, got: got, drones: drones.length }; }
      } };
    }
  });

  /* =====================================================================
     05 · ELEMENTAL — asociación científica contra reloj
     ===================================================================== */
  var ELEMENTS = [
    ['H', 'Hidrógeno', 'El elemento más ligero; forma parte del agua'], ['He', 'Helio', 'Gas noble que hace flotar los globos'], ['C', 'Carbono', 'Base de los compuestos orgánicos y de los seres vivos'],
    ['N', 'Nitrógeno', 'Gas más abundante del aire (78%)'], ['O', 'Oxígeno', 'Gas que respiramos para vivir'], ['Na', 'Sodio', 'Junto al cloro forma la sal de mesa'],
    ['Cl', 'Cloro', 'Se usa para desinfectar el agua de las albercas'], ['Fe', 'Hierro', 'Metal que se oxida y está en la hemoglobina'], ['Cu', 'Cobre', 'Metal muy usado en cables eléctricos'],
    ['Au', 'Oro', 'Metal precioso que no se oxida'], ['Ag', 'Plata', 'Metal precioso y gran conductor eléctrico'], ['Ca', 'Calcio', 'Mineral importante en huesos y dientes'],
    ['K', 'Potasio', 'Abunda en el plátano'], ['Mg', 'Magnesio', 'Metal que arde con luz blanca muy intensa'], ['Al', 'Aluminio', 'Metal ligero de las latas de refresco'],
    ['Si', 'Silicio', 'Elemento con el que se fabrican los chips'], ['S', 'Azufre', 'Sólido amarillo con olor fuerte en volcanes'], ['P', 'Fósforo', 'Se usa en las cabezas de los cerillos'],
    ['Zn', 'Zinc', 'Recubre metales para protegerlos de la corrosión'], ['Pb', 'Plomo', 'Metal pesado y tóxico'], ['Hg', 'Mercurio', 'Único metal líquido a temperatura ambiente'],
    ['Ne', 'Neón', 'Gas noble de los anuncios luminosos'], ['I', 'Yodo', 'Se agrega a la sal para prevenir el bocio'], ['F', 'Flúor', 'Se agrega a las pastas de dientes'], ['Sn', 'Estaño', 'Metal usado para soldar circuitos']
  ];
  var CONCEPTS = [
    ['Átomo', 'Partícula más pequeña de un elemento que conserva sus propiedades'], ['Molécula', 'Unión de dos o más átomos'], ['Compuesto', 'Sustancia formada por dos o más elementos combinados químicamente'],
    ['Mezcla homogénea', 'Sus componentes no se distinguen a simple vista'], ['Mezcla heterogénea', 'Sus componentes se distinguen a simple vista'], ['Evaporación', 'Cambio de líquido a gas'],
    ['Condensación', 'Cambio de gas a líquido'], ['Fusión', 'Cambio de sólido a líquido'], ['Solidificación', 'Cambio de líquido a sólido'], ['Sublimación', 'Cambio directo de sólido a gas'],
    ['Protón', 'Partícula con carga positiva en el núcleo'], ['Electrón', 'Partícula con carga negativa que gira alrededor del núcleo'], ['Neutrón', 'Partícula sin carga en el núcleo'],
    ['Densidad', 'Relación entre la masa y el volumen'], ['Energía cinética', 'Energía que tiene un cuerpo en movimiento'], ['Fotosíntesis', 'Proceso en el que las plantas transforman luz en alimento']
  ];
  AR.ELEMENTS = ELEMENTS; AR.CONCEPTS = CONCEPTS;
  AR.register({
    id: 'elemental', num: '05', name: 'ELEMENTAL', icon: '⚗️', category: 'Ciencias', difficulty: 2, levels: true, xpPer: 30,
    c1: '#10b981', c2: '#22d3ee',
    desc: 'Conecta símbolos químicos, elementos, conceptos y definiciones en el reactor antes de que explote.',
    howTo: ['Toca una tarjeta de la izquierda y luego su pareja de la derecha.', 'Las parejas correctas se conectan con un rayo; los errores restan 3 segundos y rompen tu combo.', 'Niveles: símbolos → elementos difíciles → usos de cada elemento → conceptos → mezcla de todo.', 'Completa 5 reactores. Si el tiempo de un reactor se agota pierdes una vida (3 vidas).'],
    art: art('elemental', '#10b981', '#22d3ee', '<rect x="30" y="30" width="50" height="56" rx="6"/><text x="55" y="68" text-anchor="middle" font-size="26" font-family="Orbitron,sans-serif" fill="url(#ga-elemental)" stroke="none">Fe</text><rect x="120" y="30" width="50" height="56" rx="6"/><text x="145" y="68" text-anchor="middle" font-size="26" font-family="Orbitron,sans-serif" fill="url(#ga-elemental)" stroke="none">Cu</text><path d="M80 58 Q100 30 120 58" stroke-dasharray="4 4"/>'),
    create: function (ctx) {
      var L = ctx.level, round = 0, lives = 3, score = 0, combo = 0, pairs, left, right, sel = null, matched, timer, best = 0, errors = 0;
      ctx.root.innerHTML = '<div class="el-wrap"><div class="el-title" id="el-title"></div><div class="el-board"><div class="el-col" id="el-l"></div><svg class="el-lines" id="el-svg"></svg><div class="el-col" id="el-r"></div></div></div>';
      var lEl = ctx.root.querySelector('#el-l'), rEl = ctx.root.querySelector('#el-r'), svg = ctx.root.querySelector('#el-svg'), board = ctx.root.querySelector('.el-board');
      function kind() { var k = ((L - 1) % 5) + 1; return k; }
      function build() {
        var k = kind(), pool, title;
        if (k === 1) { pool = ELEMENTS.slice(0, 12).map(function (e) { return [e[0], e[1]]; }); title = 'REACTOR ' + (round + 1) + ' · SÍMBOLO ↔ ELEMENTO'; }
        else if (k === 2) { pool = ELEMENTS.slice(8).map(function (e) { return [e[0], e[1]]; }); title = 'REACTOR ' + (round + 1) + ' · SÍMBOLOS AVANZADOS'; }
        else if (k === 3) { pool = ELEMENTS.map(function (e) { return [e[1], e[2]]; }); title = 'REACTOR ' + (round + 1) + ' · ELEMENTO ↔ USO O CARACTERÍSTICA'; }
        else if (k === 4) { pool = CONCEPTS.map(function (c) { return [c[0], c[1]]; }); title = 'REACTOR ' + (round + 1) + ' · CONCEPTO ↔ DEFINICIÓN'; }
        else { pool = ELEMENTS.map(function (e) { return [e[0], e[2]]; }).concat(CONCEPTS); title = 'REACTOR ' + (round + 1) + ' · MEZCLA TOTAL'; }
        pairs = U.shuffle(pool).slice(0, k >= 3 ? 4 : 5);
        // evita definiciones duplicadas en la misma ronda
        left = U.shuffle(pairs.map(function (p, i) { return { t: p[0], i: i }; }));
        right = U.shuffle(pairs.map(function (p, i) { return { t: p[1], i: i }; }));
        matched = {}; sel = null; svg.innerHTML = '';
        ctx.root.querySelector('#el-title').textContent = title;
        lEl.innerHTML = left.map(function (c, j) { return '<button class="el-card left" data-l="' + j + '">' + esc(c.t) + '</button>'; }).join('');
        rEl.innerHTML = right.map(function (c, j) { return '<button class="el-card right ' + (c.t.length > 22 ? 'long' : '') + '" data-r="' + j + '">' + esc(c.t) + '</button>'; }).join('');
        lEl.querySelectorAll('[data-l]').forEach(function (b) { ctx.on(b, 'click', function () { pickL(+b.getAttribute('data-l')); }); });
        rEl.querySelectorAll('[data-r]').forEach(function (b) { ctx.on(b, 'click', function () { pickR(+b.getAttribute('data-r')); }); });
        var t = Math.max(25, 45 - L * 2) + (k >= 3 ? 10 : 0);
        if (timer) timer.set(t); else timer = ctx.countdown(t, timeout);
        hud();
      }
      function hud() { ctx.hud({ score: score, level: L, combo: combo, comboLabel: 'COMBO', lives: lives, maxLives: 3, progress: round / 5, label: 'Reactor ' + (round + 1) + ' de 5' }); }
      function pickL(j) { if (matched['l' + j]) return; sel = j; lEl.querySelectorAll('.el-card').forEach(function (b, k) { b.classList.toggle('sel', k === j); }); ctx.sfx('click'); }
      function pickR(j) {
        if (sel == null || matched['r' + j]) { if (sel == null) ctx.toast('Primero elige una tarjeta de la izquierda', 'warn'); return; }
        var lb = lEl.children[sel], rb = rEl.children[j];
        if (left[sel].i === right[j].i) {
          matched['l' + sel] = matched['r' + j] = true; combo++; best = Math.max(best, combo);
          var gain = 100 + combo * 20; score += gain;
          lb.classList.add('ok'); rb.classList.add('ok'); lb.classList.remove('sel'); ctx.sfx('correct'); ctx.floatAt(rb, '+' + gain, 'plus');
          drawLine(lb, rb);
          sel = null; hud();
          if (Object.keys(matched).length === pairs.length * 2) {
            timer.stop(); score += Math.round(timer.left) * 10; round++; L++; ctx.sfx('achievement'); ctx.burstAt(board); hud();
            if (round >= 5) { ctx.after(700, function () { ctx.end({ score: score, win: true, level: L - 1, message: '¡Estabilizaste los 5 reactores!', stats: { 'Mejor combo': best, 'Errores': errors } }); }); return; }
            ctx.after(900, build);
          }
        } else {
          combo = 0; errors++; timer.add(-3); ctx.sfx('wrong'); lb.classList.add('bad'); rb.classList.add('bad');
          ctx.after(400, function () { lb.classList.remove('bad'); rb.classList.remove('bad'); }); hud();
        }
      }
      function drawLine(a, b) {
        var R = board.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        svg.setAttribute('viewBox', '0 0 ' + R.width + ' ' + R.height);
        var x1 = ra.right - R.left, y1 = ra.top + ra.height / 2 - R.top, x2 = rb.left - R.left, y2 = rb.top + rb.height / 2 - R.top;
        svg.insertAdjacentHTML('beforeend', '<path class="el-bolt" d="M' + x1 + ' ' + y1 + ' L' + ((x1 + x2) / 2) + ' ' + (y1 - 8) + ' L' + ((x1 + x2) / 2) + ' ' + (y2 + 8) + ' L' + x2 + ' ' + y2 + '"/>');
      }
      function timeout() {
        lives--; combo = 0; ctx.sfx('explode'); ctx.flash('rgba(239,68,68,.4)'); ctx.shake(board); hud();
        if (lives <= 0) { ctx.end({ score: score, win: false, level: L, message: '¡El reactor ' + (round + 1) + ' se sobrecalentó!', stats: { 'Reactores': round + '/5', 'Mejor combo': best } }); return; }
        ctx.toast('💥 ¡Sobrecarga! Pierdes una vida. Nuevo reactor.', 'warn'); ctx.after(800, build);
      }
      build();
      return { test: { solveOne: function () { var j = left.findIndex(function (c, k) { return !matched['l' + k]; }); if (j < 0) return; pickL(j); pickR(right.findIndex(function (c) { return c.i === left[j].i; })); }, wrong: function () { var j = left.findIndex(function (c, k) { return !matched['l' + k]; }); pickL(j); pickR(right.findIndex(function (c, k) { return c.i !== left[j].i && !matched['r' + k]; })); }, state: function () { return { round: round, lives: lives, score: score, L: L }; } } };
    }
  });
})();
