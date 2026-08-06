import "server-only";
import type { PublicUser } from "@educatio/shared";
import type { OkResponse } from "@educatio/shared/api/common";
import {
  sessionResponseSchema,
  type PasswordSigninInput,
  type SentResponse,
  type SessionResponse,
  type SetPasswordInput,
  type SigninInput,
  type SignupInput,
} from "@educatio/shared/api/auth";
import { api } from "./api-client";

export const fetchCurrentUser = () => api.get<{ user: PublicUser }>("/auth/me");

export const signup = (input: SignupInput) =>
  api.post<SentResponse>("/auth/signup", { body: input, ip: true });

export const requestMagicLink = (input: SigninInput) =>
  api.post<SentResponse>("/auth/signin", { body: input, ip: true });

export const signinWithPassword = (input: PasswordSigninInput) =>
  api.post<SessionResponse>("/auth/signin/password", {
    body: input,
    ip: true,
    schema: sessionResponseSchema,
  });

export const setPassword = (input: SetPasswordInput) =>
  api.post<OkResponse>("/auth/password", { body: input, ip: true });
