import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ConfigService } from "@nestjs/config";
import { Model, Types } from "mongoose";
import { randomUUID } from "node:crypto";
import { Liveblocks } from "@liveblocks/node";
import { del } from "@vercel/blob";
import { Lesson, LessonDocument } from "../schemas/lesson.schema";
import { User, UserDocument } from "../schemas/user.schema";
import { Upload, UploadDocument } from "../schemas/upload.schema";
import {
  LessonSnapshot,
  LessonSnapshotDocument,
} from "../schemas/lesson-snapshot.schema";
import { generateInviteCode } from "../common/ids";
import type { Env } from "../config/env";
import type { Lesson as LessonDTO, SessionClaims } from "@educatio/shared";
import type {
  CreateLessonInput,
  ListLessonsQuery,
  UpdateLessonInput,
} from "@educatio/shared/api/lessons";

const BLOB_DELETE_BATCH = 100;

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

@Injectable()
export class LessonsService {
  private readonly logger = new Logger(LessonsService.name);

  constructor(
    @InjectModel(Lesson.name) private readonly lessons: Model<LessonDocument>,
    @InjectModel(LessonSnapshot.name)
    private readonly snapshots: Model<LessonSnapshotDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Upload.name) private readonly uploads: Model<UploadDocument>,
    private readonly config: ConfigService<Env, true>,
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
      status: "active",
    });
    return { id: lesson.id, inviteCode, liveblocksRoomId };
  }

  async delete(id: string, tutorId: string): Promise<{ ok: true }> {
    const lesson = await this.getOwnedOr403(id, tutorId);
    const roomId = lesson.liveblocksRoomId;
    await this.snapshots.deleteMany({ lessonId: lesson._id });
    await this.deleteUploads([lesson._id]);
    await lesson.deleteOne();
    await this.deleteRoomBestEffort(roomId);
    return { ok: true };
  }

  async deleteAllForTutor(tutorId: string): Promise<void> {
    const owned = await this.lessons
      .find({ tutorId })
      .select("_id liveblocksRoomId");
    if (!owned.length) return;

    const lessonIds = owned.map((l) => l._id);
    await this.snapshots.deleteMany({ lessonId: { $in: lessonIds } });
    await this.deleteUploads(lessonIds);
    await this.lessons.deleteMany({ tutorId });
    for (const lesson of owned) {
      await this.deleteRoomBestEffort(lesson.liveblocksRoomId);
    }
  }

  private async deleteUploads(lessonIds: Types.ObjectId[]): Promise<void> {
    const rows = await this.uploads
      .find({ lessonId: { $in: lessonIds } })
      .select("url");
    if (!rows.length) return;

    const token = this.config.get("BLOB_READ_WRITE_TOKEN", { infer: true });
    if (token) {
      const urls = rows.map((row) => row.url);
      for (let i = 0; i < urls.length; i += BLOB_DELETE_BATCH) {
        const batch = urls.slice(i, i + BLOB_DELETE_BATCH);
        try {
          await del(batch, { token });
        } catch (err) {
          this.logger.warn(
            `Failed to delete ${batch.length} blobs: ${String(err)}`,
          );
        }
      }
    }

    await this.uploads.deleteMany({ lessonId: { $in: lessonIds } });
  }

  private async deleteRoomBestEffort(roomId: string): Promise<void> {
    const secret = this.config.get("LIVEBLOCKS_SECRET_KEY", { infer: true });
    if (!secret) return;
    try {
      await new Liveblocks({ secret }).deleteRoom(roomId);
    } catch (err) {
      this.logger.warn(
        `Failed to delete Liveblocks room ${roomId}: ${String(err)}`,
      );
    }
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
    if (query.q) {
      const rx = new RegExp(escapeRegex(query.q), "i");
      filter.$or = [{ title: rx }, { studentName: rx }];
    }

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

    const tutor = await this.users
      .findById(lesson.tutorId)
      .select("name")
      .lean<{ name?: string } | null>();

    return { ...this.toDTO(lesson), tutorName: tutor?.name };
  }

  async update(
    id: string,
    tutorId: string,
    input: UpdateLessonInput,
  ): Promise<LessonDTO> {
    const lesson = await this.findOr404(id);
    if (lesson.tutorId.toString() !== tutorId) {
      throw new NotFoundException("Lesson not found");
    }

    if (input.title !== undefined) lesson.title = input.title;
    if (input.studentName !== undefined) lesson.studentName = input.studentName;
    if (input.videoCallUrl !== undefined)
      lesson.videoCallUrl = input.videoCallUrl;

    if (input.status !== undefined && input.status !== lesson.status) {
      if (input.status === "ended") lesson.endedAt = new Date();
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
      throw new NotFoundException("Lesson not found");
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
    if (!ok) throw new NotFoundException("Lesson not found");
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
      studentEmail: d.studentEmail,
      videoCallUrl: d.videoCallUrl,
      inviteCode: d.inviteCode,
      status: d.status,
      endedAt: d.endedAt?.toISOString(),
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
