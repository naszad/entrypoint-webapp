// Function to generate consistent colors for tag categories
export function getTagColors(category: string): { bg: string; text: string; border: string } {
  // Predefined colors for common categories
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    'Goals': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    'Athletics': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    'Medical': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    'Hobbies and Interests': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    'Academics': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
    'Behavioral': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    'Social': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
    'Family': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
    'Health': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
    'Other': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  };

  // Return predefined color if exists
  if (colorMap[category]) {
    return colorMap[category];
  }

  // Generate consistent color based on category name hash
  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
    { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
  ];

  // Simple hash function to get consistent index
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = ((hash << 5) - hash) + category.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}