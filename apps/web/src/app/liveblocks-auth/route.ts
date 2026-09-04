import { type NextRequest } from "next/server";
import { liveblocksAuthSchema } from "@educatio/shared/api/liveblocks";
import { relay, relayFailure as fail } from "@/lib/api-relay";
import { authorizeRoom } from "@/lib/api-liveblocks";

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }

  const parsed = liveblocksAuthSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, {
      code: "validation_error",
      message: "A room id is required.",
    });
  }

  return relay(() => authorizeRoom(parsed.data.room));
}
