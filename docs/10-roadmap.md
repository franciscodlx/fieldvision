# 10 — Roadmap

## Estado actual — v1.0 (MVP)

```
✅ React Native 0.84.1 con Nueva Arquitectura
✅ TurboModule spec + implementación mock iOS/Android
✅ VisionAIService — Claude Vision + GPT-4o
✅ 6 contextos técnicos con system prompts especializados
✅ TTS via altavoces (AVSpeechSynthesizer / Android TTS)
✅ Zustand 5 store global
✅ React Navigation 7
✅ TanStack Query v5
✅ DashboardScreen + SettingsScreen + HistoryScreen + PlansScreen
✅ Tests unitarios con mocks del TurboModule
✅ Documentación completa (01-10)
✅ Variables de entorno validadas con Zod
```

## v1.1 — Backend (próximo sprint)

```
[ ] Integrar @supabase/supabase-js v2
[ ] Auth: login/registro de técnicos
[ ] Persistir análisis en Supabase DB
[ ] Guardar frames en Supabase Storage
[ ] Multi-tenant: empresa → técnicos
[ ] Historial persistente entre sesiones
```

## v1.2 — Monetización

```
[ ] Integrar @stripe/stripe-react-native (Nueva Arquitectura)
[ ] PlansScreen funcional con Stripe Payment Sheet
[ ] Supabase Edge Functions: create-subscription + stripe-webhook
[ ] Control de límites por plan
[ ] Trial 14 días + cupones de lanzamiento
```

## v1.3 — SDK real de Meta

```
[ ] Reemplazar // TODO: Replace mock en MetaGlassesModule.mm
[ ] Reemplazar // TODO: Replace mock en MetaGlassesModule.kt
[ ] Streaming de video 720p @ 30fps
[ ] Reconexión automática por Bluetooth drop
```

## v1.4 — Features avanzados

```
[ ] Auto-captura por stream de video
[ ] Wake word propio ("FieldVision, analiza")
[ ] Reportes PDF por sesión
[ ] Exportar historial CSV
[ ] Integración webhooks con Jira/ServiceNow
```

## v2.0 — Plataforma B2B

```
[ ] Dashboard web Next.js para supervisores
[ ] Geolocalización de análisis en mapa
[ ] API pública para integración con ERPs
[ ] Modelo IA offline (llama.cpp)
[ ] Soporte Oakley Meta y futuros wearables
[ ] Facturación CFDI México (Facturapi)
```

## Decisiones técnicas pendientes

| Decisión | Opciones | Sprint |
|----------|---------|--------|
| Proxy de keys de IA | Supabase Edge Function vs directo en app | v1.2 |
| Notificaciones push | Notifee vs Expo Notifications | v1.2 |
| Modelo offline | llama.cpp vs sin offline | v2.0 |
| Dashboard web | Next.js 15 vs Remix | v1.1 |
