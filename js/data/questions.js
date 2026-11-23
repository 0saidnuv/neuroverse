/* ============================================================
   NEUROVERSE — Banco de preguntas (135 preguntas, 15 por mundo)
   Formato de cada entrada:
   [dificultad, categoría, enunciado, [CORRECTA, incorrecta, incorrecta, incorrecta], explicación]
   - La opción correcta se escribe SIEMPRE primero; el juego baraja
     las opciones al mostrarlas, así que la posición nunca se repite.
   - dificultad: 'facil' | 'media' | 'dificil'
   - La puntuación se asigna según la dificultad (ver NV.DIFF_POINTS
     y la configuración del panel de administración).
   ============================================================ */
window.NV = window.NV || {};

NV.DIFF_LABEL = { facil: 'Fácil', media: 'Media', dificil: 'Difícil' };
NV.DIFF_POINTS = { facil: 100, media: 200, dificil: 300 };

NV.RAW_QUESTIONS = {
  /* ---------------- 1. MATH DIMENSION ---------------- */
  math: [
    ['facil', 'Porcentajes', '¿Cuánto es el 15% de 200?', ['30', '15', '20', '35'],
      'Para calcular un porcentaje se multiplica: 200 × 0.15 = 30.'],
    ['facil', 'Ecuaciones', 'Resuelve la ecuación: x + 7 = 19', ['x = 12', 'x = 26', 'x = 11', 'x = 13'],
      'Se resta 7 en ambos lados: x = 19 − 7 = 12.'],
    ['facil', 'Operaciones', 'Un cuaderno cuesta $18. ¿Cuánto pagas por 4 cuadernos?', ['$72', '$64', '$68', '$76'],
      'Multiplicación: 18 × 4 = 72 pesos.'],
    ['facil', 'Razonamiento lógico', '¿Qué número sigue en la serie 3, 6, 12, 24, …?', ['48', '36', '30', '42'],
      'Cada número es el doble del anterior: 24 × 2 = 48.'],
    ['facil', 'Fracciones', 'En un salón hay 40 estudiantes y 25 son mujeres. ¿Qué fracción del grupo son hombres?', ['3/8', '5/8', '1/3', '2/5'],
      'Hombres: 40 − 25 = 15. La fracción es 15/40, que simplificada (÷5) es 3/8.'],
    ['media', 'Ecuaciones', 'Resuelve: 3x − 5 = 16', ['x = 7', 'x = 5', 'x = 6', 'x = 8'],
      'Sumamos 5: 3x = 21. Dividimos entre 3: x = 7. Comprobación: 3(7) − 5 = 16.'],
    ['media', 'Porcentajes', 'Una mochila de $650 tiene 20% de descuento. ¿Cuál es el precio final?', ['$520', '$630', '$130', '$540'],
      'Descuento: 650 × 0.20 = 130. Precio final: 650 − 130 = 520.'],
    ['media', 'Estimación', '¿Cuál es la mejor estimación de 498 × 21?', ['Aproximadamente 10,000', 'Aproximadamente 1,000', 'Aproximadamente 100,000', 'Aproximadamente 5,000'],
      'Redondeamos: 500 × 20 = 10,000. El resultado exacto es 10,458, muy cercano.'],
    ['media', 'Gráficas y estadística', 'Una gráfica de barras muestra ventas: lunes 12, martes 18 y miércoles 15. ¿Cuál es el promedio diario?', ['15', '14', '16', '18'],
      'Promedio = (12 + 18 + 15) ÷ 3 = 45 ÷ 3 = 15.'],
    ['media', 'Proporcionalidad', 'Si 3 personas pintan una barda en 6 horas, ¿cuánto tardarán 6 personas trabajando al mismo ritmo?', ['3 horas', '12 horas', '6 horas', '2 horas'],
      'Es proporcionalidad inversa: al doble de personas, la mitad del tiempo. 6 ÷ 2 = 3 horas.'],
    ['dificil', 'Sistemas de ecuaciones', 'Resuelve el sistema: x + y = 10 y x − y = 4', ['x = 7, y = 3', 'x = 6, y = 4', 'x = 8, y = 2', 'x = 5, y = 5'],
      'Sumando ambas ecuaciones: 2x = 14, x = 7. Entonces y = 10 − 7 = 3. Comprobación: 7 − 3 = 4.'],
    ['dificil', 'Porcentajes', 'El precio de un celular subió de $4,000 a $5,000. ¿En qué porcentaje aumentó?', ['25%', '20%', '10%', '15%'],
      'Aumento = 1,000. Porcentaje = 1,000 ÷ 4,000 = 0.25 = 25%. Se divide entre el valor ORIGINAL.'],
    ['dificil', 'Razonamiento lógico', 'Todos los "zorbs" son "plins" y algunos "plins" son azules. ¿Qué conclusión es válida?', ['No se puede asegurar que algún zorb sea azul', 'Todos los zorbs son azules', 'Ningún zorb es azul', 'Todos los plins son zorbs'],
      'Los plins azules podrían no ser zorbs. Con esa información no se puede afirmar ni negar que un zorb sea azul.'],
    ['dificil', 'Ecuaciones', 'Resuelve: 2(x + 3) = 5x − 9', ['x = 5', 'x = 3', 'x = −5', 'x = 1'],
      '2x + 6 = 5x − 9 → 6 + 9 = 5x − 2x → 15 = 3x → x = 5. Comprobación: 2(8) = 16 y 25 − 9 = 16.'],
    ['dificil', 'Geometría', 'Un rectángulo tiene perímetro de 36 cm y su largo es el doble de su ancho. ¿Cuál es su área?', ['72 cm²', '36 cm²', '54 cm²', '81 cm²'],
      'Ancho = a, largo = 2a. Perímetro: 2(2a + a) = 6a = 36 → a = 6, largo = 12. Área = 6 × 12 = 72 cm².']
  ],

  /* ---------------- 2. LANGUAGE PORTAL ---------------- */
  lang: [
    ['facil', 'Ortografía', '¿Cuál palabra está escrita correctamente?', ['Exhibición', 'Exibición', 'Exhibisión', 'Ecsibición'],
      '"Exhibición" se escribe con "xh" y termina en "-ción" porque viene de "exhibir".'],
    ['facil', 'Inglés: traducción', 'Traduce al inglés: "Yo estudio todos los días."', ['I study every day.', 'I studies every day.', 'I studying every days.', 'Me study all days.'],
      'Con "I" el verbo va en forma base (study) y "todos los días" se dice "every day".'],
    ['facil', 'Vocabulario', '¿Cuál es un sinónimo de "efímero"?', ['Pasajero', 'Eterno', 'Enorme', 'Valiente'],
      '"Efímero" significa que dura poco tiempo, igual que "pasajero". "Eterno" es su antónimo.'],
    ['facil', 'Gramática', 'En la oración "Los alumnos del COBAO ganaron el torneo", ¿cuál es el sujeto?', ['Los alumnos del COBAO', 'ganaron', 'el torneo', 'ganaron el torneo'],
      'El sujeto es quien realiza la acción: "Los alumnos del COBAO". "Ganaron el torneo" es el predicado.'],
    ['facil', 'Inglés: verbo to be', 'Choose the correct option: "She ___ a student."', ['is', 'are', 'am', 'be'],
      'Con "she" (ella) el verbo "to be" en presente es "is".'],
    ['media', 'Tipos de texto', '¿Qué tipo de texto busca convencer al lector mediante razones?', ['Argumentativo', 'Narrativo', 'Descriptivo', 'Instructivo'],
      'El texto argumentativo presenta una postura (tesis) y la defiende con argumentos.'],
    ['media', 'Inglés: pasado simple', 'Choose the correct option: "Yesterday we ___ to the museum."', ['went', 'go', 'goes', 'going'],
      '"Yesterday" indica pasado. El pasado del verbo irregular "go" es "went".'],
    ['media', 'Acentuación', '¿Cuál de estas palabras es esdrújula?', ['Teléfono', 'Canción', 'Lápiz', 'Reloj'],
      'Esdrújula: se acentúa en la antepenúltima sílaba (te-LÉ-fo-no) y siempre lleva tilde.'],
    ['media', 'Comprensión lectora', 'En "Aunque llovía, el equipo terminó el proyecto a tiempo", ¿qué expresa la palabra "aunque"?', ['Una oposición o concesión', 'Una causa', 'Una consecuencia', 'Una fecha exacta'],
      '"Aunque" introduce un obstáculo que no impide la acción principal: es un conector concesivo.'],
    ['media', 'Inglés: expresiones', '¿Qué significa "I\'m looking forward to the weekend"?', ['Espero con entusiasmo el fin de semana', 'Estoy mirando hacia el fin de semana', 'Olvidé el fin de semana', 'Trabajaré el fin de semana'],
      '"To look forward to" es una expresión que significa esperar algo con ilusión.'],
    ['dificil', 'Ortografía', '¿Cuál oración está escrita correctamente?', ['Vamos a ver la película.', 'Vamos haber la película.', 'Va a ver mucha gente en la fiesta.', 'Debe de a ver más tiempo.'],
      '"A ver" viene del verbo ver (mirar). "Haber" indica existencia: "Va a HABER mucha gente".'],
    ['dificil', 'Comunicación', 'En el proceso de comunicación, ¿qué es el "código"?', ['El sistema de signos compartido, como un idioma', 'La persona que recibe el mensaje', 'El medio físico por donde viaja el mensaje', 'La situación en la que ocurre la comunicación'],
      'El código es el conjunto de signos y reglas que emisor y receptor comparten. Las otras opciones son receptor, canal y contexto.'],
    ['dificil', 'Inglés: there is / there are', 'Choose the correct sentence:', ['There are three books on the table.', 'There is three books on the table.', 'There are three book on the table.', 'It have three books on the table.'],
      'Con sustantivos en plural se usa "there are" y el sustantivo va en plural: "books".'],
    ['dificil', 'Figuras retóricas', '¿Qué figura retórica aparece en "Tus ojos son dos luceros"?', ['Metáfora', 'Hipérbole', 'Símil o comparación', 'Onomatopeya'],
      'Es metáfora porque identifica directamente los ojos con luceros, sin usar "como" (eso sería símil).'],
    ['dificil', 'Inglés: comprensión lectora', 'Read: "Maria usually walks to school, but today she is taking the bus because it is raining." ¿Por qué María toma el autobús hoy?', ['Porque está lloviendo', 'Porque siempre toma el autobús', 'Porque se levantó tarde', 'Porque la escuela está lejos'],
      '"Because it is raining" significa "porque está lloviendo". "Usually walks" indica que normalmente camina.']
  ],

  /* ---------------- 3. SCIENCE LAB ---------------- */
  sci: [
    ['facil', 'Biología', '¿Cuál es la unidad básica de la vida?', ['La célula', 'El átomo', 'El órgano', 'El tejido'],
      'Todos los seres vivos están formados por células; es la unidad estructural y funcional más pequeña con vida.'],
    ['facil', 'Biología', '¿Qué gas liberan las plantas durante la fotosíntesis?', ['Oxígeno', 'Dióxido de carbono', 'Nitrógeno', 'Helio'],
      'En la fotosíntesis las plantas absorben CO₂ y agua, usan la luz solar y liberan oxígeno (O₂).'],
    ['facil', 'Materia', '¿En qué estado de la materia las partículas están más separadas y se mueven con mayor libertad?', ['Gaseoso', 'Sólido', 'Líquido', 'Cristalino'],
      'En los gases las partículas tienen mucha energía y poca atracción entre sí, por eso ocupan todo el espacio disponible.'],
    ['facil', 'Química', '¿Qué fórmula química corresponde al agua?', ['H₂O', 'CO₂', 'O₂', 'NaCl'],
      'Una molécula de agua tiene dos átomos de hidrógeno y uno de oxígeno: H₂O.'],
    ['facil', 'Medio ambiente', '¿Cuál acción ayuda a reducir la contaminación del agua?', ['No tirar aceite usado al drenaje', 'Lavar el auto con manguera todos los días', 'Tirar basura en los ríos', 'Usar el doble de detergente'],
      'Un litro de aceite puede contaminar miles de litros de agua. Debe guardarse en un envase y llevarse a un centro de acopio.'],
    ['media', 'Física', 'Un auto recorre 120 km en 2 horas. ¿Cuál es su rapidez media?', ['60 km/h', '240 km/h', '120 km/h', '30 km/h'],
      'Rapidez = distancia ÷ tiempo = 120 km ÷ 2 h = 60 km/h.'],
    ['media', 'Química', 'En la tabla periódica, ¿qué indica el número atómico de un elemento?', ['El número de protones de su átomo', 'Su masa total', 'El número de moléculas que forma', 'Su temperatura de fusión'],
      'El número atómico (Z) es la cantidad de protones en el núcleo y es lo que identifica a cada elemento.'],
    ['media', 'Energía', '¿Qué tipo de energía tiene una pelota detenida en lo alto de una escalera?', ['Energía potencial', 'Energía cinética', 'Energía nuclear', 'Energía eléctrica'],
      'La energía potencial gravitatoria depende de la altura. Si la pelota cae, se transforma en energía cinética.'],
    ['media', 'Mezclas', 'Al mezclar agua y aceite, ¿qué tipo de mezcla se forma?', ['Heterogénea', 'Homogénea', 'Un compuesto', 'Un elemento'],
      'Se distinguen dos fases a simple vista porque el aceite no se disuelve en el agua: es heterogénea.'],
    ['media', 'Biología', '¿En qué organelo de la célula vegetal se realiza la fotosíntesis?', ['Cloroplasto', 'Mitocondria', 'Ribosoma', 'Núcleo'],
      'Los cloroplastos contienen clorofila, el pigmento que capta la luz. La mitocondria realiza la respiración celular.'],
    ['dificil', 'Física', 'Si empujas una caja con más fuerza y su masa no cambia, según la segunda ley de Newton, ¿qué pasa con su aceleración?', ['Aumenta', 'Disminuye', 'Se mantiene igual', 'Se vuelve cero'],
      'F = m × a. Si la masa es constante, la aceleración es directamente proporcional a la fuerza.'],
    ['dificil', 'Química', '¿Cuál de estos es un cambio químico?', ['La oxidación de un clavo', 'Derretir hielo', 'Romper una hoja de papel', 'Disolver azúcar en agua'],
      'En la oxidación se forma una sustancia nueva (óxido de hierro). Los demás son cambios físicos: la sustancia sigue siendo la misma.'],
    ['dificil', 'Medio ambiente', 'El efecto invernadero se intensifica principalmente por…', ['El aumento de gases como el CO₂ y el metano', 'La capa de ozono', 'Las mareas del océano', 'La rotación de la Tierra'],
      'Estos gases retienen calor en la atmósfera. Su aumento por actividades humanas provoca el calentamiento global.'],
    ['dificil', 'Física', 'Un objeto tiene una masa de 200 g y un volumen de 50 cm³. ¿Cuál es su densidad?', ['4 g/cm³', '0.25 g/cm³', '250 g/cm³', '10,000 g/cm³'],
      'Densidad = masa ÷ volumen = 200 g ÷ 50 cm³ = 4 g/cm³.'],
    ['dificil', 'Tecnología y energía', '¿Qué energía renovable se aprovecha con aerogeneradores en el Istmo de Tehuantepec, Oaxaca?', ['Eólica', 'Geotérmica', 'Nuclear', 'Mareomotriz'],
      'Los fuertes vientos del Istmo mueven las turbinas de los aerogeneradores: es energía eólica.']
  ],

  /* ---------------- 4. TIME FRACTURE ---------------- */
  hist: [
    ['facil', 'Historia de México', '¿En qué año inició el movimiento de Independencia de México?', ['1810', '1821', '1910', '1857'],
      'El 16 de septiembre de 1810 Miguel Hidalgo convocó al pueblo en Dolores. La Independencia se consumó en 1821.'],
    ['facil', 'Historia de Oaxaca', '¿Qué presidente nacido en Oaxaca es conocido como el "Benemérito de las Américas"?', ['Benito Juárez', 'Porfirio Díaz', 'Miguel Hidalgo', 'Lázaro Cárdenas'],
      'Benito Juárez, nacido en San Pablo Guelatao, defendió la soberanía nacional y las Leyes de Reforma.'],
    ['facil', 'Cultura', '¿Cuál es la gran zona arqueológica zapoteca ubicada junto a la ciudad de Oaxaca?', ['Monte Albán', 'Chichén Itzá', 'Teotihuacan', 'Tulum'],
      'Monte Albán fue una capital zapoteca y es Patrimonio de la Humanidad. Chichén Itzá y Tulum son mayas.'],
    ['facil', 'Cultura', '¿Qué fiesta oaxaqueña de julio reúne danzas y tradiciones de las regiones del estado?', ['La Guelaguetza', 'La Noche de Rábanos', 'El Carnaval de Veracruz', 'La Feria de San Marcos'],
      'La Guelaguetza (que en zapoteco se relaciona con "compartir" o "ayuda mutua") se celebra en el Cerro del Fortín.'],
    ['facil', 'Sociedad', '¿Qué documento es la ley suprema de México?', ['La Constitución Política de los Estados Unidos Mexicanos', 'El Código Civil', 'La Ley Federal del Trabajo', 'El reglamento escolar'],
      'La Constitución está por encima de todas las demás leyes y establece derechos y la organización del país.'],
    ['media', 'Historia de México', '¿En qué año se promulgó la Constitución que rige actualmente a México?', ['1917', '1857', '1824', '1910'],
      'Fue promulgada el 5 de febrero de 1917 en Querétaro, como resultado de la Revolución Mexicana.'],
    ['media', 'Historia de México', 'La Revolución Mexicana de 1910 inició principalmente como oposición a…', ['La larga permanencia de Porfirio Díaz en el poder', 'La invasión francesa', 'El dominio español', 'La Guerra de Reforma'],
      'Francisco I. Madero llamó a levantarse con el Plan de San Luis contra la reelección de Porfirio Díaz.'],
    ['media', 'Sociedad y cultura', '¿Qué es la diversidad cultural?', ['La convivencia de distintas culturas, lenguas y tradiciones en una sociedad', 'Que todas las personas tengan la misma cultura', 'El uso obligatorio de una sola lengua', 'La desaparición de las tradiciones'],
      'México, y especialmente Oaxaca, es un ejemplo de diversidad cultural por sus pueblos, lenguas y costumbres.'],
    ['media', 'Cultura de Oaxaca', '¿Cuál de estas lenguas originarias se habla en Oaxaca?', ['Mixteco', 'Rarámuri', 'Maya yucateco', 'Purépecha'],
      'En Oaxaca se hablan, entre otras, zapoteco, mixteco, mazateco y mixe. El rarámuri es de Chihuahua y el purépecha de Michoacán.'],
    ['media', 'Historia de México', '¿Qué ocurrió el 27 de septiembre de 1821?', ['El Ejército Trigarante entró a la Ciudad de México y se consumó la Independencia', 'El Grito de Dolores', 'La promulgación de la Constitución de 1917', 'La Batalla de Puebla'],
      'Con la entrada del Ejército Trigarante, encabezado por Agustín de Iturbide, terminó la guerra de Independencia.'],
    ['dificil', 'Historia de México', '¿Qué establecieron principalmente las Leyes de Reforma del siglo XIX?', ['La separación entre la Iglesia y el Estado', 'La nacionalización del petróleo', 'Un tratado de paz con España', 'El voto de las mujeres'],
      'Impulsadas por liberales como Juárez, establecieron, por ejemplo, el registro civil y la separación Iglesia-Estado.'],
    ['dificil', 'Historia de México', '¿Por qué es importante la expropiación petrolera de 1938?', ['Porque el Estado mexicano recuperó el control del petróleo que explotaban empresas extranjeras', 'Porque ese año se descubrió el petróleo', 'Porque se vendió PEMEX a otro país', 'Porque terminó la Revolución'],
      'El presidente Lázaro Cárdenas expropió los bienes de las compañías petroleras extranjeras el 18 de marzo de 1938.'],
    ['dificil', 'Pensamiento histórico', '¿Cuál es un ejemplo de fuente PRIMARIA para estudiar la Revolución Mexicana?', ['Una fotografía tomada en 1913', 'Un libro de texto escrito en 2020', 'Un resumen en una página de internet', 'Una película de ficción reciente'],
      'Una fuente primaria se produjo en la época que se estudia. Las demás son interpretaciones posteriores (secundarias).'],
    ['dificil', 'Ciudadanía', '¿Qué característica tiene una sociedad democrática?', ['La ciudadanía elige a sus representantes mediante el voto libre', 'Una sola persona decide todo sin límites', 'Los cargos públicos se heredan', 'Se prohíbe la libertad de expresión'],
      'La democracia se basa en elecciones libres, división de poderes y respeto a los derechos de las personas.'],
    ['dificil', 'Historia de México', '¿En qué año las mujeres obtuvieron el derecho a votar en elecciones federales en México?', ['1953', '1910', '1968', '1990'],
      'El 17 de octubre de 1953 se reconoció el voto femenino a nivel federal; votaron por primera vez en 1955.']
  ],

  /* ---------------- 5. MIND CORE ---------------- */
  hum: [
    ['facil', 'Ética', '¿Qué estudia la ética?', ['Los principios que orientan lo correcto o incorrecto en la conducta humana', 'Las operaciones con números', 'La formación de las rocas', 'Los microorganismos'],
      'La ética reflexiona sobre cómo debemos actuar y por qué, a partir de valores como la justicia y el respeto.'],
    ['facil', 'Filosofía', 'Por su origen griego, ¿qué significa la palabra "filosofía"?', ['Amor a la sabiduría', 'Estudio del cuerpo', 'Ciencia de la Tierra', 'Arte de hablar en público'],
      'Viene de "philos" (amor) y "sophia" (sabiduría).'],
    ['facil', 'Valores', 'Encuentras una cartera con dinero e identificación. ¿Qué acción refleja honestidad?', ['Buscar al dueño o entregarla a una autoridad', 'Quedarte el dinero y tirar la cartera', 'Esconderla por si nadie la reclama', 'Repartir el dinero con tus amigos'],
      'La honestidad implica actuar con verdad y respetar lo que pertenece a otras personas.'],
    ['facil', 'Pensamiento crítico', '¿Qué es un argumento?', ['Un conjunto de razones que apoyan una conclusión', 'Un insulto hacia otra persona', 'Una opinión sin razones', 'Una pregunta sin respuesta'],
      'Argumentar es dar razones (premisas) para sostener una idea (conclusión).'],
    ['facil', 'Filosofía', '¿A qué filósofo griego se le atribuye la frase "Solo sé que no sé nada"?', ['Sócrates', 'Aristóteles', 'Pitágoras', 'Arquímedes'],
      'Sócrates enseñaba que reconocer nuestra ignorancia es el primer paso para buscar el conocimiento.'],
    ['media', 'Pensamiento crítico', 'Una noticia viral no muestra fuente ni fecha. ¿Qué es lo más crítico y responsable?', ['Verificarla en fuentes confiables antes de compartirla', 'Compartirla rápido para ser el primero', 'Creerla porque tiene muchos "me gusta"', 'Cambiarle el título para que sea más llamativa'],
      'El pensamiento crítico exige comprobar la información; la popularidad no garantiza que algo sea verdadero.'],
    ['media', 'Falacias', '¿Qué falacia hay en: "Tu argumento no vale porque eres muy joven"?', ['Ataque a la persona (ad hominem)', 'Apelación a la mayoría', 'Pendiente resbaladiza', 'Falso dilema'],
      'Se ataca a quien habla en lugar de analizar sus razones. La edad no determina si un argumento es válido.'],
    ['media', 'Pensamiento crítico', '¿Cuál es la diferencia entre un hecho y una opinión?', ['Un hecho puede comprobarse; una opinión expresa un punto de vista', 'Un hecho es siempre negativo y una opinión positiva', 'No hay ninguna diferencia', 'Una opinión siempre es falsa'],
      '"Oaxaca tiene 570 municipios" es un hecho verificable; "Oaxaca tiene la mejor comida" es una opinión.'],
    ['media', 'Valores', '¿Qué valor practicas al respetar ideas diferentes a las tuyas?', ['Tolerancia', 'Indiferencia', 'Competencia', 'Obediencia'],
      'La tolerancia permite convivir y dialogar con personas que piensan distinto.'],
    ['media', 'Filosofía', 'Platón explicó el conocimiento con un relato de personas encadenadas que solo ven sombras. ¿Cómo se llama?', ['El mito de la caverna', 'El mito de Sísifo', 'La paradoja de Zenón', 'La Odisea'],
      'En el mito de la caverna, salir a la luz representa el paso de las apariencias al conocimiento verdadero.'],
    ['dificil', 'Falacias', '¿Qué falacia hay en: "Todos mis amigos usan esa app, así que debe ser segura"?', ['Apelación a la mayoría (ad populum)', 'Ataque a la persona', 'Causa falsa', 'Hombre de paja'],
      'Que mucha gente haga o crea algo no demuestra que sea verdadero o seguro.'],
    ['dificil', 'Lógica', 'Completa el silogismo: "Todos los seres humanos son mortales. Sócrates es humano. Por lo tanto…"', ['Sócrates es mortal', 'Todos los mortales son Sócrates', 'Sócrates no es humano', 'Algunos humanos son inmortales'],
      'Si las dos premisas son verdaderas, la conclusión se deduce necesariamente: Sócrates es mortal.'],
    ['dificil', 'Dilemas éticos', 'Tu equipo podría ganar copiando un trabajo sin que nadie lo note. ¿Qué principio ético defiende rechazarlo?', ['La integridad: actuar correctamente aunque nadie te vigile', 'El beneficio propio', 'La conveniencia del momento', 'Ganar a cualquier costo'],
      'La integridad es la coherencia entre lo que valoras y lo que haces, con o sin testigos.'],
    ['dificil', 'Ética', '¿Qué es la dignidad humana?', ['El valor que tiene toda persona por el simple hecho de serlo', 'El valor de una persona según su dinero', 'Un premio que se gana con buenas calificaciones', 'Un título de nobleza'],
      'La dignidad no se compra ni se pierde: es la base de los derechos humanos.'],
    ['dificil', 'Falacias', '¿Qué falacia hay en: "Si no apoyas mi propuesta, entonces quieres que la escuela fracase"?', ['Falso dilema', 'Ataque a la persona', 'Apelación a la autoridad', 'Generalización apresurada'],
      'Presenta solo dos opciones extremas cuando en realidad existen muchas otras posibilidades.']
  ],

  /* ---------------- 6. CYBER WORLD ---------------- */
  cyber: [
    ['facil', 'Hardware', '¿Cuál de estos es un dispositivo de ENTRADA?', ['Teclado', 'Monitor', 'Bocinas', 'Impresora'],
      'Los dispositivos de entrada envían información a la computadora (teclado, mouse, micrófono). Los otros son de salida.'],
    ['facil', 'Seguridad digital', '¿Cuál es la contraseña más segura?', ['R3d#Gal4xia!Fuerte', '123456', 'contraseña', 'juan2008'],
      'Una contraseña segura es larga y combina mayúsculas, minúsculas, números y símbolos, sin datos personales.'],
    ['facil', 'Software', '¿Qué es el software?', ['Los programas e instrucciones que usa una computadora', 'Las partes físicas de la computadora', 'El cable de red', 'La pantalla'],
      'El software es la parte lógica (programas, apps, sistema operativo). Las partes físicas son el hardware.'],
    ['facil', 'Internet', '¿Qué significa "www" en una dirección web?', ['World Wide Web', 'World Wireless Window', 'Web With Wifi', 'Wide World Wireless'],
      'World Wide Web es el sistema de páginas conectadas por enlaces que consultamos en internet.'],
    ['facil', 'Seguridad digital', 'Recibes: "¡Ganaste un celular! Envía tu contraseña para reclamarlo". ¿Qué es probablemente?', ['Un intento de fraude (phishing)', 'Un premio real', 'Una actualización del sistema', 'Un antivirus'],
      'Ninguna empresa seria pide tu contraseña. El phishing busca engañarte para robar datos.'],
    ['media', 'Informática', '¿Cuántos bits forman un byte?', ['8', '2', '10', '16'],
      'Un byte está formado por 8 bits. Un bit es la unidad mínima de información (0 o 1).'],
    ['media', 'Ciudadanía digital', '¿Qué es la huella digital en internet?', ['El rastro de información que dejas con tu actividad en línea', 'La marca de tu dedo en la pantalla', 'Un tipo de virus', 'El historial de la batería'],
      'Publicaciones, búsquedas y fotos forman tu huella digital; puede ser permanente, por eso hay que cuidarla.'],
    ['media', 'Hardware', '¿Qué función cumple la memoria RAM?', ['Guarda temporalmente los datos de los programas que están en uso', 'Almacena archivos de forma permanente aunque se apague el equipo', 'Imprime documentos', 'Conecta el equipo a internet'],
      'La RAM es memoria volátil: se borra al apagar. El almacenamiento permanente está en el disco o SSD.'],
    ['media', 'Hojas de cálculo', 'En una hoja de cálculo, ¿qué fórmula suma las celdas de A1 a A5?', ['=SUMA(A1:A5)', '=A1+A5', 'SUMA A1-A5', '=PROMEDIO(A1:A5)'],
      'Las fórmulas inician con "=" y los dos puntos indican un rango. "=A1+A5" solo suma dos celdas.'],
    ['media', 'Ciudadanía digital', '¿Qué es el ciberacoso?', ['Agredir, humillar o amenazar a alguien de forma repetida usando medios digitales', 'Usar mucho tiempo el celular', 'Jugar videojuegos en línea', 'Bloquear a un desconocido'],
      'El ciberacoso daña a las personas. Se debe guardar evidencia, no responder con agresión y pedir ayuda a un adulto.'],
    ['dificil', 'Seguridad digital', '¿Qué indica el candado y el "https" en la dirección de un sitio web?', ['Que la conexión entre tu navegador y el sitio está cifrada', 'Que el sitio es 100% confiable en todo', 'Que el sitio es gratuito', 'Que el sitio no tiene anuncios'],
      'HTTPS cifra los datos en tránsito, pero un sitio fraudulento también puede tenerlo: hay que verificar la dirección.'],
    ['dificil', 'Seguridad digital', '¿Qué es la verificación en dos pasos?', ['Un método que pide una segunda comprobación además de la contraseña', 'Escribir la contraseña dos veces', 'Tener dos cuentas iguales', 'Cambiar la contraseña cada dos días'],
      'Además de la contraseña pide, por ejemplo, un código enviado a tu teléfono; así es más difícil robar tu cuenta.'],
    ['dificil', 'Sistema binario', '¿Qué número decimal representa el número binario 1010?', ['10', '8', '12', '5'],
      '1010 = 1×8 + 0×4 + 1×2 + 0×1 = 10.'],
    ['dificil', 'Ética digital', 'Quieres usar una imagen de internet en tu proyecto. ¿Qué es lo más adecuado?', ['Usar imágenes con licencia libre (como Creative Commons) y dar crédito al autor', 'Usar cualquier imagen porque está en internet', 'Quitarle la marca de agua', 'Decir que tú la hiciste'],
      'Respetar los derechos de autor es parte de la ciudadanía digital; las licencias indican cómo puedes usar una obra.'],
    ['dificil', 'Algoritmos', 'En un diagrama de flujo, ¿qué figura representa una DECISIÓN?', ['Rombo', 'Rectángulo', 'Óvalo', 'Paralelogramo'],
      'El rombo plantea una condición con salidas Sí/No. El rectángulo es un proceso, el óvalo inicio/fin y el paralelogramo entrada/salida.']
  ],

  /* ---------------- 7. EMOTION ISLAND ---------------- */
  emo: [
    ['facil', 'Empatía', '¿Qué es la empatía?', ['Comprender y tomar en cuenta lo que siente otra persona', 'Hacer siempre lo que los demás quieren', 'Sentir lástima por alguien', 'No mostrar nunca tus emociones'],
      'Ser empático es ponerte en el lugar del otro sin dejar de ser tú mismo. Reflexiona: ¿cuándo alguien fue empático contigo?'],
    ['facil', 'Reconocimiento emocional', 'Antes de exponer, tu corazón late rápido y te sudan las manos. ¿Qué emoción es más probable?', ['Nerviosismo o ansiedad', 'Aburrimiento', 'Enojo', 'Tristeza'],
      'Reconocer las señales del cuerpo ayuda a nombrar la emoción. El nerviosismo es normal y se puede regular con respiración.'],
    ['facil', 'Autocontrol', '¿Qué estrategia ayuda a calmarte cuando sientes mucho enojo?', ['Respirar profundo y tomar una pausa antes de responder', 'Gritar para desahogarte con quien sea', 'Golpear lo que tengas cerca', 'Enviar un mensaje hiriente'],
      'La pausa permite que la emoción baje de intensidad y elijas cómo actuar. Sentir enojo es válido; dañar a otros no.'],
    ['facil', 'Autoestima', '¿Qué es la autoestima?', ['La valoración y el aprecio que tienes por ti mismo', 'Creerte mejor que los demás', 'Depender de la opinión de otros', 'Nunca cometer errores'],
      'Una autoestima sana reconoce fortalezas y áreas de mejora sin compararse ni menospreciar a nadie.'],
    ['facil', 'Convivencia', 'Un compañero nuevo come solo en el receso. ¿Qué acción favorece la convivencia?', ['Invitarlo a unirse a tu grupo', 'Ignorarlo porque no lo conoces', 'Burlarte de que está solo', 'Tomarle fotos sin permiso'],
      'Un gesto de inclusión puede cambiar el día de alguien. Así se construye un ambiente escolar seguro.'],
    ['media', 'Resolución de conflictos', 'Dos amigos discuten por un trabajo en equipo. ¿Qué paso es clave para resolver el conflicto?', ['Escuchar a ambas partes y buscar juntos un acuerdo justo', 'Darle la razón al que grite más', 'Dejar de hablarles a los dos', 'Contarlo en redes sociales'],
      'Escuchar con atención y buscar soluciones donde todos ganen es la base de la mediación.'],
    ['media', 'Comunicación', '¿Qué es la comunicación asertiva?', ['Expresar lo que piensas y sientes con respeto, sin agredir ni quedarte callado', 'Imponer tu opinión a toda costa', 'Callar siempre para evitar problemas', 'Hablar con sarcasmo'],
      'Ser asertivo es un punto medio entre la pasividad y la agresividad, por ejemplo: "Me siento… cuando… y te pido…".'],
    ['media', 'Mentalidad de crecimiento', 'Sacaste una calificación baja. ¿Qué pensamiento te ayuda más a mejorar?', ['"Puedo revisar en qué fallé y pedir ayuda para mejorar"', '"Nunca voy a poder con esto"', '"Todo es culpa del maestro"', '"Mejor me rindo"'],
      'Ver el error como aprendizaje (mentalidad de crecimiento) motiva a intentarlo de nuevo con nuevas estrategias.'],
    ['media', 'Convivencia digital', 'En un chat grupal se burlan de una compañera. ¿Qué respuesta muestra responsabilidad?', ['No participar, apoyarla y avisar a un adulto de confianza', 'Reenviar los mensajes a otros grupos', 'Reírte para no quedar mal', 'Agregar más memes'],
      'Quien observa también tiene poder: no sumarse y buscar ayuda puede detener el acoso.'],
    ['media', 'Autorregulación', '¿Qué significa autorregulación emocional?', ['Reconocer tus emociones y manejarlas para actuar de forma adecuada', 'Esconder lo que sientes para siempre', 'Explotar cuando algo te molesta', 'Dejar que otros controlen tus emociones'],
      'No se trata de no sentir, sino de elegir cómo expresar lo que sientes sin dañarte ni dañar a otros.'],
    ['dificil', 'Toma de decisiones', 'Tu mejor amigo te pide que mientas a sus padres para cubrirlo. Sientes presión. ¿Qué opción cuida la amistad y tus valores?', ['Decirle con respeto que no te sientes cómodo mintiendo y buscar juntos otra solución', 'Mentir para que no se enoje contigo', 'Contarle a todo el grupo lo que te pidió', 'Dejar de hablarle sin explicarle'],
      'Una amistad sana respeta los límites de ambos. Decir "no" con respeto también es cuidar al otro. No hay una única respuesta perfecta, pero esta protege a los dos.'],
    ['dificil', 'Empatía', 'Un integrante del equipo casi no participa. Antes de juzgarlo, ¿qué es lo más empático?', ['Preguntarle si tiene alguna dificultad y ofrecerle apoyo', 'Quitar su nombre del trabajo sin avisar', 'Quejarse de él con todo el salón', 'Hacer su parte y no decir nada nunca'],
      'Puede haber razones que no conocemos (problemas en casa, timidez). Preguntar abre el diálogo; después, el equipo puede acordar responsabilidades.'],
    ['dificil', 'Resiliencia', '¿Qué es la resiliencia?', ['La capacidad de adaptarse y salir adelante ante situaciones difíciles', 'No sentir dolor nunca', 'Evitar todos los problemas', 'Rendirse rápido para no sufrir'],
      'La resiliencia se fortalece con apoyo de otras personas, metas claras y aprendizaje de las experiencias.'],
    ['dificil', 'Responsabilidad', 'Tu equipo pierde un partido por un error tuyo y tus compañeros se molestan. ¿Qué es lo más constructivo?', ['Reconocer el error, ofrecer una disculpa y proponer cómo mejorar', 'Culpar al árbitro', 'Abandonar el equipo', 'Burlarte de los errores de otros'],
      'Asumir responsabilidad genera confianza. Todos cometemos errores; lo importante es aprender juntos.'],
    ['dificil', 'Derechos y convivencia', 'Alguien publica fotos de otra persona sin su permiso. ¿Qué derecho se está afectando?', ['El derecho a la privacidad y a la propia imagen', 'El derecho a la educación', 'El derecho al voto', 'El derecho a la vivienda'],
      'Cada persona decide sobre su imagen. Publicar sin consentimiento puede causar daño emocional y ser una falta grave.']
  ],

  /* ---------------- 8. RESEARCH ZONE ---------------- */
  res: [
    ['facil', 'Método científico', '¿Qué es una hipótesis?', ['Una posible explicación o respuesta que se pondrá a prueba', 'Una conclusión definitiva', 'Una opinión sin relación con el tema', 'El título de la investigación'],
      'La hipótesis es una suposición fundamentada que se comprueba o se rechaza con datos.'],
    ['facil', 'Método científico', '¿Cuál suele ser el primer paso del método científico?', ['Observar y plantear una pregunta', 'Publicar las conclusiones', 'Analizar los resultados', 'Comprobar la hipótesis'],
      'Toda investigación inicia con la observación de un fenómeno que despierta una pregunta.'],
    ['facil', 'Fuentes de información', '¿Qué fuente es más confiable para una investigación escolar?', ['Un artículo de una universidad o institución reconocida', 'Un meme en redes sociales', 'Un comentario anónimo', 'Un video sin fuentes'],
      'Las fuentes confiables tienen autor identificable, respaldo institucional y citan sus datos.'],
    ['facil', 'Técnicas de investigación', '¿Qué es una encuesta?', ['Un conjunto de preguntas que se aplican a personas para obtener información', 'Un experimento con sustancias químicas', 'Un resumen de un libro', 'Una opinión personal'],
      'Las encuestas permiten recopilar datos de muchas personas de forma ordenada.'],
    ['facil', 'Ética de la investigación', '¿Qué significa citar una fuente?', ['Indicar de dónde obtuviste la información y quién la escribió', 'Copiar un texto sin cambios', 'Inventar datos', 'Leer en voz alta'],
      'Citar da crédito a los autores y permite que otros verifiquen la información.'],
    ['media', 'Variables', 'Riegas plantas con distintas cantidades de agua para ver cuánto crecen. ¿Cuál es la variable INDEPENDIENTE?', ['La cantidad de agua', 'El crecimiento de la planta', 'El color de las hojas', 'La hora del día'],
      'La variable independiente es la que el investigador cambia a propósito; el crecimiento es la dependiente.'],
    ['media', 'Variables', 'Mides cuántos minutos tarda una pastilla en disolverse en agua a distintas temperaturas. ¿Cuál es la variable DEPENDIENTE?', ['El tiempo de disolución', 'La temperatura del agua', 'El tipo de vaso', 'La marca del agua'],
      'La variable dependiente es el resultado que se mide y que depende de los cambios en la independiente.'],
    ['media', 'Diseño experimental', '¿Para qué sirve un grupo de control en un experimento?', ['Para comparar con un grupo que no recibe el cambio que se estudia', 'Para vigilar a los participantes', 'Para tener más gente', 'Para que el experimento dure menos'],
      'Sin grupo de control no sabríamos si el efecto se debe a la variable estudiada o a otras causas.'],
    ['media', 'Datos', '¿Qué diferencia hay entre datos cuantitativos y cualitativos?', ['Los cuantitativos se expresan con números; los cualitativos describen cualidades', 'Los cualitativos siempre son más exactos', 'Son exactamente lo mismo', 'Los cuantitativos solo se usan en historia'],
      'Estatura en cm es cuantitativo; color favorito es cualitativo.'],
    ['media', 'Análisis de datos', 'En una encuesta, 30 de 120 estudiantes prefieren el voleibol. ¿Qué porcentaje representa?', ['25%', '30%', '40%', '12%'],
      '30 ÷ 120 = 0.25 = 25%.'],
    ['dificil', 'Diseño experimental', 'Hipótesis: "El ruido disminuye la concentración". ¿Qué diseño de experimento es más adecuado?', ['Aplicar la misma prueba a dos grupos similares, uno con ruido y otro en silencio', 'Preguntar a una persona si le gusta el ruido', 'Aplicar pruebas distintas a cada grupo', 'Medir solo al grupo con ruido'],
      'Para comparar, solo debe cambiar una variable (el ruido); todo lo demás debe ser igual.'],
    ['dificil', 'Conclusiones', '¿Qué debe cumplir una conclusión válida en una investigación?', ['Basarse en los datos obtenidos y responder la pregunta de investigación', 'Coincidir siempre con la hipótesis', 'Expresar solo la opinión del investigador', 'Ser lo más larga posible'],
      'Una hipótesis puede ser rechazada; eso también es un resultado valioso si los datos lo muestran.'],
    ['dificil', 'Ética de la investigación', '¿Qué es el plagio?', ['Presentar como propio el trabajo o las ideas de otra persona sin darle crédito', 'Citar correctamente a un autor', 'Parafrasear indicando la fuente', 'Hacer una encuesta'],
      'El plagio es una falta de honestidad académica. Se evita citando y parafraseando con referencia.'],
    ['dificil', 'Estadística', 'Resultados de 5 mediciones: 12, 15, 15, 18, 20. ¿Cuál es la MEDIANA?', ['15', '16', '18', '12'],
      'La mediana es el valor central con los datos ordenados: 12, 15, [15], 18, 20. (El promedio sería 16).'],
    ['dificil', 'Muestreo', 'Encuestas solo a tus 5 amigos y concluyes que "a todos los jóvenes de Oaxaca les gusta el futbol". ¿Cuál es el problema?', ['La muestra es muy pequeña y no es representativa', 'Usaste demasiadas personas', 'El futbol no se puede investigar', 'No hay ningún problema'],
      'Para generalizar se necesita una muestra suficientemente grande y variada de la población.']
  ],

  /* ---------------- 9. CAREER SIMULATOR ---------------- */
  career: [
    ['facil', 'Actitudes laborales', '¿Qué actitud es valorada en prácticamente cualquier trabajo?', ['La puntualidad y la responsabilidad', 'Llegar tarde con frecuencia', 'Evitar a los compañeros', 'No seguir instrucciones'],
      'La puntualidad y la responsabilidad generan confianza, sin importar la profesión.'],
    ['facil', 'Empleabilidad', '¿Qué es un currículum vitae (CV)?', ['Un documento que resume tu formación, experiencia y habilidades', 'Un contrato de trabajo', 'Un recibo de pago', 'Una carta de renuncia'],
      'El CV es tu carta de presentación ante un empleador; debe ser claro, ordenado y verdadero.'],
    ['facil', 'Cálculo comercial', 'Vendes 25 tamales a $15 cada uno. ¿Cuánto dinero ingresas?', ['$375', '$350', '$400', '$325'],
      'Ingreso = cantidad × precio = 25 × 15 = 375 pesos.'],
    ['facil', 'Organización', 'Para organizar tus tareas de la semana, ¿qué herramienta es más útil?', ['Una agenda o lista de pendientes con fechas', 'Confiar solo en tu memoria', 'Hacer todo la última noche', 'Ignorar las fechas de entrega'],
      'Escribir tareas con fechas ayuda a planear y evita el estrés de última hora.'],
    ['facil', 'Atención al cliente', 'Un cliente llega molesto. ¿Cuál es la mejor primera reacción?', ['Escucharlo con atención y respeto', 'Discutir con él', 'Ignorarlo', 'Decirle que se vaya'],
      'Escuchar con calma permite entender el problema y buscar una solución.'],
    ['media', 'Administración', 'Un negocio vendió $8,000 y tuvo gastos de $5,500. ¿Cuál fue su ganancia?', ['$2,500', '$13,500', '$3,500', '$2,000'],
      'Ganancia = ingresos − gastos = 8,000 − 5,500 = 2,500 pesos.'],
    ['media', 'Trabajo en equipo', '¿Qué caracteriza al trabajo en equipo efectivo?', ['Coordinar tareas, comunicarse y apoyarse para lograr una meta común', 'Que una sola persona haga todo', 'Competir entre los integrantes', 'No compartir información'],
      'Un equipo efectivo reparte responsabilidades y mantiene una comunicación constante.'],
    ['media', 'Organización', '¿Qué significa priorizar tareas?', ['Ordenarlas según su importancia y urgencia', 'Hacer primero lo más divertido', 'Hacer todas al mismo tiempo', 'Dejar las difíciles para nunca'],
      'Priorizar ayuda a usar mejor el tiempo: primero lo importante y urgente.'],
    ['media', 'Empleabilidad', 'En una entrevista de trabajo, ¿qué es recomendable?', ['Llegar a tiempo, presentarte con respeto y responder con honestidad', 'Mentir sobre tus habilidades', 'Usar el celular durante la entrevista', 'Hablar mal de tus empleos anteriores'],
      'La primera impresión cuenta: puntualidad, respeto y sinceridad muestran profesionalismo.'],
    ['media', 'Cálculo comercial', 'Producir un artículo cuesta $40 y lo vendes en $60. ¿Qué porcentaje de ganancia obtienes sobre el costo?', ['50%', '20%', '33%', '60%'],
      'Ganancia = 60 − 40 = 20. Porcentaje sobre el costo = 20 ÷ 40 = 0.5 = 50%.'],
    ['dificil', 'Presupuesto', 'Tienes $1,200 para un evento escolar: gastas $450 en comida, $380 en decoración y $250 en sonido. ¿Cuánto te sobra?', ['$120', '$220', '$180', '$100'],
      'Gastos: 450 + 380 + 250 = 1,080. Sobrante: 1,200 − 1,080 = 120 pesos.'],
    ['dificil', 'Seguridad laboral', 'Una máquina falla durante tu turno. ¿Qué es lo más adecuado?', ['Detenerla de forma segura, avisar al responsable y no repararla sin autorización', 'Seguir usándola hasta terminar', 'Intentar repararla tú solo sin experiencia', 'Irte sin avisar'],
      'La seguridad es primero: reportar evita accidentes y daños mayores.'],
    ['dificil', 'Emprendimiento', '¿Qué es emprender?', ['Iniciar un proyecto o negocio que resuelve una necesidad, asumiendo riesgos de forma planeada', 'Gastar todo el dinero en una idea sin planear', 'Copiar el negocio de alguien sin cambios', 'Esperar a que otros resuelvan los problemas'],
      'Emprender requiere identificar una necesidad, planear, calcular costos y aprender de los errores.'],
    ['dificil', 'Finanzas personales', 'Quieres ahorrar $3,000 en 6 meses ahorrando la misma cantidad cada mes. ¿Cuánto debes ahorrar al mes?', ['$500', '$600', '$300', '$450'],
      '3,000 ÷ 6 = 500 pesos por mes.'],
    ['dificil', 'Derechos laborales', 'Según la Constitución mexicana, ¿cuál es la edad mínima general para poder trabajar?', ['15 años', '12 años', '18 años', '21 años'],
      'El artículo 123 prohíbe el trabajo de menores de 15 años. Entre 15 y 18 hay protecciones especiales.']
  ]
};

/* Construye el banco final con IDs únicos, dificultad y puntos */
NV.QUESTIONS = [];
(function () {
  Object.keys(NV.RAW_QUESTIONS).forEach(function (worldId) {
    NV.RAW_QUESTIONS[worldId].forEach(function (row, i) {
      NV.QUESTIONS.push({
        id: worldId + '-' + String(i + 1).padStart(2, '0'),
        world: worldId,
        difficulty: row[0],
        category: row[1],
        text: row[2],
        options: row[3].slice(),   // options[0] es la correcta
        correct: 0,
        explanation: row[4],
        points: NV.DIFF_POINTS[row[0]]
      });
    });
  });
})();

NV.questionById = function (id) {
  for (var i = 0; i < NV.QUESTIONS.length; i++) if (NV.QUESTIONS[i].id === id) return NV.QUESTIONS[i];
  return null;
};
