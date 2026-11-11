import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { CasaColors, CasaChipPalette, CasaRadius, type ChipColor } from '../../tokens';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'soft';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  variant?: BadgeVariant;
  color?: ChipColor;
  /** Regla 2 de AGENTS.md / design.md: usar siempre size="md" por defecto, evitando "xs". */
  size?: BadgeSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  capitalize?: boolean;
}

export function Badge({
  variant = 'default',
  color,
  size = 'md',
  icon,
  children,
  style,
  textStyle,
  capitalize,
}: BadgeProps) {
  const variantColors = getVariantStyle(variant, color);
  const sizeSpec = SIZE_STYLES[size];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: variantColors.bg,
          borderColor: variantColors.border,
          paddingHorizontal: sizeSpec.px,
          paddingVertical: sizeSpec.py,
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.text,
          {
            color: variantColors.fg,
            fontSize: sizeSpec.fontSize,
            textTransform: capitalize ? 'capitalize' : 'none',
          },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {children}
      </Text>
    </View>
  );
}

function getVariantStyle(
  variant: BadgeVariant,
  color?: ChipColor
): { bg: string; fg: string; border: string } {
  if (color) {
    const chip = CasaChipPalette[color];
    return { bg: chip.bg, fg: chip.fg, border: chip.border };
  }

  switch (variant) {
    case 'default':
      return {
        bg: CasaColors.primary,
        fg: CasaColors.primaryForeground,
        border: 'transparent',
      };
    case 'secondary':
      return {
        bg: CasaColors.secondary,
        fg: CasaColors.secondaryForeground,
        border: 'transparent',
      };
    case 'destructive':
      return {
        bg: CasaColors.destructiveSoftBg,
        fg: CasaColors.destructive,
        border: CasaColors.destructiveSoftBorder,
      };
    case 'outline':
      return {
        bg: 'transparent',
        fg: CasaColors.foreground,
        border: CasaColors.inputBorder,
      };
    case 'soft':
      return {
        bg: CasaColors.primarySoftBg,
        fg: CasaColors.primary,
        border: CasaColors.primarySoftBorder,
      };
    case 'ghost':
      return {
        bg: CasaColors.muted,
        fg: CasaColors.mutedForeground,
        border: 'transparent',
      };
  }
}

const SIZE_STYLES: Record<BadgeSize, { px: number; py: number; fontSize: number }> = {
  sm: { px: 10, py: 3, fontSize: 11 },
  md: { px: 12, py: 4, fontSize: 12 },
  lg: { px: 14, py: 6, fontSize: 13 },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
     alignSelf: 'flex-start',
    gap: 5,
    borderRadius: CasaRadius.full,
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
  },
});

export { CasaChipPalette };
export type { ChipColor };

