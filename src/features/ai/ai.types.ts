export interface CourseOutlineModule {
  title: string;
  description: string;
  topics: string[];
}

export interface CourseOutline {
  title: string;
  description: string;
  modules: CourseOutlineModule[];
}

export interface GenerateOutlineInput {
  goal: string;
  experience?: string;
  detail: "short" | "standard" | "detailed";
}

export interface AiProviderConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface ModuleTopics {
  moduleId: number;
  title: string;
  topics: string[];
}

export interface CuratedVideo {
  youtubeVideoId: string;
  title: string;
  channelName: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
}

export interface TopicCuration {
  topic: string;
  query: string;
  video: CuratedVideo | null;
}

export interface ModuleCuration {
  moduleId: number;
  title: string;
  topics: TopicCuration[];
}

export interface CurateVideosInput {
  courseTitle: string;
  courseDescription: string;
  modules: ModuleTopics[];
  channel?: string;
  notes?: string;
}

export interface VideoResult {
  youtubeVideoId: string;
  title: string;
  channelName: string | null;
  durationSeconds: number | null;
}

export interface TopicSearchResults {
  moduleIndex: number;
  topicIndex: number;
  query: string;
  results: VideoResult[];
}

export interface SearchQuery {
  moduleIndex: number;
  topicIndex: number;
  query: string;
}

export interface VideoSelection {
  moduleIndex: number;
  topicIndex: number;
  videoId: string | null;
}
