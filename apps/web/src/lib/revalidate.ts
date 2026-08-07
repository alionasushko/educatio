import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Every surface that renders a lesson list. TypeScript cannot check that a
 * mutation invalidated everything it should have, so the set lives in one
 * place rather than as a literal at each call site.
 *
 * Paths, not tags: every api read is `no-store` because responses carry a
 * per-user Bearer token, so there is no tagged cache entry to invalidate.
 * A route with a dynamic segment needs the `type` argument and then covers
 * every matching page — e.g. revalidatePath("/lesson/[lessonId]", "page").
 */
export const revalidateLessons = (): void => {
  revalidatePath("/dashboard");
};
