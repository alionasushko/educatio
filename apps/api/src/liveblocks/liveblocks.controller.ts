import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { LiveblocksService } from "./liveblocks.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { Session } from "../common/session.decorator";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import {
  liveblocksAuthSchema,
  type LiveblocksAuthInput,
} from "@educatio/shared/api/liveblocks";
import type { SessionClaims } from "@educatio/shared";

@Controller("liveblocks")
@UseGuards(JwtAuthGuard)
export class LiveblocksController {
  constructor(private readonly liveblocks: LiveblocksService) {}

  @Post("auth")
  @HttpCode(200)
  auth(
    @Session() session: SessionClaims,
    @Body(new ZodValidationPipe(liveblocksAuthSchema))
    body: LiveblocksAuthInput,
  ) {
    return this.liveblocks.authorize(session, body.room);
  }
}
