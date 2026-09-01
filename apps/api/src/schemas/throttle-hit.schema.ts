import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ThrottleHitDocument = HydratedDocument<ThrottleHit>;

@Schema({ collection: "throttle_hits", _id: false })
export class ThrottleHit {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ required: true, default: 0 })
  totalHits: number;

  @Prop({ type: Date, required: true, index: { expireAfterSeconds: 0 } })
  expiresAt: Date;

  @Prop({ type: Date })
  blockExpiresAt?: Date;
}

export const ThrottleHitSchema = SchemaFactory.createForClass(ThrottleHit);
