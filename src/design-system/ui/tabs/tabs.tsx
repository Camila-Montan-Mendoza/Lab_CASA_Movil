import React, { createContext, useContext } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, type ViewStyle } from 'react-native';
import { CasaColors, CasaRadius } from '../../tokens';

interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = createContext<TabsContextValue>({
  value: '',
  onValueChange: () => {},
});

export interface TabsProps {
  value: string;
  onValueChange: (val: string) => void;
  style?: ViewStyle;
  children: React.ReactNode;
}

/**
 * Componente Tabs del Sistema de Diseño C.A.S.A. (`casa_fe/design-system/ui/tabs/tabs.tsx`).
 * La pestaña activa se rellena con `--primary` (#003770) y texto `--primary-foreground` (#ffffff).
 */
export function Tabs({ value, onValueChange, style, children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <View style={[styles.root, style]}>{children}</View>
    </TabsContext.Provider>
  );
}

export function TabsList({ style, children }: { style?: ViewStyle; children: React.ReactNode }) {
  return <View style={[styles.list, style]}>{children}</View>;
}

export interface TabsTriggerProps {
  value: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function TabsTrigger({ value, icon, children, style }: TabsTriggerProps) {
  const ctx = useContext(TabsContext);
  const active = ctx.value === value;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => ctx.onValueChange(value)}
      style={[styles.trigger, active && styles.triggerActive, style]}
    >
      {icon}
      <Text style={[styles.triggerText, active && styles.triggerTextActive]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

export function TabsContent({
  value,
  style,
  children,
}: {
  value: string;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;
  return <View style={[styles.content, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    flexDirection: 'row',
    backgroundColor: CasaColors.secondary,
    borderRadius: CasaRadius['2xl'],
    padding: 5,
    gap: 6,
  },
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: CasaRadius.xl,
  },
  triggerActive: {
    backgroundColor: CasaColors.primary,
  },
  triggerText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: CasaColors.secondaryForeground,
  },
  triggerTextActive: {
    color: CasaColors.primaryForeground,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});

