export type LessonStatus = "active" | "ended";

export interface LessonSummary {
  text: string;
  generatedAt: Date | string;
}

export interface Lesson {
  id: string;
  tutorId: string;
  tutorName?: string;
  title: string;
  studentName?: string;
  studentEmail?: string;
  videoCallUrl?: string;
  inviteCode: string;
  status: LessonStatus;
  endedAt?: Date | string;
  liveblocksRoomId: string;
  summary?: LessonSummary;
  createdAt: Date | string;
  updatedAt: Date | string;
}
