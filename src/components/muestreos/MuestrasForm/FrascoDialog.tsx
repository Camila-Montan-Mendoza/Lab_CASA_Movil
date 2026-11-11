import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';
import {
  FrascoCompletoSchema,
  TIPOS_FRASCO,
  erroresPorCampo,
  etiquetaEnsayo,
  type Catalogos,
  type EnsayoRequerido,
  type Muestra,
} from '@/schemas/muestreos/muestreos.schema';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/design-system/ui/dialog/dialog';
import { H1 } from '@/design-system/ui/typography/typography';
import { Button } from '@/design-system/ui/button/button';
import { Input } from '@/design-system/ui/input/input';
import { Label } from '@/design-system/ui/label/label';
import { RadioGroup, RadioGroupItem } from '@/design-system/ui/radio-group/radio-group';
import { Switch } from '@/design-system/ui/switch/switch';
import { Checkbox } from '@/design-system/ui/checkbox/checkbox';
import { CasaColors, CasaRadius } from '@/design-system/tokens';

export type PreservanteCatalogo = Catalogos['preservantes'][number];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frasco: Muestra;
  ensayosElegibles: EnsayoRequerido[];
  preservantes: PreservanteCatalogo[];
  numerosUsados: number[];
  onGuardar: (frasco: Muestra) => void;
}

/**
 * Diálogo de edición/creación de frasco (`casa_fe/components/muestreos/MuestrasForm/FrascoDialog.tsx`).
 * Cumple todas las reglas de `AGENTS.md` y `design.md`:
 * - Regla 1: `<H1>` directamente dentro de `DialogHeader` (sin `DialogTitle`).
 * - Regla 4: Botón "Cancelar" con `variant="destructive"`.
 * - Regla 5: `<Checkbox />` con `--checkbox-border`.
 * - Regla 7: `<Input />` con `--input-border`.
 */
