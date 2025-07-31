  import { gradeColors } from '../utils/gradeColors';

const GradeLetter = ({ grade }: { grade: string | null }) => {
  if (!grade) return <span className="text-gray-400">&#8212;</span>;
  return <span className={`inline-block w-10 text-center px-2 py-1 rounded font-semibold text-sm ${gradeColors[grade]}`}>{grade}</span>;
};

export default GradeLetter;