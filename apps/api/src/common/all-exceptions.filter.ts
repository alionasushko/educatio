import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";
import type { ApiError } from "@educatio/shared/api/errors";

function codeFromStatus(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return "bad_request";
    case HttpStatus.UNAUTHORIZED:
      return "unauthorized";
    case HttpStatus.FORBIDDEN:
      return "forbidden";
    case HttpStatus.NOT_FOUND:
      return "not_found";
    case HttpStatus.CONFLICT:
      return "conflict";
    default:
      return "internal_error";
  }
}

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
        body = { code: codeFromStatus(status), message: response };
      } else {
        const obj = response as Record<string, unknown>;
        body = {
          code: (obj.code as string) ?? codeFromStatus(status),
          message: (obj.message as string | undefined) ?? exception.message,
          details: obj.details,
        };
      }
      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(exception.stack ?? exception.message);
        body = { code: body.code, message: "Something went wrong" };
      }
    } else {
      this.logger.error(
        exception instanceof Error ? exception.stack : exception,
      );
    }

    void res.status(status).send(body);
  }
}
