/* ============================================================
   NEUROVERSE ARCADE — Minijuegos 11 a 15
   11 BLOCK LOGIC · 12 EMOTION DETECTOR · 13 TIME MASTER
   14 CODE BREAKER · 15 SURVIVAL ARENA
   ============================================================ */
(function () {
  var AR = NV.Arcade, U = AR.U, esc = NV.UI.esc, fmt = NV.UI.fmt, art = AR.art;

  /* =====================================================================
     11 · BLOCK LOGIC — piezas en cuadrícula, líneas y combos
     ===================================================================== */
  var PIECES = [
    [[0, 0]], [[0, 0], [1, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2]],
    [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [0, 1], [0, 2], [0, 3]],
    [[0, 0], [0, 1], [1, 1]], [[1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 0], [1, 0], [0, 1]],
    [[0, 0], [1, 0], [2, 0], [1, 1]], [[0, 0], [0, 1], [0, 2], [1, 2]], [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]]
  ];
  var PCOL = ['#a855f7', '#22d3ee', '#3b82f6', '#f472b6', '#facc15', '#10b981', '#f97316'];
  AR.register({
    id: 'blocks', num: '11', name: 'BLOCK LOGIC', icon: '🧩', category: 'Lógica', difficulty: 2, levels: false, xpPer: 40,
    c1: '#3b82f6', c2: '#f472b6',
    desc: 'Coloca piezas de energía en la cuadrícula, completa filas y columnas, y encadena combos explosivos.',
    howTo: ['Arrastra una pieza a la cuadrícula (mouse o dedo). También puedes tocar la pieza y luego la casilla.', 'Completa una fila o columna para borrarla. Varias líneas a la vez = COMBO.', 'Cada 500 puntos subes de nivel y aparecen piezas más grandes.', 'Llega a 2,500 puntos para ganar. Si ninguna pieza cabe, termina la partida.'],
    art: art('blocks', '#3b82f6', '#f472b6', [[40, 30], [62, 30], [84, 30], [84, 52], [120, 52], [142, 52], [142, 74], [62, 74], [40, 74]].map(function (p, i) { return '<rect x="' + p[0] + '" y="' + p[1] + '" width="20" height="20" rx="3" ' + (i % 3 === 0 ? 'fill="url(#ga-blocks)"' : '') + '/>'; }).join('')),
    create: function (ctx) {
      var N = 8, grid = [], tray = [], score = 0, level = 1, combo = 0, lines = 0, placedCount = 0, sel = null, drag = null, over = false, GOAL = 2500;
      for (var i = 0; i < N * N; i++) grid.push(null);
      ctx.root.innerHTML = '<div class="bl-wrap"><div class="bl-grid" id="bl-g">' + grid.map(function (_, i) { return '<div class="bl-cell" data-c="' + i + '"></div>'; }).join('') + '</div><div class="bl-tray" id="bl-t"></div></div>';
      var gEl = ctx.root.querySelector('#bl-g'), tEl = ctx.root.querySelector('#bl-t'), cellsEl = gEl.querySelectorAll('.bl-cell');
      function pool() { var max = level >= 4 ? PIECES.length : level >= 3 ? 15 : level >= 2 ? 13 : 9; return PIECES.slice(0, max); }
      function refill() { tray = [0, 1, 2].map(function () { return { cells: U.pick(pool()), color: U.pick(PCOL) }; }); renderTray(); }
      function fits(p, x, y) { return p.cells.every(function (c) { var cx = x + c[0], cy = y + c[1]; return cx >= 0 && cy >= 0 && cx < N && cy < N && !grid[cy * N + cx]; }); }
      function anyFit(p) { for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (fits(p, x, y)) return [x, y]; return null; }
      function renderGrid(preview) {
        cellsEl.forEach(function (el, i) { el.style.background = grid[i] || ''; el.className = 'bl-cell' + (grid[i] ? ' full' : ''); });
        if (preview) preview.cells.forEach(function (c) { var cx = preview.x + c[0], cy = preview.y + c[1]; if (cx >= 0 && cy >= 0 && cx < N && cy < N) cellsEl[cy * N + cx].classList.add(preview.ok ? 'pv-ok' : 'pv-bad'); });
      }
      function pieceHTML(p, i) {
        var w = Math.max.apply(null, p.cells.map(function (c) { return c[0]; })) + 1, h = Math.max.apply(null, p.cells.map(function (c) { return c[1]; })) + 1;
        return '<div class="bl-piece ' + (sel === i ? 'sel' : '') + (p.used ? ' used' : '') + '" data-p="' + i + '" style="grid-template-columns:repeat(' + w + ',1fr);width:' + (w * 26) + 'px">' +
          Array.from({ length: w * h }, function (_, k) { var on = p.cells.some(function (c) { return c[0] === k % w && c[1] === Math.floor(k / w); }); return '<i style="' + (on ? 'background:' + p.color + ';box-shadow:0 0 10px ' + p.color : 'visibility:hidden') + '"></i>'; }).join('') + '</div>';
      }
      function renderTray() {
        tEl.innerHTML = tray.map(pieceHTML).join('');
        tEl.querySelectorAll('[data-p]').forEach(function (el) {
          var i = +el.getAttribute('data-p');
          ctx.on(el, 'pointerdown', function (e) { if (tray[i].used || over) return; e.preventDefault(); sel = i; startDrag(e, i); });
        });
      }
      function cellFromPoint(x, y) { var r = gEl.getBoundingClientRect(); if (x < r.left || y < r.top || x > r.right || y > r.bottom) return null; return [Math.floor((x - r.left) / (r.width / N)), Math.floor((y - r.top) / (r.height / N))]; }
      function startDrag(e, i) {
        var ghost = document.createElement('div'); ghost.className = 'bl-ghost'; ghost.innerHTML = pieceHTML(tray[i], i); document.body.appendChild(ghost);
        drag = { i: i, ghost: ghost, moved: false, sx: e.clientX, sy: e.clientY };
        moveGhost(e); renderTray();
      }
      function moveGhost(e) {
        if (!drag) return;
        if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 8) drag.moved = true;
        var cs = gEl.getBoundingClientRect().width / N;
        drag.ghost.style.left = (e.clientX - cs / 2) + 'px'; drag.ghost.style.top = (e.clientY - cs * 1.6) + 'px';
        drag.ghost.firstChild.style.width = (cs * drag.ghost.firstChild.style.gridTemplateColumns.match(/\d+/)[0]) + 'px';
        var c = cellFromPoint(e.clientX, e.clientY - cs * 1.1);
        renderGrid(c ? { cells: tray[drag.i].cells, x: c[0], y: c[1], ok: fits(tray[drag.i], c[0], c[1]) } : null);
        drag.cell = c;
      }
      function endDrag() {
        if (!drag) return;
        var d = drag; drag = null; d.ghost.remove();
        if (d.moved && d.cell) place(d.i, d.cell[0], d.cell[1]); else renderGrid();
        renderTray();
      }
      ctx.on(document, 'pointermove', moveGhost);
      ctx.on(document, 'pointerup', endDrag);
      // tocar una casilla con una pieza seleccionada
      cellsEl.forEach(function (el, i) { ctx.on(el, 'click', function () { if (sel != null && !tray[sel].used) place(sel, i % N, Math.floor(i / N)); }); });
      function place(i, x, y) {
        var p = tray[i];
        if (!fits(p, x, y)) { ctx.sfx('wrong'); renderGrid(); return false; }
        p.cells.forEach(function (c) { grid[(y + c[1]) * N + x + c[0]] = p.color; });
        p.used = true; sel = null; placedCount++; score += p.cells.length * 5; ctx.sfx('click');
        // borrar líneas completas
        var rows = [], cols = [], k;
        for (k = 0; k < N; k++) { if (grid.slice(k * N, k * N + N).every(Boolean)) rows.push(k); var col = true; for (var r = 0; r < N; r++) if (!grid[r * N + k]) col = false; if (col) cols.push(k); }
        var n = rows.length + cols.length;
        if (n) {
          combo++; lines += n;
          var gain = n * 100 * n + (combo - 1) * 50; score += gain;
          rows.forEach(function (r) { for (var q = 0; q < N; q++) { cellsEl[r * N + q].classList.add('boom'); grid[r * N + q] = null; } });
          cols.forEach(function (c) { for (var q = 0; q < N; q++) { cellsEl[q * N + c].classList.add('boom'); grid[q * N + c] = null; } });
          ctx.sfx(n > 1 ? 'achievement' : 'correct'); ctx.floatAt(gEl, (n > 1 ? 'COMBO ×' + n + '! ' : '') + '+' + gain, 'plus'); ctx.burstAt(gEl, ['#3b82f6', '#f472b6', '#fff']);
          if (n > 1) ctx.flash('rgba(244,114,182,.2)');
          ctx.after(260, function () { cellsEl.forEach(function (c) { c.classList.remove('boom'); }); renderGrid(); });
        } else combo = 0;
        var nl = 1 + Math.floor(score / 500); if (nl > level) { level = nl; ctx.toast('🧩 ¡NIVEL ' + level + '! Piezas más grandes', 'power'); }
        renderGrid();
        if (score >= GOAL) { over = true; hud(); ctx.after(500, function () { ctx.end({ score: score, win: true, level: level, message: '¡Llegaste a ' + fmt(GOAL) + ' puntos!', stats: stats() }); }); return true; }
        if (tray.every(function (t) { return t.used; })) refill(); else renderTray();
        if (!tray.some(function (t) { return !t.used && anyFit(t); })) { over = true; hud(); ctx.sfx('defeat'); ctx.after(700, function () { ctx.end({ score: score, win: false, level: level, message: 'No quedan movimientos posibles.', stats: stats() }); }); }
        hud(); return true;
      }
      function stats() { return { 'Líneas': lines, 'Piezas': placedCount, 'Nivel': level }; }
      function hud() { ctx.hud({ score: score, level: level, combo: combo, comboLabel: 'COMBO', lives: null, time: null, progress: score / GOAL, label: fmt(score) + ' / ' + fmt(GOAL) + ' puntos para ganar' }); }
      refill(); renderGrid(); hud();
      return { test: {
        // Elige la colocación que borra más líneas (o la primera válida)
        auto: function () {
          var best = null;
          tray.forEach(function (p, i) { if (p.used) return; for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (fits(p, x, y)) {
            var g2 = grid.slice(); p.cells.forEach(function (c) { g2[(y + c[1]) * N + x + c[0]] = 1; });
            var s = 0; for (var k = 0; k < N; k++) { if (g2.slice(k * N, k * N + N).every(Boolean)) s += 10; var col = true; for (var r = 0; r < N; r++) if (!g2[r * N + k]) col = false; if (col) s += 10; }
            s -= (y + x) * 0.01; if (!best || s > best.s) best = { s: s, i: i, x: x, y: y };
          } });
          if (best) place(best.i, best.x, best.y);
        },
        state: function () { return { score: score, level: level, lines: lines, over: over }; }
      } };
    }
  });

  /* =====================================================================
     12 · EMOTION DETECTOR — situaciones de convivencia
     ===================================================================== */
  var EMOS = ['Alegría', 'Tristeza', 'Enojo', 'Miedo', 'Vergüenza', 'Frustración', 'Ansiedad', 'Sorpresa'];
  var EMO_ICON = { 'Alegría': '😄', 'Tristeza': '😢', 'Enojo': '😠', 'Miedo': '😨', 'Vergüenza': '😳', 'Frustración': '😤', 'Ansiedad': '😰', 'Sorpresa': '😲' };
  var SCENES = [
    { a: '🧑🏽', b: '👧🏻', na: 'Leo', nb: 'Mía', place: 'Salón de clases', say: ['Mía: "Tu exposición estuvo bien… pero se te olvidó todo a la mitad, ¿eh?" (todos ríen)', 'Leo baja la mirada, se pone rojo y guarda sus hojas rápidamente.'], who: 'Leo', plaus: ['Vergüenza', 'Tristeza', 'Frustración'], cues: 'Bajar la mirada, ponerse rojo y esconder las hojas suelen indicar vergüenza o tristeza.',
      cause: ['Una burla frente al grupo sobre algo que le costó trabajo', 'Que a Leo no le gusta la escuela', 'Que Mía y Leo son enemigos desde siempre'], causeOk: 0,
      resp: [['Hablar con Mía en privado: "Me hizo sentir mal que se rieran. Prefiero comentarios que me ayuden a mejorar."', 3, 'Asertivo: expresa lo que siente y propone algo, sin atacar.'], ['Reírse también para que no se note que le dolió.', 1, 'Comprensible, pero esconder la emoción no resuelve el problema.'], ['Burlarse de Mía en el recreo para "vengarse".', 0, 'La venganza aumenta el conflicto y lastima a otra persona.'], ['No volver a exponer nunca.', 1, 'Evita el dolor ahora, pero le quita oportunidades de crecer.']] },
    { a: '👦🏾', b: '🧑🏻', na: 'Santi', nb: 'Iker', place: 'Cancha', say: ['Iker: "¡Por tu culpa perdimos el partido!" (le avienta el balón)', 'Santi aprieta los puños, respira rápido y su voz sube de tono.'], who: 'Santi', plaus: ['Enojo', 'Frustración', 'Tristeza'], cues: 'Puños apretados, respiración rápida y voz alta suelen ser señales de enojo o frustración.',
      cause: ['Culpar a una sola persona por una derrota del equipo', 'Que Santi no sabe jugar', 'Que el balón estaba ponchado'], causeOk: 0,
      resp: [['Respirar, alejarse un momento y luego decir: "Todos fallamos algo. Hablemos de cómo mejorar."', 3, 'Autorregulación primero y después diálogo: la mejor combinación.'], ['Empujar a Iker para defenderse.', 0, 'La violencia física puede lastimar y agravar mucho el problema.'], ['Gritarle más fuerte.', 0, 'Responder con agresión hace crecer el enojo de ambos.'], ['Irse sin decir nada y no volver a jugar.', 1, 'Calmarse está bien, pero el conflicto queda sin resolver.']] },
    { a: '👧🏽', b: '👩🏻‍🏫', na: 'Fer', nb: 'Profesora', place: 'Antes del examen', say: ['Fer: "No dormí bien… ¿y si se me olvida todo?"', 'Le tiemblan las manos y revisa sus apuntes una y otra vez.'], who: 'Fer', plaus: ['Ansiedad', 'Miedo'], cues: 'Preocupación por lo que puede pasar, manos temblorosas y repasar sin parar suelen indicar ansiedad o miedo.',
      cause: ['La presión del examen y el miedo a fallar', 'Que Fer odia a la profesora', 'Que el salón está muy frío'], causeOk: 0,
      resp: [['Hacer respiraciones lentas, recordar lo que sí estudió y pedir a la profesora aclarar dudas.', 3, 'Regula la emoción y busca apoyo: estrategia saludable.'], ['Copiar a un compañero para asegurar la calificación.', 0, 'Rompe la honestidad y no reduce la ansiedad a largo plazo.'], ['Salirse del examen sin avisar.', 0, 'Evitar por completo genera más problemas después.'], ['Pensar "seguro voy a reprobar" una y otra vez.', 1, 'Es un pensamiento común, pero alimenta la ansiedad.']] },
    { a: '🧒🏻', b: '👦🏽', na: 'Dani', nb: 'Toño', place: 'Chat del grupo', say: ['Alguien publicó: "¿Quién invitó a Toño a la fiesta? jaja"', 'Toño sale del chat y no responde a nadie el resto del día.'], who: 'Toño', plaus: ['Tristeza', 'Vergüenza', 'Enojo'], cues: 'Aislarse y no responder suele relacionarse con tristeza o vergüenza (también puede haber enojo).',
      cause: ['Un mensaje que lo excluye y lo expone frente a todos', 'Que a Toño no le gustan las fiestas', 'Que su celular se quedó sin batería'], causeOk: 0,
      resp: [['Escribirle a Toño en privado: "Lo del chat estuvo mal. ¿Estás bien? Yo sí quiero que vayas."', 3, 'Empatía activa: acompaña y no deja sola a la persona.'], ['Mandar emojis de risa para seguir la broma.', 0, 'Participar en la burla amplía el daño.'], ['No hacer nada porque "no es mi problema".', 1, 'Quien observa también puede ayudar; el silencio deja solo al afectado.'], ['Pedir con respeto en el chat que paren y avisar a un adulto si sigue.', 3, 'Defender con respeto y pedir ayuda detiene el acoso.']] },
    { a: '👧🏾', b: '🧑🏽', na: 'Ari', nb: 'Beto', place: 'Proyecto en equipo', say: ['Ari: "Hice toda la investigación y Beto puso su nombre en la portada como si fuera suyo."', 'Ari cruza los brazos y suspira fuerte.'], who: 'Ari', plaus: ['Frustración', 'Enojo'], cues: 'Brazos cruzados y suspiros fuertes suelen indicar frustración o enojo por algo que se siente injusto.',
      cause: ['El trabajo no se repartió de forma justa ni se reconoció el esfuerzo', 'Que a Ari no le gusta investigar', 'Que la portada era fea'], causeOk: 0,
      resp: [['Hablar con Beto y el equipo para repartir tareas y dar crédito a cada quien.', 3, 'Resuelve el problema de fondo con diálogo y acuerdos.'], ['Borrar la parte de Beto sin decirle nada.', 0, 'Actuar a escondidas genera más desconfianza.'], ['Quejarse con todo el salón de lo flojo que es Beto.', 0, 'Exhibir a alguien daña la relación y no arregla el trabajo.'], ['Aguantarse y hacer todo sola otra vez.', 1, 'Evita el conflicto hoy, pero el problema se repetirá.']] },
    { a: '👦🏻', b: '👵🏽', na: 'Memo', nb: 'Su abuela', place: 'Casa', say: ['Memo recibe su boleta con una calificación más alta de lo que esperaba.', 'Sonríe, abraza a su abuela y le enseña la boleta.'], who: 'Memo', plaus: ['Alegría', 'Sorpresa'], cues: 'Sonreír, abrazar y querer compartir la noticia son señales de alegría y sorpresa.',
      cause: ['Su esfuerzo dio un resultado mejor de lo que esperaba', 'Que su abuela lo regañó', 'Que perdió su boleta'], causeOk: 0,
      resp: [['Celebrar con su familia y reconocer lo que hizo bien para repetirlo.', 3, 'Reconocer el propio esfuerzo fortalece la autoestima.'], ['Presumirle a sus compañeros que reprobaron.', 0, 'Celebrar burlándose de otros lastima la convivencia.'], ['Pensar que fue pura suerte y no esforzarse más.', 1, 'Minimizar el esfuerzo propio debilita la motivación.'], ['Agradecer a quienes lo ayudaron a estudiar.', 3, 'La gratitud fortalece las relaciones.']] }
  ];
  AR.SCENES = SCENES;
  AR.register({
    id: 'emotion', num: '12', name: 'EMOTION DETECTOR', icon: '💜', category: 'Socioemocional', difficulty: 2, levels: false, xpPer: 35,
    c1: '#a855f7', c2: '#f472b6',
    desc: 'Escanea situaciones entre estudiantes: interpreta señales emocionales, analiza el conflicto y elige respuestas empáticas.',
    howTo: ['Lee la escena y observa las señales: palabras, gestos y contexto.', 'Paso 1: ¿qué podría sentir la persona? Paso 2: ¿cuál es la causa del conflicto? Paso 3: ¿qué respuesta favorece la convivencia?', 'Paso 4 (opcional): explica tu decisión. Las buenas explicaciones dan puntos extra.', 'Aquí no se califican tus emociones: se evalúa cómo interpretas las señales y la calidad de las decisiones. Gana con 60% del medidor de empatía.'],
    art: art('emotion', '#a855f7', '#f472b6', '<path d="M100 100 C40 60 50 15 82 18 C92 19 98 26 100 34 C102 26 108 19 118 18 C150 15 160 60 100 100Z" fill="url(#ga-emotion)" opacity=".85"/><path d="M60 60 h18 l6 -12 l8 24 l6 -12 h40" stroke="#fff" stroke-width="2.5"/>'),
    create: function (ctx) {
      var list = U.shuffle(SCENES).slice(0, 4), si = 0, score = 0, max = list.length * 500, s, step, empathyGood = 0;
      function hud() { ctx.hud({ score: score, level: si + 1, combo: Math.round(score / max * 100) + '%', comboLabel: 'EMPATÍA', lives: null, time: null, progress: (si + (step || 0) / 4) / list.length, label: 'Escena ' + Math.min(si + 1, list.length) + ' de ' + list.length + ' · Paso ' + Math.min(4, (step || 0) + 1) + ' de 4' }); }
      function load() {
        s = list[si]; step = 0;
        ctx.root.innerHTML = '<div class="ed-wrap"><div class="ed-comic"><div class="ed-place">📍 ' + esc(s.place) + '</div><div class="ed-chars"><div class="ed-char"><div class="ed-face">' + s.a + '</div><b>' + esc(s.na) + '</b></div><div class="ed-char"><div class="ed-face">' + s.b + '</div><b>' + esc(s.nb) + '</b></div></div>' +
          s.say.map(function (l, i) { return '<div class="ed-bubble" style="animation-delay:' + (i * .4) + 's">' + esc(l) + '</div>'; }).join('') + '</div>' +
          '<div class="ed-meter"><span>MEDIDOR DE EMPATÍA</span><div class="xpbar"><i style="width:' + (score / max * 100) + '%"></i></div></div><div class="ed-step glass" id="ed-step"></div></div>';
        stepEmotion(); hud();
      }
      function box() { return ctx.root.querySelector('#ed-step'); }
      function feedback(html, cls, next) {
        box().insertAdjacentHTML('beforeend', '<div class="ed-fb ' + cls + '">' + html + '</div><button class="btn btn-primary" data-ednext>CONTINUAR →</button>');
        var b = box().querySelector('[data-ednext]'); ctx.on(b, 'click', function () { b.disabled = true; next(); }); hud();
        NV.UI.$('#s-arcade-game').querySelector('.meter-fill'); var m = ctx.root.querySelector('.ed-meter i'); if (m) m.style.width = (score / max * 100) + '%';
      }
      function stepEmotion() {
        step = 0;
        box().innerHTML = '<div class="kicker">PASO 1 · RECONOCER</div><h3>¿Qué podría estar sintiendo ' + esc(s.who) + '?</h3><div class="ed-emos">' + EMOS.map(function (e) { return '<button class="ed-emo" data-emo="' + e + '"><span>' + EMO_ICON[e] + '</span>' + e + '</button>'; }).join('') + '</div>';
        box().querySelectorAll('[data-emo]').forEach(function (b) { ctx.on(b, 'click', function () {
          box().querySelectorAll('[data-emo]').forEach(function (x) { x.disabled = true; });
          var e = b.getAttribute('data-emo'), ok = s.plaus.indexOf(e) >= 0;
          b.classList.add(ok ? 'good' : 'meh'); score += ok ? 100 : 30; ctx.sfx(ok ? 'correct' : 'click');
          feedback((ok ? '✔ Interpretación coherente con las señales. ' : '🔎 Revisa las señales: ') + esc(s.cues) + ' <small>(Otras emociones posibles: ' + s.plaus.join(', ') + ')</small>', ok ? 'good' : 'meh', stepCause);
        }); });
      }
      function stepCause() {
        step = 1;
        var opts = U.shuffle(s.cause.map(function (t, i) { return { t: t, ok: i === s.causeOk }; }));
        box().innerHTML = '<div class="kicker">PASO 2 · ANALIZAR</div><h3>¿Cuál es la causa principal del conflicto?</h3><div class="answers">' + opts.map(function (o, i) { return '<button class="answer" data-ca="' + i + '"><span class="ans-key">' + 'ABC'[i] + '</span><span class="ans-text">' + esc(o.t) + '</span></button>'; }).join('') + '</div>';
        box().querySelectorAll('[data-ca]').forEach(function (b) { ctx.on(b, 'click', function () {
          box().querySelectorAll('[data-ca]').forEach(function (x) { x.disabled = true; });
          var o = opts[+b.getAttribute('data-ca')]; b.classList.add(o.ok ? 'correct' : 'wrong'); score += o.ok ? 100 : 20; ctx.sfx(o.ok ? 'correct' : 'wrong');
          feedback(o.ok ? '✔ Exacto: identificaste el origen del conflicto.' : '🔎 La causa principal es: ' + esc(s.cause[s.causeOk]) + '.', o.ok ? 'good' : 'meh', stepResp);
        }); });
      }
      function stepResp() {
        step = 2;
        var opts = U.shuffle(s.resp);
        box().innerHTML = '<div class="kicker">PASO 3 · DECIDIR</div><h3>¿Qué respuesta favorece más la convivencia?</h3><div class="answers">' + opts.map(function (o, i) { return '<button class="answer" data-re="' + i + '"><span class="ans-key">' + 'ABCD'[i] + '</span><span class="ans-text">' + esc(o[0]) + '</span></button>'; }).join('') + '</div>';
        box().querySelectorAll('[data-re]').forEach(function (b) { ctx.on(b, 'click', function () {
          box().querySelectorAll('[data-re]').forEach(function (x) { x.disabled = true; });
          var o = opts[+b.getAttribute('data-re')], q = o[1]; score += q * 50; if (q === 3) empathyGood++;
          b.classList.add(q === 3 ? 'correct' : q >= 1 ? 'picked' : 'wrong'); ctx.sfx(q === 3 ? 'correct' : q ? 'click' : 'wrong');
          feedback('<b>' + ['Decisión que lastima', 'Decisión con riesgos', 'Decisión aceptable', 'Decisión empática y asertiva'][q] + ':</b> ' + esc(o[2]), q === 3 ? 'good' : 'meh', stepExplain);
        }); });
      }
      function stepExplain() {
        step = 3;
        box().innerHTML = '<div class="kicker">PASO 4 · EXPLICAR (opcional)</div><h3>¿Por qué elegiste esa respuesta?</h3><textarea class="input" id="ed-txt" rows="3" maxlength="400" placeholder="Elegí esa opción porque…"></textarea><div class="btn-row"><button class="btn btn-primary" id="ed-send">ENVIAR</button><button class="btn btn-ghost" id="ed-skip">Omitir</button></div>';
        var send = function (skip) {
          box().querySelectorAll('button').forEach(function (x) { x.disabled = true; });
          var t = skip ? '' : box().querySelector('#ed-txt').value, r = NV.Engine.autoRubric(t, true), pts = 0;
          if (r.participa) pts += 50; if (r.argumenta) pts += 50; if (r.empatia) pts += 50;
          score += pts; ctx.sfx(pts ? 'power' : 'click');
          feedback(skip ? 'Paso omitido.' : '+' + pts + ' por tu explicación: ' + [r.participa ? '✔ completa' : '✖ muy breve', r.argumenta ? '✔ das razones' : '✖ agrega un "porque…"', r.empatia ? '✔ consideras a los demás' : '✖ menciona cómo se sienten los demás'].join(' · '), pts >= 100 ? 'good' : 'meh', nextScene);
        };
        ctx.on(box().querySelector('#ed-send'), 'click', function () { send(false); });
        ctx.on(box().querySelector('#ed-skip'), 'click', function () { send(true); });
      }
      function nextScene() {
        si++;
        if (si >= list.length) { var pct = Math.round(score / max * 100); ctx.end({ score: score, win: pct >= 60, message: 'Medidor de empatía: ' + pct + '%. ' + (pct >= 60 ? '¡Gran detector de emociones!' : 'Sigue practicando: observa las señales y busca respuestas asertivas.'), stats: { 'Empatía': pct + '%', 'Respuestas empáticas': empathyGood + '/' + list.length } }); return; }
        load();
      }
      load();
      return { test: { auto: function () {
        var b = box(); if (!b) return;
        var n = b.querySelector('[data-ednext]:not(:disabled)'); if (n) { n.click(); return; }
        if (step === 0) { var e = b.querySelector('[data-emo="' + s.plaus[0] + '"]'); if (e && !e.disabled) e.click(); }
        else if (step === 1) { var c = [].find.call(b.querySelectorAll('[data-ca]'), function (x) { return x.innerText.indexOf(s.cause[0]) >= 0; }); if (c && !c.disabled) c.click(); }
        else if (step === 2) { var best = s.resp.filter(function (r) { return r[1] === 3; })[0][0]; var r2 = [].find.call(b.querySelectorAll('[data-re]'), function (x) { return x.innerText.indexOf(best) >= 0; }); if (r2 && !r2.disabled) r2.click(); }
        else if (step === 3) { var tx = b.querySelector('#ed-txt'); if (tx && !tx.disabled) { tx.value = 'Elegí esa opción porque respeta los sentimientos de mi compañero y ayuda a buscar un acuerdo.'; b.querySelector('#ed-send').click(); } }
      }, state: function () { return { si: si, step: step, score: score }; } } };
    }
  });

  /* =====================================================================
     13 · TIME MASTER — ordenar acontecimientos en la línea del tiempo
     ===================================================================== */
  var EVENTS = [
    [1492, 'Llegada de Cristóbal Colón a América'], [1521, 'Caída de México-Tenochtitlan'], [1532, 'Antequera (hoy Oaxaca de Juárez) recibe el título de ciudad'],
    [1789, 'Inicia la Revolución Francesa'], [1806, 'Nace Benito Juárez en San Pablo Guelatao'], [1810, 'Inicia la Independencia de México'],
    [1821, 'Consumación de la Independencia'], [1848, 'Tratado de Guadalupe Hidalgo'], [1857, 'Se promulga la Constitución de 1857'],
    [1862, 'Batalla de Puebla (5 de mayo)'], [1876, 'Inicia el Porfiriato'], [1910, 'Inicia la Revolución Mexicana'],
    [1914, 'Comienza la Primera Guerra Mundial'], [1917, 'Se promulga la Constitución actual de México'], [1938, 'Expropiación petrolera'],
    [1945, 'Termina la Segunda Guerra Mundial'], [1953, 'Las mujeres obtienen el voto en elecciones federales'], [1968, 'Juegos Olímpicos en la Ciudad de México'],
    [1969, 'El ser humano llega a la Luna'], [1985, 'Sismo en la Ciudad de México'], [1987, 'Monte Albán y el Centro Histórico de Oaxaca, Patrimonio de la Humanidad'],
    [1989, 'Cae el Muro de Berlín'], [1991, 'La World Wide Web se abre al público'], [1994, 'Entra en vigor el TLCAN']
  ];
  AR.EVENTS = EVENTS;
  AR.register({
    id: 'time', num: '13', name: 'TIME MASTER', icon: '⏳', category: 'Historia', difficulty: 3, levels: true, xpPer: 40,
    c1: '#f59e0b', c2: '#a855f7',
    desc: 'La línea del tiempo se fracturó. Reacomoda los acontecimientos en orden cronológico antes de que colapse.',
    howTo: ['Arrastra las tarjetas para ordenarlas del MÁS ANTIGUO (arriba) al MÁS RECIENTE (abajo). También puedes tocar dos tarjetas para intercambiarlas.', 'Presiona VERIFICAR. Las tarjetas correctas quedan fijas; si hay errores pierdes una vida.', 'Pista ⌛: revela el año de una tarjeta (−50 puntos).', 'Cada nivel agrega más eventos y fechas más cercanas. Completa 5 líneas del tiempo para ganar.'],
    art: art('time', '#f59e0b', '#a855f7', '<line x1="20" y1="60" x2="180" y2="60"/><circle cx="45" cy="60" r="7" fill="url(#ga-time)"/><circle cx="100" cy="60" r="7"/><circle cx="155" cy="60" r="7" fill="url(#ga-time)"/><path d="M90 20 h20 l-10 14z M90 100 h20 l-10 -14z"/>'),
    create: function (ctx) {
      var L = ctx.level, lives = 3, score = 0, done = 0, items, locked, revealed, timer, pickA = null, hintsUsed = 0;
      function hud() { ctx.hud({ score: score, level: L, combo: done + '/5', comboLabel: 'LÍNEAS', lives: lives, maxLives: 3, progress: done / 5, label: 'Línea del tiempo ' + (done + 1) + ' de 5 · ' + (items ? items.length : 0) + ' eventos' }); }
      function build() {
        var n = Math.min(7, 2 + L), pool = EVENTS.slice(), pickSet;
        if (L <= 2) { pickSet = []; U.shuffle(pool).forEach(function (e) { if (pickSet.length < n && pickSet.every(function (p) { return Math.abs(p[0] - e[0]) >= 30; })) pickSet.push(e); }); }
        else { var start = U.rnd(0, pool.length - n - 2); pickSet = U.shuffle(pool.slice(start, start + n + 2)).slice(0, n); }
        if (pickSet.length < n) pickSet = U.shuffle(pool).slice(0, n);
        do { items = U.shuffle(pickSet.map(function (e) { return { y: e[0], t: e[1] }; })); } while (isSorted());
        locked = {}; revealed = {}; pickA = null;
        var t = 30 + n * 12;
        if (timer) timer.set(t); else timer = ctx.countdown(t, function () { fail(true); });
        render(); hud();
      }
      function isSorted() { for (var i = 1; i < items.length; i++) if (items[i].y < items[i - 1].y) return false; return true; }
      function render() {
        ctx.root.innerHTML = '<div class="tm-wrap"><div class="tm-label">⬆ MÁS ANTIGUO</div><div class="tm-list" id="tm-l">' + items.map(function (it, i) {
          return '<div class="tm-card ' + (locked[i] ? 'locked' : '') + (pickA === i ? ' picked' : '') + '" data-i="' + i + '"><span class="tm-dot"></span><span class="tm-year">' + (locked[i] || revealed[it.t] ? it.y : '????') + '</span><span class="tm-text">' + esc(it.t) + '</span><span class="tm-grip">⠿</span></div>';
        }).join('') + '</div><div class="tm-label">⬇ MÁS RECIENTE</div><div class="btn-row center"><button class="btn btn-primary btn-lg" id="tm-check">✔ VERIFICAR</button><button class="btn" id="tm-hint">⌛ Pista (−50)</button></div></div>';
        var list = ctx.root.querySelector('#tm-l');
        list.querySelectorAll('.tm-card').forEach(function (el) {
          var i = +el.getAttribute('data-i');
          ctx.on(el, 'pointerdown', function (e) { if (locked[i]) return; e.preventDefault(); dragStart(e, i, el, list); });
        });
        ctx.on(ctx.root.querySelector('#tm-check'), 'click', check);
        ctx.on(ctx.root.querySelector('#tm-hint'), 'click', hint);
      }
      var dr = null;
      function dragStart(e, i, el, list) { dr = { i: i, el: el, list: list, y0: e.clientY, moved: false }; el.classList.add('dragging'); }
      ctx.on(document, 'pointermove', function (e) {
        if (!dr) return; var dy = e.clientY - dr.y0; if (Math.abs(dy) > 6) dr.moved = true;
        dr.el.style.transform = 'translateY(' + dy + 'px)';
      });
      ctx.on(document, 'pointerup', function (e) {
        if (!dr) return; var d = dr; dr = null; d.el.classList.remove('dragging'); d.el.style.transform = '';
        if (!d.moved) { // tocar: seleccionar / intercambiar
          if (pickA == null) { pickA = d.i; ctx.sfx('click'); render(); }
          else { if (pickA !== d.i && !locked[pickA]) swap(pickA, d.i); pickA = null; render(); }
          return;
        }
        var cards = [].slice.call(d.list.children), target = d.i;
        cards.forEach(function (c, k) { var r = c.getBoundingClientRect(); if (e.clientY > r.top && e.clientY < r.bottom) target = k; });
        if (locked[target]) { render(); return; }
        var it = items.splice(d.i, 1)[0]; items.splice(target, 0, it);
        // reubicar los bloqueados en su lugar (no se mueven)
        fixLocked(); ctx.sfx('whoosh'); render();
      });
      function fixLocked() {
        var lockedItems = Object.keys(locked).map(Number).map(function (k) { return { k: k, it: locked[k] }; });
        var free = items.filter(function (it) { return !lockedItems.some(function (l) { return l.it === it; }); });
        var out = []; for (var i = 0; i < items.length; i++) { var l = lockedItems.find(function (x) { return x.k === i; }); out.push(l ? l.it : free.shift()); }
        items = out;
      }
      function swap(a, b) { if (locked[a] || locked[b]) return; var t = items[a]; items[a] = items[b]; items[b] = t; ctx.sfx('whoosh'); }
      function hint() {
        var cand = items.filter(function (it, i) { return !locked[i] && !revealed[it.t]; });
        if (!cand.length) return; revealed[U.pick(cand).t] = true; hintsUsed++; score = Math.max(0, score - 50); ctx.sfx('power'); render(); hud();
      }
      function check() {
        var sorted = items.slice().sort(function (a, b) { return a.y - b.y; }), wrong = 0;
        items.forEach(function (it, i) { if (sorted[i] === it || sorted[i].y === it.y) locked[i] = it; else wrong++; });
        if (!wrong) {
          timer.stop(); var gain = items.length * 100 + Math.round(timer.left) * 5; score += gain; done++; L++;
          ctx.sfx('correct'); render(); ctx.burstAt(ctx.root.querySelector('#tm-l')); ctx.floatAt(ctx.root.querySelector('#tm-l'), '+' + gain, 'plus'); hud();
          if (done >= 5) { ctx.after(700, function () { ctx.end({ score: score, win: true, level: L - 1, message: '¡Reparaste las 5 líneas del tiempo!', stats: { 'Líneas': '5/5', 'Pistas usadas': hintsUsed, 'Vidas': lives } }); }); return; }
          ctx.after(1100, build);
        } else { render(); fail(false, wrong); }
      }
      function fail(timeout, wrong) {
        lives--; ctx.sfx('wrong'); ctx.shake(); ctx.toast(timeout ? '⏰ ¡La línea del tiempo colapsó!' : '✖ ' + wrong + ' evento(s) fuera de lugar. Los correctos quedaron fijos.', 'warn'); hud();
        if (lives <= 0) { ctx.after(700, function () { ctx.end({ score: score, win: false, level: L, message: 'La línea del tiempo colapsó.', stats: { 'Líneas': done + '/5' } }); }); return; }
        if (timeout) ctx.after(900, build);
      }
      build();
      return { test: {
        solve: function () { items.sort(function (a, b) { return a.y - b.y; }); locked = {}; check(); },
        wrong: function () { items.sort(function (a, b) { return b.y - a.y; }); check(); },
        state: function () { return { L: L, lives: lives, done: done, score: score }; }
      } };
    }
  });

  /* =====================================================================
     14 · CODE BREAKER — cerraduras, cifrados y patrones
     ===================================================================== */
  AR.register({
    id: 'code', num: '14', name: 'CODE BREAKER', icon: '🔐', category: 'Lógica y cultura digital', difficulty: 4, levels: true, xpPer: 40,
    c1: '#10b981', c2: '#3b82f6',
    desc: 'Rompe cerraduras digitales: combinaciones secretas, cifrado César, código binario y patrones numéricos.',
    howTo: ['Cada nivel es una cerradura distinta. Escribe tu intento y presiona ENVIAR (o Enter).', 'Combinación: ● = dígito correcto en su lugar · ○ = dígito correcto en otro lugar.', 'César: cada letra se desplazó en el alfabeto. Binario: convierte a decimal. Patrón: descubre la regla.', 'Pista 💡 (−100): ayuda distinta en cada cerradura. Rompe 5 cerraduras para ganar (3 vidas).'],
    art: art('code', '#10b981', '#3b82f6', '<rect x="62" y="50" width="76" height="56" rx="8"/><path d="M78 50 v-14 a22 22 0 0 1 44 0 v14"/><text x="100" y="86" text-anchor="middle" font-size="20" font-family="Orbitron,sans-serif" fill="url(#ga-code)" stroke="none">1011</text>'),
    create: function (ctx) {
      var L = ctx.level, lives = 3, score = 0, cracked = 0, lock, attempts, timer, hintUsed;
      var CAESAR_WORDS = ['ENERGIA', 'CELULA', 'EMPATIA', 'RESPETO', 'TIERRA', 'ATOMO', 'OAXACA', 'NUBE', 'LIBRO', 'SCIENCE', 'FRIEND', 'FUTURE', 'DREAM', 'TEAM'];
      function mm(len, maxD, tries) { var code = []; for (var i = 0; i < len; i++) code.push(U.rnd(0, maxD)); return { type: 'mm', code: code.join(''), len: len, maxD: maxD, tries: tries, title: 'COMBINACIÓN SECRETA', prompt: len + ' dígitos del 0 al ' + maxD + ' (pueden repetirse) · ' + tries + ' intentos' }; }
      function caesar() { var w = U.pick(CAESAR_WORDS), k = U.rnd(1, 4 + Math.min(L, 6)), enc = w.split('').map(function (c) { return String.fromCharCode((c.charCodeAt(0) - 65 + k) % 26 + 65); }).join(''); return { type: 'caesar', answer: w, k: k, enc: enc, tries: 4, title: 'MENSAJE CIFRADO (CÉSAR)', prompt: 'Mensaje interceptado: <b class="cb-big">' + enc + '</b><br>Cada letra avanzó la misma cantidad de lugares en el alfabeto. Escribe la palabra original.' }; }
      function binary() { var n = 2 + Math.min(2, Math.floor(L / 3)), nums = []; for (var i = 0; i < n; i++) nums.push(U.rnd(1, L >= 6 ? 31 : 15)); return { type: 'bin', nums: nums, answer: nums.join('-'), tries: 3, title: 'PUERTA BINARIA', prompt: 'Convierte cada número binario a decimal y escríbelos separados por guiones:<br><b class="cb-big">' + nums.map(function (x) { return x.toString(2); }).join(' · ') + '</b>' }; }
      function pattern() {
        var kind = U.rnd(0, Math.min(3, L)), a = U.rnd(2, 6), d = U.rnd(2, 9), seq = [], rule;
        if (kind === 0) { for (var i = 0; i < 5; i++) seq.push(a + d * i); rule = 'Suma ' + d + ' cada vez.'; }
        else if (kind === 1) { var r = U.rnd(2, 3); for (i = 0; i < 5; i++) seq.push(a * Math.pow(r, i)); rule = 'Multiplica por ' + r + ' cada vez.'; }
        else if (kind === 2) { for (i = 1; i <= 5; i++) seq.push(i * i + a); rule = 'Cuadrados (1, 4, 9, 16…) más ' + a + '.'; }
        else { seq = [a, a + 1]; for (i = 2; i < 5; i++) seq.push(seq[i - 1] + seq[i - 2]); rule = 'Cada número es la suma de los dos anteriores.'; }
        var ans = seq.pop(); return { type: 'pat', answer: String(ans), rule: rule, tries: 3, title: 'PATRÓN NUMÉRICO', prompt: '¿Qué número sigue?<br><b class="cb-big">' + seq.join(', ') + ', ?</b>' };
      }
      function makeLock() { var k = (L - 1) % 5; return [function () { return mm(3, 5, 8); }, caesar, binary, pattern, function () { return mm(4, 7, 10); }][k](); }
      function hud() { ctx.hud({ score: score, level: L, combo: cracked + '/5', comboLabel: 'ROTAS', lives: lives, maxLives: 3, progress: cracked / 5, label: lock ? lock.title + ' · intentos restantes: ' + (lock.tries - attempts.length) : '' }); }
      function load() {
        lock = makeLock(); attempts = []; hintUsed = false;
        ctx.root.innerHTML = '<div class="cb-wrap"><div class="cb-term"><div class="cb-head">root@neuroverse:~$ <span class="cb-blink">█</span> ' + lock.title + '</div><div class="cb-prompt">' + lock.prompt + '</div><div class="cb-hist" id="cb-h"></div>' +
          '<form class="cb-form" id="cb-f"><input class="input cb-in" id="cb-in" autocomplete="off" ' + (lock.type === 'mm' ? 'inputmode="numeric" maxlength="' + lock.len + '"' : '') + ' placeholder="' + (lock.type === 'mm' ? '_'.repeat(lock.len) : 'Tu respuesta') + '"><button class="btn btn-primary">ENVIAR</button><button type="button" class="btn" id="cb-hint">💡 Pista</button></form></div></div>';
        var f = ctx.root.querySelector('#cb-f');
        ctx.on(f, 'submit', function (e) { e.preventDefault(); guess(ctx.root.querySelector('#cb-in').value); });
        ctx.on(ctx.root.querySelector('#cb-hint'), 'click', hint);
        ctx.root.querySelector('#cb-in').focus();
        var t = 60 + lock.tries * 8;
        if (timer) timer.set(t); else timer = ctx.countdown(t, function () { failLock('⏰ Tiempo agotado.'); });
        hud();
      }
      function line(html, cls) { ctx.root.querySelector('#cb-h').insertAdjacentHTML('beforeend', '<div class="cb-line ' + (cls || '') + '">' + html + '</div>'); }
      function guess(v) {
        v = String(v || '').trim().toUpperCase().replace(/\s+/g, '');
        if (!v) return;
        if (lock.type === 'mm' && !new RegExp('^[0-' + lock.maxD + ']{' + lock.len + '}$').test(v)) { ctx.toast('Escribe ' + lock.len + ' dígitos del 0 al ' + lock.maxD, 'warn'); return; }
        attempts.push(v); ctx.root.querySelector('#cb-in').value = '';
        var ok;
        if (lock.type === 'mm') {
          var ex = 0, pr = 0, cc = lock.code.split(''), gg = v.split(''), restC = [], restG = [];
          for (var i = 0; i < lock.len; i++) { if (cc[i] === gg[i]) ex++; else { restC.push(cc[i]); restG.push(gg[i]); } }
          restG.forEach(function (d) { var j = restC.indexOf(d); if (j >= 0) { pr++; restC.splice(j, 1); } });
          ok = ex === lock.len;
          line('&gt; ' + v + '  <span class="cb-pegs">' + '●'.repeat(ex) + '○'.repeat(pr) + '<i>' + '·'.repeat(lock.len - ex - pr) + '</i></span>', ok ? 'ok' : '');
        } else {
          ok = v === lock.answer;
          line('&gt; ' + esc(v) + (ok ? '  ACCESO CONCEDIDO' : '  ACCESO DENEGADO'), ok ? 'ok' : 'bad');
        }
        if (ok) {
          timer.stop(); cracked++; L++;
          var gain = 300 + (lock.tries - attempts.length) * 60 + Math.round(timer.left) * 3 - (hintUsed ? 100 : 0); score += Math.max(100, gain);
          ctx.sfx('achievement'); ctx.flash('rgba(16,185,129,.25)'); hud();
          if (cracked >= 5) { ctx.after(700, function () { ctx.end({ score: score, win: true, level: L - 1, message: '¡Rompiste las 5 cerraduras del sistema!', stats: { 'Cerraduras': '5/5', 'Vidas': lives } }); }); return; }
          ctx.after(1000, load);
        } else {
          ctx.sfx('wrong');
          if (attempts.length >= lock.tries) failLock('Sin intentos.');
        }
        hud();
      }
      function failLock(msg) {
        timer.stop(); lives--; ctx.shake();
        var sol = lock.type === 'mm' ? lock.code : lock.answer;
        line('!! ' + msg + ' La clave era: ' + esc(sol) + (lock.rule ? ' (' + esc(lock.rule) + ')' : ''), 'bad'); hud();
        if (lives <= 0) { ctx.after(1200, function () { ctx.end({ score: score, win: false, level: L, message: 'El sistema te bloqueó. Rompiste ' + cracked + ' cerraduras.', stats: { 'Cerraduras': cracked + '/5' } }); }); return; }
        L++; ctx.after(1600, load);
      }
      function hint() {
        if (hintUsed) { ctx.toast('Solo una pista por cerradura.', 'warn'); return; }
        hintUsed = true; score = Math.max(0, score - 100); ctx.sfx('power');
        if (lock.type === 'mm') { var p = U.rnd(0, lock.len - 1); line('💡 El dígito ' + (p + 1) + ' es ' + lock.code[p], 'hint'); }
        else if (lock.type === 'caesar') line('💡 Cada letra avanzó ' + lock.k + ' lugares. Retrocede ' + lock.k + ' (ej. ' + lock.enc[0] + ' → ' + lock.answer[0] + ').', 'hint');
        else if (lock.type === 'bin') line('💡 Valores de cada posición (de derecha a izquierda): 1, 2, 4, 8, 16. Suma los que tienen 1.', 'hint');
        else line('💡 Regla: ' + esc(lock.rule), 'hint');
        hud();
      }
      load();
      return { test: {
        solve: function () {
          if (lock.type !== 'mm') { guess(lock.answer); return; }
          // Resolución honesta con las pistas ●/○: descarta combinaciones incompatibles
          var all = []; (function gen(p) { if (p.length === lock.len) { all.push(p); return; } for (var d = 0; d <= lock.maxD; d++) gen(p + d); })('');
          function fb(a, b) { var ex = 0, pr = 0, rc = [], rg = []; for (var i = 0; i < a.length; i++) { if (a[i] === b[i]) ex++; else { rc.push(a[i]); rg.push(b[i]); } } rg.forEach(function (d) { var j = rc.indexOf(d); if (j >= 0) { pr++; rc.splice(j, 1); } }); return ex + ',' + pr; }
          var cands = all, guard = 0;
          while (lock && lock.type === 'mm' && attempts.length < lock.tries && guard++ < 12) {
            var gss = cands[0]; var code = lock.code; guess(gss); if (gss === code) return;
            var f = fb(code, gss); cands = cands.filter(function (c) { return fb(c, gss) === f; });
          }
        },
        wrong: function () { guess(lock.type === 'mm' ? '0'.repeat(lock.len) === lock.code ? '1'.repeat(lock.len) : '0'.repeat(lock.len) : 'ZZZ'); },
        state: function () { return { L: L, lives: lives, cracked: cracked, type: lock && lock.type, score: score }; }
      } };
    }
  });

  /* =====================================================================
     15 · SURVIVAL ARENA — rondas mixtas hasta caer
     ===================================================================== */
  AR.register({
    id: 'survival', num: '15', name: 'SURVIVAL ARENA', icon: '☄️', category: 'Supervivencia', difficulty: 5, levels: false, xpPer: 40,
    c1: '#ef4444', c2: '#a855f7',
    desc: 'Ronda tras ronda: matemáticas, memoria, ciencias, historia, cultura digital y lógica. ¿Cuánto resistirás?',
    howTo: ['Cada ronda es un reto distinto y aleatorio. Respóndelo antes de que el anillo se cierre.', 'Cada ronda da menos tiempo y es más difícil.', 'Tienes 3 vidas. Cada 5 rondas recuperas una vida (máximo 3).', 'Sobrevive 20 rondas para ganar. Tu récord de rondas entra a la clasificación.'],
    art: art('survival', '#ef4444', '#a855f7', '<circle cx="100" cy="60" r="44" stroke-dasharray="14 6"/><circle cx="100" cy="60" r="28"/><path d="M100 36 l6 18 h18 l-14 10 l6 18 l-16 -10 l-16 10 l6 -18 l-14 -10 h18z" fill="url(#ga-survival)" stroke="none"/>'),
    create: function (ctx) {
      var round = 0, lives = 3, score = 0, streak = 0, best = 0, passed = 0, q, ringT, ringMax, locked = true, WIN = 20;
      var KINDS = ['math', 'memory', 'science', 'history', 'digital', 'logic'];
      ctx.root.innerHTML = '<div class="sv-wrap"><div class="sv-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="sv-bg"/><circle cx="60" cy="60" r="54" class="sv-fg" id="sv-fg"/></svg><div class="sv-round"><small>RONDA</small><b id="sv-r">1</b></div></div><div class="sv-kind" id="sv-k"></div><div class="sv-q" id="sv-q"></div><div class="sv-opts" id="sv-o"></div></div>';
      var fg = ctx.root.querySelector('#sv-fg'), qEl = ctx.root.querySelector('#sv-q'), oEl = ctx.root.querySelector('#sv-o'), kEl = ctx.root.querySelector('#sv-k');
      function hud() { ctx.hud({ score: score, level: round, combo: streak, lives: lives, maxLives: 3, progress: round / WIN, label: 'Ronda ' + round + ' · objetivo: ' + WIN + ' rondas', time: ringT }); }
      function opts3(correct, wrongs) { var arr = [String(correct)]; wrongs.forEach(function (w) { if (arr.indexOf(String(w)) < 0 && arr.length < 4) arr.push(String(w)); }); return { opts: U.shuffle(arr), ans: String(correct) }; }
      function gen(kind) {
        var d = Math.min(8, 1 + Math.floor(round / 3));
        if (kind === 'math') { var op = AR.makeOp(d); var o = opts3(op.a, [op.a + U.rnd(1, 5), op.a - U.rnd(1, 4), op.a + 10, op.a * 2 + 1]); return { k: '🧮 MATEMÁTICAS', t: op.q + ' = ?', opts: o.opts, ans: o.ans }; }
        if (kind === 'science') { var e = U.pick(AR.ELEMENTS.slice(0, 10 + d * 2)), w = U.shuffle(AR.ELEMENTS.filter(function (x) { return x !== e; })).slice(0, 3).map(function (x) { return x[1]; }); var o2 = opts3(e[1], w); return { k: '⚗️ CIENCIAS', t: '¿Qué elemento tiene el símbolo «' + e[0] + '»?', opts: o2.opts, ans: o2.ans }; }
        if (kind === 'history') { var pair = U.shuffle(AR.EVENTS).slice(0, 2); var first = pair[0][0] < pair[1][0] ? pair[0] : pair[1]; return { k: '⏳ HISTORIA', t: '¿Qué ocurrió PRIMERO?', opts: pair.map(function (p) { return p[1]; }), ans: first[1] }; }
        if (kind === 'digital') {
          if (Math.random() < .5) { var n = U.rnd(1, 7 + d * 3), o3 = opts3(n, [n + 1, n + 2, Math.max(0, n - 1), n + 4]); return { k: '💻 CULTURA DIGITAL', t: 'El número binario ' + n.toString(2) + ' en decimal es…', opts: o3.opts, ans: o3.ans }; }
          var f = U.pick(NV.RAPID.filter(function (r) { return r.w === 'cyber' || r.w === 'emo' || r.w === 'res'; })); return { k: '💻 CULTURA DIGITAL Y CONVIVENCIA', t: f.t, opts: ['VERDADERO', 'FALSO'], ans: f.a ? 'VERDADERO' : 'FALSO' };
        }
        if (kind === 'logic') { var a = U.rnd(1, 6), s = U.rnd(2, 4 + d), seq = [a, a + s, a + 2 * s, a + 3 * s]; if (round > 8 && Math.random() < .5) { seq = [a, a * 2, a * 4, a * 8]; s = null; } var nx = s ? a + 4 * s : a * 16, o4 = opts3(nx, [nx + 1, nx - 2, nx + (s || a), nx * 2]); return { k: '🧠 LÓGICA', t: '¿Qué sigue? ' + seq.join(', ') + ', …', opts: o4.opts, ans: o4.ans }; }
        // memoria: muestra un código y luego pregunta
        var len = Math.min(7, 3 + Math.floor(round / 4)), sym = '◆●▲★■✚♥', code = ''; for (var i = 0; i < len; i++) code += sym[U.rnd(0, sym.length - 1)];
        var wrongs = [0, 1, 2].map(function () { var c = code.split(''), p = U.rnd(0, len - 1); c[p] = sym[(sym.indexOf(c[p]) + U.rnd(1, 6)) % sym.length]; return c.join(''); });
        var o5 = opts3(code, wrongs); return { k: '🔁 MEMORIA', t: 'Memoriza: ' + code, mem: code, opts: o5.opts, ans: o5.ans };
      }
      function next() {
        round++; locked = true;
        if (round > 1 && (round - 1) % 5 === 0 && lives < 3) { lives++; ctx.toast('❤ ¡Vida extra por resistir 5 rondas!', 'ok'); }
        q = gen(U.pick(KINDS));
        ctx.root.querySelector('#sv-r').textContent = round; kEl.textContent = q.k;
        ringMax = Math.max(4, 11 - round * 0.35); ringT = ringMax;
        oEl.innerHTML = ''; qEl.textContent = q.t; qEl.classList.remove('in'); void qEl.offsetWidth; qEl.classList.add('in');
        var showOpts = function () {
          oEl.innerHTML = q.opts.map(function (o, i) { return '<button class="sv-opt" data-o="' + i + '"><span>' + (i + 1) + '</span>' + esc(o) + '</button>'; }).join('');
          oEl.querySelectorAll('[data-o]').forEach(function (b) { ctx.on(b, 'click', function () { answer(+b.getAttribute('data-o')); }); });
          locked = false;
        };
        if (q.mem) { ctx.after(Math.max(1200, 2600 - round * 60), function () { qEl.textContent = '¿Cuál era el código?'; showOpts(); }); }
        else showOpts();
        hud();
      }
      function answer(i) {
        if (locked) return; locked = true;
        var ok = i >= 0 && q.opts[i] === q.ans, btns = oEl.querySelectorAll('.sv-opt');
        btns.forEach(function (b, k) { b.disabled = true; if (q.opts[k] === q.ans) b.classList.add('ok'); else if (k === i) b.classList.add('bad'); });
        if (ok) { streak++; passed++; best = Math.max(best, streak); var gain = 100 + round * 20 + Math.round(ringT * 10) + (streak >= 5 ? 100 : 0); score += gain; ctx.sfx('correct'); ctx.floatAt(qEl, '+' + gain, 'plus'); }
        else { streak = 0; lives--; ctx.sfx('wrong'); ctx.flash(); ctx.shake(); }
        hud();
        if (lives <= 0) { ctx.after(900, function () { finish(false); }); return; }
        if (ok && round >= WIN) { ctx.after(700, function () { finish(true); }); return; }
        ctx.after(ok ? 650 : 1300, next);
      }
      function finish(win) { var survived = win ? WIN : round - 1; ctx.end({ score: score, win: win, level: survived, message: win ? '¡Sobreviviste las ' + WIN + ' rondas de la arena!' : 'Resististe hasta la ronda ' + round + '.', stats: { 'Rondas resistidas': survived, 'Rondas acertadas': passed, 'Mejor racha': best }, achievements: survived >= 10 ? ['a_survivor'] : [] }); }
      ctx.every(100, function () {
        if (locked) return;
        ringT = Math.max(0, ringT - 0.1); fg.style.strokeDashoffset = (1 - ringT / ringMax) * 339.3; ctx.hud({ time: ringT });
        if (ringT <= 0) answer(-1);
      });
      ctx.on(document, 'keydown', function (e) { if (/^[1-4]$/.test(e.key) && !locked && q && +e.key <= q.opts.length) { answer(+e.key - 1); e.preventDefault(); } });
      ctx.after(400, next);
      return { test: { answer: function (wrong) { if (locked || !q) return; var i = q.opts.indexOf(q.ans); answer(wrong ? (i + 1) % q.opts.length : i); }, state: function () { return { round: round, lives: lives, score: score, locked: locked }; } } };
    }
  });
})();
