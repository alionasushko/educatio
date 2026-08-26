import type { BrowserContext } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001";
const WEB_URL = process.env.E2E_WEB_URL ?? "http://localhost:3000";

export interface DemoLesson {
  sessionJwt: string;
  lessonId: string;
}

const json = async (response: Response): Promise<unknown> => {
  if (!response.ok) {
    throw new Error(
      `${response.url} responded ${response.status}. Are the dev servers running (npm run dev:api, npm run dev)?`,
    );
  }
  return response.json();
};

let session: Promise<string> | null = null;

const demoSession = (): Promise<string> => {
  session ??= (async () => {
    const body = (await json(
      await fetch(`${API_URL}/auth/demo`, { method: "POST" }),
    )) as { sessionJwt: string };
    return body.sessionJwt;
  })();
  return session;
};

export const createDemoLesson = async (title: string): Promise<DemoLesson> => {
  const sessionJwt = await demoSession();
  const lesson = (await json(
    await fetch(`${API_URL}/lessons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionJwt}`,
      },
      body: JSON.stringify({ title }),
    }),
  )) as { id: string };

  return { sessionJwt, lessonId: lesson.id };
};

export const deleteLesson = async (
  lesson: DemoLesson | undefined,
): Promise<void> => {
  if (!lesson) return;
  await fetch(`${API_URL}/lessons/${lesson.lessonId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${lesson.sessionJwt}` },
  });
};

export const signIn = async (
  context: BrowserContext,
  sessionJwt: string,
): Promise<void> => {
  await context.addCookies([
    { name: "educatio_session", value: sessionJwt, url: WEB_URL },
  ]);
};
