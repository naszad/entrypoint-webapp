import { MeetingNoteInfo } from "@/types/MeetingNoteInfo";
import { createClient } from '@/utils/supabase/supabaseServer';

type MeetingNoteData = {
    meeting_note_id: string;
    user_id: string;
    summary: string;
    notes: string;
    transcript: string;
    private: boolean;
    created_at: string;
    updated_at: string;
    student: {
        full_name: string;
        student_id: string;
    };
}

export async function fetchMeetingNotesByStudentIdAndMeetingNoteId(studentId: string, meetingNoteId: string): Promise<MeetingNoteInfo> {
    const supabase = await createClient();

    const { data: meetingNote, error } = await supabase
      .from('meeting_notes')
      .select(`meeting_note_id, user_id, summary, notes, transcript, private, created_at, updated_at,
        student:students!inner(full_name, student_id)`)
      .eq('student_id', studentId)
      .eq('meeting_note_id', meetingNoteId)
      .single();

      if (error) {
        throw new Error(`Failed to fetch meeting note: ${error.message}`);
      }

      const meetingNoteData = meetingNote as unknown as MeetingNoteData;

      const meetingNoteInfo: MeetingNoteInfo = {
        meetingNoteId: meetingNoteData.meeting_note_id,
        userId: meetingNoteData.user_id,
        summary: meetingNoteData.summary,
        notes: meetingNoteData.notes,
        transcript: meetingNoteData.transcript,
        private: meetingNoteData.private,
        updatedAt: meetingNoteData.updated_at,
        studentName: meetingNoteData.student.full_name,
        studentId: meetingNoteData.student.student_id,
      };

      return meetingNoteInfo;
}

export async function updateMeetingNote(meetingNoteId: string, notes: string, summary: string, userId: string, isPrivate?: boolean) {
    const supabase = await createClient();

    const { data: currentNote, error: fetchError } = await supabase
      .from('meeting_notes')
      .select('update_log, notes, summary, private')
      .eq('meeting_note_id', meetingNoteId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch current meeting note: ${fetchError.message}`);
    }

    let updateLog = [];
    if (currentNote.update_log) {
      try {
        updateLog = JSON.parse(currentNote.update_log);
      } catch {
        updateLog = [];
      }
    }

    const currentTimestamp = new Date().toISOString();
    const trimmedNotes = notes.trim();
    const trimmedSummary = summary.trim();

    // Check for changes and add to update log
    if (currentNote.notes !== trimmedNotes && currentNote.summary !== trimmedSummary) {
      updateLog.push({
        timestamp: currentTimestamp,
        user_id: userId,
        message: "Edited meeting notes and summary"
      });
    } else if (currentNote.notes !== trimmedNotes) {
      updateLog.push({
        timestamp: currentTimestamp,
        user_id: userId,
        message: "Edited meeting notes"
      });
    } else if (currentNote.summary !== trimmedSummary) {
      updateLog.push({
        timestamp: currentTimestamp,
        user_id: userId,
        message: "Edited summary"
      });
    }

    // Check for privacy change
    if (isPrivate !== undefined && currentNote.private !== isPrivate) {
      updateLog.push({
        timestamp: currentTimestamp,
        user_id: userId,
        message: isPrivate ? "Set to private" : "Set to public"
      });
    }

    const updateData: {
      notes: string;
      summary: string;
      update_log: string;
      updated_at: string;
      private?: boolean;
    } = { 
      notes: trimmedNotes,
      summary: trimmedSummary,
      update_log: JSON.stringify(updateLog),
      updated_at: currentTimestamp
    };

    // Only update private field if it's provided
    if (isPrivate !== undefined) {
      updateData.private = isPrivate;
    }

    const { data, error } = await supabase
      .from('meeting_notes')
      .update(updateData)
      .eq('meeting_note_id', meetingNoteId)
      .select()
      .single();


      if (error) {
        throw new Error(`Failed to update meeting note: ${error.message}`);
      }

      return data;
}

export async function deleteMeetingNote(meetingNoteId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('meeting_notes')
    .delete()
    .eq('meeting_note_id', meetingNoteId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete meeting note: ${error.message}`);
  }

  return data;
}

export async function fetchRecentMeetingNotes(studentId: string): Promise<MeetingNoteInfo[]> {
  const supabase = await createClient();

  const { data: meetingNotes, error } = await supabase
    .from('meeting_notes')
    .select(`meeting_note_id, user_id, summary, notes, transcript, created_at, updated_at,
      student:students!inner(full_name, student_id)`)
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch meeting note: ${error.message}`);
    }

    const meetingNoteData = meetingNotes as unknown as MeetingNoteData[];

    const meetingNoteInfos: MeetingNoteInfo[] = meetingNoteData.map((meetingNote) => ({
      meetingNoteId: meetingNote.meeting_note_id,
      userId: meetingNote.user_id,
      summary: meetingNote.summary,
      notes: meetingNote.notes,
      transcript: meetingNote.transcript,
      private: meetingNote.private,
      updatedAt: meetingNote.updated_at,
      studentName: meetingNote.student.full_name,
      studentId: meetingNote.student.student_id,
    }));
    
    return meetingNoteInfos;
}