export function FrascoDialog({
  open,
  onOpenChange,
  frasco,
  ensayosElegibles,
  preservantes,
  numerosUsados,
  onGuardar,
}: Props) {
  const [borrador, setBorrador] = useState<Muestra>(frasco);
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    setBorrador(frasco);
    setErrores({});
  }, [frasco, open]);

  const alternarEnsayo = (ensayo_id: number) =>
    setBorrador((f) => ({
      ...f,
      ensayos: f.ensayos.some((e) => e.ensayo_id === ensayo_id)
        ? f.ensayos.filter((e) => e.ensayo_id !== ensayo_id)
        : [...f.ensayos, { ensayo_id }],
    }));

  const alternarTodosEnsayos = () => {
    const todosIds = ensayosElegibles.map((e) => e.ensayo_id);
    const todosSeleccionados =
      todosIds.length > 0 &&
      todosIds.every((id) => borrador.ensayos.some((e) => e.ensayo_id === id));
    setBorrador((f) => ({
      ...f,
      ensayos: todosSeleccionados ? [] : todosIds.map((id) => ({ ensayo_id: id })),
    }));
  };

  const alternarPreservante = (preservante_id: number) =>
    setBorrador((f) => ({
      ...f,
      preservantes: f.preservantes.some((p) => p.preservante_id === preservante_id)
        ? f.preservantes.filter((p) => p.preservante_id !== preservante_id)
        : [...f.preservantes, { preservante_id }],
    }));

  const validar = (): boolean => {
    const parsed = FrascoCompletoSchema.safeParse(borrador);
    const nuevos = parsed.success ? {} : erroresPorCampo(parsed.error);

    if (numerosUsados.includes(borrador.numero_frasco)) {
      nuevos.numero_frasco = 'Ya hay otro frasco con ese número';
    }
    if (borrador.preservante_frasco_muestra && borrador.preservantes.length === 0) {
      nuevos.preservantes = 'Indicá qué preservante lleva';
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const guardar = () => {
    if (!validar()) return;
    onGuardar(borrador);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <H1>Frasco #{borrador.numero_frasco}</H1>
          <TouchableOpacity onPress={() => onOpenChange(false)} style={styles.closeBtn}>
            <X size={20} color={CasaColors.mutedForeground} />
          </TouchableOpacity>
        </DialogHeader>

        <DialogBody>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Label>Número de frasco</Label>
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>Frasco #{borrador.numero_frasco}</Text>
              </View>
              <Text style={styles.hintText}>Secuencial automático</Text>
            </View>

            <View style={styles.col}>
              <Label required>Volumen (ml)</Label>
              <Input
                keyboardType="numeric"
                value={borrador.volumen_muestra ? String(borrador.volumen_muestra) : ''}
                placeholder="Ej. 500"
                onChangeText={(raw) => {
                  const num = Number(raw.replace(/[^0-9]/g, ''));
                  setBorrador((f) => ({
                    ...f,
                    volumen_muestra: Number.isNaN(num) ? 0 : num,
                  }));
                }}
                invalid={Boolean(errores.volumen_muestra)}
              />
              {errores.volumen_muestra ? (
                <Text style={styles.errorText}>{errores.volumen_muestra}</Text>
              ) : null}
            </View>
          </View>

          <View>
            <Label required>Tipo de frasco</Label>
            <RadioGroup
              value={borrador.tipo_frasco_muestra}
              onValueChange={(v) =>
                setBorrador((f) => ({ ...f, tipo_frasco_muestra: v }))
              }
            >
              {TIPOS_FRASCO.map((tf) => (
                <RadioGroupItem
                  key={tf.codigo}
                  value={tf.codigo}
                  label={tf.nombre}
                  style={styles.fullWidthRadio}
                />
              ))}
            </RadioGroup>
            {errores.tipo_frasco_muestra ? (
              <Text style={styles.errorText}>{errores.tipo_frasco_muestra}</Text>
            ) : null}
          </View>

          <View
            style={[
              styles.preservanteCard,
              borrador.preservante_frasco_muestra && styles.preservanteCardActive,
            ]}
          >
            <View style={styles.switchRow}>
              <Label style={styles.noMarginLabel}>¿El frasco tiene preservante?</Label>
              <Switch
                checked={borrador.preservante_frasco_muestra}
                onCheckedChange={(v) =>
                  setBorrador((f) => ({
                    ...f,
                    preservante_frasco_muestra: v,
                    preservantes: v ? f.preservantes : [],
                  }))
                }
              />
            </View>

            {borrador.preservante_frasco_muestra && (
              <View style={styles.preservantesList}>
                <Text style={styles.hintText}>
                  Selecciona los preservantes que llevará el frasco:
                </Text>
                {preservantes.map((p) => (
                  <Checkbox
                    key={p.preservante_id}
                    checked={borrador.preservantes.some(
                      (x) => x.preservante_id === p.preservante_id
                    )}
                    onCheckedChange={() => alternarPreservante(p.preservante_id)}
                    label={p.nombre_preservante}
                  />
                ))}
                {errores.preservantes ? (
                  <Text style={styles.errorText}>{errores.preservantes}</Text>
                ) : null}
              </View>
            )}
          </View>

          <View>
            <View style={styles.ensayosHeader}>
              <Label required style={styles.noMarginLabel}>
                Ensayos de este frasco ({borrador.ensayos.length})
              </Label>
              {ensayosElegibles.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={alternarTodosEnsayos}
                  tooltip="Seleccionar o deseleccionar todos los ensayos disponibles"
                >
                  {borrador.ensayos.length === ensayosElegibles.length
                    ? 'Deseleccionar todos'
                    : 'Seleccionar todos'}
                </Button>
              )}
            </View>

            {ensayosElegibles.length === 0 ? (
              <Text style={styles.hintText}>
                No hay ensayos libres para asignar a este frasco.
              </Text>
            ) : (
              <View style={styles.checkList}>
                {ensayosElegibles.map((e) => (
                  <Checkbox
                    key={e.ensayo_id}
                    checked={borrador.ensayos.some((x) => x.ensayo_id === e.ensayo_id)}
                    onCheckedChange={() => alternarEnsayo(e.ensayo_id)}
                    label={`${
                      e.abreviatura_ensayo ? `[${e.abreviatura_ensayo}] ` : ''
                    }${etiquetaEnsayo(e)}`}
                  />
                ))}
              </View>
            )}

            {errores.ensayos ? (
              <Text style={styles.errorText}>{errores.ensayos}</Text>
            ) : null}
          </View>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="destructive"
            onPress={() => onOpenChange(false)}
            tooltip="Cancelar y descartar cambios del frasco"
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            onPress={guardar}
            tooltip="Guardar configuración del frasco"
          >
            Guardar frasco
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  closeBtn: {
    padding: 4,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  readOnlyBox: {
    minHeight: 42,
    borderRadius: CasaRadius.lg,
    borderWidth: 1,
    borderColor: CasaColors.tableDivider,
    backgroundColor: CasaColors.muted,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 14,
    fontWeight: '700',
    color: CasaColors.foreground,
  },
  hintText: {
    marginTop: 4,
    fontSize: 12,
    color: CasaColors.mutedForeground,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: CasaColors.destructive,
  },
  fullWidthRadio: {
    width: '100%',
  },
  preservanteCard: {
    borderWidth: 1,
    borderColor: CasaColors.tableDivider,
    borderRadius: CasaRadius.xl,
    padding: 14,
    backgroundColor: CasaColors.card,
  },
  preservanteCardActive: {
    borderColor: CasaColors.primarySoftBorder,
    backgroundColor: CasaColors.primarySoftBg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noMarginLabel: {
    marginBottom: 0,
  },
  preservantesList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: CasaColors.tableDivider,
    gap: 8,
  },
  ensayosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  checkList: {
    gap: 8,
  },
});
