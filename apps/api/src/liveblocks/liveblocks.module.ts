import { Module } from "@nestjs/common";
import { LessonsModule } from "../lessons/lessons.module";
import { LiveblocksService } from "./liveblocks.service";
import { LiveblocksController } from "./liveblocks.controller";

@Module({
  imports: [LessonsModule],
  controllers: [LiveblocksController],
  providers: [LiveblocksService],
})
export class LiveblocksModule {}
