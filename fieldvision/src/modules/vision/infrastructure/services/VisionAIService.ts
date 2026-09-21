import axios from 'axios';
import type { CameraFrame, FieldContext, VisionAnalysis, AnalysisSeverity } from '@shared/types';
import { AppConfig, SYSTEM_PROMPTS } from '@shared/config';

// La IA de visión está configurada solo si hay una key real (no placeholder).
export function isVisionConfigured(): boolean {
  const key = AppConfig.VISION_PROVIDER === 'openai'
    ? AppConfig.OPENAI_API_KEY
    : AppConfig.CLAUDE_API_KEY;
  return !!key && key.length > 0 && !key.includes('PLACEHOLDER');
}

// Diagnósticos simulados por contexto (modo demo, sin key de IA real).
const MOCK_ANALYSES: Record<FieldContext, Array<{ severity: AnalysisSeverity; summary: string; action: string }>> = {
  electrical: [
    { severity: 'critical', summary: 'Cableado con empalmes expuestos y signos de sobrecalentamiento en el tablero.', action: 'Desenergiza el circuito y reaísla los empalmes con conectores certificados.' },
    { severity: 'warning', summary: 'Conductor de calibre menor al requerido para la carga del circuito.', action: 'Reemplaza por calibre 12 AWG y verifica el breaker de 20 A.' },
    { severity: 'info', summary: 'Instalación de tomacorriente correcta, polaridad y tierra adecuadas.', action: 'Sin acción requerida; documenta como conforme.' },
  ],
  plumbing: [
    { severity: 'warning', summary: 'Corrosión incipiente en unión roscada de tubería de cobre.', action: 'Aplica sellador y monitorea; programa reemplazo del tramo.' },
    { severity: 'critical', summary: 'Fuga activa en codo bajo el fregadero con humedad acumulada.', action: 'Cierra la llave de paso y sustituye el codo de inmediato.' },
    { severity: 'info', summary: 'Presión y conexiones dentro de norma, sin fugas visibles.', action: 'Sin acción; registra la lectura de presión.' },
  ],
  hvac: [
    { severity: 'warning', summary: 'Filtro de aire saturado reduciendo el flujo del evaporador.', action: 'Reemplaza el filtro y verifica el delta de temperatura.' },
    { severity: 'critical', summary: 'Posible fuga de refrigerante: escarcha en la línea de succión.', action: 'Detén el equipo y haz prueba de fugas antes de recargar.' },
    { severity: 'info', summary: 'Ductos sellados y aislamiento en buen estado.', action: 'Sin acción requerida.' },
  ],
  construction: [
    { severity: 'critical', summary: 'Fisura estructural diagonal en muro de carga, posible asentamiento.', action: 'Restringe el área y solicita evaluación estructural.' },
    { severity: 'warning', summary: 'Recubrimiento insuficiente del acero de refuerzo en columna.', action: 'Aplica mortero de reparación y verifica con detector de varilla.' },
    { severity: 'info', summary: 'Acabados y nivelación conformes a especificación.', action: 'Sin observaciones.' },
  ],
  inspection: [
    { severity: 'critical', summary: 'Extintor vencido y salida de emergencia obstruida.', action: 'Despeja la salida y reemplaza el extintor hoy mismo.' },
    { severity: 'warning', summary: 'Equipo de protección personal incompleto en zona de riesgo.', action: 'Dota de casco y guantes antes de continuar la operación.' },
    { severity: 'info', summary: 'Área ordenada y señalización de seguridad visible y vigente.', action: 'Sin hallazgos.' },
  ],
  generic: [
    { severity: 'warning', summary: 'Se detecta una anomalía que requiere revisión más cercana.', action: 'Acércate al punto y captura un segundo ángulo.' },
    { severity: 'info', summary: 'Sin anomalías evidentes en la imagen analizada.', action: 'Continúa la inspección.' },
  ],
};

let mockPickCounter = 0;

