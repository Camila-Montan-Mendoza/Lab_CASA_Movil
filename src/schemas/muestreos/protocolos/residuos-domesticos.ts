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

/**
 * RDL — Residuos Domésticos Líquidos.
 *
 * Comparte con RIL el punto de muestreo, el tipo de muestreo y las mediciones;
 * lo propio es la instalacion —una vivienda o un edificio, no una industria— y
 * su planta de tratamiento.
 */

export const RESIDUOS_DOMESTICOS_SHAPE = {
  muestra_punto_muestreo: z.object({
    tipo_instalacion: z.string(),
    planta_tratamiento: z.boolean(),
    descripcion_planta_tratamiento: z.string(),
    lugar_muestreo: z.string(),
    punto_muestreo: puntoMuestreoResiduosSchema,
    detalle_punto_muestreo: z.string(),
    tipo_muestreo_seleccionado: tipoMuestreoSchema,
    apariencia_muestra: z.string(),
    estado_tiempo: z.string(),
    muestreo_simple_preservado_casa: z.boolean(),
  }),
  inspeccion_sanitaria: z.object({
    condiciones_ptard: z.string(),
    ...inspeccionResiduosShape,
    evacuacion_final_ard: z.string(),
    imagenes: z.array(ImagenSchema),
  }),
  mediciones_campo: medicionesResiduosSchema,
};

export const RESIDUOS_DOMESTICOS_CIERRE_SHAPE = {
  ...RESIDUOS_DOMESTICOS_SHAPE,
  muestra_punto_muestreo: RESIDUOS_DOMESTICOS_SHAPE.muestra_punto_muestreo.extend({
    tipo_instalacion: z.string().min(1, "El tipo de instalación es requerido"),
    lugar_muestreo: z.string().min(1, "El lugar de muestreo es requerido"),
  }),
};

export const RESIDUOS_DOMESTICOS_VACIO = {
  muestra_punto_muestreo: {
    tipo_instalacion: "",
    planta_tratamiento: false,
    descripcion_planta_tratamiento: "",
    lugar_muestreo: "",
    punto_muestreo: PUNTO_MUESTREO_RESIDUOS_VACIO,
    detalle_punto_muestreo: "",
    tipo_muestreo_seleccionado: TIPO_MUESTREO_VACIO,
    apariencia_muestra: "",
    estado_tiempo: "",
    muestreo_simple_preservado_casa: false,
  },
  inspeccion_sanitaria: {
    condiciones_ptard: "",
    ...INSPECCION_RESIDUOS_VACIA,
    evacuacion_final_ard: "",
  },
  mediciones_campo: MEDICIONES_RESIDUOS_VACIAS,
};
