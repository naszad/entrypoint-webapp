import { MeetingNoteInfo } from "@/types/MeetingNoteInfo";
import { createClient } from '@/utils/supabase/supabaseServer';
import { FilterValue } from "@/components/DataTable/DataTable";
import { cookies } from 'next/headers';

type MeetingNotesRequest = {
  fetchWithCount?: boolean;
  userId: string;
  filters: FilterValue[];
  sort?: string | null;
  pagingInfo?: {
    pageNumber: number;
    pageSize: number;
  };
};

type MeetingNotesResponse = {
  data: MeetingNoteInfo[];
  count?: number;
};

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

const getColumnName = (key: string) => {
  switch (key) {
    case 'studentName':
      return 'full_name';
    case 'summary':
      return 'summary';
    case 'createdAt':
      return 'created_at';
    case 'createdAtFrom':
      return 'created_at';
    case 'createdAtTo':
      return 'created_at';
    case 'createdAtRecentOnly':
      return 'created_at';
    default:
      return key;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyFilters = (q: any, filters: FilterValue[]) => {
  // Handle date range filters specially
  const dateFromFilter = filters.find(f => f.key === 'createdAtFrom');
  const dateToFilter = filters.find(f => f.key === 'createdAtTo');
  const recentOnlyFilter = filters.find(f => f.key === 'createdAtRecentOnly');
  
  // Handle RecentOnly filter first
  if (recentOnlyFilter && parseInt(recentOnlyFilter.value) > 0) {
    const today = new Date();
    const daysAgo = new Date();
    daysAgo.setDate(today.getDate() - parseInt(recentOnlyFilter.value));
    
    const todayEndOfDay = new Date(today);
    todayEndOfDay.setHours(23, 59, 59, 999);
    
    q = q.gte('created_at', daysAgo.toISOString())
        .lte('created_at', todayEndOfDay.toISOString());
  } else {
    // Apply date range filters if both exist
    if (dateFromFilter && dateToFilter) {
      const fromDate = dateFromFilter.value;
      const toDate = dateToFilter.value;
      
      // For the "to" date, we need to include the entire day
      // Add 23:59:59.999 to the to date to include all records from that day
      const toDateEndOfDay = new Date(toDate);
      toDateEndOfDay.setHours(23, 59, 59, 999);
      
      q = q.gte('created_at', fromDate)
          .lte('created_at', toDateEndOfDay.toISOString());
    } else {
      // Apply individual date filters if only one exists
      if (dateFromFilter) {
        q = q.gte('created_at', dateFromFilter.value);
      }
      if (dateToFilter) {
        const toDateEndOfDay = new Date(dateToFilter.value);
        toDateEndOfDay.setHours(23, 59, 59, 999);
        q = q.lte('created_at', toDateEndOfDay.toISOString());
      }
    }
  }

  // Apply all other filters
  filters.forEach((filter) => {
    // Skip date range filters and RecentOnly filters as they're handled above
    if (filter.key === 'createdAtFrom' || filter.key === 'createdAtTo' || filter.key === 'createdAtRecentOnly') {
      return;
    }
    
    let baseColumnKey = filter.key;
    if (filter.key.endsWith('RecentOnly') && parseInt(filter.value) > 0) {
      baseColumnKey = filter.key.replace('RecentOnly', '');
    }

    const columnName = getColumnName(baseColumnKey);
    const filterOnStudentTable = ![
      'created_at',
      'summary',
    ].includes(columnName);
    
    const targetColumn = filterOnStudentTable ? `students.${columnName}` : columnName;

    switch (filter.condition) {
      case 'contains':
        q = q.ilike(targetColumn, `%${filter.value}%`);
        break;
      case 'starts':
        q = q.ilike(targetColumn, `${filter.value}%`);
        break;
      case 'ends':
        q = q.ilike(targetColumn, `%${filter.value}`);
        break;
      case 'not':
        q = q.neq(targetColumn, filter.value);
        break;
      case 'gt':
        q = q.gt(targetColumn, filter.value);
        break;
      case 'lt':
        q = q.lt(targetColumn, filter.value);
        break;
      case 'gte':
        q = q.gte(targetColumn, filter.value);
        break;
      case 'lte':
        q = q.lte(targetColumn, filter.value);
        break;
      case 'in':
        // Handle multi-select values (pipe-separated) or single values
        if (filter.value.includes('|')) {
          const values = filter.value.split('|').filter(v => v.trim() !== '');
          q = q.in(targetColumn, values);
        } else {
          q = q.eq(targetColumn, filter.value);
        }
        break;
      default:
        q = q.eq(targetColumn, filter.value);
    }
  });
  return q;
};

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
        createdAt: meetingNoteData.created_at,
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
      createdAt: meetingNote.created_at,
      updatedAt: meetingNote.updated_at,
      studentName: meetingNote.student.full_name,
      studentId: meetingNote.student.student_id,
    }));
    
    return meetingNoteInfos;
}

