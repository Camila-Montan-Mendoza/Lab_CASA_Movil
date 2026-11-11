import React from 'react';
import { Badge } from '@/design-system/ui/badge/badge';

/** Estado de un punto de muestreo, con el mismo criterio en lista y detalle que en `casa_fe`. */
export function EstadoPuntoBadge({ estado }: { estado: string }) {
  const variant =
    estado === 'muestreado'
      ? 'default'
      : estado === 'anulado'
        ? 'destructive'
        : 'secondary';

  return (
    <Badge variant={variant} size="md" capitalize>
      {estado}
    </Badge>
  );
}

/** Avance del protocolo de un punto: sin llenar o cerrado (`casa_fe`). */
export function EstadoProtocoloBadge({ completo }: { completo: boolean }) {
  return (
    <Badge variant={completo ? 'default' : 'outline'} size="md">
      {completo ? 'Completo' : 'Sin llenar'}
    </Badge>
  );
}

