"use strict";

/**
 * Clase BaseRuta
 * Clase base que proporciona el método auxiliar _texto compartido
 * por HitoRuta y Ruta, evitando duplicación de código.
 */
class BaseRuta {
  /**
   * Obtiene el texto del primer elemento hijo con el tag indicado.
   * @param {Element} nodo - Nodo XML padre
   * @param {string}  tag  - Nombre del tag hijo a buscar
   * @returns {string}
   */
  _texto(nodo, tag) {
    if (!nodo) return "";
    const hijo = nodo.querySelector(tag);
    return hijo ? hijo.textContent : "";
  }
}

/**
 * Clase HitoRuta
 * Representa un hito turístico dentro de una ruta.
 */
class HitoRuta extends BaseRuta {
  /**
   * @param {Element} nodoXML - Nodo <hito> del XML parseado
   */
  constructor(nodoXML) {
    super();
    this.orden       = nodoXML.getAttribute("orden") || "1";
    this.nombre      = this._texto(nodoXML, "nombre");
    this.descripcion = this._texto(nodoXML, "descripcion").trim().replace(/\s+/g, " ");
    const coord      = nodoXML.querySelector("coordenadas");
    this.longitud    = Number.parseFloat(this._texto(coord, "longitud") || "0");
    this.latitud     = Number.parseFloat(this._texto(coord, "latitud")  || "0");
    this.altitud     = Number.parseFloat(this._texto(coord, "altitud")  || "0");
    const distElem   = nodoXML.querySelector("distanciaDesdeAnterior");
    this.distancia   = distElem ? distElem.textContent.trim() : "0";
    this.unidades    = distElem ? (distElem.getAttribute("unidades") || "m") : "m";
    this.fotos       = Array.from(nodoXML.querySelectorAll("fotos foto"))
                           .map(f => f.textContent.trim());
    this.videos      = Array.from(nodoXML.querySelectorAll("videos video"))
                           .map(v => v.textContent.trim());
  }

  /**
   * Genera el HTML de este hito como objeto jQuery.
   * @returns {jQuery}
   */
  renderizar() {
    const art = $("<article></article>");

    art.append($("<h4></h4>").text(`${this.orden}. ${this.nombre}`));
    art.append($("<p></p>").text(this.descripcion));

    const dl = $("<dl></dl>");
    dl.append($("<dt></dt>").text("Distancia desde el hito anterior"));
    dl.append($("<dd></dd>").text(`${this.distancia} ${this.unidades}`));
    dl.append($("<dt></dt>").text("Coordenadas"));
    dl.append($("<dd></dd>").text(
      `Lat: ${this.latitud}, Lon: ${this.longitud}, Alt: ${this.altitud} m`
    ));
    art.append(dl);

    if (this.fotos.length > 0) {
      art.append($("<p></p>").append($("<strong></strong>").text("Fotografías:")));
      const galeria = $("<ul></ul>");
      this.fotos.forEach(foto => {
        const li  = $("<li></li>");
        const fig = $("<figure></figure>").append(
          $("<img>").attr({
            src   : `multimedia/imagenes/${foto}`,
            alt   : `Fotografía del hito ${this.nombre}: ${foto}`,
            width : "280",
            height: "180"
          }),
          $("<figcaption></figcaption>").text(foto)
        );
        li.append(fig);
        galeria.append(li);
      });
      art.append(galeria);
    }

    if (this.videos.length > 0) {
      art.append($("<p></p>").append($("<strong></strong>").text("Vídeos:")));
      this.videos.forEach(video => {
        const fig = $("<figure></figure>");
        const vid = $("<video></video>").attr({
          controls: true,
          width   : "400",
          height  : "225"
        });
        vid.append(
          $("<source>").attr({
            src : `multimedia/videos/${video}`,
            type: video.endsWith(".webm") ? "video/webm" : "video/mp4"
          })
        );
        vid.append(`<p>Tu navegador no soporta vídeo HTML5. <a href="multimedia/videos/${video}">Descargar</a></p>`);
        fig.append(vid, $("<figcaption></figcaption>").text(video));
        art.append(fig);
      });
    }

    return art;
  }
}

/**
 * Clase Ruta
 * Representa una ruta turística completa con todos sus datos del XML.
 */
