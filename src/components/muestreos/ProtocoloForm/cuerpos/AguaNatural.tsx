import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { Button } from '@/design-system/ui/button/button';
import { Input } from '@/design-system/ui/input/input';
import { Label } from '@/design-system/ui/label/label';
import { CasaColors } from '@/design-system/tokens';
import {
  CAPTACIONES_NATURAL,
  ESTADOS_TIEMPO,
  TIPOS_FUENTE_NATURAL,
  TIPOS_MUESTREO_NATURAL,
} from '@/lib/constants/protocolo.constants';
import type { DatosAguaNatural } from '@/schemas/muestreos/muestreos.schema';
import { ProtocoloSection } from '../ProtocoloSection';
import { CampoMedicion, CampoSelect, CampoSiNo, CampoTexto } from '../Campos';
import {
  cambiarBloque,
  cambiarSubBloque,
  type CuerpoProtocolo,
  type PropsCuerpo,
} from './tipos';

/** AN — Agua Natural (`casa_fe/components/muestreos/ProtocoloForm/cuerpos/AguaNatural.tsx`). */

function Datos({ datos, setDatos, errores, desde }: PropsCuerpo) {
  const muestra = (datos as unknown as DatosAguaNatural).muestra_punto_muestreo;

  const setMuestra = (campo: string, valor: unknown) =>
    cambiarBloque(setDatos, 'muestra_punto_muestreo', campo, valor);
  const setFuente = (campo: string, valor: unknown) =>
    cambiarSubBloque(setDatos, 'muestra_punto_muestreo', 'fuente', campo, valor);

  const captaciones = CAPTACIONES_NATURAL[muestra.fuente.tipo] ?? [];
  const esSubterranea = muestra.fuente.tipo === TIPOS_FUENTE_NATURAL[0];

  return (
    <ProtocoloSection
      numero={desde}
      titulo="Datos de la Muestra, Lugar y Punto de Muestreo"
    >
      <CampoSelect
        label="Tipo de fuente"
        value={muestra.fuente.tipo}
        onChange={(v) =>
          setDatos((actuales) => {
            const m = actuales.muestra_punto_muestreo as Record<string, unknown>;
            const fuente = m.fuente as Record<string, unknown>;
            return {
              ...actuales,
              muestra_punto_muestreo: {
                ...m,
                fuente: { ...fuente, tipo: v, captacion: '' },
              },
            };
          })
        }
        opciones={TIPOS_FUENTE_NATURAL}
        error={errores['muestra_punto_muestreo.fuente.tipo']}
      />
      <CampoSelect
        label="Captación"
        value={muestra.fuente.captacion}
        onChange={(v) => setFuente('captacion', v)}
        opciones={captaciones}
        placeholder={muestra.fuente.tipo ? 'Seleccionar' : 'Elegí primero la fuente'}
      />
      {esSubterranea && (
        <CampoTexto
          label="Profundidad"
          value={muestra.fuente.profundidad_m}
          onChange={(v) => setFuente('profundidad_m', v)}
          placeholder="60 - 65 m"
        />
      )}

      <CampoTexto
        label="Lugar de muestreo (dirección)"
        value={muestra.lugar_muestreo}
        onChange={(v) => setMuestra('lugar_muestreo', v)}
        error={errores['muestra_punto_muestreo.lugar_muestreo']}
      />
      <CampoTexto
        label="Punto de muestreo (ubicación)"
        value={muestra.punto_muestreo}
        onChange={(v) => setMuestra('punto_muestreo', v)}
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
      <CampoSelect
        label="Tipo de muestreo"
        value={muestra.tipo_muestreo}
        onChange={(v) => setMuestra('tipo_muestreo', v)}
        opciones={TIPOS_MUESTREO_NATURAL}
      />

      <CampoSiNo
        id="preservado-an"
        label="Muestra preservada de acuerdo a normas C.A.S.A."
        value={muestra.muestreo_simple_preservado_casa}
        onChange={(v) => setMuestra('muestreo_simple_preservado_casa', v)}
      />
    </ProtocoloSection>
  );
}

function Mediciones({ datos, setDatos, desde }: PropsCuerpo) {
  const mediciones = (datos as unknown as DatosAguaNatural).mediciones_campo;
  const set = (campo: string, valor: unknown) =>
    cambiarBloque(setDatos, 'mediciones_campo', campo, valor);

  const otros = mediciones.otros;
  const cambiarOtro = (indice: number, campo: 'ensayo' | 'valor', valor: string) =>
    set(
      'otros',
      otros.map((otro, i) => (i === indice ? { ...otro, [campo]: valor } : otro))
    );

  return (
    <ProtocoloSection numero={desde} titulo="Datos de Medición de Campo">
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
        label="Turbiedad (NTU)"
        value={mediciones.turbiedad_ntu}
        onChange={(v) => set('turbiedad_ntu', v)}
      />
      <CampoMedicion
        label="Caudal (L/s)"
        value={mediciones.caudal_l_s}
        onChange={(v) => set('caudal_l_s', v)}
      />

      <View style={styles.otrosSection}>
        <Label>Otras mediciones</Label>
        {otros.length === 0 ? (
          <Text style={styles.emptyText}>Sin mediciones adicionales.</Text>
        ) : (
          otros.map((otro, indice) => (
            <View key={indice} style={styles.otroRow}>
              <Input
                containerStyle={styles.otroInput}
                placeholder="Ensayo"
                value={otro.ensayo}
                onChangeText={(txt) => cambiarOtro(indice, 'ensayo', txt)}
              />
              <Input
                containerStyle={styles.otroInput}
                placeholder="Valor"
                keyboardType="decimal-pad"
                value={otro.valor}
                onChangeText={(txt) => cambiarOtro(indice, 'valor', txt)}
              />
              <Button
                variant="destructive"
                size="icon-sm"
                onPress={() => set('otros', otros.filter((_, i) => i !== indice))}
                tooltip="Quitar medición"
              >
                <Trash2 size={14} color={CasaColors.destructiveForeground} />
              </Button>
            </View>
          ))
        )}
        <Button
          variant="secondary"
          size="sm"
          onPress={() => set('otros', [...otros, { ensayo: '', valor: '' }])}
          tooltip="Agregar otra medición en campo"
        >
          <Plus size={15} color={CasaColors.secondaryForeground} />
          Agregar medición
        </Button>
      </View>
    </ProtocoloSection>
  );
}

const styles = StyleSheet.create({
  otrosSection: {
    gap: 8,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: CasaColors.mutedForeground,
  },
  otroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  otroInput: {
    flex: 1,
  },
});

export const cuerpoAguaNatural: CuerpoProtocolo = { Datos, Mediciones, seccionesDatos: 1 };
