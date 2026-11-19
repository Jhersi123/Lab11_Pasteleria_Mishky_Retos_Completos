PASTELERÍA MISHKY — LABORATORIO 11 + 10 RETOS (SEMANA 11)

REQUISITOS
- Visual Studio Code.
- Extensión Live Server (Ritwick Dey).
- Google Chrome o Microsoft Edge actualizado.

EJECUCIÓN
1. Descomprima este archivo ZIP.
2. En VS Code, abra la carpeta pasteleria-mishky.
3. Abra catalogo.html.
4. Clic derecho > Open with Live Server.
5. La dirección será similar a http://127.0.0.1:5500/catalogo.html.

IMPORTANTE: no abra el HTML con doble clic (file://). Fetch API necesita un servidor local.

ESTRUCTURA
pasteleria-mishky/
├── catalogo.html
├── css/estilos.css
├── js/catalogo.js
├── data/productos.json
└── img/
    ├── banner, logo, favicon y sin-imagen
    └── productos/ (16 originales + versiones -300 y -600)

RETOS IMPLEMENTADOS
R1. Buscador por nombre, sin distinguir mayúsculas y espacios extremos.
R2. Orden por menor precio, mayor precio y nombre A–Z; ordena una copia.
R3. Filtro de solo disponibles (stock mayor que cero).
R4. Contadores dinámicos sin regenerar los botones.
R5. Categoría sincronizada con location.hash; hash inválido y mal formado seguros.
R6. Validación de id único, precio, stock, categoría, imagen, nombre y descripción.
R7. Ocho tarjetas fantasma, aria-hidden, animación y aria-busy.
R8. Diálogo nativo con clic, Enter, Espacio, Escape, botón Cerrar y retorno del foco.
R9. Imágenes responsivas con srcset, sizes, loading=lazy, evento load y respaldo.
R10. Accesibilidad, mensajes diferenciados para 404/JSON/red y botón Reintentar.

PRUEBAS RECOMENDADAS
- Tortas + buscar "torta": muestra 3 coincidencias.
- Solo disponibles: muestra 14 productos.
- Categoría "Panes y bollería": URL con hash codificado.
- Abrir una tarjeta con clic y con teclado; cerrar con Escape.
- Para probar 404, cambie temporalmente el nombre de data/productos.json y restaure.
- Para probar JSON inválido, agregue temporalmente una coma final y restaure.
- Para probar red, detenga Live Server o desconecte la red.

NOTA R9
Cada foto original cuenta con variantes -300.jpg y -600.jpg. Se mantienen las imágenes originales como alternativa de 900 px.
