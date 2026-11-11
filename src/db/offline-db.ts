import { Platform } from "react-native";
import { openNativeDatabase, type SqliteLikeDatabase } from "./sqlite-driver";
import type {
  Catalogos,
  Muestra,
  PaqueteOffline,
  Protocolo,
  Punto,
} from "@/schemas/muestreos/muestreos.schema";

export type EstadoSyncLocal =
  | "sincronizado"
  | "borrador_local"
  | "listo_para_enviar"
  | "error_envio";

export interface RegistroPuntoOffline {
  punto_id: number;
  programacion_id: number;
  usuario_id: number;
  punto: Punto;
  estado_sync: EstadoSyncLocal;
  errores_sync: string[];
  actualizado_local_en: string;
}

export interface ImagenLocalPendiente {
  id_local: string;
  punto_id: number;
  destino: "protocolos" | "croquis";
  uri_local: string;
  nombre_imagen: string;
  mime_type: string;
  url_remota: string | null;
}

let dbInstance: SqliteLikeDatabase | null = null;

// Fallback en memoria/localStorage para cuando se previsualiza en web (expo start --web)
const webPoints = new Map<number, RegistroPuntoOffline>();
let webCatalogos: { descargado_en: string; catalogos: Catalogos } | null = null;
const webImages = new Map<string, ImagenLocalPendiente>();

function getDb(): SqliteLikeDatabase | null {
  if (Platform.OS === "web") return null;
  if (!dbInstance) {
    dbInstance = openNativeDatabase("casa_movil_offline.db");
    if (!dbInstance) return null;
    dbInstance.execSync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS catalogos_cache (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        descargado_en TEXT NOT NULL,
        catalogos_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS puntos_offline (
        punto_id INTEGER PRIMARY KEY,
        programacion_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        punto_json TEXT NOT NULL,
        estado_sync TEXT NOT NULL DEFAULT 'sincronizado',
        errores_sync_json TEXT NOT NULL DEFAULT '[]',
        actualizado_local_en TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS imagenes_locales (
        id_local TEXT PRIMARY KEY,
        punto_id INTEGER NOT NULL,
        destino TEXT NOT NULL,
        uri_local TEXT NOT NULL,
        nombre_imagen TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        url_remota TEXT
      );
    `);
  }
  return dbInstance;
}

export function initOfflineDb(): void {
  getDb();
}

/**
 * Guarda el paquete offline descargado del servidor.
 * Si un punto tiene trabajo local sin sincronizar ('borrador_local', 'listo_para_enviar' o 'error_envio'),
 * conserva su protocolo, muestras y fechas locales para nunca perder datos de campo.
 */
export function guardarPaqueteOffline(
  paquete: PaqueteOffline,
  forzarSobrescritura = false
): void {
  const db = getDb();
  const ahora = new Date().toISOString();

  if (!db) {
    webCatalogos = {
      descargado_en: paquete.descargado_en,
      catalogos: paquete.catalogos,
    };
    for (const puntoRemoto of paquete.puntos) {
      const puntoId = puntoRemoto.info_muestreo.punto_id;
      const existente = webPoints.get(puntoId);
      const tieneCambiosLocales =
        existente && existente.estado_sync !== "sincronizado";

      if (tieneCambiosLocales && !forzarSobrescritura) {
        webPoints.set(puntoId, {
          ...existente,
          punto: {
            ...puntoRemoto,
            protocolo: existente.punto.protocolo,
            muestras: existente.punto.muestras,
            fecha_toma_muestra: existente.punto.fecha_toma_muestra,
            hora_toma_muestra: existente.punto.hora_toma_muestra,
          },
        });
      } else {
        webPoints.set(puntoId, {
          punto_id: puntoId,
          programacion_id: puntoRemoto.info_muestreo.programacion_id,
          usuario_id: puntoRemoto.info_muestreo.usuario_id,
          punto: puntoRemoto,
          estado_sync: "sincronizado",
          errores_sync: [],
          actualizado_local_en: ahora,
        });
      }
    }
    return;
  }

  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO catalogos_cache (id, descargado_en, catalogos_json)
       VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         descargado_en = excluded.descargado_en,
         catalogos_json = excluded.catalogos_json`,
      [paquete.descargado_en, JSON.stringify(paquete.catalogos)]
    );

    for (const puntoRemoto of paquete.puntos) {
      const puntoId = puntoRemoto.info_muestreo.punto_id;
      const existente = obtenerPuntoOffline(puntoId);
      const tieneCambiosLocales =
        existente && existente.estado_sync !== "sincronizado";

      if (tieneCambiosLocales && !forzarSobrescritura) {
        const puntoFusionado: Punto = {
          ...puntoRemoto,
          protocolo: existente.punto.protocolo,
          muestras: existente.punto.muestras,
          fecha_toma_muestra: existente.punto.fecha_toma_muestra,
          hora_toma_muestra: existente.punto.hora_toma_muestra,
        };
        db.runSync(
          `UPDATE puntos_offline
           SET punto_json = ?, programacion_id = ?, usuario_id = ?
           WHERE punto_id = ?`,
          [
            JSON.stringify(puntoFusionado),
            puntoRemoto.info_muestreo.programacion_id,
            puntoRemoto.info_muestreo.usuario_id,
            puntoId,
          ]
        );
      } else {
        db.runSync(
          `INSERT INTO puntos_offline (
            punto_id, programacion_id, usuario_id, punto_json, estado_sync, errores_sync_json, actualizado_local_en
          ) VALUES (?, ?, ?, ?, 'sincronizado', '[]', ?)
          ON CONFLICT(punto_id) DO UPDATE SET
            programacion_id = excluded.programacion_id,
            usuario_id = excluded.usuario_id,
            punto_json = excluded.punto_json,
            estado_sync = 'sincronizado',
            errores_sync_json = '[]',
            actualizado_local_en = excluded.actualizado_local_en`,
          [
            puntoId,
            puntoRemoto.info_muestreo.programacion_id,
            puntoRemoto.info_muestreo.usuario_id,
            JSON.stringify(puntoRemoto),
            ahora,
          ]
        );
      }
    }
  });
}

