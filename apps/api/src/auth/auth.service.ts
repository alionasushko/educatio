import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JwtService, type JwtSignOptions } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { createHash } from "node:crypto";
import { Resend } from "resend";
import * as bcrypt from "bcrypt";
import { User, UserDocument } from "../schemas/user.schema";
import { MagicLink, MagicLinkDocument } from "../schemas/magic-link.schema";
import { generateOpaqueToken } from "../common/ids";
import type { Env } from "../config/env";
import type { PublicUser, TutorSessionClaims } from "@educatio/shared";
import type { SignupInput } from "@educatio/shared/api/auth";

const MAGIC_LINK_TTL_MIN = 10;
const SESSION_TTL = "30d";
const DEMO_SESSION_TTL = "1d";
const DEMO_EMAIL = "demo@educatio.app";
const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_MINUTES = 15;

const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  generateOpaqueToken(),
  BCRYPT_ROUNDS,
);

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: number }).code === 11000
  );
}

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

    if (email === DEMO_EMAIL) return;

    // No password here: signup only creates the (unverified) account and sends
    // the verification magic link. A password is set later, once authenticated,
    // via setPassword — so an unauthenticated caller can never plant one.
    const user = await this.upsertUser(email, {
      email,
      name: input.name,
      teaches: input.teaches,
    });
    await this.sendMagicLink(user);
  }

  async signin(emailRaw: string): Promise<void> {
    const email = emailRaw.toLowerCase().trim();
    if (email === DEMO_EMAIL) return;
    const user = await this.users.findOne({ email });
    if (user) await this.sendMagicLink(user);
  }

  async signinWithPassword(
    emailRaw: string,
    password: string,
  ): Promise<{ sessionJwt: string }> {
    const email = emailRaw.toLowerCase().trim();

    // The demo account is reachable only via the flag-gated demoLogin — it must
    // never carry a password or be sign-in-able here (kill-switch integrity).
    if (email === DEMO_EMAIL) {
      throw new UnauthorizedException({
        code: "invalid_credentials",
        message: "Invalid email or password.",
      });
    }

    const user = await this.users.findOne({ email }).select("+passwordHash");

    const locked =
      !!user?.lockedUntil && user.lockedUntil.getTime() > Date.now();

    // Always run one compare (dummy hash when the account/password is missing)
    // so response time doesn't reveal whether the email is registered. A
    // password can only be set on a verified account, so emailVerified is folded
    // into the SAME generic failure — never a distinct code — to avoid an
    // account-existence / credential-validity oracle. A live lockout also fails
    // with the identical response, so it isn't observable to an attacker.
    const matches = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    if (
      !user ||
      !user.passwordHash ||
      !matches ||
      !user.emailVerified ||
      locked
    ) {
      // Count failures only against a real, unlocked, password-bearing account
      // with a wrong password — a silent per-account lockout the response never
      // reveals. IP throttling can't protect one account across many IPs.
      if (user && user.passwordHash && !locked && !matches) {
        await this.recordFailedLogin(user.id);
      }
      throw new UnauthorizedException({
        code: "invalid_credentials",
        message: "Invalid email or password.",
      });
    }

    // Success clears any accumulated failures / lock (atomic set).
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.users.updateOne(
        { _id: user.id },
        { $set: { failedLoginAttempts: 0, lockedUntil: null } },
      );
    }

    return { sessionJwt: await this.signSession(user) };
  }

  // Atomic $inc so concurrent wrong guesses can't lose increments and slip past
  // the lockout — the multi-request threat the lockout exists to stop.
  private async recordFailedLogin(userId: string): Promise<void> {
    const updated = await this.users.findByIdAndUpdate(
      userId,
      { $inc: { failedLoginAttempts: 1 } },
      { new: true },
    );
    if (updated && updated.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      await this.users.updateOne(
        { _id: userId },
        {
          $set: {
            lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60_000),
            failedLoginAttempts: 0,
          },
        },
      );
    }
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

    return { sessionJwt: await this.signSession(user) };
  }

  async demoLogin(): Promise<{ sessionJwt: string }> {
    if (!this.config.get("ENABLE_DEMO_LOGIN", { infer: true })) {
      throw new ForbiddenException({
        code: "demo_disabled",
        message: "Demo login is not available.",
      });
    }

    const user = await this.upsertUser(DEMO_EMAIL, {
      email: DEMO_EMAIL,
      name: "Demo Tutor",
      teaches: "Mathematics",
      emailVerified: new Date(),
    });

    return { sessionJwt: await this.signSession(user, DEMO_SESSION_TTL) };
  }

  // Set/replace the password on an already-authenticated account. The session
  // is the authority (it was obtained by proving email ownership or with an
  // existing password), so no password can be set by an unauthenticated caller.
  // This is also the recovery path: sign in via magic link, then set a new one.
  async setPassword(
    claims: TutorSessionClaims,
    password: string,
  ): Promise<{ ok: true }> {
    if (claims.email === DEMO_EMAIL) {
      throw new ForbiddenException({
        code: "demo_readonly",
        message: "The demo account can't set a password.",
      });
    }
    const user = await this.users.findById(claims.sub);
    if (!user) throw new UnauthorizedException();
    user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await user.save();
    return { ok: true };
  }

  private async upsertUser(
    email: string,
    insert: Partial<User>,
  ): Promise<UserDocument> {
    try {
      const user = await this.users.findOneAndUpdate(
        { email },
        { $setOnInsert: insert },
        { upsert: true, new: true },
      );
      if (user) return user;
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
    }
    const existing = await this.users.findOne({ email });
    if (!existing) throw new Error(`upsertUser failed for ${email}`);
    return existing;
  }

  async revokeSessions(userId: string): Promise<void> {
    await this.users.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
  }

  private signSession(
    user: UserDocument,
    ttl: JwtSignOptions["expiresIn"] = SESSION_TTL,
  ): Promise<string> {
    const claims: Omit<TutorSessionClaims, "iat" | "exp"> = {
      kind: "tutor",
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion ?? 0,
    };
    return this.jwt.signAsync(claims, { expiresIn: ttl });
  }

  async me(claims: TutorSessionClaims): Promise<PublicUser> {
    const user = await this.users.findById(claims.sub).select("+passwordHash");
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
      hasPassword: !!user.passwordHash,
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
