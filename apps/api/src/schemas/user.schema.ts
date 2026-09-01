import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: "users" })
export class User {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  image?: string;

  @Prop({ type: Date, default: null })
  emailVerified: Date | null;

  @Prop({ select: false })
  passwordHash?: string;

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop({ default: 0 })
  tokenVersion: number;

  @Prop({ type: Date, default: null })
  lockedUntil: Date | null;

  @Prop()
  teaches?: string;

  @Prop({ default: false, index: true })
  isDemo: boolean;

  @Prop({ type: Date })
  expiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
