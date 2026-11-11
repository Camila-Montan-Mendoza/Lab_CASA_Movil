import type { FC } from "react";

export interface PropsCuerpo {
  datos: Record<string, unknown>;
  setDatos: (
    actualizar: (datos: Record<string, unknown>) => Record<string, unknown>
  ) => void;
  errores: Record<string, string>;
  desde: number;
  puntoId: number;
}

export interface CuerpoProtocolo {
  Datos: FC<PropsCuerpo>;
  Mediciones: FC<PropsCuerpo>;
  seccionesDatos: number;
}

export const cambiarBloque = (
  setDatos: PropsCuerpo["setDatos"],
  bloque: string,
  campo: string,
  valor: unknown
) =>
  setDatos((datos) => ({
    ...datos,
    [bloque]: { ...(datos[bloque] as Record<string, unknown>), [campo]: valor },
  }));

export const cambiarSubBloque = (
  setDatos: PropsCuerpo["setDatos"],
  bloque: string,
  sub: string,
  campo: string,
  valor: unknown
) =>
  setDatos((datos) => {
    const actual = datos[bloque] as Record<string, unknown>;
    return {
      ...datos,
      [bloque]: {
        ...actual,
        [sub]: { ...(actual[sub] as Record<string, unknown>), [campo]: valor },
      },
    };
  });
