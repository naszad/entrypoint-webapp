
'use server';

import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/supabaseServer';
import { StudentTagInfo, CategoryTagInfo } from '@/types/StudentTagInfo';
import { getFuzzyMatchingValue } from '@/utils/utils';
import { cookies } from 'next/headers';

/**
 * Finds an existing canonical value for a tag value.
 * This function implements fuzzy matching to find close canonical values if they exist.
 */
async function findOrCreateCanonicalValue(
  supabase: SupabaseClient,
  tagId: string,
  value: string,
  userId: string
): Promise<string | null> {
  try {
    // Fetch canonical values for the given tag
    const { data: canonicalValues} = await supabase
      .from('tag_canonical_values')
      .select('tag_canonical_value_id, value')
      .eq('tag_id', tagId);

    if (canonicalValues?.length) {
      // Check for an exact match (case-insensitive)
      const exactMatch = canonicalValues.find(
        (cv) => cv.value.toLowerCase() === value.toLowerCase()
      );

      if (exactMatch) {
        return exactMatch.tag_canonical_value_id;
      }

      // Apply fuzzy matching
      const { bestMatch, score } = getFuzzyMatchingValue(
        value,
        canonicalValues.map((cv) => cv.value)
      );

      // If there's a close match but not exact, do not store a new canonical value
      const isCloseButNotExact = score > 0.8 && bestMatch.toLowerCase() !== value.toLowerCase();
      if (isCloseButNotExact) {
        return null;
      }
    }

    console.log('going to insert canonical value: ', { tag_id: tagId, value, created_by_user_id: userId })

    // Create a new canonical value if no match was found
    const { data: newCanonicalValue, error: newCanonicalValueError } = await supabase
      .from('tag_canonical_values')
      .insert({ tag_id: tagId, value, created_by_user_id: userId })
      .select('tag_canonical_value_id')
      .single();

    if (newCanonicalValueError) {
      console.error('Error inserting canonical value:', newCanonicalValueError);
      return null;
    }

    return newCanonicalValue?.tag_canonical_value_id ?? null;
  } catch (err) {
    console.warn('Unexpected error in findOrCreateCanonicalValue:', err);
    return null;
  }
}

