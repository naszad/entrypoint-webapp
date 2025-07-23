'use client'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Pencil, ArrowLeft, Trash2 } from 'lucide-react'
import { MeetingNoteInfo } from '@/types/MeetingNoteInfo'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from '@/context/AuthContext'
import { format } from 'date-fns'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

export default function MeetingNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [meetingNote, setMeetingNote] = useState<MeetingNoteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState<string>('');
  const [editedSummary, setEditedSummary] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingPrivate, setIsTogglingPrivate] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchMeetingNote = async () => {
      try {
        const { id: studentId, 'meeting-note-id': meetingNoteId } = params
        const response = await fetch(`/api/students/${studentId}/meeting-notes/${meetingNoteId}`);
        if (!response.ok) {
          setError('An error occurred while fetching the meeting note, please try again later');
        }
        const meetingNoteData = await response.json();
        if (meetingNoteData.error) {
          setError(meetingNoteData.error);
          setMeetingNote(null);
        } else {
          setMeetingNote(meetingNoteData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching the meeting note');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetingNote();
  }, [params]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [error ])

  const updateMeetingNoteAPI = async (updateData: {
    notes: string;
    summary: string;
    private?: boolean;
  }) => {
    const { id: studentId, 'meeting-note-id': meetingNoteId } = params;
    const response = await fetch(`/api/students/${studentId}/meeting-notes/${meetingNoteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...updateData,
        userId: user?.userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update meeting note, please try again later');
    }

    return response.json();
  };

  const deleteMeetingNoteAPI = async (meetingNoteId: string) => {
    const { id: studentId } = params;
    const response = await fetch(`/api/students/${studentId}/meeting-notes/${meetingNoteId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user?.userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete meeting note, please try again later');
    }

    // Navigate to meeting notes list after successful deletion
    router.push(`/students/${studentId}/meeting-notes`);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedNotes(meetingNote?.notes || '');
    setEditedSummary(meetingNote?.summary || '');
  };

  const handleSaveClick = async () => {
    if (!meetingNote) return;
    
    setIsSaving(true);
    try {
      await updateMeetingNoteAPI({
        notes: editedNotes,
        summary: editedSummary,
      });

      setMeetingNote(prev => prev ? { ...prev, notes: editedNotes, summary: editedSummary } : null);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meeting note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedNotes('');
    setEditedSummary('');
  };

  const handlePrivateToggle = async (checked: boolean) => {
    if (!meetingNote) return;
    
    setIsTogglingPrivate(true);
    try {
      await updateMeetingNoteAPI({
        notes: meetingNote.notes,
        summary: meetingNote.summary,
        private: checked,
      });

      setMeetingNote(prev => prev ? { ...prev, private: checked } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update privacy setting');
    } finally {
      setIsTogglingPrivate(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!meetingNote) return;
    
    setIsDeleting(true);
    try {
      await deleteMeetingNoteAPI(meetingNote.meetingNoteId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meeting note');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  if (isLoading) {
    return (<div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>);
  }
  

  return (
    <div className="w-full h-full mx-auto py-8">
      {error && <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>}
      {meetingNote && (
        <>
          {/* Back Button and Meeting Notes Link */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Link href={`/students/${meetingNote?.studentId}/meeting-notes`} className="mr-2 group flex items-center gap-1 hover:text-blue-700">
                <ArrowLeft className="h-5 w-5 text-gray-500 group-hover:text-blue-600 inline align-middle" />
                <span className="text-base font-medium">Meeting Notes</span>
              </Link>
            </div>
            {meetingNote?.userId === user?.userId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-gray-700">Private</span>
                    <Switch 
                      className="cursor-pointer"
                      checked={meetingNote?.private}
                      onCheckedChange={handlePrivateToggle}
                      disabled={isTogglingPrivate}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  A private note means that no other users will be able to see it, and the contents of the note will be unavailable to the AI assistant when asking questions about the student.
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {/* Meeting Summary Header */}
          <div className="mb-8 bg-white rounded-lg shadow p-6 w-full">
            <div className="flex flex-col gap-2 w-full">
              <div className="text-2xl font-bold text-gray-900 mb-1">{format(new Date(meetingNote?.updatedAt || ''), 'MMMM d, yyyy')}</div>
              <div className="text-gray-700 text-sm mb-2">
                <span className="font-medium">Attendees:</span> {meetingNote?.studentName}
              </div>
                          {isEditing ? (
                  <div className="mt-2 w-full">
                    <textarea
                      value={editedSummary}
                      onChange={(e) => setEditedSummary(e.target.value)}
                      className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
                      placeholder="Enter meeting summary..."
                    />
                  </div>
                ) : (
                  <p className="text-gray-700 text-base mt-2">{meetingNote?.summary}</p>
                )}
            </div>
          </div>
          {/* Expanded Notes */}
          <div className="bg-white rounded-lg shadow p-6 mb-8 w-full">
            <h2 className="text-lg font-semibold mb-2">Summarized Notes</h2>
            <div className="mb-3 w-full">
              {isEditing ? (
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter meeting notes..."
                />
              ) : (
                meetingNote?.notes?.split('-')
                  .map(note => note.trim())
                  .filter(note => note.length > 0)
                  .map((note, index) => (
                    <div key={index} className="flex items-start mb-2">
                      <span className="text-blue-600 mr-2 mt-1">•</span>
                      <p className="text-gray-700">{note}</p>
                    </div>
                  ))
              )}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            {meetingNote?.userId === user?.userId && (
              <>
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveClick} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <>
                  <Button variant="outline" onClick={handleEditClick}>
                    <Pencil className="w-5 h-5" />
                    Edit
                  </Button>
                  <Button variant="danger" onClick={handleDeleteClick}>
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </Button>
                </>
                )}
              </>
            )}
          </div>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Meeting Note</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this meeting note?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={handleCancelDelete}>
                  No
                </Button>
                <Button 
                  variant="danger" 
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

    </div>
  )
} 