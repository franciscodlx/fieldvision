# 04 — API Integrations

## Mapa de servicios

```
FieldVision App
├── Claude Vision API (Anthropic)  — análisis de imágenes (provider principal)
├── OpenAI GPT-4o Vision           — análisis de imágenes (provider alternativo)
├── OpenAI TTS                     — voz premium (opcional, default: sistema)
├── Meta Wearables SDK             — conexión Ray-Ban Meta (TurboModule)
├── Supabase                       — auth + base de datos + storage
└── Stripe                         — suscripciones B2B
```

---

## Claude Vision API

**Endpoint**: `POST https://api.anthropic.com/v1/messages`
**Modelo**: `claude-sonnet-4-6` (balance costo/calidad) o `claude-opus-4-6` (máxima calidad)

**Headers**:
```
x-api-key: {CLAUDE_API_KEY}
anthropic-version: 2023-06-01
content-type: application/json
```

**Payload**:
```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 512,
  "system": "{SYSTEM_PROMPTS[context]}",
  "messages": [{
    "role": "user",
    "content": [
      {
        "type": "image",
        "source": {
          "type": "base64",
          "media_type": "image/jpeg",
          "data": "{frame.base64}"
        }
      },
      { "type": "text", "text": "Analiza esta imagen del técnico de campo." }
    ]
  }]
}
```

**Respuesta esperada** (estructurada por el system prompt):
```
SEVERIDAD: CRÍTICO
DIAGNÓSTICO: Cable neutro desconectado del tablero principal
ACCIÓN: Apagar el interruptor principal y reconectar el cable blanco al bus neutro
```

**Costo estimado** (Sonnet):
- Input imagen: ~750 tokens = ~$0.0023 por análisis
- 100 análisis/día × 30 días = ~$7/mes por técnico

**Rate limits y retry**:
```typescript
if (response.status === 429) {
  const retryAfter = Number(response.headers.get('retry-after') ?? '5');
  await new Promise(r => setTimeout(r, retryAfter * 1000));
  return retry();
}
```

**Docs**: https://docs.anthropic.com/en/api/messages

---

## OpenAI GPT-4o Vision

**Endpoint**: `POST https://api.openai.com/v1/chat/completions`
**Modelo**: `gpt-4o`

**Headers**:
```
Authorization: Bearer {OPENAI_API_KEY}
Content-Type: application/json
```

**Payload**:
```json
{
  "model": "gpt-4o",
  "max_tokens": 512,
  "messages": [
    { "role": "system", "content": "{SYSTEM_PROMPTS[context]}" },
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,{frame.base64}",
            "detail": "high"
          }
        },
        { "type": "text", "text": "Analiza esta imagen." }
      ]
    }
  ]
}
```

**Costo**: ~$2.50/1M tokens input, ~$10/1M tokens output

---

## OpenAI TTS (opcional)

Solo se usa si `TTS_PROVIDER=openai` en `.env`. Por default usa TTS del sistema (gratis).

**Endpoint**: `POST https://api.openai.com/v1/audio/speech`

```json
{
  "model": "tts-1",
  "input": "Cable suelto detectado. Apagar el tablero.",
  "voice": "alloy",
  "response_format": "mp3"
}
```

**Costo**: $15/1M caracteres
**Voces**: alloy, echo, fable, onyx, nova, shimmer

---

## Supabase

**SDK**: `@supabase/supabase-js` — versión actual `^2.46.0`

```bash
npm install @supabase/supabase-js@^2.46.0
```

**Inicialización** (`src/shared/config/supabase.ts`):
```typescript
import { createClient } from '@supabase/supabase-js';
import { AppConfig } from './index';

export const supabase = createClient(
  AppConfig.SUPABASE_URL,
  AppConfig.SUPABASE_ANON_KEY,
);
```

**Schema de base de datos** (ejecutar en Supabase SQL Editor):
```sql
-- Empresas (clientes B2B)
create table companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  plan        text not null default 'free',   -- free | starter | pro | enterprise
  stripe_customer_id text,
  subscription_status text default 'inactive',
  analyses_used_this_month int default 0,
  created_at  timestamptz default now()
);

-- Técnicos
create table technicians (
  id          uuid primary key references auth.users,
  company_id  uuid references companies,
  name        text not null,
  role        text default 'technician',   -- technician | supervisor | admin
  created_at  timestamptz default now()
);

-- Sesiones de trabajo
create table sessions (
  id              uuid primary key default gen_random_uuid(),
  technician_id   uuid references technicians,
  device_id       text,
  context         text not null,
  started_at      timestamptz default now(),
  ended_at        timestamptz,
  analyses_count  int default 0
);

-- Análisis
create table analyses (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid references sessions,
  technician_id   uuid references technicians,
  severity        text not null,     -- info | warning | critical
  summary         text not null,
  details         text,
  action_items    text[],
  confidence      float,
  frame_url       text,
  analyzed_at     timestamptz default now()
);
```

**Row Level Security** (ejecutar después del schema):
```sql
alter table analyses enable row level security;
alter table sessions enable row level security;
alter table technicians enable row level security;

-- Técnicos solo ven sus propios datos
create policy "technicians_own_data" on analyses
  for all using (technician_id = auth.uid());

create policy "technicians_own_sessions" on sessions
  for all using (technician_id = auth.uid());
```

**Storage** (para guardar frames):
```sql
-- En Supabase Dashboard > Storage > New bucket
-- Nombre: frames, Public: false
```

**Docs**: https://supabase.com/docs

---

## TanStack Query v5 — Patrones para FieldVision

> ⚠️ `isLoading` fue renombrado a `isPending` en v5. `isInitialLoading` fue removido.

```typescript
import { useQuery, useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Setup en App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutos
      retry: 2,
    },
  },
});

// En componentes — usar isPending no isLoading
const { data, isPending, error } = useQuery({
  queryKey: ['analyses', sessionId],
  queryFn: () => supabase.from('analyses').select('*').eq('session_id', sessionId),
  enabled: !!sessionId,
});

// Mutations — objeto único en v5
const { mutate, isPending: isSaving } = useMutation({
  mutationFn: (analysis: VisionAnalysis) =>
    supabase.from('analyses').insert(analysis),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['analyses'] }),
});
```

---

## Costos mensuales estimados por técnico (100 análisis/día)

| Servicio | Costo/mes |
|----------|----------|
| Claude Vision (Sonnet) | ~$7 |
| OpenAI TTS premium (opcional) | ~$0.50 |
| Supabase Pro (compartido, todos los clientes) | $25 total |
| Stripe fees (2.9% + $0.30/transacción) | varía |
| **Total infra por técnico** | **~$8-10** |

Con precio de $79/mes → margen bruto ~88%.
