
'use server';

import { createClient } from '@/utils/supabase/supabaseServer';
import { StudentTagInfo, CategoryTagInfo } from '@/types/StudentTagInfo';

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
        tag (
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
      if (!row.tag?.tag_categories) return;
      
      const categoryId = row.tag.tag_categories.tag_category_id;
      const categoryName = row.tag.tag_categories.name;

      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = {
          categoryId,
          categoryName,
          tags: [],
        };
      }

      categoryMap[categoryId].tags.push({
        studentTagId: row.student_tag_id,
        tagId: row.tag.tag_id,
        tagName: row.tag.name,
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

    // Get student info to get customer ID
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('customer_id')
      .eq('student_id', params.studentId)
      .single();

    if (studentError || !student) {
      throw new Error(`Student not found: ${studentError?.message}`);
    }

    let finalTagId = params.tagId;

    // If tagId is not provided, create a new tag
    if (!finalTagId) {
      const { data: newTag, error: tagError } = await supabase
        .from('tags')
        .insert({
          tag_category_id: params.tagCategoryId,
          customer_id: student.customer_id,
          name: params.tagName,
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

    // Create the student_tags entry
    const { error: studentTagError } = await supabase
      .from('student_tags')
      .insert({
        student_id: params.studentId,
        tag_id: finalTagId,
        value: params.value,
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

    const { error: studentTagError } = await supabase
      .from('student_tags')
      .update({ 
        value,
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
