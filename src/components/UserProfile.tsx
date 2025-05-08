
import { UserInfo } from "@/types/UserInfo";
import Image from "next/image";

interface UserProfileProps {
  user: UserInfo | null;
  isPending: boolean;
}

// Helper function to get user's full name
const getUserFullName = (user: UserInfo | null): string => {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim();
};

export const UserProfile = ({ user, isPending }: UserProfileProps) => {
  return (
    <div className="flex">
      <div>
        {user?.imageUrl && !isPending && (
          <Image
            src={user.imageUrl}
            width="10"
            height="10"
            alt={getUserFullName(user)}
            className="h-10 w-10 rounded-full"
          />
        )}
        {isPending && (
          <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
        )}
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight ml-3">
        {!isPending ? (
          <>
            <span className="truncate font-medium">{getUserFullName(user)}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.school?.name || ''}
            </span>
          </>
        ) : (
          <>
            <span className="h-4 w-24 bg-gray-200 rounded animate-pulse"></span>
            <span className="h-3 w-20 bg-gray-200 rounded animate-pulse mt-1"></span>
          </>
        )}
      </div>
    </div>
  );
}; 