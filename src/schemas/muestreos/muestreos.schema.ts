import { z } from "zod";
import { ProtocoloSchema, type Protocolo } from "./protocolos";

/**
 * Un solo formato para todo el muestreo: `Punto` es el ítem del listado, el
 * detalle, lo que se manda al enviar y lo que vuelve.
 *
 * Los schemas por tipo de protocolo viven en `./protocolos` y son los mismos
 * que valida el backend (casa_be/.../helpers/protocolos/). Están duplicados a
 * propósito: el dispositivo tiene que poder validar sin conexión, y el servidor
 * no puede confiar en que el cliente lo haya hecho.
 *
 * Ver casa_be/docs/puntos_muestreos/puntos_muestreos_2.md.
 */

export * from "./protocolos";

// --- Validación ------------------------------------------------------------

/**
 * Los errores de zod indexados por la ruta del campo
 * (`zona_muestreo.direccion`), que es como los busca el formulario para
 * pintarlos abajo de cada input.
 */
export const erroresPorCampo = (error: z.ZodError): Record<string, string> => {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const clave = issue.path.join(".");
    if (!errores[clave]) errores[clave] = issue.message;
  }
  return errores;
};

// --- Qué hay que analizar --------------------------------------------------

export const EnsayoRequeridoSchema = z.object({
  ensayo_id: z.number(),
  tipo_cuenta: z.string(),
  abreviatura_ensayo: z.string().nullable(),
});
export type EnsayoRequerido = z.infer<typeof EnsayoRequeridoSchema>;

export interface PaqueteRequerido {
  paquete_id: number;
  nombre_paquete: string | null;
  abreviatura_paquete: string | null;
  tipo_matriz_id: number | null;
  nombre_matriz: string | null;
  abreviatura_matriz: string | null;
  ensayos: EnsayoRequerido[];
  paquetes_hijos: PaqueteRequerido[];
}

export const PaqueteRequeridoSchema: z.ZodType<PaqueteRequerido> = z.lazy(() =>
  z.object({
    paquete_id: z.number(),
    nombre_paquete: z.string().nullable(),
    abreviatura_paquete: z.string().nullable(),
    tipo_matriz_id: z.number().nullable(),
    nombre_matriz: z.string().nullable(),
    abreviatura_matriz: z.string().nullable(),
    ensayos: z.array(EnsayoRequeridoSchema),
    paquetes_hijos: z.array(PaqueteRequeridoSchema),
  })
);

// --- Los frascos -----------------------------------------------------------

/** Vidrio o plástico: no hay un tercer material. */
export const TIPOS_FRASCO = [
  { codigo: "V", nombre: "Vidrio" },
  { codigo: "P", nombre: "Plástico" },
] as const;

export const MuestraSchema = z.object({
  // Al crear va en null: el id lo asigna la base.
  muestra_id: z.number().nullable(),
  /** Del punto (= su nro_punto); lo calcula el backend, no hace falta editarlo. */
  codigo_muestra: z.number(),
  /** Distingue este frasco de los demás del mismo punto (frasco 1, 2, 3...). */
  numero_frasco: z.number(),
  /** En mililitros. */
  volumen_muestra: z.number(),
  /** `V` o `P`. */
  tipo_frasco_muestra: z.string(),
  preservante_frasco_muestra: z.boolean(),
  fecha_recepcion_muestra: z.string().nullish(),
  // Solo ids: los nombres salen de los catálogos.
  ensayos: z.array(z.object({ ensayo_id: z.number() })),
  preservantes: z.array(z.object({ preservante_id: z.number() })),
  /**
   * Solo lectura: el backend la recalcula siempre, se ignora si el cliente la
   * manda. `PENDIENTE` = todavía editable desde protocolo/muestras; cualquier
   * otro valor = ya se envió a orden de trabajo.
   */
  estado_muestra: z.string(),
});
export type Muestra = z.infer<typeof MuestraSchema>;

/** Frasco en blanco: la misma forma, con todos los campos vacíos. `codigo_muestra` es un placeholder — lo recalcula el backend al guardar. */
export const frascoVacio = (numeroFrasco: number): Muestra => ({
  muestra_id: null,
  codigo_muestra: 0,
  numero_frasco: numeroFrasco,
  volumen_muestra: 0,
  tipo_frasco_muestra: "",
  preservante_frasco_muestra: false,
  ensayos: [],
  preservantes: [],
  estado_muestra: "PENDIENTE",
});

