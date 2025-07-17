'use server';

import { experimental_transcribe as transcribe, streamText} from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@/utils/supabase/supabaseServer'

export async function generateMeetingNotesAction(audioBlob: Blob, userId: string, studentId: string) {
    try {
        // Convert Blob to Buffer
        const bytes = await audioBlob.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Now transcribe the audio file using the saved file
        const transcript = await transcribe({
            model: openai.transcription('whisper-1'),
            audio: buffer,
        });

        const result = await streamText({
            model: openai('gpt-4o'),
            system: 'You are a helpful assistant that generates meeting notes from a transcript. Donot include any headings or titles in your response.',
            messages: [
                {
                    role: 'user',
                    content: `Generate a one sentence summary and detailed meeting notes in bullet points from this transcript: ${transcript.text}
                     First line should be the summary, and the rest should be the meeting notes in bullet points and in paragraphs format.`
                }
            ],
        });

        // Get the full text from the stream
        let fullText = '';
        for await (const chunk of result.textStream) {
            fullText += chunk;
        }

        // Split the text into lines and extract summary and notes
        const lines = fullText.split('\n').filter(line => line.trim() !== '');
        const summary = lines[0] || '';
        const notes = lines.slice(1).join('\n').trim();

        const supabase = await createClient()
        
        // Get student name
        const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('email')
            .eq('student_id', studentId)
            .single();

        if (studentError) {
            console.error('Error fetching student name:', studentError);
            throw studentError;
        }

        const { data, error } = await supabase
            .from('meeting_notes')
            .insert({
                user_id: userId,
                student_id: studentId,
                created_by: 'agent',
                summary,
                notes,
                transcript: transcript.text,
            })
            .select();

        if (error) {
            console.error('Error generating meeting notes:', error);
            throw error;
        }

        return {
            meetingNoteId: data[0].meeting_note_id,
            summary: summary,
            notes: notes,
            transcript: transcript.text,
            studentEmail: studentData.email,
        };
    } catch (error) {
        console.error('Error generating meeting notes:', error);
        throw error;
    }
} 