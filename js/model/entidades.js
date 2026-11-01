export const MUNDO = { ancho: 300, alto: 400 };

export const TAMANO = {
  nave: { w: 26, h: 16 },
  invasor: [
    { w: 16, h: 16, puntos: 30 },
    { w: 22, h: 16, puntos: 20 },
    { w: 24, h: 16, puntos: 10 },
  ],
  ovni: { w: 32, h: 14 },
  disparo: { w: 2, h: 8 },
  bomba: { w: 3, h: 8 },
};

// Todas las entidades se colocan por su centro.
export function solapan(a, b) {
  return Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
}

export function crearNave() {
  return { x: MUNDO.ancho / 2, y: MUNDO.alto - 36, ...TAMANO.nave };
}

export function crearInvasor(tipo, x, y, columna) {
  return { x, y, tipo, columna, ...TAMANO.invasor[tipo] };
}
