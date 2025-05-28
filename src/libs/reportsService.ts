'use server';

import { supabase } from '@/libs/supabaseClient'

type SaveReportParams = {
  name: string;
  description: string;
  params: string;
  pageName: string;
  userId: string;
}

export async function getReportExistsByName(name: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('reports')
      .select(`report_id,
        name
      `)
      .ilike('name', name.trim().toLowerCase())
      .single();
    
    return !!data;
  } catch (error) {
    console.error('Error checking report:', error);
    return false;
  }
} 

export async function saveReport(params: SaveReportParams): Promise<{ message: string; reportId: string }> {
  try {
    const { name, description, params: reportParams, pageName, userId } = params;
    
    // First check if report with this name exists
    const { data: existingReport } = await supabase
      .from('reports')
      .select('report_id')
      .ilike('name', name.trim().toLowerCase())
      .eq('user_id', userId)
      .single();

    if (existingReport) {
      // Update existing report
      const { data, error } = await supabase
        .from('reports')
        .update({ 
          name: name.trim(),
          description, 
          params: reportParams, 
          page_name: pageName,
          updated_at: new Date().toISOString()
        })
        .eq('report_id', existingReport.report_id)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return { 
        message: 'View saved successfully.',
        reportId: data[0].report_id
      };
    } else {
      // Insert new report
      const { data, error } = await supabase
        .from('reports')
        .insert({ 
          name: name.trim(), 
          description, 
          params: reportParams, 
          page_name: pageName,
          user_id: userId
        })
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return { 
        message: 'View saved successfully.',
        reportId: data[0].report_id
      };
    }
  } catch (error) {
    console.error('Error saving report:', error);
    throw new Error('Something went wrong, please try again later.');
  }
} 