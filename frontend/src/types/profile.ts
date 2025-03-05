export interface Profile {
  firebaseUid: string;
  name: string;
  gender: string;
  interests: string[];
  unreadMessages?: number;
}

// Dummy profiles for initial development
export const DUMMY_PROFILES: Profile[] = [
  {
    firebaseUid: 'dummy1',
    name: 'Sarah Johnson',
    gender: 'Female',
    interests: ['Coffee Tasting', 'Latte Art', 'Coffee Roasting']
  },
  {
    firebaseUid: 'dummy2',
    name: 'Alex Chen',
    gender: 'Male',
    interests: ['Espresso', 'Coffee Culture', 'Cafe Hopping']
  },
  {
    firebaseUid: 'dummy3',
    name: 'Michael Brown',
    gender: 'Male',
    interests: ['Coffee Brewing', 'Coffee History', 'Coffee Beans']
  },
  {
    firebaseUid: 'dummy4',
    name: 'Emma Wilson',
    gender: 'Female',
    interests: ['Coffee and Books', 'Cafe Music', 'Coffee Art']
  }
]; 