class Ruta extends BaseRuta {
  /**
   * @param {Element} nodoXML - Nodo <ruta> del XML parseado
   */
  constructor(nodoXML) {
    super();
    this.id           = nodoXML.getAttribute("id") || "";
    this.nombre       = this._texto(nodoXML, "nombre");
    this.tipo         = this._texto(nodoXML, "tipo");
    this.transporte   = this._texto(nodoXML, "transporte");
    this.fechaInicio  = this._texto(nodoXML, "fechaInicio");
    this.horaInicio   = this._texto(nodoXML, "horaInicio");
    this.duracion     = this._texto(nodoXML, "duracion");
    this.agencia      = this._texto(nodoXML, "agencia");
    this.descripcion  = this._texto(nodoXML, "descripcion").trim().replace(/\s+/g, " ");
    this.personas     = this._texto(nodoXML, "personas");
    this.lugarInicio  = this._texto(nodoXML, "lugarInicio");
    this.direccion    = this._texto(nodoXML, "direccionInicio");
    this.recomendacion = this._texto(nodoXML, "recomendacion");
    this.planimetria  = nodoXML.querySelector("planimetria")?.getAttribute("archivo") || "";
    this.altimetria   = nodoXML.querySelector("altimetria")?.getAttribute("archivo") || "";

    const coordIni    = nodoXML.querySelector("coordenadasInicio");
    this.latInicio    = Number.parseFloat(this._texto(coordIni, "latitud")  || "43.36");
    this.lonInicio    = Number.parseFloat(this._texto(coordIni, "longitud") || "-8.41");
    this.altInicio    = Number.parseFloat(this._texto(coordIni, "altitud")  || "0");

    this.referencias  = Array.from(nodoXML.querySelectorAll("referencias referencia"))
                            .map(r => r.textContent.trim());

    this.hitos = Array.from(nodoXML.querySelectorAll("hitos hito"))
                     .map(h => new HitoRuta(h));
  }

  /**
   * Genera el HTML completo de la ficha de ruta como objeto jQuery.
   * @returns {jQuery}
   */
  renderizarFicha() {
    const seccion = $("<section></section>");
    seccion.append($("<h3></h3>").text(this.nombre));

    const tabla = $("<table></table>");
    tabla.append($("<caption></caption>").text(`Ficha de la ruta: ${this.nombre}`));
    const thead = $("<thead></thead>").append(
      $("<tr></tr>").append(
        $("<th></th>").attr("scope", "col").text("Campo"),
        $("<th></th>").attr("scope", "col").text("Información")
      )
    );
    tabla.append(thead);

    const tbody = $("<tbody></tbody>");
    const filas = [
      ["Tipo de ruta",   this.tipo],
      ["Transporte",     this.transporte],
      ["Duración",       this.duracion],
      ["Agencia",        this.agencia],
      ["Apta para",      this.personas],
      ["Lugar de inicio",this.lugarInicio],
      ["Dirección",      this.direccion],
      ["Recomendación",  `${this.recomendacion} / 10`]
    ];
    if (this.fechaInicio) filas.push(["Fecha de inicio", this.fechaInicio]);
    if (this.horaInicio)  filas.push(["Hora de inicio",  this.horaInicio]);

    filas.forEach(([campo, valor]) => {
      tbody.append(
        $("<tr></tr>").append(
          $("<th></th>").attr("scope", "row").text(campo),
          $("<td></td>").text(valor)
        )
      );
    });
    tabla.append(tbody);
    seccion.append(tabla);

    seccion.append($("<h4></h4>").text("Descripción"));
    seccion.append($("<p></p>").text(this.descripcion));

    seccion.append($("<h4></h4>").text("Fuentes y referencias"));
    const listaRef = $("<ol></ol>");
    this.referencias.forEach(ref => {
      listaRef.append(
        $("<li></li>").append(
          $("<a></a>").attr({ href: ref, target: "_blank", rel: "noopener noreferrer" }).text(ref)
        )
      );
    });
    seccion.append(listaRef);

    seccion.append($("<h4></h4>").text(`Hitos de la ruta (${this.hitos.length})`));
    this.hitos.forEach(hito => seccion.append(hito.renderizar()));

    return seccion;
  }
}

