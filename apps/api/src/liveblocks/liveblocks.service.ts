import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ConfigService } from "@nestjs/config";
import { Liveblocks } from "@liveblocks/node";
import { Lesson, LessonDocument } from "../schemas/lesson.schema";
import type { Env } from "../config/env";
import type { SessionClaims } from "@educatio/shared";

@Injectable()
export class LiveblocksService {
  constructor(
    @InjectModel(Lesson.name) private readonly lessons: Model<LessonDocument>,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async authorize(session: SessionClaims, room: string): Promise<unknown> {
    const lesson = await this.lessons.findOne({ liveblocksRoomId: room });
    if (!lesson) throw new ForbiddenException("Unknown room");

    const allowed =
      session.kind === "tutor"
        ? lesson.tutorId.toString() === session.sub
        : lesson.id === session.lessonId;
    if (!allowed) throw new ForbiddenException("No access to this room");

    const secret = this.config.get("LIVEBLOCKS_SECRET_KEY", { infer: true });
    if (!secret) {
      throw new ServiceUnavailableException({
        code: "service_unavailable",
        message: "Liveblocks is not configured",
      });
    }

    const liveblocks = new Liveblocks({ secret });
    const userId =
      session.kind === "tutor" ? session.sub : `student:${session.lessonId}`;
    const name = session.kind === "tutor" ? session.email : session.name;

    const lbSession = liveblocks.prepareSession(userId, {
      userInfo: { name, role: session.kind },
    });
    lbSession.allow(room, lbSession.FULL_ACCESS);
    const { body } = await lbSession.authorize();
    return JSON.parse(body) as unknown;
  }
}
