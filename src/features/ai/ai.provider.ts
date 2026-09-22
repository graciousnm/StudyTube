import type {
  AiProviderConfig,
  CourseOutline,
  CurateVideosInput,
  GenerateOutlineInput,
  SearchQuery,
  TopicSearchResults,
  VideoSelection,
} from "./ai.types";
import { courseOutlineSchema } from "./ai.validation";

const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct";
const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const TIMEOUT_MS = 30_000;

function getConfig(): AiProviderConfig {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AiProviderError("AI service is not configured.");
  }
  return {
    apiKey,
    model: process.env.AI_MODEL || DEFAULT_MODEL,
    baseUrl: DEFAULT_BASE_URL,
  };
}

export class AiProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderError";
  }
}

async function callOpenRouter(
  config: AiProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 4096,
  timeoutMs = TIMEOUT_MS,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `${config.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://studyforge.app",
          "X-OpenRouter-Title": "StudyTube",
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "unable to read body");
      console.error(
        `[ai] OpenRouter error ${response.status}: ${errorBody}`,
      );
      if (response.status === 429) {
        throw new AiProviderError(
          "Too many requests. Please wait a moment and try again.",
        );
      }
      throw new AiProviderError(
        "We couldn't generate your learning path right now. Please try again.",
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      console.error("[ai] Missing content in response:", JSON.stringify(data));
      throw new AiProviderError(
        "We couldn't generate your learning path right now. Please try again.",
      );
    }

    return content;
  } catch (error) {
    if (error instanceof AiProviderError) {
      throw error;
    }
    console.error("[ai] Unexpected error:", error);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AiProviderError(
        "The request timed out. Please try again.",
      );
    }
    throw new AiProviderError(
      "We couldn't generate your learning path right now. Please try again.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonResponse<T>(text: string, label: string): T {
  let jsonStr = text.trim();

  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error(`[ai] ${label} JSON parse failed:`, e, "\nRaw text:", jsonStr.slice(0, 500));
    throw new AiProviderError(
      "We couldn't generate your learning path right now. Please try again.",
    );
  }

  return parsed as T;
}

function buildSystemPrompt(): string {
  return `You are a course outline generator. Given a learning goal, you create a structured course outline.

Return ONLY a JSON object matching this exact schema:
{
  "title": "Course title",
  "description": "Brief course description",
  "modules": [
    {
      "title": "Module title",
      "description": "Brief module description",
      "topics": ["Topic 1", "Topic 2"]
    }
  ]
}

Rules:
- Title the course based on the learning goal.
- Create 3-8 modules for standard detail, 2-4 for short, 5-12 for detailed.
- Each module should have 3-8 topics for standard, 2-4 for short, 5-10 for detailed.
- Topics are planning suggestions, not lessons.
- Do NOT include YouTube video IDs or URLs.
- Do NOT create lesson entries.
- Return ONLY the JSON object, no other text.`;
}

function buildUserPrompt(input: GenerateOutlineInput): string {
  let prompt = `Learning goal: ${input.goal}`;
  if (input.experience) {
    prompt += `\nCurrent experience: ${input.experience}`;
  }
  prompt += `\nDetail level: ${input.detail}`;
  return prompt;
}

export async function generateOutline(
  input: GenerateOutlineInput,
): Promise<CourseOutline> {
  const config = getConfig();
  const content = await callOpenRouter(
    config,
    buildSystemPrompt(),
    buildUserPrompt(input),
  );

  let parsed: unknown;
  try {
    let jsonStr = content.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error("[ai] Outline JSON parse failed:", e, "\nRaw text:", content.slice(0, 500));
    throw new AiProviderError(
      "We couldn't generate your learning path right now. Please try again.",
    );
  }

  const result = courseOutlineSchema.safeParse(parsed);
  if (!result.success) {
    console.error("[ai] Outline schema validation failed:", result.error.format());
    throw new AiProviderError(
      "We couldn't generate your learning path right now. Please try again.",
    );
  }

  return result.data;
}

function buildSearchQuerySystemPrompt(): string {
  return `You are a YouTube search query generator for an educational platform. Given a course context and topics, generate optimized YouTube search queries to find the best tutorial/lesson videos.

Return ONLY a JSON object matching this exact schema:
{
  "queries": [
    { "moduleIndex": 0, "topicIndex": 0, "query": "optimized search query" }
  ]
}

Rules:
- Generate one query per topic.
- Queries should be specific and optimized for finding educational tutorials.
- Include keywords like "tutorial", "lesson", "beginner", "course" when appropriate.
- Reference the course context to make queries more targeted.
- Use the exact moduleIndex and topicIndex from the input.
- Return ONLY the JSON object, no other text.`;
}

function buildSearchQueryUserPrompt(input: CurateVideosInput): string {
  let prompt = `Course: ${input.courseTitle}`;
  if (input.courseDescription) {
    prompt += `\nDescription: ${input.courseDescription}`;
  }
  prompt += "\n\nModules and topics:";
  for (let mi = 0; mi < input.modules.length; mi++) {
    const mod = input.modules[mi];
    prompt += `\nModule ${mi} (${mod.title}):`;
    for (let ti = 0; ti < mod.topics.length; ti++) {
      prompt += `\n  Topic ${ti}: ${mod.topics[ti]}`;
    }
  }
  return prompt;
}

export async function generateSearchQueries(
  input: CurateVideosInput,
  timeoutMs?: number,
): Promise<SearchQuery[]> {
  const config = getConfig();
  const content = await callOpenRouter(
    config,
    buildSearchQuerySystemPrompt(),
    buildSearchQueryUserPrompt(input),
    2048,
    timeoutMs,
  );

  const parsed = parseJsonResponse<{ queries: SearchQuery[] }>(
    content,
    "search queries",
  );

  if (!Array.isArray(parsed.queries)) {
    console.error("[ai] Search queries response missing queries array");
    throw new AiProviderError(
      "We couldn't generate your learning path right now. Please try again.",
    );
  }

  return parsed.queries;
}

function buildVideoSelectSystemPrompt(): string {
  return `You are a video curator for an educational platform. Given a list of topics with their YouTube search results, select the BEST video for each topic.

Return ONLY a JSON object matching this exact schema:
{
  "selections": [
    { "moduleIndex": 0, "topicIndex": 0, "videoId": "youtube_video_id" }
  ]
}

Rules:
- For each topic, select the single BEST video from the search results.
- Prefer videos that are: educational tutorials, lessons, or courses.
- Prefer videos from reputable educational channels.
- Consider relevance to the specific topic and learning goal.
- If no suitable video exists for a topic, set videoId to null.
- Use the exact moduleIndex and topicIndex from the input.
- Return ONLY the JSON object, no other text.`;
}

function buildVideoSelectUserPrompt(
  input: CurateVideosInput,
  topicsWithResults: TopicSearchResults[],
): string {
  let prompt = `Course: ${input.courseTitle}\n`;
  if (input.courseDescription) {
    prompt += `Description: ${input.courseDescription}\n`;
  }

  for (const topic of topicsWithResults) {
    const mod = input.modules[topic.moduleIndex];
    const topicName = mod?.topics[topic.topicIndex] ?? "Unknown";
    prompt += `\n--- Module ${topic.moduleIndex} (${mod?.title}), Topic ${topic.topicIndex} (${topicName}) ---`;
    prompt += `\nSearch query: ${topic.query}`;
    prompt += "\nResults:";
    for (const r of topic.results) {
      const dur = r.durationSeconds
        ? `${Math.floor(r.durationSeconds / 60)}:${String(r.durationSeconds % 60).padStart(2, "0")}`
        : "unknown";
      prompt += `\n  - [${r.youtubeVideoId}] "${r.title}" by ${r.channelName ?? "unknown"} (${dur})`;
    }
  }

  return prompt;
}

export async function selectBestVideos(
  input: CurateVideosInput,
  topicsWithResults: TopicSearchResults[],
  timeoutMs?: number,
): Promise<VideoSelection[]> {
  const config = getConfig();
  const content = await callOpenRouter(
    config,
    buildVideoSelectSystemPrompt(),
    buildVideoSelectUserPrompt(input, topicsWithResults),
    4096,
    timeoutMs,
  );

  const parsed = parseJsonResponse<{ selections: VideoSelection[] }>(
    content,
    "video selections",
  );

  if (!Array.isArray(parsed.selections)) {
    console.error("[ai] Video selections response missing selections array");
    throw new AiProviderError(
      "We couldn't generate your learning path right now. Please try again.",
    );
  }

  return parsed.selections;
}
