import Image from "next/image";
import { User } from "@/types/User";

interface UserProfileProps {
  user: User | null;
  isPending: boolean;
}

// Helper function to get user's full name
const getUserFullName = (user: User | null): string => {
  if (!user) return '';
  return `${user.first_name || ''} ${user.last_name || ''}`.trim();
};

export const UserProfile = ({ user, isPending }: UserProfileProps) => {
  return (
    <div className="flex">
      <div>
        {user?.image_url && !isPending && (
          <Image
            src={user.image_url}
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