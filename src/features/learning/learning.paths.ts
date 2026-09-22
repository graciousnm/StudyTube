export function learningPath(
  courseId: number,
  moduleId: number,
  lessonId: number,
): string {
  return `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`;
}