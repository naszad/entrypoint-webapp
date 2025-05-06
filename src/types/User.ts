export type User = {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    image_url: string;
    role: 'Counselor' | 'Student',
    school: {
      school_id: string;
      name: string;
    };
  };
  