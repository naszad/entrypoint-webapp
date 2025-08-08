'use server';

import { experimental_transcribe as transcribe, streamText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@/utils/supabase/supabaseServer'
import { z } from 'zod';
import { getAllTagsForCustomer, getStudentTags, getAllTagCategories } from '@/libs/tagsService';

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
            //Modified system prompt to midigate hallucinations
            system: 'You are a highly precise AI assistant for guidance counselors. Your task is to process a meeting transcript and generate a concise, factual summary for case notes. **CRITICAL INSTRUCTIONS:** 1.  **Strictly Extractive:** Your summary MUST ONLY contain information explicitly stated in the provided transcript. 2.  **NO INFERENCE:** DO NOT infer any actions, emotions, or next steps. If the transcript doesnt say "we discussed the application process" you must not mention it. 3.  **NO FABRICATION:** DO NOT add any details, topics, or conclusions that are not directly present in the text. It is better to have a short, accurate summary than a longer, embellished one. 4.  **Quote, Dont Interpret:** Base every summary point on a specific statement from the transcript. Avoid interpreting intent or emotion (e.g., "Bob is excited"). 5.  **Focus on Facts:** Extract key names, topics, goals, and decisions only. Do not include any headings or titles in your response.',
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

        // Generate tag suggestions based on the notes
        let suggestedTags: Array<{
            category: string;
            name: string;
            value: string;
            tagId?: string;
            tagCategoryId: string;
        }> = [];
        try {
            // Get existing tags for this customer and student
            const [existingCustomerTags, existingStudentTags, allCategories] = await Promise.all([
                getAllTagsForCustomer(),
                getStudentTags(studentId),
                getAllTagCategories()
            ]);

            // Flatten student's existing tags for deduplication
            const studentTagValues = new Set<string>();
            existingStudentTags.categories.forEach(category => {
                category.tags.forEach(tag => {
                    studentTagValues.add(`${tag.tagName}:${tag.tagValue}`);
                });
            });

            // Create a map of category names to IDs
            const categoryNameToId = new Map<string, string>();
            allCategories.forEach(cat => {
                categoryNameToId.set(cat.name.toUpperCase(), cat.tagCategoryId);
            });

            // Create a map of existing tags by category
            const tagsByCategory = new Map<string, { tagId: string; name: string; categoryId: string; values: string[] }[]>();
            existingCustomerTags.forEach(tag => {
                if (!tagsByCategory.has(tag.categoryName)) {
                    tagsByCategory.set(tag.categoryName, []);
                }
                tagsByCategory.get(tag.categoryName)?.push({
                    tagId: tag.tagId,
                    name: tag.name,
                    categoryId: tag.categoryId,
                    values: tag.values
                });
            });

            const systemPrompt = `You are an AI assistant helping school counselors tag student records based on meeting notes. Your task is to suggest up to 5 relevant tags that capture KEY information about the student.

CRITICAL INSTRUCTIONS:
1. ONLY suggest tags for truly important, actionable information (goals, interests, major decisions)
2. DO NOT create tags for temporary issues, difficulties, or minor details
3. REUSE existing tag names whenever possible - look for matches in the existing tags list
4. Tags should be CONCISE (2-3 words max for values)
5. AVOID duplicating tags the student already has
6. Focus on: college/career goals, major interests/hobbies, key decisions, important aspirations

GOOD TAG EXAMPLES:
- Category: "GOALS", Tag: "Target College", Value: "Purdue"
- Category: "ACADEMICS", Tag: "Intended Major", Value: "Computer Science"
- Category: "ACTIVITIES", Tag: "Primary Sport", Value: "Basketball"

BAD TAG EXAMPLES (DO NOT CREATE):
- "Has Difficulty in Chemistry" (too specific/temporary)
- "Wants to improve grades" (too generic)
- "Discussed homework habits" (not key information)

EXISTING CATEGORIES (use these category names exactly):
${Array.from(allCategories).map(cat => cat.name).join(', ')}

EXISTING TAGS FOR THIS SCHOOL:
${Array.from(tagsByCategory.entries()).map(([category, tags]) => 
  `${category}: ${tags.map(t => t.name).join(', ')}`
).join('\n')}

TAGS STUDENT ALREADY HAS (DO NOT DUPLICATE):
${Array.from(studentTagValues).join(', ')}`;

            const suggestedTagSchema = z.object({
                tags: z.array(z.object({
                    tagName: z.string().describe('Exact name of existing tag or concise new tag name'),
                    categoryName: z.string().describe('Category name from the EXISTING CATEGORIES list above'),
                    value: z.string().describe('Concise value for the tag'),
                })).max(5).describe('Up to 5 suggested tags based on meeting notes')
            });

            const { object } = await generateObject({
                model: openai('gpt-4o'),
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: `Based on this meeting summary and notes, suggest relevant tags:

SUMMARY: ${summary}

NOTES: ${notes}

Remember: Only suggest tags for KEY, IMPORTANT information. Skip minor or temporary details.`
                    }
                ],
                schema: suggestedTagSchema,
            });

            // Map the suggested tags to include existing tag IDs where applicable
            suggestedTags = object.tags.map(tag => {
                const categoryTags = tagsByCategory.get(tag.categoryName) || [];
                const existingTag = categoryTags.find(t => 
                    t.name.toLowerCase() === tag.tagName.toLowerCase()
                );

                // Look up the actual category UUID from the category name
                const categoryId = categoryNameToId.get(tag.categoryName.toUpperCase()) || 
                                   existingTag?.categoryId;

                // Skip tags if we can't find the category ID
                if (!categoryId) {
                    console.warn(`Could not find category ID for category name: ${tag.categoryName}`);
                    return null;
                }

                return {
                    category: tag.categoryName,
                    name: tag.tagName,
                    value: tag.value,
                    tagId: existingTag?.tagId,
                    tagCategoryId: categoryId
                };
            }).filter(tag => tag !== null) as typeof suggestedTags;

            // Filter out any tags that would duplicate existing student tags
            suggestedTags = suggestedTags.filter(tag => 
                !studentTagValues.has(`${tag.name}:${tag.value}`)
            );
        } catch (tagError) {
            console.error('Error generating tag suggestions:', tagError);
            // Continue without tags if there's an error
        }

        return {
            meetingNoteId: data[0].meeting_note_id,
            summary: summary,
            notes: notes,
            transcript: transcript.text,
            studentEmail: studentData.email,
            suggestedTags: suggestedTags
        };
    } catch (error) {
        console.error('Error generating meeting notes:', error);
        throw error;
    }
} 