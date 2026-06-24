# 09 — Variables de entorno

## .env.example

```env
# ══════════════════════════════════════════════
# FIELDVISION — copia esto como .env y rellena
# NUNCA subas .env a Git
# ══════════════════════════════════════════════

APP_ENV=development

# IA Vision
VISION_PROVIDER=claude
CLAUDE_API_KEY=
OPENAI_API_KEY=

# TTS
TTS_PROVIDER=system

# Meta Wearables
META_APP_TOKEN=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Stripe
STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_PRO=
STRIPE_PRICE_ENTERPRISE=

# App
CAPTURE_INTERVAL_MS=0
```

## AppConfig (validado con Zod)

```typescript
// src/shared/config/index.ts
import {
  CLAUDE_API_KEY, OPENAI_API_KEY, VISION_PROVIDER,
  TTS_PROVIDER, META_APP_TOKEN, SUPABASE_URL,
  SUPABASE_ANON_KEY, STRIPE_PUBLISHABLE_KEY,
  STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO,
  STRIPE_PRICE_ENTERPRISE, CAPTURE_INTERVAL_MS,
  APP_ENV,
} from '@env';
import { z } from 'zod';
import type { FieldContext, BillingPlan } from '../types';

// Validación con Zod — falla rápido si falta algo crítico
const envSchema = z.object({
  CLAUDE_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  VISION_PROVIDER: z.enum(['claude', 'openai']).default('claude'),
  TTS_PROVIDER: z.enum(['system', 'openai']).default('system'),
  META_APP_TOKEN: z.string(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  STRIPE_PUBLISHABLE_KEY: z.string(),
  STRIPE_PRICE_STARTER: z.string(),
  STRIPE_PRICE_PRO: z.string(),
  STRIPE_PRICE_ENTERPRISE: z.string(),
  CAPTURE_INTERVAL_MS: z.coerce.number().default(0),
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

// En desarrollo: usar safeParse y mostrar warnings; en producción: parse estricto
const parsed = __DEV__
  ? envSchema.safeParse({ CLAUDE_API_KEY, OPENAI_API_KEY, VISION_PROVIDER, TTS_PROVIDER,
      META_APP_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY, STRIPE_PUBLISHABLE_KEY,
      STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, STRIPE_PRICE_ENTERPRISE,
      CAPTURE_INTERVAL_MS, APP_ENV })
  : { success: true, data: envSchema.parse({ CLAUDE_API_KEY, OPENAI_API_KEY, VISION_PROVIDER,
      TTS_PROVIDER, META_APP_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY, STRIPE_PUBLISHABLE_KEY,
      STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, STRIPE_PRICE_ENTERPRISE,
      CAPTURE_INTERVAL_MS, APP_ENV }) };

const env = parsed.success ? parsed.data : {
  CLAUDE_API_KEY, OPENAI_API_KEY, VISION_PROVIDER: 'claude' as const,
  TTS_PROVIDER: 'system' as const, META_APP_TOKEN, SUPABASE_URL,
  SUPABASE_ANON_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_PRICE_STARTER,
  STRIPE_PRICE_PRO, STRIPE_PRICE_ENTERPRISE, CAPTURE_INTERVAL_MS: 0,
  APP_ENV: 'development' as const,
};

export const AppConfig = {
  ...env,
  IS_DEV:  env.APP_ENV !== 'production',
  IS_PROD: env.APP_ENV === 'production',
} as const;
```

## .gitignore

```
.env
.env.local
.env.staging
.env.production
android/app/*.keystore
ios/vendor/
coverage/
build/generated/
```

---
---

