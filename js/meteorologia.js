"use strict";

// Coordenadas de La Coruña capital
const LAT_CORUNA = 43.3623;
const LON_CORUNA = -8.4115;

/**
 * Clase CondicionMeteo
 * Traduce un código WMO a descripción textual y emoji representativo.
 */
class CondicionMeteo {
  /**
   * @param {number} codigo - Código WMO de condición meteorológica
   */
  constructor(codigo) {
    this.codigo = codigo;
    const info   = CondicionMeteo.CODIGOS[codigo] || { texto: "Desconocido", emoji: "🌡️" };
    this.texto   = info.texto;
    this.emoji   = info.emoji;
  }

  static CODIGOS = {
    0  : { texto: "Cielo despejado",          emoji: "☀️"  },
    1  : { texto: "Principalmente despejado", emoji: "🌤️" },
    2  : { texto: "Parcialmente nublado",      emoji: "⛅"  },
    3  : { texto: "Nublado",                  emoji: "☁️"  },
    45 : { texto: "Niebla",                   emoji: "🌫️" },
    48 : { texto: "Niebla engelante",         emoji: "🌫️" },
    51 : { texto: "Llovizna ligera",           emoji: "🌦️" },
    53 : { texto: "Llovizna moderada",         emoji: "🌦️" },
    55 : { texto: "Llovizna intensa",          emoji: "🌧️" },
    61 : { texto: "Lluvia ligera",             emoji: "🌧️" },
    63 : { texto: "Lluvia moderada",           emoji: "🌧️" },
    65 : { texto: "Lluvia intensa",            emoji: "🌧️" },
    71 : { texto: "Nevada ligera",             emoji: "🌨️" },
    73 : { texto: "Nevada moderada",           emoji: "❄️"  },
    75 : { texto: "Nevada intensa",            emoji: "❄️"  },
    80 : { texto: "Chubascos ligeros",         emoji: "🌦️" },
    81 : { texto: "Chubascos moderados",       emoji: "🌧️" },
    82 : { texto: "Chubascos fuertes",         emoji: "⛈️"  },
    95 : { texto: "Tormenta",                  emoji: "⛈️"  },
    96 : { texto: "Tormenta con granizo",      emoji: "⛈️"  },
    99 : { texto: "Tormenta con granizo",      emoji: "⛈️"  }
  };
}

/**
 * Clase DiaMeteo
 * Representa los datos meteorológicos de un día concreto.
 */
class DiaMeteo {
  /**
   * @param {string} fecha       - Fecha en formato YYYY-MM-DD
   * @param {number} tempMax     - Temperatura máxima en °C
   * @param {number} tempMin     - Temperatura mínima en °C
   * @param {number} codigoWMO  - Código WMO de condición meteorológica
   * @param {number} precipitacion - Precipitación acumulada en mm
   * @param {number} viento      - Velocidad máxima del viento en km/h
   */
  constructor(fecha, tempMax, tempMin, codigoWMO, precipitacion, viento) {
    this.fecha         = fecha;
    this.tempMax       = Math.round(tempMax);
    this.tempMin       = Math.round(tempMin);
    this.condicion     = new CondicionMeteo(codigoWMO);
    this.precipitacion = precipitacion.toFixed(1);
    this.viento        = Math.round(viento);
  }

  /**
   * Formatea la fecha a formato corto en español.
   * @returns {string} "Lun 15 Jun"
   */
  fechaCorta() {
    const opciones = { weekday: "short", day: "numeric", month: "short" };
    try {
      return new Date(this.fecha + "T12:00:00").toLocaleDateString("es-ES", opciones);
    } catch {
      return this.fecha;
    }
  }

  /**
   * Genera la celda HTML de la previsión para este día.
   * @returns {jQuery} Elemento <td> con los datos del día
   */
  renderizarCelda() {
    const celda = $("<td></td>");
    celda.append($("<strong></strong>").text(this.fechaCorta()));
    celda.append($("<br>"));
    celda.append(
      $("<span></span>")
        .attr("aria-label", `Condición: ${this.condicion.texto}`)
        .attr("role", "img")
        .text(this.condicion.emoji)
    );
    celda.append($("<br>"));
    celda.append(document.createTextNode(this.condicion.texto));
    celda.append($("<br>"));
    celda.append($("<strong></strong>").text(`${this.tempMax}°C`));
    celda.append(document.createTextNode(` / ${this.tempMin}°C`));
    celda.append($("<br>"));
    celda.append(document.createTextNode(`💧 ${this.precipitacion} mm`));
    celda.append($("<br>"));
    celda.append(document.createTextNode(`💨 ${this.viento} km/h`));
    return celda;
  }
}

/**
 * Clase TiempoActual
 * Representa los datos meteorológicos en tiempo real (hora actual).
 */
class TiempoActual {
  /**
   * @param {number} temperatura  - Temperatura actual en °C
   * @param {number} sensTermica  - Sensación térmica en °C
   * @param {number} humedad      - Humedad relativa en %
   * @param {number} viento       - Velocidad del viento en km/h
   * @param {number} codigoWMO   - Código WMO de condición meteorológica
   */
  constructor(temperatura, sensTermica, humedad, viento, codigoWMO) {
    this.temperatura = Math.round(temperatura);
    this.sensTermica = Math.round(sensTermica);
    this.humedad     = Math.round(humedad);
    this.viento      = Math.round(viento);
    this.condicion   = new CondicionMeteo(codigoWMO);
  }

