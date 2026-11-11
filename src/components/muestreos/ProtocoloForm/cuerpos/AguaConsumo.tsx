import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Checkbox } from '@/design-system/ui/checkbox/checkbox';
import { Label } from '@/design-system/ui/label/label';
import { CasaColors } from '@/design-system/tokens';
import {
  ESTADOS_TIEMPO,
  FRECUENCIAS_LIMPIEZA,
  MATERIALES_TUBERIA,
  TIPOS_DISTRIBUCION,
  TIPOS_FUENTE,
  TIPOS_TANQUE,
} from '@/lib/constants/protocolo.constants';
import type { DatosAguaConsumo } from '@/schemas/muestreos/muestreos.schema';
import { ProtocoloSection } from '../ProtocoloSection';
import { ImagenUploader } from '../ImagenUploader';
import {
  CampoArea,
  CampoMedicion,
  CampoSelect,
  CampoSiNo,
  CampoTexto,
  SeparadorSeccion,
} from '../Campos';
import {
  cambiarBloque,
  cambiarSubBloque,
  type CuerpoProtocolo,
  type PropsCuerpo,
} from './tipos';

/** AC — Aguas de Consumo (`casa_fe/components/muestreos/ProtocoloForm/cuerpos/AguaConsumo.tsx`). */

function Datos({ datos, setDatos, errores, desde, puntoId }: PropsCuerpo) {
  const d = datos as unknown as DatosAguaConsumo;
  const muestra = d.muestra_punto_muestreo;
  const inspeccion = d.inspeccion_sanitaria;
  const almacenamiento = inspeccion.almacenamiento_agua;

  const setMuestra = (campo: string, valor: unknown) =>
    cambiarBloque(setDatos, 'muestra_punto_muestreo', campo, valor);
  const setFuente = (campo: string, valor: unknown) =>
    cambiarSubBloque(setDatos, 'muestra_punto_muestreo', 'fuente', campo, valor);
  const setInspeccion = (campo: string, valor: unknown) =>
    cambiarBloque(setDatos, 'inspeccion_sanitaria', campo, valor);
  const setAlmacenamiento = (campo: string, valor: unknown) =>
    cambiarSubBloque(setDatos, 'inspeccion_sanitaria', 'almacenamiento_agua', campo, valor);
  const setTanque = (campo: string, valor: unknown) =>
    setDatos((actuales) => {
      const insp = actuales.inspeccion_sanitaria as Record<string, unknown>;
      const alm = insp.almacenamiento_agua as Record<string, unknown>;
      return {
        ...actuales,
        inspeccion_sanitaria: {
          ...insp,
          almacenamiento_agua: {
            ...alm,
            tanque: { ...(alm.tanque as Record<string, unknown>), [campo]: valor },
          },
        },
      };
    });

  return (
    <>
      <ProtocoloSection numero={desde} titulo="Datos de la Muestra y Punto de Muestreo">
        <CampoSelect
          label="Tipo de fuente"
          value={muestra.fuente.tipo}
          onChange={(v) => setFuente('tipo', v)}
          opciones={TIPOS_FUENTE}
          error={errores['muestra_punto_muestreo.fuente.tipo']}
        />
        <CampoTexto
          label="Captación"
          value={muestra.fuente.captacion}
          onChange={(v) => setFuente('captacion', v)}
        />
        <CampoTexto
          label="Profundidad"
          value={muestra.fuente.profundidad_m}
          onChange={(v) => setFuente('profundidad_m', v)}
          placeholder="60 - 65 m"
        />
        <CampoSiNo
          id="tratamiento"
          label="¿Existe tratamiento del agua?"
          value={muestra.existe_tratamiento_agua}
          onChange={(v) => setMuestra('existe_tratamiento_agua', v)}
        />

        <CampoSelect
          label="Tipo de distribución"
          value={muestra.distribucion.tipo}
          onChange={(v) => setMuestra('distribucion', { ...muestra.distribucion, tipo: v })}
          opciones={TIPOS_DISTRIBUCION}
        />
        <CampoTexto
          label="Lugar de muestreo"
          value={muestra.lugar_muestreo}
          onChange={(v) => setMuestra('lugar_muestreo', v)}
          error={errores['muestra_punto_muestreo.lugar_muestreo']}
        />
        <CampoTexto
          label="Punto de muestreo"
          value={muestra.punto_muestreo}
          onChange={(v) => setMuestra('punto_muestreo', v)}
        />
        <CampoTexto
          label="Uso del agua"
          value={muestra.uso_agua}
          onChange={(v) => setMuestra('uso_agua', v)}
        />
        <CampoTexto
          label="Apariencia de la muestra"
          value={muestra.apariencia_muestra}
          onChange={(v) => setMuestra('apariencia_muestra', v)}
        />
        <CampoSelect
          label="Estado del tiempo"
          value={muestra.estado_tiempo}
          onChange={(v) => setMuestra('estado_tiempo', v)}
          opciones={ESTADOS_TIEMPO}
        />

        <CampoSiNo
          id="preservado"
          label="Muestreo simple y preservado de acuerdo a normas C.A.S.A."
          value={muestra.muestreo_simple_preservado_casa}
          onChange={(v) => setMuestra('muestreo_simple_preservado_casa', v)}
        />
      </ProtocoloSection>

      <ProtocoloSection numero={desde + 1} titulo="Inspección Sanitaria">
        <CampoArea
          label="Estado sanitario del lugar de muestreo"
          value={inspeccion.estado_sanitario_lugar}
          onChange={(v) => setInspeccion('estado_sanitario_lugar', v)}
          rows={2}
        />
        <CampoArea
          label="Estado sanitario del punto de muestreo"
          value={inspeccion.estado_sanitario_punto}
          onChange={(v) => setInspeccion('estado_sanitario_punto', v)}
          rows={2}
        />

        <ImagenUploader
          puntoId={puntoId}
          destino="protocolos"
          imagenes={inspeccion.imagenes}
          onChange={(imagenes) => setInspeccion('imagenes', imagenes)}
        />

        <SeparadorSeccion />

        <Text style={styles.subHeading}>Medios de Almacenamiento de Agua</Text>

        <CampoSiNo
          id="almacena"
          label="¿Almacena agua?"
          value={inspeccion.almacena_agua}
          onChange={(v) => setInspeccion('almacena_agua', v)}
        />
        <CampoSelect
          label="Tipo de tanque"
          value={almacenamiento.tanque.tipo}
          onChange={(v) => setTanque('tipo', v)}
          opciones={TIPOS_TANQUE}
        />
        <CampoTexto
          label="Volumen (m³)"
          value={almacenamiento.tanque.volumen_m3}
          onChange={(v) => setTanque('volumen_m3', v)}
          placeholder="6.00"
        />

        {inspeccion.almacena_agua && (
          <>
            <View style={styles.checkSection}>
              <Label>El almacenamiento tiene:</Label>
              <View style={styles.checkGrid}>
                {(
                  [
                    ['tiene_aireador', 'Aireador'],
                    ['tiene_tuberia_rebalse', 'Tubería rebalse'],
                    ['tiene_control_nivel', 'Control de nivel'],
                    ['tiene_drenaje', 'Drenaje'],
                  ] as const
                ).map(([campo, etiqueta]) => (
                  <Checkbox
                    key={campo}
                    checked={almacenamiento[campo]}
                    onCheckedChange={(v) => setAlmacenamiento(campo, v)}
                    label={etiqueta}
                  />
                ))}
              </View>
            </View>

            <CampoSelect
              label="Frecuencia de limpieza"
              value={almacenamiento.frecuencia_limpieza}
              onChange={(v) => setAlmacenamiento('frecuencia_limpieza', v)}
              opciones={FRECUENCIAS_LIMPIEZA}
            />
          </>
        )}

        <SeparadorSeccion />

        <CampoSelect
          label="Material de la tubería"
          value={inspeccion.material_tuberia}
          onChange={(v) => setInspeccion('material_tuberia', v)}
          opciones={MATERIALES_TUBERIA}
        />
        <CampoTexto
          label="Antigüedad Años/Meses"
          value={inspeccion.antiguedad_tuberia}
          onChange={(v) => setInspeccion('antiguedad_tuberia', v)}
          placeholder="35 años"
        />
        <CampoTexto
          label="Persona de referencia"
          value={inspeccion.persona_referencia}
          onChange={(v) => setInspeccion('persona_referencia', v)}
        />
      </ProtocoloSection>
    </>
  );
}

