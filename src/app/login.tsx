import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Droplets, Eye, EyeOff, Server } from 'lucide-react-native';
import { useAuth } from '@/providers/auth-provider';
import { guardarApiBaseUrl, obtenerApiBaseUrl } from '@/services/api';
import { Button } from '@/design-system/ui/button/button';
import { Input } from '@/design-system/ui/input/input';
import { Label } from '@/design-system/ui/label/label';
import { Card } from '@/design-system/ui/card/card';
import { H1 } from '@/design-system/ui/typography/typography';
import { CasaColors, CasaRadius } from '@/design-system/tokens';

/**
 * Pantalla de inicio de sesión móvil estandarizada con `casa_fe/components/auth/LoginForm.tsx`
 * y los tokens `--auth-bg` (`#001B47`) y `--primary` (`#003770`).
 */
export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mostrarConfigUrl, setMostrarConfigUrl] = useState(false);
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    obtenerApiBaseUrl().then(setApiUrl);
  }, []);

  const handleLogin = async () => {
    setError(null);
    if (!nombreUsuario.trim() || !contrasenia) {
      setError('Ingresa tu nombre de usuario y contraseña.');
      return;
    }

    setCargando(true);
    try {
      if (apiUrl.trim()) {
        await guardarApiBaseUrl(apiUrl.trim());
      }

      const result = await login(nombreUsuario.trim(), contrasenia);

      if (!result.success) {
        setError(result.message);
        return;
      }

      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandHeader}>
          <View style={styles.logoCircle}>
            <Droplets size={34} color={CasaColors.primaryForeground} />
          </View>
          <Text style={styles.brandTitle}>C.A.S.A. Campo</Text>
          <Text style={styles.brandSubtitle}>
            Sistema de Muestreo y Protocolos Offline — UMSS
          </Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <H1>Iniciar sesión</H1>
            <TouchableOpacity
              onPress={() => setMostrarConfigUrl((v) => !v)}
              style={styles.serverBtn}
            >
              <Server size={16} color={CasaColors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {mostrarConfigUrl && (
            <View style={styles.serverConfigBox}>
              <Label size="xs">URL del Servidor Backend (casa_be)</Label>
              <Input
                size="sm"
                value={apiUrl}
                onChangeText={setApiUrl}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="http://10.32.160.109:3001/be"
              />
              <Text style={styles.serverHint}>
                Usa la IP local de tu computadora cuando pruebes en un dispositivo físico en la misma red Wi-Fi.
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Label required>Nombre de usuario</Label>
            <Input
              value={nombreUsuario}
              onChangeText={setNombreUsuario}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Ingrese su usuario"
              invalid={Boolean(error && !nombreUsuario.trim())}
            />
          </View>

          <View style={styles.field}>
            <Label required>Contraseña</Label>
            <Input
              value={contrasenia}
              onChangeText={setContrasenia}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              placeholder="Ingrese su contraseña"
              invalid={Boolean(error && !contrasenia)}
              endIcon={
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  {showPassword ? (
                    <EyeOff size={18} color={CasaColors.mutedForeground} />
                  ) : (
                    <Eye size={18} color={CasaColors.mutedForeground} />
                  )}
                </TouchableOpacity>
              }
            />
          </View>

          <Button
            variant="default"
            size="lg"
            loading={cargando}
            onPress={handleLogin}
            style={styles.submitBtn}
          >
            Iniciar sesión
          </Button>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CasaColors.authBg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: CasaColors.primary,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: CasaColors.primaryForeground,
    letterSpacing: -0.4,
  },
  brandSubtitle: {
    fontSize: 13.5,
    color: '#cbd5e1',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    paddingHorizontal: 22,
    paddingVertical: 24,
    borderRadius: CasaRadius['3xl'],
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serverBtn: {
    padding: 6,
    borderRadius: CasaRadius.md,
    backgroundColor: CasaColors.muted,
  },
  serverConfigBox: {
    backgroundColor: CasaColors.tableHeader,
    borderWidth: 1,
    borderColor: CasaColors.tableDivider,
    borderRadius: CasaRadius.lg,
    padding: 12,
    gap: 6,
  },
  serverHint: {
    fontSize: 11.5,
    color: CasaColors.mutedForeground,
  },
  errorBanner: {
    backgroundColor: CasaColors.destructiveSoftBg,
    borderWidth: 1,
    borderColor: CasaColors.destructiveSoftBorder,
    borderRadius: CasaRadius.lg,
    padding: 12,
  },
  errorBannerText: {
    color: CasaColors.destructive,
    fontSize: 13,
    fontWeight: '600',
  },
  field: {
    gap: 2,
  },
  submitBtn: {
    marginTop: 4,
  },
});
