/**
 * juego.js — Juego de 10 preguntas sobre los recursos turísticos de La Coruña
 * Proyecto: Turismo en La Coruña | UO301366
 * Asignatura: Software y Estándares para la Web 2025/2026
 *
 * Requisitos del guión:
 *  - ECMAScript PURO: sin jQuery ni ninguna otra biblioteca
 *  - Paradigma OOP obligatorio (clases, objetos, métodos)
 *  - 10 preguntas, cada una con 5 opciones y 1 respuesta correcta
 *  - Las preguntas versan sobre información contenida en el sitio web
 *  - El jugador DEBE responder todas las preguntas
 *  - Puntuación final de 0 a 10 (1 punto por acierto)
 */

"use strict";

/**
 * Clase Pregunta
 * Representa una pregunta del test con sus opciones y respuesta correcta.
 */
class Pregunta {
  /**
   * @param {string}   enunciado      - Texto de la pregunta
   * @param {string[]} opciones       - Array de 5 opciones de respuesta
   * @param {number}   indiceCorrecta - Índice (0-4) de la opción correcta
   */
  constructor(enunciado, opciones, indiceCorrecta) {
    if (opciones.length !== 5) {
      throw new Error(`La pregunta "${enunciado}" debe tener exactamente 5 opciones.`);
    }
    if (indiceCorrecta < 0 || indiceCorrecta > 4) {
      throw new Error("El índice de la respuesta correcta debe estar entre 0 y 4.");
    }
    this.enunciado      = enunciado;
    this.opciones       = opciones;
    this.indiceCorrecta = indiceCorrecta;
  }

  /**
   * Comprueba si la opción seleccionada es correcta.
   * @param {number} indiceSeleccionado - Índice de la opción elegida por el jugador
   * @returns {boolean}
   */
  esCorrecta(indiceSeleccionado) {
    return indiceSeleccionado === this.indiceCorrecta;
  }

  /**
   * Devuelve el texto de la respuesta correcta.
   * @returns {string}
   */
  respuestaCorrecta() {
    return this.opciones[this.indiceCorrecta];
  }
}

/**
 * Clase ResultadoRespuesta
 * Almacena el resultado de una respuesta del jugador para mostrar el resumen final.
 */
class ResultadoRespuesta {
  /**
   * @param {Pregunta} pregunta          - Pregunta respondida
   * @param {number}   indiceSeleccionado - Índice elegido por el jugador
   */
  constructor(pregunta, indiceSeleccionado) {
    this.pregunta           = pregunta;
    this.indiceSeleccionado = indiceSeleccionado;
    this.acertada           = pregunta.esCorrecta(indiceSeleccionado);
  }

  /**
   * Devuelve un resumen legible de la respuesta (útil para el informe final).
   * @returns {string}
   */
  descripcion() {
    const correcta = this.pregunta.respuestaCorrecta();
    const elegida  = this.pregunta.opciones[this.indiceSeleccionado];
    return `${this.acertada ? 'ACERTADA' : 'FALLADA'} — Elegida: "${elegida}"; Correcta: "${correcta}"`;
  }
}

/**
 * Clase Juego
 * Gestiona el flujo completo del test: presentación de preguntas,
 * recogida de respuestas, cálculo de puntuación y presentación de resultados.
 * Usa ECMAScript puro (DOM API nativa), sin jQuery.
 */
class Juego {
  /**
   * @param {Pregunta[]} preguntas - Array de 10 objetos Pregunta
   */
  constructor(preguntas) {
    if (preguntas.length !== 10) {
      throw new Error("El juego debe tener exactamente 10 preguntas.");
    }
    this.preguntas        = preguntas;
    this.indiceActual     = 0;
    this.respuestas       = [];
    this.$secPreguntas    = null;
    this.$secPuntuacion   = null;
  }

