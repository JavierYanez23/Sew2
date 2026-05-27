"use strict";

/**
 * Clase Diapositiva
 * Representa una imagen del carrusel con su información asociada.
 */
class Diapositiva {
  /**
   * @param {string} src   - Ruta relativa a la imagen (dentro de multimedia/)
   * @param {string} alt   - Texto alternativo accesible de la imagen
   * @param {string} titulo - Título descriptivo mostrado como pie de foto
   */
  constructor(src, alt, titulo) {
    this.src    = src;
    this.alt    = alt;
    this.titulo = titulo;
  }

  /**
   * Genera el elemento HTML de la diapositiva como objeto jQuery.
   * @returns {jQuery} Elemento <figure> con <img> y <figcaption>
   */
  renderizar() {
    const figura      = $("<figure></figure>");
    const imagen      = $("<img>").attr({
      src   : this.src,
      alt   : this.alt,
      width : "900",
      height: "500"
    });
    const descripcion = $("<figcaption></figcaption>").text(this.titulo);

    figura.append(imagen).append(descripcion);
    return figura;
  }
}

/**
 * Clase Carrusel
 * Gestiona la visualización de un conjunto de diapositivas con navegación
 * manual (botones anterior/siguiente) y reproducción automática opcional.
 */
class Carrusel {
  /**
   * @param {Diapositiva[]} diapositivas - Array de objetos Diapositiva
   * @param {number}        intervalo    - Milisegundos entre cambios automáticos (0 = desactivado)
   */
  constructor(diapositivas, intervalo = 4000) {
    this.diapositivas    = diapositivas;
    this.indiceActual    = 0;
    this.intervalo       = intervalo;
    this.temporizador    = null;
    this.$contenedor     = null;
    this.$displayImagen  = null;
    this.$indicadores    = null;
  }

  /**
   * Inicializa el carrusel en el DOM.
   * Busca la sección con encabezado "Galería de la Provincia",
   * sustituye el <figure> estático por el contenido dinámico
   * y conecta los botones de navegación.
   */
  inicializar() {
    this.$contenedor = $("section").filter(function () {
      return $(this).find("h2").text().trim() === "Galería de la Provincia";
    });

    if (this.$contenedor.length === 0) {
      console.warn("Carrusel: no se encontró la sección 'Galería de la Provincia'.");
      return;
    }

    this.$displayImagen = $("<div></div>")
    .attr("aria-live", "polite");

    this.$contenedor.find("figure").replaceWith(this.$displayImagen);

    this.$indicadores = $("<nav></nav>")
    .attr("aria-label", "Indicadores del carrusel");
    this.diapositivas.forEach((_, i) => {
      const punto = $("<button></button>")
        .attr("type", "button")
        .attr("aria-label", `Ir a la diapositiva ${i + 1}`)
        .text("●");
      punto.on("click", () => this.irA(i));
      this.$indicadores.append(punto);
    });
    this.$contenedor.find("p").first().before(this.$indicadores);

    const $botones = this.$contenedor.find("button[type='button']");
    $botones.filter(":contains('Anterior')").on("click", () => this.anterior());
    $botones.filter(":contains('Siguiente')").on("click", () => this.siguiente());

    $(document).on("keydown", (e) => {
      if (e.key === "ArrowLeft")  this.anterior();
      if (e.key === "ArrowRight") this.siguiente();
    });

    this.mostrar(0);

    if (this.intervalo > 0) {
      this.iniciarAuto();
    }
  }

  /**
   * Muestra la diapositiva en el índice indicado.
   * @param {number} indice - Índice de la diapositiva a mostrar
   */
  mostrar(indice) {
    this.indiceActual = (indice + this.diapositivas.length) % this.diapositivas.length;
    const diap = this.diapositivas[this.indiceActual];

    this.$displayImagen
      .fadeOut(250, () => {
        this.$displayImagen.empty().append(diap.renderizar()).fadeIn(400);
      });

    if (this.$indicadores) {
      this.$indicadores.find("button").each((i, btn) => {
        $(btn).css("opacity", i === this.indiceActual ? "1" : "0.4");
      });
    }
  }

  /** Avanza a la siguiente diapositiva. */
  siguiente() {
    this.reiniciarAuto();
    this.mostrar(this.indiceActual + 1);
  }

  /** Retrocede a la diapositiva anterior. */
  anterior() {
    this.reiniciarAuto();
    this.mostrar(this.indiceActual - 1);
  }

  /**
   * Salta directamente a una diapositiva por índice.
   * @param {number} indice
   */
  irA(indice) {
    this.reiniciarAuto();
    this.mostrar(indice);
  }

  /** Inicia la reproducción automática. */
  iniciarAuto() {
    this.temporizador = setInterval(() => this.siguiente(), this.intervalo);
  }

  /** Detiene la reproducción automática. */
  detenerAuto() {
    if (this.temporizador !== null) {
      clearInterval(this.temporizador);
      this.temporizador = null;
    }
  }

  /** Reinicia el temporizador de reproducción automática. */
  reiniciarAuto() {
    this.detenerAuto();
    if (this.intervalo > 0) {
      this.iniciarAuto();
    }
  }
}

/**
 * Punto de entrada: se ejecuta cuando el DOM está listo.
 * Define las diapositivas y arranca el carrusel.
 */
$(function () {
  const diapositivas = [
    new Diapositiva(
      "multimedia/imagenes/torre_de_hercules_al_atardecer.jpg",
      "Torre de Hércules al atardecer, faro romano Patrimonio de la Humanidad de La Coruña",
      "Torre de Hércules — Faro romano del siglo II d.C., Patrimonio de la Humanidad UNESCO"
    ),
    new Diapositiva(
      "multimedia/imagenes/paseo_maritimo_de_la_coruna.jpg",
      "Paseo Marítimo de La Coruña con el Atlántico al fondo y paseantes",
      "Paseo Marítimo — Uno de los paseos costeros más largos de Europa (13 km)"
    ),
    new Diapositiva(
      "multimedia/imagenes/playa_de_riazor.jpg",
      "Playa de Riazor con arena blanca y aguas del Atlántico en un día soleado",
      "Playa de Riazor — La playa urbana más emblemática de La Coruña"
    ),
    new Diapositiva(
      "multimedia/imagenes/galerias_de_cristal.jpg",
      "Casco antiguo de La Coruña con sus galerías de cristal características",
      "Ciudad de Cristal — Las galerías acristaladas del casco antiguo, símbolo de la ciudad"
    ),
    new Diapositiva(
      "multimedia/imagenes/situacion_la_coruna.png",
      "Mapa de situación de la provincia de La Coruña en el noroeste de España, en Galicia",
      "Situación — La Coruña se encuentra en el extremo noroeste de la Península Ibérica"
    )
  ];

  const carrusel = new Carrusel(diapositivas, 4500);
  carrusel.inicializar();
});