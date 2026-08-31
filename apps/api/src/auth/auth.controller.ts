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
import { AUTH_SEGMENT, AUTH_ACTIONS } from "@educatio/shared/api/auth";

@Controller(AUTH_SEGMENT)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post(AUTH_ACTIONS.signup)
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async signup(
    @Body(new ZodValidationPipe(signupSchema)) body: SignupInput,
  ): Promise<{ sent: true; binding: string }> {
    const { binding } = await this.auth.signup(body);
    return { sent: true, binding };
  }

  @Post(AUTH_ACTIONS.signin)
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async signin(
    @Body(new ZodValidationPipe(signinSchema)) body: SigninInput,
  ): Promise<{ sent: true; binding: string }> {
    const { binding } = await this.auth.signin(body.email);
    return { sent: true, binding };
  }

  @Post(AUTH_ACTIONS.signinPassword)
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async signinPassword(
    @Body(new ZodValidationPipe(passwordSigninSchema))
    body: PasswordSigninInput,
  ): Promise<{ sessionJwt: string }> {
    return this.auth.signinWithPassword(body.email, body.password);
  }

  @Post(AUTH_ACTIONS.password)
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async setPassword(
    @CurrentTutor() tutor: TutorSessionClaims,
    @Body(new ZodValidationPipe(setPasswordSchema)) body: SetPasswordInput,
  ): Promise<{ ok: true }> {
    return this.auth.setPassword(tutor, body.password);
  }

  @Post(AUTH_ACTIONS.callback)
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async callback(
    @Body(new ZodValidationPipe(callbackSchema)) body: CallbackInput,
  ): Promise<{ sessionJwt: string }> {
    return this.auth.callback(body.token, body.binding);
  }

  @Post(AUTH_ACTIONS.demo)
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async demo(): Promise<{ sessionJwt: string }> {
    return this.auth.demoLogin();
  }

  @Post(AUTH_ACTIONS.signout)
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async signout(
    @CurrentTutor() tutor: TutorSessionClaims,
  ): Promise<{ ok: true }> {
    await this.auth.revokeSessions(tutor.sub);
    return { ok: true };
  }

  @Get(AUTH_ACTIONS.me)
  @UseGuards(JwtAuthGuard)
  async me(@CurrentTutor() tutor: TutorSessionClaims) {
    return { user: await this.auth.me(tutor) };
  }
}
