const closed = new Set<string>();

export const markLessonClosed = (lessonId: string): void => {
  closed.add(lessonId);
};

export const isLessonClosed = (lessonId: string): boolean =>
  closed.has(lessonId);
