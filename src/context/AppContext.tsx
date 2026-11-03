import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  limit,
  serverTimestamp,
  Timestamp,
  runTransaction,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError } from '../firebase';
import {
  JoinRequest,
  LocalStore,
  Scene,
  UserProfile
} from '../types';
import { seedScenes } from '../data/seedData';
import {
  dateFor,
  dateShort,
  formatFirestoreScene,
  getUserProfile,
  loadLocalStore,
  remain,
  saveLocalStore,
  saveUserProfile
} from '../utils';

interface FilterState {
  city: string;
  category: string;
  when: string;
  search: string;
  myTab: string;
  inboxTab: string;
  cityOpen: boolean;
}

interface AppContextValue {
  currentUser: { uid: string; displayName: string; email: string; photoURL: string | null } | null;
  authReady: boolean;
  activeProfile: UserProfile | null;
  profileLoading: boolean;
  store: LocalStore;
  updateStore: (updater: (prev: LocalStore) => LocalStore) => void;
  currentRoute: string;
  navigate: (route: string) => void;
  goBack: () => void;
  toastMessage: string;
  showToast: (msg: string) => void;

  firestoreScenes: Scene[];
  myHostedScenes: Scene[];
  scenesLoading: boolean;
  scenesError: string;
  myHostedLoading: boolean;
  createSceneLoading: boolean;
  fetchDiscoveryScenes: () => Promise<void>;
  fetchMyHostedScenes: () => Promise<void>;
  cancelHostScene: (sceneId: string) => Promise<void>;
  createScene: (data: any) => Promise<string | null>;

  allScenes: Scene[];
  matchingScenes: Scene[];

  myJoinRequests: Record<string, string | null>;
  hostJoinRequests: JoinRequest[];
  approvedParticipants: JoinRequest[];
  hostJoinRequestsLoading: boolean;
  hostJoinRequestsError: string;
  joinRequestLoading: boolean;
  checkMyJoinRequest: (sceneId: string) => Promise<void>;
  submitJoinRequest: (sceneId: string) => Promise<void>;
  withdrawJoinRequest: (sceneId: string) => Promise<void>;
  approveJoinRequest: (sceneId: string, requesterId: string) => Promise<boolean>;
  declineJoinRequest: (sceneId: string, requesterId: string) => Promise<boolean>;
  leaveScene: (sceneId: string) => Promise<boolean>;
  removeParticipant: (sceneId: string, requesterId: string) => Promise<boolean>;
  fetchHostJoinRequests: () => Promise<void>;
  retryHostJoinRequests: () => void;

  loginWithGoogle: (intendedAction?: any) => Promise<void>;
  logout: () => Promise<void>;
  openAuthPrompt: (reason?: string, pendingAction?: any) => void;
  closeAuthPrompt: () => void;
  authModal: { open: boolean; reason: string; error: string; loading: boolean; unauthorizedDomain?: string | null };

  editProfileModal: {
    open: boolean;
    loading: boolean;
    saveError: string;
    formData: { displayName: string; bio: string; city: string; area: string };
    errors: Record<string, string>;
  };
  openEditProfile: () => void;
  closeEditProfile: () => void;
  saveProfile: (data: { displayName: string; bio: string; city: string; area: string }) => Promise<boolean>;

  migrationModal: { open: boolean; localData: UserProfile | null; loading: boolean };
  closeMigrationModal: () => void;
  handleProfileMigration: (importLocal: boolean) => Promise<void>;

