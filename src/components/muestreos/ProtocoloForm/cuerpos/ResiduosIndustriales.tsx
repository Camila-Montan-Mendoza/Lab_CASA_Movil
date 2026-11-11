import React from 'react';
import { StyleSheet, Text } from 'react-native';
import {
  ESTADOS_TIEMPO,
  EVACUACIONES_FINALES,
  FUENTES_RESIDUOS,
  LUGARES_MUESTREO_RESIDUOS,
  TIPOS_ACTIVIDAD,
} from '@/lib/constants/protocolo.constants';
import type { DatosResiduosIndustriales } from '@/schemas/muestreos/muestreos.schema';
import { CasaColors } from '@/design-system/tokens';
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
  PuntoMuestreoResiduos,
  TipoMuestreoSeleccionado,
} from './ResiduosComun';
import {
  cambiarBloque,
  cambiarSubBloque,
  type CuerpoProtocolo,
  type PropsCuerpo,
} from './tipos';

function Datos({ datos, setDatos, errores, desde, puntoId }: PropsCuerpo) {
  const d = datos as unknown as DatosResiduosIndustriales;
  const muestra = d.muestra_punto_muestreo;
  const inspeccion = d.inspeccion_sanitaria;

  const setMuestra = (campo: string, valor: unknown) =>
    cambiarBloque(setDatos, 'muestra_punto_muestreo', campo, valor);
  const setInspeccion = (campo: string, valor: unknown) =>
    cambiarBloque(setDatos, 'inspeccion_sanitaria', campo, valor);

  return (
    <>
      <ProtocoloSection
        numero={desde}
        titulo="Datos de la Muestra, Lugar y Punto de Muestreo"
      >
        <CampoSelect
          label="Tipo de fuente"
          value={muestra.fuente.tipo}
          onChange={(v) =>
            cambiarSubBloque(
              setDatos,
              'muestra_punto_muestreo',
              'fuente',
              'tipo',
              v
            )
          }
          opciones={FUENTES_RESIDUOS}
          error={errores['muestra_punto_muestreo.fuente.tipo']}
        />
        <CampoSelect
          label="Lugar de muestreo"
          value={muestra.lugar_muestreo}
          onChange={(v) => setMuestra('lugar_muestreo', v)}
          opciones={LUGARES_MUESTREO_RESIDUOS}
          error={errores['muestra_punto_muestreo.lugar_muestreo']}
        />

        <SeparadorSeccion />

        <Text style={styles.subHeading}>Tipo de Actividad</Text>
        <CampoSelect
          label="Rubro"
          value={muestra.tipo_actividad.tipo}
          onChange={(v) =>
            cambiarSubBloque(
              setDatos,
              'muestra_punto_muestreo',
              'tipo_actividad',
              'tipo',
              v
            )
          }
          opciones={TIPOS_ACTIVIDAD}
        />
        <CampoTexto
          label="Actividad concreta"
          value={muestra.tipo_actividad.especificacion}
          onChange={(v) =>
            cambiarSubBloque(
              setDatos,
              'muestra_punto_muestreo',
              'tipo_actividad',
              'especificacion',
              v
            )
          }
          placeholder="Curtiembre, matadero, hospital…"
        />

        <SeparadorSeccion />

        <CampoSiNo
          id="tratamiento-ril"
          label="¿Existe tratamiento del RIL?"
          value={muestra.tratamiento_ril.existe}
          onChange={(v) =>
            cambiarSubBloque(
              setDatos,
              'muestra_punto_muestreo',
              'tratamiento_ril',
              'existe',
              v
            )
          }
        />
        {muestra.tratamiento_ril.existe && (
          <CampoTexto
            label="Describa el (los) tratamiento(s)"
            value={muestra.tratamiento_ril.especificacion}
            onChange={(v) =>
              cambiarSubBloque(
                setDatos,
                'muestra_punto_muestreo',
                'tratamiento_ril',
                'especificacion',
                v
              )
            }
          />
        )}

        <SeparadorSeccion />

        <PuntoMuestreoResiduos
          punto={muestra.punto_muestreo}
          setDatos={setDatos}
        />

        <CampoArea
          label="Punto de muestreo (detalle)"
          value={muestra.detalle_punto_muestreo}
          onChange={(v) => setMuestra('detalle_punto_muestreo', v)}
          rows={2}
        />

        <SeparadorSeccion />

        <TipoMuestreoSeleccionado
          seleccionado={muestra.tipo_muestreo_seleccionado}
          setDatos={setDatos}
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
          id="preservado-ril"
          label="Muestreo de acuerdo a normas del C.A.S.A."
          value={muestra.muestreo_simple_preservado_casa}
          onChange={(v) => setMuestra('muestreo_simple_preservado_casa', v)}
        />
      </ProtocoloSection>

      <ProtocoloSection numero={desde + 1} titulo="Inspección Sanitaria">
        <CampoArea
          label="Condiciones de la PTAR-RIL"
          value={inspeccion.condiciones_ptar_ril}
          onChange={(v) => setInspeccion('condiciones_ptar_ril', v)}
          rows={2}
        />
        <CampoArea
          label="Condiciones del lugar de muestreo"
          value={inspeccion.condiciones_lugar_muestreo}
          onChange={(v) => setInspeccion('condiciones_lugar_muestreo', v)}
          rows={2}
        />
        <CampoArea
          label="Condiciones del punto de muestreo"
          value={inspeccion.condiciones_punto_muestreo}
          onChange={(v) => setInspeccion('condiciones_punto_muestreo', v)}
          rows={2}
        />

        <ImagenUploader
          puntoId={puntoId}
          destino="protocolos"
          imagenes={inspeccion.imagenes}
          onChange={(imagenes) => setInspeccion('imagenes', imagenes)}
        />

        <SeparadorSeccion />

        <CampoSelect
          label="Evacuación final del RIL"
          value={inspeccion.evacuacion_final_ril}
          onChange={(v) => setInspeccion('evacuacion_final_ril', v)}
          opciones={EVACUACIONES_FINALES}
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
  const mediciones = (datos as unknown as DatosResiduosIndustriales).mediciones_campo;
  const set = (campo: string, valor: string) =>
    cambiarBloque(setDatos, 'mediciones_campo', campo, valor);

  return (
    <ProtocoloSection numero={desde} titulo="Datos de Mediciones de Campo">
      <CampoMedicion
        label="pH"
        value={mediciones.ph}
        onChange={(v) => set('ph', v)}
      />
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
        label="O.D. (mg O2/L)"
        value={mediciones.od_mg_l}
        onChange={(v) => set('od_mg_l', v)}
      />
      <CampoMedicion
        label="Caudal (L/s)"
        value={mediciones.caudal_l_s}
        onChange={(v) => set('caudal_l_s', v)}
      />
      <CampoMedicion
        label="Sólidos sedimentables (ml/L)"
        value={mediciones.solidos_sedimentales}
        onChange={(v) => set('solidos_sedimentales', v)}
      />

      <CampoArea
        label="Principales productos químicos utilizados en la actividad industrial y en el tratamiento del RIL"
        value={mediciones.productos_quimicos}
        onChange={(v) => set('productos_quimicos', v)}
        rows={2}
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
});

export const cuerpoResiduosIndustriales: CuerpoProtocolo = {
  Datos,
  Mediciones,
  seccionesDatos: 2,
};
