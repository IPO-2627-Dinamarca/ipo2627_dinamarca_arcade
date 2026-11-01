import { cargarDificultades } from './model/almacen.js';
import { Vista } from './view/vista.js';
import { Controlador } from './controller/controlador.js';

// El HTML arranca con el aviso estático de error; si este módulo se ejecuta, pasa a "cargando".
const vista = new Vista();
vista.mostrarCargando();
try {
  new Controlador(await cargarDificultades(), vista).iniciar();
} catch (error) {
  console.error(error);
  vista.mostrarError(error.message);
}
