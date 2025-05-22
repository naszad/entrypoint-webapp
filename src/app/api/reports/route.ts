import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/libs/supabaseClient'

export async function POST(req: NextRequest) {
  try {
    const { name, description, params, pageName, userId } = await req.json();

    console.log('saving report for user: ', userId);
    
    // First check if report with this name exists
    const { data: existingReport } = await supabase
      .from('reports')
      .select('report_id')
      .eq('name', name)
      .eq('user_id', userId)
      .single();

    if (existingReport) {
      // Update existing report
      const { data, error } = await supabase
        .from('reports')
        .update({ 
          description, 
          params, 
          page_name: pageName,
          updated_at: new Date().toISOString()
        })
        .eq('report_id', existingReport.report_id)
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Report updated successfully',
        reportId: data[0].report_id
      });
    } else {
      // Insert new report
      const { data, error } = await supabase
        .from('reports')
        .insert({ 
          name, 
          description, 
          params, 
          page_name: pageName,
          user_id: userId
        })
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Report created successfully',
        reportId: data[0].report_id
      });
    }
  } catch (error) {
    console.error('Error saving report:', error);
    return NextResponse.json(
      { error: 'Failed to save report' },
      { status: 500 }
    );
  }
} 