import React from 'react';
import { View, TextInput, StyleSheet, type TextInputProps, type ViewStyle } from 'react-native';
import { CasaColors, CasaRadius } from '../../tokens';

export type InputSize = 'sm' | 'default' | 'lg';

export interface InputProps extends TextInputProps {
  size?: InputSize;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  invalid?: boolean;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

/**
 * Componente Input del Sistema de Diseño C.A.S.A. (`casa_fe/design-system/ui/input/input.tsx`).
 * Regla 7 de AGENTS.md / design.md: usa `--input-border` (`#adb2ba`) nítido y claramente visible.
 */
export function Input({
  size = 'default',
  startIcon,
  endIcon,
  invalid = false,
  disabled = false,
  editable,
  style,
  containerStyle,
  ...props
}: InputProps) {
  const isDisabled = disabled || editable === false;
  const height = size === 'sm' ? 36 : size === 'lg' ? 46 : 42;

  return (
    <View
      style={[
        styles.container,
        { minHeight: height },
        invalid && styles.containerInvalid,
        isDisabled && styles.containerDisabled,
        containerStyle,
      ]}
    >
      {startIcon && <View style={styles.iconLeft}>{startIcon}</View>}
      <TextInput
        editable={!isDisabled}
        placeholderTextColor={CasaColors.mutedForeground}
        style={[
          styles.input,
          { minHeight: height - 2 },
          Boolean(startIcon) && { paddingLeft: 4 },
          Boolean(endIcon) && { paddingRight: 4 },
          isDisabled && styles.inputDisabled,
          style,
        ]}
        {...props}
      />
      {endIcon && <View style={styles.iconRight}>{endIcon}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: CasaColors.inputBorder,
    borderRadius: CasaRadius.lg,
  },
  containerInvalid: {
    borderColor: CasaColors.destructive,
  },
  containerDisabled: {
    backgroundColor: CasaColors.muted,
    opacity: 0.85,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: CasaColors.foreground,
  },
  inputDisabled: {
    color: CasaColors.mutedForeground,
  },
  iconLeft: {
    paddingLeft: 12,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    paddingRight: 10,
    paddingLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

