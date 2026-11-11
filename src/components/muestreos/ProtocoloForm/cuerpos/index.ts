import {
  PROTOCOLO_AGUA_CONSUMO,
  PROTOCOLO_AGUA_NATURAL,
  PROTOCOLO_RESIDUOS_DOMESTICOS,
  PROTOCOLO_RESIDUOS_INDUSTRIALES,
} from "@/schemas/muestreos/muestreos.schema";
import { cuerpoAguaConsumo } from "./AguaConsumo";
import { cuerpoAguaNatural } from "./AguaNatural";
import { cuerpoResiduosDomesticos } from "./ResiduosDomesticos";
import { cuerpoResiduosIndustriales } from "./ResiduosIndustriales";
import type { CuerpoProtocolo } from "./tipos";

const CUERPOS: Record<string, CuerpoProtocolo> = {
  [PROTOCOLO_AGUA_CONSUMO]: cuerpoAguaConsumo,
  [PROTOCOLO_AGUA_NATURAL]: cuerpoAguaNatural,
  [PROTOCOLO_RESIDUOS_DOMESTICOS]: cuerpoResiduosDomesticos,
  [PROTOCOLO_RESIDUOS_INDUSTRIALES]: cuerpoResiduosIndustriales,
};

export const cuerpoDelProtocolo = (codigo: string): CuerpoProtocolo | null =>
  CUERPOS[codigo] ?? null;

