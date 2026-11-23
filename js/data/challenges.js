/* ============================================================
   NEUROVERSE — Retos especiales (500 puntos)
   1) RÁFAGA: verdadero/falso contra reloj
   2) CÁLCULO NEURONAL: problemas numéricos generados y verificados
   3) DILEMA DEL CORAZÓN: reflexión socioemocional con rúbrica
   ============================================================ */
window.NV = window.NV || {};

/* ---------- 1) Afirmaciones para RÁFAGA (verdadero / falso) ---------- */
NV.RAPID = [
  { w: 'math', t: 'El 50% de 80 es 40.', a: true, e: '80 ÷ 2 = 40.' },
  { w: 'math', t: 'Un triángulo tiene ángulos internos que suman 360°.', a: false, e: 'Suman 180°. Los cuadriláteros suman 360°.' },
  { w: 'math', t: '0.75 es igual a 3/4.', a: true, e: '3 ÷ 4 = 0.75.' },
  { w: 'lang', t: '"Hice" se escribe con h porque viene del verbo hacer.', a: true, e: 'Las formas de "hacer" conservan la h.' },
  { w: 'lang', t: 'El plural de "child" en inglés es "childs".', a: false, e: 'Es irregular: "children".' },
  { w: 'lang', t: 'Un antónimo de "generoso" es "egoísta".', a: true, e: 'Expresan ideas opuestas.' },
  { w: 'sci', t: 'El Sol es una estrella.', a: true, e: 'Es la estrella más cercana a la Tierra.' },
  { w: 'sci', t: 'El agua hierve a 100 °C al nivel del mar.', a: true, e: 'A mayor altitud (como en Oaxaca) hierve a una temperatura un poco menor.' },
  { w: 'sci', t: 'Los hongos son plantas porque hacen fotosíntesis.', a: false, e: 'Los hongos forman su propio reino y no hacen fotosíntesis.' },
  { w: 'hist', t: 'Benito Juárez nació en San Pablo Guelatao, Oaxaca.', a: true, e: 'Nació ahí en 1806.' },
  { w: 'hist', t: 'La Revolución Mexicana inició en 1810.', a: false, e: 'Inició en 1910; en 1810 inició la Independencia.' },
  { w: 'hist', t: 'Monte Albán fue una ciudad de la cultura zapoteca.', a: true, e: 'Fue capital zapoteca durante siglos.' },
  { w: 'hum', t: 'Una opinión siempre puede comprobarse con datos.', a: false, e: 'Los hechos se comprueban; las opiniones expresan puntos de vista.' },
  { w: 'hum', t: 'Aristóteles fue alumno de Platón.', a: true, e: 'Estudió en la Academia de Platón.' },
  { w: 'cyber', t: 'Compartir tu contraseña con amigos es una práctica segura.', a: false, e: 'Tus contraseñas son personales.' },
  { w: 'cyber', t: 'Un byte tiene 8 bits.', a: true, e: '8 bits = 1 byte.' },
  { w: 'cyber', t: 'El mouse es un dispositivo de salida.', a: false, e: 'Es de entrada: envía información a la computadora.' },
  { w: 'emo', t: 'Sentir enojo es malo y nunca debería pasar.', a: false, e: 'Todas las emociones son válidas; lo importante es cómo las expresamos.' },
  { w: 'emo', t: 'Escuchar sin interrumpir es parte de la comunicación asertiva.', a: true, e: 'Escuchar es tan importante como expresarse.' },
  { w: 'emo', t: 'Pedir ayuda cuando la necesitas es una muestra de debilidad.', a: false, e: 'Pedir ayuda es una habilidad valiente y saludable.' },
  { w: 'res', t: 'Una hipótesis puede resultar falsa después de un experimento.', a: true, e: 'Rechazar una hipótesis también genera conocimiento.' },
  { w: 'res', t: 'Copiar un texto sin citarlo es plagio.', a: true, e: 'Siempre hay que dar crédito al autor.' },
  { w: 'career', t: 'Ganancia = ingresos − gastos.', a: true, e: 'Es la fórmula básica de la ganancia.' },
  { w: 'career', t: 'Llegar tarde a una entrevista de trabajo no afecta tu imagen.', a: false, e: 'La puntualidad es una de las primeras cosas que se evalúan.' }
];

/* ---------- 2) Generador de CÁLCULO NEURONAL ----------
   Cada problema se genera con números enteros y se calcula su respuesta
   en el momento, así siempre es correcta. */
