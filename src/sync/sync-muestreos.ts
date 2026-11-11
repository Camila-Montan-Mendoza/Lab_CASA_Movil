import {
  guardarPaqueteOffline,
  guardarPuntoLocal,
  marcarImagenSubida,
  marcarResultadoSincronizacion,
  obtenerPuntosOffline,
  type RegistroPuntoOffline,
} from "@/db/offline-db";
import {
  descargarPaqueteOffline,
  enviarLoteMuestreos,
  subirImagenLocal,
} from "@/services/muestreos.service";
import {
  paraEnviar,
  type Imagen,
  type MuestreosFiltros,
  type Protocolo,
  type PuntoEnviado,
  type ResultadoEnvio,
} from "@/schemas/muestreos/muestreos.schema";

const esUriLocal = (url: string): boolean =>
  url.startsWith("file://") ||
  url.startsWith("content://") ||
  url.startsWith("blob:") ||
  url.startsWith("ph://");

export async function descargarYGuardarAgendaOffline(
  filtros?: MuestreosFiltros,
  forzarSobrescritura = false
): Promise<{
  success: boolean;
  message: string;
  cantidadPuntos?: number;
  descargadoEn?: string;
}> {
  const res = await descargarPaqueteOffline(filtros);
  if (!res.success) {
    return { success: false, message: res.message };
  }

  guardarPaqueteOffline(res.data, forzarSobrescritura);
  return {
    success: true,
    message: `Agenda actualizada (${res.data.puntos.length} puntos)`,
    cantidadPuntos: res.data.puntos.length,
    descargadoEn: res.data.descargado_en,
  };
}

async function subirImagenesDeLista(
  imagenes: Imagen[],
  destino: "protocolos" | "croquis"
): Promise<{ imagenesActualizadas: Imagen[]; error: string | null }> {
  const actualizadas: Imagen[] = [];

  for (const img of imagenes) {
    if (!esUriLocal(img.url_imagen)) {
      actualizadas.push(img);
      continue;
    }

    const ext = img.nombre_imagen.split(".").pop()?.toLowerCase() ?? "jpg";
    const mimeType =
      ext === "png"
        ? "image/png"
        : ext === "webp"
        ? "image/webp"
        : "image/jpeg";

    const subida = await subirImagenLocal(
      destino,
      img.url_imagen,
      img.nombre_imagen,
      mimeType
    );

    if (!subida.success) {
      return {
        imagenesActualizadas: actualizadas,
        error: `Error al subir imagen "${img.nombre_imagen}": ${subida.message}`,
      };
    }

    marcarImagenSubida(img.id_local, subida.data.url_imagen);
    actualizadas.push({
      ...img,
      url_imagen: subida.data.url_imagen,
      fecha_actualizacion_imagen: subida.data.fecha_actualizacion_imagen,
    });
  }

  return { imagenesActualizadas: actualizadas, error: null };
}