  /**
   * Inicializa el juego: localiza las secciones del DOM y arranca la primera pregunta.
   */
  inicializar() {
    // Localizar secciones por el texto del h2
    const secciones = document.querySelectorAll("section");
    secciones.forEach(sec => {
      const h2 = sec.querySelector("h2");
      if (!h2) return;
      const titulo = h2.textContent.trim();
      if (titulo === "Preguntas")       this.$secPreguntas  = sec;
      if (titulo === "Tu puntuación")   this.$secPuntuacion = sec;
    });

    if (!this.$secPreguntas || !this.$secPuntuacion) {
      console.warn("Juego: no se encontraron las secciones necesarias.");
      return;
    }

    // Ocultar la sección de puntuación hasta el final
    this.$secPuntuacion.style.display = "none";

    this._mostrarPregunta();
  }

  /**
   * Renderiza la pregunta actual en el DOM.
   * @private
   */
  _mostrarPregunta() {
    const pregunta = this.preguntas[this.indiceActual];
    const total    = this.preguntas.length;

    // Limpiar contenido anterior de la sección (excepto el h2)
    const h2 = this.$secPreguntas.querySelector("h2");
    this.$secPreguntas.innerHTML = "";
    this.$secPreguntas.appendChild(h2);

    // Indicador de progreso
    const progreso = document.createElement("p");
    progreso.textContent = `Pregunta ${this.indiceActual + 1} de ${total}`;
    this.$secPreguntas.appendChild(progreso);

    // Barra de progreso accesible
    const barraContenedor = document.createElement("p");
    const barra = document.createElement("progress");
    barra.setAttribute("max", total.toString());
    barra.setAttribute("value", this.indiceActual.toString());
    barra.setAttribute("aria-label", `Progreso: pregunta ${this.indiceActual + 1} de ${total}`);
    barraContenedor.appendChild(barra);
    this.$secPreguntas.appendChild(barraContenedor);

    // Enunciado de la pregunta
    const enunciado = document.createElement("p");
    const fuerte    = document.createElement("strong");
    fuerte.textContent = pregunta.enunciado;
    enunciado.appendChild(fuerte);
    this.$secPreguntas.appendChild(enunciado);

    // Opciones de respuesta como fieldset + radiobuttons accesibles
    const fieldset  = document.createElement("fieldset");
    const leyenda   = document.createElement("legend");
    leyenda.textContent = "Selecciona una respuesta:";
    fieldset.appendChild(leyenda);

    pregunta.opciones.forEach((opcion, indice) => {
      const label = document.createElement("label");
      const radio  = document.createElement("input");
      radio.setAttribute("type", "radio");
      radio.setAttribute("name", "respuesta");
      radio.setAttribute("value", indice.toString());
      label.appendChild(radio);
      label.appendChild(document.createTextNode(` ${opcion}`));
      const parrafo = document.createElement("p");
      parrafo.appendChild(label);
      fieldset.appendChild(parrafo);
    });

    this.$secPreguntas.appendChild(fieldset);

    // Botón de confirmación
    const botonSiguiente = document.createElement("button");
    botonSiguiente.setAttribute("type", "button");
    botonSiguiente.textContent =
      this.indiceActual < total - 1 ? "Siguiente pregunta →" : "Ver mi puntuación";
    botonSiguiente.addEventListener("click", () => this._confirmarRespuesta(fieldset));
    this.$secPreguntas.appendChild(botonSiguiente);
  }

  /**
   * Valida y registra la respuesta seleccionada, luego avanza.
   * @param {HTMLFieldSetElement} fieldset - Fieldset con los radio buttons
   * @private
   */
  _confirmarRespuesta(fieldset) {
    const seleccionado = fieldset.querySelector("input[name='respuesta']:checked");

    // Es OBLIGATORIO responder cada pregunta (requisito del guión)
    if (!seleccionado) {
      this._mostrarAlerta("⚠️ Debes seleccionar una respuesta antes de continuar.");
      return;
    }

    const indiceSeleccionado = Number.parseInt(seleccionado.value, 10);
    const pregunta           = this.preguntas[this.indiceActual];
    this.respuestas.push(new ResultadoRespuesta(pregunta, indiceSeleccionado));

    this.indiceActual++;

    if (this.indiceActual < this.preguntas.length) {
      this._mostrarPregunta();
    } else {
      this._mostrarResultados();
    }
  }

