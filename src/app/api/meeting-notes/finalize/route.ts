import { NextResponse } from "next/server";
import { readdir, readFile, unlink, rmdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { generateMeetingNotesFromTranscript } from "@/app/actions/meetingNotes";

const TEMP_DIR = path.join(process.cwd(), "tmp", "audio-chunks");

async function cleanupSession(sessionDir: string) {
  try {
    if (existsSync(sessionDir)) {
      const files = await readdir(sessionDir);
      await Promise.all(
        files.map((file) => unlink(path.join(sessionDir, file))),
      );
      await rmdir(sessionDir);
    }
  } catch (error) {
    console.error("Error cleaning up session:", error);
  }
}

export async function POST(req: Request) {
  try {
    const { sessionId, userId, studentId } = await req.json();

    if (!sessionId || !userId || !studentId) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, userId, or studentId" },
        { status: 400 },
      );
    }

    const actualSessionDir = path.join(TEMP_DIR, sessionId);

    if (!existsSync(actualSessionDir)) {
      return NextResponse.json(
        { error: "Session not found or no chunks uploaded" },
        { status: 404 },
      );
    }

    const files = await readdir(actualSessionDir);
    const transcriptFiles = files
      .filter((file) => file.startsWith("transcript-"))
      .sort((a, b) => {
        const indexA = parseInt(a.match(/transcript-(\d+)/)?.[1] || "0");
        const indexB = parseInt(b.match(/transcript-(\d+)/)?.[1] || "0");
        return indexA - indexB;
      });

    if (transcriptFiles.length === 0) {
      await cleanupSession(actualSessionDir);
      return NextResponse.json(
        { error: "No transcript chunks found for this session" },
        { status: 404 },
      );
    }

    const transcriptTexts = await Promise.all(
      transcriptFiles.map((file) =>
        readFile(path.join(actualSessionDir, file), "utf-8"),
      ),
    );
    const fullTranscript = transcriptTexts.join(" ");

    const result = await generateMeetingNotesFromTranscript(
      fullTranscript,
      userId,
      studentId,
    );

    await cleanupSession(actualSessionDir);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error finalizing transcription:", error);

    try {
      const { sessionId } = await req.json();
      if (sessionId) {
        await cleanupSession(path.join(TEMP_DIR, sessionId));
      }
    } catch {
      // Ignore cleanup errors
    }

    return NextResponse.json(
      { error: "Failed to finalize transcription" },
      { status: 500 },
    );
  }
}
