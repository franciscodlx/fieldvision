import axios from 'axios';
import type { CameraFrame, FieldContext, VisionAnalysis, AnalysisSeverity } from '@shared/types';
import { AppConfig, SYSTEM_PROMPTS } from '@shared/config';

export class VisionAIService {
  async analyzeFrame(frame: CameraFrame, context: FieldContext): Promise<VisionAnalysis> {
    const provider = AppConfig.VISION_PROVIDER;
    let responseText: string;

    if (provider === 'openai') {
      responseText = await this.callOpenAI(frame, context);
    } else {
      responseText = await this.callClaude(frame, context);
    }

    return this.parseAnalysisResponse(responseText, frame);
  }

  private async callClaude(frame: CameraFrame, context: FieldContext): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-sonnet-4-6',
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
