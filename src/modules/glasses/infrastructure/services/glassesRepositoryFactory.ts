import type { IGlassesRepository } from '../../domain/repositories/IGlassesRepository';
import { AppConfig } from '@shared/config';
import { MetaGlassesRepository } from './MetaGlassesRepository';
import { MockGlassesRepository } from './MockGlassesRepository';

// El SDK de Meta está configurado solo si hay un token real (no el placeholder).
export function isMetaSdkConfigured(): boolean {
  const token = AppConfig.META_APP_TOKEN ?? '';
  return token.length > 0 && !token.includes('PLACEHOLDER');
}

/**
 * Devuelve el repo nativo (TurboModule MetaGlasses) si el SDK de Meta está
 * configurado; de lo contrario el mock en JS (modo desarrollo).
 *
 * Nota: el TurboModule nativo iOS aún crashea bajo Nueva Arquitectura
 * (ver MockGlassesRepository) — arreglar al integrar el SDK real de Meta.
 */
export function createGlassesRepository(): IGlassesRepository {
  return isMetaSdkConfigured()
    ? new MetaGlassesRepository()
    : new MockGlassesRepository();
}
