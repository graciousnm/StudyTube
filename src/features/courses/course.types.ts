export interface CourseInput {
  title: string;
  description: string;
}

export interface CourseActionState {
  error?: string;
  fieldErrors?: {
    title?: string[];
    description?: string[];
  };
}