async function resolverImagenesDePunto(
  registro: RegistroPuntoOffline
): Promise<{ registroActualizado: RegistroPuntoOffline; error: string | null }> {
  const protocolo = { ...(registro.punto.protocolo as Record<string, unknown>) };
  let huboCambios = false;

  // 1. Imágenes en croquis_punto
  const croquis = protocolo.croquis_punto as
    | { imagenes?: Imagen[]; [k: string]: unknown }
    | undefined;
  if (croquis && Array.isArray(croquis.imagenes)) {
    const tieneLocales = croquis.imagenes.some((i) => esUriLocal(i.url_imagen));
    if (tieneLocales) {
      const resCroquis = await subirImagenesDeLista(croquis.imagenes, "croquis");
      if (resCroquis.error) {
        return { registroActualizado: registro, error: resCroquis.error };
      }
      protocolo.croquis_punto = {
        ...croquis,
        imagenes: resCroquis.imagenesActualizadas,
      };
      huboCambios = true;
    }
  }

  // 2. Imágenes en inspeccion_sanitaria
  const inspeccion = protocolo.inspeccion_sanitaria as
    | { imagenes?: Imagen[]; [k: string]: unknown }
    | undefined;
  if (inspeccion && Array.isArray(inspeccion.imagenes)) {
    const tieneLocales = inspeccion.imagenes.some((i) =>
      esUriLocal(i.url_imagen)
    );
    if (tieneLocales) {
      const resInsp = await subirImagenesDeLista(
        inspeccion.imagenes,
        "protocolos"
      );
      if (resInsp.error) {
        return { registroActualizado: registro, error: resInsp.error };
      }
      protocolo.inspeccion_sanitaria = {
        ...inspeccion,
        imagenes: resInsp.imagenesActualizadas,
      };
      huboCambios = true;
    }
  }

  if (huboCambios) {
    const guardado = guardarPuntoLocal(
      registro.punto_id,
      { protocolo: protocolo as Protocolo },
      registro.estado_sync
    );
    return {
      registroActualizado: guardado ?? registro,
      error: null,
    };
  }

  return { registroActualizado: registro, error: null };
}

export async function sincronizarPuntosPendientes(
  usuarioId?: number,
  puntoIdsEspecificos?: number[]
): Promise<{
  success: boolean;
  message: string;
  enviados: number;
  rechazados: number;
  resultados: ResultadoEnvio[];
}> {
  const todos = obtenerPuntosOffline(usuarioId);
  const candidatos = todos.filter((r) => {
    if (puntoIdsEspecificos && puntoIdsEspecificos.length > 0) {
      return puntoIdsEspecificos.includes(r.punto_id);
    }
    return r.estado_sync !== "sincronizado";
  });

  if (candidatos.length === 0) {
    return {
      success: true,
      message: "No hay puntos pendientes por sincronizar",
      enviados: 0,
      rechazados: 0,
      resultados: [],
    };
  }

  const loteParaEnviar: PuntoEnviado[] = [];
  const resultadosFallidosImagen: ResultadoEnvio[] = [];

  for (const reg of candidatos) {
    const { registroActualizado, error } = await resolverImagenesDePunto(reg);
    if (error) {
      marcarResultadoSincronizacion(reg.punto_id, {
        estado: "rechazado",
        punto: null,
        errores: [error],
      });
      resultadosFallidosImagen.push({
        punto_id: reg.punto_id,
        estado: "rechazado",
        errores: [error],
        punto: null,
      });
      continue;
    }

    loteParaEnviar.push(paraEnviar(registroActualizado.punto, {}));
  }

  if (loteParaEnviar.length === 0) {
    return {
      success: false,
      message: "No se pudieron subir las imágenes adjuntas",
      enviados: 0,
      rechazados: resultadosFallidosImagen.length,
      resultados: resultadosFallidosImagen,
    };
  }

  const resEnvio = await enviarLoteMuestreos(loteParaEnviar);
  if (!resEnvio.success) {
    return {
      success: false,
      message: resEnvio.message,
      enviados: 0,
      rechazados: loteParaEnviar.length + resultadosFallidosImagen.length,
      resultados: resultadosFallidosImagen,
    };
  }

  for (const r of resEnvio.data.resultados) {
    marcarResultadoSincronizacion(r.punto_id, r);
  }

  const totalEnviados = resEnvio.data.enviados;
  const totalRechazados =
    resEnvio.data.rechazados + resultadosFallidosImagen.length;

  return {
    success: totalRechazados === 0,
    message:
      totalRechazados === 0
        ? `Se sincronizaron ${totalEnviados} punto(s) correctamente`
        : `${totalEnviados} enviado(s), ${totalRechazados} con observaciones`,
    enviados: totalEnviados,
    rechazados: totalRechazados,
    resultados: [...resEnvio.data.resultados, ...resultadosFallidosImagen],
  };
}

