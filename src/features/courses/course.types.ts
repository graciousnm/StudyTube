export interface CourseInput {
  title: string;
  description: string;
  goal?: string;
}

export interface CourseActionState {
  error?: string;
  fieldErrors?: {
    title?: string[];
    description?: string[];
    goal?: string[];
  };
}