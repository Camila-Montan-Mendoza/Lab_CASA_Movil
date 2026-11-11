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
  Calendar,
  ClipboardList,
  Clock,
  CloudDownload,
  CloudUpload,
  FlaskConical,
  LogOut,
  MapPin,
  Phone,
  Search,
  User,
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
import { ESTADOS_PUNTO } from '@/schemas/muestreos/muestreos.schema';
import { Button } from '@/design-system/ui/button/button';
import { Badge } from '@/design-system/ui/badge/badge';
import { Card } from '@/design-system/ui/card/card';
import { Input } from '@/design-system/ui/input/input';
import {
  EstadoProtocoloBadge,
  EstadoPuntoBadge,
} from '@/components/muestreos/EstadoPuntoBadge';
import { CasaColors, CasaRadius } from '@/design-system/tokens';

const TODOS = 'todos';

/**
 * Agenda de Muestreos del Muestreador (`casa_fe/components/muestreos/MuestreoList/MuestreoList.tsx`
 * y `MuestreoDetail.tsx`), usando los componentes y tokens del Sistema de Diseño C.A.S.A.
 */
export default function MuestreosHomeScreen() {
  const router = useRouter();
  const { user, cargando, isOnline, logout } = useAuth();

  const [filas, setFilas] = useState<RegistroPuntoOffline[]>([]);
  const [query, setQuery] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>(TODOS);
  const [descargando, setDescargando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  const puedeVerTodos = useMemo(
    () => user?.permisos?.includes('programacion.ver-todos') ?? false,
    [user?.permisos]
  );

  const cargarDesdeSqlite = useCallback(() => {
    if (!user?.sub) return;
    const lista = obtenerPuntosOffline(puedeVerTodos ? undefined : user.sub);
    setFilas(lista);
  }, [user?.sub, puedeVerTodos]);

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
            'No tienes conexión a internet. Mostrando los puntos guardados en el dispositivo.'
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
            Alert.alert('Error al descargar', res.message);
          }
          return;
        }
        cargarDesdeSqlite();
        if (!silencioso) {
          Alert.alert('Paquete Offline Actualizado', res.message);
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
      descargarDelServidor(true);
    }
  }, [isOnline, user, puedeVerTodos, descargarDelServidor]);

  const handleSincronizar = async () => {
    if (!isOnline) {
      Alert.alert(
        'Sin conexión',
        'Necesitas conexión a internet para enviar tus muestreos al servidor para revisión.'
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

  const filtrados = useMemo(() => {
    return filas.filter((item) => {
      const p = item.punto;
      if (estadoFiltro !== TODOS && p.info_muestreo.estado_punto !== estadoFiltro) {
        return false;
      }
      const texto = query.trim().toLowerCase();
      if (!texto) return true;
      const buscable = [
        p.info_protocolo.nombre_punto,
        p.info_protocolo.nombre_protocolo,
        p.info_protocolo.abreviatura_protocolo,
        p.info_muestreo.persona_contacto_prog,
        p.info_muestreo.direccion_muestreo_prog,
        p.info_muestreo.tipo_analisis_prog,
        p.info_muestreo.nombre_recojo,
        `#${p.info_protocolo.nro_punto}`,
      ]
        .join(' ')
        .toLowerCase();
      return buscable.includes(texto);
    });
  }, [filas, query, estadoFiltro]);

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

      {/* Barra de sincronización y descarga offline */}
      <View style={styles.syncToolbar}>
        <Button
          variant="outline"
          size="sm"
          loading={descargando}
          onPress={() => descargarDelServidor(false)}
          style={styles.flexBtn}
          tooltip="Descargar puntos asignados y catálogos para trabajar sin internet"
        >
          <CloudDownload size={16} color={CasaColors.primary} />
          Descargar paquete
        </Button>

        <Button
          variant={pendientesSync > 0 ? 'default' : 'secondary'}
          size="sm"
          disabled={pendientesSync === 0}
          loading={sincronizando}
          onPress={handleSincronizar}
          style={styles.flexBtn}
          tooltip="Subir protocolos, muestras y fotografías pendientes al servidor"
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
            ? `Sincronizar (${pendientesSync})`
            : 'Todo sincronizado'}
        </Button>
      </View>

      {/* Buscador y filtros por estado (como en MuestreoList.tsx de casa_fe) */}
      <View style={styles.filterSection}>
        <Input
          size="sm"
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por punto, contacto, dirección o protocolo…"
          startIcon={<Search size={16} color={CasaColors.mutedForeground} />}
        />

        <View style={styles.filterChipsRow}>
          {[TODOS, ...ESTADOS_PUNTO].map((est) => {
            const activo = estadoFiltro === est;
            return (
              <TouchableOpacity
                key={est}
                onPress={() => setEstadoFiltro(est)}
                style={[styles.filterChip, activo && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activo && styles.filterChipTextActive,
                  ]}
                >
                  {est === TODOS ? 'Todos' : est}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Lista de Puntos de Muestreo */}
      <FlatList
        data={filtrados}
        keyExtractor={(item) => String(item.punto_id)}
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
            <Text style={styles.emptyTitle}>No hay puntos de muestreo</Text>
            <Text style={styles.emptySub}>
              Pulsa «Descargar paquete» cuando tengas internet para guardar tus puntos asignados en el teléfono.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const { punto, estado_sync } = item;
          const im = punto.info_muestreo;
          const ip = punto.info_protocolo;
          const numFrascos = punto.muestras.length;
          const pendiente = estado_sync !== 'sincronizado';

          return (
            <Card style={styles.puntoCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.badgesLeft}>
                  <Badge color="navy" size="md">
                    {`#${ip.nro_punto}`}
                  </Badge>
                  <Badge color="cyan" size="md">
                    {ip.abreviatura_protocolo}
                  </Badge>
                  <EstadoPuntoBadge estado={im.estado_punto} />
                </View>

                {pendiente ? (
                  <Badge color="yellow" size="md">
                    Pendiente sync
                  </Badge>
                ) : (
                  <Badge color="green" size="md">
                    Sincronizado
                  </Badge>
                )}
              </View>

              <View style={styles.titleBlock}>
                <Text style={styles.puntoTitle}>{ip.nombre_punto}</Text>
                <Text style={styles.protocoloName}>
                  {ip.nombre_protocolo} · Prog. #{im.programacion_id} ({im.nombre_recojo})
                </Text>
              </View>

              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Calendar size={14} color={CasaColors.mutedForeground} />
                  <Text style={styles.metaText}>{im.fecha_prog_punto}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Clock size={14} color={CasaColors.mutedForeground} />
                  <Text style={styles.metaText}>
                    {im.hora_prog_punto}
                    {im.hora_fin_prog_punto ? ` - ${im.hora_fin_prog_punto}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRowFull}>
                <MapPin size={14} color={CasaColors.mutedForeground} />
                <Text style={styles.metaText} numberOfLines={2}>
                  {im.direccion_muestreo_prog || 'Sin dirección especificada'}
                </Text>
              </View>

              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <User size={14} color={CasaColors.mutedForeground} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {im.persona_contacto_prog}
                  </Text>
                </View>
                {Boolean(im.celular_contacto_prog) && (
                  <View style={styles.metaItem}>
                    <Phone size={14} color={CasaColors.mutedForeground} />
                    <Text style={styles.metaText}>{im.celular_contacto_prog}</Text>
                  </View>
                )}
              </View>

              {/* Resumen de avance y botones explícitos (Regla 6 de AGENTS.md / design.md) */}
              <View style={styles.cardFooter}>
                <View style={styles.statusSummary}>
                  <EstadoProtocoloBadge completo={punto.protocolo.completo} />
                  <Badge variant="secondary" size="md">
                    {numFrascos === 0
                      ? 'Sin frascos'
                      : `${numFrascos} ${numFrascos === 1 ? 'frasco' : 'frascos'}`}
                  </Badge>
                </View>

                <View style={styles.actionBtnsRow}>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() =>
                      router.push({
                        pathname: '/punto/[puntoId]',
                        params: {
                          puntoId: String(im.punto_id),
                          tab: 'protocolo',
                        },
                      })
                    }
                    tooltip="Llenar protocolo de campo"
                  >
                    <ClipboardList size={15} color={CasaColors.primary} />
                    Protocolo
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
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
                    <FlaskConical size={15} color={CasaColors.primaryForeground} />
                    Muestras
                  </Button>
                </View>
              </View>
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
  syncToolbar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: CasaColors.card,
    borderBottomWidth: 1,
    borderBottomColor: CasaColors.tableDivider,
  },
  flexBtn: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: CasaRadius.full,
    backgroundColor: CasaColors.card,
    borderWidth: 1,
    borderColor: CasaColors.inputBorder,
  },
  filterChipActive: {
    backgroundColor: CasaColors.primary,
    borderColor: CasaColors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: CasaColors.foreground,
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: CasaColors.primaryForeground,
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
    fontSize: 16,
    fontWeight: '700',
    color: CasaColors.primary,
  },
  emptySub: {
    fontSize: 13,
    color: CasaColors.mutedForeground,
    textAlign: 'center',
    lineHeight: 19,
  },
  puntoCard: {
    marginBottom: 4,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  titleBlock: {
    gap: 2,
  },
  puntoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CasaColors.primary,
  },
  protocoloName: {
    fontSize: 12.5,
    color: CasaColors.mutedForeground,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaRowFull: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: CasaColors.foreground,
    flexShrink: 1,
  },
  cardFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: CasaColors.tableDivider,
    gap: 10,
  },
  statusSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtnsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
