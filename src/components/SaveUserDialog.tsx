import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

interface SaveUserDialogProps {
  onSave: (userData: {
    firstName: string;
    lastName: string;
    email: string;
  }) => Promise<void>;
}

export const SaveUserDialog = ({ onSave }: SaveUserDialogProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailWarning, setEmailWarning] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null);

  const openSaveUserDialog = () => {
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setEmailWarning('');
    setAlertMessage(null);
    setIsLoading(false);
    setIsValidatingEmail(false);
    setUserExists(false);
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    let isValid = true;
    
    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
    } else {
      setFirstNameError('');
    }
    
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      isValid = false;
    } else {
      setLastNameError('');
    }
    
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
      setEmailWarning('');
    }
    
    return isValid;
  };

  const handleSaveClick = async () => {
    if (!validateForm()) {
      return;
    }

    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    };
    
    try {
      setIsLoading(true);
      setAlertMessage(null);
      
      await onSave(userData);

      // Success - close dialog and reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setFirstNameError('');
      setLastNameError('');
      setEmailError('');
      setEmailWarning('');
      setIsValidatingEmail(false);
      setUserExists(false);
      setIsDialogOpen(false);
    } catch (error) {
      // Error - show alert in dialog and keep dialog open
      setAlertMessage({
        type: 'destructive',
        message: error instanceof Error ? error.message : 'An error occurred while saving the user'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailBlur = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return;
    }

    try {
      setIsValidatingEmail(true);
      setEmailWarning('');
      setUserExists(false);

      const response = await fetch(`/api/users/check-email?email=${encodeURIComponent(email.trim())}`);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check email');
      }

      if (result.exists) {
        // User exists - fill in the names and show warning
        setFirstName(result.user.firstName);
        setLastName(result.user.lastName);
        setEmailWarning('User already exists');
        setUserExists(true);
      } else {
        // User doesn't exist - clear any previous state
        setUserExists(false);
        setEmailWarning('');
      }

    } catch (error) {
      console.error('Error checking email:', error);
      setEmailWarning('');
      setUserExists(false);
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const handleDialogClose = () => {
    if (!isLoading && !isValidatingEmail) {
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <Button variant="action" onClick={openSaveUserDialog}>
        <UserPlus className="w-4 h-4" />
        Add New User
      </Button>
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Add a new user to the system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email *
              </label>
               <Input
                 required
                 type="email"
                 id="email"
                 placeholder="Enter email address"
                 value={email}
                 onChange={(e) => {
                   setEmail(e.target.value);
                   setEmailError('');
                   setEmailWarning('');
                   setUserExists(false);
                 }}
                 onBlur={handleEmailBlur}
                 disabled={isValidatingEmail}
               />
              {emailWarning && (
                <p className="text-sm text-yellow-500">{emailWarning}</p>
              )}
              {emailError && (
                <p className="text-sm text-red-500">{emailError}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">
                First Name *
              </label>
              <Input
                required
                id="firstName"
                placeholder="Enter first name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setFirstNameError('');
                }}
                disabled={userExists}
              />
              {firstNameError && (
                <p className="text-sm text-red-500">{firstNameError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">
                Last Name *
              </label>
              <Input
                required
                id="lastName"
                placeholder="Enter last name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setLastNameError('');
                }}
                disabled={userExists}
              />
              {lastNameError && (
                <p className="text-sm text-red-500">{lastNameError}</p>
              )}
            </div>
          </div>

          {/* Alert Message */}
          {alertMessage && (
            <Alert 
              variant={alertMessage.type}
              message={alertMessage.message}
              autoClose={true}
              onClose={() => setAlertMessage(null)}
            />
          )}
          
          <DialogFooter className="sm:justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleDialogClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="primary" 
              onClick={handleSaveClick}
              disabled={isLoading || isValidatingEmail}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isValidatingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking email...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
