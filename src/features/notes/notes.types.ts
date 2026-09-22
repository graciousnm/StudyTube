export const MAX_NOTE_LENGTH = 10_000;

export interface NoteActionState {
  error?: string;
  fieldErrors?: {
    content?: string[];
  };
}

export interface NoteView {
  content: string;
  createdAt: Date;
  updatedAt: Date;
}