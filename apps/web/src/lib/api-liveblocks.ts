import "server-only";
import {
  LIVEBLOCKS_AUTH_PATH,
  liveblocksAuthResponseSchema,
  type LiveblocksAuthResponse,
} from "@educatio/shared/api/liveblocks";
import { api } from "./api-client";

export const authorizeRoom = (room: string) =>
  api.post<LiveblocksAuthResponse>(LIVEBLOCKS_AUTH_PATH, {
    schema: liveblocksAuthResponseSchema,
    body: { room },
  });
