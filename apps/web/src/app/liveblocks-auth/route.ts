import { NextResponse, type NextRequest } from "next/server";
import { liveblocksAuthSchema } from "@educatio/shared/api/liveblocks";
import type { ApiError } from "@educatio/shared/api/errors";
import { ApiClientError, isApiFailure } from "@/lib/api-client";
import { authorizeRoom } from "@/lib/api-liveblocks";

const fail = (status: number, body: ApiError) =>
  NextResponse.json(body, { status });

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

  try {
    return NextResponse.json(await authorizeRoom(parsed.data.room));
  } catch (err) {
    if (err instanceof ApiClientError) return fail(err.status, err.body);
    if (isApiFailure(err)) {
      console.error(err);
      return fail(502, {
        code: "service_unavailable",
        message: "Could not reach the lesson service.",
      });
    }
    throw err;
  }
}
