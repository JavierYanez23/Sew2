/**
 * noticias.js — Sección de noticias sobre La Coruña mediante servicio web
 * Proyecto: Turismo en La Coruña | UO301366
 * Asignatura: Software y Estándares para la Web 2025/2026
 *
 * Requisitos del guión:
 *  - Consumo de Servicios Web en la página principal (index.html)
 *  - Paradigma OOP obligatorio; jQuery encapsulado dentro de clases
 *
 * API utilizada: GNews API (https://gnews.io) — plan gratuito
 *   Endpoint: https://gnews.io/api/v4/search
 *   Parámetros: q (búsqueda), lang, country, max, apikey
 *
 * NOTA: Sustituir GNEWS_API_KEY por tu clave gratuita obtenida en https://gnews.io
 *       Si la API no está disponible, se mostrará un mensaje de error informativo.
 */

"use strict";

/**
 * Clase Noticia
 * Representa una noticia individual obtenida del servicio web.
 */
class Noticia {
  /**
   * @param {string} titulo      - Titular de la noticia
   * @param {string} descripcion - Resumen de la noticia
   * @param {string} url         - URL del artículo original
   * @param {string} fuente      - Nombre del medio de comunicación
   * @param {string} fecha       - Fecha de publicación (ISO 8601)
   * @param {string} imagen      - URL de la imagen de portada (puede ser "")
   */
  constructor(titulo, descripcion, url, fuente, fecha, imagen) {
    this.titulo      = titulo;
    this.descripcion = descripcion;
    this.url         = url;
    this.fuente      = fuente;
    this.fecha       = fecha;
    this.imagen      = imagen;
  }

  /**
   * Formatea la fecha de publicación a formato legible en español.
   * @returns {string} Fecha en formato "DD de MMMM de YYYY"
   */
  fechaFormateada() {
    const opciones = { year: "numeric", month: "long", day: "numeric" };
    try {
      return new Date(this.fecha).toLocaleDateString("es-ES", opciones);
    } catch {
      return this.fecha;
    }
  }

  /**
   * Genera el elemento HTML del artículo de noticia como objeto jQuery.
   * Estructura semántica con <article>, <h3>, <p> y <a>.
   * @returns {jQuery} Elemento <article> con la noticia formateada
   */
  renderizar() {
    const articulo = $("<article></article>");

    const titulo = $("<h3></h3>").append(
      $("<a></a>")
        .attr({ href: this.url, target: "_blank", rel: "noopener noreferrer" })
        .text(this.titulo)
    );

    const meta = $("<p></p>").append(
      $("<time></time>")
        .attr("datetime", this.fecha)
        .text(`${this.fechaFormateada()} — ${this.fuente}`)
    );

    const descripcion = $("<p></p>").text(this.descripcion || "Sin descripción disponible.");

    const leerMas = $("<p></p>").append(
      $("<a></a>")
        .attr({ href: this.url, target: "_blank", rel: "noopener noreferrer" })
        .text("Leer noticia completa →")
    );

    articulo.append(titulo, meta, descripcion, leerMas);

    // Imagen opcional si la noticia la incluye
    if (this.imagen) {
      const figura = $("<figure></figure>").append(
        $("<img>").attr({
          src   : this.imagen,
          alt   : `Imagen de la noticia: ${this.titulo}`,
          width : "400",
          height: "220"
        })
      );
      articulo.prepend(figura);
    }

    return articulo;
  }
}

/**
 * Clase ServicioNoticias
 * Gestiona la obtención y visualización de noticias desde la API de GNews.
 */
class ServicioNoticias {
  /**
   * @param {string} apiKey       - Clave de la API de GNews
   * @param {string} consulta     - Término de búsqueda
   * @param {number} maxNoticias  - Número máximo de noticias a mostrar
   */
  constructor(apiKey, consulta, maxNoticias = 5) {
    this.apiKey      = apiKey;
    this.consulta    = consulta;
    this.maxNoticias = maxNoticias;
    this.$contenedor = null;
  }

  /**
   * Inicializa el servicio localizando el contenedor en el DOM
   * y lanzando la petición al servicio web.
   */
  inicializar() {
    // Localizar la sección de noticias por su encabezado
    this.$contenedor = $("section").filter(function () {
      return $(this).find("h2").text().trim() === "Noticias sobre La Coruña";
    });

    if (this.$contenedor.length === 0) {
      console.warn("ServicioNoticias: sección de noticias no encontrada.");
      return;
    }

    this._mostrarCargando();
    this._obtenerNoticias();
  }

  /**
   * Muestra un indicador de carga mientras se espera la respuesta del servicio.
   * @private
   */
  _mostrarCargando() {
    this.$contenedor.find("p").text("Cargando noticias... Por favor espere.");
  }

  /**
   * Realiza la petición AJAX a GNews API mediante jQuery ($.ajax).
   * @private
   */
  _obtenerNoticias() {
    const url = "https://gnews.io/api/v4/search";

    $.ajax({
      url     : url,
      method  : "GET",
      dataType: "json",
      data    : {
        q      : this.consulta,
        lang   : "es",
        country: "es",
        max    : this.maxNoticias,
        apikey : this.apiKey
      },
      success : (datos) => this._manejarExito(datos),
      error   : (xhr, estado, error) => this._manejarError(xhr, estado, error)
    });
  }

  /**
   * Procesa la respuesta exitosa del servicio y renderiza las noticias.
   * @param {Object} datos - Respuesta JSON de la API
   * @private
   */
  _manejarExito(datos) {
    // Limpiar el contenido de carga
    this.$contenedor.find("p").remove();

    if (!datos.articles || datos.articles.length === 0) {
      this.$contenedor.append(
        $("<p></p>").text("No se encontraron noticias recientes sobre La Coruña.")
      );
      return;
    }

    // Construir y renderizar cada noticia
    datos.articles.forEach((art) => {
      const noticia = new Noticia(
        art.title       || "Sin título",
        art.description || "",
        art.url         || "#",
        art.source?.name || "Fuente desconocida",
        art.publishedAt || "",
        art.image       || ""
      );
      this.$contenedor.append(noticia.renderizar());
    });
  }

  /**
   * Maneja el error de la petición mostrando un mensaje informativo al usuario.
   * @param {jQuery.jqXHR} xhr
   * @param {string}        estado
   * @param {string}        error
   * @private
   */
  _manejarError(xhr, estado, error) {
    console.error("ServicioNoticias error:", estado, error);
    this.$contenedor.find("p").html(
      "No se pudieron cargar las noticias en este momento. " +
      "Puedes consultar noticias sobre La Coruña en " +
      "<a href='https://www.lavozdegalicia.es' target='_blank' rel='noopener noreferrer'>" +
      "La Voz de Galicia</a>."
    );
  }
}

/**
 * Punto de entrada: se ejecuta cuando el DOM está listo.
 * IMPORTANTE: Sustituir "TU_API_KEY_AQUI" por tu clave de GNews.io
 */
$(function () {
  // ⚠️ SUSTITUIR por la clave real obtenida en https://gnews.io (plan gratuito)
  const API_KEY = "TU_API_KEY_AQUI";

  const servicio = new ServicioNoticias(
    API_KEY,
    "La Coruña turismo Galicia",
    5
  );
  servicio.inicializar();
});