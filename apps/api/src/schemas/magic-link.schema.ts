import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type MagicLinkDocument = HydratedDocument<MagicLink>;

@Schema({ collection: "magic_links" })
export class MagicLink {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  tokenHash: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Date })
  usedAt?: Date;
}

export const MagicLinkSchema = SchemaFactory.createForClass(MagicLink);

MagicLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
