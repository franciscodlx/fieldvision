import type { IGlassesRepository } from '@modules/glasses/domain/repositories/IGlassesRepository';
import type { CameraFrame, FieldContext, VisionAnalysis } from '@shared/types';
import type { VisionAIService } from '../../infrastructure/services/VisionAIService';

interface AnalyzeParams {
  frame: CameraFrame;
  context: FieldContext;
  speakResult?: boolean;
}

interface AnalyzeClipParams {
  frames: CameraFrame[];
  context: FieldContext;
  speakResult?: boolean;
}

interface AnalyzeResult {
  analysis: VisionAnalysis;
  spokenText: string;
}

export class AnalyzeFrameUseCase {
  constructor(
    private readonly repo: IGlassesRepository,
    private readonly vision: VisionAIService,
  ) {}

  async execute({ frame, context, speakResult = true }: AnalyzeParams): Promise<AnalyzeResult> {
    const analysis = await this.vision.analyzeFrame(frame, context);
    return this.announce(analysis, speakResult);
  }

  /** Analiza un clip (varios frames del stream de video) en una sola llamada a la IA. */
  async executeClip({ frames, context, speakResult = true }: AnalyzeClipParams): Promise<AnalyzeResult> {
    const analysis = await this.vision.analyzeClip(frames, context);
    return this.announce(analysis, speakResult);
  }

  private async announce(analysis: VisionAnalysis, speakResult: boolean): Promise<AnalyzeResult> {
    let spokenText: string;
    if (analysis.severity === 'critical') {
      spokenText = `ALERTA CRÍTICA. ${analysis.summary}${analysis.actionItems[0] ? ` Acción: ${analysis.actionItems[0]}` : ''}`;
    } else if (analysis.severity === 'warning') {
      spokenText = `Atención. ${analysis.summary}${analysis.actionItems[0] ? ` Acción: ${analysis.actionItems[0]}` : ''}`;
    } else {
      spokenText = `${analysis.summary}${analysis.actionItems[0] ? `. ${analysis.actionItems[0]}` : ''}`;
    }

    if (speakResult) {
      await this.repo.speakText(spokenText);
    }

    return { analysis, spokenText };
  }
}
