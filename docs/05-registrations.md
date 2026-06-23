# 05 — Registros y claves API

> Sigue el orden. Algunos servicios dependen de otros.

## Checklist

```
[ ] 1. Apple Developer Account
[ ] 2. Google Play Developer Account
[ ] 3. Meta Developer + Wearables SDK
[ ] 4. Anthropic (Claude API)
[ ] 5. OpenAI (GPT-4o + TTS)
[ ] 6. Supabase (backend)
[ ] 7. Stripe (pagos)
[ ] 8. GitHub Personal Access Token (para Meta SDK Android)
```

---

## 1. Apple Developer Account

**URL**: https://developer.apple.com/programs/
**Costo**: $99 USD/año

1. Ir a https://developer.apple.com/programs/enroll/
2. Login con Apple ID → selecciona Individual u Organization
3. Acepta Developer Agreement → paga $99
4. Espera 24-48h para activación

**Configurar en Xcode**:
- Xcode > Settings > Accounts > + > Apple ID
- En el proyecto: Signing & Capabilities > Team → selecciona tu cuenta

**Bundle ID**: `com.fieldvision.app`
Regístralo en https://developer.apple.com/account/resources/identifiers/list

---

## 2. Google Play Developer Account

**URL**: https://play.google.com/console/signup
**Costo**: $25 USD (pago único)

1. Login con cuenta Google → acepta Developer Distribution Agreement
2. Paga $25 → completa información del developer
3. Verificación: 1-3 días hábiles

**Package name**: `com.fieldvision.app`

**Generar keystore de firma**:
```bash
keytool -genkeypair -v \
  -storefile fieldvision-release.keystore \
  -alias fieldvision \
  -keyalg RSA -keysize 2048 -validity 10000
```
> Guarda el keystore en lugar seguro. Nunca lo subas a Git.

---

## 3. Meta Developer + Wearables SDK

### 3a. Cuenta Meta Developer

**URL**: https://developers.meta.com/
**Costo**: Gratis

1. Login con cuenta Facebook/Meta
2. Acepta Meta Platform Terms
3. Verifica teléfono si se requiere

### 3b. Meta Wearables Developer Center

**URL**: https://developer.meta.com/wearables/

1. Clic "Join the developer preview"
2. Completa el formulario (nombre app, descripción, uso, país)
3. Espera aprobación (1-5 días hábiles)

### 3c. Crear organización y proyecto

1. Ir a https://wearables.developer.meta.com/
2. Crear organización → crear proyecto
3. Registrar Bundle IDs: `com.fieldvision.app`
4. **Copiar App Token** → pegar en `.env` como `META_APP_TOKEN`

### 3d. GitHub Personal Access Token (para Android)

El SDK de Android se distribuye vía GitHub Packages:
1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. New token → nombre: `fieldvision-meta-sdk` → scope: `read:packages`
3. Copia el token `ghp_...`
4. Agrega en `~/.gradle/gradle.properties`:
```properties
gpr.user=TU_GITHUB_USERNAME
gpr.key=ghp_TU_TOKEN
```

---

## 4. Anthropic — Claude API

**URL**: https://console.anthropic.com/
**Costo**: Pay-per-use

1. Ir a https://console.anthropic.com/ → Sign Up
2. Verifica email → completa onboarding
3. **Agrega pago**: Settings > Billing > Add payment method (mínimo $5)
4. **Crear API Key**: API Keys > Create Key → nombre: `fieldvision-production`
5. Copia `sk-ant-api03-...` inmediatamente (no se vuelve a mostrar)
6. Pega en `.env` como `CLAUDE_API_KEY`

**Configurar límites de gasto**: Settings > Billing > Usage limits → $50/mes recomendado mientras desarrollas