  /**
   * Genera el bloque HTML del tiempo actual.
   * @returns {jQuery} Sección con los datos actuales
   */
  renderizar() {
    const contenedor = $("<dl></dl>");

    const agregar = (termino, valor) => {
      contenedor.append($("<dt></dt>").text(termino));
      contenedor.append($("<dd></dd>").text(valor));
    };

    agregar("Condición",         `${this.condicion.emoji} ${this.condicion.texto}`);
    agregar("Temperatura",       `${this.temperatura} °C`);
    agregar("Sensación térmica", `${this.sensTermica} °C`);
    agregar("Humedad relativa",  `${this.humedad} %`);
    agregar("Viento",            `${this.viento} km/h`);

    const hora = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    const nota = $("<p></p>").append(
      $("<small></small>").text(`Datos actualizados a las ${hora}. Fuente: Open-Meteo.`)
    );

    return $("<div></div>").append(contenedor).append(nota);
  }
}

/**
 * Clase ServicioMeteorologico
 * Gestiona la obtención y presentación de datos meteorológicos
 * mediante la API Open-Meteo.
 */
class ServicioMeteorologico {
  /**
   * @param {number} latitud  - Latitud de la localización
   * @param {number} longitud - Longitud de la localización
   */
  constructor(latitud, longitud) {
    this.latitud       = latitud;
    this.longitud      = longitud;
    this.$secActual    = null;
    this.$secPrevision = null;
  }

  /**
   * Localiza las secciones del DOM e inicia la carga de datos.
   */
  inicializar() {
    $("section").each((_, sec) => {
      const titulo = $(sec).find("h2").text().trim();
      if (titulo === "Tiempo actual en La Coruña")         this.$secActual    = $(sec);
      if (titulo === "Previsión para los próximos 7 días") this.$secPrevision = $(sec);
    });

    if (!this.$secActual || !this.$secPrevision) {
      console.warn("ServicioMeteorologico: no se encontraron todas las secciones.");
      return;
    }

    this._mostrarCargando(this.$secActual);
    this._mostrarCargando(this.$secPrevision);
    this._obtenerDatos();
  }

  /**
   * Muestra un indicador de carga en una sección.
   * @param {jQuery} $seccion
   * @private
   */
  _mostrarCargando($seccion) {
    $seccion.find("p").last().text("Cargando datos meteorológicos...");
  }

  /**
   * Realiza la petición AJAX a Open-Meteo API.
   * @private
   */
  _obtenerDatos() {
    $.ajax({
      url     : "https://api.open-meteo.com/v1/forecast",
      method  : "GET",
      dataType: "json",
      data    : {
        latitude              : this.latitud,
        longitude             : this.longitud,
        current               : [
          "temperature_2m",
          "apparent_temperature",
          "relative_humidity_2m",
          "wind_speed_10m",
          "weather_code"
        ].join(","),
        daily                 : [
          "weather_code",
          "temperature_2m_max",
          "temperature_2m_min",
          "precipitation_sum",
          "wind_speed_10m_max"
        ].join(","),
        timezone              : "Europe/Madrid",
        forecast_days         : 7
      },
      success : (datos) => this._manejarExito(datos),
      error   : (xhr, estado, error) => this._manejarError(xhr, estado, error)
    });
  }

  /**
   * Procesa y renderiza los datos meteorológicos recibidos.
   * @param {Object} datos - Respuesta JSON de Open-Meteo
   * @private
   */
  _manejarExito(datos) {
    const c = datos.current;
    const tiempoActual = new TiempoActual(
      c.temperature_2m,
      c.apparent_temperature,
      c.relative_humidity_2m,
      c.wind_speed_10m,
      c.weather_code
    );
    this.$secActual.find("p").last().remove();
    this.$secActual.append(tiempoActual.renderizar());

    const d = datos.daily;
    const dias = d.time.map((fecha, i) => new DiaMeteo(
      fecha,
      d.temperature_2m_max[i],
      d.temperature_2m_min[i],
      d.weather_code[i],
      d.precipitation_sum[i] || 0,
      d.wind_speed_10m_max[i] || 0
    ));

    const tabla = $("<table></table>");
    const caption = $("<caption></caption>").text(
      "Previsión meteorológica para los próximos 7 días en La Coruña"
    );
    const thead = $("<thead></thead>");
    const filaEncabezados = $("<tr></tr>");
    dias.forEach((dia) => {
      filaEncabezados.append($("<th></th>").attr("scope", "col").text(dia.fechaCorta()));
    });
    thead.append(filaEncabezados);

    const tbody = $("<tbody></tbody>");
    const filaDatos = $("<tr></tr>");
    dias.forEach((dia) => filaDatos.append(dia.renderizarCelda()));
    tbody.append(filaDatos);

    tabla.append(caption, thead, tbody);
    this.$secPrevision.find("p").last().remove();
    this.$secPrevision.append(tabla);
  }

  /**
   * Maneja los errores de la petición mostrando un mensaje al usuario.
   * @private
   */
  _manejarError(xhr, estado, error) {
    console.error("ServicioMeteorologico error:", estado, error);
    const msg = "No se pudo obtener la información meteorológica. " +
      "Comprueba tu conexión a Internet o consulta " +
      "<a href='https://www.aemet.es' target='_blank' rel='noopener noreferrer'>AEMET</a>.";
    this.$secActual.find("p").last().html(msg);
    this.$secPrevision.find("p").last().html(msg);
  }
}

/**
 * Punto de entrada: se ejecuta cuando el DOM está listo.
 */
$(function () {
  const servicio = new ServicioMeteorologico(LAT_CORUNA, LON_CORUNA);
  servicio.inicializar();
});