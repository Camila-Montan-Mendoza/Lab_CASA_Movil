import React from 'react';
import { Text, StyleSheet } from 'react-native';
import {
  TIPOS_MUESTREO_RESIDUOS,
  TIPOS_PUNTO_RESIDUOS,
  TIPOS_TRATAMIENTO,
  TIPO_MUESTREO_COMPUESTO,
} from '@/lib/constants/protocolo.constants';
import { CasaColors } from '@/design-system/tokens';
import { CampoSelect, CampoSiNo, CampoTexto } from '../Campos';
import { cambiarBloque, cambiarSubBloque, type PropsCuerpo } from './tipos';

interface PuntoResiduos {
  tipo: string;
  tratamiento: boolean;
  tipo_tratamiento: string;
}

export function PuntoMuestreoResiduos({
  punto,
  setDatos,
}: {
  punto: PuntoResiduos;
  setDatos: PropsCuerpo['setDatos'];
}) {
  const set = (campo: string, valor: unknown) =>
    cambiarSubBloque(setDatos, 'muestra_punto_muestreo', 'punto_muestreo', campo, valor);

  return (
    <>
      <Text style={styles.subHeading}>Datos del Punto de Muestreo</Text>
      <CampoSelect
        label="Punto"
        value={punto.tipo}
        onChange={(v) => set('tipo', v)}
        opciones={TIPOS_PUNTO_RESIDUOS}
      />
      <CampoSiNo
        id="punto-tratamiento"
        label="¿Con tratamiento?"
        value={punto.tratamiento}
        onChange={(v) =>
          setDatos((datos) => {
            const muestra = datos.muestra_punto_muestreo as Record<string, unknown>;
            const actual = muestra.punto_muestreo as Record<string, unknown>;
            return {
              ...datos,
              muestra_punto_muestreo: {
                ...muestra,
                punto_muestreo: {
                  ...actual,
                  tratamiento: v,
                  tipo_tratamiento: v ? actual.tipo_tratamiento : '',
                },
              },
            };
          })
        }
      />
      {punto.tratamiento && (
        <CampoSelect
          label="Tipo de tratamiento"
          value={punto.tipo_tratamiento}
          onChange={(v) => set('tipo_tratamiento', v)}
          opciones={TIPOS_TRATAMIENTO}
        />
      )}
    </>
  );
}

export function TipoMuestreoSeleccionado({
  seleccionado,
  setDatos,
}: {
  seleccionado: { tipo: string; data: { horas_muestreo: string } };
  setDatos: PropsCuerpo['setDatos'];
}) {
  return (
    <>
      <CampoSelect
        label="Tipo de muestreo seleccionado"
        value={seleccionado.tipo}
        onChange={(v) =>
          cambiarBloque(setDatos, 'muestra_punto_muestreo', 'tipo_muestreo_seleccionado', {
            tipo: v,
            data: {
              horas_muestreo:
                v === TIPO_MUESTREO_COMPUESTO ? seleccionado.data.horas_muestreo : '',
            },
          })
        }
        opciones={TIPOS_MUESTREO_RESIDUOS}
      />
      {seleccionado.tipo === TIPO_MUESTREO_COMPUESTO && (
        <CampoTexto
          label="Horas de muestreo"
          value={seleccionado.data.horas_muestreo}
          onChange={(v) =>
            cambiarBloque(setDatos, 'muestra_punto_muestreo', 'tipo_muestreo_seleccionado', {
              tipo: seleccionado.tipo,
              data: { horas_muestreo: v },
            })
          }
          placeholder="08:00 a 16:00"
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  subHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: CasaColors.primary,
  },
});