  editSceneModal: {
    open: boolean;
    sceneId: string | null;
    loading: boolean;
    error: string;
    formData: any;
    errors: Record<string, string>;
  };
  openEditScene: (sceneId: string) => void;
  closeEditScene: () => void;
  saveEditedScene: (formData: any) => Promise<boolean>;

  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  getActiveDisplayName: () => string;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store, setStore] = useState<LocalStore>(() => loadLocalStore());
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return (window.location.hash.replace(/^#\/?/, '') || 'discover').replace(/^\//, '');
  });
  const [toastMessage, setToastMessage] = useState<string>('');

  // Auth State
  const [currentUser, setCurrentUser] = useState<{
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
  } | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [authPendingAction, setAuthPendingAction] = useState<any>(null);

  // Firestore Scenes
  const [firestoreScenes, setFirestoreScenes] = useState<Scene[]>([]);
  const [myHostedScenes, setMyHostedScenes] = useState<Scene[]>([]);
  const [scenesLoading, setScenesLoading] = useState<boolean>(false);
  const [scenesError, setScenesError] = useState<string>('');
  const [myHostedLoading, setMyHostedLoading] = useState<boolean>(false);
  const [createSceneLoading, setCreateSceneLoading] = useState<boolean>(false);

  // Join Requests
  const [myJoinRequests, setMyJoinRequests] = useState<Record<string, string | null>>({});
  const [hostJoinRequests, setHostJoinRequests] = useState<JoinRequest[]>([]);
  const [approvedParticipants, setApprovedParticipants] = useState<JoinRequest[]>([]);
  const [hostJoinRequestsLoading, setHostJoinRequestsLoading] = useState<boolean>(false);
  const [hostJoinRequestsError, setHostJoinRequestsError] = useState<string>('');
  const [joinRequestLoading, setJoinRequestLoading] = useState<boolean>(false);
  const [checkedRequestsSet] = useState<Set<string>>(() => new Set());

  // Listeners cleanup tracking
  const activeListenersRef = useRef<Array<() => void>>([]);

  // Host real-time subscriptions tracking
  const hostSubscriptionsRef = useRef<{
    unsubScenes?: () => void;
    requestUnsubs: Map<string, () => void>;
  }>({ requestUnsubs: new Map() });
  const sceneRequestsCacheRef = useRef<Map<string, JoinRequest[]>>(new Map());

  // Stable state refs to avoid effect dependency cycles
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const storeRef = useRef(store);
  storeRef.current = store;

  // Modals
  const [authModal, setAuthModal] = useState<{
    open: boolean;
    reason: string;
    error: string;
    loading: boolean;
    unauthorizedDomain: string | null;
  }>({
    open: false,
    reason: '',
    error: '',
    loading: false,
    unauthorizedDomain: null
  });

  const [migrationModal, setMigrationModal] = useState<{
    open: boolean;
    localData: UserProfile | null;
    loading: boolean;
  }>({
    open: false,
    localData: null,
    loading: false
  });

  const [editProfileModal, setEditProfileModal] = useState({
    open: false,
    loading: false,
    saveError: '',
    formData: {
      displayName: '',
      bio: '',
      city: 'Lahore',
      area: ''
    },
    errors: {} as Record<string, string>
  });

  const [editSceneModal, setEditSceneModal] = useState({
    open: false,
    sceneId: null as string | null,
    loading: false,
    error: '',
    formData: {
      title: '',
      description: '',
      category: 'sports',
      city: 'Lahore',
      area: '',
      venue: '',
      date: '',
      time: '18:00',
      budget: 0,
      spots: 8,
      privacy: 'public'
    },
    errors: {} as Record<string, string>
  });

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    city: store.city || 'Lahore',
    category: 'all',
    when: 'any',
    search: '',
    myTab: 'going',
    inboxTab: 'all',
    cityOpen: false
  });

  // Sync route with hash
  useEffect(() => {
    const handleHashChange = () => {
      const r = (window.location.hash.replace(/^#\/?/, '') || 'discover').replace(/^\//, '');
      setCurrentRoute(r);
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((r: string) => {
    setFilters(prev => ({ ...prev, cityOpen: false }));
    const clean = r.replace(/^#\/?/, '').replace(/^\//, '');
    window.location.hash = '/' + clean;
    setCurrentRoute(clean);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('discover');
    }
  }, [navigate]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const updateStore = useCallback((updater: (prev: LocalStore) => LocalStore) => {
    setStore(prev => {
      const next = updater(prev);
      saveLocalStore(next);
      return next;
    });
  }, []);

  const getActiveDisplayName = useCallback(() => {
    if (currentUser) {
      return activeProfile?.displayName || currentUser.displayName || 'Scene Explorer';
    }
    return store.name || 'Scene Explorer';
  }, [currentUser, activeProfile, store.name]);

  // Lock body scroll when modal is open
  useEffect(() => {
    const isAnyModalOpen =
      authModal.open ||
      editProfileModal.open ||
      migrationModal.open ||
      editSceneModal.open;
    if (isAnyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [authModal.open, editProfileModal.open, migrationModal.open, editSceneModal.open]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editSceneModal.open) setEditSceneModal(prev => ({ ...prev, open: false }));
        else if (migrationModal.open) setMigrationModal(prev => ({ ...prev, open: false }));
        else if (editProfileModal.open) setEditProfileModal(prev => ({ ...prev, open: false }));
        else if (authModal.open) setAuthModal(prev => ({ ...prev, open: false }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editSceneModal.open, migrationModal.open, editProfileModal.open, authModal.open]);

  // Firestore Profile sync
  const loadOrInitFirestoreProfile = useCallback(async (user: any) => {
    if (!user || !db) return;
    setProfileLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);
      const currentStore = storeRef.current;

      if (snap.exists()) {
        const cloudData = snap.data();
        const profile: UserProfile = {
          uid: user.uid,
          displayName: cloudData.displayName || user.displayName || 'Scene Explorer',
          bio: cloudData.bio || '',
          city: cloudData.city || currentStore.city || 'Lahore',
          area: cloudData.area || '',
          interests: Array.isArray(cloudData.interests)
            ? [...cloudData.interests]
            : ['sports', 'food', 'gaming'],
          createdAt: cloudData.createdAt || null,
          updatedAt: cloudData.updatedAt || null
        };
        saveUserProfile(user.uid, profile);
        setActiveProfile(profile);
        updateStore(s => ({
          ...s,
          name: profile.displayName,
          city: profile.city,
          interests: [...profile.interests]
        }));
      } else {
        const local = getUserProfile(user.uid);
        const alreadyPrompted = sessionStorage.getItem('scene-hai:migration-prompted:' + user.uid);
        const hasLocalCustomizations =
          local &&
          ((local.bio && local.bio.trim().length > 0) ||
            (local.area && local.area.trim().length > 0) ||
            (local.displayName && local.displayName.trim() !== user.displayName));

        if (hasLocalCustomizations && !alreadyPrompted) {
          setMigrationModal({
            open: true,
            localData: local,
            loading: false
          });
        } else {
          const initialProfile: any = {
            displayName: String(user.displayName || 'Scene Explorer').slice(0, 50).trim(),
            bio: '',
            city: String(currentStore.city || 'Lahore').slice(0, 50).trim(),
            area: '',
            interests:
              Array.isArray(currentStore.interests) && currentStore.interests.length
                ? currentStore.interests.slice(0, 15)
                : ['sports', 'food', 'gaming'],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await setDoc(userDocRef, initialProfile);
          const prof: UserProfile = { ...initialProfile, uid: user.uid };
          saveUserProfile(user.uid, prof);
          setActiveProfile(prof);
          updateStore(s => ({
            ...s,
            name: prof.displayName,
            city: prof.city,
            interests: [...prof.interests]
          }));
        }
      }
    } catch (err) {
      handleFirestoreError(err, 'loadOrInitFirestoreProfile');
      const local = getUserProfile(user.uid);
      if (local) setActiveProfile(local);
    } finally {
      setProfileLoading(false);
    }
  }, [updateStore]);

  // Firestore Scenes fetch
  const fetchDiscoveryScenes = useCallback(async () => {
    if (!db) return;
    setScenesLoading(true);
    setScenesError('');
    try {
      const q = query(
        collection(db, 'scenes'),
        where('privacy', '==', 'public'),
        where('status', '==', 'active'),
        limit(50)
      );
      const snap = await getDocs(q);
      const list: Scene[] = [];
      const currentUid = currentUserRef.current?.uid;
      snap.forEach(docSnap => {
        list.push(formatFirestoreScene(docSnap.id, docSnap.data(), currentUid));
      });
      list.sort((a, b) => dateFor(a).getTime() - dateFor(b).getTime());
      setFirestoreScenes(list);
    } catch (err: any) {
      setScenesError(err.message || 'Failed to load scenes from Firestore');
      handleFirestoreError(err, 'fetchDiscoveryScenes');
    } finally {
      setScenesLoading(false);
    }
  }, []);

  const fetchMyHostedScenes = useCallback(async () => {
    const user = currentUserRef.current;
    if (!db || !user) {
      setMyHostedScenes([]);
      return;
    }
    setMyHostedLoading(true);
    try {
      const q = query(
        collection(db, 'scenes'),
        where('hostId', '==', user.uid),
        limit(50)
      );
      const snap = await getDocs(q);
      const list: Scene[] = [];
      snap.forEach(docSnap => {
        list.push(formatFirestoreScene(docSnap.id, docSnap.data(), user.uid));
      });
      list.sort((a, b) => dateFor(a).getTime() - dateFor(b).getTime());
      setMyHostedScenes(list);
    } catch (err) {
      handleFirestoreError(err, 'fetchMyHostedScenes');
    } finally {
      setMyHostedLoading(false);
    }
  }, []);

  // User's own join requests across all scenes
  const fetchMyUserRequests = useCallback(async () => {
    const user = currentUserRef.current;
    if (!db || !user) return;
    try {
      const q = query(
        collectionGroup(db, 'joinRequests'),
        where('requesterId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const requestMap: Record<string, string | null> = {};
      const approvedSceneIds: string[] = [];
      snap.forEach(d => {
        const data = d.data();
        const sceneId = d.ref.parent.parent?.id;
        if (sceneId) {
          requestMap[sceneId] = data.status || null;
          if (data.status === 'approved') {
            approvedSceneIds.push(sceneId);
          }
        }
      });
      setMyJoinRequests(prev => ({ ...prev, ...requestMap }));

      // Ensure all approved scenes are fetched so "Going" tab works even for scenes outside Discover feed
      for (const sId of approvedSceneIds) {
        try {
          const scDoc = await getDoc(doc(db, 'scenes', sId));
          if (scDoc.exists()) {
            const formatted = formatFirestoreScene(scDoc.id, scDoc.data(), user.uid);
            setFirestoreScenes(prev => {
              if (prev.some(s => s.id === sId)) {
                return prev.map(s => (s.id === sId ? formatted : s));
              }
              return [...prev, formatted];
            });
          }
        } catch (scErr) {
          console.warn('[Firestore] Error fetching approved scene:', sId, scErr);
        }
      }
    } catch (err) {
      console.warn('[Firestore] Error querying user join requests:', err);
    }
  }, []);

  // Host Join Requests: real-time listeners for all hosted scenes and their joinRequests
  const fetchHostJoinRequests = useCallback(async () => {
    const user = currentUserRef.current;
    const firestore = db;
    if (!firestore || !user) {
      setHostJoinRequests([]);
      setApprovedParticipants([]);
      setHostJoinRequestsLoading(false);
      setHostJoinRequestsError('');
      return;
    }

    setHostJoinRequestsLoading(true);
    setHostJoinRequestsError('');

    // Recompute requests helper
    const recomputeRequests = () => {
      const allPending: JoinRequest[] = [];
      const allApproved: JoinRequest[] = [];

      sceneRequestsCacheRef.current.forEach(requests => {
        requests.forEach(r => {
          if (r.status === 'pending') {
            allPending.push(r);
          } else if (r.status === 'approved') {
            allApproved.push(r);
          }
        });
      });

      allPending.sort((a, b) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return tb - ta;
      });

      allApproved.sort((a, b) => {
        const ta = a.decidedAt?.toDate ? a.decidedAt.toDate().getTime() : 0;
        const tb = b.decidedAt?.toDate ? b.decidedAt.toDate().getTime() : 0;
        return tb - ta;
      });

      setHostJoinRequests(allPending);
      setApprovedParticipants(allApproved);
      setHostJoinRequestsLoading(false);
      setHostJoinRequestsError('');
    };

    try {
      // Clean up previous scenes listener if any
      if (hostSubscriptionsRef.current.unsubScenes) {
        hostSubscriptionsRef.current.unsubScenes();
        hostSubscriptionsRef.current.unsubScenes = undefined;
      }

      // Scoped query: listen to all scenes owned by current host
      const hostScenesQuery = query(
        collection(firestore, 'scenes'),
        where('hostId', '==', user.uid)
      );

      const unsubScenes = onSnapshot(
        hostScenesQuery,
        scenesSnap => {
          const currentHostedScenes: Scene[] = [];
          const currentSceneMap = new Map<string, string>(); // sceneId -> sceneTitle

          scenesSnap.forEach(docSnap => {
            const sc = formatFirestoreScene(docSnap.id, docSnap.data(), user.uid);
            currentHostedScenes.push(sc);
            currentSceneMap.set(docSnap.id, sc.title);
          });

          currentHostedScenes.sort((a, b) => dateFor(a).getTime() - dateFor(b).getTime());
          setMyHostedScenes(currentHostedScenes);

          // Clean up subscriptions for scenes that were deleted or no longer hosted
          hostSubscriptionsRef.current.requestUnsubs.forEach((unsub, scId) => {
            if (!currentSceneMap.has(scId)) {
              unsub();
              hostSubscriptionsRef.current.requestUnsubs.delete(scId);
              sceneRequestsCacheRef.current.delete(scId);
            }
          });

          if (currentSceneMap.size === 0) {
            setHostJoinRequests([]);
            setApprovedParticipants([]);
            setHostJoinRequestsLoading(false);
            setHostJoinRequestsError('');
            return;
          }

          // For each hosted scene, attach real-time onSnapshot to its joinRequests subcollection
          currentSceneMap.forEach((sceneTitle, sceneId) => {
            // If already subscribed, update title in cache and recompute
            if (hostSubscriptionsRef.current.requestUnsubs.has(sceneId)) {
              const cached = sceneRequestsCacheRef.current.get(sceneId);
              if (cached) {
                cached.forEach(r => {
                  r.sceneTitle = sceneTitle;
                });
                recomputeRequests();
              }
              return;
            }

            const reqColl = collection(firestore, 'scenes', sceneId, 'joinRequests');
            const unsubReqs = onSnapshot(
              reqColl,
              reqSnap => {
                const list: JoinRequest[] = [];
                reqSnap.forEach(d => {
                  const data = d.data();
                  let ago = 'Recently';
                  if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                    const diffMs = Date.now() - data.createdAt.toDate().getTime();
                    const mins = Math.max(1, Math.floor(diffMs / 60000));
                    if (mins < 60) ago = `${mins}m ago`;
                    else {
                      const hrs = Math.floor(mins / 60);
                      ago = hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
                    }
                  }
                  const item: JoinRequest = {
                    id: d.id,
                    sceneId: sceneId,
                    sceneTitle: sceneTitle,
                    requesterId: data.requesterId || d.id,
                    name: data.requesterDisplayName || 'Scene Explorer',
                    initials: (data.requesterDisplayName || 'SE')
                      .split(' ')
                      .map((x: string) => x[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase(),
                    status: data.status,
                    decidedAt: data.decidedAt,
                    decidedBy: data.decidedBy,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    ago,
                    isFirestore: true
                  };
                  list.push(item);
                });

                sceneRequestsCacheRef.current.set(sceneId, list);
                recomputeRequests();
              },
              err => {
                console.warn('[Firestore] Error in joinRequests listener for scene ' + sceneId, err);
                handleFirestoreError(err, 'joinRequestsSnapshot:' + sceneId);
                setHostJoinRequestsError(err.message || 'Error syncing join requests for your scenes.');
                setHostJoinRequestsLoading(false);
              }
            );

            hostSubscriptionsRef.current.requestUnsubs.set(sceneId, unsubReqs);
          });
        },
        err => {
          console.warn('[Firestore] Error in host scenes listener:', err);
          handleFirestoreError(err, 'hostScenesSnapshot');
          setHostJoinRequestsError(err.message || 'Failed to sync your hosted scenes.');
          setHostJoinRequestsLoading(false);
        }
      );

      hostSubscriptionsRef.current.unsubScenes = unsubScenes;
    } catch (err: any) {
      console.warn('[Firestore] Setup host listeners failed:', err);
      handleFirestoreError(err, 'fetchHostJoinRequests');
      setHostJoinRequestsError(err.message || 'Failed to establish request listeners.');
      setHostJoinRequestsLoading(false);
    }
  }, []);

  // Check single scene join request
  const checkMyJoinRequest = useCallback(async (sceneId: string) => {
    const user = currentUserRef.current;
    if (!db || !user || !sceneId || checkedRequestsSet.has(sceneId)) return;
    checkedRequestsSet.add(sceneId);
    try {
      const reqRef = doc(db, 'scenes', sceneId, 'joinRequests', user.uid);
      const snap = await getDoc(reqRef);
      if (snap.exists()) {
        setMyJoinRequests(prev => ({ ...prev, [sceneId]: snap.data().status }));
      } else {
        setMyJoinRequests(prev => ({ ...prev, [sceneId]: null }));
      }
    } catch (err) {
      console.warn('[Firestore] Error checking join request:', err);
    }
  }, [checkedRequestsSet]);

  // Real-time synchronization for Scene Detail view
  const currentUid = currentUser?.uid;
  useEffect(() => {
    if (!db || !currentRoute.startsWith('scene/')) {
      activeListenersRef.current.forEach(unsub => unsub());
      activeListenersRef.current = [];
      return;
    }

    const sceneId = currentRoute.replace('scene/', '');
    if (!sceneId) return;

    activeListenersRef.current.forEach(unsub => unsub());
    activeListenersRef.current = [];

    // 1. Listen to scene doc for real-time capacity and status updates
    const sceneDocRef = doc(db, 'scenes', sceneId);
    const unsubScene = onSnapshot(
      sceneDocRef,
      snap => {
        if (snap.exists()) {
          const formatted = formatFirestoreScene(snap.id, snap.data(), currentUid);
          setFirestoreScenes(prev => {
            const idx = prev.findIndex(s => s.id === snap.id);
            if (idx !== -1) {
              const next = [...prev];
              next[idx] = formatted;
              return next;
            }
            return [formatted, ...prev];
          });
          setMyHostedScenes(prev => {
            const idx = prev.findIndex(s => s.id === snap.id);
            if (idx !== -1) {
              const next = [...prev];
              next[idx] = formatted;
              return next;
            }
            return prev;
          });
        }
      },
      err => {
        console.warn('[Snapshot Listener] scene error:', err);
      }
    );
    activeListenersRef.current.push(unsubScene);

    // 2. Listen to user's request status if authenticated
    if (currentUid) {
      const reqDocRef = doc(db, 'scenes', sceneId, 'joinRequests', currentUid);
      const unsubReq = onSnapshot(
        reqDocRef,
        snap => {
          if (snap.exists()) {
            setMyJoinRequests(prev => ({ ...prev, [sceneId]: snap.data().status }));
          } else {
            setMyJoinRequests(prev => ({ ...prev, [sceneId]: null }));
          }
        },
        err => {
          console.warn('[Snapshot Listener] request error:', err);
        }
      );
      activeListenersRef.current.push(unsubReq);
    }

    return () => {
      activeListenersRef.current.forEach(unsub => unsub());
      activeListenersRef.current = [];
    };
  }, [currentRoute, currentUid]);

  // 1. Initial discovery fetch on mount
  useEffect(() => {
    fetchDiscoveryScenes();
  }, [fetchDiscoveryScenes]);

  // 2. Auth observer: registered ONCE on mount
  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, user => {
      setAuthReady(true);
      if (user) {
        setCurrentUser({
          uid: user.uid,
          displayName: user.displayName || 'Scene Explorer',
          email: user.email || '',
          photoURL: user.photoURL || null
        });
      } else {
        setCurrentUser(null);
        setActiveProfile(null);
        setMyHostedScenes([]);
        setMyJoinRequests({});
        setHostJoinRequests([]);
        setApprovedParticipants([]);
        setHostJoinRequestsError('');
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. User data sync & real-time host subscriptions: runs when currentUser?.uid changes
  useEffect(() => {
    if (currentUid && auth?.currentUser) {
      loadOrInitFirestoreProfile(auth.currentUser);
      fetchMyUserRequests();
      fetchHostJoinRequests();
    } else {
      if (hostSubscriptionsRef.current.unsubScenes) {
        hostSubscriptionsRef.current.unsubScenes();
        hostSubscriptionsRef.current.unsubScenes = undefined;
      }
      hostSubscriptionsRef.current.requestUnsubs.forEach(unsub => unsub());
      hostSubscriptionsRef.current.requestUnsubs.clear();
      sceneRequestsCacheRef.current.clear();
      setHostJoinRequests([]);
      setApprovedParticipants([]);
      setHostJoinRequestsLoading(false);
      setHostJoinRequestsError('');
    }

    return () => {
      if (hostSubscriptionsRef.current.unsubScenes) {
        hostSubscriptionsRef.current.unsubScenes();
        hostSubscriptionsRef.current.unsubScenes = undefined;
      }
      hostSubscriptionsRef.current.requestUnsubs.forEach(unsub => unsub());
      hostSubscriptionsRef.current.requestUnsubs.clear();
      sceneRequestsCacheRef.current.clear();
    };
  }, [currentUid, loadOrInitFirestoreProfile, fetchMyUserRequests, fetchHostJoinRequests]);

  // 4. Refresh data when navigating to my-scenes
  useEffect(() => {
    if (currentRoute === 'my-scenes' && currentUid) {
      fetchMyUserRequests();
      fetchHostJoinRequests();
    }
  }, [currentRoute, currentUid, fetchMyUserRequests, fetchHostJoinRequests]);

  // Open & Close Auth Modal
  const openAuthPrompt = useCallback(
    (reason = 'Sign in with Google to continue', pendingAction: any = null) => {
      setAuthModal({
        open: true,
        reason,
        error: '',
        loading: false,
        unauthorizedDomain: null
      });
      if (pendingAction) {
        setAuthPendingAction(pendingAction);
      }
    },
    []
  );

  const closeAuthPrompt = useCallback(() => {
    setAuthModal(prev => ({ ...prev, open: false, error: '', loading: false, unauthorizedDomain: null }));
  }, []);

  const executePendingAction = useCallback(
    (action: any) => {
      if (!action) return;
      if (action.type === 'navigate') {
        navigate(action.route);
      } else if (action.type === 'join') {
        submitJoinRequest(action.id);
      } else if (action.type === 'save') {
        updateStore(s => {
          const on = s.saved.includes(action.id);
          const saved = on ? s.saved.filter(x => x !== action.id) : [...s.saved, action.id];
          showToast(on ? 'Removed from saved' : 'Saved for later ♡');
          return { ...s, saved };
        });
      } else if (action.type === 'create') {
        navigate('create');
      }
    },
    [navigate, updateStore, showToast]
  );

  const loginWithGoogle = useCallback(
    async (intendedAction: any = null) => {
      if (!auth || !googleProvider) {
        setAuthModal(prev => ({
          ...prev,
          error: 'Firebase Auth is still initializing. Please try again.'
        }));
        return;
      }
      const actionToExec = intendedAction || authPendingAction;
      setAuthModal(prev => ({ ...prev, loading: true, error: '', unauthorizedDomain: null }));

      try {
        const cred = await signInWithPopup(auth, googleProvider);
        const user = cred.user;
        const u = {
          uid: user.uid,
          displayName: user.displayName || 'Scene Explorer',
          email: user.email || '',
          photoURL: user.photoURL || null
        };
        setCurrentUser(u);
        setAuthModal({ open: false, loading: false, error: '', reason: '', unauthorizedDomain: null });
        showToast(`Welcome, ${u.displayName}! ✨`);
        await loadOrInitFirestoreProfile(user);

        if (actionToExec) {
          setAuthPendingAction(null);
          executePendingAction(actionToExec);
        }
      } catch (err: any) {
        console.warn('[Firebase Auth] Sign in error:', err);
        let errMsg = err.message || 'Unable to sign in with Google. Please try again.';
        let unauthorizedDomain: string | null = null;
        if (
          err.code === 'auth/popup-closed-by-user' ||
          err.code === 'auth/cancelled-popup-request'
        ) {
          errMsg = "Sign-in cancelled. You can sign in whenever you're ready.";
        } else if (err.code === 'auth/popup-blocked') {
          errMsg = 'Pop-up blocked by your browser. Please allow pop-ups for this site and try again.';
        } else if (
          err.code === 'auth/unauthorized-domain' ||
          (typeof err.message === 'string' && err.message.includes('auth/unauthorized-domain'))
        ) {
          unauthorizedDomain = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
          errMsg = `Domain "${unauthorizedDomain}" is not authorized for Google Sign-in in Firebase.`;
        }
        setAuthModal(prev => ({ ...prev, loading: false, error: errMsg, unauthorizedDomain }));
      }
    },
    [authPendingAction, executePendingAction, loadOrInitFirestoreProfile, showToast]
  );

  const logout = useCallback(async () => {
    if (!auth) return;
    try {
      activeListenersRef.current.forEach(unsub => unsub());
      activeListenersRef.current = [];
      if (hostSubscriptionsRef.current.unsubScenes) {
        hostSubscriptionsRef.current.unsubScenes();
        hostSubscriptionsRef.current.unsubScenes = undefined;
      }
      hostSubscriptionsRef.current.requestUnsubs.forEach(unsub => unsub());
      hostSubscriptionsRef.current.requestUnsubs.clear();
      sceneRequestsCacheRef.current.clear();
      await signOut(auth);
      setCurrentUser(null);
      setActiveProfile(null);
      setMigrationModal({ open: false, localData: null, loading: false });
      setEditProfileModal(prev => ({ ...prev, open: false }));
      setAuthModal({ open: false, reason: '', error: '', loading: false, unauthorizedDomain: null });
      setMyHostedScenes([]);
      setMyJoinRequests({});
      setHostJoinRequests([]);
      setApprovedParticipants([]);
      setHostJoinRequestsLoading(false);
      setHostJoinRequestsError('');
      updateStore(s => ({ ...s, name: 'Areeb Khan' }));
      showToast('Signed out. You are now browsing as a guest.');
    } catch (err) {
      showToast('Error signing out. Please try again.');
    }
  }, [showToast, updateStore]);

  // All Scenes Combination: strictly real Cloud Firestore scenes only
  const allScenes = useMemo(() => {
    const map = new Map<string, Scene>();
    firestoreScenes.forEach(s => {
      const isMine = Boolean(currentUser && s.hostId === currentUser.uid);
      map.set(s.id, { ...s, isMine });
    });
    myHostedScenes.forEach(s => {
      map.set(s.id, { ...s, isMine: true });
    });
    return Array.from(map.values()).sort(
      (a, b) => dateFor(a).getTime() - dateFor(b).getTime()
    );
  }, [myHostedScenes, firestoreScenes, currentUser]);

  // Matching scenes filter
  const matchingScenes = useMemo(() => {
    return allScenes
      .filter(s => {
        if (s.status === 'cancelled' && !s.isMine) return false;
        if ((store.blockedHosts || []).includes(s.host)) return false;
        if ((s.privacy || 'Public').toLowerCase() === 'private' && !s.isMine) return false;
        if (filters.city !== 'All Pakistan' && s.city !== filters.city) return false;
        if (filters.category !== 'all' && s.category !== filters.category) return false;
        if (filters.search) {
          const hay = [s.title, s.area, s.category, s.description, s.city, s.host]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(filters.search.toLowerCase())) return false;
        }
        if (filters.when === 'today') {
          if (dateShort(s) !== 'TODAY') return false;
        } else if (filters.when === 'weekend') {
          const day = dateFor(s).getDay();
          if (![0, 6].includes(day)) return false;
        } else if (filters.when === 'free') {
          if (Number(s.budget) !== 0) return false;
        }
        return true;
      })
      .sort((a, b) => dateFor(a).getTime() - dateFor(b).getTime());
  }, [allScenes, store.blockedHosts, filters]);

  // Cancel Host Scene
  const cancelHostScene = useCallback(
    async (sceneId: string) => {
      const scene = allScenes.find(s => s.id === sceneId);
      if (!scene || !scene.isMine) {
        showToast('Only the host can cancel this scene.');
        return;
      }
      if (
        !window.confirm(
          `Are you sure you want to cancel "${scene.title}"? This will mark it cancelled and hide it from public discovery.`
        )
      ) {
        return;
      }
      try {
        if (db && scene.isFirestore) {
          await updateDoc(doc(db, 'scenes', sceneId), {
            status: 'cancelled',
            updatedAt: serverTimestamp()
          });
          setMyHostedScenes(prev =>
            prev.map(s => (s.id === sceneId ? { ...s, status: 'cancelled' } : s))
          );
          setFirestoreScenes(prev => prev.filter(s => s.id !== sceneId));
          showToast('Scene cancelled. It is now hidden from public discovery.');
        } else {
          updateStore(s => ({
            ...s,
            created: s.created.map(x => (x.id === sceneId ? { ...x, status: 'cancelled' } : x))
          }));
          showToast('Scene cancelled.');
        }
      } catch (err: any) {
        handleFirestoreError(err, 'cancelHostScene');
        showToast('Failed to cancel scene: ' + (err.message || 'Unknown error'));
      }
    },
    [allScenes, showToast, updateStore]
  );

  // Submit Join Request
  const submitJoinRequest = useCallback(
    async (sceneId: string) => {
      if (!currentUser) {
        openAuthPrompt('Sign in with Google to request to join this meetup', {
          type: 'join',
          id: sceneId
        });
        return;
      }
      const sc = allScenes.find(s => s.id === sceneId);
      if (!sc) {
        showToast('Scene not found.');
        return;
      }
      if (sc.hostId === currentUser.uid || sc.isMine) {
        showToast('You cannot request to join your own scene.');
        return;
      }
      if (sc.status === 'cancelled') {
        showToast('This scene is cancelled.');
        return;
      }
      if (dateFor(sc).getTime() <= Date.now()) {
        showToast('This scene has already taken place.');
        return;
      }

      if (!sc.isFirestore) {
        // Demo scene local handling
        updateStore(s => {
          if (!s.requested.includes(sceneId)) {
            showToast('Join request sent! ✨');
            return { ...s, requested: [...s.requested, sceneId] };
          }
          return s;
        });
        return;
      }

      if (!db) {
        showToast('Cloud database is not ready.');
        return;
      }

      setJoinRequestLoading(true);
      try {
        const reqRef = doc(db, 'scenes', sceneId, 'joinRequests', currentUser.uid);
        const snap = await getDoc(reqRef);
        if (snap.exists()) {
          const currentStatus = snap.data().status;
          if (currentStatus === 'pending') {
            setMyJoinRequests(prev => ({ ...prev, [sceneId]: 'pending' }));
            showToast('Your join request is already pending host approval.');
            return;
          }
          if (currentStatus === 'approved') {
            setMyJoinRequests(prev => ({ ...prev, [sceneId]: 'approved' }));
            showToast("You're already an approved participant in this scene! ✨");
            return;
          }
          if (currentStatus === 'declined' || currentStatus === 'removed' || currentStatus === 'left') {
            showToast('This request is in a terminal state for this phase.');
            return;
          }
          // Re-submitting from 'withdrawn'
          await updateDoc(reqRef, {
            status: 'pending',
            updatedAt: serverTimestamp()
          });
        } else {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          let displayName = getActiveDisplayName() || currentUser.displayName || 'Scene Explorer';
          let finalDisplayName = displayName;

          if (userSnap.exists() && userSnap.data().displayName) {
            finalDisplayName = userSnap.data().displayName;
          } else if (!userSnap.exists()) {
            const initialProf: any = {
              displayName: String(displayName).slice(0, 50).trim(),
              bio: '',
              city: String(store.city || 'Lahore').slice(0, 50).trim(),
              area: '',
              interests:
                Array.isArray(store.interests) && store.interests.length
                  ? store.interests.slice(0, 15)
                  : ['sports', 'food', 'gaming'],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            await setDoc(userDocRef, initialProf);
            finalDisplayName = initialProf.displayName;
            const prof: UserProfile = { ...initialProf, uid: currentUser.uid };
            saveUserProfile(currentUser.uid, prof);
            setActiveProfile(prof);
          }

          await setDoc(reqRef, {
            requesterId: currentUser.uid,
            requesterDisplayName: finalDisplayName,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        setMyJoinRequests(prev => ({ ...prev, [sceneId]: 'pending' }));
        showToast('Join request sent! The host will review your request. ✨');
      } catch (err: any) {
        handleFirestoreError(err, 'submitJoinRequest');
        showToast('Unable to submit join request: ' + (err.message || 'Please try again.'));
      } finally {
        setJoinRequestLoading(false);
      }
    },
    [currentUser, allScenes, openAuthPrompt, showToast, updateStore, getActiveDisplayName]
  );

  // Withdraw Join Request (pending -> withdrawn)
  const withdrawJoinRequest = useCallback(
    async (sceneId: string) => {
      if (!currentUser || !db) return;
      setJoinRequestLoading(true);
      try {
        const reqRef = doc(db, 'scenes', sceneId, 'joinRequests', currentUser.uid);
        await updateDoc(reqRef, {
          status: 'withdrawn',
          updatedAt: serverTimestamp()
        });
        setMyJoinRequests(prev => ({ ...prev, [sceneId]: 'withdrawn' }));
        showToast('Join request withdrawn.');
      } catch (err: any) {
        handleFirestoreError(err, 'withdrawJoinRequest');
        showToast('Unable to withdraw request: ' + (err.message || 'Please try again.'));
      } finally {
        setJoinRequestLoading(false);
      }
    },
    [currentUser, showToast]
  );

  // Phase 3.3B: Secure Host Approval (atomic increment)
  const approveJoinRequest = useCallback(
    async (sceneId: string, requesterId: string): Promise<boolean> => {
      if (!currentUser || !db) {
        showToast('Authentication required.');
        return false;
      }
      setJoinRequestLoading(true);
      try {
        const sceneRef = doc(db, 'scenes', sceneId);
        const reqRef = doc(db, 'scenes', sceneId, 'joinRequests', requesterId);

        await runTransaction(db, async transaction => {
          const sceneSnap = await transaction.get(sceneRef);
          if (!sceneSnap.exists()) {
            throw new Error('Scene does not exist.');
          }
          const sceneData = sceneSnap.data();
          if (sceneData.hostId !== currentUser.uid) {
            throw new Error('Only the scene host can approve join requests.');
          }
          if (sceneData.status !== 'active') {
            throw new Error('Cannot approve requests for a cancelled scene.');
          }
          const startsAtDate = sceneData.startsAt?.toDate ? sceneData.startsAt.toDate() : new Date(sceneData.startsAt);
          if (startsAtDate.getTime() <= Date.now()) {
            throw new Error('Cannot approve requests for a past scene.');
          }

          const reqSnap = await transaction.get(reqRef);
          if (!reqSnap.exists()) {
            throw new Error('Join request not found.');
          }
          const reqData = reqSnap.data();
          if (reqData.status !== 'pending') {
            throw new Error(`Request cannot be approved because current status is "${reqData.status}".`);
          }

          const currentApproved = Number(sceneData.approvedCount || 0);
          const maxParticipants = Number(sceneData.maxParticipants || 8);
          // Host occupies 1 seat, so approved participants cannot exceed maxParticipants - 1
          if (currentApproved >= maxParticipants - 1) {
            throw new Error(`Scene is full (${maxParticipants} capacity reached, including host).`);
          }

          // 1. Atomically update request to approved
          transaction.update(reqRef, {
            status: 'approved',
            decidedAt: serverTimestamp(),
            decidedBy: currentUser.uid,
            updatedAt: serverTimestamp()
          });

          // 2. Atomically increment scene approvedCount by exactly 1 and record lastApprovedRequesterId
          transaction.update(sceneRef, {
            approvedCount: currentApproved + 1,
            lastApprovedRequesterId: requesterId,
            updatedAt: serverTimestamp()
          });
        });

        // Update local state
        setHostJoinRequests(prev => prev.filter(r => !(r.sceneId === sceneId && r.requesterId === requesterId)));
        await fetchHostJoinRequests();
        await fetchMyHostedScenes();
        await fetchDiscoveryScenes();
        showToast('Participant approved! Spot confirmed. ✨');
        return true;
      } catch (err: any) {
        handleFirestoreError(err, 'approveJoinRequest');
        showToast(err.message || 'Failed to approve participant.');
        return false;
      } finally {
        setJoinRequestLoading(false);
      }
    },
    [currentUser, showToast, fetchHostJoinRequests, fetchMyHostedScenes, fetchDiscoveryScenes]
  );

  // Phase 3.3B: Secure Host Decline (no capacity change)
  const declineJoinRequest = useCallback(
    async (sceneId: string, requesterId: string): Promise<boolean> => {
      if (!currentUser || !db) return false;
      setJoinRequestLoading(true);
      try {
        const reqRef = doc(db, 'scenes', sceneId, 'joinRequests', requesterId);
        await updateDoc(reqRef, {
          status: 'declined',
          decidedAt: serverTimestamp(),
          decidedBy: currentUser.uid,
          updatedAt: serverTimestamp()
        });

        setHostJoinRequests(prev => prev.filter(r => !(r.sceneId === sceneId && r.requesterId === requesterId)));
        showToast('Request declined.');
        return true;
      } catch (err: any) {
        handleFirestoreError(err, 'declineJoinRequest');
        showToast('Unable to decline request: ' + (err.message || 'Please try again.'));
        return false;
      } finally {
        setJoinRequestLoading(false);
      }
    },
    [currentUser, showToast]
  );

  // Phase 3.3B: Approved Participant Leaves (atomic decrement)
  const leaveScene = useCallback(
    async (sceneId: string): Promise<boolean> => {
      if (!currentUser || !db) return false;
      if (!window.confirm('Are you sure you want to leave this scene? Your spot will be released.')) {
        return false;
      }
      setJoinRequestLoading(true);
      try {
        const sceneRef = doc(db, 'scenes', sceneId);
        const reqRef = doc(db, 'scenes', sceneId, 'joinRequests', currentUser.uid);

        await runTransaction(db, async transaction => {
          const reqSnap = await transaction.get(reqRef);
          if (!reqSnap.exists()) {
            throw new Error('Your join request was not found.');
          }
          if (reqSnap.data().status !== 'approved') {
            throw new Error('Only approved participants can leave an event.');
          }

          const sceneSnap = await transaction.get(sceneRef);
          if (!sceneSnap.exists()) {
            throw new Error('Scene not found.');
          }
          const sceneData = sceneSnap.data();
          const currentApproved = Number(sceneData.approvedCount || 0);

          transaction.update(reqRef, {
            status: 'left',
            updatedAt: serverTimestamp()
          });

          transaction.update(sceneRef, {
            approvedCount: Math.max(0, currentApproved - 1),
            updatedAt: serverTimestamp()
          });
        });

        setMyJoinRequests(prev => ({ ...prev, [sceneId]: 'left' }));
        await fetchDiscoveryScenes();
        showToast('You have left the scene. Your spot has been released.');
        return true;
      } catch (err: any) {
        handleFirestoreError(err, 'leaveScene');
        showToast(err.message || 'Unable to leave scene.');
        return false;
      } finally {
        setJoinRequestLoading(false);
      }
    },
    [currentUser, showToast, fetchDiscoveryScenes]
  );

  // Phase 3.3B: Host Removes Approved Participant (atomic decrement)
  const removeParticipant = useCallback(
    async (sceneId: string, requesterId: string): Promise<boolean> => {
      if (!currentUser || !db) return false;
      if (!window.confirm('Are you sure you want to remove this participant from the scene? Their spot will be freed.')) {
        return false;
      }
      setJoinRequestLoading(true);
      try {
        const sceneRef = doc(db, 'scenes', sceneId);
        const reqRef = doc(db, 'scenes', sceneId, 'joinRequests', requesterId);

        await runTransaction(db, async transaction => {
          const sceneSnap = await transaction.get(sceneRef);
          if (!sceneSnap.exists()) throw new Error('Scene not found.');
          const sceneData = sceneSnap.data();
          if (sceneData.hostId !== currentUser.uid) {
            throw new Error('Only the scene host can remove participants.');
          }

          const reqSnap = await transaction.get(reqRef);
          if (!reqSnap.exists()) throw new Error('Participant request not found.');
          if (reqSnap.data().status !== 'approved') {
            throw new Error('Participant is not currently approved.');
          }

          const currentApproved = Number(sceneData.approvedCount || 0);

          transaction.update(reqRef, {
            status: 'removed',
            decidedAt: serverTimestamp(),
            decidedBy: currentUser.uid,
            updatedAt: serverTimestamp()
          });

          transaction.update(sceneRef, {
            approvedCount: Math.max(0, currentApproved - 1),
            lastRemovedRequesterId: requesterId,
            updatedAt: serverTimestamp()
          });
        });

        setApprovedParticipants(prev => prev.filter(r => !(r.sceneId === sceneId && r.requesterId === requesterId)));
        await fetchHostJoinRequests();
        await fetchMyHostedScenes();
        await fetchDiscoveryScenes();
        showToast('Participant removed. Spot released.');
        return true;
      } catch (err: any) {
        handleFirestoreError(err, 'removeParticipant');
        showToast(err.message || 'Unable to remove participant.');
        return false;
      } finally {
        setJoinRequestLoading(false);
      }
    },
    [currentUser, showToast, fetchHostJoinRequests, fetchMyHostedScenes, fetchDiscoveryScenes]
  );

  // Create Scene (with approvedCount initialized to 0)
  const createScene = useCallback(
    async (payload: any): Promise<string | null> => {
      if (!currentUser) {
        openAuthPrompt('Sign in with Google to publish your scene', { type: 'create' });
        return null;
      }
      const { title, desc, cat, city, area, venue, date, time, spots, budget, privacy } = payload;
      if (title.length < 5 || title.length > 70) {
        showToast('Title must be between 5 and 70 characters.');
        return null;
      }
      if (desc.length < 15 || desc.length > 500) {
        showToast('Tell people what to expect (15 to 500 characters).');
        return null;
      }
      if (!area || area.length > 60) {
        showToast('Please enter an area or neighborhood.');
        return null;
      }

      const pktDateString = `${date}T${time}:00+05:00`;
      const startsAtDate = new Date(pktDateString);
      if (isNaN(startsAtDate.getTime())) {
        showToast('Invalid date or time selected.');
        return null;
      }
      if (startsAtDate.getTime() <= Date.now()) {
        showToast('Please select a date and time in the future (Asia/Karachi).');
        return null;
      }

      setCreateSceneLoading(true);
      try {
        if (!db) throw new Error('Firestore is not initialized.');

        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        let hostDisplayName = getActiveDisplayName();

        if (!userSnap.exists()) {
          const initialProf: any = {
            displayName: String(hostDisplayName).slice(0, 50).trim(),
            bio: '',
            city: String(city || store.city || 'Lahore').slice(0, 50).trim(),
            area: String(area || '').slice(0, 60).trim(),
            interests:
              Array.isArray(store.interests) && store.interests.length
                ? store.interests.slice(0, 15)
                : ['sports', 'food', 'gaming'],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await setDoc(userDocRef, initialProf);
          const prof: UserProfile = { ...initialProf, uid: currentUser.uid };
          saveUserProfile(currentUser.uid, prof);
          setActiveProfile(prof);
        } else {
          hostDisplayName = userSnap.data().displayName || hostDisplayName;
        }

        const rawVenue = String(venue || '').trim();
        const scenePayload: any = {
          hostId: currentUser.uid,
          hostDisplayName: String(hostDisplayName).slice(0, 50).trim(),
          title: title,
          description: desc,
          category: cat,
          city: String(city).slice(0, 50).trim(),
          area: String(area).slice(0, 60).trim(),
          venue: 'Meetup spot shared after approval',
          startsAt: Timestamp.fromDate(startsAtDate),
          timezone: 'Asia/Karachi',
          budgetPerPerson: Number(budget),
          maxParticipants: Number(spots),
          approvedCount: 0,
          privacy: privacy,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'scenes'), scenePayload);

        // Store private exact venue in privateDetails subcollection accessible only by host & approved participants
        if (rawVenue) {
          try {
            await setDoc(doc(db, 'scenes', docRef.id, 'privateDetails', 'location'), {
              venue: rawVenue.slice(0, 200),
              updatedAt: serverTimestamp()
            });
          } catch (privErr) {
            console.warn('[Firestore] Error saving private venue details:', privErr);
          }
        }

        const newScene = formatFirestoreScene(
          docRef.id,
          {
            ...scenePayload,
            venue: rawVenue || 'Meetup spot shared after approval',
            startsAt: startsAtDate,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          currentUser.uid
        );

        setMyHostedScenes(prev => [newScene, ...prev]);
        if (privacy === 'public') {
          setFirestoreScenes(prev => [newScene, ...prev]);
        }

        updateStore(s => ({ ...s, city }));
        setFilters(prev => ({ ...prev, city }));

        showToast('Scene published live to Cloud Firestore! ✳');
        return docRef.id;
      } catch (err: any) {
        handleFirestoreError(err, 'createScene');
        showToast('Failed to publish scene: ' + (err.message || 'Please try again.'));
        return null;
      } finally {
        setCreateSceneLoading(false);
      }
    },
    [currentUser, openAuthPrompt, showToast, getActiveDisplayName, store.city, store.interests, updateStore]
  );

  // Edit Profile modal actions
  const openEditProfile = useCallback(() => {
    if (!currentUser) {
      openAuthPrompt('Sign in with Google to edit your profile');
      return;
    }
    const prof = activeProfile || getUserProfile(currentUser.uid);
    setEditProfileModal({
      open: true,
      loading: false,
      saveError: '',
      errors: {},
      formData: {
        displayName: prof?.displayName || currentUser.displayName || '',
        bio: prof?.bio || '',
        city: prof?.city || store.city || 'Lahore',
        area: prof?.area || ''
      }
    });
  }, [currentUser, activeProfile, store.city, openAuthPrompt]);

  const closeEditProfile = useCallback(() => {
    setEditProfileModal(prev => ({ ...prev, open: false, loading: false, saveError: '', errors: {} }));
  }, []);

  const saveProfile = useCallback(
    async (formData: { displayName: string; bio: string; city: string; area: string }): Promise<boolean> => {
      if (!currentUser) return false;
      const { displayName, bio, city, area } = formData;
      const errors: Record<string, string> = {};

      if (!displayName || displayName.trim().length < 2) {
        errors.displayName = 'Please enter a display name (at least 2 characters).';
      } else if (displayName.length > 50) {
        errors.displayName = 'Display name cannot exceed 50 characters.';
      }
      if (bio.length > 160) {
        errors.bio = 'Bio cannot exceed 160 characters.';
      }
      if (!city) {
        errors.city = 'Please select a city.';
      }

      if (Object.keys(errors).length > 0) {
        setEditProfileModal(prev => ({ ...prev, errors }));
        return false;
      }

      setEditProfileModal(prev => ({ ...prev, loading: true, saveError: '', errors: {} }));
      try {
        const currentInterests =
          activeProfile?.interests ||
          (Array.isArray(store.interests) ? store.interests : ['sports', 'food', 'gaming']);

        const profilePayload = {
          displayName: displayName.trim(),
          bio: bio.trim(),
          city: city.trim(),
          area: area.trim(),
          interests: [...currentInterests]
        };

        if (db) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            await updateDoc(userDocRef, {
              ...profilePayload,
              updatedAt: serverTimestamp()
            });
          } else {
            await setDoc(userDocRef, {
              ...profilePayload,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        }

        const updated: UserProfile = {
          uid: currentUser.uid,
          ...profilePayload,
          updatedAt: new Date().toISOString()
        };

        saveUserProfile(currentUser.uid, updated);
        setActiveProfile(updated);
        updateStore(s => ({
          ...s,
          name: updated.displayName,
          city: updated.city,
          interests: [...updated.interests]
        }));
        setFilters(f => ({ ...f, city: updated.city }));

        setEditProfileModal(prev => ({ ...prev, open: false, loading: false }));
        showToast('Profile saved to Cloud! ✨');
        return true;
      } catch (err: any) {
        handleFirestoreError(err, 'saveProfile');
        setEditProfileModal(prev => ({
          ...prev,
          loading: false,
          saveError: 'Failed to persist to Cloud Firestore: ' + (err.message || 'Please try again.')
        }));
        return false;
      }
    },
    [currentUser, activeProfile, store.interests, updateStore, showToast]
  );

  // Profile Migration Modal
  const closeMigrationModal = useCallback(() => {
    setMigrationModal(prev => ({ ...prev, open: false, loading: false }));
    if (currentUser) {
      try {
        sessionStorage.setItem('scene-hai:migration-prompted:' + currentUser.uid, '1');
      } catch (e) {}
    }
  }, [currentUser]);

  const handleProfileMigration = useCallback(
    async (importLocal: boolean) => {
      if (!currentUser) {
        closeMigrationModal();
        return;
      }
      setMigrationModal(prev => ({ ...prev, loading: true }));
      try {
        const local = migrationModal.localData;
        const toSave: any =
          importLocal && local
            ? {
                displayName: String(local.displayName || currentUser.displayName || 'Scene Explorer')
                  .slice(0, 50)
                  .trim(),
                bio: String(local.bio || '').slice(0, 160).trim(),
                city: String(local.city || store.city || 'Lahore').slice(0, 50).trim(),
                area: String(local.area || '').slice(0, 60).trim(),
                interests:
                  Array.isArray(local.interests) && local.interests.length
                    ? local.interests.slice(0, 15)
                    : ['sports', 'food', 'gaming']
              }
            : {
                displayName: String(currentUser.displayName || 'Scene Explorer').slice(0, 50).trim(),
                bio: '',
                city: String(store.city || 'Lahore').slice(0, 50).trim(),
                area: '',
                interests:
                  Array.isArray(store.interests) && store.interests.length
                    ? store.interests.slice(0, 15)
                    : ['sports', 'food', 'gaming']
              };

        if (db) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            await updateDoc(userDocRef, {
              ...toSave,
              updatedAt: serverTimestamp()
            });
          } else {
            await setDoc(userDocRef, {
              ...toSave,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        }

        const active: UserProfile = {
          ...toSave,
          uid: currentUser.uid,
          updatedAt: new Date().toISOString()
        };
        saveUserProfile(currentUser.uid, active);
        setActiveProfile(active);
        updateStore(s => ({
          ...s,
          name: toSave.displayName,
          city: toSave.city,
          interests: [...toSave.interests]
        }));
        closeMigrationModal();
        showToast(importLocal ? 'Local profile imported to Cloud! ✨' : 'Using Google defaults! ✨');
      } catch (err: any) {
        handleFirestoreError(err, 'handleProfileMigration');
        closeMigrationModal();
        showToast('Profile updated! ✨');
      }
    },
    [currentUser, migrationModal.localData, store.city, store.interests, closeMigrationModal, updateStore, showToast]
  );

  // Edit Scene Modal
  const openEditScene = useCallback(
    (sceneId: string) => {
      const scene = allScenes.find(s => s.id === sceneId);
      if (!scene || !scene.isMine) {
        showToast('Only the host can edit this scene.');
        return;
      }
      const d = dateFor(scene);
      const dateStr = d.toLocaleDateString('en-CA');
      const timeStr = d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      setEditSceneModal({
        open: true,
        sceneId,
        loading: false,
        error: '',
        errors: {},
        formData: {
          title: scene.title || '',
          description: scene.description || '',
          category: scene.category || 'sports',
          city: scene.city || 'Lahore',
          area: scene.area || '',
          venue: scene.venue || '',
          date: dateStr,
          time: timeStr,
          budget: Number(scene.budget || 0),
          spots: Number(scene.spots || 8),
          privacy: (scene.privacy || 'Public').toLowerCase()
        }
      });
    },
    [allScenes, showToast]
  );

  const closeEditScene = useCallback(() => {
    setEditSceneModal(prev => ({ ...prev, open: false, loading: false, error: '', errors: {} }));
  }, []);

  const saveEditedScene = useCallback(
    async (formData: any): Promise<boolean> => {
      if (!currentUser || !editSceneModal.sceneId) return false;
      const { title, description, category, city, area, venue, date, time, spots, budget, privacy } = formData;
      const errors: Record<string, string> = {};

      const sceneId = editSceneModal.sceneId;
      const target = allScenes.find(s => s.id === sceneId);
      if (!target) return false;

      const currentApproved = Number(target.approvedCount || 0);

      if (title.length < 5 || title.length > 70) {
        errors.title = 'Title must be between 5 and 70 characters.';
      }
      if (description.length < 15 || description.length > 500) {
        errors.description = 'Description must be between 15 and 500 characters.';
      }
      if (!area || area.length > 60) {
        errors.area = 'Please provide a valid area/neighborhood (up to 60 characters).';
      }

      // Invariant: capacity cannot be reduced below confirmed attendance (host + approved participants)
      if (spots < currentApproved + 1) {
        errors.spots = `Capacity cannot be lower than ${currentApproved + 1} (1 host + ${currentApproved} confirmed attendee${currentApproved !== 1 ? 's' : ''}).`;
      }

      const pktDateString = `${date}T${time}:00+05:00`;
      const startsAtDate = new Date(pktDateString);
      let generalError = '';
      if (isNaN(startsAtDate.getTime())) {
        generalError = 'Please select a valid date and time.';
      }

      if (Object.keys(errors).length > 0 || generalError) {
        setEditSceneModal(prev => ({ ...prev, errors, error: generalError }));
        return false;
      }

      setEditSceneModal(prev => ({ ...prev, loading: true, error: '', errors: {} }));
      try {
        if (db && target.isFirestore) {
          const updatePayload: any = {
            title: title.trim(),
            description: description.trim(),
            category,
            city: city.trim(),
            area: area.trim(),
            venue: (venue || 'Meetup spot shared after approval').trim(),
            startsAt: Timestamp.fromDate(startsAtDate),
            budgetPerPerson: Number(budget),
            maxParticipants: Number(spots),
            privacy: privacy.toLowerCase(),
            updatedAt: serverTimestamp()
          };
          await updateDoc(doc(db, 'scenes', sceneId), updatePayload);

          const updated = formatFirestoreScene(
            sceneId,
            {
              ...target,
              ...updatePayload,
              startsAt: startsAtDate,
              hostDisplayName: target.host,
              approvedCount: currentApproved
            },
            currentUser.uid
          );

          setMyHostedScenes(prev => prev.map(s => (s.id === sceneId ? updated : s)));
          setFirestoreScenes(prev => {
            const exists = prev.some(s => s.id === sceneId);
            if (updated.privacy === 'Private' || updated.status === 'cancelled') {
              return prev.filter(s => s.id !== sceneId);
            }
            if (exists) {
              return prev.map(s => (s.id === sceneId ? updated : s));
            } else if (updated.privacy === 'Public' && updated.status === 'active') {
              return [updated, ...prev];
            }
            return prev;
          });
        } else {
          updateStore(s => ({
            ...s,
            created: s.created.map(x => {
              if (x.id === sceneId) {
                return {
                  ...x,
                  title: title.trim(),
                  description: description.trim(),
                  category,
                  city: city.trim(),
                  area: area.trim(),
                  venue: venue.trim(),
                  date,
                  time,
                  spots: Number(spots),
                  budget: Number(budget),
                  privacy: privacy === 'public' ? 'Public' : 'Private'
                };
              }
              return x;
            })
          }));
        }

        setEditSceneModal(prev => ({ ...prev, open: false, loading: false }));
        showToast('Scene details updated! ✨');
        return true;
      } catch (err: any) {
        handleFirestoreError(err, 'editSceneForm');
        setEditSceneModal(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to update: ' + (err.message || 'Unknown error')
        }));
        return false;
      }
    },
    [currentUser, editSceneModal.sceneId, allScenes, updateStore, showToast]
  );

  const value: AppContextValue = {
    currentUser,
    authReady,
    activeProfile,
    profileLoading,
    store,
    updateStore,
    currentRoute,
    navigate,
    goBack,
    toastMessage,
    showToast,

    firestoreScenes,
    myHostedScenes,
    scenesLoading,
    scenesError,
    myHostedLoading,
    createSceneLoading,
    fetchDiscoveryScenes,
    fetchMyHostedScenes,
    cancelHostScene,
    createScene,

    allScenes,
    matchingScenes,

    myJoinRequests,
    hostJoinRequests,
    approvedParticipants,
    hostJoinRequestsLoading,
    hostJoinRequestsError,
    joinRequestLoading,
    checkMyJoinRequest,
    submitJoinRequest,
    withdrawJoinRequest,
    approveJoinRequest,
    declineJoinRequest,
    leaveScene,
    removeParticipant,
    fetchHostJoinRequests,
    retryHostJoinRequests: fetchHostJoinRequests,

    loginWithGoogle,
    logout,
    openAuthPrompt,
    closeAuthPrompt,
    authModal,

    editProfileModal,
    openEditProfile,
    closeEditProfile,
    saveProfile,

    migrationModal,
    closeMigrationModal,
    handleProfileMigration,

    editSceneModal,
    openEditScene,
    closeEditScene,
    saveEditedScene,

    filters,
    setFilters,
    getActiveDisplayName
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
