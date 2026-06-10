import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { randomUUID } from "node:crypto";
import { Lesson, LessonDocument } from "../schemas/lesson.schema";
import { generateInviteCode } from "../common/ids";
import type { Lesson as LessonDTO, SessionClaims } from "@educatio/shared";
import type {
  CreateLessonInput,
  ListLessonsQuery,
  UpdateLessonInput,
} from "@educatio/shared/api/lessons";

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Lesson.name) private readonly lessons: Model<LessonDocument>,
  ) {}

  async create(
    tutorId: string,
    input: CreateLessonInput,
  ): Promise<{ id: string; inviteCode: string; liveblocksRoomId: string }> {
    const inviteCode = await this.uniqueInviteCode();
    const liveblocksRoomId = `lesson_${randomUUID()}`;
    const lesson = await this.lessons.create({
      tutorId: new Types.ObjectId(tutorId),
      title: input.title,
      studentName: input.studentName,
      videoCallUrl: input.videoCallUrl,
      inviteCode,
      liveblocksRoomId,
      status: "scheduled",
    });
    return { id: lesson.id, inviteCode, liveblocksRoomId };
  }

  async list(
    tutorId: string,
    query: ListLessonsQuery,
  ): Promise<{
    lessons: LessonDTO[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const filter: Record<string, unknown> = {
      tutorId: new Types.ObjectId(tutorId),
    };
    if (query.status !== "all") filter.status = query.status;

    const [docs, total] = await Promise.all([
      this.lessons
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      this.lessons.countDocuments(filter),
    ]);

    return {
      lessons: docs.map((d) => this.toDTO(d)),
      total,
      page: query.page,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async getForSession(id: string, session: SessionClaims): Promise<LessonDTO> {
    const lesson = await this.findOr404(id);
    this.assertCanRead(lesson, session);
    return this.toDTO(lesson);
  }

  async update(
    id: string,
    tutorId: string,
    input: UpdateLessonInput,
  ): Promise<LessonDTO> {
    const lesson = await this.findOr404(id);
    if (lesson.tutorId.toString() !== tutorId) {
      throw new ForbiddenException("Not your lesson");
    }

    if (input.title !== undefined) lesson.title = input.title;
    if (input.studentName !== undefined) lesson.studentName = input.studentName;
    if (input.videoCallUrl !== undefined)
      lesson.videoCallUrl = input.videoCallUrl;

    if (input.status !== undefined && input.status !== lesson.status) {
      if (input.status === "active" && !lesson.startedAt) {
        lesson.startedAt = new Date();
      }
      if (input.status === "ended") {
        lesson.endedAt = new Date();
        if (lesson.startedAt) {
          lesson.durationSeconds = Math.round(
            (lesson.endedAt.getTime() - lesson.startedAt.getTime()) / 1000,
          );
        }
      }
      lesson.status = input.status;
    }

    await lesson.save();
    return this.toDTO(lesson);
  }

  async findOr404(id: string): Promise<LessonDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException("Lesson not found");
    const lesson = await this.lessons.findById(id);
    if (!lesson) throw new NotFoundException("Lesson not found");
    return lesson;
  }

  async getOwnedOr403(id: string, tutorId: string): Promise<LessonDocument> {
    const lesson = await this.findOr404(id);
    if (lesson.tutorId.toString() !== tutorId) {
      throw new ForbiddenException("Not your lesson");
    }
    return lesson;
  }

  async saveSummary(
    lesson: LessonDocument,
    text: string,
  ): Promise<{ text: string; generatedAt: string }> {
    const generatedAt = new Date();
    lesson.summary = { text, generatedAt };
    await lesson.save();
    return { text, generatedAt: generatedAt.toISOString() };
  }

  assertCanRead(lesson: LessonDocument, session: SessionClaims): void {
    const ok =
      session.kind === "tutor"
        ? lesson.tutorId.toString() === session.sub
        : lesson.id === session.lessonId;
    if (!ok) throw new ForbiddenException("No access to this lesson");
  }

  private async uniqueInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateInviteCode(10);
      const exists = await this.lessons.exists({ inviteCode: code });
      if (!exists) return code;
    }
    throw new Error("Could not generate a unique invite code");
  }

  private toDTO(d: LessonDocument): LessonDTO {
    return {
      id: d.id,
      tutorId: d.tutorId.toString(),
      title: d.title,
      studentName: d.studentName,
      videoCallUrl: d.videoCallUrl,
      inviteCode: d.inviteCode,
      status: d.status,
      startedAt: d.startedAt?.toISOString(),
      endedAt: d.endedAt?.toISOString(),
      durationSeconds: d.durationSeconds,
      liveblocksRoomId: d.liveblocksRoomId,
      summary: d.summary
        ? {
            text: d.summary.text,
            generatedAt: d.summary.generatedAt.toISOString(),
          }
        : undefined,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  }
}
