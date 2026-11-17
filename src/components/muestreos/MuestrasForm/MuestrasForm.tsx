import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { FlaskConical, Pencil, Plus, Trash2 } from 'lucide-react-native';
import {
  ensayosDelPunto,
  etiquetaEnsayo,
  frascoVacio,
  mapaEnsayos,
  nombreFrasco,
  type Muestra,
  type Punto,
} from '@/schemas/muestreos/muestreos.schema';
import {
  guardarPuntoLocal,
  obtenerCatalogosOffline,
} from '@/db/offline-db';
import { Button } from '@/design-system/ui/button/button';
import { Badge } from '@/design-system/ui/badge/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/design-system/ui/card/card';
import { H1 } from '@/design-system/ui/typography/typography';
import { CasaColors, CasaRadius } from '@/design-system/tokens';
import { FrascoDialog, type PreservanteCatalogo } from './FrascoDialog';

interface Props {
  punto: Punto;
  onActualizado: (punto: Punto) => void;
}

/**
 * Formulario de muestras del punto (`casa_fe/components/muestreos/MuestrasForm/MuestrasForm.tsx`),
 * usando los mismos componentes `@/design-system/ui/*` (`Card`, `Badge` size="md", `Button`, `H1`).
 */
export function MuestrasForm({ punto, onActualizado }: Props) {
  const [frascos, setFrascos] = useState<Muestra[]>(punto.muestras);
  const [preservantes, setPreservantes] = useState<PreservanteCatalogo[]>([]);
  const [editando, setEditando] = useState<{
    frasco: Muestra;
    esNuevo: boolean;
  } | null>(null);

  useEffect(() => {
    setFrascos(punto.muestras);
  }, [punto]);

  useEffect(() => {
    const cache = obtenerCatalogosOffline();
    if (cache?.catalogos?.preservantes) {
      setPreservantes(cache.catalogos.preservantes);
    }
  }, []);

  const disponibles = useMemo(
    () => ensayosDelPunto(punto.info_protocolo.paquetes),
    [punto.info_protocolo.paquetes]
  );

  const nombresEnsayo = useMemo(
    () => mapaEnsayos(punto.info_protocolo.paquetes),
    [punto.info_protocolo.paquetes]
  );

  const asignados = useMemo(
    () => new Set(frascos.flatMap((f) => f.ensayos.map((e) => e.ensayo_id))),
    [frascos]
  );

  const pendientes = disponibles.filter((e) => !asignados.has(e.ensayo_id));

  const abrirNuevo = () => {
    const siguiente =
      frascos.reduce((max, f) => Math.max(max, f.numero_frasco), 0) + 1;
    setEditando({ frasco: frascoVacio(siguiente), esNuevo: true });
  };

  const guardarFrascoLocal = (frasco: Muestra) => {
    const esNuevo = editando?.esNuevo ?? false;
    const nuevosFrascos = esNuevo
      ? [...frascos, frasco]
      : frascos.map((f) =>
          f.numero_frasco === editando?.frasco.numero_frasco ? frasco : f
        );

    const reg = guardarPuntoLocal(
      punto.info_muestreo.punto_id,
      { muestras: nuevosFrascos },
      punto.protocolo.completo ? 'listo_para_enviar' : 'borrador_local'
    );

    const puntoActualizado: Punto = reg?.punto ?? {
      ...punto,
      muestras: nuevosFrascos,
    };

    setFrascos(nuevosFrascos);
    setEditando(null);
    onActualizado(puntoActualizado);
  };

  const quitarFrascoLocal = (numeroFrasco: number) => {
    Alert.alert(
      'Eliminar frasco',
      `¿Estás seguro de eliminar el Frasco #${numeroFrasco}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const nuevosFrascos = frascos.filter(
              (f) => f.numero_frasco !== numeroFrasco
            );
            const reg = guardarPuntoLocal(
              punto.info_muestreo.punto_id,
              { muestras: nuevosFrascos },
              punto.protocolo.completo ? 'listo_para_enviar' : 'borrador_local'
            );
            const puntoActualizado: Punto = reg?.punto ?? {
              ...punto,
              muestras: nuevosFrascos,
            };
            setFrascos(nuevosFrascos);
            onActualizado(puntoActualizado);
          },
        },
      ]
    );
  };

  const elegibles = editando
    ? disponibles.filter(
        (e) =>
          !asignados.has(e.ensayo_id) ||
          editando.frasco.ensayos.some((x) => x.ensayo_id === e.ensayo_id)
      )
    : [];

  const numerosUsados = editando
    ? frascos
        .filter(
          (f) =>
            editando.esNuevo || f.numero_frasco !== editando.frasco.numero_frasco
        )
        .map((f) => f.numero_frasco)
    : [];

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.pageTitleBlock}>
          <H1>Muestras del punto</H1>
          <Text style={styles.pageSubtitle}>
            {punto.info_protocolo.nombre_punto} · cada muestra es un frasco.
          </Text>
        </View>

        {/* Tarjeta de ensayos por repartir */}
        <Card>
          <CardHeader style={styles.rowBetween}>
            <View style={styles.flex1}>
              <CardTitle>Ensayos por repartir ({disponibles.length})</CardTitle>
              <CardDescription>
                Cada ensayo se reparte entre los frascos del punto.
              </CardDescription>
            </View>
            <Badge
              color={pendientes.length === 0 ? 'green' : 'yellow'}
              size="md"
            >
              {pendientes.length === 0
                ? 'Todos asignados'
                : `${pendientes.length} pendientes`}
            </Badge>
          </CardHeader>

          <CardContent>
            {disponibles.length === 0 ? (
              <Text style={styles.mutedText}>
                Este punto no tiene ensayos cargados en la programación.
              </Text>
            ) : (
              <View style={styles.chipsWrap}>
                {disponibles.map((ensayo) => {
                  const listo = asignados.has(ensayo.ensayo_id);
                  const frascoAsignado = frascos.find((f) =>
                    f.ensayos.some((e) => e.ensayo_id === ensayo.ensayo_id)
                  );
                  return (
                    <Badge
                      key={ensayo.ensayo_id}
                      color={listo ? 'green' : 'yellow'}
                      size="md"
                    >
                      {`${ensayo.abreviatura_ensayo || etiquetaEnsayo(ensayo)}${
                        frascoAsignado ? ` (#${frascoAsignado.numero_frasco})` : ''
                      }`}
                    </Badge>
                  );
                })}
              </View>
            )}
          </CardContent>
        </Card>

        {/* Lista de frascos con borde de tabla estandarizado */}
        <Card>
          <CardHeader>
            <View style={styles.frascosTitleRow}>
              <CardTitle>Frascos ({frascos.length})</CardTitle>
              <Button
                variant="default"
                size="sm"
                onPress={abrirNuevo}
                tooltip="Agregar un nuevo frasco a este punto"
              >
                <Plus size={15} color={CasaColors.primaryForeground} />
                Agregar frasco
              </Button>
            </View>
            <CardDescription>
              Al agregar o editar un frasco se guarda automáticamente en el dispositivo.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {frascos.length === 0 ? (
              <View style={styles.emptyBox}>
                <FlaskConical size={28} color={CasaColors.mutedForeground} />
                <Text style={styles.emptyTitle}>
                  Todavía no cargaste ningún frasco.
                </Text>
              </View>
            ) : (
              <View style={styles.tableContainer}>
                {frascos.map((f, idx) => (
                  <View
                    key={f.numero_frasco}
                    style={[
                      styles.frascoRow,
                      idx < frascos.length - 1 && styles.frascoRowDivider,
                    ]}
                  >
                    <View style={styles.frascoTop}>
                      <View style={styles.frascoInfoLeft}>
                        <Text style={styles.frascoNum}>
                          Frasco #{f.numero_frasco}
                        </Text>
                        <Text style={styles.frascoTipo}>
                          {nombreFrasco(f.tipo_frasco_muestra)}
                        </Text>
                      </View>

                      <View style={styles.frascoAmountRight}>
                        <Text style={styles.frascoVolumen}>
                          {f.volumen_muestra} ml
                        </Text>
                      </View>

                      <View style={styles.frascoActionsCenter}>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onPress={() => setEditando({ frasco: f, esNuevo: false })}
                          tooltip="Editar frasco"
                        >
                          <Pencil size={15} color={CasaColors.primary} />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onPress={() => quitarFrascoLocal(f.numero_frasco)}
                          tooltip="Eliminar frasco"
                        >
                          <Trash2 size={15} color={CasaColors.destructiveForeground} />
                        </Button>
                      </View>
                    </View>

                    <View style={styles.detailGroup}>
                      <Text style={styles.detailLabel}>Preservantes:</Text>
                      {f.preservantes.length === 0 ? (
                        <Text style={styles.mutedText}>Sin preservante</Text>
                      ) : (
                        <View style={styles.tagsWrap}>
                          {f.preservantes.map((p) => (
                            <Badge
                              key={p.preservante_id}
                              variant="secondary"
                              size="md"
                            >
                              {preservantes.find(
                                (c) => c.preservante_id === p.preservante_id
                              )?.nombre_preservante ?? `#${p.preservante_id}`}
                            </Badge>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={styles.detailGroup}>
                      <Text style={styles.detailLabel}>
                        Ensayos ({f.ensayos.length}):
                      </Text>
                      <View style={styles.tagsWrap}>
                        {f.ensayos.map(({ ensayo_id }) => {
                          const e = nombresEnsayo.get(ensayo_id);
                          return (
                            <Badge
                              key={ensayo_id}
                              color="cyan"
                              size="md"
                            >
                              {e ? etiquetaEnsayo(e) : `Ensayo #${ensayo_id}`}
                            </Badge>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </ScrollView>

      {editando && (
        <FrascoDialog
          open
          onOpenChange={(abierto) => !abierto && setEditando(null)}
          frasco={editando.frasco}
          ensayosElegibles={elegibles}
          preservantes={preservantes}
          numerosUsados={numerosUsados}
          onGuardar={guardarFrascoLocal}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: CasaColors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  pageTitleBlock: {
    gap: 4,
  },
  pageSubtitle: {
    fontSize: 13.5,
    color: CasaColors.mutedForeground,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  frascosTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mutedText: {
    fontSize: 13,
    color: CasaColors.mutedForeground,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: CasaColors.foreground,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: CasaColors.tableDivider,
    borderRadius: CasaRadius.lg,
    overflow: 'hidden',
    backgroundColor: CasaColors.card,
  },
  frascoRow: {
    padding: 14,
    gap: 10,
  },
  frascoRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: CasaColors.tableDivider,
  },
  frascoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  frascoInfoLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  frascoNum: {
    fontSize: 15,
    fontWeight: '700',
    color: CasaColors.primary,
  },
  frascoTipo: {
    fontSize: 13,
    color: CasaColors.foreground,
    marginTop: 2,
  },
  frascoAmountRight: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  frascoVolumen: {
    fontSize: 14,
    fontWeight: '700',
    color: CasaColors.foreground,
  },
  frascoActionsCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detailGroup: {
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: CasaColors.mutedForeground,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
