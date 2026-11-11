import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, Trash2 } from 'lucide-react-native';
import type { Imagen } from '@/schemas/muestreos/protocolos';
import { registrarImagenLocal } from '@/db/offline-db';
import { Button } from '@/design-system/ui/button/button';
import { Input } from '@/design-system/ui/input/input';
import { Badge } from '@/design-system/ui/badge/badge';
import { CasaColors, CasaRadius } from '@/design-system/tokens';

interface Props {
  destino: 'protocolos' | 'croquis';
  puntoId?: number;
  imagenes: Imagen[];
  onChange: (imagenes: Imagen[]) => void;
}

/**
 * Selector y tomador de fotos en campo (`casa_fe/components/muestreos/ProtocoloForm/ImagenUploader.tsx`)
 * usando los componentes `@/design-system/ui/*`.
 */
export function ImagenUploader({ destino, puntoId = 0, imagenes, onChange }: Props) {
  const [cargando, setCargando] = useState(false);

  const crearImagenDesdeAsset = (asset: ImagePicker.ImagePickerAsset, idxOffset = 0): Imagen => {
    const uri = asset.uri;
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = asset.mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg');
    const idLocal = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${idxOffset}`;
    const nombreImagen = asset.fileName || `Foto_${imagenes.length + idxOffset + 1}.${ext}`;

    registrarImagenLocal({
      id_local: idLocal,
      punto_id: puntoId,
      destino,
      uri_local: uri,
      nombre_imagen: nombreImagen,
      mime_type: mimeType,
      url_remota: null,
    });

    return {
      id_local: idLocal,
      nombre_imagen: nombreImagen,
      url_imagen: uri,
      fecha_actualizacion_imagen: new Date().toISOString(),
    };
  };

  const tomarFoto = async () => {
    try {
      setCargando(true);
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar fotografías del muestreo.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!res.canceled && res.assets.length > 0) {
        const nueva = crearImagenDesdeAsset(res.assets[0], 0);
        onChange([...imagenes, nueva]);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo abrir la cámara');
    } finally {
      setCargando(false);
    }
  };

  const elegirDeGaleria = async () => {
    try {
      setCargando(true);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para adjuntar imágenes.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets.length > 0) {
        const nuevas = res.assets.map((asset, i) => crearImagenDesdeAsset(asset, i));
        onChange([...imagenes, ...nuevas]);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo abrir la galería');
    } finally {
      setCargando(false);
    }
  };

  const editarNombre = (idx: number, nombre_imagen: string) => {
    onChange(imagenes.map((img, i) => (i === idx ? { ...img, nombre_imagen } : img)));
  };

  const quitar = (idx: number) => {
    onChange(imagenes.filter((_, i) => i !== idx));
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <Button
          variant="outline"
          size="sm"
          disabled={cargando}
          onPress={tomarFoto}
          tooltip="Tomar fotografía con la cámara"
        >
          <Camera size={16} color={CasaColors.primary} />
          Tomar foto
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={cargando}
          onPress={elegirDeGaleria}
          tooltip="Seleccionar imagen desde la galería"
        >
          <ImagePlus size={16} color={CasaColors.secondaryForeground} />
          Galería
        </Button>
      </View>

      {imagenes.length > 0 && (
        <View style={styles.grid}>
          {imagenes.map((img, i) => {
            const esLocal =
              img.url_imagen.startsWith('file://') ||
              img.url_imagen.startsWith('content://') ||
              img.url_imagen.startsWith('blob:');
            return (
              <View key={img.id_local || `${img.url_imagen}-${i}`} style={styles.card}>
                <Image source={{ uri: img.url_imagen }} style={styles.preview} resizeMode="cover" />
                <View style={styles.cardBody}>
                  <View style={styles.badgeRow}>
                    <Badge color={esLocal ? 'yellow' : 'green'} size="md">
                      {esLocal ? 'Guardada en dispositivo (pendiente de subir)' : 'Sincronizada'}
                    </Badge>
                  </View>
                  <Input
                    size="sm"
                    placeholder="Nombre de la imagen"
                    value={img.nombre_imagen}
                    onChangeText={(v) => editarNombre(i, v)}
                  />
                  <View style={styles.deleteAlign}>
                    <Button
                      variant="destructive"
                      size="sm"
                      onPress={() => quitar(i)}
                      tooltip="Quitar imagen del protocolo"
                    >
                      <Trash2 size={14} color={CasaColors.destructiveForeground} />
                      Quitar
                    </Button>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  grid: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: CasaColors.tableDivider,
    borderRadius: CasaRadius.xl,
    overflow: 'hidden',
    backgroundColor: CasaColors.card,
  },
  preview: {
    width: '100%',
    height: 170,
    backgroundColor: CasaColors.muted,
  },
  cardBody: {
    padding: 12,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  deleteAlign: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
});
