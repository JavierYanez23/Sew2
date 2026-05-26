import xml.etree.ElementTree as ET
import os
import math


# ============================================================
# CONSTANTES DE DISEÑO DEL SVG
# ============================================================

SVG_ANCHO      = 900          
SVG_ALTO       = 480          
MARGEN_IZQ     = 80           
MARGEN_DER     = 40           
MARGEN_SUP     = 50           
MARGEN_INF     = 100          

AREA_ANCHO     = SVG_ANCHO - MARGEN_IZQ - MARGEN_DER
AREA_ALTO      = SVG_ALTO  - MARGEN_SUP  - MARGEN_INF

COLOR_FONDO    = "#f4f0eb"
COLOR_RELLENO  = "#7bafd4" 
COLOR_LINEA    = "#1a3a5c"
COLOR_CUADRIC  = "#c5b99a"
COLOR_TEXTO    = "#2c2c2c"
COLOR_TITULO   = "#1a3a5c"
COLOR_EJES     = "#2c2c2c"


def texto(elemento: ET.Element, tag: str, defecto: str = "") -> str:
    """Obtiene el texto de un subelemento de forma segura."""
    nodo = elemento.find(tag)
    if nodo is not None and nodo.text:
        return nodo.text.strip()
    return defecto


def distancia_a_metros(valor: str, unidades: str) -> float:
    """Convierte una distancia a metros según las unidades del atributo."""
    try:
        v = float(valor)
        return v * 1000.0 if unidades == "km" else v
    except ValueError:
        return 0.0


