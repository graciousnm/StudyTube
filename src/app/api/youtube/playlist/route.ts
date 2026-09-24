import { NextResponse } from "next/server";
import { YouTubeError, youTubeErrorMessage } from "@/features/youtube/youtube.errors";
import { getPlaylistItems } from "@/features/youtube/youtube.playlist";
import { youtubePageTokenSchema } from "@/features/youtube/youtube.validation";
import { z } from "zod";

const playlistIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid playlist ID.");

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = playlistIdSchema.safeParse(searchParams.get("id") ?? "");
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid playlist ID." },
      { status: 400 },
    );
  }

  const pageTokenParam = searchParams.get("pageToken") ?? "";
  const parsedToken =
    pageTokenParam === "" ? { success: true, data: undefined } :
    youtubePageTokenSchema.safeParse(pageTokenParam);
  if (!parsedToken.success) {
    return NextResponse.json(
      { error: "Invalid page token." },
      { status: 400 },
    );
  }

  try {
    const result = await getPlaylistItems(parsed.data, parsedToken.data);
    return NextResponse.json(result, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const status =
      error instanceof YouTubeError && error.code === "not_configured"
        ? 503
        : 502;
    return NextResponse.json({ error: youTubeErrorMessage(error) }, { status });
  }
}
