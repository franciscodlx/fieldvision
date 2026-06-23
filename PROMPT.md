# FieldVision — Instrucciones de construcción para Claude Code (Abril 2026)

Eres un agente de construcción autónomo. Construye **FieldVision** desde cero,
sin pausas, sin pedir confirmación, sin esperar API keys reales.

---

## REGLAS DE EJECUCIÓN

1. **No pares a preguntar** — si algo es ambiguo, toma la decisión más razonable.
2. **No pidas API keys** — usa los PLACEHOLDERS de la sección ENTORNO.
3. **Si `pod install` o `npm install` falla** — registra en `BUILD_LOG.md` y continúa.
4. **Corrige tests que fallen** antes de pasar a la siguiente fase.
5. **Al terminar** — escribe `BUILD_COMPLETE.md` con el resumen.
6. **Trabaja en el orden exacto** — hay dependencias entre fases.

---

## STACK EXACTO (versiones verificadas en npm, abril 2026)

| Paquete | Versión | Nota |
|---------|---------|------|
| react-native | 0.84.1 | Hermes V1, Nueva Arquitectura |
| react | 18.3.1 | par requerido por RN 0.84 |
| typescript | 6.0.2 | `moduleResolution: bundler` |
| zustand | 5.0.12 | `create` de `'zustand'` |
| @tanstack/react-query | 5.96.2 | usa `isPending` no `isLoading` |
| @react-navigation/native | 7.2.2 | usa `popToTopOnBlur` no `unmountOnBlur` |
| @react-navigation/native-stack | 7.3.2 | |
| react-native-safe-area-context | 4.12.0 | |
| react-native-screens | 4.4.0 | |
| react-native-permissions | 4.3.4 | |
| react-native-dotenv | 3.4.11 | Babel plugin para .env |
| zod | 3.24.1 | validar env vars |
| axios | 1.7.9 | |
| @supabase/supabase-js | 2.46.0 | para v1.1 |

> ⚠️ NO usar `react-native-config` — no mantiene soporte para RN 0.84+.
> ⚠️ NO usar `NativeModules.X` ni `RCTBridgeModule` — la arquitectura Bridge fue eliminada en RN 0.82.
> ✅ Usar `TurboModuleRegistry.getEnforcing<Spec>('NativeMetaGlasses')` para el módulo nativo.

---

## PLACEHOLDERS DE ENTORNO

Usa estos valores exactos. Nunca vacío.

```
CLAUDE_API_KEY=sk-ant-PLACEHOLDER-reemplazar-antes-de-produccion
OPENAI_API_KEY=sk-openai-PLACEHOLDER-reemplazar-antes-de-produccion
META_APP_TOKEN=meta-wearables-PLACEHOLDER-reemplazar-antes-de-produccion
SUPABASE_URL=https://placeholder.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.PLACEHOLDER
STRIPE_PUBLISHABLE_KEY=pk_test_PLACEHOLDER-reemplazar-antes-de-produccion
STRIPE_PRICE_STARTER=price_PLACEHOLDER_starter
STRIPE_PRICE_PRO=price_PLACEHOLDER_pro
STRIPE_PRICE_ENTERPRISE=price_PLACEHOLDER_enterprise
APP_ENV=development
VISION_PROVIDER=claude
TTS_PROVIDER=system
CAPTURE_INTERVAL_MS=0
```

---

## FASE 1 — Proyecto React Native

```bash
npx @react-native-community/cli@latest init FieldVision \
  --version 0.84.1 \
  --skip-install \
  --directory fieldvision

cd fieldvision
```

> El template de RN 0.84 ya incluye `newArchEnabled=true` en `android/gradle.properties`
> y `RCT_NEW_ARCH_ENABLED=1` en el Podfile. No modificar estos valores.

---

## FASE 2 — Estructura de carpetas

