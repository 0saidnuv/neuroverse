/* ============================================================
   NEUROVERSE — Motor de reglas (lógica pura, sin interfaz)
   Puntuación, rachas, multiplicadores, niveles, selección de
   preguntas, construcción de partidas, poderes, eventos y logros.
   ============================================================ */
window.NV = window.NV || {};

NV.Engine = (function () {
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function uid() { return Math.random().toString(36).slice(2, 9); }

  /* ---------- Selección de preguntas sin repetir ---------- */
  // prefer: lista de dificultades en orden de preferencia
  function pickQuestions(worldIds, count, prefer, exclude) {
    exclude = exclude || {};
    prefer = prefer || ['facil', 'media', 'dificil'];
    var pool = NV.QUESTIONS.filter(function (q) { return worldIds.indexOf(q.world) >= 0 && !exclude[q.id]; });
    if (pool.length < count) pool = NV.QUESTIONS.filter(function (q) { return worldIds.indexOf(q.world) >= 0; });
    var ordered = [];
    prefer.forEach(function (d) { ordered = ordered.concat(shuffle(pool.filter(function (q) { return q.difficulty === d; }))); });
    ordered = ordered.concat(shuffle(pool.filter(function (q) { return prefer.indexOf(q.difficulty) < 0; })));
    // Con varios mundos, alterna mundos para dar variedad
    if (worldIds.length > 1) {
      var byWorld = {};
      ordered.forEach(function (q) { (byWorld[q.world] = byWorld[q.world] || []).push(q); });
      var keys = shuffle(Object.keys(byWorld)), mixed = [];
      while (mixed.length < ordered.length) {
        keys.forEach(function (k) { if (byWorld[k].length) mixed.push(byWorld[k].shift()); });
      }
      ordered = mixed;
    }
    return ordered.slice(0, count).map(function (q) { return q.id; });
  }

  // Prepara una pregunta para mostrarla: baraja opciones y ubica la correcta
  function prepare(q) {
    var idx = shuffle([0, 1, 2, 3]);
    return { id: q.id, q: q, options: idx.map(function (i) { return q.options[i]; }), correctIndex: idx.indexOf(q.correct) };
  }

  /* ---------- Puntuación ---------- */
  function streakMult(streak) {
    if (streak >= 8) return 2;
    if (streak >= 5) return 1.5;
    if (streak >= 3) return 1.2;
    return 1;
  }
  // La rapidez da como máximo +20% del valor base: aprender importa más que correr.
  function score(o) {
    var base = o.base;
    var sm = streakMult(o.streak);
    var dbl = o.double ? 2 : 1;
    var ev = o.eventMult || 1;
    var half = o.half ? 0.5 : 1; // segunda oportunidad: mitad de puntos
    var speed = 0;
    if (o.speedBonus && o.timeTotal > 0 && o.timeLeft > 0) speed = Math.round(base * 0.2 * clamp(o.timeLeft / o.timeTotal, 0, 1) / 10) * 10;
    var main = Math.round(base * sm * dbl * ev * half / 10) * 10;
    if (o.half) speed = 0;
    return { base: base, streakMult: sm, double: dbl, eventMult: ev, half: o.half, speed: speed, total: main + speed };
  }

  /* ---------- Experiencia y niveles ---------- */
  function levelInfo(xp) {
    var level = 1, need = 200, rest = xp;
    while (rest >= need) { rest -= need; level++; need = 200 + (level - 1) * 100; }
    return { level: level, into: rest, need: need, pct: Math.round(rest / need * 100) };
  }
  var RANKS = ['Novato Neural', 'Explorador', 'Navegante', 'Analista', 'Estratega', 'Guardián', 'Élite', 'Maestro', 'Leyenda', 'Arquitecto'];
  function rankName(level) { return RANKS[Math.min(RANKS.length - 1, Math.floor((level - 1) / 2))]; }

  /* ---------- Poderes ---------- */
  var POWERUPS = {
    shield: { id: 'shield', name: 'ESCUDO', icon: '🛡️', desc: 'Protege contra UNA penalización: si fallas, no pierdes vida/puntos ni tu racha. Se activa antes de responder y se gasta en esa pregunta.' },
    double: { id: 'double', name: 'DOBLE XP', icon: '⚡', desc: 'Duplica los puntos de tu siguiente respuesta correcta. Se mantiene activo hasta que aciertes.' },
    time: { id: 'time', name: 'TIEMPO EXTRA', icon: '⏱️', desc: 'Añade 15 segundos al cronómetro de la pregunta actual.' },
    second: { id: 'second', name: '2ª OPORTUNIDAD', icon: '🔁', desc: 'Si fallas, elimina la opción equivocada y puedes responder otra vez (vale la mitad de puntos).' },
    steal: { id: 'steal', name: 'ROBO DE PUNTOS', icon: '🦾', desc: 'Pausa la pregunta y lanza un reto de 3 verdadero/falso en 20 s. Si aciertas los 3: en Arena robas 150 pts al líder; en Campaña ganas 250 pts.' }
  };
  var POWER_MAX = 2; // máximo de cada poder en inventario
  function startingPowerups() { return { shield: 1, double: 1, time: 1, second: 1, steal: 1 }; }

  /* ---------- Eventos aleatorios ---------- */
  var EVENTS = [
    { id: 'storm', name: 'TORMENTA CUÁNTICA', icon: '🌩️', desc: '¡La siguiente pregunta vale el DOBLE de puntos!' },
    { id: 'time', name: 'SOBRECARGA TEMPORAL', icon: '⏳', desc: 'La siguiente pregunta tendrá +10 segundos.' },
    { id: 'blackout', name: 'APAGÓN PARCIAL', icon: '🌑', desc: 'Interferencia: la siguiente pregunta tendrá 5 segundos menos.' },
    { id: 'supply', name: 'CÁPSULA DE SUMINISTRO', icon: '📦', desc: 'Quien tiene el turno recibe un poder aleatorio.' },
    { id: 'bonus', name: 'PULSO SOLIDARIO', icon: '💠', desc: 'Todos los participantes reciben +50 puntos por seguir en la batalla.' }
  ];
  function rollEvent(chance) {
    if (Math.random() > (chance == null ? 0.2 : chance)) return null;
    return EVENTS[Math.floor(Math.random() * EVENTS.length)];
  }

  /* ---------- Logros (los "secret" son las MISIONES SECRETAS) ---------- */
  var ACHIEVEMENTS = [
    { id: 'first', name: 'Primer Impulso', icon: '✨', desc: 'Responde correctamente tu primera pregunta.', xp: 20 },
    { id: 'streak5', name: 'En Llamas', icon: '🔥', desc: 'Consigue una racha de 5 respuestas correctas.', xp: 50 },
    { id: 'streak10', name: 'Imparable', icon: '☄️', desc: 'Consigue una racha de 10 respuestas correctas.', xp: 120 },
    { id: 'perfect', name: 'Misión Perfecta', icon: '💎', desc: 'Completa una misión sin errores.', xp: 80 },
    { id: 'boss1', name: 'Cazajefes', icon: '👾', desc: 'Derrota a tu primer jefe final.', xp: 100 },
    { id: 'worlds3', name: 'Viajero Dimensional', icon: '🌌', desc: 'Desbloquea 3 mundos.', xp: 80 },
    { id: 'allbosses', name: 'Leyenda del Neuroverse', icon: '👑', desc: 'Derrota a los 9 jefes de la campaña.', xp: 500 },
    { id: 'power5', name: 'Tecnólogo', icon: '🔋', desc: 'Usa 5 poderes.', xp: 40 },
    { id: 'level5', name: 'Ascendido', icon: '🚀', desc: 'Alcanza el nivel 5.', xp: 100 },
    { id: 'arena', name: 'Gladiador', icon: '⚔️', desc: 'Completa una partida de Battle Arena.', xp: 60 },
    { id: 'raid', name: 'Alianza Total', icon: '🤝', desc: 'Derrota a OMEGA en Boss Raid.', xp: 150 },
    { id: 'reflect3', name: 'Corazón Sabio', icon: '💜', desc: 'Completa 3 dilemas socioemocionales.', xp: 80 },
    // Misiones secretas
    { id: 'phoenix', name: 'Fénix', icon: '🐦‍🔥', desc: 'Gana una misión con solo 1 vida restante.', xp: 120, secret: true, hint: 'Sobrevive al límite…' },
    { id: 'purist', name: 'Purista', icon: '🧘', desc: 'Completa una misión de 5 o más preguntas sin usar poderes.', xp: 100, secret: true, hint: 'A veces menos es más.' },
    { id: 'thief', name: 'Ladrón de Datos', icon: '🕶️', desc: 'Completa con éxito un Robo de Puntos.', xp: 90, secret: true, hint: 'Lo ajeno brilla…' },
    { id: 'polymath', name: 'Polímata', icon: '🧬', desc: 'Acierta al menos una pregunta en cada uno de los 9 mundos.', xp: 200, secret: true, hint: 'Saber un poco de todo.' },
    { id: 'comeback', name: 'Remontada Épica', icon: '📈', desc: 'En Battle Arena, gana tras ir en último lugar a la mitad de la partida.', xp: 150, secret: true, hint: 'Nunca te rindas.' }
  ];
  function achievementById(id) { return ACHIEVEMENTS.find(function (a) { return a.id === id; }); }

  /* ---------- Rúbrica de reflexión ---------- */
  function reflectPoints(checks, max) {
    // 100 por completar el dilema + 100 por cada criterio cumplido (máximo 500)
    var n = 0; Object.keys(checks || {}).forEach(function (k) { if (checks[k]) n++; });
    max = max || 500;
    return Math.min(max, Math.round((100 + n * 100) * max / 500 / 10) * 10);
  }
  // Evaluación automática orientativa para un solo jugador (campaña)
  function autoRubric(text, healthy) {
    var t = (text || '').toLowerCase();
    return {
      participa: t.trim().length >= 30,
      argumenta: /(porque|ya que|debido a|por eso|para que|considero|creo que|pienso que|ya que)/.test(t),
      empatia: /(sient|emoci|respet|empat|lastim|triste|apoy|cuidar|confianza|otr[oa]s?|compañer|amig)/.test(t),
      solucion: !!healthy || /(propon|hablar|dialog|acuerdo|ayud|pedir|avisar|escuch)/.test(t)
    };
  }

  /* ---------- Construcción de partidas ---------- */
  function newParticipant(src, settings, mode) {
    return {
      id: src.id || uid(), name: src.name, color: src.color || '#8b5cf6', members: (src.members || []).slice(),
      score: 0, correct: 0, wrong: 0, streak: 0, bestStreak: 0, answered: 0,
      lives: mode === 'campaign' || mode === 'boss' ? settings.lives : null,
      powerups: startingPowerups(), active: { shield: false, double: false, second: false },
      powerUsed: 0, damage: 0, bossCorrect: 0, bossAnswered: 0, bonus: 0
    };
  }

  /* config: { mode, worlds, mission, participants, settings, rounds } */
  function buildMatch(cfg) {
    var s = cfg.settings, steps = [], used = {};
    var parts = cfg.participants.map(function (p) { return newParticipant(p, s, cfg.mode); });
    var match = {
      id: uid(), mode: cfg.mode, worlds: cfg.worlds.slice(), mission: cfg.mission || null,
      participants: parts, steps: steps, stepIndex: 0, turn: 0, startedAt: Date.now(),
      sharedLives: null, sharedStreak: 0, boss: null, eventNext: null, log: [], usedQuestions: used,
      title: cfg.title || '', halfwayLast: null, specialsDone: 0, powerupsUsedTotal: 0
    };
    function take(n, prefer) {
      var ids = pickQuestions(match.worlds, n, prefer, used);
      ids.forEach(function (id) { used[id] = true; });
      return ids;
    }
    function specialKind(i) {
      if (match.worlds.length === 1) return NV.worldById(match.worlds[0]).special;
      return ['rapid', 'reflect', 'calc'][i % 3];
    }

    if (cfg.mode === 'campaign') {
      var n = s.questions;
      var prefer = cfg.mission === 1 ? ['facil', 'media', 'dificil'] : cfg.mission === 2 ? ['media', 'facil', 'dificil'] : ['dificil', 'media', 'facil'];
      var qs = take(n, prefer);
      qs.forEach(function (id, i) {
        steps.push({ type: 'q', qid: id, who: 0 });
        if (cfg.mission >= 2 && i === Math.floor(n / 2) - 1) steps.push({ type: 'special', kind: specialKind(0), who: 0 });
      });
    } else if (cfg.mode === 'boss') {
      steps.push({ type: 'boss' });
      match.boss = makeBoss(NV.worldById(match.worlds[0]).boss, NV.worldById(match.worlds[0]), 1200, 10);
      match.sharedLives = null;
    } else if (cfg.mode === 'arena') {
      var R = cfg.rounds || 3, sp = 0;
      for (var r = 0; r < R; r++) {
        var ids = take(parts.length, r === 0 ? ['facil', 'media', 'dificil'] : r === R - 1 ? ['dificil', 'media', 'facil'] : ['media', 'dificil', 'facil']);
        parts.forEach(function (p, i) { steps.push({ type: 'q', qid: ids[i], who: i, round: r + 1 }); });
        if (r === 0 && R >= 2) parts.forEach(function (p, i) { steps.push({ type: 'special', kind: specialKind(sp++), who: i, round: r + 1 }); });
        if (r >= 1 && r < R - 1 && parts.length >= 2) steps.push({ type: 'duel', qid: take(1, ['media', 'dificil'])[0], round: r + 1 });
      }
      if (R === 1 && parts.length >= 2) steps.push({ type: 'duel', qid: take(1, ['media'])[0], round: 1 });
    } else if (cfg.mode === 'raid') {
      var turns = Math.max(8, parts.length * 4);
      match.boss = makeBoss(NV.RAID_BOSS, NV.RAID_BOSS, Math.round(turns * 200 * 0.6 / 100) * 100, turns);
      match.sharedLives = s.raidLives;
      steps.push({ type: 'boss' });
    } else if (cfg.mode === 'quick') {
      var q1 = take(parts.length * 2, ['facil', 'media', 'dificil']);
      parts.forEach(function (p, i) { steps.push({ type: 'q', qid: q1[i], who: i, round: 1 }); });
      steps.push({ type: 'special', kind: 'rapid', who: 0, round: 1 });
      if (parts.length > 1) steps.push({ type: 'special', kind: 'reflect', who: 1, round: 1 });
      if (parts.length > 1) steps.push({ type: 'duel', qid: take(1, ['media'])[0], round: 2 });
      parts.forEach(function (p, i) { steps.push({ type: 'q', qid: q1[parts.length + i], who: i, round: 2 }); });
      match.boss = makeBoss(NV.RAID_BOSS, NV.RAID_BOSS, 800, Math.max(6, parts.length * 3));
      match.sharedLives = 4;
      steps.push({ type: 'boss' });
    }
    return match;
  }

  function makeBoss(def, world, hp, maxTurns) {
    return { name: def.name, title: def.title, shape: def.shape, color: world.color || def.color, color2: world.color2 || def.color2,
      hp: hp, maxHp: hp, maxTurns: maxTurns, turnsUsed: 0, phase: 1, defeated: false, failed: false, queue: [] };
  }

  function bossPhase(boss) {
    var r = boss.hp / boss.maxHp;
    return r <= 0.25 ? 3 : r <= 0.5 ? 2 : 1;
  }

  // Recompensa del jefe: hasta el máximo según la precisión del participante
  function bossReward(p, max, won) {
    if (!p.bossAnswered) return won ? Math.round(max * 0.3 / 10) * 10 : 0;
    var acc = p.bossCorrect / p.bossAnswered;
    return Math.round((won ? max * acc : max * acc * 0.2) / 10) * 10;
  }

  function ranking(parts) {
    return parts.slice().sort(function (a, b) { return b.score - a.score || b.correct - a.correct; });
  }

  return {
    shuffle: shuffle, clamp: clamp, uid: uid,
    pickQuestions: pickQuestions, prepare: prepare,
    streakMult: streakMult, score: score,
    levelInfo: levelInfo, rankName: rankName,
    POWERUPS: POWERUPS, POWER_MAX: POWER_MAX, startingPowerups: startingPowerups,
    EVENTS: EVENTS, rollEvent: rollEvent,
    ACHIEVEMENTS: ACHIEVEMENTS, achievementById: achievementById,
    reflectPoints: reflectPoints, autoRubric: autoRubric,
    buildMatch: buildMatch, bossPhase: bossPhase, bossReward: bossReward, ranking: ranking
  };
})();
