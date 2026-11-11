import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from '@/design-system/ui/input/input';
import { Label } from '@/design-system/ui/label/label';
import { Textarea } from '@/design-system/ui/textarea/textarea';
import { Select } from '@/design-system/ui/select/select';
import { RadioGroup, RadioGroupItem } from '@/design-system/ui/radio-group/radio-group';
import { Button } from '@/design-system/ui/button/button';
import { CasaColors } from '@/design-system/tokens';

/**
 * Campos del protocolo (`casa_fe/components/muestreos/ProtocoloForm/Campos.tsx`):
 * envoltorios finos sobre `@/design-system/ui/*` (Input, Label, Textarea, Select, RadioGroup).
 */

interface BaseProps {
  label: string;
  error?: string;
}

export function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  type = 'text',
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'date' | 'time';
}) {
  const defaultPlaceholder =
    placeholder ??
    (type === 'date' ? 'AAAA-MM-DD' : type === 'time' ? 'HH:MM' : '');

  const setNowTime = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    onChange(`${hh}:${mm}`);
  };

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <Label style={styles.noMarginLabel}>{label}</Label>
        {type === 'time' && !disabled && (
          <Button variant="secondary" size="sm" onPress={setNowTime} style={styles.quickBtn}>
            Ahora
          </Button>
        )}
      </View>
      <Input
        value={value}
        editable={!disabled}
        disabled={disabled}
        placeholder={defaultPlaceholder}
        onChangeText={onChange}
        invalid={Boolean(error)}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function CampoFecha({
  label,
  value,
  onChange,
  error,
  disabled,
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const setToday = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <Label style={styles.noMarginLabel}>{label}</Label>
        {!disabled && (
          <Button variant="secondary" size="sm" onPress={setToday} style={styles.quickBtn}>
            Hoy
          </Button>
        )}
      </View>
      <Input
        value={value}
        editable={!disabled}
        disabled={disabled}
        placeholder="AAAA-MM-DD (ej. 2026-11-11)"
        onChangeText={onChange}
        invalid={Boolean(error)}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function CampoArea({
  label,
  value,
  onChange,
  placeholder,
  error,
  rows = 3,
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Label>{label}</Label>
      <Textarea
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChangeText={onChange}
        invalid={Boolean(error)}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function CampoSelect({
  label,
  value,
  onChange,
  opciones,
  placeholder = 'Seleccionar',
  error,
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  opciones: readonly string[];
  placeholder?: string;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={onChange}
        options={opciones}
        placeholder={placeholder}
        title={label}
        invalid={Boolean(error)}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

/** Sí / No como radios, igual que en `casa_fe/components/muestreos/ProtocoloForm/Campos.tsx`. */
export function CampoSiNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Label>{label}</Label>
      <RadioGroup
        value={value ? 'si' : 'no'}
        onValueChange={(v) => onChange(v === 'si')}
      >
        <RadioGroupItem value="si" label="Sí" />
        <RadioGroupItem value="no" label="No" />
      </RadioGroup>
    </View>
  );
}

/** Medición de campo: valor numérico con la unidad en la etiqueta (`casa_fe`). */
export function CampoMedicion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Label>{label}</Label>
      <Input
        keyboardType="decimal-pad"
        placeholder="Valor medido"
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

export function SeparadorSeccion() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noMarginLabel: {
    marginBottom: 0,
  },
  quickBtn: {
    minHeight: 28,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: CasaColors.destructive,
  },
  separator: {
    height: 1,
    backgroundColor: CasaColors.tableDivider,
    marginVertical: 6,
  },
});
