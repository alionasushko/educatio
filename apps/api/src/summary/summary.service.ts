import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LessonsService } from "../lessons/lessons.service";
import { SnapshotsService } from "../snapshots/snapshots.service";
import type { Env } from "../config/env";
import type { CanvasElement, LessonSummary } from "@educatio/shared";

export const SUMMARY_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
] as const;

export const isCapacityError = (err: unknown): boolean => {
  const provider = (err as { lastError?: unknown })?.lastError ?? err;
  const { statusCode, isRetryable } = (provider ?? {}) as {
    statusCode?: number;
    isRetryable?: boolean;
  };
  if (typeof isRetryable === "boolean") return isRetryable;
  return statusCode === 429 || (statusCode !== undefined && statusCode >= 500);
};

@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly snapshotsService: SnapshotsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async generate(
    lessonId: string,
    tutorId: string,
  ): Promise<{ summary: LessonSummary }> {
    const lesson = await this.lessonsService.getOwnedOr403(lessonId, tutorId);
    const canvasState = await this.snapshotsService.latest(lessonId);
    const serialized = this.serialize(this.extractElements(canvasState));
    const prompt = this.buildPrompt(
      lesson.title,
      lesson.studentName ?? "the student",
      serialized,
    );

    const text = await this.callModel(prompt);
    const summary = await this.lessonsService.saveSummary(lesson, text);
    return { summary };
  }

  private extractElements(
    state: Record<string, unknown> | null,
  ): CanvasElement[] {
    if (!state) return [];
    const out: CanvasElement[] = [];
    for (const value of Object.values(state)) {
      if (
        value &&
        typeof value === "object" &&
        "type" in value &&
        "x" in value &&
        "y" in value
      ) {
        out.push(value as CanvasElement);
      }
    }
    return out;
  }

  private serialize(elements: CanvasElement[]): string {
    const sorted = [...elements].sort((a, b) => a.y - b.y || a.x - b.x);
    const lines = sorted.map((el) => this.describe(el)).filter(Boolean);
    return lines.length ? lines.join("\n") : "(The canvas was empty.)";
  }

  private describe(el: CanvasElement): string {
    switch (el.type) {
      case "sticky":
        return `Sticky note: "${el.content}"`;
      case "text":
        return `Text block: "${el.content}"`;
      case "code":
        return `Code block (${el.language}):\n${el.content}`;
      case "shape":
        return `Shape: ${el.shape}`;
      case "image":
        return "Image";
      case "path":
        return "Freehand drawing";
      default:
        return "";
    }
  }

  private buildPrompt(
    title: string,
    studentName: string,
    serializedElements: string,
  ): string {
    return `You are summarizing a tutoring lesson based on the contents of a collaborative whiteboard.

Lesson title: ${title}
Student: ${studentName}

Canvas contents (in spatial order, top-to-bottom, left-to-right):
${serializedElements}

Generate a concise lesson summary in markdown with exactly these four sections. Write each section name as a level-2 heading — "## Topics covered" — never as a bullet or a bold line, and put its content underneath:

1. Topics covered — a bullet list of the main topics, inferred from the canvas content
2. Key concepts — 3–5 main ideas or formulas discussed
3. Examples worked through — problems or examples explored, if identifiable
4. Suggested next steps — 2–3 specific things the student should review or practice before the next lesson

Keep the summary under 400 words. Use a warm, professional tone — this will be sent to the student.

Write plain markdown only: headings, bullet lists, numbered lists, and bold. No LaTeX or mathematical notation, no code fences, and no tables — the summary is also sent as plain-text email, where that markup shows up as raw symbols.`;
  }

  private async callModel(prompt: string): Promise<string> {
    const apiKey = this.config.get("GOOGLE_GENERATIVE_AI_API_KEY", {
      infer: true,
    });
    if (!apiKey) {
      throw new ServiceUnavailableException({
        code: "service_unavailable",
        message: "AI summary is not configured",
      });
    }
    const { generateText } = await import("ai");
    const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
    const google = createGoogleGenerativeAI({ apiKey });

    let lastError: unknown;
    for (let index = 0; index < SUMMARY_MODELS.length; index++) {
      const model = SUMMARY_MODELS[index]!;
      try {
        const { text } = await generateText({
          model: google(model),
          prompt,
          maxRetries: 1,
        });
        return text;
      } catch (err) {
        lastError = err;
        const isLast = index === SUMMARY_MODELS.length - 1;
        if (isLast || !isCapacityError(err)) throw err;
        this.logger.warn(
          `${model} is unavailable, falling back to ${SUMMARY_MODELS[index + 1]}`,
        );
      }
    }
    throw lastError;
  }
}