function Mediciones({ datos, setDatos, desde }: PropsCuerpo) {
  const mediciones = (datos as unknown as DatosAguaConsumo).mediciones_campo;
  const set = (campo: string, valor: string) =>
    cambiarBloque(setDatos, 'mediciones_campo', campo, valor);

  return (
    <ProtocoloSection numero={desde} titulo="Datos de Mediciones de Campo">
      <CampoMedicion label="pH" value={mediciones.ph} onChange={(v) => set('ph', v)} />
      <CampoMedicion
        label="Conductividad (uS/cm)"
        value={mediciones.conductividad_us_cm}
        onChange={(v) => set('conductividad_us_cm', v)}
      />
      <CampoMedicion
        label="Temperatura °C (Muestra)"
        value={mediciones.temperatura_muestra_c}
        onChange={(v) => set('temperatura_muestra_c', v)}
      />
      <CampoMedicion
        label="Temperatura °C (Ambiente)"
        value={mediciones.temperatura_ambiente_c}
        onChange={(v) => set('temperatura_ambiente_c', v)}
      />
      <CampoMedicion
        label="Cloro residual (mg/L)"
        value={mediciones.cloro_residual_mg_l}
        onChange={(v) => set('cloro_residual_mg_l', v)}
      />
      <CampoMedicion
        label="Turbiedad (NTU)"
        value={mediciones.turbiedad_ntu}
        onChange={(v) => set('turbiedad_ntu', v)}
      />
      <CampoMedicion
        label="Caudal (L/s)"
        value={mediciones.caudal_l_s}
        onChange={(v) => set('caudal_l_s', v)}
      />
    </ProtocoloSection>
  );
}

const styles = StyleSheet.create({
  subHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: CasaColors.primary,
  },
  checkSection: {
    gap: 6,
  },
  checkGrid: {
    gap: 8,
  },
});

export const cuerpoAguaConsumo: CuerpoProtocolo = { Datos, Mediciones, seccionesDatos: 2 };
