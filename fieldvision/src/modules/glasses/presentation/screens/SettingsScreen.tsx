import React from 'react';
import {
  View, Text, TextInput, Switch, TouchableOpacity,
  ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useAppStore } from '@shared/hooks/useAppStore';
import type { FieldContext } from '@shared/types';

const CONTEXTS: Array<{ key: FieldContext; label: string; description: string }> = [
  { key: 'electrical', label: 'Eléctrico', description: 'Instalaciones eléctricas' },
  { key: 'plumbing', label: 'Plomería', description: 'Tuberías y fontanería' },
  { key: 'hvac', label: 'HVAC', description: 'Climatización' },
  { key: 'construction', label: 'Obra', description: 'Construcción civil' },
  { key: 'inspection', label: 'Inspección', description: 'Control de calidad' },
  { key: 'generic', label: 'General', description: 'Uso genérico' },
];

const INTERVALS = [3000, 5000, 10000, 15000];

export function SettingsScreen(): React.JSX.Element {
  const { config, setConfig } = useAppStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Técnico */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Técnico</Text>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={config.technicianName}
            onChangeText={v => setConfig({ technicianName: v })}
            placeholder="Nombre del técnico"
          />
          <Text style={styles.label}>Empresa (opcional)</Text>
          <TextInput
            style={styles.input}
            value={config.companyName ?? ''}
            onChangeText={v => setConfig({ companyName: v })}
            placeholder="Nombre de la empresa"
          />
        </View>

        {/* Contexto */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contexto de trabajo</Text>
          {CONTEXTS.map(({ key, label, description }) => (
            <TouchableOpacity
              key={key}
              style={styles.radioRow}
              onPress={() => setConfig({ context: key })}
            >
              <View style={[styles.radio, config.context === key && styles.radioActive]} />
              <View>
                <Text style={styles.radioLabel}>{label}</Text>
                <Text style={styles.radioDesc}>{description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Auto-captura */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Captura automática</Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Activar</Text>
            <Switch
              value={config.autoCapture}
              onValueChange={v => setConfig({ autoCapture: v })}
            />
          </View>
          {config.autoCapture && (
            <View style={styles.intervalRow}>
              {INTERVALS.map(ms => (
                <TouchableOpacity
                  key={ms}
                  style={[styles.intervalChip, config.captureIntervalMs === ms && styles.intervalChipActive]}
                  onPress={() => setConfig({ captureIntervalMs: ms })}
                >
                  <Text style={[styles.intervalText, config.captureIntervalMs === ms && styles.intervalTextActive]}>
                    {ms / 1000}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Idioma */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Idioma</Text>
          {(['es', 'en'] as const).map(lang => (
            <TouchableOpacity
              key={lang}
              style={styles.radioRow}
              onPress={() => setConfig({ language: lang })}
            >
              <View style={[styles.radio, config.language === lang && styles.radioActive]} />
              <Text style={styles.radioLabel}>{lang === 'es' ? 'Español' : 'English'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Acerca de */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <Text style={styles.label}>FieldVision v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  label: { fontSize: 14, color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 16 },
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#d1d5db', marginRight: 12 },
  radioActive: { borderColor: '#1d4ed8', backgroundColor: '#1d4ed8' },
  radioLabel: { fontSize: 15, color: '#111827', fontWeight: '500' },
  radioDesc: { fontSize: 12, color: '#6b7280' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  intervalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  intervalChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#e5e7eb' },
  intervalChipActive: { backgroundColor: '#1d4ed8' },
  intervalText: { fontSize: 14, color: '#374151' },
  intervalTextActive: { color: '#fff' },
});