interface FilaPuntoSql {
  punto_id: number;
  programacion_id: number;
  usuario_id: number;
  punto_json: string;
  estado_sync: EstadoSyncLocal;
  errores_sync_json: string;
  actualizado_local_en: string;
}

function mapearFilaPunto(fila: FilaPuntoSql): RegistroPuntoOffline {
  return {
    punto_id: fila.punto_id,
    programacion_id: fila.programacion_id,
    usuario_id: fila.usuario_id,
    punto: JSON.parse(fila.punto_json) as Punto,
    estado_sync: fila.estado_sync,
    errores_sync: JSON.parse(fila.errores_sync_json) as string[],
    actualizado_local_en: fila.actualizado_local_en,
  };
}

export function obtenerPuntosOffline(usuarioId?: number): RegistroPuntoOffline[] {
  const db = getDb();
  if (!db) {
    const todos = Array.from(webPoints.values());
    return usuarioId
      ? todos.filter((r) => r.usuario_id === usuarioId)
      : todos;
  }

  const filas = usuarioId
    ? db.getAllSync<FilaPuntoSql>(
        `SELECT * FROM puntos_offline WHERE usuario_id = ? ORDER BY programacion_id DESC, punto_id ASC`,
        [usuarioId]
      )
    : db.getAllSync<FilaPuntoSql>(
        `SELECT * FROM puntos_offline ORDER BY programacion_id DESC, punto_id ASC`
      );

  return filas.map(mapearFilaPunto);
}

export function obtenerPuntoOffline(puntoId: number): RegistroPuntoOffline | null {
  const db = getDb();
  if (!db) {
    return webPoints.get(puntoId) ?? null;
  }

  const fila = db.getFirstSync<FilaPuntoSql>(
    `SELECT * FROM puntos_offline WHERE punto_id = ?`,
    [puntoId]
  );
  return fila ? mapearFilaPunto(fila) : null;
}

export function obtenerPuntosHermanosOffline(
  programacionId: number,
  excluirPuntoId: number
): Punto[] {
  const db = getDb();
  if (!db) {
    return Array.from(webPoints.values())
      .filter(
        (r) =>
          r.programacion_id === programacionId && r.punto_id !== excluirPuntoId
      )
      .map((r) => r.punto);
  }

  const filas = db.getAllSync<FilaPuntoSql>(
    `SELECT * FROM puntos_offline WHERE programacion_id = ? AND punto_id != ? ORDER BY punto_id ASC`,
    [programacionId, excluirPuntoId]
  );
  return filas.map((f) => mapearFilaPunto(f).punto);
}

