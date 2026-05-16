/**
 * Convert internal DB gender value to display label.
 * DB stores: 'men' | 'women' | 'mixed'
 * Display:   "Men's" | "Women's" | "Neutral"
 */
export const getGenderLabel = (gender) => {
  if (!gender) return '';
  switch (gender.toLowerCase()) {
    case 'men':
    case 'male':
      return "Men's";
    case 'women':
    case 'female':
      return "Women's";
    case 'mixed':
    case 'open':
      return 'Neutral';
    default:
      return gender;
  }
};
