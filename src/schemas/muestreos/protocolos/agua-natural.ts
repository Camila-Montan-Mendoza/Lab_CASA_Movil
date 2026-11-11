import { z } from "zod";

/**
 * AN — Agua Natural.
 *
 * Es el unico de los cuatro que no lleva inspeccion sanitaria: se muestrea un
 * rio o un lago, no una instalacion que haya que inspeccionar.
 */

export const AGUA_NATURAL_SHAPE = {
  muestra_punto_muestreo: z.object({
    fuente: z.object({
      tipo: z.string(),
      captacion: z.string(),
      profundidad_m: z.string(),
    }),
    lugar_muestreo: z.string(),
    punto_muestreo: z.string(),
    apariencia_muestra: z.string(),
    estado_tiempo: z.string(),
    tipo_muestreo: z.string(),
    muestreo_simple_preservado_casa: z.boolean(),
  }),
  mediciones_campo: z.object({
    ph: z.string(),
    conductividad_us_cm: z.string(),
    temperatura_muestra_c: z.string(),
    temperatura_ambiente_c: z.string(),
    turbiedad_ntu: z.string(),
    caudal_l_s: z.string(),
    /**
     * Las mediciones que no estan en la lista fija. Es una lista y no un solo
     * par porque en cuanto se miden dos cosas fuera de lo previsto, una sola
     * fila obliga a cambiar el formato.
     */
    otros: z.array(z.object({ ensayo: z.string(), valor: z.string() })),
  }),
};

export const AGUA_NATURAL_CIERRE_SHAPE = {
  ...AGUA_NATURAL_SHAPE,
  muestra_punto_muestreo: AGUA_NATURAL_SHAPE.muestra_punto_muestreo.extend({
    fuente: AGUA_NATURAL_SHAPE.muestra_punto_muestreo.shape.fuente.extend({
      tipo: z.string().min(1, "El tipo de fuente es requerido"),
    }),
    lugar_muestreo: z.string().min(1, "El lugar de muestreo es requerido"),
  }),
};

export const AGUA_NATURAL_VACIO = {
  muestra_punto_muestreo: {
    fuente: { tipo: "", captacion: "", profundidad_m: "" },
    lugar_muestreo: "",
    punto_muestreo: "",
    apariencia_muestra: "",
    estado_tiempo: "",
    tipo_muestreo: "",
    muestreo_simple_preservado_casa: false,
  },
  mediciones_campo: {
    ph: "",
    conductividad_us_cm: "",
    temperatura_muestra_c: "",
    temperatura_ambiente_c: "",
    turbiedad_ntu: "",
    caudal_l_s: "",
    otros: [],
  },
};
