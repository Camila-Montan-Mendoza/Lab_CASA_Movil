import React, { createContext, useContext } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, type ViewStyle } from 'react-native';
import { CasaColors, CasaRadius } from '../../tokens';

interface RadioGroupContextValue {
  value: string;
  onValueChange: (val: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue>({
  value: '',
  onValueChange: () => {},
});

export interface RadioGroupProps {
  value: string;
  onValueChange: (val: string) => void;
  disabled?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}

export function RadioGroup({
  value,
  onValueChange,
  disabled,
  style,
  children,
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, disabled }}>
      <View style={[styles.group, style]}>{children}</View>
    </RadioGroupContext.Provider>
  );
}

export interface RadioGroupItemProps {
  value: string;
  label: string;
  style?: ViewStyle;
}

export function RadioGroupItem({ value, label, style }: RadioGroupItemProps) {
  const ctx = useContext(RadioGroupContext);
  const selected = ctx.value === value;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={ctx.disabled}
      onPress={() => ctx.onValueChange(value)}
      style={[
        styles.item,
        selected && styles.itemSelected,
        ctx.disabled && styles.disabled,
        style,
      ]}
    >
      <View style={[styles.outerCircle, selected && styles.outerCircleSelected]}>
        {selected && <View style={styles.innerCircle} />}
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: CasaRadius.lg,
    borderWidth: 1,
    borderColor: CasaColors.inputBorder,
    backgroundColor: CasaColors.card,
  },
  itemSelected: {
    borderColor: CasaColors.primary,
    backgroundColor: CasaColors.primarySoftBg,
  },
  outerCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: CasaColors.checkboxBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CasaColors.card,
  },
  outerCircleSelected: {
    borderColor: CasaColors.primary,
  },
  innerCircle: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: CasaColors.primary,
  },
  label: {
    fontSize: 13.5,
    color: CasaColors.foreground,
    fontWeight: '500',
  },
  labelSelected: {
    color: CasaColors.primary,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});

