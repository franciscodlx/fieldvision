import type { IGlassesRepository } from '../../domain/repositories/IGlassesRepository';
import { AppConfig } from '@shared/config';
import { MetaGlassesRepository } from './MetaGlassesRepository';
import { MockGlassesRepository } from './MockGlassesRepository';

// El SDK de Meta está configurado solo si hay un token real (no el placeholder).
export function isMetaSdkConfigured(): boolean {
  const token = AppConfig.META_APP_TOKEN ?? '';
  return token.length > 0 && !token.includes('PLACEHOLDER');
}

// Pon esto en true para forzar el repo 100% JS (sin TurboModule nativo),
// útil si el nativo no está disponible en algún entorno.
const FORCE_JS_MOCK = false;

/**
 * Repositorio de lentes.
 *
 * El TurboModule nativo (`MetaGlassesRepository`) YA funciona en iOS y Android
 * con cuerpos mock (sesión/foto simuladas) + TTS real por el altavoz.
 * Al integrar el SDK de Meta DAT solo se reemplazan los `// TODO: Replace mock`
 * en los archivos nativos (.mm / .kt); esta capa JS no cambia.
 *
 * `MockGlassesRepository` (100% JS, sin voz) queda como fallback.
 */
export function createGlassesRepository(): IGlassesRepository {
  if (FORCE_JS_MOCK) {
    return new MockGlassesRepository();
  }
  return new MetaGlassesRepository();
}
