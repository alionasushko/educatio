import { NextResponse, type NextRequest } from "next/server";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
} from "@educatio/shared/api/upload";
import type { ApiError } from "@educatio/shared/api/errors";
import { ApiClientError, isApiFailure } from "@/lib/api-client";
import { uploadImage } from "@/lib/api-upload";

const fail = (status: number, body: ApiError) =>
  NextResponse.json(body, { status });

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, {
      code: "no_file",
      message: "Please choose a file to upload.",
    });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return fail(400, {
      code: "no_file",
      message: "Please choose a file to upload.",
    });
  }
  if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(file.type)) {
    return fail(400, {
      code: "unsupported_type",
      message: "Only PNG, JPG, WEBP, and GIF images are allowed.",
    });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return fail(413, {
      code: "file_too_large",
      message: "Images must be 5MB or smaller.",
    });
  }

  try {
    return NextResponse.json(await uploadImage(form));
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