export async function fetchMeetingNotesByFilterCriteria(request: MeetingNotesRequest): Promise<MeetingNotesResponse> {
  try {
    const supabase = await createClient()
    const { filters, sort, pagingInfo, fetchWithCount, userId } = request;
    const cookieStore = await cookies();
    const selectedSchoolId = cookieStore.get('selectedSchoolId')?.value;

    if (!selectedSchoolId) {
      return {
        data: [],
        count: 0
      };
    }
    
    const hasStudentFilters = filters.some(f => {
      const columnName = getColumnName(f.key);
      return columnName === 'full_name';
    });

    // Single query using join to get meeting notes for students in the selected school
    let query = supabase
    .from('meeting_notes')
    .select(`meeting_note_id, user_id, summary, notes, private, transcript, created_at, updated_at,
      student:students!inner(full_name, student_id, school_link:school_student_link!inner(school_id))`)
    .eq('user_id', userId)
    .eq('student.school_link.school_id', selectedSchoolId)
    .order('updated_at', { ascending: false });
    

    // Apply filters to main query
    query = applyFilters(query, filters);

    // Apply sorting
    if (sort) {
      const [sortField, sortDirection] = sort.split(':');
      const sortColumn = getColumnName(sortField);
      const onStudentTable = !['created_at', 'summary', 'notes', 'private', 'transcript'].includes(sortColumn);

      if (onStudentTable) {
        query = query.order(sortColumn, { ascending: sortDirection === 'asc', foreignTable: 'students' });
      } else {
        query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
      }
    }

    // Apply pagination
    if (pagingInfo) {
      const from = (pagingInfo.pageNumber - 1) * pagingInfo.pageSize;
      const to = from + pagingInfo.pageSize - 1;
      query = query.range(from, to);
    }

    // Execute main query
    const { data: meetingNotes, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    if (!meetingNotes) {
      return {
        data: [],
        count: 0
      };
    }

    const meetingNoteData = meetingNotes as unknown as MeetingNoteData[];

    const meetingNoteInfos: MeetingNoteInfo[] = meetingNoteData.map((meetingNote): MeetingNoteInfo | null => {

      return {
        meetingNoteId: meetingNote.meeting_note_id,
        userId: meetingNote.user_id,
        summary: meetingNote.summary,
        notes: meetingNote.notes,
        transcript: meetingNote.transcript,
        private: meetingNote.private,
        createdAt: meetingNote.created_at,
        updatedAt: meetingNote.updated_at,
        studentName: meetingNote.student.full_name,
        studentId: meetingNote.student.student_id
      };
    }).filter((meetingNote): meetingNote is MeetingNoteInfo => meetingNote !== null);

    let countResult: number | undefined = undefined;
    if (fetchWithCount) {
      let countQuery = supabase
        .from('meeting_notes')
        .select(hasStudentFilters ? '*,students!inner(student_id,full_name,school_student_link!inner(school_id))' : '*,students!inner(school_student_link!inner(school_id))', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('students.school_student_link.school_id', selectedSchoolId);
      
      // Apply the same filters to count query
      countQuery = applyFilters(countQuery, filters);
      
      const { count, error: countError } = await countQuery;
      if (countError) {
        throw new Error(countError.message);
      }
      countResult = count || 0;
    }

    return {
      data: meetingNoteInfos,
      count: countResult
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`Failed to fetch meeting notes. Error: ${message}`);
  }
} 