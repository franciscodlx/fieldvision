import type { LoginCredentials, RegisterCredentials, AuthSession, AuthUser } from '@shared/types';

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  register(credentials: RegisterCredentials): Promise<AuthSession>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;
  getCurrentUser(): Promise<AuthUser | null>;
  refreshSession(): Promise<AuthSession | null>;
  resetPassword(email: string): Promise<void>;
  onAuthStateChange(cb: (user: AuthUser | null) => void): () => void;
}
