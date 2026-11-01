import { Lienzo } from './lienzo.js';

const ETIQUETA_INICIAR = { parado: 'Iniciar', fin: 'Jugar otra vez' };

export class Vista {
  constructor() {
    this.raiz = document.querySelector('.app');
    this.nodo = (nombre) => this.raiz.querySelector(`[data-vista="${nombre}"]`);
    this.lienzo = new Lienzo(this.nodo('lienzo'));
    this.valores = {};
    for (const nombre of ['puntos', 'record', 'nivel', 'vidas']) this.valores[nombre] = this.nodo(nombre);
    this.botones = {
      iniciar: this.nodo('iniciar'),
      pausar: this.nodo('pausar'),
      terminar: this.nodo('terminar'),
    };
    this.selector = this.nodo('dificultad');
    this.ayuda = this.nodo('ayuda');
    this.cache = new Map();
  }

  alAccion(manejador) {
    this.raiz.addEventListener('click', (evento) => {
      const boton = evento.target.closest('[data-accion]');
      if (boton && !boton.disabled) manejador(boton.dataset.accion);
    });
  }

  alCambiarDificultad(manejador) {
    this.selector.addEventListener('change', () => manejador(this.selector.value));
  }

  alMandoTactil(manejador) {
    for (const boton of this.raiz.querySelectorAll('[data-tactil]')) {
      const accion = boton.dataset.tactil;
      boton.addEventListener('pointerdown', (evento) => {
        boton.setPointerCapture(evento.pointerId);
        manejador(accion, true);
      });
      for (const tipo of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        boton.addEventListener(tipo, () => manejador(accion, false));
      }
      boton.addEventListener('contextmenu', (evento) => evento.preventDefault());
    }
  }

  alCerrarAyuda(manejador) {
    this.ayuda.addEventListener('close', manejador);
  }

  abrirAyuda() {
    if (!this.ayuda.open) this.ayuda.showModal();
  }

  enfocarJuego() {
    this.lienzo.canvas.focus({ preventScroll: true });
  }

  mostrarCargando() {
    this.raiz.dataset.estado = 'cargando';
    this.#escribir('mensaje', 'Cargando…');
  }

  mostrarError(texto) {
    this.raiz.dataset.estado = 'error';
    this.#escribir('mensaje', texto);
  }

  llenarDificultades(lista, activa) {
    this.selector.replaceChildren(
      ...lista.map((d) => {
        const opcion = new Option(d.nombre, d.id);
        opcion.selected = d.id === activa;
        return opcion;
      }),
    );
  }

  mostrarEstado(texto) {
    this.#escribir('estado', texto);
  }

  anunciar(texto) {
    this.#escribir('anuncio', texto);
  }

  actualizar(partida, record) {
    this.raiz.dataset.estado = partida.estado;
    this.#escribir('puntos', partida.puntos);
    this.#escribir('record', record);
    this.#escribir('nivel', partida.nivel || '—');
    this.#escribir('vidas', partida.estado === 'parado' ? '—' : partida.vidas);

    const activa = partida.estado === 'jugando' || partida.estado === 'pausado';
    this.botones.iniciar.disabled = activa;
    this.botones.iniciar.textContent = ETIQUETA_INICIAR[partida.estado] ?? 'Iniciar';
    this.botones.pausar.disabled = !activa;
    this.botones.pausar.textContent = partida.estado === 'pausado' ? 'Reanudar' : 'Pausar';
    this.botones.terminar.disabled = !activa;
    this.selector.disabled = activa;
  }

  pintar(partida, ahora) {
    this.lienzo.pintar(partida, ahora);
  }

  #escribir(nombre, valor) {
    if (this.cache.get(nombre) === valor) return;
    this.cache.set(nombre, valor);
    (this.valores[nombre] ?? this.nodo(nombre)).textContent = valor;
  }
}
