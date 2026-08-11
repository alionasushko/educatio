import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

export type LessonSnapshotDocument = HydratedDocument<LessonSnapshot>;

@Schema({ collection: "lesson_snapshots" })
export class LessonSnapshot {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: "Lesson",
    required: true,
    index: true,
  })
  lessonId: Types.ObjectId;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  canvasState: Record<string, unknown>;

  @Prop({ type: Date, default: Date.now })
  snapshotAt: Date;
}

export const LessonSnapshotSchema =
  SchemaFactory.createForClass(LessonSnapshot);
