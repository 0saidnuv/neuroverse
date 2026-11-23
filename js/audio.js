/* ============================================================
   NEUROVERSE — Audio 100% sintetizado con Web Audio API
   No usa archivos externos: la música ambiental y los efectos
   se generan en tiempo real (libres de derechos, sin enlaces rotos).
   ============================================================ */
window.NV = window.NV || {};

NV.Audio = (function () {
  var ctx = null, master = null, musicGain = null, sfxGain = null;
  var musicOn = true, sfxOn = true, musicTimer = null, step = 0, intense = false;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.55; sfxGain.connect(master);
  }

  function tone(freq, dur, opts) {
    if (!ctx) return;
    opts = opts || {};
    var t = ctx.currentTime + (opts.delay || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = opts.type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t + dur);
    var vol = opts.vol == null ? 0.3 : opts.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (opts.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(opts.bus || sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(dur, opts) {
    if (!ctx) return;
    opts = opts || {};
    var t = ctx.currentTime + (opts.delay || 0);
    var len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = opts.filter || 'lowpass'; f.frequency.value = opts.freq || 1200;
    var g = ctx.createGain(); g.gain.value = opts.vol || 0.3;
    src.connect(f); f.connect(g); g.connect(sfxGain); src.start(t);
  }

  var SFX = {
    click: function () { tone(880, 0.06, { type: 'triangle', vol: 0.15 }); },
    hover: function () { tone(1320, 0.03, { type: 'sine', vol: 0.05 }); },
    correct: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.18, { type: 'triangle', vol: 0.25, delay: i * 0.07 }); }); },
    wrong: function () { tone(220, 0.35, { type: 'sawtooth', vol: 0.18, slide: 90 }); tone(160, 0.4, { type: 'square', vol: 0.08, delay: 0.05, slide: 70 }); },
    tick: function () { tone(1200, 0.04, { type: 'square', vol: 0.06 }); },
    count: function () { tone(660, 0.15, { type: 'square', vol: 0.15 }); },
    go: function () { tone(990, 0.35, { type: 'square', vol: 0.18 }); tone(1320, 0.35, { type: 'triangle', vol: 0.12 }); },
    power: function () { tone(400, 0.25, { type: 'sine', vol: 0.2, slide: 1600 }); tone(800, 0.2, { type: 'triangle', vol: 0.1, delay: 0.1, slide: 2400 }); },
    shield: function () { tone(300, 0.4, { type: 'triangle', vol: 0.2, slide: 600 }); noise(0.3, { filter: 'highpass', freq: 3000, vol: 0.08 }); },
    achievement: function () { [784, 988, 1175, 1568].forEach(function (f, i) { tone(f, 0.3, { type: 'sine', vol: 0.2, delay: i * 0.09 }); }); },
    event: function () { tone(200, 0.5, { type: 'sawtooth', vol: 0.12, slide: 800 }); tone(600, 0.3, { type: 'square', vol: 0.08, delay: 0.25 }); },
    hit: function () { noise(0.25, { freq: 900, vol: 0.4 }); tone(120, 0.3, { type: 'sine', vol: 0.4, slide: 40 }); },
    laser: function () { tone(1800, 0.25, { type: 'sawtooth', vol: 0.12, slide: 200 }); },
    roar: function () { tone(90, 0.9, { type: 'sawtooth', vol: 0.25, slide: 45 }); noise(0.8, { freq: 400, vol: 0.25 }); },
    explode: function () { noise(1.4, { freq: 600, vol: 0.6 }); tone(80, 1.2, { type: 'sine', vol: 0.5, slide: 25 }); },
    victory: function () {
      var seq = [523, 659, 784, 1047, 784, 1047, 1319];
      seq.forEach(function (f, i) { tone(f, 0.28, { type: 'triangle', vol: 0.22, delay: i * 0.13 }); tone(f / 2, 0.28, { type: 'sine', vol: 0.12, delay: i * 0.13 }); });
    },
    defeat: function () { [392, 349, 311, 262].forEach(function (f, i) { tone(f, 0.45, { type: 'sawtooth', vol: 0.12, delay: i * 0.25 }); }); },
    whoosh: function () { noise(0.4, { filter: 'bandpass', freq: 1500, vol: 0.2 }); }
  };

  /* ---- Música ambiental generativa (pad + arpegio) ---- */
  var CHORDS = [[220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66], [164.81, 207.65, 246.94]];
  function musicStep() {
    if (!ctx || !musicOn) return;
    var chord = CHORDS[Math.floor(step / 8) % CHORDS.length];
    if (step % 8 === 0) chord.forEach(function (f) { tone(f / 2, 3.4, { type: 'sine', vol: 0.09, attack: 0.8, bus: musicGain }); tone(f, 3.4, { type: 'triangle', vol: 0.025, attack: 1, bus: musicGain }); });
    var arp = chord[step % 3] * (step % 16 < 8 ? 2 : 4);
    if (step % 2 === 0 || intense) tone(arp, 0.25, { type: 'triangle', vol: intense ? 0.05 : 0.035, bus: musicGain });
    if (intense && step % 4 === 0) tone(55, 0.3, { type: 'sine', vol: 0.18, slide: 40, bus: musicGain });
    step++;
  }
  function startMusic() {
    if (!ctx || musicTimer) return;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setTargetAtTime(1, ctx.currentTime, 0.8);
    musicTimer = setInterval(musicStep, 430);
  }
  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (ctx) musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
  }

  return {
    init: function () { init(); if (musicOn) startMusic(); },
    // Tono libre para los minijuegos (Rhythm Core, Memory Glitch…)
    tone: function (freq, dur, opts) { if (!sfxOn || !ctx) return; try { tone(freq, dur, opts); } catch (e) { } },
    play: function (name) { if (!sfxOn || !ctx) return; try { SFX[name] && SFX[name](); } catch (e) { /* sin audio */ } },
    setMusic: function (on) { musicOn = !!on; if (!ctx) return; if (musicOn) startMusic(); else stopMusic(); },
    setSfx: function (on) { sfxOn = !!on; },
    setIntense: function (on) { intense = !!on; },
    isReady: function () { return !!ctx; }
  };
})();
