import React from 'react';
import { View, Text, StyleSheet, type ViewProps, type TextProps } from 'react-native';
import { CasaColors, CasaRadius } from '../../tokens';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'muted';
  size?: 'default' | 'sm' | 'lg';
}

/**
 * Componente Card del Sistema de Diseño C.A.S.A. (`casa_fe/design-system/ui/card/card.tsx`).
 */
export function Card({
  variant = 'default',
  size = 'default',
  style,
  children,
  ...props
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'muted' && styles.cardMuted,
        size === 'sm' && styles.cardSm,
        size === 'lg' && styles.cardLg,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
}

export function CardTitle({ style, children, ...props }: TextProps) {
  return (
    <Text style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
}

export function CardDescription({ style, children, ...props }: TextProps) {
  return (
    <Text style={[styles.description, style]} {...props}>
      {children}
    </Text>
  );
}

export function CardContent({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
}

export function CardFooter({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
}

export function CardAction({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.action, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CasaColors.card,
    borderRadius: CasaRadius['2xl'],
    borderWidth: 1,
    borderColor: CasaColors.tableDivider,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    shadowColor: '#001B47',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardMuted: {
    backgroundColor: CasaColors.muted,
    shadowOpacity: 0,
    elevation: 0,
  },
  cardSm: {
    paddingVertical: 12,
    gap: 8,
  },
  cardLg: {
    paddingVertical: 20,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: CasaColors.foreground,
  },
  description: {
    fontSize: 13,
    color: CasaColors.mutedForeground,
    lineHeight: 18,
  },
  content: {
    gap: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: CasaColors.tableDivider,
  },
  action: {
    alignSelf: 'flex-start',
  },
});