/**
 * Clase GestorMapas
 * Gestiona la visualización de mapas OpenLayers con el archivo KML de cada ruta.
 * Usa OpenLayers + OpenStreetMap (gratuito, sin API Key personal).
 */
class GestorMapas {
  constructor() {
    this.mapaActual = null;
  }

  /**
   * Carga el script de OpenLayers dinámicamente si no está ya cargado.
   * @returns {jQuery.Deferred}
   */
  cargarOpenLayers() {
    const deferred = $.Deferred();
    if (typeof ol !== "undefined") {
      deferred.resolve();
      return deferred.promise();
    }
    $("<link>").attr({
      rel : "stylesheet",
      href: "https://cdn.jsdelivr.net/npm/ol@v9.2.4/ol.css"
    }).appendTo("head");

    $.getScript("https://cdn.jsdelivr.net/npm/ol@v9.2.4/dist/ol.js")
      .done(() => deferred.resolve())
      .fail(() => deferred.reject("No se pudo cargar OpenLayers"));

    return deferred.promise();
  }

  /**
   * Renderiza el mapa de planimetría de una ruta en el div del HTML.
   * @param {Ruta}   ruta          - Objeto Ruta con los datos
   * @param {string} idContenedor  - id del div donde renderizar el mapa
   */
  renderizarMapa(ruta, idContenedor) {
    const $div = $(`#${idContenedor}`);
    $div.empty().css({ width: "100%", height: "420px" });

    this.cargarOpenLayers().done(() => {
      const capaOSM = new ol.layer.Tile({
        source: new ol.source.OSM()
      });

      const capaKML = new ol.layer.Vector({
        source: new ol.source.Vector({
          url   : `xml/${ruta.planimetria}`,
          format: new ol.format.KML({ extractStyles: true })
        })
      });

      if (this.mapaActual) {
        this.mapaActual.setTarget(null);
      }

      this.mapaActual = new ol.Map({
        target: idContenedor,
        layers: [capaOSM, capaKML],
        view  : new ol.View({
          center: ol.proj.fromLonLat([ruta.lonInicio, ruta.latInicio]),
          zoom  : 12
        })
      });

      capaKML.getSource().once("change", () => {
        const extent = capaKML.getSource().getExtent();
        if (extent && Number.isFinite(extent[0])) {
          this.mapaActual.getView().fit(extent, {
            padding : [40, 40, 40, 40],
            maxZoom : 15
          });
        }
      });
    }).fail((msg) => {
      $div.text(`No se pudo cargar el mapa: ${msg}`);
    });
  }
}

/**
 * Clase GestorAltimetria
 * Gestiona la incrustación del SVG de altimetría de cada ruta en el HTML.
 */
class GestorAltimetria {
  /**
   * Carga e incrusta el SVG de altimetría en la sección correspondiente.
   * @param {Ruta}   ruta      - Objeto Ruta con referencia al archivo SVG
   * @param {jQuery} $seccion  - Sección del DOM donde insertar el SVG
   */
  renderizarSVG(ruta, $seccion) {
    $seccion.find("p").last().text("Cargando altimetría...");

    $.ajax({
      url     : `xml/${ruta.altimetria}`,
      dataType: "text",
      success : (svgText) => {
        $seccion.find("p").last().remove();
        const figura = $("<figure></figure>");
        figura.append(svgText);
        figura.append(
          $("<figcaption></figcaption>").text(`Perfil altimétrico: ${ruta.nombre}`)
        );
        $seccion.append(figura);
      },
      error   : () => {
        $seccion.find("p").last().text(
          "No se pudo cargar el perfil altimétrico. " +
          "Ejecute primero generar_svg.py para generar el archivo SVG."
        );
      }
    });
  }
}

/**
 * Clase GestorRutas
 * Clase principal: coordina la carga del XML, la generación del HTML
 * de las rutas, el mapa KML y el SVG de altimetría.
 */
class GestorRutas {
  constructor() {
    this.rutas            = [];
    this.rutaSeleccionada = null;
    this.gestorMapas      = new GestorMapas();
    this.gestorAlti       = new GestorAltimetria();
    this.$secRutas        = null;
    this.$secPlanimetria  = null;
    this.$secAltimetria   = null;
    this.$areaDetalle     = null;
  }

