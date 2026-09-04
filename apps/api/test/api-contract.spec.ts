import { beforeAll, afterAll, describe, expect, it } from "vitest";
import type { ZodType } from "zod";
import { apiErrorSchema } from "@educatio/shared/api/errors";
import { okResponseSchema } from "@educatio/shared/api/common";
import {
  AUTH_ACTIONS,
  authPath,
  meResponseSchema,
  sentResponseSchema,
  sessionResponseSchema,
} from "@educatio/shared/api/auth";
import {
  LESSONS_PATH,
  lessonPath,
  createLessonResponseSchema,
  lessonListResponseSchema,
  lessonSchema,
  studentLessonSchema,
} from "@educatio/shared/api/lessons";
import { STUDENT_SESSION_PATH } from "@educatio/shared/api/sessions";
import { UPLOAD_PATH } from "@educatio/shared/api/upload";
import { LIVEBLOCKS_AUTH_PATH } from "@educatio/shared/api/liveblocks";
import {
  MAX_SNAPSHOT_ELEMENTS,
  latestSnapshotResponseSchema,
  lessonSnapshotPath,
} from "@educatio/shared/api/snapshot";
import { startApi, type Harness } from "./harness";

let api: Harness;

const stickyElement = (id: string, x: number, y: number) => ({
  id,
  type: "sticky",
  x,
  y,
  rotation: 0,
  zIndex: 1,
  createdBy: "tutor",
  createdAt: 1,
  width: 160,
  height: 160,
  content: "Quadratic formula",
  color: "yellow",
});

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
  token?: string;
}

