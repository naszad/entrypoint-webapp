import React from "react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Mail } from "lucide-react";
import { stringToColor } from "@/utils/utils";

interface StudentProfileHeaderProps {
  firstName: string;
  lastName: string;
  fullName: string;
  gradeLevel: string | number;
  graduationYear: string | number;
  studentId: string;
  email: string;
  photoUrl?: string;
}

const getUserInitials = (firstName: string, lastName: string): string => {
  if (!firstName || !lastName) return '';
  const firstInitial = firstName?.[0] || '';
  const lastInitial = lastName?.[0] || '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

export const StudentProfileHeader: React.FC<StudentProfileHeaderProps> = ({
  firstName,
  lastName,
  fullName,
  gradeLevel,
  graduationYear,
  studentId,
  email,
  photoUrl,
}) => (
  <Card className="flex items-center justify-between p-6 mb-6">
    <div className="flex items-center gap-4">
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={fullName}
          className="w-16 h-16 rounded-full object-cover"
          width={64}
          height={64}
        />
      ) : (
        <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-2xl ${stringToColor(fullName)}`}>
          {getUserInitials(firstName, lastName)}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div className="text-2xl font-bold">{fullName}</div>
        <div className="text-gray-600 font-medium">
          Grade {gradeLevel} • Class of {graduationYear}
          {studentId ? ` • ID: ${studentId}` : ''}
        </div>
      </div>
    </div>
    <a
      href={`mailto:${email}`}
      className="flex items-center px-4 py-2 z-50 gap-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
    >
      <Mail size={20} />
      Email
    </a>
    
  </Card>
);