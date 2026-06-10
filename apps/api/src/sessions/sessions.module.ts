import { Module } from "@nestjs/common";
import { LessonsModule } from "../lessons/lessons.module";
import { SessionsService } from "./sessions.service";
import { SessionsController } from "./sessions.controller";

@Module({
  imports: [LessonsModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
