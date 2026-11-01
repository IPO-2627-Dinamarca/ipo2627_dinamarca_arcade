import { MUNDO } from '../model/entidades.js';
import { CELDA, MAPAS, crearSprite } from './sprites.js';

const ESTRELLAS = 36;

function generarEstrellas() {
  let semilla = 7;
  const azar = () => {
    semilla = (semilla * 16807) % 2147483647;
    return semilla / 2147483647;
  };
  return Array.from({ length: ESTRELLAS }, () => ({
    x: Math.floor(azar() * MUNDO.ancho),
    y: azar() * MUNDO.alto,
    velocidad: 4 + azar() * 10,
    brillo: 0.3 + azar() * 0.5,
  }));
}

export class Lienzo {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.estrellas = generarEstrellas();
    this.sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)');
    this.leerColores();
    this.escala = 1;
    new ResizeObserver(() => this.ajustar()).observe(canvas);
    this.ajustar();
  }

  leerColores() {
    const css = getComputedStyle(this.canvas);
    const color = (nombre) => css.getPropertyValue(nombre).trim();
    this.colores = {
      pantalla: color('--pantalla'),
      tenue: color('--pantalla-tenue'),
      texto: color('--pantalla-texto'),
      jugador: color('--jugador'),
      invasor: color('--invasor'),
      ovni: color('--ovni'),
    };
    this.fuente = css.getPropertyValue('--fuente-pantalla').trim();
    this.sprites = {
      nave: crearSprite(MAPAS.nave, this.colores.jugador),
      ovni: crearSprite(MAPAS.ovni, this.colores.ovni),
      invasor: MAPAS.invasor.map((cuadros) => cuadros.map((mapa) => crearSprite(mapa, this.colores.invasor))),
    };
  }

  ajustar() {
    const ancho = Math.round(this.canvas.clientWidth * devicePixelRatio);
    if (ancho === 0 || ancho === this.canvas.width) return;
    this.canvas.width = ancho;
    this.canvas.height = Math.round((ancho * MUNDO.alto) / MUNDO.ancho);
    this.escala = ancho / MUNDO.ancho;
  }

  pintar(partida, ahora) {
    const { ctx, colores } = this;
    ctx.setTransform(this.escala, 0, 0, this.escala, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = colores.pantalla;
    ctx.fillRect(0, 0, MUNDO.ancho, MUNDO.alto);

    this.#fondo(partida, ahora);
    this.#entidades(partida, ahora);
    this.#vidas(partida);
    this.#rotulos(partida);
  }

  #fondo(partida, ahora) {
    const { ctx, colores } = this;
    const mueve = !this.sinMovimiento.matches && partida.estado !== 'pausado';
    ctx.fillStyle = colores.texto;
    for (const e of this.estrellas) {
      const y = mueve ? (e.y + (ahora / 1000) * e.velocidad) % MUNDO.alto : e.y;
      ctx.globalAlpha = e.brillo;
      ctx.fillRect(e.x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = colores.tenue;
    ctx.fillRect(8, partida.nave.y + partida.nave.h / 2 + 4, MUNDO.ancho - 16, 1);
  }

  #sprite(sprite, x, y, celda = CELDA) {
    const ancho = sprite.width * celda;
    const alto = sprite.height * celda;
    this.ctx.drawImage(sprite, x - ancho / 2, y - alto / 2, ancho, alto);
  }

  #entidades(partida, ahora) {
    const { ctx, colores, sprites } = this;
    if (partida.estado === 'parado') return;

    for (const i of partida.invasores) this.#sprite(sprites.invasor[i.tipo][partida.cuadro], i.x, i.y);
    if (partida.ovni) this.#sprite(sprites.ovni, partida.ovni.x, partida.ovni.y);

    const parpadeo = partida.invulnerable > 0 && Math.floor(ahora / 100) % 2 === 0;
    if (partida.vidas > 0 && !parpadeo) this.#sprite(sprites.nave, partida.nave.x, partida.nave.y);

    ctx.fillStyle = colores.jugador;
    for (const d of partida.disparos) ctx.fillRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
    ctx.fillStyle = colores.invasor;
    for (const b of partida.bombas) ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);

    for (const e of partida.explosiones) {
      const avance = 1 - e.ttl / e.duracion;
      const radio = 3 + avance * 14;
      ctx.globalAlpha = 1 - avance;
      ctx.fillStyle = colores.texto;
      for (let k = 0; k < 8; k++) {
        const angulo = (k * Math.PI) / 4;
        ctx.fillRect(Math.round(e.x + Math.cos(angulo) * radio) - 1, Math.round(e.y + Math.sin(angulo) * radio) - 1, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
  }

  #vidas(partida) {
    if (partida.estado === 'parado') return;
    const y = MUNDO.alto - 12;
    for (let k = 0; k < partida.vidas; k++) this.#sprite(this.sprites.nave, 18 + k * 18, y, 1);
  }

  #texto(texto, y, cuerpo, color = this.colores.texto) {
    const { ctx } = this;
    ctx.font = `bold ${cuerpo}px ${this.fuente}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, MUNDO.ancho / 2, y);
  }

  #velo() {
    this.ctx.globalAlpha = 0.72;
    this.ctx.fillStyle = this.colores.pantalla;
    this.ctx.fillRect(0, 0, MUNDO.ancho, MUNDO.alto);
    this.ctx.globalAlpha = 1;
  }

  #rotulos(partida) {
    const centro = MUNDO.alto / 2;
    switch (partida.estado) {
      case 'parado':
        this.#texto('MARCIANITOS', centro - 14, 26, this.colores.jugador);
        this.#texto('Pulsa Intro para jugar', centro + 22, 12);
        break;
      case 'pausado':
        this.#velo();
        this.#texto('PAUSA', centro - 8, 26);
        this.#texto('P para seguir', centro + 24, 12);
        break;
      case 'fin':
        this.#velo();
        this.#texto(partida.motivo === 'abandono' ? 'PARTIDA TERMINADA' : 'FIN DEL JUEGO', centro - 18, 22, this.colores.invasor);
        this.#texto(`${partida.puntos} puntos`, centro + 14, 14);
        break;
      default:
        if (partida.espera > 0) this.#texto(`NIVEL ${partida.nivel}`, centro, 22);
    }
  }
}