```bash
mkdir -p \
  src/specs \
  src/modules/glasses/domain/entities \
  src/modules/glasses/domain/repositories \
  src/modules/glasses/application/use-cases \
  src/modules/glasses/infrastructure/native \
  src/modules/glasses/infrastructure/services \
  src/modules/glasses/presentation/hooks \
  src/modules/glasses/presentation/screens \
  src/modules/glasses/presentation/components \
  src/modules/vision/application/use-cases \
  src/modules/vision/infrastructure/services \
  src/modules/billing/presentation/screens \
  src/modules/auth/presentation/screens \
  src/shared/config \
  src/shared/hooks \
  src/shared/types \
  src/shared/utils \
  src/types \
  src/navigation \
  ios/FieldVision/NativeMetaGlasses \
  android/app/src/main/java/com/fieldvision \
  __tests__/unit \
  __tests__/integration \
  __tests__/components \
  docs
```

---

## FASE 3 — Archivos de entorno

Crea `.env` con los placeholders de arriba.
Crea `.env.example` con los mismos valores (este sí va a Git).
Crea `.env.test` con los mismos placeholders más `APP_ENV=test`.

Asegúrate de que `.gitignore` incluye:
```
.env
.env.local
.env.staging
.env.production
android/app/*.keystore
ios/vendor/
build/generated/
coverage/
```

---

## FASE 4 — package.json

Reemplaza el `package.json` generado con este:

```json
{
  "name": "fieldvision",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --passWithNoTests",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx --max-warnings 0",
    "lint:fix": "eslint src --ext .ts,.tsx --fix"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-native": "0.84.1",
    "@react-navigation/native": "^7.2.2",
    "@react-navigation/native-stack": "^7.3.2",
    "react-native-safe-area-context": "^4.12.0",
    "react-native-screens": "^4.4.0",
    "react-native-permissions": "^4.3.4",
    "@tanstack/react-query": "^5.96.2",
    "zustand": "^5.0.12",
    "zod": "^3.24.1",
    "axios": "^1.7.9"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@babel/preset-env": "^7.25.0",
    "@babel/runtime": "^7.25.0",
    "@react-native/babel-preset": "^0.84.0",
    "@react-native/eslint-config": "^0.84.0",
    "@react-native/metro-config": "^0.84.0",
    "@react-native/typescript-config": "^0.84.0",
    "@testing-library/jest-native": "^5.4.3",
    "@testing-library/react-native": "^12.9.0",
    "@types/jest": "^29.5.14",
    "@types/react": "^18.3.12",
    "babel-jest": "^29.7.0",
    "eslint": "^8.57.0",
    "husky": "^9.1.7",
    "jest": "^29.7.0",
    "react-native-dotenv": "^3.4.11",
    "typescript": "^6.0.2"
  },
  "codegenConfig": {
    "name": "FieldVisionSpec",
    "type": "modules",
    "jsSrcsDir": "src/specs",
    "android": {
      "javaPackageName": "com.fieldvision"
    }
  },
  "jest": {
    "preset": "react-native",
    "setupFilesAfterFramework": [
      "@testing-library/jest-native/extend-expect",
      "./__tests__/setup.ts"
    ],
    "moduleNameMapper": {
      "^@modules/(.*)$": "<rootDir>/src/modules/$1",
      "^@shared/(.*)$": "<rootDir>/src/shared/$1",
      "^@navigation/(.*)$": "<rootDir>/src/navigation/$1",
      "^@specs/(.*)$": "<rootDir>/src/specs/$1",
      "^@env$": "<rootDir>/__mocks__/env.ts"
    },
    "transformIgnorePatterns": [
      "node_modules/(?!(react-native|@react-native|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-permissions)/)"
    ]
  }
}
```

Luego:
```bash
npm install
```

---

## FASE 5 — tsconfig.json