export function guardarPuntoLocal(
  puntoId: number,
  cambios: {
    protocolo?: Protocolo;
    muestras?: Muestra[];
    fecha_toma_muestra?: string;
    hora_toma_muestra?: string;
  },
  estadoSync: EstadoSyncLocal
): RegistroPuntoOffline | null {
  const actual = obtenerPuntoOffline(puntoId);
  if (!actual) return null;

  const ahora = new Date().toISOString();
  const nuevoProtocolo = cambios.protocolo ?? actual.punto.protocolo;
  const cerrando = nuevoProtocolo.completo === true;

  const puntoActualizado: Punto = {
    ...actual.punto,
    protocolo: nuevoProtocolo,
    muestras: cambios.muestras ?? actual.punto.muestras,
    fecha_toma_muestra:
      cambios.fecha_toma_muestra ?? actual.punto.fecha_toma_muestra,
    hora_toma_muestra:
      cambios.hora_toma_muestra ?? actual.punto.hora_toma_muestra,
    info_muestreo: {
      ...actual.punto.info_muestreo,
      estado_punto:
        actual.punto.info_muestreo.estado_punto === "anulado"
          ? "anulado"
          : cerrando
          ? "muestreado"
          : "recepcionado",
    },
  };

  const nuevoRegistro: RegistroPuntoOffline = {
    ...actual,
    punto: puntoActualizado,
    estado_sync: estadoSync,
    errores_sync: [],
    actualizado_local_en: ahora,
  };

  const db = getDb();
  if (!db) {
    webPoints.set(puntoId, nuevoRegistro);
    return nuevoRegistro;
  }

  db.runSync(
    `UPDATE puntos_offline
     SET punto_json = ?, estado_sync = ?, errores_sync_json = '[]', actualizado_local_en = ?
     WHERE punto_id = ?`,
    [JSON.stringify(puntoActualizado), estadoSync, ahora, puntoId]
  );

  return nuevoRegistro;
}

export function marcarResultadoSincronizacion(
  puntoId: number,
  resultado: {
    estado: "enviado" | "rechazado";
    punto: Punto | null;
    errores: string[];
  }
): void {
  const actual = obtenerPuntoOffline(puntoId);
  if (!actual) return;

  const ahora = new Date().toISOString();
  const nuevoPunto = resultado.punto ?? actual.punto;
  const nuevoEstado: EstadoSyncLocal =
    resultado.estado === "enviado" ? "sincronizado" : "error_envio";

  const db = getDb();
  if (!db) {
    webPoints.set(puntoId, {
      ...actual,
      punto: nuevoPunto,
      estado_sync: nuevoEstado,
      errores_sync: resultado.errores,
      actualizado_local_en: ahora,
    });
    return;
  }

  db.runSync(
    `UPDATE puntos_offline
     SET punto_json = ?, estado_sync = ?, errores_sync_json = ?, actualizado_local_en = ?
     WHERE punto_id = ?`,
    [
      JSON.stringify(nuevoPunto),
      nuevoEstado,
      JSON.stringify(resultado.errores),
      ahora,
      puntoId,
    ]
  );
}

export function obtenerCatalogosOffline(): {
  descargado_en: string;
  catalogos: Catalogos;
} | null {
  const db = getDb();
  if (!db) return webCatalogos;

  const fila = db.getFirstSync<{
    descargado_en: string;
    catalogos_json: string;
  }>(`SELECT descargado_en, catalogos_json FROM catalogos_cache WHERE id = 1`);

  if (!fila) return null;
  return {
    descargado_en: fila.descargado_en,
    catalogos: JSON.parse(fila.catalogos_json) as Catalogos,
  };
}

export function registrarImagenLocal(img: ImagenLocalPendiente): void {
  const db = getDb();
  if (!db) {
    webImages.set(img.id_local, img);
    return;
  }

  db.runSync(
    `INSERT INTO imagenes_locales (
      id_local, punto_id, destino, uri_local, nombre_imagen, mime_type, url_remota
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id_local) DO UPDATE SET
      uri_local = excluded.uri_local,
      nombre_imagen = excluded.nombre_imagen,
      mime_type = excluded.mime_type,
      url_remota = excluded.url_remota`,
    [
      img.id_local,
      img.punto_id,
      img.destino,
      img.uri_local,
      img.nombre_imagen,
      img.mime_type,
      img.url_remota,
    ]
  );
}

export function obtenerImagenesPendientesPorPunto(
  puntoId: number
): ImagenLocalPendiente[] {
  const db = getDb();
  if (!db) {
    return Array.from(webImages.values()).filter(
      (i) => i.punto_id === puntoId && !i.url_remota
    );
  }

  return db.getAllSync<ImagenLocalPendiente>(
    `SELECT * FROM imagenes_locales WHERE punto_id = ? AND url_remota IS NULL`,
    [puntoId]
  );
}

export function marcarImagenSubida(idLocal: string, urlRemota: string): void {
  const db = getDb();
  if (!db) {
    const img = webImages.get(idLocal);
    if (img) webImages.set(idLocal, { ...img, url_remota: urlRemota });
    return;
  }

  db.runSync(
    `UPDATE imagenes_locales SET url_remota = ? WHERE id_local = ?`,
    [urlRemota, idLocal]
  );
}

