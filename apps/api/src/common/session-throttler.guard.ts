import { Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import {
  ThrottlerGuard,
  getOptionsToken,
  getStorageToken,
  type ThrottlerModuleOptions,
  type ThrottlerStorage,
} from "@nestjs/throttler";
import { sessionClaimsSchema } from "@educatio/shared";

@Injectable()
export class SessionThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject(getOptionsToken()) options: ThrottlerModuleOptions,
    @Inject(getStorageToken()) storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwt: JwtService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const identity = await this.sessionIdentity(req);
    if (identity) return identity;
    return super.getTracker(req);
  }

  private async sessionIdentity(
    req: Record<string, unknown>,
  ): Promise<string | null> {
    const headers = req.headers as
      | Record<string, string | undefined>
      | undefined;
    const header = headers?.["authorization"];
    if (!header?.startsWith("Bearer ")) return null;

    try {
      const parsed = sessionClaimsSchema.safeParse(
        await this.jwt.verifyAsync(header.slice("Bearer ".length)),
      );
      if (!parsed.success) return null;
      return parsed.data.kind === "tutor"
        ? `tutor:${parsed.data.sub}`
        : `student:${parsed.data.lessonId}`;
    } catch {
      return null;
    }
  }
}