```json
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "target": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@modules/*": ["src/modules/*"],
      "@shared/*": ["src/shared/*"],
      "@navigation/*": ["src/navigation/*"],
      "@specs/*": ["src/specs/*"],
      "@env": ["src/types/env.d.ts"]
    }
  },
  "include": ["src", "__tests__", "App.tsx"],
  "exclude": ["node_modules", "android", "ios"]
}
```

---

## FASE 6 — babel.config.js

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      safe: false,
      allowUndefined: true,
    }],
  ],
};
```

---

## FASE 7 — Tipos de entorno

### `src/types/env.d.ts`

```typescript
declare module '@env' {
  export const CLAUDE_API_KEY: string;
  export const OPENAI_API_KEY: string;
  export const VISION_PROVIDER: string;
  export const TTS_PROVIDER: string;
  export const META_APP_TOKEN: string;
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
  export const STRIPE_PUBLISHABLE_KEY: string;
  export const STRIPE_PRICE_STARTER: string;
  export const STRIPE_PRICE_PRO: string;
  export const STRIPE_PRICE_ENTERPRISE: string;
  export const CAPTURE_INTERVAL_MS: string;
  export const APP_ENV: string;
}
```

### `__mocks__/env.ts` (para Jest — react-native-dotenv no funciona en Jest)

```typescript
export const CLAUDE_API_KEY = 'sk-ant-PLACEHOLDER-test';
export const OPENAI_API_KEY = 'sk-openai-PLACEHOLDER-test';
export const VISION_PROVIDER = 'claude';
export const TTS_PROVIDER = 'system';
export const META_APP_TOKEN = 'meta-PLACEHOLDER-test';
export const SUPABASE_URL = 'https://placeholder.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJPLACEHOLDER';
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_PLACEHOLDER';
export const STRIPE_PRICE_STARTER = 'price_PLACEHOLDER_starter';
export const STRIPE_PRICE_PRO = 'price_PLACEHOLDER_pro';
export const STRIPE_PRICE_ENTERPRISE = 'price_PLACEHOLDER_enterprise';
export const CAPTURE_INTERVAL_MS = '0';
export const APP_ENV = 'test';
```

---

## FASE 8 — Tipos compartidos

### `src/shared/types/index.ts`

```typescript
export type GlassesConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface GlassesSession {
  id: string;
  deviceId: string;
  startedAt: Date;
  status: GlassesConnectionStatus;
}

export interface CameraFrame {
  base64: string;
  width: number;
  height: number;
  timestamp: number;
}

export type AnalysisSeverity = 'info' | 'warning' | 'critical';

export interface VisionAnalysis {
  id: string;
  summary: string;
  details: string;
  severity: AnalysisSeverity;
  actionItems: string[];
  confidence: number;
  analyzedAt: Date;
  frameRef?: string;
}

export type FieldContext =
  | 'electrical' | 'plumbing' | 'hvac'
  | 'construction' | 'inspection' | 'generic';

export interface FieldVisionConfig {
  context: FieldContext;
  technicianName: string;
  companyName?: string;
  language: 'es' | 'en';
  autoCapture: boolean;
  captureIntervalMs: number;
}

export interface BillingPlan {
  id: 'starter' | 'pro' | 'enterprise' | 'free';
  name: string;
  priceUsd: number;
  maxTechnicians: number;
  maxAnalysesPerMonth: number;
}
```

---

## FASE 9 — TurboModule Spec

### `src/specs/NativeMetaGlasses.ts`

> ⚠️ Este archivo DEBE llamarse `Native[Nombre].ts` para que CodeGen lo procese.
> Solo se permiten tipos primitivos: string, number, boolean, null, Object simple, Array, Promise<T>.

```typescript
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface SessionData {
  id: string;
  deviceId: string;
  startedAt: string;   // ISO 8601 — Date no está soportada en specs
  firmwareVersion: string;
  model: string;
}

export interface FrameData {
  base64: string;
  width: number;
  height: number;
  timestamp: number;
}

