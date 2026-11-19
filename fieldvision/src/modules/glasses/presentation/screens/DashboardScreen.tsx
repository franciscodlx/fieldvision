import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, SafeAreaView, Image,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@navigation/AppNavigator';
import { useFieldVision } from '../hooks/useFieldVision';
import { useAppStore } from '@shared/hooks/useAppStore';
import { isVisionConfigured } from '@modules/vision/infrastructure/services/VisionAIService';
import type { FieldContext, VisionAnalysis, AnalysisSeverity } from '@shared/types';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'Dashboard'>;
};

const CONTEXTS: Array<{ key: FieldContext; label: string }> = [
  { key: 'electrical', label: 'Eléctrico' },
  { key: 'plumbing', label: 'Plomería' },
  { key: 'hvac', label: 'HVAC' },
  { key: 'construction', label: 'Obra' },
  { key: 'inspection', label: 'Inspección' },
  { key: 'generic', label: 'General' },
];

const SEVERITY_COLORS: Record<AnalysisSeverity, string> = {
  critical: '#dc2626',
  warning: '#d97706',
  info: '#16a34a',
};

const SEVERITY_ICONS: Record<AnalysisSeverity, string> = {
  critical: '🔴',
  warning: '🟡',
  info: '🟢',
};

const STATUS_COLORS: Record<string, string> = {
  disconnected: '#6b7280',
  connecting: '#d97706',
  connected: '#16a34a',
  error: '#dc2626',
};

export function DashboardScreen({ navigation }: Props): React.JSX.Element {
  const {
    connectionStatus, isConnected, isAnalyzing,
    currentAnalysis, analyses, connect, disconnect, captureAndAnalyze,
    recordAndAnalyzeClip,
  } = useFieldVision();
  const { config, setConfig, lastFrame } = useAppStore();

  const historyItems = analyses.filter(a => a.id !== currentAnalysis?.id);
  const visionConfigured = isVisionConfigured();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>FieldVision</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>📋</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connection Badge */}
        <View style={styles.badge}>
          <View style={[styles.dot, { backgroundColor: STATUS_COLORS[connectionStatus] }]} />
          <Text style={styles.badgeText}>{connectionStatus}</Text>
        </View>

        {/* Context Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contextScroll}>
          {CONTEXTS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setConfig({ context: key })}
              style={[styles.chip, config.context === key && styles.chipActive]}
            >
              <Text style={[styles.chipText, config.context === key && styles.chipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Action Buttons */}
        {!isConnected ? (
          <TouchableOpacity
            onPress={connect}
            style={[styles.btn, styles.btnBlue]}
            disabled={connectionStatus === 'connecting'}
          >
            <Text style={styles.btnText}>
              {connectionStatus === 'connecting' ? 'Conectando...' : 'Conectar lentes'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.row}>
            <TouchableOpacity
              onPress={captureAndAnalyze}
              style={[styles.btn, styles.btnGreen, styles.flex]}
              disabled={isAnalyzing}
            >
              {isAnalyzing
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Analizar ahora</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={disconnect}
              style={[styles.btn, styles.btnGray, styles.btnSpacer]}
            >
              <Text style={styles.btnText}>Desconectar</Text>
            </TouchableOpacity>
          </View>
        )}
        {isConnected && (
          <TouchableOpacity
            onPress={() => { recordAndAnalyzeClip(); }}
            style={[styles.btn, styles.btnBlue, styles.clipBtn]}
            disabled={isAnalyzing}
            accessibilityRole="button"
            accessibilityLabel="Grabar un clip de video de 5 segundos y analizarlo"
          >
            <Text style={styles.btnText}>
              {isAnalyzing ? 'Analizando…' : 'Analizar video (5 s)'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Última foto capturada por los lentes */}
        {lastFrame && (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>
              Última captura de los lentes · {lastFrame.width}×{lastFrame.height}
            </Text>
            <Image
              source={{ uri: `data:image/jpeg;base64,${lastFrame.base64}` }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Aviso: sin key de IA el diagnóstico es simulado */}
        {!visionConfigured && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>
              IA en modo demo: el diagnóstico es un texto de ejemplo, no analiza la foto.
              Pon un MUSE_API_KEY real (LLM_…) en .env para activar el análisis con Muse Spark.
            </Text>
          </View>
        )}

        {/* Current Analysis Card */}
        {currentAnalysis && (
          <View style={[styles.card, { borderColor: SEVERITY_COLORS[currentAnalysis.severity] }]}>
            <Text style={styles.cardSeverity}>
              {SEVERITY_ICONS[currentAnalysis.severity]} {currentAnalysis.severity.toUpperCase()}
            </Text>
            <Text style={styles.cardSummary}>{currentAnalysis.summary}</Text>
            {currentAnalysis.actionItems[0] && (
              <Text style={styles.cardAction}>→ {currentAnalysis.actionItems[0]}</Text>
            )}
            <Text style={styles.cardTime}>
              {currentAnalysis.analyzedAt.toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* History */}
        {historyItems.map((item: VisionAnalysis) => (
          <View key={item.id} style={[styles.historyItem, { borderLeftColor: SEVERITY_COLORS[item.severity] }]}>
            <Text style={styles.historyText}>
              {SEVERITY_ICONS[item.severity]} {item.summary}
            </Text>
            <Text style={styles.historyTime}>{item.analyzedAt.toLocaleTimeString()}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
  },
  previewLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 6,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    backgroundColor: '#1f2937',
  },
  demoBanner: {
    backgroundColor: '#78350f',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  demoBannerText: {
    color: '#fde68a',
    fontSize: 12,
    lineHeight: 17,
  },
  flex: { flex: 1 },
  btnSpacer: { marginLeft: 8 },
  clipBtn: { marginTop: 8 },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  headerActions: { flexDirection: 'row' },
  headerBtn: { padding: 8 },
  headerBtnText: { fontSize: 20 },
  badge: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  badgeText: { fontSize: 14, color: '#374151', textTransform: 'capitalize' },
  contextScroll: { marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e5e7eb', marginRight: 8 },
  chipActive: { backgroundColor: '#1d4ed8' },
  chipText: { color: '#374151', fontSize: 14 },
  chipTextActive: { color: '#fff' },
  btn: { padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  btnBlue: { backgroundColor: '#1d4ed8' },
  btnGreen: { backgroundColor: '#16a34a' },
  btnGray: { backgroundColor: '#6b7280' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  row: { flexDirection: 'row', marginBottom: 12 },
  card: { borderWidth: 2, borderRadius: 12, padding: 16, backgroundColor: '#fff', marginBottom: 12 },
  cardSeverity: { fontWeight: '700', fontSize: 14, marginBottom: 8 },
  cardSummary: { fontSize: 16, color: '#111827', marginBottom: 8 },
  cardAction: { fontSize: 14, color: '#374151', marginBottom: 4 },
  cardTime: { fontSize: 12, color: '#9ca3af' },
  historyItem: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 8, marginBottom: 8, backgroundColor: '#fff', borderRadius: 8 },
  historyText: { fontSize: 14, color: '#374151' },
  historyTime: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
});
