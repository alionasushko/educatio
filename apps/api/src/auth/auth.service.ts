import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { createHash } from "node:crypto";
import { Resend } from "resend";
import { User, UserDocument } from "../schemas/user.schema";
import { MagicLink, MagicLinkDocument } from "../schemas/magic-link.schema";
import { generateOpaqueToken } from "../common/ids";
import type { Env } from "../config/env";
import type { PublicUser, TutorSessionClaims } from "@educatio/shared";
import type { SignupInput } from "@educatio/shared/api/auth";

const MAGIC_LINK_TTL_MIN = 10;
const SESSION_TTL = "30d";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(MagicLink.name)
    private readonly magicLinks: Model<MagicLinkDocument>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async signup(input: SignupInput): Promise<void> {
    const email = input.email.toLowerCase().trim();
    const user =
      (await this.users.findOne({ email })) ??
      (await this.users.create({
        email,
        name: input.name,
        teaches: input.teaches,
      }));
    await this.sendMagicLink(user);
  }

  async signin(emailRaw: string): Promise<void> {
    const email = emailRaw.toLowerCase().trim();
    const user = await this.users.findOne({ email });
    if (user) await this.sendMagicLink(user);
  }

  async callback(rawToken: string): Promise<{ sessionJwt: string }> {
    const tokenHash = this.hash(rawToken);
    const link = await this.magicLinks.findOneAndUpdate(
      { tokenHash, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
      { new: true },
    );
    if (!link) {
      throw new UnauthorizedException({
        code: "invalid_token",
        message: "This sign-in link is invalid or has expired.",
      });
    }

    const user = await this.users.findById(link.userId);
    if (!user) {
      throw new UnauthorizedException({
        code: "invalid_token",
        message: "Account not found.",
      });
    }
    if (!user.emailVerified) {
      user.emailVerified = new Date();
      await user.save();
    }

    const claims: Omit<TutorSessionClaims, "iat" | "exp"> = {
      kind: "tutor",
      sub: user.id,
      email: user.email,
    };
    const sessionJwt = await this.jwt.signAsync(claims, {
      expiresIn: SESSION_TTL,
    });
    return { sessionJwt };
  }

  async me(claims: TutorSessionClaims): Promise<PublicUser> {
    const user = await this.users.findById(claims.sub);
    if (!user) throw new UnauthorizedException();
    return this.toPublic(user);
  }

  private toPublic(user: UserDocument): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      teaches: user.teaches,
    };
  }

  private async sendMagicLink(user: UserDocument): Promise<void> {
    const raw = generateOpaqueToken();
    await this.magicLinks.create({
      userId: user._id,
      tokenHash: this.hash(raw),
      expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MIN * 60_000),
    });

    const url = `${this.config.get("WEB_ORIGIN", { infer: true })}/auth/callback?token=${raw}`;
    const apiKey = this.config.get("RESEND_API_KEY", { infer: true });
    const from = this.config.get("EMAIL_FROM", { infer: true });

    if (!apiKey || !from) {
      if (this.config.get("NODE_ENV", { infer: true }) === "production") {
        throw new ServiceUnavailableException(
          "Email delivery is not configured",
        );
      }
      // Dev-only fallback: log the link rather than failing when email isn't configured.
      this.logger.warn(
        `RESEND not configured — magic link for ${user.email}: ${url}`,
      );
      return;
    }

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: user.email,
      subject: "Your Educatio sign-in link",
      html: `<p>Click to sign in to Educatio:</p><p><a href="${url}">Sign in to Educatio</a></p><p>This link expires in ${MAGIC_LINK_TTL_MIN} minutes. If you didn't request it, you can ignore this email.</p>`,
    });
  }

  private hash(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }
}
