# 01 — Arquitectura

## Principios

FieldVision usa **DDD (Domain-Driven Design)** con separación estricta de capas.
La regla de oro: **las capas internas no conocen a las externas**.

```
┌────────────────────────────────────────────────┐
│              PRESENTATION                      │
│  Screens + Hooks — orquestan, no tienen lógica │
├────────────────────────────────────────────────┤
│              APPLICATION                       │
│  Use Cases — lógica de negocio pura            │
├────────────────────────────────────────────────┤
│               DOMAIN                           │
│  Entities + Repository Interfaces              │
├────────────────────────────────────────────────┤
│            INFRASTRUCTURE                      │
│  TurboModules + API Services                   │
└────────────────────────────────────────────────┘
```

---

## Nueva Arquitectura de React Native (0.84)

La arquitectura vieja (Bridge) fue eliminada en RN 0.82.
FieldVision usa la **Nueva Arquitectura** desde el día uno:

```
JavaScript (Hermes V1)
      │
      │  TurboModuleRegistry.get('NativeMetaGlasses')
      │  — llamada SÍNCRONA vía JSI, sin serialización JSON
      ▼
JSI (JavaScript Interface) — C++
      │
      ▼
TurboModule (lazy-loaded, type-safe via CodeGen)
      │
      ├── iOS:     MetaGlassesModule.mm  (implementa NativeMetaGlassesSpec)
      └── Android: MetaGlassesModule.kt  (implementa NativeMetaGlassesCxxSpec)
            │
            ▼
      Meta Wearables SDK (mock en dev, real en producción)
            │
            ▼
      Ray-Ban Meta Hardware
```

### Por qué esto importa para FieldVision

El análisis de frames es sensible a la latencia. Con la arquitectura vieja:
- Capturar un frame → serializar a JSON → pasar por el Bridge → deserializar: ~18ms overhead
- Con TurboModules + JSI: llamada directa en C++, overhead < 0.5ms

Para streaming de video (30fps), esa diferencia es la que hace que los frames lleguen a tiempo.

---

## Estructura de archivos

```
fieldvision/
├── CLAUDE.md
├── App.tsx
├── package.json                    ← codegenConfig apunta a src/specs/
├── src/
│   ├── specs/
│   │   └── NativeMetaGlasses.ts   ← TurboModule spec (fuente de verdad CodeGen)
│   ├── modules/
│   │   ├── glasses/
│   │   │   ├── domain/
│   │   │   │   ├── entities/GlassesDevice.ts
│   │   │   │   └── repositories/IGlassesRepository.ts
│   │   │   ├── application/use-cases/
│   │   │   │   └── ConnectGlassesUseCase.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── native/MetaGlassesNative.ts  ← wrapper JS del TurboModule
│   │   │   │   └── services/MetaGlassesRepository.ts
│   │   │   └── presentation/
│   │   │       ├── hooks/useFieldVision.ts
│   │   │       └── screens/
│   │   │           ├── DashboardScreen.tsx
│   │   │           ├── SettingsScreen.tsx
│   │   │           └── HistoryScreen.tsx
│   │   ├── vision/
│   │   │   ├── application/use-cases/AnalyzeFrameUseCase.ts
│   │   │   └── infrastructure/services/VisionAIService.ts
│   │   └── billing/
│   │       └── presentation/screens/PlansScreen.tsx
│   ├── navigation/AppNavigator.tsx
│   └── shared/
│       ├── config/index.ts         ← AppConfig validado con Zod
│       ├── hooks/useAppStore.ts    ← Zustand 5
│       └── types/index.ts
├── ios/FieldVision/
│   ├── NativeMetaGlasses/
│   │   ├── MetaGlassesModule.h
│   │   └── MetaGlassesModule.mm    ← implementación iOS (Obj-C++)
│   └── AppDelegate.swift
└── android/app/src/main/java/com/fieldvision/
    ├── MetaGlassesModule.kt        ← implementación Android
    ├── MetaGlassesPackage.kt
    └── MainApplication.kt
```

---

## Módulos de la app

### `glasses` — todo relacionado con los lentes

La entidad `GlassesDevice` es inmutable (patrón Value Object):
```typescript
const device = GlassesDevice.create({ id, model, firmwareVersion });
const connected = device.withSession(session);  // retorna nueva instancia
// device sigue con status 'disconnected' — original intacto
```

El contrato `IGlassesRepository` vive en dominio. La implementación `MetaGlassesRepository`
vive en infraestructura. Los use-cases solo conocen el contrato — nunca la implementación.

### `vision` — análisis de IA

`VisionAIService` soporta dos providers (configurable via `.env`):
- `claude` → `POST https://api.anthropic.com/v1/messages` (modelo `claude-sonnet-4-6`)
- `openai` → `POST https://api.openai.com/v1/chat/completions` (modelo `gpt-4o`)

El parsing de respuestas extrae el formato estructurado SEVERIDAD / DIAGNÓSTICO / ACCIÓN
que definen los system prompts en `AppConfig.SYSTEM_PROMPTS`.

### `billing` — planes y pagos

`PlansScreen` muestra los planes pero **no integra Stripe SDK** todavía (roadmap v1.2).
Al presionar un plan, muestra Alert con instrucción de setup.
Ver `docs/06-payments.md` para la implementación completa de Stripe.

---

## Zustand 5 — store global

```typescript
import { create } from 'zustand';  // Zustand 5 — misma API que v4 para create()

// Acceso en cualquier componente:
const { isConnected, currentAnalysis } = useAppStore();
// O desde el hook principal que orquesta todo:
const { isConnected, captureAndAnalyze } = useFieldVision();
```

**Cambios de Zustand 4 → 5 que afectan este proyecto:**
- `create` sigue siendo la misma función — no hay cambios de API en el uso básico
- El middleware `immer` y `persist` tienen nuevas firmas de tipos
- `shallow` se importa de `zustand/shallow` en v5 (antes de `zustand`)

---

## TanStack Query v5 — fetching de datos

```typescript
// v5: isPending en lugar de isLoading
const { data, isPending, error } = useQuery({
  queryKey: ['analyses', sessionId],
  queryFn: () => fetchAnalyses(sessionId),
});

// v5: useMutation recibe objeto único
const { mutate } = useMutation({
  mutationFn: (frame: CameraFrame) => analyzeFrame(frame),
});
```

---

## React Navigation v7 — cambios de API relevantes

```typescript
// v7: popToTopOnBlur reemplaza a unmountOnBlur
<Tab.Screen
  options={{ popToTopOnBlur: true }}  // ← nuevo en v7
/>

// v7: el tipo del stack se usa diferente
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;
```

---

## Diagrama de dependencias

```
presentation  ──→  application
application   ──→  domain
infrastructure ──implementa──→  domain (interfaces)
presentation  ──usa──→  infrastructure (via DI en hooks)

❌ domain NUNCA importa de infrastructure o presentation
❌ application NUNCA importa de presentation
❌ presentation NUNCA llama APIs o TurboModules directamente
```