/** Lo que se valida de un frasco antes de dejar cerrarlo. */
export const FrascoCompletoSchema = MuestraSchema.extend({
  volumen_muestra: z.number().positive("El volumen en ml tiene que ser mayor que cero"),
  tipo_frasco_muestra: z.enum(["V", "P"], "El frasco es de vidrio (V) o de plástico (P)"),
  ensayos: z
    .array(z.object({ ensayo_id: z.number() }))
    .min(1, "El frasco tiene que llevar al menos un ensayo"),
});

// --- El punto: el formato único --------------------------------------------

export const InfoMuestreoSchema = z.object({
  punto_id: z.number(),
  estado_punto: z.string(),

  usuario_id: z.number(),
  nombre_usuario: z.string(),
  nombre_completo: z.string(),

  tipo_recojo_id: z.number(),
  nombre_recojo: z.string(),
  fecha_prog_punto: z.string(),
  hora_prog_punto: z.string(),
  hora_fin_prog_punto: z.string().nullish(),

  programacion_id: z.number(),
  persona_contacto_prog: z.string(),
  celular_contacto_prog: z.string(),
  direccion_muestreo_prog: z.string(),
  direccion_cliente_prog: z.string(),
  tipo_analisis_prog: z.string(),
  nombre_entidad: z.string().nullish(),

  // Verificación del protocolo: acción aparte de "completo" (que declara el
  // propio muestreador), restringida a responsable/admin.
  protocolo_verificado: z.boolean(),
  nombre_verificacion: z.string().nullable(),
  fecha_verificacion: z.string().nullable(),
});
export type InfoMuestreo = z.infer<typeof InfoMuestreoSchema>;

export const InfoProtocoloSchema = z.object({
  tipo_servicio_id: z.number(),
  nombre_servicio: z.string(),
  abreviatura_servicio: z.string(),

  tipo_protocolo_id: z.number(),
  nombre_protocolo: z.string(),
  abreviatura_protocolo: z.string(),
  version_protocolo: z.number(),

  nro_punto: z.number(),
  nombre_punto: z.string(),
  paquetes: z.array(PaqueteRequeridoSchema),
});
export type InfoProtocolo = z.infer<typeof InfoProtocoloSchema>;

export const PuntoSchema = z.object({
  info_muestreo: InfoMuestreoSchema,
  info_protocolo: InfoProtocoloSchema,
  protocolo: ProtocoloSchema,
  muestras: z.array(MuestraSchema),
  fecha_toma_muestra: z.string(),
  hora_toma_muestra: z.string(),
  fecha_actualizacion_punto: z.string(),
});
export type Punto = z.infer<typeof PuntoSchema>;

export const PuntosSchema = z.array(PuntoSchema);

// --- El envío --------------------------------------------------------------

/** Lo editable del punto. El resto lo reescribe el backend desde la base. */
export interface PuntoEnviado {
  punto_id: number;
  protocolo: Protocolo;
  muestras: Muestra[];
  fecha_toma_muestra: string;
  hora_toma_muestra: string;
  fecha_actualizacion_punto: string;
}

export const ResultadoEnvioSchema = z.object({
  punto_id: z.number(),
  estado: z.enum(["enviado", "rechazado"]),
  errores: z.array(z.string()),
  punto: PuntoSchema.nullable(),
});
export type ResultadoEnvio = z.infer<typeof ResultadoEnvioSchema>;

export const RespuestaEnvioSchema = z.object({
  enviados: z.number(),
  rechazados: z.number(),
  resultados: z.array(ResultadoEnvioSchema),
});
export type RespuestaEnvio = z.infer<typeof RespuestaEnvioSchema>;

/** Arma el envío de un punto a partir del punto completo que se descargó. */
export const paraEnviar = (
  punto: Punto,
  cambios: Partial<Pick<PuntoEnviado, "protocolo" | "muestras" | "fecha_toma_muestra" | "hora_toma_muestra">>
): PuntoEnviado => {
  const muestras = cambios.muestras ?? punto.muestras;

  return {
    punto_id: punto.info_muestreo.punto_id,
    protocolo: punto.protocolo as Protocolo,
    fecha_toma_muestra: punto.fecha_toma_muestra,
    hora_toma_muestra: punto.hora_toma_muestra,
    fecha_actualizacion_punto: punto.fecha_actualizacion_punto,
    ...cambios,
    muestras: muestras.map((muestra) =>
      muestra.codigo_muestra > 0
        ? muestra
        : (({ codigo_muestra: _codigoMuestra, ...sinCodigo }) => sinCodigo as Muestra)(muestra)
    ),
  };
};

