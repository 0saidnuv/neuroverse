/* ============================================================
   NEUROVERSE — Partida en curso
   Preguntas, poderes, cronómetro, eventos, retos especiales,
   duelos, jefes finales, pausa, guardado y resultados.
   ============================================================ */
window.NV = window.NV || {};

NV.Match = (function () {
  var UI = NV.UI, E = NV.Engine, $ = UI.$, $$ = UI.$$, esc = UI.esc, fmt = UI.fmt;
  var M = null;          // partida actual (es el mismo objeto que Store.session)
  var cur = null;        // estado de la pregunta/reto en pantalla
  var T = { left: 0, total: 0, id: null, hold: false, lastTick: null };
  var keyHandler = null; // teclado contextual

  function S() { return NV.Store.get(); }
  function settings() { return S().settings; }
  function save() { NV.Store.save(); }
  function isTeamMode() { return M && M.mode !== 'campaign' && M.mode !== 'boss'; }
  function isCampaign() { return M && (M.mode === 'campaign' || M.mode === 'boss'); }
  function pts(diff) { return settings().points[diff]; }
  function worldOf(q) { return NV.worldById(q.world); }

  /* ================= CRONÓMETRO ================= */
  function stopTimer() { if (T.id) clearInterval(T.id); T.id = null; }
  function startTimer(sec, onEnd) {
    stopTimer(); T.hold = false; T.lastTick = null;
    T.total = sec; T.left = sec; renderTimer();
    if (!sec) return;
    T.id = setInterval(function () {
      if (!M || M.paused || T.hold || UI.isModalOpen()) return;
      T.left = Math.max(0, T.left - 0.1);
      var whole = Math.ceil(T.left);
      if (whole <= 5 && whole > 0 && whole !== T.lastTick) { T.lastTick = whole; NV.Audio.play('tick'); }
      renderTimer();
      if (T.left <= 0) { stopTimer(); onEnd(); }
    }, 100);
  }
  function renderTimer() {
    var el = $('.screen.active .timer'); if (!el) return;
    var num = $('.timer-num', el), ring = $('.timer-ring-fg', el);
    if (!T.total) { num.textContent = '∞'; ring.style.strokeDashoffset = 0; el.classList.remove('danger'); return; }
    num.textContent = Math.ceil(T.left);
    var frac = T.left / Math.max(T.total, T.left);
    ring.style.strokeDashoffset = (1 - frac) * 163.4;
    el.classList.toggle('danger', T.left <= 5);
  }
  function timerHTML() {
    return '<div class="timer"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" class="timer-ring-bg"/><circle cx="30" cy="30" r="26" class="timer-ring-fg"/></svg><span class="timer-num">--</span></div>';
  }
  function questionTime() {
    var base = settings().timer;
    if (!base) return 0;
    var extra = M.eventTime || 0;
    if (M.boss && cur && cur.isBoss && M.boss.phase >= 2) extra -= 5;
    return Math.max(8, base + extra);
  }

  /* ================= INICIO / REANUDAR ================= */
  function start(cfg) {
    var st = S(), s = st.settings;
    var participants = cfg.mode === 'campaign' || cfg.mode === 'boss'
      ? [{ id: 'player', name: st.profile.name || 'Jugador', color: '#8b5cf6', members: [st.profile.name || 'Jugador'] }]
      : cfg.participants.map(function (t) { return { id: t.id, name: t.name, color: t.color, members: t.members.slice() }; });
    M = E.buildMatch({ mode: cfg.mode, worlds: cfg.worlds, mission: cfg.mission, participants: participants, settings: s, rounds: cfg.rounds, title: cfg.title });
    M.config = { mode: cfg.mode, worlds: cfg.worlds.slice(), mission: cfg.mission || null, participants: participants, rounds: cfg.rounds || null, title: cfg.title || '' };
    M.eventMult = 1; M.eventTime = 0;
    st.session = M; save();
    NV.Net.emit('match:start', { match: M });
    NV.Audio.setIntense(cfg.mode === 'raid' || cfg.mode === 'boss');
    var intro;
    if (cfg.worlds.length === 1) intro = UI.transition(NV.worldById(cfg.worlds[0]), cfg.title);
    else if (cfg.mode === 'raid' || (cfg.mode === 'quick')) intro = UI.transition({ icon: cfg.mode === 'raid' ? '👾' : '⏱️', name: cfg.title, subject: participants.length + ' equipos · ' + cfg.worlds.length + ' mundos', color: '#a855f7', color2: '#22d3ee' }, participants.length + ' equipos · ' + cfg.worlds.length + ' mundos');
    else intro = UI.transition({ icon: '⚔️', name: cfg.title, color: '#3b82f6', color2: '#a855f7' }, participants.length + ' equipos · ' + cfg.worlds.length + ' mundos');
    intro.then(function () {
      var first = M.steps[0];
      return UI.countdown(first && first.round ? 'RONDA ' + first.round : first && first.type === 'boss' ? '¡SE ACERCA EL JEFE!' : '¡PREPÁRATE!');
    }).then(runStep);
  }

  function resume() {
    var st = S();
    if (!st.session) { NV.App.go('menu'); return; }
    M = st.session; M.paused = false; save();
    NV.Audio.setIntense(M.mode === 'raid' || M.mode === 'boss');
    UI.countdown('REANUDANDO', 3).then(runStep);
  }

  function restart() {
    var cfg = S().session && S().session.config;
    if (!cfg) return;
    stopTimer(); S().session = null; save();
    start(cfg);
  }
  function discard() { stopTimer(); M = null; S().session = null; save(); }

  /* ================= FLUJO DE PASOS ================= */
  var gen = 0; // cambia en cada paso: invalida temporizadores de pantallas anteriores
  function suspend() {
    gen++; stopTimer(); keyHandler = null;
    $$('.steal-ov').forEach(function (o) { o.remove(); });
    if (M) { M.paused = true; save(); }
    M = null; cur = null;
  }
  function runStep() {
    if (!M) return;
    gen++;
    stopTimer();
    if (M.stepIndex >= M.steps.length) { finish(); return; }
    if (M.mode === 'campaign' && M.participants[0].lives <= 0) { finish(false); return; }
    var step = M.steps[M.stepIndex];
    if (step.done) { M.stepIndex++; runStep(); return; }
    // Limpia las pantallas de juego para que no queden botones de pasos anteriores
    ['#s-question', '#s-special', '#s-boss'].forEach(function (id) { $(id).innerHTML = ''; });
    save();
    NV.Net.emit('match:step', { stepIndex: M.stepIndex, step: step });
    if (step.type === 'q') showQuestion(step);
    else if (step.type === 'special') showSpecial(step);
    else if (step.type === 'duel') showDuel(step);
    else if (step.type === 'boss') startBoss();
  }

  function next() {
    if (!M) return;
    var prev = M.steps[M.stepIndex];
    if (prev) prev.done = true;
    M.stepIndex++;
    // Seguimiento para la misión secreta "Remontada"
    if (M.mode === 'arena' && M.halfwayLast == null && M.stepIndex >= Math.floor(M.steps.length / 2)) {
      // Solo cuenta si hay un último lugar claro (sin empate)
      var r = E.ranking(M.participants), last = r[r.length - 1], prevLast = r[r.length - 2];
      M.halfwayLast = prevLast && last.score < prevLast.score ? last.id : '';
    }
    save();
    if (M.stepIndex >= M.steps.length) { finish(); return; }
    var step = M.steps[M.stepIndex];
    var chain = Promise.resolve();
    // Evento aleatorio antes de preguntas normales
    if (settings().events && step.type === 'q' && M.stepIndex > 1 && !M.lastWasEvent) {
      var ev = E.rollEvent(0.22);
      if (ev) { M.lastWasEvent = true; chain = chain.then(function () { return showEvent(ev, step); }); }
      else M.lastWasEvent = false;
    } else M.lastWasEvent = false;
    if (step.round && prev && prev.round && step.round !== prev.round) chain = chain.then(function () { return UI.countdown('RONDA ' + step.round); });
    chain.then(runStep); // la presentación del jefe la muestra startBoss() una sola vez
  }

  /* ================= EVENTOS ALEATORIOS ================= */
  function showEvent(ev, step) {
    NV.Audio.play('event'); UI.flash('rgba(34,211,238,.25)');
    var who = M.participants[step.who || 0], extra = '';
    if (ev.id === 'storm') M.eventMult = 2;
    if (ev.id === 'time') M.eventTime = 10;
    if (ev.id === 'blackout') M.eventTime = -5;
    if (ev.id === 'supply') { var k = givePower(who); extra = k ? '<p><b>' + esc(who.name) + '</b> recibe: ' + E.POWERUPS[k].icon + ' ' + E.POWERUPS[k].name + '</p>' : '<p>' + esc(who.name) + ' ya tiene el inventario lleno.</p>'; }
    if (ev.id === 'bonus') M.participants.forEach(function (p) { p.score += 50; p.bonus += 50; });
    save();
    return UI.modal({ title: '<span class="event-title">⚠ EVENTO ALEATORIO</span>', html: '<div class="event-card"><div class="event-icon">' + ev.icon + '</div><h3>' + ev.name + '</h3><p>' + ev.desc + '</p>' + extra + '</div>', buttons: [{ label: 'CONTINUAR', value: true, cls: 'btn-primary' }], dismiss: false });
  }
  function givePower(p) {
    var keys = E.shuffle(Object.keys(E.POWERUPS)).filter(function (k) { return p.powerups[k] < E.POWER_MAX; });
    if (!keys.length) return null;
    p.powerups[keys[0]]++; return keys[0];
  }

  /* ================= HUD / LADO ================= */
  function sideRanking(activeIdx) {
    var r = E.ranking(M.participants);
    if (!isTeamMode()) {
      var p = M.participants[0], li = E.levelInfo(S().profile.xp);
      return '<div class="side-title">JUGADOR</div><div class="side-player"><div class="avatar">' + esc(p.name.charAt(0).toUpperCase()) + '</div><b>' + esc(p.name) + '</b><small>Nivel ' + li.level + ' · ' + E.rankName(li.level) + '</small></div>' +
        '<div class="side-stats"><div><span>Puntos</span><b>' + fmt(p.score) + '</b></div><div><span>Aciertos</span><b>' + p.correct + '</b></div><div><span>Errores</span><b>' + p.wrong + '</b></div><div><span>Mejor racha</span><b>' + p.bestStreak + '</b></div></div>' +
        '<div class="side-title">PROGRESO</div><div class="progress-dots">' + M.steps.map(function (s, i) { return '<i class="' + (i < M.stepIndex ? 'done' : i === M.stepIndex ? 'now' : '') + ' ' + s.type + '"></i>'; }).join('') + '</div>';
    }
    return '<div class="side-title">CLASIFICACIÓN EN VIVO</div><div class="live-rank">' + r.map(function (p, i) {
      var idx = M.participants.indexOf(p);
      return '<div class="lr-row ' + (idx === activeIdx ? 'active' : '') + '" style="--tc:' + p.color + '"><span class="lr-pos">' + (i + 1) + '</span><span class="lr-name">' + esc(p.name) + (p.streak >= 3 ? ' <small class="fire">🔥' + p.streak + '</small>' : '') + '</span><b class="lr-score">' + fmt(p.score) + '</b></div>';
    }).join('') + '</div><div class="side-title">PROGRESO</div><div class="progress-dots">' + M.steps.map(function (s, i) { return '<i class="' + (i < M.stepIndex ? 'done' : i === M.stepIndex ? 'now' : '') + ' ' + s.type + '" title="' + s.type + '"></i>'; }).join('') + '</div>';
  }
  function refreshSide(activeIdx) { var s = $('.q-side'); if (s) s.innerHTML = sideRanking(activeIdx); }

  function hudHTML(p, extra) {
    var mult = E.streakMult(p.streak + 1);
    return '<div class="hud glass">' +
      '<div class="hud-step">PASO <b>' + (M.stepIndex + 1) + '</b>/' + M.steps.length + '</div>' +
      timerHTML() +
      '<div class="hud-item"><span>PUNTOS</span><b class="hud-score">' + fmt(p.score) + '</b></div>' +
      '<div class="hud-item"><span>RACHA</span><b class="hud-streak">' + (p.streak >= 3 ? '🔥' : '') + p.streak + '</b></div>' +
      '<div class="hud-item"><span>MULTI</span><b class="hud-mult ' + (mult > 1 ? 'hot' : '') + '">×' + mult + '</b></div>' +
      (p.lives != null ? '<div class="hud-item lives"><span>VIDAS</span><b>' + UI.hearts(p.lives, settings().lives) + '</b></div>' : '') +
      (extra || '') +
      '<button class="icon-btn hud-pause" data-qpause title="Pausa (P)">⏸</button></div>';
  }

  function powerbarHTML(p, allowed) {
    return '<div class="powerbar">' + allowed.map(function (k) {
      var pu = E.POWERUPS[k], n = p.powerups[k], on = (k === 'shield' && p.active.shield) || (k === 'double' && p.active.double) || (k === 'second' && p.active.second);
      return '<button class="power ' + (on ? 'on' : '') + '" data-power="' + k + '" ' + (n <= 0 && !on ? 'disabled' : '') + ' title="' + esc(pu.desc) + '"><span class="pw-icon">' + pu.icon + '</span><span class="pw-name">' + pu.name + '</span><span class="pw-count">' + (on ? 'ACTIVO' : '×' + n) + '</span></button>';
    }).join('') + '<button class="power info" data-powinfo title="¿Cómo funcionan los poderes?">?</button></div>';
  }

  function questionCardHTML(q, prepared, opts) {
    opts = opts || {};
    var w = worldOf(q);
    return '<div class="q-card glass" style="--wc:' + w.color + ';--wc2:' + w.color2 + '">' +
      '<div class="q-meta"><span class="q-world">' + w.icon + ' ' + w.name + '</span><span class="q-cat">' + esc(q.category) + '</span><span class="q-diff d-' + q.difficulty + '">' + NV.DIFF_LABEL[q.difficulty] + '</span><span class="q-pts">' + (opts.ptsLabel || fmt(pts(q.difficulty)) + ' pts') + '</span>' + (M.eventMult > 1 ? '<span class="q-event">🌩️ ×2</span>' : '') + '</div>' +
      '<div class="q-text">' + esc(q.text) + '</div></div>' +
      '<div class="answers">' + prepared.options.map(function (o, i) {
        return '<button class="answer" data-ans="' + i + '" style="animation-delay:' + (i * 0.07) + 's"><span class="ans-key">' + 'ABCD'[i] + '</span><span class="ans-text">' + esc(o) + '</span></button>';
      }).join('') + '</div>';
  }

  function bindAnswers(root, onPick) {
    $$('.answer', root).forEach(function (b) { b.onclick = function () { onPick(+b.getAttribute('data-ans')); }; b.onmouseenter = function () { NV.Audio.play('hover'); }; });
  }

  function revealAnswers(root, chosen) {
    $$('.answer', root).forEach(function (b) {
      var i = +b.getAttribute('data-ans'); b.disabled = true;
      if (i === cur.prepared.correctIndex) b.classList.add('correct');
      else if (i === chosen) b.classList.add('wrong');
      else b.classList.add('dim');
    });
  }

  function feedbackHTML(ok, q, lines, extraTitle) {
    return '<div class="feedback ' + (ok ? 'ok' : 'bad') + '">' +
      '<div class="fb-head"><span class="fb-icon">' + (ok ? '✔' : '✖') + '</span><span class="fb-title">' + (extraTitle || (ok ? pickMsg(OK_MSGS) : pickMsg(BAD_MSGS))) + '</span></div>' +
      (lines ? '<div class="fb-lines">' + lines + '</div>' : '') +
      '<div class="fb-exp"><b>Respuesta correcta:</b> ' + esc(cur.prepared.options[cur.prepared.correctIndex]) + '<br>' + esc(q.explanation) + '</div>' +
      '<button class="btn btn-primary btn-lg fb-next" data-next>CONTINUAR ⏎</button></div>';
  }
  var OK_MSGS = ['¡Conexión neuronal perfecta!', '¡Excelente!', '¡Dato asegurado!', '¡Sinapsis activada!', '¡Así se hace!', '¡Conocimiento desbloqueado!'];
  var BAD_MSGS = ['Error en la matriz…', '¡Casi! Aprende de esta.', 'Recalibrando neuronas…', 'Fallo de conexión', 'El conocimiento se resiste… por ahora'];
  function pickMsg(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ================= PREGUNTA NORMAL ================= */
  function showQuestion(step) {
    var q = NV.questionById(step.qid), p = M.participants[step.who];
    cur = { step: step, q: q, p: p, prepared: E.prepare(q), locked: false, half: false, removed: [], isBoss: false };
    var allowed = ['shield', 'double', 'time', 'second', 'steal'];
    var el = $('#s-question');
    el.innerHTML = '<div class="q-layout"><div class="q-main">' +
      hudHTML(p) +
      (isTeamMode() ? '<div class="turn-banner" style="--tc:' + p.color + '"><span>TURNO DE</span><b>' + esc(p.name) + '</b><small>' + esc(p.members.join(' · ')) + '</small></div>' : '') +
      questionCardHTML(q, cur.prepared) +
      powerbarHTML(p, allowed) +
      '<div class="fb-slot"></div>' +
      '</div><aside class="q-side glass">' + sideRanking(step.who) + '</aside></div>';
    UI.show('question');
    bindAnswers(el, answerNormal);
    bindPowers(el, allowed);
    bindCommon(el);
    keyHandler = function (k) {
      var i = 'ABCD1234'.indexOf(k.toUpperCase()); if (i >= 0 && !cur.locked) { answerNormal(i % 4); return true; }
      if ((k === 'Enter' || k === ' ') && cur.locked) { var n = $('[data-next]'); if (n) n.click(); return true; }
      return false;
    };
    startTimer(questionTime(), function () { answerNormal(-1); });
  }

  function answerNormal(i) {
    if (!cur || cur.locked) return;
    if (i >= 0 && cur.removed.indexOf(i) >= 0) return;
    var p = cur.p, q = cur.q, s = settings(), ok = i === cur.prepared.correctIndex;
    var el = $('#s-question'), lines = '', title = null;
    if (!ok && i >= 0 && p.active.second && !cur.half) {
      // Segunda oportunidad: se elimina la opción y se vuelve a responder
      p.active.second = false; cur.half = true; cur.removed.push(i);
      var b = $('[data-ans="' + i + '"]', el); b.classList.add('wrong', 'removed'); b.disabled = true;
      NV.Audio.play('wrong'); UI.toast('🔁 ¡SEGUNDA OPORTUNIDAD! Responde de nuevo (vale la mitad).', 'power');
      refreshPowerbar();
      return;
    }
    cur.locked = true; stopTimer();
    cur.step.done = true; // ya calificada: al reanudar no se repite
    p.answered++;
    if (ok) {
      p.streak++; p.correct++; p.bestStreak = Math.max(p.bestStreak, p.streak);
      var sc = E.score({ base: pts(q.difficulty), streak: p.streak, timeLeft: T.left, timeTotal: T.total, double: p.active.double, eventMult: M.eventMult, half: cur.half, speedBonus: s.speedBonus });
      p.score += sc.total; p.active.double = false;
      lines = breakdown(sc);
      NV.Audio.play('correct'); UI.flash('rgba(34,211,238,.22)');
      var btn = $('[data-ans="' + i + '"]', el); if (btn) { var r = btn.getBoundingClientRect(); UI.burst(r.left + r.width / 2, r.top + r.height / 2, 30, ['#22d3ee', '#a855f7', '#fff']); UI.floatText('+' + sc.total, r.left + r.width / 2, r.top, 'plus'); }
      if (p.streak % 5 === 0) { var k = givePower(p); if (k) lines += '<div class="fb-line bonus">🎁 Racha de ' + p.streak + ': recibes ' + E.POWERUPS[k].icon + ' ' + E.POWERUPS[k].name + '</div>'; }
      if (isCampaign()) campaignCorrect(q, p);
    } else {
      p.wrong++;
      if (p.active.shield) {
        lines = '<div class="fb-line shield">🛡️ El ESCUDO absorbió la penalización. Conservas tu racha' + (p.lives != null ? ' y tus vidas' : ' y tus puntos') + '.</div>';
        NV.Audio.play('shield');
      } else {
        p.streak = 0;
        if (p.lives != null) { p.lives = Math.max(0, p.lives - 1); lines = '<div class="fb-line bad">💔 Pierdes una vida. Te quedan ' + p.lives + '.</div>'; }
        else if (isTeamMode() && s.penalty) { var lost = Math.min(p.score, s.penalty); p.score -= lost; lines = '<div class="fb-line bad">−' + lost + ' puntos de penalización. Racha reiniciada.</div>'; }
        NV.Audio.play('wrong'); UI.flash(); UI.shake($('.q-card'));
      }
      if (i < 0) title = '⏰ ¡Se acabó el tiempo!';
      if (isCampaign()) S().profile.stats.wrong++;
    }
    p.active.shield = false; p.active.second = false;
    M.eventMult = 1; M.eventTime = 0;
    NV.Net.emit('match:answer', { who: p.id, correct: ok });
    revealAnswers(el, i);
    $('.fb-slot', el).innerHTML = feedbackHTML(ok, q, lines, title);
    $('[data-next]', el).onclick = function () { this.disabled = true; NV.Audio.play('click'); afterAnswer(); };
    updateHud(p); refreshSide(cur.step.who); refreshPowerbar(true);
    $('.fb-slot', el).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    save();
  }

  function afterAnswer() {
    if (M.mode === 'campaign' && M.participants[0].lives <= 0) { M.steps[M.stepIndex].done = true; finish(false); return; }
    next();
  }

  function breakdown(sc) {
    var parts = ['Base ' + sc.base];
    if (sc.streakMult > 1) parts.push('Racha ×' + sc.streakMult);
    if (sc.double > 1) parts.push('Doble XP ×2');
    if (sc.eventMult > 1) parts.push('Tormenta ×2');
    if (sc.half) parts.push('2ª oportunidad ×0.5');
    if (sc.speed) parts.push('Rapidez +' + sc.speed);
    return '<div class="fb-line good">+' + fmt(sc.total) + ' puntos <small>(' + parts.join(' · ') + ')</small></div>';
  }

  function updateHud(p) {
    var h = $('.hud'); if (!h) return;
    var sc = $('.hud-score', h); if (sc) sc.textContent = fmt(p.score);
    var st = $('.hud-streak', h); if (st) st.textContent = (p.streak >= 3 ? '🔥' : '') + p.streak;
    var m = $('.hud-mult', h); if (m) { var mult = E.streakMult(p.streak + 1); m.textContent = '×' + mult; m.classList.toggle('hot', mult > 1); }
    var lv = $('.hud-item.lives b', h); if (lv && p.lives != null) lv.innerHTML = UI.hearts(p.lives, settings().lives);
  }

  /* ================= PODERES ================= */
  var currentAllowed = [];
  function bindPowers(root, allowed) {
    currentAllowed = allowed;
    $$('[data-power]', root).forEach(function (b) { b.onclick = function () { usePower(b.getAttribute('data-power')); }; });
    var info = $('[data-powinfo]', root);
    if (info) info.onclick = function () {
      UI.alert('PODERES', '<ul class="power-help">' + allowed.map(function (k) { var x = E.POWERUPS[k]; return '<li><b>' + x.icon + ' ' + x.name + '</b><br>' + esc(x.desc) + '</li>'; }).join('') + '</ul><p class="muted">Máximo ' + E.POWER_MAX + ' de cada poder. Se consiguen más con rachas de 5 y eventos aleatorios.</p>');
    };
  }
  function refreshPowerbar(lockAll) {
    var bar = $('.screen.active .powerbar'); if (!bar || !cur) return;
    var tmp = document.createElement('div'); tmp.innerHTML = powerbarHTML(cur.p, currentAllowed);
    bar.replaceWith(tmp.firstChild);
    bindPowers($('.screen.active'), currentAllowed);
    if (lockAll) $$('.screen.active [data-power]').forEach(function (b) { b.disabled = true; });
  }
  function usePower(k) {
    if (!cur || cur.locked) { UI.toast('Los poderes se usan antes de responder.', 'warn'); return; }
    var p = cur.p;
    if (p.powerups[k] <= 0) return;
    if ((k === 'shield' && p.active.shield) || (k === 'double' && p.active.double) || (k === 'second' && p.active.second)) { UI.toast('Ese poder ya está activo.', 'warn'); return; }
    if (k === 'time' && !T.total) { UI.toast('No hay cronómetro activo: el tiempo es ilimitado.', 'warn'); return; }
    if (k === 'second' && cur.half) { UI.toast('Ya estás usando tu segunda oportunidad.', 'warn'); return; }
    if (k === 'steal') { stealChallenge(); return; }
    p.powerups[k]--; p.powerUsed++; M.powerupsUsedTotal++;
    if (k === 'shield') p.active.shield = true;
    if (k === 'double') p.active.double = true;
    if (k === 'second') p.active.second = true;
    if (k === 'time') { T.left += 15; T.total = Math.max(T.total, T.left); renderTimer(); }
    NV.Audio.play(k === 'shield' ? 'shield' : 'power');
    UI.toast(E.POWERUPS[k].icon + ' <b>' + E.POWERUPS[k].name + '</b> activado', 'power', 2000);
    trackPowerUse();
    refreshPowerbar(); save();
  }
  function trackPowerUse() {
    if (!isCampaign()) return;
    var st = S().profile.stats; st.powerupsUsed++;
    if (st.powerupsUsed >= 5) NV.App.unlock('power5');
  }

  /* ---- Robo de puntos: mini reto de 3 verdadero/falso ---- */
  function stealChallenge() {
    var p = cur.p;
    var target = null;
    if (isTeamMode()) {
      target = E.ranking(M.participants.filter(function (x) { return x !== p; }))[0];
      if (!target || target.score <= 0) { UI.toast('No hay puntos que robar todavía: los demás equipos tienen 0.', 'warn'); return; }
    }
    p.powerups.steal--; p.powerUsed++; M.powerupsUsedTotal++; trackPowerUse(); save();
    T.hold = true; NV.Audio.play('power');
    var ov = document.createElement('div'); ov.className = 'overlay steal-ov';
    ov.innerHTML = '<div class="steal-box glass"><div class="kicker">🦾 ROBO DE PUNTOS</div><h2>¡Acierta los 3 para lograrlo!</h2><p class="muted">' + (target ? 'Objetivo: <b>' + esc(target.name) + '</b> (líder) · botín: hasta 150 pts' : 'Botín: +250 pts') + '</p><div id="steal-rapid"></div></div>';
    document.body.appendChild(ov);
    var items = E.shuffle(NV.RAPID).slice(0, 3);
    var prevKey = keyHandler;
    var rapid = runRapid($('#steal-rapid', ov), items, 20, function (correct) {
      var win = correct === 3, msg;
      if (win) {
        if (target) { var amt = Math.min(150, target.score); target.score -= amt; p.score += amt; msg = '¡Robo exitoso! ' + esc(p.name) + ' toma ' + amt + ' pts de ' + esc(target.name) + '.'; }
        else { p.score += 250; msg = '¡Robo exitoso! +250 pts.'; }
        NV.App.unlock('thief'); if (isCampaign()) S().profile.stats.steals++;
        NV.Audio.play('victory');
      } else { msg = 'Robo fallido (' + correct + '/3). No pierdes nada.'; NV.Audio.play('wrong'); }
      setTimeout(function () {
        ov.remove(); T.hold = false; keyHandler = prevKey;
        UI.toast((win ? '🦾 ' : '') + msg, win ? 'ok' : 'warn', 3500);
        updateHud(p); refreshSide(cur.step ? cur.step.who : 0); refreshPowerbar(); save();
      }, 1600);
    });
    keyHandler = function (k) { if (k === 'v' || k === 'V' || k === '1') { rapid.answer(true); return true; } if (k === 'f' || k === 'F' || k === '2') { rapid.answer(false); return true; } return false; };
  }

  /* ================= COMPONENTE: RÁFAGA V/F ================= */
  function runRapid(box, items, seconds, onDone) {
    var i = 0, correct = 0, details = [], left = seconds, done = false;
    box.innerHTML = '<div class="rapid"><div class="rapid-top"><span class="rapid-count"></span><div class="rapid-bar"><i></i></div><span class="rapid-time"></span></div>' +
      '<div class="rapid-card"></div><div class="rapid-btns"><button class="btn btn-true" data-tf="1">✔ VERDADERO <small>(V)</small></button><button class="btn btn-false" data-tf="0">✖ FALSO <small>(F)</small></button></div><div class="rapid-feed"></div></div>';
    function show() {
      $('.rapid-count', box).textContent = (i + 1) + ' / ' + items.length;
      var c = $('.rapid-card', box); c.textContent = items[i].t; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
    }
    function answer(val) {
      if (done) return;
      var it = items[i], ok = val === it.a;
      if (ok) correct++;
      details.push({ t: it.t, a: it.a, ok: ok, e: it.e });
      NV.Audio.play(ok ? 'correct' : 'wrong');
      $('.rapid-feed', box).innerHTML = '<span class="' + (ok ? 'good' : 'bad') + '">' + (ok ? '✔ Correcto' : '✖ Incorrecto') + '</span> · ' + esc(it.e);
      i++;
      if (i >= items.length) end(); else show();
    }
    function end() {
      if (done) return; done = true; clearInterval(id);
      $$('[data-tf]', box).forEach(function (b) { b.disabled = true; });
      onDone(correct, details);
    }
    $$('[data-tf]', box).forEach(function (b) { b.onclick = function () { answer(b.getAttribute('data-tf') === '1'); }; });
    var myGen = gen;
    var id = setInterval(function () {
      if (myGen !== gen) { done = true; clearInterval(id); return; }
      if (M && M.paused || UI.isModalOpen()) return;
      left = Math.max(0, left - 0.1);
      var bar = $('.rapid-bar i', box); if (bar) bar.style.width = (left / seconds * 100) + '%';
      var tt = $('.rapid-time', box); if (tt) tt.textContent = Math.ceil(left) + ' s';
      if (left <= 0) end();
    }, 100);
    show();
    return { answer: answer, stop: function () { done = true; clearInterval(id); } };
  }

  /* ================= RETOS ESPECIALES ================= */
  var KIND_INFO = {
    rapid: { name: 'RÁFAGA', icon: '⚡', desc: '5 afirmaciones · 30 segundos · ¿verdadero o falso?' },
    calc: { name: 'CÁLCULO NEURONAL', icon: '🧮', desc: '3 problemas · 60 segundos · escribe el resultado' },
    reflect: { name: 'DILEMA DEL CORAZÓN', icon: '💜', desc: 'Elige, discute y argumenta. Se premia la reflexión.' }
  };
  function showSpecial(step) {
    var p = M.participants[step.who], info = KIND_INFO[step.kind], max = settings().points.special;
    cur = { step: step, p: p, locked: false, special: true };
    var el = $('#s-special');
    el.innerHTML = '<div class="special-wrap">' +
      '<div class="special-head"><div class="sp-badge">' + info.icon + '</div><div><div class="kicker">RETO ESPECIAL · HASTA ' + fmt(max) + ' PUNTOS</div><h2>' + info.name + '</h2><p>' + info.desc + '</p></div>' +
      (isTeamMode() ? '<div class="turn-banner small" style="--tc:' + p.color + '"><span>TURNO DE</span><b>' + esc(p.name) + '</b></div>' : '') + '</div>' +
      '<div class="special-body glass" id="sp-body"><div class="sp-intro"><p>' + (step.kind === 'reflect' ? 'Lean la situación, elijan qué harían y prepárense para explicar <b>por qué</b>.' : '¿Listos? El tiempo empieza al presionar el botón.') + '</p><button class="btn btn-primary btn-lg" id="sp-go">¡COMENZAR RETO!</button></div></div>' +
      '</div>';
    UI.show('special'); NV.Audio.play('event');
    keyHandler = function (k) { if (k === 'Enter' || k === ' ') { var g = $('#sp-go') || $('[data-next]', el); if (g) { g.click(); return true; } } return false; };
    $('#sp-go').onclick = function () {
      NV.Audio.play('go');
      if (step.kind === 'rapid') specialRapid(p, max);
      else if (step.kind === 'calc') specialCalc(p, max);
      else specialReflect(p, max);
    };
  }
  function specialDone(p, points, html) {
    p.score += points; M.specialsDone++;
    if (cur && cur.step) cur.step.done = true;
    var box = $('#sp-body');
    box.insertAdjacentHTML('beforeend', '<div class="sp-result ' + (points > 0 ? 'ok' : 'bad') + '"><div class="sp-points">+' + fmt(points) + '</div><div>' + html + '</div><button class="btn btn-primary btn-lg" data-next>CONTINUAR ⏎</button></div>');
    var r = $('.sp-result', box); r.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (points > 0) { NV.Audio.play('victory'); var rc = r.getBoundingClientRect(); UI.burst(rc.left + 80, rc.top + 30, 50, ['#a855f7', '#22d3ee', '#facc15']); }
    $('[data-next]', box).onclick = function () { this.disabled = true; NV.Audio.play('click'); next(); };
    keyHandler = function (k) { if (k === 'Enter' || k === ' ') { var n = $('[data-next]', box); if (n) n.click(); return true; } return false; };
    save();
  }
  function specialRapid(p, max) {
    var items = E.shuffle(NV.RAPID.filter(function (r) { return M.worlds.indexOf(r.w) >= 0; }));
    if (items.length < 5) items = items.concat(E.shuffle(NV.RAPID.filter(function (r) { return items.indexOf(r) < 0; })));
    items = items.slice(0, 5);
    var body = $('#sp-body'); body.innerHTML = '<div id="sp-rapid"></div>';
    var rapid = runRapid($('#sp-rapid'), items, 30, function (correct, details) {
      var points = Math.round(max * correct / 5 / 10) * 10;
      specialDone(p, points, '<b>' + correct + ' de 5 correctas.</b><ul class="sp-details">' + details.map(function (d) { return '<li class="' + (d.ok ? 'good' : 'bad') + '">' + (d.ok ? '✔' : '✖') + ' ' + esc(d.t) + ' <small>(' + (d.a ? 'Verdadero' : 'Falso') + ': ' + esc(d.e) + ')</small></li>'; }).join('') + '</ul>');
    });
    keyHandler = function (k) { if (k === 'v' || k === 'V' || k === '1') { rapid.answer(true); return true; } if (k === 'f' || k === 'F' || k === '2') { rapid.answer(false); return true; } return false; };
  }
  function specialCalc(p, max) {
    var probs = NV.CalcGen.generate(3), left = 60, done = false;
    var body = $('#sp-body');
    body.innerHTML = '<div class="calc"><div class="rapid-top"><span>Escribe solo el número</span><div class="rapid-bar"><i></i></div><span class="rapid-time">60 s</span></div>' +
      probs.map(function (pr, i) { return '<label class="calc-row"><span class="calc-n">' + (i + 1) + '</span><span class="calc-q">' + esc(pr.text) + '</span><input class="input calc-in" type="number" inputmode="numeric" data-ci="' + i + '"></label>'; }).join('') +
      '<button class="btn btn-primary btn-lg" id="calc-check">VERIFICAR RESPUESTAS</button></div>';
    var first = $('.calc-in', body); if (first) first.focus();
    $$('.calc-in', body).forEach(function (inp, i, all) { inp.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (all[i + 1]) all[i + 1].focus(); else check(); } }; });
    var myGen = gen;
    var id = setInterval(function () {
      if (myGen !== gen) { done = true; clearInterval(id); return; }
      if (M.paused || UI.isModalOpen()) return;
      left = Math.max(0, left - 0.1);
      var b = $('.calc .rapid-bar i'); if (b) b.style.width = (left / 60 * 100) + '%';
      var t = $('.calc .rapid-time'); if (t) t.textContent = Math.ceil(left) + ' s';
      if (left <= 0) check();
    }, 100);
    function check() {
      if (done) return; done = true; clearInterval(id);
      var correct = 0, html = '<ul class="sp-details">';
      $$('.calc-in', body).forEach(function (inp, i) {
        var v = inp.value.trim(), ok = v !== '' && Number(v) === probs[i].answer;
        if (ok) correct++;
        inp.disabled = true; inp.classList.add(ok ? 'good' : 'bad');
        html += '<li class="' + (ok ? 'good' : 'bad') + '">' + (ok ? '✔' : '✖') + ' ' + esc(probs[i].text) + ' → <b>' + probs[i].answer + '</b> <small>(' + esc(probs[i].hint) + ')</small></li>';
      });
      $('#calc-check').disabled = true;
      NV.Audio.play(correct ? 'correct' : 'wrong');
      specialDone(p, Math.round(max * correct / 3 / 10) * 10, '<b>' + correct + ' de 3 correctas.</b>' + html + '</ul>');
    }
    $('#calc-check').onclick = check;
    keyHandler = function () { return false; };
  }
  function specialReflect(p, max) {
    var d = NV.DILEMMAS[(M.specialsDone + Math.floor(Math.random() * NV.DILEMMAS.length)) % NV.DILEMMAS.length];
    var opts = E.shuffle(d.options), body = $('#sp-body'), chosen = null;
    body.innerHTML = '<div class="dilemma"><h3>💜 ' + esc(d.title) + '</h3><p class="dl-text">' + esc(d.text) + '</p><p class="muted">¿Qué harían? No hay una única respuesta perfecta.</p>' +
      '<div class="answers">' + opts.map(function (o, i) { return '<button class="answer" data-dl="' + i + '"><span class="ans-key">' + 'ABCD'[i] + '</span><span class="ans-text">' + esc(o.t) + '</span></button>'; }).join('') + '</div><div id="dl-step"></div></div>';
    $$('[data-dl]', body).forEach(function (b) { b.onclick = function () { pick(+b.getAttribute('data-dl')); }; });
    keyHandler = function (k) { var i = 'ABCD1234'.indexOf(k.toUpperCase()); if (i >= 0 && chosen == null) { pick(i % 4); return true; } return false; };
    function pick(i) {
      if (chosen != null) return; chosen = opts[i];
      NV.Audio.play('click');
      $$('[data-dl]', body).forEach(function (b, j) { b.disabled = true; b.classList.add(j === i ? 'picked' : 'dim'); });
      var team = isTeamMode();
      $('#dl-step').innerHTML = '<div class="dl-feedback ' + (chosen.healthy ? 'good' : '') + '"><b>Reflexión:</b> ' + esc(chosen.f) + '</div>' +
        (team ? '<div class="dl-discuss"><div class="kicker">ARGUMENTACIÓN EN VOZ ALTA</div><p>El equipo explica en voz alta <b>por qué</b> eligió esa opción y cómo se sentirían las personas involucradas.</p><div class="rapid-top"><div class="rapid-bar"><i></i></div><span class="rapid-time">45 s</span></div><button class="btn btn-ghost btn-sm" id="dl-skip">Terminar discusión</button></div><div id="dl-rubric"></div>'
          : '<label class="field"><span>Escribe tu argumento: ¿por qué elegiste esa opción y cómo se sentirían los demás?</span><textarea class="input" id="dl-text" rows="3" maxlength="500" placeholder="Elegí esta opción porque…"></textarea></label><button class="btn btn-primary" id="dl-send">ENVIAR REFLEXIÓN</button><div id="dl-rubric"></div>');
      keyHandler = function () { return false; };
      if (team) {
        var myGen = gen, left = 45, id = setInterval(function () {
          if (myGen !== gen) { ended = true; clearInterval(id); return; }
          if (M.paused || UI.isModalOpen()) return;
          left = Math.max(0, left - 0.1);
          var b = $('.dl-discuss .rapid-bar i'); if (b) b.style.width = (left / 45 * 100) + '%';
          var t = $('.dl-discuss .rapid-time'); if (t) t.textContent = Math.ceil(left) + ' s';
          if (left <= 0) endDiscuss();
        }, 100);
        var ended = false;
        var endDiscuss = function () { if (ended) return; ended = true; clearInterval(id); $('#dl-skip').disabled = true; rubric(true); };
        $('#dl-skip').onclick = endDiscuss;
      } else {
        $('#dl-send').onclick = function () {
          var txt = $('#dl-text').value;
          if (txt.trim().length < 10) { UI.toast('Escribe al menos una idea completa para reflexionar.', 'warn'); return; }
          $('#dl-send').disabled = true; $('#dl-text').disabled = true;
          rubric(false, E.autoRubric(txt, chosen.healthy));
        };
      }
    }
    function rubric(host, auto) {
      var box = $('#dl-rubric');
      box.innerHTML = '<div class="rubric"><div class="kicker">' + (host ? 'EVALUACIÓN DEL ANFITRIÓN' : 'EVALUACIÓN AUTOMÁTICA DE TU REFLEXIÓN') + '</div>' +
        NV.REFLECT_RUBRIC.map(function (r) { return '<label class="toggle"><input type="checkbox" data-rb="' + r.id + '" ' + (auto && auto[r.id] ? 'checked' : '') + (host ? '' : ' disabled') + '><span class="tg"></span>' + esc(r.label) + '</label>'; }).join('') +
        '<p class="muted">100 pts por completar el dilema + 100 por cada criterio cumplido.</p><button class="btn btn-primary" id="rb-ok">' + (host ? 'ASIGNAR PUNTOS' : 'VER PUNTOS') + '</button></div>';
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      $('#rb-ok').onclick = function () {
        $('#rb-ok').disabled = true;
        var checks = {}; $$('[data-rb]', box).forEach(function (c) { checks[c.getAttribute('data-rb')] = c.checked; c.disabled = true; });
        var points = E.reflectPoints(checks, max);
        if (isCampaign()) { var st = S().profile.stats; st.reflections++; if (st.reflections >= 3) NV.App.unlock('reflect3'); }
        else { M.reflections = (M.reflections || 0) + 1; }
        specialDone(p, points, 'Se valoró la participación, los argumentos y la empatía. ¡Gracias por reflexionar!');
      };
    }
  }

  /* ================= DUELO ================= */
  function showDuel(step) {
    var sorted = M.participants.slice().sort(function (a, b) { return b.score - a.score; });
    var best = [sorted[0], sorted[1]], diff = Infinity;
    for (var i = 0; i < sorted.length - 1; i++) { var d = sorted[i].score - sorted[i + 1].score; if (d < diff) { diff = d; best = [sorted[i], sorted[i + 1]]; } }
    var A = best[0], B = best[1], q = NV.questionById(step.qid);
    cur = { step: step, q: q, p: null, prepared: E.prepare(q), locked: true, duel: { A: A, B: B, tried: [], turn: null }, isBoss: false };
    var el = $('#s-question');
    el.innerHTML = '<div class="q-layout"><div class="q-main">' +
      '<div class="hud glass"><div class="hud-step">⚔ DUELO</div>' + timerHTML() + '<div class="hud-item"><span>PREMIO</span><b>' + fmt(settings().points.duel) + '</b></div><button class="icon-btn hud-pause" data-qpause title="Pausa (P)">⏸</button></div>' +
      '<div class="duel-head"><button class="buzz" data-buzz="A" style="--tc:' + A.color + '"><b>' + esc(A.name) + '</b><small>¡PRIMERO! (Q)</small></button><div class="vs">VS</div><button class="buzz" data-buzz="B" style="--tc:' + B.color + '"><b>' + esc(B.name) + '</b><small>¡PRIMERO! (P)</small></button></div>' +
      '<p class="duel-help center">Ambos equipos leen la pregunta. El primero en levantar la mano gana el turno: el anfitrión presiona su botón. Si falla, el rival puede robar.</p>' +
      questionCardHTML(q, cur.prepared, { ptsLabel: fmt(settings().points.duel) + ' pts' }) +
      '<div class="fb-slot"></div></div><aside class="q-side glass">' + sideRanking(-1) + '</aside></div>';
    UI.show('question'); NV.Audio.play('roar');
    $$('.answer', el).forEach(function (b) { b.disabled = true; });
    bindAnswers(el, answerDuel);
    bindCommon(el);
    $$('[data-buzz]', el).forEach(function (b) { b.onclick = function () { buzz(b.getAttribute('data-buzz')); }; });
    keyHandler = function (k) {
      if (!cur.duel.turn && !cur.duel.over) { if (k === 'q' || k === 'Q') { buzz('A'); return true; } if (k === 'p' || k === 'P') { buzz('B'); return true; } }
      var i = 'ABCD1234'.indexOf(k.toUpperCase()); if (i >= 0 && !cur.locked) { answerDuel(i % 4); return true; }
      if ((k === 'Enter' || k === ' ') && cur.duel.over) { var n = $('[data-next]'); if (n) n.click(); return true; }
      return false;
    };
    startTimer(questionTime() || 0, function () { duelEnd(null, true); });
  }
  function buzz(side) {
    var d = cur.duel; if (d.turn || d.over) return;
    d.turn = side === 'A' ? d.A : d.B;
    NV.Audio.play('go');
    $$('[data-buzz]').forEach(function (b) { b.disabled = true; b.classList.toggle('won', b.getAttribute('data-buzz') === side); });
    $$('.answer').forEach(function (b) { if (!b.classList.contains('removed')) b.disabled = false; });
    cur.locked = false;
    UI.toast('⚔ Responde <b>' + esc(d.turn.name) + '</b>', 'power', 1800);
  }
  function answerDuel(i) {
    var d = cur.duel; if (cur.locked || !d.turn || d.over) return;
    if ($('[data-ans="' + i + '"]').classList.contains('removed')) return;
    var p = d.turn, ok = i === cur.prepared.correctIndex;
    p.answered++;
    if (ok) {
      p.correct++; p.streak++; p.bestStreak = Math.max(p.bestStreak, p.streak);
      var gain = settings().points.duel; p.score += gain;
      NV.Audio.play('correct');
      var r = $('[data-ans="' + i + '"]').getBoundingClientRect(); UI.burst(r.left + r.width / 2, r.top, 40, [p.color, '#fff']); UI.floatText('+' + gain, r.left + r.width / 2, r.top, 'plus');
      duelEnd(p, false, i);
    } else {
      p.wrong++; p.streak = 0; d.tried.push(p);
      NV.Audio.play('wrong'); UI.flash();
      var b = $('[data-ans="' + i + '"]'); b.classList.add('wrong', 'removed'); b.disabled = true;
      var other = p === d.A ? d.B : d.A;
      if (d.tried.indexOf(other) < 0) {
        d.turn = other; UI.toast('¡ROBO! Ahora responde <b>' + esc(other.name) + '</b>', 'power', 2500);
        $$('[data-buzz]').forEach(function (bb) { bb.classList.toggle('won', (bb.getAttribute('data-buzz') === 'A' ? d.A : d.B) === other); });
      } else duelEnd(null, false, i);
    }
    refreshSide(-1); save();
  }
  function duelEnd(winner, timeout, chosen) {
    var d = cur.duel; if (d.over) return; d.over = true; cur.locked = true; stopTimer();
    cur.step.done = true;
    $$('[data-buzz]').forEach(function (b) { b.disabled = true; });
    revealAnswers($('#s-question'), chosen);
    var title = winner ? '¡' + winner.name + ' gana el duelo!' : timeout ? '⏰ Tiempo agotado: nadie gana el duelo' : 'Ningún equipo acertó';
    $('#s-question .fb-slot').innerHTML = feedbackHTML(!!winner, cur.q, winner ? '<div class="fb-line good">+' + fmt(settings().points.duel) + ' puntos para ' + esc(winner.name) + '</div>' : '', title);
    $('#s-question [data-next]').onclick = function () { this.disabled = true; NV.Audio.play('click'); next(); };
    refreshSide(-1); save();
  }

  /* ================= JEFE FINAL ================= */
  function bossIntro() {
    var b = M.boss;
    NV.Audio.play('roar'); UI.flash('rgba(168,85,247,.35)'); UI.shake();
    return UI.modal({ title: '<span class="event-title">⚠ ALERTA: JEFE FINAL</span>', html: '<div class="boss-intro">' + UI.bossSVG(b) + '<h3>' + esc(b.name) + '</h3><p>' + esc(b.title) + '</p><p class="muted">Vida: ' + fmt(b.maxHp) + ' · Turnos máximos: ' + b.maxTurns + '. Cada acierto le hace daño; cada error le permite atacar.</p></div>', buttons: [{ label: '⚔ ¡A LA BATALLA!', value: true, cls: 'btn-primary' }], dismiss: false });
  }
  function startBoss() {
    var b = M.boss;
    if (b.defeated || b.failed) { M.steps[M.stepIndex].done = true; finish(); return; }
    if (!M.bossIntroShown) { M.bossIntroShown = true; save(); bossIntro().then(bossTurn); return; }
    bossTurn();
  }
  function bossLives() { return M.sharedLives != null ? M.sharedLives : M.participants[0].lives; }
  function bossMaxLives() { return M.sharedLives != null ? (M.mode === 'raid' ? settings().raidLives : 4) : settings().lives; }
  function bossTurn() {
    var b = M.boss;
    b.phase = E.bossPhase(b);
    var who = b.turnsUsed % M.participants.length, p = M.participants[who];
    var prefer = b.phase === 3 ? ['dificil', 'media', 'facil'] : b.phase === 2 ? ['media', 'dificil', 'facil'] : ['facil', 'media', 'dificil'];
    var qid = E.pickQuestions(M.worlds, 1, prefer, M.usedQuestions)[0];
    M.usedQuestions[qid] = true;
    var q = NV.questionById(qid);
    cur = { step: { who: who }, q: q, p: p, prepared: E.prepare(q), locked: false, half: false, removed: [], isBoss: true };
    var allowed = ['shield', 'double', 'time', 'second'];
    var el = $('#s-boss'), hpPct = Math.max(0, b.hp / b.maxHp * 100);
    var phaseName = ['', 'FASE 1', 'FASE 2 · FURIA', 'FASE FINAL'][b.phase];
    el.innerHTML = '<div class="boss-layout phase-' + b.phase + '" style="--bc:' + b.color + ';--bc2:' + b.color2 + '">' +
      '<div class="boss-top glass"><div class="boss-name"><b>' + esc(b.name) + '</b><small>' + esc(b.title) + '</small></div>' +
        '<div class="boss-hp"><div class="hp-bar"><i class="hp-lag" style="width:' + hpPct + '%"></i><i class="hp-fill" style="width:' + hpPct + '%"></i><span>' + fmt(Math.max(0, b.hp)) + ' / ' + fmt(b.maxHp) + '</span></div></div>' +
        '<div class="boss-phase">' + phaseName + '</div></div>' +
      '<div class="boss-stage"><div class="boss-entity">' + UI.bossSVG(b) + '</div><div class="boss-beam"></div></div>' +
      '<div class="boss-info glass">' +
        '<div class="hud-item"><span>' + (M.sharedLives != null ? 'VIDAS DEL EQUIPO' : 'VIDAS') + '</span><b class="boss-lives">' + UI.hearts(bossLives(), bossMaxLives()) + '</b></div>' +
        '<div class="hud-item"><span>TURNOS</span><b>' + (b.maxTurns - b.turnsUsed) + '</b></div>' +
        '<div class="hud-item"><span>RACHA ALIADA</span><b>' + (M.sharedStreak >= 3 ? '🔥' : '') + M.sharedStreak + ' (×' + E.streakMult(M.sharedStreak + 1) + ')</b></div>' +
        timerHTML() +
        (isTeamMode() ? '<div class="turn-banner small" style="--tc:' + p.color + '"><span>ATACA</span><b>' + esc(p.name) + '</b></div>' : '') +
        '<button class="icon-btn hud-pause" data-qpause title="Pausa (P)">⏸</button></div>' +
      '<div class="boss-q">' + questionCardHTML(q, cur.prepared, { ptsLabel: '⚔ ' + pts(q.difficulty) + ' daño' }) + powerbarHTML(p, allowed) + '<div class="fb-slot"></div></div>' +
      (isTeamMode() ? '<aside class="boss-side glass"><div class="side-title">DAÑO POR EQUIPO</div>' + M.participants.map(function (x) { return '<div class="lr-row ' + (x === p ? 'active' : '') + '" style="--tc:' + x.color + '"><span class="lr-name">' + esc(x.name) + '</span><b class="lr-score">' + fmt(x.damage) + '</b></div>'; }).join('') + '</aside>' : '') +
      '</div>';
    UI.show('boss');
    bindAnswers(el, answerBoss);
    bindPowers(el, allowed);
    bindCommon(el);
    keyHandler = function (k) {
      var i = 'ABCD1234'.indexOf(k.toUpperCase()); if (i >= 0 && !cur.locked) { answerBoss(i % 4); return true; }
      if ((k === 'Enter' || k === ' ') && cur.locked) { var n = $('[data-next]'); if (n) n.click(); return true; }
      return false;
    };
    startTimer(questionTime(), function () { answerBoss(-1); });
  }
  function answerBoss(i) {
    if (!cur || cur.locked) return;
    if (i >= 0 && cur.removed.indexOf(i) >= 0) return;
    var b = M.boss, p = cur.p, q = cur.q, ok = i === cur.prepared.correctIndex, el = $('#s-boss');
    if (!ok && i >= 0 && p.active.second && !cur.half) {
      p.active.second = false; cur.half = true; cur.removed.push(i);
      var bb = $('[data-ans="' + i + '"]', el); bb.classList.add('wrong', 'removed'); bb.disabled = true;
      NV.Audio.play('wrong'); UI.toast('🔁 ¡SEGUNDA OPORTUNIDAD! (mitad de daño)', 'power'); refreshPowerbar(); return;
    }
    cur.locked = true; stopTimer();
    b.turnsUsed++; p.answered++; p.bossAnswered++;
    var lines = '', title = null, ent = $('.boss-entity', el);
    if (ok) {
      M.sharedStreak++; p.correct++; p.bossCorrect++; p.streak++; p.bestStreak = Math.max(p.bestStreak, p.streak);
      var sc = E.score({ base: pts(q.difficulty), streak: M.sharedStreak, double: p.active.double, half: cur.half, eventMult: b.phase === 3 && q.difficulty === 'dificil' ? 1.5 : 1 });
      var dmg = sc.total; p.active.double = false;
      b.hp = Math.max(0, b.hp - dmg); p.damage += dmg;
      lines = '<div class="fb-line good">⚔ ' + fmt(dmg) + ' de daño <small>(base ' + sc.base + (sc.streakMult > 1 ? ' · racha ×' + sc.streakMult : '') + (sc.double > 1 ? ' · doble ×2' : '') + (sc.eventMult > 1 ? ' · golpe crítico ×1.5' : '') + (sc.half ? ' · ×0.5' : '') + ')</small></div>';
      NV.Audio.play('laser'); setTimeout(function () { NV.Audio.play('hit'); }, 180);
      var beam = $('.boss-beam', el); beam.classList.remove('fire'); void beam.offsetWidth; beam.classList.add('fire');
      ent.classList.remove('hit'); void ent.offsetWidth; ent.classList.add('hit');
      var r = ent.getBoundingClientRect(); UI.floatText('−' + fmt(dmg), r.left + r.width / 2, r.top + r.height / 3, 'dmg'); UI.burst(r.left + r.width / 2, r.top + r.height / 2, 45, [b.color, b.color2, '#fff']);
      var hpPct = b.hp / b.maxHp * 100;
      $('.hp-fill', el).style.width = hpPct + '%'; setTimeout(function () { var l = $('.hp-lag', el); if (l) l.style.width = hpPct + '%'; }, 450);
      $('.hp-bar span', el).textContent = fmt(b.hp) + ' / ' + fmt(b.maxHp);
      if (isCampaign()) campaignCorrect(q, p);
      var newPhase = E.bossPhase(b);
      if (b.hp > 0 && newPhase > b.phase) lines += '<div class="fb-line bonus">⚠ ' + esc(b.name) + ' entra en ' + (newPhase === 2 ? 'FURIA: el tiempo se reduce 5 s.' : 'FASE FINAL: las preguntas difíciles hacen daño crítico ×1.5.') + '</div>';
    } else {
      p.wrong++; p.streak = 0;
      if (isCampaign()) S().profile.stats.wrong++;
      if (p.active.shield) { lines = '<div class="fb-line shield">🛡️ ¡El ESCUDO bloqueó el ataque del jefe! Racha aliada intacta.</div>'; NV.Audio.play('shield'); }
      else {
        M.sharedStreak = 0;
        if (M.sharedLives != null) M.sharedLives = Math.max(0, M.sharedLives - 1); else p.lives = Math.max(0, p.lives - 1);
        lines = '<div class="fb-line bad">💥 ' + esc(b.name) + ' contraataca: −1 vida.</div>';
        NV.Audio.play('roar'); UI.flash('rgba(239,68,68,.45)'); UI.shake();
        ent.classList.remove('attack'); void ent.offsetWidth; ent.classList.add('attack');
        var lv = $('.boss-lives', el); if (lv) lv.innerHTML = UI.hearts(bossLives(), bossMaxLives());
      }
      if (i < 0) title = '⏰ ¡Se acabó el tiempo!';
    }
    p.active.shield = false; p.active.second = false;
    if (b.hp <= 0) { b.defeated = true; title = '¡' + b.name + ' HA SIDO DERROTADO!'; }
    else if (bossLives() <= 0) { b.failed = true; title = '☠ Sin vidas: ' + b.name + ' resiste'; }
    else if (b.turnsUsed >= b.maxTurns) { b.failed = true; title = '⌛ Se acabaron los turnos: ' + b.name + ' escapa'; }
    revealAnswers(el, i);
    $('.fb-slot', el).innerHTML = feedbackHTML(ok, q, lines, title);
    refreshPowerbar(true);
    $('[data-next]', el).onclick = function () {
      this.disabled = true;
      NV.Audio.play('click');
      if (b.defeated) { bossDeath().then(function () { M.steps[M.stepIndex].done = true; next(); }); }
      else if (b.failed) { M.steps[M.stepIndex].done = true; next(); }
      else bossTurn();
    };
    $('.fb-slot', el).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    save();
  }
  function bossDeath() {
    return new Promise(function (res) {
      var ent = $('#s-boss .boss-entity');
      NV.Audio.play('explode'); UI.flash('rgba(255,255,255,.7)'); UI.shake();
      if (ent) { ent.classList.add('dying'); var r = ent.getBoundingClientRect(); for (var k = 0; k < 4; k++) (function (k) { setTimeout(function () { UI.burst(r.left + Math.random() * r.width, r.top + Math.random() * r.height, 60, [M.boss.color, M.boss.color2, '#fff', '#facc15']); }, k * 250); })(k); }
      setTimeout(res, 1600);
    });
  }

  /* ================= CAMPAÑA: estadísticas ================= */
  function campaignCorrect(q, p) {
    var st = S().profile.stats;
    st.correct++; st.bestStreak = Math.max(st.bestStreak, p.streak);
    st.worldsCorrect[q.world] = true;
    NV.App.unlock('first');
    if (p.streak >= 5) NV.App.unlock('streak5');
    if (p.streak >= 10) NV.App.unlock('streak10');
    if (Object.keys(st.worldsCorrect).length >= 9) NV.App.unlock('polymath');
  }

  /* ================= PAUSA ================= */
  function pause() {
    if (!M || M.paused) return;
    M.paused = true; save();
    UI.modal({ title: '⏸ PAUSA', html: '<p class="center">La partida está detenida y guardada.</p><div class="pause-rank">' + E.ranking(M.participants).map(function (p, i) { return '<div><span>' + (i + 1) + '. ' + esc(p.name) + '</span><b>' + fmt(p.score) + '</b></div>'; }).join('') + '</div>',
      buttons: [{ label: 'Salir al menú', value: 'menu', cls: 'btn-ghost' }, { label: 'Panel del anfitrión', value: 'admin', cls: 'btn-ghost' }, { label: '▶ REANUDAR', value: 'resume', cls: 'btn-primary' }], dismiss: false })
      .then(function (v) {
        if (v === 'resume') { M.paused = false; save(); return; }
        stopTimer(); keyHandler = null;
        if (v === 'menu') { NV.App.go('menu'); UI.toast('Partida guardada. Usa "CONTINUAR PARTIDA" para volver.', 'ok', 4000); }
        if (v === 'admin') NV.App.openAdmin();
      });
  }
  function bindCommon(root) {
    var pb = $('[data-qpause]', root); if (pb) pb.onclick = pause;
  }

  /* ================= FIN DE PARTIDA ================= */
  function finishNow() {
    var st = S(); if (!st.session) return;
    M = st.session; stopTimer(); finish(M.mode === 'campaign' ? false : undefined, true);
  }
  function finish(forceVictory, forced) {
    stopTimer(); keyHandler = null;
    var st = S(), s = st.settings, prof = st.profile;
    var ranking = E.ranking(M.participants);
    var victory = true, subtitle = '', xpGained = null, levelBefore = E.levelInfo(prof.xp).level, unlockedWorld = null;
    var achBefore = prof.achievements.slice();
    var hasBoss = !!M.boss;

    // Recompensas del jefe
    if (M.boss) {
      var won = M.boss.defeated;
      M.participants.forEach(function (p) { var rw = E.bossReward(p, s.points.boss, won); p.bossReward = rw; p.score += rw; });
      ranking = E.ranking(M.participants);
    }

    if (M.mode === 'campaign') {
      var p = M.participants[0];
      victory = forceVictory === false ? false : p.lives > 0;
      var w = M.worlds[0], rec = prof.missions[w] = prof.missions[w] || {};
      if (victory) {
        var old = rec[M.mission];
        rec[M.mission] = { best: Math.max(old ? old.best : 0, p.score), perfect: (old && old.perfect) || p.wrong === 0 };
        if (p.wrong === 0) NV.App.unlock('perfect');
        if (p.lives === 1) NV.App.unlock('phoenix');
        if (p.powerUsed === 0 && M.steps.filter(function (x) { return x.type === 'q'; }).length >= 5) NV.App.unlock('purist');
        subtitle = 'Misión ' + M.mission + ' completada en ' + NV.worldById(w).name + (M.mission === 3 ? ' · ¡El jefe te espera!' : '');
      } else subtitle = forced ? 'La partida fue terminada por el anfitrión.' : 'Te quedaste sin vidas. Revisa las explicaciones y vuelve a intentarlo.';
    } else if (M.mode === 'boss') {
      var pb = M.participants[0], wid = M.worlds[0];
      victory = M.boss.defeated;
      if (victory) {
        prof.bosses[wid] = Math.max(prof.bosses[wid] || 0, pb.bossReward);
        var idx = NV.WORLDS.findIndex(function (x) { return x.id === wid; }), nw = NV.WORLDS[idx + 1];
        if (nw && prof.unlocked.indexOf(nw.id) < 0) { prof.unlocked.push(nw.id); unlockedWorld = nw.name; }
        NV.App.unlock('boss1');
        if (prof.unlocked.length >= 3) NV.App.unlock('worlds3');
        if (Object.keys(prof.bosses).length >= 9) NV.App.unlock('allbosses');
        subtitle = 'Recompensa del jefe: +' + fmt(pb.bossReward) + ' pts' + (unlockedWorld ? ' · Nuevo mundo: ' + unlockedWorld : (idx === 8 ? ' · ¡Completaste el Neuroverse!' : ''));
      } else subtitle = 'El jefe resistió. ¡Prepárate y vuelve a intentarlo!';
    } else if (M.mode === 'raid') {
      victory = M.boss.defeated;
      if (victory) NV.App.unlock('raid');
      subtitle = victory ? 'Todos los equipos colaboraron para salvar el Neuroverse.' : 'OMEGA resistió con ' + fmt(M.boss.hp) + ' de vida. La alianza debe volver más fuerte.';
    } else {
      victory = true;
      if (M.mode === 'arena' && !forced) {
        NV.App.unlock('arena');
        if (M.halfwayLast && ranking[0].id === M.halfwayLast && M.participants.length >= 2) NV.App.unlock('comeback');
      }
      if (M.boss) subtitle = M.boss.defeated ? 'El jefe final fue derrotado. Recompensas según la precisión de cada equipo.' : 'El jefe resistió, pero la competencia termina aquí.';
      if (ranking.length > 1 && ranking[0].score === ranking[1].score) {
        subtitle = (ranking[0].correct === ranking[1].correct
          ? 'Empate total entre ' + ranking[0].name + ' y ' + ranking[1].name + '. El anfitrión puede organizar un duelo de desempate. '
          : 'Empate en puntos: gana quien tiene más aciertos. ') + subtitle;
      }
      if (forced) subtitle = 'Partida terminada por el anfitrión. ' + subtitle;
    }

    // XP de campaña
    if (M.mode === 'campaign' || M.mode === 'boss') {
      var pp = M.participants[0];
      xpGained = Math.floor(pp.score / 10) + pp.answered * 5;
      prof.xp += xpGained;
    }
    var levelAfter = E.levelInfo(prof.xp).level;
    if (levelAfter >= 5) NV.App.unlock('level5');
    var newAch = prof.achievements.filter(function (a) { return achBefore.indexOf(a) < 0; }).map(E.achievementById);

    var result = {
      date: Date.now(), mode: M.mode, title: M.title || NV.Screens.modeName(M.mode), worlds: M.worlds, victory: victory, subtitle: subtitle,
      ranking: ranking.map(function (p) { return { id: p.id, name: p.name, color: p.color, members: p.members, score: p.score, correct: p.correct, wrong: p.wrong, answered: p.answered, bestStreak: p.bestStreak, damage: p.damage }; }),
      hasBoss: hasBoss, xpGained: xpGained, level: levelAfter, levelUp: levelAfter > levelBefore, achievements: newAch, unlockedWorld: unlockedWorld
    };
    lastConfig = M.config;
    st.history.push({ date: result.date, mode: result.mode, title: result.title, worlds: result.worlds, victory: result.victory, ranking: result.ranking });
    if (st.history.length > 300) st.history.shift();
    st.session = null; save();
    NV.PWA.autoBackup();
    NV.Net.emit('match:end', { results: result });
    M = null; cur = null; NV.Audio.setIntense(false);
    NV.Screens.results(result); UI.show('results');
    if (result.levelUp) setTimeout(function () { UI.toast('<b>⬆ ¡SUBISTE AL NIVEL ' + levelAfter + '!</b> Rango: ' + E.rankName(levelAfter), 'achievement', 4500); NV.Audio.play('achievement'); }, 1200);
  }
  var lastConfig = null;
  function replay() {
    if (!lastConfig) { NV.App.go('mode'); return; }
    start(lastConfig);
  }

  return {
    start: start, resume: resume, restart: restart, discard: discard, finishNow: finishNow, replay: replay,
    pause: pause, suspend: suspend,
    key: function (k) { if (keyHandler) return keyHandler(k); return false; },
    active: function () { return !!M; },
    // Expuestos para pruebas
    _state: function () { return { M: M, cur: cur, T: T }; }
  };
})();
