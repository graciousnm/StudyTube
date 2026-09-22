import { NextResponse } from "next/server";
import { YouTubeError, youTubeErrorMessage } from "@/features/youtube/youtube.errors";
import { searchYouTube } from "@/features/youtube/youtube.search";
import { youtubeSearchQuerySchema } from "@/features/youtube/youtube.validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = youtubeSearchQuerySchema.safeParse(
    searchParams.get("q") ?? "",
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a search term." },
      { status: 400 },
    );
  }

  try {
    const results = await searchYouTube(parsed.data);
    return NextResponse.json(
      { results },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    const status =
      error instanceof YouTubeError && error.code === "not_configured"
        ? 503
        : 502;
    return NextResponse.json({ error: youTubeErrorMessage(error) }, { status });
  }
}