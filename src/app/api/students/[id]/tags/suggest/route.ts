import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod/v3';
import { getAllTagsForCustomer, getStudentTags, getAllTagCategories } from '@/libs/tagsService';

const suggestedTagSchema = z.object({
  tags: z.array(z.object({
    tagName: z.string().describe('Exact name of existing tag or concise new tag name'),
    categoryName: z.string().describe('Category name from the EXISTING CATEGORIES list'),
    value: z.string().describe('Concise value for the tag'),
  })).max(5).describe('Up to 5 suggested tags based on meeting notes')
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    const { notes, summary } = await req.json();

    if (!notes || !summary) {
      return NextResponse.json(
        { error: 'Notes and summary are required' },
        { status: 400 }
      );
    }

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
    const tagsByCategory = new Map<string, { tagId: string; name: string; values: string[] }[]>();
    existingCustomerTags.forEach(tag => {
      if (!tagsByCategory.has(tag.categoryName)) {
        tagsByCategory.set(tag.categoryName, []);
      }
      tagsByCategory.get(tag.categoryName)?.push(tag);
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
    const enrichedTags = object.tags.map(tag => {
      const categoryTags = tagsByCategory.get(tag.categoryName) || [];
      const existingTag = categoryTags.find(t => 
        t.name.toLowerCase() === tag.tagName.toLowerCase()
      );

      // Look up the actual category UUID from the category name
      const categoryId = categoryNameToId.get(tag.categoryName.toUpperCase());

      // Skip tags if we can't find the category ID
      if (!categoryId) {
        console.warn(`Could not find category ID for category name: ${tag.categoryName}`);
        return null;
      }

      return {
        tagName: tag.tagName,
        tagId: existingTag?.tagId,
        tagCategoryId: categoryId,
        categoryName: tag.categoryName,
        value: tag.value
      };
    }).filter(tag => tag !== null);

    // Filter out any tags that would duplicate existing student tags
    const uniqueTags = enrichedTags.filter(tag => 
      !studentTagValues.has(`${tag.tagName}:${tag.value}`)
    );

    return NextResponse.json({ suggestedTags: uniqueTags });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred while generating tag suggestions';
    console.error('Error generating tag suggestions:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
