import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";
import * as Sentry from "@sentry/nestjs";
import {
  errorCodeSchema,
  errorCodeFromStatus,
} from "@educatio/shared/api/errors";
import type { ApiError, ErrorCode } from "@educatio/shared/api/errors";

const toErrorCode = (value: unknown, status: number): ErrorCode => {
  const parsed = errorCodeSchema.safeParse(value);
  return parsed.success ? parsed.data : errorCodeFromStatus(status);
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exception");

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ApiError = {
      code: "internal_error",
      message: "Something went wrong",
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === "string") {
        body = { code: errorCodeFromStatus(status), message: response };
      } else {
        const obj = response as Record<string, unknown>;
        body = {
          code: toErrorCode(obj.code, status),
          message:
            typeof obj.message === "string" ? obj.message : exception.message,
          details: obj.details,
        };
      }
      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.report(exception);
        body = { code: body.code, message: "Something went wrong" };
      }
    } else {
      this.report(exception);
    }

    void res.status(status).send(body);
  }

  private report(exception: unknown): void {
    this.logger.error(exception instanceof Error ? exception.stack : exception);
    Sentry.captureException(exception);
  }
}
