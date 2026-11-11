import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { CasaColors, CasaRadius } from '../../tokens';

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  size?: 'default' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Componente Checkbox del Sistema de Diseño C.A.S.A. (`casa_fe/design-system/ui/checkbox/checkbox.tsx`).
 * Regla 5 de AGENTS.md / design.md: el borde usa el token semántico `--checkbox-border` (`#64748b`).
 */
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  size = 'default',
  disabled = false,
  style,
}: CheckboxProps) {
  const boxSize = size === 'lg' ? 22 : 18;
  const iconSize = size === 'lg' ? 15 : 13;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      style={[
        styles.row,
        label ? styles.rowCard : undefined,
        label && checked ? styles.rowCardChecked : undefined,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View
        style={[
          styles.box,
          { width: boxSize, height: boxSize },
          checked && styles.boxChecked,
        ]}
      >
        {checked && <Check size={iconSize} color={CasaColors.primaryForeground} strokeWidth={3} />}
      </View>
      {label ? (
        <Text style={[styles.label, checked && styles.labelChecked]}>{label}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowCard: {
    borderWidth: 1,
    borderColor: CasaColors.tableDivider,
    borderRadius: CasaRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: CasaColors.card,
  },
  rowCardChecked: {
    borderColor: CasaColors.primarySoftBorder,
    backgroundColor: CasaColors.primarySoftBg,
  },
  box: {
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: CasaColors.checkboxBorder,
    backgroundColor: CasaColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: CasaColors.primary,
    borderColor: CasaColors.primary,
  },
  label: {
    flex: 1,
    fontSize: 13.5,
    color: CasaColors.foreground,
    fontWeight: '500',
  },
  labelChecked: {
    color: CasaColors.primary,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

