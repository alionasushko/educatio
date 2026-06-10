import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LessonsService } from "../lessons/lessons.service";
import { SnapshotsService } from "../snapshots/snapshots.service";
import type { Env } from "../config/env";
import type { CanvasElement, LessonSummary } from "@educatio/shared";

const SUMMARY_MODEL = "claude-sonnet-4-6";

@Injectable()
export class SummaryService {
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
    const durationMinutes = lesson.durationSeconds
      ? Math.round(lesson.durationSeconds / 60)
      : 0;

    const prompt = this.buildPrompt(
      lesson.title,
      lesson.studentName ?? "the student",
      durationMinutes,
      serialized,
    );

    const text = await this.callClaude(prompt);
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
    durationMinutes: number,
    serializedElements: string,
  ): string {
    return `You are summarizing a tutoring lesson based on the contents of a collaborative whiteboard.

Lesson title: ${title}
Student: ${studentName}
Duration: ${durationMinutes} minutes

Canvas contents (in spatial order, top-to-bottom, left-to-right):
${serializedElements}

Generate a concise lesson summary in markdown format with these sections:
- **Topics covered** (bullet list of main topics, inferred from canvas content)
- **Key concepts** (3–5 main ideas or formulas discussed)
- **Examples worked through** (problems or examples explored, if identifiable)
- **Suggested next steps** (2–3 specific things the student should review or practice before the next lesson)

Keep the summary under 400 words. Use a warm, professional tone — this will be sent to the student.`;
  }

  private async callClaude(prompt: string): Promise<string> {
    const apiKey = this.config.get("ANTHROPIC_API_KEY", { infer: true });
    if (!apiKey) {
      throw new ServiceUnavailableException("AI summary is not configured");
    }
    const { generateText } = await import("ai");
    const { createAnthropic } = await import("@ai-sdk/anthropic");
    const anthropic = createAnthropic({ apiKey });
    const { text } = await generateText({
      model: anthropic(SUMMARY_MODEL),
      prompt,
    });
    return text;
  }
}
