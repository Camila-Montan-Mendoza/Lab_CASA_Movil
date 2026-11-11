import { Platform } from "react-native";
import {
  api,
  guardarTokensYUsuario,
  limpiarSesionAlmacenada,
  obtenerAccessToken,
  obtenerApiBaseUrl,
  type ResultadoApi,
  type UsuarioSesion,
} from "./api";
import {
  PaqueteOfflineSchema,
  RespuestaEnvioSchema,
  type MuestreosFiltros,
  type PaqueteOffline,
  type PuntoEnviado,
  type RespuestaEnvio,
} from "@/schemas/muestreos/muestreos.schema";

const construirQuery = (filtros: MuestreosFiltros = {}): string => {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== "") params.set(clave, String(valor));
  }
  const cadena = params.toString();
  return cadena ? `?${cadena}` : "";
};

export async function loginMovil(credenciales: {
  nombre_usuario: string;
  contrasenia_usuario: string;
  rememberMe?: boolean;
}): Promise<ResultadoApi<UsuarioSesion>> {
  const resultado = await api.post<UsuarioSesion>("/auth/login", {
    ...credenciales,
    rememberMe: true,
  });
  if (resultado.success) {
    await guardarTokensYUsuario({ usuario: resultado.data });
    const token = await obtenerAccessToken();
    if (!token) {
      await limpiarSesionAlmacenada();
      return {
        success: false,
        message:
          "El servidor no devolvió el token de acceso. Verifica que el backend esté actualizado y reiniciado.",
      };
    }
  }
  return resultado;
}

export async function logoutMovil(): Promise<void> {
  try {
    const token = await obtenerAccessToken();
    if (token) {
      await api.get("/auth/logout");
    }
  } finally {
    await limpiarSesionAlmacenada();
  }
}

export async function descargarPaqueteOffline(
  filtros?: MuestreosFiltros
): Promise<ResultadoApi<PaqueteOffline>> {
  return api.get(
    `/muestreos/paquete-offline${construirQuery(filtros)}`,
    PaqueteOfflineSchema
  );
}

export async function enviarLoteMuestreos(
  puntos: PuntoEnviado[]
): Promise<ResultadoApi<RespuestaEnvio>> {
  return api.post("/muestreos/envio", { puntos }, RespuestaEnvioSchema);
}

export interface RespuestaSubidaImagen {
  nombre_imagen: string;
  url_imagen: string;
  tamanio_bytes: number;
  fecha_actualizacion_imagen: string;
}

/**
 * Sube un archivo de imagen local (file://...) a `/be/archivos/:destino`
 * y devuelve la URL pública asignada por el servidor.
 */
export async function subirImagenLocal(
  destino: "protocolos" | "croquis",
  uriLocal: string,
  nombreImagen: string,
  mimeType = "image/jpeg"
): Promise<ResultadoApi<RespuestaSubidaImagen>> {
  try {
    const baseUrl = await obtenerApiBaseUrl();
    const token = await obtenerAccessToken();
    const formData = new FormData();

    if (Platform.OS === "web" && uriLocal.startsWith("blob:")) {
      const blobRes = await fetch(uriLocal);
      const blob = await blobRes.blob();
      formData.append("archivo", blob, nombreImagen);
    } else {
      formData.append("archivo", {
        uri: uriLocal,
        name: nombreImagen || "captura.jpg",
        type: mimeType || "image/jpeg",
      } as unknown as Blob);
    }

    const res = await fetch(`${baseUrl}/archivos/${destino}`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || json.success === false) {
      return {
        success: false,
        message: json.message || `Error HTTP ${res.status} al subir imagen`,
      };
    }

    const data = (json.data ?? json) as RespuestaSubidaImagen;
    return {
      success: true,
      data,
      message: json.message ?? "Imagen subida",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo subir la imagen al servidor",
    };
  }
}

