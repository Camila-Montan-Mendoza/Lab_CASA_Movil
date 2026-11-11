import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import axios, { type AxiosInstance } from "axios";
import type { z } from "zod";

const ACCESS_TOKEN_KEY = "casa_movil_access_token";
const REFRESH_TOKEN_KEY = "casa_movil_refresh_token";
const USER_PAYLOAD_KEY = "casa_movil_user_payload";
const CUSTOM_API_URL_KEY = "casa_movil_custom_api_url";

const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "web"
    ? "http://localhost:3001/be"
    : "http://10.32.160.109:3001/be");

export interface UsuarioSesion {
  sub: number;
  nombre: string;
  version: number;
  roles: string[];
  permisos: string[];
  requiere_cambio_contrasenia?: boolean;
}

export type ResultadoApi<T> =
  | { success: true; data: T; message: string }
  | { success: false; message: string };

// SecureStore limita cada valor a ~2048 bytes; un JWT con roles y permisos
// puede superarlo y no guardarse. Por eso en nativo se parte en trozos.
const CHUNK_SIZE = 1800;
const CHUNK_COUNT_SUFFIX = "__chunks";

// Caché en memoria: la sesión funciona aunque el almacenamiento seguro falle.
const memoria = new Map<string, string | null>();

async function nativeGet(key: string): Promise<string | null> {
  const countRaw = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
  const count = countRaw ? Number(countRaw) : 0;
  if (!count) return SecureStore.getItemAsync(key);
  const partes: string[] = [];
  for (let i = 0; i < count; i++) {
    const parte = await SecureStore.getItemAsync(`${key}__${i}`);
    if (parte == null) return null;
    partes.push(parte);
  }
  return partes.join("");
}

async function nativeDelete(key: string): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
  const count = countRaw ? Number(countRaw) : 0;
  for (let i = 0; i < count; i++) {
    await SecureStore.deleteItemAsync(`${key}__${i}`);
  }
  await SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
  await SecureStore.deleteItemAsync(key);
}

