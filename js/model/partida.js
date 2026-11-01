import { MUNDO, TAMANO, solapan, crearNave, crearInvasor } from './entidades.js';

const COLUMNAS = 8;
const SEPARACION = { x: 30, y: 24 };
const MARGEN = 14;
const PASO = 4;
const BAJADA = 10;
const VELOCIDAD_NAVE = 150;
const VELOCIDAD_DISPARO = 260;
const VELOCIDAD_BOMBA = 100;
const VELOCIDAD_OVNI = 55;
const CADENCIA = 0.4;
const PREMIOS_OVNI = [50, 100, 150, 300];

export class Partida {
  constructor(dificultad) {
    this.dificultad = dificultad;
    this.estado = 'parado';
    this.motivo = null;
    this.puntos = 0;
    this.vidas = 0;
    this.nivel = 0;
    this.nave = crearNave();
    this.invasores = [];
    this.disparos = [];
    this.bombas = [];
    this.explosiones = [];
    this.ovni = null;
    this.cuadro = 0;
    this.espera = 0;
    this.invulnerable = 0;
  }

  empezar() {
    if (this.estado === 'jugando' || this.estado === 'pausado') return;
    this.estado = 'jugando';
    this.motivo = null;
    this.puntos = 0;
    this.vidas = this.dificultad.vidas;
    this.nivel = 0;
    this.nave = crearNave();
    this.explosiones = [];
    this.invulnerable = 0;
    this.#siguienteNivel();
  }

  alternarPausa() {
    if (this.estado === 'jugando') this.estado = 'pausado';
    else if (this.estado === 'pausado') this.estado = 'jugando';
  }

  terminar() {
    if (this.estado === 'jugando' || this.estado === 'pausado') this.#acabar('abandono');
  }

  actualizar(dt, entrada) {
    if (this.estado !== 'jugando') return;

    this.#moverNave(dt, entrada);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    for (const e of this.explosiones) e.ttl -= dt;
    this.explosiones = this.explosiones.filter((e) => e.ttl > 0);

    if (this.espera > 0) {
      this.espera -= dt;
      return;
    }

    this.#disparar(dt, entrada);
    this.#moverProyectiles(dt);
    this.#moverFormacion(dt);
    this.#moverOvni(dt);
    this.#resolverColisiones();

    if (this.estado === 'jugando' && this.invasores.length === 0) this.#siguienteNivel();
  }

  #siguienteNivel() {
    this.nivel += 1;
    this.disparos = [];
    this.bombas = [];
    this.ovni = null;
    this.direccion = 1;
    this.cuadro = 0;
    this.espera = 1.8;
    this.enfriamiento = 0;
    this.relojOvni = 14 + Math.random() * 10;

