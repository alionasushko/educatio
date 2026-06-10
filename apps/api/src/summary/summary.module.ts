import { Module } from "@nestjs/common";
import { LessonsModule } from "../lessons/lessons.module";
import { SnapshotsModule } from "../snapshots/snapshots.module";
import { SummaryService } from "./summary.service";
import { SummaryController } from "./summary.controller";

@Module({
  imports: [LessonsModule, SnapshotsModule],
  controllers: [SummaryController],
  providers: [SummaryService],
})
export class SummaryModule {}
