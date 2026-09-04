import "server-only";
import { NextResponse } from "next/server";
import type { ApiError } from "@educatio/shared/api/errors";
import { ApiClientError, isApiFailure } from "./api-client";

export const relayFailure = (status: number, body: ApiError): NextResponse =>
  NextResponse.json(body, { status });

export const relay = async <T>(
  produce: () => Promise<T>,
): Promise<NextResponse> => {
  try {
    return NextResponse.json(await produce());
  } catch (err) {
    if (err instanceof ApiClientError) {
      return relayFailure(err.status, err.body);
    }
    if (isApiFailure(err)) {
      console.error(err);
      return relayFailure(502, {
        code: "service_unavailable",
        message: "Could not reach the lesson service.",
      });
    }
    throw err;
  }
};
