/*
 * SCENE HAI? — Interactive frontend with Firebase Authentication.
 * Identity source of truth: Firebase Auth (Google Sign-In).
 * LocalStorage persists offline prototype scenes, groups & reviews.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  limit,
  Timestamp,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

const firebaseConfig = {
  projectId: "gen-lang-client-0648193037",
  appId: "1:959957774322:web:ba0e980203c09393d2456b",
  apiKey: "AIzaSyB1y-_UGHmP2dTZlCTh3gNsM3RTjWL27XU",
  authDomain: "gen-lang-client-0648193037.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-scenehai-4494a13b-a264-4565-aaaa-f1f82a750460",
  storageBucket: "gen-lang-client-0648193037.firebasestorage.app",
  messagingSenderId: "959957774322"
};

let app, auth, googleProvider, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (err) {
  console.warn('[Firebase] Initialization:', err);
}

function handleFirestoreError(error, operation) {
  const errorInfo = {
    operation,
    code: error?.code || 'unknown',
    message: error?.message || 'Unknown Firestore error',
    details: error
  };
  console.error('[Firestore Error]', errorInfo);
  return errorInfo;
}

const KEY = 'scene-hai:design-v1';
const $app = document.getElementById('app');
const e = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5z"/>',
  plus:'<path d="M12 4v16M4 12h16"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 3-8 8-8s8 3 8 8"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  search:'<circle cx="10.7" cy="10.7" r="6.8"/><path d="m16 16 5 5"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back:'<path d="M19 12H5m6-6-6 6 6 6"/>',
  heart:'<path d="M20.6 8.6c0 5-8.6 10.7-8.6 10.7S3.4 13.6 3.4 8.6a5 5 0 0 1 8.6-3.3 5 5 0 0 1 8.6 3.3z"/>',
  share:'<path d="M12 16V3m-5 5 5-5 5 5M5 14v6h14v-6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users:'<circle cx="9" cy="8" r="3"/><path d="M2 20v-2c0-4 3-6 7-6s7 2 7 6v2M16 5c3 0 5 2 5 5m-3 4c2 1 3 3 3 6"/>',
  shield:'<path d="m12 2 8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6z"/><path d="m9 12 2 2 4-4"/>',
  close:'<path d="M5 5 19 19M19 5 5 19"/>',
  chevron:'<path d="m6 9 6 6 6-6"/>',
  message:'<path d="M21 11a8 8 0 0 1-8 8H5l-3 3v-9a9 9 0 1 1 19-2z"/>',
  filter:'<path d="M4 7h16M7 12h10M10 17h4"/>',
  edit:'<path d="m4 16 12-12 4 4-12 12-5 1zM14 6l4 4"/>',
  logout:'<path d="M10 4H4v16h6M14 7l5 5-5 5M7 12h12"/>',
  send:'<path d="m3 3 18 9-18 9 4-9zM7 12h14"/>',
  star:'<path d="m12 2 2.8 6.4L22 9l-5.4 4.8 1.6 7.2L12 17.2 5.8 21l1.6-7.2L2 9l7.2-.6z"/>',
  dots:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  spark:'<path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3z"/>',
  camera:'<path d="M4 7h4l2-3h4l2 3h4v13H4z"/><circle cx="12" cy="13" r="3"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>'
};
const ic=(name,size=19)=>`<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.star}</svg>`;
const categories = [
 {id:'all',label:'All scenes',emoji:'✳',tone:'all'},
 {id:'sports',label:'Sports',emoji:'⚽',tone:'green'},
 {id:'food',label:'Chai & food',emoji:'☕',tone:'peach'},
 {id:'gaming',label:'Gaming',emoji:'🎮',tone:'lilac'},
 {id:'outdoors',label:'Outdoors',emoji:'🏕️',tone:'blue'},
 {id:'tech',label:'Tech & meetups',emoji:'💻',tone:'yellow'},
 {id:'creative',label:'Creative',emoji:'🎨',tone:'pink'},
 {id:'music',label:'Music',emoji:'🎸',tone:'purple'}
];
const cities=['Lahore','Karachi','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Sialkot','Gujranwala'];
const USER_PROFILE_KEY_PREFIX = 'scene-hai:user-profile:';

function getUserProfile(uid) {
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

function saveUserProfile(uid, profileData) {
  if (!uid) return;
  try {
    localStorage.setItem(USER_PROFILE_KEY_PREFIX + uid, JSON.stringify(profileData));
  } catch (err) {}
}

let activeProfile = null;

function getActiveProfile() {
  if (!currentUser) return null;
  if (!activeProfile || activeProfile.uid !== currentUser.uid) {
    const loaded = getUserProfile(currentUser.uid);
    if (loaded) {
      activeProfile = loaded;
    } else {
      activeProfile = {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Scene Explorer',
        bio: '',
        city: store.city || 'Lahore',
        area: '',
        interests: Array.isArray(store.interests) && store.interests.length ? [...store.interests] : ['sports','food','gaming']
      };
      saveUserProfile(currentUser.uid, activeProfile);
    }
  }
  return activeProfile;
}

function getActiveDisplayName() {
  if (currentUser) {
    const prof = getActiveProfile();
    return (prof && prof.displayName) || currentUser.displayName || 'Scene Explorer';
  }
  return store.name || 'Scene Explorer';
}
const groups=[{id:'group-1',name:'The Chai Circle',emoji:'☕',desc:'Low-key meetups, good chai and better conversations.',members:128,tone:'peach',city:'Lahore'},{id:'group-2',name:'Turf After Hours',emoji:'⚽',desc:'Pick-up matches and post-game food runs.',members:84,tone:'green',city:'Lahore'},{id:'group-3',name:'Build & Chill',emoji:'💻',desc:'Makers, founders and weekend side projects.',members:62,tone:'lavender',city:'Lahore'},{id:'group-4',name:'The Weekend Wanders',emoji:'🏕️',desc:'Morning trails, local trips and fresh air.',members:93,tone:'blue',city:'Islamabad'}];
const people=[{name:'Maha K.',initials:'MK',tone:'pink',vibe:'Outdoors · Coffee'},{name:'Hamza A.',initials:'HA',tone:'green',vibe:'Football · Gaming'},{name:'Sara F.',initials:'SF',tone:'lavender',vibe:'Art · Music'},{name:'Saad M.',initials:'SM',tone:'yellow',vibe:'Tech · Chai'}];
const seed = [
 {id:'ft-1',title:'5v5 Futsal. Loser buys chai.',category:'sports',city:'Lahore',area:'Gulberg III',timeOffset:0,hour:20,minute:30,budget:650,budgetType:'Est. per person',spots:10,going:8,host:'Zain R.',initials:'ZR',hostTone:'lavender',image:'futsal',label:'TONIGHT\'S PICK',description:'A chill but competitive 5v5. Mixed skill levels welcome. We play hard, laugh harder, and end with chai.',tags:['All skill levels','Bring your shoes','Chai after'],privacy:'Public',venue:'Indoor futsal turf · exact meetup point after approval',feature:true},
 {id:'chai-2',title:'Karak chai & random conversations',category:'food',city:'Lahore',area:'Johar Town',timeOffset:0,hour:22,minute:0,budget:350,budgetType:'Est. per person',spots:8,going:5,host:'Hira S.',initials:'HS',hostTone:'peach',image:'chai',label:'CHILL SCENE',description:'No awkward introductions, no agenda. Just good chai, silly stories and meeting people outside your usual circle.',tags:['First-timers welcome','Low-key','Good conversations'],privacy:'Public',venue:'Chai spot in Johar Town · details after approval'},
 {id:'game-3',title:'Catan, chaos & good company',category:'gaming',city:'Lahore',area:'DHA Phase 5',timeOffset:1,hour:18,minute:30,budget:300,budgetType:'Est. per person',spots:6,going:3,host:'Ali H.',initials:'AH',hostTone:'yellow',image:'gaming',description:'Board games for people who take their friendships *almost* too seriously. New players encouraged.',tags:['Beginner-friendly','Board games','Indoor'],privacy:'Public',venue:'Board game cafe · details after approval'},
 {id:'hike-4',title:'Sunrise trail & breakfast stop',category:'outdoors',city:'Islamabad',area:'Margalla Hills',timeOffset:2,hour:6,minute:0,budget:500,budgetType:'Est. per person',spots:12,going:7,host:'Maham K.',initials:'MK',hostTone:'green',image:'hike',description:'A relaxed early morning trail with good views, fresh air, and a breakfast stop. Bring water!',tags:['Easy–moderate','Outdoors','Morning'],privacy:'Public',venue:'Trail meetup point shared after approval'},
 {id:'tech-5',title:'Build stuff, meet builders',category:'tech',city:'Lahore',area:'Gulberg',timeOffset:2,hour:16,minute:0,budget:0,budgetType:'Free entry',spots:14,going:9,host:'Saad M.',initials:'SM',hostTone:'blue',image:'tech',description:'No pitch decks. Bring your side-project, something you are learning, or just curiosity. Cowork and connect.',tags:['Founders','Freelancers','Show & tell'],privacy:'Public',venue:'Cafe coworking table · details after approval'},
 {id:'art-6',title:'Messy pottery Sunday',category:'creative',city:'Lahore',area:'Model Town',timeOffset:3,hour:14,minute:0,budget:1200,budgetType:'Workshop fee',spots:8,going:5,host:'Eman A.',initials:'EA',hostTone:'pink',image:'art',description:'Make something crooked and call it art. A beginner-friendly pottery session with new people.',tags:['Beginner-friendly','Materials included','Creative'],privacy:'Public',venue:'Community studio · location after approval'},
 {id:'music-7',title:'Acoustic rooftop jam',category:'music',city:'Lahore',area:'Old Lahore',timeOffset:1,hour:20,minute:0,budget:450,budgetType:'Est. per person',spots:12,going:6,host:'Raza K.',initials:'RK',hostTone:'peach',image:'music',description:'Bring a guitar or just your playlist. An easygoing rooftop evening with live music and chai.',tags:['Music lovers','No experience needed','Rooftop'],privacy:'Public',venue:'Walled City rooftop · address after approval'},
 {id:'bad-8',title:'Badminton doubles, anyone?',category:'sports',city:'Karachi',area:'Clifton',timeOffset:1,hour:19,minute:0,budget:550,budgetType:'Est. per person',spots:8,going:4,host:'Taha N.',initials:'TN',hostTone:'blue',image:'badminton',description:'Friendly doubles match, rotating teams and zero pressure to be a pro.',tags:['Friendly games','Intermediate-ish'],privacy:'Public',venue:'Court booking · address after approval'},
 {id:'coffee-9',title:'Coffee & new connections',category:'food',city:'Karachi',area:'Bahadurabad',timeOffset:0,hour:18,minute:0,budget:750,budgetType:'Est. per person',spots:7,going:4,host:'Sara F.',initials:'SF',hostTone:'pink',image:'coffee',description:'Small group. Big conversations. A nice way to meet people around your city.',tags:['Meet new people','Cafe','Casual'],privacy:'Public',venue:'Cafe details after approval'},
 {id:'demo-host',title:'Weekend badminton & banter',category:'sports',city:'Lahore',area:'DHA Phase 6',timeOffset:4,hour:18,minute:30,budget:400,budgetType:'Est. per person',spots:8,going:4,host:'You',initials:'YOU',hostTone:'yellow',image:'badminton',description:'Your sample hosted scene. Explore how host approvals would work in the finished app.',tags:['Casual','Doubles'],privacy:'Public',venue:'Meetup spot shared after approval',isMine:true}
];
const initial = {
 name:'Areeb Khan',city:'Lahore',interests:['sports','food','gaming'],
 created:[], joined:['game-3'], requested:[], saved:[], groupsJoined:['group-1'], friendsRequested:[], blockedHosts:[], reports:[],
 incoming:[{id:'demo-in-1',sceneId:'demo-host',name:'Hamza A.',initials:'HA',status:'pending',message:'Hey! I play doubles. Would love to join.'},{id:'demo-in-2',sceneId:'demo-host',name:'Mariam S.',initials:'MS',status:'pending',message:'Can beginners join too?'}],
 notifications:[{id:'n1',type:'welcome',title:'You\'re in. Now make a scene! ✨',body:'Explore what people are planning around Lahore.',ago:'Just now',seen:false},{id:'n2',type:'safety',title:'Good scenes start with good boundaries',body:'Choose public meetups and tell someone where you are going.',ago:'Today',seen:false}],
 messages:{'game-3':[{from:'other',name:'Ali',text:'Hey everyone! Who knows how to play Catan? 🎲',time:'6:24 PM'},{from:'me',text:'I am a beginner, but I am in! 😄',time:'6:27 PM'}]}
};
function loadState(){try {const data=JSON.parse(localStorage.getItem(KEY));return data&&typeof data==='object'?{...structuredClone(initial),...data}:structuredClone(initial)}catch{return structuredClone(initial)}}
let store=loadState();
let ui={category:'all',search:'',when:'any',myTab:'going',inboxTab:'all',cityOpen:false,toast:'',lastTab:'discover'};
let currentUser = null;
let authReady = false;
let authPendingAction = null;
let authModal = {
  open: false,
  reason: '',
  error: '',
  loading: false
};
let profileLoading = false;
let migrationModal = {
  open: false,
  localData: null,
  uid: null,
  loading: false
};
let editProfileModal = {
  open: false,
  loading: false,
  saveError: '',
  formData: {
    displayName: '',
    bio: '',
    city: 'Lahore',
    area: ''
  },
  errors: {}
};

// Phase 3.2: Firestore Scenes state
let firestoreScenes = [];
let myHostedScenes = [];
let scenesLoading = false;
let scenesError = '';
let myHostedLoading = false;
let createSceneLoading = false;

// Phase 3.3A: Join Requests state
let myJoinRequests = {}; // sceneId -> 'pending' | 'withdrawn' | null
let hostJoinRequests = [];
let hostJoinRequestsLoading = false;
let joinRequestLoading = false;
let checkedRequestsSet = new Set();
let editSceneModal = {
  open: false,
  sceneId: null,
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
  errors: {}
};

function updateBodyScrollLock() {
  const isAnyModalOpen = (authModal && authModal.open) || 
    (editProfileModal && editProfileModal.open) || 
    (migrationModal && migrationModal.open) ||
    (editSceneModal && editSceneModal.open);
  if (isAnyModalOpen) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
}

function openEditProfile() {
  if (!currentUser) {
    openAuthPrompt('Sign in with Google to edit your profile');
    return;
  }
  const prof = getActiveProfile();
  editProfileModal.open = true;
  editProfileModal.loading = false;
  editProfileModal.saveError = '';
  editProfileModal.errors = {};
  editProfileModal.formData = {
    displayName: (prof && prof.displayName) || currentUser.displayName || '',
    bio: (prof && prof.bio) || '',
    city: (prof && prof.city) || store.city || 'Lahore',
    area: (prof && prof.area) || ''
  };
  updateBodyScrollLock();
  render();
  setTimeout(() => {
    const input = document.getElementById('edit-profile-name');
    if (input) input.focus();
  }, 40);
}

function closeEditProfile() {
  editProfileModal.open = false;
  editProfileModal.loading = false;
  editProfileModal.saveError = '';
  editProfileModal.errors = {};
  updateBodyScrollLock();
  render();
}

function syncEditProfileFormInputs() {
  const form = document.getElementById('edit-profile-form');
  if (!form) return;
  const f = new FormData(form);
  if (f.has('displayName')) editProfileModal.formData.displayName = String(f.get('displayName') || '');
  if (f.has('bio')) editProfileModal.formData.bio = String(f.get('bio') || '');
  if (f.has('city')) editProfileModal.formData.city = String(f.get('city') || '');
  if (f.has('area')) editProfileModal.formData.area = String(f.get('area') || '');
}

async function loadOrInitFirestoreProfile(user) {
  if (!user) return;
  if (!db) {
    console.warn('[Firestore] Database instance not available');
    return;
  }
  profileLoading = true;
  render();

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const cloudData = snap.data();
      activeProfile = {
        uid: user.uid,
        displayName: cloudData.displayName || user.displayName || 'Scene Explorer',
        bio: cloudData.bio || '',
        city: cloudData.city || store.city || 'Lahore',
        area: cloudData.area || '',
        interests: Array.isArray(cloudData.interests) ? [...cloudData.interests] : ['sports','food','gaming'],
        createdAt: cloudData.createdAt || null,
        updatedAt: cloudData.updatedAt || null
      };
      saveUserProfile(user.uid, activeProfile);
      store.name = activeProfile.displayName;
      store.city = activeProfile.city;
      store.interests = [...activeProfile.interests];
      save();
    } else {
      const local = getUserProfile(user.uid);
      const alreadyPrompted = sessionStorage.getItem('scene-hai:migration-prompted:' + user.uid);
      const hasLocalCustomizations = local && (
        (local.bio && local.bio.trim().length > 0) ||
        (local.area && local.area.trim().length > 0) ||
        (local.displayName && local.displayName.trim() !== user.displayName)
      );

      if (hasLocalCustomizations && !alreadyPrompted) {
        migrationModal = {
          open: true,
          localData: local,
          uid: user.uid,
          loading: false
        };
        updateBodyScrollLock();
      } else {
        const initialProfile = {
          displayName: String(user.displayName || 'Scene Explorer').slice(0, 50).trim(),
          bio: '',
          city: String(store.city || 'Lahore').slice(0, 50).trim(),
          area: '',
          interests: Array.isArray(store.interests) && store.interests.length ? store.interests.slice(0, 15) : ['sports','food','gaming'],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(userDocRef, initialProfile);
        activeProfile = { ...initialProfile, uid: user.uid };
        saveUserProfile(user.uid, activeProfile);
        store.name = initialProfile.displayName;
        store.city = initialProfile.city;
        store.interests = [...initialProfile.interests];
        save();
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'loadOrInitFirestoreProfile');
    const local = getUserProfile(user.uid);
    if (local) activeProfile = local;
  } finally {
    profileLoading = false;
    render();
  }
}

function closeMigrationModal() {
  migrationModal.open = false;
  migrationModal.loading = false;
  if (currentUser) {
    try {
      sessionStorage.setItem('scene-hai:migration-prompted:' + currentUser.uid, '1');
    } catch(e){}
  }
  updateBodyScrollLock();
  render();
}

async function handleProfileMigration(importLocal) {
  if (!currentUser) {
    closeMigrationModal();
    return;
  }
  migrationModal.loading = true;
  render();

  try {
    const local = migrationModal.localData;
    const toSave = (importLocal && local) ? {
      displayName: String(local.displayName || currentUser.displayName || 'Scene Explorer').slice(0, 50).trim(),
      bio: String(local.bio || '').slice(0, 160).trim(),
      city: String(local.city || store.city || 'Lahore').slice(0, 50).trim(),
      area: String(local.area || '').slice(0, 60).trim(),
      interests: Array.isArray(local.interests) && local.interests.length ? local.interests.slice(0, 15) : ['sports','food','gaming']
    } : {
      displayName: String(currentUser.displayName || 'Scene Explorer').slice(0, 50).trim(),
      bio: '',
      city: String(store.city || 'Lahore').slice(0, 50).trim(),
      area: '',
      interests: Array.isArray(store.interests) && store.interests.length ? store.interests.slice(0, 15) : ['sports','food','gaming']
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

    activeProfile = { ...toSave, uid: currentUser.uid, updatedAt: new Date().toISOString() };
    saveUserProfile(currentUser.uid, activeProfile);
    store.name = toSave.displayName;
    store.city = toSave.city;
    store.interests = [...toSave.interests];
    save();

    closeMigrationModal();
    toast(importLocal ? 'Local profile imported to Cloud! ✨' : 'Using Google defaults! ✨');
  } catch (err) {
    handleFirestoreError(err, 'handleProfileMigration');
    const local = migrationModal.localData;
    if (importLocal && local) {
      activeProfile = { ...local, uid: currentUser.uid };
      saveUserProfile(currentUser.uid, activeProfile);
      store.name = activeProfile.displayName || store.name;
      store.city = activeProfile.city || store.city;
      save();
    }
    closeMigrationModal();
    toast('Profile updated! ✨');
  }
}

// Phase 3.2: Firestore Scene Data Helpers
function formatFirestoreScene(docId, data, currentUserId) {
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
  const timeStr = startsDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

  const categoryImages = {
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
  const hostName = data.hostDisplayName || (isMine ? getActiveDisplayName() : 'Scene Host');
  const initials = hostName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'SH';
  const budget = Number(data.budgetPerPerson || 0);

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
    spots: Number(data.maxParticipants || 8),
    going: 1,
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

async function fetchDiscoveryScenes() {
  if (!db) return;
  scenesLoading = true;
  scenesError = '';
  render();
  try {
    const q = query(
      collection(db, 'scenes'),
      where('privacy', '==', 'public'),
      where('status', '==', 'active'),
      limit(50)
    );
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(docSnap => {
      list.push(formatFirestoreScene(docSnap.id, docSnap.data(), currentUser?.uid));
    });
    list.sort((a, b) => dateFor(a) - dateFor(b));
    firestoreScenes = list;
  } catch (err) {
    scenesError = err.message || 'Failed to load scenes from Firestore';
    handleFirestoreError(err, 'fetchDiscoveryScenes');
  } finally {
    scenesLoading = false;
    render();
  }
}

async function fetchMyHostedScenes() {
  if (!db || !currentUser) {
    myHostedScenes = [];
    return;
  }
  myHostedLoading = true;
  render();
  try {
    const q = query(
      collection(db, 'scenes'),
      where('hostId', '==', currentUser.uid),
      limit(50)
    );
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(docSnap => {
      list.push(formatFirestoreScene(docSnap.id, docSnap.data(), currentUser.uid));
    });
    list.sort((a, b) => dateFor(a) - dateFor(b));
    myHostedScenes = list;
  } catch (err) {
    handleFirestoreError(err, 'fetchMyHostedScenes');
  } finally {
    myHostedLoading = false;
    render();
  }
}

async function cancelHostScene(sceneId) {
  const scene = allScenes().find(s => s.id === sceneId);
  if (!scene || !scene.isMine) {
    toast('Only the host can cancel this scene.');
    return;
  }
  if (!window.confirm(`Are you sure you want to cancel "${scene.title}"? This will mark it cancelled and hide it from public discovery.`)) {
    return;
  }
  try {
    if (db && scene.isFirestore) {
      await updateDoc(doc(db, 'scenes', sceneId), {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });
      const idx = myHostedScenes.findIndex(s => s.id === sceneId);
      if (idx !== -1) {
        myHostedScenes[idx].status = 'cancelled';
      }
      firestoreScenes = firestoreScenes.filter(s => s.id !== sceneId);
      toast('Scene cancelled. It is now hidden from public discovery.');
      render();
    } else {
      const local = store.created.find(x => x.id === sceneId);
      if (local) {
        local.status = 'cancelled';
        save();
        render();
        toast('Scene cancelled.');
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'cancelHostScene');
    toast('Failed to cancel scene: ' + (err.message || 'Unknown error'));
  }
}

function openEditScene(sceneId) {
  const scene = allScenes().find(s => s.id === sceneId);
  if (!scene || !scene.isMine) {
    toast('Only the host can edit this scene.');
    return;
  }
  editSceneModal.open = true;
  editSceneModal.sceneId = sceneId;
  editSceneModal.loading = false;
  editSceneModal.error = '';
  editSceneModal.errors = {};

  const d = dateFor(scene);
  const dateStr = d.toLocaleDateString('en-CA');
  const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

  editSceneModal.formData = {
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
  };
  updateBodyScrollLock();
  render();
}

function closeEditScene() {
  editSceneModal.open = false;
  editSceneModal.loading = false;
  editSceneModal.error = '';
  editSceneModal.errors = {};
  updateBodyScrollLock();
  render();
}

// Phase 3.3A: Join Requests state & handlers
async function checkMyJoinRequest(sceneId) {
  if (!db || !currentUser || !sceneId || checkedRequestsSet.has(sceneId)) return;
  checkedRequestsSet.add(sceneId);
  try {
    const reqRef = doc(db, 'scenes', sceneId, 'joinRequests', currentUser.uid);
    const snap = await getDoc(reqRef);
    if (snap.exists()) {
      myJoinRequests[sceneId] = snap.data().status;
    } else {
      myJoinRequests[sceneId] = null;
    }
    render();
  } catch (err) {
    console.warn('[Firestore] Error checking join request:', err);
  }
}

async function fetchHostJoinRequests() {
  if (!db || !currentUser || !myHostedScenes.length) {
    hostJoinRequests = [];
    return;
  }
  hostJoinRequestsLoading = true;
  render();
  try {
    const allReqs = [];
    for (const sc of myHostedScenes) {
      if (!sc.isFirestore) continue;
      const q = query(
        collection(db, 'scenes', sc.id, 'joinRequests'),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      snap.forEach(d => {
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
        allReqs.push({
          id: d.id,
          sceneId: sc.id,
          sceneTitle: sc.title,
          requesterId: data.requesterId,
          name: data.requesterDisplayName || 'Scene Explorer',
          initials: (data.requesterDisplayName || 'SE').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase(),
          status: data.status,
          createdAt: data.createdAt,
          ago,
          isFirestore: true
        });
      });
    }
    allReqs.sort((a, b) => {
      const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return tb - ta;
    });
    hostJoinRequests = allReqs;
  } catch (err) {
    console.warn('[Firestore] Error fetching host join requests:', err);
  } finally {
    hostJoinRequestsLoading = false;
    render();
  }
}

async function submitJoinRequest(sceneId) {
  if (!currentUser) {
    openAuthPrompt('Sign in with Google to request to join this meetup', { type: 'join', id: sceneId });
    return;
  }
  if (!db) {
    toast('Cloud database is not ready.');
    return;
  }
  const sc = allScenes().find(s => s.id === sceneId);
  if (!sc) {
    toast('Scene not found.');
    return;
  }
  if (sc.hostId === currentUser.uid || sc.isMine) {
    toast('You cannot request to join your own scene.');
    return;
  }
  if (sc.status === 'cancelled') {
    toast('This scene is cancelled.');
    return;
  }
  if (dateFor(sc) <= new Date()) {
    toast('This scene has already taken place.');
    return;
  }

  joinRequestLoading = true;
  render();

  try {
    const reqRef = doc(db, 'scenes', sceneId, 'joinRequests', currentUser.uid);
    const snap = await getDoc(reqRef);
    if (snap.exists()) {
      if (snap.data().status === 'pending') {
        myJoinRequests[sceneId] = 'pending';
        toast('Your join request is already pending host approval.');
        return;
      }
      // Re-submitting a previously withdrawn request
      await updateDoc(reqRef, {
        status: 'pending',
        updatedAt: serverTimestamp()
      });
    } else {
      // First-time submission
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userDocRef);
      let displayName = getActiveDisplayName() || currentUser.displayName || 'Scene Explorer';
      if (userSnap.exists() && userSnap.data().displayName) {
        displayName = userSnap.data().displayName;
      }
      await setDoc(reqRef, {
        requesterId: currentUser.uid,
        requesterDisplayName: displayName,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    myJoinRequests[sceneId] = 'pending';
    toast('Join request sent! The host will review your request. ✨');
  } catch (err) {
    handleFirestoreError(err, 'submitJoinRequest');
    toast('Unable to submit join request: ' + (err.message || 'Please try again.'));
  } finally {
    joinRequestLoading = false;
    render();
  }
}

async function withdrawJoinRequest(sceneId) {
  if (!currentUser || !db) return;
  joinRequestLoading = true;
  render();
  try {
    const reqRef = doc(db, 'scenes', sceneId, 'joinRequests', currentUser.uid);
    await updateDoc(reqRef, {
      status: 'withdrawn',
      updatedAt: serverTimestamp()
    });
    myJoinRequests[sceneId] = 'withdrawn';
    toast('Join request withdrawn.');
  } catch (err) {
    handleFirestoreError(err, 'withdrawJoinRequest');
    toast('Unable to withdraw request: ' + (err.message || 'Please try again.'));
  } finally {
    joinRequestLoading = false;
    render();
  }
}

if (auth) {
  onAuthStateChanged(auth, async (user) => {
    authReady = true;
    if (user) {
      currentUser = {
        uid: user.uid,
        displayName: user.displayName || 'Scene Explorer',
        email: user.email || '',
        photoURL: user.photoURL || null
      };
      await loadOrInitFirestoreProfile(user);
      await fetchMyHostedScenes();
      await fetchHostJoinRequests();
      await fetchDiscoveryScenes();
      const currentRoute = route();
      if (currentRoute.startsWith('scene/')) {
        const sceneId = currentRoute.split('/')[1];
        checkMyJoinRequest(sceneId);
      }
    } else {
      currentUser = null;
      activeProfile = null;
      migrationModal.open = false;
      myHostedScenes = [];
      myJoinRequests = {};
      hostJoinRequests = [];
      checkedRequestsSet.clear();
      closeEditProfile();
      closeEditScene();
      await fetchDiscoveryScenes();
    }
    updateBodyScrollLock();
    render();
  });
} else {
  authReady = true;
  fetchDiscoveryScenes();
}

const googleLogo = () => `<svg class="icon" width="18" height="18" viewBox="0 0 24 24" style="flex-shrink:0" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>`;

async function loginWithGoogle(intendedAction = null) {
  if (!auth || !googleProvider) {
    authModal.error = 'Firebase Auth is still initializing. Please try again.';
    render();
    return;
  }
  if (intendedAction) {
    authPendingAction = intendedAction;
  }
  authModal.loading = true;
  authModal.error = '';
  render();

  try {
    const cred = await signInWithPopup(auth, googleProvider);
    authModal.open = false;
    authModal.loading = false;
    currentUser = {
      uid: cred.user.uid,
      displayName: cred.user.displayName || 'Scene Explorer',
      email: cred.user.email || '',
      photoURL: cred.user.photoURL || null
    };
    updateBodyScrollLock();
    toast(`Welcome, ${getActiveDisplayName()}! ✨`);
    await loadOrInitFirestoreProfile(cred.user);

    if (authPendingAction) {
      const pending = authPendingAction;
      authPendingAction = null;
      executePendingAction(pending);
    } else {
      render();
    }
  } catch (err) {
    authModal.loading = false;
    console.warn('[Firebase Auth] Sign in error:', err);
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      authModal.error = 'Sign-in cancelled. You can sign in whenever you\'re ready.';
    } else if (err.code === 'auth/popup-blocked') {
      authModal.error = 'Pop-up blocked by your browser. Please allow pop-ups for this site and try again.';
    } else {
      authModal.error = err.message || 'Unable to sign in with Google. Please try again.';
    }
    render();
  }
}

async function logout() {
  if (!auth) return;
  try {
    await signOut(auth);
    currentUser = null;
    activeProfile = null;
    migrationModal.open = false;
    closeEditProfile();
    authModal.open = false;
    store.name = 'Areeb Khan';
    save();
    updateBodyScrollLock();
    toast('Signed out. You are now browsing as a guest.');
    render();
  } catch (err) {
    toast('Error signing out. Please try again.');
  }
}

function openAuthPrompt(reason = 'Sign in with Google to continue', pendingAction = null) {
  authModal.open = true;
  authModal.reason = reason;
  authModal.error = '';
  authModal.loading = false;
  if (pendingAction) {
    authPendingAction = pendingAction;
  }
  updateBodyScrollLock();
  render();
}

function closeAuthPrompt() {
  authModal.open = false;
  authModal.error = '';
  authModal.loading = false;
  updateBodyScrollLock();
  render();
}

function executePendingAction(action) {
  if (!action) return;
  if (action.type === 'navigate') {
    go(action.route);
  } else if (action.type === 'join') {
    const sc = allScenes().find(x => x.id === action.id);
    if (sc && sc.isFirestore) {
      submitJoinRequest(action.id);
    } else {
      if (!store.requested.includes(action.id)) {
        store.requested.push(action.id);
        save();
        toast('Join request sent! ✨');
      }
      render();
    }
  } else if (action.type === 'save') {
    const on = store.saved.includes(action.id);
    store.saved = on ? store.saved.filter(x => x !== action.id) : [...store.saved, action.id];
    save();
    toast(on ? 'Removed from saved' : 'Saved for later ♡');
    render();
  } else if (action.type === 'create') {
    go('create');
  } else if (action.type === 'chat') {
    if (!store.messages[action.sceneId]) store.messages[action.sceneId] = [];
    store.messages[action.sceneId].push({
      from: 'me',
      name: currentUser ? currentUser.displayName : store.name,
      text: action.text,
      time: new Date().toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' })
    });
    save();
    render();
  }
}

function renderAuthModal() {
  if (!authModal.open) return '';
  return `<div class="auth-modal-backdrop" data-action="close-auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
    <div class="auth-modal" onclick="event.stopPropagation()">
      <button class="auth-modal-close" data-action="close-auth-modal" aria-label="Close dialog">${ic('close', 18)}</button>
      <div class="auth-modal-brand">
        <div class="brand-symbol">s<span>✳</span></div>
        <strong style="font:850 16px var(--display)">Scene Hai?</strong>
      </div>
      <h2 id="auth-modal-title" class="auth-modal-title">Sign in to continue</h2>
      <p class="auth-modal-desc">${e(authModal.reason || 'Sign in with your Google account to create scenes, join meetups, and connect with people.')}</p>
      
      <button class="google-auth-btn primary" data-action="login" ${authModal.loading ? 'disabled' : ''}>
        ${authModal.loading ? '<span>Connecting to Google...</span>' : `${googleLogo()}<span>Continue with Google</span>`}
      </button>

      ${authModal.error ? `<div class="auth-error-box">${ic('info', 16)} <span>${e(authModal.error)}</span></div>` : ''}

      <div class="auth-hint-text">
        Secure authentication via Google Firebase. No password required.
      </div>
    </div>
  </div>`;
}

function renderMigrationModal() {
  if (!migrationModal.open || !currentUser) return '';
  const d = migrationModal.localData || {};
  return `<div class="auth-modal-backdrop edit-profile-backdrop" data-action="close-migration" role="dialog" aria-modal="true" aria-labelledby="migration-modal-title">
    <div class="edit-profile-modal" style="max-width:480px" onclick="event.stopPropagation()">
      <div class="edit-profile-header">
        <div class="edit-profile-header-text">
          <span class="tiny-overline">CLOUD SYNC · ONE-TIME</span>
          <h2 id="migration-modal-title" class="edit-profile-title">Import local profile? ✳</h2>
          <p class="edit-profile-desc">We found profile customizations saved on this browser.</p>
        </div>
        <button class="auth-modal-close" data-action="close-migration" aria-label="Close dialog">${ic('close', 18)}</button>
      </div>
      <div class="edit-profile-scroll-body" style="padding:18px 24px">
        <div class="import-modal-preview">
          <div><strong>Display Name:</strong> <span>${e(d.displayName || currentUser.displayName || 'Scene Explorer')}</span></div>
          ${d.bio ? `<div><strong>Bio:</strong> <span>“${e(d.bio)}”</span></div>` : ''}
          <div><strong>City:</strong> <span>${e(d.city || 'Lahore')}</span> ${d.area ? `· <span>${e(d.area)}</span>` : ''}</div>
        </div>
        <p style="font-size:12px;line-height:1.6;color:#6b677a;margin:0">
          Would you like to import these saved details into your Cloud Firestore profile, or start fresh with your default Google Account profile?
        </p>
      </div>
      <div class="edit-profile-actions" style="padding:14px 24px 18px;gap:8px">
        <button type="button" class="button edit-cancel-btn" data-action="close-migration" ${migrationModal.loading ? 'disabled' : ''}>
          Not now
        </button>
        <button type="button" class="button edit-cancel-btn" data-action="skip-migration" ${migrationModal.loading ? 'disabled' : ''}>
          Use Google Defaults
        </button>
        <button type="button" class="button submit-button edit-save-btn" data-action="confirm-migration" ${migrationModal.loading ? 'disabled' : ''}>
          ${migrationModal.loading ? `<span class="spinner"></span> <span>Saving...</span>` : `Import to Cloud ${ic('check', 16)}`}
        </button>
      </div>
    </div>
  </div>`;
}

function renderEditProfileModal() {
  if (!editProfileModal.open || !currentUser) return '';
  const googleName = currentUser.displayName || 'Scene Explorer';
  const googleEmail = currentUser.email || '';
  const activeName = getActiveDisplayName();
  const initials = (activeName || googleName).split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
  const avatarHtml = currentUser.photoURL
    ? `<img src="${e(currentUser.photoURL)}" alt="${e(googleName)}" referrerpolicy="no-referrer"/>`
    : e(initials);

  return `<div class="auth-modal-backdrop edit-profile-backdrop" data-action="close-edit-profile" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
    <div class="edit-profile-modal" onclick="event.stopPropagation()">
      <div class="edit-profile-header">
        <div class="edit-profile-header-text">
          <span class="tiny-overline">YOUR CORNER</span>
          <h2 id="edit-profile-title" class="edit-profile-title">Edit profile ✳</h2>
          <p class="edit-profile-desc">Personalize how other members see you across Scene Hai?</p>
        </div>
        <button class="auth-modal-close" data-action="close-edit-profile" aria-label="Close dialog">${ic('close', 18)}</button>
      </div>

      <form id="edit-profile-form" class="edit-profile-form">
        <div class="edit-profile-scroll-body">
          ${editProfileModal.saveError ? `
            <div class="modal-error-banner">
              <span>${e(editProfileModal.saveError)}</span>
              <button type="submit">Retry</button>
            </div>
          ` : ''}

          <div class="edit-profile-google-card">
            <div class="edit-profile-google-avatar">${avatarHtml}</div>
            <div class="edit-profile-google-info">
              <div class="edit-profile-google-badge">${ic('lock', 12)} Google Account · Read-only</div>
              <strong class="edit-profile-google-name">${e(googleName)}</strong>
              <span class="edit-profile-google-email">${e(googleEmail)}</span>
            </div>
          </div>

          <div class="form-group ${editProfileModal.errors.displayName ? 'has-error' : ''}">
            <label for="edit-profile-name">Display Name <b>*</b></label>
            <input id="edit-profile-name" name="displayName" type="text" maxlength="50" required placeholder="What should members call you?" value="${e(editProfileModal.formData.displayName)}"/>
            ${editProfileModal.errors.displayName ? `<small class="form-error-msg">${e(editProfileModal.errors.displayName)}</small>` : `<small>Appears on your hosted scenes, RSVPs, and chats.</small>`}
          </div>

          <div class="form-group ${editProfileModal.errors.bio ? 'has-error' : ''}">
            <div class="label-with-counter">
              <label for="edit-profile-bio">Short Bio</label>
              <span id="bio-counter" class="char-counter">${(editProfileModal.formData.bio||'').length}/160</span>
            </div>
            <textarea id="edit-profile-bio" name="bio" rows="3" maxlength="160" placeholder="A little about yourself, your vibe, or what kind of plans you love...">${e(editProfileModal.formData.bio||'')}</textarea>
            ${editProfileModal.errors.bio ? `<small class="form-error-msg">${e(editProfileModal.errors.bio)}</small>` : `<small>Max 160 characters. Tell people what makes you show up.</small>`}
          </div>

          <div class="form-grid">
            <div class="form-group ${editProfileModal.errors.city ? 'has-error' : ''}">
              <label for="edit-profile-city">City <b>*</b></label>
              <select id="edit-profile-city" name="city">
                ${cities.map(c=>`<option value="${e(c)}" ${editProfileModal.formData.city===c?'selected':''}>${e(c)}</option>`).join('')}
              </select>
              ${editProfileModal.errors.city ? `<small class="form-error-msg">${e(editProfileModal.errors.city)}</small>` : ''}
            </div>

            <div class="form-group">
              <label for="edit-profile-area">Area / Neighborhood</label>
              <input id="edit-profile-area" name="area" type="text" maxlength="40" placeholder="e.g. Gulberg, DHA, F-7, Clifton" value="${e(editProfileModal.formData.area||'')}"/>
              <small>Helps connect you with local meetups nearby.</small>
            </div>
          </div>

          <div class="edit-profile-cloud-notice">
            ${ic('shield', 15)}
            <span>Profile updates are saved securely to your Google account's Cloud Firestore record and synced in real-time.</span>
          </div>
        </div>

        <div class="edit-profile-actions">
          <button type="button" class="button edit-cancel-btn" data-action="close-edit-profile" ${editProfileModal.loading ? 'disabled' : ''}>Cancel</button>
          <button type="submit" class="button submit-button edit-save-btn" ${editProfileModal.loading ? 'disabled' : ''}>
            ${editProfileModal.loading ? `<span class="spinner"></span> <span>Saving to Cloud...</span>` : `Save Changes ${ic('check', 16)}`}
          </button>
        </div>
      </form>
    </div>
  </div>`;
}

function renderEditSceneModal() {
  if (!editSceneModal.open) return '';
  const data = editSceneModal.formData;
  return `<div class="auth-modal-backdrop edit-profile-backdrop" data-action="close-edit-scene" role="dialog" aria-modal="true" aria-labelledby="edit-scene-title">
    <div class="edit-profile-modal" onclick="event.stopPropagation()">
      <div class="edit-profile-header">
        <div class="edit-profile-header-text">
          <span class="tiny-overline">HOST MANAGEMENT</span>
          <h2 id="edit-scene-title" class="edit-profile-title">Edit Scene ✳</h2>
          <p class="edit-profile-desc">Update details for your hosted scene.</p>
        </div>
        <button class="auth-modal-close" data-action="close-edit-scene" aria-label="Close dialog">${ic('close', 18)}</button>
      </div>

      <form id="edit-scene-form" class="edit-profile-form">
        <div class="edit-profile-scroll-body">
          ${editSceneModal.error ? `
            <div class="modal-error-banner">
              <span>${e(editSceneModal.error)}</span>
            </div>
          ` : ''}

          <div class="form-group ${editSceneModal.errors.title ? 'has-error' : ''}">
            <label for="edit-scene-title-input">What's the plan? <b>*</b></label>
            <input id="edit-scene-title-input" name="title" maxlength="70" minlength="5" required value="${e(data.title)}" placeholder="e.g. Late-night chai in Gulberg"/>
            ${editSceneModal.errors.title ? `<small class="form-error-msg">${e(editSceneModal.errors.title)}</small>` : `<small>5 to 70 characters.</small>`}
          </div>

          <div class="form-group">
            <label>Pick a vibe <b>*</b></label>
            <div class="create-category-grid">
              ${categories.filter(c=>c.id!=='all').map(c=>`<label class="create-category-option"><input type="radio" name="category" value="${c.id}" ${data.category===c.id?'checked':''}/><span><i>${c.emoji}</i>${e(c.label)}</span></label>`).join('')}
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="edit-scene-city">City <b>*</b></label>
              <select id="edit-scene-city" name="city">
                ${cities.map(c=>`<option value="${e(c)}" ${data.city===c?'selected':''}>${e(c)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group ${editSceneModal.errors.area ? 'has-error' : ''}">
              <label for="edit-scene-area">Area <b>*</b></label>
              <input id="edit-scene-area" name="area" required maxlength="60" value="${e(data.area)}" placeholder="e.g. Gulberg"/>
              ${editSceneModal.errors.area ? `<small class="form-error-msg">${e(editSceneModal.errors.area)}</small>` : ''}
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="edit-scene-date">Date <b>*</b></label>
              <input id="edit-scene-date" name="date" type="date" required min="${new Date().toLocaleDateString('en-CA')}" value="${e(data.date)}"/>
            </div>
            <div class="form-group">
              <label for="edit-scene-time">Time (Asia/Karachi) <b>*</b></label>
              <input id="edit-scene-time" name="time" type="time" required value="${e(data.time)}"/>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="edit-scene-spots">Maximum people <b>*</b></label>
              <input id="edit-scene-spots" name="spots" type="number" required min="2" max="100" value="${Number(data.spots||8)}"/>
            </div>
            <div class="form-group">
              <label for="edit-scene-budget">Estimated PKR / person</label>
              <input id="edit-scene-budget" name="budget" type="number" min="0" max="500000" value="${Number(data.budget||0)}"/>
            </div>
          </div>

          <div class="form-group ${editSceneModal.errors.description ? 'has-error' : ''}">
            <label for="edit-scene-desc">Tell people what to expect <b>*</b></label>
            <textarea id="edit-scene-desc" name="description" required minlength="15" maxlength="500" rows="3" placeholder="What's the vibe, what should they bring, and who is welcome?">${e(data.description)}</textarea>
            ${editSceneModal.errors.description ? `<small class="form-error-msg">${e(editSceneModal.errors.description)}</small>` : `<small>15 to 500 characters.</small>`}
          </div>

          <div class="form-group">
            <label for="edit-scene-venue">Meetup details</label>
            <input id="edit-scene-venue" name="venue" maxlength="100" value="${e(data.venue)}" placeholder="e.g. Cafe in Gulberg (shared after approval)"/>
            <small>General description or meeting place.</small>
          </div>

          <div class="form-group">
            <label>Privacy</label>
            <div class="privacy-options">
              <label><input type="radio" name="privacy" value="public" ${data.privacy==='public'?'checked':''}/><span>${ic('users',17)}<strong>Public scene</strong><small>Visible in discovery; you approve requests.</small></span></label>
              <label><input type="radio" name="privacy" value="private" ${data.privacy==='private'?'checked':''}/><span>${ic('lock',17)}<strong>Private scene</strong><small>Accessible only by invitation link.</small></span></label>
            </div>
          </div>
        </div>

        <div class="edit-profile-actions">
          <button type="button" class="button edit-cancel-btn" data-action="close-edit-scene" ${editSceneModal.loading ? 'disabled' : ''}>Cancel</button>
          <button type="submit" class="button submit-button edit-save-btn" ${editSceneModal.loading ? 'disabled' : ''}>
            ${editSceneModal.loading ? `<span class="spinner"></span> <span>Saving...</span>` : `Save Changes ${ic('check', 16)}`}
          </button>
        </div>
      </form>
    </div>
  </div>`;
}

function save(){try{localStorage.setItem(KEY,JSON.stringify(store))}catch{}}
function dateFor(s){
  if(s.startsAt instanceof Date) return s.startsAt;
  if(s.startsAt && typeof s.startsAt.toDate === 'function') return s.startsAt.toDate();
  if(s.date) return new Date(s.date+'T'+(s.time||'18:00')+':00');
  const d=new Date();
  d.setDate(d.getDate()+(s.timeOffset||0));
  d.setHours(s.hour||18,s.minute||0,0,0);
  return d;
}
function dateLabel(s){const d=dateFor(s),today=new Date();const a=new Date(today.getFullYear(),today.getMonth(),today.getDate());const b=new Date(d.getFullYear(),d.getMonth(),d.getDate());const days=Math.round((b-a)/86400000);return (days===0?'Today':days===1?'Tomorrow':d.toLocaleDateString('en-PK',{weekday:'short',month:'short',day:'numeric'}))+' · '+d.toLocaleTimeString('en-PK',{hour:'numeric',minute:'2-digit',hour12:true});}
function dateShort(s){const d=dateFor(s),t=new Date();const off=Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-new Date(t.getFullYear(),t.getMonth(),t.getDate()))/86400000);return off===0?'TODAY':off===1?'TOMORROW':d.toLocaleDateString('en-PK',{weekday:'short'}).toUpperCase()}
const allScenes=()=>{
  const map = new Map();
  myHostedScenes.forEach(s => map.set(s.id, s));
  firestoreScenes.forEach(s => {
    if (!map.has(s.id)) map.set(s.id, s);
  });
  (store.created || []).forEach(s => {
    if (!map.has(s.id)) map.set(s.id, s);
  });
  seed.forEach(s => {
    if (!map.has(s.id)) map.set(s.id, { ...s, isDemo: true });
  });
  return Array.from(map.values());
};
const getScene=id=>allScenes().find(s=>s.id===id);
const remain=s=>Math.max(0,s.spots-s.going-(store.requested.includes(s.id)?0:0));
const matching=(arr=allScenes())=>arr.filter(s=>{
  if (s.status === 'cancelled' && !s.isMine) return false;
  if ((store.blockedHosts || []).includes(s.host)) return false;
  if (((s.privacy||'Public').toLowerCase() === 'private') && !s.isMine) return false;
  if (store.city !== 'All Pakistan' && s.city !== store.city) return false;
  if (ui.category !== 'all' && s.category !== ui.category) return false;
  if (ui.search) {
    const hay = [s.title, s.area, s.category, s.description, s.city, s.host].join(' ').toLowerCase();
    if (!hay.includes(ui.search.toLowerCase())) return false;
  }
  if (ui.when === 'today') {
    if (dateShort(s) !== 'TODAY') return false;
  } else if (ui.when === 'weekend') {
    const day = dateFor(s).getDay();
    if (![0, 6].includes(day)) return false;
  } else if (ui.when === 'free') {
    if (Number(s.budget) !== 0) return false;
  }
  return true;
}).sort((a,b)=>dateFor(a)-dateFor(b));
function avatar(initials,tone='peach',extra=''){return `<span class="avatar avatar-${e(tone)} ${extra}" aria-label="${e(initials)}">${e(initials)}</span>`}
function avatars(n=3){const cols=['pink','blue','yellow','green'];return `<span class="avatar-stack">${Array.from({length:Math.min(n,4)},(_,i)=>avatar(['HS','ZR','AK','MK'][i],cols[i],'tiny')).join('')}</span>`}
function image(s){return `<img src="./assets/${e(s.image)}.svg" alt="${e(s.category)} illustration" loading="lazy"/>`}
function chipLabel(s){return `<span class="mini-tag mini-${e(s.category)}">${e(categories.find(c=>c.id===s.category)?.emoji||'✳')} ${e(categories.find(c=>c.id===s.category)?.label||'Scene')}</span>`}
function price(s){return s.budget===0?'Free':`Rs ${Number(s.budget).toLocaleString('en-PK')}`}
function navLink(route,label,ico,active){return `<button class="nav-link ${active?'active':''}" data-route="${route}" aria-label="${label}" ${active?'aria-current="page"':''}><span class="nav-icon">${ic(ico,21)}</span><span>${label}</span></button>`}
function nav(selected){return `<nav class="desktop-nav" aria-label="Main navigation">${navLink('discover','Discover','home',selected==='discover')}${navLink('explore','Explore','compass',selected==='explore')}${navLink('create','Create a scene','plus',selected==='create')}${navLink('my-scenes','My scenes','calendar',selected==='my-scenes')}${navLink('inbox','Notifications','bell',selected==='inbox')}${navLink('community','Communities','users',selected==='community')}${navLink('profile','My profile','user',selected==='profile')}</nav>`}
function mobileNav(selected){return `<nav class="mobile-nav" aria-label="Bottom navigation">${navLink('discover','Home','home',selected==='discover')}${navLink('explore','Explore','compass',selected==='explore')}<button class="mobile-create" data-route="create" aria-label="Create a scene"><span>${ic('plus',26)}</span><small>Create</small></button>${navLink('my-scenes','My scenes','calendar',selected==='my-scenes')}${navLink('profile','Profile','user',selected==='profile')}</nav>`}
function logo(){return `<div class="wordmark"><span class="brand-symbol">s<span>✳</span></span><span class="word-text">scene<span class="word-dot">.</span>hai<span class="word-q">?</span></span></div>`}
function topbar(){
  let profileBtn = '';
  if (currentUser) {
    if (currentUser.photoURL) {
      profileBtn = `<button class="profile-avatar has-photo" data-route="profile" aria-label="Profile"><img src="${e(currentUser.photoURL)}" alt="Profile" referrerpolicy="no-referrer" class="topbar-avatar-img"/></button>`;
    } else {
      const initials = getActiveDisplayName().split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
      profileBtn = `<button class="profile-avatar" data-route="profile" aria-label="Profile">${e(initials)}</button>`;
    }
  } else {
    profileBtn = `<button class="guest-signin-btn" data-action="open-login" aria-label="Sign in with Google">${ic('user', 15)} <span>Sign in</span></button>`;
  }

  return `<header class="topbar"><div class="mobile-brand">${logo()}</div><div class="location-block"><span class="location-prefix">YOUR CITY</span><button class="location-button" data-action="toggle-city">${ic('pin',16)} <strong>${e(store.city)}</strong> ${ic('chevron',14)}</button>${ui.cityOpen?`<div class="city-menu">${[...cities,'All Pakistan'].map(c=>`<button data-action="city" data-city="${e(c)}">${e(c)} ${store.city===c?ic('check',15):''}</button>`).join('')}</div>`:''}</div><span class="topbar-spacer"></span><span class="demo-label">${currentUser ? '● CONNECTED' : '● GUEST MODE'}</span><button class="icon-button notif-button" data-route="inbox" aria-label="Notifications">${ic('bell',21)}${store.notifications.some(n=>!n.seen)?'<span class="red-dot"></span>':''}</button>${profileBtn}</header>`;
}
function sidePanel(){const upcoming=allScenes().filter(s=>s.city===store.city).sort((a,b)=>dateFor(a)-dateFor(b)).slice(0,3);return `<aside class="right-rail"><div class="right-rail-head"><span class="tiny-overline">YOUR SOCIAL ERA</span><h2>Less scrolling.<br/>More stories.</h2><div class="side-squiggle">✳</div><p>Your next great memory is probably one good plan away.</p><button class="rail-cta" data-route="create">Make a scene ${ic('arrow',17)}</button></div><section class="rail-panel"><div class="rail-section-title"><strong>Coming up around you</strong><span>✦</span></div>${upcoming.map(s=>`<button class="mini-event" data-route="scene/${e(s.id)}"><span class="mini-event-thumb">${image(s)}</span><span><b>${e(s.title)}</b><small>${e(dateShort(s))} · ${e(s.area)}</small></span>${ic('arrow',15)}</button>`).join('')}</section><div class="rail-footer">Made for real people, real plans, real life. <span>✳</span><br/>Scene Hai? · Design preview</div></aside>`}
function sectionHeading(kicker,title,action){return `<div class="section-heading"><div><div class="section-kicker">${kicker}</div><h2>${title}</h2></div>${action?`<button class="text-link" data-route="${action}">See all ${ic('arrow',16)}</button>`:''}</div>`}
function categoryStrip(){return `<div class="category-strip" aria-label="Filter scenes by category">${categories.map(c=>`<button class="category-pill ${ui.category===c.id?'selected':''}" data-action="category" data-category="${c.id}"><span class="category-emoji ${c.tone}">${c.emoji}</span>${e(c.label)}</button>`).join('')}</div>`}
function card(s,kind='normal'){
 const isPending = (s.isFirestore && currentUser && myJoinRequests[s.id] === 'pending') || (!s.isFirestore && store.requested.includes(s.id));
 const joined=store.joined.includes(s.id);
 const isCancelled = s.status === 'cancelled';
 let statusBadge = '';
 if (isCancelled) {
   statusBadge = '<span class="card-status cancelled-status">Cancelled</span>';
 } else if (s.isFirestore) {
   statusBadge = '<span class="card-status live-status">● Live</span>';
 } else if (s.isDemo) {
   statusBadge = '<span class="card-status demo-status">Demo</span>';
 }
 return `<article class="scene-card ${kind==='wide'?'wide-scene':''} ${isCancelled?'is-cancelled':''}" data-route="scene/${e(s.id)}" tabindex="0" role="link" aria-label="View ${e(s.title)}">
  <div class="scene-media">${image(s)}<div class="scene-media-top">${chipLabel(s)}<button class="save-button ${store.saved.includes(s.id)?'is-saved':''}" data-action="save" data-id="${e(s.id)}" aria-label="${store.saved.includes(s.id)?'Remove saved scene':'Save scene'}">${ic('heart',18)}</button></div><span class="scene-date">${e(dateShort(s))}</span></div>
  <div class="scene-info"><div class="scene-meta">${ic('pin',13)} ${e(s.area)} <span class="bullet">·</span> ${e(dateLabel(s))}</div><h3>${e(s.title)}</h3><div class="scene-bottom"><div class="scene-people">${avatars()}<span>${s.going} going · <b>${remain(s)} spots left</b></span></div><span class="scene-price">${price(s)} <small>${s.budgetType==='Free entry'?'': '/ person'}</small></span></div></div>
  ${statusBadge}
  ${isPending?'<span class="card-status" style="right:auto;left:14px">Requested</span>':''}${joined?'<span class="card-status joined-status" style="right:auto;left:14px">Joined ✓</span>':''}
 </article>`;
}
function featured(s){if(!s) return '';
 return `<div class="spotlight ${e(s.category)}"><div class="spotlight-info"><span class="featured-eyebrow"><span class="spark-tiny">✳</span> THE SPOTLIGHT</span><h2>${e(s.title)}</h2><p>${e(s.area)}, ${e(s.city)} <span>·</span> ${e(dateLabel(s))}</p><div class="featured-foot"><span class="featured-price">${price(s)} <small>/ person</small></span><button data-route="scene/${e(s.id)}" class="spotlight-button" aria-label="Explore ${e(s.title)}">Explore scene ${ic('arrow',17)}</button></div></div><div class="spotlight-visual">${image(s)}<span class="sticker sticker-rotate">${remain(s)} SPOTS<br/>LEFT!</span></div></div>`;
}
function renderDiscover(){
  const matches=matching();
  const featuredScene=matches.find(s=>s.feature)||matches[0];
  const todays=matches.filter(s=>dateShort(s)==='TODAY'&&s.id!==featuredScene?.id);
  const more=matches.filter(s=>s.id!==featuredScene?.id&&!todays.some(t=>t.id===s.id)).slice(0,4);

  return `<div class="view discover-page"><section class="hero"><div class="hero-copy"><div class="hero-tag"><span>✳</span> PLAN KAM, SCENE ZYADA!</div><h1>Good plans.<br/><em>Better</em> people<span class="hero-period">.</span></h1><p>Aaj kya scene hai? Meet your people, find your vibe, and make plans worth leaving home for.</p></div><div class="hero-doodles" aria-hidden="true"><span class="doodle-star">✳</span><span class="doodle-orbit">↗</span><span class="doodle-burst">✦</span></div></section>
 <div class="search-box">${ic('search',21)}<input aria-label="Search activities" data-input="search" id="search-home" placeholder="Search futsal, chai, Gulberg..." value="${e(ui.search)}"/><button aria-label="Explore results" data-route="explore">${ic('arrow',19)}</button></div>
 <div class="categories-header"><span class="tiny-overline">PICK YOUR VIBE</span><span class="swipe-note">Swipe to explore ${ic('arrow',14)}</span></div>${categoryStrip()}
 <div class="section-heading">
   <div><div class="section-kicker"><span class="red-circle"></span> NOT TO MISS</div><h2>The scene of the day</h2></div>
   <button class="refresh-scenes-btn" data-action="refresh-scenes" title="Sync scenes from Cloud Firestore">${ic('spark',14)} <span>${scenesLoading ? 'Syncing...' : 'Live sync'}</span></button>
 </div>
 ${featuredScene?featured(featuredScene):`<div class="empty-state">No scenes match this search. Try another vibe.</div>`}
 ${sectionHeading('MADE FOR RIGHT NOW','Happening today <span class="heading-emoji">🔥</span>','explore')}
 <div class="cards-grid">${(todays.length?todays:more.slice(0,2)).map(s=>card(s)).join('')}</div>
 <div class="break-banner"><div><span>GOT A PLAN?</span><h3>Be the reason<br/>people show up.</h3><button data-route="create">Create your scene ${ic('arrow',18)}</button></div><div class="banner-art" aria-hidden="true"><span>☕</span><span>⚡</span><span>🎮</span><span>✳</span></div></div>
 ${sectionHeading('KEEP THE GOOD TIMES ROLLING','More to explore','explore')}<div class="cards-grid">${more.slice(0,4).map(s=>card(s)).join('')}</div></div>`;
}
function renderExplore(){
  const list=matching();
  return `<div class="view"><div class="page-title-top"><span class="tiny-overline">FIND YOUR NEXT STORY</span><h1>Explore <span class="asterisk">✳</span></h1><p>Your city. Your people. Your kind of plans.</p></div>
  <div class="search-box explore-search">${ic('search',20)}<input data-input="search" id="search-explore" aria-label="Search scenes" placeholder="Activities, areas, people..." value="${e(ui.search)}"/>${ui.search?`<button data-action="clear-search" aria-label="Clear search">${ic('close',17)}</button>`:''}</div>
  <div class="filter-heading">${ic('filter',16)} FILTER BY VIBE</div>${categoryStrip()}
  <div class="time-strip">${[['any','Anytime'],['today','Today'],['weekend','Weekend'],['free','Free only']].map(([id,l])=>`<button data-action="when" data-when="${id}" class="time-chip ${ui.when===id?'selected':''}">${l}</button>`).join('')}</div>
  <div class="results-head">
    <h2>${list.length} scenes to explore</h2>
    <div style="display:flex;align-items:center;gap:10px">
      <button class="refresh-scenes-btn" data-action="refresh-scenes">${ic('spark',14)} <span>${scenesLoading ? 'Refreshing...' : 'Refresh live'}</span></button>
      <span>${e(store.city)}</span>
    </div>
  </div>
  ${scenesError ? `<div class="modal-error-banner" style="margin-bottom:16px"><span>${e(scenesError)}</span><button data-action="refresh-scenes">Retry</button></div>` : ''}
  <div class="cards-grid explore-grid">${list.map(s=>card(s)).join('')}</div>
  ${!list.length?`<div class="empty-state"><span>🔎</span><h3>No scenes this time.</h3><p>Try a different category, city or search.</p><button class="button dark" data-action="reset-filters">Clear filters ${ic('arrow',16)}</button></div>`:''}</div>`;
}
function renderCreate(){
  const guestNotice = !currentUser ? `<div class="safety-note" style="background:#fff3e0;border:1px solid #ffe0b2;color:#b26a00;margin-bottom:24px">${ic('lock',20)} <span><strong>Guest Mode.</strong> You can draft your scene now. When you tap "Publish my scene", you will be prompted to sign in with Google.</span></div>` : '';

  return `<div class="view form-page"><div class="page-title-top"><span class="tiny-overline">THE GROUP CHAT CAN WAIT</span><h1>Make a <em>scene.</em> <span class="asterisk">✳</span></h1><p>You bring the idea. We bring the people.</p></div>${guestNotice}<div class="create-banner"><div><span>✦ YOUR PLAN, YOUR RULES</span><strong>It starts with<br/>one good idea.</strong></div><span class="create-banner-emoji">⚡</span></div><form id="create-form" class="scene-form">
 <div class="form-group"><label for="scene-title">What's the plan? <b>*</b></label><input id="scene-title" name="title" maxlength="70" minlength="5" required placeholder="e.g. Late-night chai in Gulberg"/><small>Give it a name people actually want to click (5–70 characters).</small></div>
 <div class="form-group"><label>Pick a vibe <b>*</b></label><div class="create-category-grid">${categories.filter(c=>c.id!=='all').map((c,i)=>`<label class="create-category-option"><input type="radio" name="category" value="${c.id}" ${i===0?'checked':''}/><span><i>${c.emoji}</i>${e(c.label)}</span></label>`).join('')}</div></div>
 <div class="form-grid"><div class="form-group"><label for="scene-city">City <b>*</b></label><select id="scene-city" name="city">${cities.map(c=>`<option ${store.city===c?'selected':''}>${e(c)}</option>`).join('')}</select></div><div class="form-group"><label for="scene-area">Area <b>*</b></label><input id="scene-area" name="area" required maxlength="60" placeholder="e.g. Gulberg"/></div></div>
 <div class="form-grid"><div class="form-group"><label for="scene-date">Date <b>*</b></label><input id="scene-date" name="date" type="date" required min="${new Date().toLocaleDateString('en-CA')}"/></div><div class="form-group"><label for="scene-time">Time (Asia/Karachi) <b>*</b></label><input id="scene-time" name="time" type="time" required value="18:00"/></div></div>
 <div class="form-grid"><div class="form-group"><label for="scene-spots">Maximum people <b>*</b></label><input id="scene-spots" name="spots" type="number" required min="2" max="100" value="8"/></div><div class="form-group"><label for="scene-budget">Estimated PKR / person</label><input id="scene-budget" name="budget" type="number" min="0" max="500000" value="0"/></div></div>
 <div class="form-group"><label for="scene-desc">Tell people what to expect <b>*</b></label><textarea id="scene-desc" name="description" required minlength="15" maxlength="500" rows="4" placeholder="What's the vibe, what should they bring, and who is welcome?"></textarea><small>15 to 500 characters.</small></div>
 <div class="form-group"><label for="scene-venue">Meetup details</label><input id="scene-venue" name="venue" maxlength="100" placeholder="e.g. Cafe in Gulberg (shared after approval)"/><small>For safety, share general meetup landmarks.</small></div>
 <div class="form-group"><label>Privacy</label><div class="privacy-options"><label><input type="radio" name="privacy" value="public" checked/><span>${ic('users',17)}<strong>Public scene</strong><small>Visible in discovery; you approve requests.</small></span></label><label><input type="radio" name="privacy" value="private"/><span>${ic('lock',17)}<strong>Private scene</strong><small>Accessible only by invitation link.</small></span></label></div></div>
 <div class="safety-note">${ic('shield',20)} <span><strong>Keep it safe.</strong> Meet in public spaces, respect boundaries, and never share sensitive personal details in a public description.</span></div>
 <button class="button submit-button" type="submit" ${createSceneLoading ? 'disabled' : ''}>
   ${createSceneLoading ? `<span class="spinner"></span> <span>Publishing to Firestore...</span>` : `Publish my scene ${ic('arrow',18)}`}
 </button>
 <p class="form-disclaimer">${currentUser ? 'Live: your scene will be published directly to Cloud Firestore.' : 'Sign in with Google to publish your scene live.'}</p>
 </form></div>`;
}
function myItem(s,tag){
  const isCancelled = s.status === 'cancelled';
  let hostActions = '';
  if (tag === 'Hosting') {
    hostActions = `
      <button data-action="edit-scene" data-id="${e(s.id)}">${ic('edit',14)} Edit</button>
      ${!isCancelled ? `<button class="host-action-btn-danger" data-action="cancel-scene" data-id="${e(s.id)}">${ic('close',14)} Cancel</button>` : ''}
      <button data-action="share" data-id="${e(s.id)}">${ic('share',14)} Share</button>
    `;
  }
  return `<div class="my-row ${isCancelled?'is-cancelled':''}">
    <div class="my-image" data-route="scene/${e(s.id)}">${image(s)}</div>
    <div class="my-info">
      <span>${e(s.area)} · ${e(dateShort(s))} ${s.isFirestore?'<b style="color:#206a2e;font-size:10px">· LIVE</b>':''}</span>
      <h3>${e(s.title)}</h3>
      <small>${isCancelled ? '<b style="color:#c62828">Cancelled</b> · ' : ''}${tag} · ${s.going}/${s.spots} going</small>
      <div class="my-actions">
        <button data-route="scene/${e(s.id)}">View scene ${ic('arrow',14)}</button>
        ${tag==='Joined'?`<button data-route="chat/${e(s.id)}">${ic('message',15)} Chat</button>`:hostActions}
      </div>
    </div>
  </div>`;
}
function renderMy(){
  const hosted=allScenes().filter(s=>s.isMine);
  const joined=allScenes().filter(s=>store.joined.includes(s.id));
  const requested=allScenes().filter(s=>store.requested.includes(s.id));
  const pendingCount = currentUser ? hostJoinRequests.length : store.incoming.filter(q=>q.status==='pending').length;

  let requestsContent = '';
  if (currentUser) {
    if (hostJoinRequestsLoading) {
      requestsContent = `<div style="padding:40px;text-align:center;color:#6b677a"><span class="spinner"></span> Loading pending join requests...</div>`;
    } else if (hostJoinRequests.length) {
      requestsContent = `<h2 class="requests-title">Waiting for your okay (${hostJoinRequests.length})</h2>` +
        hostJoinRequests.map(q => `<div class="request-card">
          ${avatar(q.initials, 'blue')}
          <div style="flex:1">
            <strong>${e(q.name)} wants to join</strong>
            <span>${e(q.sceneTitle)} · ${e(q.ago)}</span>
            <div class="request-pending-pill" style="margin-top:6px">● PENDING REVIEW</div>
            <div class="request-actions">
              <button class="accept-btn" disabled title="Approvals will be enabled in Phase 3.3B">${ic('check',15)} Approve (Phase 3.3B)</button>
              <button class="decline-btn" disabled title="Declines will be enabled in Phase 3.3B">Decline (Phase 3.3B)</button>
              <button class="view-scene-sub-btn" data-route="scene/${e(q.sceneId)}">View scene ${ic('arrow',13)}</button>
            </div>
            <div class="request-lock-note">
              Host approvals and decline actions will be enabled in Phase 3.3B.
            </div>
          </div>
        </div>`).join('');
    } else {
      requestsContent = emptyMy('All caught up!', 'No new join requests for your scenes.', 'hosting', 'See hosted scenes');
    }
  } else {
    const demoPending = store.incoming.filter(q=>q.status==='pending');
    requestsContent = demoPending.length
      ? `<h2 class="requests-title">Waiting for your okay</h2>` + demoPending.map(q=>`<div class="request-card">${avatar(q.initials,'blue')}<div><strong>${e(q.name)} wants to join</strong><span>${e(getScene(q.sceneId)?.title||'Scene')}</span><p>“${e(q.message)}”</p><div class="request-actions"><button data-action="approve" data-id="${e(q.id)}" class="accept-btn">${ic('check',15)} Approve</button><button data-action="decline" data-id="${e(q.id)}" class="decline-btn">Decline</button></div></div></div>`).join('')
      : emptyMy('All caught up!','No new join requests.','hosting','See hosted scenes');
  }

  return `<div class="view"><div class="page-title-top"><span class="tiny-overline">YOUR PEOPLE, YOUR PLANS</span><h1>My scenes<span class="asterisk">✳</span></h1><p>All the good stuff you've got going on.</p></div>
  <div class="my-stats"><div><strong>${joined.length}</strong><span>Joined</span></div><div><strong>${hosted.length}</strong><span>Hosting</span></div><div><strong>${pendingCount}</strong><span>Requests to review</span></div></div>
  <div class="tabs">${[['going','Going'],['hosting','Hosting'],['requests',`Requests ${pendingCount?'('+pendingCount+')':''}`]].map(([k,v])=>`<button data-action="mytab" data-tab="${k}" class="${ui.myTab===k?'active':''}">${v}</button>`).join('')}</div>
  <div class="my-content">${ui.myTab==='going'?(joined.length?joined.map(s=>myItem(s,'Joined')).join(''):emptyMy('Nothing on the calendar yet','Explore scenes and find your people.','explore','Explore scenes')):ui.myTab==='hosting'?(myHostedLoading?`<div style="padding:40px;text-align:center;color:#6b677a"><span class="spinner"></span> Loading your hosted scenes from Cloud...</div>`:hosted.length?hosted.map(s=>myItem(s,'Hosting')).join(''):emptyMy('You haven\'t hosted one yet','Good plans start with someone.','create','Create a scene')):requestsContent}</div></div>`;
}
function emptyMy(title,body,to,label){return `<div class="empty-state"><span>✳</span><h3>${title}</h3><p>${body}</p><button class="button dark" data-route="${to}">${label} ${ic('arrow',16)}</button></div>`}
function renderInbox(){const notifs=store.notifications.filter(n=>ui.inboxTab==='all'||(ui.inboxTab==='unread'&&!n.seen));return `<div class="view"><div class="page-title-top"><span class="tiny-overline">STAY IN THE LOOP</span><h1>What's new<span class="asterisk">?</span></h1><p>Plans change. Good vibes don't.</p></div><div class="inbox-head"><div class="tabs compact-tabs"><button class="${ui.inboxTab==='all'?'active':''}" data-action="inboxtab" data-tab="all">All</button><button class="${ui.inboxTab==='unread'?'active':''}" data-action="inboxtab" data-tab="unread">Unread</button></div><button class="text-link" data-action="mark-read">Mark all read</button></div><div class="notification-list">${notifs.length?notifs.map(n=>`<div class="notification-card ${!n.seen?'unread':''}"><span class="notification-symbol">${n.type==='safety'?'🛡️':n.type==='approval'?'🎉':'⚡'}</span><div><div class="notif-title">${e(n.title)}</div><p>${e(n.body)}</p><small>${e(n.ago)} · ${n.type==='welcome'?'Getting started':n.type==='safety'?'Safety':'Update'}</small></div>${!n.seen?'<span class="notification-unread-dot"></span>':''}</div>`).join(''):emptyMy('You are all caught up','No unread updates right now.','explore','Find a scene')}</div><div class="inbox-hint">${ic('info',16)} These are sample notifications. Live notifications require a backend.</div></div>`}
function renderProfile(){
  if (!currentUser) {
    return `<div class="view">
      <div class="page-title-top"><span class="tiny-overline">YOUR CORNER</span><h1>Your space<span class="asterisk">✳</span></h1><p>Connect with real people and make real plans.</p></div>
      <div class="profile-guest-card">
        <div class="profile-guest-badge">s✳</div>
        <h2>Welcome to Scene Hai?</h2>
        <p>Sign in with your Google account to create and host scenes, RSVP to local hangouts, chat with attendees, and save your favorite vibes.</p>
        <button class="google-auth-btn primary" data-action="login" style="max-width:320px;margin:0 auto">
          ${googleLogo()}
          <span>Continue with Google</span>
        </button>
      </div>
      <div class="profile-metrics"><div><strong>0</strong><small>Scenes joined</small></div><div><strong>0</strong><small>Scenes hosted</small></div><div><strong>${store.saved.length}</strong><small>Saved in browser</small></div></div>
      <section class="profile-section"><div class="profile-section-head"><div><span class="tiny-overline">YOUR PERSONAL MIX</span><h2>Things you're into</h2></div><small>Sign in to customize</small></div><div class="interest-grid">${categories.filter(c=>c.id!=='all').map(c=>`<button class="interest ${store.interests.includes(c.id)?'selected':''}" data-action="interest" data-id="${c.id}">${c.emoji} ${e(c.label)} ${store.interests.includes(c.id)?ic('check',15):''}</button>`).join('')}</div></section>
      <section class="profile-section"><div class="profile-section-head"><div><span class="tiny-overline">SAVED IN THIS BROWSER</span><h2>Saved scenes</h2></div></div>${store.saved.length?`<div class="saved-list">${store.saved.map(id=>getScene(id)).filter(Boolean).map(s=>myItem(s,'Saved')).join('')}</div>`:`<div class="small-empty">Nothing saved yet. Tap the ♡ on a scene to keep it here.</div>`}</section>
      <div class="profile-quick-links"><button data-route="community">${ic('users',20)} <span><b>Friends & groups</b><small>Find your kind of people</small></span>${ic('arrow',17)}</button><button data-route="safety">${ic('shield',20)} <span><b>Safety centre</b><small>Reports, blocking & meetup tips</small></span>${ic('arrow',17)}</button></div>
      <div class="profile-footer-note">Made for getting off your phone (ironically).<br/><b>Scene Hai?</b> · Plan Kam, Scene Zyada!</div>
    </div>`;
  }

  const prof = getActiveProfile();
  const name = getActiveDisplayName();
  const email = currentUser.email || '';
  const city = (prof && prof.city) || store.city || 'Lahore';
  const area = (prof && prof.area) || '';
  const bio = (prof && prof.bio) || '';
  const initials = name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
  const avatarHtml = currentUser.photoURL
    ? `<div class="profile-large-avatar has-photo"><img src="${e(currentUser.photoURL)}" alt="${e(name)}" referrerpolicy="no-referrer"/></div>`
    : `<div class="profile-large-avatar">${e(initials)}</div>`;

  return `<div class="view">
    <div class="page-title-top"><span class="tiny-overline">THE PERSON BEHIND THE PLANS</span><h1>Your corner<span class="asterisk">✳</span></h1><p>Show up as yourself. That's the whole point.</p></div>
    <div class="profile-banner">
      <div class="profile-decoration">✳</div>
      ${avatarHtml}
      <h2>${e(name)}</h2>
      <div class="profile-location-row">
        <span>${ic('pin',15)} ${e(area ? `${area}, ${city}` : city)}</span>
        <span class="bullet">·</span>
        <span>${e(email)}</span>
      </div>
      ${bio ? `<p class="profile-bio-text">“${e(bio)}”</p>` : ''}
      <div style="display:flex;justify-content:center;margin-top:6px">
        ${profileLoading 
          ? `<span style="font-size:11px;color:#5a5468;display:inline-flex;align-items:center;gap:6px"><span class="spinner"></span> Syncing with Cloud Firestore...</span>`
          : `<div class="firestore-sync-badge">${ic('shield', 13)} <span>Cloud Profile · Synced to Firestore</span></div>`
        }
      </div>
      <div class="profile-btn-row">
        <button class="profile-edit" data-action="open-edit-profile">${ic('edit',15)} Edit profile</button>
        <button class="profile-edit btn-signout" data-action="logout">${ic('logout',15)} Sign out</button>
      </div>
    </div>
    <div class="profile-metrics"><div><strong>${store.joined.length}</strong><small>Scenes joined</small></div><div><strong>${allScenes().filter(s=>s.isMine).length}</strong><small>Scenes hosted</small></div><div><strong>${store.saved.length}</strong><small>Saved</small></div></div>
    <section class="profile-section"><div class="profile-section-head"><div><span class="tiny-overline">YOUR PERSONAL MIX</span><h2>Things you're into</h2></div><small>Tap to change</small></div><div class="interest-grid">${categories.filter(c=>c.id!=='all').map(c=>`<button class="interest ${store.interests.includes(c.id)?'selected':''}" data-action="interest" data-id="${c.id}">${c.emoji} ${e(c.label)} ${store.interests.includes(c.id)?ic('check',15):''}</button>`).join('')}</div></section>
    <section class="profile-section"><div class="profile-section-head"><div><span class="tiny-overline">YOUR LITTLE COLLECTION</span><h2>Saved scenes</h2></div></div>${store.saved.length?`<div class="saved-list">${store.saved.map(id=>getScene(id)).filter(Boolean).map(s=>myItem(s,'Saved')).join('')}</div>`:`<div class="small-empty">Nothing saved yet. Tap the ♡ on a scene to keep it here.</div>`}</section>
    <div class="profile-quick-links"><button data-route="community">${ic('users',20)} <span><b>Friends & groups</b><small>Find your kind of people</small></span>${ic('arrow',17)}</button><button data-route="safety">${ic('shield',20)} <span><b>Safety centre</b><small>Reports, blocking & meetup tips</small></span>${ic('arrow',17)}</button></div>
    <div class="profile-footer-note">Made for getting off your phone (ironically).<br/><b>Scene Hai?</b> · Plan Kam, Scene Zyada!</div>
  </div>`;
}
function renderDetail(s){
  if(!s)return renderNotFound();
  if (s.isFirestore && currentUser && !s.isMine && myJoinRequests[s.id] === undefined && !checkedRequestsSet.has(s.id)) {
    checkMyJoinRequest(s.id);
  }
  const pending=store.requested.includes(s.id),joined=store.joined.includes(s.id),hosting=!!s.isMine;
  const isCancelled = s.status === 'cancelled';
  const cancelledBanner = isCancelled 
    ? `<div class="cancelled-banner">${ic('info',18)} <span><strong>This scene has been cancelled by the host.</strong> It is no longer accepting RSVPs or join requests.</span></div>`
    : '';

  const cloudIndicator = s.isFirestore
    ? `<span class="live-indicator-pill">● LIVE CLOUD SCENE</span>`
    : (s.isDemo ? `<span class="card-status demo-status" style="position:static;display:inline-block;padding:3px 8px;font-size:10px">Demo Sample</span>` : '');

  let actionButton = '';
  if (isCancelled) {
    actionButton = `<button class="button action-join" disabled style="background:#ede8e1;color:#857e8d">Scene cancelled</button>`;
  } else if (dateFor(s) <= new Date()) {
    actionButton = `<button class="button action-join" disabled style="background:#ede8e1;color:#857e8d">Scene ended</button>`;
  } else if (hosting) {
    actionButton = `<button class="button action-join" data-action="edit-scene" data-id="${e(s.id)}">${ic('edit',16)} Edit scene</button>`;
  } else if (joined) {
    actionButton = `<button class="button action-join" data-route="chat/${e(s.id)}">Open scene chat ${ic('message',18)}</button>`;
  } else if (s.isFirestore) {
    if (!currentUser) {
      actionButton = `<button class="button action-join" data-action="join" data-id="${e(s.id)}">Request to join ${ic('arrow',18)}</button>`;
    } else if (myJoinRequests[s.id] === 'pending') {
      actionButton = `<div class="request-status-bar">
        <button class="button action-join pending-btn" disabled>
          <span class="request-pending-pill">● PENDING</span>
          <span>Request Pending</span>
        </button>
        <button class="button button-withdraw" data-action="withdraw-join" data-id="${e(s.id)}" ${joinRequestLoading ? 'disabled' : ''}>
          ${joinRequestLoading ? '...' : 'Withdraw'}
        </button>
      </div>`;
    } else if (myJoinRequests[s.id] === 'withdrawn') {
      actionButton = `<button class="button action-join" data-action="join" data-id="${e(s.id)}" ${joinRequestLoading ? 'disabled' : ''}>
        ${joinRequestLoading ? 'Submitting...' : `Request to join again ${ic('arrow',18)}`}
      </button>`;
    } else if (remain(s) > 0) {
      actionButton = `<button class="button action-join" data-action="join" data-id="${e(s.id)}" ${joinRequestLoading ? 'disabled' : ''}>
        ${joinRequestLoading ? 'Submitting...' : `Request to join ${ic('arrow',18)}`}
      </button>`;
    } else {
      actionButton = `<button class="button action-join" disabled>Scene full</button>`;
    }
  } else if (pending) {
    actionButton = `<button class="button action-join requested-action" data-action="cancel-request" data-id="${e(s.id)}">Request sent ✓ · Cancel</button>`;
  } else if (remain(s) > 0) {
    actionButton = `<button class="button action-join" data-action="join" data-id="${e(s.id)}">Request to join ${ic('arrow',18)}</button>`;
  } else {
    actionButton = `<button class="button action-join" disabled>Scene full</button>`;
  }

  return `<div class="view detail-view">
    <div class="detail-top">
      <button class="round-control" data-action="back" aria-label="Go back">${ic('back',20)}</button>
      <span>THE SCENE</span>
      <button class="round-control" data-action="share" data-id="${e(s.id)}" aria-label="Share scene">${ic('share',19)}</button>
    </div>
    <div class="detail-cover">
      ${image(s)}
      <span class="detail-date-sticker">${e(dateShort(s))}</span>
    </div>
    <div class="detail-body">
      ${cancelledBanner}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        ${chipLabel(s)}
        ${cloudIndicator}
      </div>
      <h1>${e(s.title)}</h1>
      <div class="detail-meta-list">
        <div>${ic('calendar',19)}<div><strong>${e(dateLabel(s))}</strong><small>Asia/Karachi local time</small></div></div>
        <div>${ic('pin',19)}<div><strong>${e(s.area)}, ${e(s.city)}</strong><small>${hosting||joined?e(s.venue):'Exact meetup location shared after approval'}</small></div></div>
        <div>${ic('users',19)}<div><strong>${s.going} going · ${remain(s)} spots available</strong><small>Host approves join requests</small></div></div>
      </div>
      <div class="detail-price-box">
        <div><small>${s.budgetType}</small><strong>${price(s)}</strong></div>
        <span>${s.budget===0?'No entry fee listed':'Confirm any costs with the host'}</span>
      </div>
      <section class="detail-section">
        <h2>What's the scene?</h2>
        <p>${e(s.description)}</p>
        <div class="tag-list">${(s.tags||[]).map(t=>`<span>${e(t)}</span>`).join('')}</div>
      </section>
      <section class="detail-section">
        <h2>Meet your host</h2>
        <div class="host-row">
          ${avatar(s.initials,s.hostTone)}
          <span><strong>${e(s.host)}</strong><small>${s.isFirestore ? 'Verified Host · Cloud Member' : 'Community host · Demo profile'}</small></span>
          <div class="host-chip">${hosting ? 'YOU' : 'HOST'}</div>
        </div>
      </section>
      <div class="safety-note detail-safety">
        ${ic('shield',20)}
        <span><strong>Real people, real-world safety.</strong> First meetups work best in public spaces. Report anything uncomfortable. Never send money to strangers to secure a spot.</span>
      </div>
      <div class="detail-report-actions">
        ${hosting ? `<button data-action="edit-scene" data-id="${e(s.id)}">${ic('edit',14)} Edit scene details</button>` : ''}
        ${hosting && !isCancelled ? `<button class="host-action-btn-danger" data-action="cancel-scene" data-id="${e(s.id)}">${ic('close',14)} Cancel scene</button>` : ''}
        <button data-action="report-scene" data-id="${e(s.id)}">${ic('info',14)} Report scene</button>
        ${!hosting?`<button data-action="block-host" data-id="${e(s.id)}">${ic('close',14)} Hide this host</button>`:''}
        <button data-route="safety">Safety guide ${ic('arrow',14)}</button>
      </div>
    </div>
    <div class="detail-action-bar">
      <div><small>${s.budgetType}</small><strong>${price(s)}</strong></div>
      ${actionButton}
    </div>
  </div>`;
}
function renderChat(s){if(!s)return renderNotFound();if(!store.joined.includes(s.id)&&!s.isMine)return `<div class="view"><div class="page-title-top"><h1>Approval first</h1><p>Only approved participants can access scene chat.</p></div><button class="button dark" data-route="scene/${e(s.id)}">Back to scene</button></div>`;const msgs=store.messages[s.id]||[];return `<div class="view chat-view"><div class="chat-header"><button class="round-control" data-route="scene/${e(s.id)}" aria-label="Back to scene">${ic('back',19)}</button><div class="chat-scene-icon">${image(s)}</div><div><strong>${e(s.title)}</strong><span>Demo group chat · ${s.going} participants</span></div></div><div class="chat-messages"><div class="chat-day">TODAY</div>${msgs.map(m=>`<div class="bubble ${m.from==='me'?'mine':''}">${m.from!=='me'?`<small>${e(m.name)}</small>`:''}<p>${e(m.text)}</p><time>${e(m.time)}</time></div>`).join('')}${!msgs.length?`<div class="chat-first">No messages yet. Say hello 👋</div>`:''}</div><form id="chat-form" data-id="${e(s.id)}" class="chat-compose"><input name="message" maxlength="400" aria-label="Message" placeholder="Type a message..." autocomplete="off" required/><button type="submit" aria-label="Send message">${ic('send',20)}</button></form><div class="chat-disclaimer">Offline demo — messages stay on this device.</div></div>`}
function renderCommunity(){const visible=groups.filter(g=>store.city==='All Pakistan'||g.city===store.city);return `<div class="view"><div class="page-title-top"><span class="tiny-overline">THE GOOD KIND OF GROUP CHAT</span><h1>Find your <em>people.</em> <span class="asterisk">✳</span></h1><p>Make friends before you make plans.</p></div><div class="community-hero"><div><span>✳ BETTER TOGETHER</span><h2>From hellos<br/>to hangouts.<br/>That's the scene.</h2><p>Find interest-based communities around your city.</p></div><span class="community-emoji">👋</span></div><div class="section-heading"><div><div class="section-kicker">YOUR KIND OF CROWD</div><h2>Communities</h2></div></div><div class="groups-grid">${visible.map(g=>`<div class="group-card"><div class="group-emoji ${e(g.tone)}">${g.emoji}</div><div class="group-card-body"><h3>${e(g.name)}</h3><p>${e(g.desc)}</p><span>${ic('users',13)} ${g.members} members · ${e(g.city)}</span></div><button class="group-join ${store.groupsJoined.includes(g.id)?'joined':''}" data-action="groupjoin" data-id="${e(g.id)}">${store.groupsJoined.includes(g.id)?'Joined ✓':'Join group +'}</button></div>`).join('')}</div>${!visible.length?'<div class="small-empty">No demo communities for this city yet.</div>':''}<div class="section-heading"><div><div class="section-kicker">YOU MIGHT CLICK</div><h2>Meet the crowd</h2></div></div><div class="people-grid">${people.map(p=>`<div class="person-card">${avatar(p.initials,p.tone,'person-avatar')}<strong>${e(p.name)}</strong><small>${e(p.vibe)}</small><button data-action="friend" data-id="${e(p.name)}" class="${store.friendsRequested.includes(p.name)?'requested':''}">${store.friendsRequested.includes(p.name)?'Requested ✓':'Connect +'}</button></div>`).join('')}</div><div class="community-bottom"><p><strong>Bring a friend, make a friend.</strong><br/>Share Scene Hai? with your crew.</p><button class="button dark" data-action="share-app">Invite a friend ${ic('share',17)}</button></div><p class="form-disclaimer">Demo only: group joins and connection requests are stored on this device.</p></div>`}
function renderSafety(){return `<div class="view"><div class="page-title-top"><span class="tiny-overline">GOOD VIBES. CLEAR BOUNDARIES.</span><h1>Safety first<span class="asterisk"> ✳</span></h1><p>Great plans are fun. Safe plans are non-negotiable.</p></div><div class="safety-banner">${ic('shield',34)}<div><strong>Meet smart. Stay in control.</strong><p>Approval-based meetups, reporting and blocking belong at the heart of Scene Hai?.</p></div></div><div class="safety-guides"><div><span>📍</span><h3>Keep first meetups public</h3><p>Choose well-known locations. Tell someone you trust where you're going.</p></div><div><span>🙅</span><h3>Respect a no</h3><p>Hosts and participants can decline requests and leave events without pressure.</p></div><div><span>🔒</span><h3>Protect personal details</h3><p>Exact meeting points and contact numbers should only go to approved participants.</p></div><div><span>🚩</span><h3>Report or block</h3><p>Use the scene's report and hide controls. In this prototype actions stay local and are not reviewed by moderators.</p></div></div><div class="small-empty"><strong>Design prototype disclaimer:</strong> This is not an operating trust-and-safety service. Real reporting, blocking, identity controls and moderation require a secured backend and human review.</div><button class="button dark" data-route="discover">Discover scenes ${ic('arrow',16)}</button></div>`}
function renderNotFound(){return `<div class="view empty-state"><h1>Scene not found</h1><p>It might have been removed.</p><button class="button dark" data-route="discover">Back home ${ic('arrow',17)}</button></div>`}
function route(){return (location.hash.replace(/^#\/?/,'')||'discover').replace(/^\//,'')}
function render(){
  const r=route(),tab=r.startsWith('scene/')?'explore':r.startsWith('chat/')?'my-scenes':r;
  const main=r==='discover'?renderDiscover():r==='explore'?renderExplore():r==='create'?renderCreate():r==='my-scenes'?renderMy():r==='inbox'?renderInbox():r==='profile'?renderProfile():r==='community'?renderCommunity():r==='safety'?renderSafety():r.startsWith('scene/')?renderDetail(getScene(r.split('/')[1])):r.startsWith('chat/')?renderChat(getScene(r.split('/')[1])):renderNotFound();

  const sidebarUser = currentUser ? `
    <div class="sidebar-user-card">
      <div class="sidebar-user-avatar">
        ${currentUser.photoURL ? `<img src="${e(currentUser.photoURL)}" alt="${e(getActiveDisplayName())}" referrerpolicy="no-referrer"/>` : e(getActiveDisplayName().split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase())}
      </div>
      <div class="sidebar-user-info">
        <span class="sidebar-user-name">${e(getActiveDisplayName())}</span>
        <span class="sidebar-user-email">${e(currentUser.email)}</span>
      </div>
      <button class="btn-signout" data-action="logout" style="border:0;background:none;padding:6px;cursor:pointer" title="Sign out" aria-label="Sign out">${ic('logout', 16)}</button>
    </div>
  ` : `
    <div class="sidebar-guest-card">
      <p>Signed in as <b>Guest</b></p>
      <button class="google-auth-btn" data-action="open-login">${googleLogo()}<span>Sign in</span></button>
    </div>
  `;

  $app.innerHTML=`<div class="app-shell"><aside class="sidebar"><div class="sidebar-brand">${logo()}<span>Plan Kam, Scene Zyada!</span></div><div class="nav-label">YOUR SPACE</div>${nav(tab)}<div class="sidebar-bottom"><div class="sidebar-hype"><span>✨ </span><strong>Something good is happening.</strong><p>Get out there and make a memory.</p><button data-route="create">Start a scene ${ic('arrow',17)}</button></div>${sidebarUser}<div class="sidebar-legal">SCENE HAI? © 2026 <span>·</span> FIREBASE AUTH</div></div></aside><div class="center-shell">${topbar()}<main id="main-content">${main}</main><footer class="main-footer">The best things happen offline. <span>✳</span> See you out there.</footer></div>${sidePanel()}</div>${mobileNav(tab)}${ui.toast?`<div class="toast" role="status">${ic('check',17)} ${e(ui.toast)}</div>`:''}${renderAuthModal()}${renderEditProfileModal()}${renderMigrationModal()}${renderEditSceneModal()}`;
}
function go(r){
  ui.cityOpen=false;
  if (r.startsWith('scene/')) {
    const sId = r.split('/')[1];
    if (currentUser && sId && !checkedRequestsSet.has(sId)) {
      checkMyJoinRequest(sId);
    }
  }
  if(route()===r){render();window.scrollTo({top:0,behavior:'smooth'});return}
  location.hash='/'+r;
}
function toast(text){ui.toast=text;render();clearTimeout(toast.timer);toast.timer=setTimeout(()=>{ui.toast='';render()},2600)}
function inputRefresh(el){let active=document.activeElement===el, sel=el.selectionStart; const oldScroll=window.scrollY;render();if(active){const next=document.getElementById(el.id);if(next){next.focus();next.setSelectionRange(sel,sel)}}window.scrollTo(0,oldScroll);}
function adjustSceneGoing(id,d){const s=allScenes().find(x=>x.id===id);if(s)s.going=Math.max(0,s.going+d)}
function doClick(btn,event){
  const act=btn.dataset.action,id=btn.dataset.id;
  if(btn.dataset.route){
    if(btn.dataset.route === 'create' && !currentUser){
      openAuthPrompt('Sign in with Google to create and host your own scene', { type: 'navigate', route: 'create' });
      return;
    }
    go(btn.dataset.route);
    return;
  }
  switch(act){
    case 'refresh-scenes': {
      fetchDiscoveryScenes();
      if (currentUser) {
        fetchMyHostedScenes().then(() => fetchHostJoinRequests());
      }
      toast('Syncing scenes from Cloud... ✳');
      break;
    }
    case 'edit-scene': {
      openEditScene(id);
      break;
    }
    case 'close-edit-scene': {
      closeEditScene();
      break;
    }
    case 'cancel-scene': {
      cancelHostScene(id);
      break;
    }
    case 'open-login':openAuthPrompt('Sign in with your Google account to access all features');break;
    case 'close-auth-modal':closeAuthPrompt();break;
    case 'login':loginWithGoogle(authPendingAction);break;
    case 'logout':logout();break;
    case 'toggle-city':ui.cityOpen=!ui.cityOpen;render();break;
    case 'city':store.city=btn.dataset.city;save();ui.cityOpen=false;ui.search='';ui.category='all';go('discover');render();break;
    case 'category':ui.category=btn.dataset.category;render();break;
    case 'when':ui.when=btn.dataset.when;render();break;
    case 'clear-search':ui.search='';render();break;
    case 'reset-filters':ui.when='any';ui.category='all';ui.search='';render();break;
    case 'save':{
      if(!currentUser){
        openAuthPrompt('Sign in with Google to save scenes to your profile', { type: 'save', id });
        return;
      }
      const on=store.saved.includes(id);store.saved=on?store.saved.filter(x=>x!==id):[...store.saved,id];save();toast(on?'Removed from saved':'Saved for later ♡');break;
    }
    case 'mytab':ui.myTab=btn.dataset.tab;render();break;
    case 'inboxtab':ui.inboxTab=btn.dataset.tab;render();break;
    case 'mark-read':store.notifications.forEach(n=>n.seen=true);save();toast('All caught up!');break;
    case 'open-edit-profile': openEditProfile(); break;
    case 'close-edit-profile': closeEditProfile(); break;
    case 'close-migration': closeMigrationModal(); break;
    case 'confirm-migration': handleProfileMigration(true); break;
    case 'skip-migration': handleProfileMigration(false); break;
    case 'interest':{
      if(!currentUser){
        openAuthPrompt('Sign in with Google to customize your interests and personal mix');
        return;
      }
      store.interests=store.interests.includes(id)?store.interests.filter(x=>x!==id):[...store.interests,id];
      save();
      const prof = getActiveProfile();
      if (prof) {
        prof.interests = [...store.interests];
        saveUserProfile(currentUser.uid, prof);
      }
      render();
      if (db && currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        updateDoc(userDocRef, {
          interests: [...store.interests],
          updatedAt: serverTimestamp()
        }).catch(err => handleFirestoreError(err, 'updateInterests'));
      }
      break;
    }
    case 'edit-name':{
      openEditProfile();
      break;
    }
    case 'join':{
      if(!currentUser){
        openAuthPrompt('Sign in with Google to request to join this meetup', { type: 'join', id });
        return;
      }
      const sc = allScenes().find(x => x.id === id);
      if (sc && sc.isFirestore) {
        submitJoinRequest(id);
      } else {
        if(!store.requested.includes(id)){store.requested.push(id);save();toast('Join request sent! ✨');}
      }
      break;
    }
    case 'withdraw-join':{
      if (!currentUser) return;
      withdrawJoinRequest(id);
      break;
    }
    case 'cancel-request':store.requested=store.requested.filter(x=>x!==id);save();toast('Request cancelled');break;
    case 'approve':case 'decline':{const item=store.incoming.find(x=>x.id===id);if(item){item.status=act==='approve'?'approved':'declined';if(act==='approve')adjustSceneGoing(item.sceneId,1);save();toast(act==='approve'?'Request approved — demo!':'Request declined')}break}
    case 'share-app':{const link=location.href.split('#')[0];if(navigator.share){navigator.share({title:'Scene Hai?',text:'Plan kam, scene zyada! Discover Scene Hai?',url:link}).catch(()=>{})}else if(navigator.clipboard){navigator.clipboard.writeText(link).then(()=>toast('App link copied!')).catch(()=>window.prompt('Copy this demo link:',link))}else window.prompt('Copy this demo link:',link);break}
    case 'groupjoin':{const already=store.groupsJoined.includes(id);store.groupsJoined=already?store.groupsJoined.filter(x=>x!==id):[...store.groupsJoined,id];save();toast(already?'Left demo group':'Joined demo group! ✳');break}
    case 'friend':{const already=store.friendsRequested.includes(id);store.friendsRequested=already?store.friendsRequested.filter(x=>x!==id):[...store.friendsRequested,id];save();toast(already?'Connection request cancelled':'Connection requested in demo mode');break}
    case 'report-scene':{const reason=window.prompt('Report this scene (demo only). What concerns you?');if(reason&&reason.trim()){store.reports.push({sceneId:id,reason:reason.trim(),createdAt:new Date().toISOString()});save();toast('Report saved locally. No moderator was notified.')}break}
    case 'block-host':{const sc=getScene(id);if(sc&&!sc.isMine&&window.confirm('Hide scenes from '+sc.host+' on this device?')){store.blockedHosts.push(sc.host);save();go('discover');toast('Host hidden on this device')}break}
    case 'share':{const s=getScene(id),url=location.href.split('#')[0]+'#/scene/'+encodeURIComponent(id);const t=`${s?s.title:'Scene Hai?'} — check out this scene on Scene Hai?`;if(navigator.share){navigator.share({title:t,text:t,url}).catch(()=>{})}else if(navigator.clipboard){navigator.clipboard.writeText(url).then(()=>toast('Link copied!')).catch(()=>window.prompt('Copy this demo link:',url))}else window.prompt('Copy this demo link:',url);break}
    case 'back':history.length>1?history.back():go('discover');break;
  }
}
$app.addEventListener('click',ev=>{const btn=ev.target.closest('[data-route],[data-action]');if(btn){ev.preventDefault();ev.stopPropagation();doClick(btn,ev)}});
$app.addEventListener('keydown',ev=>{const link=ev.target.closest('article.scene-card[role="link"]');if(link&&(ev.key==='Enter'||ev.key===' ')){ev.preventDefault();go(link.dataset.route)}});
window.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'){
    if(editSceneModal && editSceneModal.open){
      closeEditScene();
      return;
    }
    if(migrationModal && migrationModal.open){
      closeMigrationModal();
      return;
    }
    if(editProfileModal.open){
      closeEditProfile();
      return;
    }
    if(authModal.open){
      closeAuthPrompt();
      return;
    }
  }
});
$app.addEventListener('input',ev=>{
  if(ev.target.dataset.input==='search'){
    ui.search=ev.target.value;
    inputRefresh(ev.target);
  } else if(ev.target.id==='edit-profile-bio'){
    editProfileModal.formData.bio=ev.target.value;
    const counter=document.getElementById('bio-counter');
    if(counter) counter.textContent=`${ev.target.value.length}/160`;
  } else if(ev.target.id==='edit-profile-name'){
    editProfileModal.formData.displayName=ev.target.value;
    if(editProfileModal.errors.displayName && ev.target.value.trim().length>=2){
      delete editProfileModal.errors.displayName;
      const errEl=ev.target.closest('.form-group')?.querySelector('.form-error-msg');
      if(errEl) errEl.remove();
    }
  }
});
$app.addEventListener('submit',ev=>{
  ev.preventDefault();
  const form=ev.target;
  if(form.id==='edit-profile-form'){
    if(!currentUser) return;
    const f=new FormData(form);
    const displayName=String(f.get('displayName')||'').trim();
    const bio=String(f.get('bio')||'').trim();
    const city=String(f.get('city')||'').trim();
    const area=String(f.get('area')||'').trim();

    editProfileModal.errors={};
    editProfileModal.saveError='';
    if(!displayName||displayName.length<2){
      editProfileModal.errors.displayName='Please enter a display name (at least 2 characters).';
    }else if(displayName.length>50){
      editProfileModal.errors.displayName='Display name cannot exceed 50 characters.';
    }
    if(bio.length>160){
      editProfileModal.errors.bio='Bio cannot exceed 160 characters.';
    }
    if(!city){
      editProfileModal.errors.city='Please select a city.';
    }

    editProfileModal.formData={
      displayName,
      bio,
      city: city || 'Lahore',
      area
    };

    if(Object.keys(editProfileModal.errors).length>0){
      render();
      return;
    }

    editProfileModal.loading = true;
    render();

    const currentInterests = (activeProfile && Array.isArray(activeProfile.interests))
      ? activeProfile.interests
      : (Array.isArray(store.interests) ? store.interests : ['sports','food','gaming']);

    const profilePayload = {
      displayName,
      bio,
      city,
      area,
      interests: [...currentInterests]
    };

    (async () => {
      try {
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

        const updated={
          uid:currentUser.uid,
          ...profilePayload,
          updatedAt:new Date().toISOString()
        };

        saveUserProfile(currentUser.uid,updated);
        activeProfile=updated;
        store.name=displayName;
        store.city=city;
        store.interests=[...profilePayload.interests];
        save();

        editProfileModal.loading = false;
        closeEditProfile();
        toast('Profile saved to Cloud! ✨');
      } catch (err) {
        editProfileModal.loading = false;
        handleFirestoreError(err, 'Save User Profile');
        editProfileModal.saveError = 'Failed to persist to Cloud Firestore: ' + (err.message || 'Please check your connection and try again.');
        render();
      }
    })();
    return;
  }
  if(form.id==='edit-scene-form'){
    if(!currentUser || !editSceneModal.sceneId) return;
    const f=new FormData(form);
    const title=String(f.get('title')||'').trim();
    const desc=String(f.get('description')||'').trim();
    const cat=String(f.get('category')||'sports').trim();
    const city=String(f.get('city')||'Lahore').trim();
    const area=String(f.get('area')||'').trim();
    const venue=String(f.get('venue')||'').trim();
    const date=String(f.get('date')||'');
    const time=String(f.get('time')||'18:00');
    const spots=parseInt(f.get('spots')||'8', 10);
    const budget=Number(f.get('budget')||0);
    const privacy=String(f.get('privacy')||'public').toLowerCase();

    editSceneModal.errors={};
    editSceneModal.error='';

    if(title.length<5 || title.length>70){
      editSceneModal.errors.title='Title must be between 5 and 70 characters.';
    }
    if(desc.length<15 || desc.length>500){
      editSceneModal.errors.description='Description must be between 15 and 500 characters.';
    }
    if(!area || area.length>60){
      editSceneModal.errors.area='Please provide a valid area/neighborhood (up to 60 characters).';
    }

    const pktDateString=`${date}T${time}:00+05:00`;
    const startsAtDate=new Date(pktDateString);
    if(isNaN(startsAtDate.getTime())){
      editSceneModal.error='Please select a valid date and time.';
    }

    editSceneModal.formData={
      title,
      description: desc,
      category: cat,
      city,
      area,
      venue,
      date,
      time,
      spots,
      budget,
      privacy
    };

    if(Object.keys(editSceneModal.errors).length>0 || editSceneModal.error){
      render();
      return;
    }

    editSceneModal.loading=true;
    render();

    (async () => {
      try {
        const sceneId = editSceneModal.sceneId;
        const target = allScenes().find(s => s.id === sceneId);
        if(!target) throw new Error('Scene not found');

        if (db && target.isFirestore) {
          const updatePayload = {
            title,
            description: desc,
            category: cat,
            city,
            area,
            venue: venue || 'Meetup spot shared after approval',
            startsAt: Timestamp.fromDate(startsAtDate),
            budgetPerPerson: budget,
            maxParticipants: spots,
            privacy,
            updatedAt: serverTimestamp()
          };
          await updateDoc(doc(db, 'scenes', sceneId), updatePayload);

          const updated = formatFirestoreScene(sceneId, {
            ...target,
            ...updatePayload,
            startsAt: startsAtDate,
            hostDisplayName: target.host
          }, currentUser.uid);

          const hIdx = myHostedScenes.findIndex(s => s.id === sceneId);
          if (hIdx !== -1) myHostedScenes[hIdx] = updated;

          const dIdx = firestoreScenes.findIndex(s => s.id === sceneId);
          if (dIdx !== -1) {
            if (updated.privacy === 'Private' || updated.status === 'cancelled') {
              firestoreScenes.splice(dIdx, 1);
            } else {
              firestoreScenes[dIdx] = updated;
            }
          } else if (updated.privacy === 'Public' && updated.status === 'active') {
            firestoreScenes.unshift(updated);
          }
        } else {
          const s = store.created.find(x => x.id === sceneId);
          if (s) {
            s.title = title;
            s.description = desc;
            s.category = cat;
            s.city = city;
            s.area = area;
            s.venue = venue;
            s.date = date;
            s.time = time;
            s.spots = spots;
            s.budget = budget;
            s.privacy = privacy === 'public' ? 'Public' : 'Private';
            save();
          }
        }

        editSceneModal.loading = false;
        closeEditScene();
        toast('Scene details updated! ✨');
      } catch (err) {
        editSceneModal.loading = false;
        handleFirestoreError(err, 'editSceneForm');
        editSceneModal.error = 'Failed to update: ' + (err.message || 'Unknown error');
        render();
      }
    })();
    return;
  }
  if(form.id==='create-form'){
    if(!currentUser){
      openAuthPrompt('Sign in with Google to publish your scene', { type: 'create' });
      return;
    }
    const f=new FormData(form);
    const title=String(f.get('title')||'').trim();
    const desc=String(f.get('description')||'').trim();
    const cat=String(f.get('category')||'sports').trim();
    const city=String(f.get('city')||'Lahore').trim();
    const area=String(f.get('area')||'').trim();
    const venue=String(f.get('venue')||'').trim();
    const date=String(f.get('date')||'');
    const time=String(f.get('time')||'18:00');
    const spots=parseInt(f.get('spots')||'8', 10);
    const budget=Number(f.get('budget')||0);
    const privacy=String(f.get('privacy')||'public').toLowerCase();

    if(title.length<5 || title.length>70){
      toast('Title must be between 5 and 70 characters.');
      return;
    }
    if(desc.length<15 || desc.length>500){
      toast('Tell people what to expect (15 to 500 characters).');
      return;
    }
    if(!area || area.length>60){
      toast('Please enter an area or neighborhood.');
      return;
    }

    const pktDateString=`${date}T${time}:00+05:00`;
    const startsAtDate=new Date(pktDateString);
    if(isNaN(startsAtDate.getTime())){
      toast('Invalid date or time selected.');
      return;
    }
    if(startsAtDate.getTime() <= Date.now()){
      toast('Please select a date and time in the future (Asia/Karachi).');
      return;
    }

    createSceneLoading = true;
    render();

    (async () => {
      try {
        if (!db) throw new Error('Firestore is not initialized.');

        // Verify and ensure Firestore profile exists for authenticated user
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        let hostDisplayName = getActiveDisplayName();

        if (!userSnap.exists()) {
          const initialProf = {
            displayName: String(hostDisplayName).slice(0, 50).trim(),
            bio: '',
            city: String(city || store.city || 'Lahore').slice(0, 50).trim(),
            area: String(area || '').slice(0, 60).trim(),
            interests: Array.isArray(store.interests) && store.interests.length ? store.interests.slice(0, 15) : ['sports','food','gaming'],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await setDoc(userDocRef, initialProf);
          activeProfile = { ...initialProf, uid: currentUser.uid };
          saveUserProfile(currentUser.uid, activeProfile);
        } else {
          hostDisplayName = userSnap.data().displayName || hostDisplayName;
        }

        const scenePayload = {
          hostId: currentUser.uid,
          hostDisplayName: String(hostDisplayName).slice(0, 50).trim(),
          title: title,
          description: desc,
          category: cat,
          city: String(city).slice(0, 50).trim(),
          area: String(area).slice(0, 60).trim(),
          venue: String(venue || 'Meetup spot shared after approval').slice(0, 100).trim(),
          startsAt: Timestamp.fromDate(startsAtDate),
          timezone: 'Asia/Karachi',
          budgetPerPerson: Number(budget),
          maxParticipants: spots,
          privacy: privacy,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'scenes'), scenePayload);

        const newScene = formatFirestoreScene(docRef.id, {
          ...scenePayload,
          startsAt: startsAtDate,
          createdAt: new Date(),
          updatedAt: new Date()
        }, currentUser.uid);

        myHostedScenes.unshift(newScene);
        if (privacy === 'public') {
          firestoreScenes.unshift(newScene);
        }
        store.city = city;
        save();

        createSceneLoading = false;
        go('scene/' + docRef.id);
        toast('Scene published live to Cloud Firestore! ✳');
      } catch (err) {
        createSceneLoading = false;
        handleFirestoreError(err, 'createScene');
        render();
        toast('Failed to publish scene: ' + (err.message || 'Please check your connection and try again.'));
      }
    })();
    return;
  }else if(form.id==='chat-form'){
    const sceneId=form.dataset.id,text=String(new FormData(form).get('message')||'').trim();if(!text)return;
    if(!currentUser){
      openAuthPrompt('Sign in with Google to send messages in the group chat', { type: 'chat', sceneId, text });
      return;
    }
    if(!store.messages[sceneId])store.messages[sceneId]=[];
    store.messages[sceneId].push({from:'me',name:getActiveDisplayName(),text,time:new Date().toLocaleTimeString('en-PK',{hour:'numeric',minute:'2-digit'})});save();render();const input=$app.querySelector('.chat-compose input');input?.focus();
  }
});
window.addEventListener('hashchange',()=>{render();window.scrollTo({top:0,behavior:'instant'})});
render();

