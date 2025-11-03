
'use server';

import { createClient } from '@/utils/supabase/supabaseServer';
import { StudentTagInfo, CategoryTagInfo } from '@/types/StudentTagInfo';

/**
 * Finds an existing canonical value for a tag value.
 * This function implements fuzzy matching to find close canonical values if they exist.
 */
async function findCanonicalValue(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tagId: string,
  value: string
): Promise<string | null> {
  try {
    // First, try to find an exact match
    const { data: exactMatch, error: exactError } = await supabase
      .from('tag_canonical_values')
      .select('tag_canonical_value_id')
      .eq('tag_id', tagId)
      .eq('value', value)
      .single();

    if (exactMatch && !exactError) {
      return exactMatch.tag_canonical_value_id;
    }

    // No match found, return null
    return null;
  } catch (err) {
    console.warn('Error in findCanonicalValue:', err);
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

    // Get student info to get customer ID
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('customer_id')
      .eq('student_id', studentId)
      .single();

    if (studentError || !student) {
      throw new Error(`Student not found: ${studentError?.message}`);
    }

    let finalTagId = tagId;

    // If tagId is not provided, create a new tag
    if (!finalTagId) {
      const { data: newTag, error: tagError } = await supabase
        .from('tags')
        .insert({
          tag_category_id: tagCategoryId,
          customer_id: student.customer_id,
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

      console.log('newTag created:', newTag);

      finalTagId = newTag.tag_id;
    }

    // Find existing canonical value for the tag value (do not create new ones)
    const canonicalValueId = finalTagId ? await findCanonicalValue(
      supabase,
      finalTagId,
      value
    ) : null;

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

    // Find existing canonical value for the new tag value (do not create new ones)
    const canonicalValueId = await findCanonicalValue(
      supabase,
      studentTag.tag_id,
      value
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

export async function getAllTagsForCustomer(): Promise<{ tagId: string; name: string; categoryId: string; categoryName: string; values: string[] }[]> {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user's customer ID through their school membership
    const { data: memberships, error: membershipError } = await supabase
      .from('user_school_memberships')
      .select(`
        schools (
          customer_id
        )
      `)
      .eq('user_id', user.id)
      .limit(1);

    if (membershipError || !memberships || memberships.length === 0) {
      throw new Error(`User school membership not found. User ID: ${user.id}, Error: ${membershipError?.message || 'No memberships found'}`);
    }

    const membership = memberships[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerId = (membership as any).schools?.customer_id;

    // Get all tags for this customer with their categories and values
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select(`
        tag_id,
        name,
        tag_categories (
          tag_category_id,
          name
        ),
        student_tags (
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
      values: [...new Set(tag.student_tags?.map((st: { value: string }) => st.value) ?? [])] as string[]
    })) ?? [];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`Failed to fetch tags. Error: ${message}`);
  }
}