export interface Spec extends TurboModule {
  startSession(): Promise<SessionData>;
  endSession(sessionId: string): Promise<void>;
  capturePhoto(): Promise<FrameData>;
  startVideoStream(): Promise<void>;
  stopVideoStream(): Promise<void>;
  speakText(text: string): Promise<void>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeMetaGlasses');
```

---

## FASE 10 — Configuración global

### `src/shared/config/index.ts`

```typescript
import {
  CLAUDE_API_KEY, OPENAI_API_KEY, VISION_PROVIDER, TTS_PROVIDER,
  META_APP_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY,
  STRIPE_PUBLISHABLE_KEY, STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO,
  STRIPE_PRICE_ENTERPRISE, CAPTURE_INTERVAL_MS, APP_ENV,
} from '@env';
import type { FieldContext, BillingPlan } from '../types';

export const AppConfig = {
  CLAUDE_API_KEY,
  OPENAI_API_KEY,
  VISION_PROVIDER:         (VISION_PROVIDER ?? 'claude') as 'claude' | 'openai',
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
```

---

## FASE 11 — Store Zustand 5

### `src/shared/hooks/useAppStore.ts`

> Zustand 5: `import { create } from 'zustand'` — misma API para stores básicos.
> `shallow` ahora se importa de `'zustand/shallow'` (no de `'zustand'`).

```typescript
import { create } from 'zustand';
import type {
  GlassesConnectionStatus, GlassesSession,
  VisionAnalysis, FieldVisionConfig,
} from '../types';

interface GlassesSlice {
  connectionStatus: GlassesConnectionStatus;
  session: GlassesSession | null;
  setConnectionStatus: (s: GlassesConnectionStatus) => void;
  setSession: (s: GlassesSession | null) => void;
}

interface VisionSlice {
  analyses: VisionAnalysis[];
  currentAnalysis: VisionAnalysis | null;
  isAnalyzing: boolean;
  addAnalysis: (a: VisionAnalysis) => void;
  setCurrentAnalysis: (a: VisionAnalysis | null) => void;
  setIsAnalyzing: (v: boolean) => void;
  clearHistory: () => void;
}

interface ConfigSlice {
  config: FieldVisionConfig;
  setConfig: (partial: Partial<FieldVisionConfig>) => void;
}

type AppStore = GlassesSlice & VisionSlice & ConfigSlice;

export const useAppStore = create<AppStore>((set) => ({
  // Glasses
  connectionStatus: 'disconnected',
  session: null,
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setSession: (session) => set({ session }),

  // Vision
  analyses: [],
  currentAnalysis: null,
  isAnalyzing: false,
  addAnalysis: (analysis) => set((state) => ({
    analyses: [analysis, ...state.analyses].slice(0, 50),
    currentAnalysis: analysis,
  })),
  setCurrentAnalysis: (currentAnalysis) => set({ currentAnalysis }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  clearHistory: () => set({ analyses: [], currentAnalysis: null }),

  // Config
  config: {
    context: 'electrical',
    technicianName: 'Técnico',
    language: 'es',
    autoCapture: false,
    captureIntervalMs: 5000,
  },
  setConfig: (partial) => set((state) => ({ config: { ...state.config, ...partial } })),
}));
```

---

## FASE 12 — Dominio

### `src/modules/glasses/domain/entities/GlassesDevice.ts`

Entidad inmutable:
- Constructor `private`
- `GlassesDevice.create({ id, model, firmwareVersion })` → status: 'disconnected', session: null
- Getters: `status`, `isConnected`, `isReady` (connected AND session !== null)
- `withStatus(status)` → nueva instancia
- `withSession(session)` → nueva instancia con status 'connected'

### `src/modules/glasses/domain/repositories/IGlassesRepository.ts`

Interfaz pura (cero imports de infra):
```typescript
import type { CameraFrame, GlassesSession } from '@shared/types';
import type { GlassesDevice } from '../entities/GlassesDevice';

export interface IGlassesRepository {
  startSession(): Promise<GlassesSession>;
  endSession(sessionId: string): Promise<void>;
  getConnectedDevice(): Promise<GlassesDevice | null>;
  capturePhoto(): Promise<CameraFrame>;
  startVideoStream(onFrame: (frame: CameraFrame) => void): Promise<() => void>;
  stopVideoStream(): Promise<void>;
  speakText(text: string): Promise<void>;
  stopSpeaking(): Promise<void>;
  onConnectionChange(cb: (device: GlassesDevice) => void): () => void;
  onError(cb: (error: Error) => void): () => void;
}
```

---

## FASE 13 — Application (Use Cases)

### `src/modules/glasses/application/use-cases/ConnectGlassesUseCase.ts`

- Constructor: `(repo: IGlassesRepository)`
- `execute(name: string)`: `startSession()` → `speakText('Hola {name}. FieldVision conectado.')`
- `disconnect(id: string)`: `speakText('Desconectando. Hasta luego.')` → `endSession(id)`

### `src/modules/vision/application/use-cases/AnalyzeFrameUseCase.ts`

- Constructor: `(repo: IGlassesRepository, vision: VisionAIService)`
- `execute({ frame, context, speakResult? = true })`
  1. `vision.analyzeFrame(frame, context)` → `analysis`
  2. Construye `spokenText`:
     - critical: `'ALERTA CRÍTICA. ' + summary + ' Acción: ' + actionItems[0]`
     - warning: `'Atención. ' + summary + (actionItems[0] ? ' Acción: ' + actionItems[0] : '')`
     - info: `summary + (actionItems[0] ? '. ' + actionItems[0] : '')`
  3. Si `speakResult`: `repo.speakText(spokenText)`
  4. Retorna `{ analysis, spokenText }`

---

## FASE 14 — Infrastructure

### `src/modules/glasses/infrastructure/native/MetaGlassesNative.ts`

Wrapper del TurboModule. **Importa el módulo desde `@specs/NativeMetaGlasses`**,
no desde `NativeModules`. Convierte `startedAt` string → `Date` para el dominio.
Usa `NativeEventEmitter` para los eventos.
Exporta objeto `MetaGlassesNative` con todos los métodos tipados (ver `docs/03-turbomodules.md`).

### `src/modules/glasses/infrastructure/services/MetaGlassesRepository.ts`

Implementación de `IGlassesRepository` usando `MetaGlassesNative`.
Mantiene referencia interna a `currentDevice`.
`onConnectionChange`: suscribe a `onSessionStarted` y `onSessionEnded`,
construye `GlassesDevice` con `GlassesDevice.create(...).withSession(session)`.
Retorna función de cleanup en todos los métodos de listener.

### `src/modules/vision/infrastructure/services/VisionAIService.ts`

Soporta dos providers según `AppConfig.VISION_PROVIDER`:

**Claude** (`POST https://api.anthropic.com/v1/messages`):
- Headers: `x-api-key: AppConfig.CLAUDE_API_KEY`, `anthropic-version: 2023-06-01`
- Body: `{ model: 'claude-sonnet-4-6', max_tokens: 512, system: SYSTEM_PROMPTS[context], messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: frame.base64 } }, { type: 'text', text: 'Analiza esta imagen.' }] }] }`
- Si 429: espera `retry-after` header (default 5s) y reintenta una vez

**OpenAI** (`POST https://api.openai.com/v1/chat/completions`):
- Headers: `Authorization: Bearer {OPENAI_API_KEY}`
- Body: `{ model: 'gpt-4o', max_tokens: 512, messages: [{ role: 'system', content: SYSTEM_PROMPTS[context] }, { role: 'user', content: [image_url + text] }] }`

**`parseAnalysisResponse(text, frame)` privado**:
- Extrae `SEVERIDAD:` → `'critical' | 'warning' | 'info'`
- Extrae `DIAGNÓSTICO:` → `summary`
- Extrae `ACCIÓN:` → `actionItems[0]`
- Nunca lanza excepción — usa `text` completo como `summary` si el formato no coincide
- Retorna `VisionAnalysis` con id único, confidence 0.85, `analyzedAt: new Date()`

---

## FASE 15 — Presentación: Hook principal

### `src/modules/glasses/presentation/hooks/useFieldVision.ts`

Singletons **fuera** del hook (no dentro — evita recreación en cada render):
```typescript
const glassesRepo = new MetaGlassesRepository();
const visionService = new VisionAIService();
const connectUseCase = new ConnectGlassesUseCase(glassesRepo);
const analyzeUseCase = new AnalyzeFrameUseCase(glassesRepo, visionService);
```

**Estado** del store:
`connectionStatus`, `session`, `isConnected`, `isAnalyzing`, `currentAnalysis`, `analyses`, `config`

**Acciones**:
- `connect()`: `setStatus('connecting')` → `connectUseCase.execute(config.technicianName)` → `setSession + setStatus('connected')`. En catch: `setStatus('error')`
- `disconnect()`: `stopAutoCapture()` → `connectUseCase.disconnect(session.id)` → `setSession(null) + setStatus('disconnected')`
- `captureAndAnalyze()`: guarda si `isAnalyzing || !isConnected`. `setIsAnalyzing(true)` → `capturePhoto()` → `analyzeUseCase.execute({ frame, context, speakResult: true })` → `addAnalysis()`. En catch: `speakText('Error al analizar. Intenta de nuevo.')`. Siempre: `setIsAnalyzing(false)`
- `analyzeFrame(frame)`: igual que `captureAndAnalyze` pero sin capturar
- `startAutoCapture()`: `setInterval` con `config.captureIntervalMs` que llama `captureAndAnalyze()`
- `stopAutoCapture()`: `clearInterval`
- `speak(text)`: `glassesRepo.speakText(text)`

**Cleanup**: `useEffect` retorna `stopAutoCapture()`

---

## FASE 16 — Presentación: Pantallas

### `src/modules/glasses/presentation/screens/DashboardScreen.tsx`

Usa `useFieldVision()` y `useAppStore()`.
Estructura:
- `SafeAreaView` → `ScrollView`
  - Header: título "FieldVision" + `ConnectionBadge` (dot coloreado + texto del status)
  - `ContextSelector`: `ScrollView` horizontal con chips para 6 contextos (Eléctrico, Plomería, HVAC, Obra, Inspección, General). Chip activo: fondo `#1d4ed8`
  - Botón "Conectar lentes" si desconectado (texto "Conectando..." si status='connecting')
  - Si conectado: botón verde "Analizar ahora" (`ActivityIndicator` si `isAnalyzing`) + botón "Desconectar"
  - Card de análisis actual: borde coloreado por severidad, texto de severidad (🔴/🟡/🟢), summary, action item, hora
  - Lista de historial (sin el análisis actual)
- Botones Settings e Historial en el header (usando `navigation.navigate`)

### `src/modules/glasses/presentation/screens/SettingsScreen.tsx`

Secciones en cards:
1. Técnico: TextInput nombre + TextInput empresa (opcional)
2. Contexto: radio buttons para 6 contextos con nombre y descripción
3. Captura automática: Switch + selector 3s/5s/10s/15s si activo
4. Idioma: Español / English
5. Acerca de: "FieldVision v1.0.0"

### `src/modules/glasses/presentation/screens/HistoryScreen.tsx`

FlatList de `analyses`. Cada item: dot de severidad + summary + hora + flecha expandir.
Al expandir: details + action items. Header: contador + botón "Borrar todo" con Alert.
Empty state con 📋 y texto.

### `src/modules/billing/presentation/screens/PlansScreen.tsx`

3 cards (Free, Starter $49, Pro $149, Enterprise $399).
Card Pro con `borderWidth: 2, borderColor: '#1d4ed8'` y badge "Más popular".
Al presionar: `Alert.alert('Próximamente', 'Configura Stripe para activar pagos. Ver docs/06-payments.md')`.
Banner: "🚀 Primeros 20 clientes: 50% con código LAUNCH50".
**NO importa `@stripe/stripe-react-native`** — está en roadmap v1.2.

---

## FASE 17 — Navegación

### `src/navigation/AppNavigator.tsx`

React Navigation **v7** — usa `createNativeStackNavigator`:

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Dashboard: undefined;
  Settings: undefined;
  History: undefined;
  Plans: undefined;
};

// En v7: no usar unmountOnBlur — usar popToTopOnBlur
// Header: fondo blanco, sin sombra, headerTintColor: '#111827'
```

Envuelve con `<QueryClientProvider client={queryClient}>` (TanStack Query v5):
```typescript
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 2 } },
});
```

---

## FASE 18 — Native Modules iOS

Ver `docs/03-turbomodules.md` para el código completo.

### `ios/FieldVision/NativeMetaGlasses/MetaGlassesModule.h`

```objc
#import <React/RCTEventEmitter.h>
@interface MetaGlassesModule : RCTEventEmitter
@end
```

### `ios/FieldVision/NativeMetaGlasses/MetaGlassesModule.mm`

Implementa `NativeMetaGlassesSpec` (generado por CodeGen).
Todos los métodos en modo mock con comentario `// TODO: Replace mock — ver docs/03-turbomodules.md`.
Incluye `getTurboModule:` requerido por la Nueva Arquitectura.
`speakText:` usa `AVSpeechSynthesizer` con voz `es-MX`.
`startVideoStream:` emite frames mock cada 2s con `dispatch_after`.

