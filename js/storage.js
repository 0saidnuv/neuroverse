/* ============================================================
   NEUROVERSE — Almacenamiento local (LocalStorage)
   Todo el progreso, equipos, configuración, historial y la
   partida en curso se guardan en el navegador de esta computadora.
   ============================================================ */
window.NV = window.NV || {};

NV.Store = (function () {
  var KEY = 'neuroverse_tlc_v1';
  var memoryFallback = null; // si LocalStorage está bloqueado, se usa memoria

  function defaults() {
    return {
      version: 1,
      settings: {
        timer: 30,            // segundos por pregunta (0 = sin límite)
        questions: 6,         // preguntas por misión de campaña
        arenaRounds: 3,       // rondas por equipo en Battle Arena
        lives: 3,             // vidas en campaña
        raidLives: 5,         // vidas compartidas en Boss Raid
        music: true,
        sfx: true,
        speedBonus: true,     // bono por rapidez (máximo +20%)
        events: true,         // eventos aleatorios
        penalty: 50,          // penalización por error en Battle Arena
        projector: false,     // texto grande para proyector
        pin: '0102',          // PIN del panel de anfitrión
        points: { facil: 100, media: 200, dificil: 300, special: 500, boss: 1000, duel: 300 }
      },
      profile: {
        name: '',
        xp: 0,
        unlocked: ['math'],
        missions: {},         // { worldId: { 1: {best, perfect}, 2: ..., 3: ... } }
        bosses: {},           // { worldId: bestReward }
        achievements: [],     // ids
        stats: { correct: 0, wrong: 0, bestStreak: 0, powerupsUsed: 0, reflections: 0, steals: 0, worldsCorrect: {} }
      },
      teams: [],              // { id, name, color, members: [] }
      history: [],            // partidas terminadas
      lastBackup: null,       // fecha del último respaldo automático en archivo
      arcade: {               // Expansión NEUROVERSE ARCADE (se agrega sin tocar lo anterior)
        coins: 0,             // monedas 100% virtuales (no representan dinero real)
        unlocked: [],         // ids de minijuegos desbloqueados con monedas
        records: {},          // { gameId: { best, plays, maxLevel, wins, lastScore } }
        leaderboard: {},      // { gameId: [ { name, score, date, mode } ] }  (top 10)
        daily: { date: '', xp: {}, coins: {} },  // límites diarios de recompensa
        achievements: [],
        stats: { plays: 0, xp: 0, coinsEarned: 0 }
      },
      session: null           // partida en curso (se puede reanudar)
    };
  }

  function merge(base, data) {
    // Combina datos guardados con valores por defecto (por si hay campos nuevos)
    // Conserva TODAS las claves guardadas (también las de mapas como missions o records)
    if (!data || typeof data !== 'object') return base;
    Object.keys(data).forEach(function (k) {
      if (data[k] === undefined) return;
      if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && data[k] && typeof data[k] === 'object' && !Array.isArray(data[k])) {
        base[k] = merge(base[k], data[k]);
      } else {
        base[k] = data[k];
      }
    });
    return base;
  }

  var state = null;

  function load() {
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { raw = memoryFallback; }
    var parsed = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch (e) { parsed = null; }
    state = merge(defaults(), parsed);
    if (!state.profile.unlocked || !state.profile.unlocked.length) state.profile.unlocked = ['math'];
    return state;
  }

  function save() {
    var raw = JSON.stringify(state);
    try { window.localStorage.setItem(KEY, raw); } catch (e) { memoryFallback = raw; }
  }

  function storageAvailable() {
    try { var t = '__nv_test'; localStorage.setItem(t, t); localStorage.removeItem(t); return true; } catch (e) { return false; }
  }

  return {
    load: load,
    save: save,
    get: function () { return state || load(); },
    defaults: defaults,
    available: storageAvailable,
    resetProfile: function () { state.profile = defaults().profile; save(); },
    resetSettings: function () { var pin = state.settings.pin; state.settings = defaults().settings; state.settings.pin = pin; save(); },
    resetAll: function () { state = defaults(); save(); },
    exportJSON: function () { return JSON.stringify(state, null, 2); },
    importJSON: function (txt) {
      var data = JSON.parse(txt);
      if (!data || typeof data !== 'object' || !data.settings) throw new Error('Archivo no válido');
      state = merge(defaults(), data); save();
    }
  };
})();