export class VisionAIService {
  async analyzeFrame(frame: CameraFrame, context: FieldContext): Promise<VisionAnalysis> {
    // Modo demo: sin key real de IA, devuelve un diagnóstico simulado.
    if (!isVisionConfigured()) {
      return this.simulateAnalysis(frame, context);
    }

    const provider = AppConfig.VISION_PROVIDER;
    let responseText: string;

    if (provider === 'openai') {
      responseText = await this.callOpenAI(frame, context);
    } else {
      responseText = await this.callClaude(frame, context);
    }

    return this.parseAnalysisResponse(responseText, frame);
  }

  private async simulateAnalysis(frame: CameraFrame, context: FieldContext): Promise<VisionAnalysis> {
    // Simula la latencia del análisis de IA.
    await new Promise<void>((r) => setTimeout(() => r(), 1200));
    const variants = MOCK_ANALYSES[context] ?? MOCK_ANALYSES.generic;
    const pick = variants[mockPickCounter % variants.length];
    mockPickCounter += 1;
    const severityLabel = pick.severity === 'critical' ? 'CRÍTICO' : pick.severity === 'warning' ? 'ATENCIÓN' : 'OK';
    return {
      id: `analysis_${Date.now()}_${mockPickCounter}`,
      summary: pick.summary,
      details: `SEVERIDAD: ${severityLabel}\nDIAGNÓSTICO: ${pick.summary}\nACCIÓN: ${pick.action}\n\n(Resultado simulado — sin API de IA configurada)`,
      severity: pick.severity,
      actionItems: [pick.action],
      confidence: 0.9,
      analyzedAt: new Date(),
      frameRef: `frame_${frame.timestamp}`,
    };
  }

  private async callClaude(frame: CameraFrame, context: FieldContext): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-opus-5',
          max_tokens: 512,
          system: SYSTEM_PROMPTS[context],
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: frame.base64,
                },
              },
              { type: 'text', text: 'Analiza esta imagen.' },
            ],
          }],
        },
        {
          headers: {
            'x-api-key': AppConfig.CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        }
      );
      return (response.data as { content: Array<{ text: string }> }).content[0].text;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        const retryAfter = parseInt(String(err.response.headers['retry-after'] ?? '5'), 10);
        await new Promise<void>(resolve => setTimeout(() => resolve(), retryAfter * 1000));
        return this.callClaude(frame, context);
      }
      throw err;
    }
  }

  private async callOpenAI(frame: CameraFrame, context: FieldContext): Promise<string> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        max_tokens: 512,
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[context] },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${frame.base64}` },
              },
              { type: 'text', text: 'Analiza esta imagen.' },
            ],
          },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${AppConfig.OPENAI_API_KEY}`,
          'content-type': 'application/json',
        },
      }
    );
    return (response.data as { choices: Array<{ message: { content: string } }> }).choices[0].message.content;
  }

  private parseAnalysisResponse(text: string, frame: CameraFrame): VisionAnalysis {
    let severity: AnalysisSeverity = 'info';
    let summary = text;
    const actionItems: string[] = [];

    const severidadMatch = text.match(/SEVERIDAD:\s*(.+)/i);
    if (severidadMatch) {
      const sev = severidadMatch[1].trim().toUpperCase();
      if (sev === 'CRÍTICO' || sev === 'CRITICO') severity = 'critical';
      else if (sev === 'ATENCIÓN' || sev === 'ATENCION') severity = 'warning';
      else severity = 'info';
    }

    const diagMatch = text.match(/DIAGNÓSTICO:\s*(.+)/i);
    if (diagMatch) {
      summary = diagMatch[1].trim();
    }

    const accionMatch = text.match(/ACCIÓN:\s*(.+)/i);
    if (accionMatch) {
      actionItems.push(accionMatch[1].trim());
    }

    return {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      summary,
      details: text,
      severity,
      actionItems,
      confidence: 0.85,
      analyzedAt: new Date(),
      frameRef: `frame_${frame.timestamp}`,
    };
  }
}
