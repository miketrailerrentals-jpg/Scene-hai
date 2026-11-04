import { LocalStore, Scene, UserProfile } from './types';
import { initialLocalStore, seedScenes } from './data/seedData';

export const LOCAL_STORAGE_KEY = 'scene-hai:design-v1';
export const USER_PROFILE_KEY_PREFIX = 'scene-hai:user-profile:';

const DUMMY_SCENE_IDS = new Set([
  'ft-1', 'chai-2', 'game-3', 'hike-4', 'tech-5', 'art-6', 'music-7', 'bad-8', 'coffee-9', 'demo-host'
]);

export function loadLocalStore(): LocalStore {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...structuredClone(initialLocalStore),
          ...parsed,
          name: parsed.name === 'Areeb Khan' ? '' : (parsed.name || ''),
          joined: Array.isArray(parsed.joined)
            ? parsed.joined.filter((id: string) => !DUMMY_SCENE_IDS.has(id))
            : [],
          saved: Array.isArray(parsed.saved)
            ? parsed.saved.filter((id: string) => !DUMMY_SCENE_IDS.has(id))
            : [],
          incoming: Array.isArray(parsed.incoming)
            ? parsed.incoming.filter((r: any) => !DUMMY_SCENE_IDS.has(r?.sceneId) && !String(r?.id).startsWith('demo-'))
            : [],
          created: Array.isArray(parsed.created)
            ? parsed.created.filter((s: any) => !DUMMY_SCENE_IDS.has(s?.id) && !s?.isDemo)
            : []
        };
      }
    }
  } catch (err) {
    console.warn('[LocalStorage] Error loading store:', err);
  }
  return structuredClone(initialLocalStore);
}

export function saveLocalStore(store: LocalStore) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('[LocalStorage] Error saving store:', err);
  }
}

export function getUserProfile(uid: string): UserProfile | null {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY_PREFIX + uid);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (err) {}
  return null;
}

export function saveUserProfile(uid: string, profileData: UserProfile) {
  if (!uid) return;
  try {
    localStorage.setItem(USER_PROFILE_KEY_PREFIX + uid, JSON.stringify(profileData));
  } catch (err) {}
}

export function dateFor(s: Scene): Date {
  if (s.startsAt instanceof Date) return s.startsAt;
  if (s.startsAt && typeof (s.startsAt as any).toDate === 'function') {
    return (s.startsAt as any).toDate();
  }
  if (s.date) {
    return new Date(s.date + 'T' + (s.time || '18:00') + ':00');
  }
  const d = new Date();
  d.setDate(d.getDate() + (s.timeOffset || 0));
  d.setHours(s.hour || 18, s.minute || 0, 0, 0);
  return d;
}

export function dateLabel(s: Scene): string {
  const d = dateFor(s);
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((b.getTime() - a.getTime()) / 86400000);
  const prefix =
    days === 0
      ? 'Today'
      : days === 1
      ? 'Tomorrow'
      : d.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    prefix +
    ' · ' +
    d.toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit', hour12: true })
  );
}

export function dateShort(s: Scene): string {
  const d = dateFor(s);
  const t = new Date();
  const off = Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()) /
      86400000
  );
  return off === 0
    ? 'TODAY'
    : off === 1
    ? 'TOMORROW'
    : d.toLocaleDateString('en-PK', { weekday: 'short' }).toUpperCase();
}

export function price(s: Scene): string {
  return s.budget === 0 ? 'Free' : `Rs ${Number(s.budget).toLocaleString('en-PK')}`;
}

export function remain(s: Scene): number {
  if (s.isFirestore) {
    const approved = Number(s.approvedCount || 0);
    return Math.max(0, s.spots - 1 - approved);
  }
  return Math.max(0, s.spots - s.going);
}

export function formatFirestoreScene(docId: string, data: any, currentUserId?: string): Scene {
  const isMine = !!(currentUserId && data.hostId === currentUserId);
  let startsDate = new Date();
  if (data.startsAt && typeof data.startsAt.toDate === 'function') {
    startsDate = data.startsAt.toDate();
  } else if (data.startsAt && data.startsAt.seconds) {
    startsDate = new Date(data.startsAt.seconds * 1000);
  } else if (data.startsAt instanceof Date) {
    startsDate = data.startsAt;
  } else if (data.startsAt) {
    startsDate = new Date(data.startsAt);
  }

  const dateStr = startsDate.toLocaleDateString('en-CA');
  const timeStr = startsDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const categoryImages: Record<string, string> = {
    sports: 'futsal',
    food: 'chai',
    gaming: 'gaming',
    outdoors: 'hike',
    tech: 'tech',
    creative: 'art',
    music: 'music'
  };
  const cat = data.category || 'sports';
  const imageKey = categoryImages[cat] || 'futsal';
  const hostName = data.hostDisplayName || (isMine ? 'You' : 'Scene Host');
  const initials =
    hostName
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SH';
  const budget = Number(data.budgetPerPerson || 0);
  const approvedCount = Number(data.approvedCount || 0);
  const spots = Number(data.maxParticipants || 8);
  const going = 1 + approvedCount;

  return {
    id: docId,
    isFirestore: true,
    isMine,
    hostId: data.hostId,
    title: data.title || '',
    category: cat,
    city: data.city || 'Lahore',
    area: data.area || '',
    venue: data.venue || 'Meetup spot shared after approval',
    startsAt: startsDate,
    date: dateStr,
    time: timeStr,
    budget,
    budgetType: budget === 0 ? 'Free entry' : 'Est. per person',
    spots,
    going,
    approvedCount,
    host: hostName,
    initials,
    hostTone: 'green',
    image: imageKey,
    description: data.description || '',
    tags: isMine ? ['Hosted by you', 'Live cloud scene'] : ['Live cloud scene', data.city || 'Pakistan'],
    privacy: (data.privacy === 'private' || data.privacy === 'Private') ? 'Private' : 'Public',
    status: data.status || 'active',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
}

export function formatKarachiDateTime(dateOrTimestamp: any): string {
  if (!dateOrTimestamp) return '';
  const date = dateOrTimestamp?.toDate ? dateOrTimestamp.toDate() : new Date(dateOrTimestamp);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date) + ' PKT';
}

export function formatTimeAgo(dateOrTimestamp: any): string {
  if (!dateOrTimestamp) return 'Recently';
  const date = dateOrTimestamp?.toDate ? dateOrTimestamp.toDate() : new Date(dateOrTimestamp);
  if (isNaN(date.getTime())) return 'Recently';
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'Just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

