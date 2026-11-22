# Proyecto Arcade

[Probar en línea](https://ipo-2627-dinamarca.github.io/ipo2627_dinamarca_arcade/)

El proyecto consiste en una aplicación web que implementa un juego arcade.  

Se proponen las siguientes sugerencias (no vinculantes):

- Juego de plataformas tipo Mario: scroll lateral, saltos, enemigos y obstáculos.
- Circuito de coches: vehículo que recorre un trazado esquivando obstáculos o rivales.
- Matamarcianos: nave que dispara a enemigos en movimiento vertical u horizontal.

# Objetivos

El desarrollo se realizará en HTML, CSS y JS nativos, sin bibliotecas ni frameworks auxiliares.

El objetivo de esta actividad es el empleo de la interfaz Canvas API para el desarrollo de aplicaciones interactivas con un fuerte componente dinámico y visual.

# Descripción

El sistema interactúa con un único actor (jugador humano) que es el usuario encargado de jugar al juego. 

El sistema debe cumplir los siguientes requisitos: 
- el usuario tendrá la capacidad de comenzar, pausar o finalizar el juego
- el sistema ofrecerá un componente de ayuda para informar al usuario las reglas del juego


Si procede, en función del tipo de juego, el sistema 
- ofrecerá capacidad para ajustar parámetros antes de comenzar (o durante) la partida
- mostrará durante el juego un indicador de progreso (marcador, vidas, etc.) 

Los juegos deben implementar un bucle principal que centraliza el juego, y según las características del juego deberá contemplar aquellos componentes relevantes:
- acciones de las entidades según la variante: saltos y desplazamiento en plataformas, disparos en matamarcianos, aceleración y giro en circuitos, etc.
- actualización - estado y movimiento - y renderizado 
- detección de colisiones
- física de las entidades (velocidad, aceleración, gravedad, etc.)



# Diseño

- La aplicación deberá estar implementada siguiendo un patrón MVC (_Model-View-Controller_) con objeto de clarificar y diferenciar las distintas responsabilidades. 
- Tanto la distribución del código de los ficheros como la propia organización de los ficheros incluidos en la carpeta del proyecto deberán facilitar la comprensión y el mantenimiento de la solución aportada. 


## Interacción 

La implementación de la interacción estará guiada para favorecer la usabilidad de la aplicación.

# Buenas prácticas HTML/CSS/JS

- Vinculación moderna de los componentes HTML, CSS y JS
- Etiquetado HTML semántico y moderno
- Estrategia de selectores CSS mantenible
- Selección de composiciones apropiadas (unidimensional, bidimensional)
- Aplicación justificada del posicionamiento 
- Separación clara y organizada de los distintos aspectos estilísticos considerados: diseño cromático, tipográfico y espacial. Y cada uno estará cimentado en una sólida estrategia:
  - diseño cromático: monocromático, triádico, complementario, etc.
  - diseño tipográfico: dos fuentes contrastadas, una única fuente con niveles distintos de realce, etc.
  - diseño espacial: selección de unidades de medida y contenedores, principios de diseño `Gestalt`, etc. 


# Solución

Marcianitos es un matamarcianos en `canvas`. Una nave se mueve por la parte baja de la pantalla y dispara a una formación de marcianos que avanza de lado a lado y baja un escalón cada vez que toca un borde. Al vaciar la pantalla empieza otro nivel, más rápido y con más filas.

La aplicación usa solo HTML, CSS y JavaScript del navegador. Para probarla hay que servir la carpeta con un servidor local (Live Server, `python3 -m http.server`...), porque las dificultades se cargan con `fetch` y los scripts son módulos ES, que no cargan si se abre el archivo directamente.

## Estructura

```
index.html                estructura de la página, los marcadores, el mando táctil y el diálogo de ayuda
DESIGN.md                 decisiones de diseño: idea, color, tipografía, espacio y movimiento
favicon.svg               icono de la pestaña
css/
  tokens.css              orden de capas y variables (cromático, tipográfico y espacial)
  base.css                reinicio, foco visible y utilidades (hidden, visualmente-oculto)
  layout.css              reparto de la página con Grid
  componentes.css         cabecera, pantalla, marcadores, botones, mando táctil y ayuda
js/
  main.js                 punto de entrada: carga los datos y crea vista y controlador
  model/
    entidades.js          tamaños, colisión por cajas y fábricas de nave e invasores
    partida.js            Partida: estado y reglas del juego
    almacen.js            carga de dificultades y récords en localStorage
  view/
    vista.js              DOM: eventos, marcadores, botones y textos
    lienzo.js             dibujo de la partida en el canvas
    sprites.js            mapas de píxeles de la nave, los marcianos y la nave nodriza
  controller/
    controlador.js        teclado, acciones, récord y bucle principal
data/
  dificultades.json       vidas, velocidad y límites de cada dificultad
```

## Arquitectura MVC

`Partida` guarda todo el estado (nave, formación, disparos, bombas, nave nodriza, explosiones, puntos, vidas y nivel) y las reglas. Expone `empezar`, `alternarPausa`, `terminar` y `actualizar(dt, entrada)`. El estado de la partida es una de las constantes de `ESTADO` (`parado`, `jugando`, `pausado`, `fin`) y el motivo del final, una de `MOTIVO` (`abandono`, `invasion`, `derrota`). `entidades.js` define el tamaño de cada entidad y `solapan`, que compara dos cajas rectangulares centradas. `almacen.js` carga `data/dificultades.json` y lee y guarda los récords, y si `localStorage` falla el récord solo dura lo que la página. Nada del modelo toca el DOM ni el canvas.

`Vista` es la única que toca el DOM. Recoge los eventos (clics, teclado, mando táctil, selector, cierre de la ayuda, pérdida de foco y cambio de pestaña) y los pasa al controlador mediante callbacks (`alAccion`, `alCambiarDificultad`, `alMandoTactil`, `alTeclado`, `alPerderFoco`, `alOcultarse`, `alCerrarAyuda`). También escribe todos los textos: marcadores, etiquetas de los botones, mensajes de estado y avisos para lectores de pantalla. `Lienzo` dibuja el estado de la partida y lee los colores de las variables CSS, así que el color tiene una sola fuente. `Vista` crea el `Lienzo` y le pasa la partida en cada fotograma.

`Controlador` es el único que habla con las dos. Traduce eventos en acciones sobre el modelo (`#empezar`, `#alternarPausa`, `#cambiarDificultad`), decide cuándo hay récord y lleva el bucle. No contiene textos ni toca el DOM: pide a la vista `mostrarListo`, `mostrarEnMarcha`, `mostrarPausa` y `mostrarResultado`.

Los sprites son mapas de caracteres (`#` es un punto pintado) que se dibujan una vez en un canvas pequeño y se escalan con `imageSmoothingEnabled = false`, para que los píxeles se vean nítidos a cualquier tamaño.

## Mecánica del juego

- Mundo: el modelo trabaja en un espacio fijo de 300 × 400 unidades y el canvas lo escala al tamaño de la pantalla (y a la densidad de píxeles), así que las reglas no dependen del dispositivo.
- Mandos: flechas o `A` y `D` para mover, `Espacio` para disparar (se puede mantener), `Intro` para empezar, `P` para pausar y `Esc` para terminar. En pantallas táctiles (`pointer: coarse`) aparecen tres botones bajo el juego: izquierda, disparar y derecha.
- Comenzar, pausar y finalizar: los tres botones del panel y los atajos de teclado. Pausar cambia a «Reanudar» y, al acabar, «Iniciar» pasa a «Jugar otra vez». La partida también se pausa sola al abrir la ayuda, al perder el foco la ventana o al cambiar de pestaña.
- Formación: 8 columnas y 3 filas en el primer nivel; desde ahí se añade una fila cada dos niveles hasta 5. Avanza en pasos de 4 unidades y baja 10 al tocar un borde. La fila superior son marcianos de 30 puntos, la inferior de 10 y las del medio de 20.
- Nave nodriza: cruza la parte alta cada cierto tiempo mientras queden más de 6 marcianos, en un sentido al azar, y da 50, 100, 150 o 300 puntos.
- Disparos y bombas: la nave tiene una cadencia de 0,4 s y un máximo de disparos en pantalla según la dificultad. Las bombas salen del marciano más bajo de una columna; el 35 % de las veces se elige la columna más cercana a la nave. Una bomba que alcanza la nave quita una vida y da dos segundos de invulnerabilidad, con la nave parpadeando.
- Fin: la partida acaba si se acaban las vidas, si un marciano llega a la línea de la nave o si el jugador pulsa Terminar.
- Dificultad creciente: el intervalo entre pasos baja según se vacía la formación y se divide por `1 + 0,1 × (nivel − 1)`. Las bombas también salen más seguidas con cada nivel, y a partir del nivel 2 la formación empieza algo más abajo (hasta 4 escalones de 8 unidades).
- Ajustes: la dificultad se elige en un desplegable y solo se puede cambiar antes de empezar. Está en `data/dificultades.json`, así que se pueden añadir o retocar niveles sin tocar el código.

| Dificultad | Vidas | Intervalo base de paso | Intervalo de bombas | Bombas a la vez | Disparos a la vez |
|---|---|---|---|---|---|
| Fácil | 5 | 0,70 s | 1,6 s | 2 | 4 |
| Normal | 3 | 0,55 s | 1,1 s | 3 | 3 |
| Difícil | 2 | 0,42 s | 0,7 s | 5 | 2 |

- Marcadores: puntos, récord, nivel y vidas. El récord se guarda en `localStorage` (`marcianitos-records`), uno por dificultad, y se actualiza al acabar la partida si se supera.

### Bucle principal

`requestAnimationFrame` acumula el tiempo transcurrido (con un tope de 0,1 s por fotograma, para que una pestaña dormida no provoque saltos) y llama a `Partida.actualizar` con un paso fijo de 1/60 s tantas veces como quepan. Así la física no depende de los fotogramas por segundo. Después sincroniza los marcadores y pinta. Dentro de cada paso, la partida mueve la nave, dispara, mueve disparos y bombas, la formación y la nave nodriza, y resuelve las colisiones; si la formación queda vacía, pasa al nivel siguiente tras una espera de 1,8 s con el rótulo «NIVEL n».

## Composición y posicionamiento

- Grid para lo bidimensional: la página (cabecera, contenido y pie, en un área con nombre cada uno), el contenido principal, los cuatro marcadores, la fila de tres botones y el mando táctil (`1fr 2fr 1fr`, con el disparo más ancho). En pantalla ancha (desde 56 rem) el contenido pasa a dos columnas, con la pantalla a la izquierda y un panel de 16 a 22 rem a la derecha; los marcadores se reparten en dos columnas con los puntos ocupando toda la primera fila, y los botones se apilan.
- Flexbox para lo unidimensional: el ajuste de dificultad (etiqueta y desplegable).
- La pantalla mantiene la proporción 3:4 con `aspect-ratio` y su ancho se limita con el alto de la ventana (`100dvh`), de modo que cabe entera sin desplazarse. En una columna el orden es cabecera, pantalla, mando táctil, panel y pie, que es también el del tabulador.
- `position` solo se usa en la utilidad `.visualmente-oculto`, que esconde el título de los marcadores y la región de anuncios y deja ambos para los lectores de pantalla. No hay nada más que superponer: los rótulos de pausa, fin y nivel se dibujan dentro del canvas.

## Estilística

Cada estrategia tiene su bloque en `css/tokens.css`, y el resto de hojas solo usa esas variables.

### Cromática

Esquema triádico en HSL con tres matices separados unos 120°: azul (`--azul: 255`), coral (`--coral: 25`) y verde (`--verde: 150`). El azul es la página y la pantalla, con sus neutros (mesa, mueble, tinta y borde) derivados del mismo matiz; el coral es lo que amenaza (marcianos, bombas, aviso de error y botón al pasar el puntero) y el verde es lo del jugador (nave y disparos). La nave nodriza usa un azul claro.

La pantalla es oscura en los dos modos, como el tubo de una recreativa, y es lo único oscuro de la página en modo claro. Por eso sus colores son fijos y el resto de la interfaz cambia con `light-dark()` según `prefers-color-scheme`. El canvas lee estos mismos colores de las variables CSS al crearse.

### Tipográfica

Dos fuentes contrastadas, las dos del sistema para no descargar nada. Una monoespaciada (`ui-monospace`, Cascadia Mono, SF Mono, Menlo, Consolas...) para las cifras de los marcadores, los rótulos del canvas y las teclas de la ayuda, y `system-ui` para todo lo demás. Las cifras llevan `font-variant-numeric: tabular-nums` para que no bailen mientras cambian los puntos.

Los tamaños salen de una escala modular de razón 1,25 en `rem` (`--paso--1` a `--paso-5`). El título usa `clamp()` para crecer con la ventana, y el lema, con `text-wrap: balance`, tiene un ancho máximo de 44 caracteres.

### Espacial

Unidades `rem` con una escala de espaciado (de 0,25 rem a un `clamp()` fluido para los márgenes grandes), el alto de la ventana (`dvh`) para limitar la pantalla y un ancho máximo de 72 rem para el contenido. Radios pequeños (0,25 rem en controles y el triple en la pantalla y el mueble). Botones y controles de 3 rem de alto como mínimo, y de 4 rem los del mando táctil, para poder pulsarlos con el dedo.

Principios de la Gestalt:

- Figura y fondo: la pantalla oscura sobre una página clara (o al revés en modo oscuro) es lo único con tanto contraste, así que es lo primero que se mira.
- Región común: la pantalla va enmarcada en un mueble con borde, y los marcadores y mandos forman un panel aparte.
- Semejanza: los marcianos comparten el color coral y la forma de sus sprites; la nave y sus disparos, el verde.
- Proximidad: los marcadores van juntos, en una cuadrícula, y los botones de acción forman una fila o columna, separados del selector de dificultad.

## Interacción y usabilidad

- Todo el juego se maneja con teclado. Los atajos no actúan si el foco está en un botón, un desplegable, un enlace o el diálogo, para no quitarles sus propias teclas; con `Ctrl`, `Alt` o `Meta` pulsadas tampoco, para respetar los atajos del navegador. Al empezar o pausar con el ratón, el foco vuelve al canvas.
- Estado visible: los botones se activan según la fase de la partida (Pausar y Terminar solo mientras se juega, Iniciar y el selector solo cuando no), un mensaje bajo los marcadores dice qué hacer en cada momento («Pulsa Intro o Iniciar para empezar», «En pausa. Pulsa P o Reanudar para seguir») y el canvas muestra el rótulo del estado (título, PAUSA, NIVEL n, FIN DEL JUEGO o PARTIDA TERMINADA con los puntos). El borde de la pantalla se oscurece mientras se juega.
- Ayuda: el enlace «Cómo se juega» abre un `<dialog>` modal con la meta, los mandos, los puntos de cada marciano y las reglas, y un botón «Entendido». Al abrirla con la partida en marcha, esta se pausa; al cerrarla se queda en pausa y lo avisa el mensaje de estado.
- Mando táctil: los botones capturan el puntero (`setPointerCapture`) y suelta la tecla al levantar el dedo, al cancelar el gesto o al perder la captura. Llevan `touch-action: none` y desactivan el menú contextual y la selección de texto, para que mantenerlos pulsados no haga nada raro.
- Errores: el HTML arranca con un aviso de error visible; si el módulo no llega a ejecutarse (sin JavaScript o abriendo `index.html` desde `file://`), ese aviso es lo que se ve. Si todo va bien pasa a «Cargando…» y después al juego. Si falla la carga de las dificultades, el aviso dice qué ha pasado.
- Movimiento: las estrellas del fondo se desplazan solo si el sistema no pide reducir animaciones (`prefers-reduced-motion`) y la partida no está en pausa. Los botones bajan 1 px al pulsarlos.
- Accesibilidad: el canvas tiene `role="img"` y una etiqueta que remite a los marcadores, que son una lista de definiciones con texto real. Una región `aria-live="polite"` anuncia el inicio, los cambios de nivel, la pausa y el resultado. Los botones llevan `aria-keyshortcuts` con su atajo.

## Recursos de CSS

- Capas (`@layer tokens, base, layout, componentes, utilidades`), declaradas una sola vez: el orden decide qué regla gana, así que no hace falta ningún `!important`.
- Clases con nomenclatura BEM y sin ids para los estilos; el anidamiento nativo solo se usa para los estados (`&:active`, `&:disabled`).
- Un único atributo `data-estado` en la raíz (`parado`, `jugando`, `pausado`, `fin`, además de `cargando` y `error`) decide qué se ve: el aviso de error, los controles y el borde de la pantalla dependen de él.
- Propiedades lógicas (`inline-size`, `margin-inline`, `padding-block`...) y `min()` y `clamp()` para el tamaño de la pantalla y el título.
- `prefers-contrast: more`: el texto secundario pasa a la tinta plena.
- `forced-colors`: la pantalla y el botón principal conservan un borde visible en el modo de alto contraste.
- El *hover* solo existe en `(hover: hover)`, para que en pantallas táctiles no se quede marcado tras tocar.
- `overscroll-behavior: contain` en el diálogo, para que el gesto no siga desplazando la página de debajo.
- `image-rendering: pixelated` en el canvas, para que los sprites escalados conserven el píxel.

## Buenas prácticas

- HTML semántico: `header`, `main`, `footer`, `section` con `aria-label` para el juego y para el panel, un único `h1`, un `h2` solo para lectores de pantalla en los marcadores, los marcadores como lista de definiciones, `kbd` para las teclas, `<dialog>` para la ayuda con un `form method="dialog"`, `lang="es"` y `theme-color` para modo claro y oscuro, con un favicon SVG propio.
- JS y DOM: la vista localiza los elementos por `data-vista`, `data-accion` y `data-tactil` (las clases quedan para el estilo) y atiende los clics por delegación en la raíz. Solo escribe en el DOM cuando un valor cambia, con una pequeña caché.
- Datos fuera del código: las dificultades están en un JSON y la carga comprueba los fallos de red, de estado HTTP y de formato.
- JS y estilos: el JS no escribe estilos. Los colores del canvas se leen de las variables CSS y el resto lo decide el CSS a partir de `data-estado`.
