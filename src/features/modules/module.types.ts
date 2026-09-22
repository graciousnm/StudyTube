export interface ModuleInput {
  title: string;
  description: string;
}

export interface ModuleActionState {
  error?: string;
  fieldErrors?: {
    title?: string[];
    description?: string[];
  };
}

export type MoveDirection = "up" | "down";
