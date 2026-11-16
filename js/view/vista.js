import { ESTADO, MOTIVO } from '../model/partida.js';
import { Lienzo } from './lienzo.js';

const ETIQUETA_INICIAR = { [ESTADO.PARADO]: 'Iniciar', [ESTADO.FIN]: 'Jugar otra vez' };

const TEXTO_FIN = {
  [MOTIVO.INVASION]: 'Los marcianos han llegado a tierra.',
  [MOTIVO.DERROTA]: 'Te has quedado sin vidas.',
  [MOTIVO.ABANDONO]: 'Partida terminada.',
};

// Controles que ya usan estas teclas: los atajos del juego no deben quitárselas.
const CONTROLES_NATIVOS = 'button, select, dialog, a';

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
    this.nivelMostrado = 0;
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

  alTeclado(alPulsar, alSoltar) {
    document.addEventListener('keydown', (evento) => {
      if (evento.ctrlKey || evento.metaKey || evento.altKey) return;
      if (evento.target.closest(CONTROLES_NATIVOS)) return;
      if (alPulsar(evento.code)) evento.preventDefault();
    });
    document.addEventListener('keyup', (evento) => alSoltar(evento.code));
  }

  alPerderFoco(manejador) {
    window.addEventListener('blur', manejador);
  }

  alOcultarse(manejador) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) manejador();
    });
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

  mostrarListo() {
    this.#escribir('estado', 'Pulsa Intro o Iniciar para empezar.');
  }

  mostrarEnMarcha() {
    this.#escribir('estado', '');
    this.#escribir('anuncio', 'Partida en marcha. Nivel 1.');
  }

  mostrarPausa(enPausa) {
    this.#escribir('estado', enPausa ? 'En pausa. Pulsa P o Reanudar para seguir.' : '');
    this.#escribir('anuncio', enPausa ? 'Partida en pausa.' : 'Partida reanudada.');
  }

  mostrarResultado({ motivo, puntos }, nuevoRecord) {
    const texto = `${TEXTO_FIN[motivo]} ${puntos} puntos.${nuevoRecord ? ' Nuevo récord.' : ''}`;
    this.#escribir('estado', texto);
    this.#escribir('anuncio', texto);
  }

  actualizar(partida, record) {
    this.raiz.dataset.estado = partida.estado;
    this.#escribir('puntos', partida.puntos);
    this.#escribir('record', record);
    this.#escribir('nivel', partida.nivel || '—');
    this.#escribir('vidas', partida.estado === ESTADO.PARADO ? '—' : partida.vidas);
    this.#anunciarNivel(partida.nivel);

    const activa = partida.enCurso;
    this.botones.iniciar.disabled = activa;
    this.botones.iniciar.textContent = ETIQUETA_INICIAR[partida.estado] ?? 'Iniciar';
    this.botones.pausar.disabled = !activa;
    this.botones.pausar.textContent = partida.estado === ESTADO.PAUSADO ? 'Reanudar' : 'Pausar';
    this.botones.terminar.disabled = !activa;
    this.selector.disabled = activa;
  }

  pintar(partida, ahora) {
    this.lienzo.pintar(partida, ahora);
  }

  #anunciarNivel(nivel) {
    if (nivel > 1 && nivel !== this.nivelMostrado) this.#escribir('anuncio', `Nivel ${nivel}`);
    this.nivelMostrado = nivel;
  }

  #escribir(nombre, valor) {
    if (this.cache.get(nombre) === valor) return;
    this.cache.set(nombre, valor);
    (this.valores[nombre] ?? this.nodo(nombre)).textContent = valor;
  }
}