---

## FASE 19 — Native Modules Android

Ver `docs/03-turbomodules.md` para el código completo.

### `android/.../MetaGlassesModule.kt`

Extiende `NativeMetaGlassesCxxSpec(reactContext)` (generado por CodeGen).
`@ReactModule(name = MetaGlassesModule.NAME)`.
`NAME = "NativeMetaGlasses"` (debe coincidir con la spec).
Inicializa `TextToSpeech` en `initialize()`, destruye en `invalidate()`.
Todos los métodos en modo mock con comentario `// TODO: Replace mock`.

### `android/.../MetaGlassesPackage.kt`

Registra `MetaGlassesModule` en `createNativeModules`.

### `android/.../MainApplication.kt`

Agrega `MetaGlassesPackage()` a `getPackages()`.

---

## FASE 20 — App.tsx

```typescript
import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppConfig } from './src/shared/config';

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

export default function App(): React.JSX.Element {
  useEffect(() => {
    if (AppConfig.IS_DEV) {
      const placeholders = Object.entries(AppConfig)
        .filter(([, v]) => typeof v === 'string' && v.includes('PLACEHOLDER'))
        .map(([k]) => k);
      if (placeholders.length > 0) {
        console.warn(
          `⚠️  FieldVision: variables con PLACEHOLDER: ${placeholders.join(', ')}\n` +
          `   Ver docs/05-registrations.md para obtener claves reales.`
        );
      }
    }
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AppNavigator />
    </>
  );
}
```

