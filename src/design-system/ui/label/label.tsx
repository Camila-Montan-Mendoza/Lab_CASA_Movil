import React from 'react';
import { Text, StyleSheet, type TextProps } from 'react-native';
import { CasaColors } from '../../tokens';

export type LabelSize = 'xs' | 'sm' | 'default' | 'lg';
export type LabelWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export interface LabelProps extends TextProps {
  size?: LabelSize;
  weight?: LabelWeight;
  /** Campo obligatorio: agrega un asterisco rojo al final del label (`casa_fe/design-system/ui/label/label.tsx`). */
  required?: boolean;
}

export function Label({
  size = 'default',
  weight = 'semibold',
  required,
  style,
  children,
  ...props
}: LabelProps) {
  return (
    <Text
      style={[
        styles.base,
        SIZE_MAP[size],
        WEIGHT_MAP[weight],
        style,
      ]}
      {...props}
    >
      {children}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

const SIZE_MAP: Record<LabelSize, { fontSize: number }> = {
  xs: { fontSize: 12 },
  sm: { fontSize: 13 },
  default: { fontSize: 13.5 },
  lg: { fontSize: 15 },
};

const WEIGHT_MAP: Record<LabelWeight, { fontWeight: '400' | '500' | '600' | '700' }> = {
  normal: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
};

const styles = StyleSheet.create({
  base: {
    color: CasaColors.foreground,
    marginBottom: 6,
  },
  required: {
    color: CasaColors.destructive,
    fontWeight: '700',
  },
});

