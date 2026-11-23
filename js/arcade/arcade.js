/* ============================================================
   NEUROVERSE ARCADE — THE ULTIMATE MINI-GAME COLLECTION
   Núcleo de la expansión: registro de minijuegos, pantalla de
   selección, "carcasa" común de cada juego (inicio, instrucciones,
   HUD, pausa, victoria/derrota), modos individual / duelo / equipos
   por turnos, recompensas con límites, monedas virtuales, logros,
   récords, desbloqueos y clasificación.

   Cada minijuego se registra con NV.Arcade.register({...}) y recibe
   un objeto "ctx" con utilidades (HUD, temporizadores, sonidos,
   efectos y ctx.end() para terminar). Todo temporizador creado con
   ctx se pausa y se limpia automáticamente.
   ============================================================ */
window.NV = window.NV || {};

NV.Arcade = (function () {
  var UI = NV.UI, $ = UI.$, $$ = UI.$$, esc = UI.esc, fmt = UI.fmt;
  var GAMES = [];
  var FREE = ['brain', 'memory', 'words', 'maze', 'reaction', 'blocks'];  // desbloqueados desde el inicio
  var UNLOCK_COST = 80;               // monedas virtuales para desbloquear un minijuego
  var DAILY_XP_CAP = 150;             // XP máxima por minijuego y por día (evita "farmear")
  var DAILY_COIN_CAP = 80;            // monedas máximas por minijuego y por día
  var MIN_SECONDS_FOR_REWARD = 15;    // partidas demasiado cortas no dan recompensa

  function A() { var st = NV.Store.get(); return st.arcade; }
  function save() { NV.Store.save(); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function gameById(id) { return GAMES.find(function (g) { return g.id === id; }); }

  function register(def) { GAMES.push(def); }
  function isUnlocked(id) { return FREE.indexOf(id) >= 0 || A().unlocked.indexOf(id) >= 0; }
  function unlockedCount() { return GAMES.filter(function (g) { return isUnlocked(g.id); }).length; }
  function record(id) { var r = A().records[id]; if (!r) r = A().records[id] = { best: 0, plays: 0, maxLevel: 1, wins: 0, lastScore: 0 }; return r; }

  /* ================= LOGROS DEL ARCADE ================= */
  var ACH = [
    { id: 'a_first', name: 'Insert Coin', icon: '🕹️', desc: 'Juega tu primer minijuego.', xp: 20 },
    { id: 'a_five', name: 'Explorador Arcade', icon: '🧭', desc: 'Juega 5 minijuegos diferentes.', xp: 60 },
    { id: 'a_all', name: 'Coleccionista', icon: '💽', desc: 'Juega los 15 minijuegos.', xp: 200 },
    { id: 'a_win3', name: 'Triple Victoria', icon: '🏅', desc: 'Gana 3 minijuegos distintos.', xp: 80 },
    { id: 'a_unlock', name: 'Cerrajero Digital', icon: '🔓', desc: 'Desbloquea un minijuego con monedas.', xp: 40 },
    { id: 'a_rich', name: 'Bóveda Neón', icon: '🪙', desc: 'Acumula 300 monedas virtuales.', xp: 60 },
    { id: 'a_combo', name: 'Ritmo Perfecto', icon: '🎵', desc: 'Consigue un combo de 30 en Rhythm Core.', xp: 80 },
    { id: 'a_brain', name: 'Calculadora Humana', icon: '🧮', desc: 'Llega al nivel 6 en Brain Rush.', xp: 80 },
    { id: 'a_core', name: 'Guardián del Núcleo', icon: '🛡️', desc: 'Sobrevive a todas las oleadas de Defend the Core.', xp: 120 },
    { id: 'a_detective', name: 'Mente Brillante', icon: '🕵️', desc: 'Resuelve un caso de Detective 404 sin errores.', xp: 80 },
    { id: 'a_race', name: 'Piloto de Neón', icon: '🏎️', desc: 'Gana el 1er lugar en Neon Race.', xp: 100 },
    { id: 'a_survivor', name: 'Superviviente', icon: '☄️', desc: 'Sobrevive 10 rondas en Survival Arena.', xp: 120 },
    { id: 'a_react', name: 'Reflejos de Rayo', icon: '⚡', desc: 'Tiempo de reacción promedio menor a 450 ms en Reaction X.', xp: 80 },
    { id: 'a_team', name: 'Arcade en Equipo', icon: '👥', desc: 'Completa una partida por turnos o un duelo.', xp: 50 }
  ];
  function unlockAch(id) {
    var a = A(); if (a.achievements.indexOf(id) >= 0) return;
    var def = ACH.find(function (x) { return x.id === id; }); if (!def) return;
    a.achievements.push(id);
    NV.Store.get().profile.xp += def.xp;   // la XP de los logros se suma al perfil compartido
    a.coins += 25;
    save(); UI.achievementToast(def);
  }

  /* ================= PANTALLA DE SELECCIÓN ================= */
  var filter = 'Todos';
  function hub() {
    var a = A(), el = $('#s-arcade'), p = NV.Store.get().profile, li = NV.Engine.levelInfo(p.xp);
    var cats = ['Todos'].concat(GAMES.map(function (g) { return g.category; }).filter(function (c, i, arr) { return arr.indexOf(c) === i; }));
    var list = GAMES.filter(function (g) { return filter === 'Todos' || g.category === filter; });
    el.innerHTML =
      '<div class="arc-hero">' +
        '<button class="btn btn-ghost btn-back" data-action="go" data-arg="menu">← Menú</button>' +
        '<div class="arc-title"><div class="kicker">EXPANSIÓN</div><h1><span class="glitch" data-text="NEUROVERSE ARCADE">NEUROVERSE ARCADE</span></h1><div class="arc-sub">THE ULTIMATE MINI-GAME COLLECTION</div></div>' +
        '<div class="arc-wallet glass">' +
          '<div><span>MONEDAS</span><b class="coin">🪙 ' + fmt(a.coins) + '</b></div>' +
          '<div><span>DESBLOQUEADOS</span><b>' + unlockedCount() + '/' + GAMES.length + '</b></div>' +
          '<div><span>NIVEL</span><b>' + li.level + '</b></div>' +
          '<div><span>LOGROS</span><b>' + a.achievements.length + '/' + ACH.length + '</b></div>' +
        '</div>' +
      '</div>' +
      '<div class="arc-toolbar"><div class="tabs">' + cats.map(function (c) { return '<button class="tab ' + (c === filter ? 'on' : '') + '" data-afilter="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
        '<div class="btn-row"><button class="btn btn-sm" id="arc-board">🏆 Clasificación</button><button class="btn btn-sm" id="arc-ach">🏅 Logros</button><button class="btn btn-sm btn-ghost" id="arc-help">? Cómo funciona</button></div></div>' +
      '<div class="arc-grid">' + list.map(function (g) {
        var un = isUnlocked(g.id), r = A().records[g.id];
        return '<div class="arc-card ' + (un ? '' : 'locked') + '" style="--g1:' + g.c1 + ';--g2:' + g.c2 + '">' +
          '<div class="arc-art">' + g.art + '<span class="arc-num">' + g.num + '</span>' + (un ? '' : '<div class="arc-lock">🔒</div>') + '</div>' +
          '<div class="arc-body"><div class="arc-meta"><span class="arc-cat">' + esc(g.category) + '</span><span class="arc-diff">' + '★★★★★'.slice(0, g.difficulty) + '<i>' + '★★★★★'.slice(g.difficulty) + '</i></span></div>' +
          '<h3>' + esc(g.name) + '</h3><p>' + esc(g.desc) + '</p>' +
          '<div class="arc-rec">🏆 Récord: <b>' + (r ? fmt(r.best) : '—') + '</b>' + (r && r.maxLevel > 1 ? ' · Nivel máx. ' + r.maxLevel : '') + '</div>' +
          (un ? '<button class="btn btn-primary wide" data-aplay="' + g.id + '">▶ JUGAR</button>'
              : '<button class="btn wide" data-aunlock="' + g.id + '">🔓 Desbloquear · 🪙 ' + UNLOCK_COST + '</button>') +
          '</div></div>';
      }).join('') + '</div>' +
      '<p class="muted center">Las monedas son 100% virtuales: no representan dinero real. Recompensas diarias limitadas por juego para que la competencia sea justa.</p>';
    $$('[data-afilter]', el).forEach(function (b) { b.onclick = function () { filter = b.getAttribute('data-afilter'); NV.Audio.play('click'); hub(); }; });
    $$('[data-aplay]', el).forEach(function (b) { b.onclick = function () { NV.Audio.play('click'); openGame(b.getAttribute('data-aplay')); }; });
    $$('[data-aunlock]', el).forEach(function (b) { b.onclick = function () { buyUnlock(b.getAttribute('data-aunlock')); }; });
    $('#arc-board').onclick = function () { boardModal(); };
    $('#arc-ach').onclick = function () { achModal(); };
    $('#arc-help').onclick = function () {
      UI.alert('CÓMO FUNCIONA EL ARCADE', '<ul class="power-help"><li><b>XP compartida:</b> la XP que ganas en el Arcade se suma a tu perfil de NEUROVERSE (el mismo nivel de la Campaña).</li><li><b>Monedas virtuales 🪙:</b> sirven para desbloquear minijuegos. No son dinero real.</li><li><b>Límites justos:</b> cada minijuego da como máximo ' + DAILY_XP_CAP + ' XP y ' + DAILY_COIN_CAP + ' monedas al día; las partidas de menos de ' + MIN_SECONDS_FOR_REWARD + ' s no dan recompensa. Los récords SIEMPRE se guardan.</li><li><b>Niveles:</b> al alcanzar un nivel puedes empezar desde él la próxima vez.</li><li><b>Modos:</b> Individual, Duelo (2 jugadores) y Equipos por turnos usando los equipos registrados, en una misma computadora.</li></ul>');
    };
  }

  function buyUnlock(id) {
    var a = A(), g = gameById(id);
    if (a.coins < UNLOCK_COST) { NV.Audio.play('wrong'); UI.toast('Necesitas 🪙 ' + UNLOCK_COST + ' monedas. Juega los minijuegos disponibles para conseguirlas.', 'warn', 3500); return; }
    UI.confirm('Desbloquear ' + g.name, '¿Usar 🪙 ' + UNLOCK_COST + ' monedas virtuales para desbloquear <b>' + esc(g.name) + '</b>?', 'Desbloquear').then(function (ok) {
      if (!ok) return;
      a.coins -= UNLOCK_COST; a.unlocked.push(id); save();
      NV.Audio.play('achievement'); UI.toast('🔓 ' + esc(g.name) + ' desbloqueado', 'ok');
      unlockAch('a_unlock'); hub();
    });
  }

  function boardModal(gid) {
    var a = A(), sel = gid || GAMES[0].id;
    function render() {
      var rows = (a.leaderboard[sel] || []);
      return '<div class="tabs arc-board-tabs">' + GAMES.map(function (g) { return '<button class="tab ' + (g.id === sel ? 'on' : '') + '" data-bsel="' + g.id + '">' + g.icon + '</button>'; }).join('') + '</div>' +
        '<h3 class="center">' + esc(gameById(sel).name) + '</h3>' +
        (rows.length ? '<table class="table"><thead><tr><th>#</th><th>Nombre</th><th>Puntos</th><th>Modo</th><th>Fecha</th></tr></thead><tbody>' +
          rows.map(function (r, i) { return '<tr><td>' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1) + '</td><td>' + esc(r.name) + '</td><td><b>' + fmt(r.score) + '</b></td><td>' + esc(r.mode) + '</td><td>' + new Date(r.date).toLocaleDateString('es-MX') + '</td></tr>'; }).join('') +
          '</tbody></table>' : '<p class="muted center">Aún no hay puntuaciones. ¡Sé el primero!</p>');
    }
    UI.modal({ title: '🏆 CLASIFICACIÓN ARCADE', html: '<div id="arc-board-body">' + render() + '</div>', buttons: [{ label: 'Cerrar', value: true, cls: 'btn-primary' }] });
    function bind() { $$('[data-bsel]').forEach(function (b) { b.onclick = function () { sel = b.getAttribute('data-bsel'); $('#arc-board-body').innerHTML = render(); bind(); }; }); }
    bind();
  }
  function achModal() {
    var a = A();
    UI.modal({ title: '🏅 LOGROS DEL ARCADE', html: '<div class="ach-grid">' + ACH.map(function (x) {
      var has = a.achievements.indexOf(x.id) >= 0;
      return '<div class="ach-card ' + (has ? 'has' : '') + '"><div class="ach-icon">' + x.icon + '</div><div><b>' + esc(x.name) + '</b><small>' + esc(x.desc) + '</small><span class="ach-xp">+' + x.xp + ' XP · +25 🪙</span></div></div>';
    }).join('') + '</div>', buttons: [{ label: 'Cerrar', value: true, cls: 'btn-primary' }] });
  }

  /* ================= CARCASA DE CADA MINIJUEGO ================= */
  var S = null; // sesión del minijuego actual

  function openGame(id) {
    var g = gameById(id); if (!g) return;
    if (!isUnlocked(id)) { UI.toast('🔒 Primero desbloquea este minijuego.', 'warn'); return; }
    leave();
    S = { game: g, mode: 'solo', players: [], turn: 0, results: [], startLevel: 1, inst: null, ctx: null };
    var el = $('#s-arcade-game');
    el.style.setProperty('--g1', g.c1); el.style.setProperty('--g2', g.c2);
    el.innerHTML =
      '<div class="ag-top"><button class="btn btn-ghost btn-sm" id="ag-back">← Arcade</button><div class="ag-name">' + g.icon + ' ' + esc(g.name) + ' <small id="ag-who"></small></div><button class="icon-btn" id="ag-pause" title="Pausa">⏸</button></div>' +
      '<div class="ag-hud glass hidden" id="ag-hud">' +
        '<div class="hud-item"><span>PUNTOS</span><b id="h-score">0</b></div>' +
        '<div class="hud-item"><span>NIVEL</span><b id="h-level">1</b></div>' +
        '<div class="hud-item" id="h-combo-w"><span id="h-combo-l">RACHA</span><b id="h-combo">0</b></div>' +
        '<div class="hud-item" id="h-lives-w"><span>VIDAS</span><b id="h-lives"></b></div>' +
        '<div class="hud-item" id="h-time-w"><span>TIEMPO</span><b id="h-time">--</b></div>' +
        '<div class="ag-progress"><small id="h-label">Progreso</small><div class="xpbar"><i id="h-prog" style="width:0%"></i></div></div>' +
      '</div>' +
      '<div class="ag-stage" id="ag-stage"></div>' +
      '<div class="ag-panel hidden" id="ag-panel"></div>';
    $('#ag-back').onclick = function () { NV.Audio.play('click'); NV.App.go('arcade'); };
    $('#ag-pause').onclick = function () { togglePause(); };
    UI.show('arcade-game');
    intro();
  }

  function intro() {
    var g = S.game, r = record(g.id), st = NV.Store.get();
    var maxStart = Math.min(r.maxLevel || 1, g.maxStartLevel || 5);
    var teamsOk = st.teams.filter(function (t) { return t.members.length >= 1; });
    stopInstance();
    $('#ag-hud').classList.add('hidden'); $('#ag-stage').innerHTML = '';
    showPanel('<div class="ag-intro">' +
      '<div class="ag-intro-art">' + g.art + '</div>' +
      '<div class="ag-intro-info"><div class="kicker">MINIJUEGO ' + g.num + ' · ' + esc(g.category) + '</div><h2>' + esc(g.name) + '</h2><p>' + esc(g.desc) + '</p>' +
      '<div class="ag-how"><b>CÓMO JUGAR</b><ul>' + g.howTo.map(function (h) { return '<li>' + h + '</li>'; }).join('') + '</ul></div>' +
      '<div class="ag-records"><span>🏆 Récord: <b>' + fmt(r.best) + '</b></span><span>🎮 Partidas: <b>' + r.plays + '</b></span><span>⭐ Victorias: <b>' + r.wins + '</b></span></div>' +
      '<div class="ag-options">' +
        '<label class="field"><span>Modo de juego</span><select class="input" id="ag-mode"><option value="solo">👤 Individual (' + esc(st.profile.name || 'Jugador') + ')</option><option value="duel">⚔ Duelo de puntuación (2 jugadores)</option>' + (teamsOk.length >= 2 ? '<option value="teams">👥 Equipos por turnos (' + teamsOk.length + ' equipos)</option>' : '') + '</select></label>' +
        (g.levels ? '<label class="field"><span>Nivel inicial (desbloqueados: ' + maxStart + ')</span><select class="input" id="ag-level">' + Array.from({ length: maxStart }, function (_, i) { return '<option value="' + (i + 1) + '">Nivel ' + (i + 1) + '</option>'; }).join('') + '</select></label>' : '') +
        '<div id="ag-duel-names" class="hidden"><label class="field"><span>Jugador 1</span><input class="input" id="ag-p1" maxlength="20" value="' + esc(st.profile.name || 'Jugador 1') + '"></label><label class="field"><span>Jugador 2</span><input class="input" id="ag-p2" maxlength="20" value="Jugador 2"></label></div>' +
        '<div id="ag-team-pick" class="hidden">' + teamsOk.map(function (t) { return '<label class="toggle"><input type="checkbox" data-agteam="' + t.id + '" checked><span class="tg"></span><i class="dot" style="background:' + t.color + '"></i>' + esc(t.name) + '</label>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="btn-row"><button class="btn btn-primary btn-lg" id="ag-start">▶ COMENZAR</button><button class="btn btn-ghost" id="ag-board">🏆 Clasificación</button></div>' +
      '</div></div>');
    var modeSel = $('#ag-mode');
    modeSel.onchange = function () {
      $('#ag-duel-names').classList.toggle('hidden', modeSel.value !== 'duel');
      $('#ag-team-pick').classList.toggle('hidden', modeSel.value !== 'teams');
    };
    $('#ag-board').onclick = function () { boardModal(g.id); };
    $('#ag-start').onclick = function () {
      NV.Audio.init();
      S.mode = modeSel.value; S.turn = 0; S.results = [];
      S.startLevel = $('#ag-level') ? +$('#ag-level').value : 1;
      if (S.mode === 'solo') S.players = [{ name: st.profile.name || 'Jugador', color: '#a855f7' }];
      else if (S.mode === 'duel') {
        var n1 = $('#ag-p1').value.trim() || 'Jugador 1', n2 = $('#ag-p2').value.trim() || 'Jugador 2';
        S.players = [{ name: n1, color: '#a855f7' }, { name: n2, color: '#22d3ee' }];
      } else {
        S.players = teamsOk.filter(function (t) { var c = $('[data-agteam="' + t.id + '"]'); return c && c.checked; }).map(function (t) { return { name: t.name, color: t.color, teamId: t.id, members: t.members.slice() }; });
        if (S.players.length < 2) { UI.toast('Selecciona al menos 2 equipos.', 'warn'); return; }
      }
      startTurn();
    };
  }

  function showPanel(html) { var p = $('#ag-panel'); p.innerHTML = html; p.classList.remove('hidden'); }
  function hidePanel() { $('#ag-panel').classList.add('hidden'); }

  function startTurn() {
    var pl = S.players[S.turn];
    $('#ag-who').textContent = S.players.length > 1 ? '· Turno de ' + pl.name : '';
    hidePanel();
    var label = S.players.length > 1 ? 'TURNO DE ' + esc(pl.name).toUpperCase() : esc(S.game.name);
    UI.countdown(label, 3).then(function () { if (S) runInstance(); });
  }

  /* ---------- ctx: utilidades que recibe cada minijuego ---------- */
  function makeCtx() {
    var timers = [], loops = [], listeners = [], alive = true;
    var hud = { score: 0, level: S.startLevel, combo: 0, lives: null, maxLives: null, time: null, progress: 0, label: 'Progreso', comboLabel: 'RACHA' };
    var ctx = {
      root: $('#ag-stage'),
      level: S.startLevel,
      player: S.players[S.turn],
      paused: false,
      startedAt: Date.now(),
      alive: function () { return alive; },
      hud: function (o) {
        Object.keys(o).forEach(function (k) { hud[k] = o[k]; });
        $('#h-score').textContent = fmt(hud.score);
        $('#h-level').textContent = hud.level;
        $('#h-combo').textContent = hud.combo; $('#h-combo-l').textContent = hud.comboLabel;
        $('#h-lives-w').classList.toggle('hidden', hud.lives == null);
        if (hud.lives != null) $('#h-lives').innerHTML = UI.hearts(hud.lives, hud.maxLives || hud.lives);
        $('#h-time-w').classList.toggle('hidden', hud.time == null);
        if (hud.time != null) { $('#h-time').textContent = typeof hud.time === 'number' ? Math.ceil(hud.time) : hud.time; $('#h-time').classList.toggle('danger-text', typeof hud.time === 'number' && hud.time <= 5); }
        $('#h-prog').style.width = Math.max(0, Math.min(100, hud.progress * 100)) + '%';
        $('#h-label').textContent = hud.label;
      },
      get: function (k) { return hud[k]; },
      sfx: function (n) { NV.Audio.play(n); },
      tone: function (f, d, o) { NV.Audio.tone(f, d, o); },
      every: function (ms, fn) { var id = setInterval(function () { if (alive && !ctx.paused) fn(); }, ms); timers.push(id); return id; },
      after: function (ms, fn) { var id = setTimeout(function () { if (alive) fn(); }, ms); timers.push(id); return id; },
      clear: function (id) { clearInterval(id); clearTimeout(id); },
      loop: function (fn) {
        var last = performance.now(), rec = { stop: false };
        function frame(t) {
          if (!alive || rec.stop) return;
          var dt = Math.min(0.05, (t - last) / 1000); last = t;
          if (!ctx.paused) fn(dt);
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame); loops.push(rec); return rec;
      },
      on: function (target, ev, fn, opt) { target.addEventListener(ev, fn, opt); listeners.push([target, ev, fn, opt]); },
      // Cuenta regresiva que respeta la pausa y actualiza el HUD
      countdown: function (sec, onEnd) {
        var c = { left: sec, total: sec, running: true };
        c.id = ctx.every(100, function () {
          if (!c.running) return;
          c.left = Math.max(0, c.left - 0.1); ctx.hud({ time: c.left });
          if (c.left <= 5 && c.left > 0 && Math.abs(c.left - Math.round(c.left)) < 0.05) ctx.sfx('tick');
          if (c.left <= 0) { c.running = false; onEnd(); }
        });
        c.add = function (s) { c.left += s; ctx.hud({ time: c.left }); };
        c.set = function (s) { c.left = s; c.total = s; c.running = true; ctx.hud({ time: s }); };
        c.stop = function () { c.running = false; };
        ctx.hud({ time: sec });
        return c;
      },
      float: function (text, x, y, cls) { UI.floatText(text, x, y, cls); },
      floatAt: function (elm, text, cls) { var r = elm.getBoundingClientRect(); UI.floatText(text, r.left + r.width / 2, r.top, cls); },
      burstAt: function (elm, colors) { var r = elm.getBoundingClientRect(); UI.burst(r.left + r.width / 2, r.top + r.height / 2, 30, colors || [S.game.c1, S.game.c2, '#fff']); },
      flash: function (c) { UI.flash(c); },
      shake: function (e) { UI.shake(e || $('#ag-stage')); },
      toast: function (h, t) { UI.toast(h, t); },
      end: function (res) { if (!alive) return; finishTurn(res || {}); },
      _destroy: function () {
        alive = false;
        timers.forEach(function (id) { clearInterval(id); clearTimeout(id); });
        loops.forEach(function (l) { l.stop = true; });
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
      }
    };
    return ctx;
  }

  function runInstance() {
    stopInstance();
    $('#ag-hud').classList.remove('hidden');
    S.ctx = makeCtx();
    S.ctx.hud({ score: 0, level: S.startLevel, combo: 0, lives: null, time: null, progress: 0, label: 'Progreso', comboLabel: 'RACHA' });
    try { S.inst = S.game.create(S.ctx) || {}; }
    catch (e) { console.error(e); UI.toast('Error al iniciar el minijuego.', 'warn'); }
  }
  function stopInstance() {
    if (S && S.ctx) { S.ctx._destroy(); }
    if (S && S.inst && S.inst.destroy) { try { S.inst.destroy(); } catch (e) { } }
    if (S) { S.ctx = null; S.inst = null; }
  }

  function togglePause() {
    if (!S || !S.ctx) return;
    S.ctx.paused = true; if (S.inst && S.inst.onPause) S.inst.onPause(true);
    UI.modal({ title: '⏸ PAUSA', html: '<p class="center">' + esc(S.game.name) + ' está en pausa.</p>', buttons: [{ label: 'Salir al Arcade', value: 'exit', cls: 'btn-ghost' }, { label: 'Reiniciar', value: 'restart', cls: 'btn-ghost' }, { label: '▶ CONTINUAR', value: 'go', cls: 'btn-primary' }], dismiss: false })
      .then(function (v) {
        if (!S) return;
        if (v === 'exit') { NV.App.go('arcade'); return; }
        if (v === 'restart') { S.turn = 0; S.results = []; startTurn(); return; }
        if (S.ctx) { S.ctx.paused = false; if (S.inst && S.inst.onPause) S.inst.onPause(false); }
      });
  }

  /* ---------- Fin de turno / partida ---------- */
  function finishTurn(res) {
    var g = S.game, ctx = S.ctx, pl = S.players[S.turn];
    var score = Math.max(0, Math.round(res.score != null ? res.score : ctx.get('score')));
    var level = res.level || ctx.get('level') || 1;
    var secs = Math.round((Date.now() - ctx.startedAt) / 1000);
    stopInstance();
    var r = record(g.id), newRecord = score > r.best;
    r.plays++; r.lastScore = score; if (newRecord) r.best = score;
    if (res.win) r.wins++;
    r.maxLevel = Math.max(r.maxLevel || 1, Math.min(level, 20));
    // Clasificación (top 10 por juego)
    var lb = A().leaderboard[g.id] = A().leaderboard[g.id] || [];
    lb.push({ name: pl.name, score: score, date: Date.now(), mode: S.mode === 'solo' ? 'Individual' : S.mode === 'duel' ? 'Duelo' : 'Equipos' });
    lb.sort(function (a, b) { return b.score - a.score; }); if (lb.length > 10) lb.length = 10;
    A().stats.plays++;
    S.results.push({ name: pl.name, color: pl.color, score: score, win: !!res.win, level: level, stats: res.stats || {}, members: pl.members });

    // Recompensas (solo modo individual, con límites diarios)
    var reward = null;
    if (S.mode === 'solo') reward = giveReward(g, score, secs, !!res.win);
    checkAch(g, res, level);
    save();

    if (S.turn < S.players.length - 1) {
      showPanel('<div class="ag-result turn"><div class="kicker">TURNO TERMINADO</div><h2>' + esc(pl.name) + '</h2><div class="ag-big">' + fmt(score) + '</div>' +
        (res.message ? '<p>' + esc(res.message) + '</p>' : '') + statsHTML(res.stats) +
        '<div class="btn-row center"><button class="btn btn-primary btn-lg" id="ag-next">SIGUIENTE TURNO: ' + esc(S.players[S.turn + 1].name) + ' →</button></div></div>');
      $('#ag-next').onclick = function () {
        this.disabled = true; // evita saltarse turnos con doble clic
        if (S && S.turn < S.players.length - 1) { S.turn++; startTurn(); }
      };
      return;
    }
    // Pantalla final
    var multi = S.players.length > 1, ranking = S.results.slice().sort(function (a, b) { return b.score - a.score; });
    var win = multi ? true : !!res.win;
    if (multi) {
      unlockAch('a_team');
      // Las partidas por turnos se guardan en el historial general de NEUROVERSE (ranking de equipos)
      var st = NV.Store.get();
      st.history.push({ date: Date.now(), mode: 'arcade', title: 'ARCADE · ' + g.name, worlds: [], victory: true,
        ranking: ranking.map(function (x) { return { name: x.name, color: x.color, members: x.members || [x.name], score: x.score, correct: 0, wrong: 0, answered: 0, bestStreak: 0, damage: 0 }; }) });
      save();
    }
    var tie = multi && ranking[1] && ranking[0].score === ranking[1].score;
    showPanel('<div class="ag-result ' + (win ? 'win' : 'lose') + '">' +
      '<div class="kicker">' + esc(g.name) + '</div>' +
      '<h1 class="res-title">' + (multi ? (tie ? '¡EMPATE!' : '¡' + esc(ranking[0].name) + ' GANA!') : win ? '¡VICTORIA!' : 'FIN DE LA PARTIDA') + '</h1>' +
      (res.message && !multi ? '<p class="res-sub">' + esc(res.message) + '</p>' : '') +
      (multi ? '<div class="ag-rank">' + ranking.map(function (x, i) { return '<div class="lr-row" style="--tc:' + x.color + '"><span class="lr-pos">' + (i + 1) + '</span><span class="lr-name">' + esc(x.name) + '</span><b class="lr-score">' + fmt(x.score) + '</b></div>'; }).join('') + '</div>'
        : '<div class="ag-big">' + fmt(score) + '</div>' + (newRecord ? '<div class="ag-newrec">★ ¡NUEVO RÉCORD PERSONAL! ★</div>' : '<div class="muted">Récord: ' + fmt(r.best) + '</div>') + statsHTML(res.stats)) +
      (reward ? rewardHTML(reward) : (multi ? '<p class="muted">Resultado guardado en el Ranking general de NEUROVERSE.</p>' : '')) +
      '<div class="btn-row center"><button class="btn btn-primary btn-lg" id="ag-again">↻ JUGAR DE NUEVO</button><button class="btn" id="ag-toarc">← VOLVER AL ARCADE</button><button class="btn btn-ghost" id="ag-board2">🏆 Clasificación</button></div></div>');
    if (win) { UI.confetti(160); NV.Audio.play('victory'); } else NV.Audio.play('defeat');
    $('#ag-again').onclick = function () { this.disabled = true; S.turn = 0; S.results = []; startTurn(); };
    $('#ag-toarc').onclick = function () { NV.App.go('arcade'); };
    $('#ag-board2').onclick = function () { boardModal(g.id); };
  }
  function statsHTML(st) {
    if (!st) return '';
    var k = Object.keys(st); if (!k.length) return '';
    return '<div class="ag-stats">' + k.map(function (x) { return '<div><span>' + esc(x) + '</span><b>' + esc(st[x]) + '</b></div>'; }).join('') + '</div>';
  }
  function rewardHTML(rw) {
    return '<div class="ag-reward glass"><div><span>XP AL PERFIL</span><b>+' + rw.xp + '</b></div><div><span>MONEDAS</span><b>+' + rw.coins + ' 🪙</b></div><div><span>HOY EN ESTE JUEGO</span><b>' + rw.xpToday + '/' + DAILY_XP_CAP + ' XP</b></div></div>' +
      (rw.note ? '<p class="muted center">' + esc(rw.note) + '</p>' : '');
  }

  function giveReward(g, score, secs, win) {
    var a = A(), d = a.daily, st = NV.Store.get();
    if (d.date !== today()) { d.date = today(); d.xp = {}; d.coins = {}; }
    var xpToday = d.xp[g.id] || 0, coinsToday = d.coins[g.id] || 0, note = '';
    var xp = Math.round(Math.min(60, score / (g.xpPer || 20)) + (win ? 10 : 0));
    var coins = Math.round(xp / 2);
    if (secs < MIN_SECONDS_FOR_REWARD) { xp = 0; coins = 0; note = 'Partida muy corta: sin recompensa (el récord sí se guardó).'; }
    var xpGive = Math.max(0, Math.min(xp, DAILY_XP_CAP - xpToday));
    var coinGive = Math.max(0, Math.min(coins, DAILY_COIN_CAP - coinsToday));
    if (!note && (xpGive < xp || coinGive < coins)) note = 'Alcanzaste el límite diario de recompensas en este minijuego. ¡Prueba otro! Tu récord sigue contando.';
    d.xp[g.id] = xpToday + xpGive; d.coins[g.id] = coinsToday + coinGive;
    var before = NV.Engine.levelInfo(st.profile.xp).level;
    st.profile.xp += xpGive; a.coins += coinGive; a.stats.xp += xpGive; a.stats.coinsEarned += coinGive;
    var after = NV.Engine.levelInfo(st.profile.xp).level;
    if (after > before) setTimeout(function () { UI.toast('<b>⬆ ¡SUBISTE AL NIVEL ' + after + '!</b>', 'achievement', 4000); NV.Audio.play('achievement'); }, 800);
    if (after >= 5) NV.App.unlock('level5');
    return { xp: xpGive, coins: coinGive, xpToday: d.xp[g.id], note: note };
  }

  function checkAch(g, res, level) {
    var a = A(), played = GAMES.filter(function (x) { return a.records[x.id] && a.records[x.id].plays > 0; }).length;
    var wins = GAMES.filter(function (x) { return a.records[x.id] && a.records[x.id].wins > 0; }).length;
    unlockAch('a_first');
    if (played >= 5) unlockAch('a_five');
    if (played >= GAMES.length) unlockAch('a_all');
    if (wins >= 3) unlockAch('a_win3');
    if (a.coins >= 300) unlockAch('a_rich');
    (res.achievements || []).forEach(unlockAch);
    if (g.id === 'brain' && level >= 6) unlockAch('a_brain');
  }

  function leave() { stopInstance(); S = null; }

  /* ---------- Utilidades compartidas por los juegos ---------- */
  var U = {
    rnd: function (a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; },
    pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    shuffle: function (arr) { return NV.Engine.shuffle(arr); },
    el: function (html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; },
    // Canvas nítido que se adapta al ancho del contenedor (relación de aspecto fija)
    canvas: function (root, w, h) {
      var c = document.createElement('canvas'); c.className = 'ag-canvas'; c.width = w; c.height = h;
      root.appendChild(c); return c;
    },
    // Convierte coordenadas de puntero a coordenadas del canvas
    pt: function (c, e) { var r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height }; },
    glow: function (g, color, blur) { g.shadowColor = color; g.shadowBlur = blur; }
  };

  // Pantalla "arcade" disponible para NV.App.go('arcade')
  NV.Screens.arcade = function () { hub(); };

  return {
    register: register, games: function () { return GAMES; }, gameById: gameById, hub: hub, openGame: openGame,
    leave: leave, U: U, unlockAch: unlockAch, isUnlocked: isUnlocked,
    unlockAll: function () { A().unlocked = GAMES.map(function (g) { return g.id; }); save(); },
    current: function () { return S; },
    COST: UNLOCK_COST, CAP: DAILY_XP_CAP
  };
})();
