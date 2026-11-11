/**
 * Listas cerradas del protocolo de campo. Van en código y no en la base porque
 * hoy no hace falta administrarlas desde el back office; el día que se quieran
 * editar sin desplegar, pasan a tabla con su CRUD como Preservante.
 */

export const TIPOS_FUENTE = ["Subterránea", "Superficial", "Otro"] as const;

export const TIPOS_DISTRIBUCION = ["Red pública", "Red privada", "Otro"] as const;

export const TIPOS_TANQUE = [
  "Elevado",
  "Semienterrado",
  "Enterrado",
  "Superficial",
  "Cisterna",
  "Otro",
] as const;

export const FRECUENCIAS_LIMPIEZA = [
  "Semanal",
  "Quincenal",
  "Mensual",
  "Trimestral",
  "Semestral",
  "Anual",
  "Nunca",
] as const;

export const MATERIALES_TUBERIA = [
  "PVC",
  "Hierro galvanizado",
  "Polietileno",
  "Cobre",
  "Cemento",
  "Otro",
] as const;

// El tipo de frasco (V/P) y el volumen viven en muestreos.schema.ts, junto al
// resto del formato del muestreo.

/** Igual en los cuatro protocolos. */
export const ESTADOS_TIEMPO = [
  "Soleado",
  "Ventoso",
  "Llueve",
  "Nublado",
  "Despejado",
  "Seminublado",
] as const;

// --- RIL y RDL — Residuos ---------------------------------------------------

/**
 * En el formulario en papel el punto es una grilla de dos filas —afluente de
 * proceso y efluente final—, cada una con su tratamiento. El formato guarda una
 * sola, así que el tipo dice cuál de las dos se muestreó.
 */
export const TIPOS_PUNTO_RESIDUOS = ["Afluente de proceso", "Efluente final"] as const;

export const TIPOS_TRATAMIENTO = ["Primario", "Secundario", "Terciario"] as const;

export const TIPOS_MUESTREO_RESIDUOS = ["Simple (puntual)", "Compuesto", "Integrado"] as const;

/** Solo el compuesto registra durante cuántas horas se muestreó. */
export const TIPO_MUESTREO_COMPUESTO = "Compuesto";

export const EVACUACIONES_FINALES = [
  "Alcantarilla",
  "Acequia",
  "Río",
  "Laguna artificial",
  "Depósitos",
  "Otros",
] as const;

// --- RIL — Residuos Industriales Líquidos -----------------------------------

export const FUENTES_RESIDUOS = ["Agua subterránea", "Agua superficial", "Otro"] as const;

/**
 * Las cinco columnas del cuadro de actividad. El rubro concreto —curtiembre,
 * hospital, matadero— va en la especificación: son decenas y cambian seguido,
 * y una lista cerrada obligaría a desplegar cada vez que aparece uno nuevo.
 */
export const TIPOS_ACTIVIDAD = [
  "Comercial",
  "Industrial",
  "Agrícola",
  "Área salud",
  "Otro",
] as const;

export const LUGARES_MUESTREO_RESIDUOS = [
  "En planta",
  "Fuera de planta",
  "Alcantarillado",
  "Planta de tratamiento",
  "Otro",
] as const;

// --- RDL — Residuos Domésticos Líquidos -------------------------------------

export const TIPOS_INSTALACION = [
  "Domiciliario",
  "Urbanización",
  "Condominio",
  "Municipal",
] as const;

// --- AN — Agua Natural ------------------------------------------------------

export const TIPOS_FUENTE_NATURAL = ["Subterránea", "Superficial"] as const;

/** La captación depende de la fuente: una vertiente no es un río. */
export const CAPTACIONES_NATURAL: Record<string, readonly string[]> = {
  Subterránea: ["Vertiente", "Pozo"],
  Superficial: ["Acequia", "Río", "Laguna", "Represa", "Quebrada", "Fuente"],
};

export const TIPOS_MUESTREO_NATURAL = ["Simple", "Integrado"] as const;
