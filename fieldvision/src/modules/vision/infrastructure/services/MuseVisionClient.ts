// Cliente de Meta Model API para visión con Muse Spark (mismo enfoque que muse/lensify-vision).
// POST https://api.meta.ai/v1/chat/completions · imágenes como data URL · salida JSON forzada
// con response_format json_schema (strict). Un "clip" de video se envía como varios frames
// en la misma petición (la API acepta hasta 50 imágenes por petición).
// Ver docs/11-muse-vision.md
import axios from 'axios';
import { z } from 'zod';
import type { AnalysisSeverity, CameraFrame, FieldContext } from '@shared/types';
import { AppConfig } from '@shared/config';

export const MUSE_BASE_URL = 'https://api.meta.ai/v1';
export const MAX_CLIP_FRAMES = 8;

const CONTEXT_EXPERTISE: Record<FieldContext, string> = {
  electrical: 'un asistente técnico experto en instalaciones eléctricas. Identifica problemas de cableado, conexiones, tableros y riesgos eléctricos',
  plumbing: 'un asistente técnico experto en plomería. Identifica fugas, corrosión, uniones dañadas y problemas de presión',
  hvac: 'un asistente técnico experto en sistemas HVAC. Identifica problemas en filtros, refrigerante, ductos y equipos',
  construction: 'un inspector de obra experto en construcción civil. Identifica problemas estructurales, de acabados y de cumplimiento de normas',
  inspection: 'un inspector de calidad y seguridad industrial. Identifica riesgos, equipos dañados e incumplimientos',
  generic: 'un asistente técnico de campo. Da orientación técnica sobre lo que se ve',
};

export function buildMuseSystemPrompt(context: FieldContext, frameCount: number): string {
  const media = frameCount > 1
    ? `Recibes ${frameCount} fotogramas en orden cronológico de un clip de video grabado por los lentes del técnico. Analízalos como una secuencia: considera movimiento, cambios entre fotogramas (goteo, chispas, humo, vibración) y los ángulos distintos.`
    : 'Recibes una foto tomada por los lentes del técnico.';
  return `Eres ${CONTEXT_EXPERTISE[context]}.
${media}
Responde SIEMPRE en español. El diagnóstico se leerá en voz alta en los lentes: frases cortas y claras.
- severity: "ok" si todo está conforme, "atencion" si hay algo que revisar, "critico" si hay riesgo inmediato.
- diagnosis: 1-2 oraciones con lo que ves y el problema principal.
- action: UN paso concreto que el técnico debe hacer ahora.
- observations: de 0 a 5 hallazgos secundarios breves.
- confidence: "alta", "media" o "baja" según qué tan claro se ve.
Si la imagen no permite diagnosticar (borrosa, oscura, fuera de contexto), dilo en diagnosis, usa severity "atencion" y pide en action otra toma.
No inventes elementos que no se vean.`;
}

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['severity', 'diagnosis', 'action', 'observations', 'confidence'],
  properties: {
    severity: { type: 'string', enum: ['ok', 'atencion', 'critico'] },
    diagnosis: { type: 'string' },
    action: { type: 'string' },
    observations: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'string', enum: ['alta', 'media', 'baja'] },
  },
} as const;

const MuseAnalysisSchema = z.object({
  severity: z.enum(['ok', 'atencion', 'critico']).catch('atencion'),
  diagnosis: z.string().trim().min(1).max(1000),
  action: z.string().trim().max(500),
  observations: z.array(z.string().trim().min(1).max(300)).max(10).catch([]),
  confidence: z.enum(['alta', 'media', 'baja']).catch('media'),
});

export interface MuseAnalysis {
  severity: AnalysisSeverity;
  diagnosis: string;
  action: string;
  observations: string[];
  confidence: number;
}

const SEVERITY_MAP: Record<'ok' | 'atencion' | 'critico', AnalysisSeverity> = {
  ok: 'info',
  atencion: 'warning',
  critico: 'critical',
};
const CONFIDENCE_MAP: Record<'alta' | 'media' | 'baja', number> = { alta: 0.9, media: 0.7, baja: 0.45 };

export class MuseApiError extends Error {
  constructor(message: string, readonly status?: number, readonly code?: string) {
    super(message);
    this.name = 'MuseApiError';
  }
}

