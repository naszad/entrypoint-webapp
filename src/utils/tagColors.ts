// Function to generate consistent colors for tag categories
export function getTagColors(category: string): { bg: string; text: string; border: string, borderHex: string } {
  // Predefined colors for common categories
  const colorMap: Record<string, { bg: string; text: string; border: string, borderHex: string }> = {
    'Goals': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', borderHex: '#93c5fd' },
    'Athletics': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', borderHex: '#86efac' },
    'Medical': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', borderHex: '#fca5a5' },
    'Hobbies and Interests': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', borderHex: '#d8b4fe' },
    'Academics': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', borderHex: '#fcd34d' },
    'Behavioral': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', borderHex: '#fdba74' },
    'Social': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300', borderHex: '#f9a8d4' },
    'Family': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', borderHex: '#a5b4fc' },
    'Health': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300', borderHex: '#99f6e4' },
    'Other': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', borderHex: '#d1d5db' },
  };

  // Return predefined color if exists
  if (colorMap[category]) {
    return colorMap[category];
  }

  // Generate consistent color based on category name hash
  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', borderHex: '#93c5fd' },
    { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', borderHex: '#86efac' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', borderHex: '#fde047' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', borderHex: '#d8b4fe' },
    { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300', borderHex: '#f9a8d4' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', borderHex: '#a5b4fc' },
    { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', borderHex: '#fca5a5' },
    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', borderHex: '#fdba74' },
    { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300', borderHex: '#99f6e4' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300', borderHex: '#67e8f9' },
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