export type StudentTagValue = {
  studentTagId: string;
  tagId: string;
  tagName: string;
  tagValue: string;
};

export type CategoryTagInfo = {
  categoryId: string;
  categoryName: string;
  tags: StudentTagValue[];
};

export type StudentTagInfo = {
  studentId: string;
  categories: CategoryTagInfo[];
};