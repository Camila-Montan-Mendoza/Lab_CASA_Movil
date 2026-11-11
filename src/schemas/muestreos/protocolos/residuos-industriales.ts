import { z } from "zod";
import {
  ImagenSchema,
  inspeccionResiduosShape,
  INSPECCION_RESIDUOS_VACIA,
  medicionesResiduosSchema,
  MEDICIONES_RESIDUOS_VACIAS,
  puntoMuestreoResiduosSchema,
  PUNTO_MUESTREO_RESIDUOS_VACIO,
  tipoMuestreoSchema,
  TIPO_MUESTREO_VACIO,
} from "./secciones";

/** RIL — Residuos Industriales Líquidos. */

export const RESIDUOS_INDUSTRIALES_SHAPE = {
  muestra_punto_muestreo: z.object({
    fuente: z.object({ tipo: z.string() }),
    tipo_actividad: z.object({ tipo: z.string(), especificacion: z.string() }),
    tratamiento_ril: z.object({ existe: z.boolean(), especificacion: z.string() }),
    lugar_muestreo: z.string(),
    punto_muestreo: puntoMuestreoResiduosSchema,
    detalle_punto_muestreo: z.string(),
    tipo_muestreo_seleccionado: tipoMuestreoSchema,
    apariencia_muestra: z.string(),
    estado_tiempo: z.string(),
    muestreo_simple_preservado_casa: z.boolean(),
  }),
  inspeccion_sanitaria: z.object({
    condiciones_ptar_ril: z.string(),
    ...inspeccionResiduosShape,
    evacuacion_final_ril: z.string(),
    imagenes: z.array(ImagenSchema),
  }),
  mediciones_campo: medicionesResiduosSchema,
};

export const RESIDUOS_INDUSTRIALES_CIERRE_SHAPE = {
  ...RESIDUOS_INDUSTRIALES_SHAPE,
  muestra_punto_muestreo: RESIDUOS_INDUSTRIALES_SHAPE.muestra_punto_muestreo.extend({
    fuente: z.object({ tipo: z.string().min(1, "El tipo de fuente es requerido") }),
    lugar_muestreo: z.string().min(1, "El lugar de muestreo es requerido"),
  }),
};

export const RESIDUOS_INDUSTRIALES_VACIO = {
  muestra_punto_muestreo: {
    fuente: { tipo: "" },
    tipo_actividad: { tipo: "", especificacion: "" },
    tratamiento_ril: { existe: false, especificacion: "" },
    lugar_muestreo: "",
    punto_muestreo: PUNTO_MUESTREO_RESIDUOS_VACIO,
    detalle_punto_muestreo: "",
    tipo_muestreo_seleccionado: TIPO_MUESTREO_VACIO,
    apariencia_muestra: "",
    estado_tiempo: "",
    muestreo_simple_preservado_casa: false,
  },
  inspeccion_sanitaria: {
    condiciones_ptar_ril: "",
    ...INSPECCION_RESIDUOS_VACIA,
    evacuacion_final_ril: "",
  },
  mediciones_campo: MEDICIONES_RESIDUOS_VACIAS,
};
