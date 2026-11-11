import React from 'react';
import { Text, StyleSheet, type TextProps } from 'react-native';
import { CasaColors } from '../../tokens';

/**
 * Etiquetas tipográficas centralizadas equivalentes a `@layer base` en `casa_fe/app/globals-1.css`:
 * - H1: font-extrabold, 24px, letter-spacing -0.4px, color: var(--primary) (#003770)
 * - H2: font-extrabold, 20px, letter-spacing -0.35px, color: var(--primary) (#003770)
 * - H3: font-bold, 18px, color: var(--primary) (#003770)
 * Regla 1 de AGENTS.md / design.md: usar en encabezados y directamente dentro de DialogHeader.
 */
export function H1({ children, style, ...props }: TextProps) {
  return (
    <Text style={[styles.h1, style]} {...props}>
      {children}
    </Text>
  );
}

export function H2({ children, style, ...props }: TextProps) {
  return (
    <Text style={[styles.h2, style]} {...props}>
      {children}
    </Text>
  );
}

export function H3({ children, style, ...props }: TextProps) {
  return (
    <Text style={[styles.h3, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: CasaColors.primary,
  },
  h2: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.35,
    color: CasaColors.primary,
  },
  h3: {
    fontSize: 17,
    fontWeight: '700',
    color: CasaColors.primary,
  },
});

