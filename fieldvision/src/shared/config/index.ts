import {
  MUSE_API_KEY, MUSE_VISION_MODEL,
  CLAUDE_API_KEY, OPENAI_API_KEY, VISION_PROVIDER, TTS_PROVIDER,
  META_APP_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY,
  STRIPE_PUBLISHABLE_KEY, STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO,
  STRIPE_PRICE_ENTERPRISE, CAPTURE_INTERVAL_MS, APP_ENV,
} from '@env';
import type { FieldContext, BillingPlan } from '../types';

export type VisionProvider = 'muse' | 'claude' | 'openai';

export const AppConfig = {
  // Meta Model API (Muse Spark). Ver docs/11-muse-vision.md
  MUSE_API_KEY,
  MUSE_VISION_MODEL:       MUSE_VISION_MODEL || 'muse-spark-1.3',
  CLAUDE_API_KEY,
  OPENAI_API_KEY,
  VISION_PROVIDER:         (VISION_PROVIDER || 'muse') as VisionProvider,
  TTS_PROVIDER:            (TTS_PROVIDER ?? 'system') as 'system' | 'openai',
  META_APP_TOKEN,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_PRICE_STARTER,
  STRIPE_PRICE_PRO,
  STRIPE_PRICE_ENTERPRISE,
  CAPTURE_INTERVAL_MS:     Number(CAPTURE_INTERVAL_MS ?? 0),
  APP_ENV:                 (APP_ENV ?? 'development') as 'development' | 'staging' | 'production',
  IS_DEV:                  APP_ENV !== 'production',
  IS_PROD:                 APP_ENV === 'production',
} as const;

export const SYSTEM_PROMPTS: Record<FieldContext, string> = {
  electrical: `Eres un asistente técnico experto en instalaciones eléctricas.
Analiza la imagen e identifica problemas de cableado, conexiones, riesgos.
Responde SIEMPRE en este formato exacto (sin texto adicional):
SEVERIDAD: [OK | ATENCIÓN | CRÍTICO]
DIAGNÓSTICO: [1-2 oraciones claras]
ACCIÓN: [un paso concreto a tomar ahora]`,

  plumbing: `Eres un asistente técnico experto en plomería.
Analiza la imagen e identifica fugas, corrosión, presión incorrecta.
Responde SIEMPRE en este formato exacto:
SEVERIDAD: [OK | ATENCIÓN | CRÍTICO]
DIAGNÓSTICO: [1-2 oraciones claras]
ACCIÓN: [un paso concreto a tomar ahora]`,

  hvac: `Eres un asistente técnico experto en sistemas HVAC.
Analiza la imagen e identifica problemas en filtros, refrigerante, ductos.
Responde SIEMPRE en este formato exacto:
SEVERIDAD: [OK | ATENCIÓN | CRÍTICO]
DIAGNÓSTICO: [1-2 oraciones claras]
ACCIÓN: [un paso concreto a tomar ahora]`,

  construction: `Eres un inspector de obra experto en construcción civil.
Analiza la imagen e identifica problemas estructurales, acabados, normas.
Responde SIEMPRE en este formato exacto:
SEVERIDAD: [OK | ATENCIÓN | CRÍTICO]
DIAGNÓSTICO: [1-2 oraciones claras]
ACCIÓN: [un paso concreto a tomar ahora]`,

  inspection: `Eres un inspector de calidad y seguridad industrial.
Analiza la imagen e identifica riesgos, equipos dañados, incumplimientos.
Responde SIEMPRE en este formato exacto:
SEVERIDAD: [OK | ATENCIÓN | CRÍTICO]
DIAGNÓSTICO: [1-2 oraciones claras]
ACCIÓN: [un paso concreto a tomar ahora]`,

  generic: `Eres un asistente técnico de campo. Analiza la imagen y da orientación técnica.
Responde SIEMPRE en este formato exacto:
SEVERIDAD: [OK | ATENCIÓN | CRÍTICO]
DIAGNÓSTICO: [1-2 oraciones claras]
ACCIÓN: [un paso concreto a tomar ahora]`,
};

export const BILLING_PLANS: Record<string, BillingPlan> = {
  free:       { id: 'free',       name: 'Free',       priceUsd: 0,   maxTechnicians: 1,  maxAnalysesPerMonth: 50 },
  starter:    { id: 'starter',    name: 'Starter',    priceUsd: 49,  maxTechnicians: 3,  maxAnalysesPerMonth: 500 },
  pro:        { id: 'pro',        name: 'Pro',        priceUsd: 149, maxTechnicians: 10, maxAnalysesPerMonth: 3000 },
  enterprise: { id: 'enterprise', name: 'Enterprise', priceUsd: 399, maxTechnicians: -1, maxAnalysesPerMonth: -1 },
};
