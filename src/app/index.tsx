import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  CloudDownload,
  CloudUpload,
  FlaskConical,
  LogOut,
  MapPin,
  Phone,
  Search,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { useAuth } from '@/providers/auth-provider';
import {
  obtenerPuntosOffline,
  type RegistroPuntoOffline,
} from '@/db/offline-db';
import {
  descargarYGuardarAgendaOffline,
  sincronizarPuntosPendientes,
} from '@/sync/sync-muestreos';
import { Button } from '@/design-system/ui/button/button';
import { Badge } from '@/design-system/ui/badge/badge';
import { Card } from '@/design-system/ui/card/card';
import { Input } from '@/design-system/ui/input/input';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/design-system/ui/tabs/tabs';
import { CasaColors, CasaRadius } from '@/design-system/tokens';

export interface ProgramacionAgrupada {
  programacion_id: number;
  nombre_entidad: string | null;
  persona_contacto_prog: string;
  celular_contacto_prog: string | null;
  direccion_muestreo_prog: string;
  tipo_analisis_prog: string;
  nombre_recojo: string;
  fecha_prog_punto: string;
  hora_prog_punto: string;
  hora_fin_prog_punto: string | null;
  puntos: RegistroPuntoOffline[];
  totalPuntos: number;
  puntosCompletos: number;
  puntosFinalizados: number;
  tienePendientesSync: boolean;
  esFinalizada: boolean;
}

/**
 * Agenda de Muestreo del Muestreador (C.A.S.A. Móvil).
 * Agrupa los puntos por Programación en cards colapsables tipo acordeón,
 * con solo dos pestañas (Asignados y Finalizados), y una barra de sincronización
 * offline clara e intuitiva.
 */