export async function getStudentTags(studentId: string): Promise<StudentTagInfo> {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }
    
    const { data: tagsData, error: tagsError } = await supabase
      .from('student_tags')
      .select(`
        student_tag_id,
        tag_id,
        value,
        tags (
          tag_id,
          name,
          tag_categories (
            tag_category_id,
            name
          )
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (tagsError) {
      throw new Error(`Failed to fetch student tags: ${tagsError.message}`);
    }

    const categoryMap: Record<string, CategoryTagInfo> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tagsData ?? []).forEach((row: any) => {
      // Skip rows with incomplete tag data
      if (!row.tags?.tag_categories) return;
      
      const categoryId = row.tags.tag_categories.tag_category_id;
      const categoryName = row.tags.tag_categories.name;

      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = {
          categoryId,
          categoryName,
          tags: [],
        };
      }

      categoryMap[categoryId].tags.push({
        studentTagId: row.student_tag_id,
        tagId: row.tags.tag_id,
        tagName: row.tags.name,
        tagValue: row.value,
      });
    });

    const categories: CategoryTagInfo[] = Object.values(categoryMap);

    return {
      studentId,
      categories,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`Failed to fetch student tags. Error: ${message}`);
  }
}


type AddNewStudentTagParams = {
  studentId: string;
  tagId?: string;
  tagName: string;
  tagCategoryId: string;
  value: string;
};

export async function addNewStudentTag(params: AddNewStudentTagParams): Promise<{ message: string }> {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const {studentId, tagId, tagName, tagCategoryId, value} = params;
    const cookieStore = await cookies();
    const selectedSchoolId = cookieStore.get('selectedSchoolId')?.value;
  

    // Get student info to get customer ID
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('customer_id')
      .eq('school_id', selectedSchoolId)
      .single();

    if (schoolError || !school) {
      throw new Error(`School not found: ${schoolError?.message}`);
    }

    let finalTagId = tagId ?? '';

    // If tagId is not provided, create a new tag
    if (!finalTagId) {
      const { data: newTag, error: tagError } = await supabase
        .from('tags')
        .insert({
          tag_category_id: tagCategoryId,
          customer_id: school.customer_id,
          name: tagName,
          is_multi_value: tagName?.toLowerCase() !== value?.toLowerCase(),
          created_by_user_id: user.id,
          updated_by_user_id: user.id,
        })
        .select('tag_id')
        .single();

      if (tagError || !newTag) {
        throw new Error(`Failed to create new tag: ${tagError?.message}`);
      }

      finalTagId = newTag.tag_id;
    }

    const canonicalValueId = await findOrCreateCanonicalValue(
      supabase,
      finalTagId,
      value,
      user.id
    );

    // Create the student_tags entry
    const { error: studentTagError } = await supabase
      .from('student_tags')
      .insert({
        student_id: studentId,
        tag_id: finalTagId,
        value,
        canonical_value_id: canonicalValueId,
        source: 'manual',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
      });

    if (studentTagError) {
      throw new Error(`Failed to create student tag: ${studentTagError.message}`);
    }

    return { message: 'Student tag added successfully' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`Failed to add new student tag. Error: ${message}`);
  }
}

export async function updateStudentTag(studentTagId: string, value: string): Promise<{ message: string }> {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // First, get the tag_id from the student_tag record
    const { data: studentTag, error: fetchError } = await supabase
      .from('student_tags')
      .select('tag_id')
      .eq('student_tag_id', studentTagId)
      .single();

    if (fetchError || !studentTag) {
      throw new Error(`Failed to find student tag: ${fetchError?.message}`);
    }

    const canonicalValueId = await findOrCreateCanonicalValue(
      supabase,
      studentTag.tag_id,
      value,
      user.id
    );

    const { error: studentTagError } = await supabase
      .from('student_tags')
      .update({ 
        value,
        canonical_value_id: canonicalValueId,
        updated_by_user_id: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('student_tag_id', studentTagId);

    if (studentTagError) {
      throw new Error(`Failed to update student tag: ${studentTagError.message}`);
    }

    return { message: 'Student tag updated successfully' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`Failed to update student tag. Error: ${message}`);
  }
}

export async function deleteStudentTag(studentTagId: string): Promise<{ message: string }> {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { error: studentTagError } = await supabase
      .from('student_tags')
      .delete()
      .eq('student_tag_id', studentTagId);

    if (studentTagError) {
      throw new Error(`Failed to delete student tag: ${studentTagError.message}`);
    }

    return { message: 'Student tag deleted successfully' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`Failed to delete student tag. Error: ${message}`);
  }
}

export async function getAllTagCategories(): Promise<{ tagCategoryId: string; name: string }[]> {
  try {
    const supabase = await createClient();
    
    const { data: categories, error } = await supabase
      .from('tag_categories')
      .select('tag_category_id, name')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch tag categories: ${error.message}`);
    }

    return categories?.map(cat => ({
      tagCategoryId: cat.tag_category_id,
      name: cat.name
    })) ?? [];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`Failed to fetch tag categories. Error: ${message}`);
  }
}

export async function getAllTagsForCustomer(): Promise<{ tagId: string; name: string; categoryId: string; categoryName: string; values: string[]; isMultiValue: boolean }[]> {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const cookieStore = await cookies();
    const selectedSchoolId = cookieStore.get('selectedSchoolId')?.value;

    if (!selectedSchoolId) {
      throw new Error('Selected school not found; cannot scope tags without school context.');
    }

    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('customer_id')
      .eq('school_id', selectedSchoolId)
      .single();

    if (schoolError || !school?.customer_id) {
      throw new Error(`Unable to resolve customer for selected school ${selectedSchoolId}. Error: ${schoolError?.message ?? 'No customer found'}`);
    }

    const customerId = school.customer_id;

    // Get all tags for this customer with their categories and values
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select(`
        tag_id,
        name,
        is_multi_value,
        tag_categories (
          tag_category_id,
          name
        ),
        tag_canonical_values (
          value
        )
      `)
      .eq('customer_id', customerId)
      .order('name');

    if (tagsError) {
      throw new Error(`Failed to fetch tags: ${tagsError.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return tags?.map((tag: any) => ({
      tagId: tag.tag_id,
      name: tag.name,
      categoryId: tag.tag_categories?.tag_category_id ?? '',
      categoryName: tag.tag_categories?.name ?? '',
      values: [...new Set(tag.tag_canonical_values?.map((tcv: { value: string }) => tcv.value) ?? [])] as string[],
      isMultiValue: Boolean(tag.is_multi_value),
    })) ?? [];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`Failed to fetch tags. Error: ${message}`);
  }
}

