import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Liveblocks } from "@liveblocks/node";
import { LessonsService } from "../lessons/lessons.service";
import type { Env } from "../config/env";
import type { SessionClaims } from "@educatio/shared";

@Injectable()
export class LiveblocksService {
  private readonly logger = new Logger(LiveblocksService.name);

  constructor(
    private readonly lessonsService: LessonsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async authorize(session: SessionClaims, room: string): Promise<unknown> {
    const lesson = await this.lessonsService.findByRoomOr404(room);
    this.lessonsService.assertCanWrite(lesson, session);

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
    const { status, body, error } = await lbSession.authorize();

    if (status !== 200 || error) {
      this.unavailable(
        `refused a room token for ${room}: status ${status}${error ? ` — ${error.message}` : ""}`,
      );
    }

    try {
      return JSON.parse(body) as unknown;
    } catch {
      this.unavailable(`returned a token for ${room} that is not JSON`);
    }
  }

  private unavailable(reason: string): never {
    this.logger.error(`Liveblocks ${reason}`);
    throw new ServiceUnavailableException({
      code: "service_unavailable",
      message: "Liveblocks is unavailable",
    });
  }
}
