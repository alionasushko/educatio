import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

export type UploadDocument = HydratedDocument<Upload>;

@Schema({ collection: "uploads", timestamps: true })
export class Upload {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: "Lesson",
    required: true,
    index: true,
  })
  lessonId: Types.ObjectId;

  @Prop({ required: true })
  url: string;

  createdAt: Date;
}

export const UploadSchema = SchemaFactory.createForClass(Upload);
