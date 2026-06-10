import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import type { SessionClaims, TutorSessionClaims } from "@educatio/shared";
import type { AuthedRequest } from "./jwt-auth.guard";

export const Session = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionClaims => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!req.session) throw new UnauthorizedException();
    return req.session;
  },
);

export const CurrentTutor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TutorSessionClaims => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!req.session) throw new UnauthorizedException();
    if (req.session.kind !== "tutor") {
      throw new ForbiddenException("Tutor session required");
    }
    return req.session;
  },
);
