import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import { Lesson, LessonDocument } from "../schemas/lesson.schema";
import type { StudentSessionClaims } from "@educatio/shared";
import type { StudentSessionInput } from "@educatio/shared/api/sessions";

const STUDENT_SESSION_TTL = "7d";

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Lesson.name) private readonly lessons: Model<LessonDocument>,
    private readonly jwt: JwtService,
  ) {}

  async createStudentSession(
    input: StudentSessionInput,
  ): Promise<{ sessionJwt: string }> {
    const lesson = await this.lessons.findOne({ inviteCode: input.inviteCode });
    if (!lesson) {
      throw new NotFoundException({
        code: "invalid_invite",
        message: "That invite link is not valid.",
      });
    }

    if (!lesson.studentName) {
      lesson.studentName = input.name;
      await lesson.save();
    }

    const claims: Omit<StudentSessionClaims, "iat" | "exp"> = {
      kind: "student",
      lessonId: lesson.id,
      name: input.name,
    };
    const sessionJwt = await this.jwt.signAsync(claims, {
      expiresIn: STUDENT_SESSION_TTL,
    });
    return { sessionJwt };
  }
}
