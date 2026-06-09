export type LessonStatus = "scheduled" | "active" | "ended";

export interface LessonSummary {
  text: string;
  generatedAt: Date | string;
}

export interface Lesson {
  id: string;
  tutorId: string;
  title: string;
  studentName?: string;
  videoCallUrl?: string;
  inviteCode: string;
  status: LessonStatus;
  startedAt?: Date | string;
  endedAt?: Date | string;
  durationSeconds?: number;
  liveblocksRoomId: string;
  summary?: LessonSummary;
  createdAt: Date | string;
  updatedAt: Date | string;
}
