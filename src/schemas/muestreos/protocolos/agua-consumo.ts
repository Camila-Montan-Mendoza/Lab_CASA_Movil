import { z } from "zod";
import { ImagenSchema } from "./secciones";

/** AC — Aguas de Consumo. */

export const AGUA_CONSUMO_SHAPE = {
  muestra_punto_muestreo: z.object({
    fuente: z.object({
      tipo: z.string(),
      captacion: z.string(),
      profundidad_m: z.string(),
    }),
    existe_tratamiento_agua: z.boolean(),
    distribucion: z.object({ tipo: z.string(), especificacion: z.string() }),
    lugar_muestreo: z.string(),
    punto_muestreo: z.string(),
    uso_agua: z.string(),
    apariencia_muestra: z.string(),
    estado_tiempo: z.string(),
    muestreo_simple_preservado_casa: z.boolean(),
  }),
  inspeccion_sanitaria: z.object({
    estado_sanitario_lugar: z.string(),
    estado_sanitario_punto: z.string(),
    almacena_agua: z.boolean(),
    almacenamiento_agua: z.object({
      tanque: z.object({ tipo: z.string(), volumen_m3: z.string() }),
      tiene_aireador: z.boolean(),
      tiene_tuberia_rebalse: z.boolean(),
      tiene_control_nivel: z.boolean(),
      tiene_drenaje: z.boolean(),
      frecuencia_limpieza: z.string(),
    }),
    material_tuberia: z.string(),
    antiguedad_tuberia: z.string(),
    persona_referencia: z.string(),
    imagenes: z.array(ImagenSchema),
  }),
  mediciones_campo: z.object({
    ph: z.string(),
    conductividad_us_cm: z.string(),
    temperatura_muestra_c: z.string(),
    temperatura_ambiente_c: z.string(),
    cloro_residual_mg_l: z.string(),
    turbiedad_ntu: z.string(),
    caudal_l_s: z.string(),
  }),
};

/** Lo que no se puede dejar en blanco al cerrar. */
export const AGUA_CONSUMO_CIERRE_SHAPE = {
  ...AGUA_CONSUMO_SHAPE,
  muestra_punto_muestreo: AGUA_CONSUMO_SHAPE.muestra_punto_muestreo.extend({
    fuente: AGUA_CONSUMO_SHAPE.muestra_punto_muestreo.shape.fuente.extend({
      tipo: z.string().min(1, "El tipo de fuente es requerido"),
    }),
    lugar_muestreo: z.string().min(1, "El lugar de muestreo es requerido"),
  }),
};

export const AGUA_CONSUMO_VACIO = {
  muestra_punto_muestreo: {
    fuente: { tipo: "", captacion: "", profundidad_m: "" },
    existe_tratamiento_agua: false,
    distribucion: { tipo: "", especificacion: "" },
    lugar_muestreo: "",
    punto_muestreo: "",
    uso_agua: "",
    apariencia_muestra: "",
    estado_tiempo: "",
    muestreo_simple_preservado_casa: false,
  },
  inspeccion_sanitaria: {
    estado_sanitario_lugar: "",
    estado_sanitario_punto: "",
    almacena_agua: false,
    almacenamiento_agua: {
      tanque: { tipo: "", volumen_m3: "" },
      tiene_aireador: false,
      tiene_tuberia_rebalse: false,
      tiene_control_nivel: false,
      tiene_drenaje: false,
      frecuencia_limpieza: "",
    },
    material_tuberia: "",
    antiguedad_tuberia: "",
    persona_referencia: "",
    imagenes: [],
  },
  mediciones_campo: {
    ph: "",
    conductividad_us_cm: "",
    temperatura_muestra_c: "",
    temperatura_ambiente_c: "",
    cloro_residual_mg_l: "",
    turbiedad_ntu: "",
    caudal_l_s: "",
  },
};
