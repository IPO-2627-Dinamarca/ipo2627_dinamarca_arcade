import { Partida, ESTADO } from '../model/partida.js';
import { guardarRecord, leerRecords } from '../model/almacen.js';

const PASO_FIJO = 1 / 60;
const DURACION_MAXIMA_FOTOGRAMA = 0.1;

const TECLAS = {
  ArrowLeft: 'izquierda',
  KeyA: 'izquierda',
  ArrowRight: 'derecha',
  KeyD: 'derecha',
  Space: 'disparo',
};

export class Controlador {
  #dificultades;
  #partida;
  #vista;
  #records = leerRecords();
  #entrada = { izquierda: false, derecha: false, disparo: false };
  #ultimo = 0;
  #acumulado = 0;

  constructor(dificultades, vista) {
    this.#dificultades = dificultades;
    this.#vista = vista;
    this.#partida = new Partida(dificultades.find((d) => d.id === 'normal') ?? dificultades[0]);
  }

  iniciar() {
    const vista = this.#vista;
    vista.llenarDificultades(this.#dificultades, this.#partida.dificultad.id);
    vista.alAccion((accion) => this.#accion(accion));
    vista.alCambiarDificultad((id) => this.#cambiarDificultad(id));
    vista.alMandoTactil((tecla, activa) => (this.#entrada[tecla] = activa));
    vista.alCerrarAyuda(() => {
      if (this.#partida.estado === ESTADO.PAUSADO) vista.mostrarPausa(true);
    });
    vista.alTeclado(
      (codigo) => this.#teclaAbajo(codigo),
      (codigo) => this.#teclaArriba(codigo),
    );
    vista.alPerderFoco(() => this.#soltarTodo());
    vista.alOcultarse(() => this.#pausarSiJuega());

    vista.mostrarListo();
    this.#sincronizar();
    requestAnimationFrame((t) => this.#bucle(t));
  }

  #bucle(ahora) {
    requestAnimationFrame((t) => this.#bucle(t));
    this.#acumulado += Math.min((ahora - this.#ultimo) / 1000, DURACION_MAXIMA_FOTOGRAMA);
    this.#ultimo = ahora;

    const estadoPrevio = this.#partida.estado;
    while (this.#acumulado >= PASO_FIJO) {
      this.#partida.actualizar(PASO_FIJO, this.#entrada);
      this.#acumulado -= PASO_FIJO;
    }
    if (estadoPrevio === ESTADO.JUGANDO && this.#partida.estado === ESTADO.FIN) this.#alTerminar();

    this.#sincronizar();
    this.#vista.pintar(this.#partida, ahora);
  }

  #sincronizar() {
    this.#vista.actualizar(this.#partida, this.#records[this.#partida.dificultad.id] ?? 0);
  }

  #accion(accion) {
    switch (accion) {
      case 'iniciar':
        this.#empezar();
        break;
      case 'pausar':
        this.#partida.alternarPausa();
        this.#mostrarPausa();
        this.#vista.enfocarJuego();
        break;
      case 'terminar':
        this.#partida.terminar();
        this.#alTerminar();
        break;
      case 'ayuda':
        this.#pausarSiJuega();
        this.#vista.abrirAyuda();
        break;
    }
  }

  #empezar() {
    this.#soltarTodo();
    this.#partida.empezar();
    this.#acumulado = 0;
    this.#ultimo = performance.now();
    this.#vista.mostrarEnMarcha();
    this.#vista.enfocarJuego();
  }

  #pausarSiJuega() {
    if (this.#partida.estado !== ESTADO.JUGANDO) return;
    this.#partida.alternarPausa();
    this.#mostrarPausa();
  }

  #mostrarPausa() {
    this.#vista.mostrarPausa(this.#partida.estado === ESTADO.PAUSADO);
  }

  #alTerminar() {
    const { puntos, dificultad } = this.#partida;
    const nuevoRecord = puntos > (this.#records[dificultad.id] ?? 0);
    if (nuevoRecord) this.#records = guardarRecord(dificultad.id, puntos);
    this.#soltarTodo();
    this.#vista.mostrarResultado(this.#partida, nuevoRecord);
  }

  #cambiarDificultad(id) {
    const elegida = this.#dificultades.find((d) => d.id === id);
    if (!elegida) return;
    this.#partida = new Partida(elegida);
    this.#vista.mostrarListo();
  }

  #soltarTodo() {
    this.#entrada.izquierda = this.#entrada.derecha = this.#entrada.disparo = false;
  }

  // Devuelve si la tecla se ha usado, para que la vista evite su acción por defecto.
  #teclaAbajo(codigo) {
    const direccion = TECLAS[codigo];
    if (direccion) {
      this.#entrada[direccion] = true;
      return true;
    }

    const enCurso = this.#partida.enCurso;
    if (codigo === 'Enter' && !enCurso) this.#empezar();
    else if (codigo === 'KeyP' && enCurso) this.#accion('pausar');
    else if (codigo === 'Escape' && enCurso) this.#accion('terminar');
    else return false;
    return true;
  }

  #teclaArriba(codigo) {
    const direccion = TECLAS[codigo];
    if (direccion) this.#entrada[direccion] = false;
  }
}
