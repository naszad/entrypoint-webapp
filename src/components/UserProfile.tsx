
import { UserInfo } from "@/types/UserInfo";
import Image from "next/image";

interface UserProfileProps {
  user: UserInfo | null;
}

// Helper function to get user's full name
const getUserFullName = (user: UserInfo | null): string => {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim();
};

export const UserProfile = ({ user }: UserProfileProps) => {
  return (
    <div className="flex">
      <div>
        {user?.imageUrl && (
          <Image
            src={user.imageUrl}
            width="10"
            height="10"
            alt={getUserFullName(user)}
            className="h-10 w-10 rounded-full"
          />
        )}
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight ml-3">
        {(
          <>
            <span className="truncate font-medium">{getUserFullName(user)}</span>
          </>
        )}
      </div>
    </div>
  );
}; 