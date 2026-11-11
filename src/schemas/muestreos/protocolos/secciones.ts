import { z } from "zod";

/**
 * Las piezas con las que se arman los protocolos. Varios tipos comparten
 * secciones enteras —el croquis, la zona, la forma del punto de muestreo— así
 * que se definen una vez acá y cada tipo las compone con las suyas.
 *
 * Es el espejo de
 * casa_be/src/modules/programacion/application/helpers/protocolos/secciones.ts.
 * Está duplicado a propósito: el dispositivo tiene que poder validar sin
 * conexión, y el servidor no puede confiar en que el cliente lo haya hecho.
 */

// --- Adjuntos --------------------------------------------------------------

export const ImagenSchema = z.object({
  id_local: z.string(),
  nombre_imagen: z.string(),
  url_imagen: z.string(),
  fecha_actualizacion_imagen: z.string(),
});
export type Imagen = z.infer<typeof ImagenSchema>;

export const TrazoSchema = z.object({
  color: z.string(),
  grosor: z.number(),
  puntos: z.array(z.tuple([z.number(), z.number()])),
});

export const PizarraSchema = z.object({
  version: z.number(),
  ancho: z.number(),
  alto: z.number(),
  trazos: z.array(TrazoSchema),
  url_imagen: z.string().nullable(),
});
export type Pizarra = z.infer<typeof PizarraSchema>;

const PIZARRA_VACIA: Pizarra = {
  version: 1,
  ancho: 800,
  alto: 600,
  trazos: [],
  url_imagen: null,
};

// --- Lo común a todos los protocolos ---------------------------------------

const zonaMuestreoShape = {
  direccion: z.string(),
  departamento: z.string(),
  provincia: z.string(),
  municipio: z.string(),
  zona: z.string(),
  latitud_gps: z.number().nullable(),
  longitud_gps: z.number().nullable(),
};

export const COMUN_SHAPE = {
  zona_muestreo: z.object(zonaMuestreoShape),
  croquis_punto: z.object({
    imagenes: z.array(ImagenSchema),
    pizarra: PizarraSchema,
  }),
  observaciones: z.string(),
  fecha_ingreso_muestra: z.string(),
  hora_ingreso_muestra: z.string(),
  completo: z.boolean(),
};

/** Al cerrar, la dirección del muestreo deja de ser opcional. */
export const COMUN_CIERRE_SHAPE = {
  ...COMUN_SHAPE,
  zona_muestreo: z.object({
    ...zonaMuestreoShape,
    direccion: z.string().min(1, "La dirección del muestreo es requerida"),
  }),
};

export const ProtocoloComunSchema = z.object(COMUN_SHAPE);
export type ProtocoloComun = z.infer<typeof ProtocoloComunSchema>;

export const COMUN_VACIO: ProtocoloComun = {
  zona_muestreo: {
    direccion: "",
    departamento: "",
    provincia: "",
    municipio: "",
    zona: "",
    latitud_gps: null,
    longitud_gps: null,
  },
  croquis_punto: { imagenes: [], pizarra: PIZARRA_VACIA },
  observaciones: "",
  fecha_ingreso_muestra: "",
  hora_ingreso_muestra: "",
  completo: false,
};

// --- Secciones que comparten varios tipos ----------------------------------

/** El punto de muestreo de los residuos: puede tener su propio tratamiento. */
export const puntoMuestreoResiduosSchema = z.object({
  tipo: z.string(),
  tratamiento: z.boolean(),
  tipo_tratamiento: z.string(),
});

export const PUNTO_MUESTREO_RESIDUOS_VACIO = {
  tipo: "",
  tratamiento: false,
  tipo_tratamiento: "",
};

/**
 * Cómo se tomó la muestra. Hoy solo el compuesto pide algo en `data` —las horas
 * de muestreo—; las otras modalidades lo dejan vacío.
 */
export const tipoMuestreoSchema = z.object({
  tipo: z.string(),
  data: z.object({ horas_muestreo: z.string() }),
});

export const TIPO_MUESTREO_VACIO = { tipo: "", data: { horas_muestreo: "" } };

export const inspeccionResiduosShape = {
  condiciones_lugar_muestreo: z.string(),
  condiciones_punto_muestreo: z.string(),
  persona_referencia: z.string(),
  imagenes: z.array(ImagenSchema),
};

export const INSPECCION_RESIDUOS_VACIA = {
  condiciones_lugar_muestreo: "",
  condiciones_punto_muestreo: "",
  persona_referencia: "",
  imagenes: [],
};

/** Las mediciones de residuos, iguales en industriales y domésticos. */
export const medicionesResiduosSchema = z.object({
  ph: z.string(),
  conductividad_us_cm: z.string(),
  temperatura_muestra_c: z.string(),
  temperatura_ambiente_c: z.string(),
  od_mg_l: z.string(),
  caudal_l_s: z.string(),
  solidos_sedimentales: z.string(),
  productos_quimicos: z.string(),
});

export const MEDICIONES_RESIDUOS_VACIAS = {
  ph: "",
  conductividad_us_cm: "",
  temperatura_muestra_c: "",
  temperatura_ambiente_c: "",
  od_mg_l: "",
  caudal_l_s: "",
  solidos_sedimentales: "",
  productos_quimicos: "",
};
