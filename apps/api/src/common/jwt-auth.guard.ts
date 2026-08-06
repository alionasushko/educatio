import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { FastifyRequest } from "fastify";
import { sessionClaimsSchema, type SessionClaims } from "@educatio/shared";

export interface AuthedRequest extends FastifyRequest {
  session?: SessionClaims;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers["authorization"];
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = header.slice("Bearer ".length);
    let payload: unknown;
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException({
        code: "session_expired",
        message: "Invalid or expired session",
      });
    }
    const parsed = sessionClaimsSchema.safeParse(payload);
    if (!parsed.success) {
      throw new UnauthorizedException({
        code: "session_expired",
        message: "Invalid session claims",
      });
    }
    req.session = parsed.data;
    return true;
  }
}
