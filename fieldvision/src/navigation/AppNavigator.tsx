import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Auth screens
import { LoginScreen } from '@modules/auth/presentation/screens/LoginScreen';
import { RegisterScreen } from '@modules/auth/presentation/screens/RegisterScreen';
import { ForgotPasswordScreen } from '@modules/auth/presentation/screens/ForgotPasswordScreen';
import { ProfileScreen } from '@modules/auth/presentation/screens/ProfileScreen';
import { LoadingScreen } from '@modules/auth/presentation/screens/LoadingScreen';

// App screens
import { DashboardScreen } from '@modules/glasses/presentation/screens/DashboardScreen';
import { SettingsScreen } from '@modules/glasses/presentation/screens/SettingsScreen';
import { HistoryScreen } from '@modules/glasses/presentation/screens/HistoryScreen';
import { PlansScreen } from '@modules/billing/presentation/screens/PlansScreen';

// Auth state
import { useAuth } from '@modules/auth/presentation/hooks/useAuth';

// ─── Param Lists ──────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type AppStackParamList = {
  Dashboard: undefined;
  Settings: undefined;
  History: undefined;
  Plans: undefined;
  Profile: undefined;
};

export type RootStackParamList = AuthStackParamList & AppStackParamList;

// ─── Stacks ───────────────────────────────────────────────────────────────────

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const HEADER_OPTIONS = {
  headerStyle: { backgroundColor: '#ffffff' } as const,
  headerShadowVisible: false,
  headerTintColor: '#111827',
  headerTitleStyle: { fontWeight: '700' as const },
};

function AuthNavigator(): React.JSX.Element {
  return (
    <AuthStack.Navigator screenOptions={{ ...HEADER_OPTIONS, headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: true, title: 'Crear cuenta' }}
      />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: true, title: 'Recuperar contraseña' }}
      />
    </AuthStack.Navigator>
  );
}

function AppNavigatorInner(): React.JSX.Element {
  return (
    <AppStack.Navigator screenOptions={HEADER_OPTIONS}>
      <AppStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'FieldVision' }} />
      <AppStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configuración' }} />
      <AppStack.Screen name="History" component={HistoryScreen} options={{ title: 'Historial' }} />
      <AppStack.Screen name="Plans" component={PlansScreen} options={{ title: 'Planes' }} />
      <AppStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mi perfil' }} />
    </AppStack.Navigator>
  );
}

// ─── Root (auth gate) ─────────────────────────────────────────────────────────

function RootNavigator(): React.JSX.Element {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <AppNavigatorInner /> : <AuthNavigator />;
}

// ─── Query Client ─────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 2 },
  },
});

// ─── Export ───────────────────────────────────────────────────────────────────

export function AppNavigator(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
