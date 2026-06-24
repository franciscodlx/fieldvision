import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { AppConfig } from '@shared/config';
import { SupabaseAuthRepository } from './SupabaseAuthRepository';
import { MockAuthRepository } from './MockAuthRepository';

// Supabase está configurado solo si la URL es real (no el placeholder por defecto).
export function isSupabaseConfigured(): boolean {
  const url = AppConfig.SUPABASE_URL ?? '';
  return url.startsWith('http') && !url.includes('placeholder');
}

/**
 * Devuelve el repo real de Supabase si hay credenciales configuradas;
 * de lo contrario, el mock en memoria para desarrollo.
 */
export function createAuthRepository(): IAuthRepository {
  return isSupabaseConfigured()
    ? new SupabaseAuthRepository()
    : new MockAuthRepository();
}
