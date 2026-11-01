# PROYECTO Arcade

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


# Solución: Marcianitos

[Probar en línea](https://ipo-2627-dinamarca.github.io/ipo2627_dinamarca_arcade/)

Matamarcianos en `canvas`. Una nave se mueve por abajo y dispara a una formación de marcianos que avanza de lado a lado y baja un escalón cada vez que toca un borde. Al vaciar la pantalla empieza otro nivel, más rápido y con más filas.

## Cómo ejecutarla

Los datos se cargan con `fetch` y los scripts son módulos ES, así que hay que servirla por HTTP:

```bash
python3 -m http.server 8080
# http://localhost:8080
```

## Funcionamiento

- Mandos: flechas o `A` y `D` para mover, `Espacio` para disparar (se puede mantener), `Intro` para empezar, `P` para pausar y `Esc` para terminar. En pantallas táctiles aparecen tres botones bajo el juego.
- Comenzar, pausar y finalizar: los tres botones del panel y los atajos de teclado. La partida también se pausa sola al abrir la ayuda o al cambiar de pestaña.
- Ayuda: el enlace «Cómo se juega» abre un `<dialog>` con los mandos, los puntos y las reglas.
- Ajustes: la dificultad (fácil, normal o difícil) cambia las vidas, la velocidad de la formación y las bombas. Solo se puede cambiar antes de empezar y está en `data/dificultades.json`.
- Marcadores: puntos, récord, nivel y vidas. El récord se guarda en `localStorage`, uno por dificultad.
- Entidades: nave, disparos, tres tipos de marciano, bombas, nave nodriza que cruza de vez en cuando y explosiones.
- Bucle principal: `requestAnimationFrame` con un paso fijo de 1/60 s, de modo que la física no depende de los fotogramas por segundo. Cada vuelta actualiza el modelo y después pinta.
- Física y colisiones: movimiento con velocidad por segundo y cajas rectangulares centradas (`solapan`). Los disparos eliminan marcianos y la nave nodriza, y las bombas quitan una vida, tras la cual hay dos segundos de invulnerabilidad.
- Dificultad creciente: la formación acelera según se vacía y con cada nivel.

## Estructura

```
ipo2627_dinamarca_arcade/
├── index.html
├── favicon.svg
├── DESIGN.md             decisiones de diseño
├── css/
│   ├── tokens.css        orden de capas y variables
│   ├── base.css          reinicio y utilidades
│   ├── layout.css        rejillas y disposición
│   └── componentes.css   marcadores, botones, ayuda y mando táctil
├── js/
│   ├── main.js
│   ├── model/
│   │   ├── almacen.js    dificultades y récords
│   │   ├── entidades.js  tamaños y colisión
│   │   └── partida.js    estado y reglas del juego
│   ├── view/
│   │   ├── vista.js      DOM
│   │   ├── lienzo.js     dibujo en el canvas
│   │   └── sprites.js    mapas de píxeles
│   └── controller/
│       └── controlador.js   teclado, botones y bucle
└── data/
    └── dificultades.json
```

## Arquitectura

Sigue el patrón MVC.

- `Partida` (modelo) guarda todo el estado y las reglas y expone `empezar`, `alternarPausa`, `terminar` y `actualizar(dt, entrada)`. No toca el DOM ni el canvas.
- `Vista` escribe los marcadores y los botones y avisa de lo que hace el usuario; `Lienzo` dibuja el estado de la partida. Los colores del canvas se leen de las variables CSS, así que hay una sola fuente de color.
- `Controlador` es el único que habla con las dos: recoge el teclado, traduce los botones y lleva el bucle.

Los sprites son mapas de caracteres que se pintan una vez en un canvas pequeño y se escalan sin suavizado, para que los píxeles se vean nítidos a cualquier tamaño.

## Diseño

- Cromático: triádica con azul (página y pantalla), coral (marcianos y error) y verde (nave). La pantalla es oscura en los dos modos; el resto de la página sigue `prefers-color-scheme` con `light-dark()`.
- Tipográfico: una monoespaciada del sistema para cifras y rótulos del juego y la sans del sistema para el resto. No se descarga ninguna fuente.
- Espacial: una columna en móvil y dos desde 56 rem, con la pantalla a la izquierda y los mandos a la derecha. La pantalla mantiene la proporción 3:4 y se ajusta al alto de la ventana.

## Accesibilidad

- Todo el juego se maneja con teclado; los botones tienen etiqueta y atajo indicado.
- Una región `aria-live` anuncia el inicio, los cambios de nivel, la pausa y el resultado.
- `prefers-reduced-motion` detiene las estrellas del fondo; `forced-colors` y `prefers-contrast` tienen ajustes propios.
