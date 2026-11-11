import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { CasaColors, CasaRadius } from '../../tokens';

export type ButtonVariant =
  | 'default'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'link';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'xl' | 'icon' | 'icon-sm';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  /** Regla 4 de AGENTS.md / design.md: soporte de tooltip (en móvil se muestra con pulsación larga si es botón de acción). */
  tooltip?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Componente Button del Sistema de Diseño C.A.S.A. (`casa_fe/design-system/ui/button/button.tsx`).
 * - `default`: fondo `--primary` (#003770) + texto blanco.
 * - `destructive`: fondo sólido `--destructive-surface` (#BC000C) + texto blanco (Regla 4: botones Cancelar o peligro).
 * - `outline`: borde visible `--button-outline-border` + fondo blanco/card.
 * - `secondary`: fondo `--secondary` (#e4ecf5) + texto `--secondary-foreground`.
 */
export function Button({
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  onPress,
  tooltip,
  children,
  style,
  textStyle,
}: ButtonProps) {
  const palette = VARIANT_STYLES[variant];
  const dimensions = SIZE_STYLES[size];

  const handleLongPress = () => {
    if (tooltip) {
      Alert.alert('Información', tooltip);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      onPress={onPress}
      onLongPress={tooltip ? handleLongPress : undefined}
      accessibilityLabel={tooltip}
      style={[
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: palette.borderWidth,
          minHeight: dimensions.height,
          paddingHorizontal: dimensions.px,
          paddingVertical: dimensions.py,
          borderRadius: dimensions.radius,
        },
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        React.Children.map(children, (child) => {
          if (typeof child === 'string' || typeof child === 'number') {
            return (
              <Text
                style={[
                  styles.text,
                  {
                    color: palette.fg,
                    fontSize: dimensions.fontSize,
                    textDecorationLine: variant === 'link' ? 'underline' : 'none',
                  },
                  textStyle,
                ]}
              >
                {child}
              </Text>
            );
          }
          return child;
        })
      )}
    </TouchableOpacity>
  );
}

const VARIANT_STYLES: Record<
  ButtonVariant,
  { bg: string; fg: string; border: string; borderWidth: number }
> = {
  default: {
    bg: CasaColors.primary,
    fg: CasaColors.primaryForeground,
    border: CasaColors.primary,
    borderWidth: 1,
  },
  destructive: {
    bg: CasaColors.destructive,
    fg: CasaColors.destructiveForeground,
    border: CasaColors.destructive,
    borderWidth: 1,
  },
  outline: {
    bg: CasaColors.card,
    fg: CasaColors.foreground,
    border: CasaColors.inputBorder,
    borderWidth: 1,
  },
  secondary: {
    bg: CasaColors.secondary,
    fg: CasaColors.secondaryForeground,
    border: 'transparent',
    borderWidth: 1,
  },
  ghost: {
    bg: 'transparent',
    fg: CasaColors.foreground,
    border: 'transparent',
    borderWidth: 0,
  },
  link: {
    bg: 'transparent',
    fg: CasaColors.primary,
    border: 'transparent',
    borderWidth: 0,
  },
};

const SIZE_STYLES: Record<
  ButtonSize,
  { height: number; px: number; py: number; fontSize: number; radius: number }
> = {
  default: { height: 40, px: 16, py: 9, fontSize: 14, radius: CasaRadius.lg },
  sm: { height: 34, px: 12, py: 6, fontSize: 13, radius: CasaRadius.md },
  lg: { height: 44, px: 20, py: 11, fontSize: 15, radius: CasaRadius.lg },
  xl: { height: 48, px: 24, py: 12, fontSize: 16, radius: CasaRadius.xl },
  icon: { height: 36, px: 8, py: 8, fontSize: 14, radius: CasaRadius.md },
  'icon-sm': { height: 32, px: 6, py: 6, fontSize: 13, radius: CasaRadius.md },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  text: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

