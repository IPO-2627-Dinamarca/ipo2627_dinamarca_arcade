import { Partida } from '../model/partida.js';
import { guardarRecord, leerRecords } from '../model/almacen.js';

const PASO_FIJO = 1 / 60;

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
  #nivelAnunciado = 0;

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
    vista.alCerrarAyuda(() => vista.mostrarEstado('En pausa. Pulsa Reanudar para seguir.'));

    document.addEventListener('keydown', (e) => this.#teclaAbajo(e));
    document.addEventListener('keyup', (e) => this.#teclaArriba(e));
    window.addEventListener('blur', () => this.#soltarTodo());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.#pausarSiJuega();
    });

    vista.mostrarEstado('Pulsa Intro o Iniciar para empezar.');
    this.#sincronizar();
    requestAnimationFrame((t) => this.#bucle(t));
  }

  #bucle(ahora) {
    requestAnimationFrame((t) => this.#bucle(t));
    this.#acumulado += Math.min((ahora - this.#ultimo) / 1000, 0.1);
    this.#ultimo = ahora;

    const antes = this.#partida.estado;
    while (this.#acumulado >= PASO_FIJO) {
      this.#partida.actualizar(PASO_FIJO, this.#entrada);
      this.#acumulado -= PASO_FIJO;
    }
    if (antes === 'jugando' && this.#partida.estado === 'fin') this.#alTerminar();
    if (this.#partida.nivel !== this.#nivelAnunciado) {
      this.#nivelAnunciado = this.#partida.nivel;
      if (this.#nivelAnunciado > 1) this.#vista.anunciar(`Nivel ${this.#nivelAnunciado}`);
    }

    this.#sincronizar();
    this.#vista.pintar(this.#partida, ahora);
  }

  #sincronizar() {
    this.#vista.actualizar(this.#partida, this.#records[this.#partida.dificultad.id] ?? 0);
  }

  #accion(accion) {
    const partida = this.#partida;
    switch (accion) {
      case 'iniciar':
        this.#empezar();
        break;
      case 'pausar':
        partida.alternarPausa();
        this.#anunciarPausa();
        this.#vista.enfocarJuego();
        break;
      case 'terminar':
        partida.terminar();
        this.#alTerminar();
        break;
      case 'ayuda':
        this.#pausarSiJuega();
        this.#vista.abrirAyuda();
        break;
    }
  }

  #empezar() {
    if (this.#partida.estado === 'jugando' || this.#partida.estado === 'pausado') return;
    this.#soltarTodo();
    this.#partida.empezar();
    this.#acumulado = 0;
    this.#ultimo = performance.now();
    this.#nivelAnunciado = 0;
    this.#vista.mostrarEstado('');
    this.#vista.anunciar('Partida en marcha. Nivel 1.');
    this.#vista.enfocarJuego();
  }

  #pausarSiJuega() {
    if (this.#partida.estado !== 'jugando') return;
    this.#partida.alternarPausa();
    this.#anunciarPausa();
  }

  #anunciarPausa() {
    const enPausa = this.#partida.estado === 'pausado';
    this.#vista.mostrarEstado(enPausa ? 'En pausa.' : '');
    this.#vista.anunciar(enPausa ? 'Partida en pausa.' : 'Partida reanudada.');
  }

  #alTerminar() {
    const { puntos, dificultad, motivo } = this.#partida;
    this.#soltarTodo();
    let texto = motivo === 'invasion' ? 'Los marcianos han llegado a tierra.' : motivo === 'derrota' ? 'Te has quedado sin vidas.' : 'Partida terminada.';
    texto += ` ${puntos} puntos.`;
    if (puntos > (this.#records[dificultad.id] ?? 0)) {
      this.#records = guardarRecord(dificultad.id, puntos);
      texto += ' Nuevo récord.';
    }
    this.#vista.mostrarEstado(texto);
    this.#vista.anunciar(texto);
  }

  #cambiarDificultad(id) {
    const elegida = this.#dificultades.find((d) => d.id === id);
    if (!elegida) return;
    this.#partida = new Partida(elegida);
    this.#nivelAnunciado = 0;
    this.#vista.mostrarEstado('Pulsa Intro o Iniciar para empezar.');
  }

  #soltarTodo() {
    this.#entrada.izquierda = this.#entrada.derecha = this.#entrada.disparo = false;
  }

  #teclaAbajo(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    // Los atajos no deben quitarle las teclas a un botón, al selector, a un enlace ni al diálogo.
    if (e.target.closest('button, select, dialog, a')) return;

    const direccion = TECLAS[e.code];
    if (direccion) {
      e.preventDefault();
      this.#entrada[direccion] = true;
      return;
    }
    const estado = this.#partida.estado;
    const activa = estado === 'jugando' || estado === 'pausado';
    if (e.code === 'Enter' && !activa) {
      e.preventDefault();
      this.#empezar();
    } else if (e.code === 'KeyP' && activa) {
      this.#accion('pausar');
    } else if (e.code === 'Escape' && activa) {
      this.#accion('terminar');
    }
  }

  #teclaArriba(e) {
    const direccion = TECLAS[e.code];
    if (direccion) this.#entrada[direccion] = false;
  }
}
