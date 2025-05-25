import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getReportExistsByName } from '@/libs/reportsService';
import { useAuth } from "@/context/AuthContext";

interface EditReportDialogProps {
  onSave: (viewData: {
    name: string;
    description: string;
  }) => void;
  reportId?: string;
  initialName?: string;
  initialDescription?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditReportDialog = ({ 
  onSave, 
  reportId = '',
  initialName = '', 
  initialDescription = '',
  isOpen,
  onOpenChange
}: EditReportDialogProps) => {
  const { user } = useAuth();
  const [viewName, setViewName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [viewNameError, setViewNameError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setViewName(initialName);
      setDescription(initialDescription);
      setViewNameError('');
    }
  }, [isOpen, initialName, initialDescription]);

  const handleSaveClick = async () => {
    if (!viewName.trim()) {
      setViewNameError('View name is required');
      return;
    }

    const exists = await getReportExistsByName(viewName, user?.userId, reportId);
    if (exists) {
      setViewNameError(`Report with name '${viewName}' already exists`);
      return;
    }

    const viewData = {
      name: viewName,
      description: description,
    };
    
    onSave(viewData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Report</DialogTitle>
          <DialogDescription>
            Edit report name and description
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Input
              required
              id="editView"
              placeholder="Please provide view name"
              value={viewName}
              onChange={(e) => {
                setViewName(e.target.value);
                setViewNameError('');
              }}
            />
            {viewNameError && (
              <p className="text-sm text-red-500">{viewNameError}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Input
              id="description"
              placeholder="Description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="primary" onClick={handleSaveClick}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 