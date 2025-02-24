export interface OnboardingData {
  name: string;
  gender: 'Male' | 'Female' | 'Prefer not to say';
  interests: string[];
}

export const AVAILABLE_INTERESTS = [
  'Business and Startups',
  'AI',
  'Love',
  'Friends',
  'Networking',
  'Consultancy',
  'Creative Domain'
]; 