  /**
   * Inicializa el gestor: localiza secciones y carga el XML.
   */
  inicializar() {
    $("section").each((_, sec) => {
      const titulo = $(sec).find("h2").text().trim();
      if (titulo === "Rutas Turísticas por La Coruña") this.$secRutas       = $(sec);
      if (titulo === "Planimetría")                    this.$secPlanimetria = $(sec);
      if (titulo === "Altimetría")                     this.$secAltimetria  = $(sec);
    });

    if (!this.$secRutas) {
      console.warn("GestorRutas: sección de rutas no encontrada.");
      return;
    }

    this._cargarXML();
  }

  /**
   * Carga el archivo rutas.xml mediante jQuery AJAX.
   * Se recibe como texto y se parsea con DOMParser para evitar
   * problemas con la declaración DOCTYPE del XML.
   * @private
   */
  _cargarXML() {
    $.ajax({
      url     : "xml/rutas.xml",
      dataType: "text",
      success : (textoXML) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(textoXML, "text/xml");
        const errorNodo = xmlDoc.querySelector("parsererror");
        if (errorNodo) {
          console.error("GestorRutas: XML inválido:", errorNodo.textContent);
          this.$secRutas.find("p").last().text(
            "Error al parsear rutas.xml. Revisa la consola para más detalles."
          );
          return;
        }
        this._procesarXML(xmlDoc);
      },
      error   : (xhr, estado, error) => {
        console.error("GestorRutas: error al cargar rutas.xml:", estado, error);
        this.$secRutas.find("p").last().html(
          "<strong>Error:</strong> No se pudo cargar rutas.xml. " +
          "Asegúrate de que el servidor local está en ejecución " +
          "(<code>python3 -m http.server 8080</code>) o usa el Live Server de VSCode."
        );
      }
    });
  }

  /**
   * Procesa el documento XML y construye los objetos Ruta.
   * @param {XMLDocument} xmlDoc
   * @private
   */
  _procesarXML(xmlDoc) {
    const nodosRuta = xmlDoc.querySelectorAll("ruta");
    nodosRuta.forEach(nodo => this.rutas.push(new Ruta(nodo)));

    this.$secRutas.find("p").last().remove();
    this._renderizarListaRutas();
  }

  /**
   * Renderiza el listado de rutas con botón de selección para cada una.
   * @private
   */
  _renderizarListaRutas() {
    const nav   = $("<nav></nav>").attr("aria-label", "Listado de rutas disponibles");
    const lista = $("<ul></ul>");

    this.rutas.forEach((ruta, indice) => {
      const boton = $("<button></button>")
        .attr("type", "button")
        .text(`${ruta.nombre} (${ruta.tipo} · ${ruta.transporte} · ${ruta.duracion})`)
        .on("click", () => this._seleccionarRuta(indice));
      lista.append($("<li></li>").append(boton));
    });

    nav.append(lista);
    this.$secRutas.append(nav);

    this.$areaDetalle = $("<section></section>")
  .attr("aria-live", "polite");

    this.$areaDetalle.append(
      $("<h2></h2>").text("Detalle de la ruta")
  );

  this.$secRutas.after(this.$areaDetalle);

    if (this.rutas.length > 0) {
      this._seleccionarRuta(0);
    }
  }

  /**
   * Selecciona una ruta y actualiza el mapa, la altimetría y la ficha.
   * @param {number} indice - Índice de la ruta en el array
   * @private
   */
  _seleccionarRuta(indice) {
  this.rutaSeleccionada = this.rutas[indice];
  const ruta = this.rutaSeleccionada;

  this.$areaDetalle.find("section").remove();
  this.$areaDetalle.append(ruta.renderizarFicha());

  if (this.$secPlanimetria) {
    this.gestorMapas.renderizarMapa(ruta, "mapa-ruta");
  }

  if (this.$secAltimetria) {
    this.$secAltimetria.find("figure").remove();
    this.$secAltimetria.find("p").last().text("Cargando perfil altimétrico...");
    this.gestorAlti.renderizarSVG(ruta, this.$secAltimetria);
  }

  $("html, body").animate(
    { scrollTop: this.$areaDetalle.offset().top - 80 },
    400
  );
}
}

/**
 * Punto de entrada: se ejecuta cuando el DOM está listo.
 */
$(function () {
  const gestor = new GestorRutas();
  gestor.inicializar();
});