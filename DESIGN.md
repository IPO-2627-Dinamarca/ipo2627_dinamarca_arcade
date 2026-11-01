# Marcianitos: decisiones de diseño

Práctica de Arcade (IPO 2026/27, grupo Dinamarca). HTML, CSS y JS nativos, sin librerías ni fuentes descargadas.

## Idea

Una recreativa de bar: la pantalla del juego es el único elemento oscuro y va enmarcada en un mueble claro. El resto de la página se queda quieto para que la atención esté en la pantalla.

## Color

Triádica en HSL, con tres tonos separados unos 120°.

| Tono | Valor | Uso |
|---|---|---|
| Azul | 255 | mesa, mueble, texto, fondo de la pantalla |
| Coral | 25 | marcianos, bombas, aviso de error y botón al pasar el puntero |
| Verde | 150 | nave y disparos |

La mesa, el mueble y la tinta cambian con `light-dark()`. La pantalla y sus colores son fijos.

## Tipografía

- Monoespaciada del sistema (`ui-monospace` y equivalentes): cifras de los marcadores y rótulos del canvas.
- `system-ui`: títulos, texto y botones.

Escala modular de razón 1,25 en `rem`.

## Espacio

- Móvil: una columna con pantalla, mando táctil y panel.
- Desde 56 rem: pantalla a la izquierda y panel de 16 a 22 rem a la derecha.
- La pantalla es un `canvas` 3:4 cuyo ancho se limita con el alto de la ventana (`dvh`).

## Movimiento

Solo se mueve la pantalla. Las estrellas del fondo se detienen con `prefers-reduced-motion`.