/** Mensaje corto en español, apto para leerse en los lentes. */
export function describeVisionError(error: unknown): string {
  if (error instanceof MuseApiError) {
    if (error.code === 'content_policy_violation') return 'Meta rechazó la imagen por su política de contenido.';
    if (error.status === 401 || error.status === 403) return 'La clave de Muse es inválida o no tiene permisos.';
    if (error.status === 404 || error.code === 'model_not_found') return 'El modelo de Muse no está habilitado para tu cuenta.';
    if (error.status === 429) return 'Límite de peticiones de Muse alcanzado. Reintenta en un momento.';
    if (error.status === 413) return 'La imagen es demasiado grande para Muse.';
    if (error.status !== undefined && error.status >= 500) return 'El servicio de Muse no está disponible. Reintenta.';
    if (error.status === undefined) return 'No hay conexión con Muse. Revisa internet.';
    return 'Muse no pudo analizar la imagen.';
  }
  return 'Error al analizar. Intenta de nuevo.';
}

/** Toma hasta `max` frames repartidos uniformemente (siempre incluye el primero y el último). */
export function sampleFrames(frames: CameraFrame[], max = MAX_CLIP_FRAMES): CameraFrame[] {
  if (frames.length <= max) return frames;
  if (max <= 1) return [frames[frames.length - 1]];
  const step = (frames.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => frames[Math.round(i * step)]);
}

interface ChatResponse {
  choices?: Array<{ message?: { content?: string | null; refusal?: string | null } }>;
}

async function postWithRetry(body: unknown, attempts = 3): Promise<ChatResponse> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await axios.post<ChatResponse>(`${MUSE_BASE_URL}/chat/completions`, body, {
        headers: {
          Authorization: `Bearer ${AppConfig.MUSE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60_000,
      });
      return res.data;
    } catch (err: unknown) {
      lastError = toMuseError(err);
      const status = (lastError as MuseApiError).status;
      const retryable = status === 429 || (status !== undefined && status >= 500);
      if (!retryable || i === attempts - 1) break;
      await new Promise<void>((r) => setTimeout(() => r(), 1000 * 2 ** i + Math.random() * 500));
    }
  }
  throw lastError;
}

function toMuseError(err: unknown): MuseApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as { error?: { code?: string; message?: string } } | undefined;
    const message = data?.error?.message ?? err.message;
    return new MuseApiError(`Muse Spark falló (${status ?? 'red'}): ${message}`, status, data?.error?.code);
  }
  return new MuseApiError(err instanceof Error ? err.message : String(err), 0);
}

export async function analyzeWithMuse(frames: CameraFrame[], context: FieldContext): Promise<MuseAnalysis> {
  if (frames.length === 0) throw new MuseApiError('No hay fotogramas para analizar.', 0);
  const picked = sampleFrames(frames);

  const body = await postWithRetry({
    model: AppConfig.MUSE_VISION_MODEL,
    messages: [
      { role: 'system', content: buildMuseSystemPrompt(context, picked.length) },
      {
        role: 'user',
        content: [
          { type: 'text', text: picked.length > 1 ? 'Analiza este clip.' : 'Analiza esta imagen.' },
          ...picked.map((f) => ({
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${f.base64}` },
          })),
        ],
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'field_diagnosis', strict: true, schema: RESPONSE_SCHEMA },
    },
  });

  const message = body.choices?.[0]?.message;
  if (message?.refusal) throw new MuseApiError(`Muse Spark rechazó la imagen: ${message.refusal}`, 400, 'refusal');
  if (!message?.content) throw new MuseApiError('Muse Spark no devolvió contenido.', 502);

  let raw: unknown;
  try {
    raw = JSON.parse(message.content);
  } catch {
    throw new MuseApiError('Muse Spark devolvió un JSON inválido.', 502);
  }
  const parsed = MuseAnalysisSchema.safeParse(raw);
  if (!parsed.success) throw new MuseApiError('La respuesta de Muse Spark no tiene el formato esperado.', 502);

  return {
    severity: SEVERITY_MAP[parsed.data.severity],
    diagnosis: parsed.data.diagnosis,
    action: parsed.data.action,
    observations: parsed.data.observations.slice(0, 5),
    confidence: CONFIDENCE_MAP[parsed.data.confidence],
  };
}