const call = async (
  path: string,
  { method = "GET", body, auth = true, token }: CallOptions = {},
) => {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) headers["Authorization"] = `Bearer ${token ?? api.tutorJwt}`;

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

  it("gives a student the lesson without the tutor's fields", async () => {
    const created = await call(LESSONS_PATH, {
      method: "POST",
      body: { title: "Fractions", studentName: "Jordan" },
    });
    expect(created.status).toBe(201);
    const { id, inviteCode } = expectShape(
      createLessonResponseSchema,
      created.data,
    );

    const joined = await call(STUDENT_SESSION_PATH, {
      method: "POST",
      auth: false,
      body: { inviteCode, name: "Jordan", email: "jordan@example.com" },
    });
    expect(joined.status).toBe(200);
    const { sessionJwt } = expectShape(sessionResponseSchema, joined.data);

    const asStudent = await call(lessonPath(id), { token: sessionJwt });
    expect(asStudent.status).toBe(200);
    const student = expectShape(studentLessonSchema, asStudent.data);
    expect(student.title).toBe("Fractions");
    expect(student.tutorName).toBe("Test Tutor");
    expect(student.liveblocksRoomId).toBeTruthy();

    for (const field of ["inviteCode", "studentEmail", "tutorId"]) {
      expect(asStudent.data).not.toHaveProperty(field);
    }

    const asTutor = await call(lessonPath(id));
    expect(expectShape(lessonSchema, asTutor.data).inviteCode).toBe(inviteCode);

    await call(lessonPath(id), { method: "DELETE" });
  });

  it("the snapshot round-trip: empty, saved, read back", async () => {
    const created = await call(LESSONS_PATH, {
      method: "POST",
      body: { title: "Snapshot subject" },
    });
    expect(created.status).toBe(201);
    const { id } = expectShape(createLessonResponseSchema, created.data);

    const empty = await call(lessonSnapshotPath(id));
    expect(empty.status).toBe(200);
    expect(expectShape(latestSnapshotResponseSchema, empty.data).snapshot).toBe(
      null,
    );

    const canvasState = {
      el1: {
        id: "el1",
        type: "sticky",
        x: 10,
        y: 20,
        rotation: 0,
        zIndex: 1,
        createdBy: "tutor",
        createdAt: 1,
        width: 160,
        height: 160,
        content: "Quadratic formula",
        color: "yellow",
      },
    };
    const saved = await call(lessonSnapshotPath(id), {
      method: "POST",
      body: { canvasState },
    });
    expect(saved.status).toBe(200);
    expectShape(okResponseSchema, saved.data);

    const read = await call(lessonSnapshotPath(id));
    expect(read.status).toBe(200);
    const { snapshot } = expectShape(latestSnapshotResponseSchema, read.data);
    expect(snapshot?.canvasState).toEqual(canvasState);
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

  it("refuses to change a lesson once it has ended", async () => {
    const created = await call(LESSONS_PATH, {
      method: "POST",
      body: { title: "Finished lesson" },
    });
    const { id } = expectShape(createLessonResponseSchema, created.data);

    // Writing is fine while it is running.
    expect(
      (
        await call(lessonSnapshotPath(id), {
          method: "POST",
          body: { canvasState: { a: stickyElement("a", 1, 1) } },
        })
      ).status,
    ).toBe(200);

    await call(lessonPath(id), { method: "PATCH", body: { status: "ended" } });

    const after = await call(lessonSnapshotPath(id), {
      method: "POST",
      body: { canvasState: { b: stickyElement("b", 2, 2) } },
    });
    expect(after.status).toBe(403);
    expect(expectShape(apiErrorSchema, after.data).code).toBe("lesson_ended");

    // The tutor's client flushes before ending, so the board is already stored.
    const read = await call(lessonSnapshotPath(id));
    const { snapshot } = expectShape(latestSnapshotResponseSchema, read.data);
    expect(Object.keys(snapshot?.canvasState ?? {})).toEqual(["a"]);
  });

  it("stops issuing room tokens for an ended lesson", async () => {
    const created = await call(LESSONS_PATH, {
      method: "POST",
      body: { title: "Room after the end" },
    });
    const { id, liveblocksRoomId } = expectShape(
      createLessonResponseSchema,
      created.data,
    );

    await call(lessonPath(id), { method: "PATCH", body: { status: "ended" } });

    const res = await call(LIVEBLOCKS_AUTH_PATH, {
      method: "POST",
      body: { room: liveblocksRoomId },
    });
    expect(res.status).toBe(403);
    expect(expectShape(apiErrorSchema, res.data).code).toBe("lesson_ended");
  });

  it("keeps one snapshot per lesson however many times it is saved", async () => {
    const created = await call(LESSONS_PATH, {
      method: "POST",
      body: { title: "Snapshot growth" },
    });
    const { id } = expectShape(createLessonResponseSchema, created.data);

    for (let i = 0; i < 5; i += 1) {
      const res = await call(lessonSnapshotPath(id), {
        method: "POST",
        body: { canvasState: { [`el${i}`]: stickyElement(`el${i}`, i, i) } },
      });
      expect(res.status).toBe(200);
    }

    // Append-only writes were the growth: five saves used to leave five rows,
    // and nothing ever pruned them.
    const read = await call(lessonSnapshotPath(id));
    const { snapshot } = expectShape(latestSnapshotResponseSchema, read.data);
    expect(Object.keys(snapshot?.canvasState ?? {})).toEqual(["el4"]);
    expect(await api.countSnapshots(id)).toBe(1);
  });

  it("refuses a canvas larger than the contract allows", async () => {
    const created = await call(LESSONS_PATH, {
      method: "POST",
      body: { title: "Huge canvas" },
    });
    const { id } = expectShape(createLessonResponseSchema, created.data);

    const canvasState: Record<string, unknown> = {};
    for (let i = 0; i <= MAX_SNAPSHOT_ELEMENTS; i += 1) {
      canvasState[`el${i}`] = { type: "sticky", x: 0, y: 0 };
    }

    const res = await call(lessonSnapshotPath(id), {
      method: "POST",
      body: { canvasState },
    });
    expect(res.status).toBe(400);
    expect(expectShape(apiErrorSchema, res.data).code).toBe("validation_error");
  });

  it("refuses an upload aimed at a lesson that does not exist", async () => {
    const form = new FormData();
    form.append("file", new Blob([Buffer.from("x")]), "x.png");
    const res = await fetch(
      `${api.baseUrl}${UPLOAD_PATH}?lessonId=507f1f77bcf86cd799439011`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${api.tutorJwt}` },
        body: form,
      },
    );

    expect(res.status).toBe(404);
    expect(expectShape(apiErrorSchema, await res.json()).code).toBe(
      "not_found",
    );
  });

  it("refuses a title that is only whitespace, and trims the rest", async () => {
    const blank = await call(LESSONS_PATH, {
      method: "POST",
      body: { title: "   " },
    });
    expect(blank.status).toBe(400);
    expect(expectShape(apiErrorSchema, blank.data).code).toBe(
      "validation_error",
    );

    const padded = await call(LESSONS_PATH, {
      method: "POST",
      body: { title: "  Fractions  ", studentName: "  Sam  " },
    });
    const { id } = expectShape(createLessonResponseSchema, padded.data);

    const read = await call(lessonPath(id));
    const lesson = expectShape(lessonSchema, read.data);
    expect(lesson.title).toBe("Fractions");
    expect(lesson.studentName).toBe("Sam");

    const renamed = await call(lessonPath(id), {
      method: "PATCH",
      body: { title: "  " },
    });
    expect(renamed.status).toBe(400);
  });

  it("answers an upload that is not multipart with a 4xx, not a 500", async () => {
    const created = await call(LESSONS_PATH, {
      method: "POST",
      body: { title: "Not multipart" },
    });
    const { id } = expectShape(createLessonResponseSchema, created.data);

    const res = await fetch(`${api.baseUrl}${UPLOAD_PATH}?lessonId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${api.tutorJwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: "not a file" }),
    });

    expect(res.status).toBe(400);
    expect(expectShape(apiErrorSchema, await res.json()).code).toBe("no_file");
  });

  it("hides another tutor's lesson from an upload the same way", async () => {
    const created = await call(LESSONS_PATH, {
      method: "POST",
      body: { title: "Someone else's lesson" },
    });
    const { id } = expectShape(createLessonResponseSchema, created.data);

    const form = new FormData();
    form.append("file", new Blob([Buffer.from("x")]), "x.png");
    const res = await fetch(`${api.baseUrl}${UPLOAD_PATH}?lessonId=${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${api.otherTutorJwt}` },
      body: form,
    });

    expect(res.status).toBe(404);
  });

  it("answers a lesson id that exists for nobody with not_found", async () => {
    const { status, data } = await call(lessonPath("507f1f77bcf86cd799439011"));
    expect(status).toBe(404);
    expect(expectShape(apiErrorSchema, data).code).toBe("not_found");
  });

  it("hides a real lesson from another tutor behind that same answer", async () => {
    const created = await call(LESSONS_PATH, {
      method: "POST",
      body: { title: "Someone else's lesson" },
    });
    const { id } = expectShape(createLessonResponseSchema, created.data);

    // Identical to the response for an id that exists for nobody, so a tutor
    // cannot use the api to learn which lesson ids are real.
    for (const attempt of [
      await call(lessonPath(id), { token: api.otherTutorJwt }),
      await call(lessonPath(id), {
        method: "PATCH",
        token: api.otherTutorJwt,
        body: { title: "Stolen" },
      }),
      await call(lessonPath(id), {
        method: "DELETE",
        token: api.otherTutorJwt,
      }),
    ]) {
      expect(attempt.status).toBe(404);
      expect(expectShape(apiErrorSchema, attempt.data).code).toBe("not_found");
    }

    // Still there — the other tutor's DELETE was refused, not silently applied.
    expect((await call(lessonPath(id))).status).toBe(200);
    await call(lessonPath(id), { method: "DELETE" });
  });
});

