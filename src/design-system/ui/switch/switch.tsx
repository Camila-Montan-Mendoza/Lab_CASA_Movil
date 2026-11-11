import React from 'react';
import { Switch as RNSwitch } from 'react-native';
import { CasaColors } from '../../tokens';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Componente Switch del Sistema de Diseño C.A.S.A. (`casa_fe/design-system/ui/switch/switch.tsx`).
 */
export function Switch({ checked, onCheckedChange, disabled }: SwitchProps) {
  return (
    <RNSwitch
      value={checked}
      onValueChange={onCheckedChange}
      disabled={disabled}
      trackColor={{
        false: CasaColors.inputBorder,
        true: CasaColors.primary,
      }}
      thumbColor="#ffffff"
    />
  );
}