---

## FASE 21 — Tests

### `__tests__/setup.ts`

Mock del TurboModule via `jest.mock('@specs/NativeMetaGlasses', () => ({ default: { ... } }))`.
Mock de `global.fetch` retornando respuesta de Claude con formato `SEVERIDAD: OK\nDIAGNÓSTICO: Todo en orden\nACCIÓN: Continuar`.
(El mock de `@env` ya está en `__mocks__/env.ts` — jest lo toma automáticamente.)

### `__tests__/unit/GlassesDevice.test.ts`

6 tests: create con 'disconnected', isConnected false, withStatus inmutable, withSession activa isReady, etc.

### `__tests__/unit/AnalyzeFrameUseCase.test.ts`

8 tests: llama visionService, habla cuando speakResult:true, no habla cuando false, prefijos de voz por severidad, incluye actionItem, retorna analysis.

### `__tests__/unit/VisionAIService.test.ts`

8 tests: parsea las 3 severidades, extrae DIAGNÓSTICO y ACCIÓN, no falla con texto sin formato, id no vacío, analyzedAt es Date.

### `__tests__/unit/useAppStore.test.ts`

7 tests con `beforeEach` que resetea el store. Tests: addAnalysis al inicio, actualiza currentAnalysis, limita a 50, clearHistory, setConfig merge parcial, setConnectionStatus, setSession.

