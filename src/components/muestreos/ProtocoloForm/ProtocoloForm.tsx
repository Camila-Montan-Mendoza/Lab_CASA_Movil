import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import {
  CheckCircle2,
  LocateFixed,
  Save,
  ShieldCheck,
} from 'lucide-react-native';
import {
  definicionProtocolo,
  erroresPorCampo,
  gruposDeEnsayos,
  ProtocoloComunSchema,
  schemaDelCuerpo,
  type Protocolo,
  type ProtocoloComun,
  type Punto,
} from '@/schemas/muestreos/muestreos.schema';
import {
  guardarPuntoLocal,
  obtenerPuntosHermanosOffline,
} from '@/db/offline-db';
import { Button } from '@/design-system/ui/button/button';
import { Card, CardContent } from '@/design-system/ui/card/card';
import { Input } from '@/design-system/ui/input/input';
import { Label } from '@/design-system/ui/label/label';
import { H1 } from '@/design-system/ui/typography/typography';
import { CasaColors, CasaRadius } from '@/design-system/tokens';
import {
  CampoArea,
  CampoFecha,
  CampoTexto,
} from './Campos';
import { ImagenUploader } from './ImagenUploader';
import { ProtocoloSection } from './ProtocoloSection';
import { cuerpoDelProtocolo } from './cuerpos';
import { copiarProtocoloAOtrosPuntosOffline } from './copiar-protocolo';

interface Props {
  punto: Punto;
  onActualizado: (punto: Punto) => void;
  onCerrado?: () => void;
}

type Cuerpo = Record<string, unknown>;

const gpsATexto = (lat: number | null, lng: number | null) =>
  lat !== null && lng !== null ? `${lat}, ${lng}` : '';

