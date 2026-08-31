import "server-only";
import { okResponseSchema, type OkResponse } from "@educatio/shared/api/common";
import {
  AUTH_ACTIONS,
  authPath,
  meResponseSchema,
  sentResponseSchema,
  sessionResponseSchema,
  type MeResponse,
  type PasswordSigninInput,
  type SentResponse,
  type CallbackInput,
  type SessionResponse,
  type SetPasswordInput,
  type SigninInput,
  type SignupInput,
} from "@educatio/shared/api/auth";
import { api } from "./api-client";

export const fetchCurrentUser = () =>
  api.get<MeResponse>(authPath(AUTH_ACTIONS.me), { schema: meResponseSchema });

export const signup = (input: SignupInput) =>
  api.post<SentResponse>(authPath(AUTH_ACTIONS.signup), {
    schema: sentResponseSchema,
    body: input,
    ip: true,
  });

export const requestMagicLink = (input: SigninInput) =>
  api.post<SentResponse>(authPath(AUTH_ACTIONS.signin), {
    schema: sentResponseSchema,
    body: input,
    ip: true,
  });

export const signinWithPassword = (input: PasswordSigninInput) =>
  api.post<SessionResponse>(authPath(AUTH_ACTIONS.signinPassword), {
    schema: sessionResponseSchema,
    body: input,
    ip: true,
  });

export const setPassword = (input: SetPasswordInput) =>
  api.post<OkResponse>(authPath(AUTH_ACTIONS.password), {
    schema: okResponseSchema,
    body: input,
    ip: true,
  });

export const exchangeMagicLink = (input: CallbackInput) =>
  api.post<SessionResponse>(authPath(AUTH_ACTIONS.callback), {
    schema: sessionResponseSchema,
    body: input,
    ip: true,
  });

export const demoLogin = () =>
  api.post<SessionResponse>(authPath(AUTH_ACTIONS.demo), {
    schema: sessionResponseSchema,
    ip: true,
  });

export const signout = () =>
  api.post<OkResponse>(authPath(AUTH_ACTIONS.signout), {
    schema: okResponseSchema,
  });
