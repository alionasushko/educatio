import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { startApi, type Harness } from "./harness";
import { LESSONS_PATH } from "@educatio/shared/api/lessons";

let api: Harness;

beforeAll(async () => {
  api = await startApi();
}, 120_000);

afterAll(async () => {
  await api?.close();
});

const listAs = (token: string) =>
  fetch(`${api.baseUrl}${LESSONS_PATH}?page=1&limit=1&status=all`, {
    headers: { Authorization: `Bearer ${token}` },
  });

describe("what a rate limit counts", () => {
  it("gives two tutors separate budgets from the same address", async () => {
    const mine = [];
    for (let i = 0; i < 40; i += 1)
      mine.push((await listAs(api.tutorJwt)).status);
    expect(mine.every((s) => s === 200)).toBe(true);

    const theirs = await listAs(api.otherTutorJwt);
    expect(theirs.status).toBe(200);
  });

  it("counts a tutor's own requests against one budget", async () => {
    const token = await api.newTutorJwt();
    const seen = new Set<number>();
    for (let i = 0; i < 130; i += 1) seen.add((await listAs(token)).status);

    expect(seen.has(429)).toBe(true);

    expect((await listAs(await api.newTutorJwt())).status).toBe(200);
  });
});
