import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  StyleSheet,
  type ViewProps,
} from 'react-native';
import { CasaColors, CasaRadius } from '../../tokens';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * Componente Dialog del Sistema de Diseño C.A.S.A. (`casa_fe/design-system/ui/dialog/dialog.tsx`).
 * Regla 1 de AGENTS.md / design.md:
 * - Los títulos deben colocarse directamente dentro de `DialogHeader` usando `<H1>Título</H1>`.
 * - NO usar `DialogTitle`.
 */
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={() => onOpenChange(false)}
    >
      <View style={styles.overlay}>{children}</View>
    </Modal>
  );
}

export function DialogContent({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
}

export function DialogHeader({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
}

export function DialogBody({ style, children, ...props }: ViewProps) {
  return (
    <ScrollView
      style={styles.bodyScroll}
      contentContainerStyle={[styles.bodyContent, style]}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export function DialogFooter({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 27, 71, 0.45)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: CasaColors.popover,
    borderTopLeftRadius: CasaRadius['4xl'],
    borderTopRightRadius: CasaRadius['4xl'],
    maxHeight: '92%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: CasaColors.tableDivider,
  },
  bodyScroll: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: 20,
    gap: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: CasaColors.tableDivider,
    backgroundColor: CasaColors.popover,
  },
});

