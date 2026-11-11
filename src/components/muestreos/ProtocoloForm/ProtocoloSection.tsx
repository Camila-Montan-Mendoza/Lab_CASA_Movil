import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/design-system/ui/card/card';
import { CasaColors, CasaRadius } from '@/design-system/tokens';

interface Props {
  numero?: number;
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Bloque numerado del protocolo (`casa_fe/components/muestreos/ProtocoloForm/ProtocoloSection.tsx`),
 * usando los mismos componentes `Card`, `CardHeader`, `CardTitle` y colores `--primary` (`#003770`).
 */
export function ProtocoloSection({ numero, titulo, descripcion, accion, children }: Props) {
  return (
    <Card style={styles.card}>
      <CardHeader>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            {numero !== undefined && (
              <View style={styles.badgeNumero}>
                <Text style={styles.badgeNumeroText}>{numero}</Text>
              </View>
            )}
            <CardTitle style={styles.title}>{titulo}</CardTitle>
          </View>
          {accion}
        </View>
        {descripcion ? <CardDescription>{descripcion}</CardDescription> : null}
      </CardHeader>
      <CardContent style={styles.content}>{children}</CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  badgeNumero: {
    width: 24,
    height: 24,
    borderRadius: CasaRadius.sm,
    backgroundColor: CasaColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNumeroText: {
    color: CasaColors.primaryForeground,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    flex: 1,
  },
  content: {
    gap: 14,
  },
});