async function nativeSet(key: string, value: string): Promise<void> {
  await nativeDelete(key);
  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  const count = Math.ceil(value.length / CHUNK_SIZE);
  for (let i = 0; i < count; i++) {
    await SecureStore.setItemAsync(
      `${key}__${i}`,
      value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    );
  }
  await SecureStore.setItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`, String(count));
}

async function getItem(key: string): Promise<string | null> {
  if (memoria.has(key)) return memoria.get(key) ?? null;
  let valor: string | null = null;
  try {
    valor =
      Platform.OS === "web" ? localStorage.getItem(key) : await nativeGet(key);
  } catch (e) {
    console.warn(`[storage] no se pudo leer ${key}`, e);
  }
  memoria.set(key, valor);
  return valor;
}

async function setItem(key: string, value: string): Promise<void> {
  memoria.set(key, value);
  try {
    if (Platform.OS === "web") localStorage.setItem(key, value);
    else await nativeSet(key, value);
  } catch (e) {
    console.warn(`[storage] no se pudo guardar ${key}`, e);
  }
}

async function deleteItem(key: string): Promise<void> {
  memoria.set(key, null);
  try {
    if (Platform.OS === "web") localStorage.removeItem(key);
    else await nativeDelete(key);
  } catch (e) {
    console.warn(`[storage] no se pudo borrar ${key}`, e);
  }
}

export async function obtenerApiBaseUrl(): Promise<string> {
  const custom = await getItem(CUSTOM_API_URL_KEY);
  return (custom && custom.trim()) || DEFAULT_API_URL;
}

export async function guardarApiBaseUrl(url: string): Promise<void> {
  const limpia = url.trim().replace(/\/+$/, "");
  if (!limpia) {
    await deleteItem(CUSTOM_API_URL_KEY);
  } else {
    await setItem(CUSTOM_API_URL_KEY, limpia);
  }
}

export async function obtenerOriginServidor(): Promise<string> {
  const base = await obtenerApiBaseUrl();
  return base.replace(/\/be\/?$/, "");
}

export async function guardarTokensYUsuario(params: {
  accessToken?: string | null;
  refreshToken?: string | null;
  usuario?: UsuarioSesion | null;
}): Promise<void> {
  if (params.accessToken) {
    await setItem(ACCESS_TOKEN_KEY, params.accessToken);
  }
  if (params.refreshToken) {
    await setItem(REFRESH_TOKEN_KEY, params.refreshToken);
  }
  if (params.usuario) {
    await setItem(USER_PAYLOAD_KEY, JSON.stringify(params.usuario));
  }
}

export async function limpiarSesionAlmacenada(): Promise<void> {
  await deleteItem(ACCESS_TOKEN_KEY);
  await deleteItem(REFRESH_TOKEN_KEY);
  await deleteItem(USER_PAYLOAD_KEY);
}

export async function obtenerUsuarioAlmacenado(): Promise<UsuarioSesion | null> {
  const raw = await getItem(USER_PAYLOAD_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UsuarioSesion;
  } catch {
    return null;
  }
}

export async function obtenerAccessToken(): Promise<string | null> {
  return getItem(ACCESS_TOKEN_KEY);
}

export async function obtenerRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_TOKEN_KEY);
}

const axiosClient: AxiosInstance = axios.create({
  timeout: 25000,
  withCredentials: true,
});

axiosClient.interceptors.request.use(async (config) => {
  config.baseURL = await obtenerApiBaseUrl();
  const accessToken = await obtenerAccessToken();
  const refreshToken = await obtenerRefreshToken();

  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (refreshToken) {
    config.headers.set("x-refresh-token", refreshToken);
  }
  if (__DEV__) {
    console.log(
      `[api] ${config.method?.toUpperCase()} ${config.baseURL}${config.url} token=${accessToken ? "sí" : "NO"}`
    );
  }
  return config;
});

type UnauthorizedListener = () => void;
let onUnauthorizedCallback: UnauthorizedListener | null = null;

export function registrarOnUnauthorized(cb: UnauthorizedListener | null): void {
  onUnauthorizedCallback = cb;
}

function leerHeader(headers: unknown, nombre: string): string | undefined {
  if (!headers || typeof headers !== "object") return undefined;
  const h = headers as Record<string, unknown> & {
    get?: (name: string) => unknown;
  };
  if (typeof h.get === "function") {
    const val = h.get(nombre);
    if (typeof val === "string" && val) return val;
  }
  const direct = h[nombre] ?? h[nombre.toLowerCase()];
  if (typeof direct === "string" && direct) return direct;
  return undefined;
}

function extraerCookieDeHeader(
  setCookieHeader: unknown,
  cookieName: string
): string | undefined {
  const texto = Array.isArray(setCookieHeader)
    ? setCookieHeader.join("; ")
    : typeof setCookieHeader === "string"
      ? setCookieHeader
      : "";
  if (!texto) return undefined;
  const regex = new RegExp(`(?:^|[,;\\s])${cookieName}=([^;\\s,]+)`);
  const match = texto.match(regex);
  return match?.[1];
}

axiosClient.interceptors.response.use(
  async (response) => {
    const setCookie = leerHeader(response.headers, "set-cookie") ?? response.headers?.["set-cookie"];
    const nuevoAccess =
      leerHeader(response.headers, "x-access-token") ??
      extraerCookieDeHeader(setCookie, "accessToken");
    const nuevoRefresh =
      leerHeader(response.headers, "x-refresh-token") ??
      extraerCookieDeHeader(setCookie, "refreshToken");
    if (nuevoAccess || nuevoRefresh) {
      await guardarTokensYUsuario({
        accessToken: nuevoAccess,
        refreshToken: nuevoRefresh,
      });
    }
    return response;
  },
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? "";
      if (!url.includes("/auth/login")) {
        await limpiarSesionAlmacenada();
        onUnauthorizedCallback?.();
      }
    }
    return Promise.reject(error);
  }
);

function extraerMensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (data) {
      if (typeof data.message === "string" && data.message) return data.message;
      if (Array.isArray(data.message)) return data.message.join(" · ");
      if (typeof data.detail === "string" && data.detail) return data.detail;
    }
    if (error.code === "ECONNABORTED" || !error.response) {
      return "Sin conexión con el servidor. Verifica tu red Wi-Fi/Datos o la dirección IP configurada.";
    }
  }
  return error instanceof Error ? error.message : "Error inesperado de red";
}

export const api = {
  async get<T>(ruta: string, schema?: z.ZodType<T>): Promise<ResultadoApi<T>> {
    try {
      const res = await axiosClient.get(ruta);
      const rawData = res.data?.data !== undefined ? res.data.data : res.data;
      const message = res.data?.message ?? "Operación exitosa";
      if (schema) {
        const parsed = schema.safeParse(rawData);
        if (!parsed.success) {
          return {
            success: false,
            message: `Respuesta inválida del servidor: ${parsed.error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join(", ")}`,
          };
        }
        return { success: true, data: parsed.data, message };
      }
      return { success: true, data: rawData as T, message };
    } catch (error) {
      return { success: false, message: extraerMensajeError(error) };
    }
  },

  async post<T>(
    ruta: string,
    body: unknown,
    schema?: z.ZodType<T>
  ): Promise<ResultadoApi<T>> {
    try {
      const res = await axiosClient.post(ruta, body);
      const rawData = res.data?.data !== undefined ? res.data.data : res.data;
      const message = res.data?.message ?? "Operación exitosa";
      if (schema) {
        const parsed = schema.safeParse(rawData);
        if (!parsed.success) {
          return {
            success: false,
            message: `Respuesta inválida del servidor: ${parsed.error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join(", ")}`,
          };
        }
        return { success: true, data: parsed.data, message };
      }
      return { success: true, data: rawData as T, message };
    } catch (error) {
      return { success: false, message: extraerMensajeError(error) };
    }
  },
};

