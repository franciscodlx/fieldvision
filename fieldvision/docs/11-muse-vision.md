# 11 · Visión con Meta Muse Spark

Desde nov 2026 el proveedor de visión por defecto es **Muse Spark** (`muse-spark-1.3`) de la
Meta Model API — el mismo que usa `~/Dev/muse/lensify-vision` (ADR-0005 de ese repo).

## Cómo funciona

- Cliente: `src/modules/vision/infrastructure/services/MuseVisionClient.ts`.
- `POST https://api.meta.ai/v1/chat/completions`, `Authorization: Bearer <MUSE_API_KEY>`.
- Imágenes como `data:image/jpeg;base64,…` (parte `image_url`).
- Salida forzada con `response_format: json_schema` (`strict`): `severity` (`ok|atencion|critico`),
  `diagnosis`, `action`, `observations[]`, `confidence` (`alta|media|baja`). Se valida otra vez con Zod.
- Reintentos con backoff en 429/5xx. Errores traducidos a frases cortas que se leen en los lentes
  (`describeVisionError`).

### Foto vs. video

| Botón | Qué envía |
|---|---|
| **Analizar ahora** | `capturePhoto()` → 1 imagen |
| **Analizar video (5 s)** | `startVideoStream()` 5 s → frames JPEG del stream → se muestrean hasta 8 (`sampleFrames`, incluye primero y último) y van **en la misma petición** como secuencia cronológica |

Se usan frames en vez de subir un `.mp4` porque el SDK de los lentes ya entrega JPEGs por frame, la API
acepta hasta 50 imágenes por petición y así no hace falta Files API ni codificar video en el teléfono.
(La API también acepta `input_video` en `/v1/responses`; queda como siguiente paso si se graba MP4.)

## Variables

```
VISION_PROVIDER=muse            # muse | claude | openai
MUSE_API_KEY=LLM_...            # dev.meta.ai → API keys
MUSE_VISION_MODEL=muse-spark-1.3   # o muse-ember-1.0 (≈12× más barato)
```

Sin `MUSE_API_KEY` real la app sigue en **modo demo** (diagnósticos simulados).

## Costes (nov 2026)

`muse-spark-1.3`: 1.25 USD / 1M tokens de entrada, 4.25 USD / 1M de salida. Una imagen ~1280 px ≈ 1 300–1 500
tokens → ≈ 0.002–0.005 USD por foto, ≈ 0.02–0.03 USD por clip de 8 frames.

## ⚠️ Seguridad

La clave viaja en el bundle de la app (igual que antes con Claude). Vale para pruebas en tu dispositivo;
**para producción** mueve la llamada a un backend (Edge Function / Lambda) como en lensify-vision.
