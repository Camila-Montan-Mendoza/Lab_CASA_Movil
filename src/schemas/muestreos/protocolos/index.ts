import { z } from "zod";
import {
  COMUN_CIERRE_SHAPE,
  COMUN_SHAPE,
  COMUN_VACIO,
  ProtocoloComunSchema,
  type ProtocoloComun,
} from "./secciones";
import { AGUA_CONSUMO_CIERRE_SHAPE, AGUA_CONSUMO_SHAPE, AGUA_CONSUMO_VACIO } from "./agua-consumo";
import {
  RESIDUOS_INDUSTRIALES_CIERRE_SHAPE,
  RESIDUOS_INDUSTRIALES_SHAPE,
  RESIDUOS_INDUSTRIALES_VACIO,
} from "./residuos-industriales";
import {
  RESIDUOS_DOMESTICOS_CIERRE_SHAPE,
  RESIDUOS_DOMESTICOS_SHAPE,
  RESIDUOS_DOMESTICOS_VACIO,
} from "./residuos-domesticos";
import { AGUA_NATURAL_CIERRE_SHAPE, AGUA_NATURAL_SHAPE, AGUA_NATURAL_VACIO } from "./agua-natural";

/**
 * Registro de tipos de protocolo, espejo del backend. Cada tipo define su
 * vacío, su schema y el schema de cierre —con los obligatorios— y las tres
 * cosas viven juntas: separadas se desincronizan.
 *
 * El protocolo es plano: los bloques comunes y los del tipo van al mismo nivel,
 * porque el muestreador ve un solo formulario.
 */

export * from "./secciones";

export const PROTOCOLO_AGUA_CONSUMO = "AC";
export const PROTOCOLO_AGUA_NATURAL = "AN";
export const PROTOCOLO_RESIDUOS_DOMESTICOS = "RDL";
export const PROTOCOLO_RESIDUOS_INDUSTRIALES = "RIL";

/** El protocolo tal como viaja: lo común más lo que agregue su tipo. */
export type Protocolo = ProtocoloComun & Record<string, unknown>;

/**
 * El envoltorio que se usa para leer la respuesta del servidor: exige los
 * bloques comunes y deja pasar los del tipo, que se validan con el schema que
 * les corresponde.
 */
export const ProtocoloSchema = z.looseObject(COMUN_SHAPE);

export interface DefinicionProtocolo {
  protocoloVacio: Protocolo;
  schema: z.ZodType;
  schemaCierre: z.ZodType;
}

const definir = (
  propioShape: z.ZodRawShape,
  propioCierreShape: z.ZodRawShape,
  propioVacio: object
): DefinicionProtocolo => ({
  protocoloVacio: { ...COMUN_VACIO, ...propioVacio } as Protocolo,
  schema: z.object({ ...COMUN_SHAPE, ...propioShape }),
  schemaCierre: z.object({ ...COMUN_CIERRE_SHAPE, ...propioCierreShape }),
});

export const PROTOCOLOS: Record<string, DefinicionProtocolo> = {
  [PROTOCOLO_AGUA_CONSUMO]: definir(
    AGUA_CONSUMO_SHAPE,
    AGUA_CONSUMO_CIERRE_SHAPE,
    AGUA_CONSUMO_VACIO
  ),
  [PROTOCOLO_AGUA_NATURAL]: definir(
    AGUA_NATURAL_SHAPE,
    AGUA_NATURAL_CIERRE_SHAPE,
    AGUA_NATURAL_VACIO
  ),
  [PROTOCOLO_RESIDUOS_DOMESTICOS]: definir(
    RESIDUOS_DOMESTICOS_SHAPE,
    RESIDUOS_DOMESTICOS_CIERRE_SHAPE,
    RESIDUOS_DOMESTICOS_VACIO
  ),
  [PROTOCOLO_RESIDUOS_INDUSTRIALES]: definir(
    RESIDUOS_INDUSTRIALES_SHAPE,
    RESIDUOS_INDUSTRIALES_CIERRE_SHAPE,
    RESIDUOS_INDUSTRIALES_VACIO
  ),
};

/** Un tipo que no esté en el registro se queda con la parte común. */
const SIN_DEFINIR: DefinicionProtocolo = {
  protocoloVacio: COMUN_VACIO,
  schema: ProtocoloComunSchema,
  schemaCierre: z.object(COMUN_CIERRE_SHAPE),
};

export const definicionProtocolo = (codigo: string): DefinicionProtocolo =>
  PROTOCOLOS[codigo] ?? SIN_DEFINIR;

// --- Los cuerpos por tipo, para separar lo común de lo propio --------------

/**
 * Solo los bloques propios de cada tipo. El protocolo viaja plano, pero el
 * formulario separa lo común de lo del tipo: así la sección de cada protocolo
 * es independiente y agregar uno nuevo no toca a los demás.
 */
export const DatosAguaConsumoSchema = z.object(AGUA_CONSUMO_SHAPE);
export type DatosAguaConsumo = z.infer<typeof DatosAguaConsumoSchema>;

export const DatosAguaNaturalSchema = z.object(AGUA_NATURAL_SHAPE);
export type DatosAguaNatural = z.infer<typeof DatosAguaNaturalSchema>;

export const DatosResiduosDomesticosSchema = z.object(RESIDUOS_DOMESTICOS_SHAPE);
export type DatosResiduosDomesticos = z.infer<typeof DatosResiduosDomesticosSchema>;

export const DatosResiduosIndustrialesSchema = z.object(RESIDUOS_INDUSTRIALES_SHAPE);
export type DatosResiduosIndustriales = z.infer<typeof DatosResiduosIndustrialesSchema>;

/** El cuerpo de cualquiera de los cuatro, para tipar el estado del formulario. */
export type DatosProtocolo =
  | DatosAguaConsumo
  | DatosAguaNatural
  | DatosResiduosDomesticos
  | DatosResiduosIndustriales;

/** El schema del cuerpo que le toca a cada tipo. */
export const schemaDelCuerpo = (codigo: string): z.ZodType => {
  switch (codigo) {
    case PROTOCOLO_AGUA_CONSUMO:
      return DatosAguaConsumoSchema;
    case PROTOCOLO_AGUA_NATURAL:
      return DatosAguaNaturalSchema;
    case PROTOCOLO_RESIDUOS_DOMESTICOS:
      return DatosResiduosDomesticosSchema;
    case PROTOCOLO_RESIDUOS_INDUSTRIALES:
      return DatosResiduosIndustrialesSchema;
    default:
      // Sin cuerpo propio: el formulario muestra solo los bloques comunes.
      return z.object({});
  }
};
