import { useState } from "react";
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { StarIcon } from "lucide-react";
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

interface SaveViewDialogProps {
  onSave: (viewData: {
    name: string;
    description: string;
    params: string;
  }) => void;
}

export const SaveViewDialog = ({ onSave }: SaveViewDialogProps) => {
  const searchParams = useSearchParams();
  const [viewName, setViewName] = useState('');
  const [description, setDescription] = useState('');
  const [viewNameError, setViewNameError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const openSaveViewDialog = () => {
    setViewName('');
    setViewNameError('');
    setDescription('');
    setShowConfirmation(false);
    setIsDialogOpen(true);
  }

  const handleSaveClick = async () => {
    if (!viewName.trim()) {
      setViewNameError('View name is required');
      return;
    }

    const exists = await getReportExistsByName(viewName);
    if (exists) {
      setShowConfirmation(true);
    } else {
      saveView();
    }
  };

  const saveView = () => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    const viewData = {
      name: viewName,
      description: description,
      params: JSON.stringify(params),
    };
    
    onSave(viewData);

    setViewName('');
    setViewNameError('');
    setDescription('');
    setShowConfirmation(false);
    setIsDialogOpen(false);
  };

  const handleNoClick = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      <Button 
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        onClick={openSaveViewDialog}
      >
        <StarIcon className="w-4 h-4" />
        Save view
      </Button>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save view</DialogTitle>
            <DialogDescription>
              Save current view with filter and sort settings
            </DialogDescription>
          </DialogHeader>
          
          {!showConfirmation ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <Input
                    required
                    id="saveView"
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
                    required
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
            </>
          ) : (
            <>
              <div>
                <p className="text-gray-700">
                  The report &apos;{viewName}&apos; already exists, do you wish to overwrite?
                </p>
              </div>
              <DialogFooter className="sm:justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleNoClick}>
                  No
                </Button>
                <Button type="button" variant="primary" onClick={saveView}>
                  Yes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}; 