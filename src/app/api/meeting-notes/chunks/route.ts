import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { experimental_transcribe as transcribe } from "ai";
import { openai } from "@ai-sdk/openai";

const TEMP_DIR = path.join(process.cwd(), "tmp", "audio-chunks");

async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const chunk = formData.get("chunk") as Blob;
    const sessionId = formData.get("sessionId") as string;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);

    if (!chunk || !sessionId || isNaN(chunkIndex)) {
      return NextResponse.json(
        { error: "Missing required fields: chunk, sessionId, or chunkIndex" },
        { status: 400 },
      );
    }

    await ensureTempDir();

    const sessionDir = path.join(TEMP_DIR, sessionId);
    if (!existsSync(sessionDir)) {
      await mkdir(sessionDir, { recursive: true });
    }

    const buffer = Buffer.from(await chunk.arrayBuffer());

    const transcript = await transcribe({
      model: openai.transcription("whisper-1"),
      audio: buffer,
    });

    const transcriptPath = path.join(
      sessionDir,
      `transcript-${chunkIndex}.txt`,
    );
    await writeFile(transcriptPath, transcript.text, "utf-8");

    return NextResponse.json({
      success: true,
      sessionId,
      chunkIndex,
      transcriptLength: transcript.text.length,
      message: "Chunk transcribed successfully",
    });
  } catch (error) {
    console.error("Error transcribing chunk:", error);
    return NextResponse.json(
      { error: "Failed to transcribe chunk" },
      { status: 500 },
    );
  }
}
