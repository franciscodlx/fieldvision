import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthSession,
  AuthUser,
} from '@shared/types';

// Credenciales del usuario de prueba (modo desarrollo, sin backend real).
export const DEMO_CREDENTIALS = {
  email: 'tecnico@fieldvision.app',
  password: 'password123',
} as const;

function buildSession(user: AuthUser): AuthSession {
  return {
    accessToken: `mock-access-${user.id}`,
    refreshToken: `mock-refresh-${user.id}`,
    expiresAt: new Date(Date.now() + 3600 * 1000),
    user,
  };
}

function demoUser(email: string, name?: string): AuthUser {
  return {
    id: 'demo-tecnico-001',
    email,
    name: name ?? email.split('@')[0] ?? 'Técnico Demo',
    role: 'technician',
    companyName: 'FieldVision Demo',
    createdAt: new Date(),
    plan: 'pro',
    analysesThisMonth: 12,
    maxAnalysesPerMonth: 3000,
  };
}

/**
 * Repositorio de auth en memoria para desarrollo (sin Supabase real).
 * Acepta cualquier email válido + contraseña ≥ 6 y devuelve un usuario demo.
 * Se usa automáticamente cuando SUPABASE_URL no está configurado (placeholder).
 */
export class MockAuthRepository implements IAuthRepository {
  private listeners = new Set<(user: AuthUser | null) => void>();

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const user = demoUser(credentials.email);
    this.listeners.forEach((cb) => cb(user));
    return buildSession(user);
  }

  async register(credentials: RegisterCredentials): Promise<AuthSession> {
    const user = demoUser(credentials.email, credentials.name);
    if (credentials.companyName) {
      user.companyName = credentials.companyName;
    }
    this.listeners.forEach((cb) => cb(user));
    return buildSession(user);
  }

  async logout(): Promise<void> {
    this.listeners.forEach((cb) => cb(null));
  }

  // Sin sesión persistida: la app arranca siempre en Login.
  async getCurrentSession(): Promise<AuthSession | null> {
    return null;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return null;
  }

  async refreshSession(): Promise<AuthSession | null> {
    return null;
  }

  async resetPassword(_email: string): Promise<void> {
    // no-op en modo demo
  }

  onAuthStateChange(cb: (user: AuthUser | null) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
}
