import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

export function ForgotPasswordScreen({ navigation }: Props): React.JSX.Element {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!email || !email.includes('@')) {
      setError('Ingresa un email válido.');
      return;
    }
    setLoading(true);
    setError(null);
    const authError = await resetPassword(email.trim().toLowerCase());
    setLoading(false);
    if (authError) {
      setError('Error al enviar el email. Verifica tu conexión.');
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.sentContainer}>
          <Text style={styles.sentIcon}>📧</Text>
          <Text style={styles.sentTitle}>Email enviado</Text>
          <Text style={styles.sentText}>
            Revisa tu bandeja de entrada en{' '}
            <Text style={styles.sentEmail}>{email}</Text>
            {' '}y sigue las instrucciones para restablecer tu contraseña.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.btnText}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Restablecer contraseña</Text>
          <Text style={styles.subtitle}>
            Te enviaremos un enlace para crear una nueva contraseña.
          </Text>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Enviar enlace</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  form: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#dc2626' },
  errorText: { color: '#dc2626', fontSize: 14 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 14, fontSize: 16, color: '#111827', marginBottom: 20, backgroundColor: '#f9fafb' },
  btn: { backgroundColor: '#1d4ed8', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  backBtn: { alignItems: 'center', paddingVertical: 8 },
  backText: { fontSize: 15, color: '#6b7280' },
  sentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  sentIcon: { fontSize: 64, marginBottom: 16 },
  sentTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12 },
  sentText: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  sentEmail: { fontWeight: '600', color: '#1d4ed8' },
});
