import { createHash, randomBytes } from "node:crypto";
import mongoose from "mongoose";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001";
const MONGODB_URI =
  process.env.E2E_MONGODB_URI ?? "mongodb://localhost:27017/educatio";

export interface ThrowawayTutor {
  email: string;
  sessionJwt: string;
  userId: string;
}

const sha = (value: string) => createHash("sha256").update(value).digest("hex");

const post = async (path: string, body?: unknown): Promise<Response> =>
  fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const withDb = async <T>(
  run: (db: mongoose.Connection) => Promise<T>,
): Promise<T> => {
  const connection = await mongoose.createConnection(MONGODB_URI).asPromise();
  try {
    return await run(connection);
  } finally {
    await connection.close();
  }
};

export const createThrowawayTutor = async (): Promise<ThrowawayTutor> => {
  const email = `e2e-${randomBytes(6).toString("hex")}@example.test`;
  const signup = await post("/auth/signup", { name: "E2E Tutor", email });
  if (!signup.ok) {
    throw new Error(
      `signup responded ${signup.status}. Are the dev servers running?`,
    );
  }

  const token = randomBytes(32).toString("base64url");
  const binding = randomBytes(32).toString("base64url");

  const userId = await withDb(async (db) => {
    const user = await db.collection("users").findOne({ email });
    if (!user) throw new Error(`signup did not create ${email}`);
    await db.collection("magic_links").insertOne({
      userId: user._id,
      tokenHash: sha(token),
      bindingHash: sha(binding),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    });
    return user._id.toString();
  });

  const callback = await post("/auth/callback", { token, binding });
  const { sessionJwt } = (await callback.json()) as { sessionJwt: string };
  return { email, sessionJwt, userId };
};

export const createLessonFor = async (
  tutor: ThrowawayTutor,
  title: string,
): Promise<string> => {
  const created = await fetch(`${API_URL}/lessons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tutor.sessionJwt}`,
    },
    body: JSON.stringify({ title }),
  });
  const { id } = (await created.json()) as { id: string };
  return id;
};

export const tutorFootprint = async (
  tutor: ThrowawayTutor,
): Promise<{ users: number; lessons: number; magicLinks: number }> =>
  withDb(async (db) => {
    const userId = new mongoose.Types.ObjectId(tutor.userId);
    return {
      users: await db.collection("users").countDocuments({ _id: userId }),
      lessons: await db
        .collection("lessons")
        .countDocuments({ tutorId: userId }),
      magicLinks: await db.collection("magic_links").countDocuments({ userId }),
    };
  });

export const removeTutor = async (tutor: ThrowawayTutor): Promise<void> => {
  await withDb(async (db) => {
    const userId = new mongoose.Types.ObjectId(tutor.userId);
    await db.collection("lessons").deleteMany({ tutorId: userId });
    await db.collection("magic_links").deleteMany({ userId });
    await db.collection("users").deleteOne({ _id: userId });
  });
};
