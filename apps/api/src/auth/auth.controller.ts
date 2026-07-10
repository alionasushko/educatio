import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentTutor } from "../common/session.decorator";
import {
  signupSchema,
  signinSchema,
  passwordSigninSchema,
  setPasswordSchema,
  callbackSchema,
  type SignupInput,
  type SigninInput,
  type PasswordSigninInput,
  type SetPasswordInput,
  type CallbackInput,
} from "@educatio/shared/api/auth";
import type { TutorSessionClaims } from "@educatio/shared";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async signup(
    @Body(new ZodValidationPipe(signupSchema)) body: SignupInput,
  ): Promise<{ sent: true }> {
    await this.auth.signup(body);
    return { sent: true };
  }

  @Post("signin")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async signin(
    @Body(new ZodValidationPipe(signinSchema)) body: SigninInput,
  ): Promise<{ sent: true }> {
    await this.auth.signin(body.email);
    return { sent: true };
  }

  @Post("signin/password")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async signinPassword(
    @Body(new ZodValidationPipe(passwordSigninSchema))
    body: PasswordSigninInput,
  ): Promise<{ sessionJwt: string }> {
    return this.auth.signinWithPassword(body.email, body.password);
  }

  @Post("password")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async setPassword(
    @CurrentTutor() tutor: TutorSessionClaims,
    @Body(new ZodValidationPipe(setPasswordSchema)) body: SetPasswordInput,
  ): Promise<{ ok: true }> {
    return this.auth.setPassword(tutor, body.password);
  }

  @Post("callback")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async callback(
    @Body(new ZodValidationPipe(callbackSchema)) body: CallbackInput,
  ): Promise<{ sessionJwt: string }> {
    return this.auth.callback(body.token);
  }

  @Post("demo")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async demo(): Promise<{ sessionJwt: string }> {
    return this.auth.demoLogin();
  }

  @Post("signout")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  signout(): { ok: true } {
    // v1 sessions are stateless; the web clears its cookie. Placeholder for future revocation.
    return { ok: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentTutor() tutor: TutorSessionClaims) {
    return { user: await this.auth.me(tutor) };
  }
}