### `__tests__/integration/glasses-flow.test.ts`

5 tests del flujo completo: connect retorna sesión, capturePhoto retorna CameraFrame válido, analyzeUseCase retorna VisionAnalysis, speakText fue llamado, disconnect resuelve sin error.

---

## FASE 22 — Documentación

Copia todos los archivos `.md` que están en la misma carpeta que este PROMPT.md
hacia las carpetas correspondientes del proyecto:
- `CLAUDE.md` → `fieldvision/CLAUDE.md`
- `docs/01-architecture.md` → `fieldvision/docs/01-architecture.md`
- (idem para docs 02 al 10)

Si algún doc no existe, créalo con `# [nombre] — pendiente`.

---

## FASE 23 — Instalación de Pods iOS

```bash
cd ios
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
cd ..
```

Si falla, registra el error en `BUILD_LOG.md` y continúa.

---

## FASE 24 — Verificación

```bash
# TypeScript 6
npx tsc --noEmit 2>&1 | head -60

# Tests
npm test -- --passWithNoTests 2>&1 | tail -30

# Estructura
find src -name "*.ts" -o -name "*.tsx" | sort
find __tests__ -name "*.ts" | sort
```

Si TypeScript reporta errores, corrígelos. Si tests fallan, corrígelos.
No termines esta fase hasta que ambos salgan limpios.