**Verificar**:
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $CLAUDE_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-haiku-4-5-20251001","max_tokens":10,"messages":[{"role":"user","content":"hola"}]}'
```

---

## 5. OpenAI

**URL**: https://platform.openai.com/
**Costo**: Pay-per-use

1. Ir a https://platform.openai.com/signup → crea cuenta
2. Verifica teléfono
3. **Agrega créditos**: Billing > Add to credit balance (mínimo $5)
4. **Crear API Key**: API Keys > Create new secret key → nombre: `fieldvision-production`
5. Copia `sk-proj-...` inmediatamente
6. Pega en `.env` como `OPENAI_API_KEY`

---

## 6. Supabase

**URL**: https://supabase.com/
**Costo**: Free tier + Pro $25/mes cuando crezcas

1. Ir a https://supabase.com/ → Sign up con GitHub
2. Crear organización → crear proyecto:
   - Nombre: `fieldvision-production`
   - Región: South America (São Paulo) — más cercano a México
   - Plan: Free (migrar a Pro cuando tengas clientes)
3. Espera ~2 min de inicialización
4. **Obtener claves**: Settings > API
   - `Project URL` → `.env` como `SUPABASE_URL`
   - `anon public` → `.env` como `SUPABASE_ANON_KEY`
   - `service_role` → guardar **solo en backend** (Supabase Edge Functions)
5. **Ejecutar schema**: SQL Editor → pegar SQL de `docs/04-api-integrations.md`
6. **Crear bucket**: Storage > New bucket → nombre: `frames`, Public: false

---

## 7. Stripe

**URL**: https://dashboard.stripe.com/register
**Costo**: 2.9% + $0.30 por transacción

### 7a. Crear cuenta
1. Registro con email, nombre, país: México
2. Verifica email → completa onboarding del negocio

### 7b. Activar para pagos reales
1. Settings > Business settings → completa información del negocio + CLABE
2. Tiempo de activación: 1-5 días hábiles
3. **Para desarrollo**: usa modo Test (toggle en Dashboard) — no requiere activación

### 7c. Crear productos

En Stripe Dashboard (modo Test primero):

**Starter** ($49/mes):
1. Products > + Add product → Nombre: "FieldVision Starter"
2. Pricing: Recurring, $49 USD/mes
3. Copia el `price_id` → `.env` como `STRIPE_PRICE_STARTER`

**Pro** ($149/mes):
1. Products > + Add product → Nombre: "FieldVision Pro"
2. Pricing: Recurring, $149 USD/mes
3. Copia el `price_id` → `.env` como `STRIPE_PRICE_PRO`

**Enterprise** ($399/mes):
1. Similar → `.env` como `STRIPE_PRICE_ENTERPRISE`

### 7d. API Keys
1. Developers > API keys
2. **Test mode**: copia `pk_test_...` → `.env` como `STRIPE_PUBLISHABLE_KEY`
3. `sk_test_...` → **SOLO en Supabase Edge Functions** (nunca en la app)

### 7e. Webhooks
1. Developers > Webhooks > Add endpoint
2. URL: `https://TU_SUPABASE_URL/functions/v1/stripe-webhook`
3. Eventos:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copia `whsec_...` → Secret en Supabase Edge Functions

---

## Resumen final del .env

```env
CLAUDE_API_KEY=sk-ant-api03-XXXX
OPENAI_API_KEY=sk-proj-XXXX
VISION_PROVIDER=claude
TTS_PROVIDER=system
META_APP_TOKEN=meta_wearables_XXXX
SUPABASE_URL=https://XXXX.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXX
STRIPE_PRICE_STARTER=price_XXXX
STRIPE_PRICE_PRO=price_XXXX
STRIPE_PRICE_ENTERPRISE=price_XXXX
APP_ENV=production
CAPTURE_INTERVAL_MS=0
```

---

## Seguridad de claves

| Variable | En App | En Backend | En Git |
|----------|--------|-----------|--------|
| `CLAUDE_API_KEY` | ✅ (bundled) | ❌ | ❌ |
| `OPENAI_API_KEY` | ✅ (bundled) | ❌ | ❌ |
| `META_APP_TOKEN` | ✅ (bundled) | ❌ | ❌ |
| `SUPABASE_ANON_KEY` | ✅ (diseño) | ✅ | ❌ |
| `STRIPE_PUBLISHABLE_KEY` | ✅ (diseño) | ✅ | ❌ |
| `SUPABASE_SERVICE_KEY` | ❌ NUNCA | ✅ solo | ❌ |
| `STRIPE_SECRET_KEY` | ❌ NUNCA | ✅ solo | ❌ |

> Las keys bundled en la app son visibles si alguien hace ingeniería inversa del APK/IPA.
> Para producción a escala, considera proxear las llamadas de IA a través de Supabase Edge Functions.