NV.CalcGen = (function () {
  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  var makers = [
    function percent() {
      var p = pick([10, 20, 25, 50, 75]);
      var n = rnd(2, 20) * 20;           // múltiplo de 20 → resultado entero
      return { text: '¿Cuánto es el ' + p + '% de ' + n + '?', answer: n * p / 100, hint: n + ' × ' + p + ' ÷ 100' };
    },
    function equation() {
      var x = rnd(2, 12), a = rnd(2, 6), b = rnd(1, 15);
      return { text: 'Resuelve: ' + a + 'x + ' + b + ' = ' + (a * x + b) + '.  x = ?', answer: x, hint: '(' + (a * x + b) + ' − ' + b + ') ÷ ' + a };
    },
    function order() {
      var a = rnd(2, 20), b = rnd(2, 9), c = rnd(2, 9);
      return { text: 'Calcula respetando la jerarquía: ' + a + ' + ' + b + ' × ' + c, answer: a + b * c, hint: 'Primero ' + b + ' × ' + c + ' = ' + (b * c) };
    },
    function money() {
      var price = rnd(3, 30) * 5, qty = rnd(2, 9), paid = Math.ceil(price * qty / 100) * 100 + 100;
      return { text: 'Compras ' + qty + ' artículos de $' + price + ' y pagas con $' + paid + '. ¿Cuánto cambio recibes?', answer: paid - price * qty, hint: paid + ' − ' + qty + ' × ' + price };
    },
    function average() {
      var base = rnd(5, 15), d = rnd(1, 4);
      var arr = [base - d, base, base + d, base + 2 * d, base - 2 * d];
      return { text: 'Promedio de: ' + arr.join(', '), answer: base, hint: 'Suma ' + arr.reduce(function (s, v) { return s + v; }, 0) + ' ÷ 5' };
    },
    function proportion() {
      var k = rnd(2, 9), a = rnd(2, 6), b = rnd(7, 12);
      return { text: 'Si ' + a + ' cuadernos cuestan $' + (a * k * 5) + ', ¿cuánto cuestan ' + b + '?', answer: b * k * 5, hint: 'Cada uno cuesta $' + (k * 5) };
    }
  ];
  return {
    generate: function (count) {
      var list = makers.slice().sort(function () { return Math.random() - 0.5; });
      var out = [];
      for (var i = 0; i < count; i++) out.push(list[i % list.length]());
      return out;
    }
  };
})();

/* ---------- 3) DILEMAS DEL CORAZÓN (socioemocional) ----------
   No hay respuestas "incorrectas": cada opción recibe retroalimentación.
   'healthy' marca la opción que mejor favorece la convivencia sana,
   pero los puntos se ganan principalmente por participar, argumentar
   y considerar a los demás (rúbrica). */