---

## FASE 25 — BUILD_COMPLETE.md

Crea `fieldvision/BUILD_COMPLETE.md`:

```markdown
# FieldVision — Build Complete ✅

**Fecha**: [fecha]
**Stack**: React Native 0.84.1, TypeScript 6, Zustand 5, TanStack Query v5, React Navigation v7
**Arquitectura nativa**: TurboModules (Nueva Arquitectura RN 0.84)

## Archivos creados
[lista de src/, __tests__/, ios/, android/, docs/]

## Resultados de verificación
- TypeScript: [resultado]
- Tests: [resultado]
- Pod install iOS: [resultado o error]

## Para correr ahora mismo (modo mock)
```bash
npm start                      # Terminal 1
npx react-native run-ios       # Terminal 2 — simulador
```

## Variables pendientes en .env
- CLAUDE_API_KEY → console.anthropic.com
- OPENAI_API_KEY → platform.openai.com/api-keys
- META_APP_TOKEN → wearables.developer.meta.com
- SUPABASE_URL + SUPABASE_ANON_KEY → app.supabase.com
- STRIPE_PUBLISHABLE_KEY → dashboard.stripe.com/apikeys

Ver docs/05-registrations.md para instrucciones paso a paso.
```

---

## NOTAS FINALES

- El `package.json` de la Fase 4 es la fuente de verdad de versiones.
- Los `docs/` son la fuente de verdad de arquitectura y decisiones de diseño.
- **Nunca** uses `NativeModules.MetaGlassesModule` — usa `TurboModuleRegistry.getEnforcing`.
- **Nunca** uses `isLoading` de TanStack Query — es `isPending` en v5.
- **Nunca** uses `unmountOnBlur` de React Navigation — es `popToTopOnBlur` en v7.
- **Nunca** pares por API keys faltantes — los PLACEHOLDERs son suficientes para build y tests.
