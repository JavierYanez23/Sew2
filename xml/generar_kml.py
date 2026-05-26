import xml.etree.ElementTree as ET
import os


def parse_rutas(xml_path: str) -> ET.Element:
    """
    Carga y parsea el archivo rutas.xml.
    Devuelve el elemento raíz del árbol XML.
    """
    tree = ET.parse(xml_path)
    return tree.getroot()


def texto(elemento: ET.Element, tag: str, defecto: str = "") -> str:
    """
    Obtiene el texto de un subelemento de forma segura.
    Si el subelemento no existe o está vacío devuelve defecto.
    """
    nodo = elemento.find(tag)
    if nodo is not None and nodo.text:
        return nodo.text.strip()
    return defecto


def generar_kml_ruta(ruta: ET.Element, directorio_salida: str) -> None:
    """
    Genera un archivo KML para una ruta turística.

    El KML incluye:
    - Un Placemark de punto en el inicio de la ruta
    - Un Placemark de punto por cada hito con nombre y descripción
    - Un Placemark de LineString (trayecto) uniendo inicio y todos los hitos

    Args:
        ruta: Elemento <ruta> del XML parseado
        directorio_salida: Ruta del directorio donde guardar el KML
    """
    id_ruta     = ruta.get("id", "rutaXXX")
    nombre_ruta = texto(ruta, "nombre", "Ruta sin nombre")
    descripcion = texto(ruta, "descripcion", "").replace("\n", " ").strip()
    tipo        = texto(ruta, "tipo", "")
    transporte  = texto(ruta, "transporte", "")
    duracion    = texto(ruta, "duracion", "")
    agencia     = texto(ruta, "agencia", "")

    coord_inicio = ruta.find("coordenadasInicio")
    lon_inicio   = texto(coord_inicio, "longitud")
    lat_inicio   = texto(coord_inicio, "latitud")
    alt_inicio   = texto(coord_inicio, "altitud", "0")

    hitos = ruta.findall("hitos/hito")

    puntos_trayecto = [(lon_inicio, lat_inicio, alt_inicio, "Inicio de la ruta", "")]

    for hito in hitos:
        nombre_hito = texto(hito, "nombre")
        desc_hito   = texto(hito, "descripcion", "").replace("\n", " ").strip()
        coord_hito  = hito.find("coordenadas")
        lon_h = texto(coord_hito, "longitud")
        lat_h = texto(coord_hito, "latitud")
        alt_h = texto(coord_hito, "altitud", "0")
        puntos_trayecto.append((lon_h, lat_h, alt_h, nombre_hito, desc_hito))

    puntos_trayecto.append((lon_inicio, lat_inicio, alt_inicio, "Regreso al inicio", ""))

    lineas_coordenadas = "\n          ".join(
        f"{lon},{lat},{alt}"
        for lon, lat, alt, _, _ in puntos_trayecto
    )

    placemarks_hitos = ""
    for lon, lat, alt, nombre_h, desc_h in puntos_trayecto[1:-1]:
        desc_escaped = (desc_h
                        .replace("&", "&amp;")
                        .replace("<", "&lt;")
                        .replace(">", "&gt;")
                        .replace('"', "&quot;"))
        placemarks_hitos += f"""
    <Placemark>
      <name>{nombre_h}</name>
      <description>{desc_escaped}</description>
      <styleUrl>#estilo_hito</styleUrl>
      <Point>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>{lon},{lat},{alt}</coordinates>
      </Point>
    </Placemark>"""

    kml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!--
  {id_ruta}_planimetria.kml
  Ruta: {nombre_ruta}
  Generado por generar_kml.py
  Proyecto: Turismo en La Coruña | UO301366
-->
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>{nombre_ruta}</name>
    <description>
      Tipo: {tipo}
      Transporte: {transporte}
      Duración: {duracion}
      Agencia: {agencia}
      {descripcion}
    </description>

    <!-- Estilos del KML -->
    <Style id="estilo_ruta">
      <LineStyle>
        <color>ff0000ff</color>
        <width>4</width>
      </LineStyle>
      <PolyStyle>
        <color>330000ff</color>
      </PolyStyle>
    </Style>

    <Style id="estilo_inicio">
      <IconStyle>
        <color>ff00ff00</color>
        <scale>1.3</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/flag.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <color>ff00ff00</color>
        <scale>1.1</scale>
      </LabelStyle>
    </Style>

    <Style id="estilo_hito">
      <IconStyle>
        <color>ff0000ff</color>
        <scale>1.1</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
        </Icon>
      </IconStyle>
    </Style>

    <!-- Placemark de inicio de ruta -->
    <Placemark>
      <name>Inicio: {nombre_ruta}</name>
      <description>{descripcion[:200]}...</description>
      <styleUrl>#estilo_inicio</styleUrl>
      <Point>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>{lon_inicio},{lat_inicio},{alt_inicio}</coordinates>
      </Point>
    </Placemark>

    <!-- Placemarks de los hitos de la ruta -->{placemarks_hitos}

    <!-- LineString del trayecto completo de la ruta -->
    <Placemark>
      <name>Trayecto: {nombre_ruta}</name>
      <styleUrl>#estilo_ruta</styleUrl>
      <LineString>
        <extrude>1</extrude>
        <tessellate>1</tessellate>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>
          {lineas_coordenadas}
        </coordinates>
      </LineString>
    </Placemark>

  </Document>
</kml>
"""

    nombre_kml = f"{id_ruta}_planimetria.kml"
    ruta_salida = os.path.join(directorio_salida, nombre_kml)

    with open(ruta_salida, "w", encoding="utf-8") as f:
        f.write(kml_content)

    print(f"[OK] KML generado: {ruta_salida}  ({len(puntos_trayecto) - 1} hitos)")


def main():
    """
    Función principal: parsea rutas.xml y genera un KML por cada ruta.
    """
    script_dir  = os.path.dirname(os.path.abspath(__file__))
    xml_path    = os.path.join(script_dir, "rutas.xml")
    dir_salida  = script_dir

    if not os.path.exists(xml_path):
        print(f"[ERROR] No se encuentra el archivo: {xml_path}")
        return

    print(f"Leyendo: {xml_path}")
    raiz = parse_rutas(xml_path)
    rutas = raiz.findall("ruta")
    print(f"Rutas encontradas: {len(rutas)}")

    for ruta in rutas:
        generar_kml_ruta(ruta, dir_salida)

    print(f"\nPlanimetría generada correctamente en: {dir_salida}")


if __name__ == "__main__":
    main()