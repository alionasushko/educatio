import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LessonsService } from "./lessons.service";
import { LessonsController } from "./lessons.controller";
import { Lesson, LessonSchema } from "../schemas/lesson.schema";
import {
  LessonSnapshot,
  LessonSnapshotSchema,
} from "../schemas/lesson-snapshot.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lesson.name, schema: LessonSchema },
      { name: LessonSnapshot.name, schema: LessonSnapshotSchema },
    ]),
  ],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService, MongooseModule],
})
export class LessonsModule {}
