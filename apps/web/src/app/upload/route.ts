import { type NextRequest } from "next/server";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  UPLOAD_TOO_LARGE,
} from "@educatio/shared/api/upload";
import { relay, relayFailure as fail } from "@/lib/api-relay";
import { uploadImage } from "@/lib/api-upload";

export async function POST(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get("lessonId");
  if (!lessonId) {
    return fail(400, {
      code: "invalid_id",
      message: "That link doesn't look right.",
    });
  }

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
      message: UPLOAD_TOO_LARGE,
    });
  }

  return relay(() => uploadImage(form, lessonId));
}
