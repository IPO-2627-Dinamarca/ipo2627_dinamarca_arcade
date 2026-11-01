const CLAVE_RECORDS = 'marcianitos-records';

export async function cargarDificultades() {
  let respuesta;
  try {
    respuesta = await fetch('data/dificultades.json');
  } catch {
    throw new Error('No se han podido cargar las dificultades. Comprueba la conexión o sirve la página desde un servidor local.');
  }
  if (!respuesta.ok) {
    throw new Error(`No se han podido cargar las dificultades (error ${respuesta.status}).`);
  }
  let lista;
  try {
    lista = await respuesta.json();
  } catch {
    throw new Error('El fichero de dificultades no es un JSON válido.');
  }
  if (!Array.isArray(lista) || lista.length === 0) {
    throw new Error('El fichero de dificultades está vacío.');
  }
  return lista;
}

export function leerRecords() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_RECORDS));
    return guardado && typeof guardado === 'object' ? guardado : {};
  } catch {
    return {};
  }
}

export function guardarRecord(dificultad, puntos) {
  const records = leerRecords();
  records[dificultad] = puntos;
  try {
    localStorage.setItem(CLAVE_RECORDS, JSON.stringify(records));
  } catch {
    // Sin almacenamiento el récord solo dura lo que la página.
  }
  return records;
}
