import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  uploadResponseSchema,
} from "@educatio/shared/api/upload";
import { apiErrorSchema } from "@educatio/shared/api/errors";
import { ERROR_COPY } from "@/lib/error-messages";
import { UPLOAD_ROUTE } from "@/lib/routes";
import { MAX_IMAGE_SIDE } from "./constants";

interface Placed {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const naturalSize = (file: File): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read that image."));
    };
    image.src = objectUrl;
  });

const fitted = (width: number, height: number) => {
  const longest = Math.max(width, height);
  if (longest <= MAX_IMAGE_SIDE || longest === 0) return { width, height };
  const ratio = MAX_IMAGE_SIDE / longest;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
};

export const useImageUpload = (onPlaced: (placed: Placed) => void) => {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (file: File, x: number, y: number) => {
      if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(file.type)) {
        toast.error(ERROR_COPY.unsupported_type);
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(ERROR_COPY.file_too_large);
        return;
      }

      setUploading(true);
      try {
        const natural = await naturalSize(file);
        const body = new FormData();
        body.append("file", file);

        const response = await fetch(UPLOAD_ROUTE, { method: "POST", body });
        const payload: unknown = await response.json();

        if (!response.ok) {
          const parsed = apiErrorSchema.safeParse(payload);
          toast.error(
            parsed.success
              ? (ERROR_COPY[parsed.data.code] ?? parsed.data.message)
              : ERROR_COPY.internal_error,
          );
          return;
        }

        const uploaded = uploadResponseSchema.safeParse(payload);
        if (!uploaded.success) {
          toast.error(ERROR_COPY.malformed_response);
          return;
        }

        const { width, height } = fitted(natural.width, natural.height);
        onPlaced({
          src: uploaded.data.url,
          width,
          height,
          x: x - width / 2,
          y: y - height / 2,
        });
      } catch {
        toast.error(ERROR_COPY.unreachable);
      } finally {
        setUploading(false);
      }
    },
    [onPlaced],
  );

  return { uploading, upload };
};
