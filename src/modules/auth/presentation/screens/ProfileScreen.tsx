import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { BILLING_PLANS } from '@shared/config';

const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280',
  starter: '#059669',
  pro: '#1d4ed8',
  enterprise: '#7c3aed',
};

const SEVERITY_ICONS: Record<string, string> = {
  free: '🆓',
  starter: '🚀',
  pro: '⚡',
  enterprise: '🏢',
};

export function ProfileScreen(): React.JSX.Element {
  const { authUser, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (!authUser) return <View />;

  const plan = BILLING_PLANS[authUser.plan];
  const usagePercent = authUser.maxAnalysesPerMonth === -1
    ? 0
    : Math.min(100, (authUser.analysesThisMonth / authUser.maxAnalysesPerMonth) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar / Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {authUser.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{authUser.name}</Text>
          <Text style={styles.email}>{authUser.email}</Text>
          {authUser.companyName && (
            <Text style={styles.company}>🏢 {authUser.companyName}</Text>
          )}
          <View style={[styles.planBadge, { backgroundColor: PLAN_COLORS[authUser.plan] }]}>
            <Text style={styles.planBadgeText}>
              {SEVERITY_ICONS[authUser.plan]} {plan?.name ?? authUser.plan}
            </Text>
          </View>
        </View>

        {/* Usage */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Uso este mes</Text>
          <View style={styles.usageRow}>
            <Text style={styles.usageText}>
              {authUser.analysesThisMonth} análisis
            </Text>
            <Text style={styles.usageLimit}>
              / {authUser.maxAnalysesPerMonth === -1 ? '∞' : authUser.maxAnalysesPerMonth}
            </Text>
          </View>
          {authUser.maxAnalysesPerMonth !== -1 && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, {
                width: `${usagePercent}%`,
                backgroundColor: usagePercent >= 90 ? '#dc2626' : usagePercent >= 70 ? '#d97706' : '#16a34a',
              }]} />
            </View>
          )}
          {authUser.maxAnalysesPerMonth !== -1 && (
            <Text style={styles.remaining}>
              {authUser.maxAnalysesPerMonth - authUser.analysesThisMonth} restantes
            </Text>
          )}
        </View>

        {/* Plan info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tu plan</Text>
          <Text style={styles.planName}>{plan?.name ?? authUser.plan}</Text>
          <Text style={styles.planDetail}>
            {plan?.maxTechnicians === -1 ? 'Técnicos ilimitados' : `${plan?.maxTechnicians} técnico${(plan?.maxTechnicians ?? 1) > 1 ? 's' : ''}`}
          </Text>
          <Text style={styles.planDetail}>
            {plan?.maxAnalysesPerMonth === -1 ? 'Análisis ilimitados' : `${plan?.maxAnalysesPerMonth} análisis/mes`}
          </Text>
          {authUser.plan !== 'enterprise' && (
            <TouchableOpacity style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>⬆️ Mejorar plan</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Role */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rol</Text>
          <Text style={styles.roleText}>
            {authUser.role === 'owner' ? '👑 Propietario' :
             authUser.role === 'admin' ? '⚙️ Administrador' : '🔧 Técnico'}
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>FieldVision v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16 },
  profileCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1d4ed8', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 30, fontWeight: '700', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  email: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  company: { fontSize: 14, color: '#374151', marginBottom: 12 },
  planBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  planBadgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  usageRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  usageText: { fontSize: 28, fontWeight: '800', color: '#111827' },
  usageLimit: { fontSize: 16, color: '#9ca3af', marginLeft: 4 },
  progressBar: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  remaining: { fontSize: 13, color: '#6b7280' },
  planName: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  planDetail: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
  upgradeBtn: { marginTop: 12, backgroundColor: '#eff6ff', borderRadius: 8, padding: 12, alignItems: 'center' },
  upgradeBtnText: { color: '#1d4ed8', fontWeight: '600', fontSize: 14 },
  roleText: { fontSize: 16, color: '#374151', fontWeight: '500' },
  logoutBtn: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 16 },
  version: { textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 8 },
});
