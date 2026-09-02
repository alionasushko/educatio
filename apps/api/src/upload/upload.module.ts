import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UploadService } from "./upload.service";
import { UploadController } from "./upload.controller";
import { Upload, UploadSchema } from "../schemas/upload.schema";
import { LessonsModule } from "../lessons/lessons.module";

@Module({
  imports: [
    LessonsModule,
    MongooseModule.forFeature([{ name: Upload.name, schema: UploadSchema }]),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
