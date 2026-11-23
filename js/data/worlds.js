/* ============================================================
   NEUROVERSE: THE LAST CHALLENGE — Definición de mundos y jefes
   ============================================================ */
window.NV = window.NV || {};

NV.WORLDS = [
  {
    id: 'math', num: 1, name: 'MATH DIMENSION', subject: 'Pensamiento Matemático', icon: '🧮',
    color: '#8b5cf6', color2: '#22d3ee',
    desc: 'Operaciones, porcentajes, ecuaciones, lógica, estimaciones y gráficas.',
    special: 'calc',
    boss: { name: 'DIVISOR PRIME', title: 'Guardián de los números rotos', shape: 'cube' }
  },
  {
    id: 'lang', num: 2, name: 'LANGUAGE PORTAL', subject: 'Lengua y Comunicación · Inglés', icon: '📖',
    color: '#3b82f6', color2: '#a78bfa',
    desc: 'Comprensión lectora, vocabulario, gramática, ortografía e inglés.',
    special: 'rapid',
    boss: { name: 'GLITCH VERBAL', title: 'Devorador de palabras', shape: 'eye' }
  },
  {
    id: 'sci', num: 3, name: 'SCIENCE LAB', subject: 'Ciencias Naturales, Experimentales y Tecnología', icon: '🧪',
    color: '#10b981', color2: '#22d3ee',
    desc: 'Biología, física, química, medio ambiente y experimentación.',
    special: 'rapid',
    boss: { name: 'REACTOR TÓXICO', title: 'Núcleo inestable', shape: 'orb' }
  },
  {
    id: 'hist', num: 4, name: 'TIME FRACTURE', subject: 'Conciencia Histórica y Ciencias Sociales', icon: '⏳',
    color: '#f59e0b', color2: '#a855f7',
    desc: 'Historia de México y Oaxaca, sociedad, cultura y pensamiento social.',
    special: 'rapid',
    boss: { name: 'CRONOS FRACTURADO', title: 'Señor de las líneas temporales', shape: 'ring' }
  },
  {
    id: 'hum', num: 5, name: 'MIND CORE', subject: 'Humanidades', icon: '🧠',
    color: '#ec4899', color2: '#8b5cf6',
    desc: 'Ética, filosofía, pensamiento crítico, argumentación y dilemas.',
    special: 'reflect',
    boss: { name: 'SOFISTA OSCURO', title: 'Maestro de las falacias', shape: 'eye' }
  },
  {
    id: 'cyber', num: 6, name: 'CYBER WORLD', subject: 'Cultura Digital', icon: '💻',
    color: '#06b6d4', color2: '#3b82f6',
    desc: 'Hardware, software, seguridad digital y ciudadanía digital.',
    special: 'rapid',
    boss: { name: 'VIRUS ZERO-DAY', title: 'Intruso del sistema', shape: 'cube' }
  },
  {
    id: 'emo', num: 7, name: 'EMOTION ISLAND', subject: 'Formación Socioemocional', icon: '💜',
    color: '#a855f7', color2: '#f472b6',
    desc: 'Empatía, autoestima, autocontrol, conflictos y convivencia.',
    special: 'reflect',
    boss: { name: 'SOMBRA DEL CAOS', title: 'Eco de la desconexión emocional', shape: 'orb' }
  },
  {
    id: 'res', num: 8, name: 'RESEARCH ZONE', subject: 'Laboratorio de Investigación', icon: '🔬',
    color: '#22d3ee', color2: '#10b981',
    desc: 'Hipótesis, variables, observación, análisis y metodología.',
    special: 'calc',
    boss: { name: 'SESGO ABSOLUTO', title: 'Distorsionador de datos', shape: 'ring' }
  },
  {
    id: 'career', num: 9, name: 'CAREER SIMULATOR', subject: 'Formación Laboral (general y opcional)', icon: '💼',
    color: '#6366f1', color2: '#f59e0b',
    desc: 'Situaciones prácticas, organización, administración y trabajo en equipo.',
    special: 'calc',
    boss: { name: 'CAOS CORPORATIVO', title: 'Jefe del desorden', shape: 'cube' }
  }
];

/* Jefe del modo Boss Raid y del final de la partida rápida */
NV.RAID_BOSS = { name: 'OMEGA', title: 'El Último Arquitecto del Neuroverse', shape: 'omega', color: '#a855f7', color2: '#22d3ee' };

NV.worldById = function (id) { return NV.WORLDS.find(function (w) { return w.id === id; }); };
