/* ============================================================
   NEUROVERSE — Pantallas de navegación
   Menú, modos, registro, mapa, misiones, resultados, ranking,
   panel de administración y manual integrado.
   ============================================================ */
window.NV = window.NV || {};

NV.Screens = (function () {
  var UI = NV.UI, E = NV.Engine, $ = UI.$, $$ = UI.$$, esc = UI.esc, fmt = UI.fmt;
  var TEAM_COLORS = ['#a855f7', '#22d3ee', '#3b82f6', '#f472b6', '#facc15', '#10b981', '#f97316', '#6366f1'];
  var TIPS = [
    'Las rachas de 3, 5 y 8 aciertos multiplican tus puntos ×1.2, ×1.5 y ×2.',
    'El ESCUDO te protege de una penalización. Úsalo en preguntas difíciles.',
    'La rapidez solo da hasta +20% extra: pensar bien vale más que correr.',
    'En los dilemas socioemocionales ganan puntos quienes argumentan y escuchan.',
    'Completa misiones sin poderes… quizá descubras una misión secreta.',
    'En Boss Raid todos los equipos son aliados: cada acierto daña a OMEGA.',
    'Presiona 1-4 o A-D para responder y P para pausar.',
    'El panel del anfitrión permite cambiar tiempo, puntos y equipos en cualquier momento.',
    'Oaxaca tiene 16 pueblos originarios y una enorme riqueza lingüística.',
    'Un error es información: lee la explicación de cada respuesta.'
  ];
  function S() { return NV.Store.get(); }
  function tip() { return TIPS[Math.floor(Math.random() * TIPS.length)]; }
  function backBtn(target, label) { return '<button class="btn btn-ghost btn-back" data-action="go" data-arg="' + target + '">← ' + (label || 'Volver') + '</button>'; }
  function header(kicker, title, back) {
    return '<div class="screen-head">' + (back ? backBtn(back) : '<span></span>') +
      '<div class="screen-title"><div class="kicker">' + kicker + '</div><h2>' + title + '</h2></div><span></span></div>';
  }

  /* ================= MENÚ PRINCIPAL ================= */
  function menu() {
    var st = S(), p = st.profile, li = E.levelInfo(p.xp), sess = st.session;
    var el = $('#s-menu');
    el.innerHTML =
      '<div class="menu-layout">' +
        '<div class="menu-hero">' +
          '<div class="menu-logo">' + UI.logoSVG('menu') + '</div>' +
          '<h1 class="logo-title sm"><span class="glitch" data-text="NEUROVERSE">NEUROVERSE</span></h1>' +
          '<div class="logo-sub">THE LAST CHALLENGE</div>' +
          '<p class="logo-motto">Cada decisión cuenta. Cada conocimiento te acerca a la victoria.</p>' +
          '<div class="tip-box"><span class="tip-tag">TRANSMISIÓN</span> <span id="menu-tip">' + esc(tip()) + '</span></div>' +
          '<div class="credits-card glass"><div class="kicker">CREADO POR</div><div class="credits-name">Jaime Said Mendez Garcia</div><div class="credits-group">Grupo 102 · COBAO Plantel 61</div></div>' +
        '</div>' +
        '<nav class="menu-buttons">' +
          (sess ? '<button class="menu-btn featured" data-action="resume"><span class="mb-icon">▶</span><span><b>CONTINUAR PARTIDA</b><small>' + esc(modeName(sess.mode)) + ' · paso ' + (sess.stepIndex + 1) + ' de ' + sess.steps.length + '</small></span></button>' : '') +
          '<button class="menu-btn ' + (sess ? '' : 'featured') + '" data-action="go" data-arg="mode"><span class="mb-icon">⚡</span><span><b>JUGAR</b><small>Campaña · Battle Arena · Boss Raid · Partida rápida</small></span></button>' +
          '<button class="menu-btn arcade-btn" data-action="go" data-arg="arcade"><span class="mb-icon">🕹️</span><span><b>NEUROVERSE ARCADE</b><small>15 minijuegos · récords · monedas virtuales · duelos</small></span><span class="arcade-badge">NUEVO</span></button>' +
          '<button class="menu-btn" data-action="quick"><span class="mb-icon">⏱</span><span><b>PARTIDA RÁPIDA</b><small>Demostración de 5 a 10 minutos para la exposición</small></span></button>' +
          '<button class="menu-btn" data-action="go" data-arg="ranking"><span class="mb-icon">🏆</span><span><b>RANKING</b><small>Clasificación general e historial</small></span></button>' +
          '<button class="menu-btn" data-action="go" data-arg="manual"><span class="mb-icon">📘</span><span><b>MANUAL</b><small>Reglas, modos, poderes y convivencia</small></span></button>' +
          '<button class="menu-btn" data-action="admin"><span class="mb-icon">⚙</span><span><b>PANEL DEL ANFITRIÓN</b><small>Equipos, tiempos, puntos y resultados</small></span></button>' +
          '<button class="menu-btn install-btn ' + (NV.PWA.canInstall() ? '' : 'hidden') + '" data-action="install"><span class="mb-icon">⬇</span><span><b>INSTALAR APP</b><small>Ícono en el escritorio · funciona sin internet</small></span></button>' +
        '</nav>' +
        '<aside class="profile-card glass">' +
          '<div class="pc-top"><div class="avatar">' + esc((p.name || 'J').charAt(0).toUpperCase()) + '</div><div><div class="pc-name">' + esc(p.name || 'Jugador sin nombre') + '</div><div class="pc-rank">Nivel ' + li.level + ' · ' + E.rankName(li.level) + '</div></div></div>' +
          '<div class="xpbar"><i style="width:' + li.pct + '%"></i></div><div class="xp-label">' + li.into + ' / ' + li.need + ' XP</div>' +
          '<div class="pc-stats"><div><b>' + p.unlocked.length + '/9</b><span>Mundos</span></div><div><b>' + Object.keys(p.bosses).length + '/9</b><span>Jefes</span></div><div><b>' + p.achievements.length + '/' + E.ACHIEVEMENTS.length + '</b><span>Logros</span></div></div>' +
          '<button class="btn btn-ghost btn-sm wide" data-action="achievements">Ver logros y misiones secretas</button>' +
        '</aside>' +
      '</div>';
  }

  function modeName(m) { return { campaign: 'Campaña', boss: 'Jefe de campaña', arena: 'Battle Arena', raid: 'Boss Raid', quick: 'Partida rápida', arcade: 'NEUROVERSE Arcade' }[m] || m; }

  /* ================= SELECCIÓN DE MODO ================= */
  function mode() {
    var cards = [
      { id: 'campaign', icon: '🛰️', name: 'MODO CAMPAÑA', who: '1 jugador', time: '3–6 min por misión', desc: 'Supera misiones, gana XP, sube de nivel, desbloquea los 9 mundos y derrota a sus jefes.' },
      { id: 'arena', icon: '⚔️', name: 'BATTLE ARENA', who: '2 a 8 equipos de 3–5', time: '10–20 min', desc: 'Equipos compiten por turnos con preguntas, retos especiales y duelos. Ranking en tiempo real.' },
      { id: 'raid', icon: '👾', name: 'BOSS RAID', who: 'Todos los equipos juntos', time: '8–15 min', desc: 'Cooperen para destruir a OMEGA. Cada acierto le quita vida; cada error le da fuerza.' },
      { id: 'quick', icon: '⏱️', name: 'PARTIDA RÁPIDA', who: '2+ equipos', time: '5–10 min', desc: 'Demostración que incluye preguntas, reto especial, dilema, duelo y un jefe final.' }
    ];
    $('#s-mode').innerHTML = header('ELIGE TU DESAFÍO', 'SELECCIÓN DE MODO', 'menu') +
      '<div class="mode-grid">' + cards.map(function (c) {
        return '<button class="mode-card" data-action="pick-mode" data-arg="' + c.id + '"><div class="mc-glow"></div><div class="mc-icon">' + c.icon + '</div><h3>' + c.name + '</h3><p>' + c.desc + '</p><div class="mc-meta"><span>👥 ' + c.who + '</span><span>⏱ ' + c.time + '</span></div><div class="mc-cta">SELECCIONAR →</div></button>';
      }).join('') + '</div>';
  }

  /* ================= GESTOR DE EQUIPOS (reutilizable) ================= */
  var selectedTeams = {};
  function teamManager(container, opts) {
    opts = opts || {};
    var st = S();
    function render() {
      container.innerHTML = '<div class="teams-grid">' + st.teams.map(function (t) {
        var n = t.members.length, okSize = n >= 3 && n <= 5;
        return '<div class="team-card glass ' + (opts.selectable && selectedTeams[t.id] ? 'selected' : '') + '" style="--tc:' + t.color + '" data-team="' + t.id + '">' +
          '<div class="tc-head">' +
            (opts.selectable ? '<label class="check"><input type="checkbox" data-tsel ' + (selectedTeams[t.id] ? 'checked' : '') + '><span></span></label>' : '') +
            '<span class="tc-dot"></span><b class="tc-name">' + esc(t.name) + '</b>' +
            '<button class="icon-btn sm" data-trename title="Editar nombre">✎</button>' +
            '<button class="icon-btn sm" data-tcolor title="Cambiar color">🎨</button>' +
            '<button class="icon-btn sm danger" data-tdel title="Eliminar equipo">🗑</button>' +
          '</div>' +
          '<div class="tc-members">' + t.members.map(function (m, i) { return '<span class="member">' + esc(m) + '<button data-mdel="' + i + '" title="Quitar">×</button></span>'; }).join('') + '</div>' +
          '<form class="tc-add" data-madd><input class="input sm" maxlength="24" placeholder="Nombre del integrante" ' + (n >= 5 ? 'disabled' : '') + '><button class="btn btn-sm" ' + (n >= 5 ? 'disabled' : '') + '>+ Añadir</button></form>' +
          '<div class="tc-foot ' + (okSize ? 'ok' : 'warn') + '">' + n + ' integrante' + (n === 1 ? '' : 's') + (okSize ? ' ✓' : ' · se requieren de 3 a 5') + '</div>' +
        '</div>';
      }).join('') +
      '<button class="team-card add-team" data-tnew><span>+</span>NUEVO EQUIPO</button></div>';
      bind();
      if (opts.onChange) opts.onChange();
    }
    function team(elm) { var id = elm.closest('[data-team]').getAttribute('data-team'); return st.teams.find(function (t) { return t.id === id; }); }
    function bind() {
      $$('[data-tnew]', container).forEach(function (b) { b.onclick = function () {
        UI.prompt('Nuevo equipo', 'Nombre del equipo', 'Equipo ' + (st.teams.length + 1)).then(function (name) {
          if (!name) return;
          var t = { id: E.uid(), name: name, color: TEAM_COLORS[st.teams.length % TEAM_COLORS.length], members: [] };
          st.teams.push(t); selectedTeams[t.id] = true; NV.Store.save(); NV.Audio.play('power'); render();
        });
      }; });
      $$('[data-trename]', container).forEach(function (b) { b.onclick = function () {
        var t = team(b); UI.prompt('Editar nombre', 'Nuevo nombre del equipo', t.name).then(function (name) { if (name) { t.name = name; NV.Store.save(); render(); } });
      }; });
      $$('[data-tcolor]', container).forEach(function (b) { b.onclick = function () {
        var t = team(b); var i = TEAM_COLORS.indexOf(t.color); t.color = TEAM_COLORS[(i + 1) % TEAM_COLORS.length]; NV.Store.save(); render();
      }; });
      $$('[data-tdel]', container).forEach(function (b) { b.onclick = function () {
        var t = team(b);
        UI.confirm('Eliminar equipo', '¿Eliminar a <b>' + esc(t.name) + '</b>? Sus resultados del historial se conservan.', 'Eliminar', true).then(function (ok) {
          if (!ok) return; st.teams = st.teams.filter(function (x) { return x !== t; }); delete selectedTeams[t.id]; NV.Store.save(); render();
        });
      }; });
      $$('[data-mdel]', container).forEach(function (b) { b.onclick = function () {
        var t = team(b); t.members.splice(+b.getAttribute('data-mdel'), 1); NV.Store.save(); render();
      }; });
      $$('[data-madd]', container).forEach(function (f) { f.onsubmit = function (e) {
        e.preventDefault(); var t = team(f), inp = $('input', f), v = inp.value.trim();
        if (!v) return; if (t.members.length >= 5) { UI.toast('Máximo 5 integrantes por equipo', 'warn'); return; }
        t.members.push(v); NV.Store.save(); NV.Audio.play('click'); render();
        var again = $('[data-team="' + t.id + '"] [data-madd] input', container); if (again && !again.disabled) again.focus();
      }; });
      $$('[data-tsel]', container).forEach(function (c) { c.onchange = function () { var t = team(c); selectedTeams[t.id] = c.checked; render(); }; });
    }
    render();
    return { render: render };
  }

  function createDemoTeams() {
    var st = S();
    var demo = [
      { name: 'Equipo Nova', members: ['Ana', 'Luis', 'Sofía'] },
      { name: 'Equipo Pulsar', members: ['Diego', 'Valeria', 'Iván'] },
      { name: 'Equipo Quásar', members: ['Mariana', 'Jorge', 'Elena'] }
    ];
    demo.forEach(function (d) {
      if (st.teams.some(function (t) { return t.name === d.name; })) return;
      st.teams.push({ id: E.uid(), name: d.name, color: TEAM_COLORS[st.teams.length % TEAM_COLORS.length], members: d.members });
    });
    st.teams.forEach(function (t) { if (demo.some(function (d) { return d.name === t.name; })) selectedTeams[t.id] = true; });
    NV.Store.save();
  }

  /* ================= REGISTRO ================= */
  var regWorlds = null;
  function register(m) {
    var st = S(), el = $('#s-register');
    if (m === 'campaign') {
      el.innerHTML = header('MODO CAMPAÑA', 'REGISTRO DE JUGADOR', 'mode') +
        '<div class="register-solo glass">' +
          '<div class="avatar xl">' + esc((st.profile.name || '?').charAt(0).toUpperCase()) + '</div>' +
          '<label class="field"><span>Nombre del jugador o jugadora</span><input id="reg-name" class="input lg" maxlength="24" placeholder="Escribe tu nombre" value="' + esc(st.profile.name) + '"></label>' +
          '<p class="muted">Tu progreso (XP, nivel, mundos y logros) se guarda automáticamente en esta computadora.</p>' +
          '<button class="btn btn-primary btn-lg" id="reg-go">ENTRAR AL NEUROVERSE →</button>' +
        '</div>';
      var go = function () {
        var v = $('#reg-name').value.trim();
        if (!v) { UI.toast('Escribe tu nombre para comenzar', 'warn'); $('#reg-name').focus(); return; }
        st.profile.name = v; NV.Store.save(); NV.App.go('map');
      };
      $('#reg-go').onclick = go;
      $('#reg-name').onkeydown = function (e) { if (e.key === 'Enter') go(); };
      return;
    }
    if (!regWorlds) regWorlds = NV.WORLDS.map(function (w) { return w.id; });
    var titles = { arena: 'BATTLE ARENA', raid: 'BOSS RAID', quick: 'PARTIDA RÁPIDA' };
    var need = { arena: 'Mínimo 2 equipos de 3 a 5 integrantes.', raid: 'Mínimo 1 equipo (recomendado 2 o más) de 3 a 5 integrantes.', quick: 'Mínimo 2 equipos de 3 a 5 integrantes.' }[m];
    el.innerHTML = header(titles[m], 'REGISTRO DE EQUIPOS', 'mode') +
      '<div class="register-layout">' +
        '<div class="reg-teams"><div class="reg-bar"><p class="muted">Marca los equipos que jugarán. ' + need + '</p><button class="btn btn-sm btn-ghost" id="reg-demo">Crear equipos de ejemplo</button></div><div id="reg-team-list"></div></div>' +
        '<aside class="reg-config glass">' +
          '<h3>CONFIGURACIÓN</h3>' +
          '<div class="field"><span>Mundos incluidos</span><div class="world-chips">' + NV.WORLDS.map(function (w) {
            return '<button class="wchip ' + (regWorlds.indexOf(w.id) >= 0 ? 'on' : '') + '" data-w="' + w.id + '" style="--wc:' + w.color + '">' + w.icon + ' ' + w.name + '</button>';
          }).join('') + '</div><div class="chip-actions"><button class="link" id="w-all">Todos</button> · <button class="link" id="w-none">Ninguno</button></div></div>' +
          (m === 'arena' ? '<label class="field"><span>Rondas (preguntas por equipo)</span><select id="reg-rounds" class="input">' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<option ' + (st.settings.arenaRounds === n ? 'selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>' : '') +
          '<label class="field"><span>Tiempo por pregunta</span><select id="reg-timer" class="input">' + [0, 15, 20, 30, 45, 60, 90].map(function (n) { return '<option value="' + n + '" ' + (st.settings.timer === n ? 'selected' : '') + '>' + (n ? n + ' segundos' : 'Sin límite') + '</option>'; }).join('') + '</select></label>' +
          '<div id="reg-summary" class="reg-summary"></div>' +
          '<button class="btn btn-primary btn-lg wide" id="reg-start">COMENZAR PARTIDA</button>' +
        '</aside>' +
      '</div>';
    // Por defecto, seleccionar los equipos válidos
    st.teams.forEach(function (t) { if (selectedTeams[t.id] === undefined) selectedTeams[t.id] = t.members.length >= 3 && t.members.length <= 5; });
    var tm = teamManager($('#reg-team-list'), { selectable: true, onChange: summary });
    $('#reg-demo').onclick = function () { createDemoTeams(); tm.render(); UI.toast('Equipos de ejemplo listos. Puedes editarlos.', 'ok'); };
    $$('.wchip', el).forEach(function (b) { b.onclick = function () {
      var id = b.getAttribute('data-w'), i = regWorlds.indexOf(id);
      if (i >= 0) regWorlds.splice(i, 1); else regWorlds.push(id);
      b.classList.toggle('on'); summary();
    }; });
    $('#w-all').onclick = function () { regWorlds = NV.WORLDS.map(function (w) { return w.id; }); $$('.wchip', el).forEach(function (b) { b.classList.add('on'); }); summary(); };
    $('#w-none').onclick = function () { regWorlds = []; $$('.wchip', el).forEach(function (b) { b.classList.remove('on'); }); summary(); };
    function chosen() { return st.teams.filter(function (t) { return selectedTeams[t.id]; }); }
    function problems() {
      var c = chosen(), errs = [];
      var min = m === 'raid' ? 1 : 2;
      if (c.length < min) errs.push('Selecciona al menos ' + min + ' equipo' + (min > 1 ? 's' : '') + '.');
      c.forEach(function (t) { if (t.members.length < 3 || t.members.length > 5) errs.push('"' + t.name + '" debe tener de 3 a 5 integrantes.'); });
      if (!regWorlds.length) errs.push('Selecciona al menos un mundo.');
      return errs;
    }
    function summary() {
      var box = $('#reg-summary'); if (!box) return;
      var errs = problems();
      box.innerHTML = errs.length ? errs.map(function (e) { return '<div class="warn-line">⚠ ' + esc(e) + '</div>'; }).join('') : '<div class="ok-line">✓ ' + chosen().length + ' equipos listos · ' + regWorlds.length + ' mundos</div>';
    }
    summary();
    $('#reg-start').onclick = function () {
      var errs = problems();
      if (errs.length) { UI.toast(errs[0], 'warn'); NV.Audio.play('wrong'); return; }
      st.settings.timer = +$('#reg-timer').value;
      var rounds = st.settings.arenaRounds;
      if ($('#reg-rounds')) { rounds = +$('#reg-rounds').value; st.settings.arenaRounds = rounds; }
      NV.Store.save();
      NV.Match.start({ mode: m, worlds: regWorlds.slice(), participants: chosen(), rounds: rounds, title: titles[m] });
    };
  }

  /* ================= MAPA DE MUNDOS ================= */
  // Posiciones (en %) de los planetas en el mapa estelar
  var POS = [[12, 22], [36, 14], [60, 24], [84, 16], [76, 50], [50, 46], [24, 56], [38, 84], [68, 82]];
  function worldState(w) {
    var p = S().profile;
    if (p.unlocked.indexOf(w.id) < 0) return 'locked';
    if (p.bosses[w.id] != null) return 'done';
    return 'open';
  }
  function missionsDone(wid) { var m = S().profile.missions[wid] || {}; return [1, 2, 3].filter(function (k) { return m[k]; }).length; }
  function map() {
    var st = S(), p = st.profile, li = E.levelInfo(p.xp);
    var secrets = E.ACHIEVEMENTS.filter(function (a) { return a.secret; });
    var found = secrets.filter(function (a) { return p.achievements.indexOf(a.id) >= 0; }).length;
    var path = POS.map(function (pt, i) { return (i ? 'L' : 'M') + pt[0] + ' ' + pt[1]; }).join(' ');
    $('#s-map').innerHTML = header('CAMPAÑA · ' + esc(p.name || 'Jugador'), 'MAPA DEL NEUROVERSE', 'mode') +
      '<div class="map-hud glass">' +
        '<div class="mh-item"><span>NIVEL</span><b>' + li.level + '</b><small>' + E.rankName(li.level) + '</small></div>' +
        '<div class="mh-xp"><div class="xpbar"><i style="width:' + li.pct + '%"></i></div><small>' + li.into + ' / ' + li.need + ' XP · Total ' + fmt(p.xp) + '</small></div>' +
        '<div class="mh-item"><span>JEFES</span><b>' + Object.keys(p.bosses).length + '/9</b></div>' +
        '<div class="mh-item"><span>MISIONES SECRETAS</span><b>' + found + '/' + secrets.length + '</b></div>' +
        '<button class="btn btn-sm btn-ghost" data-action="achievements">🏅 Logros</button>' +
      '</div>' +
      '<div class="star-map">' +
        '<svg class="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="' + path + '" /></svg>' +
        NV.WORLDS.map(function (w, i) {
          var s = worldState(w), md = missionsDone(w.id);
          return '<button class="planet ' + s + '" style="left:' + POS[i][0] + '%;top:' + POS[i][1] + '%;--wc:' + w.color + ';--wc2:' + w.color2 + '" data-action="world" data-arg="' + w.id + '" ' + (s === 'locked' ? 'aria-disabled="true"' : '') + '>' +
            '<span class="pl-orb"><span class="pl-icon">' + (s === 'locked' ? '🔒' : w.icon) + '</span></span>' +
            '<span class="pl-name">' + w.num + '. ' + w.name + '</span>' +
            '<span class="pl-sub">' + (s === 'locked' ? 'Bloqueado' : s === 'done' ? '✓ Completado' : md + '/3 misiones') + '</span></button>';
        }).join('') +
      '</div>' +
      '<p class="muted center">Completa las 3 misiones de un mundo y derrota a su jefe para desbloquear el siguiente.</p>';
  }

  /* ================= MISIONES ================= */
  var MISSION_INFO = [
    { n: 1, name: 'CALIBRACIÓN', desc: 'Preguntas de nivel fácil y medio para entrar en ritmo.', diff: 'Fácil' },
    { n: 2, name: 'EXPANSIÓN', desc: 'Preguntas de nivel medio y un RETO ESPECIAL.', diff: 'Media' },
    { n: 3, name: 'NÚCLEO', desc: 'Preguntas difíciles y un RETO ESPECIAL de 500 puntos.', diff: 'Difícil' }
  ];
  function missions(wid) {
    var w = NV.worldById(wid), p = S().profile, rec = p.missions[wid] || {};
    var bossOpen = !!rec[3];
    $('#s-missions').innerHTML = '<div class="world-banner" style="--wc:' + w.color + ';--wc2:' + w.color2 + '">' + backBtn('map', 'Mapa') +
      '<div class="wb-icon">' + w.icon + '</div><div><div class="kicker">MUNDO ' + w.num + ' · ' + esc(w.subject) + '</div><h2>' + w.name + '</h2><p>' + esc(w.desc) + '</p></div></div>' +
      '<div class="mission-grid">' + MISSION_INFO.map(function (mi) {
        var open = mi.n === 1 || rec[mi.n - 1], r = rec[mi.n];
        return '<button class="mission-card ' + (open ? '' : 'locked') + ' ' + (r ? 'cleared' : '') + '" style="--wc:' + w.color + '" ' + (open ? 'data-action="mission" data-arg="' + wid + ':' + mi.n + '"' : 'aria-disabled="true"') + '>' +
          '<div class="mi-num">0' + mi.n + '</div><div class="mi-name">MISIÓN ' + mi.n + ': ' + mi.name + '</div><p>' + mi.desc + '</p>' +
          '<div class="mi-meta"><span>Dificultad: ' + mi.diff + '</span><span>' + S().settings.questions + ' preguntas</span></div>' +
          '<div class="mi-status">' + (!open ? '🔒 Completa la misión ' + (mi.n - 1) : r ? '✓ Récord: ' + fmt(r.best) + ' pts' + (r.perfect ? ' · 💎 Perfecta' : '') : '▶ JUGAR') + '</div></button>';
      }).join('') +
      '<button class="mission-card boss-card ' + (bossOpen ? '' : 'locked') + '" style="--wc:' + w.color + '" ' + (bossOpen ? 'data-action="boss" data-arg="' + wid + '"' : 'aria-disabled="true"') + '>' +
        '<div class="boss-mini">' + UI.bossSVG({ color: w.color, color2: w.color2, shape: w.boss.shape }) + '</div>' +
        '<div class="mi-name">JEFE FINAL: ' + w.boss.name + '</div><p>' + esc(w.boss.title) + '. Derrótalo para desbloquear el siguiente mundo. Recompensa: hasta ' + fmt(S().settings.points.boss) + ' pts.</p>' +
        '<div class="mi-status">' + (!bossOpen ? '🔒 Completa la misión 3' : p.bosses[wid] != null ? '✓ Derrotado · ' + fmt(p.bosses[wid]) + ' pts' : '⚔ ENFRENTAR') + '</div></button>' +
      '</div>';
  }

  /* ================= LOGROS ================= */
  function achievements() {
    var p = S().profile;
    var html = '<div class="ach-grid">' + E.ACHIEVEMENTS.map(function (a) {
      var has = p.achievements.indexOf(a.id) >= 0, hidden = a.secret && !has;
      return '<div class="ach-card ' + (has ? 'has' : '') + ' ' + (a.secret ? 'secret' : '') + '"><div class="ach-icon">' + (hidden ? '❔' : a.icon) + '</div><div><b>' + (hidden ? 'MISIÓN SECRETA' : esc(a.name)) + '</b><small>' + (hidden ? 'Pista: ' + esc(a.hint) : esc(a.desc)) + '</small><span class="ach-xp">+' + a.xp + ' XP</span></div></div>';
    }).join('') + '</div>';
    UI.modal({ title: 'LOGROS Y MISIONES SECRETAS', html: html, buttons: [{ label: 'Cerrar', value: true, cls: 'btn-primary' }] });
  }

  /* ================= RESULTADOS ================= */
  function results(r) {
    var el = $('#s-results');
    var rank = r.ranking || [];
    var isTeam = r.mode !== 'campaign' && r.mode !== 'boss';
    var head = r.victory ? (isTeam ? '¡' + esc(rank[0] ? rank[0].name : '') + ' GANA!' : '¡VICTORIA!') : (r.mode === 'raid' ? 'OMEGA SOBREVIVIÓ' : 'MISIÓN FALLIDA');
    if (r.mode === 'raid' && r.victory) head = '¡OMEGA HA CAÍDO!';
    else if (isTeam && r.mode !== 'raid' && rank[1] && rank[0].score === rank[1].score && rank[0].correct === rank[1].correct) head = '¡EMPATE!';
    var podium = '';
    if (isTeam && rank.length) {
      var order = [rank[1], rank[0], rank[2]];
      podium = '<div class="podium">' + order.map(function (t, i) {
        if (!t) return '<div class="pod empty"></div>';
        var place = i === 1 ? 1 : i === 0 ? 2 : 3;
        return '<div class="pod p' + place + '" style="--tc:' + t.color + '"><div class="pod-name">' + esc(t.name) + '</div><div class="pod-score">' + fmt(t.score) + '</div><div class="pod-block"><span>' + place + '</span></div></div>';
      }).join('') + '</div>';
    }
    var rows = rank.map(function (t, i) {
      var acc = t.answered ? Math.round(t.correct / t.answered * 100) : 0;
      return '<tr><td>' + (i + 1) + '</td><td><span class="dot" style="background:' + t.color + '"></span>' + esc(t.name) + '</td><td>' + fmt(t.score) + '</td><td>' + t.correct + '</td><td>' + t.wrong + '</td><td>' + acc + '%</td><td>' + t.bestStreak + '</td>' + (r.hasBoss ? '<td>' + fmt(t.damage) + '</td>' : '') + '</tr>';
    }).join('');
    el.innerHTML = '<div class="results ' + (r.victory ? 'win' : 'lose') + '">' +
      '<div class="res-kicker">' + esc(r.title || '') + '</div>' +
      '<h1 class="res-title">' + head + '</h1>' +
      (r.subtitle ? '<p class="res-sub">' + esc(r.subtitle) + '</p>' : '') +
      podium +
      (r.xpGained != null ? '<div class="res-xp glass"><div><span>XP GANADA</span><b>+' + fmt(r.xpGained) + '</b></div><div><span>NIVEL</span><b>' + r.level + (r.levelUp ? ' ⬆' : '') + '</b></div><div><span>PUNTOS</span><b>' + fmt(rank[0] ? rank[0].score : 0) + '</b></div>' + (r.unlockedWorld ? '<div><span>NUEVO MUNDO</span><b>' + esc(r.unlockedWorld) + '</b></div>' : '') + '</div>' : '') +
      (r.achievements && r.achievements.length ? '<div class="res-ach">' + r.achievements.map(function (a) { return '<span class="ach-pill">' + a.icon + ' ' + esc(a.name) + '</span>'; }).join('') + '</div>' : '') +
      '<div class="table-wrap glass"><table class="table"><thead><tr><th>#</th><th>' + (isTeam ? 'Equipo' : 'Jugador') + '</th><th>Puntos</th><th>Aciertos</th><th>Errores</th><th>Precisión</th><th>Mejor racha</th>' + (r.hasBoss ? '<th>Daño al jefe</th>' : '') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="muted center">Resultado guardado en el historial · ' + new Date(r.date).toLocaleString('es-MX') + '</p>' +
      '<div class="res-actions">' +
        (r.mode === 'campaign' || r.mode === 'boss' ? '<button class="btn btn-primary" data-action="world" data-arg="' + r.worlds[0] + '">CONTINUAR</button>' : '') +
        '<button class="btn" data-action="replay">JUGAR DE NUEVO</button>' +
        '<button class="btn" data-action="go" data-arg="ranking">VER RANKING</button>' +
        '<button class="btn btn-ghost" data-action="go" data-arg="menu">MENÚ PRINCIPAL</button>' +
      '</div></div>';
    if (r.victory) { setTimeout(function () { UI.confetti(220); NV.Audio.play('victory'); }, 300); }
    else { NV.Audio.play('defeat'); }
  }

  /* ================= RANKING ================= */
  var rankTab = 'teams';
  function ranking() {
    var st = S(), el = $('#s-ranking');
    var tabs = [['teams', 'Equipos'], ['players', 'Campaña'], ['live', 'Partida actual'], ['history', 'Historial']];
    var body = '';
    if (rankTab === 'teams' || rankTab === 'players') {
      var agg = {};
      st.history.forEach(function (h) {
        var isTeam = h.mode !== 'campaign' && h.mode !== 'boss';
        if ((rankTab === 'teams') !== isTeam) return;
        h.ranking.forEach(function (t) {
          var a = agg[t.name] = agg[t.name] || { name: t.name, color: t.color, total: 0, best: 0, games: 0, wins: 0, correct: 0, answered: 0 };
          a.total += t.score; a.best = Math.max(a.best, t.score); a.games++; a.correct += t.correct; a.answered += t.answered;
          if (isTeam ? h.ranking[0] === t : h.victory) a.wins++;
        });
      });
      var list = Object.keys(agg).map(function (k) { return agg[k]; }).sort(function (a, b) { return b.total - a.total; });
      body = list.length ? '<div class="table-wrap glass"><table class="table rank-table"><thead><tr><th>#</th><th>' + (rankTab === 'teams' ? 'Equipo' : 'Jugador') + '</th><th>Puntos totales</th><th>Mejor partida</th><th>Partidas</th><th>' + (rankTab === 'teams' ? '1er lugar' : 'Victorias') + '</th><th>Precisión</th></tr></thead><tbody>' +
        list.map(function (a, i) { return '<tr class="r' + (i + 1) + '"><td>' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1) + '</td><td><span class="dot" style="background:' + (a.color || '#8b5cf6') + '"></span>' + esc(a.name) + '</td><td><b>' + fmt(a.total) + '</b></td><td>' + fmt(a.best) + '</td><td>' + a.games + '</td><td>' + a.wins + '</td><td>' + (a.answered ? Math.round(a.correct / a.answered * 100) : 0) + '%</td></tr>'; }).join('') +
        '</tbody></table></div>' : '<div class="empty-state glass">Aún no hay partidas terminadas en esta categoría. ¡Juega una para aparecer aquí!</div>';
    } else if (rankTab === 'live') {
      var s = st.session;
      body = s ? '<div class="table-wrap glass"><table class="table rank-table"><thead><tr><th>#</th><th>Participante</th><th>Puntos</th><th>Aciertos</th><th>Racha</th></tr></thead><tbody>' +
        E.ranking(s.participants).map(function (t, i) { return '<tr><td>' + (i + 1) + '</td><td><span class="dot" style="background:' + t.color + '"></span>' + esc(t.name) + '</td><td><b>' + fmt(t.score) + '</b></td><td>' + t.correct + '</td><td>' + t.streak + '</td></tr>'; }).join('') +
        '</tbody></table></div><div class="center"><button class="btn btn-primary" data-action="resume">Volver a la partida</button></div>' : '<div class="empty-state glass">No hay ninguna partida en curso.</div>';
    } else {
      body = st.history.length ? '<div class="history-list">' + st.history.slice().reverse().map(function (h) {
        return '<div class="history-item glass"><div><b>' + esc(modeName(h.mode)) + '</b> · ' + esc(h.title || '') + '<small>' + new Date(h.date).toLocaleString('es-MX') + '</small></div><div class="hi-res">' + (h.victory ? '🏆 ' : '') + esc(h.ranking[0] ? h.ranking[0].name : '') + ' · ' + fmt(h.ranking[0] ? h.ranking[0].score : 0) + ' pts</div></div>';
      }).join('') + '</div>' : '<div class="empty-state glass">El historial está vacío.</div>';
    }
    el.innerHTML = header('SALÓN DE LA FAMA', 'RANKING GENERAL', 'menu') +
      '<div class="tabs">' + tabs.map(function (t) { return '<button class="tab ' + (rankTab === t[0] ? 'on' : '') + '" data-rt="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' + body;
    $$('[data-rt]', el).forEach(function (b) { b.onclick = function () { rankTab = b.getAttribute('data-rt'); NV.Audio.play('click'); ranking(); }; });
  }

  /* ================= PANEL DE ADMINISTRACIÓN ================= */
  var adminTab = 'match', adminUnlocked = false;
  function admin(tab) {
    if (tab) adminTab = tab;
    var st = S(), el = $('#s-admin');
    if (!adminUnlocked) {
      el.innerHTML = header('ACCESO RESTRINGIDO', 'PANEL DEL ANFITRIÓN', 'menu') +
        '<form class="pin-box glass" id="pin-form"><div class="pin-icon">🔐</div><p>Introduce el PIN del anfitrión.<br><small class="muted">PIN inicial: 0102 (puedes cambiarlo en Configuración).</small></p>' +
        '<input id="pin-input" class="input lg center" type="password" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="••••"><button class="btn btn-primary btn-lg wide">ENTRAR</button></form>';
      $('#pin-form').onsubmit = function (e) {
        e.preventDefault();
        if ($('#pin-input').value === st.settings.pin) { adminUnlocked = true; NV.Audio.play('power'); admin(); }
        else { NV.Audio.play('wrong'); UI.shake($('#pin-form')); UI.toast('PIN incorrecto', 'warn'); $('#pin-input').value = ''; }
      };
      setTimeout(function () { var i = $('#pin-input'); if (i) i.focus(); }, 100);
      return;
    }
    var tabs = [['match', '🎮 Partida'], ['teams', '👥 Equipos'], ['config', '⚙ Configuración'], ['results', '📊 Resultados'], ['system', '🛠 Sistema']];
    el.innerHTML = '<div class="screen-head">' + backBtn('menu', 'Menú principal') + '<div class="screen-title"><div class="kicker">MODO ANFITRIÓN</div><h2>PANEL DE ADMINISTRACIÓN</h2></div><button class="btn btn-ghost btn-sm" id="adm-lock">🔒 Bloquear</button></div>' +
      '<div class="tabs">' + tabs.map(function (t) { return '<button class="tab ' + (adminTab === t[0] ? 'on' : '') + '" data-at="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div id="adm-body" class="adm-body"></div>';
    $$('[data-at]', el).forEach(function (b) { b.onclick = function () { adminTab = b.getAttribute('data-at'); NV.Audio.play('click'); admin(); }; });
    $('#adm-lock').onclick = function () { adminUnlocked = false; admin(); };
    var body = $('#adm-body');
    ({ match: admMatch, teams: admTeams, config: admConfig, results: admResults, system: admSystem })[adminTab](body, st);
  }

  function admMatch(body, st) {
    var s = st.session;
    var live = s ? '<div class="adm-card glass"><h3>PARTIDA EN CURSO</h3><p><b>' + esc(modeName(s.mode)) + '</b> · ' + esc(s.title || '') + ' · paso ' + (s.stepIndex + 1) + ' de ' + s.steps.length + (s.paused ? ' · <span class="warn-text">EN PAUSA</span>' : '') + '</p>' +
      '<div class="mini-rank">' + E.ranking(s.participants).map(function (p, i) { return '<div><span>' + (i + 1) + '. <i class="dot" style="background:' + p.color + '"></i>' + esc(p.name) + '</span><b>' + fmt(p.score) + '</b></div>'; }).join('') + '</div>' +
      '<div class="btn-row"><button class="btn btn-primary" data-action="resume">▶ Reanudar / ir a la partida</button><button class="btn" id="adm-pause">' + (s.paused ? '▶ Quitar pausa' : '⏸ Pausar') + '</button><button class="btn" id="adm-finish">🏁 Terminar y ver resultados</button><button class="btn" id="adm-restart">↻ Reiniciar partida</button><button class="btn btn-danger" id="adm-discard">✕ Descartar</button></div></div>'
      : '<div class="adm-card glass"><h3>SIN PARTIDA EN CURSO</h3><p class="muted">Inicia una nueva partida eligiendo el modo.</p></div>';
    body.innerHTML = live +
      '<div class="adm-card glass"><h3>INICIAR NUEVA PARTIDA</h3><p class="muted">Elige el modo. En la siguiente pantalla seleccionarás equipos, mundos, rondas y tiempo.</p>' +
      '<div class="btn-row"><button class="btn" data-action="pick-mode" data-arg="campaign">🛰 Campaña</button><button class="btn" data-action="pick-mode" data-arg="arena">⚔ Battle Arena</button><button class="btn" data-action="pick-mode" data-arg="raid">👾 Boss Raid</button><button class="btn" data-action="pick-mode" data-arg="quick">⏱ Partida rápida</button></div></div>' +
      '<div class="adm-card glass"><h3>PANTALLA PROYECTADA</h3><div class="btn-row"><button class="btn" data-action="go" data-arg="ranking">🏆 Mostrar ranking</button><button class="btn" data-action="toggle-projector">⛶ Modo proyector (texto grande)</button><button class="btn" data-action="fullscreen">⤢ Pantalla completa</button></div></div>';
    if (s) {
      $('#adm-pause').onclick = function () { s.paused = !s.paused; NV.Store.save(); admin(); };
      $('#adm-finish').onclick = function () { UI.confirm('Terminar partida', 'Se guardarán los puntos actuales y se mostrarán los resultados.', 'Terminar').then(function (ok) { if (ok) NV.Match.finishNow(); }); };
      $('#adm-restart').onclick = function () { UI.confirm('Reiniciar partida', 'Se perderán los puntos de la partida actual y comenzará de nuevo con los mismos equipos y mundos.', 'Reiniciar', true).then(function (ok) { if (ok) NV.Match.restart(); }); };
      $('#adm-discard').onclick = function () { UI.confirm('Descartar partida', 'La partida en curso se eliminará sin guardar resultados.', 'Descartar', true).then(function (ok) { if (ok) { NV.Match.discard(); admin(); } }); };
    }
  }

  function admTeams(body) {
    body.innerHTML = '<div class="adm-card glass"><h3>EQUIPOS REGISTRADOS</h3><p class="muted">Crea equipos, edita sus nombres, añade o elimina integrantes (3 a 5 por equipo). Los cambios se guardan al instante.</p><div class="btn-row"><button class="btn btn-sm btn-ghost" id="adm-demo">Crear equipos de ejemplo</button></div><div id="adm-teams"></div></div>';
    var tm = teamManager($('#adm-teams'), {});
    $('#adm-demo').onclick = function () { createDemoTeams(); tm.render(); };
  }

  function admConfig(body, st) {
    var s = st.settings;
    function num(id, label, val, min, max, step) { return '<label class="field"><span>' + label + '</span><input class="input" type="number" id="' + id + '" value="' + val + '" min="' + min + '" max="' + max + '" step="' + (step || 1) + '"></label>'; }
    function tog(id, label, val) { return '<label class="toggle"><input type="checkbox" id="' + id + '" ' + (val ? 'checked' : '') + '><span class="tg"></span>' + label + '</label>'; }
    body.innerHTML = '<div class="adm-grid">' +
      '<div class="adm-card glass"><h3>TIEMPO Y PREGUNTAS</h3>' +
        num('c-timer', 'Segundos por pregunta (0 = sin límite)', s.timer, 0, 120) +
        num('c-questions', 'Preguntas por misión de campaña', s.questions, 3, 15) +
        num('c-rounds', 'Rondas por equipo en Battle Arena', s.arenaRounds, 1, 6) +
        num('c-lives', 'Vidas en campaña', s.lives, 1, 9) +
        num('c-raidlives', 'Vidas compartidas en Boss Raid', s.raidLives, 1, 15) + '</div>' +
      '<div class="adm-card glass"><h3>PUNTUACIÓN</h3>' +
        num('c-p-facil', 'Pregunta fácil', s.points.facil, 0, 2000, 10) +
        num('c-p-media', 'Pregunta media', s.points.media, 0, 2000, 10) +
        num('c-p-dificil', 'Pregunta difícil', s.points.dificil, 0, 2000, 10) +
        num('c-p-special', 'Reto especial (máximo)', s.points.special, 0, 5000, 10) +
        num('c-p-boss', 'Jefe final (máximo)', s.points.boss, 0, 10000, 10) +
        num('c-p-duel', 'Duelo', s.points.duel, 0, 3000, 10) +
        num('c-penalty', 'Penalización por error en Arena', s.penalty, 0, 1000, 10) + '</div>' +
      '<div class="adm-card glass"><h3>SONIDO Y EXPERIENCIA</h3>' +
        tog('c-music', 'Música ambiental', s.music) + tog('c-sfx', 'Efectos de sonido', s.sfx) +
        tog('c-speed', 'Bono por rapidez (máx. +20%)', s.speedBonus) + tog('c-events', 'Eventos aleatorios', s.events) +
        tog('c-projector', 'Modo proyector (texto grande)', s.projector) +
        '<label class="field"><span>PIN del anfitrión</span><input class="input" id="c-pin" maxlength="8" value="' + esc(s.pin) + '"></label></div>' +
      '</div><div class="btn-row center"><button class="btn btn-primary btn-lg" id="c-save">💾 GUARDAR CONFIGURACIÓN</button><button class="btn btn-ghost" id="c-reset">Restaurar valores originales</button></div>';
    function v(id, min, max) { var n = Math.round(+$('#' + id).value); if (isNaN(n)) n = min; return Math.max(min, Math.min(max, n)); }
    $('#c-save').onclick = function () {
      s.timer = v('c-timer', 0, 120); s.questions = v('c-questions', 3, 15); s.arenaRounds = v('c-rounds', 1, 6);
      s.lives = v('c-lives', 1, 9); s.raidLives = v('c-raidlives', 1, 15);
      s.points.facil = v('c-p-facil', 0, 2000); s.points.media = v('c-p-media', 0, 2000); s.points.dificil = v('c-p-dificil', 0, 2000);
      s.points.special = v('c-p-special', 0, 5000); s.points.boss = v('c-p-boss', 0, 10000); s.points.duel = v('c-p-duel', 0, 3000);
      s.penalty = v('c-penalty', 0, 1000);
      s.music = $('#c-music').checked; s.sfx = $('#c-sfx').checked; s.speedBonus = $('#c-speed').checked; s.events = $('#c-events').checked; s.projector = $('#c-projector').checked;
      var pin = $('#c-pin').value.trim(); if (pin.length >= 3) s.pin = pin; else UI.toast('El PIN debe tener al menos 3 caracteres; se conservó el anterior.', 'warn');
      NV.Store.save(); NV.App.applySettings(); NV.Audio.play('power'); UI.toast('Configuración guardada ✓', 'ok'); admin();
    };
    $('#c-reset').onclick = function () { UI.confirm('Restaurar configuración', 'Se restaurarán tiempos, puntos y sonido a sus valores originales (el PIN se conserva).', 'Restaurar').then(function (ok) { if (ok) { NV.Store.resetSettings(); NV.App.applySettings(); admin(); } }); };
  }

  function download(name, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function admResults(body, st) {
    var h = st.history;
    body.innerHTML = '<div class="adm-card glass"><h3>HISTORIAL DE PARTIDAS (' + h.length + ')</h3>' +
      '<div class="btn-row"><button class="btn btn-sm" id="r-csv">⬇ Exportar CSV (Excel)</button><button class="btn btn-sm" id="r-json">⬇ Respaldo completo (JSON)</button><label class="btn btn-sm">⬆ Importar respaldo<input type="file" id="r-import" accept=".json,application/json" hidden></label><button class="btn btn-sm btn-danger" id="r-clear">🗑 Borrar historial</button></div>' +
      (h.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Modo</th><th>Ganador</th><th>Puntos</th><th>Participantes</th><th></th></tr></thead><tbody>' +
        h.map(function (x, i) { return { x: x, i: i }; }).reverse().map(function (o) {
          var x = o.x; return '<tr><td>' + new Date(x.date).toLocaleString('es-MX') + '</td><td>' + esc(modeName(x.mode)) + '</td><td>' + esc(x.ranking[0] ? x.ranking[0].name : '-') + '</td><td>' + fmt(x.ranking[0] ? x.ranking[0].score : 0) + '</td><td>' + x.ranking.length + '</td><td><button class="btn btn-sm btn-ghost" data-hview="' + o.i + '">Ver</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="muted">Aún no hay partidas guardadas.</p>') + '</div>';
    $$('[data-hview]', body).forEach(function (b) { b.onclick = function () {
      var x = h[+b.getAttribute('data-hview')];
      UI.modal({ title: modeName(x.mode) + ' · ' + new Date(x.date).toLocaleString('es-MX'), html: '<div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Nombre</th><th>Integrantes</th><th>Puntos</th><th>Aciertos</th><th>Errores</th></tr></thead><tbody>' +
        x.ranking.map(function (t, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(t.name) + '</td><td>' + esc((t.members || []).join(', ')) + '</td><td>' + fmt(t.score) + '</td><td>' + t.correct + '</td><td>' + t.wrong + '</td></tr>'; }).join('') + '</tbody></table></div><p class="muted">Mundos: ' + x.worlds.map(function (w) { return NV.worldById(w).name; }).join(', ') + '</p>' });
    }; });
    $('#r-csv').onclick = function () {
      var lines = [['Fecha', 'Modo', 'Título', 'Lugar', 'Nombre', 'Integrantes', 'Puntos', 'Aciertos', 'Errores', 'Mejor racha'].join(',')];
      h.forEach(function (x) { x.ranking.forEach(function (t, i) {
        lines.push([new Date(x.date).toLocaleString('es-MX'), modeName(x.mode), x.title || '', i + 1, t.name, (t.members || []).join(' / '), t.score, t.correct, t.wrong, t.bestStreak].map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','));
      }); });
      download('neuroverse-resultados.csv', '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
    };
    $('#r-json').onclick = function () { download('neuroverse-respaldo.json', NV.Store.exportJSON(), 'application/json'); };
    $('#r-import').onchange = function (e) {
      var f = e.target.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { try { NV.Store.importJSON(rd.result); NV.App.applySettings(); UI.toast('Respaldo importado ✓', 'ok'); admin(); } catch (err) { UI.toast('No se pudo importar: archivo no válido', 'warn'); } };
      rd.readAsText(f);
    };
    $('#r-clear').onclick = function () { UI.confirm('Borrar historial', 'Se eliminarán TODOS los resultados guardados y el ranking. Esta acción no se puede deshacer.', 'Borrar', true).then(function (ok) { if (ok) { st.history = []; NV.Store.save(); admin(); } }); };
  }

  function admSystem(body, st) {
    body.innerHTML = '<div class="adm-grid">' +
      '<div class="adm-card glass"><h3>CAMPAÑA</h3><p class="muted">Jugador: <b>' + esc(st.profile.name || '—') + '</b> · ' + fmt(st.profile.xp) + ' XP · ' + st.profile.unlocked.length + '/9 mundos</p><div class="btn-row"><button class="btn" id="s-unlock">🔓 Desbloquear todos los mundos y misiones (demostración)</button><button class="btn btn-danger" id="s-reset-prof">Reiniciar progreso de campaña</button></div></div>' +
      '<div class="adm-card glass"><h3>GUARDADO DE DATOS</h3>' +
        '<p>Guardado automático en esta computadora: <b>' + (NV.Store.available() ? '✓ activo' : '⚠ bloqueado por el navegador') + '</b></p>' +
        '<p>Protección contra borrado automático: <b>' + (NV.PWA.persisted() ? '✓ activada' : 'no confirmada por el navegador') + '</b></p>' +
        '<p>Modo aplicación: <b>' + (NV.PWA.isStandalone() ? '✓ app instalada' : NV.PWA.isHttp ? 'en el navegador (se puede instalar)' : 'archivo abierto con doble clic') + '</b></p>' +
        '<p>Respaldo automático en archivo: <b>' + (NV.PWA.backupName() ? '✓ ' + esc(NV.PWA.backupName()) : 'desactivado') + '</b>' + (st.lastBackup ? ' <small class="muted">(último: ' + new Date(st.lastBackup).toLocaleString('es-MX') + ')</small>' : '') + '</p>' +
        '<p class="muted">Con el respaldo automático, al terminar cada partida se actualiza un archivo .json que tú eliges (por ejemplo, en una USB o en Documentos). Si se borra el navegador, recupera todo con <b>Resultados → Importar respaldo</b>.</p>' +
        '<div class="btn-row"><button class="btn btn-primary" id="s-backup-pick">💾 ' + (NV.PWA.backupName() ? 'Cambiar archivo de respaldo' : 'Activar respaldo automático') + '</button>' +
        (NV.PWA.backupName() ? '<button class="btn" id="s-backup-now">Guardar respaldo ahora</button><button class="btn btn-ghost" id="s-backup-off">Desactivar</button>' : '') +
        '<button class="btn" data-action="install">⬇ Instalar como app</button><button class="btn btn-danger" id="s-reset-all">Borrar TODOS los datos</button></div></div>' +
      '<div class="adm-card glass"><h3>NEUROVERSE ARCADE</h3><p class="muted">Monedas virtuales: <b>' + fmt(st.arcade.coins) + '</b> · Partidas: <b>' + st.arcade.stats.plays + '</b> · Logros: <b>' + st.arcade.achievements.length + '</b></p><p class="muted">Cada minijuego da como máximo ' + NV.Arcade.CAP + ' XP por día al perfil (los récords siempre se guardan).</p><div class="btn-row"><button class="btn" id="s-arc-unlock">🔓 Desbloquear los 15 minijuegos (demostración)</button><button class="btn btn-danger" id="s-arc-reset">Reiniciar récords del Arcade</button></div></div>' +
      '<div class="adm-card glass"><h3>MULTIJUGADOR ONLINE</h3><p class="muted">Estado: <b>Modo local</b> (sin conexión a servidor). La arquitectura está preparada en <code>js/network.js</code> para conectar un servidor en tiempo real en el futuro; actualmente no existe conexión online.</p></div>' +
      '<div class="adm-card glass"><h3>BANCO DE CONTENIDO</h3><p class="muted">' + NV.QUESTIONS.length + ' preguntas · ' + NV.RAPID.length + ' afirmaciones de ráfaga · ' + NV.DILEMMAS.length + ' dilemas · cálculo generado automáticamente.</p></div>' +
      '</div>';
    $('#s-unlock').onclick = function () {
      st.profile.unlocked = NV.WORLDS.map(function (w) { return w.id; });
      NV.WORLDS.forEach(function (w) { var m = st.profile.missions[w.id] = st.profile.missions[w.id] || {}; [1, 2, 3].forEach(function (k) { if (!m[k]) m[k] = { best: 0, perfect: false, unlockedByHost: true }; }); });
      NV.Store.save(); UI.toast('Todos los mundos, misiones y jefes desbloqueados', 'ok'); admin();
    };
    $('#s-arc-unlock').onclick = function () { NV.Arcade.unlockAll(); UI.toast('🔓 Los 15 minijuegos están desbloqueados', 'ok'); admin(); };
    $('#s-arc-reset').onclick = function () { UI.confirm('Reiniciar Arcade', 'Se borrarán récords, clasificación, monedas, logros y desbloqueos del Arcade. La campaña y el historial no se tocan.', 'Reiniciar', true).then(function (ok) { if (ok) { st.arcade = NV.Store.defaults().arcade; NV.Store.save(); admin(); } }); };
    $('#s-backup-pick').onclick = function () { NV.PWA.chooseBackupFile().then(function (ok) { if (ok) UI.toast('💾 Respaldo automático activado', 'ok'); admin(); }); };
    if ($('#s-backup-now')) $('#s-backup-now').onclick = function () { NV.PWA.writeBackup(true).then(function (ok) { UI.toast(ok ? '💾 Respaldo guardado' : 'No se pudo guardar el respaldo', ok ? 'ok' : 'warn'); admin(); }); };
    if ($('#s-backup-off')) $('#s-backup-off').onclick = function () { NV.PWA.forgetBackupFile().then(function () { UI.toast('Respaldo automático desactivado'); admin(); }); };
    $('#s-reset-prof').onclick = function () { UI.confirm('Reiniciar campaña', 'Se borrará el progreso, XP, nivel y logros del jugador.', 'Reiniciar', true).then(function (ok) { if (ok) { NV.Store.resetProfile(); admin(); } }); };
    $('#s-reset-all').onclick = function () { UI.confirm('Borrar todo', 'Se borrarán equipos, historial, campaña, configuración y la partida en curso. No se puede deshacer.', 'Borrar todo', true).then(function (ok) { if (ok) { NV.Store.resetAll(); NV.App.applySettings(); adminUnlocked = false; NV.App.go('menu'); } }); };
  }

  /* ================= MANUAL ================= */
  function manual() {
    var p = S().settings.points;
    var secs = [
      ['obj', 'Objetivo', '<p><b>NEUROVERSE: THE LAST CHALLENGE</b> es un videojuego educativo en el que los jugadores viajan por 9 mundos del conocimiento. Cada mundo representa una asignatura del primer semestre del COBAO. El objetivo es <b>acumular la mayor cantidad de puntos</b> respondiendo correctamente, superando retos especiales, ganando duelos y derrotando a los jefes finales, mientras se practica la convivencia sana.</p>'],
      ['players', 'Jugadores y materiales', '<ul><li><b>Campaña:</b> 1 jugador.</li><li><b>Battle Arena:</b> de 2 a 8 equipos de <b>3 a 5 integrantes</b>.</li><li><b>Boss Raid:</b> todos los equipos juntos (mínimo 1).</li><li><b>Partida rápida:</b> 2 o más equipos (5–10 minutos).</li></ul><p><b>Materiales:</b> una computadora con Google Chrome, proyector o pantalla grande, bocinas (opcional) y un anfitrión que maneje el mouse o el teclado. No se necesita internet.</p>'],
      ['rules', 'Reglas generales', '<ol><li>En cada turno aparece una pregunta con 4 opciones. Solo una es correcta.</li><li>El equipo en turno discute y su representante dice la respuesta; el anfitrión la selecciona (clic o teclas 1-4 / A-D).</li><li>El cronómetro marca el tiempo disponible (configurable). Si se acaba, cuenta como error.</li><li>Después de responder se muestra la <b>explicación educativa</b>. Léanla en voz alta.</li><li>Solo el equipo en turno puede responder, excepto en los duelos.</li><li>Las decisiones del anfitrión son finales.</li></ol>'],
      ['worlds', 'Los 9 mundos', '<div class="manual-worlds">' + NV.WORLDS.map(function (w) { return '<div class="mw" style="--wc:' + w.color + '"><b>' + w.icon + ' ' + w.name + '</b><small>' + esc(w.subject) + '</small><span>' + esc(w.desc) + '</span></div>'; }).join('') + '</div><p>En la Campaña cada mundo tiene 3 misiones (fácil, media y difícil) y un jefe. Derrotar al jefe desbloquea el siguiente mundo. Los retos de <b>Career Simulator</b> son de formación laboral general y no suponen ninguna capacitación específica.</p>'],
      ['points', 'Sistema de puntos', '<table class="table"><tbody><tr><td>Pregunta fácil</td><td><b>' + p.facil + '</b></td></tr><tr><td>Pregunta media</td><td><b>' + p.media + '</b></td></tr><tr><td>Pregunta difícil</td><td><b>' + p.dificil + '</b></td></tr><tr><td>Reto especial</td><td><b>hasta ' + p.special + '</b></td></tr><tr><td>Duelo</td><td><b>' + p.duel + '</b></td></tr><tr><td>Jefe final</td><td><b>hasta ' + p.boss + '</b> (según la precisión)</td></tr></tbody></table>' +
        '<p><b>Rachas:</b> 3 aciertos seguidos = ×1.2 · 5 = ×1.5 · 8 o más = ×2.</p><p><b>Rapidez:</b> como máximo +20% del valor base; aprender es más importante que correr.</p><p><b>Errores:</b> en Campaña se pierde una vida; en Arena se pierden ' + S().settings.penalty + ' puntos; en Boss Raid el jefe ataca y el grupo pierde una vida compartida. Siempre se reinicia la racha.</p><p><b>XP y niveles (Campaña):</b> cada punto aporta XP (1 XP por cada 10 puntos + 5 por respuesta). Al subir de nivel cambia tu rango.</p>'],
      ['powers', 'Poderes (power-ups)', '<p>Cada jugador o equipo inicia la partida con <b>1 de cada poder</b> y puede tener un máximo de ' + E.POWER_MAX + ' de cada uno (se consiguen más en eventos aleatorios y con rachas de 5). Solo se usan <b>antes de responder</b>, uno por tipo en cada pregunta.</p><ul>' + Object.keys(E.POWERUPS).map(function (k) { var x = E.POWERUPS[k]; return '<li><b>' + x.icon + ' ' + x.name + ':</b> ' + esc(x.desc) + '</li>'; }).join('') + '</ul>'],
      ['special', 'Retos especiales', '<ul><li><b>⚡ Ráfaga:</b> 5 afirmaciones de verdadero o falso en 30 segundos. 100 puntos por cada acierto.</li><li><b>🧮 Cálculo neuronal:</b> 3 problemas numéricos para escribir el resultado en 60 segundos.</li><li><b>💜 Dilema del corazón:</b> una situación de convivencia sin respuesta única. El equipo elige una opción, la discute 45 segundos y la argumenta en voz alta. El anfitrión evalúa con una rúbrica: participación, argumentos, empatía y solución respetuosa. Se premia la reflexión, no adivinar.</li></ul>'],
      ['modes', 'Cómo jugar cada modo', '<h4>🛰 Campaña</h4><p>Registra tu nombre → elige un mundo en el mapa → juega sus misiones en orden → derrota al jefe. Tienes ' + S().settings.lives + ' vidas por misión. Gana XP, sube de nivel, desbloquea logros y descubre las misiones secretas.</p>' +
        '<h4>⚔ Battle Arena</h4><p>Registra los equipos (3–5 integrantes) → elige mundos y rondas → los equipos responden por turnos. Tras la primera ronda cada equipo enfrenta un <b>reto especial</b>. En rondas intermedias hay <b>DUELOS</b>: los dos equipos con puntuación más cercana reciben la misma pregunta; el primero en levantar la mano gana el turno (el anfitrión presiona su botón o Q / P). Si falla, el rival puede robar la respuesta.</p>' +
        '<h4>👾 Boss Raid</h4><p>Todos los equipos son aliados contra OMEGA. Se turnan para responder: cada acierto le hace daño (100/200/300 según dificultad × racha compartida). Cada error hace que OMEGA ataque y se pierda una vida compartida. Al 50% de vida entra en FURIA (menos tiempo) y al 25% en FASE FINAL. Si llega a 0 antes de que se acaben las vidas o los turnos, ¡ganan todos! Cada equipo recibe hasta ' + p.boss + ' puntos según su precisión.</p>' +
        '<h4>⏱ Partida rápida</h4><p>Ideal para la exposición: preguntas por equipo, una ráfaga, un dilema, un duelo y un jefe final, en 5 a 10 minutos.</p>'],
      ['arcade', 'NEUROVERSE Arcade', '<p><b>NEUROVERSE ARCADE: THE ULTIMATE MINI-GAME COLLECTION</b> es la expansión con <b>15 minijuegos</b> interactivos, accesible desde el botón <b>NEUROVERSE ARCADE</b> del menú.</p><ul>' + NV.Arcade.games().map(function (g) { return '<li><b>' + g.icon + ' ' + g.num + ' ' + esc(g.name) + '</b> (' + esc(g.category) + '): ' + esc(g.desc) + '</li>'; }).join('') + '</ul>' +
        '<h4>Modos</h4><p><b>Individual</b> (suma XP y monedas a tu perfil), <b>Duelo</b> de 2 jugadores y <b>Equipos por turnos</b> con los equipos registrados, en la misma computadora. Gana quien haga más puntos; las partidas por turnos se guardan en el Ranking general.</p>' +
        '<h4>Recompensas justas</h4><p>La XP del Arcade se suma al mismo nivel de la Campaña. Cada minijuego da como máximo ' + NV.Arcade.CAP + ' XP y 80 monedas por día; las partidas de menos de 15 segundos no dan recompensa. Los récords y la clasificación siempre se guardan. Las <b>monedas son 100% virtuales</b> y sirven para desbloquear minijuegos (' + NV.Arcade.COST + ' monedas cada uno).</p>'],
      ['win', 'Condiciones para ganar', '<ul><li><b>Campaña:</b> terminar la misión con al menos una vida. Para ganar la campaña completa, derrota a los 9 jefes.</li><li><b>Battle Arena y Partida rápida:</b> gana el equipo con más puntos al terminar; en empate, el que tenga más aciertos.</li><li><b>Boss Raid:</b> todos ganan si OMEGA llega a 0 de vida.</li></ul>'],
      ['coexist', 'Reglas de convivencia', '<ul><li>Respeta los turnos: solo habla el equipo en turno.</li><li>No se permiten burlas por errores. Equivocarse es parte de aprender.</li><li>Escucha a todos los integrantes antes de decidir.</li><li>Celebra con respeto; felicita a los otros equipos.</li><li>Las decisiones del anfitrión se aceptan sin discusiones agresivas.</li><li>En los dilemas no hay respuestas "tontas": se valoran las razones y la empatía.</li></ul>'],
      ['keys', 'Controles y anfitrión', '<table class="table"><tbody><tr><td>1-4 o A-D</td><td>Elegir respuesta</td></tr><tr><td>Enter / Espacio</td><td>Continuar</td></tr><tr><td>P</td><td>Pausar / reanudar</td></tr><tr><td>Q / P (duelo)</td><td>Equipo izquierdo / derecho presionó primero</td></tr><tr><td>F</td><td>Pantalla completa</td></tr><tr><td>M / S</td><td>Música / efectos</td></tr></tbody></table><p>El <b>Panel del Anfitrión</b> (⚙, PIN inicial <b>0102</b>) permite crear equipos, editar nombres e integrantes, pausar, terminar o reiniciar partidas, cambiar tiempos y puntuaciones, activar sonidos, ver y exportar resultados. Salir al menú nunca borra la partida: puedes reanudarla con <b>CONTINUAR PARTIDA</b>.</p>']
    ];
    $('#s-manual').innerHTML = header('REGLAMENTO INTEGRADO', 'MANUAL DE INSTRUCCIONES', 'menu') +
      '<div class="manual-layout"><nav class="manual-nav glass">' + secs.map(function (s) { return '<a href="#m-' + s[0] + '" data-mnav="' + s[0] + '">' + s[1] + '</a>'; }).join('') + '</nav>' +
      '<div class="manual-body">' + secs.map(function (s) { return '<article class="manual-sec glass" id="m-' + s[0] + '"><h3>' + s[1] + '</h3>' + s[2] + '</article>'; }).join('') + '</div></div>';
    $$('[data-mnav]', $('#s-manual')).forEach(function (a) { a.onclick = function (e) { e.preventDefault(); var t = document.getElementById('m-' + a.getAttribute('data-mnav')); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
  }

  return {
    menu: menu, mode: mode, register: register, map: map, missions: missions, results: results,
    ranking: ranking, admin: admin, manual: manual, achievements: achievements, modeName: modeName,
    createDemoTeams: createDemoTeams, selectedTeams: function () { return selectedTeams; },
    unlockAdmin: function () { adminUnlocked = true; }, tip: tip
  };
})();
