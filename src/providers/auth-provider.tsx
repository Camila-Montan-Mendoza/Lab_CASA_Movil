import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import NetInfo from "@react-native-community/netinfo";
import {
  limpiarSesionAlmacenada,
  obtenerAccessToken,
  obtenerRefreshToken,
  obtenerUsuarioAlmacenado,
  registrarOnUnauthorized,
  type UsuarioSesion,
} from "@/services/api";
import { loginMovil, logoutMovil } from "@/services/muestreos.service";
import { initOfflineDb } from "@/db/offline-db";

interface AuthContextValue {
  user: UsuarioSesion | null;
  cargando: boolean;
  isOnline: boolean;
  login: (
    nombre_usuario: string,
    contrasenia_usuario: string
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    initOfflineDb();
    registrarOnUnauthorized(() => {
      setUser(null);
    });

    Promise.all([
      obtenerUsuarioAlmacenado(),
      obtenerAccessToken(),
      obtenerRefreshToken(),
    ])
      .then(async ([guardado, access, refresh]) => {
        if (guardado && !access && !refresh) {
          await limpiarSesionAlmacenada();
          setUser(null);
          return;
        }
        setUser(guardado);
      })
      .finally(() => {
        setCargando(false);
      });

    const unsubscribe = NetInfo.addEventListener((state) => {
      const conectado = Boolean(
        state.isConnected && state.isInternetReachable !== false
      );
      setIsOnline(conectado);
    });

    return () => {
      registrarOnUnauthorized(null);
      unsubscribe();
    };
  }, []);

  const login = useCallback(
    async (nombre_usuario: string, contrasenia_usuario: string) => {
      const res = await loginMovil({
        nombre_usuario: nombre_usuario.trim(),
        contrasenia_usuario,
      });
      if (res.success) {
        setUser(res.data);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message };
    },
    []
  );

  const logout = useCallback(async () => {
    await logoutMovil();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, cargando, isOnline, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return ctx;
}