    const filas = Math.min(3 + Math.floor((this.nivel - 1) / 2), 5);
    const x0 = (MUNDO.ancho - (COLUMNAS - 1) * SEPARACION.x) / 2;
    const y0 = 52 + Math.min(this.nivel - 1, 4) * 8;
    this.invasores = [];
    for (let fila = 0; fila < filas; fila++) {
      const tipo = fila === 0 ? 0 : fila === filas - 1 ? 2 : 1;
      for (let columna = 0; columna < COLUMNAS; columna++) {
        this.invasores.push(crearInvasor(tipo, x0 + columna * SEPARACION.x, y0 + fila * SEPARACION.y, columna));
      }
    }
    this.totalInvasores = this.invasores.length;
    this.relojPaso = this.#intervaloPaso();
    this.relojBomba = this.#intervaloBomba();
  }

  #acabar(motivo) {
    this.estado = 'fin';
    this.motivo = motivo;
  }

  #moverNave(dt, entrada) {
    const sentido = (entrada.derecha ? 1 : 0) - (entrada.izquierda ? 1 : 0);
    const limite = this.nave.w / 2 + 4;
    this.nave.x = Math.min(MUNDO.ancho - limite, Math.max(limite, this.nave.x + sentido * VELOCIDAD_NAVE * dt));
  }

  #disparar(dt, entrada) {
    this.enfriamiento -= dt;
    if (!entrada.disparo || this.enfriamiento > 0) return;
    if (this.disparos.length >= this.dificultad.disparosMax) return;
    this.disparos.push({ x: this.nave.x, y: this.nave.y - this.nave.h / 2, ...TAMANO.disparo });
    this.enfriamiento = CADENCIA;
  }

  #moverProyectiles(dt) {
    for (const d of this.disparos) d.y -= VELOCIDAD_DISPARO * dt;
    this.disparos = this.disparos.filter((d) => d.y > -d.h);
    for (const b of this.bombas) b.y += VELOCIDAD_BOMBA * dt;
    this.bombas = this.bombas.filter((b) => b.y < MUNDO.alto + b.h);

    this.relojBomba -= dt;
    if (this.relojBomba <= 0 && this.bombas.length < this.dificultad.bombasMax) {
      this.#lanzarBomba();
      this.relojBomba = this.#intervaloBomba();
    }
  }

  #intervaloBomba() {
    return (this.dificultad.bombas * (0.5 + Math.random())) / (1 + 0.1 * (this.nivel - 1));
  }

  #lanzarBomba() {
    const masBajos = new Map();
    for (const i of this.invasores) {
      const actual = masBajos.get(i.columna);
      if (!actual || i.y > actual.y) masBajos.set(i.columna, i);
    }
    const candidatos = [...masBajos.values()];
    let origen = candidatos[Math.floor(Math.random() * candidatos.length)];
    if (Math.random() < 0.35) {
      origen = candidatos.reduce((a, b) => (Math.abs(b.x - this.nave.x) < Math.abs(a.x - this.nave.x) ? b : a));
    }
    this.bombas.push({ x: origen.x, y: origen.y + origen.h / 2, ...TAMANO.bomba });
  }

  #intervaloPaso() {
    const restantes = this.invasores.length / (this.totalInvasores || 1);
    const intervalo = this.dificultad.paso * (0.15 + 0.85 * restantes) / (1 + 0.1 * (this.nivel - 1));
    return Math.max(0.05, intervalo);
  }

  #moverFormacion(dt) {
    this.relojPaso -= dt;
    while (this.relojPaso <= 0 && this.invasores.length > 0) {
      this.#darPaso();
      this.relojPaso += this.#intervaloPaso();
    }
  }

  #darPaso() {
    let izquierda = Infinity;
    let derecha = -Infinity;
    for (const i of this.invasores) {
      izquierda = Math.min(izquierda, i.x - i.w / 2);
      derecha = Math.max(derecha, i.x + i.w / 2);
    }
    const dx = this.direccion * PASO;
    if (izquierda + dx < MARGEN || derecha + dx > MUNDO.ancho - MARGEN) {
      for (const i of this.invasores) i.y += BAJADA;
      this.direccion = -this.direccion;
    } else {
      for (const i of this.invasores) i.x += dx;
    }
    this.cuadro = 1 - this.cuadro;

    const techoNave = this.nave.y - this.nave.h / 2;
    if (this.invasores.some((i) => i.y + i.h / 2 >= techoNave)) this.#acabar('invasion');
  }

  #moverOvni(dt) {
    if (this.ovni) {
      this.ovni.x += this.ovni.sentido * VELOCIDAD_OVNI * dt;
      const fuera = this.ovni.sentido > 0 ? this.ovni.x > MUNDO.ancho + this.ovni.w : this.ovni.x < -this.ovni.w;
      if (fuera) this.#retirarOvni();
      return;
    }
    this.relojOvni -= dt;
    if (this.relojOvni <= 0 && this.invasores.length > 6) {
      const sentido = Math.random() < 0.5 ? 1 : -1;
      this.ovni = {
        x: sentido > 0 ? -TAMANO.ovni.w : MUNDO.ancho + TAMANO.ovni.w,
        y: 26,
        sentido,
        puntos: PREMIOS_OVNI[Math.floor(Math.random() * PREMIOS_OVNI.length)],
        ...TAMANO.ovni,
      };
    }
  }

  #retirarOvni() {
    this.ovni = null;
    this.relojOvni = 18 + Math.random() * 12;
  }

  #resolverColisiones() {
    for (const disparo of this.disparos) {
      const impactado = this.invasores.find((i) => solapan(disparo, i));
      if (impactado) {
        this.invasores = this.invasores.filter((i) => i !== impactado);
        this.puntos += impactado.puntos;
        this.#explosion(impactado.x, impactado.y, 0.3);
        disparo.y = -100;
      } else if (this.ovni && solapan(disparo, this.ovni)) {
        this.puntos += this.ovni.puntos;
        this.#explosion(this.ovni.x, this.ovni.y, 0.45);
        this.#retirarOvni();
        disparo.y = -100;
      }
    }
    this.disparos = this.disparos.filter((d) => d.y > -d.h);

    if (this.invulnerable > 0) return;
    if (this.bombas.some((b) => solapan(b, this.nave))) {
      this.#explosion(this.nave.x, this.nave.y, 0.7);
      this.bombas = [];
      this.vidas -= 1;
      if (this.vidas <= 0) this.#acabar('derrota');
      else this.invulnerable = 2;
    }
  }

  #explosion(x, y, duracion) {
    this.explosiones.push({ x, y, ttl: duracion, duracion });
  }
}
