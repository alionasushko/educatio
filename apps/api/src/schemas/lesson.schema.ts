import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import type { LessonStatus } from "@educatio/shared";

@Schema({ _id: false })
export class LessonSummarySub {
  @Prop({ required: true })
  text: string;

  @Prop({ type: Date, default: Date.now })
  generatedAt: Date;
}
const LessonSummarySchema = SchemaFactory.createForClass(LessonSummarySub);

export type LessonDocument = HydratedDocument<Lesson>;

@Schema({ timestamps: true, collection: "lessons" })
export class Lesson {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: "User",
    required: true,
    index: true,
  })
  tutorId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  studentName?: string;

  @Prop()
  videoCallUrl?: string;

  @Prop({ required: true, unique: true, index: true })
  inviteCode: string;

  @Prop({
    type: String,
    enum: ["scheduled", "active", "ended"],
    default: "scheduled",
    index: true,
  })
  status: LessonStatus;

  @Prop({ type: Date })
  startedAt?: Date;

  @Prop({ type: Date })
  endedAt?: Date;

  @Prop({ type: Number })
  durationSeconds?: number;

  @Prop({ required: true, unique: true })
  liveblocksRoomId: string;

  @Prop({ type: LessonSummarySchema, default: undefined })
  summary?: LessonSummarySub;

  createdAt: Date;
  updatedAt: Date;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);
