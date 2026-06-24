import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { VisionAnalysis, AnalysisSeverity } from '@shared/types';

const SEVERITY_CONFIG: Record<AnalysisSeverity, { color: string; icon: string; label: string }> = {
  critical: { color: '#dc2626', icon: '🔴', label: 'CRÍTICO' },
  warning:  { color: '#d97706', icon: '🟡', label: 'ATENCIÓN' },
  info:     { color: '#16a34a', icon: '🟢', label: 'OK' },
};

interface Props {
  analysis: VisionAnalysis;
  compact?: boolean;
}

export function AnalysisCard({ analysis, compact = false }: Props): React.JSX.Element {
  const { color, icon, label } = SEVERITY_CONFIG[analysis.severity];
  return (
    <View style={[styles.card, { borderColor: color }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.severity, { color }]}>{icon} {label}</Text>
        <Text style={styles.time}>{analysis.analyzedAt.toLocaleTimeString()}</Text>
      </View>
      <Text style={styles.summary} numberOfLines={compact ? 2 : undefined}>
        {analysis.summary}
      </Text>
      {!compact && analysis.actionItems[0] && (
        <View style={styles.actionRow}>
          <Text style={styles.actionIcon}>→</Text>
          <Text style={styles.actionText}>{analysis.actionItems[0]}</Text>
        </View>
      )}
      {!compact && (
        <View style={[styles.confidenceBar, { width: `${analysis.confidence * 100}%` }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 2, borderRadius: 12, padding: 14, backgroundColor: '#fff', marginBottom: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  severity: { fontSize: 13, fontWeight: '700' },
  time: { fontSize: 12, color: '#9ca3af' },
  summary: { fontSize: 15, color: '#111827', lineHeight: 21, marginBottom: 6 },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },
  actionIcon: { fontSize: 14, color: '#374151', marginRight: 6, marginTop: 1 },
  actionText: { fontSize: 14, color: '#374151', flex: 1 },
  confidenceBar: { height: 2, backgroundColor: '#16a34a', borderRadius: 1, marginTop: 10, opacity: 0.4 },
});
