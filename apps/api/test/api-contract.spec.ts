import { beforeAll, afterAll, describe, expect, it } from "vitest";
import type { ZodType } from "zod";
import { apiErrorSchema } from "@educatio/shared/api/errors";
import { okResponseSchema } from "@educatio/shared/api/common";
import {
  AUTH_ACTIONS,
  authPath,
  meResponseSchema,
  sentResponseSchema,
} from "@educatio/shared/api/auth";
import {
  LESSONS_PATH,
  lessonPath,
  createLessonResponseSchema,
  lessonListResponseSchema,
  lessonSchema,
} from "@educatio/shared/api/lessons";
import { startApi, type Harness } from "./harness";

let api: Harness;

beforeAll(async () => {
  api = await startApi();
}, 120_000);

afterAll(async () => {
  await api?.close();
});

interface CallOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

const call = async (
  path: string,
  { method = "GET", body, auth = true }: CallOptions = {},
) => {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) headers["Authorization"] = `Bearer ${api.tutorJwt}`;

  const res = await fetch(`${api.baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return {
    status: res.status,
    data: text ? (JSON.parse(text) as unknown) : null,
  };
};

const expectShape = <T>(schema: ZodType<T>, data: unknown): T => {
  const parsed = schema.safeParse(data);
  expect(parsed.error?.issues ?? []).toEqual([]);
  if (!parsed.success) throw parsed.error;
  return parsed.data;
};

describe("api responses match the shared contract", () => {
  it("GET /auth/me", async () => {
    const { status, data } = await call(authPath(AUTH_ACTIONS.me));
    expect(status).toBe(200);
    expectShape(meResponseSchema, data);
  });

  it("POST /auth/signup", async () => {
    const { status, data } = await call(authPath(AUTH_ACTIONS.signup), {
      method: "POST",
      auth: false,
      body: { name: "New Tutor", email: "new-tutor@example.com" },
    });
    expect(status).toBe(200);
    expectShape(sentResponseSchema, data);
  });

  it("the lesson lifecycle: create, list, read, update, delete", async () => {
    const created = await call(LESSONS_PATH, {
      method: "POST",
      body: { title: "Algebra week 2", studentName: "Jordan" },
    });
    expect(created.status).toBe(201);
    const { id } = expectShape(createLessonResponseSchema, created.data);

    const list = await call(`${LESSONS_PATH}?page=1&limit=20&status=all`);
    expect(list.status).toBe(200);
    const page = expectShape(lessonListResponseSchema, list.data);
    expect(page.lessons.some((lesson) => lesson.id === id)).toBe(true);

    const read = await call(lessonPath(id));
    expect(read.status).toBe(200);
    expectShape(lessonSchema, read.data);

    const updated = await call(lessonPath(id), {
      method: "PATCH",
      body: { status: "ended" },
    });
    expect(updated.status).toBe(200);
    const lesson = expectShape(lessonSchema, updated.data);
    expect(lesson.status).toBe("ended");

    const deleted = await call(lessonPath(id), { method: "DELETE" });
    expect(deleted.status).toBe(200);
    expectShape(okResponseSchema, deleted.data);
  });
});

describe("api errors match the shared envelope", () => {
  it("rejects a missing bearer token as unauthorized", async () => {
    const { status, data } = await call(LESSONS_PATH, { auth: false });
    expect(status).toBe(401);
    expect(expectShape(apiErrorSchema, data).code).toBe("unauthorized");
  });

  it("names an expired or malformed token session_expired", async () => {
    const res = await fetch(`${api.baseUrl}${LESSONS_PATH}`, {
      headers: { Authorization: "Bearer not-a-jwt" },
    });
    const data = (await res.json()) as unknown;
    expect(res.status).toBe(401);
    expect(expectShape(apiErrorSchema, data).code).toBe("session_expired");
  });

  it("rejects a body Zod refuses as validation_error", async () => {
    const { status, data } = await call(LESSONS_PATH, {
      method: "POST",
      body: { title: "" },
    });
    expect(status).toBe(400);
    expect(expectShape(apiErrorSchema, data).code).toBe("validation_error");
  });

  it("refuses a javascript: video url", async () => {
    const { status, data } = await call(LESSONS_PATH, {
      method: "POST",
      body: { title: "Sneaky", videoCallUrl: "javascript:alert(1)" },
    });
    expect(status).toBe(400);
    expectShape(apiErrorSchema, data);
  });

  it("hides another tutor's lesson behind the same code as a missing one", async () => {
    const { status, data } = await call(lessonPath("507f1f77bcf86cd799439011"));
    expect(status).toBe(404);
    expect(expectShape(apiErrorSchema, data).code).toBe("not_found");
  });
});