export default function MuestreosHomeScreen() {
  const router = useRouter();
  const { user, cargando, isOnline, logout } = useAuth();

  const [filas, setFilas] = useState<RegistroPuntoOffline[]>([]);
  const [query, setQuery] = useState('');
  const [tabActiva, setTabActiva] = useState<'asignados' | 'finalizados'>('asignados');
  const [descargando, setDescargando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  const puedeVerTodos = useMemo(
    () => user?.permisos?.includes('programacion.ver-todos') ?? false,
    [user?.permisos]
  );

  const userSub = user?.sub;

  const cargarDesdeSqlite = useCallback(() => {
    if (!userSub) return;
    const lista = obtenerPuntosOffline(puedeVerTodos ? undefined : userSub);
    setFilas(lista);
  }, [userSub, puedeVerTodos]);

  useFocusEffect(
    useCallback(() => {
      cargarDesdeSqlite();
    }, [cargarDesdeSqlite])
  );

  const pendientesSync = useMemo(
    () => filas.filter((f) => f.estado_sync !== 'sincronizado').length,
    [filas]
  );

  const descargarDelServidor = useCallback(
    async (silencioso = false) => {
      if (!user) return;
      if (!isOnline) {
        if (!silencioso) {
          Alert.alert(
            'Modo Offline',
            'No tienes conexión a internet. Mostrando las programaciones guardadas en el dispositivo.'
          );
        }
        return;
      }

      setDescargando(true);
      try {
        const res = await descargarYGuardarAgendaOffline();
        if (!res.success) {
          const msgLower = res.message.toLowerCase();
          if (
            msgLower.includes('token no proporcionado') ||
            msgLower.includes('token inválido') ||
            msgLower.includes('sesión invalidada')
          ) {
            await logout();
            router.replace('/login');
            Alert.alert(
              'Sesión expirada',
              'Por favor vuelve a iniciar sesión para renovar tu credencial de acceso.'
            );
            return;
          }
          if (!silencioso) {
            Alert.alert('Error al actualizar agenda', res.message);
          }
          return;
        }
        cargarDesdeSqlite();
        if (!silencioso) {
          Alert.alert('Agenda Actualizada', res.message);
        }
      } finally {
        setDescargando(false);
      }
    },
    [user, isOnline, cargarDesdeSqlite, logout, router]
  );

  useEffect(() => {
    if (!user || !isOnline) return;
    const locales = obtenerPuntosOffline(puedeVerTodos ? undefined : user.sub);
    if (locales.length === 0) {
      const timer = setTimeout(() => {
        void descargarDelServidor(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOnline, user, puedeVerTodos, descargarDelServidor]);

  const handleSincronizar = async () => {
    if (!isOnline) {
      Alert.alert(
        'Sin conexión',
        'Necesitas conexión a internet para subir tus muestreos al servidor para revisión.'
      );
      return;
    }

    setSincronizando(true);
    try {
      const resultado = await sincronizarPuntosPendientes(
        puedeVerTodos ? undefined : user?.sub
      );
      cargarDesdeSqlite();
      Alert.alert(
        resultado.success ? 'Sincronización exitosa' : 'Resultado de sincronización',
        resultado.message
      );
    } finally {
      setSincronizando(false);
    }
  };

  const handleLogout = () => {
    const salir = async () => {
      await logout();
      router.replace('/login');
    };
    if (pendientesSync > 0) {
      Alert.alert(
        'Cambios sin sincronizar',
        `Tienes ${pendientesSync} punto(s) con cambios locales pendientes de enviar. ¿Deseas cerrar sesión de todos modos? (Los datos permanecerán en el dispositivo).`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cerrar sesión',
            style: 'destructive',
            onPress: salir,
          },
        ]
      );
    } else {
      salir();
    }
  };

  // Agrupación de filas en Programaciones
  const programaciones = useMemo(() => {
    const mapa = new Map<number, RegistroPuntoOffline[]>();
    for (const f of filas) {
      const pid = f.programacion_id || f.punto.info_muestreo.programacion_id;
      const list = mapa.get(pid) ?? [];
      list.push(f);
      mapa.set(pid, list);
    }

    const resultado: ProgramacionAgrupada[] = [];

    for (const [pid, puntos] of mapa.entries()) {
      puntos.sort(
        (a, b) => a.punto.info_protocolo.nro_punto - b.punto.info_protocolo.nro_punto
      );
      const primero = puntos[0].punto.info_muestreo;

      const totalPuntos = puntos.length;
      const puntosCompletos = puntos.filter((p) => p.punto.protocolo.completo).length;
      const puntosFinalizados = puntos.filter((p) => {
        const im = p.punto.info_muestreo;
        return Boolean(im.protocolo_verificado) || im.estado_punto === 'entregado';
      }).length;
      const tienePendientesSync = puntos.some((p) => p.estado_sync !== 'sincronizado');
      const esFinalizada = totalPuntos > 0 && puntosFinalizados === totalPuntos;

      resultado.push({
        programacion_id: pid,
        nombre_entidad: primero.nombre_entidad || null,
        persona_contacto_prog: primero.persona_contacto_prog,
        celular_contacto_prog: primero.celular_contacto_prog || null,
        direccion_muestreo_prog: primero.direccion_muestreo_prog,
        tipo_analisis_prog: primero.tipo_analisis_prog,
        nombre_recojo: primero.nombre_recojo,
        fecha_prog_punto: primero.fecha_prog_punto,
        hora_prog_punto: primero.hora_prog_punto,
        hora_fin_prog_punto: primero.hora_fin_prog_punto || null,
        puntos,
        totalPuntos,
        puntosCompletos,
        puntosFinalizados,
        tienePendientesSync,
        esFinalizada,
      });
    }

    // Ordenar de más reciente a más antigua
    resultado.sort((a, b) => b.programacion_id - a.programacion_id);

    return resultado;
  }, [filas]);

  const conteoAsignados = useMemo(
    () => programaciones.filter((p) => !p.esFinalizada).length,
    [programaciones]
  );

  const conteoFinalizados = useMemo(
    () => programaciones.filter((p) => p.esFinalizada).length,
    [programaciones]
  );

  const programacionesFiltradas = useMemo(() => {
    return programaciones.filter((prog) => {
      if (tabActiva === 'asignados' && prog.esFinalizada) {
        return false;
      }
      if (tabActiva === 'finalizados' && !prog.esFinalizada) {
        return false;
      }

      const texto = query.trim().toLowerCase();
      if (!texto) return true;

      const buscable = [
        prog.nombre_entidad ?? '',
        prog.persona_contacto_prog,
        prog.direccion_muestreo_prog,
        prog.tipo_analisis_prog,
        prog.nombre_recojo,
        `prog #${prog.programacion_id}`,
        `#${prog.programacion_id}`,
        ...prog.puntos.flatMap((p) => [
          p.punto.info_protocolo.nombre_punto,
          p.punto.info_protocolo.nombre_protocolo,
          p.punto.info_protocolo.abreviatura_protocolo,
          `punto ${p.punto.info_protocolo.nro_punto}`,
        ]),
      ]
        .join(' ')
        .toLowerCase();

      return buscable.includes(texto);
    });
  }, [programaciones, tabActiva, query]);

  const isExpanded = useCallback(
    (id: number, index: number, total: number) => {
      if (expandedIds[id] !== undefined) {
        return expandedIds[id];
      }
      // Por defecto expande si hay 2 o menos programaciones, o la primera de la lista
      return index === 0 || total <= 2;
    },
    [expandedIds]
  );

  const toggleProg = useCallback((id: number, currentVal: boolean) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !currentVal,
    }));
  }, []);

  if (!cargando && !user) {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Cabecera Institucional UMSS / C.A.S.A. */}
      <View style={styles.topHeader}>
        <View style={styles.userBlock}>
          <Text style={styles.appTitle}>Agenda de Muestreo</Text>
          <Text style={styles.userSub}>
            {user?.nombre ?? 'Muestreador'} · {user?.roles?.join(', ') || 'Campo'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Badge
            color={isOnline ? 'green' : 'yellow'}
            size="md"
            icon={
              isOnline ? (
                <Wifi size={13} color="#15803d" />
              ) : (
                <WifiOff size={13} color="#92400e" />
              )
            }
          >
            {isOnline ? 'En línea' : 'Modo Offline'}
          </Badge>

          <Button
            variant="destructive"
            size="icon-sm"
            onPress={handleLogout}
            tooltip="Cerrar sesión"
          >
            <LogOut size={16} color={CasaColors.destructiveForeground} />
          </Button>
        </View>
      </View>

      {/* Barra de sincronización y estado offline */}
      <View style={styles.syncContainer}>
        <View
          style={[
            styles.syncStatusBanner,
            pendientesSync > 0
              ? styles.syncStatusBannerPending
              : styles.syncStatusBannerSynced,
          ]}
        >
          {pendientesSync > 0 ? (
            <>
              <AlertCircle size={15} color="#b45309" />
              <Text style={styles.syncStatusTextPending}>
                Hay {pendientesSync} {pendientesSync === 1 ? 'punto listo' : 'puntos listos'} para enviar.
              </Text>
            </>
          ) : (
            <>
              <CheckCircle2 size={15} color="#15803d" />
              <Text style={styles.syncStatusTextSynced}>
                Todo sincronizado · Listo para trabajar sin conexión
              </Text>
            </>
          )}
        </View>

        <View style={styles.syncActionRow}>
          <Button
            variant="outline"
            size="sm"
            loading={descargando}
            onPress={() => descargarDelServidor(false)}
            style={styles.flexBtn}
            tooltip="Actualizar agenda con los muestreos asignados desde el servidor"
          >
            <CloudDownload size={16} color={CasaColors.primary} />
            Actualizar agenda
          </Button>

          <Button
            variant={pendientesSync > 0 ? 'default' : 'secondary'}
            size="sm"
            disabled={pendientesSync === 0}
            loading={sincronizando}
            onPress={handleSincronizar}
            style={styles.flexBtn}
            tooltip="Subir protocolos, muestras y fotografías al servidor para auditoría"
          >
            <CloudUpload
              size={16}
              color={
                pendientesSync > 0
                  ? CasaColors.primaryForeground
                  : CasaColors.secondaryForeground
              }
            />
            {pendientesSync > 0
              ? `Subir cambios (${pendientesSync})`
              : 'Subir cambios'}
          </Button>
        </View>
      </View>

      {/* Pestañas: Asignados y Finalizados */}
      <View style={styles.tabsSection}>
        <Tabs
          value={tabActiva}
          onValueChange={(val) => setTabActiva(val as 'asignados' | 'finalizados')}
        >
          <TabsList style={styles.tabsList}>
            <TabsTrigger value="asignados" style={styles.tabTrigger}>
              Asignados ({conteoAsignados})
            </TabsTrigger>
            <TabsTrigger value="finalizados" style={styles.tabTrigger}>
              Finalizados ({conteoFinalizados})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </View>

      {/* Buscador */}
      <View style={styles.searchSection}>
        <Input
          size="sm"
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por cliente, dirección o protocolo…"
          startIcon={<Search size={16} color={CasaColors.mutedForeground} />}
        />
      </View>

      {/* Lista de Programaciones (Cards desplegables) */}
      <FlatList
        data={programacionesFiltradas}
        keyExtractor={(item) => String(item.programacion_id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={descargando}
            onRefresh={() => descargarDelServidor(false)}
            tintColor={CasaColors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <ClipboardList size={38} color={CasaColors.mutedForeground} />
            <Text style={styles.emptyTitle}>
              {tabActiva === 'asignados'
                ? 'No tienes muestreos asignados pendientes'
                : 'No hay muestreos finalizados todavía'}
            </Text>
            <Text style={styles.emptySub}>
              {tabActiva === 'asignados'
                ? 'Pulsa «Actualizar agenda» con conexión a internet para descargar las órdenes asignadas a tu usuario.'
                : 'Cuando completes tus protocolos y sean auditados y aprobados, aparecerán en esta sección.'}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const prog = item;
          const expanded = isExpanded(
            prog.programacion_id,
            index,
            programacionesFiltradas.length
          );

          return (
            <Card style={styles.progCard}>
              {/* Cabecera interactiva para expandir / colapsar */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => toggleProg(prog.programacion_id, expanded)}
                style={styles.cardHeaderTouchable}
              >
                <View style={styles.headerTopRow}>
                  <View style={styles.badgesLeft}>
                    <Badge color="navy" size="md">
                      {`Prog. #${prog.programacion_id}`}
                    </Badge>
                    {prog.tienePendientesSync && (
                      <Badge color="yellow" size="md">
                        Cambios locales
                      </Badge>
                    )}
                  </View>

                  <View style={styles.headerRightBadge}>
                    {prog.esFinalizada ? (
                      <Badge color="green" size="md">
                        Completada
                      </Badge>
                    ) : (
                      <Badge variant="secondary" size="md">
                        {`${prog.puntosCompletos}/${prog.totalPuntos} listos`}
                      </Badge>
                    )}
                  </View>
                </View>

                {/* Cliente / Entidad */}
                <View style={styles.clientBlock}>
                  <Text style={styles.clientTitle} numberOfLines={1}>
                    {prog.nombre_entidad || prog.persona_contacto_prog}
                  </Text>
                  {Boolean(prog.nombre_entidad) && (
                    <Text style={styles.clientContact} numberOfLines={1}>
                      Contacto: {prog.persona_contacto_prog}
                    </Text>
                  )}
                </View>

                {/* Metadatos (Fecha, Horario, Dirección) */}
                <View style={styles.metaRow}>
                  <Calendar size={13} color={CasaColors.mutedForeground} />
                  <Text style={styles.metaText}>{prog.fecha_prog_punto}</Text>
                  <Clock
                    size={13}
                    color={CasaColors.mutedForeground}
                    style={{ marginLeft: 6 }}
                  />
                  <Text style={styles.metaText}>
                    {prog.hora_prog_punto}
                    {prog.hora_fin_prog_punto ? ` - ${prog.hora_fin_prog_punto}` : ''}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <MapPin size={13} color={CasaColors.mutedForeground} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {prog.direccion_muestreo_prog || 'Sin dirección especificada'}
                  </Text>
                </View>

                {Boolean(prog.celular_contacto_prog) && (
                  <View style={styles.metaRow}>
                    <Phone size={13} color={CasaColors.mutedForeground} />
                    <Text style={styles.metaText}>{prog.celular_contacto_prog}</Text>
                  </View>
                )}

                {/* Barra de despliegue con Chevron */}
                <View style={styles.accordionToggleRow}>
                  <Text style={styles.accordionToggleText}>
                    {prog.totalPuntos === 1
                      ? '1 punto de muestreo'
                      : `${prog.totalPuntos} puntos de muestreo`}
                  </Text>
                  <View style={styles.chevronWrapper}>
                    <Text style={styles.chevronLabel}>
                      {expanded ? 'Ocultar puntos' : 'Ver puntos'}
                    </Text>
                    {expanded ? (
                      <ChevronUp size={16} color={CasaColors.primary} />
                    ) : (
                      <ChevronDown size={16} color={CasaColors.primary} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Puntos desplegados */}
              {expanded && (
                <View style={styles.puntosListContainer}>
                  {prog.puntos.map((puntoItem) => {
                    const { punto, estado_sync } = puntoItem;
                    const im = punto.info_muestreo;
                    const ip = punto.info_protocolo;
                    const numFrascos = punto.muestras.length;
                    const puntoFinalizado =
                      Boolean(im.protocolo_verificado) || im.estado_punto === 'entregado';
                    const protocoloCompleto = punto.protocolo.completo;
                    const pendienteSync = estado_sync !== 'sincronizado';

                    return (
                      <View key={im.punto_id} style={styles.puntoRowCard}>
                        <View style={styles.puntoRowHeader}>
                          <View style={styles.puntoTitleWrapper}>
                            <Text style={styles.puntoNro}>#{ip.nro_punto}</Text>
                            <Text style={styles.puntoName} numberOfLines={1}>
                              {ip.nombre_punto}
                            </Text>
                          </View>

                          {puntoFinalizado ? (
                            <Badge color="green" size="sm">
                              Aprobado
                            </Badge>
                          ) : protocoloCompleto ? (
                            <Badge color="blue" size="sm">
                              Completo
                            </Badge>
                          ) : (
                            <Badge variant="outline" size="sm">
                              Pendiente
                            </Badge>
                          )}
                        </View>

                        <View style={styles.puntoRowMeta}>
                          <Text style={styles.protocoloSub} numberOfLines={1}>
                            {ip.nombre_protocolo} ({ip.abreviatura_protocolo})
                          </Text>
                          <Text style={styles.frascosSub}>
                            {numFrascos === 0
                              ? 'Sin frascos'
                              : `${numFrascos} ${numFrascos === 1 ? 'frasco' : 'frascos'}`}
                            {pendienteSync ? ' · Pendiente sync' : ''}
                          </Text>
                        </View>

                        {/* Botones directos de Protocolo y Muestras */}
                        <View style={styles.puntoActionsRow}>
                          <Button
                            variant="outline"
                            size="sm"
                            style={styles.puntoBtn}
                            onPress={() =>
                              router.push({
                                pathname: '/punto/[puntoId]',
                                params: {
                                  puntoId: String(im.punto_id),
                                  tab: 'protocolo',
                                },
                              })
                            }
                            tooltip="Llenar o revisar protocolo de campo"
                          >
                            <ClipboardList size={14} color={CasaColors.primary} />
                            Protocolo
                          </Button>

                          <Button
                            variant="default"
                            size="sm"
                            style={styles.puntoBtn}
                            onPress={() =>
                              router.push({
                                pathname: '/punto/[puntoId]',
                                params: {
                                  puntoId: String(im.punto_id),
                                  tab: 'muestras',
                                },
                              })
                            }
                            tooltip="Gestionar muestras y frascos del punto"
                          >
                            <FlaskConical
                              size={14}
                              color={CasaColors.primaryForeground}
                            />
                            Muestras
                          </Button>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CasaColors.background,
  },
  topHeader: {
    backgroundColor: CasaColors.authBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  userBlock: {
    flex: 1,
  },
  appTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: CasaColors.primaryForeground,
    letterSpacing: -0.3,
  },
  userSub: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncContainer: {
    backgroundColor: CasaColors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CasaColors.tableDivider,
    gap: 8,
  },
  syncStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: CasaRadius.md,
    borderWidth: 1,
  },
  syncStatusBannerPending: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  syncStatusBannerSynced: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  syncStatusTextPending: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    flexShrink: 1,
  },
  syncStatusTextSynced: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
    flexShrink: 1,
  },
  syncActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flexBtn: {
    flex: 1,
  },
  tabsSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  tabsList: {
    backgroundColor: CasaColors.secondary,
  },
  tabTrigger: {
    paddingVertical: 8,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: CasaColors.primary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12.5,
    color: CasaColors.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
  },
  progCard: {
    marginBottom: 4,
    padding: 0,
    overflow: 'hidden',
  },
  cardHeaderTouchable: {
    padding: 14,
    gap: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  badgesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientBlock: {
    gap: 2,
    marginTop: 2,
  },
  clientTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CasaColors.primary,
    letterSpacing: -0.2,
  },
  clientContact: {
    fontSize: 12,
    color: CasaColors.mutedForeground,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12.5,
    color: CasaColors.foreground,
    flexShrink: 1,
  },
  accordionToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: CasaColors.tableDivider,
  },
  accordionToggleText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: CasaColors.primary,
  },
  chevronWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chevronLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: CasaColors.primary,
  },
  puntosListContainer: {
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: CasaColors.tableDivider,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  puntoRowCard: {
    backgroundColor: CasaColors.card,
    borderRadius: CasaRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: CasaColors.inputBorder,
    gap: 6,
  },
  puntoRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  puntoTitleWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  puntoNro: {
    fontSize: 13,
    fontWeight: '700',
    color: CasaColors.primary,
  },
  puntoName: {
    fontSize: 14,
    fontWeight: '600',
    color: CasaColors.foreground,
    flexShrink: 1,
  },
  puntoRowMeta: {
    gap: 2,
  },
  protocoloSub: {
    fontSize: 12,
    color: CasaColors.mutedForeground,
  },
  frascosSub: {
    fontSize: 11.5,
    color: CasaColors.mutedForeground,
  },
  puntoActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  puntoBtn: {
    flex: 1,
  },
});
