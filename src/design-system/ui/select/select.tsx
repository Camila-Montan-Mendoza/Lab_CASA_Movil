import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { CasaColors, CasaRadius } from '../../tokens';
import { H1 } from '../typography/typography';
import { Button } from '../button/button';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly (string | SelectOption)[];
  placeholder?: string;
  title?: string;
  invalid?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Componente Select del Sistema de Diseño C.A.S.A. (`casa_fe/design-system/ui/select/select.tsx`).
 * Regla 1 y 7 de AGENTS.md / design.md:
 * - Borde nítido `--select-border` (`#adb2ba`).
 * - Modal selector con `<H1>` en el encabezado y botón destructivo para cerrar/cancelar.
 */
export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Seleccionar',
  title = 'Seleccionar opción',
  invalid = false,
  disabled = false,
  style,
}: SelectProps) {
  const [open, setOpen] = useState(false);

  const normalized: SelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedLabel = normalized.find((o) => o.value === value)?.label;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.75}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          invalid && styles.triggerInvalid,
          disabled && styles.triggerDisabled,
          style,
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedLabel && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </Text>
        <ChevronDown size={16} color={CasaColors.mutedForeground} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHeader}>
              <H1>{title}</H1>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={styles.closeIconBtn}
              >
                <X size={20} color={CasaColors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={normalized}
              keyExtractor={(item) => item.value}
              style={styles.list}
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => {
                      onValueChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {selected && <Check size={18} color={CasaColors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />

            {Boolean(value) && (
              <View style={styles.sheetFooter}>
                <Button
                  variant="destructive"
                  size="sm"
                  onPress={() => {
                    onValueChange('');
                    setOpen(false);
                  }}
                >
                  Limpiar selección
                </Button>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: CasaColors.selectBorder,
    borderRadius: CasaRadius.lg,
    backgroundColor: 'transparent',
  },
  triggerInvalid: {
    borderColor: CasaColors.destructive,
  },
  triggerDisabled: {
    backgroundColor: CasaColors.muted,
    opacity: 0.7,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    color: CasaColors.foreground,
    marginRight: 8,
  },
  placeholderText: {
    color: CasaColors.mutedForeground,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 27, 71, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: CasaColors.popover,
    borderTopLeftRadius: CasaRadius['4xl'],
    borderTopRightRadius: CasaRadius['4xl'],
    maxHeight: '75%',
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: CasaColors.tableDivider,
  },
  closeIconBtn: {
    padding: 4,
  },
  list: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: CasaRadius.lg,
  },
  optionSelected: {
    backgroundColor: CasaColors.primarySoftBg,
  },
  optionText: {
    fontSize: 14,
    color: CasaColors.foreground,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '700',
    color: CasaColors.primary,
  },
  sheetFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: CasaColors.tableDivider,
    alignItems: 'flex-end',
  },
});

