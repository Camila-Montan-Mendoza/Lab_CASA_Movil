export interface ResultadoParse<T> {
  success: boolean;
  data?: T;
  error?: { issues: Array<{ path: readonly PropertyKey[] }> };
}

/** Estructural, para no depender de importar los tipos de "zod" acá. */
export interface EsquemaValidable<T> {
  safeParse: (dato: unknown) => ResultadoParse<T>;
}

/**
 * Reemplaza, dentro de `candidato`, el valor en `ruta` por el que tenía
 * `base` en esa misma ruta — "descartá este campo puntual, dejalo como
 * estaba" en vez de "descartá toda la sección".
 */
function restaurarRuta(
  candidato: Record<string, unknown>,
  base: Record<string, unknown>,
  ruta: readonly PropertyKey[]
): Record<string, unknown> {
  const cabeza = ruta[0];
  if (typeof cabeza !== "string") return candidato;

  // Un índice de array (ej. "otros.0.valor") o el final de la ruta: no vale
  // la pena reconstruir el array elemento a elemento, se restaura el bloque
  // entero tal como estaba.
  if (ruta.length === 1 || typeof ruta[1] === "number") {
    return { ...candidato, [cabeza]: base[cabeza] };
  }

  const hijoCandidato = candidato[cabeza];
  const hijoBase = base[cabeza];
  const esObjeto = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);
  if (!esObjeto(hijoCandidato) || !esObjeto(hijoBase)) {
    return { ...candidato, [cabeza]: hijoBase };
  }

  return { ...candidato, [cabeza]: restaurarRuta(hijoCandidato, hijoBase, ruta.slice(1)) };
}

/**
 * Valida `candidato` contra `schema`; si falla, restaura (contra `base`) el
 * campo puntual que rompió la validación y reintenta, en vez de tirar toda
 * la porción sugerida por un solo campo con el tipo equivocado — que es lo
 * más común cuando el que "llenó" el campo fue un modelo de lenguaje (o se
 * copió de otro punto), no un `<input>`. Devuelve también qué rutas tuvo que
 * restaurar, para poder avisarle al técnico cuáles no se aplicaron.
 *
 * Usado por `ProtocoloForm.tsx` (sugerencias del asistente de voz) y por
 * `CopiarAOtrosPuntosDialog.tsx` (copiar protocolo entre puntos hermanos).
 */
export function validarConTolerancia<T>(
  schema: EsquemaValidable<T>,
  base: Record<string, unknown>,
  candidatoInicial: Record<string, unknown>
): { data: T; camposOmitidos: string[] } | null {
  let candidato = candidatoInicial;
  const omitidos: string[] = [];

  // Tope defensivo: si hace falta restaurar más de 20 campos, el problema no
  // es "un campo mal tipado", es que la porción no tiene el formato
  // esperado — mejor no aplicar nada que aplicar un objeto irreconocible.
  for (let intento = 0; intento < 20; intento++) {
    const resultado = schema.safeParse(candidato);
    if (resultado.success) return { data: resultado.data as T, camposOmitidos: omitidos };

    const primerError = resultado.error?.issues[0];
    if (!primerError || primerError.path.length === 0) return null;

    omitidos.push(primerError.path.join("."));
    const siguiente = restaurarRuta(candidato, base, primerError.path);
    if (siguiente === candidato) return null; // no se pudo aislar el campo: no insistir
    candidato = siguiente;
  }
  return null;
}
