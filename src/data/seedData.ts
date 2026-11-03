import { Category, CommunityGroup, CrowdPerson, LocalStore, Scene } from '../types';

export const categories: Category[] = [
  { id: 'all', label: 'All scenes', emoji: '✳', tone: 'all' },
  { id: 'sports', label: 'Sports', emoji: '⚽', tone: 'green' },
  { id: 'food', label: 'Chai & food', emoji: '☕', tone: 'peach' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮', tone: 'lilac' },
  { id: 'outdoors', label: 'Outdoors', emoji: '🏕️', tone: 'blue' },
  { id: 'tech', label: 'Tech & meetups', emoji: '💻', tone: 'yellow' },
  { id: 'creative', label: 'Creative', emoji: '🎨', tone: 'pink' },
  { id: 'music', label: 'Music', emoji: '🎸', tone: 'purple' }
];

export const cities = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala'
];

export const groups: CommunityGroup[] = [
  { id: 'group-1', name: 'The Chai Circle', emoji: '☕', desc: 'Low-key meetups, good chai and better conversations.', members: 128, tone: 'peach', city: 'Lahore' },
  { id: 'group-2', name: 'Turf After Hours', emoji: '⚽', desc: 'Pick-up matches and post-game food runs.', members: 84, tone: 'green', city: 'Lahore' },
  { id: 'group-3', name: 'Build & Chill', emoji: '💻', desc: 'Makers, founders and weekend side projects.', members: 62, tone: 'lavender', city: 'Lahore' },
  { id: 'group-4', name: 'The Weekend Wanders', emoji: '🏕️', desc: 'Morning trails, local trips and fresh air.', members: 93, tone: 'blue', city: 'Islamabad' }
];

export const people: CrowdPerson[] = [
  { name: 'Maha K.', initials: 'MK', tone: 'pink', vibe: 'Outdoors · Coffee' },
  { name: 'Hamza A.', initials: 'HA', tone: 'green', vibe: 'Football · Gaming' },
  { name: 'Sara F.', initials: 'SF', tone: 'lavender', vibe: 'Art · Music' },
  { name: 'Saad M.', initials: 'SM', tone: 'yellow', vibe: 'Tech · Chai' }
];

// Real data mode: no dummy scenes are injected. All scenes are loaded from Cloud Firestore.
export const seedScenes: Scene[] = [];

export const initialLocalStore: LocalStore = {
  name: '',
  city: 'Lahore',
  interests: ['sports', 'food', 'gaming'],
  created: [],
  joined: [],
  requested: [],
  saved: [],
  groupsJoined: [],
  friendsRequested: [],
  blockedHosts: [],
  reports: [],
  incoming: [],
  notifications: [
    {
      id: 'n1',
      type: 'welcome',
      title: "Welcome to Scene Hai? ✨",
      body: "Discover real meetups around you or create your own scene.",
      ago: 'Just now',
      seen: false
    }
  ],
  messages: {}
};