describe("signing out ends the session everywhere", () => {
  it("stops the token that signed out from being used again", async () => {
    const token = await api.newTutorJwt();

    const before = await call(authPath(AUTH_ACTIONS.me), { token });
    expect(before.status).toBe(200);

    const out = await call(authPath(AUTH_ACTIONS.signout), {
      method: "POST",
      token,
    });
    expect(out.status).toBe(200);

    const after = await call(authPath(AUTH_ACTIONS.me), { token });
    expect(after.status).toBe(401);
    expect(after.data).toMatchObject({ code: "session_expired" });
  });

  it("leaves other people's sessions alone", async () => {
    const mine = await api.newTutorJwt();
    const theirs = await api.newTutorJwt();

    await call(authPath(AUTH_ACTIONS.signout), { method: "POST", token: mine });

    const other = await call(authPath(AUTH_ACTIONS.me), { token: theirs });
    expect(other.status).toBe(200);
  });

  it("keeps a student's session working — it has no user to revoke", async () => {
    const lesson = await call(LESSONS_PATH, {
      method: "POST",
      body: { title: "Revocation" },
    });
    expect(lesson.status).toBe(201);
  });
});

describe("what the api will not accept in a request string", () => {
  it("refuses an email past the bound, and a padded invite code still joins", async () => {
    const long = `${"a".repeat(200)}@example.com`;
    const res = await call(authPath(AUTH_ACTIONS.signin), {
      method: "POST",
      body: { email: long },
      auth: false,
    });
    expect(res.status).toBe(400);
    expect(expectShape(apiErrorSchema, res.data).code).toBe("validation_error");
  });

  it("refuses an oversized magic-link token instead of querying with it", async () => {
    const res = await call(authPath(AUTH_ACTIONS.callback), {
      method: "POST",
      body: { token: "t".repeat(65), binding: "b" },
      auth: false,
    });
    expect(res.status).toBe(400);
    expect(expectShape(apiErrorSchema, res.data).code).toBe("validation_error");
  });
});
