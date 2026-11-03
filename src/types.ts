export interface Scene {
  id: string;
  title: string;
  category: string;
  city: string;
  area: string;
  startsAt?: Date;
  date?: string;
  time?: string;
  timeOffset?: number;
  hour?: number;
  minute?: number;
  budget: number;
  budgetType: string;
  spots: number;
  going: number;
  approvedCount?: number;
  host: string;
  initials: string;
  hostTone: string;
  image: string;
  label?: string;
  description: string;
  tags?: string[];
  privacy: 'Public' | 'Private' | 'public' | 'private';
  venue?: string;
  feature?: boolean;
  isMine?: boolean;
  isDemo?: boolean;
  isFirestore?: boolean;
  hostId?: string;
  status?: 'active' | 'cancelled';
  createdAt?: any;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  bio?: string;
  city: string;
  area?: string;
  interests: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface JoinRequest {
  id: string;
  sceneId: string;
  sceneTitle: string;
  requesterId: string;
  name: string;
  initials: string;
  status: 'pending' | 'withdrawn' | 'approved' | 'declined' | 'left' | 'removed';
  decidedAt?: any;
  decidedBy?: string;
  createdAt?: any;
  updatedAt?: any;
  ago: string;
  isFirestore?: boolean;
}

export interface DemoIncomingRequest {
  id: string;
  sceneId: string;
  name: string;
  initials: string;
  status: 'pending' | 'approved' | 'declined';
  message: string;
}

export interface NotificationItem {
  id: string;
  type: 'welcome' | 'safety' | 'approval' | 'update';
  title: string;
  body: string;
  ago: string;
  seen: boolean;
}

export interface ChatMessage {
  from: 'me' | 'other';
  name: string;
  text: string;
  time: string;
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  tone: string;
}

export interface CommunityGroup {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  members: number;
  tone: string;
  city: string;
}

export interface CrowdPerson {
  name: string;
  initials: string;
  tone: string;
  vibe: string;
}

export interface LocalStore {
  name: string;
  city: string;
  interests: string[];
  created: Scene[];
  joined: string[];
  requested: string[];
  saved: string[];
  groupsJoined: string[];
  friendsRequested: string[];
  blockedHosts: string[];
  reports: Array<{ sceneId: string; reason: string; createdAt: string }>;
  incoming: DemoIncomingRequest[];
  notifications: NotificationItem[];
  messages: Record<string, ChatMessage[]>;
}

export type RouteType =
  | 'discover'
  | 'explore'
  | 'create'
  | 'my-scenes'
  | 'inbox'
  | 'community'
  | 'profile'
  | 'safety'
  | `scene/${string}`
  | `chat/${string}`;