  /**
   * Muestra un mensaje de alerta accesible al usuario.
   * @param {string} mensaje
   * @private
   */
  _mostrarAlerta(mensaje) {
    // Eliminar alerta anterior si existe
    const alertaAnterior = this.$secPreguntas.querySelector("[role='alert']");
    if (alertaAnterior) alertaAnterior.remove();

    const alerta = document.createElement("p");
    alerta.setAttribute("role", "alert");
    alerta.setAttribute("aria-live", "assertive");
    alerta.textContent = mensaje;
    this.$secPreguntas.appendChild(alerta);
  }

  /**
   * Calcula la puntuación final y muestra el resumen de resultados.
   * @private
   */
  _mostrarResultados() {
    // Ocultar sección de preguntas
    this.$secPreguntas.style.display = "none";

    // Mostrar sección de puntuación
    this.$secPuntuacion.style.display = "";

    const h2 = this.$secPuntuacion.querySelector("h2");
    this.$secPuntuacion.innerHTML = "";
    this.$secPuntuacion.appendChild(h2);

    const aciertos   = this.respuestas.filter(r => r.acertada).length;
    const total      = this.preguntas.length;
    const puntuacion = aciertos;  // 1 punto por acierto, 0 por fallo

    // Mensaje de puntuación
    const msgPuntuacion = document.createElement("p");
    const spanPuntuacion = document.createElement("strong");
    spanPuntuacion.textContent = `Tu puntuación: ${puntuacion} / ${total}`;
    msgPuntuacion.appendChild(spanPuntuacion);
    this.$secPuntuacion.appendChild(msgPuntuacion);

    // Comentario según la puntuación
    const comentario = document.createElement("p");
    comentario.textContent = this._comentarioPuntuacion(puntuacion);
    this.$secPuntuacion.appendChild(comentario);

    // Tabla de resumen detallado
    const tabla = document.createElement("table");
    const caption = document.createElement("caption");
    caption.textContent = "Resumen de tus respuestas";
    tabla.appendChild(caption);

    const thead = document.createElement("thead");
    const filaTh = document.createElement("tr");
    ["#", "Pregunta", "Tu respuesta", "Correcta", "Resultado"].forEach(texto => {
      const th = document.createElement("th");
      th.setAttribute("scope", "col");
      th.textContent = texto;
      filaTh.appendChild(th);
    });
    thead.appendChild(filaTh);
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");
    this.respuestas.forEach((resultado, i) => {
      const fila = document.createElement("tr");
      const celdas = [
        (i + 1).toString(),
        resultado.pregunta.enunciado,
        resultado.pregunta.opciones[resultado.indiceSeleccionado],
        resultado.pregunta.respuestaCorrecta(),
        resultado.acertada ? "✅ Correcto" : "❌ Incorrecto"
      ];
      celdas.forEach((texto, j) => {
        const celda = j === 0
          ? document.createElement("th")
          : document.createElement("td");
        if (j === 0) celda.setAttribute("scope", "row");
        celda.textContent = texto;
        fila.appendChild(celda);
      });
      tbody.appendChild(fila);
    });
    tabla.appendChild(tbody);
    this.$secPuntuacion.appendChild(tabla);

    // Botón para jugar de nuevo
    const botonReiniciar = document.createElement("button");
    botonReiniciar.setAttribute("type", "button");
    botonReiniciar.textContent = "Jugar de nuevo";
    botonReiniciar.addEventListener("click", () => this._reiniciar());
    this.$secPuntuacion.appendChild(botonReiniciar);

    // Scroll suave a los resultados
    this.$secPuntuacion.scrollIntoView({ behavior: "smooth" });
  }

  /**
   * Devuelve un comentario motivador según la puntuación obtenida.
   * @param {number} puntuacion
   * @returns {string}
   * @private
   */
  _comentarioPuntuacion(puntuacion) {
    if (puntuacion === 10) return "¡Perfecto! Eres un experto en los recursos turísticos de La Coruña.";
    if (puntuacion >= 8)  return "¡Muy bien! Conoces La Coruña a fondo.";
    if (puntuacion >= 6)  return "¡Bien! Pero aún puedes descubrir más sobre la provincia.";
    if (puntuacion >= 4)  return "No está mal, pero te recomendamos explorar más el sitio web.";
    return "¡Sigue leyendo! La Coruña tiene muchas cosas que descubrir.";
  }

