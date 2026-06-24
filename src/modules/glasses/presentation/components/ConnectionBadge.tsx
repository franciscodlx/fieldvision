import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { GlassesConnectionStatus } from '@shared/types';

const STATUS_CONFIG: Record<GlassesConnectionStatus, { color: string; label: string }> = {
  disconnected: { color: '#6b7280', label: 'Desconectado' },
  connecting:   { color: '#d97706', label: 'Conectando...' },
  connected:    { color: '#16a34a', label: 'Conectado' },
  error:        { color: '#dc2626', label: 'Error' },
};

interface Props {
  status: GlassesConnectionStatus;
}

export function ConnectionBadge({ status }: Props): React.JSX.Element {
  const { color, label } = STATUS_CONFIG[status];
  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, backgroundColor: '#f3f4f6' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  label: { fontSize: 13, fontWeight: '600' },
});