def haversine_metros(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula la distancia en metros entre dos puntos geográficos
    usando la fórmula haversine. Usada como fallback si la distancia
    declarada en el XML es 0 en hitos distintos al primero.
    """
    R = 6_371_000 
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def generar_svg_ruta(ruta: ET.Element, directorio_salida: str) -> None:
    """
    Genera un archivo SVG con el perfil altimétrico (altimetría) de una ruta.

    El SVG incluye:
    - Fondo de color
    - Título con nombre de la ruta
    - Cuadrícula de referencia
    - Ejes X (distancia en metros) e Y (altitud en metros) con etiquetas de escala
    - Polilínea CERRADA del perfil de elevación (sube por los hitos y baja al nivel base)
    - Etiquetas de los hitos (texto horizontal sobre el punto, texto vertical con nombre)

    Args:
        ruta: Elemento <ruta> del XML parseado
        directorio_salida: Directorio donde guardar el SVG
    """
    id_ruta     = ruta.get("id", "rutaXXX")
    nombre_ruta = texto(ruta, "nombre", "Ruta sin nombre")

    coord_inicio = ruta.find("coordenadasInicio")
    lat_ini = float(texto(coord_inicio, "latitud", "0"))
    lon_ini = float(texto(coord_inicio, "longitud", "0"))
    alt_ini = float(texto(coord_inicio, "altitud", "0"))

    puntos = [(0.0, alt_ini, "Inicio", lat_ini, lon_ini)]

    hitos = ruta.findall("hitos/hito")
    for hito in hitos:
        nombre_hito = texto(hito, "nombre", "Hito")
        coord_h     = hito.find("coordenadas")
        lat_h  = float(texto(coord_h, "latitud",  "0"))
        lon_h  = float(texto(coord_h, "longitud", "0"))
        alt_h  = float(texto(coord_h, "altitud",  "0"))
        dist_elem = hito.find("distanciaDesdeAnterior")
        if dist_elem is not None:
            dist_val  = dist_elem.text.strip() if dist_elem.text else "0"
            unidades  = dist_elem.get("unidades", "m")
            dist_m    = distancia_a_metros(dist_val, unidades)
        else:
            dist_m = 0.0
        prev = puntos[-1]
        if dist_m == 0 and len(puntos) > 0:
            dist_m = haversine_metros(prev[3], prev[4], lat_h, lon_h)
        dist_acum = prev[0] + dist_m
        puntos.append((dist_acum, alt_h, nombre_hito[:25], lat_h, lon_h))

    puntos.append((puntos[-1][0] + 10, alt_ini, "", puntos[-1][3], puntos[-1][4]))

    distancias = [p[0] for p in puntos]
    altitudes  = [p[1] for p in puntos]
    dist_max   = max(distancias) if max(distancias) > 0 else 1
    alt_min    = min(altitudes)
    alt_max    = max(altitudes)
    alt_rango  = alt_max - alt_min if (alt_max - alt_min) > 0 else 1

    margen_v   = alt_rango * 0.15
    alt_min_v  = alt_min - margen_v
    alt_max_v  = alt_max + margen_v
    alt_rango_v = alt_max_v - alt_min_v

    def x_pixel(dist: float) -> float:
        """Convierte distancia acumulada en metros a píxeles en el SVG."""
        return MARGEN_IZQ + (dist / dist_max) * AREA_ANCHO

    def y_pixel(alt: float) -> float:
        """Convierte altitud en metros a píxeles en el SVG (eje Y invertido)."""
        return MARGEN_SUP + AREA_ALTO - ((alt - alt_min_v) / alt_rango_v) * AREA_ALTO

    pts_perfil = [(x_pixel(p[0]), y_pixel(p[1])) for p in puntos]
    base_y     = MARGEN_SUP + AREA_ALTO
    pts_poligono = pts_perfil + [
        (pts_perfil[-1][0], base_y),
        (pts_perfil[0][0],  base_y),
        pts_perfil[0]  
    ]
    poligono_str = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts_poligono)
    polilinea_str = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts_perfil)

    num_marcas_y = 5
    cuadricula_y = ""
    escala_y     = ""
    for i in range(num_marcas_y + 1):
        alt_marca = alt_min_v + (alt_rango_v * i / num_marcas_y)
        yp = y_pixel(alt_marca)
        cuadricula_y += (
            f'<line x1="{MARGEN_IZQ}" y1="{yp:.1f}" '
            f'x2="{MARGEN_IZQ + AREA_ANCHO}" y2="{yp:.1f}" '
            f'stroke="{COLOR_CUADRIC}" stroke-width="0.5" stroke-dasharray="4,4"/>\n    '
        )
        escala_y += (
            f'<text x="{MARGEN_IZQ - 8}" y="{yp + 4:.1f}" '
            f'text-anchor="end" font-size="11" fill="{COLOR_TEXTO}">'
            f'{int(alt_marca)} m</text>\n    '
        )

    num_marcas_x = 6
    cuadricula_x = ""
    escala_x     = ""
    for i in range(num_marcas_x + 1):
        dist_marca = dist_max * i / num_marcas_x
        xp = x_pixel(dist_marca)
        cuadricula_x += (
            f'<line x1="{xp:.1f}" y1="{MARGEN_SUP}" '
            f'x2="{xp:.1f}" y2="{MARGEN_SUP + AREA_ALTO}" '
            f'stroke="{COLOR_CUADRIC}" stroke-width="0.5" stroke-dasharray="4,4"/>\n    '
        )
        if dist_max > 2000:
            label_x = f"{dist_marca / 1000:.1f} km"
        else:
            label_x = f"{int(dist_marca)} m"
        escala_x += (
            f'<text x="{xp:.1f}" y="{MARGEN_SUP + AREA_ALTO + 18}" '
            f'text-anchor="middle" font-size="11" fill="{COLOR_TEXTO}">'
            f'{label_x}</text>\n    '
        )
    etiquetas_hitos = ""
    for i, (dist, alt, nombre_h, _, _) in enumerate(puntos[:-1]):  # excluir punto de cierre
        if not nombre_h:
            continue
        xp = x_pixel(dist)
        yp = y_pixel(alt)
        # Punto sobre el hito
        etiquetas_hitos += (
            f'<circle cx="{xp:.1f}" cy="{yp:.1f}" r="4" '
            f'fill="{COLOR_LINEA}" stroke="white" stroke-width="1.5"/>\n    '
        )
        etiquetas_hitos += (
            f'<line x1="{xp:.1f}" y1="{yp:.1f}" '
            f'x2="{xp:.1f}" y2="{MARGEN_SUP + AREA_ALTO}" '
            f'stroke="{COLOR_LINEA}" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.5"/>\n    '
        )
        texto_y_pos = MARGEN_SUP + AREA_ALTO + 25
        etiquetas_hitos += (
            f'<text transform="rotate(-90, {xp:.1f}, {texto_y_pos})" '
            f'x="{xp:.1f}" y="{texto_y_pos}" '
            f'text-anchor="start" font-size="10" fill="{COLOR_TITULO}" font-weight="bold">'
            f'{nombre_h}</text>\n    '
        )
        etiquetas_hitos += (
            f'<text x="{xp + 6:.1f}" y="{yp - 6:.1f}" '
            f'font-size="10" fill="{COLOR_TEXTO}">{int(alt)} m</text>\n    '
        )
    etiqueta_eje_y = (
        f'<text transform="rotate(-90, 18, {MARGEN_SUP + AREA_ALTO // 2})" '
        f'x="18" y="{MARGEN_SUP + AREA_ALTO // 2}" '
        f'text-anchor="middle" font-size="13" fill="{COLOR_TITULO}" font-weight="bold">'
        f'Altitud (m)</text>'
    )
    etiqueta_eje_x = (
        f'<text x="{MARGEN_IZQ + AREA_ANCHO // 2}" '
        f'y="{SVG_ALTO - 8}" '
        f'text-anchor="middle" font-size="13" fill="{COLOR_TITULO}" font-weight="bold">'
        f'Distancia</text>'
    )
    svg_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!--
  {id_ruta}_altimetria.svg
  Altimetría de: {nombre_ruta}
  Generado por generar_svg.py
  Proyecto: Turismo en La Coruña | UO301366
  Polilínea cerrada con referencias de escala horizontal y vertical en metros.
-->
<svg xmlns="http://www.w3.org/2000/svg"
     width="{SVG_ANCHO}" height="{SVG_ALTO}"
     viewBox="0 0 {SVG_ANCHO} {SVG_ALTO}"
     role="img"
     aria-label="Perfil altimétrico de la ruta: {nombre_ruta}">

  <title>Perfil altimétrico: {nombre_ruta}</title>
  <desc>
    Gráfico SVG del perfil de elevación de la ruta turística "{nombre_ruta}"
    de la provincia de La Coruña. Eje horizontal: distancia en metros.
    Eje vertical: altitud en metros sobre el nivel del mar.
  </desc>

  <!-- Fondo del SVG -->
  <rect width="{SVG_ANCHO}" height="{SVG_ALTO}" fill="{COLOR_FONDO}" rx="8"/>

  <!-- Área del gráfico (fondo blanco) -->
  <rect x="{MARGEN_IZQ}" y="{MARGEN_SUP}"
        width="{AREA_ANCHO}" height="{AREA_ALTO}"
        fill="white" stroke="{COLOR_EJES}" stroke-width="1.5" rx="2"/>

  <!-- Título del gráfico -->
  <text x="{SVG_ANCHO // 2}" y="32"
        text-anchor="middle"
        font-family="Georgia, serif"
        font-size="16"
        font-weight="bold"
        fill="{COLOR_TITULO}">
    Altimetría: {nombre_ruta}
  </text>

  <!-- Cuadrícula horizontal (altitud) -->
  {cuadricula_y}

  <!-- Cuadrícula vertical (distancia) -->
  {cuadricula_x}

  <!-- Escala eje Y (altitud en metros) -->
  {escala_y}

  <!-- Escala eje X (distancia) -->
  {escala_x}

  <!-- Etiqueta eje Y -->
  {etiqueta_eje_y}

  <!-- Etiqueta eje X -->
  {etiqueta_eje_x}

  <!-- POLILÍNEA CERRADA: relleno del perfil de elevación -->
  <polygon
    points="{poligono_str}"
    fill="{COLOR_RELLENO}"
    fill-opacity="0.4"
    stroke="none"/>

  <!-- POLILÍNEA: contorno del perfil de elevación -->
  <polyline
    points="{polilinea_str}"
    fill="none"
    stroke="{COLOR_LINEA}"
    stroke-width="2.5"
    stroke-linejoin="round"
    stroke-linecap="round"/>

  <!-- Hitos del recorrido con etiquetas -->
  {etiquetas_hitos}

  <!-- Marco del área del gráfico (encima de todo) -->
  <rect x="{MARGEN_IZQ}" y="{MARGEN_SUP}"
        width="{AREA_ANCHO}" height="{AREA_ALTO}"
        fill="none" stroke="{COLOR_EJES}" stroke-width="1.5" rx="2"/>

</svg>
"""

    nombre_svg  = f"{id_ruta}_altimetria.svg"
    ruta_salida = os.path.join(directorio_salida, nombre_svg)

    with open(ruta_salida, "w", encoding="utf-8") as f:
        f.write(svg_content)

    print(f"[OK] SVG generado: {ruta_salida}  (dist_max={dist_max:.0f}m, "
          f"alt {int(alt_min)}-{int(alt_max)}m)")


def main():
    """
    Función principal: parsea rutas.xml y genera un SVG por cada ruta.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    xml_path   = os.path.join(script_dir, "rutas.xml")
    dir_salida = script_dir

    if not os.path.exists(xml_path):
        print(f"[ERROR] No se encuentra el archivo: {xml_path}")
        return

    print(f"Leyendo: {xml_path}")
    tree = ET.parse(xml_path)
    raiz = tree.getroot()
    rutas = raiz.findall("ruta")
    print(f"Rutas encontradas: {len(rutas)}")

    for ruta in rutas:
        generar_svg_ruta(ruta, dir_salida)

    print(f"\nAltimetría generada correctamente en: {dir_salida}")


if __name__ == "__main__":
    main()