import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Alert, StyleSheet, SafeAreaView,
} from 'react-native';
import { useAppStore } from '@shared/hooks/useAppStore';
import type { VisionAnalysis, AnalysisSeverity } from '@shared/types';

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

export function HistoryScreen(): React.JSX.Element {
  const { analyses, clearHistory } = useAppStore();
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleClear = () => {
    Alert.alert('Borrar historial', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: clearHistory },
    ]);
  };

  const renderItem = ({ item }: { item: VisionAnalysis }) => {
    const isExpanded = expanded === item.id;
    return (
      <TouchableOpacity
        style={[styles.item, { borderLeftColor: SEVERITY_COLORS[item.severity] }]}
        onPress={() => setExpanded(isExpanded ? null : item.id)}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemLeft}>
            <Text style={styles.severityDot}>{SEVERITY_ICONS[item.severity]}</Text>
            <Text style={styles.summary} numberOfLines={isExpanded ? undefined : 2}>
              {item.summary}
            </Text>
          </View>
          <View style={styles.itemRight}>
            <Text style={styles.time}>{item.analyzedAt.toLocaleTimeString()}</Text>
            <Text style={styles.arrow}>{isExpanded ? '▲' : '▼'}</Text>
          </View>
        </View>
        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.details}>{item.details}</Text>
            {item.actionItems.map((action, i) => (
              <Text key={i} style={styles.action}>→ {action}</Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.counter}>{analyses.length} análisis</Text>
        {analyses.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearBtn}>Borrar todo</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={analyses}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No hay análisis aún</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  counter: { fontSize: 16, fontWeight: '600', color: '#374151' },
  clearBtn: { fontSize: 14, color: '#dc2626' },
  list: { padding: 16, paddingTop: 0 },
  item: { borderLeftWidth: 3, backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  itemLeft: { flexDirection: 'row', flex: 1, marginRight: 8 },
  severityDot: { fontSize: 16, marginRight: 8 },
  summary: { fontSize: 14, color: '#374151', flex: 1 },
  itemRight: { alignItems: 'flex-end' },
  time: { fontSize: 12, color: '#9ca3af' },
  arrow: { fontSize: 10, color: '#9ca3af', marginTop: 4 },
  expandedContent: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  details: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  action: { fontSize: 13, color: '#374151', marginBottom: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