NV.DILEMMAS = [
  {
    title: 'El trabajo copiado',
    text: 'Un compañero te pide tu tarea para copiarla porque no le dio tiempo. Es tu amigo y no quieres que repruebe.',
    options: [
      { t: 'Ofrecerle explicarle el tema para que la haga él mismo.', f: 'Ayudas sin hacer trampa: tu amigo aprende y tú cuidas tu integridad.', healthy: true },
      { t: 'Prestársela completa para que la copie.', f: 'Muestra lealtad, pero ambos se arriesgan y él no aprende.' },
      { t: 'Negarte sin explicarle nada.', f: 'Proteges tu trabajo, pero sin diálogo la amistad puede lastimarse.' },
      { t: 'Contarle al profesor sin hablar antes con él.', f: 'Es honesto, aunque hablar primero con tu amigo podría ser más empático.' }
    ]
  },
  {
    title: 'El apodo',
    text: 'En el salón le pusieron un apodo a una compañera. Todos se ríen, pero notas que ella se aleja triste.',
    options: [
      { t: 'Dejar de usar el apodo, acercarte a ella y pedir al grupo que pare.', f: 'Tu acción muestra empatía y valentía; puedes cambiar el ambiente del grupo.', healthy: true },
      { t: 'Reírte también para no quedar mal.', f: 'Es comprensible sentir presión de grupo, pero reforzar la burla aumenta el daño.' },
      { t: 'No hacer nada porque "no es tu problema".', f: 'Quien observa en silencio también influye; tu apoyo podría ser importante.' },
      { t: 'Burlarte de quien inventó el apodo.', f: 'Responder con otra burla no resuelve el problema, solo lo cambia de lugar.' }
    ]
  },
  {
    title: 'El equipo dividido',
    text: 'En tu equipo hay dos ideas para el proyecto final y el grupo se dividió. Ya hay molestias y faltan dos días.',
    options: [
      { t: 'Proponer escuchar ambas ideas, combinar lo mejor y votar con respeto.', f: 'Escuchar y acordar fortalece al equipo y aprovecha el talento de todos.', healthy: true },
      { t: 'Imponer tu idea porque crees que es la mejor.', f: 'La seguridad es valiosa, pero imponer genera resentimiento.' },
      { t: 'Hacer el proyecto tú solo.', f: 'Asegura un resultado, pero pierdes el trabajo en equipo y te sobrecargas.' },
      { t: 'Dejar que el conflicto siga y ver qué pasa.', f: 'Evitar el conflicto lo hace crecer cuando el tiempo es poco.' }
    ]
  },
  {
    title: 'La foto vergonzosa',
    text: 'Te llega por mensaje una foto vergonzosa de un compañero que se está compartiendo en varios grupos.',
    options: [
      { t: 'No reenviarla, borrarla y avisar al compañero o a un adulto de confianza.', f: 'Proteges la dignidad y privacidad de tu compañero. Romper la cadena es poderoso.', healthy: true },
      { t: 'Reenviarla a tu mejor amigo "solo para que la vea".', f: 'Aunque parezca inofensivo, cada reenvío amplía el daño.' },
      { t: 'Comentar con un emoji de risa.', f: 'Un comentario también participa en la burla.' },
      { t: 'Ignorarla sin hacer nada más.', f: 'No reenviar es bueno; avisar podría ayudar a detenerla.' }
    ]
  },
  {
    title: 'La presión del grupo',
    text: 'Tus amigos planean salirse de clases y te dicen que si no vas eres "aburrido".',
    options: [
      { t: 'Decir con seguridad que no irás y proponer verse después de clases.', f: 'Ser asertivo te permite cuidar tus decisiones sin romper la amistad.', healthy: true },
      { t: 'Ir para no quedar mal.', f: 'La aceptación es importante, pero no debería costarte tus metas.' },
      { t: 'Amenazar con acusarlos.', f: 'Puedes expresar tu desacuerdo sin amenazas; el diálogo funciona mejor.' },
      { t: 'Inventar una excusa falsa.', f: 'Te saca del momento, pero no expresa lo que realmente piensas.' }
    ]
  },
  {
    title: 'El error del maestro',
    text: 'El profesor se equivocó al calificar y te puso más puntos de los que merecías. Nadie lo ha notado.',
    options: [
      { t: 'Avisarle con respeto para que corrija la calificación.', f: 'La honestidad construye confianza, aunque cueste.', healthy: true },
      { t: 'Quedarte callado porque fue su error.', f: 'Es una tentación comprensible, pero la integridad se demuestra justo en estos momentos.' },
      { t: 'Contarlo a todos para que pidan lo mismo.', f: 'Esto aprovecha el error y puede perjudicar a todos.' },
      { t: 'Esperar a ver si alguien más lo nota.', f: 'Posponer la decisión no la resuelve.' }
    ]
  },
  {
    title: 'El nuevo del Istmo',
    text: 'Llega un compañero que habla zapoteco del Istmo y algunos se burlan de su forma de hablar español.',
    options: [
      { t: 'Interesarte por su lengua, integrarlo y pedir respeto a los demás.', f: 'Valorar la diversidad cultural enriquece a todo el grupo. Las lenguas originarias son patrimonio de Oaxaca.', healthy: true },
      { t: 'Corregirle cada palabra frente a todos.', f: 'Aunque la intención sea ayudar, hacerlo en público puede avergonzarlo.' },
      { t: 'Evitarlo para no tener problemas.', f: 'Alejarte lo deja solo justo cuando más necesita apoyo.' },
      { t: 'Unirte a las bromas "sin mala intención".', f: 'Las bromas sobre la identidad de alguien sí lastiman, aunque no sea la intención.' }
    ]
  },
  {
    title: 'El amigo que cambió',
    text: 'Tu amigo de siempre está muy callado, ya no quiere salir y bajó sus calificaciones.',
    options: [
      { t: 'Hablar con él en privado, escucharlo y animarlo a buscar apoyo si lo necesita.', f: 'Escuchar sin juzgar es un gran apoyo; si algo es grave, un adulto de confianza puede ayudar.', healthy: true },
      { t: 'Esperar a que se le pase solo.', f: 'A veces pasa, pero preguntar muestra que te importa.' },
      { t: 'Contarle a todo el grupo que algo le pasa.', f: 'Su situación es privada; compartirla puede hacerlo sentir expuesto.' },
      { t: 'Dejar de juntarte con él porque "ya no es divertido".', f: 'Las amistades también se viven en los momentos difíciles.' }
    ]
  }
];

/* Rúbrica de los dilemas: cada criterio vale 100 + 100 de participación = 500 */
NV.REFLECT_RUBRIC = [
  { id: 'participa', label: 'Participaron todos los integrantes (o el jugador escribió su reflexión)' },
  { id: 'argumenta', label: 'Dieron razones para su decisión ("porque…", "ya que…")' },
  { id: 'empatia', label: 'Consideraron los sentimientos de las personas involucradas' },
  { id: 'solucion', label: 'Propusieron una solución respetuosa y realista' }
];
