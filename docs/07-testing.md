# 07 — Testing

## Principios

Prioridad: use-cases y dominio → services → hooks → screens.
**Nunca commit sin que `npm test` pase limpio.**

## Comandos

```bash
npm test                    # todos los tests
npm run test:watch          # modo watch
npm run test:coverage       # con reporte HTML
```

## Setup de mocks (`__tests__/setup.ts`)

```typescript
// Mock de @env (react-native-dotenv)
jest.mock('@env', () => ({
  CLAUDE_API_KEY: 'sk-ant-PLACEHOLDER-test',
  OPENAI_API_KEY: 'sk-openai-PLACEHOLDER-test',
  VISION_PROVIDER: 'claude',
  TTS_PROVIDER: 'system',
  META_APP_TOKEN: 'meta-PLACEHOLDER-test',
  SUPABASE_URL: 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY: 'eyJPLACEHOLDER',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_PLACEHOLDER',
  STRIPE_PRICE_STARTER: 'price_PLACEHOLDER_starter',
  STRIPE_PRICE_PRO: 'price_PLACEHOLDER_pro',
  STRIPE_PRICE_ENTERPRISE: 'price_PLACEHOLDER_enterprise',
  APP_ENV: 'test',
  CAPTURE_INTERVAL_MS: '0',
}));

// Mock del TurboModule (NativeMetaGlasses spec)
jest.mock('@specs/NativeMetaGlasses', () => ({
  default: {
    startSession: jest.fn().mockResolvedValue({
      id: 'test-session-id',
      deviceId: 'mock-device',
      startedAt: new Date().toISOString(),
      firmwareVersion: '20.0.0',
      model: 'Ray-Ban Meta (Gen 2)',
    }),
    endSession: jest.fn().mockResolvedValue(undefined),
    capturePhoto: jest.fn().mockResolvedValue({
      base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      width: 1280, height: 720, timestamp: Date.now(),
    }),
    startVideoStream: jest.fn().mockResolvedValue(undefined),
    stopVideoStream:  jest.fn().mockResolvedValue(undefined),
    speakText:        jest.fn().mockResolvedValue(undefined),
    addListener:      jest.fn(),
    removeListeners:  jest.fn(),
  },
}));

// Mock de fetch para APIs de IA
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  headers: { get: (_: string) => null },
  json: async () => ({
    content: [{ type: 'text', text: 'SEVERIDAD: OK\nDIAGNÓSTICO: Todo en orden\nACCIÓN: Continuar' }],
  }),
});
```

## Tests clave

### GlassesDevice entity
```typescript
it('es inmutable — withStatus retorna nueva instancia', () => {
  const d = GlassesDevice.create({ id: '1', model: 'RB', firmwareVersion: '20' });
  const connected = d.withStatus('connected');
  expect(d.status).toBe('disconnected');   // original intacto
  expect(connected.status).toBe('connected');
});
```

### AnalyzeFrameUseCase
```typescript
it('prefija ALERTA CRÍTICA para severity critical', async () => {
  mockVision.analyzeFrame.mockResolvedValueOnce({ ...mockAnalysis, severity: 'critical' });
  await uc.execute({ frame: mockFrame, context: 'electrical', speakResult: true });
  expect(mockRepo.speakText).toHaveBeenCalledWith(expect.stringContaining('ALERTA CRÍTICA'));
});
```

### VisionAIService parsing
```typescript
test.each([
  ['SEVERIDAD: CRÍTICO\nDIAGNÓSTICO: X\nACCIÓN: Y', 'critical'],
  ['SEVERIDAD: ATENCIÓN\nDIAGNÓSTICO: X\nACCIÓN: Y', 'warning'],
  ['SEVERIDAD: OK\nDIAGNÓSTICO: X\nACCIÓN: Y', 'info'],
])('parsea severidad: %s → %s', (input, expected) => {
  expect((service as any).parseAnalysisResponse(input, mockFrame).severity).toBe(expected);
});
```

### Zustand 5 store
```typescript
beforeEach(() => useAppStore.setState({
  analyses: [], currentAnalysis: null, isAnalyzing: false,
  connectionStatus: 'disconnected', session: null,
}));

it('addAnalysis limita a 50 items', () => {
  for (let i = 0; i < 55; i++) {
    useAppStore.getState().addAnalysis({ ...mockAnalysis, id: `a-${i}` });
  }
  expect(useAppStore.getState().analyses.length).toBe(50);
});
```

### TanStack Query v5 — usar isPending
```typescript
// En tests de componentes con React Query
const { getByText } = render(
  <QueryClientProvider client={queryClient}>
    <HistoryScreen />
  </QueryClientProvider>
);
// isPending (no isLoading) es el estado correcto en v5
```

## Cobertura objetivo

| Módulo | Objetivo |
|--------|---------|
| Domain entities | > 95% |
| Use cases | > 90% |
| Services (VisionAI) | > 85% |
| Hooks | > 70% |
| Screens | > 50% |

## Pre-commit automático con Husky

```bash
npm install --save-dev husky
npx husky init
echo "npm run type-check && npm test && npm run lint" > .husky/pre-commit
```

---
---

