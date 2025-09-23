import { UserInfo } from "@/types/UserInfo";
import Image from "next/image";
import { stringToColor } from "@/utils/utils";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { loadSelectedSchool } from '@/utils/selectedSchoolStorage';

interface UserProfileProps {
  user: UserInfo | null;
}

// Helper function to get user's full name
const getUserFullName = (user: UserInfo | null): string => {
  if (!user) return '';
  return `${user.first_name || ''} ${user.last_name || ''}`.trim();
};

// Helper function to get user initials
const getUserInitials = (user: UserInfo | null): string => {
  if (!user) return '';
  const firstInitial = user.first_name?.[0] || '';
  const lastInitial = user.last_name?.[0] || '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

const getUserSchool = (): string => {
  const selectedSchool = loadSelectedSchool();
  if (!selectedSchool) return '';
  return selectedSchool.name || '';
};

export const UserProfile = ({ user }: UserProfileProps) => {
  const router = useRouter();
  return (
    <div className="flex">
      <div>
        {user?.image_url ? (
          <Image
            src={user.image_url}
            width="10"
            height="10"
            alt={getUserFullName(user)}
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${stringToColor(getUserFullName(user))}`}>
            {getUserInitials(user)}
          </div>
        )}
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight ml-3">
        {(
          <>
            <span className="truncate font-medium">{getUserFullName(user)}</span>
            {user?.isMultiSchoolUser ? (
              <div className="flex flex-row items-center cursor-pointer" onClick={() => {
                router.push('/select-school');
              }}>
                <span className="truncate text-xs text-muted-foreground">
                  {getUserSchool()}
                </span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </div>
  
            ) : (
              <span className="truncate text-xs text-muted-foreground">
                {getUserSchool()}
              </span>
            )}
                      </>
        )}
      </div>
    </div>
  );
}; 