const textoAGps = (texto: string): { lat: number | null; lng: number | null } => {
  const [a, b] = texto.split(',').map((s) => s.trim());
  const lat = a ? Number(a) : NaN;
  const lng = b ? Number(b) : NaN;
  return {
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
};

export function ProtocoloForm({ punto, onActualizado, onCerrado }: Props) {
  const [comun, setComun] = useState<ProtocoloComun | null>(null);
  const [cuerpo, setCuerpo] = useState<Cuerpo | null>(null);
  const [gpsTexto, setGpsTexto] = useState('');
  const [fechaMuestreo, setFechaMuestreo] = useState('');
  const [horaMuestreo, setHoraMuestreo] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [obteniendoGps, setObteniendoGps] = useState(false);
  const [puntosHermanos, setPuntosHermanos] = useState<Punto[]>([]);

  const codigo = punto.info_protocolo.abreviatura_protocolo;
  const cuerpoTipo = cuerpoDelProtocolo(codigo);
  const protocoloVerificado = Boolean(punto.info_muestreo.protocolo_verificado);

  const cargar = useCallback((recibido: Punto) => {
    const abrev = recibido.info_protocolo.abreviatura_protocolo;
    const def = definicionProtocolo(abrev);
    const raw = { ...def.protocoloVacio, ...recibido.protocolo };

    const comunParsed = ProtocoloComunSchema.safeParse(raw);
    const comunData = comunParsed.success
      ? comunParsed.data
      : ProtocoloComunSchema.parse(def.protocoloVacio);

    const schemaCuerpo = schemaDelCuerpo(abrev);
    const cuerpoParsed = schemaCuerpo.safeParse(raw);
    const cuerpoData = (
      cuerpoParsed.success ? cuerpoParsed.data : schemaCuerpo.parse(def.protocoloVacio)
    ) as Cuerpo;

    setComun(comunData);
    setCuerpo(cuerpoData);
    setGpsTexto(
      gpsATexto(comunData.zona_muestreo.latitud_gps, comunData.zona_muestreo.longitud_gps)
    );
    setFechaMuestreo(
      recibido.fecha_toma_muestra || recibido.info_muestreo.fecha_prog_punto
    );
    setHoraMuestreo(
      recibido.hora_toma_muestra || recibido.info_muestreo.hora_prog_punto
    );
  }, []);

  useEffect(() => {
    cargar(punto);
  }, [punto, cargar]);

  useEffect(() => {
    const hermanos = obtenerPuntosHermanosOffline(
      punto.info_muestreo.programacion_id,
      punto.info_muestreo.punto_id
    );
    setPuntosHermanos(hermanos);
  }, [punto.info_muestreo.programacion_id, punto.info_muestreo.punto_id]);

  const candidatosCopia = useMemo(
    () =>
      puntosHermanos.filter(
        (p) =>
          p.info_protocolo.abreviatura_protocolo === codigo &&
          !p.info_muestreo.protocolo_verificado
      ),
    [puntosHermanos, codigo]
  );

  const cuerpoRef = useRef<Cuerpo | null>(null);
  useEffect(() => {
    cuerpoRef.current = cuerpo;
  }, [cuerpo]);

  const actualizarCuerpo = useCallback((actualizar: (datos: Cuerpo) => Cuerpo) => {
    const actual = cuerpoRef.current;
    if (!actual) return;
    setCuerpo(actualizar(actual));
  }, []);

  const setZona = <K extends keyof ProtocoloComun['zona_muestreo']>(
    campo: K,
    valor: ProtocoloComun['zona_muestreo'][K]
  ) => {
    setComun((c) =>
      c ? { ...c, zona_muestreo: { ...c.zona_muestreo, [campo]: valor } } : c
    );
  };

  const usarUbicacionOffline = async () => {
    try {
      setObteniendoGps(true);
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Se necesita permiso de ubicación para capturar las coordenadas GPS del punto.'
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = Number(loc.coords.latitude.toFixed(6));
      const lng = Number(loc.coords.longitude.toFixed(6));
      setZona('latitud_gps', lat);
      setZona('longitud_gps', lng);
      setGpsTexto(`${lat}, ${lng}`);
    } catch {
      Alert.alert(
        'Error de GPS',
        'No se pudo obtener la ubicación. Asegúrate de tener el GPS activo en tu dispositivo.'
      );
    } finally {
      setObteniendoGps(false);
    }
  };

  const validarCierre = (protocoloArmado: Protocolo): boolean => {
    const def = definicionProtocolo(codigo);
    const parsed = def.schemaCierre.safeParse(protocoloArmado);
    const nuevos = parsed.success ? {} : erroresPorCampo(parsed.error);
    if (!fechaMuestreo.trim()) nuevos.fecha_muestreo = 'Campo obligatorio';
    if (!horaMuestreo.trim()) nuevos.hora_muestreo = 'Campo obligatorio';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const guardar = async (cerrar: boolean) => {
    if (!comun) return;
    const protocoloArmado: Protocolo = {
      ...(cuerpo ?? {}),
      ...comun,
      completo: cerrar ? true : comun.completo,
    };

    if (cerrar && !validarCierre(protocoloArmado)) {
      Alert.alert(
        'Faltan campos obligatorios',
        'Por favor completa los campos marcados en rojo antes de cerrar el protocolo.'
      );
      return;
    }

    setGuardando(true);
    try {
      const registroGuardado = guardarPuntoLocal(
        punto.info_muestreo.punto_id,
        {
          protocolo: protocoloArmado,
          fecha_toma_muestra: fechaMuestreo,
          hora_toma_muestra: horaMuestreo,
        },
        cerrar ? 'listo_para_enviar' : 'borrador_local'
      );

      setErrores({});

      const puntoActualizado = registroGuardado?.punto ?? {
        ...punto,
        protocolo: protocoloArmado,
        fecha_toma_muestra: fechaMuestreo,
        hora_toma_muestra: horaMuestreo,
      };

      let copiados = 0;
      if (candidatosCopia.length > 0) {
        const resultadosCopia = copiarProtocoloAOtrosPuntosOffline(
          puntoActualizado,
          candidatosCopia
        );
        copiados = resultadosCopia.filter((r) => r.actualizado).length;
      }

      onActualizado(puntoActualizado);

      const msgBase = cerrar
        ? 'Protocolo cerrado y guardado en el dispositivo (listo para sincronizar).'
        : 'Borrador guardado en el dispositivo.';
      const msgExtra =
        copiados > 0
          ? `\n\nTambién se copiaron los datos comunes a ${copiados} punto(s) hermano(s) de esta programación.`
          : '';

      Alert.alert('Guardado local', msgBase + msgExtra);
      if (cerrar && onCerrado) {
        onCerrado();
      }
    } catch (e) {
      Alert.alert(
        'Error al guardar',
        e instanceof Error ? e.message : 'No se pudo guardar localmente'
      );
    } finally {
      setGuardando(false);
    }
  };

  const grupos = useMemo(
    () => gruposDeEnsayos(punto.info_protocolo.paquetes),
    [punto.info_protocolo.paquetes]
  );

  if (!comun) {
    return (
      <View style={styles.loadingBox}>
        <Text style={styles.loadingText}>Cargando protocolo…</Text>
      </View>
    );
  }

  const seccionesCuerpo = cuerpoTipo?.seccionesDatos ?? 0;
  const nCroquis = 3 + seccionesCuerpo;
  const nMediciones = nCroquis + 1;
  const nObservaciones = cuerpoTipo ? nMediciones + 1 : nCroquis + 1;
  const nFechas = nObservaciones + 1;

  const propsCuerpo = {
    datos: cuerpo ?? {},
    setDatos: actualizarCuerpo,
    errores,
    puntoId: punto.info_muestreo.punto_id,
    abreviaturaProtocolo: codigo,
    nombreProtocolo: punto.info_protocolo.nombre_protocolo,
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerBlock}>
          <H1>
            Protocolo de Toma de Muestras e Inspección Sanitaria —{' '}
            {punto.info_protocolo.nombre_protocolo} ({codigo})
          </H1>
          <Text style={styles.headerDesc}>
            Este documento establece los parámetros técnicos obligatorios para la recolección y
            análisis de muestras, asegurando el cumplimiento de la normativa sanitaria vigente.
          </Text>
        </View>

        {protocoloVerificado && (
          <View style={styles.verifiedBanner}>
            <ShieldCheck size={18} color={CasaColors.success} />
            <Text style={styles.verifiedText}>
              Protocolo verificado
              {punto.info_muestreo.nombre_verificacion
                ? ` por ${punto.info_muestreo.nombre_verificacion}`
                : ''}
              : bloqueado para edición.
            </Text>
          </View>
        )}

        {/* Cabecera informativa igual a casa_fe */}
        <Card style={styles.infoTopCard}>
          <CardContent style={styles.infoTopContent}>
            <View>
              <Label>Tipo de servicio</Label>
              <Input value={punto.info_protocolo.nombre_servicio} disabled />
            </View>
            <View>
              <Label>Punto</Label>
              <Input value={punto.info_protocolo.nombre_punto} disabled />
            </View>
          </CardContent>
        </Card>

        {/* 1 — Ensayos requeridos */}
        <ProtocoloSection numero={1} titulo="Ensayos Requeridos">
          {grupos.length === 0 ? (
            <Text style={styles.mutedText}>
              Este punto no tiene ensayos cargados en la programación.
            </Text>
          ) : (
            grupos.map((grupo) => (
              <View key={grupo.nombre} style={styles.ensayoGroupCard}>
                <Text style={styles.ensayoGroupName}>{grupo.nombre}</Text>
                <Text style={styles.ensayoGroupItems}>{grupo.ensayos.join(', ')}</Text>
              </View>
            ))
          )}
        </ProtocoloSection>

        {/* 2 — Zona de muestreo */}
        <ProtocoloSection numero={2} titulo="Datos de la Zona de Muestreo">
          <CampoTexto
            label="Dirección del muestreo"
            value={comun.zona_muestreo.direccion}
            onChange={(v) => setZona('direccion', v)}
            error={errores['zona_muestreo.direccion']}
          />
          <CampoTexto
            label="Departamento"
            value={comun.zona_muestreo.departamento}
            onChange={(v) => setZona('departamento', v)}
          />
          <CampoTexto
            label="Provincia"
            value={comun.zona_muestreo.provincia}
            onChange={(v) => setZona('provincia', v)}
          />
          <CampoTexto
            label="Municipio"
            value={comun.zona_muestreo.municipio}
            onChange={(v) => setZona('municipio', v)}
          />
          <CampoTexto
            label="Zona"
            value={comun.zona_muestreo.zona}
            onChange={(v) => setZona('zona', v)}
          />

          <View>
            <Label>Coordenadas GPS</Label>
            <View style={styles.gpsRow}>
              <Input
                containerStyle={styles.gpsInput}
                value={gpsTexto}
                placeholder="-17.393512, -66.245871"
                onChangeText={(txt) => {
                  setGpsTexto(txt);
                  const { lat, lng } = textoAGps(txt);
                  setZona('latitud_gps', lat);
                  setZona('longitud_gps', lng);
                }}
              />
              <Button
                variant="secondary"
                loading={obteniendoGps}
                onPress={usarUbicacionOffline}
                tooltip="Obtener coordenadas GPS actuales del dispositivo"
              >
                <LocateFixed size={16} color={CasaColors.secondaryForeground} />
                GPS
              </Button>
            </View>
            <Text style={styles.gpsHint}>
              Latitud y longitud separadas por coma (funciona sin internet con el GPS del teléfono).
            </Text>
          </View>
        </ProtocoloSection>

        {/* 3.. — Cuerpo específico del protocolo */}
        {cuerpoTipo && cuerpo ? (
          <cuerpoTipo.Datos {...propsCuerpo} desde={3} />
        ) : (
          <ProtocoloSection numero={3} titulo="Datos de la Muestra">
            <Text style={styles.mutedText}>
              El protocolo {punto.info_protocolo.nombre_protocolo} ({codigo}) usa las secciones
              generales de zona, croquis y observaciones.
            </Text>
          </ProtocoloSection>
        )}

        {/* Croquis */}
        <ProtocoloSection
          numero={nCroquis}
          titulo="Croquis del Punto y Lugar de Muestreo"
          descripcion="Fotografíe o adjunte el esquema del lugar y punto de muestreo."
        >
          <ImagenUploader
            destino="croquis"
            puntoId={punto.info_muestreo.punto_id}
            imagenes={comun.croquis_punto.imagenes}
            onChange={(imagenes) =>
              setComun((c) =>
                c ? { ...c, croquis_punto: { ...c.croquis_punto, imagenes } } : c
              )
            }
          />
        </ProtocoloSection>

        {/* Mediciones en campo */}
        {cuerpoTipo && cuerpo && (
          <cuerpoTipo.Mediciones {...propsCuerpo} desde={nMediciones} />
        )}

        {/* Observaciones */}
        <ProtocoloSection numero={nObservaciones} titulo="Observaciones">
          <CampoArea
            label="Observaciones"
            value={comun.observaciones}
            onChange={(v) => setComun((c) => (c ? { ...c, observaciones: v } : c))}
            placeholder="Observaciones del muestreo en campo"
            rows={3}
          />
        </ProtocoloSection>

        {/* Fechas y horas */}
        <ProtocoloSection
          numero={nFechas}
          titulo="Datos de Fecha y Hora"
          descripcion="Muestreo e ingreso al laboratorio."
        >
          <CampoFecha
            label="Fecha de Muestreo"
            value={fechaMuestreo}
            onChange={setFechaMuestreo}
            error={errores.fecha_muestreo}
          />
          <CampoTexto
            label="Hora de Muestreo"
            type="time"
            value={horaMuestreo}
            onChange={setHoraMuestreo}
            error={errores.hora_muestreo}
          />
          <CampoFecha
            label="Fecha de ingreso Lab."
            value={comun.fecha_ingreso_muestra}
            onChange={(v) =>
              setComun((c) => (c ? { ...c, fecha_ingreso_muestra: v } : c))
            }
          />
          <CampoTexto
            label="Hora de ingreso Lab."
            type="time"
            value={comun.hora_ingreso_muestra}
            onChange={(v) =>
              setComun((c) => (c ? { ...c, hora_ingreso_muestra: v } : c))
            }
          />
        </ProtocoloSection>
      </ScrollView>

      {!protocoloVerificado && (
        <View style={styles.bottomBar}>
          {candidatosCopia.length > 0 && (
            <Text style={styles.copyNote}>
              Al guardar también se copiarán los datos comunes a {candidatosCopia.length} punto(s)
              con el mismo protocolo.
            </Text>
          )}
          <View style={styles.actionButtons}>
            <Button
              variant="outline"
              disabled={guardando}
              onPress={() => guardar(false)}
              style={styles.flexBtn}
              tooltip="Guardar borrador localmente en el dispositivo"
            >
              <Save size={16} color={CasaColors.foreground} />
              Guardar borrador
            </Button>

            <Button
              variant="default"
              disabled={guardando}
              loading={guardando}
              onPress={() => guardar(true)}
              style={styles.flexBtn}
              tooltip="Validar y cerrar el protocolo para sincronización"
            >
              <CheckCircle2 size={16} color={CasaColors.primaryForeground} />
              Cerrar protocolo
            </Button>
          </View>
        </View>
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
    paddingBottom: 0,
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: CasaColors.mutedForeground,
  },
  headerBlock: {
    marginBottom: 16,
    gap: 6,
  },
  headerDesc: {
    fontSize: 13,
    color: CasaColors.mutedForeground,
    lineHeight: 18,
  },
  infoTopCard: {
    marginBottom: 16,
  },
  infoTopContent: {
    gap: 10,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: CasaRadius.lg,
    padding: 12,
    marginBottom: 16,
  },
  verifiedText: {
    flex: 1,
    fontSize: 13,
    color: '#15803d',
    fontWeight: '600',
  },
  ensayoGroupCard: {
    borderWidth: 1,
    borderColor: CasaColors.tableDivider,
    borderRadius: CasaRadius.lg,
    padding: 12,
    backgroundColor: CasaColors.tableHeader,
  },
  ensayoGroupName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: CasaColors.foreground,
  },
  ensayoGroupItems: {
    marginTop: 4,
    fontSize: 13,
    color: CasaColors.mutedForeground,
  },
  mutedText: {
    fontSize: 13,
    color: CasaColors.mutedForeground,
  },
  gpsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  gpsInput: {
    flex: 1,
  },
  gpsHint: {
    marginTop: 4,
    fontSize: 11.5,
    color: CasaColors.mutedForeground,
  },
  bottomBar: {
    backgroundColor: CasaColors.card,
    borderTopWidth: 1,
    borderTopColor: CasaColors.tableDivider,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  copyNote: {
    fontSize: 11.5,
    color: CasaColors.mutedForeground,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  flexBtn: {
    flex: 1,
  },
});
