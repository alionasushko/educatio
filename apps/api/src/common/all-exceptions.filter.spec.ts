import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import type { ArgumentsHost } from "@nestjs/common";
import { AllExceptionsFilter } from "./all-exceptions.filter";

const captureException = vi.fn();
vi.mock("@sentry/nestjs", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

const sent: { status?: number; body?: unknown } = {};

const host = {
  switchToHttp: () => ({
    getResponse: () => ({
      status(code: number) {
        sent.status = code;
        return {
          send(body: unknown) {
            sent.body = body;
          },
        };
      },
    }),
  }),
} as unknown as ArgumentsHost;

const filter = new AllExceptionsFilter();

beforeEach(() => {
  captureException.mockClear();
  delete sent.status;
  delete sent.body;
});

describe("errors worth waking someone for", () => {
  it("reports a thrown error that no handler expected", () => {
    const boom = new Error("mongo went away");
    filter.catch(boom, host);

    expect(captureException).toHaveBeenCalledWith(boom);
    expect(sent.status).toBe(500);
    expect(sent.body).toMatchObject({ code: "internal_error" });
  });

  it("reports a deliberate 500", () => {
    filter.catch(new InternalServerErrorException("nope"), host);
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it("hides the detail of a 500 from the caller", () => {
    filter.catch(new InternalServerErrorException("mongo dsn leaked"), host);
    expect(JSON.stringify(sent.body)).not.toContain("dsn");
  });
});

describe("errors that are just the client being wrong", () => {
  it("says nothing about a 404", () => {
    filter.catch(new NotFoundException("Lesson not found"), host);

    expect(captureException).not.toHaveBeenCalled();
    expect(sent.status).toBe(404);
  });

  it("says nothing about a rejected payload", () => {
    filter.catch(
      new BadRequestException({
        code: "validation_error",
        message: "Invalid request payload",
      }),
      host,
    );

    expect(captureException).not.toHaveBeenCalled();
    expect(sent.body).toMatchObject({ code: "validation_error" });
  });
});