// --- Los catálogos ---------------------------------------------------------

export const CatalogosSchema = z.object({
  version_catalogos: z.string(),
  preservantes: z.array(
    z.object({
      preservante_id: z.number(),
      nro_preservante: z.number(),
      nombre_preservante: z.string(),
      abreviatura_preservante: z.string(),
    })
  ),
  tipos_protocolo: z.array(
    z.object({ id: z.number(), nombre: z.string(), abreviatura: z.string() })
  ),
  tipos_recojo: z.array(z.object({ id: z.number(), nombre: z.string(), abreviatura: z.string() })),
  tipos_servicio: z.array(
    z.object({ id: z.number(), nombre: z.string(), abreviatura: z.string() })
  ),
  tipos_matriz: z.array(z.object({ id: z.number(), nombre: z.string(), abreviatura: z.string() })),
  ensayos: z.array(EnsayoRequeridoSchema),
  tipos_frasco: z.array(z.object({ codigo: z.string(), nombre: z.string() })),
  unidad_volumen: z.string(),
  estados_punto: z.array(z.string()),
  formatos_protocolo: z.array(
    z.object({
      codigo_protocolo: z.string(),
      version: z.number(),
      protocolo_vacio: z.record(z.string(), z.unknown()),
      muestra_vacia: MuestraSchema,
    })
  ),
});
export type Catalogos = z.infer<typeof CatalogosSchema>;

export const PaqueteOfflineSchema = z.object({
  descargado_en: z.string(),
  puntos: PuntosSchema,
  catalogos: CatalogosSchema,
});
export type PaqueteOffline = z.infer<typeof PaqueteOfflineSchema>;

// --- Helpers ---------------------------------------------------------------

/** Los ensayos del árbol en lista plana: así se reparten entre los frascos. */
export const ensayosDelPunto = (paquetes: PaqueteRequerido[]): EnsayoRequerido[] => {
  const ensayos: EnsayoRequerido[] = [];
  const recorrer = (nodos: PaqueteRequerido[]) => {
    for (const paquete of nodos) {
      for (const ensayo of paquete.ensayos) {
        if (!ensayos.some((e) => e.ensayo_id === ensayo.ensayo_id)) ensayos.push(ensayo);
      }
      recorrer(paquete.paquetes_hijos);
    }
  };
  recorrer(paquetes);
  return ensayos;
};

/** Los ensayos agrupados por paquete, como se listan en el protocolo en papel. */
export const gruposDeEnsayos = (
  paquetes: PaqueteRequerido[]
): { nombre: string; ensayos: string[] }[] => {
  const grupos: { nombre: string; ensayos: string[] }[] = [];
  const recorrer = (nodos: PaqueteRequerido[]) => {
    for (const paquete of nodos) {
      if (paquete.ensayos.length > 0) {
        grupos.push({
          nombre: paquete.nombre_paquete ?? "Sin nombre",
          ensayos: paquete.ensayos.map(etiquetaEnsayo),
        });
      }
      recorrer(paquete.paquetes_hijos);
    }
  };
  recorrer(paquetes);
  return grupos;
};

export const etiquetaEnsayo = (ensayo: EnsayoRequerido) =>
  ensayo.tipo_cuenta || ensayo.abreviatura_ensayo || `Ensayo ${ensayo.ensayo_id}`;

/**
 * Los frascos guardan solo `ensayo_id`. Este mapa es el que le devuelve el
 * nombre para mostrarlo, sin volver a pedirlo al servidor.
 */
export const mapaEnsayos = (paquetes: PaqueteRequerido[]): Map<number, EnsayoRequerido> =>
  new Map(ensayosDelPunto(paquetes).map((ensayo) => [ensayo.ensayo_id, ensayo]));

export const nombreFrasco = (codigo: string) =>
  TIPOS_FRASCO.find((frasco) => frasco.codigo === codigo)?.nombre ?? codigo;

// --- Filtros ---------------------------------------------------------------

export interface MuestreosFiltros {
  usuario_id?: number;
  programacion_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  estado_punto?: string;
}

export const ESTADOS_PUNTO = ["recepcionado", "muestreado", "entregado", "anulado"] as const;
