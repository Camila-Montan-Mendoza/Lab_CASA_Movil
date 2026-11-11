import React from 'react';
import { TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { CasaColors, CasaRadius } from '../../tokens';

export interface TextareaProps extends TextInputProps {
  invalid?: boolean;
  disabled?: boolean;
  rows?: number;
}

/**
 * Componente Textarea del Sistema de Diseño C.A.S.A. (`casa_fe/design-system/ui/textarea/textarea.tsx`).
 * Regla 7 de AGENTS.md / design.md: usa `--input-border` (`#adb2ba`) nítido y visible.
 */
export function Textarea({
  invalid = false,
  disabled = false,
  editable,
  rows = 3,
  style,
  ...props
}: TextareaProps) {
  const isDisabled = disabled || editable === false;
  return (
    <TextInput
      multiline
      numberOfLines={rows}
      editable={!isDisabled}
      placeholderTextColor={CasaColors.mutedForeground}
      textAlignVertical="top"
      style={[
        styles.textarea,
        { minHeight: Math.max(76, rows * 24) },
        invalid && styles.invalid,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  textarea: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: CasaColors.inputBorder,
    borderRadius: CasaRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: CasaColors.foreground,
  },
  invalid: {
    borderColor: CasaColors.destructive,
  },
  disabled: {
    backgroundColor: CasaColors.muted,
    color: CasaColors.mutedForeground,
  },
});

