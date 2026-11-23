/* ============================================================
   NEUROVERSE — Arranque, navegación y acciones globales
   ============================================================ */
window.NV = window.NV || {};

NV.App = (function () {
  var UI = NV.UI, E = NV.Engine, $ = UI.$, $$ = UI.$$;
  var lastMode = null;

  function S() { return NV.Store.get(); }

  function go(screen, arg) {
    // Salir de una partida nunca la borra: se suspende y queda guardada
    if (NV.Match.active() && !/question|special|boss/.test(screen)) NV.Match.suspend();
    // Al salir de un minijuego del Arcade se detienen sus animaciones y controles
    if (NV.Arcade && screen !== 'arcade-game') NV.Arcade.leave();
    if (NV.Screens[screen]) NV.Screens[screen](arg);
    UI.show(screen);
    if (screen === 'menu') NV.Audio.setIntense(false);
  }

  function applySettings() {
    var s = S().settings;
    NV.Audio.setMusic(s.music); NV.Audio.setSfx(s.sfx);
    document.body.classList.toggle('projector', !!s.projector);
    var bm = $('#btn-music'), bs = $('#btn-sfx'), bp = $('#btn-projector');
    if (bm) { bm.classList.toggle('off', !s.music); bm.title = 'Música: ' + (s.music ? 'activada' : 'desactivada') + ' (M)'; }
    if (bs) { bs.classList.toggle('off', !s.sfx); bs.textContent = s.sfx ? '🔊' : '🔇'; }
    if (bp) bp.classList.toggle('on', !!s.projector);
  }

  /* ---------- Logros y XP ---------- */
  function unlock(id) {
    var p = S().profile;
    if (p.achievements.indexOf(id) >= 0) return null;
    var a = E.achievementById(id); if (!a) return null;
    p.achievements.push(id); p.xp += a.xp; NV.Store.save();
    UI.achievementToast(a);
    return a;
  }

  function openAdmin() { go('admin', 'match'); }

  /* ---------- Acciones de botones [data-action] ---------- */
  var actions = {
    start: function () {
      NV.Audio.init(); applySettings();
      $('#s-splash').classList.add('launch');
      setTimeout(function () { go('menu'); }, 500);
    },
    menu: function () { go('menu'); },
    go: function (arg) { go(arg); },
    'toggle-music': function () { var s = S().settings; s.music = !s.music; NV.Store.save(); NV.Audio.init(); applySettings(); UI.toast('Música ' + (s.music ? 'activada' : 'desactivada')); },
    'toggle-sfx': function () { var s = S().settings; s.sfx = !s.sfx; NV.Store.save(); applySettings(); UI.toast('Efectos ' + (s.sfx ? 'activados' : 'desactivados')); },
    'toggle-projector': function () { var s = S().settings; s.projector = !s.projector; NV.Store.save(); applySettings(); UI.toast('Modo proyector ' + (s.projector ? 'activado' : 'desactivado')); },
    fullscreen: function () {
      try {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      } catch (e) { UI.toast('Tu navegador no permite pantalla completa aquí. Usa F11.', 'warn'); }
    },
    manual: function () { go('manual'); },
    admin: function () {
      if (NV.Match.active() && /question|special|boss/.test(UI.currentId())) { NV.Match.pause(); return; }
      go('admin', S().session ? 'match' : null);
    },
    achievements: function () { NV.Screens.achievements(); },
    resume: function () { NV.Match.resume(); },
    quick: function () { lastMode = 'quick'; go('register', 'quick'); },
    'pick-mode': function (m) {
      lastMode = m;
      if (S().session && m !== 'campaign') {
        UI.confirm('Hay una partida en curso', 'Si comienzas una nueva partida, la actual se descartará al iniciar. ¿Continuar?', 'Continuar').then(function (ok) { if (ok) go('register', m); });
        return;
      }
      if (m === 'campaign') { if (S().profile.name) go('map'); else go('register', 'campaign'); }
      else go('register', m);
    },
    world: function (wid) {
      var p = S().profile;
      if (p.unlocked.indexOf(wid) < 0) { NV.Audio.play('wrong'); UI.toast('🔒 Este mundo está bloqueado. Derrota al jefe del mundo anterior.', 'warn'); return; }
      go('missions', wid);
    },
    mission: function (arg) {
      var parts = arg.split(':'), wid = parts[0], n = +parts[1];
      startCampaign({ mode: 'campaign', worlds: [wid], mission: n, title: 'MISIÓN ' + n });
    },
    boss: function (wid) {
      startCampaign({ mode: 'boss', worlds: [wid], title: 'JEFE: ' + NV.worldById(wid).boss.name });
    },
    replay: function () { NV.Match.replay(); },
    install: function () { NV.PWA.install(); }
  };

  function startCampaign(cfg) {
    var go2 = function () { NV.Match.start(cfg); };
    if (S().session) {
      UI.confirm('Hay una partida en curso', 'Iniciar esta misión descartará la partida guardada. ¿Continuar?', 'Continuar').then(function (ok) { if (ok) go2(); });
    } else go2();
  }

  function onClick(e) {
    var b = e.target.closest('[data-action]');
    if (!b || b.disabled || b.getAttribute('aria-disabled') === 'true') {
      if (b && b.getAttribute('aria-disabled') === 'true') { NV.Audio.play('wrong'); UI.toast('🔒 Aún está bloqueado.', 'warn'); }
      return;
    }
    e.preventDefault();
    var a = b.getAttribute('data-action'), arg = b.getAttribute('data-arg');
    if (a !== 'start') NV.Audio.play('click');
    if (actions[a]) actions[a](arg);
  }

  function onKey(e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || tag === 'select';
    if (UI.isModalOpen()) { if (e.key === 'Escape') { var g = $('#ov-modal .btn-ghost'); if (g) g.click(); } return; }
    var scr = UI.currentId();
    if (scr === 'splash' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); actions.start(); return; }
    if (typing) return;
    if (scr === 'arcade-game') return; // cada minijuego maneja su propio teclado
    if (/question|special|boss/.test(scr) && NV.Match.active()) {
      if (NV.Match.key(e.key)) { e.preventDefault(); return; }   // primero las teclas del juego (en duelos, P = equipo derecho)
      if (e.key === 'p' || e.key === 'P') { e.preventDefault(); NV.Match.pause(); return; }
    }
    if (e.key === 'f' || e.key === 'F') { if (!/special/.test(scr)) actions.fullscreen(); }
    else if (e.key === 'm' || e.key === 'M') actions['toggle-music']();
    else if ((e.key === 's' || e.key === 'S') && !/question|boss|special/.test(scr)) actions['toggle-sfx']();
    else if (e.key === 'Escape' && !/question|special|boss|splash/.test(scr)) go('menu');
  }

  function boot() {
    NV.Store.load();
    NV.PWA.init();
    NV.PWA.loadHandle();
    // Logotipos
    $$('[data-logo]').forEach(function (el) { el.innerHTML = UI.logoSVG(el.getAttribute('data-logo')); });
    UI.startBackground();
    applySettings();
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    // Guardado de seguridad al cerrar o recargar
    window.addEventListener('beforeunload', function () { NV.Store.save(); });
    UI.show('splash');
    if (!NV.Store.available()) setTimeout(function () { UI.toast('⚠ Este navegador bloquea el guardado local. El juego funciona, pero los datos se perderán al cerrar.', 'warn', 6000); }, 1500);
    // Si hay una partida guardada se queda en pausa hasta que el anfitrión la reanude
    if (NV.Store.get().session) NV.Store.get().session.paused = false;
  }

  document.addEventListener('DOMContentLoaded', boot);

  return { go: go, applySettings: applySettings, unlock: unlock, openAdmin: openAdmin, actions: actions };
})();
