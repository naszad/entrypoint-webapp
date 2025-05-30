'use server';

import { FilterValue } from '@/components/DataTable/DataTable';
import { createClient } from '@/utils/supabase/supabaseServer';
import { Report } from '@/models/Reports';

type SaveReportParams = {
  name: string;
  description: string;
  params: string;
  pageName: string;
  userId: string;
}

type UpdateReportParams = {
  reportId: string;
  name: string;
  description: string;
  userId: string;
}

type ReportsRequest = {
  userId: string;
  filters: FilterValue[];
  sortInfo: {
    sortField: string;
    sortDirection: 'asc' | 'desc';
  };
  pagingInfo: {
    pageNumber: number;
    pageSize: number;
  };
};

const getColumnName = (key: string) => {
  switch (key) {
    case 'pageName':
      return 'page_name';
    case 'updatedAt':
      return 'updated_at';
    case 'updatedAtFrom':
      return 'updated_at';
    case 'updatedAtTo':
      return 'updated_at';
    default:
      return key;
  }
}

export async function fetchReportsByCriteria(request: ReportsRequest): Promise<Report[]> {
  try {
    const supabase = await createClient();
    const { userId, filters, sortInfo, pagingInfo } = request;
    let query = supabase
      .from('reports')
      .select(`report_id,
        user_id,
        name,
        description,
        page_name,
        params,
        created_at,
        updated_at
      `)
      .eq('user_id', userId);

      filters.forEach((filter) => {
        const columnName = getColumnName(filter.key);
        
        switch (filter.condition) {
          case 'contains':
            query = query.ilike(columnName, `%${filter.value}%`);
            break;
          case 'starts':
            query = query.ilike(columnName, `${filter.value}%`);
            break;
          case 'ends':
            query = query.ilike(columnName, `%${filter.value}`);
            break;
          case 'not':
            query = query.neq(columnName, filter.value);
            break;
          case 'gt':
            query = query.gt(columnName, filter.value);
            break;
          case 'lt':
            query = query.lt(columnName, filter.value);
            break;
          case 'gte':
            query = query.gte(columnName, filter.value);
            break;
          case 'lte':
            query = query.lte(columnName, filter.value);
            break;
          default:
            query = query.eq(columnName, filter.value);
        }
      }); 

       // Apply sorting
      if (sortInfo.sortField) {
        query = query.order(getColumnName(sortInfo.sortField), { ascending: sortInfo.sortDirection === 'asc' });
      }

      // Apply pagination
      const from = (pagingInfo.pageNumber - 1) * pagingInfo.pageSize;
      const to = from + pagingInfo.pageSize - 1;
      query = query.range(from, to);

      const { data, error } = await query;
    
      if (error) {
        throw new Error(error.message);
      } 
      
      const reports: Report[] = data.map((report) => ({
        reportId: report.report_id,
        userId: report.user_id,
        name: report.name,
        description: report.description,
        pageName: report.page_name,
        params: report.params,
        createdAt: report.created_at,
        updatedAt: report.updated_at
      }));

      return reports;
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [] as Report[];
  }
} 

export async function getReportExistsByName(name: string, userId: string = '', reportId: string = ''): Promise<boolean> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('reports')
      .select(`report_id,
        name
      `)
      .ilike('name', name.trim().toLowerCase())
      .eq('user_id', userId);

    if (reportId) {
      query = query.neq('report_id', reportId);
    }

    const { data } = await query.single();

    return !!data;
  } catch (error) {
    console.error('Error checking report:', error);
    return false;
  }
} 

export async function saveReport(params: SaveReportParams): Promise<{ message: string; reportId: string }> {
  try {
    const supabase = await createClient();
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

export async function updateReport(params: UpdateReportParams): Promise<{ message: string; reportId: string }> {
  try {
    const supabase = await createClient();
    const { reportId, name, description, userId } = params;
    
    const { data, error } = await supabase
        .from('reports')
        .update({ 
          name: name.trim(),
          description,
          updated_at: new Date().toISOString()
        })
        .eq('report_id', reportId)
        .eq('user_id', userId)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return { 
        message: 'Report updated successfully.',
        reportId: data[0].report_id
      };

  } catch (error) {
    console.error('Error updating report:', error);
    throw new Error('Something went wrong, please try again later.');
  }
}

export async function deleteReport(reportId: string, userId: string): Promise<{ message: string; reportId: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('reports')
        .delete()
        .eq('report_id', reportId)
        .eq('user_id', userId)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return { 
        message: 'Report deleted successfully.',
        reportId: data[0].report_id
      };

  } catch (error) {
    console.error('Error deleting report:', error);
    throw new Error('Something went wrong, please try again later.');
  }
} 