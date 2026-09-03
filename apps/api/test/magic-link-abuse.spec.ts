import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startApi } from "./harness";
import type { Harness } from "./harness";

let api: Harness;

beforeAll(async () => {
  api = await startApi();
});

afterAll(async () => {
  await api.close();
});

describe("how many links one address can be sent", () => {
  it("stops sending once an address has had its hourly share", async () => {
    const email = "flooded@example.com";
    await api.users.create({ email, name: "Flooded" });

    for (let i = 0; i < 12; i += 1) {
      await expect(api.auth.signin(email)).resolves.toMatchObject({
        binding: expect.any(String) as unknown as string,
      });
    }

    expect(await api.magicLinkCount(email)).toBe(5);
  });

  it("keeps counting per address, not across all of them", async () => {
    const other = "not-flooded@example.com";
    await api.users.create({ email: other, name: "Someone else" });

    await api.auth.signin(other);

    expect(await api.magicLinkCount(other)).toBe(1);
  });
});

describe("what happens to signups that never verify", () => {
  const aged = async (email: string, days: number, verified: boolean) => {
    const user = await api.users.create({
      email,
      name: email,
      emailVerified: verified ? new Date() : null,
    });
    // Straight to the driver: mongoose treats createdAt as immutable and drops
    // it from a $set without complaining.
    await api.users.collection.updateOne(
      { _id: user._id },
      { $set: { createdAt: new Date(Date.now() - days * 24 * 60 * 60_000) } },
    );
    return user;
  };

  it("reclaims a stale unverified address but leaves the rest alone", async () => {
    await aged("squatted@example.com", 5, false);
    await aged("just-signed-up@example.com", 0, false);
    await aged("real-tutor@example.com", 5, true);

    const swept = await api.auth.sweepUnverifiedAccounts();

    expect(swept).toBeGreaterThanOrEqual(1);
    expect(
      await api.users.findOne({ email: "squatted@example.com" }),
    ).toBeNull();
    expect(
      await api.users.findOne({ email: "just-signed-up@example.com" }),
    ).not.toBeNull();
    expect(
      await api.users.findOne({ email: "real-tutor@example.com" }),
    ).not.toBeNull();
  });
});
