import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ClipboardList,
  FlaskConical,
} from 'lucide-react-native';
import { obtenerPuntoOffline } from '@/db/offline-db';
import type { Punto } from '@/schemas/muestreos/muestreos.schema';
import { ProtocoloForm } from '@/components/muestreos/ProtocoloForm/ProtocoloForm';
import { MuestrasForm } from '@/components/muestreos/MuestrasForm/MuestrasForm';
import { Button } from '@/design-system/ui/button/button';
import { Badge } from '@/design-system/ui/badge/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/design-system/ui/tabs/tabs';
import { CasaColors } from '@/design-system/tokens';

/**
 * Pantalla de detalle de punto con pestañas `Protocolo` y `Muestras`,
 * usando `@/design-system/ui/tabs/tabs`, `Button`, `Badge` y `CasaColors`.
 */
export default function PuntoDetalleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ puntoId: string; tab?: string }>();
  const puntoId = Number(params.puntoId);

  const [punto, setPunto] = useState<Punto | null>(null);
  const [pendienteSync, setPendienteSync] = useState(false);
  const [tab, setTab] = useState<string>(
    params.tab === 'muestras' ? 'muestras' : 'protocolo'
  );

  // Con el teclado abierto este cubre la barra de navegación del sistema, así que
  // solo se reserva el margen inferior (botones de atrás/inicio) cuando está oculto.
  const [tecladoVisible, setTecladoVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setTecladoVisible(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setTecladoVisible(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const cargar = useCallback(() => {
    if (!Number.isFinite(puntoId)) return;
    const row = obtenerPuntoOffline(puntoId);
    if (row) {
      setPunto(row.punto);
      setPendienteSync(row.estado_sync !== 'sincronizado');
    }
  }, [puntoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!punto) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
            tooltip="Volver a la agenda de muestreos"
          >
            <ArrowLeft size={18} color={CasaColors.primaryForeground} />
            Volver
          </Button>
        </View>
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>Cargando punto de muestreo…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={tecladoVisible ? ['top'] : ['top', 'bottom']}
    >
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
      {/* Cabecera del punto estandarizada con --sidebar (#001B47) */}
      <View style={styles.topBar}>
        <Button
          variant="ghost"
          size="icon-sm"
          onPress={() => router.back()}
          tooltip="Volver a la agenda de muestreos"
        >
          <ArrowLeft size={20} color={CasaColors.primaryForeground} />
        </Button>

        <View style={styles.titleBlock}>
          <Text style={styles.puntoHeaderTitle} numberOfLines={1}>
            #{punto.info_protocolo.nro_punto} · {punto.info_protocolo.nombre_punto}
          </Text>
          <Text style={styles.puntoHeaderSub} numberOfLines={1}>
            {punto.info_protocolo.nombre_protocolo} (
            {punto.info_protocolo.abreviatura_protocolo}) ·{' '}
            {punto.info_muestreo.nombre_recojo}
          </Text>
        </View>

        <Badge color={pendienteSync ? 'yellow' : 'green'} size="md">
          {pendienteSync ? 'No sync' : 'Sync'}
        </Badge>
      </View>

      {/* Selector de pestañas (Protocolo / Muestras) del Sistema de Diseño C.A.S.A. */}
      <Tabs value={tab} onValueChange={setTab}>
        <View style={styles.tabsHeaderContainer}>
          <TabsList>
            <TabsTrigger
              value="protocolo"
              icon={
                <ClipboardList
                  size={15}
                  color={
                    tab === 'protocolo'
                      ? CasaColors.primaryForeground
                      : CasaColors.secondaryForeground
                  }
                />
              }
            >
              {`Protocolo (${punto.protocolo.completo ? 'Completo' : 'Borrador'})`}
            </TabsTrigger>

            <TabsTrigger
              value="muestras"
              icon={
                <FlaskConical
                  size={15}
                  color={
                    tab === 'muestras'
                      ? CasaColors.primaryForeground
                      : CasaColors.secondaryForeground
                  }
                />
              }
            >
              {`Muestras (${punto.muestras.length})`}
            </TabsTrigger>
          </TabsList>
        </View>

        <TabsContent value="protocolo">
          <ProtocoloForm
            punto={punto}
            onActualizado={(actualizado) => {
              setPunto(actualizado);
              setPendienteSync(true);
            }}
          />
        </TabsContent>

        <TabsContent value="muestras">
          <MuestrasForm
            punto={punto}
            onActualizado={(actualizado) => {
              setPunto(actualizado);
              setPendienteSync(true);
            }}
          />
        </TabsContent>
      </Tabs>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: CasaColors.background,
  },
  topBar: {
    backgroundColor: CasaColors.authBg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
  },
  puntoHeaderTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: CasaColors.primaryForeground,
  },
  puntoHeaderSub: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 1,
  },
  tabsHeaderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: CasaColors.card,
    borderBottomWidth: 1,
    borderBottomColor: CasaColors.tableDivider,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: CasaColors.mutedForeground,
  },
});
