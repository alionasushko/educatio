import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LessonsModule } from "../lessons/lessons.module";
import { SnapshotsService } from "./snapshots.service";
import { SnapshotsController } from "./snapshots.controller";
import {
  LessonSnapshot,
  LessonSnapshotSchema,
} from "../schemas/lesson-snapshot.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LessonSnapshot.name, schema: LessonSnapshotSchema },
    ]),
    LessonsModule,
  ],
  controllers: [SnapshotsController],
  providers: [SnapshotsService],
  exports: [SnapshotsService],
})
export class SnapshotsModule {}
