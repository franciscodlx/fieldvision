import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Alert, StyleSheet, SafeAreaView,
} from 'react-native';
import { BILLING_PLANS } from '@shared/config';

export function PlansScreen(): React.JSX.Element {
  const handleSelect = (_planName: string) => {
    Alert.alert(
      'Próximamente',
      `Configura Stripe para activar pagos. Ver docs/06-payments.md`,
    );
  };

  const plans = Object.values(BILLING_PLANS);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Planes</Text>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            🚀 Primeros 20 clientes: 50% con código LAUNCH50
          </Text>
        </View>
        {plans.map(plan => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.card, plan.id === 'pro' && styles.cardFeatured]}
            onPress={() => handleSelect(plan.name)}
          >
            {plan.id === 'pro' && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Más popular</Text>
              </View>
            )}
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>
              {plan.priceUsd === 0 ? 'Gratis' : `$${plan.priceUsd}/mes`}
            </Text>
            <Text style={styles.planDetail}>
              {plan.maxTechnicians === -1 ? 'Técnicos ilimitados' : `${plan.maxTechnicians} técnico${plan.maxTechnicians > 1 ? 's' : ''}`}
            </Text>
            <Text style={styles.planDetail}>
              {plan.maxAnalysesPerMonth === -1 ? 'Análisis ilimitados' : `${plan.maxAnalysesPerMonth} análisis/mes`}
            </Text>
            <View style={[styles.selectBtn, plan.id === 'pro' && styles.selectBtnFeatured]}>
              <Text style={styles.selectBtnText}>
                {plan.priceUsd === 0 ? 'Usar gratis' : 'Seleccionar'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 12 },
  banner: { backgroundColor: '#eff6ff', borderRadius: 10, padding: 12, marginBottom: 16 },
  bannerText: { fontSize: 14, color: '#1d4ed8', fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardFeatured: { borderWidth: 2, borderColor: '#1d4ed8' },
  badge: { backgroundColor: '#1d4ed8', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  planName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  planPrice: { fontSize: 28, fontWeight: '800', color: '#1d4ed8', marginBottom: 8 },
  planDetail: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  selectBtn: { backgroundColor: '#e5e7eb', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
  selectBtnFeatured: { backgroundColor: '#1d4ed8' },
  selectBtnText: { fontWeight: '600', color: '#fff', fontSize: 15 },
});
