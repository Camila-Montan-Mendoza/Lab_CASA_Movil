import { guardarPuntoLocal, obtenerPuntoOffline } from "@/db/offline-db";
import {
  definicionProtocolo,
  type Protocolo,
  type Punto,
} from "@/schemas/muestreos/muestreos.schema";
import { validarConTolerancia } from "./validar-con-tolerancia";

const CLAVES_EXCLUIDAS = ["zona_muestreo", "croquis_punto", "completo"];

export interface ResultadoCopiaPuntoOffline {
  puntoId: number;
  nombre: string;
  actualizado: boolean;
}

/**
 * Propaga localmente en SQLite las secciones repetibles del protocolo a los
 * puntos hermanos de la misma programación que tengan el mismo tipo de protocolo
 * y aún no estén verificados.
 */
export function copiarProtocoloAOtrosPuntosOffline(
  puntoOrigen: Punto,
  candidatos: Punto[]
): ResultadoCopiaPuntoOffline[] {
  if (candidatos.length === 0) return [];

  const porcionOrigen = Object.fromEntries(
    Object.entries(puntoOrigen.protocolo as Record<string, unknown>).filter(
      ([clave]) => !CLAVES_EXCLUIDAS.includes(clave)
    )
  );

  const resultados: ResultadoCopiaPuntoOffline[] = [];

  for (const destino of candidatos) {
    const puntoId = destino.info_muestreo.punto_id;
    const regDestino = obtenerPuntoOffline(puntoId);
    if (!regDestino || regDestino.punto.info_muestreo.protocolo_verificado) {
      continue;
    }

    const puntoDestino = regDestino.punto;
    const candidato = {
      ...(puntoDestino.protocolo as Record<string, unknown>),
      ...porcionOrigen,
    };

    const validado = validarConTolerancia(
      definicionProtocolo(puntoDestino.info_protocolo.abreviatura_protocolo)
        .schema,
      puntoDestino.protocolo as Record<string, unknown>,
      candidato
    );

    if (!validado) {
      resultados.push({
        puntoId,
        nombre: puntoDestino.info_protocolo.nombre_punto,
        actualizado: false,
      });
      continue;
    }

    guardarPuntoLocal(
      puntoId,
      { protocolo: validado.data as Protocolo },
      regDestino.estado_sync === "listo_para_enviar"
        ? "listo_para_enviar"
        : "borrador_local"
    );

    resultados.push({
      puntoId,
      nombre: puntoDestino.info_protocolo.nombre_punto,
      actualizado: true,
    });
  }

  return resultados;
}

