import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  LessonSnapshot,
  LessonSnapshotDocument,
} from "../schemas/lesson-snapshot.schema";
import { LessonsService } from "../lessons/lessons.service";
import type { SessionClaims } from "@educatio/shared";

@Injectable()
export class SnapshotsService {
  constructor(
    @InjectModel(LessonSnapshot.name)
    private readonly snapshots: Model<LessonSnapshotDocument>,
    private readonly lessonsService: LessonsService,
  ) {}

  async save(
    lessonId: string,
    session: SessionClaims,
    canvasState: Record<string, unknown>,
  ): Promise<{ ok: true }> {
    const lesson = await this.lessonsService.findOr404(lessonId);
    this.lessonsService.assertCanRead(lesson, session);
    await this.snapshots.create({ lessonId: lesson._id, canvasState });
    return { ok: true };
  }

  async latest(lessonId: string): Promise<Record<string, unknown> | null> {
    const doc = await this.snapshots
      .findOne({ lessonId })
      .sort({ snapshotAt: -1 });
    return doc ? doc.canvasState : null;
  }
}
