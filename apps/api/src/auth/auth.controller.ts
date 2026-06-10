import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { Session } from "../common/session.decorator";
import {
  signupSchema,
  signinSchema,
  callbackSchema,
  type SignupInput,
  type SigninInput,
  type CallbackInput,
} from "@educatio/shared/api/auth";
import type { SessionClaims } from "@educatio/shared";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup")
  @HttpCode(200)
  async signup(
    @Body(new ZodValidationPipe(signupSchema)) body: SignupInput,
  ): Promise<{ sent: true }> {
    await this.auth.signup(body);
    return { sent: true };
  }

  @Post("signin")
  @HttpCode(200)
  async signin(
    @Body(new ZodValidationPipe(signinSchema)) body: SigninInput,
  ): Promise<{ sent: true }> {
    await this.auth.signin(body.email);
    return { sent: true };
  }

  @Post("callback")
  @HttpCode(200)
  async callback(
    @Body(new ZodValidationPipe(callbackSchema)) body: CallbackInput,
  ): Promise<{ sessionJwt: string }> {
    return this.auth.callback(body.token);
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
  async me(@Session() session: SessionClaims) {
    return { user: await this.auth.me(session) };
  }
}
