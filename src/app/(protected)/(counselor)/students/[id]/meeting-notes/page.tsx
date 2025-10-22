"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, CircleStop, Mail, FileText } from "lucide-react";
import { addMeetingNotes } from "@/app/actions/meetingNotes";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { format } from "date-fns";
import { MeetingNoteInfo } from "@/types/MeetingNoteInfo";
import { SuggestedTags, SuggestedTag } from "@/components/SuggestedTags";
import {
  AddMeetingNotesDialog,
  MeetingNoteData,
} from "@/components/AddMeetingNotesDialog";
import { v4 as uuidv4 } from "uuid";

const AUDIO_CHUNK_TIME = 20000;

const StudentMeetingNotesPage = () => {
  const [recentMeetings, setRecentMeetings] = useState<MeetingNoteInfo[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [transcriptionInfo, setTranscriptionInfo] = useState<{
    error?: string;
    meetingNoteId?: string;
    summary?: string;
    notes?: string;
    transcript?: string;
    studentEmail?: string;
    suggestedTags?: SuggestedTag[];
  } | null>(null);
  const [savingTags, setSavingTags] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { user } = useAuth();
  const { id: studentId } = useParams<{ id: string }>();
  const sessionIdRef = useRef<string | null>(null);
  const chunkIndexRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const fetchRecentMeetings = async () => {
      try {
        const response = await fetch(
          `/api/students/${studentId}/meeting-notes`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch recent meetings");
        }
        const data = await response.json();
        setRecentMeetings(data);
      } catch (error) {
        console.error("Error fetching recent meetings:", error);
      }
    };
    fetchRecentMeetings();
  }, [studentId]);

  const handleStartTranscription = async () => {
    try {
      setTranscriptionInfo(null);
      setShowSummary(false);

      sessionIdRef.current = uuidv4();
      chunkIndexRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const options: MediaRecorderOptions = {
        mimeType: "audio/webm;codecs=opus",
      };

      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = "audio/mp4";
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = "audio/webm";
        }
      }

      isRecordingRef.current = true;

      const startNewRecorder = () => {
        if (!isRecordingRef.current || !streamRef.current) {
          return;
        }

        const mediaRecorder = new MediaRecorder(streamRef.current, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0) {
            const formData = new FormData();
            formData.append("chunk", event.data);
            formData.append("sessionId", sessionIdRef.current!);
            formData.append("chunkIndex", chunkIndexRef.current.toString());

            try {
              const response = await fetch("/api/meeting-notes/chunks", {
                method: "POST",
                body: formData,
              });

              if (!response.ok) {
                console.error(
                  `Chunk ${chunkIndexRef.current} failed:`,
                  await response.text(),
                );
              } else {
                console.log(
                  `Chunk ${chunkIndexRef.current} uploaded successfully`,
                );
              }

              chunkIndexRef.current++;
            } catch (error) {
              console.error("Error uploading chunk:", error);
            }
          }
        };

        mediaRecorder.onstop = () => {
          if (isRecordingRef.current) {
            setTimeout(() => startNewRecorder(), 100);
          }
        };

        mediaRecorder.start();
        setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
        }, AUDIO_CHUNK_TIME);
      };

      startNewRecorder();
      setIsTranscribing(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert(
        "Unable to access microphone. Please ensure microphone permissions are granted.",
      );
    }
  };

  const handleStopTranscription = async () => {
    isRecordingRef.current = false;
    setIsTranscribing(false);

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsGenerating(true);
    try {
      const response = await fetch("/api/meeting-notes/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          userId: user?.user_id,
          studentId: studentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to finalize transcription");
      }

      const data = await response.json();
      setTranscriptionInfo(data);
      setShowSummary(true);

      const meetingsResponse = await fetch(
        `/api/students/${studentId}/meeting-notes`,
      );
      if (meetingsResponse.ok) {
        const updatedMeetings = await meetingsResponse.json();
        setRecentMeetings(updatedMeetings);
      }
    } catch (error) {
      console.error("Error finalizing transcription:", error);
      setTranscriptionInfo({
        error: "Error generating summary. Please try again.",
      });
      setShowSummary(true);
    } finally {
      setIsGenerating(false);
    }
  };
  const handleAddNote = async (noteData: {
    date: Date;
    notes: string;
    isPrivate: boolean;
  }) => {
    setIsGenerating(true);
    try {
      const data = await addMeetingNotes(
        user?.user_id || "",
        studentId || "",
        noteData.notes,
        noteData.date.toISOString(),
        noteData.isPrivate,
      );
      setTranscriptionInfo({
        meetingNoteId: data.meetingNoteId,
        summary: data.summary,
        notes: data.notes,
        transcript: undefined,
        studentEmail: data.studentEmail,
        suggestedTags: data.suggestedTags,
      });
      setShowSummary(true);

      const response = await fetch(`/api/students/${studentId}/meeting-notes`);
      if (response.ok) {
        const updatedMeetings = await response.json();
        setRecentMeetings(updatedMeetings);
      }
    } catch (error) {
      console.error("Error adding meeting note:", error);
      setTranscriptionInfo({
        error: "Error saving meeting note. Please try again.",
      });
      setShowSummary(true);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      {/* Transcription Section */}
      <div className="mb-10 p-6 bg-white rounded-lg shadow border border-gray-200">
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${isTranscribing ? "max-h-20 opacity-100 mb-4" : "max-h-0 opacity-0 mb-0"}`}
        >
          <div className="relative h-16 w-full max-w-md mx-auto">
            <div className="absolute inset-0 flex items-center justify-around">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-400 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 70 + 15}%`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center space-y-4">
          <button
            type="button"
            onClick={
              isTranscribing
                ? handleStopTranscription
                : handleStartTranscription
            }
            className={`inline-flex items-center justify-center gap-3 px-8 py-4 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out transform hover:scale-105 ${
              isTranscribing
                ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
            }`}
            aria-label={
              isTranscribing ? "Stop transcription" : "Start transcription"
            }
          >
            {isTranscribing ? (
              <>
                <CircleStop className="w-8 h-8" />{" "}
                <span className="text-xl">Stop Transcription</span>
              </>
            ) : (
              <>
                <Mic className="w-8 h-8" />{" "}
                <span className="text-xl">Start Transcription</span>
              </>
            )}
          </button>
          <div className="text-sm text-gray-500">
            {isTranscribing
              ? "Recording audio... Click stop when finished."
              : "Click to start recording audio for transcription."}
          </div>
          <div className="relative">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white text-sm text-gray-500">or</span>
            </div>
          </div>
          <AddMeetingNotesDialog
            onSave={(noteData: MeetingNoteData) =>
              handleAddNote({
                date: new Date(noteData.date),
                notes: noteData.notes,
                isPrivate: noteData.isPrivate,
              })
            }
            isLoading={isGenerating || isTranscribing}
          />
        </div>
        {isGenerating && (
          <div className="mt-8">
            <div className="flex flex-col justify-center items-center py-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Generating summary
              </h3>
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${showSummary && !isTranscribing ? "max-h-96 opacity-100 mt-8 pt-6 border-t" : "max-h-0 opacity-0 mt-0 pt-0 border-t-0"} border-gray-200`}
        >
          {transcriptionInfo && transcriptionInfo.error && (
            <div className="text-left">
              <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded border border-gray-200 mb-5 leading-relaxed">
                {transcriptionInfo.error}
              </p>
            </div>
          )}
          {transcriptionInfo && !isGenerating && !transcriptionInfo.error && (
            <div className="text-left">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  Generated summary:
                </h3>
                <Link
                  href={`/students/${studentId}/meeting-notes/${transcriptionInfo.meetingNoteId}`}
                  className="mr-1 flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View details
                </Link>
              </div>
              <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded border border-gray-200 mb-5 leading-relaxed">
                {transcriptionInfo.summary}
              </p>
              {transcriptionInfo.suggestedTags &&
                transcriptionInfo.suggestedTags.length > 0 && (
                  <div
                    className={
                      savingTags ? "opacity-50 pointer-events-none" : ""
                    }
                  >
                    <SuggestedTags
                      tags={transcriptionInfo.suggestedTags}
                      onAddTags={async (tags) => {
                        setSavingTags(true);
                        try {
                          // Save each tag to the student
                          const savePromises = tags.map((tag) =>
                            fetch(`/api/students/${studentId}/tags`, {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                tagId: tag.tagId,
                                tagName: tag.name,
                                tagCategoryId: tag.tagCategoryId,
                                value: tag.value,
                              }),
                            }),
                          );

                          await Promise.all(savePromises);

                          // Clear the suggested tags after successful save
                          setTranscriptionInfo((prev) =>
                            prev ? { ...prev, suggestedTags: [] } : null,
                          );

                          // Notify the layout to refresh tags immediately and subtly animate
                          if (typeof window !== "undefined") {
                            window.dispatchEvent(
                              new CustomEvent("student-tags:added", {
                                detail: {
                                  studentId,
                                  tags: tags.map((t) => ({
                                    tagId: t.tagId,
                                    tagName: t.name,
                                    tagCategoryId: t.tagCategoryId,
                                    value: t.value,
                                  })),
                                },
                              }),
                            );
                            // Backward-compat simple refresh event
                            window.dispatchEvent(
                              new CustomEvent("student-tags:refresh"),
                            );
                          }
                        } catch (error) {
                          console.error("Error saving tags:", error);
                        } finally {
                          setSavingTags(false);
                        }
                      }}
                    />
                  </div>
                )}
              <div className="flex items-center justify-start gap-4">
                <span className="text-sm font-medium text-gray-700">
                  Send summary via email:
                </span>
                <a
                  href={`mailto:${transcriptionInfo.studentEmail}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email Student ({transcriptionInfo.studentEmail})
                </a>
                {/* <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded-md hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email Parents (2)
                </button> */}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Previous Meetings Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Recent Meetings
        </h2>
        <div className="space-y-4">
          {recentMeetings.map((meeting) => (
            <div
              key={meeting.meetingNoteId}
              className="bg-white rounded-lg shadow p-5 border border-gray-200 hover:shadow-md transition-shadow duration-150"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-grow">
                  <p className="text-xs text-gray-500 mb-1">
                    {format(new Date(meeting.updatedAt), "MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {meeting.summary}
                  </p>
                </div>
                <Link
                  href={`/students/${studentId}/meeting-notes/${meeting.meetingNoteId}`}
                  className="mr-1 flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View details
                </Link>
              </div>
            </div>
          ))}
          {recentMeetings.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No previous meeting notes found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentMeetingNotesPage;
