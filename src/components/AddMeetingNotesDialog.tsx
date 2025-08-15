import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

export interface MeetingNoteData {
  date: string;
  notes: string;
  isPrivate: boolean;
}

interface AddMeetingNotesProps {
  onSave: (noteData: MeetingNoteData) => void;
  isLoading?: boolean;
}

export const AddMeetingNotesDialog = ({ onSave, isLoading = false }: AddMeetingNotesProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [notesError, setNotesError] = useState('');

  const openDialog = () => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
    setIsPrivate(false);
    setNotesError('');
    setIsDialogOpen(true);
  };

  const handleSaveClick = async () => {
    if (!notes.trim()) {
      setNotesError('Meeting notes are required');
      return;
    }

    const noteData = {
      date: date,
      notes: notes.trim(),
      isPrivate: isPrivate,
    };
    
    onSave(noteData);
    
    // Reset form and close dialog
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
    setIsPrivate(false);
    setNotesError('');
    setIsDialogOpen(false);
  };

  const handleCancel = () => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
    setIsPrivate(false);
    setNotesError('');
    setIsDialogOpen(false);
  };

  return (
    <>

      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
        onClick={openDialog}
        disabled={isLoading}
      >
        <FileText className="w-5 h-5" />
        Enter Note Manually
      </button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Meeting Notes</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Date Field */}
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <label htmlFor="meeting-date" className="text-sm font-medium text-gray-700">
                  Meeting Date
                </label>
                <Input
                  id="meeting-date"
                  type="date"
                  placeholder="Meeting date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Notes Field */}
            <div className="grid gap-2">
              <label htmlFor="meeting-notes" className="text-sm font-medium text-gray-700">
                Meeting Notes
              </label>
              <textarea
                id="meeting-notes"
                placeholder="Enter meeting notes in bullet points or paragraphs. Markdown formatting is supported."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setNotesError('');
                }}
                className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
              />
              {notesError && (
                <p className="text-sm text-red-500">{notesError}</p>
              )}
              <p className="text-xs text-gray-500">
                Tip: Use bullet points with • or - for better formatting
              </p>
            </div>

            {/* Private Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label htmlFor="private-toggle" className="text-sm font-medium text-gray-700">
                  Mark as Private
                </label>
                <p className="text-xs text-gray-500">
                  Private notes are only visible to you and won&apos;t be available to AI assistant
                </p>
              </div>
              <Switch
                id="private-toggle"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
                className="cursor-pointer"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="primary" 
              onClick={handleSaveClick}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
