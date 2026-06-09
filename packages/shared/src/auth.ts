export interface TutorSessionClaims {
  kind: "tutor";
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export interface StudentSessionClaims {
  kind: "student";
  lessonId: string;
  name: string;
  iat: number;
  exp: number;
}

export type SessionClaims = TutorSessionClaims | StudentSessionClaims;

export function isTutorSession(c: SessionClaims): c is TutorSessionClaims {
  return c.kind === "tutor";
}

export function isStudentSession(c: SessionClaims): c is StudentSessionClaims {
  return c.kind === "student";
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  teaches?: string;
}
