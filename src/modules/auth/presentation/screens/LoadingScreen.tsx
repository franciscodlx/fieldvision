import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export function LoadingScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>👓</Text>
      <Text style={styles.title}>FieldVision</Text>
      <ActivityIndicator size="large" color="#1d4ed8" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  logo: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 32 },
  spinner: { marginTop: 8 },
});
