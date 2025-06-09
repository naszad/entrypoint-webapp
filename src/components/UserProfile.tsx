import { UserInfo } from "@/types/UserInfo";
import Image from "next/image";
import { stringToColor } from "@/utils/utils";

interface UserProfileProps {
  user: UserInfo | null;
}

// Helper function to get user's full name
const getUserFullName = (user: UserInfo | null): string => {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim();
};

// Helper function to get user initials
const getUserInitials = (user: UserInfo | null): string => {
  if (!user) return '';
  const firstInitial = user.firstName?.[0] || '';
  const lastInitial = user.lastName?.[0] || '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

export const UserProfile = ({ user }: UserProfileProps) => {
  return (
    <div className="flex">
      <div>
        {user?.imageUrl ? (
          <Image
            src={user.imageUrl}
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
            <span className="truncate text-xs text-muted-foreground">
              {user?.school?.name || ''}
            </span>
          </>
        )}
      </div>
    </div>
  );
}; 