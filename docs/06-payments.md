# 06 — Pagos (Stripe)

## Modelo de negocio

B2B SaaS: empresas pagan → asignan técnicos → técnicos usan la app.

| Plan | Precio | Técnicos | Análisis/mes |
|------|--------|----------|-------------|
| Free | $0 | 1 | 50 |
| Starter | $49/mes | 3 | 500 |
| Pro | $149/mes | 10 | 3,000 |
| Enterprise | $399/mes | ∞ | ∞ |

## Arquitectura

```
App móvil (Stripe SDK no instalado en v1.0)
    ↓ muestra planes → Alert "configurar Stripe"
Supabase Edge Function (create-subscription)
    ↓ stripe.subscriptions.create()
Stripe API
    ↓ Webhook
Supabase DB → actualiza plan de la empresa
```

## Instalación (roadmap v1.2)

```bash
npm install @stripe/stripe-react-native
cd ios && RCT_NEW_ARCH_ENABLED=1 bundle exec pod install && cd ..
```

En `App.tsx`:
```tsx
import { StripeProvider } from '@stripe/stripe-react-native';
// Envuelve <AppNavigator /> con <StripeProvider publishableKey={AppConfig.STRIPE_PUBLISHABLE_KEY}>
```

## Edge Function: create-subscription

```typescript
// supabase/functions/create-subscription/index.ts
import Stripe from 'npm:stripe@14';
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

Deno.serve(async (req) => {
  const { priceId, companyId } = await req.json();
  // obtener/crear customer → crear subscription con trial 14 días
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: 14,
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
  return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }));
});
```

## Webhook: activar/desactivar planes

```typescript
// supabase/functions/stripe-webhook/index.ts
// eventos: customer.subscription.created/updated/deleted, invoice.payment_failed
// → actualiza companies.plan y companies.subscription_status en Supabase
```

## Cupones de lanzamiento

```bash
# En Stripe Dashboard > Coupons > Create
# ID: LAUNCH50 | Discount: 50% | Duration: 6 months | Max redemptions: 20
```

---
---