  /**
   * Reinicia el juego al estado inicial.
   * @private
   */
  _reiniciar() {
    this.indiceActual = 0;
    this.respuestas   = [];
    this.$secPuntuacion.style.display = "none";
    this.$secPreguntas.style.display  = "";
    this._mostrarPregunta();
    this.$secPreguntas.scrollIntoView({ behavior: "smooth" });
  }
}

/**
 * Definición de las 10 preguntas del juego.
 * Todas las preguntas versan sobre información del sitio web del proyecto
 * (gastronomía, rutas, Torre de Hércules, meteorología, historia...).
 */
const PREGUNTAS = [
  new Pregunta(
    "¿En qué siglo fue construida la Torre de Hércules de La Coruña?",
    [
      "Siglo V a.C.",
      "Siglo I a.C.",
      "Siglo II d.C.",
      "Siglo X d.C.",
      "Siglo XV d.C."
    ],
    2  // "Siglo II d.C."
  ),
  new Pregunta(
    "¿Qué organismo declaró la Torre de Hércules Patrimonio de la Humanidad?",
    [
      "La Unión Europea",
      "El Gobierno de España",
      "La Xunta de Galicia",
      "La UNESCO",
      "El Consejo de Europa"
    ],
    3  // "La UNESCO"
  ),
  new Pregunta(
    "¿Cuál es el plato más emblemático de la gastronomía coruñesa?",
    [
      "Caldo gallego",
      "Lacón con grelos",
      "Pulpo á feira",
      "Empanada de zamburiñas",
      "Merluza en salsa verde"
    ],
    2  // "Pulpo á feira"
  ),
  new Pregunta(
    "¿Cómo se llaman las patatas cocidas con piel que acompañan al pulpo á feira?",
    [
      "Cachelos",
      "Grelos",
      "Zamburiñas",
      "Orujo",
      "Lacón"
    ],
    0  // "Cachelos"
  ),
  new Pregunta(
    "¿Cuántos kilómetros aproximados tiene el Paseo Marítimo de La Coruña?",
    [
      "3 km",
      "5 km",
      "8 km",
      "13 km",
      "20 km"
    ],
    3  // "13 km"
  ),
  new Pregunta(
    "¿Cuál es el nombre del camino jacobeo que parte desde La Coruña hacia Santiago?",
    [
      "Camino Francés",
      "Camino del Norte",
      "Camino Inglés",
      "Camino Primitivo",
      "Camino Portugués"
    ],
    2  // "Camino Inglés"
  ),
  new Pregunta(
    "¿En qué municipio se encuentra uno de los cascos históricos medievales mejor conservados de Galicia, famoso también por su tortilla?",
    [
      "Sada",
      "Miño",
      "Betanzos",
      "Padrón",
      "Ferrol"
    ],
    2  // "Betanzos"
  ),
  new Pregunta(
    "¿Qué tipo de molusco producen las bateas de la ría de Sada?",
    [
      "Ostras",
      "Almejas",
      "Berberechos",
      "Mejillones",
      "Zamburiñas"
    ],
    3  // "Mejillones"
  ),
  new Pregunta(
    "¿Qué ruta de las descritas en el sitio web recorre La Coruña, Sada, Miño y Betanzos en bicicleta?",
    [
      "Ruta de la Torre de Hércules y la Costa Atlántica",
      "Ruta del Camino Inglés",
      "Ruta en Bicicleta por las Rías Altas",
      "Ruta Gastronómica de la Ría",
      "Ruta del Faro Atlántico"
    ],
    2  // "Ruta en Bicicleta por las Rías Altas"
  ),
  new Pregunta(
    "¿Cuál de las siguientes opciones NO es una especialidad gastronómica típica de La Coruña recogida en el sitio web?",
    [
      "Empanada gallega",
      "Caldo gallego",
      "Fabada asturiana",
      "Lacón con grelos",
      "Merluza en salsa verde"
    ],
    2  // "Fabada asturiana" (es asturiana, no coruñesa)
  )
];

/**
 * Punto de entrada: se ejecuta cuando el DOM está completamente cargado.
 * ECMAScript puro, sin jQuery.
 */
document.addEventListener("DOMContentLoaded", function () {
  const juego = new Juego(PREGUNTAS);
  juego.inicializar();
});