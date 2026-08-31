import { createHash, randomBytes } from "node:crypto";
import mongoose from "mongoose";

const MONGODB_URI =
  process.env.E2E_MONGODB_URI ?? "mongodb://localhost:27017/educatio";

const DEMO_EMAIL = "demo@educatio.app";

export interface SeededLink {
  token: string;
  binding: string;
}

export const seedMagicLink = async (
  email: string = DEMO_EMAIL,
): Promise<SeededLink> => {
  const connection = await mongoose.createConnection(MONGODB_URI).asPromise();

  try {
    const users = connection.collection("users");
    const user = await users.findOne({ email });
    if (!user) {
      throw new Error(
        `no user ${email} yet — create one before seeding a link`,
      );
    }

    const token = randomBytes(32).toString("base64url");
    const binding = randomBytes(32).toString("base64url");
    const sha = (value: string) =>
      createHash("sha256").update(value).digest("hex");

    await connection.collection("magic_links").insertOne({
      userId: user._id,
      tokenHash: sha(token),
      bindingHash: sha(binding),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    });

    return { token, binding };
  } finally {
    await connection.close();
  }
};
